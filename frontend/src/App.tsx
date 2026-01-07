import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/interview" element={<Interview />} />
        <Route path="/report" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
