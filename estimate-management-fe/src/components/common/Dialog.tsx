import React, { type ReactNode } from "react";

interface DialogProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>

        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  );
};

export default Dialog;
