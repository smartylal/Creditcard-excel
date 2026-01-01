import React, { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DropZone } from './components/DropZone';
import { ProcessingState } from './components/ProcessingState';
import { ResultsTable } from './components/ResultsTable';
import { PasswordModal } from './components/PasswordModal';
import { parseBankStatement } from './services/geminiService';
import { isPdfEncrypted, decryptPdf } from './services/pdfService';
import { AppStatus, ExtractedData, ProcessingError } from './types';
import { AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  
  // Password Protection State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const processFile = async (file: File) => {
    try {
      setStatus(AppStatus.UPLOADING);
      setError(null);
      
      // Simulate a brief "upload" delay for UX feeling
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setStatus(AppStatus.PROCESSING);
      
      const transactions = await parseBankStatement(file);
      
      setData({
        fileName: file.name,
        transactions
      });
      setStatus(AppStatus.SUCCESS);
      
    } catch (err: any) {
      console.error(err);
      setStatus(AppStatus.ERROR);
      setError({
        title: "Conversion Failed",
        message: err.message || "An unexpected error occurred. Please ensure the PDF is a valid text-based bank statement."
      });
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      // 1. Check if file is encrypted
      const encrypted = await isPdfEncrypted(file);
      
      if (encrypted) {
        setPendingFile(file);
        setShowPasswordModal(true);
        setPasswordError(null);
        return;
      }
      
      // 2. If not encrypted, process immediately
      processFile(file);
      
    } catch (err: any) {
      console.error("Encryption check failed", err);
      // If check fails, try processing anyway (geminiService handles errors too)
      processFile(file);
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingFile) return;

    try {
      setPasswordError(null);
      // Attempt to decrypt
      const decryptedFile = await decryptPdf(pendingFile, password);
      
      // If successful: close modal, clear pending, and process the NEW file
      setShowPasswordModal(false);
      setPendingFile(null);
      processFile(decryptedFile);
      
    } catch (err: any) {
      setPasswordError("Incorrect password. Please try again.");
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordModal(false);
    setPendingFile(null);
    setPasswordError(null);
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setData(null);
    setError(null);
    setPendingFile(null);
    setShowPasswordModal(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC]">
      <Header />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Password Modal */}
        {showPasswordModal && pendingFile && (
          <PasswordModal 
            fileName={pendingFile.name}
            onSubmit={handlePasswordSubmit}
            onCancel={handlePasswordCancel}
            error={passwordError}
          />
        )}

        {/* Hero Section - Only show when IDLE or UPLOADING/PROCESSING */}
        {!data && (
          <div className="text-center mb-10 space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
              Convert Bank Statements <br className="hidden md:block"/> to <span className="text-blue-600">Excel</span> in Seconds
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">
              Stop manual data entry. Upload your PDF statement and let AI extract the data for you. 
              Private, secure, and fast.
            </p>
          </div>
        )}

        {/* Processing & Error Views */}
        <div className="max-w-3xl mx-auto">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-red-900">{error.title}</h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
                <button 
                  onClick={handleReset}
                  className="mt-2 text-sm font-medium text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {status !== AppStatus.SUCCESS && (
            <>
              {!error && status !== AppStatus.PROCESSING && status !== AppStatus.UPLOADING && (
                 <DropZone onFileSelect={handleFileSelect} status={status} />
              )}
              <ProcessingState status={status} />
            </>
          )}
        </div>

        {/* Results View */}
        {status === AppStatus.SUCCESS && data && (
          <ResultsTable data={data} onReset={handleReset} />
        )}

        {/* Feature Grid - Only show when IDLE */}
        {status === AppStatus.IDLE && (
           <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
             {[
               { title: "AI-Powered Parsing", desc: "No templates needed. Our AI understands diverse bank layouts automatically." },
               { title: "Bank-Grade Security", desc: "Files are processed in memory and never stored on our servers." },
               { title: "Instant Export", desc: "Get clean, formatted Excel or CSV files ready for QuickBooks or Xero." }
             ].map((feature, idx) => (
               <div key={idx} className="p-6 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                 <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                 <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
               </div>
             ))}
           </div>
        )}

      </main>

      <Footer />
    </div>
  );
};

export default App;