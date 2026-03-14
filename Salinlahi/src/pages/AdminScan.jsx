import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { collection, getDocs, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

function AdminScan() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyuda, setSelectedAyuda] = useState('');
  const [loadingAyudas, setLoadingAyudas] = useState(false);
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    loadAyudas();
  }, []);

  const loadAyudas = async () => {
    setLoadingAyudas(true);
    try {
      const snapshot = await getDocs(collection(db, "ayudas"));
      const ayudaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAyudas(ayudaList.filter(a => a.status === 'ONGOING'));
    } catch (err) {
      console.error('Load ayundas error:', err);
    }
    setLoadingAyudas(false);
  };

  const startScanner = async () => {
    try {
      setScanning(true);
      setScanResult('Starting camera...');
      
      scannerRef.current = new Html5Qrcode("reader", { verbose: false });
      
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 5, qrbox: { width: 200, height: 200 } },
        (decodedText) => {
          console.log('✅ QR SCANNED:', decodedText);
          scannerRef.current.pause(true);
          setScanResult(`✅ Scanned: ${decodedText}`);
          setShowModal(true);
        },
        () => {} // silent no QR
      );
      
      isRunningRef.current = true;
      setScanResult('📷 Scanning...');
    } catch (err) {
      setScanResult(`❌ ${err.name}`);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isRunningRef.current) {
      await scannerRef.current.stop().catch(() => {});
      isRunningRef.current = false;
    }
    setScanning(false);
    setScanResult('');
  };

  const confirmAttendance = async () => {
    if (!selectedAyuda) return;
    
    try {
      const qrId = scanResult.split(': ')[1];
      await updateDoc(doc(db, "ayudas", selectedAyuda), {
        beneficiaries: arrayUnion(qrId)
      });
      alert('✅ Attendance confirmed for ' + selectedAyuda);
      setShowModal(false);
      setSelectedAyuda('');
      await loadAyudas();
    } catch (err) {
      alert('❌ Confirm error: ' + err.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAyuda('');
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="app-container">
      <div className="base-card qr-scanner-card">
        <h2 className="auth-title">QR Attendance Scanner</h2>
        
        <div className="scanner-controls">
          {!scanning ? (
            <button className="auth-button" onClick={startScanner}>
              🎥 Start Scan
            </button>
          ) : (
            <button className="auth-button stop-btn" onClick={stopScanner}>
              ⏹️ Stop
            </button>
          )}
        </div>

        <div id="reader" style={{minHeight: '350px', width: '100%'}}></div>
        
        <div className="scanner-status mono-text" style={{fontSize: '1.1rem', textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px'}}>
          {scanResult || "Ready"}
        </div>
      </div>

      {/* Ayuda Selection Modal */}
      {showModal && (
        <div className="modal-overlay" style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
          <div className="base-card" style={{minWidth: '400px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 className="auth-title" style={{margin: 0}}>Confirm Attendance</h3>
              <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)'}}>×</button>
            </div>
            
            <p><strong>QR ID:</strong> {scanResult.split(': ')[1]}</p>
            
            <h4 style={{margin: '1.5rem 0 1rem 0'}}>Select Ayuda Event:</h4>
            
            {loadingAyudas ? (
              <p>Loading events...</p>
            ) : ayudas.length === 0 ? (
              <p>No ongoing events</p>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                {ayudas.map(ayuda => (
                  <button 
                    key={ayuda.id}
                    className="auth-button"
                    style={{justifyContent: 'flex-start'}}
                    onClick={() => setSelectedAyuda(ayuda.id)}
                  >
                    {ayuda.title} {ayuda.status === 'ONGOING' && <span style={{marginLeft: 'auto', background: 'var(--color-primary-green)', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.75rem'}}>Ongoing</span>}
                  </button>
                ))}
              </div>
            )}
            
            <div style={{marginTop: '1.5rem', display: 'flex', gap: '1rem'}}>
              <button className="auth-button" onClick={confirmAttendance} disabled={!selectedAyuda}>
                ✅ Confirm Attendance
              </button>
              <button className="auth-button stop-btn" onClick={closeModal}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .stop-btn {
          background: linear-gradient(135deg, #6b7280, #4b5563) !important;
        }
        .stop-btn:hover {
          box-shadow: 0 10px 20px rgba(107,114,128,0.3) !important;
        }
      `}</style>
    </div>
  );
}

export default AdminScan;
