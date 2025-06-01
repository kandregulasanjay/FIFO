const schedule = require("node-schedule");
const transferData = require("./dataTransferController");
const { sourcedb, targetdb } = require("../db");

async function scheduleETLProcesses() {
    const sourceQueries = [
        { query: "SELECT * FROM order_master_source WHERE order_id > @maxId", stagingTable: "order_master_staging", targetTable: "order_master", idColumn: "order_id" },
        //{ query: "SELECT * FROM receipt_master_source where receipt_id > @maxId", stagingTable: "receipt_master_staging", targetTable: "receipt_master", idColumn: "receipt_id" }
    ];

    async function runETL(queryConfig) {
        try {
            console.log(`🚀 Starting ETL for table: ${queryConfig.targetTable} at ${new Date().toLocaleTimeString()}`);
            await transferData(sourcedb, targetdb, queryConfig.query, queryConfig.stagingTable, queryConfig.targetTable, queryConfig.idColumn);
            console.log(`✅ Completed ETL for table: ${queryConfig.targetTable} at ${new Date().toLocaleTimeString()}`);
        } catch (err) {
            console.error(`❌ ETL process failed for table ${queryConfig.targetTable}: ${err.message}`);
        }
    }

    try {
        if (sourceQueries.length === 0) {
            console.warn("⚠️ No ETL queries configured. Task will not be scheduled.");
            return;
        }
        schedule.scheduleJob("*/1 * * * *", async () => {
            console.log(`🔄 ETL processes started at ${new Date().toLocaleTimeString()}`);
            await Promise.all(sourceQueries.map(runETL));
            console.log(`✅ All ETL processes completed at ${new Date().toLocaleTimeString()}`);
        });
        console.log("⏳ ETL Task scheduled to run every minute.");
    } catch (err) {
        console.error("❌ Error scheduling ETL:", err.message);
    }
}

module.exports = { scheduleETLProcesses };


// const schedule = require("node-schedule");
// const transferData = require("./dataTransferController");
// const { sourcedb, targetdb } = require("../db");

// async function scheduleETLProcesses() {
//     const frequentQuery = {
//         query: "SELECT * FROM order_master_source WHERE order_id > @maxId",
//         stagingTable: "order_master_staging",
//         targetTable: "order_master",
//         idColumn: "order_id"
//     };

//     const infrequentQuery = {
//         query: "SELECT * FROM receipt_master_source WHERE receipt_id > @maxId",
//         stagingTable: "receipt_master_staging",
//         targetTable: "receipt_master",
//         idColumn: "receipt_id"
//     };

//     async function runETL(queryConfig) {
//         try {
//             console.log(`🚀 Starting ETL for table: ${queryConfig.targetTable} at ${new Date().toLocaleTimeString()}`);
//             await transferData(sourcedb, targetdb, queryConfig.query, queryConfig.stagingTable, queryConfig.targetTable, queryConfig.idColumn);
//             console.log(`✅ Completed ETL for table: ${queryConfig.targetTable} at ${new Date().toLocaleTimeString()}`);
//         } catch (err) {
//             console.error(`❌ ETL process failed for table ${queryConfig.targetTable}: ${err.message}`);
//         }
//     }

//     try {
//         // Run every 5 seconds
//         schedule.scheduleJob("*/5 * * * * *", async () => {
//             await runETL(frequentQuery);
//         });
//         console.log("⏳ Frequent ETL Task scheduled to run every 5 seconds.");

//         // Run every 5 hours (at 0:00, 5:00, 10:00, 15:00, 20:00)
//         schedule.scheduleJob("0 0 */5 * * *", async () => {
//             await runETL(infrequentQuery);
//         });
//         console.log("⏳ Infrequent ETL Task scheduled to run every 5 hours.");

//     } catch (err) {
//         console.error("❌ Error scheduling ETL:", err.message);
//     }
// }

// module.exports = { scheduleETLProcesses };

