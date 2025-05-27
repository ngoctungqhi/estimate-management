import React, { type JSX } from "react";

import Button from "../common/Button";
import Input from "../common/Input";

interface Personnel {
  estimate_hours: number;
  role_id: number;
  issue_id: number;
  id: number;
}

interface Issue {
  title: string;
  type_id: number;
  parent_id: number | null;
  project_id: number;
  id: number;
  created_at: string | null;
  children: Issue[];
  personnel: Personnel[];
}

interface HierarchyLevel {
  key: string;
  label: string;
  addButtonText: string;
  type_id: number;
}

interface EstimateTableProps {
  issues: Issue[];
  onUpdate: (issues: Issue[]) => void;
  hierarchyLevels?: HierarchyLevel[];
  roleMapping?: { [key: number]: string };
}

export const TestEstimateTable: React.FC<EstimateTableProps> = ({
  issues,
  onUpdate,
  hierarchyLevels = [
    { key: "epic", label: "Epic", addButtonText: "Add Epic", type_id: 1 },
    { key: "story", label: "Story", addButtonText: "Add Story", type_id: 2 },
    { key: "task", label: "Task", addButtonText: "Add Task", type_id: 3 },
    {
      key: "subtask",
      label: "Sub-task",
      addButtonText: "Add Sub-task",
      type_id: 4,
    },
  ],
  roleMapping = {
    1: "DEV",
    2: "BA",
    3: "TESTER",
    4: "QA",
  },
}) => {
  const roleIds = Object.keys(roleMapping).map(Number);

  // Delete button style
  const deleteButtonStyle = "text-red-600 hover:bg-red-50";

  // Calculate total estimation for a personnel array
  const calculateTotal = (personnel: Personnel[]): number => {
    return personnel.reduce((sum, p) => sum + p.estimate_hours, 0);
  };

  // Calculate grand total for the entire project
  const calculateGrandTotal = (items: Issue[]): number => {
    let total = 0;

    const calculateRecursive = (item: Issue): void => {
      if (!item.children || item.children.length === 0) {
        total += calculateTotal(item.personnel);
      } else {
        item.children.forEach(calculateRecursive);
      }
    };

    items.forEach(calculateRecursive);
    return total;
  };

  // Generic function to create new item
  const createNewItem = (levelIndex: number, projectId: number = 1): Issue => {
    const newId = Date.now() + Math.random(); // Simple ID generation for demo
    return {
      title: "",
      type_id: hierarchyLevels[levelIndex].type_id,
      parent_id: null,
      project_id: projectId,
      id: newId,
      created_at: null,
      children: [],
      personnel: roleIds.map((roleId) => ({
        estimate_hours: 0,
        role_id: roleId,
        issue_id: newId,
        id: Date.now() + roleId + Math.random(),
      })),
    };
  };

  // Generic add function
  const addItem = (indices: number[], levelIndex: number) => {
    const newData = [...issues];

    if (indices.length === 0) {
      // Adding at root level
      newData.push(createNewItem(levelIndex));
    } else {
      // Navigate to parent and add child
      let current = newData[indices[0]];
      for (let i = 1; i < indices.length; i++) {
        current = current.children[indices[i]];
      }
      current.children.push(createNewItem(levelIndex));
    }

    onUpdate(newData);
  };

  // Generic delete function
  const deleteItem = (indices: number[]) => {
    const newData = [...issues];

    if (indices.length === 1) {
      // Deleting root level item
      newData.splice(indices[0], 1);
    } else {
      // Navigate to parent and delete child
      let current = newData[indices[0]];
      for (let i = 1; i < indices.length - 1; i++) {
        current = current.children[indices[i]];
      }
      current.children.splice(indices[indices.length - 1], 1);
    }

    onUpdate(newData);
  };

  // Generic update function
  const updateItem = (
    indices: number[],
    field: string,
    value: string | Personnel[]
  ) => {
    const newData = [...issues];
    let current = newData[indices[0]];

    // Navigate to the item
    for (let i = 1; i < indices.length; i++) {
      current = current.children[indices[i]];
    }

    (current as any)[field] = value;
    onUpdate(newData);
  };

  const updatePersonnel = (
    indices: number[],
    roleId: number,
    hours: number
  ) => {
    const newData = [...issues];
    let current = newData[indices[0]];

    // Navigate to the item
    for (let i = 1; i < indices.length; i++) {
      current = current.children[indices[i]];
    }

    const personnelIndex = current.personnel.findIndex(
      (p) => p.role_id === roleId
    );
    if (personnelIndex !== -1) {
      current.personnel[personnelIndex].estimate_hours = hours;
    }

    onUpdate(newData);
  };

  // Calculate row count for any level
  const calculateRowCount = (item: Issue, currentLevel: number): number => {
    if (
      currentLevel >= hierarchyLevels.length - 1 ||
      !item.children ||
      item.children.length === 0
    ) {
      return 1;
    }

    return item.children.reduce(
      (sum: number, child: Issue) =>
        sum + calculateRowCount(child, currentLevel + 1),
      0
    );
  };

  // Helper function to get item at specific level from indices
  const getItemAtLevel = (indices: number[], level: number): Issue => {
    let current = issues[indices[0]];
    for (let i = 1; i <= level && i < indices.length; i++) {
      current = current.children[indices[i]];
    }
    return current;
  };

  // Track which parent cells have been rendered to handle rowSpan
  const renderRows = (
    items: Issue[],
    currentLevel: number,
    parentIndices: number[] = [],
    renderedCells: Set<string> = new Set()
  ): JSX.Element[] => {
    if (items.length === 0 && currentLevel === 0) {
      return [
        <tr key="empty">
          <td
            colSpan={hierarchyLevels.length + roleIds.length + 1}
            className="border px-4 py-2 text-center"
          >
            No items added yet. Click "{hierarchyLevels[0].addButtonText}" to
            start.
          </td>
        </tr>,
      ];
    }

    const results: JSX.Element[] = [];

    items.forEach((item, itemIndex) => {
      const currentIndices = [...parentIndices, itemIndex];
      const hasChildren = item.children && item.children.length > 0;
      const isLeafLevel = currentLevel === hierarchyLevels.length - 1;

      if (!hasChildren || isLeafLevel) {
        // This is a leaf node - render the actual row
        const rowCells: JSX.Element[] = [];

        // Render hierarchy cells
        hierarchyLevels.forEach((level, levelIndex) => {
          if (levelIndex < currentLevel) {
            // Parent level - render with rowSpan if not already rendered
            const cellKey = `${levelIndex}-${currentIndices
              .slice(0, levelIndex + 1)
              .join("-")}`;

            if (!renderedCells.has(cellKey)) {
              const parentItem = getItemAtLevel(currentIndices, levelIndex);
              const parentIndicesForLevel = currentIndices.slice(
                0,
                levelIndex + 1
              );
              const rowSpan = calculateRowCountForParent(
                parentIndicesForLevel,
                levelIndex
              );

              renderedCells.add(cellKey);

              rowCells.push(
                <td
                  key={levelIndex}
                  className="border px-4 py-2 align-top"
                  rowSpan={rowSpan}
                >
                  <Input
                    value={parentItem.title}
                    onChange={(e) =>
                      updateItem(parentIndicesForLevel, "title", e.target.value)
                    }
                    placeholder={`${level.label} name`}
                  />
                  <div className="flex space-x-2 mt-2">
                    {levelIndex < hierarchyLevels.length - 1 && (
                      <Button
                        onClick={() =>
                          addItem(parentIndicesForLevel, levelIndex + 1)
                        }
                        variant="outline"
                        size="small"
                      >
                        {hierarchyLevels[levelIndex + 1].addButtonText}
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteItem(parentIndicesForLevel)}
                      variant="outline"
                      size="small"
                      className={deleteButtonStyle}
                    >
                      Delete
                    </Button>
                  </div>
                </td>
              );
            }
            // If already rendered, don't add any cell (it's spanned)
          } else if (levelIndex === currentLevel) {
            // Current level - render normally
            rowCells.push(
              <td key={levelIndex} className="border px-4 py-2 align-top">
                <Input
                  value={item.title}
                  onChange={(e) =>
                    updateItem(currentIndices, "title", e.target.value)
                  }
                  placeholder={`${level.label} name`}
                />
                <div className="flex space-x-2 mt-2">
                  {currentLevel < hierarchyLevels.length - 1 && (
                    <Button
                      onClick={() => addItem(currentIndices, currentLevel + 1)}
                      variant="outline"
                      size="small"
                    >
                      {hierarchyLevels[currentLevel + 1].addButtonText}
                    </Button>
                  )}
                  <Button
                    onClick={() => deleteItem(currentIndices)}
                    variant="outline"
                    size="small"
                    className={deleteButtonStyle}
                  >
                    Delete
                  </Button>
                </div>
              </td>
            );
          } else {
            // Future level - render empty cell
            rowCells.push(
              <td key={levelIndex} className="border px-4 py-2"></td>
            );
          }
        });

        // Add personnel columns
        roleIds.forEach((roleId) => {
          rowCells.push(
            <td key={`personnel-${roleId}`} className="border px-4 py-2">
              <Input
                type="number"
                value={
                  item.personnel
                    .find((p: Personnel) => p.role_id === roleId)
                    ?.estimate_hours.toString() || "0"
                }
                onChange={(e) =>
                  updatePersonnel(
                    currentIndices,
                    roleId,
                    Number(e.target.value)
                  )
                }
              />
            </td>
          );
        });

        // Add total column
        rowCells.push(
          <td key="total" className="border px-4 py-2 font-bold text-right">
            {calculateTotal(item.personnel)}
          </td>
        );

        results.push(
          <tr key={`${item.id}-${currentIndices.join("-")}`}>{rowCells}</tr>
        );
      } else {
        // Has children - render recursively
        const childResults = renderRows(
          item.children,
          currentLevel + 1,
          currentIndices,
          renderedCells
        );
        results.push(...childResults);
      }
    });

    return results;
  };

  // Calculate row count for a specific parent at a specific level
  const calculateRowCountForParent = (
    indices: number[],
    level: number
  ): number => {
    const item = getItemAtLevel(indices, level);
    return calculateRowCount(item, level);
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr>
            {hierarchyLevels.map((level, index) => (
              <th key={index} className="border px-4 py-2 min-w-60" rowSpan={2}>
                {level.label}
              </th>
            ))}
            <th className="border px-4 py-2" colSpan={roleIds.length}>
              Members
            </th>
            <th className="border px-4 py-2" rowSpan={2}>
              Total
            </th>
          </tr>
          <tr>
            {roleIds.map((roleId) => (
              <th key={roleId} className="border px-4 py-2">
                {roleMapping[roleId]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{renderRows(issues, 0)}</tbody>
        {issues.length > 0 && (
          <tfoot>
            <tr className="bg-gray-100">
              <td
                colSpan={hierarchyLevels.length + roleIds.length}
                className="border px-4 py-2 text-right font-bold"
              >
                Grand Total:
              </td>
              <td className="border px-4 py-2 font-bold text-right">
                {calculateGrandTotal(issues)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="mt-4">
        <Button onClick={() => addItem([], 0)} variant="primary">
          {hierarchyLevels[0].addButtonText}
        </Button>
      </div>
    </div>
  );
};
