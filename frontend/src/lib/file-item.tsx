// FileItem.tsx
import { useMutation } from "@tanstack/react-query";
import { api } from "../api";
import { useEffect } from "react";

interface FileItemProps {
  file?: File;
  claimId: string;
  claimImage?: {
    id: string;
    type: "image" | "video" | "audio" | "text";
    fraudScore: number | null;
    processed: number;
  };
  onUploadComplete: () => void;
  startUpload: boolean;
}

const mimeTypeCategories = {
  "image/jpeg": "image",
  "image/png": "image",
  "image/gif": "image",
  "image/bmp": "image",
  "image/tiff": "image",
  "image/webp": "image",
  "video/mp4": "video",
  "audio/mpeg": "audio",
  "audio/wav": "audio",
  "audio/ogg": "audio",
  "audio/aac": "audio",
  "audio/flac": "audio",
  "application/pdf": "text",
} as const;

export function FileItem({
  file,
  claimId,
  claimImage,
  onUploadComplete,
  startUpload,
}: FileItemProps) {
  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      console.log(fileToUpload.type);
      const type =
        mimeTypeCategories[
          fileToUpload.type as keyof typeof mimeTypeCategories
        ];
      if (!type) throw new Error("Unsupported file type");

      const imageupload = await api.claim[":id"].$post({
        param: { id: claimId },
        json: { type },
      });

      if (!imageupload.ok) throw new Error("Failed to upload image");
      const { url } = await imageupload.json();

      const response = await fetch(url, {
        method: "PUT",
        body: fileToUpload,
        headers: {
          "Content-Type": fileToUpload.type,
        },
      });

      if (!response.ok) {
        console.error(response);
        throw new Error(`Upload failed for ${fileToUpload.name}`);
      }
    },
    onSettled: () => {
      onUploadComplete();
    },
  });

  useEffect(() => {
    if (startUpload) {
      uploadMutation.mutate(file!);
    }
  }, [startUpload]);

  // If we have a claimImage, render the completed upload view
  if (claimImage) {
    return (
      <div className="border rounded p-2 flex items-center justify-between">
        <div>
          <p className="font-medium">File ID: {claimImage.id}</p>
          <p className="text-sm text-gray-500">Type: {claimImage.type}</p>
          {claimImage.fraudScore !== null && (
            <p className="text-sm text-gray-500">
              Fraud Score: {claimImage.fraudScore / (claimImage.processed || 1)}
            </p>
          )}
        </div>
        <span className="text-green-500">✓</span>
      </div>
    );
  }

  // If we have a file, render the upload/in-progress view
  if (file) {
    return (
      <div className="border rounded p-2 flex items-center justify-between">
        <div>
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-500">
            Type:
            {mimeTypeCategories[file.type as keyof typeof mimeTypeCategories] ||
              "unknown"}
          </p>
        </div>
        {uploadMutation.isPending ? (
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent" />
        ) : (
          <></>
        )}
        {uploadMutation.isError && (
          <span className="text-red-500">
            Upload failed: {uploadMutation.error.message}
          </span>
        )}
      </div>
    );
  }

  return null;
}
