"use client";

import { APIStatus } from "@/types/api";

type AlertProps = {
  status: APIStatus;
};

/**
 * Renders an alert message based on the API status.
 *
 * - Shows a spinner during loading.
 * - Displays an error message in red if there's an error.
 * - Shows a success message in green if successful.
 *
 * @param {APIStatus} status - The current status of the API call.
 */
const Alert = ({ status }: AlertProps) => (
  <>
    {status.loading && (
      <div className="border-4 border-blue-500 border-t-transparent rounded-full w-6 h-6 animate-spin" />
    )}
    {status.error && (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative my-2"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline"> {status.error}</span>
      </div>
    )}
    {status.success && (
      <div
        className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative my-2"
        role="alert"
      >
        <strong className="font-bold">Success: </strong>
        <span className="block sm:inline"> {status.success}</span>
      </div>
    )}
  </>
);

export default Alert;
