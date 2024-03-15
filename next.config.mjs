/** @type {import('next').NextConfig} */

const requiredEnvVars = [
  "AWS_REGION",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_S3_BUCKET_NAME",
];

// Ensure all env variables are set before executing app
if (process.env.NODE_ENV !== "test") {
  requiredEnvVars.forEach((key) => {
    if (!process.env[key]) {
      throw new Error(`Environment variable ${key} is not set`);
    }
  });
}

const nextConfig = {};

export default nextConfig;
