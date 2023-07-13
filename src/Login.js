import React, { useState } from "react";
import axios from "axios";

function Login({ onLogin }) {
  // Accept a login handler as a prop
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const login = async () => {
    try {
      await axios.post("http://localhost:5000/login", { username, password });
      onLogin(username, password); // Call the login handler when login is successful
      setErrorMessage("");
    } catch (err) {
      setErrorMessage(err.response.data.message);
    }
  };

  return (
    <div>
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
      <button onClick={login}>Login</button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
}

export default Login;
