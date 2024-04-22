import { DialogConfig, useApp } from "@/components/AppContext";
import ChatsSearchModal from "@/components/ChatsSearchModal";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuShortcut,
  ContextMenuTrigger
} from "@/components/ui/context-menu";
import { RecentChat as RecentChatI, queries } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { ArrowPathIcon, DocumentDuplicateIcon, MagnifyingGlassIcon, TrashIcon } from "@heroicons/react/24/solid";
import { PersonaBundle } from "@shared/types";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export interface ChatsSideBarProps {
  chatID: number;
  personaBundle: PersonaBundle;
  syncChatHistory: () => void;
  setChatID: (id: number) => void;
}

export default function ChatsSidebar({ chatID, personaBundle, syncChatHistory, setChatID }: ChatsSideBarProps) {
  const [recentChats, setRecentChats] = useState<RecentChatI[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { createModal, createDialog } = useApp();

  useEffect(() => {
    syncRecentChats();
  }, []);
  const syncRecentChats = async () => {
    const chatCards = await queries.getRecentChats();
    if (chatCards.kind == "err") {
      return;
    }
    setRecentChats(chatCards.value);
  };

  const sidebarVariants = {
    open: { width: "20rem", display: "block", overflow: "visible", opacity: 1 },
    closed: { width: "0", opacity: 0.2, overflow: "hidden", transitionEnd: { display: "none" } }
  };

  return (
    <div className="flex h-full items-center">
      {/* Sidebar Motion Wrapper*/}
      <motion.div
        initial={{
          width: "20rem"
        }}
        className="h-full"
        animate={sidebarOpen ? "open" : "closed"}
        transition={{ duration: 0.2 }}
        variants={sidebarVariants}
      >
        <div className="flex h-full w-80 flex-col overflow-hidden rounded-3xl bg-background">
          {/*Top Section */}
          <div className="flex grow flex-col px-2 py-3">
            {/* Search Bar */}
            <div
              className="mb-2 flex w-full cursor-pointer items-center space-x-2 overflow-hidden rounded-2xl bg-neutral-950 p-1"
              onClick={() => {
                createModal(<ChatsSearchModal />);
              }}
            >
              <MagnifyingGlassIcon className="ml-2 size-6 shrink-0 text-neutral-400" />
              <input
                className="h-11 w-full grow cursor-pointer select-none bg-inherit text-gray-100 caret-transparent placeholder:font-[480] placeholder:tracking-wide focus:outline-none"
                placeholder="Search for a chat"
              ></input>
            </div>

            <div className="scroll-secondary my-4 flex h-full max-h-full grow flex-col space-y-1 overflow-auto">
              {recentChats?.map((chat, idx) => {
                return (
                  <RecentChat
                    key={idx}
                    deleteChat={() => {
                      const config: DialogConfig = {
                        title: "Delete Chat",
                        description: "Are you sure you want to delete this chat?\nThis action cannot be undone.",
                        actionLabel: "Delete",
                        // Delete chat, and update the recent chats list, and set the chat_id to be another chat
                        onAction: async () => {
                          await queries.deleteChat(chat.chat_id);
                          syncRecentChats();
                          setChatID(recentChats[0].chat_id);
                          syncChatHistory();
                        }
                      };
                      createDialog(config);
                    }}
                    resetChat={() => {
                      const config: DialogConfig = {
                        title: "Reset Chat",
                        description: "Are you sure you want to reset this chat?\nThis action cannot be undone.",
                        actionLabel: "Reset",
                        onAction: async () => {
                          await queries.resetChat(chat.chat_id);
                          syncChatHistory();
                        }
                      };
                      createDialog(config);
                    }}
                    cloneChat={() => {
                      // TODO clone chat with the given id
                    }}
                    id={chat.chat_id.toString()}
                    avatarURI={chat.avatarURI || ""}
                    name={chat.name}
                    message={chat.last_message}
                    active={chatID == chat.chat_id}
                    onClick={() => setChatID(chat.chat_id)}
                  />
                );
              })}
            </div>
          </div>
          {/*Bottom Section */}
          <div className="flex h-16 w-full shrink-0 flex-row bg-neutral-700 p-3">
            <div className="relative">
              <img src={personaBundle.avatarURI || ""} alt="Avatar" className="h-10 w-10 rounded-full" />
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-400 ring-4 ring-gray-700"></span>
            </div>
            <div className="flex h-full flex-col justify-center p-2">
              <h3 className="font-semibold text-gray-100 ">{personaBundle.data.name}</h3>
              <p className="font-medium text-gray-400">Online</p>
            </div>
            {/* Settings Icon */}
            <div className="flex grow items-center justify-end"></div>
          </div>
        </div>
      </motion.div>
      {/* Sidebar Toggle Button */}
      <button
        className={`group ${sidebarOpen ? "ml-1.5" : "-ml-1"} flex h-10 w-3.5 items-center justify-center rounded-full`}
        onClick={() => {
          setSidebarOpen(!sidebarOpen);
        }}
      >
        <div className="h-10 w-1.5 rounded-full bg-neutral-700 transition duration-100 ease-out group-hover:bg-neutral-500"></div>
      </button>
    </div>
  );
}
interface RecentChatProps {
  id: string;
  name: string;
  avatarURI: string;
  message: string;
  active: boolean;
  deleteChat: () => void;
  resetChat: () => void;
  cloneChat: () => void;
  className?: string;
  [x: string]: any;
}

function RecentChat({
  id,
  name,
  avatarURI,
  message,
  active,
  deleteChat,
  resetChat,
  cloneChat,
  className,
  ...rest
}: RecentChatProps) {
  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <div
          {...rest}
          className={cn(
            `group flex w-full cursor-pointer items-center space-x-3 
        rounded-lg p-2.5 transition duration-150 ease-out hover:bg-accent 
        ${active ? "bg-neutral-700 text-neutral-50" : ""}`,
            className
          )}
        >
          <img className="size-12 shrink-0 rounded-full object-cover object-top" src={avatarURI} alt="avatar" />
          <div className={`flex h-full max-w-full flex-col justify-center `}>
            <h3 className="text-neutra line-clamp-1 text-ellipsis  font-[550] text-neutral-300 group-hover:text-neutral-100">
              {name}
            </h3>
            <p className="line-clamp-1 text-ellipsis text-[14.5px] font-[450] text-neutral-400">{message}</p>
          </div>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-40 px-1 py-2">
        <ContextMenuItem onSelect={deleteChat}>
          Delete
          <ContextMenuShortcut>
            <TrashIcon className="size-4" />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem onSelect={resetChat}>
          Reset
          <ContextMenuShortcut>
            <ArrowPathIcon className="size-4" />
          </ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem disabled>
          Clone
          <ContextMenuShortcut>
            <DocumentDuplicateIcon className="size-4" />
          </ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
