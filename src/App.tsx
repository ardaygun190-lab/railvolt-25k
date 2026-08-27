import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Battery, 
  AlertTriangle, 
  Play, 
  Pause, 
  RotateCcw, 
  Gauge, 
  Activity, 
  Clock, 
  ShieldCheck, 
  Train, 
  MapPin, 
  PowerOff, 
  Navigation,
  FastForward,
  LocateFixed
} from 'lucide-react';

interface Station {
  name: string;
  km: number;
  hasSubstation?: boolean;
  isRamp?: boolean;
}

interface YHTRoute {
  id: string;
  name: string;
  totalKm: number;
  stations: Station[];
  bessKm: number;
  description: string;
}

interface TrainSet {
  id: string;
  name: string;
  model: string;
  maxPowerMw: number;
  cruisePowerMw: number;
  maxSpeedKmh: number;
  tcuDerateLimitKv: number;
}

const TCDD_FLEET: TrainSet[] = [
  {
    id: 'siemens-ht80000',
    name: 'Siemens Velaro TR (HT80000)',
    model: '8x1000 kW Asenkron Cer Motoru (300 km/s)',
    maxPowerMw: 8.0,
    cruisePowerMw: 4.2,
    maxSpeedKmh: 300,
    tcuDerateLimitKv: 19.0
  },
  {
    id: 'caf-ht65000',
    name: 'CAF HT65000',
    model: '4x1200 kW Cer İnverteri (250 km/s)',
    maxPowerMw: 4.8,
    cruisePowerMw: 2.7,
    maxSpeedKmh: 250,
    tcuDerateLimitKv: 18.5
  }
];

const YHT_ROUTES: YHTRoute[] = [
  {
    id: 'ist-ankara',
    name: 'İstanbul (Söğütlüçeşme) – Ankara Gar (530 km)',
    totalKm: 530,
    bessKm: 245,
    description: 'Bilecik-Bozüyük (%22 rampa) ve Pamukova varyantını içeren en yoğun koridor.',
    stations: [
      { name: 'Söğütlüçeşme', km: 0, hasSubstation: true },
      { name: 'Pendik', km: 25 },
      { name: 'Gebze', km: 45, hasSubstation: true },
      { name: 'İzmit', km: 90 },
      { name: 'Arifiye', km: 135, hasSubstation: true },
      { name: 'Bilecik', km: 215, isRamp: true },
      { name: 'Bozüyük', km: 255, hasSubstation: true, isRamp: true },
      { name: 'Eskişehir', km: 305, hasSubstation: true },
      { name: 'Polatlı', km: 440, hasSubstation: true },
      { name: 'Eryaman', km: 505 },
      { name: 'Ankara Gar', km: 530, hasSubstation: true }
    ]
  },
  {
    id: 'ankara-sivas',
    name: 'Ankara Gar – Kırıkkale – Yozgat – Sivas (405 km)',
    totalKm: 405,
    bessKm: 190,
    description: 'Elmadağ viyadükleri, tüneller ve uzun trafo besleme aralıklarına sahip zorlu etap.',
    stations: [
      { name: 'Ankara Gar', km: 0, hasSubstation: true },
      { name: 'Kırıkkale', km: 75, hasSubstation: true, isRamp: true },
      { name: 'Yerköy', km: 155, hasSubstation: true },
      { name: 'Yozgat', km: 205, isRamp: true },
      { name: 'Sorgun', km: 240, hasSubstation: true },
      { name: 'Akdağmadeni', km: 305, isRamp: true },
      { name: 'Sivas Gar', km: 405, hasSubstation: true }
    ]
  },
  {
    id: 'ankara-konya-karaman',
    name: 'Ankara Gar – Konya – Karaman (315 km)',
    totalKm: 315,
    bessKm: 150,
    description: '300 km/s pik süratin kesintisiz korunduğu yüksek güçlü plato hattı.',
    stations: [
      { name: 'Ankara Gar', km: 0, hasSubstation: true },
      { name: 'Eryaman', km: 25 },
      { name: 'Polatlı', km: 90, hasSubstation: true },
      { name: 'Selçuklu', km: 205 },
      { name: 'Konya Gar', km: 212, hasSubstation: true },
      { name: 'Karaman Gar', km: 315, hasSubstation: true }
    ]
  },
  {
    id: 'ist-konya',
    name: 'İstanbul (Halkalı) – Eskişehir – Konya (640 km)',
    totalKm: 640,
    bessKm: 270,
    description: 'Marmara ile İç Anadolu bozkırını bağlayan uzun mesafe ekspres hattı.',
    stations: [
      { name: 'Halkalı', km: 0, hasSubstation: true },
      { name: 'Söğütlüçeşme', km: 28 },
      { name: 'Pendik', km: 53 },
      { name: 'İzmit', km: 118, hasSubstation: true },
      { name: 'Arifiye', km: 163 },
      { name: 'Bilecik', km: 243, isRamp: true },
      { name: 'Bozüyük', km: 283, hasSubstation: true, isRamp: true },
      { name: 'Eskişehir', km: 333, hasSubstation: true },
      { name: 'Konya Gar', km: 640, hasSubstation: true }
    ]
  }
];

