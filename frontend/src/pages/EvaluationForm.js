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
                onClick={() => toast.info('Report generation coming soon!')}
              >
                <FileText size={18} />
                Generate Report
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
                <div>
                  <h3 className="h3 mb-4">Evaluation Overview</h3>
                  <div className="grid md:grid-cols-3 gap-4">
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
                  </div>
                </div>
                
                <Separator />
                
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
              </TabsContent>

              {/* Competencies Tab */}
              <TabsContent value="competencies" data-testid="competencies-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Competency Evaluation</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Rate each competency on a scale of 0-5 and provide evidence and examples.
                  </p>
                </div>
                
                <div className="space-y-6">
                  {evaluationData.competencies.map((competency, index) => {
                    const rubricCompetency = rubrics[0]?.competencies.find(r => r.key === competency.key);
                    return (
                      <Card key={competency.key} className="card" data-testid={`competency-${competency.key}-card`}>
                        <div className="card__body">
                          <div className="grid md:grid-cols-12 gap-4 items-start">
                            <div className="md:col-span-3">
                              <h4 className="h4 mb-2">{competency.name}</h4>
                              {rubricCompetency && (
                                <p className="body-sm text-[color:var(--text-secondary)] mb-3">
                                  {rubricCompetency.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="md:col-span-4 space-y-3">
                              <div>
                                <Label className="label mb-2">Score: {competency.score}</Label>
                                <Slider
                                  value={[competency.score]}
                                  onValueChange={(value) => updateCompetencyScore(index, value)}
                                  max={5}
                                  min={0}
                                  step={1}
                                  data-testid={`competency-${competency.key}-slider`}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-[color:var(--text-muted)] mt-1">
                                  <span>0</span>
                                  <span>1</span>
                                  <span>2</span>
                                  <span>3</span>
                                  <span>4</span>
                                  <span>5</span>
                                </div>
                              </div>
                              
                              {rubricCompetency && (
                                <div className="p-3 bg-[color:var(--bg-section)] rounded-[var(--radius-sm)]">
                                  <p className="body-sm">
                                    <strong>
                                      {competency.score === 5 ? 'Excellent: ' :
                                       competency.score === 4 ? 'Strong: ' :
                                       competency.score === 3 ? 'Solid: ' :
                                       competency.score === 2 ? 'Developing: ' : 'Concerning: '}
                                    </strong>
                                    {competency.score === 5 ? rubricCompetency.criteria.excellent :
                                     competency.score === 4 ? rubricCompetency.criteria.strong :
                                     competency.score === 3 ? rubricCompetency.criteria.solid :
                                     competency.score === 2 ? rubricCompetency.criteria.developing : 
                                     rubricCompetency.criteria.concerning}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            <div className="md:col-span-5">
                              <Label className="label">Evidence & Examples</Label>
                              <Textarea
                                value={competency.evidence || ""}
                                onChange={(e) => updateCompetencyEvidence(index, e.target.value)}
                                data-testid={`competency-${competency.key}-evidence`}
                                className="input min-h-[120px]"
                                placeholder="Provide specific examples and evidence supporting this rating..."
                              />
                            </div>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              {/* IDP Tab */}
              <TabsContent value="idp" data-testid="idp-content" className="space-y-6">
                <div>
                  <h3 className="h3 mb-4">Individual Development Plan (IDP)</h3>
                  <p className="body-md text-[color:var(--text-secondary)] mb-6">
                    Define development goals and track progress.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="label">Development Goals</Label>
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
                    Evaluate current role performance and readiness for next role.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="card">
                    <div className="card__body space-y-4">
                      <h4 className="h4">Current Role</h4>
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
                        <Label className="label">Fit Score: {evaluationData.role_fit.fit_current}</Label>
                        <Slider
                          value={[evaluationData.role_fit.fit_current]}
                          onValueChange={(value) => updateEvaluationData({ 
                            role_fit: { ...evaluationData.role_fit, fit_current: value[0] } 
                          })}
                          max={5}
                          min={0}
                          step={1}
                          data-testid="current-role-fit-slider"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>

                  <Card className="card">
                    <div className="card__body space-y-4">
                      <h4 className="h4">Next Role</h4>
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
                          min={0}
                          step={1}
                          data-testid="next-role-fit-slider"
                          className="w-full"
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                <div>
                  <Label className="label">Identified Gaps</Label>
                  <Textarea
                    value={evaluationData.role_fit.gaps?.join('\n') || ''}
                    onChange={(e) => updateEvaluationData({ 
                      role_fit: { ...evaluationData.role_fit, gaps: e.target.value.split('\n').filter(gap => gap.trim()) } 
                    })}
                    data-testid="role-fit-gaps"
                    className="input min-h-[120px]"
                    placeholder="List gaps to address for role progression (one per line)..."
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
            <h4 className="h4">AI Analysis</h4>
          </div>
          <div className="card__body">
            {aiAnalysis.items.length > 0 ? (
              <div className="space-y-3">
                {aiAnalysis.items.map((item, i) => (
                  <div key={i} data-testid={`ai-feedback-item-${i}`} className="flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      item.type === 'risk' ? 'bg-[var(--accent-danger)]' :
                      item.type === 'suggestion' ? 'bg-[var(--accent-info)]' : 
                      'bg-[var(--accent-success)]'
                    }`}></span>
                    <p className="body-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Brain size={32} className="mx-auto text-[color:var(--text-muted)] mb-2" />
                <p className="body-sm text-[color:var(--text-muted)]">
                  AI analysis will appear here as you fill out the evaluation.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default EvaluationForm;