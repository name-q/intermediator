import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

const Main = () => {
  return (
    <div>
     
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Main />} />
      </Routes>
    </Router>
  );
}
