import dynamic from "next/dynamic";

const AgentChatPageContent = dynamic(
  () => import("@/components/chat/AgentChatPageContent").then((mod) => mod.AgentChatPageContent),
  { loading: () => <div className="p-6 text-sm text-muted-foreground">Loading...</div> }
);

export default function AgentChatPage() {
  return <AgentChatPageContent />;
}
