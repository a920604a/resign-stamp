// src/App.tsx
import { useEffect, useState } from "react";
import { auth, login, logout } from "./utils/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import Dashboard from "./pages/Dashboard";

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

  return <Dashboard user={user} logout={logout} />;
}

export default App;
