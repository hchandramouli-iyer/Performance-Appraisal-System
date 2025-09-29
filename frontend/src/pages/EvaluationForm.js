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
import CompetencyRadarChart from "@/components/CompetencyRadarChart";
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
      progress_notes: "",
      self_reflection: {
        key_strengths: "",
        passions: "",
        development_opportunities: "",
        proud_accomplishments: ""
      },
      development_goals: {
        teksystems_roles: "",
        professional_goals: "",
        personal_goals: ""
      }
    },
    certifications: [],
    role_fit: {
      current_role: "",
      next_role: "",
      fit_current: 3,
      fit_next: 3,
      gaps: [],
      // EBR Framework fields
      ebr_organization_utilization: "",
      ebr_organization_engagement: "",
      ebr_organization_compliance: "",
      ebr_project_feedback: "",
      ebr_project_quality: "",
      ebr_team_certifications: "",
      ebr_team_cert_level: "",
      ebr_team_contribution: "",
      ebr_team_glint: "",
      ebr_team_leadership: "",
      ebr_self_goal_attainment: "",
      ebr_self_development: "",
      ebr_self_progress: ""
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
            score: 3, // Default to "Solid" rating
            evidence: ""
          }));
          
          const initialData = {
            ...evaluationData,
            competencies: initialCompetencies,
            idp: {
              goals: evaluationData.idp?.goals || [],
              progress_notes: evaluationData.idp?.progress_notes || "",
              self_reflection: evaluationData.idp?.self_reflection || {
                key_strengths: "",
                passions: "",
                development_opportunities: "",
                proud_accomplishments: ""
              },
              development_goals: evaluationData.idp?.development_goals || {
                teksystems_roles: "",
                professional_goals: "",
                personal_goals: ""
              }
            },
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
            idp: {
              goals: evaluationData.idp?.goals || [],
              progress_notes: evaluationData.idp?.progress_notes || "",
              self_reflection: evaluationData.idp?.self_reflection || {
                key_strengths: "",
                passions: "",
                development_opportunities: "",
                proud_accomplishments: ""
              },
              development_goals: evaluationData.idp?.development_goals || {
                teksystems_roles: "",
                professional_goals: "",
                personal_goals: ""
              }
            },
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
    <div data-testid="evaluation-form-page" className="layout space-y-6">
      {/* Main Content */}
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate(`/mentee/${menteeId}`)}
              data-testid="back-to-mentee-button"
            >
              <ArrowLeft size={18} />
              Back to Mentee
            </Button>
            {saving && (
              <div className="flex items-center gap-2 text-[color:var(--text-muted)]">
                <Clock size={16} className="animate-spin" />
                <span className="body-sm">Saving...</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" data-testid="cycle-period-badge">
              {cycle?.period_label}
            </Badge>
            <Badge 
              variant={cycle?.status === 'active' ? 'default' : 'secondary'}
              data-testid="cycle-status-badge"
            >
              {cycle?.status}
            </Badge>
          </div>
        </div>

        {/* Mentee Header */}
        <Card className="card">
          <div className="card__body">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="h1">{mentee?.name} - Performance Evaluation</h1>
                <p className="body-lg text-[color:var(--brand)] mt-1">{mentee?.role}</p>
                <p className="body-sm text-[color:var(--text-secondary)] mt-1">
                  {cycle?.period_label} • {cycle && new Date(cycle.start_date).toLocaleDateString()} - {cycle && new Date(cycle.end_date).toLocaleDateString()}
                </p>
              </div>
              <Button
                data-testid="generate-report-button"
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => navigate(`/mentee/${menteeId}/cycle/${cycleId}/report`)}
              >
                <FileText size={18} />
                View Report
              </Button>
            </div>
          </div>
        </Card>

        {/* Evaluation Form Tabs */}
        <Card className="card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="card__header">
              <TabsList className="grid grid-cols-7 w-full" data-testid="evaluation-tabs">
                <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
                <TabsTrigger value="competencies" data-testid="competencies-tab">Competencies</TabsTrigger>
                <TabsTrigger value="idp" data-testid="idp-tab">IDP</TabsTrigger>
                <TabsTrigger value="certifications" data-testid="certifications-tab">Certifications</TabsTrigger>
                <TabsTrigger value="role-fit" data-testid="role-fit-tab">Role Fit</TabsTrigger>
                <TabsTrigger value="pm-feedback" data-testid="pm-feedback-tab">PM Feedback</TabsTrigger>
                <TabsTrigger value="assessment" data-testid="assessment-tab">Assessment</TabsTrigger>
              </TabsList>
            </div>

            <div className="card__body">
              {/* Overview Tab */}
              <TabsContent value="overview" data-testid="overview-content" className="space-y-6">
                <div className="grid lg:grid-cols-2 gap-8">
                  {/* Left Column - Metrics */}
                  <div className="space-y-6">
                    <div>
                      <h3 className="h3 mb-4">Evaluation Metrics</h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <Card className="card p-4">
                          <div className="text-center">
                            <div className="metric">
                              {evaluationData.competencies.length > 0 
                                ? (evaluationData.competencies.reduce((sum, comp) => sum + comp.score, 0) / evaluationData.competencies.length).toFixed(1)
                                : '0.0'
                              }
                            </div>
                            <p className="body-sm text-[color:var(--text-secondary)]">Avg Competency Score</p>
                          </div>
                        </Card>
                        <Card className="card p-4">
                          <div className="text-center">
                            <div className="metric">{evaluationData.idp.goals?.length || 0}</div>
                            <p className="body-sm text-[color:var(--text-secondary)]">IDP Goals</p>
                          </div>
                        </Card>
                        <Card className="card p-4">
                          <div className="text-center">
                            <div className="metric">{evaluationData.certifications?.length || 0}</div>
                            <p className="body-sm text-[color:var(--text-secondary)]">Certifications</p>
                          </div>
                        </Card>
                        <Card className="card p-4">
                          <div className="text-center">
                            <div className={`metric ${
                              evaluationData.talent_assessment?.overall === 'excellent' ? 'text-[color:var(--accent-success)]' :
                              evaluationData.talent_assessment?.overall === 'good' ? 'text-[color:var(--accent-success)]' :
                              evaluationData.talent_assessment?.overall === 'developing' ? 'text-[color:var(--accent-warning)]' :
                              'text-[color:var(--text-secondary)]'
                            }`}>
                              {evaluationData.talent_assessment?.overall?.toUpperCase() || 'TBD'}
                            </div>
                            <p className="body-sm text-[color:var(--text-secondary)]">Overall Rating</p>
                          </div>
                        </Card>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="h4 mb-3">Progress Summary</h4>
                      <div className="space-y-3">
                        {[
                          { section: "Competencies", completed: evaluationData.competencies.filter(c => c.evidence).length, total: evaluationData.competencies.length },
                          { section: "IDP Goals", completed: evaluationData.idp.goals?.length || 0, total: "As needed" },
                          { section: "PM Feedback", completed: evaluationData.pm_feedback.comments ? 1 : 0, total: 1 },
                          { section: "Role Fit Analysis", completed: evaluationData.role_fit.current_role && evaluationData.role_fit.next_role ? 1 : 0, total: 1 }
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--border-light)] last:border-b-0">
                            <span className="body-md">{item.section}</span>
                            <div className="flex items-center gap-2">
                              {typeof item.total === 'number' && item.completed === item.total ? (
                                <CheckCircle size={16} className="text-[color:var(--accent-success)]" />
                              ) : null}
                              <span className="body-sm text-[color:var(--text-secondary)]">
                                {item.completed} / {item.total}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Right Column - Competency Chart */}
                  <div>
                    <h3 className="h3 mb-4">Competency Profile</h3>
                    <Card className="card">
                      <div className="card__body">
                        {evaluationData.competencies.length > 0 ? (
                          <CompetencyRadarChart competencies={evaluationData.competencies} />
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <Brain size={48} className="mx-auto text-[color:var(--text-muted)] mb-4" />
                              <p className="body-sm text-[color:var(--text-muted)]">
                                Complete competency scores to see visual analysis
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Competencies Tab */}
              <TabsContent value="competencies" data-testid="competencies-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Competency Evaluation</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-4">
                    Rate each competency on a scale of 1-5 and provide specific evidence and examples.
                  </p>
                  
                  {/* Rating Scale Legend */}
                  <Card className="card mb-6">
                    <div className="card__header">
                      <h4 className="h4">Rating Scale Guide</h4>
                    </div>
                    <div className="card__body">
                      <div className="grid md:grid-cols-5 gap-4 text-center">
                        <div className="p-3 bg-[color:var(--accent-danger)]/10 rounded-[var(--radius-sm)]">
                          <div className="font-semibold text-[color:var(--accent-danger)] mb-1">1 - Concerning</div>
                          <p className="body-sm text-[color:var(--text-secondary)]">Implies a deficiency or need for significant development</p>
                        </div>
                        <div className="p-3 bg-[color:var(--accent-warning)]/10 rounded-[var(--radius-sm)]">
                          <div className="font-semibold text-[color:var(--accent-warning)] mb-1">2 - Developing</div>
                          <p className="body-sm text-[color:var(--text-secondary)]">Shows progress but needs continued development</p>
                        </div>
                        <div className="p-3 bg-[color:var(--text-muted)]/10 rounded-[var(--radius-sm)]">
                          <div className="font-semibold text-[color:var(--text-primary)] mb-1">3 - Solid</div>
                          <p className="body-sm text-[color:var(--text-secondary)]">Meets expectations and performs competently</p>
                        </div>
                        <div className="p-3 bg-[color:var(--brand)]/10 rounded-[var(--radius-sm)]">
                          <div className="font-semibold text-[color:var(--brand)] mb-1">4 - Strong</div>
                          <p className="body-sm text-[color:var(--text-secondary)]">Indicates proficiency and competence in the area</p>
                        </div>
                        <div className="p-3 bg-[color:var(--accent-success)]/10 rounded-[var(--radius-sm)]">
                          <div className="font-semibold text-[color:var(--accent-success)] mb-1">5 - Excellent</div>
                          <p className="body-sm text-[color:var(--text-secondary)]">Signifies a high level of expertise and consistent high performance</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                <div className="space-y-6">
                  {evaluationData.competencies.map((competency, index) => {
                    const rubricCompetency = rubrics[0]?.competencies.find(r => r.key === competency.key);
                    return (
                      <Card key={competency.key} className="card" data-testid={`competency-${competency.key}-card`}>
                        <div className="card__body">
                          <div className="grid md:grid-cols-12 gap-6 items-start">
                            {/* Competency Info */}
                            <div className="md:col-span-3">
                              <h4 className="h4 mb-2">{competency.name}</h4>
                              {rubricCompetency && (
                                <p className="body-sm text-[color:var(--text-secondary)] mb-3">
                                  {rubricCompetency.description}
                                </p>
                              )}
                            </div>
                            
                            {/* Rating Section */}
                            <div className="md:col-span-4 space-y-4">
                              <div>
                                <Label className="label mb-3">Score: {competency.score}/5</Label>
                                <div className="flex items-center gap-4">
                                  {[1, 2, 3, 4, 5].map((score) => (
                                    <div key={score} className="flex flex-col items-center gap-1">
                                      <input
                                        type="radio"
                                        name={`competency-${competency.key}-score`}
                                        value={score}
                                        checked={competency.score === score}
                                        onChange={() => updateCompetencyScore(index, [score])}
                                        data-testid={`competency-${competency.key}-score-${score}`}
                                        className="w-4 h-4 text-[var(--brand)] bg-[var(--bg-card)] border-[var(--border-medium)] focus:ring-[var(--brand)] focus:ring-2"
                                      />
                                      <span className="body-sm text-[color:var(--text-secondary)] font-medium">{score}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between text-xs text-[color:var(--text-muted)] mt-2">
                                  <span>Concerning</span>
                                  <span>Developing</span>
                                  <span>Solid</span>
                                  <span>Strong</span>
                                  <span>Excellent</span>
                                </div>
                              </div>
                              
                              {/* Dynamic Rubric Criteria Display */}
                              {rubricCompetency && (
                                <div className="p-4 bg-[color:var(--bg-section)] rounded-[var(--radius-sm)] border-l-4 border-[var(--brand)]">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 rounded-full bg-[var(--brand)] text-white text-xs flex items-center justify-center font-semibold">
                                      {competency.score}
                                    </span>
                                    <strong className="body-sm text-[color:var(--brand)]">
                                      {competency.score === 5 ? 'Excellent' :
                                       competency.score === 4 ? 'Strong' :
                                       competency.score === 3 ? 'Solid' :
                                       competency.score === 2 ? 'Developing' : 'Concerning'}
                                    </strong>
                                  </div>
                                  <p className="body-sm text-[color:var(--text-secondary)]">
                                    {competency.score === 5 ? rubricCompetency.criteria.excellent :
                                     competency.score === 4 ? rubricCompetency.criteria.strong :
                                     competency.score === 3 ? rubricCompetency.criteria.solid :
                                     competency.score === 2 ? rubricCompetency.criteria.developing : 
                                     rubricCompetency.criteria.concerning}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {/* Evidence Section */}
                            <div className="md:col-span-5">
                              <Label className="label">Evidence & Examples</Label>
                              <Textarea
                                value={competency.evidence || ""}
                                onChange={(e) => updateCompetencyEvidence(index, e.target.value)}
                                data-testid={`competency-${competency.key}-evidence`}
                                className="input min-h-[140px]"
                                placeholder="Provide specific examples that demonstrate this competency level:
• What actions did you take?
• What was the impact or outcome?
• How did this demonstrate the competency?

Example: 'Led implementation of new AWS Glue data pipeline that reduced processing time by 40%, demonstrating initiative in learning new technology and driving results for the client.'"
                              />
                              {competency.evidence && competency.evidence.length > 500 && (
                                <p className="text-xs text-[color:var(--text-muted)] mt-1">
                                  {competency.evidence.length} characters (detailed evidence provided)
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* IDP Tab */}
              <TabsContent value="idp" data-testid="idp-content" className="space-y-8">
                <div>
                  <h3 className="h3 mb-4">Individual Development Plan (IDP)</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Complete your self-reflection and define your development goals.
                  </p>
                </div>

                {/* A. Current State: Self Reflection */}
                <Card className="card">
                  <div className="card__header">
                    <h4 className="h4">A. Current State: Self Reflection</h4>
                  </div>
                  <div className="card__body space-y-6">
                    <div>
                      <Label className="label">1. What do you consider your key strengths?</Label>
                      <Textarea
                        value={evaluationData.idp.self_reflection?.key_strengths || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            self_reflection: {
                              ...evaluationData.idp.self_reflection,
                              key_strengths: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-key-strengths"
                        className="input min-h-[100px]"
                        placeholder="Describe your key strengths and core competencies..."
                      />
                    </div>

                    <div>
                      <Label className="label">2. What are you most passionate about?</Label>
                      <Textarea
                        value={evaluationData.idp.self_reflection?.passions || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            self_reflection: {
                              ...evaluationData.idp.self_reflection,
                              passions: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-passions"
                        className="input min-h-[100px]"
                        placeholder="Share what motivates and excites you in your work..."
                      />
                    </div>

                    <div>
                      <Label className="label">3. What development opportunities do you have?</Label>
                      <Textarea
                        value={evaluationData.idp.self_reflection?.development_opportunities || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            self_reflection: {
                              ...evaluationData.idp.self_reflection,
                              development_opportunities: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-development-opportunities"
                        className="input min-h-[100px]"
                        placeholder="Identify areas where you see opportunities for growth and improvement..."
                      />
                    </div>

                    <div>
                      <Label className="label">4. What accomplishments are you most proud of and why?</Label>
                      <Textarea
                        value={evaluationData.idp.self_reflection?.proud_accomplishments || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            self_reflection: {
                              ...evaluationData.idp.self_reflection,
                              proud_accomplishments: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-proud-accomplishments"
                        className="input min-h-[100px]"
                        placeholder="Describe your key accomplishments and what made them meaningful to you..."
                      />
                    </div>
                  </div>
                </Card>

                {/* B. Future State: Development Goals */}
                <Card className="card">
                  <div className="card__header">
                    <h4 className="h4">B. Future State: Development Goals</h4>
                  </div>
                  <div className="card__body space-y-6">
                    <div>
                      <Label className="label">1. What TEKsystems roles are you interested in?</Label>
                      <Textarea
                        value={evaluationData.idp.development_goals?.teksystems_roles || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            development_goals: {
                              ...evaluationData.idp.development_goals,
                              teksystems_roles: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-teksystems-roles"
                        className="input min-h-[100px]"
                        placeholder="Describe specific TEKsystems roles or career paths that interest you..."
                      />
                    </div>

                    <div>
                      <Label className="label">2. What are the professional goals that you would like to accomplish in the next 6 to 12 months?</Label>
                      <Textarea
                        value={evaluationData.idp.development_goals?.professional_goals || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            development_goals: {
                              ...evaluationData.idp.development_goals,
                              professional_goals: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-professional-goals"
                        className="input min-h-[120px]"
                        placeholder="Outline your short-term professional objectives, skill development, certifications, or project goals..."
                      />
                    </div>

                    <div>
                      <Label className="label">3. What are the personal goals that you would like to accomplish in the next 6 to 12 months?</Label>
                      <Textarea
                        value={evaluationData.idp.development_goals?.personal_goals || ""}
                        onChange={(e) => updateEvaluationData({ 
                          idp: { 
                            ...evaluationData.idp, 
                            development_goals: {
                              ...evaluationData.idp.development_goals,
                              personal_goals: e.target.value
                            }
                          } 
                        })}
                        data-testid="idp-personal-goals"
                        className="input min-h-[120px]"
                        placeholder="Share your personal development goals, work-life balance objectives, or learning aspirations..."
                      />
                    </div>
                  </div>
                </Card>

                {/* Legacy Goals Section (Keep for backward compatibility) */}
                <Card className="card">
                  <div className="card__header">
                    <h4 className="h4">Additional Development Goals (Optional)</h4>
                  </div>
                  <div className="card__body space-y-4">
                    <div>
                      <Label className="label">Specific Development Goals</Label>
                      <Button
                        variant="outline"
                        onClick={() => {
                          const newGoals = [...(evaluationData.idp.goals || []), { title: "", description: "", target_date: null }];
                          updateEvaluationData({ idp: { ...evaluationData.idp, goals: newGoals } });
                        }}
                        data-testid="add-idp-goal-button"
                        className="mb-3"
                      >
                        Add Goal
                      </Button>
                      
                      <div className="space-y-3">
                        {evaluationData.idp.goals?.map((goal, index) => (
                          <Card key={index} className="card" data-testid={`idp-goal-${index}-card`}>
                            <div className="card__body space-y-3">
                              <Input
                                value={goal.title}
                                onChange={(e) => {
                                  const newGoals = [...evaluationData.idp.goals];
                                  newGoals[index] = { ...newGoals[index], title: e.target.value };
                                  updateEvaluationData({ idp: { ...evaluationData.idp, goals: newGoals } });
                                }}
                                placeholder="Goal title"
                                data-testid={`idp-goal-${index}-title`}
                                className="input"
                              />
                              <Textarea
                                value={goal.description}
                                onChange={(e) => {
                                  const newGoals = [...evaluationData.idp.goals];
                                  newGoals[index] = { ...newGoals[index], description: e.target.value };
                                  updateEvaluationData({ idp: { ...evaluationData.idp, goals: newGoals } });
                                }}
                                placeholder="Goal description and action steps"
                                data-testid={`idp-goal-${index}-description`}
                                className="input min-h-[80px]"
                              />
                              <div className="flex justify-between items-center">
                                <Input
                                  type="date"
                                  value={goal.target_date ? new Date(goal.target_date).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    const newGoals = [...evaluationData.idp.goals];
                                    newGoals[index] = { ...newGoals[index], target_date: e.target.value ? new Date(e.target.value).toISOString() : null };
                                    updateEvaluationData({ idp: { ...evaluationData.idp, goals: newGoals } });
                                  }}
                                  data-testid={`idp-goal-${index}-target-date`}
                                  className="input max-w-xs"
                                />
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    const newGoals = evaluationData.idp.goals.filter((_, i) => i !== index);
                                    updateEvaluationData({ idp: { ...evaluationData.idp, goals: newGoals } });
                                  }}
                                  data-testid={`remove-idp-goal-${index}-button`}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )) || []}
                      </div>
                    </div>
                    
                    <div>
                      <Label className="label">Progress Notes</Label>
                      <Textarea
                        value={evaluationData.idp.progress_notes || ""}
                        onChange={(e) => updateEvaluationData({ idp: { ...evaluationData.idp, progress_notes: e.target.value } })}
                        data-testid="idp-progress-notes"
                        className="input min-h-[120px]"
                        placeholder="Notes on progress toward development goals..."
                      />
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Certifications Tab */}
              <TabsContent value="certifications" data-testid="certifications-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Certifications & Training</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Track completed certifications and commitments.
                  </p>
                </div>

                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      const newCerts = [...(evaluationData.certifications || []), { name: "", status: "committed", completed_on: null }];
                      updateEvaluationData({ certifications: newCerts });
                    }}
                    data-testid="add-certification-button"
                  >
                    Add Certification
                  </Button>
                  
                  <div className="space-y-3">
                    {evaluationData.certifications?.map((cert, index) => (
                      <Card key={index} className="card" data-testid={`certification-${index}-card`}>
                        <div className="card__body">
                          <div className="grid md:grid-cols-12 gap-4 items-center">
                            <div className="md:col-span-4">
                              <Input
                                value={cert.name}
                                onChange={(e) => {
                                  const newCerts = [...evaluationData.certifications];
                                  newCerts[index] = { ...newCerts[index], name: e.target.value };
                                  updateEvaluationData({ certifications: newCerts });
                                }}
                                placeholder="Certification name"
                                data-testid={`certification-${index}-name`}
                                className="input"
                              />
                            </div>
                            <div className="md:col-span-3">
                              <Select
                                value={cert.status}
                                onValueChange={(value) => {
                                  const newCerts = [...evaluationData.certifications];
                                  newCerts[index] = { ...newCerts[index], status: value };
                                  updateEvaluationData({ certifications: newCerts });
                                }}
                              >
                                <SelectTrigger data-testid={`certification-${index}-status`} className="input">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="committed">Committed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="md:col-span-3">
                              {cert.status === 'completed' && (
                                <Input
                                  type="date"
                                  value={cert.completed_on ? new Date(cert.completed_on).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    const newCerts = [...evaluationData.certifications];
                                    newCerts[index] = { ...newCerts[index], completed_on: e.target.value ? new Date(e.target.value).toISOString() : null };
                                    updateEvaluationData({ certifications: newCerts });
                                  }}
                                  data-testid={`certification-${index}-completed-date`}
                                  className="input"
                                />
                              )}
                            </div>
                            <div className="md:col-span-2">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => {
                                  const newCerts = evaluationData.certifications.filter((_, i) => i !== index);
                                  updateEvaluationData({ certifications: newCerts });
                                }}
                                data-testid={`remove-certification-${index}-button`}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )) || []}
                  </div>
                </div>
              </TabsContent>

              {/* Role Fit Tab */}
              <TabsContent value="role-fit" data-testid="role-fit-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Role Fit Analysis</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Evaluate performance against role-specific expectations and readiness for advancement using the EBR (Expected Behavior & Results) framework.
                  </p>
                </div>

                {/* Current and Next Role Overview */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="card">
                    <div className="card__body space-y-4">
                      <h4 className="h4">Current Role Performance</h4>
                      <div>
                        <Label className="label">Role Title</Label>
                        <Input
                          value={evaluationData.role_fit.current_role}
                          onChange={(e) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, current_role: e.target.value } 
                          })}
                          data-testid="current-role-input"
                          className="input"
                          placeholder="Current role title"
                        />
                      </div>
                      <div>
                        <Label className="label">Overall Fit Score: {evaluationData.role_fit.fit_current}</Label>
                        <Slider
                          value={[evaluationData.role_fit.fit_current]}
                          onValueChange={(value) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, fit_current: value[0] } 
                          })}
                          max={5}
                          min={1}
                          step={1}
                          data-testid="current-role-fit-slider"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="card">
                    <div className="card__body space-y-4">
                      <h4 className="h4">Next Role Readiness</h4>
                      <div>
                        <Label className="label">Target Role</Label>
                        <Input
                          value={evaluationData.role_fit.next_role}
                          onChange={(e) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, next_role: e.target.value } 
                          })}
                          data-testid="next-role-input"
                          className="input"
                          placeholder="Target next role"
                        />
                      </div>
                      <div>
                        <Label className="label">Readiness Score: {evaluationData.role_fit.fit_next}</Label>
                        <Slider
                          value={[evaluationData.role_fit.fit_next]}
                          onValueChange={(value) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, fit_next: value[0] } 
                          })}
                          max={5}
                          min={1}
                          step={1}
                          data-testid="next-role-fit-slider"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* EBR Framework Assessment */}
                <div className="space-y-6">
                  <h4 className="h4">EBR Framework Assessment</h4>
                  <p className="body-sm text-[color:var(--text-secondary)] mb-4">
                    Evaluate performance against Expected Behavior & Results criteria across four key dimensions.
                  </p>

                  {/* 1. Organization */}
                  <Card className="card">
                    <div className="card__header">
                      <h5 className="body-md font-semibold">1. Organization</h5>
                    </div>
                    <div className="card__body space-y-6">
                      <div>
                        <Label className="label">Engagement - Staying engaged in billable capacity in projects</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: >85% Utilization</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={evaluationData.role_fit.ebr_organization_utilization || ""}
                              onChange={(e) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_organization_utilization: e.target.value } 
                              })}
                              data-testid="organization-utilization-input"
                              className="input"
                              placeholder="Current utilization %"
                            />
                          </div>
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Assessment</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_organization_engagement || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_organization_engagement: value } 
                              })}
                            >
                              <SelectTrigger data-testid="organization-engagement-select" className="input">
                                <SelectValue placeholder="Select performance level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exceeds">Exceeds Expectations (>90%)</SelectItem>
                                <SelectItem value="meets">Meets Expectations (85-90%)</SelectItem>
                                <SelectItem value="approaching">Approaching Expectations (75-84%)</SelectItem>
                                <SelectItem value="below">Below Expectations (<75%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="label">Compliance - Complying with all operational hygiene requirements</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: 100% Process Compliance</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_organization_compliance || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_organization_compliance: value } 
                              })}
                            >
                              <SelectTrigger data-testid="organization-compliance-select" className="input">
                                <SelectValue placeholder="Select compliance level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="full">100% Compliant</SelectItem>
                                <SelectItem value="high">95-99% Compliant</SelectItem>
                                <SelectItem value="moderate">90-94% Compliant</SelectItem>
                                <SelectItem value="low">Below 90% Compliant</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 2. Project */}
                  <Card className="card">
                    <div className="card__header">
                      <h5 className="body-md font-semibold">2. Project</h5>
                    </div>
                    <div className="card__body space-y-6">
                      <div>
                        <Label className="label">Accountability & Quality - Being fully accountable for deliverables and ensuring timely delivery</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: >85% Positive Feedback (>90% for senior roles)</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={evaluationData.role_fit.ebr_project_feedback || ""}
                              onChange={(e) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_project_feedback: e.target.value } 
                              })}
                              data-testid="project-feedback-input"
                              className="input"
                              placeholder="Positive feedback %"
                            />
                          </div>
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Quality Assessment</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_project_quality || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_project_quality: value } 
                              })}
                            >
                              <SelectTrigger data-testid="project-quality-select" className="input">
                                <SelectValue placeholder="Select quality level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exceptional">Exceptional (>95%)</SelectItem>
                                <SelectItem value="strong">Strong (90-95%)</SelectItem>
                                <SelectItem value="meets">Meets Target (85-89%)</SelectItem>
                                <SelectItem value="below">Below Target (<85%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 3. Team/Practice */}
                  <Card className="card">
                    <div className="card__header">
                      <h5 className="body-md font-semibold">3. Team / Practice</h5>
                    </div>
                    <div className="card__body space-y-6">
                      <div>
                        <Label className="label">Skill Development & Certification - Continuous investment in upskilling and certifications</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: 2 certifications/year (Foundational/Associate) OR 1/year (Advanced/Professional)</Label>
                            <Input
                              type="number"
                              min="0"
                              value={evaluationData.role_fit.ebr_team_certifications || ""}
                              onChange={(e) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_team_certifications: e.target.value } 
                              })}
                              data-testid="team-certifications-input"
                              className="input"
                              placeholder="Certifications completed"
                            />
                          </div>
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Certification Level</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_team_cert_level || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_team_cert_level: value } 
                              })}
                            >
                              <SelectTrigger data-testid="team-cert-level-select" className="input">
                                <SelectValue placeholder="Select certification level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="advanced">Advanced/Professional/Specialty</SelectItem>
                                <SelectItem value="associate">Associate</SelectItem>
                                <SelectItem value="foundational">Foundational</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="label">Contribution to Practice Maturity</Label>
                        <Textarea
                          value={evaluationData.role_fit.ebr_team_contribution || ""}
                          onChange={(e) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, ebr_team_contribution: e.target.value } 
                          })}
                          data-testid="team-contribution-textarea"
                          className="input min-h-[100px]"
                          placeholder="Describe contributions to practice maturity: new solutions, design patterns, training sessions, etc."
                        />
                      </div>

                      <div>
                        <Label className="label">Team Engagement & Leadership</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: Team Glint Survey >4% above company rating (for leadership roles)</Label>
                            <Input
                              value={evaluationData.role_fit.ebr_team_glint || ""}
                              onChange={(e) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_team_glint: e.target.value } 
                              })}
                              data-testid="team-glint-input"
                              className="input"
                              placeholder="Glint survey rating vs company average"
                            />
                          </div>
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Leadership Assessment</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_team_leadership || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_team_leadership: value } 
                              })}
                            >
                              <SelectTrigger data-testid="team-leadership-select" className="input">
                                <SelectValue placeholder="Select leadership level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exceptional">Exceptional Leader (>6% above company)</SelectItem>
                                <SelectItem value="strong">Strong Leader (4-6% above company)</SelectItem>
                                <SelectItem value="developing">Developing Leader (0-4% above company)</SelectItem>
                                <SelectItem value="needs">Needs Development (below company average)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* 4. Self */}
                  <Card className="card">
                    <div className="card__header">
                      <h5 className="body-md font-semibold">4. Self</h5>
                    </div>
                    <div className="card__body space-y-6">
                      <div>
                        <Label className="label">Individual Development Planning - Define and follow development activities</Label>
                        <div className="grid md:grid-cols-2 gap-4 mt-2">
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Target: >80% Individual Goal Attainment</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={evaluationData.role_fit.ebr_self_goal_attainment || ""}
                              onChange={(e) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_self_goal_attainment: e.target.value } 
                              })}
                              data-testid="self-goal-attainment-input"
                              className="input"
                              placeholder="Goal attainment %"
                            />
                          </div>
                          <div>
                            <Label className="body-sm text-[color:var(--text-secondary)]">Development Assessment</Label>
                            <Select
                              value={evaluationData.role_fit.ebr_self_development || ""}
                              onValueChange={(value) => updateEvaluationData({ 
                                role_fit: { ...evaluationData.role_fit, ebr_self_development: value } 
                              })}
                            >
                              <SelectTrigger data-testid="self-development-select" className="input">
                                <SelectValue placeholder="Select development level" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="exceeds">Exceeds Goals (>90%)</SelectItem>
                                <SelectItem value="meets">Meets Goals (80-90%)</SelectItem>
                                <SelectItem value="approaching">Approaching Goals (70-79%)</SelectItem>
                                <SelectItem value="below">Below Goals (<70%)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="label">Development Plan Progress</Label>
                        <Textarea
                          value={evaluationData.role_fit.ebr_self_progress || ""}
                          onChange={(e) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, ebr_self_progress: e.target.value } 
                          })}
                          data-testid="self-progress-textarea"
                          className="input min-h-[100px]"
                          placeholder="Describe progress on individual development goals following CJM, success profile, and IDP..."
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Development Gaps */}
                <div>
                  <Label className="label">Overall Development Gaps & Action Items</Label>
                  <Textarea
                    value={evaluationData.role_fit.gaps?.join('\n') || ''}
                    onChange={(e) => updateEvaluationData({ 
                      role_fit: { ...evaluationData.role_fit, gaps: e.target.value.split('\n').filter(gap => gap.trim()) } 
                    })}
                    data-testid="role-fit-gaps"
                    className="input min-h-[120px]"
                    placeholder="List specific development gaps and action items based on EBR assessment (one per line)..."
                  />
                </div>
              </TabsContent>

              {/* PM Feedback Tab */}
              <TabsContent value="pm-feedback" data-testid="pm-feedback-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Project Manager Feedback</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Capture feedback from project managers and stakeholders.
                  </p>
                </div>

                <div className="space-y-6">
                  <div>
                    <Label className="label">General Comments</Label>
                    <Textarea
                      value={evaluationData.pm_feedback.comments || ""}
                      onChange={(e) => updateEvaluationData({ 
                        pm_feedback: { ...evaluationData.pm_feedback, comments: e.target.value } 
                      })}
                      data-testid="pm-feedback-comments"
                      className="input min-h-[120px]"
                      placeholder="General feedback and observations from project managers..."
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="label">Strengths</Label>
                      <Textarea
                        value={evaluationData.pm_feedback.strengths?.join('\n') || ''}
                        onChange={(e) => updateEvaluationData({ 
                          pm_feedback: { 
                            ...evaluationData.pm_feedback, 
                            strengths: e.target.value.split('\n').filter(s => s.trim()) 
                          } 
                        })}
                        data-testid="pm-feedback-strengths"
                        className="input min-h-[120px]"
                        placeholder="Key strengths identified (one per line)..."
                      />
                    </div>

                    <div>
                      <Label className="label">Areas to Improve</Label>
                      <Textarea
                        value={evaluationData.pm_feedback.areas_to_improve?.join('\n') || ''}
                        onChange={(e) => updateEvaluationData({ 
                          pm_feedback: { 
                            ...evaluationData.pm_feedback, 
                            areas_to_improve: e.target.value.split('\n').filter(s => s.trim()) 
                          } 
                        })}
                        data-testid="pm-feedback-areas-to-improve"
                        className="input min-h-[120px]"
                        placeholder="Areas for improvement (one per line)..."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Talent Assessment Tab */}
              <TabsContent value="assessment" data-testid="assessment-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Talent Assessment</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Final assessment of talent potential and risk factors.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="label">Potential Level</Label>
                    <Select
                      value={evaluationData.talent_assessment.potential}
                      onValueChange={(value) => updateEvaluationData({ 
                        talent_assessment: { ...evaluationData.talent_assessment, potential: value } 
                      })}
                    >
                      <SelectTrigger data-testid="talent-potential-select" className="input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="label">Risk Level</Label>
                    <Select
                      value={evaluationData.talent_assessment.risk}
                      onValueChange={(value) => updateEvaluationData({ 
                        talent_assessment: { ...evaluationData.talent_assessment, risk: value } 
                      })}
                    >
                      <SelectTrigger data-testid="talent-risk-select" className="input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="label">Overall Rating</Label>
                    <Select
                      value={evaluationData.talent_assessment.overall}
                      onValueChange={(value) => updateEvaluationData({ 
                        talent_assessment: { ...evaluationData.talent_assessment, overall: value } 
                      })}
                    >
                      <SelectTrigger data-testid="talent-overall-select" className="input">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="developing">Developing</SelectItem>
                        <SelectItem value="concerning">Concerning</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Card className="card">
                  <div className="card__body">
                    <h4 className="h4 mb-4">Assessment Summary</h4>
                    <div className="grid md:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className={`metric ${
                          evaluationData.talent_assessment.potential === 'high' ? 'text-[color:var(--accent-success)]' :
                          evaluationData.talent_assessment.potential === 'medium' ? 'text-[color:var(--accent-warning)]' :
                          'text-[color:var(--accent-danger)]'
                        }`}>
                          {evaluationData.talent_assessment.potential.toUpperCase()}
                        </div>
                        <p className="body-sm text-[color:var(--text-secondary)]">Potential</p>
                      </div>
                      <div>
                        <div className={`metric ${
                          evaluationData.talent_assessment.risk === 'low' ? 'text-[color:var(--accent-success)]' :
                          evaluationData.talent_assessment.risk === 'medium' ? 'text-[color:var(--accent-warning)]' :
                          'text-[color:var(--accent-danger)]'
                        }`}>
                          {evaluationData.talent_assessment.risk.toUpperCase()}
                        </div>
                        <p className="body-sm text-[color:var(--text-secondary)]">Risk</p>
                      </div>
                      <div>
                        <div className={`metric ${
                          evaluationData.talent_assessment.overall === 'excellent' ? 'text-[color:var(--accent-success)]' :
                          evaluationData.talent_assessment.overall === 'good' ? 'text-[color:var(--accent-success)]' :
                          evaluationData.talent_assessment.overall === 'developing' ? 'text-[color:var(--accent-warning)]' :
                          'text-[color:var(--accent-danger)]'
                        }`}>
                          {evaluationData.talent_assessment.overall.toUpperCase()}
                        </div>
                        <p className="body-sm text-[color:var(--text-secondary)]">Overall</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </Card>
      </div>

      {/* AI Analysis Sidebar */}
      <div className="space-y-6">
        <Card className="card" data-testid="ai-feedback-panel">
          <div className="card__header flex items-center gap-2">
            <Brain size={20} className="text-[color:var(--brand)]" />
            <h4 className="h4">Manager AI Analysis</h4>
          </div>
          <div className="card__body">
            {aiAnalysis.items.length > 0 ? (
              <div className="space-y-4">
                {aiAnalysis.items.map((item, i) => (
                  <div key={i} data-testid={`ai-feedback-item-${i}`} className="p-3 rounded-[var(--radius-sm)] border-l-4 border-[var(--brand)]">
                    <div className="flex items-start gap-3">
                      <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        item.type === 'risk' ? 'bg-[var(--accent-danger)]' :
                        item.type === 'suggestion' ? 'bg-[var(--accent-info)]' : 
                        'bg-[var(--accent-success)]'
                      }`}></span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.type === 'risk' ? 'bg-[var(--accent-danger)]/10 text-[color:var(--accent-danger)]' :
                            item.type === 'suggestion' ? 'bg-[var(--accent-info)]/10 text-[color:var(--accent-info)]' : 
                            'bg-[var(--accent-success)]/10 text-[color:var(--accent-success)]'
                          }`}>
                            {item.type === 'risk' ? 'Development Area' :
                             item.type === 'suggestion' ? 'Manager Feedback' : 'Strength'}
                          </span>
                        </div>
                        <p className="body-sm text-[color:var(--text-secondary)]">{item.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Rubric Alignment Section */}
                {aiAnalysis.rubric_alignment.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-light)]">
                    <h5 className="body-md font-semibold mb-2 text-[color:var(--text-primary)]">Performance Analysis</h5>
                    <div className="space-y-2">
                      {aiAnalysis.rubric_alignment.map((alignment, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--brand)] rounded-full mt-2 flex-shrink-0"></span>
                          <p className="body-sm text-[color:var(--text-secondary)]">{alignment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Missing Fields Section */}
                {aiAnalysis.missing_fields.length > 0 && (
                  <div className="pt-4 border-t border-[var(--border-light)]">
                    <h5 className="body-md font-semibold mb-2 text-[color:var(--accent-warning)]">Action Items</h5>
                    <div className="space-y-2">
                      {aiAnalysis.missing_fields.map((field, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--accent-warning)] rounded-full mt-2 flex-shrink-0"></span>
                          <p className="body-sm text-[color:var(--text-secondary)]">{field}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Analysis Status */}
                <div className="pt-4 border-t border-[var(--border-light)]">
                  <div className="flex items-center gap-2">
                    <Brain size={14} className="text-[color:var(--accent-success)]" />
                    <p className="body-sm text-[color:var(--accent-success)] font-medium">
                      Manager AI Analysis Active
                    </p>
                  </div>
                  <p className="body-sm text-[color:var(--text-muted)] mt-1">
                    Real-time feedback based on evaluation data
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain size={48} className="mx-auto text-[color:var(--text-muted)] mb-4" />
                <h5 className="body-md font-semibold mb-2">Manager AI Analysis</h5>
                <p className="body-sm text-[color:var(--text-muted)] mb-4">
                  AI will provide manager-level feedback and rating recommendations as you complete the evaluation.
                </p>
                <div className="p-3 bg-[color:var(--bg-section)] rounded-[var(--radius-sm)] text-left">
                  <p className="body-sm text-[color:var(--text-secondary)]">
                    <strong>AI will analyze:</strong><br/>
                    • Competency ratings vs evidence<br/>
                    • Self-reflection alignment<br/>
                    • Development goal clarity<br/>
                    • Overall performance patterns
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default EvaluationForm;