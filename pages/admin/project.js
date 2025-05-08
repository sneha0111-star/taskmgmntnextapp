import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import AdminLayout from "@/components/AdminLayout";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Project() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });
  const [editingProject, setEditingProject] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then((module) => {
      window.bootstrap = module;
    });
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("user");
    if (!stored) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(stored);
    if (!parsed?.token) {
      router.push("/login");
    } else {
      setAdmin(parsed);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchProjects();
    }
  }, [admin]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("https://apinodetaskmgmnt.onrender.com/api/projects/", {
        headers: { Authorization: `Bearer ${admin.token}` },
      });
      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setProjects(result.data);
        sessionStorage.setItem("projectCount", result.data.length.toString());
      } else {
        setMessage("Failed to load projects.");
      }
    } catch {
      setMessage("Error fetching projects.");
    }
  };

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      created_by: admin.id,
    };

    try {
      const res = await fetch("https://apinodetaskmgmnt.onrender.com/api/projects/Create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setMessage("Project created successfully.");
        setFormData({ name: "", description: "", start_date: "", end_date: "" });
        document.getElementById("closeModal").click();
        fetchProjects();
      } else {
        setMessage(result.message || "Failed.");
      }
    } catch {
      setMessage("Network error.");
    }
  };

  const handleEditClick = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      start_date: project.start_date.split("T")[0],
      end_date: project.end_date.split("T")[0],
    });
    new bootstrap.Modal(document.getElementById("editProjectModal")).show();
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const payload = {
      ...formData,
      start_date: new Date(formData.start_date).toISOString(),
      end_date: new Date(formData.end_date).toISOString(),
      created_by: admin.id,
    };

    try {
      const res = await fetch(`https://apinodetaskmgmnt.onrender.com/projects/${editingProject._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${admin.token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setMessage("Project updated successfully.");
        setEditingProject(null);
        fetchProjects();
        setTimeout(() => {
          document.getElementById("closeEditModal").click();
        }, 100);
      } else {
        setMessage(result.message || "Update failed.");
      }
    } catch {
      setMessage("Network error during update.");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    try {
      const res = await fetch(`https://apinodetaskmgmnt.onrender.com/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${admin.token}` },
      });

      const result = await res.json();
      if (res.ok && result.isSuccess) {
        setMessage("Project deleted successfully.");
        fetchProjects();
      } else {
        setMessage(result.message || "Failed to delete.");
      }
    } catch {
      setMessage("Network error during deletion.");
    }
  };

  if (!admin) return null;

  return (
    <AdminLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between align-items-center">
          <h3>All Projects</h3>
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#projectModal"
            onClick={() => {
              setFormData({ name: "", description: "", start_date: "", end_date: "" });
              setEditingProject(null);
            }}
          >
            Create New Project
          </button>
        </div>

        {message && (
          <div className="alert alert-info alert-dismissible fade show mt-3" role="alert">
            {message}
            <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        {/* Projects Table */}
        <div className="table-responsive mt-4">
          {projects.length === 0 ? (
            <div className="alert alert-warning text-center">No projects found.</div>
          ) : (
            <table className="table table-striped table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Project Name</th>
                  <th>Description</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((proj, index) => (
                  <tr key={proj._id}>
                    <td>{index + 1}</td>
                    <td>{proj.name}</td>
                    <td>{proj.description}</td>
                    <td>{new Date(proj.start_date).toLocaleDateString()}</td>
                    <td>{new Date(proj.end_date).toLocaleDateString()}</td>
                    <td>{proj.created_by?.name || "N/A"}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => handleEditClick(proj)}>Edit</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(proj._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Create Modal */}
        <div className="modal fade" id="projectModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Add New Project</h5>
                <button type="button" className="btn-close" id="closeModal" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Project Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" name="end_date" value={formData.end_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-success">Create</button>
              </div>
            </form>
          </div>
        </div>

        {/* Edit Modal */}
        <div className="modal fade" id="editProjectModal" tabIndex="-1" aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <form className="modal-content" onSubmit={handleUpdateSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">Edit Project</h5>
                <button type="button" className="btn-close" id="closeEditModal" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Project Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea className="form-control" name="description" value={formData.description} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Start Date</label>
                  <input type="date" className="form-control" name="start_date" value={formData.start_date} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">End Date</label>
                  <input type="date" className="form-control" name="end_date" value={formData.end_date} onChange={handleChange} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" className="btn btn-primary">Update</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
