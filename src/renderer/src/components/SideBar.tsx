import { Button } from "@/components/ui/button";
import LogoButton from "@/components/LogoButton";
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  Cog8ToothIcon,
  PlusCircleIcon,
  UserGroupIcon
} from "@heroicons/react/24/solid";
import DiscordIcon from "@/components/icons/discord";
import { toast } from "sonner";

interface SideBarProps {
  setPage: (page: string) => void;
}

export default function SideBar({ setPage }: SideBarProps) {
  return (
    <div className="mr-3.5 flex h-full w-20 flex-col items-center bg-background py-6">
      <LogoButton className="mb-4" />

      {/* Top Button Group*/}
      <div className="flex flex-col">
        <Button variant="outline" size="icon" className="m-2 h-16 w-16" onClick={() => setPage("create")}>
          <PlusCircleIcon className="size-8 text-neutral-400" />
        </Button>
        <Button variant="outline" size="icon" className="m-2 h-16 w-16" onClick={() => setPage("chats")}>
          <ChatBubbleLeftRightIcon className="size-8 text-neutral-400" />
        </Button>
        <Button variant="outline" size="icon" className="m-2 h-16 w-16" onClick={() => setPage("collections")}>
          <UserGroupIcon className="size-8 text-neutral-400" />
        </Button>
        <Button variant="outline" size="icon" className="m-2 h-16 w-16" onClick={() => setPage("settings")}>
          <Cog8ToothIcon className="size-8 text-neutral-400" />
        </Button>
      </div>

      {/* Spacer */}
      <div className="grow"></div>

      {/* Bottom Button Group*/}
      <div className="flex flex-col space-y-2">
        <Button
          variant="outline"
          size="icon"
          className="mx-2 size-12"
          onClick={() => {
            window.api.utils.openURL("https://discord.gg/JrdGVTYV46");
            toast.success("Discord invite opened in browser!");
          }}
        >
          <DiscordIcon />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="mx-2 size-12"
          onClick={() => {
            toast.info("Docs are coming soon™!");
          }}
        >
          <BookOpenIcon className="size-7 text-neutral-400" />
        </Button>
      </div>
    </div>
  );
}
