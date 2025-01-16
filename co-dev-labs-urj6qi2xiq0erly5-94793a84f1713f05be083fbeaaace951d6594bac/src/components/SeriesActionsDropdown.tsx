import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface SeriesActionsDropdownProps {
  seriesId: string;
  onEdit: () => void;
  onManageDocuments: (seriesId: string) => void;
  onManageNotices: (seriesId: string) => void;
  onManageResults: (seriesId: string) => void;
}

export const SeriesActionsDropdown: React.FC<SeriesActionsDropdownProps> = ({
  seriesId,
  onEdit,
  onManageDocuments,
  onManageNotices,
  onManageResults,
}) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Actions</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-mono text-muted-foreground">
          ID: {seriesId}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onEdit}>
          Edit Series
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onManageDocuments(seriesId)}>
          Manage Series Documents
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onManageNotices(seriesId)}>
          Manage Series Notices
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onManageResults(seriesId)}>
          Manage Series Results
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};