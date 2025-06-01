import React, { useEffect, useState } from 'react';
import { fetchManualReports, fetchItemCodes } from '../../api/api';
import PivotTableUI from 'react-pivottable/PivotTableUI';
import 'react-pivottable/pivottable.css';

const ManualPage = () => {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pivotState, setPivotState] = useState({
        rows: ['receipt_number'], 
        cols: ['item_code'], 
        aggregatorName: 'Sum', 
        vals: ['quantity'], 
    });

    // Filter states
    const [receiptNumberFilter, setReceiptNumberFilter] = useState('');
    const [itemCodeFilter, setItemCodeFilter] = useState('');
    const [supplierNameFilter, setSupplierNameFilter] = useState('');
    const [receiptDateFilter, setReceiptDateFilter] = useState('');
    const [itemCodeOptions, setItemCodeOptions] = useState([]);

    useEffect(() => {
        const fetchItemCodeOptions = async () => {
            try {
                const itemCodes = await fetchItemCodes();
                setItemCodeOptions(itemCodes.map((item) => item.item_code));
            } catch (err) {
                console.error('Failed to fetch item codes:', err.message);
            }
        };

        fetchItemCodeOptions();
    }, []);

    // Fetch data with filters
    useEffect(() => {
        const fetchData = async () => {
            try {
                const filters = {
                    receiptNumber: receiptNumberFilter,
                    itemCode: itemCodeFilter,
                    supplierName: supplierNameFilter,
                    receiptDate: receiptDateFilter,
                };
                const reports = await fetchManualReports(filters);
                setData(reports);
                setFilteredData(reports);
                setLoading(false);
            } catch (err) {
                setError('Failed to fetch data');
                setLoading(false);
            }
        };

        fetchData();
    }, [receiptNumberFilter, itemCodeFilter, supplierNameFilter, receiptDateFilter]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h1>Manual Reports</h1>

            {/* Filters */}
            <div style={{ marginBottom: '20px' }}>
                <label>
                    Receipt Number:
                    <select
                        value={receiptNumberFilter}
                        onChange={(e) => setReceiptNumberFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        {Array.from(new Set(data.map((row) => row.receipt_number))).map(
                            (receiptNumber) => (
                                <option key={receiptNumber} value={receiptNumber}>
                                    {receiptNumber}
                                </option>
                            )
                        )}
                    </select>
                </label>

                <label>
                    Item Code:
                    <select
                        value={itemCodeFilter}
                        onChange={(e) => setItemCodeFilter(e.target.value)}
                    >
                        <option value="">All</option>
                        {itemCodeOptions.map((itemCode) => (
                            <option key={itemCode} value={itemCode}>
                                {itemCode}
                            </option>
                        ))}
                    </select>
                </label>

                <label>
                    Supplier Name:
                    <input
                        type="text"
                        value={supplierNameFilter}
                        onChange={(e) => setSupplierNameFilter(e.target.value)}
                        placeholder="Search by supplier name"
                    />
                </label>

                <label>
                    Receipt Date:
                    <input
                        type="date"
                        value={receiptDateFilter}
                        onChange={(e) => setReceiptDateFilter(e.target.value)}
                    />
                </label>
            </div>

            {/* Pivot Table */}
            <PivotTableUI
                data={filteredData}
                onChange={(s) => setPivotState(s)}
                {...pivotState}
            />
        </div>
    );
};

export default ManualPage;