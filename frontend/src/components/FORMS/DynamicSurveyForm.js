import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSurveySpecifications, submitSurveyFormData } from '../../api/api';
import './DynamicSurveyForm.css';

const DynamicSurveyForm = ({ formTypeId }) => {
  const { surveyFormName } = useParams(); 
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitText, setSubmitText] = useState('Submit');
  const [showSurveyForm, setShowSurveyForm] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchFormSpecs = async () => {
      if (!surveyFormName) {
        alert('No survey form selected'); // Replace toast with alert
        navigate('/');
        return;
      }
      try {
        const response = await fetchSurveySpecifications(formTypeId, surveyFormName);
        setFormFields(response.data);
        if (response.data.length > 0) {
          setSubmitText('Submit');
        }
      } catch (error) {
        console.error('Error fetching form specifications:', error);
      }
    };

    fetchFormSpecs();
  }, [formTypeId, surveyFormName, navigate]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const phoneNumberParam = urlParams.get('phoneNumber');
    if (phoneNumberParam) {
      setPhoneNumber(phoneNumberParam);
      setShowSurveyForm(true);
    }
  }, []);

  const handlePhoneNumberChange = (e) => {
    setPhoneNumber(e.target.value);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCheckboxChange = (e, fieldName) => {
    const { value, checked } = e.target;

    setFormData((prevData) => {
      const selectedValues = prevData[fieldName] || [];
      if (checked) {
        return { ...prevData, [fieldName]: [...selectedValues, value] };
      } else {
        return { ...prevData, [fieldName]: selectedValues.filter((v) => v !== value) };
      }
    });
  };

  const handleRadioChange = (e, fieldName) => {
    const { value } = e.target;
    setFormData({ ...formData, [fieldName]: value });
  };

  const handlePhoneNumberSubmit = (e) => {
    e.preventDefault();
    if (formFields.length > 0) {
      const firstQuestionNumber = formFields[0].QuestionNumber;
      setFormData({ [firstQuestionNumber]: phoneNumber });
    }
    navigate(`?phoneNumber=${encodeURIComponent(phoneNumber)}`);
    setShowSurveyForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!surveyFormName) {
      alert('No survey form selected'); // Replace toast with alert
      return;
    }

    try {
      console.log('Submitting survey form data:', { surveyFormName, formData, phoneNumber });
      await submitSurveyFormData(surveyFormName, formData, phoneNumber);
      alert('Survey form submitted successfully'); // Replace toast with alert
      setFormData({});
      setPhoneNumber('');
      setShowSurveyForm(false);
    } catch (error) {
      console.error('Error submitting survey form:', error);
      alert('Error submitting survey form'); // Replace toast with alert
    }
  };

  return (
    <div className="survey-form-container">
      <h2 className="form-title">{surveyFormName}</h2> {/* Display surveyFormName as the heading */}
      {!showSurveyForm && (
        <form onSubmit={handlePhoneNumberSubmit} className="phone-number-form">
          <div className="form-field">
            <label>Phone Number:</label>
            <input
              type="text"
              name="phoneNumber"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="submit-button-container">
            <button type="submit" className="submit-button">
              Start Survey
            </button>
          </div>
        </form>
      )}
      {showSurveyForm && (
        <form onSubmit={handleSubmit} className="survey-form">
          <div className="form-field">
            <label>Phone Number: {phoneNumber}</label>
          </div>
          {formFields.map((currentField) => (
            <div key={currentField.QuestionNumber} className="form-field">
              <label>
                {currentField.QuestionNumber}. {currentField.Question} {currentField.Mandatory === 'yes' && '*'}
              </label>
              {currentField.QuestionType === 'text' && (
                <input
                  type="text"
                  name={currentField.QuestionNumber}
                  value={formData[currentField.QuestionNumber] || ''}
                  onChange={handleChange}
                  placeholder="Enter your answer"
                  required={currentField.Mandatory === 'yes'}
                />
              )}
              {currentField.QuestionType === 'Dropdown' && (
                <select
                  name={currentField.QuestionNumber}
                  value={formData[currentField.QuestionNumber] || ''}
                  onChange={handleChange}
                  required={currentField.Mandatory === 'yes'}
                >
                  <option value="">--Select--</option>
                  {Array.from({ length: 20 }, (_, i) => currentField[`Option${i + 1}`])
                    .filter(Boolean)
                    .map((option, index) => (
                      <option key={index} value={option}>
                        {option}
                      </option>
                    ))}
                </select>
              )}
              {currentField.QuestionType === 'radio' && (
                <div className="radio-group">
                  {Array.from({ length: 20 }, (_, i) => currentField[`Option${i + 1}`])
                    .filter(Boolean)
                    .map((option, index) => (
                      <label key={index}>
                        <input
                          type="radio"
                          name={currentField.QuestionNumber}
                          value={option}
                          checked={formData[currentField.QuestionNumber] === option}
                          onChange={(e) => handleRadioChange(e, currentField.QuestionNumber)}
                        />
                        {option}
                      </label>
                    ))}
                </div>
              )}
              {currentField.QuestionType === 'checkbox' && (
                <div className="checkbox-group">
                  {Array.from({ length: 20 }, (_, i) => currentField[`Option${i + 1}`])
                    .filter(Boolean)
                    .map((option, index) => (
                      <label key={index}>
                        <input
                          type="checkbox"
                          name={currentField.QuestionNumber}
                          value={option}
                          checked={(formData[currentField.QuestionNumber] || []).includes(option)}
                          onChange={(e) => handleCheckboxChange(e, currentField.QuestionNumber)}
                        />
                        {option}
                      </label>
                    ))}
                </div>
              )}
            </div>
          ))}

          <div className="submit-button-container">
            <button type="submit" className="submit-button">
              {submitText}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DynamicSurveyForm;
