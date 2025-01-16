import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

interface SocialLink {
  id: string;
  title: string;
  url: string;
  type: string;
  platform?: string;
}

interface SocialMediaGroupProps {
  links: SocialLink[];
  onEdit: (linkId: string) => void;
  onDelete: (linkId: string) => void;
}

function SocialLink({ link, onEdit, onDelete }: { 
  link: SocialLink;
  onEdit: (linkId: string) => void;
  onDelete: (linkId: string) => void;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between py-2 px-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{link.title}</span>
          <span className="text-sm text-muted-foreground">({link.platform})</span>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(link.id)}>
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => onDelete(link.id)}>
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SocialMediaGroup({ links, onEdit, onDelete }: SocialMediaGroupProps) {
  return (
    <Card>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-3">
          <Users className="h-4 w-4" />
          <h3 className="font-medium">Social Media Links</h3>
        </div>
        
        <div className="space-y-2">
          {links.map((link) => (
            <SocialLink
              key={link.id}
              link={link}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}