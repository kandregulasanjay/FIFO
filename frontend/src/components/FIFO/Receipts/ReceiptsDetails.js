import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchReceiptDetails, saveAllocation, getReceiptsPDF } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XCircleIcon } from "@heroicons/react/solid";
import { generateReceiptPDF } from "./ReceiptPDF";

const ReceiptsDetails = () => {
    const { receiptNumber } = useParams();
    const navigate = useNavigate();

    const [receipt, setReceipt] = useState(null);
    const [batches, setBatches] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);

    const fetchDetails = useCallback(async () => {
        try {
            const data = await fetchReceiptDetails(receiptNumber);
            if (!data || !data.items) {
                toast.error("Error fetching receipt details");
                return;
            }
            setReceipt(data);
            setBatches(data.items.map(item => ({
                item_code: item.item_code,
                batch_number: item.batch_number,
                quantity: item.quantity,
                make: item.make,
                allocations: item.allocations || [{ 
                    section: "", 
                    sub_section: "", 
                    bin: "", 
                    allocated_quantity: item.quantity 
                }]
            })));
        } catch (error) {
            toast.error("Error fetching receipt details");
        }
    }, [receiptNumber]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    useEffect(() => {
        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = ''; 
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    const handleAllocationChange = (batchIndex, allocIndex, field, value) => {
        const updatedBatches = [...batches];
        if (field === "allocated_quantity") {
            value = parseInt(value) || 0; 
        }
        updatedBatches[batchIndex].allocations[allocIndex][field] = value;
        if (field === "section") {
            updatedBatches[batchIndex].allocations[allocIndex].sub_section = "";
            updatedBatches[batchIndex].allocations[allocIndex].bin = "";
        } else if (field === "sub_section") {
            updatedBatches[batchIndex].allocations[allocIndex].bin = "";
        }
        setBatches(updatedBatches);
    };

    const addMoreAllocations = (batchIndex) => {
        const updatedBatches = [...batches];
        updatedBatches[batchIndex].allocations.push({ section: "", sub_section: "", bin: "", allocated_quantity: 0 });
        setBatches(updatedBatches);
    };

    const removeAllocation = (batchIndex, allocIndex) => {
        const updatedBatches = [...batches];
        updatedBatches[batchIndex].allocations.splice(allocIndex, 1);
        if (updatedBatches[batchIndex].allocations.length === 0) {
            updatedBatches.splice(batchIndex, 1);
        }
        setBatches(updatedBatches);
    };

    const handleSubmit = () => {
        if (!receipt) {
            toast.error("Receipt details are missing!");
            return;
        }
        const totalAllocated = batches.reduce((batchSum, batch) => {
            return batchSum + batch.allocations.reduce((sum, alloc) => sum + alloc.allocated_quantity, 0);
        }, 0);
        const totalQuantity = receipt.items.reduce((sum, item) => sum + item.quantity, 0);
        if (totalAllocated !== totalQuantity) {
            toast.error(`Total allocated quantity (${totalAllocated}) must be equal to total quantity (${totalQuantity}).`);
            return;
        }
        for (const batch of batches) {
            const item = receipt.items.find(item => item.item_code === batch.item_code && item.batch_number === batch.batch_number);
            const allocatedQuantity = batch.allocations.reduce((sum, alloc) => sum + alloc.allocated_quantity, 0);
            if (item && allocatedQuantity !== item.quantity) {
                toast.error(`Total allocated quantity for item ${batch.item_code} and batch ${batch.batch_number} must be equal to ${item.quantity}.`);
                return;
            }
        }
        if (!receipt.receipt_number) {
            toast.error("Receipt number is missing!");
            return;
        }
        setShowPopup(true);
    };

    const handleDownload = async () => {
        try {
            const receiptDetails = await getReceiptsPDF(receipt.receipt_number);
            if (!receiptDetails || !receiptDetails.items || receiptDetails.items.length === 0) {
                toast.error("No receipt details found to generate PDF.");
                return;
            }
            generateReceiptPDF(receipt.receipt_number, receiptDetails);
        } catch (error) {
            toast.error("Error fetching receipt details.");
        }
    };

    const confirmSubmit = async () => {
        setShowPopup(false);
        try {
            if (!receipt || !receipt.receipt_number) {
                toast.error("Receipt number is missing!");
                return;
            }
            const updatedBatches = batches.map(batch => ({
                batch_number: batch.batch_number,
                item_code: batch.item_code,
                allocations: batch.allocations.map(alloc => ({
                    allocated_quantity: alloc.allocated_quantity,
                    bin_location: `${alloc.section}-${alloc.sub_section}-${alloc.bin}`
                }))
            }));
            const response = await saveAllocation(
                receipt.receipt_number,
                updatedBatches,
                receipt.receipt_status || "Release",
                receipt.receipt_type || "Release", 
                receipt.receipt_comment || "" 
            );
            if (response && response.message === "Allocations saved successfully!") {
                toast.success("Allocations saved successfully!");
                setShowDownloadButton(true); 
                fetchDetails(); 
            } else {
                throw new Error(response?.message || "Failed to save allocation");
            }
        } catch (error) {
            toast.error(error.message || "Error saving allocation.");
        }
    };

    if (!receipt) return <p className="text-center text-lg font-semibold">Loading...</p>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white py-3 px-4 rounded-lg shadow-md mb-4 text-center">
                <h2 className="text-2xl font-bold">Receipt Details</h2>
                <p className="text-sm opacity-80">{receiptNumber}</p>
            </div>

            {/* Batches & Allocations */}
            {batches.map((batch, batchIndex) => (
                <div key={batchIndex} className="bg-gray-50 p-4 rounded-lg shadow mb-3">
                    <h3 className="text-md font-semiboldpb-2">
                        <span className="font-bold  text-indigo-600 ">Make:</span> {batch.make}
                        <span className=" pl-3 font-bold  text-indigo-600 "> Item:</span> {batch.item_code}
                        <span className="pl-3  font-bold  text-indigo-600 "> Batch:</span> {batch.batch_number}
                        <span className="pl-3  font-bold  text-indigo-600 "> Quantity:</span> {batch.quantity}
                    </h3>
                    {batch.allocations.map((alloc, allocIndex) => (
                        <div key={allocIndex} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 rounded-lg shadow-sm mb-2 relative">
                            {/* Section */}
                            <div className="w-full sm:w-1/3">
                                <label className="text-xs font-medium">Section</label>
                                <select
                                    value={alloc.section}
                                    onChange={(e) => handleAllocationChange(batchIndex, allocIndex, "section", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Section</option>
                                    {receipt?.sections?.map(section => (
                                        <option key={section.section} value={section.section}>
                                            {section.section}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Sub Section */}
                            <div className="w-full sm:w-1/3">
                                <label className="text-xs font-medium">Sub Section</label>
                                <select
                                    value={alloc.sub_section}
                                    onChange={(e) => handleAllocationChange(batchIndex, allocIndex, "sub_section", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Sub-Section</option>
                                    {receipt?.sub_sections
                                        ?.filter(sub => sub.section === alloc.section) // ✅ Show only related sub-sections
                                        .map(sub => (
                                            <option key={`${sub.section}-${sub.sub_section}`} value={sub.sub_section}>
                                                {sub.sub_section}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Bin */}
                            <div className="w-full sm:w-1/3">
                                <label className="text-xs font-medium">Bin</label>
                                <select
                                    value={alloc.bin}
                                    onChange={(e) => handleAllocationChange(batchIndex, allocIndex, "bin", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Bin</option>
                                    {receipt?.bins
                                        ?.filter(bin => bin.section === alloc.section && bin.sub_section === alloc.sub_section)
                                        .map(bin => (
                                            <option key={`${bin.section}-${bin.sub_section}-${bin.bins}`} value={bin.bins}>
                                                {bin.bins}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            {/* Allocated Quantity */}
                            <div className="w-full sm:w-1/2">
                                <label className="text-xs font-medium">Allocated Qty</label>
                                <input
                                    type="number"
                                    value={alloc.allocated_quantity}
                                    onChange={(e) => handleAllocationChange(batchIndex, allocIndex, "allocated_quantity", parseInt(e.target.value) || 0)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                />
                            </div>

                            {/* ❌ Close Button */}
                            <button
                                onClick={() => removeAllocation(batchIndex, allocIndex)}
                                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                            >
                                <XCircleIcon className="h-5 w-5" />
                            </button>
                        </div>
                    ))}

                    {/* Add More Inside Batch */}
                    <button
                        onClick={() => addMoreAllocations(batchIndex)}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 text-xs"
                    >
                        + Add More
                    </button>
                </div>
            ))}

            {/* Submit & Cancel Buttons */}
            <div className="mt-4 flex justify-center gap-4">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-600 text-sm"
                >
                    Submit
                </button>
                <button
                    onClick={() => navigate("/pending-receipts")}
                    className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 text-sm"
                >
                    Cancel
                </button>
            </div>

            {/* Show Download Button After Submission */}
            {showDownloadButton && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-500 text-white font-semibold rounded-md shadow-sm hover:bg-green-600 text-sm"
                    >
                        Download PDF
                    </button>
                </div>
            )}

            {/* Confirmation Popup */}
            {showPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirm Submission</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Are you sure you want to submit this allocation?
                        </p>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setShowPopup(false)} className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm hover:bg-gray-500">Cancel</button>
                            <button onClick={confirmSubmit} className="px-4 py-2 bg-green-500 text-white rounded-md text-sm hover:bg-green-600">Yes, Sure</button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default ReceiptsDetails;
