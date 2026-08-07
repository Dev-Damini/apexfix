import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ProfilePicture({ user }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null); // 'camera' | 'upload'
  const [stream, setStream] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [uploading, setUploading] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileRef = useRef(null);

  const profilePic = user?.profile_picture;

  const startCamera = async () => {
    setMode('camera');
    setCaptured(null);
    const s = await navigator.mediaDevices.getUserMedia({ video: true });
    setStream(s);
    setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = s; }, 100);
  };

  const stopCamera = () => {
    stream?.getTracks().forEach(t => t.stop());
    setStream(null);
  };

  const capturePhoto = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    setCaptured(canvas.toDataURL('image/jpeg', 0.8));
    stopCamera();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setCaptured(ev.target.result);
    reader.readAsDataURL(file);
    setMode('upload');
  };

  const savePhoto = async () => {
    if (!captured) return;
    setUploading(true);
    // Convert base64 to blob
    const res = await fetch(captured);
    const blob = await res.blob();
    const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.auth.updateMe({ profile_picture: file_url });
    toast.success('Profile picture updated!');
    setUploading(false);
    setOpen(false);
    setCaptured(null);
    setMode(null);
    window.location.reload();
  };

  const handleClose = () => {
    stopCamera();
    setOpen(false);
    setCaptured(null);
    setMode(null);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} className="relative group flex-shrink-0">
        <div className="w-14 h-14 rounded-full border-2 border-primary overflow-hidden bg-secondary flex items-center justify-center">
          {profilePic
            ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            : <span className="text-2xl">😊</span>
          }
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
      </button>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading">Update Profile Picture</DialogTitle>
          </DialogHeader>
          <canvas ref={canvasRef} className="hidden" />

          {!mode && !captured && (
            <div className="space-y-3 pt-2">
              <div className="flex justify-center mb-4">
                <div className="w-20 h-20 rounded-full border-2 border-border overflow-hidden bg-secondary flex items-center justify-center">
                  {profilePic ? <img src={profilePic} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-4xl">😊</span>}
                </div>
              </div>
              <Button className="w-full bg-primary hover:bg-primary/90" onClick={startCamera}>
                <Camera className="w-4 h-4 mr-2" /> Take a Photo
              </Button>
              <Button variant="outline" className="w-full" onClick={() => fileRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" /> Upload from Gallery
              </Button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </div>
          )}

          {mode === 'camera' && !captured && (
            <div className="space-y-3">
              <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { stopCamera(); setMode(null); }}>
                  <X className="w-4 h-4 mr-1" /> Cancel
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={capturePhoto}>
                  <Camera className="w-4 h-4 mr-1" /> Capture
                </Button>
              </div>
            </div>
          )}

          {captured && (
            <div className="space-y-3">
              <img src={captured} alt="Preview" className="w-full rounded-xl object-cover" />
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setCaptured(null); setMode(null); }}>
                  <X className="w-4 h-4 mr-1" /> Retake
                </Button>
                <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={savePhoto} disabled={uploading}>
                  {uploading ? <span className="animate-spin mr-1">⏳</span> : <Check className="w-4 h-4 mr-1" />} Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}