import StarRating from './StarRating';

export default function ReviewCard({ review, onDelete, showProduct = false }) {
  const date = new Date(review.createdAt).toLocaleDateString('en-US', { year:'numeric', month:'short', day:'numeric' });
  return (
    <div className="card" style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '.25rem' }}>{review.title}</h3>
          {showProduct && review.product && (
            <span className="badge badge-blue" style={{ marginBottom: '.4rem', display: 'inline-block' }}>
              {review.product.name}
            </span>
          )}
          <StarRating value={review.rating} readOnly />
        </div>
        <div style={{ textAlign: 'right', fontSize: '.8rem', color: '#94a3b8' }}>
          <div>{review.author?.name || 'Anonymous'}</div>
          <div>{date}</div>
        </div>
      </div>
      <p style={{ color: '#475569', fontSize: '.9rem', lineHeight: 1.6 }}>{review.body}</p>
      {onDelete && (
        <button className="btn btn-danger" onClick={() => onDelete(review.id)}
          style={{ marginTop: '.75rem', padding: '.3rem .8rem', fontSize: '.8rem' }}>
          Delete
        </button>
      )}
    </div>
  );
}
