
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateVideo } from './services/geminiService';

const LOADING_MESSAGES = [
    "Warming up the AI director...",
    "Scouting virtual locations...",
    "Casting digital actors...",
    "Adjusting the lighting...",
    "Action! The AI is filming...",
    "Processing dailies...",
    "Editing the final cut...",
    "Adding special effects...",
    "Rendering the masterpiece...",
];

// --- Helper Icon Components (defined outside main component) ---

const VideoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M4.5 4.5a3 3 0 0 0-3 3v9a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-9a3 3 0 0 0-3-3h-15Zm-1.5 3a1.5 1.5 0 0 1 1.5-1.5h15a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5h-15a1.5 1.5 0 0 1-1.5-1.5v-9Zm4.5-1.5a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Zm-3 9a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Zm13.5-3a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Z" />
        <path d="M9 10.5a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0v-3Z" />
    </svg>
);

const LoadingIndicator: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex flex-col items-center justify-center text-center p-8">
        <svg className="animate-spin h-12 w-12 text-indigo-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-lg font-medium text-gray-300">{message}</p>
        <p className="text-sm text-gray-500 mt-2">Video generation can take several minutes. Please be patient.</p>
    </div>
);

// --- Main App Component ---

export default function App() {
    const [prompt, setPrompt] = useState<string>('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    
    const loadingMessageIntervalRef = useRef<number | null>(null);

    useEffect(() => {
        if (status === 'loading') {
            let messageIndex = 0;
            setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            loadingMessageIntervalRef.current = window.setInterval(() => {
                messageIndex = (messageIndex + 1) % LOADING_MESSAGES.length;
                setLoadingMessage(LOADING_MESSAGES[messageIndex]);
            }, 4000);
        } else if (loadingMessageIntervalRef.current) {
            clearInterval(loadingMessageIntervalRef.current);
            loadingMessageIntervalRef.current = null;
        }

        return () => {
            if (loadingMessageIntervalRef.current) {
                clearInterval(loadingMessageIntervalRef.current);
            }
        };
    }, [status]);
    
    useEffect(() => {
        if (imageFile) {
            const objectUrl = URL.createObjectURL(imageFile);
            setImagePreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        }
        setImagePreview(null);
    }, [imageFile]);


    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
    }

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            setErrorMessage("Please enter a prompt for your video.");
            setStatus('error');
            return;
        }

        setStatus('loading');
        setErrorMessage('');
        setVideoUrl(null);

        try {
            const onProgress = (message: string) => {
                console.log(`Progress: ${message}`);
                // You could update a more granular progress state here if desired
            };
            
            const url = await generateVideo({ prompt, imageFile, onProgress });
            setVideoUrl(url);
            setStatus('success');
        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "An unknown error occurred.";
            setErrorMessage(`Failed to generate video: ${message}`);
            setStatus('error');
        }
    }, [prompt, imageFile]);

    const handleReset = () => {
        setPrompt('');
        setImageFile(null);
        setImagePreview(null);
        setVideoUrl(null);
        setErrorMessage('');
        setStatus('idle');
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return <LoadingIndicator message={loadingMessage} />;
            case 'success':
                return (
                    <div className="w-full flex flex-col items-center">
                        <h2 className="text-2xl font-bold text-center text-gray-100 mb-4">Your Promo Video is Ready!</h2>
                        {videoUrl && (
                            <video src={videoUrl} controls autoPlay loop className="w-full max-w-2xl rounded-lg shadow-lg border border-gray-700">
                                Your browser does not support the video tag.
                            </video>
                        )}
                        <button
                            onClick={handleReset}
                            className="mt-8 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                        >
                            Create Another Video
                        </button>
                    </div>
                );
            case 'error':
                 return (
                    <div className="w-full flex flex-col items-center text-center p-8 bg-red-900/20 border border-red-700 rounded-lg">
                        <h2 className="text-2xl font-bold text-red-400 mb-2">Something Went Wrong</h2>
                        <p className="text-red-300 mb-6">{errorMessage}</p>
                        <button
                            onClick={status === 'error' ? () => setStatus('idle') : handleReset}
                            className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg shadow-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75 transition-transform transform hover:scale-105"
                        >
                            Try Again
                        </button>
                    </div>
                );
            case 'idle':
            default:
                return (
                    <form onSubmit={handleSubmit} className="w-full space-y-6">
                        <div>
                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-2">
                                1. Describe your promotional video
                            </label>
                            <textarea
                                id="prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="e.g., A cinematic shot of a new high-tech sneaker, with glowing neon lines, splashing through a puddle in a futuristic city at night."
                                className="w-full h-32 p-3 bg-gray-800 border border-gray-600 rounded-lg text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="image" className="block text-sm font-medium text-gray-300 mb-2">
                                2. (Optional) Add a starting image
                            </label>
                            {!imagePreview ? (
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                                    <div className="space-y-1 text-center">
                                        <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        <div className="flex text-sm text-gray-500">
                                            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500">
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/*" />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-600">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative group">
                                    <img src={imagePreview} alt="Image preview" className="w-full h-auto max-h-60 object-contain rounded-lg border border-gray-600" />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-60 rounded-full text-white hover:bg-opacity-80 transition-opacity opacity-0 group-hover:opacity-100"
                                        aria-label="Remove image"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* 
                          FIX: Removed the `disabled` property which caused a TypeScript error.
                          This component is only rendered when `status` is 'idle', so a check for the
                          'loading' state was redundant and incorrect. The button should always be
                          enabled when it is visible. The related `disabled:` styles were also removed.
                        */}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 transition-all duration-300 transform hover:scale-105"
                        >
                            Generate Video
                        </button>
                    </form>
                );
        }
    };
    

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <main className="w-full max-w-2xl mx-auto">
                <header className="text-center mb-8">
                    <div className="flex items-center justify-center gap-3">
                        <VideoIcon className="w-10 h-10 text-indigo-400" />
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                            Promo Video AI
                        </h1>
                    </div>
                    <p className="mt-3 text-lg text-gray-400">
                        Create stunning short promotional videos from a simple text prompt.
                    </p>
                </header>

                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl p-6 sm:p-8 transition-all duration-300">
                   {renderContent()}
                </div>

                <footer className="text-center mt-8">
                    <p className="text-sm text-gray-600">Powered by Gemini</p>
                </footer>
            </main>
        </div>
    );
}
