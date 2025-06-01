import React, { useEffect, useState } from 'react';
import { fetchPendingLeads, updateleadsdetails } from '../../api/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

const PendingLeads = () => {
    const [leads, setLeads] = useState([]);
    const [leadFields, setLeadFields] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
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
                <div className="overflow-x-auto bg-white rounded-lg shadow-md">
                    <table className="min-w-full text-sm text-gray-700 border border-gray-300 rounded-lg">
                        <thead className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                            <tr>
                                {leadFields.map((field) => (
                                    <th key={field} className="py-4 px-6 capitalize text-center font-semibold border-b border-gray-300">
                                        {field.replace(/_/g, " ")}
                                    </th>
                                ))}
                                <th className="py-4 px-6 text-center">Lead Status</th>
                                <th className="py-4 px-6 text-center">Lead Type</th>
                                <th className="py-4 px-6 text-center">Lead Notes</th>
                                <th className="py-4 px-6 text-center">Follow-up Date</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentLeads.map((lead, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50 transition-all">
                                    {leadFields.map((field) => (
                                        <td key={field} className="py-3 px-6 border-b border-gray-300 text-center">
                                            {field === "LeadID" ? (
                                                <button
                                                    onClick={() => navigate(`/lead-capture/${lead[field]}`)}
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
                                        <select
                                            value={lead.lead_status || ""} // Display existing data
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_status", e.target.value) // Save or update
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
                                            value={lead.lead_type || ""} // Display existing data
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_type", e.target.value) // Save or update
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
                                            value={lead.lead_comment || ""} // Display existing data
                                            onChange={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_comment", e.target.value, false) // Save or update
                                            }
                                            onBlur={(e) =>
                                                handleFieldChange(lead.LeadID, "lead_comment", e.target.value) // Save or update
                                            }
                                            className="p-2 border rounded-md"
                                        />
                                    </td>
                                    <td className="py-3 px-6 text-center">
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
                                            className="p-2 border rounded-md"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
