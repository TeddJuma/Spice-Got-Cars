// src/components/messaging/ChatButton.tsx

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import ChatPanel from "./ChatPanel";

type Props = {
  listingId: string;
  role: "admin" | "agent" | "customer";
  user: any; // admin user object, agent object, or undefined for customer
};

export default function ChatButton({ listingId, role, user }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="ml-2">
        <MessageSquare className="mr-2 size-4" /> Chat
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chat about this listing</DialogTitle>
            <DialogDescription>
              Discuss with {role === "customer" ? "admin / agent" : "customer"} in real time.
            </DialogDescription>
          </DialogHeader>
          <ChatPanel listingId={listingId} role={role} user={user} onClose={() => setOpen(false)} />
          <DialogClose />
        </DialogContent>
      </Dialog>
    </>
  );
}
