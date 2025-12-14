import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface QuestionnaireData {
  ageRange: string;
  timeframe: string;
  familyHistory: string;
  shedding: string;
  scalpIssues: string;
}

interface QuestionnaireProps {
  data: QuestionnaireData;
  onChange: (data: QuestionnaireData) => void;
}

export const Questionnaire = ({ data, onChange }: QuestionnaireProps) => {
  const handleChange = (field: keyof QuestionnaireData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-foreground">Quick Assessment</h3>
      
      <div className="space-y-3">
        {/* Age Range */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Age Range</Label>
          <Select value={data.ageRange} onValueChange={(v) => handleChange("ageRange", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select age range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="18-25">18-25</SelectItem>
              <SelectItem value="26-35">26-35</SelectItem>
              <SelectItem value="36-45">36-45</SelectItem>
              <SelectItem value="46-55">46-55</SelectItem>
              <SelectItem value="56+">56+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Timeframe */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Noticing changes for</Label>
          <Select value={data.timeframe} onValueChange={(v) => handleChange("timeframe", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weeks">Weeks</SelectItem>
              <SelectItem value="months">Months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Family History */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Family history of hair loss</Label>
          <Select value={data.familyHistory} onValueChange={(v) => handleChange("familyHistory", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Yes</SelectItem>
              <SelectItem value="no">No</SelectItem>
              <SelectItem value="unsure">Unsure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shedding */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Daily hair shedding</Label>
          <Select value={data.shedding} onValueChange={(v) => handleChange("shedding", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low (minimal)</SelectItem>
              <SelectItem value="medium">Medium (noticeable)</SelectItem>
              <SelectItem value="high">High (significant)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scalp Issues */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Scalp conditions</Label>
          <Select value={data.scalpIssues} onValueChange={(v) => handleChange("scalpIssues", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select condition" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="itch">Itchiness</SelectItem>
              <SelectItem value="flaking">Flaking/Dandruff</SelectItem>
              <SelectItem value="redness">Redness</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
