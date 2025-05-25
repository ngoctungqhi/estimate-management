import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { EstimateProvider } from "./context/EstimateContext";
import Home from "./pages/Home";
import CreateEstimate from "./pages/CreateEstimate";
import Navigation from "./components/Navigation";

function App() {
  return (
    <EstimateProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navigation />
          <div className="container mx-auto px-4 flex-1 flex">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/estimate/:id" element={<CreateEstimate />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </Router>
    </EstimateProvider>
  );
}

export default App;
