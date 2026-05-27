import { useState, useEffect } from 'react';
import { adminApi, reviewsApi } from '../api/client';
import ReviewCard from '../components/ReviewCard';

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [tab, setTab] = useState('stats');

  useEffect(() => {
    adminApi.getStats().then(r => setStats(r.data));
    reviewsApi.getAll({ limit: 100 }).then(r => setReviews(r.data.reviews));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this review?')) return;
    await adminApi.deleteReview(id);
    setReviews(reviews.filter(r => r.id !== id));
    setStats(s => ({ ...s, totalReviews: s.totalReviews - 1 }));
  };

  const tabStyle = active => ({
    padding: '.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
    background: active ? '#2563eb' : 'transparent', color: active ? '#fff' : '#475569', fontWeight: 500,
  });

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>Admin Panel</h1>
      <div style={{ display: 'flex', gap: '.5rem', marginBottom: '2rem', background: '#f1f5f9', padding: '.35rem', borderRadius: '10px', width: 'fit-content' }}>
        <button style={tabStyle(tab === 'stats')} onClick={() => setTab('stats')}>Overview</button>
        <button style={tabStyle(tab === 'reviews')} onClick={() => setTab('reviews')}>Reviews</button>
      </div>

      {tab === 'stats' && stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: '1rem' }}>
          {[
            { label: 'Total Users', value: stats.totalUsers, color: '#2563eb' },
            { label: 'Total Reviews', value: stats.totalReviews, color: '#059669' },
            { label: 'Total Products', value: stats.totalProducts, color: '#7c3aed' },
            { label: 'Avg Rating', value: '★ ' + stats.avgRating, color: '#d97706' },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '.85rem', color: '#64748b', marginTop: '.25rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div>
          <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>{reviews.length} total reviews</p>
          {reviews.map(r => <ReviewCard key={r.id} review={r} showProduct onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
