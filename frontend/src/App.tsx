import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Interview from "./pages/Interview";
import Report from "./pages/Report";
import { ThemeProvider } from "./components/theme-provider";
import "./App.css";

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
