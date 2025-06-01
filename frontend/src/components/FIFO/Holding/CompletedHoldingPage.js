import  { useEffect, useState } from "react";
import { fetchCompletedHoldingData, getLatestHoldingPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { generateHoldingPDF } from "./HoldingPDF";
import Select from "react-select";
import { DocumentReportIcon, EyeIcon } from "@heroicons/react/outline";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const CompletedHoldingPage = () => {
    const [holdingData, setHoldingData] = useState([]);
    const [invoiceFilter, setInvoiceFilter] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [popupData, setPopupData] = useState(null);
    const [loadingPopup, setLoadingPopup] = useState(false);
    const [, setDownloadHover] = useState(false);
    const rowsPerPage = 10;

    const fetchCompletedHoldingDataFromAPI = async () => {
        try {
            const data = await fetchCompletedHoldingData();
            setHoldingData(data);
        } catch (error) {
            toast.error("Error fetching holding data");
        }
    };

    useEffect(() => {
        fetchCompletedHoldingDataFromAPI();
    }, []);

    // Unique invoice_number options for filter
    const invoiceOptions = Array.from(
        new Set(holdingData.map(record => record.invoice_number))
    ).map(invoice_number => ({
        value: invoice_number,
        label: invoice_number
    }));

    // Filter data by invoice_number if filter is set
    const filteredHoldingData = holdingData.filter(record =>
        invoiceFilter ? record.invoice_number === invoiceFilter.value : true
    );

    // Dynamic columns (excluding id)
    const columns = Object.keys(holdingData[0] || {}).filter(key => key !== "id");

    // Pagination
    const indexOfLastRow = currentPage * rowsPerPage;
    const indexOfFirstRow = indexOfLastRow - rowsPerPage;
    const currentRows = filteredHoldingData.slice(indexOfFirstRow, indexOfLastRow);
    const totalPages = Math.ceil(filteredHoldingData.length / rowsPerPage);

    // Download PDF for the respective invoice_number (latest data)
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
        XLSX.utils.book_append_sheet(workbook, worksheet, "CompletedHolding");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileName = `completed_holding_${new Date().toISOString().slice(0,10)}.xlsx`;
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
    };

    if (!holdingData || !holdingData.length)
        return <p className="text-center text-lg font-semibold">There is no holding data</p>;

    return (
        <div className="p-4 max-w-full overflow-x-auto">
            <div className="flex justify-end items-center gap-2 mb-4 max-w-md ml-auto">
                <Select
                    options={invoiceOptions}
                    value={invoiceFilter}
                    onChange={setInvoiceFilter}
                    placeholder="Invoice Number"
                    isClearable
                    className="flex-1"
                />
                <button
                    onClick={() => setInvoiceFilter(null)}
                    className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                >
                    Reset
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
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                {currentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                {columns.map(col => (
                                    <th key={col} className="py-4 px-6 text-center capitalize">{col.replace(/_/g, " ")}</th>
                                ))}
                                <th className="py-4 px-6 text-center">Reports</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.map((record, idx) => (
                                <tr key={idx} className="border-b hover:bg-gray-50 transition-all">
                                    {columns.map(col => (
                                        <td key={col} className="py-3 px-6 border-b border-gray-300 text-center">
                                            {record[col]}
                                        </td>
                                    ))}
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">
                                        <div className="flex justify-center space-x-2">
                                            <button
                                                onClick={() => handleDownload(record.invoice_number)}
                                                className="flex items-center justify-center px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-sm text-xs hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                            >
                                                <DocumentReportIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleView(record.invoice_number)}
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
                    currentRows.map((record, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            {columns.map((col) => (
                                <div key={col} className="flex justify-between text-sm mb-1">
                                    <strong className="capitalize">{col.replace(/_/g, " ")}:</strong>
                                    <span>{record[col]}</span>
                                </div>
                            ))}
                            <div className="flex justify-end gap-2 mt-2">
                                <button
                                    onClick={() => handleDownload(record.invoice_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-blue-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    <DocumentReportIcon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleView(record.invoice_number)}
                                    className="flex items-center justify-center px-3 py-1 bg-white text-green-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    <EyeIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {/* Popup Page */}
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
                                                {popupData.items && popupData.items.length > 0 &&
                                                    Object.keys(popupData.items[0]).map((key) => (
                                                        <th key={key} className="py-2 px-4 border-b text-center capitalize">
                                                            {key.replace(/_/g, " ")}
                                                        </th>
                                                    ))
                                                }
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {popupData.items && popupData.items.length > 0 &&
                                                popupData.items.map((item, idx) => (
                                                    <tr key={idx} className="border-b">
                                                        {Object.keys(item).map((key) => (
                                                            <td key={key} className="py-2 px-4 text-center">
                                                                {item[key]}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))
                                            }
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
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
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default CompletedHoldingPage;