import { Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import NewRequirement from "@/pages/NewRequirement";
import AnalysisResult from "@/pages/AnalysisResult";
import StandardsCatalog from "@/pages/StandardsCatalog";
import StandardDetail from "@/pages/StandardDetail";
import CompareStandards from "@/pages/CompareStandards";
import History from "@/pages/History";
import Login from "@/pages/Login";
import { ScrollReset } from "@/components/ScrollReset";

export default function App() {
  return (
    <>
      <ScrollReset />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/new" element={<NewRequirement />} />
        <Route path="/analysis/:id" element={<AnalysisResult />} />
        <Route path="/standards" element={<StandardsCatalog />} />
        <Route path="/compare" element={<CompareStandards />} />
        <Route path="/standards/:code" element={<StandardDetail />} />
        <Route path="/history" element={<History />} />
        <Route path="/login" element={<Login />} />
        {/* Fallback route */}
        <Route path="*" element={<Landing />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </>
  );
}
