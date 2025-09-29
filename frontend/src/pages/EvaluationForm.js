import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function EvaluationForm() {
  const { menteeId, cycleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const evaluationData = await api.get(`/evaluations/${cycleId}`);
        setEvaluation(evaluationData);
      } catch (error) {
        toast.error('Failed to load evaluation data');
        console.error('Error fetching evaluation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [cycleId]);

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