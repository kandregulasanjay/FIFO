const express = require("express");
const router = express.Router();
const LeadCaptureController = require("../../controllers/FLEET/LeadCaptureController");

// Route to create a new lead
router.post("/create-lead", LeadCaptureController.createLead);

// Route to fetch business types
router.get("/business-types", LeadCaptureController.getBusinessTypes);

// Route to fetch lead sources
router.get("/lead-sources", LeadCaptureController.getLeadSources);

// Route to fetch lead types
router.get("/lead-types", LeadCaptureController.getLeadTypes);

// Route to fetch customer types
router.get("/customer-types", LeadCaptureController.getCustomerTypes);

// Route to fetch vehicle models
router.get("/vehicle-models", LeadCaptureController.getVehicleModels);

// Route to fetch company info
router.get("/company-info", LeadCaptureController.getCompanyInfo);

// Fetch distinct brands
router.get("/vehicle-brands", LeadCaptureController.getVehicleBrands);

// Fetch distinct variants by brand
router.get("/vehicle-variants", LeadCaptureController.getVariantsByBrand);

// Fetch distinct sub-variants by brand and variant
router.get("/vehicle-subvariants", LeadCaptureController.getSubVariantsByBrandAndVariant);

// Fetch distinct model years by brand, variant, and sub-variant
router.get("/vehicle-modelyears", LeadCaptureController.getModelYearsByBrandVariantAndSubVariant);

router.get("/roles", LeadCaptureController.getRoles);

module.exports = router;