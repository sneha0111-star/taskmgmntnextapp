import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';


export default function CreateAndListTasks() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [form, setForm] = useState({
    project_id: '',
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    assigned_to: '',
  });
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');

  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js").then((module) => {
      window.bootstrap = module;
    });
  }, []);

  useEffect(() => {
    const member = JSON.parse(sessionStorage.getItem('user'));
    if (!member || !member.token) {
      router.push('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${member.token}` };

    const fetchData = async () => {
      try {
        const [projectRes, userRes, taskRes] = await Promise.all([
          fetch('https://apinodetaskmgmnt.onrender.com/api/projects/', { headers }),
          fetch('https://apinodetaskmgmnt.onrender.com/api/users/List', { headers }),
          fetch('https://apinodetaskmgmnt.onrender.com/api/tasks/', { headers }),
        ]);

        const projectData = await projectRes.json();
        const userData = await userRes.json();
        const taskData = await taskRes.json();

        const projectsList = Array.isArray(projectData?.data) ? projectData.data : [];
        const usersList = Array.isArray(userData?.data) ? userData.data : [];

        const projectsMap = {};
        const usersMap = {};
        projectsList.forEach(p => { projectsMap[p._id || p.id] = p.name });
        usersList.forEach(u => { usersMap[u._id || u.id] = u.name });

        const tasksWithNames = Array.isArray(taskData?.data) ? taskData.data
          .filter(task => task.assigned_to === member.id)
          .map(task => ({
            ...task,
            project_name: projectsMap[task.project_id] || 'Unknown',
            assigned_to_name: usersMap[task.assigned_to] || 'Unassigned',
          })) : [];

        setProjects(projectsList);
        setUsers(usersList);
        setTasks(tasksWithNames);

      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const member = JSON.parse(sessionStorage.getItem('user'));

    if (!member || !member.token || !member.id) {
      alert('You must be logged in to create a task.');
      router.push('/login');
      return;
    }

    const data = { ...form, created_by: member.id };

    try {
      const res = await fetch(
        editingTaskId
          ? `https://apinodetaskmgmnt.onrender.com/api/tasks/${editingTaskId}`
          : 'https://apinodetaskmgmnt.onrender.com/api/tasks/create',
        {
          method: editingTaskId ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${member.token}`,
          },
          body: JSON.stringify(data),
        }
      );

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || 'Failed to save task');

      setAlertMessage(editingTaskId ? 'Task updated successfully!' : 'Task created successfully!');
      setForm({
        project_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '',
      });
      setEditingTaskId(null);

      const modalElement = document.getElementById('taskModal');
      const modal = window.bootstrap?.Modal.getInstance(modalElement);
      modal?.hide();

      router.reload();
    } catch (error) {
      console.error('Task save failed:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const editTask = (task) => {
    setForm({
      project_id: task.project_id || '',
      title: task.title || '',
      description: task.description || '',
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      due_date: task.due_date ? task.due_date.substring(0, 10) : '',
      assigned_to: task.assigned_to || '',
    });
    setEditingTaskId(task._id);
    const modalElement = document.getElementById('taskModal');
    const modal = new window.bootstrap.Modal(modalElement);
    modal.show();
  };

  const handleDelete = async (taskId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this task?');
    if (!confirmDelete) return;

    const member = JSON.parse(sessionStorage.getItem('user'));
    if (!member || !member.token) {
      alert('You must be logged in.');
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`https://apinodetaskmgmnt.onrender.com/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${member.token}`,
        },
      });

      const result = await res.json().catch(() => null);
      if (!res.ok) throw new Error(result?.message || 'Failed to delete task');

      setAlertMessage('Task deleted successfully!');
      setTasks(tasks.filter((task) => task._id !== taskId));
    } catch (err) {
      console.error('Delete failed:', err);
      alert(`Error deleting task: ${err.message}`);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus ? task.status === filterStatus : true;
    const matchesPriority = filterPriority ? task.priority === filterPriority : true;
    const matchesDueDate = filterDueDate
      ? new Date(task.due_date).toLocaleDateString('en-US') === new Date(filterDueDate).toLocaleDateString('en-US')
      : true;
    return matchesSearch && matchesStatus && matchesPriority && matchesDueDate;
  });

  return (
    <UserLayout>
      <div className="container py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Tasks</h2>
          <button
            className="btn btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#taskModal"
            onClick={() => {
              setEditingTaskId(null);
              setForm({
                project_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '',
              });
            }}
          >
            Create New Task
          </button>
        </div>

        {alertMessage && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {alertMessage}
            <button type="button" className="btn-close" onClick={() => setAlertMessage('')}></button>
          </div>
        )}

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-3">
            <input
              type="text"
              className="form-control"
              placeholder="Search title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-md-2 mt-2 mt-md-0">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In-Progress</option>
              <option value="done">Done</option>
            </select>
          </div>
          <div className="col-md-2 mt-2 mt-md-0">
            <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-md-3 mt-2 mt-md-0">
            <input
              type="date"
              className="form-control"
              value={filterDueDate}
              onChange={(e) => setFilterDueDate(e.target.value)}
            />
          </div>
          <div className="col-md-1 mt-2 mt-md-0">
            <button
              className="btn btn-primary w-100"
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('');
                setFilterPriority('');
                setFilterDueDate('');
              }}
            >
            Reset
            </button>
          </div>
        </div>

        {/* Task Table */}
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-light">
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map((task) => (
                  <tr key={task._id}>
                    <td>{task.title}</td>
                    <td>{task.project_name}</td>
                    <td>{task.assigned_to_name}</td>
                    <td>{task.status}</td>
                    <td>{task.priority}</td>
                    <td>{new Date(task.due_date).toLocaleDateString()}</td>
                    <td>{task.description}</td>
                    <td>
                      <div className="d-flex gap-2">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => editTask(task)}>
                        Edit
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(task._id)}>
                        Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="text-center text-muted">
                   
                    No tasks available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal (same as before) */}
        <div className="modal fade" id="taskModal" tabIndex="-1" aria-labelledby="taskModalLabel" aria-hidden="true">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title" id="taskModalLabel">
                  {editingTaskId ? 'Edit Task' : 'Create New Task'}
                </h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Project</label>
                    <select className="form-select" name="project_id" value={form.project_id} onChange={handleChange} required>
                      <option value="">Select Project</option>
                      {projects.map(proj => (
                        <option key={proj._id || proj.id} value={proj._id || proj.id}>{proj.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Assign To</label>
                    <select className="form-select" name="assigned_to" value={form.assigned_to} onChange={handleChange} required>
                      <option value="">Select User</option>
                      {users.map(user => (
                        <option key={user._id || user.id} value={user._id || user.id}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <input className="form-control" type="text" name="title" value={form.title} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Due Date</label>
                    <input className="form-control" type="date" name="due_date" value={form.due_date} onChange={handleChange} required />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" value={form.description} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select className="form-select" name="status" value={form.status} onChange={handleChange}>
                      <option value="todo">Todo</option>
                      <option value="in_progress">In-Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Priority</label>
                    <select className="form-select" name="priority" value={form.priority} onChange={handleChange}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="submit" className="btn btn-success">
                    {editingTaskId ? 'Update Task' : 'Create Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
