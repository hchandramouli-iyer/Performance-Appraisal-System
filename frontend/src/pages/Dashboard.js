import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Plus, User, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";

function Dashboard() {
  const [mentees, setMentees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: ""
  });
  const navigate = useNavigate();

  const fetchMentees = async () => {
    try {
      const data = await api.get('/mentees');
      setMentees(data);
    } catch (error) {
      toast.error('Failed to load mentees');
      console.error('Error fetching mentees:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newMentee = await api.post('/mentees', formData);
      setMentees([...mentees, newMentee]);
      setFormData({ name: "", email: "", role: "" });
      setDialogOpen(false);
      toast.success('Mentee added successfully');
    } catch (error) {
      toast.error('Failed to add mentee');
      console.error('Error creating mentee:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div data-testid="dashboard-loading" className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--brand)]"></div>
      </div>
    );
  }

  return (
    <div data-testid="dashboard-page" className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="h1">Performance Dashboard</h1>
          <p className="body-lg text-[color:var(--text-secondary)] mt-2">
            Manage your mentees and track their performance evaluations.
          </p>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              data-testid="add-mentee-button"
              className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
            >
              <Plus size={18} />
              Add Mentee
            </Button>
          </DialogTrigger>
          <DialogContent data-testid="add-mentee-dialog">
            <DialogHeader>
              <DialogTitle className="h3">Add New Mentee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name" className="label">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  data-testid="mentee-name-input"
                  className="input"
                  required
                />
              </div>
              <div>
                <Label htmlFor="email" className="label">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="mentee-email-input"
                  className="input"
                  required
                />
              </div>
              <div>
                <Label htmlFor="role" className="label">Role</Label>
                <Input
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  data-testid="mentee-role-input"
                  className="input"
                  placeholder="e.g., Senior Software Engineer"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setDialogOpen(false)}
                  data-testid="cancel-add-mentee-button"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  data-testid="submit-add-mentee-button"
                  className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
                >
                  Add Mentee
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card data-testid="total-mentees-card" className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[color:var(--brand-50)] rounded-lg">
              <User size={24} className="text-[color:var(--brand)]" />
            </div>
            <div>
              <div className="metric">{mentees.length}</div>
              <p className="body-sm text-[color:var(--text-secondary)]">Total Mentees</p>
            </div>
          </div>
        </Card>
        
        <Card data-testid="active-cycles-card" className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[color:var(--accent-success)]/10 rounded-lg">
              <Calendar size={24} className="text-[color:var(--accent-success)]" />
            </div>
            <div>
              <div className="metric">0</div>
              <p className="body-sm text-[color:var(--text-secondary)]">Active Cycles</p>
            </div>
          </div>
        </Card>
        
        <Card data-testid="completion-rate-card" className="card p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[color:var(--accent-info)]/10 rounded-lg">
              <TrendingUp size={24} className="text-[color:var(--accent-info)]" />
            </div>
            <div>
              <div className="metric">0%</div>
              <p className="body-sm text-[color:var(--text-secondary)]">Completion Rate</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Mentees Table */}
      <Card className="card">
        <div className="card__header flex items-center justify-between">
          <h3 className="h3">Mentees</h3>
          <Badge variant="secondary" data-testid="mentees-count-badge">
            {mentees.length} total
          </Badge>
        </div>
        <div className="card__body overflow-x-auto">
          {mentees.length === 0 ? (
            <div data-testid="empty-mentees-state" className="text-center py-12">
              <User size={48} className="mx-auto text-[color:var(--text-muted)] mb-4" />
              <h3 className="h3 mb-2">No mentees yet</h3>
              <p className="body-sm text-[color:var(--text-secondary)] mb-4">
                Add your first mentee to start tracking performance evaluations.
              </p>
              <Button 
                onClick={() => setDialogOpen(true)}
                data-testid="empty-add-mentee-button"
                className="bg-[var(--brand)] hover:bg-[var(--brand-hover)] text-white"
              >
                <Plus size={18} />
                Add First Mentee
              </Button>
            </div>
          ) : (
            <Table data-testid="mentees-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Cycles</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mentees.map((mentee) => (
                  <TableRow key={mentee.id} data-testid={`mentee-row-${mentee.id}`}>
                    <TableCell className="font-medium">{mentee.name}</TableCell>
                    <TableCell>{mentee.role}</TableCell>
                    <TableCell className="text-[color:var(--text-secondary)]">{mentee.email}</TableCell>
                    <TableCell>0</TableCell>
                    <TableCell className="text-[color:var(--text-secondary)]">
                      {new Date(mentee.updated_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/mentee/${mentee.id}`)}
                        data-testid={`view-mentee-${mentee.id}-button`}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;