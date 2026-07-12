import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';

// Legacy /auth route — redirect to home with the auth overlay open
const Auth = () => {
  useEffect(() => {}, []);
  return <Navigate to="/" replace />;
};

export default Auth;
