import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../components/common/Button";
import Input from "../components/common/Input";
import DatePicker from "../components/common/DatePicker";
import Dialog from "../components/common/Dialog";
import DraftSidebar from "../components/estimate/DraftSidebar";
import { useEstimateContext } from "../context/EstimateContext";
import type { Epic } from "../types";
import { EstimateTable } from "../components/estimate/EstimateTable";
import { io } from "socket.io-client";

const API_URL = "http://localhost:5000"; // Adjust to your backend URL

const CreateEstimate: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    currentEstimate,
    setCurrentEstimate,
    createEstimate,
    getDraftsForEstimate,
    generateNewEstimate,
  } = useEstimateContext();
  const [projectName, setProjectName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [epics, setEpics] = useState<Epic[]>([]);
  const [drafts, setDrafts] = useState(id ? getDraftsForEstimate(id) : []);
  const [activeEditors, setActiveEditors] = useState<string[]>([]);
  const socketRef = useRef<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [draftUpdateNotification, setDraftUpdateNotification] = useState<{
    show: boolean;
    draftId: string;
    editorId: string;
  }>({
    show: false,
    draftId: "",
    editorId: "",
  });

  // Redmine integration state
  const [showRedmineDialog, setShowRedmineDialog] = useState(false);
  const [redmineToken, setRedmineToken] = useState("");
  const [isCreatingIssue, setIsCreatingIssue] = useState(false);

  // Connect to Socket.IO when component mounts
  useEffect(() => {
    if (!id) return;

    // Initialize socket connection
    socketRef.current = io(API_URL);

    // Join the estimate room
    socketRef.current.emit("join_estimate", { estimate_id: id });

    // Set up event handlers
    socketRef.current.on("editor_joined", (data: any) => {
      console.log(`Editor joined: ${data.client_id}`);
      setActiveEditors((prev) => [...prev, data.client_id]);
    });

    socketRef.current.on("editor_left", (data: any) => {
      console.log(`Editor left: ${data.client_id}`);
      setActiveEditors((prev) => prev.filter((id) => id !== data.client_id));
    });

    socketRef.current.on("estimate_updated", (data: any) => {
      // Handle real-time updates from other clients
      handleIncomingUpdate(data);
    });

    // Fetch estimate data from API
    const fetchEstimate = async () => {
      try {
        const response = await fetch(`${API_URL}/api/estimates/${id}`);
        if (response.ok) {
          const data = await response.json();
          setCurrentEstimate({
            ...data,
            projectName: data.project_name,
            startDate: data.start_date,
          });
        } else {
          // If estimate doesn't exist yet, create it
          if (response.status === 404) {
            const newEstimate = generateNewEstimate();
            setCurrentEstimate({ ...newEstimate, id });

            // Create the estimate on the server
            fetch(`${API_URL}/api/estimates`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id,
                project_name: newEstimate.projectName,
                start_date: newEstimate.startDate,
                is_draft: true,
              }),
            });
          }
        }
      } catch (error) {
        console.error("Error fetching estimate:", error);
      }
    };

    fetchEstimate();

    // Fetch drafts
    const fetchDrafts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/estimates/${id}/drafts`);
        if (response.ok) {
          const data = await response.json();
          setDrafts(data);
        }
      } catch (error) {
        console.error("Error fetching drafts:", error);
      }
    };

    fetchDrafts();

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave_estimate", { estimate_id: id });
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (currentEstimate) {
      setProjectName(currentEstimate.projectName);
      setStartDate(currentEstimate.startDate);
      setEpics(currentEstimate.epics);
    }
  }, [currentEstimate]);

  const handleIncomingUpdate = (data: any) => {
    // Handle updates from other clients
    if (data.type === "epic") {
      switch (data.action) {
        case "add":
          setEpics((prev) => [...prev, data.data]);
          break;
        case "update":
          setEpics((prev) =>
            prev.map((epic) => (epic.id === data.data.id ? data.data : epic))
          );
          break;
        case "delete":
          setEpics((prev) => prev.filter((epic) => epic.id !== data.data.id));
          break;
      }
    }
    // Similar handlers for other entity types
    else if (data.type === "project_name") {
      setProjectName(data.data.value);
    } else if (data.type === "start_date") {
      setStartDate(data.data.value);
    } // Handle when large changes like loading a draft
    else if (data.type === "estimate" && data.action === "load_draft") {
      // Show notification that another user has loaded a draft
      setDraftUpdateNotification({
        show: true,
        draftId: data.data.id,
        editorId: data.client_id,
      });
    }
  };
  const sendUpdate = (type: string, action: string, data: any) => {
    if (socketRef.current && id) {
      socketRef.current.emit("update_estimate", {
        estimate_id: id,
        type,
        action,
        data,
        client_id: socketRef.current.id, // Send the client ID for identification
      });
    }
  };

  const handleDraftSave = async () => {
    if (!currentEstimate || !id) return;
    setIsSaving(true);

    // Update the current estimate with current form values
    const updatedEstimate = {
      ...currentEstimate,
      projectName,
      startDate,
      epics,
    };

    // Save it to context
    setCurrentEstimate(updatedEstimate);

    // Save as draft to API
    try {
      await fetch(`${API_URL}/api/estimates/${id}/drafts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Draft ${new Date().toLocaleDateString()}`,
          estimate_data: updatedEstimate,
        }),
      });

      // Refresh drafts list
      const response = await fetch(`${API_URL}/api/estimates/${id}/drafts`);
      if (response.ok) {
        const data = await response.json();
        setDrafts(data);
      }
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEstimate = async () => {
    if (!currentEstimate || !id) return;

    // Update with current form values
    const finalEstimate = {
      ...currentEstimate,
      projectName,
      startDate,
      epics,
    };

    try {
      // Update the estimate in the API
      await fetch(`${API_URL}/api/estimates/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_name: projectName,
          start_date: startDate,
          epics: epics,
          is_draft: false,
        }),
      });

      // Save to context and navigate home
      createEstimate(finalEstimate);
      navigate("/");
    } catch (error) {
      console.error("Error finalizing estimate:", error);
    }
  };
  const handleLoadDraft = async (draftId: string) => {
    if (!id) return;

    try {
      const response = await fetch(
        `${API_URL}/api/estimates/${id}/drafts/${draftId}`
      );
      if (response.ok) {
        const data = await response.json();
        // Load the draft data
        setCurrentEstimate(data.estimate);

        // Update local state
        setProjectName(data.estimate.projectName || data.estimate.project_name);
        setStartDate(data.estimate.startDate || data.estimate.start_date);
        setEpics(data.estimate.epics);

        // Also update the estimate on the server
        await fetch(`${API_URL}/api/estimates/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            project_name: data.estimate.project_name,
            start_date: data.estimate.start_date,
            epics: data.estimate.epics,
          }),
        });

        // Clear any existing notification since we just loaded a draft
        setDraftUpdateNotification({ show: false, draftId: "", editorId: "" });

        // Notify others about this large change
        sendUpdate("estimate", "load_draft", { id: draftId });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!id) return;

    try {
      // Delete draft from API
      const response = await fetch(
        `${API_URL}/api/estimates/${id}/drafts/${draftId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        // Update local drafts list
        setDrafts(drafts.filter((draft) => draft.id !== draftId));
      }
    } catch (error) {
      console.error("Error deleting draft:", error);
    }
  };

  const handleRefreshData = async () => {
    if (!id) return;

    try {
      // Fetch the latest estimate data from the server
      const response = await fetch(`${API_URL}/api/estimates/${id}`);
      if (response.ok) {
        const data = await response.json();
        // Update local state
        setProjectName(data.project_name);
        setStartDate(data.start_date);
        setEpics(data.epics);
        setCurrentEstimate({
          ...data,
          projectName: data.project_name,
          startDate: data.start_date,
        });

        // Clear the notification
        setDraftUpdateNotification({ show: false, draftId: "", editorId: "" });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    }
  };

  const handleCreateRedmineIssue = async () => {
    if (!id || !redmineToken.trim()) return;

    setIsCreatingIssue(true);

    try {
      // Prepare estimate data for the Redmine issue
      const issueData = {
        issue: {
          project_id: 1, // Default project ID, can be made configurable
          subject: `Estimate: ${projectName}`,
          description: `Project: ${projectName}\nStart Date: ${startDate}\n\nEstimate details:\n${JSON.stringify(
            epics,
            null,
            2
          )}`,
          tracker_id: 2, // Feature tracker ID, can be made configurable
        },
        estimate_id: id,
      };

      // Call your backend API to create a Redmine issue using the token
      const response = await fetch(`${API_URL}/api/redmine/issues`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Redmine-API-Key": redmineToken,
        },
        body: JSON.stringify(issueData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Redmine issue created successfully. Issue ID: ${data.issue_id}`);
        setShowRedmineDialog(false);
        setRedmineToken("");
      } else {
        const errorData = await response.json();
        alert(
          `Failed to create Redmine issue: ${
            errorData.message || response.statusText
          }`
        );
      }
    } catch (error) {
      console.error("Error creating Redmine issue:", error);
      alert(
        `Error creating Redmine issue: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsCreatingIssue(false);
    }
  };

  const handleEpicsUpdate = (newEpics: Epic[]) => {
    // Find what changed to send targeted updates
    if (epics.length !== newEpics.length) {
      if (newEpics.length > epics.length) {
        // Epic added
        const newEpic = newEpics.find(
          (epic) => !epics.some((e) => e.id === epic.id)
        );
        if (newEpic) {
          sendUpdate("epic", "add", newEpic);
        }
      } else {
        // Epic removed
        const removedEpic = epics.find(
          (epic) => !newEpics.some((e) => e.id === epic.id)
        );
        if (removedEpic) {
          sendUpdate("epic", "delete", { id: removedEpic.id });
        }
      }
    } else {
      console.log(newEpics, epics);
      // Epic updated - find which one
      const updatedEpic = newEpics.find((epic, index) => {
        return epic.id === newEpics[index].id;
      });

      if (updatedEpic) {
        sendUpdate("epic", "update", updatedEpic);
      }
    }

    setEpics(newEpics);
  };

  if (!currentEstimate) {
    return <div className="text-center p-8">Loading...</div>;
  }

  return (
    <div className="flex flex-1">
      <DraftSidebar
        drafts={drafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
      />

      <div className="flex-1 overflow-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-4">Create New Estimate</h1>
            <div className="text-sm text-gray-500 mb-4">
              ID: {currentEstimate.id}
            </div>{" "}
            {activeEditors.length > 0 && (
              <div className="text-sm text-blue-600 mb-4">
                {activeEditors.length} other{" "}
                {activeEditors.length === 1 ? "person" : "people"} currently
                editing this estimate
              </div>
            )}
            {draftUpdateNotification.show && (
              <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-yellow-700">
                    Another user has loaded a draft. Your data may be out of
                    date.
                  </p>
                </div>
                <Button
                  onClick={handleRefreshData}
                  variant="outline"
                  className="ml-4"
                >
                  Refresh Data
                </Button>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name
                </label>
                <Input
                  value={projectName}
                  onChange={(e) => {
                    setProjectName(e.target.value);
                    if (socketRef.current && id) {
                      socketRef.current.emit("update_estimate", {
                        estimate_id: id,
                        type: "project_name",
                        action: "update",
                        data: { value: e.target.value },
                      });
                    }
                  }}
                  placeholder="Enter project name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <DatePicker
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (socketRef.current && id) {
                      socketRef.current.emit("update_estimate", {
                        estimate_id: id,
                        type: "start_date",
                        action: "update",
                        data: { value: e.target.value },
                      });
                    }
                  }}
                  className="w-full"
                />
              </div>
            </div>
          </div>{" "}
          <EstimateTable epics={epics} onUpdate={handleEpicsUpdate} />
          <div className="mt-8 flex justify-end space-x-4">
            <Button
              onClick={handleDraftSave}
              variant="outline"
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={() => setShowRedmineDialog(true)}
              variant="secondary"
            >
              Create Issue
            </Button>
            <Button onClick={handleCreateEstimate} variant="primary">
              Finalize Estimate
            </Button>
          </div>
        </div>
      </div>

      {/* Redmine Issue Creation Dialog */}
      <Dialog isOpen={showRedmineDialog} title="Create Redmine Issue">
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redmine API Token
            </label>
            <Input
              type="password"
              value={redmineToken}
              onChange={(e) => setRedmineToken(e.target.value)}
              placeholder="Enter your Redmine API token"
              className="w-full"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              onClick={() => setShowRedmineDialog(false)}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateRedmineIssue}
              variant="primary"
              isLoading={isCreatingIssue}
            >
              Create Issue
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default CreateEstimate;
