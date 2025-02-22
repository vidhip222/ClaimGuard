import { useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { api } from "../api";

interface UploadState {
  file: File;
  progress: number;
  id?: string;
  status: "pending" | "uploading" | "completed" | "error";
}
// Route configuration
export const claimsRoute = createRoute({
  path: "/claim/$id",
  getParentRoute: () => rootRoute,
  component: Claims,
});

// Component
function Claims() {
  const { id } = claimsRoute.useParams();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>(
    {},
  );

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      await Promise.all(
        files.map(async (file) => {
          const imageupload = await api.claim[":id"].$post({ param: { id } });
          if (!imageupload.ok) throw new Error("Failed to upload image");
          const { url } = await imageupload.json();

          // Create upload state
          setUploadStates((prev) => ({
            ...prev,
            [id]: {
              file,
              progress: 0,
              id,
              status: "uploading",
            },
          }));

          try {
            const response = await fetch(url, {
              method: "PUT",
              body: file,
              headers: {
                "Content-Type": file.type,
              },
            });

            if (!response.ok) throw new Error(`Upload failed for ${file.name}`);

            // Update state on success
            setUploadStates((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                progress: 100,
                status: "completed",
              },
            }));

            return { id, fileName: file.name };
          } catch (error) {
            // Update state on error
            setUploadStates((prev) => ({
              ...prev,
              [id]: {
                ...prev[id],
                status: "error",
              },
            }));
            throw error;
          }
        }),
      );
    },
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      setFiles(selectedFiles);
    },
    [],
  );

  // Handle upload
  const handleUpload = useCallback(() => {
    if (files.length === 0) return;
    uploadMutation.mutate(files);
  }, [files, uploadMutation]);

  return (
    <div className="p-4">
      <div className="mb-4">
        <input
          type="file"
          multiple
          onChange={handleFileSelect}
          className="mb-2"
          accept="*"
        />
        <button
          onClick={handleUpload}
          disabled={files.length === 0 || uploadMutation.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Upload Files
        </button>
      </div>

      {/* Upload Status */}
      <div className="space-y-2">
        {Object.entries(uploadStates).map(([id, state]) => (
          <div
            key={id}
            className="border rounded p-2 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{state.file.name}</p>
              <p className="text-sm text-gray-500">
                Status: {state.status}
                {state.status === "uploading" && ` (${state.progress}%)`}
              </p>
            </div>
            {state.status === "error" && (
              <span className="text-red-500">Upload failed</span>
            )}
            {state.status === "completed" && (
              <span className="text-green-500">✓</span>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {uploadMutation.isError && (
        <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
          Upload failed: {uploadMutation.error.message}
        </div>
      )}
    </div>
  );
}
