import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Check, AlertCircle, ChevronDown, Sparkles } from 'lucide-react';
import { findSimilarSectors, normalizeText } from '../../utils/fuzzySearch';

interface PredictiveSectorInputProps {
  value: string;
  onChange: (sector: string) => void;
  sectors: string[];
  placeholder?: string;
  required?: boolean;
}

export const PredictiveSectorInput: React.FC<PredictiveSectorInputProps> = ({
  value,
  onChange,
  sectors,
  placeholder = 'Escriba o busque el sector de la comunidad...',
  required = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normInput = normalizeText(inputValue);
  const isExactMatch = sectors.some((s) => normalizeText(s) === normInput);

  // Calculate suggestions
  const suggestions = inputValue.trim().length > 0
    ? findSimilarSectors(inputValue, sectors, 8)
    : sectors.slice(0, 10).map((s) => ({ sector: s, isExactOrPrefix: true, score: 1.0 }));

  const exactOrPrefix = suggestions.filter((s) => s.isExactOrPrefix);
  const fuzzySimilar = suggestions.filter((s) => !s.isExactOrPrefix && s.score >= 0.45);

  const handleSelect = (sector: string) => {
    setInputValue(sector);
    onChange(sector);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        <input
          type="text"
          required={required}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border rounded-xl focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 font-medium transition-all ${
            isExactMatch
              ? 'border-emerald-400 dark:border-emerald-600 focus:border-emerald-500 ring-1 ring-emerald-400/20'
              : inputValue.trim().length > 1
              ? 'border-amber-400 dark:border-amber-600 focus:border-amber-500'
              : 'border-slate-200 dark:border-slate-700 focus:border-blue-600'
          }`}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 transition-colors"
          title="Ver todos los sectores"
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Validation status badge */}
      <div className="mt-1.5 flex items-center justify-between text-[11px]">
        {isExactMatch ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Check className="w-3.5 h-3.5" />
            Sector oficial verificado en base de datos
          </span>
        ) : inputValue.trim().length > 1 ? (
          <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Sector no exacto. Revise las sugerencias similares abajo para seleccionar el oficial
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Texto predictivo cargado en sistema ({sectors.length} sectores oficiales)
          </span>
        )}
      </div>

      {/* Predictive & Fuzzy Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-2 space-y-2">
          {suggestions.length === 0 ? (
            <div className="p-3 text-center text-xs text-slate-500 dark:text-slate-400">
              No se encontraron sectores similares a "{inputValue}".
            </div>
          ) : (
            <>
              {/* Direct or prefix matches */}
              {exactOrPrefix.length > 0 && (
                <div>
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Search className="w-3 h-3 text-blue-500" />
                    Coincidencias predictivas
                  </div>
                  <div className="space-y-1 mt-0.5">
                    {exactOrPrefix.map((item) => (
                      <button
                        key={item.sector}
                        type="button"
                        onClick={() => handleSelect(item.sector)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                          normalizeText(item.sector) === normInput
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          {item.sector}
                        </span>
                        {normalizeText(item.sector) === normInput && (
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fuzzy / Similar Suggestions for Typos */}
              {fuzzySimilar.length > 0 && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Sugerencias similares (por si escribió con error)
                  </div>
                  <div className="space-y-1 mt-0.5">
                    {fuzzySimilar.map((item) => (
                      <button
                        key={item.sector}
                        type="button"
                        onClick={() => handleSelect(item.sector)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-800 dark:text-slate-200 transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="font-semibold text-amber-950 dark:text-amber-200">
                            {item.sector}
                          </span>
                        </span>
                        <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 px-2 py-0.5 rounded-full font-mono font-semibold">
                          Similar {Math.round(item.score * 100)}%
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};
