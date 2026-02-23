import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  console.log('🔐 ProtectedAdminRoute Check:', {
    isAuthenticated,
    role: user?.role,
    user
  });

  // Non connecté
  if (!isAuthenticated || !user) {
    console.log('❌ Non authentifié - redirection /admin/login');
    return <Navigate to="/admin/login" replace />;
  }

  // Pas admin
  if (user.role !== 'admin') {
    console.log('❌ Pas admin - redirection /');
    return <Navigate to="/" replace />;
  }

  console.log('✅ Accès admin autorisé');
  return children;
};

export default ProtectedAdminRoute;
