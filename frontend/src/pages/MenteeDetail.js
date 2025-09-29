import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function MenteeDetail() {
  const { menteeId } = useParams();
  const navigate = useNavigate();
  const [mentee, setMentee] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false);
  const [cycleFormData, setCycleFormData] = useState({
    period_label: "",
    start_date: "",
    end_date: "",
    status: "active"
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [menteeData, cyclesData] = await Promise.all([
          api.get(`/mentees/${menteeId}`),
          api.get(`/mentees/${menteeId}/cycles`)
        ]);
        setMentee(menteeData);
        setCycles(cyclesData);
      } catch (error) {
        toast.error('Failed to load mentee data');
        console.error('Error fetching mentee:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [menteeId]);

  const handleCycleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert date strings to ISO format
      const cycleData = {
        ...cycleFormData,
        start_date: new Date(cycleFormData.start_date).toISOString(),
        end_date: new Date(cycleFormData.end_date).toISOString()
      };
      
      const newCycle = await api.post(`/mentees/${menteeId}/cycles`, cycleData);
      setCycles([...cycles, newCycle]);
      setCycleFormData({
        period_label: "",
        start_date: "",
        end_date: "",
        status: "active"
      });
      setCycleDialogOpen(false);
      toast.success('Evaluation cycle created successfully');
    } catch (error) {
      toast.error('Failed to create cycle');
      console.error('Error creating cycle:', error);
    }
  };

  const handleCycleChange = (e) => {
    setCycleFormData({
      ...cycleFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleStatusChange = (value) => {
    setCycleFormData({
      ...cycleFormData,
      status: value
    });
  };

  if (loading) {
    return (
      <div data-testid="mentee-detail-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  if (!mentee) {
    return (
      <div data-testid="mentee-not-found" className="text-center py-12">
        <h2 className="h2 mb-4">Mentee not found</h2>
        <Button onClick={() => navigate('/')} variant="outline">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div data-testid="mentee-detail-page" className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          data-testid="back-to-dashboard-button"
        >
          <ArrowLeft size={18} />
          Back to Dashboard
        </Button>
      </div>

      {/* Mentee Info */}
      <Card className="card">
        <div className="card__body">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="h1">{mentee.name}</h1>
              <p className="body-lg text-[color:var(--brand)] mt-1">{mentee.role}</p>
              <p className="body-md text-[color:var(--text-secondary)] mt-2">{mentee.email}</p>
            </div>
            <Badge variant="secondary" data-testid="cycles-count-badge">
              {cycles.length} cycles
            </Badge>
          </div>
        </div>
      </Card>

      {/* Evaluation Cycles */}
      <Card className="card">
        <div className="card__header flex items-center justify-between">
          <h3 className="h3">Evaluation Cycles</h3>
          <Dialog open={cycleDialogOpen} onOpenChange={setCycleDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                data-testid="create-cycle-button"
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
              >
                <Plus size={18} />
                New Cycle
              </Button>
            </DialogTrigger>
            <DialogContent data-testid="create-cycle-dialog">
              <DialogHeader>
                <DialogTitle className="h3">Create New Evaluation Cycle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCycleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="period_label" className="label">Period Label</Label>
                  <Input
                    id="period_label"
                    name="period_label"
                    value={cycleFormData.period_label}
                    onChange={handleCycleChange}
                    data-testid="cycle-period-input"
                    className="input"
                    placeholder="e.g., Q1 2024 Review"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start_date" className="label">Start Date</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      value={cycleFormData.start_date}
                      onChange={handleCycleChange}
                      data-testid="cycle-start-date-input"
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="end_date" className="label">End Date</Label>
                    <Input
                      id="end_date"
                      name="end_date"
                      type="date"
                      value={cycleFormData.end_date}
                      onChange={handleCycleChange}
                      data-testid="cycle-end-date-input"
                      className="input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label className="label">Status</Label>
                  <Select value={cycleFormData.status} onValueChange={handleStatusChange}>
                    <SelectTrigger data-testid="cycle-status-select" className="input">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setCycleDialogOpen(false)}
                    data-testid="cancel-create-cycle-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    data-testid="submit-create-cycle-button"
                    className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
                  >
                    Create Cycle
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="card__body">
          {cycles.length === 0 ? (
            <div data-testid="empty-cycles-state" className="text-center py-12">
              <Calendar size={48} className="mx-auto text-[color:var(--text-muted)] mb-4" />
              <h3 className="h3 mb-2">No evaluation cycles</h3>
              <p className="body-sm text-[color:var(--text-secondary)] mb-4">
                Create the first evaluation cycle to start tracking {mentee.name}'s performance.
              </p>
              <Button 
                data-testid="empty-create-cycle-button"
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
                onClick={() => setCycleDialogOpen(true)}
              >
                <Plus size={18} />
                Create First Cycle
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {cycles.map((cycle) => (
                <Card key={cycle.id} data-testid={`cycle-${cycle.id}-card`} className="card card--hover">
                  <div className="card__body">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="h4">{cycle.period_label}</h4>
                        <p className="body-sm text-[color:var(--text-secondary)] mt-1">
                          {new Date(cycle.start_date).toLocaleDateString()} - {new Date(cycle.end_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge 
                          variant={cycle.status === 'active' ? 'default' : 'secondary'}
                          data-testid={`cycle-${cycle.id}-status-badge`}
                        >
                          {cycle.status}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/mentee/${menteeId}/cycle/${cycle.id}/evaluate`)}
                          data-testid={`evaluate-cycle-${cycle.id}-button`}
                        >
                          <FileText size={16} />
                          Evaluate
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default MenteeDetail;