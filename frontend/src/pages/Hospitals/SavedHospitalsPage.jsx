import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import hospitalService from '../../services/hospitalService';
import HospitalCard from '../../components/hospitals/HospitalCard';
import Button from '../../components/common/Button';

export const SavedHospitalsPage = () => {
  const { user } = useAuth();
  const [savedHospitals, setSavedHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const res = await hospitalService.getHospitals({ limit: 50 });
        if (res.success && user?.savedHospitals) {
          const ids = user.savedHospitals.map((h) => (typeof h === 'string' ? h : h._id));
          const filtered = res.hospitals.filter((h) => ids.includes(h._id));
          setSavedHospitals(filtered);
        }
      } catch (err) {
        console.error('Failed to load saved hospitals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [user]);

  return (
    <div className="min-h-screen bg-[#090909] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between pb-6 border-b border-[#303030]">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-red-500 font-bold uppercase tracking-wider mb-1">
              <Heart className="w-4 h-4 fill-red-500" />
              <span>Personal Bookmarks</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white">Saved Hospitals</h1>
            <p className="text-xs text-text-secondary mt-1">
              Quick access to healthcare centers you frequently visit or monitor.
            </p>
          </div>
          <Link to="/hospitals">
            <Button variant="primary" size="sm">
              Discover More
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-2xl bg-[#171717] border border-[#303030] animate-pulse" />
            ))}
          </div>
        ) : savedHospitals.length === 0 ? (
          <div className="p-16 text-center bg-[#171717] rounded-3xl border border-[#303030] space-y-4 max-w-lg mx-auto">
            <Heart className="w-12 h-12 text-red-500/40 mx-auto" />
            <h3 className="text-lg font-bold text-white">No Saved Hospitals Yet</h3>
            <p className="text-xs text-text-secondary">
              When exploring hospitals, tap the heart icon on any card to bookmark it here for rapid access.
            </p>
            <Link to="/hospitals">
              <Button variant="primary" size="sm">
                Explore Hospitals
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {savedHospitals.map((hospital) => (
              <HospitalCard key={hospital._id} hospital={hospital} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedHospitalsPage;
