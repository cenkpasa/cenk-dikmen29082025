import React, { useState, useEffect, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/dbService';
import { CalculatorState, CalculationHistoryItem } from '../types';
import { debounce } from '../utils/debounce';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import DataTable from '../components/common/DataTable';

const DEFAULT_INPUTS = {
    turning: { Dm: '', n: '', vc: '', fn: '', ap: '', lm: '', KAPR: '90', kc: '', kc10: '', mc: '' },
    milling: { Dcap: '', n: '', vc: '', fz: '', zc: '', vf: '', ae: '', ap: '', kc: '' },
    drilling: { DC: '', n: '', vc: '', fn: '', kc: '' },
    boring: { DC: '', ap: '', fn: '', fz: '', zc: '', n: '', vc: '', kc: '' },
    tolerance: { D: '', shaft: '0', hole: '0', round: '3' }
};

const CalcInput = ({ id, label, unit, value, onChange, type = 'number', step = 'any' }: { id: string, label: string, unit: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, type?: string, step?: string }) => (
    <div>
        <label htmlFor={id} className="mb-1 block text-sm font-semibold text-cnk-txt-secondary-light">{label} <span className="text-cnk-txt-muted-light">({unit})</span></label>
        <Input id={id} name={id} value={value} onChange={onChange} type={type} step={step} className="p-2" containerClassName="mb-0" />
    </div>
);

const CalcOutput = ({ label, value, unit }: { label: string, value: string, unit: string }) => (
    <div className="rounded-cnk-element border border-cnk-border-light bg-cnk-bg-light p-3 text-center">
        <p className="text-sm text-cnk-txt-secondary-light">{label}</p>
        <p className="text-xl font-bold text-cnk-accent-primary">{value || '–'}</p>
        <p className="text-xs text-cnk-txt-muted-light">{unit}</p>
    </div>
);


const CalculationToolsPage = () => {
    const savedState = useLiveQuery(() => db.calculatorState.get('default'));
    const history = useLiveQuery(() => db.calculationHistory.orderBy('timestamp').reverse().limit(200).toArray(), []);

    const [unit, setUnit] = useState<'metric' | 'inch'>('metric');
    const [activeTab, setActiveTab] = useState('turning');
    const [inputs, setInputs] = useState(DEFAULT_INPUTS);
    const [outputs, setOutputs] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        if (savedState) {
            setUnit(savedState.unit);
            setActiveTab(savedState.activeTab);
            const mergedInputs = JSON.parse(JSON.stringify(DEFAULT_INPUTS));
            for (const tab in savedState.inputs) {
                if (mergedInputs[tab]) {
                    for (const field in savedState.inputs[tab]) {
                        if (field in mergedInputs[tab]) {
                            mergedInputs[tab][field] = savedState.inputs[tab][field];
                        }
                    }
                }
            }
            setInputs(mergedInputs);
        }
    }, [savedState]);

    const saveState = useCallback(debounce(async (state: Omit<CalculatorState, 'id'>) => {
        await db.calculatorState.put({ id: 'default', ...state });
    }, 500), []);

    useEffect(() => {
        saveState({ unit, activeTab, inputs });
    }, [unit, activeTab, inputs, saveState]);
    
    const handleInputChange = (tab: string, field: string, value: string) => {
        setInputs(prev => ({ ...prev, [tab]: { ...prev[tab], [field]: value }}));
    };

    const addHistory = async (module: string, summary: string) => {
        const item: Omit<CalculationHistoryItem, 'id'> = { timestamp: Date.now(), module, unit, summary };
        await db.calculationHistory.add(item as CalculationHistoryItem);
    };

    const clearHistory = async () => {
        await db.calculationHistory.clear();
    };

    const toNum = (v: string) => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : NaN; };
    const rad = (deg: number) => deg * Math.PI / 180;
    const fmt = (x: number, digits = 4) => Number.isFinite(x) ? (Math.abs(x) >= 1 ? x.toFixed(digits) : x.toPrecision(3)) : '–';

    const calculate = useCallback((tab: string) => {
        let o: Record<string, any> = {};
        const VFactor = unit === 'metric' ? 1000 : 12;

        if (tab === 'turning') {
            const i = inputs.turning;
            const Dm = toNum(i.Dm), fn = toNum(i.fn), ap = toNum(i.ap), lm = toNum(i.lm);
            let n = toNum(i.n), vc = toNum(i.vc), KAPR = toNum(i.KAPR), kc = toNum(i.kc);
            if (Number.isFinite(vc) && Number.isFinite(Dm)) n = (vc * VFactor) / (Math.PI * Dm);
            else if (Number.isFinite(n) && Number.isFinite(Dm)) vc = (Math.PI * Dm * n) / VFactor;
            
            o.n = n; o.vc = vc;
            const hm = (Number.isFinite(fn) && Number.isFinite(KAPR)) ? (fn * Math.sin(rad(KAPR))) : NaN;
            o.hm = hm;
            if(Number.isFinite(toNum(i.kc10)) && Number.isFinite(toNum(i.mc)) && Number.isFinite(hm)) {
                 kc = toNum(i.kc10) * Math.pow(hm, toNum(i.mc)) * (1 - toNum(i.mc)/100);
            }

            if (unit === 'metric') {
                o.Q = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn)) ? (vc * ap * fn) : NaN;
                o.Pc = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn) && Number.isFinite(kc)) ? (vc * ap * fn * kc) / (60e3) : NaN;
            } else {
                o.Q = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn)) ? (vc * ap * fn * 12) : NaN;
                o.Pc = (Number.isFinite(vc) && Number.isFinite(ap) && Number.isFinite(fn) && Number.isFinite(kc)) ? (vc * ap * fn * kc) / (33e3) : NaN;
            }
            o.Tc = (Number.isFinite(lm) && Number.isFinite(fn) && Number.isFinite(n)) ? (lm / (fn * n)) : NaN;
            addHistory('Tornalama', `Dm=${Dm}, n=${fmt(n)}, vc=${fmt(vc)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }
        
        if (tab === 'milling') {
            const i = inputs.milling;
            const Dcap=toNum(i.Dcap), zc=toNum(i.zc), fz=toNum(i.fz), vf_in=toNum(i.vf), ae=toNum(i.ae), ap=toNum(i.ap), kc=toNum(i.kc);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(Dcap)) n = (vc * VFactor)/(Math.PI*Dcap); else if(Number.isFinite(n) && Number.isFinite(Dcap)) vc = (Math.PI*Dcap*n)/VFactor;
            o.n = n; o.vc = vc;

            let vf; if(Number.isFinite(fz) && Number.isFinite(n) && Number.isFinite(zc)) vf = fz*n*zc; else vf = vf_in;
            o.vf = vf;

            if(unit==='metric'){
                o.Q = (Number.isFinite(ap)&&Number.isFinite(ae)&&Number.isFinite(vf)) ? (ap*ae*vf/1000) : NaN;
                o.Pc = (Number.isFinite(ae)&&Number.isFinite(ap)&&Number.isFinite(vf)&&Number.isFinite(kc)) ? (ae*ap*vf*kc)/(60e6) : NaN;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN;
            } else {
                o.Q = (Number.isFinite(ap)&&Number.isFinite(ae)&&Number.isFinite(vf)) ? (ap*ae*vf) : NaN;
                o.Pc = (Number.isFinite(ae)&&Number.isFinite(ap)&&Number.isFinite(vf)&&Number.isFinite(kc)) ? (ae*ap*vf*kc)/(396e3) : NaN;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN;
            }
            addHistory('Frezeleme', `Dcap=${Dcap}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }

        if (tab === 'drilling') {
            const i = inputs.drilling;
            const DC=toNum(i.DC), fn=toNum(i.fn), kc=toNum(i.kc);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(DC)) n = (vc * VFactor)/(Math.PI*DC); else if(Number.isFinite(n) && Number.isFinite(DC)) vc = (Math.PI*DC*n)/VFactor;
            o.n = n; o.vc = vc;
            o.vf = (Number.isFinite(fn)&&Number.isFinite(n)) ? (fn*n) : NaN;

            if(unit==='metric'){
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn/4) : NaN;
                o.Pc = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*DC*fn*kc)/(240e3) : NaN;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN;
            } else {
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn*3) : NaN;
                o.Pc = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*DC*fn*kc)/(132e3) : NaN;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN;
            }
            addHistory('Delik Delme', `DC=${DC}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(o.vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }

        if (tab === 'boring') {
            const i = inputs.boring;
            const DC=toNum(i.DC), ap=toNum(i.ap), kc=toNum(i.kc);
            let fn = toNum(i.fn);
            if(!Number.isFinite(fn) && Number.isFinite(toNum(i.fz)) && Number.isFinite(toNum(i.zc))) fn = toNum(i.zc)*toNum(i.fz);
            let n=toNum(i.n), vc=toNum(i.vc);
            if(Number.isFinite(vc) && Number.isFinite(DC)) n = (vc * VFactor)/(Math.PI*DC); else if(Number.isFinite(n) && Number.isFinite(DC)) vc = (Math.PI*DC*n)/VFactor;
            o.n=n; o.vc=vc;
            o.vf = (Number.isFinite(fn)&&Number.isFinite(n))? fn*n : NaN;
            
            if(unit==='metric'){
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn/4) : NaN;
                let base = (Number.isFinite(vc)&&Number.isFinite(ap)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*ap*fn*kc)/(60e3) : NaN;
                o.Pc = (Number.isFinite(base) && Number.isFinite(ap) && Number.isFinite(DC)) ? base * (1 - ap/DC) : base;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*30e3)/n : NaN;
            } else {
                o.Q = (Number.isFinite(vc)&&Number.isFinite(DC)&&Number.isFinite(fn)) ? (vc*DC*fn*3) : NaN;
                let base = (Number.isFinite(vc)&&Number.isFinite(ap)&&Number.isFinite(fn)&&Number.isFinite(kc)) ? (vc*ap*fn*kc)/(132e3) : NaN;
                o.Pc = (Number.isFinite(base) && Number.isFinite(ap) && Number.isFinite(DC)) ? base * (1 - ap/DC) : base;
                o.Mc = (Number.isFinite(o.Pc)&&Number.isFinite(n)) ? (o.Pc*16501)/n : NaN;
            }
            addHistory('Boring', `DC=${DC}, n=${fmt(n)}, vc=${fmt(vc)}, vf=${fmt(o.vf)}, Q=${fmt(o.Q)}, Pc=${fmt(o.Pc)}`);
        }
        
        if (tab === 'tolerance') {
            const i = inputs.tolerance;
            const IT_MULT: Record<number, number> = {5:7,6:10,7:16,8:25,9:40,10:64,11:100,12:160,13:250,14:400,15:640,16:1000};
            const parseSel = (v: string) => { if(!v||v==='0') return null; const m = String(v).trim().match(/^([A-Za-z]{1,2})(\d{1,2})$/); if(!m) return null; return {zone:m[1], grade:parseInt(m[2],10)}; };
            const iUnit = (D: number) => 0.45*Math.cbrt(D) + 0.001*D;
            const IT = (D: number, grade: number) => { const k = IT_MULT[grade]; return k? iUnit(D)*k : NaN; };
            const holeDev = (zone: string, T: number) => { if(zone==='H') return {ES:+T, EI:0}; if(zone==='JS') return {ES:+T/2, EI:-T/2}; return null; };
            const shaftDev = (zone: string, T: number) => { if(zone==='h') return {es:0, ei:-T}; if(zone==='js') return {es:+T/2, ei:-T/2}; return null; };
            const fmtMM = (x: number, dec: number) => { if(!isFinite(x)) return '-'; const p=Math.pow(10,dec); return (Math.round(x*p)/p).toFixed(dec); };

            const D = toNum(i.D);
            const dec = parseInt(i.round, 10);
            const sSel = parseSel(i.shaft);
            const hSel = parseSel(i.hole);
            
            if (D > 0 && sSel && hSel) {
                const Ts = IT(D, sSel.grade), Th = IT(D, hSel.grade);
                if (isFinite(Ts) && isFinite(Th)) {
                    const s = shaftDev(sSel.zone, Ts);
                    const h = holeDev(hSel.zone, Th);
                    if (s && h) {
                        o = {
                            mil_tol_u: Math.round(s.es), mil_tol_a: Math.round(s.ei),
                            delik_tol_u: Math.round(h.ES), delik_tol_a: Math.round(h.EI),
                        };
                        const es = s.es/1000, ei = s.ei/1000, ES = h.ES/1000, EI = h.EI/1000;
                        const shaftMax = D + es, shaftMin = D + ei;
                        const holeMax = D + ES, holeMin = D + EI;
                        o = { ...o,
                            mil_max_dia: fmtMM(shaftMax, dec), mil_min_dia: fmtMM(shaftMin, dec),
                            delik_max_dia: fmtMM(holeMax, dec), delik_min_dia: fmtMM(holeMin, dec),
                        };
                        const clrMax = holeMax - shaftMin, clrMin = holeMin - shaftMax;
                        const intMin = Math.max(0, shaftMax - holeMin);
                        o = { ...o, clrMax: fmtMM(clrMax, dec), clrMin: fmtMM(clrMin, dec), intMin: fmtMM(intMin, dec)};

                        if(clrMin >= 0) o.fitText='Boşluklu uyum (clearance fit)';
                        else if(clrMax <= 0) o.fitText='Sıkı geçme (interference fit)';
                        else o.fitText='Geçişli uyum (transition fit)';
                        
                        addHistory('Tolerans', `D=${D}, ${sSel.zone}${sSel.grade}/${hSel.zone}${hSel.grade}, ES/EI=${o.delik_tol_u}/${o.delik_tol_a} µm`);
                    }
                }
            }
        }

        setOutputs(prev => ({...prev, [tab]: Object.keys(o).reduce((acc, key) => ({...acc, [key]: typeof o[key] === 'number' ? fmt(o[key]) : o[key] }), {})}));
    }, [inputs, unit]);
    
    useEffect(() => {
        if (activeTab === 'tolerance') {
            const i = inputs.tolerance;
            if (toNum(i.D) > 0 && i.shaft !== '0' && i.hole !== '0') {
                calculate('tolerance');
            }
        }
    }, [inputs.tolerance, activeTab, calculate]);

    const tabs = [
        { id: 'turning', label: 'Tornalama' },
        { id: 'milling', label: 'Frezeleme' },
        { id: 'drilling', label: 'Delik Delme' },
        { id: 'boring', label: 'Raybalama/Boring' },
        { id: 'tolerance', label: 'Tolerans (ISO 286)' }
    ];

    const o = outputs[activeTab] || {};

    const historyColumns = [
        { header: 'Zaman', accessor: (item: CalculationHistoryItem) => new Date(item.timestamp).toLocaleString() },
        { header: 'Modül', accessor: (item: CalculationHistoryItem) => <span className="bg-cnk-bg-light px-2 py-1 rounded-full text-xs font-medium">{item.module}</span> },
        { header: 'Birim', accessor: (item: CalculationHistoryItem) => item.unit === 'metric' ? 'SI' : 'İnç' },
        { header: 'Özet', accessor: (item: CalculationHistoryItem) => <span className="text-cnk-txt-muted-light text-xs font-mono">{item.summary}</span> },
    ];
    
    const units = unit === 'metric' 
        ? { D: 'mm', vc: 'm/dk', fn: 'mm/dev', ap: 'mm', lm: 'mm', fz: 'mm', vf: 'mm/dk', ae: 'mm', Q: 'cm³/dk', Pc: 'kW', Tc: 'dk', hm: 'mm', Mc: 'Nm' }
        : { D: 'in', vc: 'ft/dk', fn: 'in/rev', ap: 'in', lm: 'in', fz: 'in', vf: 'in/dk', ae: 'in', Q: 'in³/dk', Pc: 'HP', Tc: 'min', hm: 'in', Mc: 'lbf·ft' };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 justify-between items-center">
                <h1 className="text-2xl font-bold">İmalat Hesaplayıcı</h1>
                <div className="flex items-center gap-4 bg-cnk-panel-light p-2 rounded-cnk-element border border-cnk-border-light">
                    <span className="text-sm font-medium text-cnk-txt-secondary-light">Birim:</span>
                    <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="units" value="metric" checked={unit === 'metric'} onChange={() => setUnit('metric')} /> Metrik (SI)</label>
                        <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="units" value="inch" checked={unit === 'inch'} /> İnç</label>
                    </div>
                </div>
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-cnk-card shadow-md">
                <div className="flex flex-wrap gap-2 border-b border-cnk-border-light mb-4">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} 
                                className={`px-4 py-2 text-sm font-medium rounded-t-cnk-element -mb-px ${activeTab === tab.id ? 'border border-cnk-border-light border-b-white text-cnk-accent-primary' : 'text-cnk-txt-muted-light hover:bg-cnk-bg-light'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
                
                 {activeTab !== 'tolerance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        <div>
                            <h3 className="font-bold text-lg mb-4">Giriş Değerleri</h3>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeTab === 'turning' && <>
                                    <CalcInput id="Dm" label="İşlenen Çap" unit={units.D} value={inputs.turning.Dm} onChange={e => handleInputChange('turning', 'Dm', e.target.value)} />
                                    <CalcInput id="n" label="Devir" unit="rpm" value={inputs.turning.n} onChange={e => handleInputChange('turning', 'n', e.target.value)} />
                                    <CalcInput id="vc" label="Kesme Hızı" unit={units.vc} value={inputs.turning.vc} onChange={e => handleInputChange('turning', 'vc', e.target.value)} />
                                    <CalcInput id="fn" label="Devir Başına İlerleme" unit={units.fn} value={inputs.turning.fn} onChange={e => handleInputChange('turning', 'fn', e.target.value)} />
                                    <CalcInput id="ap" label="Talaş Derinliği" unit={units.ap} value={inputs.turning.ap} onChange={e => handleInputChange('turning', 'ap', e.target.value)} />
                                    <CalcInput id="lm" label="İşleme Uzunluğu" unit={units.lm} value={inputs.turning.lm} onChange={e => handleInputChange('turning', 'lm', e.target.value)} />
                                    <CalcInput id="KAPR" label="Giriş Açısı" unit="°" value={inputs.turning.KAPR} onChange={e => handleInputChange('turning', 'KAPR', e.target.value)} />
                                    <CalcInput id="kc" label="Kesme Kuvveti Katsayısı" unit={unit === 'metric' ? 'N/mm²' : 'lbf/in²'} value={inputs.turning.kc} onChange={e => handleInputChange('turning', 'kc', e.target.value)} />
                                </>}
                                {activeTab === 'milling' && <>
                                    <CalcInput id="Dcap" label="ap derinliğindeki çap" unit={units.D} value={inputs.milling.Dcap} onChange={e => handleInputChange('milling', 'Dcap', e.target.value)} />
                                    <CalcInput id="n" label="Devir" unit="rpm" value={inputs.milling.n} onChange={e => handleInputChange('milling', 'n', e.target.value)} />
                                    <CalcInput id="vc" label="Kesme Hızı" unit={units.vc} value={inputs.milling.vc} onChange={e => handleInputChange('milling', 'vc', e.target.value)} />
                                    <CalcInput id="fz" label="Diş Başına İlerleme" unit={units.fz} value={inputs.milling.fz} onChange={e => handleInputChange('milling', 'fz', e.target.value)} />
                                    <CalcInput id="zc" label="Diş Adedi" unit="pcs" value={inputs.milling.zc} onChange={e => handleInputChange('milling', 'zc', e.target.value)} type="number" step="1" />
                                    <CalcInput id="vf" label="Tabla İlerlemesi" unit={units.vf} value={inputs.milling.vf} onChange={e => handleInputChange('milling', 'vf', e.target.value)} />
                                    <CalcInput id="ae" label="Yanaldan Eşg." unit={units.ae} value={inputs.milling.ae} onChange={e => handleInputChange('milling', 'ae', e.target.value)} />
                                    <CalcInput id="ap" label="Talaş Derinliği" unit={units.ap} value={inputs.milling.ap} onChange={e => handleInputChange('milling', 'ap', e.target.value)} />
                                    <CalcInput id="kc" label="Kesme Kuvveti Katsayısı" unit={unit === 'metric' ? 'N/mm²' : 'lbf/in²'} value={inputs.milling.kc} onChange={e => handleInputChange('milling', 'kc', e.target.value)} />
                                </>}
                                {activeTab === 'drilling' && <>
                                    <CalcInput id="DC" label="Matkap Çapı" unit={units.D} value={inputs.drilling.DC} onChange={e => handleInputChange('drilling', 'DC', e.target.value)} />
                                    <CalcInput id="n" label="Devir" unit="rpm" value={inputs.drilling.n} onChange={e => handleInputChange('drilling', 'n', e.target.value)} />
                                    <CalcInput id="vc" label="Kesme Hızı" unit={units.vc} value={inputs.drilling.vc} onChange={e => handleInputChange('drilling', 'vc', e.target.value)} />
                                    <CalcInput id="fn" label="Devir Başına İlerleme" unit={units.fn} value={inputs.drilling.fn} onChange={e => handleInputChange('drilling', 'fn', e.target.value)} />
                                    <CalcInput id="kc" label="Kesme Kuvveti Katsayısı" unit={unit === 'metric' ? 'N/mm²' : 'lbf/in²'} value={inputs.drilling.kc} onChange={e => handleInputChange('drilling', 'kc', e.target.value)} />
                                </>}
                                {activeTab === 'boring' && <>
                                     <CalcInput id="DC" label="Delik Çapı" unit={units.D} value={inputs.boring.DC} onChange={e => handleInputChange('boring', 'DC', e.target.value)} />
                                     <CalcInput id="ap" label="Talaş Derinliği" unit={units.ap} value={inputs.boring.ap} onChange={e => handleInputChange('boring', 'ap', e.target.value)} />
                                     <CalcInput id="fn" label="Devir Başına İlerleme" unit={units.fn} value={inputs.boring.fn} onChange={e => handleInputChange('boring', 'fn', e.target.value)} />
                                     <CalcInput id="fz" label="Diş Başına İlerleme (ops.)" unit={units.fz} value={inputs.boring.fz} onChange={e => handleInputChange('boring', 'fz', e.target.value)} />
                                     <CalcInput id="zc" label="Diş Adedi (ops.)" unit="pcs" value={inputs.boring.zc} onChange={e => handleInputChange('boring', 'zc', e.target.value)} type="number" step="1" />
                                     <CalcInput id="n" label="Devir" unit="rpm" value={inputs.boring.n} onChange={e => handleInputChange('boring', 'n', e.target.value)} />
                                     <CalcInput id="vc" label="Kesme Hızı" unit={units.vc} value={inputs.boring.vc} onChange={e => handleInputChange('boring', 'vc', e.target.value)} />
                                     <CalcInput id="kc" label="Kesme Kuvveti Katsayısı" unit={unit === 'metric' ? 'N/mm²' : 'lbf/in²'} value={inputs.boring.kc} onChange={e => handleInputChange('boring', 'kc', e.target.value)} />
                                </>}
                            </div>
                            <Button onClick={() => calculate(activeTab)} className="mt-4" icon="fas fa-calculator">Hesapla</Button>
                        </div>
                         <div>
                            <h3 className="font-bold text-lg mb-4">Hesaplanan Değerler</h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {activeTab === 'turning' && <>
                                    <CalcOutput label="Devir" value={o.n} unit="rpm" />
                                    <CalcOutput label="Kesme Hızı" value={o.vc} unit={units.vc} />
                                    <CalcOutput label="Talaş Kaldırma Hacmi" value={o.Q} unit={units.Q} />
                                    <CalcOutput label="Net Güç" value={o.Pc} unit={units.Pc} />
                                    <CalcOutput label="İşleme Süresi" value={o.Tc} unit={units.Tc} />
                                    <CalcOutput label="Ort. Talaş Kalınlığı" value={o.hm} unit={units.hm} />
                                </>}
                                 {activeTab === 'milling' && <>
                                    <CalcOutput label="Devir" value={o.n} unit="rpm" />
                                    <CalcOutput label="Kesme Hızı" value={o.vc} unit={units.vc} />
                                    <CalcOutput label="Tabla İlerlemesi" value={o.vf} unit={units.vf} />
                                    <CalcOutput label="Talaş Kaldırma Hacmi" value={o.Q} unit={units.Q} />
                                    <CalcOutput label="Net Güç" value={o.Pc} unit={units.Pc} />
                                    <CalcOutput label="Tork" value={o.Mc} unit={units.Mc} />
                                </>}
                                {activeTab === 'drilling' && <>
                                    <CalcOutput label="Devir" value={o.n} unit="rpm" />
                                    <CalcOutput label="Kesme Hızı" value={o.vc} unit={units.vc} />
                                    <CalcOutput label="Delme İlerlemesi" value={o.vf} unit={units.vf} />
                                    <CalcOutput label="Talaş Kaldırma Hacmi" value={o.Q} unit={units.Q} />
                                    <CalcOutput label="Net Güç" value={o.Pc} unit={units.Pc} />
                                    <CalcOutput label="Tork" value={o.Mc} unit={units.Mc} />
                                </>}
                                {activeTab === 'boring' && <>
                                    <CalcOutput label="Devir" value={o.n} unit="rpm" />
                                    <CalcOutput label="Kesme Hızı" value={o.vc} unit={units.vc} />
                                    <CalcOutput label="İlerleme" value={o.vf} unit={units.vf} />
                                    <CalcOutput label="Talaş Kaldırma Hacmi" value={o.Q} unit={units.Q} />
                                    <CalcOutput label="Net Güç" value={o.Pc} unit={units.Pc} />
                                    <CalcOutput label="Tork" value={o.Mc} unit={units.Mc} />
                                </>}
                            </div>
                        </div>
                    </div>
                )}
                 {activeTab === 'tolerance' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Inputs */}
                        <div className="space-y-4">
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <CalcInput id="D" label="Nominal çap D" unit="mm" value={inputs.tolerance.D} onChange={e => handleInputChange('tolerance', 'D', e.target.value)} />
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-cnk-txt-secondary-light">Yuvarlama (mm)</label>
                                    <select value={inputs.tolerance.round} onChange={e => handleInputChange('tolerance', 'round', e.target.value)} className="w-full rounded-cnk-element border border-cnk-border-light p-2 shadow-sm">
                                        <option value="3">3 ondalık</option><option value="2">2 ondalık</option><option value="4">4 ondalık</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-cnk-txt-secondary-light">Mil toleransı</label>
                                    <select value={inputs.tolerance.shaft} onChange={e => handleInputChange('tolerance', 'shaft', e.target.value)} className="w-full rounded-cnk-element border border-cnk-border-light p-2 shadow-sm">
                                        <option value="0">Seçiniz</option>
                                        {['h','js'].flatMap(z => [5,6,7,8,9,10,11,12,13,14,15,16].map(g => <option key={z+g} value={z+g}>{z+g}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-semibold text-cnk-txt-secondary-light">Delik toleransı</label>
                                    <select value={inputs.tolerance.hole} onChange={e => handleInputChange('tolerance', 'hole', e.target.value)} className="w-full rounded-cnk-element border border-cnk-border-light p-2 shadow-sm">
                                        <option value="0">Seçiniz</option>
                                        {['H','JS'].flatMap(z => [5,6,7,8,9,10,11,12,13,14,15,16].map(g => <option key={z+g} value={z+g}>{z+g}</option>))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        {/* Outputs */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-blue-500/10 p-4 rounded-cnk-element">
                                    <h4 className="font-bold text-blue-800">Mil Ölçüleri</h4>
                                    <p>Max: <b>{o.mil_max_dia || '-'}</b> mm</p><p>Min: <b>{o.mil_min_dia || '-'}</b> mm</p>
                                    <p>es: <b>{o.mil_tol_u || '-'}</b> µm</p><p>ei: <b>{o.mil_tol_a || '-'}</b> µm</p>
                                </div>
                                <div className="bg-red-500/10 p-4 rounded-cnk-element">
                                    <h4 className="font-bold text-red-800">Delik Ölçüleri</h4>
                                    <p>Max: <b>{o.delik_max_dia || '-'}</b> mm</p><p>Min: <b>{o.delik_min_dia || '-'}</b> mm</p>
                                    <p>ES: <b>{o.delik_tol_u || '-'}</b> µm</p><p>EI: <b>{o.delik_tol_a || '-'}</b> µm</p>
                                </div>
                            </div>
                             <div className="bg-green-500/10 p-4 rounded-cnk-element">
                                <h4 className="font-bold text-green-800 mb-2">Uygunluk</h4>
                                <div className="flex flex-wrap gap-2 text-sm">
                                    <p>Maks. boşluk: <b>{o.clrMax || '-'}</b> mm</p>
                                    <p>Min. boşluk: <b>{o.clrMin || '-'}</b> mm</p>
                                    <p>Min. sıkılık: <b>{o.intMin || '-'}</b> mm</p>
                                </div>
                                <p className="mt-2 font-bold text-green-900">{o.fitText || '-'}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-cnk-panel-light p-4 rounded-cnk-card shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Hesap Geçmişi</h3>
                    <Button onClick={clearHistory} variant="danger" size="sm" icon="fas fa-trash">Geçmişi Temizle</Button>
                </div>
                <DataTable columns={historyColumns} data={history || []} emptyStateMessage="Hesaplama geçmişi boş." />
            </div>
        </div>
    );
};

export default CalculationToolsPage;