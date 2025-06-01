import React, { useEffect, useState } from "react";
import { fetchCompletedHoldingData, fetchBinMasterData, getHoldingPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RefreshIcon } from "@heroicons/react/outline";
import Select from "react-select";
import { generateHoldingPDF } from "./HoldingPDF";

const CompletedHoldingPage = () => {
    const [holdingData, setHoldingData] = useState([]);
    const [, setBinMasterData] = useState({ sections: [], sub_sections: [], bins: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [invoiceFilter, setInvoiceFilter] = useState(null);

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;

    // Generate unique dropdown options for invoice_number
    const invoiceOptions = Array.from(
        new Set(holdingData.map(record => record.invoice_number))
    ).map(invoice_number => ({
        value: invoice_number,
        label: invoice_number
    }));

    // Filter holding data based on selected invoice_number
    const filteredHoldingData = holdingData.filter(record =>
        invoiceFilter ? record.invoice_number === invoiceFilter.value : true
    );

    const currentRows = filteredHoldingData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredHoldingData.length / rowsPerPage);

    useEffect(() => {
        fetchCompletedHoldingDataFromAPI();
        fetchBinMaster();
    }, []);

    const fetchCompletedHoldingDataFromAPI = async () => {
        try {
            const data = await fetchCompletedHoldingData();
            setHoldingData(data);
        } catch (error) {
            toast.error("Error fetching holding data");
        }
    };

    const fetchBinMaster = async () => {
        try {
            const data = await fetchBinMasterData();
            setBinMasterData(data);
        } catch (error) {
            toast.error("Error fetching bin master data");
        }
    };

    const handleRefresh = () => {
        fetchCompletedHoldingDataFromAPI();
        fetchBinMaster();
    };

    const handleReset = () => {
        setInvoiceFilter(null);
        setCurrentPage(1);
    };

    const handleDownload = async (pickslipNumber) => {
        try {
            const data = await getHoldingPDF(pickslipNumber);

            if (!data || !data.items || data.items.length === 0) {
                toast.error("No data available for this pickslip.");
                return;
            }

            generateHoldingPDF(
                pickslipNumber,
                data.items,
                data.customer_name,
                new Date(data.issued_at).toISOString(),
                "all",
                data.invoice_number
            );
        } catch (error) {
            toast.error("Error downloading holding PDF.");
        }
    };

    if (!holdingData || !holdingData.length) return <p className="text-center text-lg font-semibold">There is no holding data</p>;

    return (
        <div className="p-4 max-w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Completed Holding Page</h2>
                <div className="flex items-center space-x-2">
                    <Select
                        options={invoiceOptions}
                        value={invoiceFilter}
                        onChange={setInvoiceFilter}
                        placeholder="Search by Invoice Number"
                        isClearable
                        className="w-64"
                    />
                    <button
                        onClick={handleReset}
                        className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                    <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                        <tr>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Pickslip Number</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Line Id</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Customer Name</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Invoice Number</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Bin Location</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Make</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Item Code</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Batch Number</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Ordered Quantity</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Issued Quantity</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Remaining Quantity</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Reports</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentRows.map((record, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_number}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_line_id}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.customer_name}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.invoice_number}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.bin_location}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.make}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.item_code}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.batch_number}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.ordered_qty}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.issued_qty}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">{record.remaining_qty}</td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center">
                                    <button
                                        onClick={() => handleDownload(record.pickslip_number)}
                                        className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-sm text-xs border border-blue-600 hover:border-purple-700 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                        title="Download All"
                                    >
                                        Download
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex justify-center mt-4" style={{ display: totalPages > 1 ? 'flex' : 'none' }}>
                <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                >
                    Previous
                </button>
                <span className="px-4 py-2 mx-1">{currentPage} of {totalPages}</span>
                <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                >
                    Next
                </button>
            </div>

            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default CompletedHoldingPage;
