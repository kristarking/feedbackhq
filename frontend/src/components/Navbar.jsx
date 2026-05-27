import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav style={{
      position:'fixed',top:0,left:0,right:0,height:'64px',
      background:'#fff',borderBottom:'1px solid #e2e8f0',
      zIndex:100,display:'flex',alignItems:'center'
    }}>
      <div className="container" style={{display:'flex',alignItems:'center',justifyContent:'space-between',width:'100%'}}>
        <Link to="/" style={{fontWeight:700,fontSize:'1.2rem',color:'#2563eb'}}>
          FeedbackHQ
        </Link>
        <div style={{display:'flex',alignItems:'center',gap:'1rem'}}>
          <Link to="/products" style={{color:'#475569',fontSize:'.9rem'}}>Products</Link>
          {user ? (
            <>
              <Link to="/dashboard" style={{color:'#475569',fontSize:'.9rem'}}>My Reviews</Link>
              {isAdmin && <Link to="/admin" style={{color:'#475569',fontSize:'.9rem'}}>Admin</Link>}
              <button className="btn btn-outline" onClick={handleLogout} style={{padding:'.4rem .9rem'}}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline" style={{padding:'.4rem .9rem',fontSize:'.9rem'}}>Login</Link>
              <Link to="/register" className="btn btn-primary" style={{padding:'.4rem .9rem',fontSize:'.9rem'}}>Sign up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
