import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import CompetencyRadarChart from "@/components/CompetencyRadarChart";
import { ArrowLeft, Download, FileText, User, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function ReportView() {
  const { menteeId, cycleId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [mentee, setMentee] = useState(null);
  const [cycle, setCycle] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menteeData, cycleData, evaluationData] = await Promise.all([
          api.get(`/mentees/${menteeId}`),
          api.get(`/cycles/${cycleId}`),
          api.get(`/evaluations/${cycleId}`)
        ]);
        
        setMentee(menteeData);
        setCycle(cycleData);
        setEvaluation(evaluationData);
        
        // Try to fetch existing report
        try {
          const reportData = await api.get(`/reports/${cycleId}`);
          setReport(reportData);
        } catch (error) {
          // No report exists yet
        }
      } catch (error) {
        toast.error('Failed to load report data');
        console.error('Error fetching report data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [menteeId, cycleId]);

  const generateReport = async () => {
    try {
      setGenerating(true);
      const reportData = await api.post('/reports/generate', { cycle_id: cycleId });
      setReport(reportData);
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error('Error generating report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const exportPDF = () => {
    toast.info('PDF export functionality coming soon!');
  };

  if (loading) {
    return (
      <div data-testid="report-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  const competencyAverage = evaluation?.competencies?.length > 0 
    ? (evaluation.competencies.reduce((sum, comp) => sum + comp.score, 0) / evaluation.competencies.length).toFixed(1)
    : '0.0';

  return (
    <div data-testid="report-view-page" className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="ghost" 
          onClick={() => navigate(`/mentee/${menteeId}/cycle/${cycleId}/evaluate`)}
          data-testid="back-to-evaluation-button"
        >
          <ArrowLeft size={18} />
          Back to Evaluation
        </Button>
        
        <div className="flex items-center gap-3">
          {!report && (
            <Button 
              onClick={generateReport}
              disabled={generating}
              data-testid="generate-report-button"
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
            >
              <FileText size={18} />
              {generating ? 'Generating...' : 'Generate Report'}
            </Button>
          )}
          
          {report && (
            <Button 
              onClick={exportPDF}
              variant="outline"
              data-testid="export-pdf-button"
            >
              <Download size={18} />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Report Content */}
      <div className="report max-w-4xl mx-auto space-y-6">
        {/* Header Section */}
        <Card className="card">
          <div className="card__body">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="h1 mb-2">Performance Evaluation Report</h1>
                <h2 className="h2 text-[color:var(--brand)] mb-1">{mentee?.name}</h2>
                <p className="body-lg text-[color:var(--text-secondary)]">{mentee?.role}</p>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">{cycle?.period_label}</Badge>
                <p className="body-sm text-[color:var(--text-secondary)]">
                  {cycle && new Date(cycle.start_date).toLocaleDateString()} - {cycle && new Date(cycle.end_date).toLocaleDateString()}
                </p>
                <p className="body-sm text-[color:var(--text-muted)]">
                  Generated: {report ? new Date(report.generated_at).toLocaleDateString() : 'Not generated'}
                </p>
              </div>
            </div>
            
            {/* Executive Summary */}
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="card p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-[color:var(--brand)]" />
                </div>
                <div className="metric">{competencyAverage}</div>
                <p className="body-sm text-[color:var(--text-secondary)]">Avg Competency</p>
              </Card>
              
              <Card className="card p-4 text-center">
                <div className="metric">{evaluation?.idp?.goals?.length || 0}</div>
                <p className="body-sm text-[color:var(--text-secondary)]">Development Goals</p>
              </Card>
              
              <Card className="card p-4 text-center">
                <div className="metric text-[color:var(--accent-success)]">
                  {evaluation?.talent_assessment?.overall?.toUpperCase() || 'N/A'}
                </div>
                <p className="body-sm text-[color:var(--text-secondary)]">Overall Rating</p>
              </Card>
              
              <Card className="card p-4 text-center">
                <div className="metric">{evaluation?.certifications?.length || 0}</div>
                <p className="body-sm text-[color:var(--text-secondary)]">Certifications</p>
              </Card>
            </div>
          </div>
        </Card>

        {/* Competency Analysis */}
        <Card className="card">
          <div className="card__header">
            <h3 className="h3">Competency Analysis</h3>
          </div>
          <div className="card__body">
            {evaluation?.competencies?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Radar Chart */}
                <div>
                  <h4 className="h4 mb-4">Competency Profile</h4>
                  <CompetencyRadarChart 
                    competencies={evaluation.competencies} 
                    className="bg-[color:var(--bg-section)] rounded-[var(--radius-md)] p-4"
                  />
                </div>
                
                {/* Detailed Scores */}
                <div className="space-y-4">
                  <h4 className="h4 mb-4">Detailed Scores</h4>
                  {evaluation.competencies.map((competency, index) => (
                    <div key={competency.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h5 className="body-md font-medium">{competency.name}</h5>
                        <Badge variant={competency.score >= 4 ? 'default' : competency.score >= 3 ? 'secondary' : 'destructive'}>
                          {competency.score}/5
                        </Badge>
                      </div>
                      <Progress value={(competency.score / 5) * 100} className="w-full" />
                      {competency.evidence && (
                        <p className="body-sm text-[color:var(--text-secondary)] pl-4 border-l-2 border-[var(--border-light)] mt-2">
                          {competency.evidence}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="body-md text-[color:var(--text-muted)]">No competency data available.</p>
            )}
          </div>
        </Card>

        {/* Development Plan */}
        {evaluation?.idp?.goals?.length > 0 && (
          <Card className="card">
            <div className="card__header">
              <h3 className="h3">Individual Development Plan</h3>
            </div>
            <div className="card__body space-y-4">
              {evaluation.idp.goals.map((goal, index) => (
                <div key={index} className="p-4 bg-[color:var(--bg-section)] rounded-[var(--radius-sm)]">
                  <h4 className="h4 mb-2">{goal.title}</h4>
                  <p className="body-sm text-[color:var(--text-secondary)] mb-2">{goal.description}</p>
                  {goal.target_date && (
                    <p className="body-sm text-[color:var(--text-muted)]">
                      Target: {new Date(goal.target_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
              
              {evaluation.idp.progress_notes && (
                <div>
                  <h4 className="h4 mb-2">Progress Notes</h4>
                  <p className="body-sm text-[color:var(--text-secondary)]">
                    {evaluation.idp.progress_notes}
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Role Fit Analysis */}
        {evaluation?.role_fit && (
          <Card className="card">
            <div className="card__header">
              <h3 className="h3">Role Fit Analysis</h3>
            </div>
            <div className="card__body">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="h4 mb-3">Current Role Performance</h4>
                  <p className="body-md mb-2">{evaluation.role_fit.current_role}</p>
                  <div className="flex items-center gap-3">
                    <Progress value={(evaluation.role_fit.fit_current / 5) * 100} className="flex-1" />
                    <span className="body-sm font-medium">{evaluation.role_fit.fit_current}/5</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="h4 mb-3">Next Role Readiness</h4>
                  <p className="body-md mb-2">{evaluation.role_fit.next_role || 'Not specified'}</p>
                  <div className="flex items-center gap-3">
                    <Progress value={(evaluation.role_fit.fit_next / 5) * 100} className="flex-1" />
                    <span className="body-sm font-medium">{evaluation.role_fit.fit_next}/5</span>
                  </div>
                </div>
              </div>
              
              {evaluation.role_fit.gaps?.length > 0 && (
                <div className="mt-6">
                  <h4 className="h4 mb-3">Development Gaps</h4>
                  <ul className="space-y-1">
                    {evaluation.role_fit.gaps.map((gap, index) => (
                      <li key={index} className="body-sm text-[color:var(--text-secondary)] flex items-start gap-2">
                        <span className="w-1.5 h-1.5 bg-[var(--accent-warning)] rounded-full mt-2 flex-shrink-0"></span>
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* PM Feedback */}
        {evaluation?.pm_feedback && (evaluation.pm_feedback.comments || evaluation.pm_feedback.strengths?.length > 0 || evaluation.pm_feedback.areas_to_improve?.length > 0) && (
          <Card className="card">
            <div className="card__header">
              <h3 className="h3">Manager & Stakeholder Feedback</h3>
            </div>
            <div className="card__body space-y-4">
              {evaluation.pm_feedback.comments && (
                <div>
                  <h4 className="h4 mb-2">General Comments</h4>
                  <p className="body-sm text-[color:var(--text-secondary)] p-3 bg-[color:var(--bg-section)] rounded-[var(--radius-sm)]">
                    {evaluation.pm_feedback.comments}
                  </p>
                </div>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                {evaluation.pm_feedback.strengths?.length > 0 && (
                  <div>
                    <h4 className="h4 mb-3">Strengths</h4>
                    <ul className="space-y-2">
                      {evaluation.pm_feedback.strengths.map((strength, index) => (
                        <li key={index} className="body-sm text-[color:var(--text-secondary)] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--accent-success)] rounded-full mt-2 flex-shrink-0"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {evaluation.pm_feedback.areas_to_improve?.length > 0 && (
                  <div>
                    <h4 className="h4 mb-3">Areas for Improvement</h4>
                    <ul className="space-y-2">
                      {evaluation.pm_feedback.areas_to_improve.map((area, index) => (
                        <li key={index} className="body-sm text-[color:var(--text-secondary)] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--accent-warning)] rounded-full mt-2 flex-shrink-0"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Talent Assessment Summary */}
        {evaluation?.talent_assessment && (
          <Card className="card">
            <div className="card__header">
              <h3 className="h3">Talent Assessment Summary</h3>
            </div>
            <div className="card__body">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className={`metric mb-2 ${
                    evaluation.talent_assessment.potential === 'high' ? 'text-[color:var(--accent-success)]' :
                    evaluation.talent_assessment.potential === 'medium' ? 'text-[color:var(--accent-warning)]' :
                    'text-[color:var(--accent-danger)]'
                  }`}>
                    {evaluation.talent_assessment.potential.toUpperCase()}
                  </div>
                  <p className="body-sm text-[color:var(--text-secondary)]">Growth Potential</p>
                </div>
                
                <div>
                  <div className={`metric mb-2 ${
                    evaluation.talent_assessment.risk === 'low' ? 'text-[color:var(--accent-success)]' :
                    evaluation.talent_assessment.risk === 'medium' ? 'text-[color:var(--accent-warning)]' :
                    'text-[color:var(--accent-danger)]'
                  }`}>
                    {evaluation.talent_assessment.risk.toUpperCase()}
                  </div>
                  <p className="body-sm text-[color:var(--text-secondary)]">Flight Risk</p>
                </div>
                
                <div>
                  <div className={`metric mb-2 ${
                    evaluation.talent_assessment.overall === 'excellent' ? 'text-[color:var(--accent-success)]' :
                    evaluation.talent_assessment.overall === 'good' ? 'text-[color:var(--accent-success)]' :
                    evaluation.talent_assessment.overall === 'developing' ? 'text-[color:var(--accent-warning)]' :
                    'text-[color:var(--accent-danger)]'
                  }`}>
                    {evaluation.talent_assessment.overall.toUpperCase()}
                  </div>
                  <p className="body-sm text-[color:var(--text-secondary)]">Overall Rating</p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Report Summary */}
        {report && (
          <Card className="card">
            <div className="card__header">
              <h3 className="h3">AI-Generated Summary</h3>
            </div>
            <div className="card__body space-y-4">
              {report.summary_text && (
                <p className="body-md text-[color:var(--text-secondary)]">
                  {report.summary_text}
                </p>
              )}
              
              <div className="grid md:grid-cols-2 gap-6">
                {report.highlights?.length > 0 && (
                  <div>
                    <h4 className="h4 mb-3">Key Highlights</h4>
                    <ul className="space-y-2">
                      {report.highlights.map((highlight, index) => (
                        <li key={index} className="body-sm text-[color:var(--text-secondary)] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--accent-success)] rounded-full mt-2 flex-shrink-0"></span>
                          {highlight}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {report.risks?.length > 0 && (
                  <div>
                    <h4 className="h4 mb-3">Risk Areas</h4>
                    <ul className="space-y-2">
                      {report.risks.map((risk, index) => (
                        <li key={index} className="body-sm text-[color:var(--text-secondary)] flex items-start gap-2">
                          <span className="w-1.5 h-1.5 bg-[var(--accent-danger)] rounded-full mt-2 flex-shrink-0"></span>
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ReportView;