import axios from "axios";
import { showSessionTimeoutPopup } from '../components/FIFO/Auth/SessionTimeoutPopup';

const apiUrl = "http://localhost:5000";

const axiosInstance = axios.create({
    baseURL: apiUrl,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            error.response?.status === 401 &&
            error.response?.data?.message === 'Session expired. Please log in again.' &&
            window.location.pathname !== '/auth'
        ) {
            showSessionTimeoutPopup("Your session has expired. Please log in again.", true);
        }
        return Promise.reject(error);
    }
);

export const fetchPickslipReportData = async () => {
    try {
        const response = await axiosInstance.get(`/pickslip/getPickslipReportData`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching pickslip report data");
    }
};

export const fetchPendingOrders = async (date) => {
    try {
        console.log(`Sending date parameter to API: ${date}`);
        const response = await axiosInstance.get(`/pickslip/pendingOrders`, {
            params: { date },
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching pending orders");
    }
};

export const fetchOrderDetails = async (pickslipNumber) => {
    try {
        const response = await axiosInstance.get(`/pickslip/${pickslipNumber}`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching order details");
    }
};

export const completeOrder = async (pickslipNumber) => {
    try {
        const response = await axiosInstance.post(`/pickslip/complete`, { pickslipNumber });
        return response.data;
    } catch (error) {
        console.error('Some items are not available for allocation.' || error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Some items are not available for allocation");
    }
};

export const fetchOrderAllocations = async (date) => {
    try {
        console.log(`Sending date parameter to API: ${date}`);
        const response = await axiosInstance.get(`/pickslip-allocations`, {
            params: { date },
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching order allocations");
    }
};

export const fetchPendingReceipts = async (date) => {
    try {
        console.log(`Sending date parameter to API: ${date}`);
        const response = await axiosInstance.get(`/api/receipts`, {
            params: { date },
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching pending receipts");
    }
};

export const fetchReceiptDetails = async (receiptNumber) => {
    try {
        const response = await axiosInstance.get(`/api/receipts/${receiptNumber}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching receipt details for ${receiptNumber}:`, error.response?.data || error.message);
        throw new Error("Error fetching pending receipt details");
    }
};

export const saveAllocation = async (receiptNumber, batches) => {
    try {
        const response = await axiosInstance.post(`/api/receipts/allocation`, {
            receipt_number: receiptNumber,
            batches: batches
        });
        return response.data;
    } catch (error) {
        console.error("Error updating bin allocation:", error.response?.data || error.message);
        throw new Error("Error updating bin allocation");
    }
};

export const fetchReceiptAllocations = async (date) => {
    try {
        console.log(`Sending date parameter to API: ${date}`);
        const response = await axiosInstance.get(`/receipt-allocations`, {
            params: { date },
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching receipt allocations");
    }
};

export const fetchViewData = async () => {
    try {
        const response = await axiosInstance.get(`/api/view`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching view data");
    }
};


export const fetchItemMasterData = async () => {
    try {
        const response = await axiosInstance.get(`/api/item_master`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching item master data");
    }
};

export const fetchBinData = async () => {
    try {
        const response = await axiosInstance.get(`/api/bin_master`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching item master data");
    }
};

export const updateOrderStatus = async (pickslipNumber, pickslipStatus) => {
    const response = await axiosInstance.post(`/api/updateOrderStatus`, { pickslipNumber, pickslipStatus });
    return response.data;
};

export const fetchAvailability = async () => {
    try {
        const response = await axiosInstance.get(`/api/availability`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching availability data");
    }
};

export const fetchCompletedTransfer = async () => {
    try {
        const response = await axiosInstance.get(`/api/completed-transfers`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching Transfer table data");
    }
};

export const saveTransfer = async (transferData) => {
    try {
        const response = await axiosInstance.post(`/api/transfer`, transferData);
        return response.data;
    } catch (error) {
        throw new Error("Error saving transfer data");
    }
};

export const fetchBinMasterData = async () => {
    try {
        const response = await axiosInstance.get(`/api/bin-master`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching bin master data");
    }
};

export const fetchHoldingData = async () => {
    try {
        const response = await axiosInstance.get(`/api/holding`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching holding data");
    }
};

export const fetchHoldingDetails = async (invoiceNumber) => {
    try {
        const response = await axiosInstance.get(`/api/holding/${invoiceNumber}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching holding details for ${invoiceNumber}:`, error.response?.data || error.message);
        throw new Error("Error fetching holding details");
    }
};

export const fetchCompletedHoldingData = async () => {
    try {
        const response = await axiosInstance.get(`/api/completed-holding`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching completed holding data");
    }
};

export const saveHoldingTransfer = async (transferData) => {
    try {
        const response = await axiosInstance.post(`/api/holding/transfer`, transferData);
        return response.data;
    } catch (error) {
        console.error("Error saving holding transfer data:", error.response?.data || error.message);
        throw new Error("Error saving holding transfer data");
    }
};

export const saveAdjustment = async (adjustmentData) => {
    try {
        const response = await axiosInstance.post(`/api/adjustment`, adjustmentData);
        return response.data;
    } catch (error) {
        throw new Error("Error saving adjustment data");
    }
};

export const fetchHoldingViewData = async () => {
    try {
        const response = await axiosInstance.get(`/api/holding-view`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching holding data");
    }
};

export const getReceiptsPDF = async (receiptNumber) => {
    try {
        const response = await axiosInstance.get(`/api/getReceiptForPDF/${receiptNumber}`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching receipt data");
    }
}

export const getPickslipPDF = async (pickslipNumber) => {
    try {
        console.log(`Fetching pickslip PDF for: ${pickslipNumber}`);
        const response = await axiosInstance.get(`/pickslip/getPickslipForPDF/${pickslipNumber}`);
        console.log("Pickslip PDF response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching pickslip data:", error);
        throw new Error("Error fetching pickslip data");
    }
};

export const getHoldingPDF = async (invoice_number) => {
    try {
        const response = await axiosInstance.get(`/api/holding/pdf/${invoice_number}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching holding PDF data:", error.response?.data || error.message);
        throw new Error("Error fetching holding PDF data");
    }
};

export const getLatestHoldingPDF = async (invoice_number) => {
    try {
        const response = await axiosInstance.get(`/api/holding/pdf/latest/${invoice_number}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching latest holding PDF data:", error.response?.data || error.message);
        throw new Error("Error fetching latest holding PDF data");
    }
};

export const loginUser = async (username, password) => {
    try {
        const response = await axiosInstance.post(`/auth/login`, { username, password });
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Error logging in');
    }
};

export const logUserAction = async (action) => {
    try {
        await axiosInstance.post('/api/log-action', { action });
        console.log(`Action logged: ${action}`);
    } catch (error) {
        console.error('Error logging user action:', error.message);
    }
};

export const logoutUser = async () => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        throw new Error('Error logging out');
    }
};

export const updateReceiptDetails = async (receiptNumber, receiptStatus, receiptType, receiptComment) => {
    try {
        const response = await axiosInstance.post(`/api/receipts/update`, {
            receipt_number: receiptNumber,
            receipt_status: receiptStatus,
            receipt_type: receiptType,
            receipt_comment: receiptComment,
        });
        return response.data;
    } catch (error) {
        console.error("Error in updateReceiptDetails API:", error.response?.data || error.message);
        throw new Error(error.response?.data?.error || "Error updating receipt details");
    }
};

export const fetchReserveData = async () => {
    try {
        const response = await axiosInstance.get(`/api/reserve`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching reserve data");
    }
};

export const fetchReserveReleaseData = async () => {
    try {
        const response = await axiosInstance.get(`/api/reserve-release`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching reserve data");
    }
};

export const transferReserve = async (receiptNumber) => {
    try {
        const response = await axiosInstance.post(`/api/reserve/transfer`, { receipt_number: receiptNumber });
        return response.data;
    } catch (error) {
        throw new Error("Error transferring reserve");
    }
};


//FORMS

export const fetchFormSpecifications = (formTypeId, formName) => {
    return axiosInstance.get(`/api/form-specifications`, {
        params: { formTypeId, formName },
    });
};

export const fetchDropdownOptions = (fieldName) => {
    return axiosInstance.get(`/api/dropdown-options`, {
        params: { fieldName },
    });
};

export const fetchFormDetails = (formName) => {
    return axiosInstance.get(`/api/form-details`, {
        params: { formName },
    });
};

export const fetchFormData = (formName, uniqueId) => {
    return axiosInstance.get(`/api/form-data`, {
        params: { formName, uniqueId },
    });
};

export const submitForm = (payload) => {
    return axiosInstance.post(`/api/forms/submit`, payload, {
        headers: { "Content-Type": "application/json" },
    });
};

export const updateForm = (payload) => {
    return axiosInstance.post(`/api/forms/update`, payload, {
        headers: { "Content-Type": "application/json" },
    });
};

export const searchFormData = (formName, searchValue) => {
    return axiosInstance.get(`/api/search-form-data`, {
        params: { formName, searchValue },
    });
};


//FormSelector
export const FORM_API = {
    SIMPLE_FORM_MENUS: `${apiUrl}/api/simpleform-menu-names`,
    SURVEY_FORM_MENUS: `${apiUrl}/api/surveyform-menu-names`,
    SIMPLE_FORM_NAMES: `${apiUrl}/api/simple-form-names`,
    SURVEY_FORM_NAMES: `${apiUrl}/api/survey-form-names`,
};

export const fetchFormNames = async () => {
    try {
        const response = await axiosInstance.get(`/api/simple-form-names`);
        return response.data;
    } catch (error) {
        console.error("Error fetching simple form names:", error.message);
        throw new Error("Error fetching simple form names");
    }
};

export const fetchSurveyFormNames = async () => {
    try {
        const response = await axiosInstance.get(`/api/survey-form-names`);
        return response.data;
    } catch (error) {
        console.error("Error fetching survey form names:", error.message);
        throw new Error("Error fetching survey form names");
    }
};

export const fetchSimpleFormMenus = async () => {
    try {
        const response = await axiosInstance.get(`/api/simpleform-menu-names`);
        return response.data.map((item) => item.Menu); // Return only menu names
    } catch (error) {
        console.error("Error fetching simple form menus:", error.message);
        throw new Error("Error fetching simple form menus");
    }
};

export const fetchSurveyFormMenus = async () => {
    try {
        const response = await axiosInstance.get(`/api/surveyform-menu-names`);
        return response.data.map((item) => item.Menu); // Return only menu names
    } catch (error) {
        console.error("Error fetching survey form menus:", error.message);
        throw new Error("Error fetching survey form menus");
    }
};

//SurveyForms
export const fetchSurveySpecifications = async (formTypeId, surveyFormName) => {
    return axiosInstance.get(`/api/survey-form-specifications`, {
        params: { formTypeId, surveyFormName },
    });
};

export const submitSurveyFormData = async (surveyFormName, formData, phoneNumber) => {
    return axiosInstance.post(`/api/survey-forms/submit`, {
        surveyFormName,
        formData,
        phoneNumber,
    });
};


//Reports
export const fetchReportMenus = async () => {
    try {
        const response = await axiosInstance.get(`/api/report-menus`);
        return response.data;
    } catch (error) {
        console.error("Error fetching report menus:", error.message);
        throw new Error("Error fetching report menus");
    }
}

// Fetch all reports
export const fetchReports = async () => {
    try {
        const response = await axiosInstance.get("/api/reports");
        return response.data;
    } catch (error) {
        console.error("Error fetching reports:", error.message);
        throw error;
    }
};

// Run a report query
export const runReportQuery = async (reportId, filters) => {
    try {
        const response = await axiosInstance.post(`/api/report/${reportId}`, filters);
        return response.data;
    } catch (error) {
        console.error("Error running report query:", error.message);
        throw error;
    }
};

export const fetchFilterOptions = async (field, table) => {
    try {
        const response = await axiosInstance.get(`/api/filter-options`, {
            params: { field, table },
        });
        return response.data;
    } catch (error) {
        console.error(`Error fetching filter options for field ${field} in table ${table}:`, error.message);
        throw error;
    }
};


// Fetch all manual reports
export const fetchManualReports = async (filters) => {
    try {
        const response = await axiosInstance.get('/api/receiptsss', {
            params: filters,
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching manual reports:', error.message);
        throw new Error('Failed to fetch manual reports');
    }
};

export const fetchItemCodes = async () => {
    try {
        const response = await axiosInstance.get('/api/item-codesss');
        return response.data;
    } catch (error) {
        console.error('Error fetching item codes:', error.message);
        throw new Error('Failed to fetch item codes');
    }
};

// Fetch Business Types
export const fetchBusinessTypes = async () => {
    try {
        const response = await axiosInstance.get("/api/business-types");
        return response.data;
    } catch (error) {
        console.error("Error fetching business types:", error.message);
        throw new Error("Failed to fetch business types");
    }
};

// Fetch Lead Sources
export const fetchLeadSources = async () => {
    try {
        const response = await axiosInstance.get("/api/lead-sources");
        return response.data;
    } catch (error) {
        console.error("Error fetching lead sources:", error.message);
        throw new Error("Failed to fetch lead sources");
    }
};

// Fetch Lead Types
export const fetchLeadTypes = async () => {
    try {
        const response = await axiosInstance.get("/api/lead-types");
        return response.data;
    } catch (error) {
        console.error("Error fetching lead types:", error.message);
        throw new Error("Failed to fetch lead types");
    }
};

// Fetch Customer Types
export const fetchCustomerTypes = async () => {
    try {
        const response = await axiosInstance.get("/api/customer-types");
        return response.data;
    } catch (error) {
        console.error("Error fetching customer types:", error.message);
        throw new Error("Failed to fetch customer types");
    }
};

// Fetch Vehicle Models
export const fetchVehicleModels = async () => {
    try {
        const response = await axiosInstance.get("/api/vehicle-models");
        return response.data;
    } catch (error) {
        console.error("Error fetching vehicle models:", error.message);
        throw new Error("Failed to fetch vehicle models");
    }
};

// Submit Lead Data
export const submitLeadData = async (formData) => {
    try {
        const response = await axiosInstance.post("/api/create-lead", formData);
        return response.data;
    } catch (error) {
        console.error("Error submitting lead data:", error.message);
        throw new Error("Failed to submit lead data");
    }
};

// Fetch Company Info
export const fetchCompanyInfo = async () => {
    try {
        const response = await axiosInstance.get("/api/company-info");
        return response.data;
    } catch (error) {
        console.error("Error fetching company info:", error.message);
        throw new Error("Failed to fetch company info");
    }
};

// Fetch Roles of Contact Details
export const fetchRoles = async () => {
    try {
        const response = await axiosInstance.get("/api/roles");
        console.log("Roles Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching roles:", error);
        return [];
    }
};

export const fetchVehicleBrands = async () => {
    try {
        const response = await axiosInstance.get("/api/vehicle-brands");
        return response.data; // Ensure this matches the backend response format
    } catch (error) {
        console.error("Error fetching vehicle brands:", error);
        return [];
    }
};

export const fetchVariantsByBrand = async (brand) => {
    try {
        const response = await axiosInstance.get("/api/vehicle-variants", { params: { brand } });
        return response.data; // Ensure this returns the array of variants
    } catch (error) {
        console.error("Error fetching variants by brand:", error);
        return [];
    }
};
export const fetchSubVariantsByBrandAndVariant = async (brand, variant) => {
    try {
        const response = await axiosInstance.get("/api/vehicle-subvariants", { params: { brand, variant } });
        return response.data.map((item) => item.SubVariant); // Map to extract SubVariant values
    } catch (error) {
        console.error("Error fetching sub-variants by brand and variant:", error);
        return [];
    }
};

export const fetchModelYearsByBrandVariantAndSubVariant = async (brand, variant, subVariant) => {
    try {
        const response = await axiosInstance.get("/api/vehicle-modelyears", { params: { brand, variant, subVariant } });
        return response.data.map((item) => item.ModelYear); // Map to extract ModelYear values
    } catch (error) {
        console.error("Error fetching model years by brand, variant, and sub-variant:", error);
        return [];
    }
};

//PendingLeadsPage

export const fetchPendingLeads = async (date) => {
    try {
        console.log(`Sending date parameter to API: ${date}`);
        const response = await axiosInstance.get(`/api/leads`, {
            params: { date },
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching pending leads");
    }
};

export const updateleadsdetails = async (LeadID, leadStatus, leadType, leadFollowupDate, leadComment) => {
    if (!LeadID) {
        console.error("LeadID is missing or invalid");
        throw new Error("LeadID is missing or invalid");
    }

    try {
        const response = await axiosInstance.post(`/api/leads/update`, {
            LeadID: LeadID,
            lead_status: leadStatus,
            lead_type: leadType,
            lead_followup_date: leadFollowupDate,
            lead_comment: leadComment,
        });
        return response.data;
    } catch (error) {
        console.error("Error in updateleadsdetails API:", error.response?.data || error.message);
        throw new Error("Failed to update lead details");
    }
};

export const fetchDropdownData = async () => {
    try {
        const response = await axiosInstance.get("/api/dropdown-data");
        console.log("Dropdown data fetched:", response.data);
        return response.data;
    } catch (error) {
        console.error("Error fetching dropdown data:", error);
        return [];
    }
};

export const submitQuoteData = async (formData) => {
    try {
        const response = await axiosInstance.post("/api/create-quote", formData);
        return response.data;
    } catch (error) {
        console.error("Error submitting quote data:", error.message);
        throw new Error("Failed to submit quote data");
    }
};


//Exception

export const fetchPickslipExceptionData = async (pickslipNumber) => {
    try {
        const response = await axiosInstance.get(`/api/pickslip-exception`, {
            params: pickslipNumber ? { pickslip_number: pickslipNumber } : {},
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching picklsip exception data");
    }
};

export const fetchReceiptExceptionData = async (receiptNumber) => {
    try {
        const response = await axiosInstance.get(`/api/receipt-exception`, {
            params: receiptNumber ? { receipt_number: receiptNumber } : {},
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching receipt controller data");
    }
};

export const fetchHoldingReportData = async (incoiceNumber) => {
    try {
        const response = await axiosInstance.get(`/api/holding-report`, {
            params: incoiceNumber ? { invoice_number: incoiceNumber } : {},
        });
        return response.data;
    } catch (error) {
        throw new Error("Error fetching Holding report controller data");
    }
};

//HoldingTransfer
export const fetchHoldingTransferAvailability = async () => {
    try {
        const response = await axiosInstance.get(`/api/availability`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching availability data");
    }
};

export const fetchHoldingTransferCompleted = async () => {
    try {
        const response = await axiosInstance.get(`/api/completed-holdingtransfers`);
        return response.data;
    } catch (error) {
        throw new Error("Error fetching Transfer table data");
    }
};

export const submitHoldingTransfer = async (transferData) => {
    try {
        const response = await axiosInstance.post(`/api/holdingtransfer`, transferData);
        return response.data;
    } catch (error) {
        throw new Error("Error saving transfer data");
    }
};