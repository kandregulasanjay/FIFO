import React, { useEffect, useState, useCallback } from "react";
import { fetchReceiptAllocations, getReceiptsPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateReceiptPDF } from "./ReceiptPDF";
import { RefreshIcon, DocumentReportIcon, XIcon, EyeIcon, FilterIcon, DownloadIcon } from "@heroicons/react/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const ReceiptAllocation = () => {
    const [allocations, setAllocations] = useState([]);
    const [filteredAllocations, setFilteredAllocations] = useState([]);
    const [columns, setColumns] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const LOCAL_STORAGE_KEY = "completedReceiptsSelectedDate";
    const [selectedDate, setSelectedDate] = useState(() => {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || new Date().toISOString().split("T")[0];
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [popupData, setPopupData] = useState(null);
    const [loadingPopup, setLoadingPopup] = useState(false);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [, setDownloadHover] = useState(false);
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [monthToExport, setMonthToExport] = useState("");
    const rowsPerPage = 10;

    useEffect(() => {
        localStorage.setItem("completedReceiptsSelectedDate", selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        fetchAllocations(selectedDate);
    }, [selectedDate]);

    const fetchAllocations = async (date) => {
        try {
            const formattedDate = date ? new Date(date).toISOString().split("T")[0] : "";
            const data = await fetchReceiptAllocations(formattedDate);
            setAllocations(data);
            setFilteredAllocations(data);
            if (data.length > 0) {
                setColumns(Object.keys(data[0]));
            }
        } catch (error) {
            toast.error("Error fetching allocations");
        }
    };

    const filterAllocations = useCallback((date, term) => {
        let filtered = allocations;
        if (date) {
            filtered = filtered.filter((item) => item.allocation_date && item.allocation_date.startsWith(date));
        }
        if (term) {
            filtered = filtered.filter((item) =>
                item.receipt_number && item.receipt_number.toLowerCase().includes(term.toLowerCase())
            );
        }
        setFilteredAllocations(filtered);
        setCurrentPage(1);
    }, [allocations]);

    const handleReset = () => {
        setSearchTerm("");
        setSelectedDate(new Date().toISOString().split("T")[0]);
        filterAllocations(new Date().toISOString().split("T")[0], "");
    };

    const handleRefresh = () => {
        fetchAllocations(selectedDate);
    };

    useEffect(() => {
        filterAllocations(selectedDate, searchTerm);
    }, [allocations, selectedDate, searchTerm, filterAllocations]);

    const handleDownload = async (receiptNumber) => {
        try {
            const receiptDetails = await getReceiptsPDF(receiptNumber);
            if (!receiptDetails || !receiptDetails.items || receiptDetails.items.length === 0) {
                toast.error("No receipt details found to generate PDF.");
                return;
            }
            generateReceiptPDF(receiptNumber, receiptDetails);
        } catch (error) {
            toast.error("Error fetching receipt details.");
        }
    };

    const handleView = async (record) => {
        try {
            setLoadingPopup(true);
            const receiptDetails = await getReceiptsPDF(record.receipt_number);
            setPopupData(receiptDetails);
        } catch (error) {
            toast.error("Error fetching receipt details.");
        } finally {
            setLoadingPopup(false);
        }
    };

    const closePopup = () => {
        setPopupData(null);
    };

    // Filter allocations by selected month for export
    const getMonthlyAllocations = (month) => {
        if (!month) return [];
        return allocations.filter(r => r.allocation_date && r.allocation_date.startsWith(month));
    };

    // Export to Excel for selected month
    const handleDownloadExcel = () => {
        setShowMonthModal(true);
    };

    const handleExportMonth = () => {
        if (!monthToExport) {
            toast.info("Please select a month to export");
            return;
        }
        const exportData = getMonthlyAllocations(monthToExport);
        if (exportData.length === 0) {
            toast.info("No data to export for this month");
            setShowMonthModal(false);
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "ReceiptAllocations");
        const fileName = `receipt_allocations_${monthToExport}.xlsx`;
        saveAs(new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), fileName);
        setShowMonthModal(false);
    };

    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredAllocations.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredAllocations.length / rowsPerPage);

    return (
        <div className="p-4 pt-0">
            {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Completed Receipts</h2>
            </div> */}

            {/* Desktop/Tablet Filters */}
            <div className="hidden sm:flex items-center space-x-2 mb-4 mt-1 justify-end">
                <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                />
                <input
                    type="text"
                    placeholder="Receipt Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
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
                    <RefreshIcon className="w-5 h-5" />
                </button>
                {/* Download Button with filter styling and hover "Export" */}
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
                        <DownloadIcon className="h-6 w-6 text-blue-600" />
                    </button>
                    {/* {downloadHover && (
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                            Export
                        </span>
                    )} */}
                </div>
            </div>

            {/* Mobile: Search + Filter Button Row */}
            <div className="sm:hidden flex items-center gap-2 mb-2 mt-2">
                <input
                    type="text"
                    placeholder="Receipt Number"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
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
                        title="Export Excel"
                    >
                        <DownloadIcon className="h-6 w-6 text-blue-600" />
                    </button>
                    {/* {downloadHover && (
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                            Export
                        </span>
                    )} */}
                </div>
            </div>

            {/* Month Selection Modal */}
            {showMonthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowMonthModal(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Select Month to Export</h3>
                        <input
                            type="month"
                            value={monthToExport}
                            onChange={e => setMonthToExport(e.target.value)}
                            className="w-full p-2 border rounded-md shadow-sm bg-gray-50 text-sm mb-4"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowMonthModal(false)}
                                className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleExportMonth}
                                className="flex-1 px-3 py-1 bg-green-600 text-sm text-white rounded-md hover:bg-green-700 transition"
                            >
                                Export
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                {currentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                {columns.map((col, index) => (
                                    <th key={index} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                        {col.replace(/_/g, " ")}
                                    </th>
                                ))}
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                    Reports
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="border-b hover:bg-gray-50 transition-all">
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex} className="py-3 px-6 border-b border-gray-300 text-center">
                                            {row[col]}
                                        </td>
                                    ))}
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleDownload(row.receipt_number)}
                                                className="flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-sm text-xs hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                            >
                                                <DocumentReportIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleView(row)}
                                                className="flex items-center justify-center px-3 py-1 bg-transparent border-2 border-gradient-to-r from-green-500 to-blue-500 text-purple-600 font-semibold rounded-md shadow-sm text-xs hover:from-green-600 hover:to-blue-600 hover:text-green-700 transition"
                                            >
                                                <EyeIcon className="w-4 h-4" />
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
                    currentRows.map((row, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            {columns.map((col) => (
                                <div key={col} className="flex justify-between text-sm mb-1">
                                    <strong className="capitalize">{col.replace(/_/g, " ")}:</strong>
                                    <span>{row[col]}</span>
                                </div>
                            ))}
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => handleDownload(row.receipt_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-blue-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    <DocumentReportIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleView(row)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-green-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Filter Popup for Mobile */}
            {showFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "16px"
                        }}
                    >
                        {/* Close Icon */}
                        <button
                            onClick={() => setShowFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Filters</h3>
                        <div className="flex flex-col gap-3">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={handleReset}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => { setShowFilterPopup(false); handleRefresh(); }}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Section */}
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

            {/* Popup Page */}
            {popupData && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-4/5 h-4/5 rounded-lg shadow-lg p-4 sm:p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Allocation Details</h3>
                            <button onClick={closePopup} className="text-gray-500 hover:text-gray-700">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        {loadingPopup ? (
                            <p className="text-center text-gray-500">Loading...</p>
                        ) : (
                            <div>
                                <div className="mb-4">
                                    <p><strong>Receipt Number:</strong> {popupData.receipt_number}</p>
                                    <p><strong>Supplier Name:</strong> {popupData.supplier_name}</p>
                                    <p><strong>Allocation Date:</strong> {new Date(popupData.allocation_date).toLocaleString()}</p>
                                </div>
                                <div className="overflow-y-auto max-h-64">
                                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-2 px-4 border-b text-center">Batch Number</th>
                                                <th className="py-2 px-4 border-b text-center">Make</th>
                                                <th className="py-2 px-4 border-b text-center">Item Code</th>
                                                <th className="py-2 px-4 border-b text-center">Quantity</th>
                                                <th className="py-2 px-4 border-b text-center">Bin Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {popupData.items.map((item, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="py-2 px-4 text-center">{item.batch_number}</td>
                                                    <td className="py-2 px-4 text-center">{item.make}</td>
                                                    <td className="py-2 px-4 text-center">{item.item_code}</td>
                                                    <td className="py-2 px-4 text-center">{item.allocated_quantity}</td>
                                                    <td className="py-2 px-4 text-center">{item.bin_location}</td>
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

            <ToastContainer />
        </div>
    );
};

export default ReceiptAllocation;
