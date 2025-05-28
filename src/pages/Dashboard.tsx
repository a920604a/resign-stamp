// src/pages/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import type { User } from "firebase/auth";
import { db } from "../utils/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import StampGrid from "../components/StampGrid";
import type { Stamp } from "../components/StampGrid";
import { PDFDocument, rgb } from "pdf-lib";
import * as fontkit from "fontkit";
import DailyQuote from "../components/DailyQuote";
// import Achievements from "../components/Achievements";
import Toast from "../components/Toast";
import ProgressSection from "../components/ProgressSection";

const MAX_STAMPS = 100;

const ACHIEVEMENTS = [
  { count: Math.floor(MAX_STAMPS * 0.25), label: `達成 ${Math.floor(MAX_STAMPS * 0.25)} 個章`, color: "bg-yellow-400" },
  { count: Math.floor(MAX_STAMPS * 0.5), label: `達成 ${Math.floor(MAX_STAMPS * 0.5)} 個章`, color: "bg-green-400" },
  { count: Math.floor(MAX_STAMPS * 0.75), label: `達成 ${Math.floor(MAX_STAMPS * 0.75)} 個章`, color: "bg-blue-400" },
  { count: MAX_STAMPS, label: `達成 ${MAX_STAMPS} 個章`, color: "bg-purple-400" },
];


interface DashboardProps {
  user: User;
  logout: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ user, logout }) => {
  const [stamps, setStamps] = useState<Stamp[]>([]);
  const [loading, setLoading] = useState(true);
  const userDocRef = doc(db, "users", user.uid);

  const [unlockedAchievements, setUnlockedAchievements] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

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

  useEffect(() => {
    const currentCount = stamps.length;
    ACHIEVEMENTS.forEach(({ count, label }) => {
      if (
        currentCount >= count &&
        !unlockedAchievements.includes(count)
      ) {
        setUnlockedAchievements((prev) => [...prev, count]);
        setToast(`🎉 恭喜！${label} 🎉`);
        setTimeout(() => setToast(null), 3000);
      }
    });
  }, [stamps, unlockedAchievements]);

  const progress = Number(((stamps.length / MAX_STAMPS) * 100).toFixed(2));


  const generatePdf = async () => {
    const pdfDoc = await PDFDocument.create();

    pdfDoc.registerFontkit(fontkit);

    const page = pdfDoc.addPage([600, 750]);
    const { height } = page.getSize();

    const fontUrl = import.meta.env.BASE_URL + "fonts/NotoSansTC-Regular.ttf";
    const fontBytes = await fetch(fontUrl).then((res) => res.arrayBuffer());
    const customFont = await pdfDoc.embedFont(fontBytes);

    const fontSizeTitle = 24;
    const fontSizeContent = 14;
    const userName = user.displayName || "Anonymous";

    page.drawText("離職集章證明報告", {
      x: 50,
      y: height - 50,
      size: fontSizeTitle,
      font: customFont,
      color: rgb(0, 0.53, 0.24),
    });

    page.drawText(`姓名：${userName}`, {
      x: 50,
      y: height - 80,
      size: fontSizeContent,
      font: customFont,
    });

    page.drawText(`已收集章數：${stamps.length} / ${MAX_STAMPS}`, {
      x: 50,
      y: height - 110,
      size: fontSizeContent,
      font: customFont,
    });

    page.drawText("章節內容：", {
      x: 50,
      y: height - 140,
      size: fontSizeContent,
      font: customFont,
    });

    let yPosition = height - 170;
    stamps.forEach((stamp, idx) => {
      const text = `${idx + 1}. 編號 ${stamp.index}：${stamp.reason}`;
      page.drawText(text, {
        x: 60,
        y: yPosition,
        size: 12,
        font: customFont,
        color: rgb(0, 0, 0),
      });
      yPosition -= 20;
    });

    const pdfBytes = await pdfDoc.save();

    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "resignation_stamp_report.pdf";
    link.click();
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-600">
        Loading...
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto p-8 bg-white rounded-xl shadow-lg mt-12">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl font-extrabold text-green-700 tracking-wide">
          離職集章
        </h1>
        <button
          onClick={() => logout()}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
        >
          登出
        </button>
      </header>

      <DailyQuote />

      <ProgressSection progress={progress} onExport={generatePdf} />

      {/* 將 Achievements 顯示出來 */}
      {/* <Achievements achievements={ACHIEVEMENTS} unlocked={unlockedAchievements} /> */}


      <Toast message={toast} />

      <section className="border border-gray-300 rounded-lg p-6 shadow-sm bg-gray-50">
        <StampGrid stamps={stamps} maxStamps={MAX_STAMPS} onStampAdd={handleAddStamp} />
      </section>
      <Link
  to="/reasons"
  className="text-blue-600 underline hover:text-blue-800 transition"
>
  查看所有理由列表 →
</Link>
    </div>
  );
};

export default Dashboard;
