// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { User } from "firebase/auth";
import { db } from "../utils/firebase";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import StampGrid, { Stamp } from "../components/StampGrid";

interface DashboardProps {
  user: User;
  logout: () => Promise<void>;
}

const MAX_STAMPS = 100;

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);

  const userDocRef = doc(db, "users", user.uid);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStamps(data.stamps || []);
      } else {
        await setDoc(userDocRef, { stamps: [] });
      }
      setLoading(false);
    };
    fetchData();
  }, [user.uid]);

  const handleAddStamp = async (index: number, reason: string) => {
    const newStamp: Stamp = {
      index,
      reason,
      timestamp: Date.now(),
    };
    setStamps((prev) => [...prev, newStamp]);
    await updateDoc(userDocRef, {
      stamps: arrayUnion(newStamp),
    });
  };

  const progress = (stamps.length / MAX_STAMPS) * 100;

  if (loading) return <div>載入中...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">離職集章</h1>
        <button
          onClick={() => logout()}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          登出
        </button>
      </header>

      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded h-6">
          <div
            className="bg-green-500 h-6 rounded"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-right text-sm mt-1">
          {stamps.length} / {MAX_STAMPS} 個章位已蓋
        </p>
      </div>

      <StampGrid stamps={stamps} maxStamps={MAX_STAMPS} onStampAdd={handleAddStamp} />
    </div>
  );
};

export default Dashboard;
