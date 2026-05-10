import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import HomePage from './pages/HomePage';
import Dashboard from './pages/Dashboard';
import TopicPage from './pages/TopicPage';
import RevisionQueuePage from './pages/RevisionQueuePage';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="h-screen w-full flex items-center justify-center text-white bg-background">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/queue" element={
            <PrivateRoute>
              <RevisionQueuePage />
            </PrivateRoute>
          } />
          <Route path="/topic/:topicName" element={
            <PrivateRoute>
              <TopicPage />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
