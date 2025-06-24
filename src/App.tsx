// src/App.tsx
import { useEffect, useState } from "react";
import { HashRouter  as Router, Routes, Route, Navigate } from "react-router-dom";
import { auth, login, logout } from "./utils/firebase";
import { onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import Dashboard from "./pages/Dashboard";
import Reasons from "./pages/Reasons";  // 新增理由列表頁

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => setUser(user));
    return () => unsub();
  }, []);

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={login}
        >
          使用 Google 登入
        </button>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* <Route path="/" element={<Dashboard user={user} logout={logout} />} /> */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Dashboard 路由 */}
        <Route path="/dashboard" element={<Dashboard user={user} logout={logout} />} />

        <Route path="/reasons" element={<Reasons user={user} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
