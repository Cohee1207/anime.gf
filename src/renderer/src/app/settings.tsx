import { useApp } from "@/components/AppContext";
import { useEffect, useRef, useState } from "react";
import { ChatSearchItem, queries } from "@/lib/queries";
import { toast } from "sonner";
import ChatsSearch from "@/components/ChatsSearch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  return (
    <div className="flex h-full w-full items-center bg-neutral-800 pb-6 pl-6 pt-6 text-sm text-neutral-100 antialiased lg:text-base">
      <span>test</span>
      <span>test</span>
      <span>test</span>
      <span>test</span>
    </div>
  );
}
