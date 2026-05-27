import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reviewsApi, productsApi } from '../api/client';
import ReviewCard from '../components/ReviewCard';

export default function Home() {
  const [reviews, setReviews] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reviewsApi.getAll({ limit: 6 }), productsApi.getAll()])
      .then(([r, p]) => { setReviews(r.data.reviews); setProducts(p.data.slice(0, 4)); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>;

  return (
    <div>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg,#1e3a8a,#2563eb)', color: '#fff', padding: '4rem 0' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 800, marginBottom: '1rem' }}>
            Real Reviews, Real Insights
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: .8, marginBottom: '2rem', maxWidth: '500px', margin: '0 auto 2rem' }}>
            Browse honest customer feedback on software products. Sign up to share your own experience.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/products" className="btn" style={{ background: '#fff', color: '#2563eb' }}>Browse Products</Link>
            <Link to="/register" className="btn" style={{ background: 'rgba(255,255,255,.15)', color: '#fff', border: '1.5px solid rgba(255,255,255,.3)' }}>Write a Review</Link>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="container" style={{ padding: '3rem 1.5rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Top Rated Products</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: '1rem', marginBottom: '3rem' }}>
          {products.map(p => (
            <Link key={p.id} to={'/products/' + p.id} className="card" style={{ display: 'block', transition: 'box-shadow .15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,.08)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow='none'}>
              <span className="badge badge-blue" style={{ marginBottom: '.5rem' }}>{p.category}</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.25rem' }}>{p.name}</h3>
              <p style={{ fontSize: '.85rem', color: '#64748b' }}>{p.description}</p>
              {p.dataValues?.avgRating && (
                <div style={{ marginTop: '.5rem', color: '#f59e0b', fontSize: '.9rem' }}>
                  {'★'.repeat(Math.round(p.dataValues.avgRating))} <span style={{ color: '#94a3b8' }}>({p.dataValues.reviewCount})</span>
                </div>
              )}
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem' }}>Latest Reviews</h2>
        {reviews.map(r => <ReviewCard key={r.id} review={r} showProduct />)}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <Link to="/products" className="btn btn-outline">See All Products →</Link>
        </div>
      </div>
    </div>
  );
}
