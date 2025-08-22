import React from 'react'
import { Link } from 'react-router-dom'
function Homepage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 flex flex-col justify-center">
      <div className="max-w-6xl mx-auto">
        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* First column - Heading */}
          <div>
            <img src="../src/assets/plus.svg" className='w-30 h-30 mr-3' alt="plus" />
            <h1 className="text-4xl md:text-8xl font-bold text-blue-800 mb-4 text-center">
              Doctor Finder
            </h1>
            <p className="text-lg text-gray-600 text-center">
              Find the best doctors in your area and book appointments easily.
            </p>
          </div>

          {/* Second column - Register button */}
          <div className="flex justify-center md:justify-end">
            <Link 
              to="/register" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300"
            >
              Register Now
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Homepage
