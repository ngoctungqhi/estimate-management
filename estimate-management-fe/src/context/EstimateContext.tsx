import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { Estimate, EstimateDraft } from "../types";

interface EstimateContextType {
  estimates: Estimate[];
  currentEstimate: Estimate | null;
  drafts: EstimateDraft[];
  setCurrentEstimate: (estimate: Estimate | null) => void;
  createEstimate: (estimate: Estimate) => void;
  saveDraft: (estimateData: Estimate, name?: string) => void;
  getDraftsForEstimate: (estimateId: string) => EstimateDraft[];
  loadDraft: (draftId: string) => void;
  generateNewEstimate: () => Estimate;
}

const EstimateContext = createContext<EstimateContextType | undefined>(
  undefined
);

export const EstimateProvider = ({ children }: { children: ReactNode }) => {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [drafts, setDrafts] = useState<EstimateDraft[]>([]);
  const [currentEstimate, setCurrentEstimate] = useState<Estimate | null>(null);

  // Load data from localStorage on init
  useEffect(() => {
    const savedEstimates = localStorage.getItem("estimates");
    const savedDrafts = localStorage.getItem("drafts");

    if (savedEstimates) {
      setEstimates(JSON.parse(savedEstimates));
    }

    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  // Save data to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("estimates", JSON.stringify(estimates));
  }, [estimates]);

  useEffect(() => {
    localStorage.setItem("drafts", JSON.stringify(drafts));
  }, [drafts]);

  const createEstimate = (estimate: Estimate) => {
    const finalEstimate = { ...estimate, isDraft: false };
    setEstimates([...estimates, finalEstimate]);
    setCurrentEstimate(null);
  };

  const saveDraft = (estimateData: Estimate, name: string = "Draft") => {
    // Use the passed estimate data instead of currentEstimate
    const timestamp = new Date().toISOString();
    const draftName = name || `Draft ${timestamp}`;

    const newDraft: EstimateDraft = {
      id: uuidv4(),
      name: draftName,
      timestamp,
      estimate: { ...estimateData, isDraft: true },
    };

    setDrafts([...drafts, newDraft]);
  };

  const getDraftsForEstimate = (estimateId: string): EstimateDraft[] => {
    return drafts.filter((draft) => draft.estimate.id === estimateId);
  };

  const loadDraft = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (draft) {
      setCurrentEstimate(draft.estimate);
    }
  };

  const generateNewEstimate = (): Estimate => {
    return {
      id: uuidv4(),
      projectName: "",
      startDate: new Date().toISOString().split("T")[0],
      epics: [],
      createdAt: new Date().toISOString(),
      isDraft: true,
    };
  };

  return (
    <EstimateContext.Provider
      value={{
        estimates,
        currentEstimate,
        drafts,
        setCurrentEstimate,
        createEstimate,
        saveDraft,
        getDraftsForEstimate,
        loadDraft,
        generateNewEstimate,
      }}
    >
      {children}
    </EstimateContext.Provider>
  );
};

export const useEstimateContext = () => {
  const context = useContext(EstimateContext);
  if (context === undefined) {
    throw new Error(
      "useEstimateContext must be used within an EstimateProvider"
    );
  }
  return context;
};
