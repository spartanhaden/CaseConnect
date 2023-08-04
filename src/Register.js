import React, { useState, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "./ThemeContext";

function Register({ onLogin }) {
  // Accept a login handler as a prop
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useContext(ThemeContext); // <-- Use the theme context

  const appStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  const register = async () => {
    try {
      await axios.post("http://localhost:5000/register", {
        username,
        password,
        email,
      });
      onLogin(username, password); // Call the login handler when registration is successful
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.response.data.message);
    }
  };

  return (
    <div className="registerDiv" style={appStyle}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button className="registerButton" onClick={register}>
        Register
      </button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}

export default Register;
