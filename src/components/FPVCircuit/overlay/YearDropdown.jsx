import React from 'react';
import { useFPVCircuit } from '../FPVCircuitProvider';
import { setTargetProgress } from '../utils/progress';

export const YearDropdown = () => {
  const { availableYears, selectedYear, setSelectedYear } = useFPVCircuit();

  if (!availableYears || availableYears.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '40px',
      right: '40px',
      zIndex: 2000,
      fontFamily: "'Inter', sans-serif"
    }}>
      <select
        value={selectedYear || ''}
        onChange={(e) => {
          setSelectedYear(e.target.value);
          // Reset flight progress to start of track
          setTargetProgress(0);
        }}
        style={{
          appearance: 'none',
          background: 'rgba(11, 18, 32, 0.8)',
          border: '1px solid #1E293B',
          color: '#E5E7EB',
          padding: '12px 40px 12px 20px',
          fontSize: '18px',
          fontWeight: '600',
          letterSpacing: '2px',
          borderRadius: '8px',
          outline: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(10px)',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2360A5FA' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 15px center',
          backgroundSize: '16px'
        }}
      >
        {availableYears.map(year => (
          <option key={year} value={year} style={{ background: '#0B1220' }}>
            {year} EXHIBITION
          </option>
        ))}
      </select>
    </div>
  );
};
