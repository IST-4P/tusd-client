import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import UploadVideo from "./pages/UploadVideo";
import VideoPlayer from "./pages/VideoPlayer";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/upload-video" element={<UploadVideo />} />
        <Route path="/video/:id" element={<VideoPlayer />} />
      </Routes>
    </Router>
  );
}

export default App;
