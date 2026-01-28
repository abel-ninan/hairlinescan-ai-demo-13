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
      <h3 className="text-sm font-semibold text-foreground">Tell Us About You</h3>

      <div className="space-y-3">
        {/* Age Range */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Your Age</Label>
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
          <Label className="text-xs text-muted-foreground">How long have you had this hairstyle?</Label>
          <Select value={data.timeframe} onValueChange={(v) => handleChange("timeframe", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weeks">A few weeks</SelectItem>
              <SelectItem value="months">Several months</SelectItem>
              <SelectItem value="years">Years</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hair Type */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Hair type in your family</Label>
          <Select value={data.familyHistory} onValueChange={(v) => handleChange("familyHistory", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="yes">Similar to mine</SelectItem>
              <SelectItem value="no">Different from mine</SelectItem>
              <SelectItem value="unsure">Not sure</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Styling */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">How often do you style your hair?</Label>
          <Select value={data.shedding} onValueChange={(v) => handleChange("shedding", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Rarely</SelectItem>
              <SelectItem value="medium">Sometimes</SelectItem>
              <SelectItem value="high">Daily</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Hair Care */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Your hair care routine</Label>
          <Select value={data.scalpIssues} onValueChange={(v) => handleChange("scalpIssues", v)}>
            <SelectTrigger className="h-9 bg-secondary/50 border-border/50">
              <SelectValue placeholder="Select routine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Basic (shampoo only)</SelectItem>
              <SelectItem value="itch">Moderate (shampoo + conditioner)</SelectItem>
              <SelectItem value="flaking">Extensive (multiple products)</SelectItem>
              <SelectItem value="redness">Professional treatments</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
