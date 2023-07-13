import React, { useState, useEffect } from "react";
import axios from "axios";

function DiscussionThread({ caseId, username }) {
  // Add username as a prop
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");

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
          username: username, // Pass the username when posting a comment
        }
      );
      setComments([...comments, response.data.comment]);
      setNewComment("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <h2>Discussion</h2>
      {comments.map((comment, index) => (
        <div key={index}>
          <p>{comment.text}</p>
          <p>Posted by: {comment.username}</p>
        </div>
      ))}
      <input
        type="text"
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
      />
      <button onClick={handleAddComment}>Add comment</button>
    </div>
  );
}

export default DiscussionThread;
