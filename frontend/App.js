import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CaseListPage from './src/pages/CaseListPage';
import CaseDetailPage from './src/pages/CaseDetailPage';
import NewCasePage from './src/pages/NewCasePage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<CaseListPage />} />
          <Route path="/cases/:caseId" element={<CaseDetailPage />} />
          <Route path="/cases/new" element={<NewCasePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
