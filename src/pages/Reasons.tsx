import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import type { User } from "firebase/auth";
import type { Stamp } from "../components/StampGrid";

interface ReasonsProps {
  user: User;
}

const Reasons: React.FC<ReasonsProps> = ({ user }) => {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"index" | "timestamp">("timestamp");
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const userDocRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setStamps(data.stamps || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [user.uid]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("zh-TW");
  };

  const filteredStamps = stamps
    .filter((s) => s.reason.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) =>
      sortBy === "timestamp" ? a.timestamp - b.timestamp : a.index - b.index
    );

  const copyAllReasons = () => {
    const text = filteredStamps
      .map((s, i) => `第 ${s.index } 章 - ${formatDate(s.timestamp)}\n${s.reason}\n`)
      .join("\n");
    navigator.clipboard.writeText(text);
    alert("已複製所有理由！");
  };

  const downloadTxtFile = () => {
    const text = filteredStamps
      .map((s, i) => `第 ${s.index } 章 - ${formatDate(s.timestamp)}\n${s.reason}\n`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resignation_reasons.txt";
    link.click();
  };

  if (loading) {
    return <div className="p-8 text-gray-500">載入中...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md mt-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-3xl font-extrabold text-green-700 tracking-wide">
          🗒️ 蓋章理由總覽
        </h2>
        <button
          onClick={() => navigate(-1)}
          className="text-sm px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
        >
          ← 返回
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="搜尋理由..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "index" | "timestamp")}
          className="px-4 py-2 border rounded"
        >
          <option value="timestamp">依時間排序</option>
          <option value="index">依章號排序</option>
        </select>
        <button
          onClick={copyAllReasons}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          複製理由
        </button>
        <button
          onClick={downloadTxtFile}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          匯出文字檔
        </button>
      </div>

      {filteredStamps.length === 0 ? (
        <p className="text-gray-500">找不到符合條件的理由。</p>
      ) : (
        <ul className="space-y-4">
          {filteredStamps.map((stamp) => (
            <li key={stamp.timestamp} className="p-4 border border-gray-300 rounded bg-gray-50">
              <div className="font-semibold text-green-600">
                📌  第 {stamp.index} 章
              </div>
              <div className="mt-1 text-gray-800">{stamp.reason}</div>
              <div className="mt-1 text-sm text-orange-500">{formatDate(stamp.timestamp)}</div>

            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Reasons;
