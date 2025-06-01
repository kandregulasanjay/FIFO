const sql = require("mssql");
const { connectToDatabase } = require("../db");

async function transferData(sourcedbConfig, targetdbConfig, sourceQuery, stagingTable, targetTable, idColumn) {
    let sourcePool, targetPool, transaction;

    try {
        sourcePool = await connectToDatabase(sourcedbConfig);
        targetPool = await connectToDatabase(targetdbConfig);

        if (!sourcePool.connected) throw new Error("❌ Source database connection failed.");
        if (!targetPool.connected) throw new Error("❌ Target database connection failed.");

        console.log(`✅ Connected to SourceDB: ${sourcedbConfig.database} (${sourcedbConfig.server})`);
        console.log(`✅ Connected to TargetDB: ${targetdbConfig.database} (${targetdbConfig.server})`);

        transaction = targetPool.transaction();
        await transaction.begin();
        console.log("✅ Transaction started.");

        const maxIdResult = await targetPool.request().query(`SELECT MAX(${idColumn}) AS maxId FROM dbo.${stagingTable}`);
        let maxId = 0; 

        if (maxIdResult.recordset.length > 0 && maxIdResult.recordset[0].maxId !== null) {
            maxId = maxIdResult.recordset[0].maxId;
        }

        console.log(`🟢 Last transferred max ${idColumn}: ${maxId}`);

        const sourceDataResult = await sourcePool.request()
            .input('maxId', sql.Int, maxId)
            .query(sourceQuery);

        if (sourceDataResult.recordset.length === 0) {
            console.log(`⚠️ No new data to transfer.`);
            await transaction.rollback();
            return { success: false, message: "No new data found." };
        }

        console.log(`🔄 Fetched ${sourceDataResult.recordset.length} new records.`);

        await transaction.request().query(`DELETE FROM ${targetdbConfig.database}.dbo.${stagingTable}`);
        console.log(`🗑️ Cleared staging table: ${stagingTable}`);

        const columns = Object.keys(sourceDataResult.recordset[0]);

        for (const row of sourceDataResult.recordset) {
            const insertRequest = transaction.request();
            const insertQuery = `INSERT INTO ${targetdbConfig.database}.dbo.${stagingTable} (${columns.map(col => `[${col}]`).join(", ")}) 
            VALUES (${columns.map(col => `@${col}`).join(", ")})`;

            columns.forEach(col => insertRequest.input(col, row[col]));
            await insertRequest.query(insertQuery);
        }

        console.log(`✅ Inserted ${sourceDataResult.recordset.length} records into staging table: ${stagingTable}`);

        const mergeQuery = `
            MERGE ${targetdbConfig.database}.dbo.${targetTable} AS target
            USING ${targetdbConfig.database}.dbo.${stagingTable} AS source
            ON target.${idColumn} = source.${idColumn}
            WHEN NOT MATCHED THEN 
            INSERT (${columns.map(col => `[${col}]`).join(", ")}) 
            VALUES (${columns.map(col => `source.[${col}]`).join(", ")});
        `;

        console.log("Executing Merge Query:", mergeQuery);
        await transaction.request().query(mergeQuery);
        console.log(`✅ Merged staging data into ${targetTable}, avoiding duplicates.`);

        await transaction.commit();
        console.log("✅ Data transfer completed successfully.");

        return { success: true, message: "Data transferred successfully" };
    } catch (err) {
        console.error("❌ Error during data transfer:", err);
        if (transaction) await transaction.rollback();
        return { success: false, message: err.message };
    } finally {
        if (sourcePool) await sourcePool.close();
        if (targetPool) await targetPool.close();
    }
}

module.exports = transferData;