export default function App() {
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(5); // 1x, 5x, 15x, 40x
  const [selectedRouteId, setSelectedRouteId] = useState('ist-ankara');
  const [selectedTrainId, setSelectedTrainId] = useState('siemens-ht80000');

  const [waysideBessActive, setWaysideBessActive] = useState(true);
  const [substationFailed, setSubstationFailed] = useState(false);

  const route = YHT_ROUTES.find((r) => r.id === selectedRouteId)!;
  const train = TCDD_FLEET.find((t) => t.id === selectedTrainId)!;

  const [train1Km, setTrain1Km] = useState(15);
  const [train1Speed, setTrain1Speed] = useState(train.maxSpeedKmh);
  const [train1DelaySec, setTrain1DelaySec] = useState(0);

  const [bessSoc, setBessSoc] = useState(88);
  const [bessPowerKw, setBessPowerKw] = useState(0);

  useEffect(() => {
    setTrain1Km(15);
    setTrain1DelaySec(0);
    setTrain1Speed(train.maxSpeedKmh);
  }, [selectedRouteId, selectedTrainId]);

  const currentStationIndex = route.stations.findIndex((s, idx) => {
    const nextS = route.stations[idx + 1];
    return nextS ? (train1Km >= s.km && train1Km < nextS.km) : true;
  });
  const nearestStation = route.stations[currentStationIndex] || route.stations[0];
  const nextStation = route.stations[currentStationIndex + 1] || route.stations[route.stations.length - 1];
  const isInRampZone = nearestStation.isRamp || false;

  const substations = route.stations.filter(s => s.hasSubstation);
  let distToNearestTm = 40;
  if (substations.length > 0) {
    const activeSubstations = substationFailed 
      ? substations.filter((_, idx) => idx % 2 === 0)
      : substations;
    const distances = activeSubstations.map(s => Math.abs(train1Km - s.km));
    distToNearestTm = Math.min(...distances);
  }

  const catenaryZPerKm = 0.28;
  const requiredPowerMw = isInRampZone ? train.maxPowerMw : train.cruisePowerMw;
  const nominalCurrentA = (requiredPowerMw * 1000) / (25 * 0.98);
  
  const rawDropKv = (nominalCurrentA * (distToNearestTm * catenaryZPerKm)) / 1000;

  let bessBoostKv = 0;
  const distToBess = Math.abs(train1Km - route.bessKm);
  if (waysideBessActive && bessSoc > 5 && (27.5 - rawDropKv) < 22.0 && distToBess < 30) {
    bessBoostKv = Math.max(0, (30 - distToBess) * 0.22);
  }

  const pantoVoltageKv = Math.min(27.5, Math.max(14.0, parseFloat((27.5 - rawDropKv + bessBoostKv).toFixed(2))));

  let deratingRatio = 1.0;
  if (pantoVoltageKv < train.tcuDerateLimitKv) {
    deratingRatio = 0.40;
  } else if (pantoVoltageKv < 22.5) {
    deratingRatio = pantoVoltageKv / 22.5;
  }

  const actualPowerMw = parseFloat((requiredPowerMw * deratingRatio).toFixed(2));
  const activeCurrentAmps = Math.round((actualPowerMw * 1000) / (pantoVoltageKv * 0.98));

  // Zaman Döngüsü (Hız Çarpanlı)
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTrain1Speed((prev) => {
        let target = train.maxSpeedKmh;
        if (deratingRatio < 0.5) target = 85;
        else if (deratingRatio < 0.85) target = 160;
        else if (isInRampZone) target = train.maxSpeedKmh - 15;

        const diff = target - prev;
        return Math.round(prev + diff * 0.25);
      });

      setTrain1Km((prev) => {
        const delta = (train1Speed / 3600) * 0.5 * simSpeed;
        const next = prev + delta;
        return next >= (route.totalKm - 2) ? 2 : parseFloat(next.toFixed(1));
      });

      if (train1Speed < (train.maxSpeedKmh - 40)) {
        setTrain1DelaySec((prev) => prev + Math.round(((train.maxSpeedKmh - train1Speed) / 20) * (simSpeed * 0.4)));
      }

      if (bessBoostKv > 0) {
        setBessPowerKw(Math.round(bessBoostKv * 850));
        setBessSoc((prev) => Math.max(5, parseFloat((prev - 0.05 * simSpeed).toFixed(2))));
      } else {
        setBessPowerKw(0);
        if (bessSoc < 95) setBessSoc((prev) => Math.min(95, parseFloat((prev + 0.02 * simSpeed).toFixed(2))));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, train1Speed, deratingRatio, isInRampZone, bessBoostKv, bessSoc, route.totalKm, train.maxSpeedKmh, simSpeed]);

  const train1SvgX = (train1Km / route.totalKm) * 560 + 20;
  const train1SvgY = 130 - ((pantoVoltageKv - 14) / 14) * 110;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ÜST BAŞLIK VE HIZ AYARLARI */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
              <Train className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                  TCDD RailVolt 25k
                </h1>
                <span className="px-2.5 py-0.5 rounded text-xs bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/30">
                  CER SİMÜLASYONU
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                25 kV AC Demiryolu Katener Yük Akışı & Canlı Rötar Önleme
              </p>
            </div>
          </div>

          {/* SİMÜLASYON HIZI & BAŞLAT/DURDUR */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-cyan-400" /> Hız:
              </span>
              {[1, 5, 15, 40].map((multiplier) => (
                <button
                  key={multiplier}
                  onClick={() => setSimSpeed(multiplier)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    simSpeed === multiplier
                      ? 'bg-cyan-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {multiplier}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold"
            >
              {isRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              {isRunning ? 'Durdur' : 'Başlat'}
            </button>

            <button
              onClick={() => {
                setTrain1Km(15);
                setTrain1Speed(train.maxSpeedKmh);
                setTrain1DelaySec(0);
                setBessSoc(88);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200"
              title="Simülasyonu Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* KONTROL PANELİ */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <MapPin className="w-3.5 h-3.5 text-red-400" /> YHT Güzergahı
            </label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
            >
              {YHT_ROUTES.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Train className="w-3.5 h-3.5 text-cyan-400" /> TCDD Tren Seti
            </label>
            <select
              value={selectedTrainId}
              onChange={(e) => setSelectedTrainId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              {TCDD_FLEET.map((t) => (
                <option key={t.id} value={t.id}>{t.name} ({t.maxPowerMw} MW)</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => setWaysideBessActive(!waysideBessActive)}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                waysideBessActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <Battery className="w-4 h-4" />
              {waysideBessActive ? 'Wayside BESS: AKTİF' : 'Wayside BESS: KAPALI'}
            </button>
          </div>

          <div className="flex flex-col justify-end">
            <button
              onClick={() => setSubstationFailed(!substationFailed)}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                substationFailed
                  ? 'bg-red-600 text-white border-red-400 animate-pulse'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
              }`}
            >
              <PowerOff className="w-4 h-4" />
              {substationFailed ? 'N-1 KRİZİ (Trafo Arızalı)' : 'Trafolar: Normal'}
            </button>
          </div>
        </div>

        {/* ANINDA KONUM DEĞİŞTİRME & İSTASYONA IŞINLANMA ÇUBUĞU */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <LocateFixed className="w-4 h-4 text-cyan-400" />
              Hızlı Konum Değiştir / İstasyona Işınlan:
            </span>
            <span className="text-xs font-mono font-bold text-cyan-300">
              Konum: {train1Km} km / {route.totalKm} km
            </span>
          </div>

          {/* Manuel KM Kaydırıcı (Slider) */}
          <input
            type="range"
            min="0"
            max={route.totalKm}
            step="1"
            value={train1Km}
            onChange={(e) => setTrain1Km(Number(e.target.value))}
            className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />

          {/* İstasyon Hızlı Butonları */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {route.stations.map((s) => (
              <button
                key={s.name}
                onClick={() => setTrain1Km(s.km)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border whitespace-nowrap transition-all ${
                  Math.abs(train1Km - s.km) < 15
                    ? 'bg-red-500/20 border-red-500/50 text-red-300 font-bold'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {s.name} {s.isRamp && '▲'}
              </button>
            ))}
          </div>
        </div>

        {/* UYARI PANELİ */}
        {deratingRatio < 0.7 && (
          <div className="bg-red-500/10 border-2 border-red-500/60 rounded-2xl p-4 flex items-center gap-4 text-red-300 animate-pulse">
            <AlertTriangle className="w-9 h-9 text-red-400 shrink-0" />
            <div>
              <h4 className="font-black text-red-200 text-base">
                TCU GÜÇ KISMA DEVREDE: KATENER GERİLİMİ ÇÖKTÜ ({pantoVoltageKv} kV)!
              </h4>
              <p className="text-xs text-red-300/90 mt-0.5 leading-relaxed">
                {nearestStation.name} civarında en yakın trafo merkezine olan mesafe ({Math.round(distToNearestTm)} km) nedeniyle gerilim {train.tcuDerateLimitKv} kV altına indi. Tren çekiş gücünü <strong>{actualPowerMw} MW</strong> seviyesine düşürdü. Hız kaybediliyor ve <strong>rötar birikiyor</strong>!
              </p>
            </div>
          </div>
        )}

        {/* 4 ANA METRİK KARTI */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={`p-5 rounded-2xl border transition-all ${
            pantoVoltageKv < train.tcuDerateLimitKv ? 'bg-red-950/30 border-red-500/60' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
              <span>Pantograf Gerilimi</span>
              <Activity className={`w-5 h-5 ${pantoVoltageKv < train.tcuDerateLimitKv ? 'text-red-400 animate-bounce' : 'text-cyan-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${
                pantoVoltageKv < train.tcuDerateLimitKv ? 'text-red-400' : pantoVoltageKv < 22.5 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {pantoVoltageKv}
              </span>
              <span className="text-sm text-slate-400 font-medium">kV AC</span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>Nominal: 25.0 kV</span>
              <span>Akım: <strong className="text-slate-200">{activeCurrentAmps} A</strong></span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
              <span>Aktif Cer Gücü (TCU)</span>
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black font-mono text-slate-100">{actualPowerMw}</span>
              <span className="text-sm text-slate-400 font-medium">/ {requiredPowerMw} MW</span>
            </div>
            <div className="mt-3 flex justify-between text-xs text-slate-400">
              <span>Güç Kullanılabilirliği:</span>
              <span className={deratingRatio < 0.6 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                %{Math.round(deratingRatio * 100)}
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
              <span>YHT Seyir Hızı</span>
              <Gauge className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${train1Speed < 140 ? 'text-red-400' : 'text-emerald-400'}`}>
                {train1Speed}
              </span>
              <span className="text-sm text-slate-400 font-medium">km/s (Hedef: {train.maxSpeedKmh})</span>
            </div>
            <div className="mt-3 text-xs text-slate-400 flex justify-between">
              <span>Konum: <strong>{train1Km} km</strong></span>
              <span className={isInRampZone ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                {isInRampZone ? '▲ Dik Rampa' : 'Düz Hat'}
              </span>
            </div>
          </div>

          <div className={`p-5 rounded-2xl border ${
            train1DelaySec > 0 ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-900/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
              <span>Hat Rötar Sayacı</span>
              <Clock className={`w-5 h-5 ${train1DelaySec > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono ${train1DelaySec > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                +{Math.floor(train1DelaySec / 60)} dk {train1DelaySec % 60} sn
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              {train1DelaySec === 0 ? (
                <span className="text-emerald-400 flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" /> 0 Rötar • Zamanında
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">Güç kısıtından kaynaklı gecikme</span>
              )}
            </div>
          </div>
        </div>

        {/* KATENER GERİLİM GRAFİĞİ */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                25 kV AC Dinamik Hat Gerilim Grafiği (0 - {route.totalKm} km)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{route.description}</p>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              BESS Konumu: {route.bessKm}. km
            </div>
          </div>

          <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800">
            <svg viewBox="0 0 600 140" className="w-full h-44 overflow-visible">
              <line x1="20" y1="18" x2="580" y2="18" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              <text x="25" y="15" fill="#10b981" fontSize="8" fontFamily="monospace">27.5 kV Nominal Besleme</text>

              <line x1="20" y1="96" x2="580" y2="96" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x="25" y="93" fill="#ef4444" fontSize="8" fontFamily="monospace">{train.tcuDerateLimitKv} kV EN 50163 Derating Sınırı</text>

              {/* Tren İbresi */}
              <circle cx={train1SvgX} cy={train1SvgY} r="8" className="fill-red-400/30 animate-ping" />
              <circle cx={train1SvgX} cy={train1SvgY} r="5" className="fill-red-400 stroke-slate-950 stroke-2" />

              <rect
                x={Math.min(480, Math.max(10, train1SvgX - 55))}
                y={Math.max(5, train1SvgY - 26)}
                width="110"
                height="18"
                rx="4"
                fill="#020617"
                stroke={pantoVoltageKv < train.tcuDerateLimitKv ? '#ef4444' : '#06b6d4'}
                strokeWidth="1"
              />
              <text
                x={Math.min(535, Math.max(65, train1SvgX))}
                y={Math.max(17, train1SvgY - 14)}
                fill="#f8fafc"
                fontSize="8"
                fontWeight="bold"
                textAnchor="middle"
              >
                {train.name.split(' ')[0]} • {pantoVoltageKv} kV
              </text>

              {/* BESS Noktası */}
              <g transform={`translate(${20 + (route.bessKm / route.totalKm) * 560}, 15)`}>
                <circle cx="0" cy="5" r="4" fill={waysideBessActive ? '#10b981' : '#64748b'} />
                <text x="0" y="-3" fill="#10b981" fontSize="7" textAnchor="middle" fontWeight="bold">
                  BESS ({route.bessKm} km)
                </text>
              </g>
            </svg>
          </div>
        </div>

      </div>
    </div>
  );
}