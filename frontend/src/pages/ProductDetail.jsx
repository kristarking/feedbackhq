import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsApi, reviewsApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/ReviewCard';
import StarRating from '../components/StarRating';

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([productsApi.getOne(id), reviewsApi.getAll({ productId: id, limit: 50 })])
      .then(([p, r]) => { setProduct(p.data); setReviews(r.data.reviews); });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try {
      const res = await reviewsApi.create({ ...form, productId: id });
      setReviews([res.data, ...reviews]);
      setShowForm(false);
      setForm({ rating: 5, title: '', body: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally { setSubmitting(false); }
  };

  if (!product) return <div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <Link to="/products" style={{ color: '#2563eb', fontSize: '.9rem', display: 'inline-block', marginBottom: '1rem' }}>← Back to Products</Link>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <span className="badge badge-blue" style={{ marginBottom: '.75rem' }}>{product.category}</span>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.5rem' }}>{product.name}</h1>
        <p style={{ color: '#64748b' }}>{product.description}</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>{reviews.length} Review{reviews.length !== 1 ? 's' : ''}</h2>
        {user ? (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Write a Review'}
          </button>
        ) : (
          <Link to="/login" className="btn btn-outline">Login to Review</Link>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderColor: '#2563eb' }}>
          <h3 style={{ marginBottom: '1rem', fontWeight: 600 }}>Your Review</h3>
          {error && <div style={{ background: '#fef2f2', color: '#dc2626', padding: '.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '.9rem' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Rating</label>
              <StarRating value={form.rating} onChange={r => setForm({...form, rating: r})} />
            </div>
            <div className="form-group">
              <label>Title</label>
              <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} required placeholder="Summary of your experience" minLength={3} />
            </div>
            <div className="form-group">
              <label>Review</label>
              <textarea value={form.body} onChange={e => setForm({...form, body: e.target.value})} required rows={4} minLength={10} placeholder="Share your detailed experience..." style={{ resize: 'vertical' }} />
            </div>
            <button className="btn btn-primary" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
          No reviews yet. Be the first to review!
        </div>
      ) : reviews.map(r => <ReviewCard key={r.id} review={r} />)}
    </div>
  );
}
