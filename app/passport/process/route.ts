import {
  TextractClient,
  StartDocumentAnalysisCommand,
} from "@aws-sdk/client-textract";
import { NextResponse } from "next/server";
import sanitizeFilename from "sanitize-filename";

const textractClient = new TextractClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
});

/**
 * @openapi
 * /passport/process:
 *   post:
 *     summary: Initiates AWS Textract processing on an uploaded document.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filename
 *             properties:
 *               filename:
 *                 type: string
 *     responses:
 *       '200':
 *         description: Processing initiated.
 *       '400':
 *         description: Bad request (missing/invalid parameters).
 *       '500':
 *         description: Internal server error during processing.
 *     tags:
 *       - PassportProcess
 */
export async function POST(req: Request): Promise<NextResponse> {
  let body;
  try {
    body = await req.json();
  } catch (error) {
    return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
  }

  let { filename } = body;
  const bucketName = process.env.AWS_S3_BUCKET_NAME;

  if (!filename) {
    return NextResponse.json(
      { message: "Filename is required" },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent path traversal attacks
  filename = sanitizeFilename(filename);

  try {
    // Trigger Textract for processing
    const command = new StartDocumentAnalysisCommand({
      DocumentLocation: {
        S3Object: {
          Bucket: bucketName,
          Name: filename,
        },
      },
      FeatureTypes: ["FORMS"],
    });

    const result = await textractClient.send(command);
    return NextResponse.json({ jobId: result.JobId }, { status: 200 });
  } catch (error) {
    console.error("Error starting Textract job: ", error);
    return handleTextractError(error);
  }
}

/**
 * Handles errors from AWS Textract, categorizing them based on their type.
 * Maps Textract-specific errors to HTTP status codes and constructs an appropriate response.
 *
 * @param {unknown} error - The error object, potentially from AWS Textract.
 * @returns {NextResponse} A NextResponse object with an error message and a corresponding HTTP status code.
 */
function handleTextractError(error: unknown) {
  // Default error message
  let message = "An unexpected error occurred";
  // Default to internal server error
  let errorCode = 500;

  // Check if error is an instance of Error and has a name property
  if (error instanceof Error && "name" in error) {
    message = error.message || message;

    switch (error.name) {
      case "AccessDeniedException":
      case "BadDocumentException":
      case "DocumentTooLargeException":
      case "InvalidParameterException":
      case "InvalidS3ObjectException":
      case "ProvisionedThroughputExceededException":
      case "UnsupportedDocumentException": {
        errorCode = 400;
        break;
      }
      case "InternalServerError":
      case "ThrottlingException":
      default: {
        break;
      }
    }
  }

  return NextResponse.json({ message }, { status: errorCode });
}
