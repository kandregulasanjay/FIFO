import React, { useEffect, useState } from "react";
import { fetchHoldingData, fetchBinMasterData, saveHoldingTransfer, getHoldingPDF, getLatestHoldingPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XCircleIcon, DocumentReportIcon } from "@heroicons/react/solid";
import { RefreshIcon } from "@heroicons/react/outline";
import Select from "react-select";
import { generateHoldingPDF } from "./HoldingPDF";

const HoldingPage = () => {
    const [holdingData, setHoldingData] = useState([]);
    const [showCard, setShowCard] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [binMasterData, setBinMasterData] = useState({ sections: [], sub_sections: [], bins: [] });
    const [transferData, setTransferData] = useState([{ section: "", sub_section: "", bin: "", allocated_qty: 0 }]);

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

    const handleTransferClick = (record) => {
        setSelectedRecord(record);
        setShowCard(true);
    };

    const handleTransferChange = (index, field, value) => {
        const updatedTransferData = [...transferData];
        updatedTransferData[index][field] = value;

        if (field === "section") {
            updatedTransferData[index].sub_section = "";
            updatedTransferData[index].bin = "";
        } else if (field === "sub_section") {
            updatedTransferData[index].bin = "";
        }

        setTransferData(updatedTransferData);
    };

    const handleTransferSubmit = async () => {
        for (const data of transferData) {
            if (!data.section || !data.sub_section || !data.bin || data.allocated_qty <= 0) {
                toast.error("All fields are mandatory and allocated quantity must be greater than 0");
                return;
            }
        }

        const transferPayload = transferData.map(data => {
            const new_bin_location = data.sub_section === data.bin
                ? `${data.section}-${data.sub_section}`
                : `${data.section}-${data.sub_section}-${data.bin}`;

            return {
                pickslip_number: selectedRecord.pickslip_number,
                pickslip_line_id: selectedRecord.pickslip_line_id,
                make: selectedRecord.make,
                item_code: selectedRecord.item_code,
                batch_number: selectedRecord.batch_number,
                bin_location: selectedRecord.bin_location,
                new_bin_location,
                new_allocated_qty: data.allocated_qty,
                issued_at: selectedRecord.issued_at,
                status: selectedRecord.status,
                customer_name: selectedRecord.customer_name,
                issued_quantity: selectedRecord.issued_quantity,
                issued_qty: selectedRecord.issued_qty,
                remaining_qty: selectedRecord.remaining_qty,
                ordered_qty: selectedRecord.ordered_qty,
                invoice_number: selectedRecord.invoice_number
            };
        });

        try {
            await saveHoldingTransfer(transferPayload);
            toast.success("Holding transfer saved successfully!");
            fetchHoldingDataFromAPI();
            setShowCard(false);
            setTransferData([{ section: "", sub_section: "", bin: "", allocated_qty: "" }]);
        } catch (error) {
            toast.error("Error saving holding transfer");
        }
    };

    const addMoreTransfers = () => {
        setTransferData([...transferData, { section: "", sub_section: "", bin: "", allocated_qty: "" }]);
    };

    const removeTransfer = (index) => {
        const updatedTransferData = [...transferData];
        updatedTransferData.splice(index, 1);
        setTransferData(updatedTransferData);
    };

    const handleRefresh = () => {
        fetchHoldingDataFromAPI();
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

    const handleCurrentTransferDownload = async (pickslipNumber) => {
        try {
            const data = await getLatestHoldingPDF(pickslipNumber);
            console.log("Latest holding data:", data);

            if (!data || !data.items || data.items.length === 0) {
                toast.error("No transfer data available for this pickslip.");
                return;
            }

            generateHoldingPDF(
                pickslipNumber,
                data.items,
                data.customer_name,
                new Date(data.issued_at).toISOString(),
                "current",
                data.invoice_number
            );
        } catch (error) {
            toast.error("Error downloading latest transaction PDF.");
        }
    };

    if (!holdingData || !holdingData.length) return <p className="text-center text-lg font-semibold">There is no holding data</p>;

    return (
        <div className="p-4 max-w-full overflow-x-auto">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Holding Page</h2>
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
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Action</th>
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
                                        onClick={() => handleTransferClick(record)}
                                        className="px-3 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-md shadow-sm text-xs border border-blue-600 hover:border-purple-700 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                    >
                                        Release
                                    </button>
                                </td>
                                <td className="py-3 px-6 border-b border-gray-300 text-center flex justify-center gap-2">
                                    <button
                                        onClick={() => handleCurrentTransferDownload(record.pickslip_number)}
                                        className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-sm text-xs border border-blue-600 hover:border-purple-700 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                        title="Download Current"
                                    >
                                        <DocumentReportIcon className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDownload(record.pickslip_number)}
                                        className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-full shadow-sm text-xs border border-blue-600 hover:border-purple-700 hover:bg-gradient-to-r hover:from-blue-700 hover:to-purple-700 transition"
                                        title="Download All"
                                    >
                                        <DocumentReportIcon className="h-5 w-5" />
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

            {showCard && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 overflow-auto">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-full overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-3">Transfer Details</h3>
                        {transferData.map((data, index) => (
                            <div key={index} className="mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-4">
                                <div className="mb-4 sm:mb-0 sm:flex-1">
                                    <label className="block text-sm font-medium">Section</label>
                                    <select
                                        value={data.section}
                                        onChange={(e) => handleTransferChange(index, "section", e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Select Section</option>
                                        {binMasterData.sections.map(section => (
                                            <option key={section.section} value={section.section}>
                                                {section.section}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4 sm:mb-0 sm:flex-1">
                                    <label className="block text-sm font-medium">Sub Section</label>
                                    <select
                                        value={data.sub_section}
                                        onChange={(e) => handleTransferChange(index, "sub_section", e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Select Sub Section</option>
                                        {binMasterData.sub_sections
                                            .filter(sub => sub.section === data.section)
                                            .map(sub => (
                                                <option key={`${sub.section}-${sub.sub_section}`} value={sub.sub_section}>
                                                    {sub.sub_section}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="mb-4 sm:mb-0 sm:flex-1">
                                    <label className="block text-sm font-medium">Bin</label>
                                    <select
                                        value={data.bin}
                                        onChange={(e) => handleTransferChange(index, "bin", e.target.value)}
                                        className="w-full p-2 border rounded-md"
                                    >
                                        <option value="">Select Bin</option>
                                        {binMasterData.bins
                                            .filter(bin => bin.section === data.section && bin.sub_section === data.sub_section)
                                            .map(bin => (
                                                <option key={`${bin.section}-${bin.sub_section}-${bin.bins}`} value={bin.bins}>
                                                    {bin.bins}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div className="mb-4 sm:mb-0 sm:flex-1">
                                    <label className="block text-sm font-medium">Allocated Quantity</label>
                                    <input
                                        type="number"
                                        value={data.allocated_qty}
                                        onChange={(e) => handleTransferChange(index, "allocated_qty", parseInt(e.target.value) || 0)}
                                        className="w-full p-2 border rounded-md"
                                    />
                                </div>
                                {index > 0 && (
                                    <button
                                        onClick={() => removeTransfer(index)}
                                        className="text-red-500 hover:text-red-700 sm:ml-4"
                                    >
                                        <XCircleIcon className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                        ))}
                        <button
                            onClick={addMoreTransfers}
                            className="mt-2 px-3 py-1 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 text-xs"
                        >
                            + Add More
                        </button>
                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowCard(false)} className="px-4 py-2 bg-gray-400 text-white rounded-md">Cancel</button>
                            <button onClick={handleTransferSubmit} className="px-4 py-2 bg-green-500 text-white rounded-md">Submit</button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default HoldingPage;
