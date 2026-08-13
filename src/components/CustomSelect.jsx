import React, { useState, useRef, useEffect } from 'react';

export default function CustomSelect({ 
  value, 
  onChange, 
  options = [], 
  placeholder = 'Select an option', 
  disabled = false, 
  className = '',
  searchable = false,
  showTypeFilters = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('MCQ'); // MCQ, CODING, DESCRIPTIVE
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset search and filter when closed/opened
  useEffect(() => {
    if (isOpen) {
      if (selectedOption?.setType) {
        setActiveFilter(selectedOption.setType.toUpperCase());
      } else {
        setActiveFilter('MCQ');
      }
    } else {
      setSearchQuery('');
    }
  }, [isOpen, selectedOption]);

  // Filter options based on search and type tabs
  const filteredOptions = options.filter(opt => {
    const matchesSearch = (opt.label || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (opt.value || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const optType = (opt.setType || 'MCQ').toUpperCase();
    const matchesFilter = optType === activeFilter;

    return matchesSearch && matchesFilter;
  });

  const getBadgeColor = (type) => {
    switch (type) {
      case 'CODING':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'DESCRIPTIVE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    }
  };

  return (
    <div ref={dropdownRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 bg-white border rounded-xl text-xs font-semibold shadow-xs transition-all ${
          isOpen
            ? 'border-[#0B4A99] ring-2 ring-[#0B4A99]/15 shadow-sm'
            : 'border-slate-200 hover:border-slate-300'
        } ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'}`}
      >
        <div className="flex items-center space-x-2 truncate">
          {selectedOption?.setType && (
            <span className={`px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase border ${getBadgeColor(selectedOption.setType)}`}>
              {selectedOption.setType}
            </span>
          )}
          <span className={selectedOption ? 'text-slate-800 font-semibold truncate' : 'text-slate-400 font-medium truncate'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#0B4A99]' : 'text-slate-400'} flex-shrink-0 ml-2`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Options Menu Popover */}
      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-[990] bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 space-y-1.5 animate-fade-in max-h-72 flex flex-col">
          
          {/* Search Input */}
          {searchable && (
            <div className="px-1.5 pt-1.5">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search sets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 pl-7 text-[11px] font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1.5 focus:ring-[#0B4A99] focus:border-[#0B4A99] transition-all"
                />
                <div className="absolute left-2.5 top-2.5 text-slate-400">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
          )}

          {/* Type Filter Tabs */}
          {showTypeFilters && (
            <div className="flex border-b border-slate-100 pb-1 px-1.5 space-x-1">
              {['MCQ', 'CODING', 'DESCRIPTIVE'].map((filter) => (
                <button
                  key={filter}
                  type="button"
                  onClick={() => setActiveFilter(filter)}
                  className={`px-2 py-1 rounded-md text-[9px] font-extrabold uppercase transition-all tracking-wider ${
                    activeFilter === filter
                      ? 'bg-[#0B4A99] text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          )}

          {/* Scrollable list of items */}
          <div className="overflow-y-auto flex-1 max-h-48 space-y-0.5">
            {filteredOptions.length === 0 ? (
              <p className="text-[10px] text-slate-400 text-center py-4 font-medium">
                No matching question sets found.
              </p>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      if (!isDisabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed text-slate-400 bg-slate-50'
                        : isSelected
                        ? 'bg-blue-50/60 text-[#0B4A99] font-bold shadow-xs'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {opt.setType && (
                        <span className={`px-1.5 py-0.5 rounded text-[7px] font-extrabold uppercase border flex-shrink-0 ${
                          getBadgeColor(opt.setType.toUpperCase())
                        }`}>
                          {opt.setType.toUpperCase()}
                        </span>
                      )}
                      <span className="truncate">{opt.label}</span>
                    </div>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5 text-[#0B4A99] flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
