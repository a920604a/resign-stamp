import React, { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { db } from "../utils/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";
import StampGrid from "../components/StampGrid";
import type { Stamp } from "../components/StampGrid";
import ProgressBar from "@ramonak/react-progress-bar";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

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

  // Generate PDF report
  const generatePdf = async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 750]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSizeTitle = 24;
    const fontSizeContent = 14;

    page.drawText("Resignation Stamp Report", {
      x: 50,
      y: height - 50,
      size: fontSizeTitle,
      font,
      color: rgb(0, 0.53, 0.24),
    });

    page.drawText(`Stamps collected: ${stamps.length} / ${MAX_STAMPS}`, {
      x: 50,
      y: height - 90,
      size: fontSizeContent,
      font,
    });

    page.drawText("Stamp details:", {
      x: 50,
      y: height - 120,
      size: fontSizeContent,
      font,
      color: rgb(0.1, 0.1, 0.1),
    });

    let yPosition = height - 150;
    stamps.forEach((stamp, idx) => {
      const text = `${idx + 1}. Stamp index: ${stamp.index}, Reason: ${stamp.reason}`;
      page.drawText(text, {
        x: 60,
        y: yPosition,
        size: 12,
        font,
        color: rgb(0, 0, 0),
        maxWidth: 500,
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
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl font-extrabold text-green-700 tracking-wide">
          Resignation Stamp Collection
        </h1>
        <button
          onClick={() => logout()}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition"
        >
          Logout
        </button>
      </header>

      {/* Progress Bar Section */}
      <section className="mb-8 p-4 bg-green-50 rounded-md shadow-inner">
        <ProgressBar
          completed={progress}
          maxCompleted={100}
          bgColor="#4caf50"
          height="28px"
          labelAlignment="center"
          labelColor="#fff"
          baseBgColor="#d1fae5"
          isLabelVisible={true}
          className="rounded"
        />
      </section>

      {/* Export PDF Button */}
      <section className="mb-10 flex justify-end">
        <button
          onClick={generatePdf}
          className="px-5 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition shadow"
        >
          Export Report
        </button>
      </section>

      {/* Stamp Grid Section */}
      <section className="border border-gray-300 rounded-lg p-6 shadow-sm bg-gray-50">
        <StampGrid
          stamps={stamps}
          maxStamps={MAX_STAMPS}
          onStampAdd={handleAddStamp}
        />
      </section>
    </div>
  );
};

export default Dashboard;
