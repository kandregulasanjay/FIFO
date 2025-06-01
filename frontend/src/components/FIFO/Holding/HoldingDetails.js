import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchHoldingDetails, saveHoldingTransfer } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { XCircleIcon } from "@heroicons/react/solid";
import { generateHoldingPDF } from "./HoldingPDF";

const HoldingDetails = () => {
    const { invoiceNumber } = useParams();
    const navigate = useNavigate();

    const [holding, setHolding] = useState(null);
    const [allocations, setAllocations] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [showDownloadButton, setShowDownloadButton] = useState(false);
    const [lastPayload, setLastPayload] = useState([]);

    const fetchDetails = useCallback(async () => {
        try {
            const data = await fetchHoldingDetails(invoiceNumber);
            setHolding(data);
            setAllocations(
                data.items.map(item => ({
                    ...item,
                    new_allocations: [
                        {
                            section: "",
                            sub_section: "",
                            bin: "",
                            allocated_qty: 0,
                        },
                    ],
                }))
            );
        } catch (error) {
            toast.error("Error fetching holding details");
        }
    }, [invoiceNumber]);

    useEffect(() => {
        fetchDetails();
    }, [fetchDetails]);

    const handleAllocationChange = (itemIdx, allocIdx, field, value) => {
        const updated = [...allocations];
        if (field === "allocated_qty") value = parseInt(value) || 0;
        updated[itemIdx].new_allocations[allocIdx][field] = value;

        if (field === "section") {
            updated[itemIdx].new_allocations[allocIdx].sub_section = "";
            updated[itemIdx].new_allocations[allocIdx].bin = "";
        } else if (field === "sub_section") {
            updated[itemIdx].new_allocations[allocIdx].bin = "";
        }
        setAllocations(updated);
    };

    const addMoreAllocations = (itemIdx) => {
        const updated = [...allocations];
        updated[itemIdx].new_allocations.push({
            section: "",
            sub_section: "",
            bin: "",
            allocated_qty: 0,
        });
        setAllocations(updated);
    };

    const removeAllocation = (itemIdx, allocIdx) => {
        const updated = [...allocations];
        updated[itemIdx].new_allocations.splice(allocIdx, 1);
        setAllocations(updated);
    };

    const handleSubmit = () => {
        setShowPopup(true);
    };

    const confirmSubmit = async () => {
        setShowPopup(false);
        try {
            // Prepare payload for saveHoldingTransfer
            const payload = [];
            allocations.forEach(item => {
                item.new_allocations.forEach(alloc => {
                    if (
                        alloc.section &&
                        alloc.sub_section &&
                        alloc.allocated_qty > 0
                    ) {
                        const new_bin_location =
                            alloc.sub_section === alloc.bin
                                ? `${alloc.section}-${alloc.sub_section}`
                                : `${alloc.section}-${alloc.sub_section}-${alloc.bin}`;
                        payload.push({
                            pickslip_number: holding.pickslip_number,
                            pickslip_line_id: item.pickslip_line_id,
                            make: item.make,
                            item_code: item.item_code,
                            batch_number: item.batch_number,
                            bin_location: item.bin_location,
                            new_bin_location,
                            new_allocated_qty: alloc.allocated_qty,
                            status: holding.pickslip_status,
                            customer_name: holding.customer_name,
                            issued_at: holding.issued_at,
                            ordered_qty: item.ordered_qty,
                            issued_qty: alloc.allocated_qty,
                            remaining_qty: item.ordered_qty - alloc.allocated_qty,
                            invoice_number: invoiceNumber,
                        });
                    }
                });
            });

            if (payload.length === 0) {
                toast.error("Please allocate at least one item.");
                return;
            }

            await saveHoldingTransfer(payload);
            toast.success("Holding allocation saved!");
            setLastPayload(payload); 
            setShowDownloadButton(true); 
            fetchDetails();

            // Automatically download PDF after successful submit
            generateHoldingPDF(
                holding.pickslip_number,
                payload,
                holding.customer_name,
                holding.issued_at,
                "current",
                invoiceNumber
            );
        } catch (error) {
            toast.error("Error saving holding allocation");
        }
    };

    const handleDownload = () => {
        if (!lastPayload.length) return;
        generateHoldingPDF(
            holding.pickslip_number,
            lastPayload,
            holding.customer_name,
            holding.issued_at,
            "current",
            invoiceNumber
        );
    };

    if (!holding) return <p className="text-center text-lg font-semibold">Loading...</p>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg shadow-md mb-4 text-center">
                <h2 className="text-2xl font-bold">Holding Details</h2>
                <p className="text-sm opacity-80">{invoiceNumber}</p>
            </div>
            {allocations.map((item, itemIdx) => (
                <div key={itemIdx} className="bg-gray-50 p-4 rounded-lg shadow mb-3">
                    <h3 className="text-md font-semibold pb-2">
                        <span className="font-bold text-blue-600">Make:</span> {item.make}
                        <span className="pl-3 font-bold text-blue-600">Item:</span> {item.item_code}
                        <span className="pl-3 font-bold text-blue-600">Batch:</span> {item.batch_number}
                        <span className="pl-3 font-bold text-blue-600">Bin:</span> {item.bin_location}
                        <span className="pl-3 font-bold text-blue-600">Qty:</span> {item.ordered_qty}
                    </h3>
                    {item.new_allocations.map((alloc, allocIdx) => (
                        <div key={allocIdx} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-3 rounded-lg shadow-sm mb-2 relative">
                            {/* Section */}
                            <div className="w-full sm:w-1/3">
                                <label className="text-xs font-medium">Section</label>
                                <select
                                    value={alloc.section}
                                    onChange={e => handleAllocationChange(itemIdx, allocIdx, "section", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Section</option>
                                    {holding.sections?.map(section => (
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
                                    onChange={e => handleAllocationChange(itemIdx, allocIdx, "sub_section", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Sub-Section</option>
                                    {holding.sub_sections
                                        ?.filter(sub => sub.section === alloc.section)
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
                                    onChange={e => handleAllocationChange(itemIdx, allocIdx, "bin", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                >
                                    <option value="">Select Bin</option>
                                    {holding.bins
                                        ?.filter(bin => bin.section === alloc.section && bin.sub_section === alloc.sub_section)
                                        .map(bin => (
                                            <option key={`${bin.section}-${bin.sub_section}-${bin.bins}`} value={bin.bins}>
                                                {bin.bins}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            {/* Allocated Qty */}
                            <div className="w-full sm:w-1/2">
                                <label className="text-xs font-medium">Allocated Qty</label>
                                <input
                                    type="number"
                                    value={alloc.allocated_qty}
                                    onChange={e => handleAllocationChange(itemIdx, allocIdx, "allocated_qty", e.target.value)}
                                    className="w-full p-2 border rounded-md text-sm bg-gray-50"
                                />
                            </div>
                            {/* Remove Button */}
                            {item.new_allocations.length > 1 && (
                                <button
                                    onClick={() => removeAllocation(itemIdx, allocIdx)}
                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                                >
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        onClick={() => addMoreAllocations(itemIdx)}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white font-semibold rounded-md shadow-sm hover:bg-blue-600 text-xs"
                    >
                        + Add More
                    </button>
                </div>
            ))}
            <div className="mt-4 flex justify-center gap-4">
                <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md shadow-sm hover:bg-blue-700 text-sm"
                >
                    Submit
                </button>
                <button
                    onClick={() => navigate("/holding")}
                    className="px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-sm hover:bg-gray-600 text-sm"
                >
                    Cancel
                </button>
            </div>
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
            {showDownloadButton && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md shadow-sm hover:bg-green-700 text-sm"
                    >
                        Download PDF
                    </button>
                </div>
            )}
            <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
        </div>
    );
};

export default HoldingDetails;