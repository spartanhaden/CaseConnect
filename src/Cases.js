import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";

function Cases() {
  const [cases, setCases] = useState([]);
  const { theme } = useContext(ThemeContext); // <-- Use the theme context

  const appStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  useEffect(() => {
    const fetchCases = async () => {
      const response = await axios.get("http://localhost:5000/cases");
      setCases(response.data);
    };
    fetchCases();
  }, []);

  return (
    <div style={appStyle}>
      <h1>All Cases</h1>
      <div className="casesContainer">
        {cases.map((caseData) => (
          <Link to={`/case/${caseData.id}`} className="resultLink" key={caseData.id}>
            <div className="result">
              <h2>Case {caseData.id}: {caseData.name}</h2>
              {/* You can display more case data here */}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Cases;
