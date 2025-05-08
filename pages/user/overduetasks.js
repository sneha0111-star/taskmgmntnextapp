import React, { useEffect, useState } from "react";
import UserLayout from "@/components/UserLayout";
import { useRouter } from "next/router";

export default function OverdueTasks() {
  const [tasks, setTasks] = useState([]);
  const [userMap, setUserMap] = useState({});
  const router = useRouter();

  useEffect(() => {
    const userRaw = sessionStorage.getItem("user");
    if (!userRaw) {
      alert("You must be logged in.");
      router.push("/login");
      return;
    }

    let user;
    try {
      user = JSON.parse(userRaw);
    } catch (err) {
      console.error("Invalid user data:", err);
      return;
    }

    const token = user?.token;

    if (!token) {
      alert("Invalid session. Please log in again.");
      router.push("/login");
      return;
    }

    // Fetch user list and build user ID -> name map
    fetch("https://apinodetaskmgmnt.onrender.com/api/users/List", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result.data)) {
          const map = {};
          result.data.forEach((user) => {
            map[user.id] = user.name;
          });
          setUserMap(map);
        } else {
          console.error("Invalid user list response:", result);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch users:", err);
      });

    // Fetch tasks
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdue = result.data.filter((task) => {
          const due = new Date(task.due_date);
          due.setHours(0, 0, 0, 0);
          return due < today;
        });

        setTasks(overdue);
      })
      .catch((err) => {
        console.error("Failed to fetch tasks:", err);
      });
  }, []);

  return (
    <UserLayout>
      <div className="container py-4">
        <h2 className="mb-4 text-center">Overdue Tasks</h2>

        {tasks.length === 0 ? (
          <p>No overdue tasks.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Title</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>{userMap[task.assigned_to] || "Unknown"}</td>
                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                    <td>{task.status}</td>
                    <td>{task.priority || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </UserLayout>
  );
}
