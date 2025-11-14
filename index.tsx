import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';

const API_KEY = process.env.API_KEY;

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file as a data URL string.'));
        }
    };
    reader.onerror = error => reject(error);
});

// --- SVG Icons ---
const UploadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-purple-300 drop-shadow-[0_0_20px_rgba(138,43,226,0.35)] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
);
const FileIcon = ({ className = "h-6 w-6" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const ExtractedTextIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);
const DownloadIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" />
    </svg>
);
const CopyIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="9" y="9" width="11" height="11" rx="2" />
        <path d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1" />
    </svg>
);
const SparkleIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l1.8 4.6L18 8.4l-4.2 1.8L12 15l-1.8-4.8L6 8.4l4.2-1.8L12 2z" />
    </svg>
);
const CheckIcon = ({ className = "h-5 w-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);
const AiSummaryIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);
const Spinner = ({ size = 'h-5 w-5' }) => <div className={`animate-spin rounded-full border-t-2 border-b-2 border-white ${size}`}></div>;

// --- UI Components ---
const Background = () => (
    <div className="background-container">
        <div className="blob1"></div>
        <div className="blob2"></div>
        <div className="blob3"></div>
    </div>
);

const SkeletonLoader = () => (
    <div className="space-y-4 animate-pulse">
        <div className="h-4 w-3/4 rounded-md bg-white/10"></div>
        <div className="h-4 w-full rounded-md bg-white/10"></div>
        <div className="h-4 w-full rounded-md bg-white/10"></div>
        <div className="h-4 w-5/6 rounded-md bg-white/10"></div>
    </div>
);

const Toast = ({ message, onClose }) => (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-full shadow-lg z-50 backdrop-blur-sm border border-red-500/50">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 font-bold opacity-70 hover:opacity-100">X</button>
    </div>
);

const FileDropzone = ({ onFileUpload, isDisabled }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) onFileUpload(file);
    };
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = (e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        setIsDragActive(false);
        if (file) onFileUpload(file);
    };
    const handleDragEnter = (e) => { e.preventDefault(); setIsDragActive(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setIsDragActive(false); };
    return (
        <label
            htmlFor="file-upload"
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full max-w-xl sm:max-w-2xl h-56 sm:h-64 md:h-72 rounded-2xl cursor-pointer transition-all duration-300 group border-2 border-dashed
                ${isDragActive ? 'border-purple-400/60 shadow-[0_0_0_4px_rgba(168,85,247,0.15),0_10px_40px_rgba(168,85,247,0.25)]' : 'border-white/15 hover:border-white/25'}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                bg-white/5 backdrop-blur-xl ring-1 ring-white/10`}
        >
            <div className="flex flex-col items-center justify-center text-center p-4">
                <div className="transition-transform duration-300 group-hover:scale-110 animate-pulse">
                    <UploadIcon />
                </div>
                <p className="mt-4 text-base sm:text-lg text-white/90"><span className="font-semibold text-purple-300">Click to upload</span> or drag and drop</p>
                <p className="mt-1 text-xs sm:text-sm text-gray-400">PDF, PNG, JPG, or JPEG</p>
            </div>
            <input id="file-upload" type="file" className="hidden" accept="application/pdf, image/png, image/jpeg, image/jpg" onChange={handleFileChange} disabled={isDisabled} />
        </label>
    );
};

const Dropdown = ({ value, onChange, options, disabled, label }) => (
    <div className="w-full sm:w-auto">
        <label htmlFor="summary-length" className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
        <select
            id="summary-length"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full bg-black/40 border border-white/10 text-white rounded-lg p-2.5 focus:ring-purple-500 focus:border-purple-500 transition"
        >
            {options.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-gray-800 text-white">
                    {opt.label}
                </option>
            ))}
        </select>
    </div>
);


// Copy / Download Controls
function CopyDownloadControls({ summaryMarkdown, disabled }: { summaryMarkdown: string; disabled: boolean }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summaryMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (e) {}
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const blob = new Blob([summaryMarkdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'summary.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const baseBtn = 'h-10 w-10 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/90 hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(142,63,252,0.25)] hover:shadow-[0_0_18px_rgba(142,63,252,0.45)]';
  return (
    <div className="flex items-center gap-3">
      <button className={`${baseBtn}`} onClick={handleCopy} disabled={disabled} aria-label="Copy summary" title={copied ? 'Copied!' : 'Copy summary'}>
        {copied ? <CheckIcon className="h-5 w-5 text-emerald-400" /> : <CopyIcon className="h-5 w-5" />}
        <span className="sr-only">Copy</span>
      </button>
      <button className={`${baseBtn}`} onClick={handleDownload} disabled={disabled || downloading} aria-label="Download summary" title={downloading ? 'Downloading…' : 'Download summary'}>
        <DownloadIcon className="h-5 w-5" />
        <span className="sr-only">Download</span>
      </button>
    </div>
  );
}

// --- App ---
const App = () => {
    // State management
    const [file, setFile] = useState(null);
    const [extractedText, setExtractedText] = useState('');
    const [summaryHtml, setSummaryHtml] = useState('');
    const [summaryLength, setSummaryLength] = useState('');
    const [model, setModel] = useState('gemini-2.0-flash');
    const [isLoading, setIsLoading] = useState(false);
    const [isRegenerating, setIsRegenerating] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('summary');
    const [isTabLoading, setIsTabLoading] = useState(false);
    const [summaryMarkdown, setSummaryMarkdown] = useState('');

    const ai = useMemo(() => API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null, []);
    const PREFERRED_MODEL = 'gemini-2.0-flash';
    const FALLBACKS = ['gemini-1.5-flash', 'gemini-1.5-flash-8b'];

    const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));
    const withRetry = useCallback(async <T,>(fn: () => Promise<T>, attempts = 5, baseDelay = 1000): Promise<T> => {
        let lastErr: any;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (err: any) {
                lastErr = err;
                const code = err?.error?.code ?? err?.status ?? err?.code;
                const statusText = err?.error?.status ?? '';
                const isOverloaded = code === 503 || statusText === 'UNAVAILABLE';
                if (!isOverloaded || i === attempts - 1) break;
                const jitter = Math.random() * 200;
                await sleep(baseDelay * Math.pow(2, i) + jitter);
            }
        }
        throw lastErr;
    }, []);

    // Core logic
    const processDocument = useCallback(async (fileToProcess, length) => {
        if (!ai) {
            setError("API Key is not configured.");
            return { extractedText: null, summary: null };
        }
        try {
            const base64Data = await fileToBase64(fileToProcess);
            const wordCountMap = { short: '50-80', medium: '120-160', long: '250-300' };
            const wordCount = wordCountMap[length];

            const tryModel = async (modelName: string) => withRetry(() => ai.models.generateContent({
                model: modelName,
                contents: {
                    parts: [
                        { inlineData: { mimeType: fileToProcess.type, data: base64Data } },
                        { text: `
                            You are a document analysis expert.
                            1. First, meticulously extract all text from the provided document. Preserve formatting like paragraphs.
                            2. Then, based on the extracted text, generate a smart summary. The summary should be approximately ${wordCount} words.
                            3. Structure the summary using Markdown with the following format:
                               - A main title as a heading (e.g., "# Summary of [Document Topic]").
                               - A section "## Key Takeaways" with a bulleted list of the most important points.
                               - A section "## Detailed Explanation" with a concise paragraph.
                            4. Return a single, valid JSON object with two keys: "extractedText" and "summary". The "summary" value should be the Markdown string. Do not include any other text, markdown formatting, or code fences around the JSON.
                        `}
                    ]
                },
                config: { responseMimeType: "application/json", responseSchema: { type: "object", properties: { extractedText: { type: "string" }, summary: { type: "string" } }, required: ['extractedText', 'summary'] } }
            }));

            // Try selected model first, then known fallbacks
            const candidates = [model, PREFERRED_MODEL, ...FALLBACKS].filter((v, i, a) => !!v && a.indexOf(v) === i);
            let response;
            let lastErr;
            for (const m of candidates) {
                try {
                    response = await tryModel(m);
                    break;
                } catch (e: any) {
                    lastErr = e;
                    const code = e?.error?.code ?? e?.status ?? e?.code;
                    const statusText = e?.error?.status ?? '';
                    // If NOT_FOUND for this API version/model, continue to next candidate
                    if (code === 404 || statusText === 'NOT_FOUND') {
                        continue;
                    }
                    // If overloaded after retries, continue to next candidate
                    if (code === 503 || statusText === 'UNAVAILABLE') {
                        continue;
                    }
                    throw e;
                }
            }
            if (!response && lastErr) throw lastErr;

            const txt = typeof (response as any).text === 'function' ? await (response as any).text() : (response as any).text;
            const result = JSON.parse((txt ?? '').toString().trim());
            if (result?.summary) setSummaryMarkdown(result.summary);
            return result;
        } catch (err: any) {
            console.error(err);
            const code = err?.error?.code ?? err?.status ?? err?.code;
            const statusText = err?.error?.status ?? '';
            if (code === 503 || statusText === 'UNAVAILABLE') {
                setError('The model is temporarily overloaded. Please try again in a moment.');
            } else {
                setError('Failed to process the document. Please try again.');
            }
            return { extractedText: null, summary: null };
        }
    }, [ai]);
    
    const generateSummaryOnly = useCallback(async (text, length) => {
        if (!ai || !text) return null;
        setIsRegenerating(true);
        setError(null);
        try {
            const wordCountMap = { short: '50-80', medium: '120-160', long: '250-300' };
            const wordCount = wordCountMap[length];
            const tryModel = (modelName: string) => withRetry(() => ai.models.generateContent({
                model: modelName,
                contents: {
                    parts: [
                        { text: `Based on the following text, generate a smart summary of approximately ${wordCount} words. Structure it using Markdown with a main title, "## Key Takeaways" with bullets, and a "## Detailed Explanation" paragraph.` },
                        { text: `\n\nTEXT: "${text}"` }
                    ]
                }
            }));
            const candidates = [model, PREFERRED_MODEL, ...FALLBACKS].filter((v, i, a) => !!v && a.indexOf(v) === i);
            let response;
            let lastErr;
            for (const m of candidates) {
                try {
                    response = await tryModel(m);
                    break;
                } catch (e: any) {
                    lastErr = e;
                    const code = e?.error?.code ?? e?.status ?? e?.code;
                    const statusText = e?.error?.status ?? '';
                    if (code === 404 || statusText === 'NOT_FOUND') continue;
                    if (code === 503 || statusText === 'UNAVAILABLE') continue;
                    throw e;
                }
            }
            if (!response && lastErr) throw lastErr;
            const txt = typeof (response as any).text === 'function' ? await (response as any).text() : (response as any).text;
            setSummaryMarkdown((txt ?? '').toString());
            const html = await marked.parse((txt ?? '').toString());
            setSummaryHtml(html);
        } catch (err: any) {
            console.error(err);
            const code = err?.error?.code ?? err?.status ?? err?.code;
            const statusText = err?.error?.status ?? '';
            if (code === 503 || statusText === 'UNAVAILABLE') {
                setError('The model is temporarily overloaded. Please try again in a moment.');
            } else {
                setError('Failed to regenerate summary.');
            }
        } finally {
            setIsRegenerating(false);
        }
    }, [ai]);

    // Event Handlers
    const handleFileUpload = useCallback(async (selectedFile) => {
        const validTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!validTypes.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload a PDF, PNG, or JPG file.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setFile(selectedFile);
        setActiveTab('summary');
        setSummaryLength(''); // no default selection

        // Extract content only; ignore auto-summary to let user choose length first
        const { extractedText, summary } = await processDocument(selectedFile, 'medium');
        setExtractedText(extractedText || '');
        setSummaryHtml('');

        setIsLoading(false);
    }, [processDocument]);

    const handleGenerateSummary = useCallback(() => {
        if (!extractedText) {
            setError("Cannot generate summary without extracted text.");
            return;
        }
        generateSummaryOnly(extractedText, summaryLength);
    }, [extractedText, summaryLength, generateSummaryOnly]);

    const handleTabChange = (tab) => {
        setIsTabLoading(true);
        setActiveTab(tab);
        setTimeout(() => setIsTabLoading(false), 300);
    }

    const resetApp = () => {
        setFile(null);
        setExtractedText('');
        setSummaryHtml('');
        setError(null);
    };

    // Render logic
    const renderInitialView = () => (
        <>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight text-center">
                <span className="gradient-text bg-clip-text text-transparent">Document Summary Assistant</span>
            </h1>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto text-center mt-4 mb-10">
                Upload a PDF or image, and let AI summarize it for you.
            </p>
            <FileDropzone onFileUpload={handleFileUpload} isDisabled={isLoading} />
        </>
    );

    const renderLoadingView = () => (
        <div className="w-full max-w-md p-10 bg-white/5 backdrop-blur-2xl rounded-2xl flex flex-col items-center justify-center space-y-4 ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <Spinner size="h-10 w-10" />
            <p className="text-white/90 text-lg font-medium">Analyzing your document...</p>
            <p className="text-gray-400 text-sm">This may take a moment.</p>
        </div>
    );
    
    const renderResultsView = () => (
      <div className="w-full max-w-4xl bg-white/5 backdrop-blur-2xl rounded-2xl p-4 sm:p-6 lg:p-8 flex flex-col h-[80vh] md:h-[85vh] min-h-[540px] md:min-h-[650px] ring-1 ring-white/10 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
        {/* File Info Header */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-black/20 rounded-xl border border-white/10 mb-6">
            <div className="flex items-center gap-3 w-full">
                <FileIcon className="h-6 w-6 text-purple-400" />
                <span className="text-white font-medium truncate">{file?.name}</span>
            </div>
            <button 
                onClick={resetApp} 
                className="text-sm font-medium text-purple-300 border border-purple-400/50 rounded-lg px-4 py-1.5 hover:bg-purple-300/10 transition-colors shadow-[0_0_20px_rgba(168,85,247,0.25)] self-end sm:self-auto">
                Upload New File
            </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-white/10 mb-4">
            <button onClick={() => handleTabChange('summary')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'summary' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}>
                <AiSummaryIcon /> AI Summary
            </button>
            <button onClick={() => handleTabChange('extractedText')} className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'extractedText' ? 'text-white border-b-2 border-purple-500' : 'text-gray-400 hover:text-white'}`}>
                <ExtractedTextIcon /> Extracted Text
            </button>
        </div>

        {/* Summary Length Control */}
        {activeTab === 'summary' && (
            <div className="flex-shrink-0 mb-4 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4 lg:flex-wrap">
                 <Dropdown
                    label="Select summary length"
                    value={summaryLength}
                    onChange={setSummaryLength}
                    disabled={isRegenerating}
                    options={[
                        { label: 'Select length', value: '' },
                        { label: 'Short', value: 'short' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'Long', value: 'long' }
                    ]}
                />
                <button
                    onClick={handleGenerateSummary}
                    disabled={isRegenerating || !summaryLength || !extractedText}
                    className="w-full sm:w-auto gradient-button text-white font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_35px_rgba(99,102,241,0.55)]"
                >
                    {isRegenerating ? (
                        <>
                            <Spinner size="h-5 w-5 mr-2" />
                            <span>Generating...</span>
                        </>
                    ) : (
                        <>
                          <SparkleIcon />
                          <span>Summarize</span>
                        </>
                    )}
                </button>
                <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                    <CopyDownloadControls summaryMarkdown={summaryMarkdown} disabled={isRegenerating || !summaryMarkdown} />
                </div>
            </div>
        )}

        {/* Content */}
        <div className="flex-grow overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
            {isTabLoading ? <SkeletonLoader /> : (
                activeTab === 'summary' ? (
                    isRegenerating ? (
                        <SkeletonLoader />
                    ) : (
                        summaryLength ? (
                            <div className="prose-styling text-gray-300 leading-7" dangerouslySetInnerHTML={{ __html: summaryHtml }} />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <div className="text-center bg-white/5 rounded-xl px-6 py-8 ring-1 ring-white/10 max-w-md w-full">
                                    <div className="mx-auto mb-3 h-10 w-10 flex items-center justify-center rounded-full bg-purple-500/15 text-purple-300">
                                        <SparkleIcon className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-white font-semibold">Select a summary length</h3>
                                    <p className="text-gray-400 text-sm mt-1">Choose Short, Medium, or Long, then press Summarize to generate the AI summary.</p>
                                </div>
                            </div>
                        )
                    )
                ) : (
                    <pre className="text-gray-300 whitespace-pre-wrap text-sm font-sans">{extractedText || 'No text extracted.'}</pre>
                )
            )}
        </div>
      </div>
    );

    return (
        <>
            <Background />
            <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 md:p-10 lg:p-16 overflow-hidden z-10">
                {error && <Toast message={error} onClose={() => setError(null)} />}
                <div className="w-full max-w-7xl flex flex-col items-center">
                    {isLoading ? renderLoadingView() : (file ? renderResultsView() : renderInitialView())}
                </div>
            </main>
            <footer className="fixed bottom-4 text-center text-gray-500 text-sm z-10 w-full">
              <p> 2025 Document Summary Assistant. All rights reserved.</p>
            </footer>
        </>
    );
};

const container = document.getElementById('root')!;
const root = ReactDOM.createRoot(container);
root.render(<App />);