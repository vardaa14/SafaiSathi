import { useState, useRef } from 'react';
import {
  MapPin,
  Trash2,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Crosshair,
  User,
  Phone,
  Scale,
  FileText,
  X,
  Sparkles
} from 'lucide-react';
import type { PickupRequest, RequestPriority, WasteType } from '../../types/request';
import { LOCATIONS } from '../../data/locations';

interface RequestFormProps {
  onSubmitSuccess: (newRequest: PickupRequest) => void;
}

const MUMBAI_PRESETS = [
  { key: 'LOC_ANDHERI_W', label: 'Andheri West Market' },
  { key: 'LOC_BANDRA_LINKING', label: 'Bandra Linking Road' },
  { key: 'LOC_BKC_GBURN', label: 'BKC Financial Center' },
  { key: 'LOC_KURLA_LBS', label: 'Kurla West LBS Marg' },
  { key: 'LOC_POWAI_HIRANANDANI', label: 'Powai Hiranandani' },
  { key: 'LOC_DADAR_FLOWER', label: 'Dadar Flower Market' },
  { key: 'LOC_GOREGAON_LINK', label: 'Goregaon West Link Rd' },
  { key: 'LOC_BORIVALI_SHIMPOLI', label: 'Borivali West' },
  { key: 'LOC_LOWERPAREL_MILLS', label: 'Lower Parel Phoenix' }
];

