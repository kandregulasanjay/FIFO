import React, { useEffect, useState } from 'react';
import { fetchPendingLeads, updateleadsdetails } from '../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';

const PendingLeads = () => {
    const [leads, setLeads] = useState([]);
    const [leadFields, setLeadFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedLead, setSelectedLead] = useState(null);
    const leadsPerPage = 10;
    const navigate = useNavigate();

    const fetchPendingLeadsData = async () => {
        try {
            const data = await fetchPendingLeads();
            setLeads(data);
            if (data.length > 0) {
                setLeadFields(Object.keys(data[0]).filter(field => !["lead_status", "lead_type", "lead_comment"].includes(field)));
            }
        } catch (error) {
            toast.error('Error fetching pending leads');
        }
    };

    const handleFieldChange = async (LeadID, field, value, saveImmediately = true) => {
        const updatedLeads = leads.map((lead) =>
            lead.LeadID === LeadID
                ? { ...lead, [field]: value || null }
                : lead
        );
        setLeads(updatedLeads);

        if (saveImmediately) {
            try {
                const updatedLead = updatedLeads.find((r) => r.LeadID === LeadID);

                if (!updatedLead) {
                    throw new Error(`Lead with ID ${LeadID} not found`);
                }

                const lead_status = updatedLead.lead_status;
                const lead_type = updatedLead.lead_type;
                const lead_followup_date = updatedLead.lead_followup_date || null;
                const lead_comment = updatedLead.lead_comment || "";

                const response = await updateleadsdetails(
                    updatedLead.LeadID,
                    lead_status,
                    lead_type,
                    lead_followup_date,
                    lead_comment
                );

                if (response && response.success) {
                    toast.success("Lead details updated successfully!");
                } else {
                    throw new Error(response?.message || "Failed to save lead details");
                }
            } catch (error) {
                console.error("Error saving lead details:", error);
                toast.error(error.message || "Error saving lead details");
            }
        }
    };

    useEffect(() => {
        fetchPendingLeadsData();
    }, []);

    const indexOfLastLead = currentPage * leadsPerPage;
    const indexOfFirstLead = indexOfLastLead - leadsPerPage;
    const currentLeads = leads.slice(indexOfFirstLead, indexOfLastLead);
    const totalPages = Math.ceil(leads.length / leadsPerPage);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Pending Leads</h2>
            </div>

            {leads.length === 0 ? (
                <p className="text-center text-gray-500">No pending leads found</p>
            ) : (
                <>
                    {/* Card View for Mobile */}
                    <div className="grid grid-cols-1 gap-4">
                        {currentLeads.map((lead, index) => (
                            <div
                                key={index}
                                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg rounded-lg p-4 relative"
                            >
                                {/* Three Dots Menu */}
                                <Menu as="div" className="absolute top-2 right-2">
                                    <Menu.Button className="text-white hover:text-gray-300">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            strokeWidth={2}
                                            stroke="currentColor"
                                            className="w-6 h-6"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                d="M12 6v.01M12 12v.01M12 18v.01"
                                            />
                                        </svg>
                                    </Menu.Button>
                                    <Transition
                                        enter="transition duration-100 ease-out"
                                        enterFrom="transform scale-95 opacity-0"
                                        enterTo="transform scale-100 opacity-100"
                                        leave="transition duration-75 ease-out"
                                        leaveFrom="transform scale-100 opacity-100"
                                        leaveTo="transform scale-95 opacity-0"
                                    >
                                        <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <button
                                                        onClick={() => setSelectedLead(lead)}
                                                        className={`${
                                                            active ? 'bg-gray-100' : ''
                                                        } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                                                    >
                                                        Show Lead Details
                                                    </button>
                                                )}
                                            </Menu.Item>
                                        </Menu.Items>
                                    </Transition>
                                </Menu>

                                {/* Card Content */}
                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold mb-2">Company Details</h3>
                                    <p className="text-sm"><strong>Company Name:</strong> {lead.CompanyName}</p>
                                    <p className="text-sm"><strong>Vehicle:</strong> {lead.Vehicle}</p>
                                    <p className="text-sm"><strong>Quantity:</strong> {lead.Quantity}</p>
                                    <p className="text-sm"><strong>Contact:</strong> {lead.Contact}</p>
                                    <p className="text-sm"><strong>Lead Type:</strong> {lead.LeadType}</p>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-2">Lead Details</h3>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium">Lead Status</label>
                                        <select
                                            value={lead.lead_status || ""}
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_status", e.target.value)
                                            }
                                            className="w-full p-2 border rounded-md text-black"
                                        >
                                            <option value="" disabled>Select</option>
                                            <option value="Release">Release</option>
                                            <option value="Reserve">Reserve</option>
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium">Lead Type</label>
                                        <select
                                            value={lead.lead_type || ""}
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_type", e.target.value)
                                            }
                                            className="w-full p-2 border rounded-md text-black"
                                        >
                                            <option value="" disabled>Select</option>
                                            <option value="Release">Release</option>
                                            <option value="Inspection">Inspection</option>
                                            <option value="Customer">Customer</option>
                                        </select>
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium">Follow-up Date</label>
                                        <input
                                            type="date"
                                            value={
                                                lead.lead_followup_date
                                                    ? lead.lead_followup_date.split('T')[0]
                                                    : ""
                                            }
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_followup_date", e.target.value, false)
                                            }
                                            onBlur={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_followup_date", e.target.value)
                                            }
                                            className="w-full p-2 border rounded-md text-black"
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="block text-sm font-medium">Lead Comment</label>
                                        <input
                                            type="text"
                                            value={lead.lead_comment || ""}
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_comment", e.target.value, false)
                                            }
                                            onBlur={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_comment", e.target.value)
                                            }
                                            className="w-full p-2 border rounded-md text-black"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Modal for Lead Details */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white rounded-lg p-6 w-96">
                        <h3 className="text-lg font-semibold mb-4">Lead Details</h3>
                        <p><strong>Company Name:</strong> {selectedLead.CompanyName}</p>
                        <p><strong>Vehicle:</strong> {selectedLead.Vehicle}</p>
                        <p><strong>Quantity:</strong> {selectedLead.Quantity}</p>
                        <p><strong>Contact:</strong> {selectedLead.Contact}</p>
                        <p><strong>Lead Type:</strong> {selectedLead.LeadType}</p>
                        <button
                            onClick={() => setSelectedLead(null)}
                            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md"
                        >
                            Close
                        </button>
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

export default PendingLeads;
