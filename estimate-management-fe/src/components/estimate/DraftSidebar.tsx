import React from "react";
import { format } from "date-fns";
import Button from "../common/Button";
import type { EstimateDraft } from "../../types";

interface DraftSidebarProps {
  drafts: EstimateDraft[];
  onLoadDraft: (draftId: string) => void;
  onDeleteDraft?: (draftId: string) => void;
}

const DraftSidebar: React.FC<DraftSidebarProps> = ({
  drafts,
  onLoadDraft,
  onDeleteDraft,
}) => {
  if (drafts.length === 0) {
    return (
      <div className="w-64 bg-gray-50 p-4 border-r">
        <h3 className="text-lg font-medium mb-4">Drafts</h3>
        <p className="text-gray-500 text-sm">
          No drafts saved yet. Use the 'Draft' button below the table to save
          your progress.
        </p>
      </div>
    );
  }

  return (
    <div className="w-64 bg-gray-50 p-4 border-r">
      <h3 className="text-lg font-medium mb-4">Drafts</h3>
      <ul className="space-y-2">
        {drafts.map((draft) => (
          <li
            key={draft.id}
            className="bg-white p-3 rounded-md shadow-sm border border-gray-200"
          >
            <div className="font-medium">{draft.name}</div>
            <div className="text-xs text-gray-500 mb-2">
              {format(new Date(draft.timestamp), "MMM d, yyyy HH:mm")}
            </div>{" "}
            <div className="flex space-x-2">
              <Button
                onClick={() => onLoadDraft(draft.id)}
                variant="outline"
                size="small"
                className="flex-1"
              >
                Load
              </Button>
              {onDeleteDraft && (
                <Button
                  onClick={() => onDeleteDraft(draft.id)}
                  variant="outline"
                  size="small"
                  className="text-red-600 hover:bg-red-50"
                >
                  Delete
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DraftSidebar;
