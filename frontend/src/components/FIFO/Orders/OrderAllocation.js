import React, { useEffect, useState } from "react";
import { fetchOrderAllocations, getPickslipPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generatePickslipPDF } from "./pickslipPDF";
import { RefreshIcon, DocumentReportIcon, EyeIcon, XIcon, FilterIcon, DownloadIcon } from "@heroicons/react/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const OrderAllocation = () => {
    const [filteredAllocations, setFilteredAllocations] = useState([]);
    const [allocationFields, setAllocationFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const LOCAL_STORAGE_KEY = "completedOrdersFilteredDate";
        const [filterDate, setFilterDate] = useState(() => {
            return localStorage.getItem(LOCAL_STORAGE_KEY) || new Date().toISOString().split("T")[0];
        });
    // const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
    const [popupData, setPopupData] = useState(null);
    const [loadingPopup, setLoadingPopup] = useState(false);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [, setDownloadHover] = useState(false);
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [monthToExport, setMonthToExport] = useState("");
    const allocationsPerPage = 10;

    useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, filterDate);
}, [filterDate]);

    const fetchAllocations = async (date) => {
        try {
            const formattedDate = date ? new Date(date).toISOString().split("T")[0] : "";
            const data = await fetchOrderAllocations(formattedDate);
            if (data && data.length > 0) {
                setFilteredAllocations(data);
                setAllocationFields(Object.keys(data[0]));
            } else {
                setFilteredAllocations([]);
                setAllocationFields([]);
            }
        } catch (error) {
            toast.error("Error fetching allocations");
        }
    };

    useEffect(() => {
        fetchAllocations(filterDate);
    }, [filterDate]);

    const handleDownload = async (pickslipNumber) => {
        try {
            const data = await getPickslipPDF(pickslipNumber);
            if (data.error) {
                throw new Error(data.error);
            }
            generatePickslipPDF(pickslipNumber, data.items, data.customer_name, data.issued_at, data.issued_quantity);
        } catch (error) {
            toast.error("Error downloading PDF: " + error.message);
        }
    };

    const handleView = async (record) => {
        try {
            setLoadingPopup(true);
            const pickslipDetails = await getPickslipPDF(record.pickslip_number);
            setPopupData(pickslipDetails);
        } catch (error) {
            toast.error("Error fetching pickslip details.");
        } finally {
            setLoadingPopup(false);
        }
    };

    const closePopup = () => {
        setPopupData(null);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    };

    const handleDateChange = (e) => {
        setFilterDate(e.target.value);
        setCurrentPage(1);
    };

    const handleReset = () => {
        setSearchTerm("");
        setFilterDate(new Date().toISOString().split("T")[0]);
        setCurrentPage(1);
    };

    const handleRefresh = () => {
        fetchAllocations(filterDate);
    };

    // Filtered results for display
    const filteredResults = filteredAllocations.filter(allocation =>
        (!searchTerm || (allocation.pickslip_number && allocation.pickslip_number.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // For export: filter by month using issued_date
    const getMonthlyAllocations = (month) => {
        if (!month) return [];
        return filteredAllocations.filter(a => a.issued_date && a.issued_date.startsWith(month));
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "OrderAllocations");
        const fileName = `order_allocations_${monthToExport}.xlsx`;
        saveAs(new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), fileName);
        setShowMonthModal(false);
    };

    const indexOfLastAllocation = currentPage * allocationsPerPage;
    const indexOfFirstAllocation = indexOfLastAllocation - allocationsPerPage;
    const currentAllocations = filteredResults.slice(indexOfFirstAllocation, indexOfLastAllocation);
    const totalPages = Math.ceil(filteredResults.length / allocationsPerPage);

    return (
        <div className="p-4 pt-0">
            {/* <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Completed Pickslips</h2>
            </div> */}

            {/* Desktop/Tablet Filters */}
            <div className="hidden sm:flex items-center space-x-2 mt-1 mb-4 justify-end">
                <input
                    type="date"
                    value={filterDate}
                    onChange={handleDateChange}
                    className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                />
                <input
                    type="text"
                    placeholder="Search by Pickslip Number"
                    value={searchTerm}
                    onChange={handleSearch}
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
                </div>
            </div>

            {/* Mobile: Search + Filter Button Row */}
            <div className="sm:hidden flex items-center gap-2 mb-2 mt-2">
                <input
                    type="text"
                    placeholder="Search by Pickslip Number"
                    value={searchTerm}
                    onChange={handleSearch}
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
                {currentAllocations.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                {allocationFields.map((field) => (
                                    <th key={field} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                        {field.replace(/_/g, " ")}
                                    </th>
                                ))}
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentAllocations.map((allocation, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    {allocationFields.map((field) => (
                                        <td key={field} className="py-3 px-6 border-b border-gray-300 text-center">
                                            {allocation[field]}
                                        </td>
                                    ))}
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleDownload(allocation.pickslip_number)}
                                                className="flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-sm text-xs hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                            >
                                                <DocumentReportIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleView(allocation)}
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
                {currentAllocations.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    currentAllocations.map((allocation, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            {allocationFields.map((field) => (
                                <div key={field} className="flex justify-between text-sm mb-1">
                                    <strong className="capitalize">{field.replace(/_/g, " ")}:</strong>
                                    <span>{allocation[field]}</span>
                                </div>
                            ))}
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => handleDownload(allocation.pickslip_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-blue-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    <DocumentReportIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleView(allocation)}
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
                                value={filterDate}
                                onChange={handleDateChange}
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

            {/* Popup for Pickslip Details */}
            {popupData && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white w-4/5 h-4/5 rounded-lg shadow-lg p-4 sm:p-6 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Pickslip Details</h3>
                            <button onClick={closePopup} className="text-gray-500 hover:text-gray-700">
                                <XIcon className="h-6 w-6" />
                            </button>
                        </div>
                        {loadingPopup ? (
                            <p className="text-center text-gray-500">Loading...</p>
                        ) : (
                            <div>
                                <div className="mb-4">
                                    <p><strong>Pickslip Number:</strong> {popupData.pickslip_number}</p>
                                    <p><strong>Customer Name:</strong> {popupData.customer_name}</p>
                                    <p><strong>Invoice Number:</strong> {popupData.invoice_number}</p>
                                    <p><strong>Issued At:</strong> {popupData.issued_at}</p>
                                </div>
                                <div className="overflow-y-auto max-h-64">
                                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                        <thead className="bg-gray-100">
                                            <tr>
                                                <th className="py-2 px-4 border-b text-center">Batch Number</th>
                                                <th className="py-2 px-4 border-b text-center">Make</th>
                                                <th className="py-2 px-4 border-b text-center">Item Code</th>
                                                <th className="py-2 px-4 border-b text-center">Issued Quantity</th>
                                                <th className="py-2 px-4 border-b text-center">Bin Location</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {popupData.items.map((item, index) => (
                                                <tr key={index} className="border-b">
                                                    <td className="py-2 px-4 text-center">{item.batch_number}</td>
                                                    <td className="py-2 px-4 text-center">{item.make}</td>
                                                    <td className="py-2 px-4 text-center">{item.item_code}</td>
                                                    <td className="py-2 px-4 text-center">{item.issued_quantity}</td>
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

export default OrderAllocation;
