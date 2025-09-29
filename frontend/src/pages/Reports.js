import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

function Reports() {
  return (
    <div data-testid="reports-page" className="space-y-8">
      <div>
        <h1 className="h1">Performance Reports</h1>
        <p className="body-lg text-[color:var(--text-secondary)] mt-2">
          Generate and view comprehensive performance evaluation reports.
        </p>
      </div>

      <Card className="card">
        <div className="card__body text-center py-12">
          <FileText size={48} className="mx-auto text-[color:var(--text-muted)] mb-4" />
          <h3 className="h3 mb-2">No reports generated</h3>
          <p className="body-sm text-[color:var(--text-secondary)] mb-4">
            Reports will appear here once evaluations are completed.
          </p>
          <Button 
            variant="outline"
            data-testid="reports-placeholder-button"
            disabled
          >
            Generate Report
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default Reports;