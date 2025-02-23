import {
  Shield,
  FileCheck,
  Camera,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { FileItem } from "../lib/file-item";
import { useCallback, useState } from "react";

export default function Upload(props: {files: File[], setFiles: any, id: String}) {
    
    const [startUpload, setStartUpload ] = useState<boolean>(false);
    
    const handleUploadComplete = useCallback((file: File) => {
        props.setFiles((prev: any) => prev.filter((f: File) => f !== file));
        claim.refetch(); // Refresh the claim data to show the new upload
    }, []);

    const claim = useQuery({
        queryKey: ["claim", props.id],
        queryFn: async () => {
          const res = await api.claim[":id"].$get({ param: {id: props.id.toString()} });
          if (!res.ok) throw new Error("Failed to fetch claim");
          const data = await res.json();
          return data;
        },
    });

    return (
        <div className="space-y-2 mb-4">
            {props.files.map((file, index) => (
                <FileItem
                    key={`pending-${index}`}
                    file={file}
                    claimId={props.id.toString()}
                    onUploadComplete={() => handleUploadComplete(file)}
                    startUpload={startUpload}
                />
            ))}

            {claim.data?.images.map((image) => (
                <FileItem
                    key={image.id}
                    claimId={props.id.toString()}
                    claimImage={image}
                    onUploadComplete={() => {}}
                    startUpload={false}
                />
            ))}
            <button
                onClick={() => setStartUpload(true)}
                disabled={startUpload || props.files.length == 0}
                className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
            >
                Submit Documents
          </button>
        </div>
    );
}
