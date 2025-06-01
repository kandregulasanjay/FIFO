import React, { useEffect, useState } from 'react';
import { fetchPendingLeads, updateleadsdetails } from '../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Menu, Transition } from '@headlessui/react';

const PendingLeads = () => {
    const [leads, setLeads] = useState([]);
    const [leadFields, setLeadFields] = useState([]); // Dynamically track fields
    const [selectedLeadId, setSelectedLeadId] = useState(null);
    const leadsPerPage = 10;

    const fetchPendingLeadsData = async () => {
        try {
            const data = await fetchPendingLeads();
            setLeads(data);

            // Dynamically extract fields from the first lead
            if (data.length > 0) {
                setLeadFields(Object.keys(data[0]));
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

    const indexOfLastLead = leadsPerPage;
    const currentLeads = leads.slice(0, indexOfLastLead);

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold hidden sm:block">Pending Leads</h2>
            </div>

            {leads.length === 0 ? (
                <p className="text-center text-gray-500">No pending leads found</p>
            ) : (
                <>
                    {/* Table View for Desktop and Tablet */}
                    <div className="hidden sm:block overflow-x-auto bg-white rounded-lg shadow-md">
                        <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                            <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                <tr>
                                    {leadFields.map((field) => (
                                        <th
                                            key={field}
                                            className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300"
                                        >
                                            {field.replace(/_/g, ' ')}
                                        </th>
                                    ))}
                                    <th className="py-4 px-6 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentLeads.map((lead) => (
                                    <tr key={lead.LeadID} className="border-b hover:bg-gray-50 transition-all">
                                        {leadFields.map((field) => (
                                            <td key={field} className="py-3 px-6 text-center">
                                                {field === 'LeadID' ? (
                                                    <button
                                                        onClick={() => setSelectedLeadId(lead[field])}
                                                        className="text-blue-500 underline"
                                                    >
                                                        {lead[field]}
                                                    </button>
                                                ) : (
                                                    lead[field]
                                                )}
                                            </td>
                                        ))}
                                        <td className="py-3 px-6 text-center">
                                            <button
                                                onClick={() => setSelectedLeadId(lead.LeadID)}
                                                className="text-blue-500 underline"
                                            >
                                                Show Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Card View for Mobile */}
                    <div className="block sm:hidden grid grid-cols-1 gap-4">
                        {currentLeads.map((lead) => (
                            <div
                                key={lead.LeadID}
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
                                                        onClick={() => setSelectedLeadId(lead.LeadID)}
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

                                {/* Lead Details (conditionally rendered) */}
                                {selectedLeadId === lead.LeadID && (
                                    <div className="bg-white text-black rounded-lg p-4 mt-4 shadow-md relative">
                                        <button
                                            onClick={() => setSelectedLeadId(null)}
                                            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                strokeWidth={2}
                                                stroke="currentColor"
                                                className="w-5 h-5"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    d="M6 18L18 6M6 6l12 12"
                                                />
                                            </svg>
                                        </button>
                                        <h3 className="text-lg font-semibold mb-2">Lead Details</h3>
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium">Lead Status</label>
                                            <select
                                                value={lead.lead_status || ""}
                                                onChange={(e) =>
                                                    handleFieldChange(lead.LeadID, "lead_status", e.target.value)
                                                }
                                                className="w-full p-2 border rounded-md"
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
                                                className="w-full p-2 border rounded-md"
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
                                                className="w-full p-2 border rounded-md"
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
                                                className="w-full p-2 border rounded-md"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            <ToastContainer />
        </div>
    );
};

export default PendingLeads;
