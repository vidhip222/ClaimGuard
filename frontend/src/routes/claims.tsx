// Claims.tsx
import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { api } from "../api";
import { FileItem } from "../lib/file-item";
import DataView from '../components/dataView';
import Upload from '../components/upload';
import Navbar from "../components/navbar";

export const claimsRoute = createRoute({
  path: "/claim/$id",
  getParentRoute: () => rootRoute,
  component: Claims,
});

function Claims() {
  const { id } = claimsRoute.useParams();
  const [files, setFiles] = useState<File[]>([]);


  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);
      setFiles((prev) => [...prev, ...selectedFiles]);
    },
    [],
  );


  return (

    <div>
      <Navbar/>
      <div className="flex flex-col h-screen">
      <div className="flex flex-col space-y-2 max-w-sm">
        <input
          type="file"
          className="
            text-sm
          text-gray-500
            file:mr-4
            file:py-2
            file:px-4
            file:rounded
            file:border-0
            file:text-sm
            file:font-semibold
            file:bg-gray-200
            file:text-gray-600
            hover:file:bg-gray-300
            bg-white
            border
            border-gray-300
            rounded
            focus:outline-none
            focus:ring-2
            focus:ring-blue-500
            focus:border-transparent
          "
          multiple
          onChange={handleFileSelect}
        />

      </div>
      <div className="flex flex-row flex-grow">
        <div className="w-1/2 bg-white p-4">
          <Upload files={files} setFiles={setFiles} id={id}/>
        </div>


        <div className="w-1/2 bg-green-100 p-4 overflow-auto">
          <DataView />
        </div>
      </div>

      </div>
    </div>
  );
}