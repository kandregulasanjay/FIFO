import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPendingOrders, updateOrderStatus, fetchPickslipReportData } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { RefreshIcon, FilterIcon, XIcon, DownloadIcon } from "@heroicons/react/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const PendingOrders = () => {
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [orderFields, setOrderFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState("");
    const LOCAL_STORAGE_KEY = "PendingOrdersFilteredDate";
    const [filterDate, setFilterDate] = useState(() => {
        return localStorage.getItem(LOCAL_STORAGE_KEY) || new Date().toISOString().split("T")[0];
    });
    // const [filterDate, setFilterDate] = useState(new Date().toISOString().split("T")[0]);
    const [showFilterPopup, setShowFilterPopup] = useState(false);
    const [, setDownloadHover] = useState(false);
    const [showMonthModal, setShowMonthModal] = useState(false);
    const [monthToExport, setMonthToExport] = useState("");
    const ordersPerPage = 10;
    const navigate = useNavigate();

    const [pickslipReportData, setPickslipReportData] = useState([]);
    const [loadingPickslipReport, setLoadingPickslipReport] = useState(false);
    const [pickslipReportError, setPickslipReportError] = useState(null);

    useEffect(() => {
        setLoadingPickslipReport(true);
        fetchPickslipReportData()
            .then(data => setPickslipReportData(data))
            .catch(err => setPickslipReportError(err.message))
            .finally(() => setLoadingPickslipReport(false));
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_STORAGE_KEY, filterDate);
    }, [filterDate]);

    const fetchOrders = async (date) => {
        try {
            const formattedDate = date ? new Date(date).toISOString().split("T")[0] : "";
            const data = await fetchPendingOrders(formattedDate);
            setFilteredOrders(data);
            if (data.length > 0) {
                setOrderFields(Object.keys(data[0]));
            }
        } catch (error) {
            toast.error("Error fetching pending orders");
        }
    };

    useEffect(() => {
        fetchOrders(filterDate);
    }, [filterDate]);

    const handleStatusChange = async (e, pickslipNumber) => {
        const newStatus = e.target.value;
        try {
            await updateOrderStatus(pickslipNumber, newStatus);
            toast.success("Order status updated successfully");
            setFilteredOrders((prevOrders) =>
                prevOrders.map((order) =>
                    order.pickslip_number === pickslipNumber ? { ...order, pickslip_status: newStatus } : order
                )
            );
        } catch (error) {
            toast.error("Error updating order status");
        }
    };

    const handlePickslipClick = (pickslipNumber) => {
        navigate(`/pickslip/${pickslipNumber}`);
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
        fetchOrders(filterDate);
    };

    // Filtered results for display
    const filteredResults = filteredOrders.filter(order =>
    ((order.pickslip_number && order.pickslip_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.invoice_number && order.invoice_number.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    // For export: filter by month using order_date
    const getMonthlyOrders = (month) => {
        if (!month) return [];
        return filteredOrders.filter(order => order.order_date && order.order_date.startsWith(month));
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
        const exportData = getMonthlyOrders(monthToExport);
        if (exportData.length === 0) {
            toast.info("No data to export for this month");
            setShowMonthModal(false);
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "PendingOrders");
        const fileName = `pending_orders_${monthToExport}.xlsx`;
        saveAs(new Blob([XLSX.write(workbook, { bookType: "xlsx", type: "array" })], { type: "application/octet-stream" }), fileName);
        setShowMonthModal(false);
    };

    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = filteredResults.slice(indexOfFirstOrder, indexOfLastOrder);
    const totalPages = Math.ceil(filteredResults.length / ordersPerPage);

    return (
        <div className="p-4 pt-0">

            {/* Pickslip Report Table - Only show if records exist */}
            {pickslipReportData.length > 0 && (
                <>
                    {/* Desktop */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md mb-8">
                        <h2 className="text-xl font-semibold mb-4 px-6 pt-6">Pickslip Report</h2>
                        <table className="min-w-full text-sm border border-gray-300 rounded-lg">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    {Object.keys(pickslipReportData[0]).map((field) => (
                                        <th key={field} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                            {field.replace(/_/g, " ")}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pickslipReportData.map((row, idx) => (
                                    <tr key={idx} className="border-b" style={{ color: 'red' }}>
                                        {Object.keys(row).map((field) => (
                                            <td key={field} className="py-3 px-6 border-b border-gray-300 text-center">
                                                {row[field]}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile */}
                    <div className="md:hidden grid grid-cols-1 gap-4 mb-8">
                        <h2 className="text-lg font-semibold mb-2 px-2">Pickslip Report</h2>
                        {pickslipReportData.map((row, idx) => (
                            <div key={idx} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg" style={{ color: 'red' }}>
                                {Object.keys(row).map((field) => (
                                    <div key={field} className="flex justify-between text-sm mb-1">
                                        <strong className="capitalize text-white">{field.replace(/_/g, " ")}:</strong>
                                        <span>{row[field]}</span>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Desktop/Tablet Filters */}
            <div className="hidden sm:flex items-center space-x-2 mt-2 mb-4 justify-end">

                <input
                    type="date"
                    value={filterDate}
                    onChange={handleDateChange}
                    className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                />
                <input
                    type="text"
                    placeholder="Pickslip or Invoice"
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

            {/* Mobile: Search input always visible + Filter button for date */}
            <div className="sm:hidden flex items-center gap-2 mb-2 mt-2">
                <input
                    type="text"
                    placeholder="Pickslip or Invoice"
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

            {/* Desktop Table and Mobile Cards */}
            {filteredResults.length === 0 ? (
                <div className="md:hidden py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                    No data found
                </div>
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                        {currentOrders.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">No data found</div>
                        ) : (
                            <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                                <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                    <tr>
                                        {orderFields.map((field) => (
                                            <th key={field} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                                {field.replace(/_/g, " ")}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentOrders.map((order, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                            {orderFields.map((field) => (
                                                <td key={field} className="py-3 px-6 border-b border-gray-300 text-center">
                                                    {field === "pickslip_number" ? (
                                                        <span
                                                            onClick={() => handlePickslipClick(order.pickslip_number)}
                                                            className="text-blue-500 hover:underline cursor-pointer"
                                                        >
                                                            {order[field]}
                                                        </span>
                                                    ) : field === "pickslip_status" ? (
                                                        <select
                                                            value={order[field]}
                                                            onChange={(e) => handleStatusChange(e, order.pickslip_number)}
                                                            className="p-2 border rounded-md shadow-sm bg-gray-50 text-sm"
                                                        >
                                                            <option value="Pending">Pending</option>
                                                            <option value="Holding">Holding</option>
                                                        </select>
                                                    ) : (
                                                        order[field]
                                                    )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden grid grid-cols-1 gap-4">
                        {currentOrders.length === 0 ? (
                            <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                                No data found
                            </div>
                        ) : (
                            currentOrders.map((order, index) => (
                                <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                                    {orderFields.map((field) => (
                                        <div key={field} className="flex justify-between text-sm mb-1">
                                            <strong className="capitalize">{field.replace(/_/g, " ")}:</strong>
                                            {field === "pickslip_number" ? (
                                                <span
                                                    onClick={() => handlePickslipClick(order.pickslip_number)}
                                                    className="text-yellow-200 underline cursor-pointer"
                                                >
                                                    {order[field]}
                                                </span>
                                            ) : field === "pickslip_status" ? (
                                                <select
                                                    value={order[field]}
                                                    onChange={(e) => handleStatusChange(e, order.pickslip_number)}
                                                    className="p-1 rounded text-gray-800"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Holding">Holding</option>
                                                </select>
                                            ) : (
                                                <span>{order[field]}</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </>
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

            {/* Filter Popup for Mobile (only date filter) */}
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
            <ToastContainer />
        </div>
    );
};

export default PendingOrders;
