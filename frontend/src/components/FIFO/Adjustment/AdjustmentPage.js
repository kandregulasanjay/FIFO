import React, { useState, useEffect } from "react";
import { saveAdjustment, fetchItemMasterData, fetchBinData } from "../../../api/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select"; 

const AdjustmentPage = () => {
    const [formData, setFormData] = useState({
        store: "",
        type: "",
        line_id: "",
        make: null,
        item_code: null,
        batch_number: "", 
        bin_location: null,
        quantity: "",
        status: ""
    });

    const [dropdownOptions, setDropdownOptions] = useState({
        makeOptions: [],
        itemCodeOptions: [],
        binLocationOptions: []
    });

    useEffect(() => {
        // Fetch data for make and item_code
        fetchItemMasterData()
            .then(data => {
                const makeOptions = [...new Set(data.map(item => item.make))].map(make => ({
                    value: make,
                    label: make
                }));
                const itemCodeOptions = [...new Set(data.map(item => item.item_code))].map(item_code => ({
                    value: item_code,
                    label: item_code
                }));

                setDropdownOptions(prevOptions => ({
                    ...prevOptions,
                    makeOptions,
                    itemCodeOptions
                }));
            })
            .catch(error => {
                toast.error("Error fetching item master data");
                console.error("Error fetching item master data:", error);
            });

        // Fetch data for bin_location
        fetchBinData()
            .then(data => {
                const binLocationOptions = [...new Set(data.map(item => item.bin_location))].map(bin_location => ({
                    value: bin_location,
                    label: bin_location
                }));

                setDropdownOptions(prevOptions => ({
                    ...prevOptions,
                    binLocationOptions
                }));
            })
            .catch(error => {
                toast.error("Error fetching bin master data");
                console.error("Error fetching bin master data:", error);
            });
    }, []);

    const handleDropdownChange = (selectedOption, field) => {
        setFormData({
            ...formData,
            [field]: selectedOption
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Validate all fields
        for (const [key, value] of Object.entries(formData)) {
            if (!value || (typeof value === "object" && !value.value)) {
                toast.error(`Please fill out the ${key.replace("_", " ")} field.`);
                return;
            }
        }
        try {
            const payload = {
                ...formData,
                make: formData.make.value,
                item_code: formData.item_code.value,
                bin_location: formData.bin_location.value
            };
            await saveAdjustment(payload);
            toast.success("Adjustment saved successfully!");
            setFormData({
                store: "", // <-- Reset store field
                type: "",
                line_id: "",
                make: null,
                item_code: null,
                batch_number: "", 
                bin_location: null,
                quantity: "",
                status: ""
            });
        } catch (error) {
            toast.error("Error saving adjustment");
        }
    };

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100">
            <div className="p-8 w-full max-w-4xl bg-white shadow-2xl rounded-lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Store <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="store"
                                value={formData.store}
                                onChange={handleInputChange}
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter Store"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Type <span className="text-red-500">*</span>
                            </label>
                            <select
                                name="type"
                                value={formData.type}
                                onChange={handleInputChange}
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="" disabled>Select Type</option>
                                <option value="Receipt">Receipt</option>
                                <option value="Issue">Issue</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Line ID <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="line_id"
                                value={formData.line_id}
                                onChange={handleInputChange}
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Make <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={dropdownOptions.makeOptions}
                                value={formData.make}
                                onChange={(selectedOption) => handleDropdownChange(selectedOption, "make")}
                                placeholder="Select Make"
                                isClearable
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Item Code <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={dropdownOptions.itemCodeOptions}
                                value={formData.item_code}
                                onChange={(selectedOption) => handleDropdownChange(selectedOption, "item_code")}
                                placeholder="Select Item Code"
                                isClearable
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Batch Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="batch_number"
                                value={formData.batch_number}
                                onChange={handleInputChange}
                                placeholder="Enter Batch Number"
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Bin Location <span className="text-red-500">*</span>
                            </label>
                            <Select
                                options={dropdownOptions.binLocationOptions}
                                value={formData.bin_location}
                                onChange={(selectedOption) => handleDropdownChange(selectedOption, "bin_location")}
                                placeholder="Select Bin Location"
                                isClearable
                                className="w-full"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-lg font-medium text-gray-700">
                                Status <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full p-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>
                    <div className="flex justify-center">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-md shadow-sm hover:bg-indigo-600 text-sm"
                        >
                            Submit
                        </button>
                    </div>
                </form>
                <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} />
            </div>
        </div>
    );
};

export default AdjustmentPage;
