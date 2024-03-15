import { TextractClient, AnalyzeIDCommand } from "@aws-sdk/client-textract";
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
 * /passport/extract:
 *   post:
 *     summary: Extracts DOB and expiry date from a document using AWS Textract.
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
 *                 description: Name of the uploaded file to S3.
 *     responses:
 *       '200':
 *         description: DOB and expiry date extracted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dateOfBirth:
 *                   type: string
 *                   description: Extracted date of birth.
 *                 expiryDate:
 *                   type: string
 *                   description: Extracted expiry date.
 *       '400':
 *         description: Bad request due to missing/invalid parameters.
 *       '404':
 *         description: Required fields not found in the document.
 *       '500':
 *         description: Internal server error, possibly due to AWS Textract issues.
 *     tags:
 *       - PassportExtract
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

  // Validate the presence of filename and bucket name
  if (!filename) {
    return NextResponse.json(
      { message: "Filename is required" },
      { status: 400 }
    );
  }

  // Sanitize filename to prevent path traversal attacks
  filename = sanitizeFilename(filename);

  try {
    // Prepare and send the AnalyzeIDCommand to AWS Textract
    const command = new AnalyzeIDCommand({
      DocumentPages: [{ S3Object: { Bucket: bucketName, Name: filename } }],
    });

    const result = await textractClient.send(command);

    // Handle missing identity document in the analysis result
    const identityDocument = result.IdentityDocuments?.[0];
    if (!identityDocument) {
      return NextResponse.json(
        { message: "No identity document found" },
        { status: 404 }
      );
    }

    // Extract DOB and expiry date from the Textract result
    const dateOfBirth = identityDocument.IdentityDocumentFields?.find(
      (field) => field.Type?.Text === "DATE_OF_BIRTH"
    )?.ValueDetection?.Text;
    const expiryDate = identityDocument.IdentityDocumentFields?.find(
      (field) => field.Type?.Text === "EXPIRATION_DATE"
    )?.ValueDetection?.Text;

    // Handle missing required fields in the document
    if (!dateOfBirth || !expiryDate) {
      return NextResponse.json(
        { message: "Required fields not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ dateOfBirth, expiryDate }, { status: 200 });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";

    console.error("Textract AnalyzeID error:", error);
    return NextResponse.json(
      { message: "Failed to analyze ID", error: errorMessage },
      { status: 500 }
    );
  }
}
