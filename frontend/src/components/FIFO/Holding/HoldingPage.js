import React, { useEffect, useState } from "react";
import { fetchHoldingData, fetchBinMasterData, getLatestHoldingPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {  XIcon, RefreshIcon, FilterIcon, DocumentReportIcon, EyeIcon } from "@heroicons/react/outline";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { generateHoldingPDF } from "./HoldingPDF";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const HoldingPage = () => {
    const [holdingData, setHoldingData] = useState([]);
    const [, setBinMasterData] = useState({ sections: [], sub_sections: [], bins: [] });
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;
    const [invoiceFilter, setInvoiceFilter] = useState(null);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [popupData, setPopupData] = useState(null);
    const [loadingPopup, setLoadingPopup] = useState(false);
    const [, setDownloadHover] = useState(false);

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

    const navigate = useNavigate();

    useEffect(() => {
        fetchHoldingDataFromAPI();
        fetchBinMaster();
    }, []);

    const fetchHoldingDataFromAPI = async () => {
        try {
            const data = await fetchHoldingData();
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
        fetchHoldingDataFromAPI();
        fetchBinMaster();
    };

    const handleReset = () => {
        setInvoiceFilter(null);
        setCurrentPage(1);
    };

    // Download handler
    const handleDownload = async (invoice_number) => {
        try {
            const data = await getLatestHoldingPDF(invoice_number);
            if (!data || !data.items || data.items.length === 0) {
                toast.error("No data available for this invoice.");
                return;
            }
            generateHoldingPDF(
                data.items[0]?.pickslip_number || "N/A",
                data.items,
                data.items[0]?.customer_name || "",
                "all",
                invoice_number
            );
        } catch (error) {
            toast.error("Error downloading holding PDF.");
        }
    };

    // View handler (shows popup)
    const handleView = async (invoice_number) => {
        try {
            setLoadingPopup(true);
            const data = await getLatestHoldingPDF(invoice_number);
            setPopupData(data);
        } catch (error) {
            toast.error("Error fetching holding details.");
        } finally {
            setLoadingPopup(false);
        }
    };

    const closePopup = () => setPopupData(null);

    const handleDownloadExcel = () => {
        const exportData = filteredHoldingData.length > 0 ? filteredHoldingData : holdingData;
        if (exportData.length === 0) {
            toast.info("No data to export");
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Holding");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileName = `holding_${new Date().toISOString().slice(0,10)}.xlsx`;
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
    };

    if (!holdingData || !holdingData.length) return <p className="text-center text-lg font-semibold">There is no holding data</p>;

    return (
        <div className="p-4 pt-0 max-w-full overflow-x-auto">
            {/* Desktop/Tablet Filters */}
            <div className="hidden sm:flex items-center space-x-2 mb-4 mt-1 justify-end">
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
                <div
                    className="relative"
                    onMouseEnter={() => setDownloadHover(true)}
                    onMouseLeave={() => setDownloadHover(false)}
                >
                    <button
                        onClick={handleDownloadExcel}
                        className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "8px"
                        }}
                        title="Export Excel"
                    >
                        <DocumentReportIcon className="h-6 w-6 text-blue-600" />
                    </button>
                </div>
            </div>

            {/* Mobile: Search + Filter Button Row */}
            <div className="sm:hidden flex items-center gap-2 mb-2 mt-2">
                <Select
                    options={invoiceOptions}
                    value={invoiceFilter}
                    onChange={setInvoiceFilter}
                    placeholder="Search by Invoice Number"
                    isClearable
                    className="flex-1"
                />
                <button
                    onClick={() => setShowFilterPopup(true)}
                    className="p-2 rounded-md shadow-md bg-white border-2"
                    style={{
                        borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                        borderRadius: "8px"
                    }}
                >
                    <FilterIcon className="h-6 w-6 text-blue-600" />
                </button>
                <div
                    className="relative"
                    onMouseEnter={() => setDownloadHover(true)}
                    onMouseLeave={() => setDownloadHover(false)}
                >
                    <button
                        onClick={handleDownloadExcel}
                        className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "8px"
                        }}
                        title="Download Excel"
                    >
                        <DocumentReportIcon className="h-6 w-6 text-blue-600" />
                    </button>                    
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                {currentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                <th className="py-4 px-6 text-center">Pickslip Number</th>
                                <th className="py-4 px-6 text-center">Invoice Number</th>
                                <th className="py-4 px-6 text-center"># Line IDs</th>
                                <th className="py-4 px-6 text-center"># Items</th>
                                <th className="py-4 px-6 text-center">Total Qty</th>
                                <th className="py-4 px-6 text-center">Order Date</th>
                                <th className="py-4 px-6 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((record, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    <td className="py-3 px-6 text-center">{record.pickslip_number}</td>
                                    <td
                                        className="py-3 px-6 text-center text-blue-600 cursor-pointer underline"
                                        onClick={() => navigate(`/holding/${record.invoice_number}`)}
                                    >
                                        {record.invoice_number}
                                    </td>
                                    <td className="py-3 px-6 text-center">{record.num_line_id}</td>
                                    <td className="py-3 px-6 text-center">{record.num_of_items}</td>
                                    <td className="py-3 px-6 text-center">{record.qty}</td>
                                    <td className="py-3 px-6 text-center">{record.order_date}</td>
                                    <td className="py-3 px-6 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleView(record.invoice_number)}
                                                className="flex items-center justify-center px-3 py-1 bg-transparent border-2 border-gradient-to-r from-green-500 to-blue-500 text-green-600 font-semibold rounded-md shadow-sm text-xs hover:from-green-600 hover:to-blue-600 hover:text-green-700 transition"
                                                title="View"
                                            >
                                                <EyeIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDownload(record.invoice_number)}
                                                className="flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-sm text-xs hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                                title="Download"
                                            >
                                                <DocumentReportIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {currentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    currentRows.map((record, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Pickslip Number:</strong>
                                <span>{record.pickslip_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Invoice Number:</strong>
                                <span
                                    className="text-blue-200 underline cursor-pointer"
                                    onClick={() => navigate(`/holding/${record.invoice_number}`)}
                                >
                                    {record.invoice_number}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong># Line IDs:</strong>
                                <span>{record.num_line_id}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong># Items:</strong>
                                <span>{record.num_of_items}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Total Qty:</strong>
                                <span>{record.qty}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Order Date:</strong>
                                <span>{record.order_date}</span>
                            </div>
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => handleView(record.invoice_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-green-600 font-semibold rounded-md shadow-sm text-xs"
                                    title="View"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDownload(record.invoice_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-blue-600 font-semibold rounded-md shadow-sm text-xs"
                                    title="Download"
                                >
                                    <DocumentReportIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-4">
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
            )}

            {/* Filter Popup for Mobile */}
            {showFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Filters</h3>
                        <div className="flex flex-col gap-3">
                            <Select
                                options={invoiceOptions}
                                value={invoiceFilter}
                                onChange={setInvoiceFilter}
                                placeholder="Search by Invoice Number"
                                isClearable
                                className="w-full"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowFilterPopup(false)}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup for View */}
            {popupData && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-4/5 h-4/5 rounded-lg shadow-lg p-4 sm:p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Holding Details</h3>
                            <button onClick={closePopup} className="text-gray-500 hover:text-gray-700">
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        {loadingPopup ? (
                            <p className="text-center text-gray-500">Loading...</p>
                        ) : (
                            <div>
                                <div className="mb-4">
                                    <p><strong>Invoice Number:</strong> {popupData.invoice_number}</p>
                                    <p><strong>Created At:</strong> {popupData.created_at ? new Date(popupData.created_at).toLocaleString() : ""}</p>
                                </div>
                                <div className="overflow-y-auto max-h-64">
                                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-2 px-4 border-b text-center">Pickslip Number</th>
                                                <th className="py-2 px-4 border-b text-center">Make</th>
                                                <th className="py-2 px-4 border-b text-center">Item Code</th>
                                                <th className="py-2 px-4 border-b text-center">Bin Location</th>
                                                <th className="py-2 px-4 border-b text-center">Ordered Qty</th>
                                                <th className="py-2 px-4 border-b text-center">Allocated Qty</th>
                                                <th className="py-2 px-4 border-b text-center">Remaining Qty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {popupData.items.map((item, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="py-2 px-4 text-center">{item.pickslip_number}</td>
                                                    <td className="py-2 px-4 text-center">{item.make}</td>
                                                    <td className="py-2 px-4 text-center">{item.item_code}</td>
                                                    <td className="py-2 px-4 text-center">{item.new_bin_location}</td>
                                                    <td className="py-2 px-4 text-center">{item.ordered_qty}</td>
                                                    <td className="py-2 px-4 text-center">{item.new_allocated_qty}</td>
                                                    <td className="py-2 px-4 text-center">{item.remaining_qty}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default HoldingPage;
