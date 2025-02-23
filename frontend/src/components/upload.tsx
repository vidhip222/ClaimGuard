import {
  Shield,
  FileCheck,
  Camera,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api";
import { FileItem } from "../lib/file-item";
import { useCallback, useEffect, useState } from "react";

export default function Upload(props: {
  files: File[];
  setFiles: any;
  id: String;
}) {
  const [startUpload, setStartUpload] = useState<boolean>(false);
  const [alreadySeen, setAlreadySeen] = useState<Set<File>>(new Set());
  const [counter, setCounter] = useState<number>(0);
  const queryClient = useQueryClient();

  const handleUploadComplete = useCallback((file: File) => {
    // props.setFiles((prev: any) => prev.filter((f: File) => f !== file && !alreadySeen.has(f)));
    // setAlreadySeen(alreadySeen.add(file));
    console.log("UPLOAD COMPLETE");
    setCounter((counter) => counter + 1);
    //queryClient.cancelQueries({ queryKey: ["claim", props.id] });
    claim.refetch(); // Refresh the claim data to show the new upload
  }, []);

  useEffect(() => {
    console.log(counter, props.files.length);
    if (counter == props.files.length && counter > 0) {
      props.setFiles([]);
      setCounter(0);
    }
  }, [counter]);

  const claim = useQuery({
    queryKey: ["claim", props.id],
    queryFn: async () => {
      const res = await api.claim[":id"].$get({
        param: { id: props.id.toString() },
      });
      if (!res.ok) throw new Error("Failed to fetch claim");
      const data = await res.json();
      return data;
    },
    refetchInterval: 2000,
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
        onClick={() => {
          setStartUpload(true);
        }}
        disabled={startUpload || props.files.length == 0}
        className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300"
      >
        Submit Documents
      </button>
    </div>
  );
}
