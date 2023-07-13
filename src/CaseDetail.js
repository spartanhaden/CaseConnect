import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import DiscussionThread from "./DiscussionThread";

function CaseDetail({ username }) {
  // Add username as a prop
  const { caseId } = useParams();
  const [caseData, setCaseData] = useState(null);
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    const fetchCase = async () => {
      const response = await axios.get(`http://localhost:5000/case/${caseId}`);
      setCaseData(response.data);
    };
    const fetchSavedSearches = async () => {
      const response = await axios.get(
        `http://localhost:5000/api/cases/${caseId}/saved_searches`
      );
      setSavedSearches(response.data.saved_searches);
    };
    fetchCase();
    fetchSavedSearches();
  }, [caseId]);

  return (
    <div>
      {caseData && (
        <div>
          <h1>Case {caseId}</h1>
          <h2>Details</h2>
          <p>Name: {caseData.name}</p>
          <p>Last Seen: {caseData.last_seen}</p>
          <p>Description: {caseData.description}</p>
          <DiscussionThread caseId={caseId} username={username} /> // Pass
          username as a prop
          <button onClick={() => reportCase(caseId)}>Report this case</button>
          <h2>Saved Searches</h2>
          <SavedSearches savedSearches={savedSearches} />
        </div>
      )}
    </div>
  );
}

function SavedSearches({ savedSearches }) {
  if (savedSearches.length === 0) {
    return <p>No saved searches.</p>;
  }
  return (
    <ul>
      {savedSearches.map((search, index) => (
        <li key={index}>
          <p>Query: {search.query}</p>
          <p>Timestamp: {search.timestamp}</p>
        </li>
      ))}
    </ul>
  );
}

function reportCase(caseId) {
  // Implement reporting functionality here.
  // Could involve sending an email, making an API call, etc.
}

export default CaseDetail;
