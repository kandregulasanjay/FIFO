import React, { useEffect, useState, useCallback } from 'react';
import { fetchPendingReceipts, updateReceiptDetails } from '../../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { RefreshIcon, FilterIcon, XIcon, DownloadIcon } from "@heroicons/react/outline";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const PendingReceipts = () => {
    const [receipts, setReceipts] = useState([]);
    const [filteredReceipts, setFilteredReceipts] = useState([]);
    const [receiptFields, setReceiptFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const LOCAL_STORAGE_KEY = "pendingReceiptsSelectedDate";
    const [selectedDate, setSelectedDate] = useState(() => {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || new Date().toISOString().split("T")[0];
    });
    const [searchTerm, setSearchTerm] = useState("");
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [, setDownloadHover] = useState(false);
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [monthToExport, setMonthToExport] = useState("");
    const receiptsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, selectedDate);
    }, [selectedDate]);

    useEffect(() => {
        fetchPendingReceiptsData(selectedDate);
    }, [selectedDate]);

    const fetchPendingReceiptsData = async (date) => {
        try {
            const formattedDate = date ? new Date(date).toISOString().split("T")[0] : "";
            const data = await fetchPendingReceipts(formattedDate);
            setReceipts(data);
            setFilteredReceipts(data);
            if (data.length > 0) {
                setReceiptFields(Object.keys(data[0]).filter(field => !["receipt_status", "receipt_type", "receipt_comment"].includes(field)));
            }
        } catch (error) {
            toast.error('Error fetching pending receipts');
        }
    };

    const filterReceipts = useCallback((date, term) => {
        let filtered = receipts;
        if (date) {
            filtered = filtered.filter((item) => item.receipt_date.startsWith(date));
        }
        if (term) {
            filtered = filtered.filter((item) =>
                item.receipt_number && item.receipt_number.toLowerCase().includes(term.toLowerCase())
            );
        }
        setFilteredReceipts(filtered);
        setCurrentPage(1);
    }, [receipts]);

    const handleReset = () => {
        setSelectedDate(new Date().toISOString().split("T")[0]);
        setSearchTerm(""); // Reset search term
        filterReceipts(new Date().toISOString().split("T")[0], "");
    };

    const handleRefresh = () => {
        fetchPendingReceiptsData(selectedDate);
    };

    const handleFieldChange = async (receiptNumber, field, value, saveImmediately = true) => {
        const updatedReceipts = receipts.map((receipt) =>
            receipt.receipt_number === receiptNumber
                ? { ...receipt, [field]: value || null }
                : receipt
        );
        setReceipts(updatedReceipts);

        if (saveImmediately) {
            try {
                const updatedReceipt = updatedReceipts.find((r) => r.receipt_number === receiptNumber);

                // Ensure default values for receipt_status and receipt_type
                const receiptStatus = updatedReceipt.receipt_status || "Release";
                const receiptType = updatedReceipt.receipt_type || "Release";

                const response = await updateReceiptDetails(
                    updatedReceipt.receipt_number,
                    receiptStatus,
                    receiptType,
                    updatedReceipt.receipt_comment || ""
                );

                if (response && response.success) {
                    toast.success("Receipt details updated successfully!");
                } else {
                    throw new Error(response?.message || "Failed to save receipt details");
                }
            } catch (error) {
                toast.error(error.message || "Error saving receipt details");
            }
        }
    };

    useEffect(() => {
        filterReceipts(selectedDate, searchTerm);
    }, [receipts, selectedDate, searchTerm, filterReceipts]);

    const indexOfLastReceipt = currentPage * receiptsPerPage;
    const indexOfFirstReceipt = indexOfLastReceipt - receiptsPerPage;
    const currentReceipts = filteredReceipts.slice(indexOfFirstReceipt, indexOfLastReceipt);
    const totalPages = Math.ceil(filteredReceipts.length / receiptsPerPage);

    // Filter receipts by selected month for export
    const getMonthlyReceipts = (month) => {
        if (!month) return [];
        return receipts.filter(r => r.receipt_date && r.receipt_date.startsWith(month));
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
        const exportData = getMonthlyReceipts(monthToExport);
        if (exportData.length === 0) {
            toast.info("No data to export for this month");
            setShowMonthModal(false);
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PendingReceipts");
        const fileName = `pending_receipts_${monthToExport}.xlsx`;
        saveAs(new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), fileName);
        setShowMonthModal(false);
    };

    return (
        <div className="p-4 pt-0">
            {/* Filters Row */}
            <div className="hidden sm:flex items-center space-x-2 mb-4 mt-1 justify-end">
                {/* Month Picker removed */}
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
                    <RefreshIcon className="h-5 w-5" />
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
                {/* Month Picker removed */}
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
                {currentReceipts.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                {receiptFields.map((field) => (
                                    <th key={field} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                        {field.replace(/_/g, " ")}
                                    </th>
                                ))}
                                <th className="py-4 px-6 text-center">Receipt Status</th>
                                <th className="py-4 px-6 text-center">Receipt Type</th>
                                <th className="py-4 px-6 text-center">Receipt Comment</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentReceipts.map((receipt, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    {receiptFields.map((field) => (
                                        <td key={field} className="py-3 px-6 border-b border-gray-300 text-center">
                                            {field === "receipt_number" ? (
                                                <span
                                                    onClick={() => {
                                                        if (!receipt.receipt_status) {
                                                            toast.error("Please select Receipt Status before proceeding.");
                                                        } else {
                                                            const encodedReceiptNumber = Buffer.from(receipt.receipt_number).toString('base64');
                                                            navigate(`/receipts/${encodedReceiptNumber}`);
                                                        }
                                                    }}
                                                    className="text-blue-500 hover:underline cursor-pointer"
                                                >
                                                    {receipt[field]}
                                                </span>
                                            ) : (
                                                receipt[field]
                                            )}
                                        </td>
                                    ))}
                                    <td className="py-3 px-6 text-center">
                                        <select
                                            value={receipt.receipt_status || ""}
                                            onChange={(e) =>
                                                handleFieldChange(receipt.receipt_number, "receipt_status", e.target.value)
                                            }
                                            className="p-2 border rounded-md"
                                        >
                                            <option value="" disabled>Select</option>
                                            <option value="Release">Release</option>
                                            <option value="Reserve">Reserve</option>
                                        </select>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <select
                                            value={receipt.receipt_type || ""}
                                            onChange={(e) =>
                                                handleFieldChange(receipt.receipt_number, "receipt_type", e.target.value)
                                            }
                                            className="p-2 border rounded-md"
                                        >
                                            <option value="" disabled>Select</option>
                                            <option value="Release">Release</option>
                                            <option value="Inspection">Inspection</option>
                                            <option value="Customer">Customer</option>
                                        </select>
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <input
                                            type="text"
                                            value={receipt.receipt_comment || ""}
                                            onChange={(e) =>
                                                handleFieldChange(receipt.receipt_number, "receipt_comment", e.target.value, false)
                                            }
                                            onBlur={(e) =>
                                                handleFieldChange(receipt.receipt_number, "receipt_comment", e.target.value)
                                            }
                                            className="p-2 border rounded-md"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {currentReceipts.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    currentReceipts.map((receipt, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            {receiptFields.map((field) => (
                                <div key={field} className="flex justify-between text-sm mb-1">
                                    <strong className="capitalize">{field.replace(/_/g, " ")}:</strong>
                                    {field === "receipt_number" ? (
                                        <span
                                            onClick={() => {
                                                if (!receipt.receipt_status) {
                                                    toast.error("Please select Receipt Status before proceeding.");
                                                } else {
                                                    const encodedReceiptNumber = encodeURIComponent(receipt.receipt_number)
                                                    navigate(`/receipts/${encodedReceiptNumber}`);
                                                }
                                            }}
                                            className="text-yellow-200 underline cursor-pointer"
                                        >
                                            {receipt[field]}
                                        </span>
                                    ) : (
                                        <span>{receipt[field]}</span>
                                    )}
                                </div>
                            ))}
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Status:</strong>
                                <select
                                    value={receipt.receipt_status || ""}
                                    onChange={(e) =>
                                        handleFieldChange(receipt.receipt_number, "receipt_status", e.target.value)
                                    }
                                    className="p-1 rounded text-gray-800"
                                >
                                    <option value="" disabled>Select</option>
                                    <option value="Release">Release</option>
                                    <option value="Reserve">Reserve</option>
                                </select>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Type:</strong>
                                <select
                                    value={receipt.receipt_type || ""}
                                    onChange={(e) =>
                                        handleFieldChange(receipt.receipt_number, "receipt_type", e.target.value)
                                    }
                                    className="p-1 rounded text-gray-800"
                                >
                                    <option value="" disabled>Select</option>
                                    <option value="Release">Release</option>
                                    <option value="Inspection">Inspection</option>
                                    <option value="Customer">Customer</option>
                                </select>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Receipt Comment:</strong>
                                <input
                                    type="text"
                                    value={receipt.receipt_comment || ""}
                                    onChange={(e) =>
                                        handleFieldChange(receipt.receipt_number, "receipt_comment", e.target.value, false)
                                    }
                                    onBlur={(e) =>
                                        handleFieldChange(receipt.receipt_number, "receipt_comment", e.target.value)
                                    }
                                    className="p-1 rounded text-gray-800"
                                />
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

            <ToastContainer />
        </div>
    );
};

export default PendingReceipts;
