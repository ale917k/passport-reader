"use client";

type ButtonProps = {
  onClick?: () => void;
  type: "button" | "submit" | "reset";
  children: React.ReactNode;
};

/**
 * Renders a styled button that supports click events and different types.
 *
 * @param {Function} onClick - The function to call when the button is clicked.
 * @param {"button" | "submit" | "reset"} type - The button type.
 * @param {React.ReactNode} children - The content to display inside the button.
 */
const Button = ({ onClick, type, children }: ButtonProps) => (
  <button
    onClick={onClick}
    type={type}
    className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white font-bold rounded"
  >
    {children}
  </button>
);

export default Button;
