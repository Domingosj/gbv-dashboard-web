"use client";

import { MyRuntimeProvider } from "@/components/MyRuntimeProvider";
import { ThreadPrimitive, ComposerPrimitive, MessagePrimitive, useAuiState } from "@assistant-ui/react";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";
import { MarkdownText } from "@/components/assistant-ui/markdown-text";
import { useAssistantRuntime } from "@assistant-ui/react";
import { useEffect, useState } from "react";

function ThreadWelcome() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <h1 className="text-headline-lg text-on-surface mb-2">Assistente VBG</h1>
      <p className="text-body-md text-on-surface-variant max-w-md">
        Pergunte sobre os dados do dashboard, boas práticas no acolhimento de sobreviventes, ou vias de referência.
      </p>
    </div>
  );
}

function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-start mb-4">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-surface-container-low text-on-surface rounded-bl-md border border-outline-variant">
        <MarkdownText />
        <div className="flex gap-1 mt-2">
          <TooltipIconButton tooltip="Copiar">
            <button onClick={() => {}} className="text-caption text-on-surface-variant hover:text-on-surface">Copiar</button>
          </TooltipIconButton>
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}

function UserMessage() {
  return (
    <MessagePrimitive.Root className="flex justify-end mb-4">
      <div className="max-w-[80%] rounded-lg px-4 py-3 bg-primary text-white rounded-br-md">
        <MessagePrimitive.Content />
      </div>
    </MessagePrimitive.Root>
  );
}

function ThreadMessage() {
  const role = useAuiState((s) => s.message.role);
  if (role === "user") return <UserMessage />;
  return <AssistantMessage />;
}

function Composer() {
  const isRunning = useAuiState((s) => s.thread.isRunning);

  return (
    <ComposerPrimitive.Root className="relative flex w-full flex-col">
      <div className="flex w-full gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest p-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20">
        <ComposerPrimitive.Input
          placeholder="Faça uma pergunta..."
          className="flex-1 max-h-32 min-h-10 resize-none bg-transparent px-2 py-2 text-body-sm outline-none placeholder:text-on-surface-variant/60"
          rows={1}
          autoFocus
        />
        <div className="flex items-end">
          {isRunning ? (
            <ComposerPrimitive.Cancel asChild>
              <Button variant="default" size="icon" className="size-8 rounded-full">
                <Square className="size-3 fill-current" />
              </Button>
            </ComposerPrimitive.Cancel>
          ) : (
            <ComposerPrimitive.Send asChild>
              <Button variant="default" size="icon" className="size-8 rounded-full">
                <ArrowUp className="size-4" />
              </Button>
            </ComposerPrimitive.Send>
          )}
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
}

function Suggestions() {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {[
        "Resumo dos dados",
        "Casos de violência sexual em Nampula",
        "Boas práticas no acolhimento",
        "Serviços disponíveis em Cabo Delgado",
      ].map((s) => (
        <button
          key={s}
          onClick={() => {
            const input = document.querySelector<HTMLTextAreaElement>('[placeholder="Faça uma pergunta..."]');
            if (input) { input.value = s; input.focus(); }
          }}
          className="text-caption px-3 py-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors"
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function ThreadContent() {
  const isEmpty = useAuiState((s) => s.thread.isEmpty);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
        {isEmpty && <ThreadWelcome />}
        <ThreadPrimitive.Messages>
          {() => <ThreadMessage />}
        </ThreadPrimitive.Messages>
      </div>
      <div className="sticky bottom-0 bg-surface-container-lowest border-t border-outline-variant px-4 py-4">
        <Composer />
        {isEmpty && <Suggestions />}
      </div>
    </div>
  );
}

export default function AIAssistantPage() {
  return (
    <MyRuntimeProvider>
      <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)]">
        <ThreadPrimitive.Root className="h-full flex flex-col bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
          <ThreadContent />
        </ThreadPrimitive.Root>
      </div>
    </MyRuntimeProvider>
  );
}