export const RequestForm: React.FC<RequestFormProps> = ({ onSubmitSuccess }) => {
  // Form State
  const [citizenName, setCitizenName] = useState('');
  const [citizenPhone, setCitizenPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedZone, setSelectedZone] = useState('Zone 1 - Central Hub');
  const [latitude, setLatitude] = useState<number>(19.0657);
  const [longitude, setLongitude] = useState<number>(72.8687);
  const [wasteType, setWasteType] = useState<WasteType>('MIXED_MUNICIPAL');
  const [quantityKg, setQuantityKg] = useState<number>(50);
  const [priority, setPriority] = useState<RequestPriority>('MEDIUM');
  const [description, setDescription] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Preset Location Selection
  const handlePresetSelect = (locationKey: string) => {
    const loc = LOCATIONS[locationKey];
    if (loc) {
      setAddress(loc.address || loc.name);
      setSelectedZone(loc.zone);
      setLatitude(loc.latitude);
      setLongitude(loc.longitude);
    }
  };

  // "Use My Location" geolocation trigger
  const handleUseMyLocation = () => {
    setIsLocating(true);
    setFormError(null);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          setAddress(`Current GPS Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}), Mumbai`);
          setIsLocating(false);
        },
        () => {
          // Graceful fallback to default Mumbai central spot
          const defaultLoc = LOCATIONS['LOC_BKC_GBURN'];
          setLatitude(defaultLoc.latitude);
          setLongitude(defaultLoc.longitude);
          setAddress(defaultLoc.address || 'BKC, Mumbai (Simulated GPS)');
          setIsLocating(false);
        },
        { timeout: 5000 }
      );
    } else {
      const defaultLoc = LOCATIONS['LOC_BKC_GBURN'];
      setLatitude(defaultLoc.latitude);
      setLongitude(defaultLoc.longitude);
      setAddress(defaultLoc.address || 'BKC, Mumbai');
      setIsLocating(false);
    }
  };

  // Handle Image Upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick Sample Photo loader for demo ease
  const handleLoadSamplePhoto = () => {
    // Generate a simple SVG canvas placeholder image URL
    const svgData = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
      <rect width="400" height="300" fill="#1e293b"/>
      <circle cx="200" cy="150" r="50" fill="#3b82f6" opacity="0.3"/>
      <text x="200" y="140" font-family="sans-serif" font-size="20" fill="#38bdf8" text-anchor="middle" font-weight="bold">Waste Pickup Inspection</text>
      <text x="200" y="175" font-family="sans-serif" font-size="14" fill="#94a3b8" text-anchor="middle">Geo-tagged Citizen Upload</text>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgData)}`;
    setImagePreview(dataUrl);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!citizenName.trim()) {
      setFormError('Please provide your name.');
      return;
    }
    if (!citizenPhone.trim()) {
      setFormError('Please provide your contact phone number.');
      return;
    }
    if (!address.trim()) {
      setFormError('Please select or specify a collection location.');
      return;
    }

    setFormError(null);

    // Generate unique Request ID like: SS-2026-1043
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const requestId = `SS-2026-${randomNum}`;

    // Map priority to priorityScore & urgency
    const priorityScoreMap = {
      LOW: 40,
      MEDIUM: 65,
      HIGH: 85,
      CRITICAL: 98
    };

    const urgencyMap = {
      LOW: 4,
      MEDIUM: 6,
      HIGH: 8,
      CRITICAL: 10
    };

    const newRequest: PickupRequest = {
      id: requestId,
      name: `${wasteType.replace('_', ' ')} Pickup - ${citizenName}`,
      locationId: `LOC_CITIZEN_${randomNum}`,
      latitude,
      longitude,
      zone: selectedZone,
      wasteType,
      quantityKg,
      priority,
      priorityScore: priorityScoreMap[priority] || 60,
      urgency: urgencyMap[priority] || 6,
      waitingTime: 0,
      status: 'PENDING_ADMIN',
      assignedVehicleId: null,
      createdAt: new Date().toISOString(),
      address: address.trim(),
      isBin: false,
      citizenName: citizenName.trim(),
      citizenPhone: citizenPhone.trim(),
      description: description.trim(),
      imageUrl: imagePreview || undefined
    };

    onSubmitSuccess(newRequest);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 text-left"
    >
      {/* Form Header */}
      <div className="pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              Report & Schedule Waste Pickup
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Request immediate or scheduled municipal collection for garbage heaps or bulk waste.
            </p>
          </div>
        </div>
      </div>

      {formError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* 1. Citizen Personal Information */}
      <div className="space-y-3">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          1. Citizen Details
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Your Full Name *</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. Aarav Mehta"
                value={citizenName}
                onChange={e => setCitizenName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Phone Number *</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                required
                placeholder="e.g. +91 98201 55432"
                value={citizenPhone}
                onChange={e => setCitizenPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Location & Address */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            2. Pickup Location & Area
          </label>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
            <span>{isLocating ? 'Locating...' : 'Use My Location'}</span>
          </button>
        </div>

        {/* Preset quick chips */}
        <div>
          <span className="text-[10px] text-slate-500 block mb-1.5 font-medium">
            Quick Mumbai Area Selectors:
          </span>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
            {MUMBAI_PRESETS.map(preset => (
              <button
                key={preset.key}
                type="button"
                onClick={() => handlePresetSelect(preset.key)}
                className="text-[11px] bg-slate-800/80 hover:bg-slate-750 hover:border-slate-600 text-slate-300 border border-slate-700/60 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                📍 {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Street Address / Landmark *</label>
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              required
              placeholder="e.g. Linking Road, Near Patwardhan Park, Bandra West"
              value={address}
              onChange={e => setAddress(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
            />
          </div>
        </div>
      </div>

      {/* 3. Waste Classification & Estimated Quantity */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          3. Waste Category & Estimated Volume
        </label>

        {/* Waste Type Radios */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {(
            [
              { type: 'MIXED_MUNICIPAL', label: 'Mixed Household', icon: '🗑️' },
              { type: 'ORGANIC', label: 'Organic / Wet Bio', icon: '🥬' },
              { type: 'RECYCLABLE', label: 'Dry Recyclables', icon: '📦' },
              { type: 'HAZARDOUS', label: 'Hazardous / E-Waste', icon: '⚠️' },
              { type: 'CONSTRUCTION', label: 'Construction Debris', icon: '🧱' }
            ] as const
          ).map(item => (
            <button
              key={item.type}
              type="button"
              onClick={() => setWasteType(item.type)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                wasteType === item.type
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50 shadow-md'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-base mb-1">{item.icon}</div>
              <div className="font-bold text-xs text-white">{item.label}</div>
            </button>
          ))}
        </div>

        {/* Quantity in kg */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-sky-400" />
              Estimated Quantity (kg):
            </label>
            <span className="font-bold text-sm text-white font-mono">{quantityKg} kg</span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={quantityKg}
              onChange={e => setQuantityKg(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
            />
          </div>

          {/* Quick Quantity Chips */}
          <div className="flex gap-2 mt-2">
            {[25, 50, 100, 250, 500].map(kg => (
              <button
                key={kg}
                type="button"
                onClick={() => setQuantityKg(kg)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border font-mono transition-colors cursor-pointer ${
                  quantityKg === kg
                    ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 font-bold'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                }`}
              >
                {kg} kg
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Priority Level */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
          4. Urgency & Priority Level
        </label>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setPriority('LOW')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              priority === 'LOW'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-1 ring-emerald-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mx-auto mb-1" />
            <div className="font-bold text-xs text-white">Normal</div>
            <div className="text-[10px] text-slate-400">Regular 24-48h</div>
          </button>

          <button
            type="button"
            onClick={() => setPriority('HIGH')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              priority === 'HIGH'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mx-auto mb-1" />
            <div className="font-bold text-xs text-white">Urgent</div>
            <div className="text-[10px] text-slate-400">Within 6-12h</div>
          </button>

          <button
            type="button"
            onClick={() => setPriority('CRITICAL')}
            className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
              priority === 'CRITICAL'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-1 ring-rose-500/50'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mx-auto mb-1 animate-ping" />
            <div className="font-bold text-xs text-white">Critical</div>
            <div className="text-[10px] text-slate-400">Immediate Spill</div>
          </button>
        </div>
      </div>

      {/* 5. Garbage Photo Upload & Preview */}
      <div className="space-y-3 pt-2 border-t border-slate-800/80">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
            5. Waste Photo Upload (Optional)
          </label>
          <button
            type="button"
            onClick={handleLoadSamplePhoto}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium cursor-pointer"
          >
            <Sparkles className="w-3 h-3" />
            <span>Use Sample Photo</span>
          </button>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className="hidden"
        />

        {imagePreview ? (
          <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 max-w-sm mx-auto">
            <img
              src={imagePreview}
              alt="Uploaded Garbage Preview"
              className="w-full h-44 object-cover"
            />
            <button
              type="button"
              onClick={() => setImagePreview(null)}
              className="absolute top-2 right-2 bg-slate-950/80 hover:bg-rose-600 text-white p-1.5 rounded-full transition-colors cursor-pointer shadow-lg"
              title="Remove image"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center bg-slate-950/40 hover:bg-slate-950/80 transition-all cursor-pointer"
          >
            <UploadCloud className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <span className="text-xs text-slate-300 font-semibold block">
              Click to upload photo of waste accumulation
            </span>
            <span className="text-[10px] text-slate-500 mt-1 block">
              PNG, JPG, or WebP up to 5MB
            </span>
          </div>
        )}
      </div>

      {/* 6. Additional Description */}
      <div className="space-y-2 pt-2 border-t border-slate-800/80">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          6. Additional Description or Landmarks
        </label>
        <textarea
          rows={3}
          placeholder="e.g. Garbage bins overflowing behind commercial complex, blocking alleyway gate..."
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="w-full p-3 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-xs text-white placeholder:text-slate-600 outline-none transition-colors"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-3">
        <button
          type="submit"
          className="w-full py-3.5 px-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>SUBMIT PICKUP REQUEST</span>
        </button>
      </div>
    </form>
  );
};
