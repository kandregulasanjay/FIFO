import React, { useState, useEffect } from "react";
import Select from "react-select";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaChevronDown, FaChevronUp, FaTimes } from "react-icons/fa";
import { Input } from "@material-tailwind/react";
import {
    fetchCompanyInfo,
    fetchBusinessTypes,
    fetchLeadSources,
    fetchLeadTypes,
    fetchCustomerTypes,
    fetchRoles,
    submitQuoteData,
    fetchVariantsByBrand,
    fetchSubVariantsByBrandAndVariant,
    fetchModelYearsByBrandVariantAndSubVariant,
    fetchVehicleBrands,
} from "../../api/api";

const LeadCapturePage = () => {
    const [formData, setFormData] = useState({
        salesman: "",
        companyName: "",
        businessType: "",
        customerType: "",
        contactName: "",
        contactPhone: "",
        role: "",
        leadDate: "",
        overallComments: "",
        address1: "",
        address2: "",
        city: "",
        country: "Kuwait",
        postalCode: "",
        vehicleDetails: [
            {
                brand: "",
                variant: "",
                subVariant: "",
                modelYear: "",
                qty: "",
                additionalInfo: "",
            },
        ],
    });

    const [sections, setSections] = useState({
        companyDetails: false,
        contactDetails: false,
        vehicleDetails: false,
        leadDate: false,
        overallComments: true,
    });

    const [options, setOptions] = useState({
        companies: [],
        businessTypes: [],
        leadSources: [],
        leadTypes: [],
        customerTypes: [],
        roles: [],
        brands: [],
        variants: [],
        subVariants: [],
        modelYears: [],
    });

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [
                    companies,
                    businessTypes,
                    leadSources,
                    leadTypes,
                    customerTypes,
                ] = await Promise.all([
                    fetchCompanyInfo(),
                    fetchBusinessTypes(),
                    fetchLeadSources(),
                    fetchLeadTypes(),
                    fetchCustomerTypes(),
                ]);

                setOptions((prev) => ({
                    ...prev,
                    companies: companies.map((item) => ({ value: item.CompanyName, label: item.CompanyName })),
                    businessTypes: businessTypes.map((item) => ({ value: item.Type, label: item.Type })),
                    leadSources: leadSources.map((item) => ({ value: item.Source, label: item.Source })),
                    leadTypes: leadTypes.map((item) => ({ value: item.Type, label: item.Type })),
                    customerTypes: customerTypes.map((item) => ({ value: item.Type, label: item.Type })),
                }));
            } catch (error) {
                toast.error("Failed to fetch dropdown options. Please try again.");
            }
        };

        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const brands = await fetchVehicleBrands();
                setOptions((prev) => ({
                    ...prev,
                    brands: brands.map((item) => ({ value: item.Brand, label: item.Brand })),
                }));
            } catch (error) {
                toast.error("Failed to fetch brands. Please try again.");
            }
        };

        fetchOptions();
    }, []);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const roles = await fetchRoles();
                setOptions((prev) => {
                    console.log("Previous Options:", prev);
                    console.log("New Roles:", roles);
                    return {
                        ...prev,
                        roles: roles.map((item) => ({ value: item.RoleName, label: item.RoleName })),
                    };
                });
            } catch (error) {
                toast.error("Failed to fetch roles. Please try again.");
            }
        };

        fetchOptions();
    }, []);

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
    };

    const handleVehicleDetailChange = async (index, field, value) => {
        const updatedVehicleDetails = [...formData.vehicleDetails];
        updatedVehicleDetails[index][field] = value;

        // Reset dependent fields
        if (field === "brand") {
            updatedVehicleDetails[index].variant = "";
            updatedVehicleDetails[index].subVariant = "";
            updatedVehicleDetails[index].modelYear = "";
        } else if (field === "variant") {
            updatedVehicleDetails[index].subVariant = "";
            updatedVehicleDetails[index].modelYear = "";
        } else if (field === "subVariant") {
            updatedVehicleDetails[index].modelYear = "";
        }

        setFormData({ ...formData, vehicleDetails: updatedVehicleDetails });

        // Fetch dependent dropdown options
        try {
            if (field === "brand") {
                const variants = await fetchVariantsByBrand(value);
                setOptions((prev) => ({
                    ...prev,
                    variants: variants.map((item) => ({ value: item.Variant, label: item.Variant })),
                    subVariants: [],
                    modelYears: [],
                }));
            } else if (field === "variant") {
                const subVariants = await fetchSubVariantsByBrandAndVariant(updatedVehicleDetails[index].brand, value);
                setOptions((prev) => ({
                    ...prev,
                    subVariants: subVariants.map((item) => ({ value: item, label: item })),
                    modelYears: [],
                }));
            } else if (field === "subVariant") {
                const modelYears = await fetchModelYearsByBrandVariantAndSubVariant(
                    updatedVehicleDetails[index].brand,
                    updatedVehicleDetails[index].variant,
                    value
                );
                setOptions((prev) => ({
                    ...prev,
                    modelYears: modelYears.map((item) => ({ value: item, label: item })),
                }));
            }
        } catch (error) {
            toast.error("Failed to fetch dropdown options. Please try again.");
        }
    };

    const addVehicleDetail = () => {
        setFormData({
            ...formData,
            vehicleDetails: [
                ...formData.vehicleDetails,
                {
                    brand: "",
                    variant: "",
                    subVariant: "",
                    modelYear: "",
                    qty: "",
                    additionalInfo: "",
                },
            ],
        });
    };

    const removeVehicleDetail = (index) => {
        const updatedVehicleDetails = formData.vehicleDetails.filter((_, i) => i !== index);
        setFormData({ ...formData, vehicleDetails: updatedVehicleDetails });
    };

    const toggleSection = (section) => {
        setSections({ ...sections, [section]: !sections[section] });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await submitQuoteData(formData);
            toast.success(response.message);
        } catch (error) {
            toast.error("Failed to submit lead data. Please try again.");
        }
    };

    return (
        <div className="bg-white flex items-start justify-center min-h-screen">
            <div className="bg-white  py-2 w-full max-w-4xl">
                <h1 className="text-2xl font-bold text-gray-800 mb-2 text-center">Quotation</h1>
                <form onSubmit={handleSubmit} className="m-0">
                    {/* Company Details Section */}
                    <div className="w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                        <div className="mb-1 border overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => toggleSection("companyDetails")}
                                className="w-full flex justify-between items-center p-2.5 bg-white text-blue-700 font-semibold text-left"
                            >
                                Company Details
                                {sections.companyDetails ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {sections.companyDetails && (
                                <fieldset className="p-4 space-y-4">
                                    {/* <legend className="text-sm font-medium text-gray-700">Company Details</legend> */}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Company Name</label>
                                        <Select
                                            options={options.companies}
                                            value={options.companies.find(opt => opt.value === formData.companyName)}
                                            onChange={(selectedOption) => handleChange("companyName", selectedOption.value)}
                                            className="mt-1 w-full"
                                            placeholder="Select Company"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Business Type</label>
                                            <Select
                                                options={options.businessTypes}
                                                value={options.businessTypes.find(opt => opt.value === formData.businessType)}
                                                onChange={(selectedOption) => handleChange("businessType", selectedOption.value)}
                                                placeholder="Select Business Type"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Customer Type</label>
                                            <Select
                                                options={options.customerTypes}
                                                value={options.customerTypes.find(opt => opt.value === formData.customerType)}
                                                onChange={(selectedOption) => handleChange("customerType", selectedOption.value)}
                                                placeholder="Select Customer Type"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div >
                                            <label className="block text-sm font-medium text-gray-700">Address 1</label>
                                            <input
                                                type="text"
                                                 name="address1"
                                                value={formData.address1}
                                                onChange={(e) => handleChange("address1", e.target.value)}
                                                className="input w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Address 2</label>
                                            <input
                                                type="text"
                                                name="address2"
                                                value={formData.address2}
                                                onChange={(e) => handleChange("address2", e.target.value)}
                                                className="input w-full px-3 py-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city}
                                                onChange={(e) => handleChange("city", e.target.value)}
                                                className="input w-full px-4 py-1 border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div>
                                            {/* <label className="block text-sm font-medium text-gray-700">Country</label> */}
                                            <Input
                                            label="Country" color="purple" 
                                                // type="text"
                                                // name="country"
                                                value={formData.country}
                                                disabled
                                                onChange={(e) => handleChange("country", e.target.value)}
                                                className="input text"
                                                // placeholder="Country"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex w-72 flex-col gap-6">
                                        <Input
                                            label="Postal Code" color="purple"
                                            value={formData.postalCode}
                                            onChange={(e) => handleChange("postalCode", e.target.value)}
                                            // className="input"
                                            // placeholder="Postal Code"
                                        />
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    </div>

                    {/* Contact Details Section */}
                    <div className="w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                        <div className="mb-1 border overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => toggleSection("contactDetails")}
                                className="w-full flex justify-between items-center p-2.5 bg-white text-blue-700 font-semibold text-left"
                            >
                                Contact Details
                                {sections.contactDetails ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {sections.contactDetails && (
                                <fieldset className="p-4 space-y-4">
                                    {/* <legend className="text-sm font-medium text-gray-700">Contact Details</legend> */}
                                    <div className="space-y-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={formData.contactName}
                                                onChange={(e) => handleChange("contactName", e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter Contact Name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                                            <input
                                                type="text"
                                                name="contactPhone"
                                                value={formData.contactPhone}
                                                onChange={(e) => handleChange("contactPhone", e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                placeholder="Enter Contact Phone"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Role</label>
                                            <Select
                                                options={options.roles}
                                                value={options.roles.find((opt) => opt.value === formData.role)}
                                                onChange={(selectedOption) => handleChange("role", selectedOption.value)}
                                                placeholder="Select Role"
                                                className="mt-1"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    </div>

                    {/* Vehicle Details Section */}
                    <div className="w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                        <div className="mb-1 border overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => toggleSection("vehicleDetails")}
                                className="w-full flex justify-between items-center p-2.5 bg-white text-blue-700 font-semibold text-left"
                            >
                                Vehicle Details
                                {sections.vehicleDetails ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {sections.vehicleDetails && (
                                <fieldset className="p-4 space-y-4">
                                    {/* <legend className="text-sm font-medium text-gray-700">Vehicle Details</legend> */}
                                    {formData.vehicleDetails.map((vehicle, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Brand</label>
                                                <Select
                                                    options={options.brands}
                                                    value={options.brands.find((opt) => opt.value === vehicle.brand)}
                                                    onChange={(selectedOption) =>
                                                        handleVehicleDetailChange(index, "brand", selectedOption.value)
                                                    }
                                                    placeholder="Select Brand"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Variant</label>
                                                <Select
                                                    options={options.variants}
                                                    value={options.variants.find((opt) => opt.value === vehicle.variant)}
                                                    onChange={(selectedOption) =>
                                                        handleVehicleDetailChange(index, "variant", selectedOption.value)
                                                    }
                                                    placeholder="Select Variant"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Sub Variant</label>
                                                <Select
                                                    options={options.subVariants}
                                                    value={options.subVariants.find((opt) => opt.value === vehicle.subVariant)}
                                                    onChange={(selectedOption) =>
                                                        handleVehicleDetailChange(index, "subVariant", selectedOption.value)
                                                    }
                                                    placeholder="Select Sub Variant"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Model Year</label>
                                                <Select
                                                    options={options.modelYears}
                                                    value={options.modelYears.find((opt) => opt.value === vehicle.modelYear)}
                                                    onChange={(selectedOption) =>
                                                        handleVehicleDetailChange(index, "modelYear", selectedOption.value)
                                                    }
                                                    placeholder="Select Model Year"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Qty</label>
                                                <input
                                                    type="number"
                                                    value={vehicle.qty}
                                                    onChange={(e) =>
                                                        handleVehicleDetailChange(index, "qty", e.target.value)
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Enter Quantity"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Additional Info</label>
                                                <textarea
                                                    value={vehicle.additionalInfo}
                                                    onChange={(e) =>
                                                        handleVehicleDetailChange(index, "additionalInfo", e.target.value)
                                                    }
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                    placeholder="Enter Additional Info"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addVehicleDetail}
                                        className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                    >
                                        Add More Vehicle Details
                                    </button>
                                </fieldset>
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                        <div className="mb-1 border overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => toggleSection("leadDate")}
                                className="w-full flex justify-between items-center p-2.5 bg-white text-blue-700 font-semibold text-left"
                            >
                                Lead Date
                                {sections.leadDate ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {sections.leadDate && (
                                <fieldset className="p-2 space-y-4">
                                    <div className="space-y-4 mt-2">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Lead Date</label>
                                            <input
                                                type="date"
                                                name="leadDate"
                                                value={formData.leadDate}
                                                onChange={(e) => handleChange("leadDate", e.target.value)}
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    </div>

                    <div className="w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                        <div className="mb-1 border overflow-hidden bg-white">
                            <button
                                type="button"
                                onClick={() => toggleSection("overallComments")}
                                className="w-full flex justify-between items-center p-2.5 bg-white text-blue-700 font-semibold text-left"
                            >
                                Notes
                                {sections.overallComments ? <FaChevronUp /> : <FaChevronDown />}
                            </button>

                            {sections.overallComments && (
                                <fieldset className="p-2 space-y-4">
                                    <div className="space-y-4">
                                        <div>
                                            <textarea
                                                name="overallComments"
                                                value={formData.overallComments}
                                                onChange={(e) => handleChange("overallComments", e.target.value)}
                                                className="block border w-full h-24 rounded-md border-blue-500 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                                // placeholder="Enter Overall Comments"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                            )}
                        </div>
                    </div>

                    <div className=" flex align-center justify-center w-full max-w-2xl px-1 mx-auto sm:px-6 md:px-8">
                    <button
                        type="submit"
                        className=" m-auto mt-5 w-80 bg-blue-600 text-white py-2 px-4 rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Submit
                    </button>
                    </div>                    
                </form>
                <ToastContainer />
            </div>
        </div>
    );
};

export default LeadCapturePage;