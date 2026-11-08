import React, { createContext, useContext, useState, useEffect } from 'react';

const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const [selectedHospitals, setSelectedHospitals] = useState(() => {
    try {
      const saved = localStorage.getItem('medisync_compare');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('medisync_compare', JSON.stringify(selectedHospitals));
  }, [selectedHospitals]);

  const addToCompare = (hospital) => {
    if (selectedHospitals.some((h) => h._id === hospital._id)) {
      return { success: false, message: 'Hospital already in comparison list.' };
    }
    if (selectedHospitals.length >= 3) {
      return { success: false, message: 'You can compare a maximum of 3 hospitals simultaneously.' };
    }
    setSelectedHospitals((prev) => [...prev, hospital]);
    return { success: true, message: `${hospital.name} added to comparison.` };
  };

  const removeFromCompare = (hospitalId) => {
    setSelectedHospitals((prev) => prev.filter((h) => h._id !== hospitalId));
  };

  const isInCompare = (hospitalId) => {
    return selectedHospitals.some((h) => h._id === hospitalId);
  };

  const clearCompare = () => {
    setSelectedHospitals([]);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedHospitals,
        addToCompare,
        removeFromCompare,
        isInCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};

