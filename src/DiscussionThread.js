import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { ThemeContext } from "./ThemeContext";

function DiscussionThread({ caseId, username }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const { theme } = useContext(ThemeContext);

  const appStyle = {
    backgroundColor: theme === "light" ? "#f0f0f0" : "#333",
    color: theme === "light" ? "#333" : "#f0f0f0",
  };

  useEffect(() => {
    const fetchComments = async () => {
      const response = await axios.get(
        `http://localhost:5000/case/${caseId}/comments`
      );
      setComments(response.data.comments);
    };
    fetchComments();
  }, [caseId]);

  const handleAddComment = async () => {
    try {
      const response = await axios.post(
        `http://localhost:5000/case/${caseId}/comments`,
        {
          comment: newComment,
          username: username,
        }
      );
      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="discussion-container" style={appStyle}>
      <h2>Discussion :</h2>
      {comments.map((comment, index) => (
        <div key={index}>
          <p>{comment.text}</p>
          <p>Posted by: {comment.username}</p>
        </div>
      ))}
      <div className="add-comment-section">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="add-comment-input"
          placeholder="Add a comment..."
        />
        <button className="addCommentButton" onClick={handleAddComment}>
          Post Comment
        </button>
      </div>
    </div>
  );
}

export default DiscussionThread;
