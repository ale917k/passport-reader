import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { fileTypeFromBuffer } from "file-type";
import sanitizeFilename from "sanitize-filename";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * @openapi
 * /passport/upload:
 *   post:
 *     summary: Uploads a file to S3 for processing.
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Supported formats: JPEG, PNG, PDF.
 *     parameters:
 *       - in: query
 *         name: filename
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successfully uploaded.
 *       '400':
 *         description: Bad request (missing data, unsupported file, etc.).
 *       '500':
 *         description: Server error during upload.
 *     tags:
 *       - PassportUpload
 */
export async function POST(req: Request): Promise<NextResponse> {
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const { searchParams } = new URL(req.url);
  let filename = searchParams.get("filename");
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!filename) {
    return NextResponse.json(
      { message: "Filename is required" },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent path traversal or injection attacks
  filename = sanitizeFilename(filename);

  // Check Content-Length to prevent potential DoS attacks by rejecting large files early
  const contentLength = req.headers.get("Content-Length");
  if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "File size exceeds the maximum limit" },
      { status: 400 }
    );
  }

  const buffer = await req.arrayBuffer();
  // Additional check to ensure the file doesn't exceed the max file size
  if (buffer.byteLength > MAX_FILE_SIZE) {
    return NextResponse.json(
      { message: "File size exceeds the maximum limit" },
      { status: 400 }
    );
  }

  const body = Buffer.from(buffer);

  // Validate file type and ensure it's not malicious
  const fileTypeResult = await fileTypeFromBuffer(body);
  if (!fileTypeResult) {
    return NextResponse.json(
      { message: "File type could not be determined" },
      { status: 400 }
    );
  }

  // Ensure we only accept those file types supported by AWS Textract
  const allowedMimeTypes = ["image/jpeg", "image/png", "application/pdf"];
  if (!allowedMimeTypes.includes(fileTypeResult.mime)) {
    return NextResponse.json(
      { message: "Unsupported file type" },
      { status: 400 }
    );
  }

  try {
    // Upload file to S3
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: filename,
        Body: body,
        ContentType: fileTypeResult.mime,
      })
    );

    return NextResponse.json(
      {
        message: "File uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("Error uploading to S3: ", error);
    return NextResponse.json(
      { message: "File upload failed", error: errorMessage },
      { status: 500 }
    );
  }
}
