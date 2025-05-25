import React from "react";
import { v4 as uuidv4 } from "uuid";

import Button from "../common/Button";
import Input from "../common/Input";
import type {
  Epic,
  Personnel,
  PersonnelType,
  Story,
  SubTask,
  Task,
} from "../../types";

interface EstimateTableProps {
  epics: Epic[];
  onUpdate: (epics: Epic[]) => void;
}

export const EstimateTable: React.FC<EstimateTableProps> = ({
  epics,
  onUpdate,
}) => {
  const personnelTypes: PersonnelType[] = ["DEV", "BA", "TESTER"];

  // Delete button style
  const deleteButtonStyle = "text-red-600 hover:bg-red-50";

  // Calculate total estimation for a personnel array
  const calculateTotal = (personnel: Personnel[]): number => {
    return personnel.reduce((sum, p) => sum + p.value, 0);
  };

  // Calculate grand total for the entire project
  const calculateGrandTotal = (epics: Epic[]): number => {
    let total = 0;

    epics.forEach((epic) => {
      if (!epic.stories || epic.stories.length === 0) {
        total += calculateTotal(epic.personnel);
      } else {
        epic.stories.forEach((story) => {
          if (!story.tasks || story.tasks.length === 0) {
            total += calculateTotal(story.personnel);
          } else {
            story.tasks.forEach((task) => {
              if (!task.subTasks || task.subTasks.length === 0) {
                total += calculateTotal(task.personnel);
              } else {
                task.subTasks.forEach((subTask) => {
                  total += calculateTotal(subTask.personnel);
                });
              }
            });
          }
        });
      }
    });

    return total;
  };

  const addEpic = () => {
    const newEpic: Epic = {
      id: uuidv4(),
      name: "",
      stories: [],
      personnel: personnelTypes.map((type) => ({ type, value: 0 })),
    };
    onUpdate([...epics, newEpic]);
  };

  const addStory = (epicIndex: number) => {
    const newEpics = [...epics];
    const newStory: Story = {
      id: uuidv4(),
      name: "",
      tasks: [],
      personnel: personnelTypes.map((type) => ({ type, value: 0 })),
    };
    newEpics[epicIndex].stories.push(newStory);
    onUpdate(newEpics);
  };

  const addTask = (epicIndex: number, storyIndex: number) => {
    const newEpics = [...epics];
    const newTask: Task = {
      id: uuidv4(),
      name: "",
      subTasks: [], // Ensure this is always initialized
      personnel: personnelTypes.map((type) => ({ type, value: 0 })),
    };
    newEpics[epicIndex].stories[storyIndex].tasks.push(newTask);
    onUpdate(newEpics);
  };

  const addSubTask = (
    epicIndex: number,
    storyIndex: number,
    taskIndex: number
  ) => {
    const newEpics = [...epics];
    const newSubTask: SubTask = {
      id: uuidv4(),
      name: "",
      personnel: personnelTypes.map((type) => ({ type, value: 0 })),
    };

    // Ensure the subTasks array exists before pushing to it
    const task = newEpics[epicIndex].stories[storyIndex].tasks[taskIndex];
    if (!task.subTasks) {
      task.subTasks = [];
    }

    task.subTasks.push(newSubTask);
    onUpdate(newEpics);
  };

  const updateEpic = (
    epicIndex: number,
    field: keyof Epic,
    value: string | Personnel[]
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex] = { ...newEpics[epicIndex], [field]: value };
    onUpdate(newEpics);
  };

  const updateStory = (
    epicIndex: number,
    storyIndex: number,
    field: keyof Story,
    value: string | Personnel[]
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories[storyIndex] = {
      ...newEpics[epicIndex].stories[storyIndex],
      [field]: value,
    };
    onUpdate(newEpics);
  };

  const updateTask = (
    epicIndex: number,
    storyIndex: number,
    taskIndex: number,
    field: keyof Task,
    value: string | Personnel[]
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories[storyIndex].tasks[taskIndex] = {
      ...newEpics[epicIndex].stories[storyIndex].tasks[taskIndex],
      [field]: value,
    };
    onUpdate(newEpics);
  };

  const updateSubTask = (
    epicIndex: number,
    storyIndex: number,
    taskIndex: number,
    subTaskIndex: number,
    field: keyof SubTask,
    value: string | Personnel[]
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories[storyIndex].tasks[taskIndex].subTasks[
      subTaskIndex
    ] = {
      ...newEpics[epicIndex].stories[storyIndex].tasks[taskIndex].subTasks[
        subTaskIndex
      ],
      [field]: value,
    };
    onUpdate(newEpics);
  };

  const updatePersonnel = (
    type: "epic" | "story" | "task" | "subtask",
    indices: number[],
    personnelType: PersonnelType,
    value: number
  ) => {
    const newEpics = [...epics];
    let target;

    if (type === "epic") {
      const [epicIndex] = indices;
      target = newEpics[epicIndex].personnel;
    } else if (type === "story") {
      const [epicIndex, storyIndex] = indices;
      target = newEpics[epicIndex].stories[storyIndex].personnel;
    } else if (type === "task") {
      const [epicIndex, storyIndex, taskIndex] = indices;
      target =
        newEpics[epicIndex].stories[storyIndex].tasks[taskIndex].personnel;
    } else {
      const [epicIndex, storyIndex, taskIndex, subTaskIndex] = indices;
      target =
        newEpics[epicIndex].stories[storyIndex].tasks[taskIndex].subTasks[
          subTaskIndex
        ].personnel;
    }

    const personnelIndex = target.findIndex((p) => p.type === personnelType);
    if (personnelIndex !== -1) {
      target[personnelIndex].value = value;
    }

    onUpdate(newEpics);
  };

  // Delete functions
  const deleteEpic = (epicIndex: number) => {
    const newEpics = [...epics];
    newEpics.splice(epicIndex, 1);
    onUpdate(newEpics);
  };

  const deleteStory = (epicIndex: number, storyIndex: number) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories.splice(storyIndex, 1);
    onUpdate(newEpics);
  };

  const deleteTask = (
    epicIndex: number,
    storyIndex: number,
    taskIndex: number
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories[storyIndex].tasks.splice(taskIndex, 1);
    onUpdate(newEpics);
  };

  const deleteSubTask = (
    epicIndex: number,
    storyIndex: number,
    taskIndex: number,
    subTaskIndex: number
  ) => {
    const newEpics = [...epics];
    newEpics[epicIndex].stories[storyIndex].tasks[taskIndex].subTasks.splice(
      subTaskIndex,
      1
    );
    onUpdate(newEpics);
  };

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr>
            <th className="border px-4 py-2 min-w-60" rowSpan={2}>
              Epic
            </th>
            <th className="border px-4 py-2 min-w-60" rowSpan={2}>
              Story
            </th>
            <th className="border px-4 py-2 min-w-60" rowSpan={2}>
              Task
            </th>
            <th className="border px-4 py-2 min-w-60" rowSpan={2}>
              Sub-task
            </th>
            <th className="border px-4 py-2" colSpan={personnelTypes.length}>
              Members
            </th>
            <th className="border px-4 py-2" rowSpan={2}>
              Total
            </th>
          </tr>
          <tr>
            {personnelTypes.map((type) => (
              <th key={type} className="border px-4 py-2">
                {type}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {epics.length === 0 ? (
            <tr>
              <td
                colSpan={personnelTypes.length + 5}
                className="border px-4 py-2 text-center"
              >
                No epics added yet. Click "Add Epic" to start.
              </td>
            </tr>
          ) : (
            epics.flatMap((epic, epicIndex) => {
              // Tính tổng số hàng cho Epic này
              const epicRowCount =
                epic.stories.length === 0
                  ? 1
                  : epic.stories.reduce((sum, story) => {
                      if (!story.tasks || story.tasks.length === 0)
                        return sum + 1;
                      return (
                        sum +
                        story.tasks.reduce((taskSum, task) => {
                          if (!task.subTasks || task.subTasks.length === 0)
                            return taskSum + 1;
                          return taskSum + task.subTasks.length;
                        }, 0)
                      );
                    }, 0);

              if (epic.stories.length === 0) {
                // Epic không có story
                return [
                  <tr key={epic.id}>
                    <td className="border px-4 py-2 align-top" rowSpan={1}>
                      <Input
                        value={epic.name}
                        onChange={(e) =>
                          updateEpic(epicIndex, "name", e.target.value)
                        }
                        placeholder="Epic name"
                      />
                      <div className="flex space-x-2 mt-2">
                        <Button
                          onClick={() => addStory(epicIndex)}
                          variant="outline"
                          size="small"
                        >
                          Add Story
                        </Button>
                        <Button
                          onClick={() => deleteEpic(epicIndex)}
                          variant="outline"
                          size="small"
                          className={deleteButtonStyle}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                    <td className="border px-4 py-2"></td>
                    <td className="border px-4 py-2"></td>
                    <td className="border px-4 py-2"></td>
                    {personnelTypes.map((type) => (
                      <td key={type} className="border px-4 py-2">
                        <Input
                          type="number"
                          value={
                            epic.personnel
                              .find((p) => p.type === type)
                              ?.value.toString() || "0"
                          }
                          onChange={(e) =>
                            updatePersonnel(
                              "epic",
                              [epicIndex],
                              type,
                              Number(e.target.value)
                            )
                          }
                        />
                      </td>
                    ))}
                    <td className="border px-4 py-2 font-bold text-right">
                      {calculateTotal(epic.personnel)}
                    </td>
                  </tr>,
                ];
              }

              let epicRendered = false;
              return epic.stories.flatMap((story, storyIndex) => {
                // Tính tổng số hàng cho Story này
                const storyRowCount =
                  !story.tasks || story.tasks.length === 0
                    ? 1
                    : story.tasks.reduce((sum, task) => {
                        if (!task.subTasks || task.subTasks.length === 0)
                          return sum + 1;
                        return sum + task.subTasks.length;
                      }, 0);

                let storyRendered = false;
                return story.tasks.length === 0
                  ? [
                      <tr key={`${epic.id}-${story.id}`}>
                        {/* Epic cell */}
                        {!epicRendered && (
                          <td
                            className="border px-4 py-2 align-top"
                            rowSpan={epicRowCount}
                          >
                            <Input
                              value={epic.name}
                              onChange={(e) =>
                                updateEpic(epicIndex, "name", e.target.value)
                              }
                              placeholder="Epic name"
                            />
                            <div className="flex space-x-2 mt-2">
                              <Button
                                onClick={() => addStory(epicIndex)}
                                variant="outline"
                                size="small"
                              >
                                Add Story
                              </Button>
                              <Button
                                onClick={() => deleteEpic(epicIndex)}
                                variant="outline"
                                size="small"
                                className={deleteButtonStyle}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        )}
                        {/* Story cell */}
                        <td className="border px-4 py-2 align-top" rowSpan={1}>
                          <Input
                            value={story.name}
                            onChange={(e) =>
                              updateStory(
                                epicIndex,
                                storyIndex,
                                "name",
                                e.target.value
                              )
                            }
                            placeholder="Story name"
                          />
                          <div className="flex space-x-2 mt-2">
                            <Button
                              onClick={() => addTask(epicIndex, storyIndex)}
                              variant="outline"
                              size="small"
                            >
                              Add Task
                            </Button>
                            <Button
                              onClick={() => deleteStory(epicIndex, storyIndex)}
                              variant="outline"
                              size="small"
                              className={deleteButtonStyle}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                        <td className="border px-4 py-2"></td>
                        <td className="border px-4 py-2"></td>
                        {personnelTypes.map((type) => (
                          <td key={type} className="border px-4 py-2">
                            <Input
                              type="number"
                              value={
                                story.personnel
                                  .find((p) => p.type === type)
                                  ?.value.toString() || "0"
                              }
                              onChange={(e) =>
                                updatePersonnel(
                                  "story",
                                  [epicIndex, storyIndex],
                                  type,
                                  Number(e.target.value)
                                )
                              }
                            />
                          </td>
                        ))}
                        <td className="border px-4 py-2 font-bold text-right">
                          {calculateTotal(story.personnel)}
                        </td>
                      </tr>,
                      (() => {
                        epicRendered = true;
                        return null;
                      })(),
                    ]
                  : story.tasks.flatMap((task, taskIndex) => {
                      // Tính số hàng cho Task này
                      const taskRowCount =
                        !task.subTasks || task.subTasks.length === 0
                          ? 1
                          : task.subTasks.length;

                      return !task.subTasks || task.subTasks.length === 0
                        ? [
                            <tr key={`${epic.id}-${story.id}-${task.id}`}>
                              {/* Epic cell */}
                              {!epicRendered && (
                                <td
                                  className="border px-4 py-2 align-top"
                                  rowSpan={epicRowCount}
                                >
                                  <Input
                                    value={epic.name}
                                    onChange={(e) =>
                                      updateEpic(
                                        epicIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Epic name"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      onClick={() => addStory(epicIndex)}
                                      variant="outline"
                                      size="small"
                                    >
                                      Add Story
                                    </Button>
                                    <Button
                                      onClick={() => deleteEpic(epicIndex)}
                                      variant="outline"
                                      size="small"
                                      className={deleteButtonStyle}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {/* Story cell */}
                              {!storyRendered && (
                                <td
                                  className="border px-4 py-2 align-top"
                                  rowSpan={storyRowCount}
                                >
                                  <Input
                                    value={story.name}
                                    onChange={(e) =>
                                      updateStory(
                                        epicIndex,
                                        storyIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Story name"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      onClick={() =>
                                        addTask(epicIndex, storyIndex)
                                      }
                                      variant="outline"
                                      size="small"
                                    >
                                      Add Task
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        deleteStory(epicIndex, storyIndex)
                                      }
                                      variant="outline"
                                      size="small"
                                      className={deleteButtonStyle}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {/* Task cell */}
                              <td
                                className="border px-4 py-2 align-top"
                                rowSpan={1}
                              >
                                <Input
                                  value={task.name}
                                  onChange={(e) =>
                                    updateTask(
                                      epicIndex,
                                      storyIndex,
                                      taskIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Task name"
                                />
                                <div className="flex space-x-2 mt-2">
                                  <Button
                                    onClick={() =>
                                      addSubTask(
                                        epicIndex,
                                        storyIndex,
                                        taskIndex
                                      )
                                    }
                                    variant="outline"
                                    size="small"
                                  >
                                    Add Sub-task
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      deleteTask(
                                        epicIndex,
                                        storyIndex,
                                        taskIndex
                                      )
                                    }
                                    variant="outline"
                                    size="small"
                                    className={deleteButtonStyle}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                              <td className="border px-4 py-2"></td>
                              {personnelTypes.map((type) => (
                                <td key={type} className="border px-4 py-2">
                                  <Input
                                    type="number"
                                    value={
                                      task.personnel
                                        .find((p) => p.type === type)
                                        ?.value.toString() || "0"
                                    }
                                    onChange={(e) =>
                                      updatePersonnel(
                                        "task",
                                        [epicIndex, storyIndex, taskIndex],
                                        type,
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </td>
                              ))}
                              <td className="border px-4 py-2 font-bold text-right">
                                {calculateTotal(task.personnel)}
                              </td>
                            </tr>,
                            (() => {
                              epicRendered = true;
                              storyRendered = true;
                              return null;
                            })(),
                          ]
                        : (task.subTasks || []).map((subTask, subTaskIndex) => (
                            <tr
                              key={`${epic.id}-${story.id}-${task.id}-${subTask.id}`}
                            >
                              {/* Epic cell */}
                              {!epicRendered && subTaskIndex === 0 && (
                                <td
                                  className="border px-4 py-2 align-top"
                                  rowSpan={epicRowCount}
                                >
                                  <Input
                                    value={epic.name}
                                    onChange={(e) =>
                                      updateEpic(
                                        epicIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Epic name"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      onClick={() => addStory(epicIndex)}
                                      variant="outline"
                                      size="small"
                                    >
                                      Add Story
                                    </Button>
                                    <Button
                                      onClick={() => deleteEpic(epicIndex)}
                                      variant="outline"
                                      size="small"
                                      className={deleteButtonStyle}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {/* Story cell */}
                              {!storyRendered && subTaskIndex === 0 && (
                                <td
                                  className="border px-4 py-2 align-top"
                                  rowSpan={storyRowCount}
                                >
                                  <Input
                                    value={story.name}
                                    onChange={(e) =>
                                      updateStory(
                                        epicIndex,
                                        storyIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Story name"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      onClick={() =>
                                        addTask(epicIndex, storyIndex)
                                      }
                                      variant="outline"
                                      size="small"
                                    >
                                      Add Task
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        deleteStory(epicIndex, storyIndex)
                                      }
                                      variant="outline"
                                      size="small"
                                      className={deleteButtonStyle}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {/* Task cell */}
                              {subTaskIndex === 0 && (
                                <td
                                  className="border px-4 py-2 align-top"
                                  rowSpan={taskRowCount}
                                >
                                  <Input
                                    value={task.name}
                                    onChange={(e) =>
                                      updateTask(
                                        epicIndex,
                                        storyIndex,
                                        taskIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Task name"
                                  />
                                  <div className="flex space-x-2 mt-2">
                                    <Button
                                      onClick={() =>
                                        addSubTask(
                                          epicIndex,
                                          storyIndex,
                                          taskIndex
                                        )
                                      }
                                      variant="outline"
                                      size="small"
                                    >
                                      Add Sub-task
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        deleteTask(
                                          epicIndex,
                                          storyIndex,
                                          taskIndex
                                        )
                                      }
                                      variant="outline"
                                      size="small"
                                      className={deleteButtonStyle}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </td>
                              )}
                              {/* Sub-task cell */}
                              <td className="border px-4 py-2">
                                <div className="flex flex-col">
                                  <Input
                                    value={subTask.name}
                                    onChange={(e) =>
                                      updateSubTask(
                                        epicIndex,
                                        storyIndex,
                                        taskIndex,
                                        subTaskIndex,
                                        "name",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Sub-task name"
                                  />
                                  <Button
                                    onClick={() =>
                                      deleteSubTask(
                                        epicIndex,
                                        storyIndex,
                                        taskIndex,
                                        subTaskIndex
                                      )
                                    }
                                    variant="outline"
                                    size="small"
                                    className={`mt-2 ${deleteButtonStyle}`}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </td>
                              {personnelTypes.map((type) => (
                                <td key={type} className="border px-4 py-2">
                                  <Input
                                    type="number"
                                    value={
                                      subTask.personnel
                                        .find((p) => p.type === type)
                                        ?.value.toString() || "0"
                                    }
                                    onChange={(e) =>
                                      updatePersonnel(
                                        "subtask",
                                        [
                                          epicIndex,
                                          storyIndex,
                                          taskIndex,
                                          subTaskIndex,
                                        ],
                                        type,
                                        Number(e.target.value)
                                      )
                                    }
                                  />
                                </td>
                              ))}
                              <td className="border px-4 py-2 font-bold text-right">
                                {calculateTotal(subTask.personnel)}
                              </td>
                              {(() => {
                                if (subTaskIndex === 0) {
                                  epicRendered = true;
                                  storyRendered = true;
                                }
                                return null;
                              })()}
                            </tr>
                          ));
                    });
              });
            })
          )}
        </tbody>
        {epics.length > 0 && (
          <tfoot>
            <tr className="bg-gray-100">
              <td
                colSpan={4 + personnelTypes.length}
                className="border px-4 py-2 text-right font-bold"
              >
                Grand Total:
              </td>
              <td className="border px-4 py-2 font-bold text-right">
                {calculateGrandTotal(epics)}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="mt-4">
        <Button onClick={addEpic} variant="primary">
          Add Epic
        </Button>
      </div>
    </div>
  );
};
