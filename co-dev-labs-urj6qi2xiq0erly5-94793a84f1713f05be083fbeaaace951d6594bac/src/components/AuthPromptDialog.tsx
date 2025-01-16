import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RaceAuthForm } from "./RaceAuthForm"

interface AuthPromptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthPromptDialog({ open, onOpenChange }: AuthPromptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Sign in to interact</DialogTitle>
          <DialogDescription>
            Please sign in or create an account to like posts and add comments.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <RaceAuthForm onSuccess={() => onOpenChange(false)} />
        </div>
      </DialogContent>
    </Dialog>
  )
}