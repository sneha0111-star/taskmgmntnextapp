import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout";
import { useRouter } from "next/router";

export default function Dashboard() {
  const [projectCount, setProjectCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchCounts = async () => {
      const stored = sessionStorage.getItem("user");
      if (!stored) return;
      const parsed = JSON.parse(stored);

      const headers = {
        Authorization: `Bearer ${parsed.token}`,
      };

      try {
        const [projectRes, userRes, taskRes] = await Promise.all([
          fetch("https://apinodetaskmgmnt.onrender.com/api/projects/", { headers }),
          fetch("https://apinodetaskmgmnt.onrender.com/api/users/List", { headers }),
          fetch("https://apinodetaskmgmnt.onrender.com/api/tasks/", { headers }),
        ]);

        const projectData = await projectRes.json();
        const userData = await userRes.json();
        const taskData = await taskRes.json();

        if (projectRes.ok && projectData?.isSuccess) {
          setProjectCount(projectData.data.length || 0);
        }

        if (userRes.ok && userData?.isSuccess) {
          setUserCount(userData.data.length || 0);
        }

        if (taskRes.ok && taskData?.isSuccess) {
          setTaskCount(taskData.data.length || 0);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      }
    };

    fetchCounts();
  }, []);

  return (
    <AdminLayout>
      <div className="table-responsive">
        <table className="table table-bordered table-striped table-hover">
          <thead className="thead-dark">
            <tr>
              <th>Metric</th>
              <th>Count</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Total Projects</td>
              <td>{projectCount}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push("/admin/project")}
                >
                  View Projects
                </button>
              </td>
            </tr>
            <tr>
              <td>Total Users</td>
              <td>0</td>
              <td>
               
              </td>
            </tr>
            <tr>
              <td>Total Tasks</td>
              <td>0</td>
              <td>
                
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
