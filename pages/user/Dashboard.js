import React, { useState, useEffect } from "react";
import UserLayout from "@/components/UserLayout";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [assignedCount, setAssignedCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);
  const [overdueCount, setOverdueCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const memberRaw = sessionStorage.getItem("user");

    if (!memberRaw) {
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    let member;
    try {
      member = JSON.parse(memberRaw);
    } catch (err) {
      console.error("Failed to parse user from sessionStorage:", err);
      return;
    }

    const userId = member?.id;
    const token = member?.token;

    if (!token || !userId) {
      alert("Invalid user session. Please log in again.");
      router.push("/login");
      return;
    }

    fetch("https://apinodetaskmgmnt.onrender.com/api/tasks/", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.isSuccess || !Array.isArray(result.data)) {
          console.error("Unexpected API response:", result);
          return;
        }

        const tasks = result.data;
        const createdTasks = tasks.filter((task) => task.created_by === userId);
        setCreatedCount(createdTasks.length);

        const assignedToUsers = new Set(
          createdTasks.map((task) => task.assigned_to).filter((id) => id && id !== userId)
        );
        setAssignedCount(assignedToUsers.size);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const overdueTasks = tasks.filter((task) => {
          const due = new Date(task.due_date);
          due.setHours(0, 0, 0, 0);
          return due < today;
        });

        setOverdueCount(overdueTasks.length);
      })
      .catch((err) => {
        console.error("Error fetching tasks:", err);
      });
  }, []);

  return (
    <UserLayout>
      <div className="table-responsive">
        <table className="table table-bordered table-dark table-hover">
          <thead className="thead-light">
            <tr>
              <th>Metric</th>
              <th>Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tasks Assigned</td>
              <td>{assignedCount}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push("/user/assignusertask")}
                >
                  View Assigned
                </button>
              </td>
            </tr>
            <tr>
              <td>Tasks Created</td>
              <td>{createdCount}</td>
              <td>
                <button
                  className="btn btn-success btn-sm"
                  onClick={() => router.push("/user/alltask")}
                >
                  View Created
                </button>
              </td>
            </tr>
            <tr>
              <td>Overdue Tasks</td>
              <td>{overdueCount}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => router.push("/user/overduetasks")}
                >
                  View Overdue
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UserLayout>
  );
}
