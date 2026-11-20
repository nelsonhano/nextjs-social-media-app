"use client";

import { useSession } from "@/app/(main)/SessionProvider";
import LoadingButton from "@/components/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import UserAvatar from "@/components/UserAvatar";
import { cn } from "@/lib/utils";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useDropzone } from "@uploadthing/react";
import { Globe, Image as ImageIcon, Loader2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { ClipboardEvent, useRef, useState } from "react";
import { useSubmitPostMutation } from "./mutations";
import useMediaUpload, { Attachment } from "./useMediaUpload";
import "./styles.css";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreatePostModal({
  open,
  onOpenChange,
}: CreatePostModalProps) {
  const { user } = useSession();
  const mutation = useSubmitPostMutation();
  const [privacy, setPrivacy] = useState<"public" | "followers">("public");

  const {
    startUpload,
    attachments,
    isUploading,
    uploadProgress,
    removeAttachment,
    reset: resetMediaUploads,
  } = useMediaUpload();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: startUpload,
  });

  const { onClick: _onClick, ...rootProps } = getRootProps();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bold: false,
        italic: false,
      }),
      Placeholder.configure({
        placeholder: "Write something...",
      }),
    ],
  });

  const input =
    editor?.getText({
      blockSeparator: "\n",
    }) || "";

  function onSubmit() {
    mutation.mutate(
      {
        content: input,
        mediaIds: attachments
          .map((a) => a.mediaId)
          .filter(Boolean) as string[],
      },
      {
        onSuccess: () => {
          editor?.commands.clearContent();
          resetMediaUploads();
          onOpenChange(false);
        },
      },
    );
  }

  function onPaste(e: ClipboardEvent<HTMLInputElement>) {
    const files = Array.from(e.clipboardData.items)
      .filter((item) => item.kind === "file")
      .map((item) => item.getAsFile()) as File[];
    startUpload(files);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden border border-white/40 dark:border-white/10 glass-card rounded-3xl shadow-2xl">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/40">
          <DialogTitle className="text-xl font-bold tracking-tight text-center">
            Create Post
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Author row & privacy selector */}
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 p-[2px]">
              <UserAvatar avatarUrl={user.avatarUrl} className="size-11 border-2 border-background" />
            </div>
            <div>
              <div className="font-bold text-sm">{user.displayName}</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <button
                  type="button"
                  onClick={() =>
                    setPrivacy((prev) => (prev === "public" ? "followers" : "public"))
                  }
                  className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted/70 hover:bg-muted text-muted-foreground transition-colors"
                >
                  <Globe className="size-3" />
                  <span>{privacy === "public" ? "Public" : "Followers only"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Editor Area */}
          <div {...rootProps} className="w-full">
            <EditorContent
              editor={editor}
              className={cn(
                "min-h-[7rem] max-h-[16rem] w-full overflow-y-auto rounded-2xl bg-background/50 backdrop-blur-sm px-4 py-3 text-base focus-within:ring-2 focus-within:ring-pink-500/30 transition-all",
                isDragActive && "outline-dashed outline-pink-500",
              )}
              onPaste={onPaste}
            />
            <input {...getInputProps()} />
          </div>

          {/* Attachments Section */}
          {!!attachments.length && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Attachments ({attachments.length}/5)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((attachment) => (
                  <AttachmentPreviewItem
                    key={attachment.file.name}
                    attachment={attachment}
                    onRemove={() => removeAttachment(attachment.file.name)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {isUploading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
              <Loader2 className="size-3.5 animate-spin text-[#FF3B69]" />
              <span>Uploading media... {uploadProgress ? `${uploadProgress}%` : ""}</span>
            </div>
          )}
        </div>

        {/* Action Bar Footer */}
        <div className="px-6 py-4 border-t border-border/40 bg-muted/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1">
            <input
              type="file"
              ref={fileInputRef}
              className="sr-only hidden"
              multiple
              accept="image/*,video/*"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) {
                  startUpload(files);
                  e.target.value = "";
                }
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={attachments.length >= 5 || isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="text-muted-foreground hover:text-foreground rounded-full h-9 px-3 gap-1.5"
            >
              <ImageIcon className="size-4 text-[#FF3B69]" />
              <span className="text-xs font-medium">Add media</span>
            </Button>
          </div>

          <LoadingButton
            onClick={onSubmit}
            loading={mutation.isPending}
            disabled={(!input.trim() && !attachments.length) || isUploading}
            className="rounded-2xl bg-[#FF3B69] hover:bg-[#FF2D55] text-white font-semibold px-6 shadow-md shadow-pink-500/25 transition-all active:scale-95"
          >
            Post
          </LoadingButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AttachmentPreviewItemProps {
  attachment: Attachment;
  onRemove: () => void;
}

function AttachmentPreviewItem({
  attachment: { file, mediaId, isUploading },
  onRemove,
}: AttachmentPreviewItemProps) {
  const src = URL.createObjectURL(file);

  return (
    <div className="relative aspect-square rounded-2xl overflow-hidden border border-border/50 bg-muted/40">
      {file.type.startsWith("image") ? (
        <Image
          src={src}
          alt="Attachment preview"
          fill
          className="object-cover"
        />
      ) : (
        <video src={src} controls className="size-full object-cover" />
      )}
      {!isUploading && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1.5 top-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white p-1 transition-colors"
        >
          <X className="size-3.5" />
        </button>
      )}
      {isUploading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="size-5 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}
