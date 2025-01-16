import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Copy, Share2 } from "lucide-react";

interface GenerateLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "bio" | "results" | "calendar" | null;
  onSelect: (type: "bio" | "results" | "calendar") => void;
}

export function GenerateLinkDialog({ open, onOpenChange, type, onSelect }: GenerateLinkDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [eventSlug, setEventSlug] = useState<string>("");

  useEffect(() => {
    if (type && user?.username) {
      const baseUrl = window.location.origin;
      let path = '';
      
      switch (type) {
        case 'bio':
          path = `/${user.username}`;
          break;
        case 'results':
          path = `/${user.username}/results`;
          break;
        case 'calendar':
          path = `/${user.username}/calendar`;
          break;
        case 'timeline':
          path = `/race/${eventSlug}`;
          break;
      }
      
      setGeneratedLink(`${baseUrl}${path}`);
    }
  }, [type, user?.username, eventSlug]);

  const handleCopyLink = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "Copied!",
      description: "The content has been copied to your clipboard",
    });
  };

  const getIframeUrl = () => {
    if (!user?.username) return '';
    const baseUrl = window.location.origin;
    
    switch (type) {
      case 'calendar':
        return `${baseUrl}/calendar-preview/${user.username}`;
      case 'results':
        return `${baseUrl}/results-preview/${user.username}`;
      default:
        return generatedLink;
    }
  };

  const iframeCode = `<iframe src="${getIframeUrl()}" width="100%" height="600" frameborder="0"></iframe>`;

  if (!type || !user?.username) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Share {type.charAt(0).toUpperCase() + type.slice(1)} Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="link">Direct Link</TabsTrigger>
              <TabsTrigger value="iframe">Embed Code</TabsTrigger>
              <TabsTrigger value="qr">QR Code</TabsTrigger>
            </TabsList>
            
            <TabsContent value="link" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Input value={generatedLink} readOnly />
                <Button onClick={() => handleCopyLink(generatedLink)} size="icon">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Share Link',
                      url: generatedLink
                    });
                  } else {
                    handleCopyLink(generatedLink);
                  }
                }}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Link
              </Button>
            </TabsContent>

            <TabsContent value="iframe" className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Use this code to embed the page on your website:
                </p>
                <Textarea 
                  value={iframeCode}
                  readOnly 
                  className="min-h-[100px] font-mono text-sm"
                />
              </div>
              <Button onClick={() => handleCopyLink(iframeCode)} className="w-full">
                <Copy className="mr-2 h-4 w-4" />
                Copy Embed Code
              </Button>
            </TabsContent>

            <TabsContent value="qr" className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={generatedLink} size={200} />
              </div>
              <Button onClick={() => handleCopyLink(generatedLink)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}