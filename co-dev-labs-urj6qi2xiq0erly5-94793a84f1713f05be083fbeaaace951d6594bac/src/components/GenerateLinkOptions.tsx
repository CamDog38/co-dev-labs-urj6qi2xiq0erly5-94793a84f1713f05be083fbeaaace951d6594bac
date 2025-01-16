import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CalendarIcon, ListIcon, UserIcon } from "lucide-react";
import { GenerateLinkDialog } from "./GenerateLinkDialog";

interface GenerateLinkOptionsProps {
  onSelect: (type: "bio" | "results" | "calendar") => void;
}

export function GenerateLinkOptions({ onSelect }: GenerateLinkOptionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<"bio" | "results" | "calendar" | null>(null);

  const handleSelect = (type: "bio" | "results" | "calendar") => {
    setSelectedType(type);
    setDialogOpen(true);
  };

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="relative overflow-hidden group"
        >
          <div className="p-6 cursor-pointer transition-all duration-200 hover:translate-y-[-4px]" onClick={() => handleSelect("bio")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <UserIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Bio Link</h3>
                <p className="text-sm text-muted-foreground">Generate a complete profile with all your links</p>
              </div>
              <Button variant="secondary" className="w-full">
                Generate Bio Link
              </Button>
            </div>
          </div>
        </Card>

        <Card 
          className="relative overflow-hidden group"
        >
          <div className="p-6 cursor-pointer transition-all duration-200 hover:translate-y-[-4px]" onClick={() => handleSelect("results")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ListIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Results Link</h3>
                <p className="text-sm text-muted-foreground">Generate a dedicated results page</p>
              </div>
              <Button variant="secondary" className="w-full">
                Generate Results Link
              </Button>
            </div>
          </div>
        </Card>

        <Card 
          className="relative overflow-hidden group"
        >
          <div className="p-6 cursor-pointer transition-all duration-200 hover:translate-y-[-4px]" onClick={() => handleSelect("calendar")}>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 rounded-full bg-primary/10">
                <CalendarIcon className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Calendar Link</h3>
                <p className="text-sm text-muted-foreground">Generate a calendar view page</p>
              </div>
              <Button variant="secondary" className="w-full">
                Generate Calendar Link
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <GenerateLinkDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        type={selectedType}
        onSelect={onSelect}
      />
    </>
  );
}