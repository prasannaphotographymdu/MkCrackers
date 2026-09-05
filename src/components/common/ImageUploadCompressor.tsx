import React, { useState, useRef } from 'react';
import { Camera, Upload, Link, X, Image as ImageIcon, CheckCircle2, RefreshCw, AlertCircle } from 'lucide-react';
import { compressImageToJPEG } from '../../lib/imageCompressor';

interface ImageUploadCompressorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  maxKb?: number;
  placeholder?: string;
}

export const ImageUploadCompressor: React.FC<ImageUploadCompressorProps> = ({
  value,
  onChange,
  label = 'Product / Category Image',
  maxKb = 50,
  placeholder = 'Upload, capture camera photo, or enter URL'
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressStats, setCompressStats] = useState<{ sizeKb: number; width: number; height: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Process file upload or captured blob through 50KB JPEG compression
  const processImageFile = async (file: File | Blob) => {
    setIsCompressing(true);
    setErrorMsg(null);
    try {
      const result = await compressImageToJPEG(file, maxKb);
      onChange(result.dataUrl);
      setCompressStats({
        sizeKb: result.sizeKb,
        width: result.width,
        height: result.height
      });
    } catch (err: any) {
      console.error('Image compression error:', err);
      setErrorMsg(err.message || 'Failed to compress image. Please try another file.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleCameraCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleApplyUrl = () => {
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setCompressStats(null);
    setUrlInput('');
  };

  // Live Camera Stream Handlers for Desktop/Webcam fallback
  const startLiveCamera = async () => {
    setErrorMsg(null);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live webcam fallback failed, using native file capture fallback:', err);
      setIsCameraActive(false);
      if (cameraInputRef.current) {
        cameraInputRef.current.click();
      }
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromStream = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          processImageFile(blob);
          stopLiveCamera();
        }
      }, 'image/jpeg', 0.9);
    }
  };

  const calculateStringKb = (str: string) => {
    if (!str) return 0;
    if (str.startsWith('data:image')) {
      const base64Str = str.split(',')[1] || '';
      return Math.round(((base64Str.length * 3) / 4 / 1024) * 10) / 10;
    }
    return null;
  };

  const currentSizeKb = compressStats?.sizeKb ?? calculateStringKb(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-slate-700">{label}</label>
        <span className="text-[10px] text-slate-500 font-mono">
          Max Target: <b className="text-red-700">{maxKb} KB JPEG</b>
        </span>
      </div>

      {/* Hidden Inputs for Native File Picker & Native Camera */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCaptureChange}
      />

      {/* Main Image Container */}
      {value ? (
        <div className="relative border border-slate-300 rounded-md p-2 bg-slate-50 flex items-center gap-3">
          <div className="w-16 h-16 rounded overflow-hidden bg-white border border-slate-200 shrink-0 relative group">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 truncate">
              <ImageIcon className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">{value.startsWith('data:image') ? 'Compressed JPEG Image' : 'External Image Link'}</span>
            </div>

            {currentSizeKb !== null ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {currentSizeKb} KB (Compressed ≤ {maxKb}KB)
                </span>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 truncate mt-0.5">{value}</p>
            )}

            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-slate-700 hover:text-red-600 font-bold flex items-center gap-1 underline"
              >
                <RefreshCw className="w-3 h-3" /> Change Photo
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setCompressStats(null);
                }}
                className="text-[10px] text-red-600 hover:text-red-800 font-bold flex items-center gap-1 underline"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : isCameraActive ? (
        /* Live Video Capture Screen */
        <div className="border-2 border-slate-800 rounded-md p-3 bg-slate-900 text-white flex flex-col items-center gap-2">
          <div className="relative w-full max-w-sm h-48 bg-black rounded overflow-hidden flex items-center justify-center">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              onClick={capturePhotoFromStream}
              className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Camera className="w-4 h-4" /> Snap & Compress Photo
            </button>
            <button
              type="button"
              onClick={stopLiveCamera}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Selector & Drag/Drop Box */
        <div className="space-y-2">
          {/* Action Tabs */}
          <div className="flex border-b border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1 border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Upload File
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('camera')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1 border-b-2 transition-colors ${
                activeTab === 'camera'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Camera Capture
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`px-3 py-1.5 font-bold flex items-center gap-1 border-b-2 transition-colors ${
                activeTab === 'url'
                  ? 'border-red-600 text-red-700 bg-red-50/50'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <Link className="w-3.5 h-3.5" /> Image URL
            </button>
          </div>

          {isCompressing ? (
            <div className="border border-dashed border-red-300 rounded-md p-4 bg-red-50 text-center space-y-2">
              <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-red-800">Compressing Image to ~50KB JPEG...</p>
              <p className="text-[10px] text-slate-500">Optimizing resolution & quality for fast Firestore loading</p>
            </div>
          ) : activeTab === 'upload' ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-md p-4 bg-slate-50 hover:bg-slate-100/80 transition-all cursor-pointer text-center space-y-1"
            >
              <Upload className="w-6 h-6 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Click to Select or Drag & Drop Image</div>
              <p className="text-[10px] text-slate-500">Supports JPG, PNG, WEBP (Auto-compresses to ~50KB JPEG)</p>
            </div>
          ) : activeTab === 'camera' ? (
            <div className="border border-slate-200 rounded-md p-3 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="text-center sm:text-left">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-center sm:justify-start gap-1">
                  <Camera className="w-4 h-4 text-red-600" /> Device Camera Capture
                </div>
                <p className="text-[10px] text-slate-500">Snap product photo directly from mobile camera or webcam</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shadow-sm flex items-center gap-1"
                >
                  <Camera className="w-3.5 h-3.5" /> Open Camera
                </button>
                <button
                  type="button"
                  onClick={startLiveCamera}
                  className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded"
                >
                  Live Stream
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="flex-1 px-2.5 py-1.5 text-xs rounded bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-red-500"
              />
              <button
                type="button"
                onClick={handleApplyUrl}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded shrink-0"
              >
                Apply URL
              </button>
            </div>
          )}
        </div>
      )}

      {errorMsg && (
        <div className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-red-700 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
