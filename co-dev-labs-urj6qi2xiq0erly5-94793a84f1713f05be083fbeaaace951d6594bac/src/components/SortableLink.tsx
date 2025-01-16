import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Image, Video, Calendar, Users, Folder, GripVertical, Facebook, Twitter, Instagram, Youtube, Linkedin, Github } from "lucide-react";
import { LINK_TYPES } from "./LinkManager";

const getSocialIcon = (platform?: string) => {
  const iconProps = { className: "h-4 w-4" };
  
  switch (platform?.toLowerCase()) {
    case 'facebook':
      return <Facebook {...iconProps} />;
    case 'twitter':
      return <Twitter {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'youtube':
      return <Youtube {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    case 'github':
      return <Github {...iconProps} />;
    default:
      return <Users {...iconProps} />;
  }
};

interface SortableLinkProps {
  link: {
    id: string;
    title: string;
    url: string;
    type: string;
    platform?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLink({ link, onEdit, onDelete }: SortableLinkProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`${isDragging ? 'border-primary' : ''}`}>
        <CardContent className="flex items-center justify-between p-1.5 gap-1.5">
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-shrink-0">
              {link.type === 'social' ? (
                getSocialIcon(link.platform)
              ) : (
                LINK_TYPES.find(t => t.id === link.type)?.icon || <LinkIcon className="h-4 w-4" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{link.title}</h3>
                {!['calendar', 'results'].includes(link.type) && (
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    ({new URL(link.url).hostname})
                  </span>
                )}
              </div>
              {!['calendar', 'results'].includes(link.type) && (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline block truncate"
                  title={link.url}
                >
                  {link.url.length > 50 ? `${link.url.substring(0, 47)}...` : link.url}
                </a>
              )}
              {link.type === 'calendar' && (
                <span className="text-xs text-muted-foreground">Calendar Widget</span>
              )}
              {link.type === 'results' && (
                <span className="text-xs text-muted-foreground">Results Widget</span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={onDelete}>
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}