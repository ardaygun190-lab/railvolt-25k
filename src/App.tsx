import { useState, useEffect } from 'react';
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
  FastForward, 
  LocateFixed, 
  FileText, 
  Sliders, 
  RefreshCw,
  SlidersHorizontal,
  ArrowDownUp
} from 'lucide-react';

interface Station {
  name: string;
  km: number;
  hasSubstation?: boolean;
  gradePermille?: number;
}

interface YHTRoute {
  id: string;
  name: string;
  totalKm: number;
  stations: Station[];
  bessKm: number;
  description: string;
}

interface TrainModel {
  id: string;
  name: string;
  massTon: number;
  maxPowerMw: number;
  maxSpeedKmh: number;
  davisA: number;
  davisB: number;
  davisC: number;
  efficiency: number;
}

const TCDD_FLEET: TrainModel[] = [
  {
    id: 'siemens-ht80000',
    name: 'Siemens Velaro TR (HT80000)',
    massTon: 460,
    maxPowerMw: 8.0,
    maxSpeedKmh: 300,
    davisA: 3.2,
    davisB: 0.035,
    davisC: 0.00135,
    efficiency: 0.91
  },
  {
    id: 'caf-ht65000',
    name: 'CAF HT65000',
    massTon: 330,
    maxPowerMw: 4.8,
    maxSpeedKmh: 250,
    davisA: 2.6,
    davisB: 0.028,
    davisC: 0.00118,
    efficiency: 0.89
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
      { name: 'Söğütlüçeşme', km: 0, hasSubstation: true, gradePermille: 0 },
      { name: 'Pendik', km: 25, gradePermille: 2 },
      { name: 'Gebze', km: 45, hasSubstation: true, gradePermille: 0 },
      { name: 'İzmit', km: 90, gradePermille: 0 },
      { name: 'Arifiye', km: 135, hasSubstation: true, gradePermille: 4 },
      { name: 'Bilecik', km: 215, gradePermille: 22 },
      { name: 'Bozüyük', km: 255, hasSubstation: true, gradePermille: 22 },
      { name: 'Eskişehir', km: 305, hasSubstation: true, gradePermille: 3 },
      { name: 'Polatlı', km: 440, hasSubstation: true, gradePermille: 1 },
      { name: 'Eryaman', km: 505, gradePermille: 0 },
      { name: 'Ankara Gar', km: 530, hasSubstation: true, gradePermille: 0 }
    ]
  },
  {
    id: 'ankara-sivas',
    name: 'Ankara Gar – Kırıkkale – Yozgat – Sivas (405 km)',
    totalKm: 405,
    bessKm: 190,
    description: 'Elmadağ viyadükleri, tüneller ve uzun besleme bölgelerine sahip etap.',
    stations: [
      { name: 'Ankara Gar', km: 0, hasSubstation: true, gradePermille: 0 },
      { name: 'Kırıkkale', km: 75, hasSubstation: true, gradePermille: 15 },
      { name: 'Yerköy', km: 155, hasSubstation: true, gradePermille: 5 },
      { name: 'Yozgat', km: 205, gradePermille: 16 },
      { name: 'Sorgun', km: 240, hasSubstation: true, gradePermille: 4 },
      { name: 'Akdağmadeni', km: 305, gradePermille: 18 },
      { name: 'Sivas Gar', km: 405, hasSubstation: true, gradePermille: 0 }
    ]
  },
  {
    id: 'ankara-konya-karaman',
    name: 'Ankara Gar – Konya – Karaman (315 km)',
    totalKm: 315,
    bessKm: 150,
    description: '300 km/s pik süratin kesintisiz korunduğu yüksek güçlü plato hattı.',
    stations: [
      { name: 'Ankara Gar', km: 0, hasSubstation: true, gradePermille: 0 },
      { name: 'Eryaman', km: 25, gradePermille: 0 },
      { name: 'Polatlı', km: 90, hasSubstation: true, gradePermille: 2 },
      { name: 'Selçuklu', km: 205, gradePermille: 1 },
      { name: 'Konya Gar', km: 212, hasSubstation: true, gradePermille: 0 },
      { name: 'Karaman Gar', km: 315, hasSubstation: true, gradePermille: 0 }
    ]
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'sim' | 'bess_config' | 'methodology'>('sim');
  const [isRunning, setIsRunning] = useState(true);
  const [simSpeed, setSimSpeed] = useState(5);
  const [selectedRouteId, setSelectedRouteId] = useState('ist-ankara');
  const [selectedTrainId, setSelectedTrainId] = useState('siemens-ht80000');

  // Hat & N-1 Durumu
  const [waysideBessActive, setWaysideBessActive] = useState(true);
  const [n1ContingencyActive, setN1ContingencyActive] = useState(false);
  const [dualTrainActive, setDualTrainActive] = useState(true);

  // KULLANICI AYARLAYABİLİR BESS PARAMETRELERİ
  const [bessPcsMaxMw, setBessPcsMaxMw] = useState(4.0); // 1.0 - 8.0 MW
  const [bessCapacityMwh, setBessCapacityMwh] = useState(3.0); // 1.0 - 10.0 MWh
  const [bessDroopThresholdKv, setBessDroopThresholdKv] = useState(22.5); // 20.0 - 24.0 kV

  const route = YHT_ROUTES.find((r) => r.id === selectedRouteId)!;
  const train = TCDD_FLEET.find((t) => t.id === selectedTrainId)!;

  // Tren 1 (Ana Tren)
  const [train1Km, setTrain1Km] = useState(220);
  const [train1Speed, setTrain1Speed] = useState(250);
  const [train1DelaySec, setTrain1DelaySec] = useState(0);

  // Tren 2 (Karşı Hat)
  const [train2Km, setTrain2Km] = useState(270);
  const [train2Speed] = useState(220);

  // BESS Dinamik Durumu
  const [bessSoc, setBessSoc] = useState(85);
  const [bessInjectedPowerKw, setBessInjectedPowerKw] = useState(0);

  useEffect(() => {
    setTrain1DelaySec(0);
    setTrain1Speed(train.maxSpeedKmh);
  }, [selectedRouteId, selectedTrainId]);

  // İstasyon ve Eğim
  const currentStationIndex = route.stations.findIndex((s, idx) => {
    const nextS = route.stations[idx + 1];
    return nextS ? (train1Km >= s.km && train1Km < nextS.km) : true;
  });
  const currentStation = route.stations[currentStationIndex] || route.stations[0];
  const currentGradePermille = currentStation.gradePermille || 0;

  // --- 1. DİNAMİK CER & MOMENTUM MODELİ ---
  const vKmh = Math.max(5, train1Speed);
  const vMs = vKmh / 3.6;

  // Kinetik Enerji: Ek = 0.5 * m * v^2 (GJ)
  const kineticEnergyGj = parseFloat(((0.5 * train.massTon * 1000 * Math.pow(vMs, 2)) / 1e9).toFixed(2));

  // Davis Direnci (kN)
  const fDavisKn = train.davisA + (train.davisB * vKmh) + (train.davisC * Math.pow(vKmh, 2));
  
  // Rampa Eğim Direnci (kN)
  const fGradeKn = train.massTon * 9.81 * (currentGradePermille / 1000);

  // İvmelenme / Yavaşlama Durumu
  const isAccelerating = train1Speed < train.maxSpeedKmh - 5;
  const isBraking = currentGradePermille < -5; // Dik inişte rejeneratif frenleme
  
  let targetAccMs2 = 0.02; // Sabit seyir
  let tractionMode: 'PİK ÇEKİŞ' | 'SABİT SEYİR' | 'SERBEST SÜRÜŞ' | 'REJENERATİF FREN' = 'SABİT SEYİR';

  if (isBraking) {
    targetAccMs2 = -0.15;
    tractionMode = 'REJENERATİF FREN';
  } else if (isAccelerating) {
    targetAccMs2 = 0.22;
    tractionMode = 'PİK ÇEKİŞ';
  }

  const fAccKn = train.massTon * 1.08 * targetAccMs2;
  const fNetTractionKn = fDavisKn + fGradeKn + fAccKn;

  // Tekerlek Gücü ve Katener Talep Gücü (MW)
  let rawDemandedPowerMw = 0;
  if (fNetTractionKn > 0) {
    const pMechMw = (fNetTractionKn * vMs) / 1000;
    rawDemandedPowerMw = Math.min(train.maxPowerMw, parseFloat((pMechMw / train.efficiency).toFixed(2)));
  } else {
    // Rejeneratif Güç Geri Basma (Eksi Güç)
    const pRegenMw = (Math.abs(fNetTractionKn) * vMs * train.efficiency) / 1000;
    rawDemandedPowerMw = -Math.min(3.5, parseFloat(pRegenMw.toFixed(2)));
  }

  // --- 2. N-1 BESLEME TOPOLOJİSİ & EMPEDANS ---
  const substations = route.stations.filter(s => s.hasSubstation);
  let distToNearestTm = 35;
  if (substations.length > 0) {
    const activeSubstations = n1ContingencyActive
      ? substations.filter((_, idx) => idx % 2 === 0) // Komşu TM üzerinden fider uzatması
      : substations;
    const distances = activeSubstations.map(s => Math.abs(train1Km - s.km));
    distToNearestTm = Math.min(...distances);
  }

  const zLoopPerKm = 0.28; // Ray geri dönüşü dahil eşdeğer hat empedansı (Ohm/km)
  const nominalCurrentA = Math.abs(rawDemandedPowerMw * 1000) / (25.0 * 0.98);
  
  // Pozitif çekiş voltajı düşürür, rejeneratif fren ise voltajı yükseltir
  let catenaryDropKv = (nominalCurrentA * (distToNearestTm * zLoopPerKm)) / 1000;
  if (rawDemandedPowerMw < 0) catenaryDropKv = -catenaryDropKv * 0.6; // Rejeneratif voltaj toparlama

  if (dualTrainActive && Math.abs(train2Km - train1Km) < 50) {
    catenaryDropKv += 1.45;
  }

  // --- 3. DİNAMİK WAYSIDE BESS REGÜLASYONU (DROOP KONTROL) ---
  let bessVoltageSupportKv = 0;
  let dynamicBessPowerKw = 0;
  const distToBess = Math.abs(train1Km - route.bessKm);

  if (waysideBessActive && bessSoc > 5 && distToBess < 40) {
    const vBeforeBess = 27.5 - catenaryDropKv;
    if (vBeforeBess < bessDroopThresholdKv) {
      const voltageDeficit = bessDroopThresholdKv - vBeforeBess;
      const proximityFactor = Math.max(0, (40 - distToBess) / 40);
      
      const requestedKw = voltageDeficit * 1100 * proximityFactor;
      dynamicBessPowerKw = Math.min(bessPcsMaxMw * 1000, Math.round(requestedKw));
      bessVoltageSupportKv = parseFloat(((dynamicBessPowerKw / (bessPcsMaxMw * 1000)) * 3.6 * proximityFactor).toFixed(2));
    }
  }

  const pantoVoltageKv = Math.min(27.5, Math.max(14.0, parseFloat((27.5 - catenaryDropKv + bessVoltageSupportKv).toFixed(2))));

  // --- 4. EN 50163 STANDARDI TCU DERATING KARAKTERİSTİĞİ ---
  let deratingRatio = 1.0;
  let deratingStatus: 'NOMINAL' | 'LINEAR_DERATE' | 'CRITICAL_DERATE' | 'CB_TRIP' = 'NOMINAL';

  if (rawDemandedPowerMw > 0) {
    if (pantoVoltageKv >= 22.5) {
      deratingRatio = 1.0;
      deratingStatus = 'NOMINAL';
    } else if (pantoVoltageKv >= 19.0) {
      deratingRatio = pantoVoltageKv / 22.5;
      deratingStatus = 'LINEAR_DERATE';
    } else if (pantoVoltageKv >= 17.5) {
      deratingRatio = 0.38;
      deratingStatus = 'CRITICAL_DERATE';
    } else {
      deratingRatio = 0.0;
      deratingStatus = 'CB_TRIP';
    }
  }

  const actualTractionPowerMw = rawDemandedPowerMw > 0 
    ? parseFloat((rawDemandedPowerMw * deratingRatio).toFixed(2))
    : rawDemandedPowerMw;

  const activeCurrentAmps = pantoVoltageKv > 0 ? Math.round((Math.abs(actualTractionPowerMw) * 1000) / (pantoVoltageKv * 0.98)) : 0;

  // Canlı Döngü
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTrain1Speed((prev) => {
        let target = train.maxSpeedKmh;
        if (deratingStatus === 'CB_TRIP') target = 0;
        else if (deratingStatus === 'CRITICAL_DERATE') target = 85;
        else if (deratingStatus === 'LINEAR_DERATE') target = 165;
        else if (currentGradePermille > 15) target = train.maxSpeedKmh - 15;

        const diff = target - prev;
        return Math.round(prev + diff * 0.2);
      });

      setTrain1Km((prev) => {
        const delta = (train1Speed / 3600) * 0.5 * simSpeed;
        const next = prev + delta;
        return next >= (route.totalKm - 2) ? 2 : parseFloat(next.toFixed(1));
      });

      if (dualTrainActive) {
        setTrain2Km((prev) => {
          const delta = (train2Speed / 3600) * 0.5 * simSpeed;
          const next = prev - delta;
          return next <= 2 ? (route.totalKm - 10) : parseFloat(next.toFixed(1));
        });
      }

      if (train1Speed < (train.maxSpeedKmh - 40) && deratingRatio < 1.0) {
        setTrain1DelaySec((prev) => prev + Math.round(((train.maxSpeedKmh - train1Speed) / 20) * (simSpeed * 0.4)));
      }

      // BESS SoC Güncellemesi (Kullanıcı Tanımlı Kapasiteye Göre)
      if (dynamicBessPowerKw > 0) {
        setBessInjectedPowerKw(dynamicBessPowerKw);
        setBessSoc((prev) => Math.max(5, parseFloat((prev - (dynamicBessPowerKw / (bessCapacityMwh * 1000)) * 0.005 * simSpeed).toFixed(2))));
      } else {
        setBessInjectedPowerKw(0);
        if (bessSoc < 92) setBessSoc((prev) => Math.min(92, parseFloat((prev + 0.015 * simSpeed).toFixed(2))));
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isRunning, train1Speed, deratingStatus, currentGradePermille, dualTrainActive, dynamicBessPowerKw, bessSoc, route.totalKm, train.maxSpeedKmh, simSpeed, train2Speed, deratingRatio, bessCapacityMwh]);

  const train1SvgX = (train1Km / route.totalKm) * 560 + 20;
  const train1SvgY = 130 - ((pantoVoltageKv - 14) / 14) * 110;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ÜST PANEL */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400">
              <Train className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-red-400 via-amber-300 to-cyan-400 bg-clip-text text-transparent">
                  RailVolt 25k Pro
                </h1>
                <span className="px-2.5 py-0.5 rounded text-xs bg-red-500/20 text-red-300 font-mono font-bold border border-red-500/30">
                  CER GÜÇ AKIŞI & BESS SİMÜLATÖRÜ
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                EN 50163 Standardı, Dinamik Yük Akışı, N-1 Fider Transferi ve Ayarlanabilir BESS Mimarisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Sekmeler */}
            <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('sim')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'sim' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" /> Canlı Simülasyon
              </button>
              <button
                onClick={() => setActiveTab('bess_config')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'bess_config' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> BESS Konfigürasyonu
              </button>
              <button
                onClick={() => setActiveTab('methodology')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeTab === 'methodology' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Metodoloji & Standartlar
              </button>
            </div>

            {/* Hız */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
              <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
                <FastForward className="w-3.5 h-3.5 text-cyan-400" />
              </span>
              {[1, 5, 15, 30].map((m) => (
                <button
                  key={m}
                  onClick={() => setSimSpeed(m)}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                    simSpeed === m ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m}x
                </button>
              ))}
            </div>

            <button
              onClick={() => setIsRunning(!isRunning)}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold"
            >
              {isRunning ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
              {isRunning ? 'Durdur' : 'Başlat'}
            </button>

            <button
              onClick={() => {
                setTrain1Km(220);
                setTrain1Speed(train.maxSpeedKmh);
                setTrain1DelaySec(0);
                setBessSoc(85);
              }}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-400 hover:text-slate-200"
              title="Sıfırla"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {activeTab === 'sim' && (
          <>
            {/* KONTROL KONSOLU */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-2xl bg-slate-900/70 border border-slate-800">
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-red-400" /> YHT Güzergahı
                </label>
                <select
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-red-500 cursor-pointer"
                >
                  {YHT_ROUTES.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Train className="w-3.5 h-3.5 text-cyan-400" /> Tren Seti
                </label>
                <select
                  value={selectedTrainId}
                  onChange={(e) => setSelectedTrainId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {TCDD_FLEET.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.massTon} ton)</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setWaysideBessActive(!waysideBessActive)}
                  className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    waysideBessActive
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  <Battery className="w-3.5 h-3.5" />
                  {waysideBessActive ? `BESS Aktif (${bessPcsMaxMw} MW PCS)` : 'BESS: KAPALI'}
                </button>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setDualTrainActive(!dualTrainActive)}
                  className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    dualTrainActive
                      ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  <ArrowDownUp className="w-3.5 h-3.5" />
                  {dualTrainActive ? 'Çoklu Tren Yük Akışı' : 'Tek Tren'}
                </button>
              </div>

              <div className="flex flex-col justify-end">
                <button
                  onClick={() => setN1ContingencyActive(!n1ContingencyActive)}
                  className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 border transition-all ${
                    n1ContingencyActive
                      ? 'bg-amber-600 text-white border-amber-400 animate-pulse shadow-md'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
                  }`}
                >
                  <PowerOff className="w-3.5 h-3.5" />
                  {n1ContingencyActive ? 'N-1 Durumu (Fider Uzatma)' : 'Trafolar: Normal'}
                </button>
              </div>
            </div>

            {/* HIZLI IŞINLANMA & REJİM BİLGİSİ */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <LocateFixed className="w-4 h-4 text-cyan-400" />
                  Hızlı Konum & Güzergah Profili:
                </span>
                <div className="flex items-center gap-3 text-xs font-mono">
                  <span className="text-cyan-300 font-bold">
                    Konum: {train1Km} km / {route.totalKm} km ({currentStation.name})
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-bold">
                    Rejim: {tractionMode}
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max={route.totalKm}
                step="1"
                value={train1Km}
                onChange={(e) => setTrain1Km(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

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
                    {s.name} {s.gradePermille && s.gradePermille > 10 ? `(▲ ‰${s.gradePermille})` : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* N-1 BİLGİLENDİRME PANELİ */}
            {n1ContingencyActive && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400 shrink-0 animate-spin" />
                  <span>
                    <strong>N-1 İşletme Durumu:</strong> TM-2 devre dışı. Nötr bölge ayırıcısı kapatıldı; hat bölümü komşu Trafo Merkezi üzerinden besleniyor (Fider uzatması nedeniyle eşdeğer empedans 2 katına çıktı).
                  </span>
                </div>
                <span className="font-mono text-amber-300 font-bold whitespace-nowrap">TM Mesafesi: {Math.round(distToNearestTm)} km</span>
              </div>
            )}

            {/* 4 ANA METRİK KARTI */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Gerilim */}
              <div className={`p-5 rounded-2xl border transition-all ${
                pantoVoltageKv < 19.0 ? 'bg-red-950/30 border-red-500/60' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
                  <span>Pantograf Gerilimi</span>
                  <Activity className={`w-5 h-5 ${pantoVoltageKv < 19.0 ? 'text-red-400 animate-bounce' : 'text-cyan-400'}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${
                    pantoVoltageKv < 17.5 ? 'text-red-500' : pantoVoltageKv < 19.0 ? 'text-red-400' : pantoVoltageKv < 22.5 ? 'text-amber-400' : 'text-emerald-400'
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

              {/* Cer Gücü */}
              <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800">
                <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
                  <span>Aktif Cer Gücü (TCU)</span>
                  <Zap className="w-5 h-5 text-amber-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black font-mono ${actualTractionPowerMw < 0 ? 'text-emerald-400' : 'text-slate-100'}`}>
                    {actualTractionPowerMw}
                  </span>
                  <span className="text-sm text-slate-400 font-medium">/ {rawDemandedPowerMw} MW</span>
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-400">
                  <span>Kinetik Enerji: <strong>{kineticEnergyGj} GJ</strong></span>
                  <span className={deratingRatio < 0.6 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    %{Math.round(deratingRatio * 100)} İzin
                  </span>
                </div>
              </div>

              {/* Hız & Eğim */}
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
                  <span>Eğim: <strong>‰{currentGradePermille}</strong></span>
                  <span>Rampa Yükü: <strong>{Math.round(fGradeKn)} kN</strong></span>
                </div>
              </div>

              {/* BESS Enjeksiyonu */}
              <div className={`p-5 rounded-2xl border ${
                train1DelaySec > 0 ? 'bg-amber-950/20 border-amber-500/50' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-center justify-between mb-3 text-xs uppercase text-slate-400 font-bold">
                  <span>BESS Aktif Güç Desteği</span>
                  <Battery className={`w-5 h-5 ${bessInjectedPowerKw > 0 ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {bessInjectedPowerKw > 0 ? `${(bessInjectedPowerKw / 1000).toFixed(2)} MW` : '0.00 MW'}
                  </span>
                  <span className="text-xs text-slate-400">SoC: %{bessSoc}</span>
                </div>
                <div className="mt-3 text-xs text-slate-400 flex justify-between">
                  <span>Rötar Durumu:</span>
                  <span className={train1DelaySec > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>
                    +{Math.floor(train1DelaySec / 60)} dk {train1DelaySec % 60} sn
                  </span>
                </div>
              </div>
            </div>

            {/* KATENER VOLTAJ GRAFİĞİ */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    25 kV AC Dinamik Hat Gerilim Grafiği & Çoklu Tren Düğümleri
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{route.description}</p>
                </div>
                <div className="text-xs text-slate-400 font-mono">
                  Wayside BESS: {route.bessKm}. km ({bessPcsMaxMw} MW PCS / {bessCapacityMwh} MWh)
                </div>
              </div>

              <div className="w-full bg-slate-950 rounded-xl p-4 border border-slate-800">
                <svg viewBox="0 0 600 140" className="w-full h-44 overflow-visible">
                  <line x1="20" y1="18" x2="580" y2="18" stroke="#10b981" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
                  <text x="25" y="15" fill="#10b981" fontSize="8" fontFamily="monospace">27.5 kV Maksimum Besleme</text>

                  <line x1="20" y1="96" x2="580" y2="96" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" />
                  <text x="25" y="93" fill="#ef4444" fontSize="8" fontFamily="monospace">19.0 kV EN 50163 Sürekli Alt Sınır</text>

                  <line x1="20" y1="110" x2="580" y2="110" stroke="#b91c1c" strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
                  <text x="25" y="120" fill="#b91c1c" fontSize="7" fontFamily="monospace">17.5 kV Kesici Açma Eşiği (Trip)</text>

                  <circle cx={train1SvgX} cy={train1SvgY} r="8" className="fill-red-400/30 animate-ping" />
                  <circle cx={train1SvgX} cy={train1SvgY} r="5" className="fill-red-400 stroke-slate-950 stroke-2" />

                  <rect
                    x={Math.min(470, Math.max(10, train1SvgX - 60))}
                    y={Math.max(5, train1SvgY - 26)}
                    width="120"
                    height="18"
                    rx="4"
                    fill="#020617"
                    stroke={pantoVoltageKv < 19.0 ? '#ef4444' : '#06b6d4'}
                    strokeWidth="1"
                  />
                  <text
                    x={Math.min(530, Math.max(70, train1SvgX))}
                    y={Math.max(17, train1SvgY - 14)}
                    fill="#f8fafc"
                    fontSize="7.5"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Tren 1 ({train1Km} km) • {pantoVoltageKv} kV
                  </text>

                  {dualTrainActive && (
                    <g transform={`translate(${(train2Km / route.totalKm) * 560 + 20}, 45)`}>
                      <circle cx="0" cy="0" r="4" fill="#a855f7" />
                      <text x="0" y="-8" fill="#c084fc" fontSize="7" textAnchor="middle">
                        Tren 2 ({train2Km} km)
                      </text>
                    </g>
                  )}

                  <g transform={`translate(${20 + (route.bessKm / route.totalKm) * 560}, 15)`}>
                    <circle cx="0" cy="5" r="4" fill={waysideBessActive ? '#10b981' : '#64748b'} />
                    <text x="0" y="-3" fill="#10b981" fontSize="7" textAnchor="middle" fontWeight="bold">
                      BESS ({route.bessKm} km)
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </>
        )}

        {/* 2. SEKME: İNTERAKTİF BESS KONFİGÜRASYONU */}
        {activeTab === 'bess_config' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-cyan-400" />
                Ray Kenarı BESS (Wayside BESS) Parametre Optimizasyonu
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Batarya enerji kapasitesi, inverter (PCS) gücü ve gerilim regülasyon eşiklerini dinamik olarak değiştirip cer hattına etkisini gözlemleyin.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* PCS Gücü */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">PCS Evirici Gücü (Inverter)</label>
                  <span className="text-sm font-mono font-bold text-cyan-400">{bessPcsMaxMw} MW</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.5"
                  value={bessPcsMaxMw}
                  onChange={(e) => setBessPcsMaxMw(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <p className="text-[11px] text-slate-400">Katener hattına anlık basılabilecek maksimum aktif güç sınırı.</p>
              </div>

              {/* Batarya Kapasitesi */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">Batarya Enerji Kapasitesi</label>
                  <span className="text-sm font-mono font-bold text-emerald-400">{bessCapacityMwh} MWh</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="10.0"
                  step="0.5"
                  value={bessCapacityMwh}
                  onChange={(e) => setBessCapacityMwh(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                />
                <p className="text-[11px] text-slate-400">LiFePO4 batarya paketinin toplam depolama hacmi ve SoC deşarj dayanımı.</p>
              </div>

              {/* Droop Eşiği */}
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-300">Droop Regülasyon Başlama Eşiği</label>
                  <span className="text-sm font-mono font-bold text-amber-400">{bessDroopThresholdKv} kV</span>
                </div>
                <input
                  type="range"
                  min="20.0"
                  max="24.5"
                  step="0.1"
                  value={bessDroopThresholdKv}
                  onChange={(e) => setBessDroopThresholdKv(Number(e.target.value))}
                  className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <p className="text-[11px] text-slate-400">Katener gerilimi bu eşiğin altına indiğinde BESS devreye girerek voltajı destekler.</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. SEKME: METODOLOJİ & STANDARTLAR */}
        {activeTab === 'methodology' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                Simülasyon Metodolojisi ve Normlar
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Demiryolu elektrifikasyonu ve cer güç akışı hesaplama kabulleri:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">1. Dinamik Cer Dirençleri & Momentum</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trenin katenerden çektiği anlık elektriksel güç; anlık hız, ivme, rampa eğimi ve aerodinamik hava sürtünmesi (Davis denklemi) ile hesaplanır. İniş rampalarında rejeneratif frenleme ile hatta enerji geri beslenir.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">2. EN 50163 Standardı & TCU Derating</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Pantograf gerilimi 22.5 kV altına indiğinde Cer Kontrol Ünitesi (TCU) trafo doymasını önlemek için çekiş gücünü lineer olarak kısar. 19.0 kV altında kritik güç kilidi uygulanır; 17.5 kV altında ana devre kesici (VCB) açar.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">3. N-1 Fider Transferi & Empedans</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Trafo Merkezi arızasında nötr bölge kesicisi kapatılarak hat komşu Trafo Merkezi üzerinden beslenir. İki katına çıkan elektriksel besleme mesafesi nedeniyle aşırı gerilim düşümü meydana gelir.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300">4. Wayside BESS Dinamik Desteği</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Katener gerilimi belirlenen eşiğin altına indiğinde, ray kenarı batarya depolama sistemi (Wayside BESS) aktif güç enjekte ederek voltajı toparlar ve sefer rötarlarını önler.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}