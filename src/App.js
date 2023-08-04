import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import UserProfile from "./UserProfile";
import CaseDetail from "./CaseDetail";
import Cases from "./Cases";
import "./App.css";
import { ThemeContext } from "./ThemeContext";
import "./tailwind.output.css";

function App() {
  const [query, setQuery] = useState("");
  const [imageQuery, setImageQuery] = useState(null);
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [username, setUsername] = useState(null);

  const { theme } = useContext(ThemeContext);
  const [hover, setHover] = useState(false);

  const appStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  const fileInputLabelStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: hover ? "#007bff" : theme === "light" ? "#333" : "#f0f0f0",
  };

  const inputStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#555",
    color: theme === "light" ? "#333" : "#f0f0f0",
    borderColor: theme === "light" ? "#ccc" : "#444654",
  };

  const buttonStyle = {
    backgroundColor: theme === "light" ? "#233242" : "#444654",
    color: theme === "light" ? "#f0f0f0" : "#ddd",
  };

  const resultsContainerStyle = {
    borderColor: theme === "light" ? "#ccc" : "#444654",
  };

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
    <div
      className={`min-h-screen ${
        theme === "light"
          ? "bg-gray-200 text-gray-900"
          : "bg-gray-900 text-gray-200"
      }`}
    >
      <Router>
        <Navbar username={username} onLogout={() => setUsername(null)} />
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route
            path="/register"
            element={<Register onLogin={handleLogin} />}
          />
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
                  <h1 className="main-title" style={{ color: appStyle.color }}>
                    CaseConnect
                  </h1>
                  <h2
                    className="main-subtitle"
                    style={{ color: appStyle.color }}
                  >
                    NamUs Missing Persons Database Search
                  </h2>
                </div>
                <div className="inputContainer">
                  <input
                    className="inputArea"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={inputStyle}
                  />
                  <div className="chooseFile">
                    <input
                      id="fileInput"
                      type="file"
                      onChange={(e) => setFile(e.target.files[0])}
                      style={{ display: "none" }}
                    />
                    <label
                      htmlFor="fileInput"
                      className="fileInputLabel"
                      style={fileInputLabelStyle}
                      onMouseEnter={() => setHover(true)}
                      onMouseLeave={() => setHover(false)}
                    >
                      Upload an image
                    </label>
                  </div>
                  <div className="buttonContainer">
                    <button
                      className="searchButton"
                      onClick={handleSearchByText}
                      disabled={!query || isSearching}
                      style={buttonStyle}
                    >
                      Search by Text
                    </button>
                    <button
                      className="searchButton"
                      onClick={handleSearchByImage}
                      disabled={!file || isSearching}
                      style={buttonStyle}
                    >
                      Search by Image
                    </button>
                  </div>
                </div>
                <div className="resultsContainer" style={resultsContainerStyle}>
                  {results.map((result, index) => (
                    <Link
                      to={`/case/${result.case_id}`}
                      key={index}
                      className="resultLink"
                    >
                      <div className="result">
                        <h2>
                          Case {result.case_id} - {result.first_name}{" "}
                          {result.last_name}
                        </h2>
                        <p>Image ID: {result.image_id}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                {error && (
                  <div className="errorContainer">
                    <p>{error}</p>
                  </div>
                )}

                {isSearching && (
                  <div
                    className="searchStatusContainer"
                    style={{ color: appStyle.color }}
                  >
                    <p>Searching...</p>
                  </div>
                )}
              </div>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

function Navbar({ username, onLogout }) {
  const { theme, toggleTheme } = useContext(ThemeContext);

  const navStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  return (
    <nav className="navbar" style={navStyle}>
      <Link to="/">Home</Link>
      <Link to="/cases">All Cases</Link>
      {username ? (
        <>
          <Link to={`/profile/${username}`}>Profile</Link>
          <button className="logoutButton" onClick={onLogout}>
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
      <button className="darkModeButton" onClick={toggleTheme}>
        {theme === "light" ? "Dark" : "Light"} Mode
      </button>
    </nav>
  );
}

export default App;
