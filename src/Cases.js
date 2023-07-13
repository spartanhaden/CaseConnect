import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function Cases() {
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      const response = await axios.get("http://localhost:5000/cases");
      setCases(response.data);
    };
    fetchCases();
  }, []);

  return (
    <div>
      <h1>All Cases</h1>
      {cases.map((caseData) => (
        <div key={caseData.id}>
          <h2>
            <Link to={`/case/${caseData.id}`}>
              Case {caseData.id}: {caseData.name}
            </Link>
          </h2>
          {/* You can display more case data here */}
        </div>
      ))}
    </div>
  );
}

export default Cases;
