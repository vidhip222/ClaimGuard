// Claims.tsx
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { api } from "../api";
import { FileItem } from "../lib/file-item";

export const claimsRoute = createRoute({
  path: "/claim/$id",
  getParentRoute: () => rootRoute,
  component: Claims,
});

function Claims() {
  const { id } = claimsRoute.useParams();
  const [files, setFiles] = useState<File[]>([]);

  const claim = useQuery({
    queryKey: ["claim", id],
    queryFn: async () => {
      const res = await api.claim[":id"].$get({ param: { id } });
      if (!res.ok) throw new Error("Failed to fetch claim");
      const data = await res.json();
      return data;
    },
  });

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      setFiles((prev) => [...prev, ...selectedFiles]);
    },
    [],
  );

  const handleUploadComplete = useCallback((file: File) => {
    setFiles((prev) => prev.filter((f) => f !== file));
    claim.refetch(); // Refresh the claim data to show the new upload
  }, []);

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
      </div>

      <div className="space-y-2">
        {/* Pending Uploads */}
        {files.map((file, index) => (
          <FileItem
            key={`pending-${index}`}
            file={file}
            claimId={id}
            onUploadComplete={() => handleUploadComplete(file)}
          />
        ))}

        {/* Completed Uploads */}
        {claim.data?.images.map((image) => (
          <FileItem
            key={image.id}
            claimId={id}
            claimImage={image}
            onUploadComplete={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
