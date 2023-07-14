import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import UserProfile from "./UserProfile";
import CaseDetail from "./CaseDetail";
import Cases from "./Cases";
import "./App.css";

function App() {
  const [query, setQuery] = useState("");
  const [imageQuery, setImageQuery] = useState(null);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [username, setUsername] = useState(null);

  const handleSearchByText = async () => {
    if (!query) {
      setError("Please enter a query.");
      return;
    }
    setError(null);
    setIsSearching(true);
    try {
      const response = await axios.post("http://localhost:5000/search", {
        query: query,
      });
      setResults(response.data);
    } catch (err) {
      setError(err.message);
    }
    setIsSearching(false);
  };

  const handleSearchByImage = async () => {
    if (!file) {
      setError("Please choose a file.");
      return;
    }
    setError(null);
    setIsSearching(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await axios.post(
        "http://localhost:5000/search_by_image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setResults(response.data);
      if (username) {
        setImageQuery(file.name);
      }
    } catch (err) {
      setError(err.message);
    }
    setIsSearching(false);
  };

  const handleLogin = (username) => {
    setUsername(username);
  };

  const saveSearch = async (query) => {
    // we're assuming that the case id is the first result's case id
    const caseId = results[0]?.case_id;
    if (!caseId) {
      return;
    }
    try {
      await axios.post("http://localhost:5000/api/saved_searches", {
        username: username,
        case_id: caseId,
        query: query,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (username && results.length > 0) {
      saveSearch(query);
    }
  }, [results, username, query]);

  useEffect(() => {
    if (username && results.length > 0) {
      saveSearch(imageQuery);
    }
  }, [results, username, imageQuery]);

  return (
    <Router>
      <Navbar username={username} onLogout={() => setUsername(null)} />
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register onLogin={handleLogin} />} />
        <Route path="/profile/:username" element={<UserProfile />} />
        <Route
          path="/case/:caseId"
          element={<CaseDetail username={username} />}
        />
        <Route path="/cases" element={<Cases />} />
        <Route
          path="/"
          element={
            <div className="container">
              <div className="main-content">
                <h1 className="main-title">CaseConnect</h1>
                <h2 className="main-subtitle">
                  NamUs Missing Persons Database Search
                </h2>
              </div>
              <div className="inputContainer">
                <input
                  className="inputArea"
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <input
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <div className="buttonContainer">
                  <button
                    className="searchButton"
                    onClick={handleSearchByText}
                    disabled={!query || isSearching}
                  >
                    Search by Text
                  </button>
                  <button
                    className="searchButton"
                    onClick={handleSearchByImage}
                    disabled={!file || isSearching}
                  >
                    Search by Image
                  </button>
                </div>
              </div>

              <div className="resultsContainer">
                {results.map((result, index) => (
                  <div key={index} className="result">
                    <h2>
                      <Link to={`/case/${result.case_id}`}>
                        Case {result.case_id} - {result.first_name}{" "}
                        {result.last_name}
                      </Link>
                    </h2>
                    <p>Image ID: {result.image_id}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="errorContainer">
                  <p>{error}</p>
                </div>
              )}

              {isSearching && (
                <div className="searchStatusContainer">
                  <p>Searching...</p>
                </div>
              )}
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

function Navbar({ username, onLogout }) {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/cases">All Cases</Link>
      {username ? (
        <>
          <Link to={`/profile/${username}`}>Profile</Link>
          <button onClick={onLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
}

export default App;
