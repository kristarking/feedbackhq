import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '../api/client';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getAll().then(r => setProducts(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>;

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>
      <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '.5rem' }}>Products</h1>
      <p style={{ color: '#64748b', marginBottom: '2rem' }}>Browse and review software products</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '1rem' }}>
        {products.map(p => {
          const avg = p.avgRating ? parseFloat(p.avgRating).toFixed(1) : null;
          const count = p.reviewCount || 0;
          return (
            <Link key={p.id} to={'/products/' + p.id} className="card" style={{ display: 'block', transition: 'box-shadow .15s, transform .15s' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow='none'; e.currentTarget.style.transform='none'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
                <span className="badge badge-blue">{p.category}</span>
                {avg && <span style={{ color: '#f59e0b', fontWeight: 600 }}>★ {avg}</span>}
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '.4rem' }}>{p.name}</h2>
              <p style={{ fontSize: '.85rem', color: '#64748b', lineHeight: 1.5, marginBottom: '.75rem' }}>{p.description}</p>
              <span style={{ fontSize: '.8rem', color: '#94a3b8' }}>{count} review{count !== 1 ? 's' : ''}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
