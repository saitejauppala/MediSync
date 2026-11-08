import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  X,
  Plus,
  CheckCircle2,
  XCircle,
  Bed,
  AlertCircle,
  Star,
  MapPin,
  Calendar,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useCompare } from '../../context/CompareContext';
import hospitalService from '../../services/hospitalService';
import Button from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const ComparePage = () => {
  const { selectedHospitals, removeFromCompare, clearCompare, addToCompare } = useCompare();
  const [allHospitals, setAllHospitals] = useState([]);
  const [showAddDropdown, setShowAddDropdown] = useState(false);

  useEffect(() => {
    const fetchHospitalsList = async () => {
      try {
        const res = await hospitalService.getHospitals({ limit: 30 });
        if (res.success) {
          setAllHospitals(res.hospitals);
        }
      } catch (err) {
        console.error('Failed to load comparison candidates:', err);
      }
    };
    fetchHospitalsList();
  }, []);

  const availableToAdd = allHospitals.filter(
    (h) => !selectedHospitals.some((sel) => sel._id === h._id)
  );

  return (
    <div className="min-h-screen bg-[#090909] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#303030]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-red-500 font-bold uppercase tracking-wider mb-1">
              <Scale className="w-4 h-4" />
              <span>Multi-Facility Evaluation</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Compare Healthcare Centers</h1>
            <p className="text-xs text-text-secondary mt-1">
              Analyze up to 3 medical centers side-by-side on emergency capability, bed availability, and services.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedHospitals.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCompare}>
                Clear Comparison
              </Button>
            )}
            <Link to="/hospitals">
              <Button variant="primary" size="sm">
                Explore More Hospitals
              </Button>
            </Link>
          </div>
        </div>

        {selectedHospitals.length === 0 ? (
          <div className="p-16 text-center bg-[#171717] rounded-3xl border border-[#303030] space-y-4 max-w-xl mx-auto">
            <Scale className="w-16 h-16 text-red-500/40 mx-auto" />
            <h2 className="text-xl font-bold text-white">No Hospitals Selected for Comparison</h2>
            <p className="text-xs text-text-secondary leading-relaxed">
              Browse hospital discovery and click the scale comparison icon on any hospital card to compare up to 3 facilities.
            </p>
            <Link to="/hospitals">
              <Button variant="primary" size="md">
                Browse Hospitals Now
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Quick add selector if less than 3 */}
            {selectedHospitals.length < 3 && (
              <div className="relative inline-block">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Plus}
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                >
                  Add Another Hospital ({selectedHospitals.length}/3)
                </Button>

                {showAddDropdown && (
                  <div className="absolute left-0 mt-2 w-72 rounded-xl bg-[#171717] border border-[#303030] shadow-2xl p-2 z-30 max-h-60 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-text-secondary px-2 py-1 uppercase tracking-wider">
                      Select Hospital to Add
                    </p>
                    {availableToAdd.map((h) => (
                      <button
                        key={h._id}
                        onClick={() => {
                          addToCompare(h);
                          setShowAddDropdown(false);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-[#202020] text-xs text-white truncate flex items-center justify-between"
                      >
                        <span className="truncate">{h.name}</span>
                        <span className="text-[10px] text-text-secondary ml-2">{h.city}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Comparison Matrix Table */}
            <div className="overflow-x-auto rounded-2xl border border-[#303030] bg-[#171717]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#303030]">
                    <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider w-1/4 bg-[#141414]">
                      Feature / Metric
                    </th>
                    {selectedHospitals.map((hospital) => (
                      <th
                        key={hospital._id}
                        className="p-4 text-xs font-bold text-white relative min-w-[260px] bg-[#171717] border-l border-[#303030]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link to={`/hospitals/${hospital._id}`}>
                              <h3 className="text-sm font-extrabold text-white hover:text-red-400">
                                {hospital.name}
                              </h3>
                            </Link>
                            <p className="text-[11px] text-text-secondary mt-0.5">
                              {hospital.city} • {hospital.type}
                            </p>
                          </div>
                          <button
                            onClick={() => removeFromCompare(hospital._id)}
                            className="p-1 rounded-lg text-text-secondary hover:text-red-400 hover:bg-[#202020]"
                            title="Remove"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#262626] text-xs">
                  {/* Rating */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">Patient Rating</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        <span className="flex items-center gap-1.5 font-bold text-amber-400">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {h.rating?.toFixed(1) || '4.5'}
                          <span className="text-text-secondary font-normal">({h.reviewCount || 0} reviews)</span>
                        </span>
                      </td>
                    ))}
                  </tr>

                  {/* Facility Type */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">Facility Ownership</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        <Badge variant={h.type === 'Government' ? 'govt' : 'private'}>
                          {h.type}
                        </Badge>
                      </td>
                    ))}
                  </tr>

                  {/* 24/7 Emergency Readiness */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">24/7 Emergency Care</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        {h.hasEmergency ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> Level 1 Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-text-secondary">
                            <XCircle className="w-4 h-4 text-zinc-500" /> Standard Daytime Only
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Reported Bed Capacity */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">Available Bed Count</td>
                    {selectedHospitals.map((h) => {
                      const beds = h.bedInventory;
                      return (
                        <td key={h._id} className="p-4 border-l border-[#303030]">
                          {beds ? (
                            <div>
                              <span className="text-sm font-extrabold text-emerald-400">
                                {beds.availableBeds} beds
                              </span>
                              <span className="text-text-secondary"> / {beds.totalBeds} total</span>
                            </div>
                          ) : (
                            <span className="text-text-secondary">Not reported</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>

                  {/* ICU Beds */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">ICU Bed Availability</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        <span className="font-semibold text-amber-400">
                          {h.bedInventory?.icuBeds?.available || 0}
                        </span>
                        <span className="text-text-secondary"> / {h.bedInventory?.icuBeds?.total || 0}</span>
                      </td>
                    ))}
                  </tr>

                  {/* Key Specialities */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">Specialities Offered</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        <div className="flex flex-wrap gap-1">
                          {h.specialities?.map((spec, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded text-[10px] bg-[#202020] text-zinc-300 border border-[#303030]"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* Operating Hours */}
                  <tr>
                    <td className="p-4 text-text-secondary font-medium bg-[#141414]">Operating Schedule</td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030] text-zinc-300">
                        {h.operatingHours || 'Open 24/7'}
                      </td>
                    ))}
                  </tr>

                  {/* Action row */}
                  <tr>
                    <td className="p-4 bg-[#141414]"></td>
                    {selectedHospitals.map((h) => (
                      <td key={h._id} className="p-4 border-l border-[#303030]">
                        <Link to={`/hospitals/${h._id}`}>
                          <Button variant="primary" size="sm" className="w-full">
                            Select Hospital
                          </Button>
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComparePage;
