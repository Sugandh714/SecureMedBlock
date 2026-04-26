import { createContext, useContext, useState } from 'react';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const [records, setRecords] = useState([
    { id: 1, name: "Annual Blood Panel", department: "General Medicine", date: "Mar 12, 2026", status: "Private" },
    { id: 2, name: "ECG Report", department: "Cardiology", date: "Mar 05, 2026", status: "Shared with Dr. Meena" },
    { id: 3, name: "Brain MRI", department: "Neurology", date: "Feb 28, 2026", status: "Private" },
  ]);

  const [requests, setRequests] = useState([
    { id: 1, doctor: "Dr. Meena Gupta", department: "Cardiology", record: "ECG Report", time: "2 hours ago", status: "pending" },
    { id: 2, doctor: "Dr. Arjun Rao", department: "Neurology", record: "Brain MRI", time: "Yesterday", status: "pending" },
    { id: 3, doctor: "Dr. Priya Sharma", department: "Orthopedics", record: "Knee X-Ray", time: "Mar 20", status: "approved" },
  ]);

  const [logs, setLogs] = useState([
    { time: "Mar 28, 2026 • 5:15 PM", action: "Record Uploaded", actor: "User", detail: "Annual Blood Panel" },
    { time: "Mar 27, 2026 • 11:45 AM", action: "Access Granted", actor: "You → Dr. Meena Gupta", detail: "ECG Report" },
  ]);

  const uploadRecord = (newRecord) => {
    const record = { ...newRecord, id: Date.now(), date: "Just now", status: "Private" };
    setRecords(prev => [record, ...prev]);
    
    setLogs(prev => [{
      time: "Just now",
      action: "Record Uploaded",
      actor: "User",
      detail: newRecord.name
    }, ...prev]);
  };

  const approveRequest = (id) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: "approved" } : req
    ));
    
    const req = requests.find(r => r.id === id);
    if (req) {
      setLogs(prev => [{
        time: "Just now",
        action: "Access Granted",
        actor: `You → ${req.doctor}`,
        detail: req.record
      }, ...prev]);
    }
  };

  const rejectRequest = (id) => {
    setRequests(prev => prev.map(req => 
      req.id === id ? { ...req, status: "rejected" } : req
    ));
  };

  return (
    <DataContext.Provider value={{
      records,
      requests,
      logs,
      uploadRecord,
      approveRequest,
      rejectRequest
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);