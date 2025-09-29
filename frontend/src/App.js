import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import MenteeDetail from "@/pages/MenteeDetail";
import EvaluationForm from "@/pages/EvaluationForm";
import ReportView from "@/pages/ReportView";
import Reports from "@/pages/Reports";
import "@/App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentee/:menteeId" element={<MenteeDetail />} />
            <Route path="/mentee/:menteeId/cycle/:cycleId/evaluate" element={<EvaluationForm />} />
            <Route path="/mentee/:menteeId/cycle/:cycleId/report" element={<ReportView />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </div>
    </BrowserRouter>
  );
}

export default App;
