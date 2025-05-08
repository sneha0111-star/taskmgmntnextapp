import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UserLayout from '@/components/UserLayout';


export default function Assignusertask() {
  const [userTasks, setUserTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [dueDateFilter, setDueDateFilter] = useState('');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [taskToUpdate, setTaskToUpdate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const router = useRouter();

  useEffect(() => {
    const member = JSON.parse(sessionStorage.getItem('user'));
    if (!member || !member.token) {
      router.push('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${member.token}` };

    const fetchData = async () => {
      try {
        const taskRes = await fetch('https://apinodetaskmgmnt.onrender.com/api/tasks/', { headers });
        const taskData = await taskRes.json();
        const allTasks = Array.isArray(taskData?.data) ? taskData.data : [];

        const tasksCreatedByUser = allTasks.filter(
          task => task.created_by === member.id && task.assigned_to !== member.id
        );

        const assignedUserIds = [...new Set(tasksCreatedByUser.map(task => task.assigned_to))];

        const userRes = await fetch('https://apinodetaskmgmnt.onrender.com/api/users/List', { headers });
        const userData = await userRes.json();
        const allUsers = Array.isArray(userData?.data) ? userData.data : [];

        const usersMap = {};
        allUsers.forEach(user => {
          usersMap[user._id || user.id] = user;
        });

        const grouped = assignedUserIds.map(userId => {
          const user = usersMap[userId];
          const tasks = tasksCreatedByUser.filter(task => task.assigned_to === userId);
          return { user, tasks };
        });

        setUserTasks(grouped);
        setFilteredTasks(grouped);
      } catch (err) {
        console.error('Error fetching assigned user tasks:', err);
      }
    };

    fetchData();
  }, [router]);

  useEffect(() => {
    const applyFilters = () => {
      const filtered = userTasks
        .map(({ user, tasks }) => {
          const filteredTasks = tasks.filter(task => {
            const matchesSearch =
              task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              task.description.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter ? task.status === statusFilter : true;
            const matchesPriority = priorityFilter ? task.priority === priorityFilter : true;
            const matchesDueDate = dueDateFilter
              ? new Date(task.due_date).toLocaleDateString('en-CA') === dueDateFilter
              : true;

            return matchesSearch && matchesStatus && matchesPriority && matchesDueDate;
          });

          return { user, tasks: filteredTasks };
        })
        .filter(group => group.tasks.length > 0);

      setFilteredTasks(filtered);
    };

    applyFilters();
  }, [searchQuery, statusFilter, priorityFilter, dueDateFilter, userTasks]);

  const handleDelete = async () => {
    const member = JSON.parse(sessionStorage.getItem('user'));
    const headers = { Authorization: `Bearer ${member.token}` };

    try {
      const response = await fetch(`https://apinodetaskmgmnt.onrender.com/api/tasks/${taskToDelete}`, {
        method: 'DELETE',
        headers,
      });

      if (response.ok) {
        setUserTasks(prev =>
          prev.map(({ user, tasks }) => ({
            user,
            tasks: tasks.filter(task => task._id !== taskToDelete),
          }))
        );
        setMessage({ type: 'success', text: 'Task deleted successfully!' });
      } else {
        setMessage({ type: 'danger', text: 'Failed to delete task.' });
      }

      setShowDeleteModal(false);
    } catch (err) {
      console.error('Error deleting task:', err);
      setMessage({ type: 'danger', text: 'Error deleting task.' });
      setShowDeleteModal(false);
    }
  };

  const handleUpdate = async () => {
    const member = JSON.parse(sessionStorage.getItem('user'));
    const headers = {
      Authorization: `Bearer ${member.token}`,
      'Content-Type': 'application/json',
    };

    const formattedDueDate = new Date(taskToUpdate.due_date).toLocaleDateString('en-US');

    try {
      const response = await fetch(`https://apinodetaskmgmnt.onrender.com/api/tasks/${taskToUpdate._id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ...taskToUpdate, due_date: formattedDueDate }),
      });

      if (response.ok) {
        setUserTasks(prev =>
          prev.map(({ user, tasks }) => ({
            user,
            tasks: tasks.map(task =>
              task._id === taskToUpdate._id ? { ...task, ...taskToUpdate, due_date: formattedDueDate } : task
            ),
          }))
        );
        setMessage({ type: 'success', text: 'Task updated successfully!' });
      } else {
        setMessage({ type: 'danger', text: 'Failed to update task.' });
      }

      setShowUpdateModal(false);
    } catch (err) {
      console.error('Error updating task:', err);
      setMessage({ type: 'danger', text: 'Error updating task.' });
      setShowUpdateModal(false);
    }
  };

  const statusOptions = ['todo', 'in_progress', 'done'];
  const priorityOptions = ['low', 'medium', 'high'];

  return (
    <UserLayout>
      <div className="container py-4">
        <h2 className="mb-4 text-center">Tasks Assigned by You</h2>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-4">
            <input
              type="text"
              placeholder="Search by title or description"
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-md-2 mt-2 mt-md-0">
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              {statusOptions.map(status => <option key={status}>{status}</option>)}
            </select>
          </div>
          <div className="col-md-2 mt-2 mt-md-0">
            <select className="form-control" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
              <option value="">All Priority</option>
              {priorityOptions.map(priority => <option key={priority}>{priority}</option>)}
            </select>
          </div>
          <div className="col-md-2 mt-2 mt-md-0">
            <input
              type="date"
              className="form-control"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
            />
          </div>
          <div className="col-md-1 mt-2 mt-md-0">
            <button className="btn btn-primary w-100" onClick={() => {
              setSearchQuery('');
              setStatusFilter('');
              setPriorityFilter('');
              setDueDateFilter('');
            }}>Reset</button>
          </div>
        </div>

        {/* Task Table */}
        {filteredTasks.length === 0 ? (
          <p className="text-center">No matching tasks found.</p>
        ) : (
          filteredTasks.map(({ user, tasks }) => (
            <div key={user._id} className="mb-5">
              <h5><strong>Assigned to:</strong> <span className="text-primary">{user.name}</span></h5>
              <div className="table-responsive">
                <table className="table table-bordered table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(task => (
                      <tr key={task._id}>
                        <td>{task.title}</td>
                        <td>{task.description}</td>
                        <td>{task.status}</td>
                        <td>{task.priority}</td>
                        <td>{new Date(task.due_date).toLocaleDateString()}</td>
                        <td>
                          <button className="btn btn-outline-primary btn-sm me-2" onClick={() => {
                            setTaskToUpdate(task);
                            setShowUpdateModal(true);
                          }}>
                           Edit
                          </button>
                          <button className="btn btn-outline-danger btn-sm" onClick={() => {
                            setTaskToDelete(task._id);
                            setShowDeleteModal(true);
                          }}>
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}

         {/* Update Task Modal */}
      <div className={`modal fade ${showUpdateModal ? 'show' : ''}`} tabIndex="-1" style={{ display: showUpdateModal ? 'block' : 'none' }} aria-labelledby="updateModalLabel" aria-hidden={!showUpdateModal}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="updateModalLabel">Update Task</h5>
              <button type="button" className="btn-close" onClick={() => setShowUpdateModal(false)}></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="title" className="form-label">Title</label>
                  <input
                    type="text"
                    className="form-control"
                    id="title"
                    value={taskToUpdate?.title || ''}
                    onChange={(e) => setTaskToUpdate({ ...taskToUpdate, title: e.target.value })}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="description" className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    id="description"
                    rows="3"
                    value={taskToUpdate?.description || ''}
                    onChange={(e) => setTaskToUpdate({ ...taskToUpdate, description: e.target.value })}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    className="form-control"
                    value={taskToUpdate?.status || ''}
                    onChange={(e) => setTaskToUpdate({ ...taskToUpdate, status: e.target.value })}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="priority" className="form-label">Priority</label>
                  <select
                    id="priority"
                    className="form-control"
                    value={taskToUpdate?.priority || ''}
                    onChange={(e) => setTaskToUpdate({ ...taskToUpdate, priority: e.target.value })}
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label htmlFor="due_date" className="form-label">Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    id="due_date"
                    value={
                      taskToUpdate?.due_date
                        ? new Date(taskToUpdate.due_date).toISOString().substring(0, 10)
                        : ''
                    }
                    onChange={(e) => setTaskToUpdate({ ...taskToUpdate, due_date: e.target.value })}
                  />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>Close</button>
              <button type="button" className="btn btn-primary" onClick={handleUpdate}>Save changes</button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal fade ${showDeleteModal ? 'show' : ''}`} tabIndex="-1" style={{ display: showDeleteModal ? 'block' : 'none' }} aria-labelledby="deleteModalLabel" aria-hidden={!showDeleteModal}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="deleteModalLabel">Delete Task</h5>
              <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete this task?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </UserLayout>
  );
}
