const express = require('express');
const router = express.Router();
const formController = require('../../controllers/FORMS/formController');
const surveyFormController = require('../../controllers/FORMS/surveyFormController');
const formSelectorController = require('../../controllers/FORMS//formSelectorController');

// simple form routes
router.get('/form-specifications', formController.getFormSpecifications);
router.get('/dropdown-options', formController.getDropdownOptions);
router.get('/form-details', formController.getFormDetails);
router.get('/form-data', formController.getFormData);
router.post('/forms/submit', formController.submitFormData);
router.post('/forms/update', formController.updateFormData); 
router.get('/search-form-data', formController.searchFormData); 

//Survey form routes
router.get('/survey-form-specifications', surveyFormController.getSurveyFormSpecifications);
router.post('/survey-forms/submit', surveyFormController.submitSurveyFormData);

// Form Selector routes
router.get('/simple-form-names', formSelectorController.getFormNames);
router.get('/survey-form-names', formSelectorController.getSurveyFormNames);
router.get('/simpleform-menu-names', formSelectorController.getSimpleFormMenuNames); 
router.get('/surveyform-menu-names', formSelectorController.getSurveyFormMenuNames); 

module.exports = router;
