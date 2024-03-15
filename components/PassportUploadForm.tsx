"use client";

import { useRef, useState } from "react";
import Button from "./Button";
import Alert from "./Alert";

type APIStatus = {
  loading: boolean;
  error: string;
  success: string;
};

type ExtractResult = {
  dateOfBirth: string;
  expiryDate: string;
};

const initialApiState = {
  loading: false,
  error: "",
  success: "",
};

const loadingApiState = {
  loading: true,
  error: "",
  success: "",
};

const PassportUploadForm = () => {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploadStatus, setUploadStatus] = useState<APIStatus>(initialApiState);
  const [processStatus, setProcessStatus] =
    useState<APIStatus>(initialApiState);
  const [extractStatus, setExtractStatus] =
    useState<APIStatus>(initialApiState);
  const [extractedData, setExtractedData] = useState<ExtractResult | null>(
    null
  );

  const handleUpload = async (file: File) => {
    setUploadStatus(loadingApiState);
    try {
      const uploadRes = await fetch(`/passport/upload?filename=${file.name}`, {
        method: "POST",
        body: file,
      });
      if (!uploadRes.ok) {
        throw await uploadRes.json();
      }

      setUploadStatus({
        loading: false,
        error: "",
        success: "Uploaded document",
      });
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      setUploadStatus({
        loading: false,
        error: errorMessage,
        success: "",
      });
      return false;
    }
  };

  const handleProcess = async (filename: string) => {
    setProcessStatus(loadingApiState);
    try {
      const processRes = await fetch("/passport/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!processRes.ok) {
        throw await processRes.json();
      }

      setProcessStatus({
        loading: false,
        error: "",
        success: "Processed document",
      });
      return true;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "An unexpected error occurred";

      setProcessStatus({
        loading: false,
        error: errorMessage,
        success: "",
      });
      return false;
    }
  };

  const handleExtract = async (filename: string) => {
    setExtractStatus(loadingApiState);
    try {
      const extractRes = await fetch("/passport/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!extractRes.ok) {
        throw await extractRes.json();
      }

      setExtractStatus({
        loading: false,
        error: "",
        success: "Extracted information from document",
      });

      const extractBody = await extractRes.json();

      setExtractedData(extractBody);
      return true;
    } catch (_) {
      setExtractStatus({
        loading: false,
        error:
          "Please make sure the information in the photo are visible, then retry",
        success: "",
      });
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputFileRef.current?.files) {
      console.error("No file selected");
      return;
    }

    const file = inputFileRef.current.files[0];
    const uploadSuccess = await handleUpload(file);
    if (!uploadSuccess) return;

    const processSuccess = await handleProcess(file.name);
    if (!processSuccess) return;

    await handleExtract(file.name);
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          name="file"
          ref={inputFileRef}
          type="file"
          required
          className="mr-auto"
        />
        <Button type="submit">Upload</Button>
      </form>

      <Alert status={uploadStatus} />
      <Alert status={processStatus} />
      <Alert status={extractStatus} />

      {extractedData && (
        <div>
          <p>Date of birth: {extractedData.dateOfBirth}</p>
          <p>Expiry date: {extractedData.expiryDate}</p>
        </div>
      )}
    </>
  );
};

export default PassportUploadForm;
