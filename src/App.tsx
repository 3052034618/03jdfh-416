import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import EditorPage from "@/pages/EditorPage";
import DisplayPage from "@/pages/DisplayPage";
import AnalysisPage from "@/pages/AnalysisPage";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/editor" replace />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
      </Routes>
    </Router>
  );
}
