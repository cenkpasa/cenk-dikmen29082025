import { TimesheetEntry, PayrollData, User } from '@/types';

// Note: These are simplified rates and brackets for demonstration purposes.
// A real application would use up-to-date, detailed tables and handle exemptions.
const SGK_WORKER_RATE = 0.14;
const UNEMPLOYMENT_WORKER_RATE = 0.01;
const SGK_EMPLOYER_RATE = 0.205; 
const UNEMPLOYMENT_EMPLOYER_RATE = 0.02;
const STAMP_TAX_RATE = 0.00759;

// Simplified income tax brackets for 2024
const INCOME_TAX_BRACKETS = [
    { limit: 110000, rate: 0.15 },
    { limit: 230000, rate: 0.20 },
    { limit: 870000, rate: 0.27 },
    { limit: 3000000, rate: 0.35 },
    { limit: Infinity, rate: 0.40 },
];

export const calculatePayroll = (timesheet: TimesheetEntry[], user: User): PayrollData | null => {
    if (!user.salary || user.salary <= 0) {
        return null;
    }
    
    // For this simulation, we'll assume the base salary is for the full month's work.
    // A more complex calculation would adjust the gross salary based on missing hours.
    const grossSalary = user.salary;

    // Calculate deductions
    const sgkWorkerShare = grossSalary * SGK_WORKER_RATE;
    const unemploymentWorkerShare = grossSalary * UNEMPLOYMENT_WORKER_RATE;
    const totalWorkerDeductions = sgkWorkerShare + unemploymentWorkerShare;

    const incomeTaxBase = grossSalary - totalWorkerDeductions;
    
    // Simplified cumulative tax base calculation (should be tracked across months in a real app)
    const cumulativeTaxBase = incomeTaxBase * (new Date().getMonth() + 1); 
    
    let incomeTax = 0;
    let remainingBase = incomeTaxBase;
    let cumulativeRemaining = cumulativeTaxBase - incomeTaxBase;

    for (const bracket of INCOME_TAX_BRACKETS) {
        if (cumulativeRemaining < bracket.limit) {
            const taxableInBracket = Math.min(remainingBase, bracket.limit - cumulativeRemaining);
            incomeTax += taxableInBracket * bracket.rate;
            remainingBase -= taxableInBracket;
            if (remainingBase <= 0) break;
            cumulativeRemaining += taxableInBracket;
        }
    }

    const stampTax = grossSalary * STAMP_TAX_RATE;

    const netSalary = grossSalary - sgkWorkerShare - unemploymentWorkerShare - incomeTax - stampTax;

    // Calculate employer costs
    const sgkEmployerShare = grossSalary * SGK_EMPLOYER_RATE;
    const unemploymentEmployerShare = grossSalary * UNEMPLOYMENT_EMPLOYER_RATE;
    const totalEmployerCost = grossSalary + sgkEmployerShare + unemploymentEmployerShare;

    return {
        grossSalary,
        sgkWorkerShare,
        unemploymentWorkerShare,
        incomeTaxBase,
        incomeTax,
        stampTax,
        netSalary,
        sgkEmployerShare,
        unemploymentEmployerShare,
        totalEmployerCost,
    };
};
