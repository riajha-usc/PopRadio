import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

function Comments({ targetType, target, onClose }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      setLoading(true);
      let data;
      if (targetType === 'song') {
        data = await api.getSongComments(target._id);
      } else {
        data = await api.getPlaylistComments(target._id);
      }
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      let newComment;
      if (targetType === 'song') {
        newComment = await api.addSongComment(target._id, commentText.trim());
      } else {
        newComment = await api.addPlaylistComment(target._id, commentText.trim());
      }
      setComments([newComment.comment, ...comments]);
      setCommentText('');
      inputRef.current?.focus();
    } catch (error) {
      alert(error.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffMs = now - commentDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return commentDate.toLocaleDateString();
  };

  return (
    <motion.div
      className="comments-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="comments-modal"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="comments-header">
          <h3 className="comments-title">
            💬 Comments
          </h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="comment-input-container">
          <textarea
            ref={inputRef}
            className="comment-input"
            placeholder="Share your thoughts... ✨"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            maxLength={500}
            rows={3}
            autoFocus
          />
          <button
            type="submit"
            className="submit-comment-btn"
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>

        <div className="comments-list">
          {loading ? (
            <p style={{ textAlign: 'center', color: '#b589d6', padding: '20px' }}>
              Loading comments...
            </p>
          ) : comments.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#b589d6', padding: '20px' }}>
              No comments yet. Be the first! 💕
            </p>
          ) : (
            comments.map((comment, index) => (
              <motion.div
                key={comment._id}
                className="comment-item"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <p className="comment-text">{comment.text}</p>
                <p className="comment-time">{formatTime(comment.createdAt)}</p>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default Comments;