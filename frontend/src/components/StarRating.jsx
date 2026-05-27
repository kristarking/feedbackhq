export default function StarRating({ value, onChange, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div style={{ display: 'flex', gap: '4px', cursor: readOnly ? 'default' : 'pointer' }}>
      {stars.map(s => (
        <span
          key={s}
          onClick={() => !readOnly && onChange && onChange(s)}
          style={{ fontSize: readOnly ? '1rem' : '1.5rem', color: s <= value ? '#f59e0b' : '#d1d5db', transition: 'color .1s' }}
        >
          ★
        </span>
      ))}
    </div>
  );
}
