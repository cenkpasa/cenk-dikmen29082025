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
            o.Tc = (Number