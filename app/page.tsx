"use client";

import Container from "@/components/Container";
import PassportUploadForm from "@/components/PassportUploadForm";

export default function Home() {
  return (
    <div className="py-8">
      <Container>
        <h1 className="pb-4">Passport Extraction Tool</h1>
        <PassportUploadForm />
      </Container>
    </div>
  );
}
