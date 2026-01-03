import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import UploadVideo from "./pages/UploadVideo";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/upload-video" element={<UploadVideo />} />
      </Routes>
    </Router>
  );
}

export default App;
