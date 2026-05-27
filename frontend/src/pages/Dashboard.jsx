import { useState, useEffect } from 'react';
import { reviewsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reviewsApi.getAll({ limit: 100 })
      .then(r => setReviews(r.data.reviews.filter(rev => rev.author?.id === user?.id)))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    await reviewsApi.remove(id);
    setReviews(reviews.filter(r => r.id !== id));
  };

  if (loading) return <div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.25rem' }}>My Reviews</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Welcome back, {user?.name}</p>
      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          You haven't written any reviews yet.
        </div>
      ) : reviews.map(r => <ReviewCard key={r.id} review={r} showProduct onDelete={handleDelete} />)}
    </div>
  );
}
