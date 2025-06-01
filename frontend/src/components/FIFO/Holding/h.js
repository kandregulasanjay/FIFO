import React, { useEffect, useState } from "react";
import { fetchHoldingTransferAvailability, submitHoldingTransfer, fetchBinMasterData, fetchHoldingData, fetchHoldingTransferCompleted } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XCircleIcon, RefreshIcon, FilterIcon, XIcon, DocumentReportIcon } from "@heroicons/react/outline";
import Select from "react-select";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const HoldingTransferPage = () => {
    const [availability, setAvailability] = useState([]);
    const [completedTransfers, setCompletedTransfers] = useState([]);
    const [,setHoldingData] = useState([]);
    const [showCard, setShowCard] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [binMasterData, setBinMasterData] = useState({ sections: [], sub_sections: [], bins: [] });
    const [transferData, setTransferData] = useState([{
        section: "",
        sub_section: "",
        bin: "",
        allocated_qty: ""
    }]);
    const [isLoading, setIsLoading] = useState(true);

    const [availabilityCurrentPage, setAvailabilityCurrentPage] = useState(1);
    const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
    const rowsPerPage = 10;

    const [availabilityFilter, setAvailabilityFilter] = useState(null);
    const [completedFilter, setCompletedFilter] = useState(null);

    // For mobile filter popups
    const [showAvailabilityFilterPopup, setShowAvailabilityFilterPopup] = useState(false);
    const [showCompletedFilterPopup, setShowCompletedFilterPopup] = useState(false);

    const itemCodeOptions = Array.from(
        new Set([...availability, ...completedTransfers].map(record => record.item_code))
    ).map(item_code => ({
        value: item_code,
        label: item_code
    }));

    // Add customer name options for filter
    const customerNameOptions = Array.from(
        new Set([...availability, ...completedTransfers].map(record => record.customer_name).filter(Boolean))
    ).map(customer_name => ({
        value: customer_name,
        label: customer_name
    }));

    const [customerNameFilter, setCustomerNameFilter] = useState(null);

    useEffect(() => {
        fetchAvailabilityData();
        fetchBinMaster();
        fetchHoldingDataFromAPI();
        fetchCompletedTransfersData();
    }, []);

    const fetchAvailabilityData = async () => {
        try {
            setIsLoading(true);
            const data = await fetchHoldingTransferAvailability();
            setAvailability(data);
        } catch (error) {
            toast.error("Error fetching availability data");
        } finally {
            setIsLoading(false);
        }
    };

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

    const fetchCompletedTransfersData = async () => {
        try {
            const data = await fetchHoldingTransferCompleted();
            setCompletedTransfers(data);
        } catch (error) {
            toast.error("Error fetching completed transfers");
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
                invoice_number : selectedRecord.invoice_number,
                                bin_location: selectedRecord.bin_location,
                batch_number: selectedRecord.batch_number,
                make: selectedRecord.make,
                item_code: selectedRecord.item_code,
                available_quantity: selectedRecord.available_quantity,
                new_bin_location,
                new_allocated_qty: data.allocated_qty
            };
        });

        try {
            await submitHoldingTransfer(transferPayload);
            toast.success("Transfer saved successfully!");
            fetchAvailabilityData();
            setShowCard(false);
            setTransferData([{ section: "", sub_section: "", bin: "", allocated_qty: "" }]);
        } catch (error) {
            toast.error("Error saving transfer");
        }
    };

    const addMoreTransfers = () => {
        setTransferData([...transferData, { section: "", sub_section: "", bin: "", allocated_qty: 0 }]);
    };

    const removeTransfer = (index) => {
        const updatedTransferData = [...transferData];
        updatedTransferData.splice(index, 1);
        setTransferData(updatedTransferData);
    };

    const isFormValid = transferData.every(data =>
        data.section && data.sub_section && data.bin && data.allocated_qty
    );

    const handleRefresh = () => {
        fetchAvailabilityData();
        fetchBinMaster();
        fetchHoldingDataFromAPI();
        fetchCompletedTransfersData();
        setAvailabilityFilter(null);
        setCompletedFilter(null);
        setAvailabilityCurrentPage(1);
        setCompletedCurrentPage(1);
    };

    // Pagination logic
    const availabilityIndexOfLastRow = availabilityCurrentPage * rowsPerPage;
    const availabilityIndexOfFirstRow = availabilityIndexOfLastRow - rowsPerPage;
    const filteredAvailability = availability.filter(record =>
        (availabilityFilter ? record.item_code === availabilityFilter.value : true) &&
        (customerNameFilter ? record.customer_name === customerNameFilter.value : true)
    );
    const availabilityCurrentRows = filteredAvailability.slice(availabilityIndexOfFirstRow, availabilityIndexOfLastRow);
    const availabilityTotalPages = Math.ceil(filteredAvailability.length / rowsPerPage);

    const completedIndexOfLastRow = completedCurrentPage * rowsPerPage;
    const completedIndexOfFirstRow = completedIndexOfLastRow - rowsPerPage;
    const filteredCompletedTransfers = completedTransfers.filter(record =>
        completedFilter ? record.item_code === completedFilter.value : true
    );
    const completedCurrentRows = filteredCompletedTransfers.slice(completedIndexOfFirstRow, completedIndexOfLastRow);
    const completedTotalPages = Math.ceil(filteredCompletedTransfers.length / rowsPerPage);

    // Export to Excel for Transfer Table
    const handleDownloadExcel = () => {
        const exportData = filteredAvailability.length > 0 ? filteredAvailability : availability;
        if (exportData.length === 0) {
            toast.info("No data to export");
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "TransferAvailability");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileName = `transfer_availability_${new Date().toISOString().slice(0,10)}.xlsx`;
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
    };

    // Export to Excel for Completed Transfers Table
    const handleDownloadCompletedExcel = () => {
        const exportData = filteredCompletedTransfers.length > 0 ? filteredCompletedTransfers : completedTransfers;
        if (exportData.length === 0) {
            toast.info("No data to export");
            return;
        }
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "CompletedTransfers");
        const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
        const fileName = `completed_transfers_${new Date().toISOString().slice(0,10)}.xlsx`;
        saveAs(new Blob([excelBuffer], { type: "application/octet-stream" }), fileName);
    };

    if (isLoading) return <p className="text-center text-lg font-semibold">Loading...</p>;
    if (!availability.length) return <p className="text-center text-lg font-semibold">There is no data</p>;

    return (
        <div className="p-4 pt-0">
            <div className="flex justify-between items-center mb-4 mt-2 ">
                <h2 className="text-xl font-semibold hidden sm:block">Transfer</h2>
                {/* Desktop/Tablet Filters */}
                <div className="hidden sm:flex items-center space-x-4">
                    <Select
                        options={itemCodeOptions}
                        value={availabilityFilter}
                        onChange={setAvailabilityFilter}
                        placeholder="Transfer Item Code"
                        isClearable
                        className="w-64"
                    />
                    {/* Customer Name Filter */}
                    <Select
                        options={customerNameOptions}
                        value={customerNameFilter}
                        onChange={setCustomerNameFilter}
                        placeholder="Customer Name"
                        isClearable
                        className="w-64"
                    />
                    <Select
                        options={itemCodeOptions}
                        value={completedFilter}
                        onChange={setCompletedFilter}
                        placeholder="Completed Transfers"
                        isClearable
                        className="w-64"
                    />
                    <button
                        onClick={handleRefresh}
                        className="px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                    >
                        <RefreshIcon className="h-5 w-5" />
                    </button>
                    <button
                        onClick={handleDownloadExcel}
                        className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition ml-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "8px"
                        }}
                        title="Export Transfer Table"
                    >
                        <DocumentReportIcon className="h-6 w-6 text-blue-600" />
                    </button>
                </div>
            </div>

            {/* Mobile: Search + Filter Button Row for Transfer */}
            <div className="sm:hidden flex items-center gap-2 mb-2">
                <Select
                    options={itemCodeOptions}
                    value={availabilityFilter}
                    onChange={setAvailabilityFilter}
                    placeholder="Transfer Item Code"
                    isClearable
                    className="flex-1"
                />
                {/* Customer Name Filter for Mobile */}
                <Select
                    options={customerNameOptions}
                    value={customerNameFilter}
                    onChange={setCustomerNameFilter}
                    placeholder="Customer Name"
                    isClearable
                    className="flex-1"
                />
                <button
                    onClick={() => setShowAvailabilityFilterPopup(true)}
                    className="p-2 rounded-md shadow-md bg-white border-2"
                    style={{
                        borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                        borderRadius: "8px"
                    }}
                >
                    <FilterIcon className="h-6 w-6 text-blue-600" />
                </button>
            </div>

            {/* Transfer Table - Desktop */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md mb-8">
                {availabilityCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Pickslip #</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Line ID</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Invoice #</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Bin Location</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Make</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Item Code</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Batch Number</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Available Quantity</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {availabilityCurrentRows.map((record, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_number }</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_line_id}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.invoice_number}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.bin_location}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.make}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.item_code}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.batch_number}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.available_quantity}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">
                                        <button
                                            onClick={() => handleTransferClick(record)}
                                            className="px-3 py-1 bg-blue-500 text-white rounded-md"
                                        >
                                            Transfer
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {filteredAvailability.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setAvailabilityCurrentPage(availabilityCurrentPage - 1)}
                            disabled={availabilityCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{availabilityCurrentPage} of {availabilityTotalPages}</span>
                        <button
                            onClick={() => setAvailabilityCurrentPage(availabilityCurrentPage + 1)}
                            disabled={availabilityCurrentPage === availabilityTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Transfer Table - Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4 mb-8">
                {availabilityCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    availabilityCurrentRows.map((record, index) => (
                        <div key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg shadow-lg text-white">
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Pickslip #:</strong>
                                <span>{record.pickslip_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Line ID:</strong>
                                <span>{record.pickslip_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Invoice #:</strong>
                                <span>{record.invoice_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Bin Location:</strong>
                                <span>{record.bin_location}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Make:</strong>
                                <span>{record.make}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Item Code:</strong>
                                <span>{record.item_code}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Batch Number:</strong>
                                <span>{record.batch_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Available Qty:</strong>
                                <span>{record.available_quantity}</span>
                            </div>
                            <div className="flex justify-end mt-2">
                                <button
                                    onClick={() => handleTransferClick(record)}
                                    className="px-3 py-1 bg-white text-blue-600 font-semibold rounded-md shadow-sm text-xs"
                                >
                                    Transfer
                                </button>
                            </div>
                        </div>
                    ))
                )}
                {filteredAvailability.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setAvailabilityCurrentPage(availabilityCurrentPage - 1)}
                            disabled={availabilityCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{availabilityCurrentPage} of {availabilityTotalPages}</span>
                        <button
                            onClick={() => setAvailabilityCurrentPage(availabilityCurrentPage + 1)}
                            disabled={availabilityCurrentPage === availabilityTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Mobile: Search + Filter Button Row for Completed Transfers */}
            <div className="sm:hidden flex items-center gap-2 mb-2">
                <Select
                    options={itemCodeOptions}
                    value={completedFilter}
                    onChange={setCompletedFilter}
                    placeholder="Completed Transfers"
                    isClearable
                    className="flex-1"
                />
                <button
                    onClick={() => setShowCompletedFilterPopup(true)}
                    className="p-2 rounded-md shadow-md bg-white border-2"
                    style={{
                        borderImage: "linear-gradient(90deg, #fbbf24, #f59e42) 1",
                        borderRadius: "8px"
                    }}
                >
                    <FilterIcon className="h-6 w-6 text-yellow-600" />
                </button>
            </div>

            {/* Completed Transfers Table - Desktop */}
            <div className="hidden md:block overflow-x-auto bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-semibold mb-4">Completed Transfers</h3>
                    <button
                        onClick={handleDownloadCompletedExcel}
                        className="p-2 rounded-md shadow-md bg-white border-2 flex items-center justify-center transition ml-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #fbbf24, #f59e42) 1",
                            borderRadius: "8px"
                        }}
                        title="Export Completed Transfers Table"
                    >
                        <DocumentReportIcon className="h-6 w-6 text-yellow-600" />
                    </button>
                </div>
                {completedCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">No data found</div>
                ) : (
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-black">
                            <tr>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Pickslip #</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">line ID</th>
                            <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Invoice #</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Bin Location</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Make</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Item Code</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Batch Number</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">New Bin Location</th>
                                <th className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">Allocated Quantity</th>
                            </tr>
                        </thead>
                        <tbody>
                            {completedCurrentRows.map((record, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_number}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.pickslip_line_id}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.invoice_number}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.bin_location}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.make}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.item_code}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.batch_number}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.new_bin_location}</td>
                                    <td className="py-3 px-6 border-b border-gray-300 text-center">{record.new_allocated_qty}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {filteredCompletedTransfers.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setCompletedCurrentPage(completedCurrentPage - 1)}
                            disabled={completedCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{completedCurrentPage} of {completedTotalPages}</span>
                        <button
                            onClick={() => setCompletedCurrentPage(completedCurrentPage + 1)}
                            disabled={completedCurrentPage === completedTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Completed Transfers Table - Mobile Cards */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                <h3 className="text-lg font-semibold mb-4">Completed Transfers</h3>
                {completedCurrentRows.length === 0 ? (
                    <div className="py-8 text-center text-gray-200 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg">
                        No data found
                    </div>
                ) : (
                    completedCurrentRows.map((record, index) => (
                        <div key={index} className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 rounded-lg shadow-lg text-black">
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Pickslip #:</strong>
                                <span>{record.pickslip_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Line ID:</strong>
                                <span>{record.pickslip_line_id}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Invoice #:</strong>
                                <span>{record.invoice_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Bin Location:</strong>
                                <span>{record.bin_location}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Make:</strong>
                                <span>{record.make}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Item Code:</strong>
                                <span>{record.item_code}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Batch Number:</strong>
                                <span>{record.batch_number}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>New Bin Location:</strong>
                                <span>{record.new_bin_location}</span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                                <strong>Allocated Quantity:</strong>
                                <span>{record.new_allocated_qty}</span>
                            </div>
                        </div>
                    ))
                )}
                {filteredCompletedTransfers.length > rowsPerPage && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setCompletedCurrentPage(completedCurrentPage - 1)}
                            disabled={completedCurrentPage === 1}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-4 py-2 mx-1">{completedCurrentPage} of {completedTotalPages}</span>
                        <button
                            onClick={() => setCompletedCurrentPage(completedCurrentPage + 1)}
                            disabled={completedCurrentPage === completedTotalPages}
                            className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Filter Popup for Transfer Table (Mobile) */}
            {showAvailabilityFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #2563eb, #a21caf) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowAvailabilityFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Transfer Filters</h3>
                        <div className="flex flex-col gap-3">
                            <Select
                                options={itemCodeOptions}
                                value={availabilityFilter}
                                onChange={setAvailabilityFilter}
                                placeholder="Transfer Item Code"
                                isClearable
                                className="w-full"
                            />
                            {/* Customer Name Filter in Popup */}
                            <Select
                                options={customerNameOptions}
                                value={customerNameFilter}
                                onChange={setCustomerNameFilter}
                                placeholder="Customer Name"
                                isClearable
                                className="w-full"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setAvailabilityFilter(null); setCustomerNameFilter(null); setShowAvailabilityFilterPopup(false); }}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowAvailabilityFilterPopup(false)}
                                    className="flex-1 px-3 py-1 bg-blue-600 text-sm text-white rounded-md hover:bg-blue-700 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter Popup for Completed Transfers Table (Mobile) */}
            {showCompletedFilterPopup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="relative bg-white rounded-lg p-6 w-11/12 max-w-xs shadow-lg border-2"
                        style={{
                            borderImage: "linear-gradient(90deg, #fbbf24, #f59e42) 1",
                            borderRadius: "16px"
                        }}
                    >
                        <button
                            onClick={() => setShowCompletedFilterPopup(false)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
                        >
                            <XIcon className="h-6 w-6" />
                        </button>
                        <h3 className="text-lg font-semibold mb-4 text-center">Completed Transfers Filters</h3>
                        <div className="flex flex-col gap-3">
                            <Select
                                options={itemCodeOptions}
                                value={completedFilter}
                                onChange={setCompletedFilter}
                                placeholder="Completed Transfers"
                                isClearable
                                className="w-full"
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setCompletedFilter(null); setShowCompletedFilterPopup(false); }}
                                    className="flex-1 px-3 py-1 bg-gray-300 text-sm text-gray-700 rounded-md hover:bg-gray-400 transition"
                                >
                                    Reset
                                </button>
                                <button
                                    onClick={() => setShowCompletedFilterPopup(false)}
                                    className="flex-1 px-3 py-1 bg-yellow-500 text-sm text-white rounded-md hover:bg-yellow-600 transition"
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Card Modal */}
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
                            <button
                                onClick={handleTransferSubmit}
                                className={`px-4 py-2 bg-green-500 text-white rounded-md ${!isFormValid ? "opacity-50 cursor-not-allowed" : ""}`}
                                disabled={!isFormValid}
                            >
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default HoldingTransferPage;
