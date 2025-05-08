import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  MdDashboard,
  MdWork,
  MdAssignment,
  MdAccountCircle
} from 'react-icons/md';

export default function AdminLayout({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = sessionStorage.getItem('user');
    if (!storedUser) {
      router.push('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    if (!parsedUser.token) {
      router.push('/login');
    } else {
      setUser(parsedUser);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div className="container-fluid">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-dark px-4">
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <a className="nav-link text-white" href="/admin/Dashboard">
                <MdDashboard className="me-1" /> Dashboard
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link text-white" href="/admin/project">
                <MdWork className="me-1" /> Projects
              </a>
            </li>
           
          </ul>
        </div>
      </nav>

      {/* Welcome and Logout */}
      <div className="d-flex justify-content-between align-items-center px-4 py-3 border-bottom">
        <h4 className="mb-0">Welcome! {user.name} (Admin)</h4>
        <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
      </div>

      {/* Main Content */}
      <main className="p-4">
        {children}
      </main>
    </div>
  );
}
