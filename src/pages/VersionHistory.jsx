import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowLeft, FiClock, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { StatusBadge } from '../components/tc/UIComponents';
import MOCK_VERSIONS from '../data/versions';

function VersionCard({ version, isFirst, isLast, isSelected, onClick }) {
  const dotColor = version.status === 'Published' ? 'bg-emerald-500' : version.status === 'Draft' ? 'bg-slate-400' : 'bg-amber-500';
  return (
    <div className="flex">
      {/* Timeline */}
      <div className="flex flex-col items-center mr-4 flex-shrink-0 w-4">
        <div className={`w-4 h-4 rounded-full border-2 border-white ring-2 flex-shrink-0 ${dotColor} ${isSelected ? 'ring-[#1D5DB8]' : 'ring-slate-200'}`} />
        {!isLast && <div className="w-0.5 flex-1 bg-slate-200 mt-1" />}
      </div>
      {/* Card */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        onClick={onClick}
        className={`flex-1 mb-4 p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'border-[#1D5DB8]/30 bg-[#1D5DB8]/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-800">{version.version}</span>
            <StatusBadge status={version.status} />
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {new Date(version.changedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">{version.changes}</p>
        <p className="text-[10px] text-slate-400 mt-2 font-medium">By {version.changedBy}</p>
      </motion.div>
    </div>
  );
}

export default function VersionHistory({ tests }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const test = tests.find(t => t.id === Number(id));
  const versions = MOCK_VERSIONS.filter(v => v.testId === Number(id)).sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt));

  const [selectedVersion, setSelectedVersion] = useState(versions[0] || null);

  if (!test) return (
    <div className="text-center py-20 text-slate-400 text-sm">
      Test not found.
      <button onClick={() => navigate('/test-configuration')} className="block mt-4 mx-auto px-4 py-2 bg-[#1D5DB8] text-white rounded-xl text-xs font-semibold">Back</button>
    </div>
  );

  return (
    <div className="max-w-[900px] mx-auto space-y-5">
      <button onClick={() => navigate(`/test-configuration/details/${id}`)} className="flex items-center text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors">
        <FiArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Back to {test.name}
      </button>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Version History</h1>
          <p className="text-slate-400 text-xs mt-0.5">{test.name} • {versions.length} versions</p>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-5 flex items-center">
            <FiClock className="w-3.5 h-3.5 mr-1.5 text-[#1D5DB8]" /> Version Timeline
          </h3>
          {versions.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">No version history available.</div>
          ) : versions.map((v, i) => (
            <VersionCard
              key={v.id}
              version={v}
              isFirst={i === 0}
              isLast={i === versions.length - 1}
              isSelected={selectedVersion?.id === v.id}
              onClick={() => setSelectedVersion(v)}
            />
          ))}
        </div>

        {/* Version Detail */}
        <div>
          {selectedVersion ? (
            <motion.div
              key={selectedVersion.id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 sticky top-4"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-slate-800">{selectedVersion.version}</h3>
                  <StatusBadge status={selectedVersion.status} />
                </div>
              </div>
              <div className="space-y-3">
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Changes</p>
                  <p className="text-xs text-slate-700 leading-relaxed">{selectedVersion.changes}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Changed By</p>
                  <p className="text-xs font-semibold text-slate-700">{selectedVersion.changedBy}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Date & Time</p>
                  <p className="text-xs font-semibold text-slate-700">{new Date(selectedVersion.changedAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
                {selectedVersion.snapshot && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Snapshot</p>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedVersion.snapshot).map(([k, v]) => (
                        <div key={k} className="bg-[#1D5DB8]/5 rounded-xl p-2.5 border border-[#1D5DB8]/10">
                          <p className="text-[9px] text-[#1D5DB8] font-bold uppercase">{k.replace(/([A-Z])/g, ' $1').trim()}</p>
                          <p className="text-sm font-bold text-slate-800 mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5 text-center text-slate-400 text-xs py-12">
              Select a version to see details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
