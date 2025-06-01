import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import {
  fetchFormSpecifications,
  fetchDropdownOptions,
  fetchFormDetails,
  fetchFormData,
  submitForm,
  updateForm,
  searchFormData,
} from "../../api/api";
import "./DynamicForm.css";

const DynamicForm = ({ formTypeId }) => {
  const { formName } = useParams(); 
  const [uniqueId, setUniqueId] = useState(null);
  const [formFields, setFormFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [dropdownOptions, setDropdownOptions] = useState({});
  const [submitText, setSubmitText] = useState("Submit");
  const [formDetails, setFormDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState({});
  const [errorMessage, setErrorMessage] = useState(""); 
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFormSpecs = async () => {
      if (!formName) {
        setErrorMessage("No form selected. Please select a form from the menu.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetchFormSpecifications(formTypeId, formName.trim());
        if (response.data.length === 0) {
          setErrorMessage("No fields found for the selected form.");
        } else {
          console.log("Fetched form specifications:", response.data); // Debugging log
          setFormFields(response.data); // Set the form fields state with the fetched data
          setSubmitText(response.data[0].SubmitText); // Set the submit button text
        }
      } catch (error) {
        console.error("Error fetching form specifications:", error);
        setErrorMessage("Failed to load form specifications. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchFormSpecs();
  }, [formTypeId, formName]); // Add formName as a dependency

  useEffect(() => {
    const fetchDropdownOptionsForFields = async () => {
      const options = {};
      for (const field of formFields) {
        if (
          ["dropdown", "radio", "checkbox"].includes(
            field.InputType.toLowerCase()
          )
        ) {
          try {
            const response = await fetchDropdownOptions(field.FieldName);
            options[field.FieldName] = response.data;
          } catch (error) {
            console.error(`Error fetching options for ${field.FieldName}:`, error);
          }
        }
      }
      setDropdownOptions(options);
    };

    if (formFields.length > 0) {
      fetchDropdownOptionsForFields();
    }
  }, [formFields]);

  useEffect(() => {
    const fetchFormDetailsData = async () => {
      if (!formName) {
        setErrorMessage("No form selected. Please select a form from the menu.");
        return;
      }
      try {
        const response = await fetchFormDetails(formName.trim()); // Ensure formName is trimmed
        if (response.data.length === 0) {
          console.error("No form details found for the selected form.");
        } else {
          console.log("Fetched form details:", response.data); // Debugging log
          setFormDetails(response.data); // Set the form details state with the fetched data
        }
      } catch (error) {
        console.error("Error fetching form details:", error);
      }
    };

    fetchFormDetailsData();
  }, [formName]); // Add formName as a dependency

  useEffect(() => {
    if (uniqueId) {
      const fetchExistingFormData = async () => {
        try {
          const response = await fetchFormData(uniqueId);
          setFormData(response.data);
        } catch (error) {
          console.error("Error fetching form data:", error);
        }
      };

      fetchExistingFormData();
    }
  }, [uniqueId]);

  useEffect(() => {
    const initialCollapsedGroups = {};
    formFields.forEach(field => {
      if (field.GroupCollapse === 'yes') {
        initialCollapsedGroups[field.GroupHeading] = true;
      }
    });
    setCollapsedGroups(initialCollapsedGroups);
  }, [formFields]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
    });
  };

  const handleDropdownChange = (e, fieldName) => {
    const { value } = e.target;
    setFormData({
      ...formData,
      [fieldName]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate mandatory fields
    for (const field of formFields) {
      if (field.FieldMandatory === "yes" && !formData[field.FieldName]) {
        alert(`Please fill out the mandatory field: ${field.Label}`); // Replace toast with alert
        return;
      }
    }

    const payload = {
      formName, // Include formName in the payload
      formData,
      uniqueId,
    };

    try {
      if (uniqueId) {
        await updateForm(payload);
        alert("Form updated successfully");
      } else {
        await submitForm(payload);
        alert("Form submitted successfully"); 
      }
      setFormData({});
      setUniqueId(null); 
      navigate(`/form/${encodeURIComponent(formName.trim())}`); 
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form");
    }
  };

  const handleSearch = async () => {
    if (!searchValue) {
      alert("Please enter a search value."); // Replace toast with alert
      return;
    }
  
    console.log("Searching with formName:", formName, "and searchValue:", searchValue); // Debugging log
  
    try {
      const response = await searchFormData(formName.trim(), searchValue.trim()); // Ensure formName and searchValue are trimmed
      if (response.data) {
        console.log("Search result:", response.data); // Debugging log
        setFormData(response.data); // Set the form data with the search result
        setUniqueId(response.data.UniqueId); // Set the unique ID from the search result
        navigate(`/form/${encodeURIComponent(formName.trim())}/${encodeURIComponent(searchValue.trim())}`); // Navigate to the new path
      } else {
        alert("No matching record found."); // Replace toast with alert
      }
    } catch (error) {
      console.error("Error searching form data:", error.response?.data || error.message); // Improved error logging
      alert("Error searching form data. Please try again."); // Replace toast with alert
    } finally {
      setSearchValue(""); // Clear the search input
    }
  };

  const toggleGroupCollapse = (heading) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [heading]: !prev[heading],
    }));
  };

  if (loading) {
    return <div className="loading">Loading form...</div>;
  }

  if (errorMessage) {
    return <div className="error-message">{errorMessage}</div>; // Display error message
  }

  const groupedFields = formDetails.reduce((acc, detail) => {
    if (!acc[detail.Rows]) {
      acc[detail.Rows] = [];
    }
    acc[detail.Rows].push(detail);
    return acc;
  }, {});

  const groupedByHeading = formFields.reduce((acc, field) => {
    const heading = field.GroupHeading === '' ? "" : field.GroupHeading;
    if (!acc[heading]) {
      acc[heading] = [];
    }
    acc[heading].push(field);
    return acc;
  }, {});

  const allowTextEntryDropdowns = formFields
    .filter(field => field.AllowTextEntry === 'yes')
    .map(field => field.FieldName);

  return (
    <div className="dynamic-form-container">
      <h2 className="form-title">{formName}</h2> {/* Display formName as the heading */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <button onClick={handleSearch} className="search-button">
          <FaSearch />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="dynamic-form">
        {Object.keys(groupedByHeading).map((heading) => {
          const groupFields = groupedByHeading[heading];
          const isCollapsible = groupFields.some(field => field.GroupCollapse === 'yes');
          return (
            <div key={heading} className="form-group">
              {heading && (
                <h3
                  onClick={() => isCollapsible && toggleGroupCollapse(heading)}
                  className="group-heading"
                >
                  {heading} {isCollapsible && (collapsedGroups[heading] ? <FaChevronUp /> : <FaChevronDown />)}
                </h3>
              )}
              {!collapsedGroups[heading] && Object.keys(groupedFields).map((row) => (
                <div key={row} className="form-row">
                  {groupedFields[row].map((fieldDetail) => {
                    const field = groupedByHeading[heading].find(
                      (f) => f.FieldName === fieldDetail.FieldName
                    );
                    if (!field) return null;
                    return (
                      <div
                        key={field.FieldName}
                        className="form-field"
                        style={{
                          flexBasis: `${fieldDetail.InputWidth}px`,
                          height: `${fieldDetail.InputHeight}px`,
                        }}
                      >
                        {field.LabelMandatory === "yes" && (
                          <label className="mandatory-label">
                            {field.Label}
                            {field.FieldsMandatory === "yes" && <span className="mandatory-asterisk"> *</span>}
                          </label>
                        )}
                        {["text", "email", "password", "url", "datetime-local", "date", "time", "file", "number"].includes(
                          field.InputType.toLowerCase()
                        ) && (
                          <input
                            type={field.InputType.toLowerCase()}
                            name={field.FieldName}
                            value={formData[field.FieldName] || ""}
                            onChange={handleChange}
                            placeholder={field.Placeholder}
                            required={field.FieldsMandatory === "yes"}
                          />
                        )}
                        {field.InputType.toLowerCase() === "textarea" && (
                          <textarea
                            name={field.FieldName}
                            value={formData[field.FieldName] || ""}
                            onChange={handleChange}
                            placeholder={field.Placeholder}
                            required={field.FieldsMandatory === "yes"}
                          />
                        )}
                        {field.InputType.toLowerCase() === "dropdown" && (
                          <>
                            {allowTextEntryDropdowns.includes(field.FieldName) ? (
                              <input
                                list={`dropdown-options-${field.FieldName}`}
                                name={field.FieldName}
                                value={formData[field.FieldName] || ""}
                                onChange={(e) => handleDropdownChange(e, field.FieldName)}
                                placeholder={field.Placeholder}
                                required={field.FieldsMandatory === "yes"}
                                className="allow-text-entry-dropdown"
                              />
                            ) : (
                              <select
                                name={field.FieldName}
                                value={formData[field.FieldName] || ""}
                                onChange={handleChange}
                                required={field.FieldsMandatory === "yes"}
                                className="dropdown"
                              >
                                <option value="">Select</option>
                                {(dropdownOptions[field.FieldName] || []).map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            )}
                            <datalist id={`dropdown-options-${field.FieldName}`}>
                              {(dropdownOptions[field.FieldName] || []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </datalist>
                          </>
                        )}
                        {field.InputType.toLowerCase() === "checkbox" && (
                          <input
                            type="checkbox"
                            name={field.FieldName}
                            checked={!!formData[field.FieldName]}
                            onChange={handleChange}
                            required={field.FieldsMandatory === "yes"}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
        <div className="submit-button-container">
          <button type="submit" className="submit-button">
            {submitText}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DynamicForm;