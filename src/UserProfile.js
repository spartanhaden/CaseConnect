import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

function UserProfile() {
  const { username } = useParams();
  const [user, setUser] = useState(null);
  const [contributions, setContributions] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const response = await axios.get(
        `http://localhost:5000/user/${username}`
      );
      setUser(response.data);
      setContributions(response.data.contributions);
      setName(response.data.name);
      setEmail(response.data.email);
    };
    fetchUser();
  }, [username]);

  const updateUserProfile = async () => {
    await axios.put(`http://localhost:5000/user/${username}`, {
      contributions,
      name,
      email,
    });
    setUser({ ...user, contributions, name, email });
  };

  return (
    <div>
      {user && (
        <>
          <h1>{user.username}'s Profile</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
          />
          <textarea
            value={contributions}
            onChange={(e) => setContributions(e.target.value)}
            placeholder="Contributions"
          />
          <button onClick={updateUserProfile}>Update Profile</button>
        </>
      )}
    </div>
  );
}

export default UserProfile;
