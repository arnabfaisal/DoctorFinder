import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left side - Logo and Links */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center">
            <span className="text-xl font-bold text-blue-600">Doctor Finder</span>
          </Link>
          
          <div className="hidden md:flex space-x-6">
            <Link to="/" className="text-gray-700 hover:text-blue-600">Home</Link>
            <Link to="/about" className="text-gray-700 hover:text-blue-600">About</Link>
            {isAuthenticated && user?.account_type === 'patient' && (
              <Link to="/patient-dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            )}
            {isAuthenticated && user?.account_type === 'doctor' && (
              <Link to="/doctor-dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            )}
            {isAuthenticated && user?.account_type === 'admin' && (
              <Link to="/admin-dashboard" className="text-gray-700 hover:text-blue-600">Dashboard</Link>
            )}
          </div>
        </div>

        {/* Right side - Login/User */}
        <div>
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Hello, {user.first_name}</span>
              <button 
                onClick={logout}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;