import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Brain, Save, FileText, Clock, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

// Create a debounced save hook
const useDebounce = (callback, delay) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = useCallback((...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);
    setDebounceTimer(newTimer);
  }, [callback, delay, debounceTimer]);

  return debouncedCallback;
};

function EvaluationForm() {
  const { menteeId, cycleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [mentee, setMentee] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [rubrics, setRubrics] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState({ items: [], rubric_alignment: [], missing_fields: [] });
  const [activeTab, setActiveTab] = useState("overview");

  // Initialize evaluation state
  const [evaluationData, setEvaluationData] = useState({
    competencies: [],
    idp: {
      goals: [],
      progress_notes: ""
    },
    certifications: [],
    role_fit: {
      current_role: "",
      next_role: "",
      fit_current: 3,
      fit_next: 3,
      gaps: []
    },
    pm_feedback: {
      comments: "",
      strengths: [],
      areas_to_improve: []
    },
    talent_assessment: {
      potential: "medium",
      risk: "low", 
      overall: "good"
    }
  });

  // Debounced save function
  const debouncedSave = useDebounce(async (data) => {
    try {
      setSaving(true);
      await api.patch(`/evaluations/${cycleId}`, data);
      // Optionally trigger AI analysis
      analyzeEvaluation(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
      toast.error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  }, 1000);

  // AI Analysis function
  const analyzeEvaluation = async (data) => {
    try {
      const analysis = await api.post('/ai/analyze', {
        evaluation_data: data,
        cycle_id: cycleId
      });
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('AI analysis failed:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [evaluationData, menteeData, cycleData, rubricsData] = await Promise.all([
          api.get(`/evaluations/${cycleId}`),
          api.get(`/mentees/${menteeId}`),
          api.get(`/cycles/${cycleId}`),
          api.get('/rubrics')
        ]);
        
        setEvaluation(evaluationData);
        setMentee(menteeData);
        setCycle(cycleData);
        setRubrics(rubricsData);
        
        // Initialize competencies from rubric if empty
        if (evaluationData.competencies?.length === 0 && rubricsData.length > 0) {
          const initialCompetencies = rubricsData[0].competencies.map(comp => ({
            key: comp.key,
            name: comp.name,
            score: 3,
            evidence: ""
          }));
          
          const initialData = {
            ...evaluationData,
            competencies: initialCompetencies,
            idp: evaluationData.idp || { goals: [], progress_notes: "" },
            certifications: evaluationData.certifications || [],
            role_fit: evaluationData.role_fit || {
              current_role: menteeData.role || "",
              next_role: "",
              fit_current: 3,
              fit_next: 3,
              gaps: []
            },
            pm_feedback: evaluationData.pm_feedback || {
              comments: "",
              strengths: [],
              areas_to_improve: []
            },
            talent_assessment: evaluationData.talent_assessment || {
              potential: "medium",
              risk: "low",
              overall: "good"
            }
          };
          
          setEvaluationData(initialData);
        } else {
          setEvaluationData({
            competencies: evaluationData.competencies || [],
            idp: evaluationData.idp || { goals: [], progress_notes: "" },
            certifications: evaluationData.certifications || [],
            role_fit: evaluationData.role_fit || {
              current_role: menteeData.role || "",
              next_role: "",
              fit_current: 3,
              fit_next: 3,
              gaps: []
            },
            pm_feedback: evaluationData.pm_feedback || {
              comments: "",
              strengths: [],
              areas_to_improve: []
            },
            talent_assessment: evaluationData.talent_assessment || {
              potential: "medium",
              risk: "low",
              overall: "good"
            }
          });
        }
      } catch (error) {
        toast.error('Failed to load evaluation data');
        console.error('Error fetching evaluation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cycleId, menteeId]);

  // Update evaluation data and trigger save
  const updateEvaluationData = (updates) => {
    const newData = { ...evaluationData, ...updates };
    setEvaluationData(newData);
    debouncedSave(newData);
  };

  // Competency score update
  const updateCompetencyScore = (index, score) => {
    const newCompetencies = [...evaluationData.competencies];
    newCompetencies[index] = { ...newCompetencies[index], score: score[0] };
    updateEvaluationData({ competencies: newCompetencies });
  };

  // Competency evidence update
  const updateCompetencyEvidence = (index, evidence) => {
    const newCompetencies = [...evaluationData.competencies];
    newCompetencies[index] = { ...newCompetencies[index], evidence };
    updateEvaluationData({ competencies: newCompetencies });
  };

  if (loading) {
    return (
      <div data-testid="evaluation-form-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  return (
    <div data-testid="evaluation-form-page" className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/mentee/${menteeId}`)}
          data-testid="back-to-mentee-button"
        >
          <ArrowLeft size={18} />
          Back to Mentee
        </Button>
      </div>

      <div className="text-center py-12">
        <h1 className="h1 mb-4">Evaluation Form</h1>
        <p className="body-lg text-[color:var(--text-secondary)]">
          Evaluation form implementation coming soon!
        </p>
        <p className="body-sm text-[color:var(--text-muted)] mt-2">
          Cycle ID: {cycleId}
        </p>
      </div>
    </div>
  );
}

export default EvaluationForm;