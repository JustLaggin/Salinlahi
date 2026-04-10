import { useState, useRef, useEffect } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useSearchParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, getDocs, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";

function AdminScan() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modeParam = searchParams.get('mode');
  const ayudaIdParam = searchParams.get('ayudaId');
  const hasLoadedAyuda = !!ayudaIdParam;
  const isClaimingMode = modeParam === 'claiming';
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [ayudas, setAyudas] = useState([]);
  const [selectedAyuda, setSelectedAyuda] = useState('');
  const [loadingAyudas, setLoadingAyudas] = useState(false);
  const [userUid, setUserUid] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [targetAyuda, setTargetAyuda] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'applicant', 'beneficiary', or null
  const [showUserInfo, setShowUserInfo] = useState(false);
  
  const scannerRef = useRef(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    loadAyudas();
    if (hasLoadedAyuda) {
      setSelectedAyuda(ayudaIdParam);
    }
  }, []);

  const loadAyudas = async () => {
    setLoadingAyudas(true);
    try {
      const snapshot = await getDocs(collection(db, "ayudas"));
      const ayudaList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredList = hasLoadedAyuda ? ayudaList : ayudaList.filter(a => a.status === 'ONGOING');
      setAyudas(filteredList);
      // Set target for add mode after loading
      if (hasLoadedAyuda) {
        const target = ayudaList.find(a => a.id === ayudaIdParam);
        if (target) setTargetAyuda(target);
      }
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
        async (decodedText) => {
          console.log('✅ QR SCANNED:', decodedText);
          scannerRef.current.pause(true);
          setScanResult(`✅ Scanned: ${decodedText}`);
          
          // Lookup user by uuid
          setLoadingUser(true);
          const userQuery = query(collection(db, "users"), where("uuid", "==", decodedText));
          const userSnap = await getDocs(userQuery);
          if (userSnap.docs.length > 0) {
            const userDoc = userSnap.docs[0];
            setUserUid(userDoc.id);
            setUserData(userDoc.data());
          } else {
            alert('User not found for this QR');
            setLoadingUser(false);
            return;
          }
          setLoadingUser(false);
          
          // Check status if ayuda loaded
          if (hasLoadedAyuda) {
            await checkUserStatus(ayudaIdParam);
          }
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

  const closeModal = () => {
    setShowModal(false);
    setSelectedAyuda('');
    setUserStatus(null);
    setShowUserInfo(false);
  };

  const checkUserStatus = async (ayudaId) => {
    if (!userUid || !ayudaId) return;
    
    try {
      const ayudaRef = doc(db, 'ayudas', ayudaId);
      const ayudaSnap = await getDoc(ayudaRef);
      if (!ayudaSnap.exists()) return;
      
      const data = ayudaSnap.data();
      if (data.applicants?.includes(userUid)) {
        setUserStatus('applicant');
        return;
      }
      if (data.beneficiaries?.includes(userUid)) {
        setUserStatus('beneficiary');
        return;
      }
      setUserStatus(null);
    } catch (err) {
      console.error('Status check error:', err);
    }
  };

  const addToApplicants = async () => {
    if (!ayudaIdParam || !userUid) return;
    
    try {
      const ayudaRef = doc(db, 'ayudas', ayudaIdParam);
      await updateDoc(ayudaRef, {
        applicants: arrayUnion(userUid)
      });
      
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, {
        ayudas_applied: arrayUnion(ayudaIdParam)
      });
      
      alert('✅ Added to applicants');
      closeModal();
      navigate('/admin/currentayuda');
    } catch (err) {
      alert('❌ Add error: ' + err.message);
    }
  };

  const markAsReceived = async () => {
    if (!ayudaIdParam || !userUid) return;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const userRef = doc(db, 'users', userUid);
      await updateDoc(userRef, {
        ayudas_received: arrayUnion(today)
      });
      
      alert(`✅ Marked as received on ${today} for ${targetAyuda?.title}`);
      closeModal();
      navigate('/admin/currentayuda');
    } catch (err) {
      alert('❌ Claim error: ' + err.message);
    }
  };

  const restartScan = () => {
    setUserData(null);
    setUserUid(null);
    setUserStatus(null);
    setShowUserInfo(false);
    setScanResult('');
    startScanner();
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
          <h2 className="auth-title">
            {isClaimingMode 
              ? `Claiming Scanner - ${targetAyuda?.title || 'Ayuda ID: ' + ayudaIdParam}` 
              : hasLoadedAyuda 
              ? `QR Scanner - ${targetAyuda?.title || 'Ayuda ID: ' + ayudaIdParam}` 
              : 'QR Scanner'
            }
          </h2>
          {hasLoadedAyuda && (
            <p className="settings-text" style={{textAlign: 'center', marginBottom: '1rem'}}>
              {isClaimingMode 
                ? 'Scan beneficiary QR to mark ayuda as received (adds date to user record)'
                : 'Check scanned QR against applicants/beneficiaries for this ayuda'
              }
            </p>
          )}
        
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

      {/* Dynamic Modal - Ayuda-specific check OR Base user info OR Ayuda selection */}
      {showModal && (
        <div className="modal-overlay" style={{position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'}}>
          <div className="base-card" style={{minWidth: '400px', maxWidth: '90vw', maxHeight: '80vh', overflow: 'auto'}}>
            {hasLoadedAyuda ? (
              // Ayuda loaded: Show user data + status + conditional add
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <h3 className="auth-title" style={{margin: 0}}>
                    {isClaimingMode ? `Claim Status for ${targetAyuda?.title}` : `User Status for ${targetAyuda?.title}`}
                  </h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)'}}>×</button>
                </div>

                <div style={{marginBottom: '1rem'}}>
                  <h4 style={{marginBottom: '0.5rem'}}>User: {(userData?.first_name || '') + ' ' + (userData?.last_name || '')}</h4>
                  {userData?.middle_name && <p><strong>Middle Name:</strong> {userData.middle_name}</p>}
                  {userData?.birth_date && <p><strong>Birth Date:</strong> {userData.birth_date}</p>}
                  {userData?.contact_number && <p><strong>Contact:</strong> {userData.contact_number}</p>}
                  {userData?.email && <p><strong>Email:</strong> {userData.email}</p>}
                  {userData?.address_line && <p><strong>Address:</strong> {userData.address_line}, {userData.barangay}, {userData.city}, {userData.province}</p>}
                  {userData?.created_at && <p><strong>Created:</strong> {new Date(userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</p>}
                </div>
                <div style={{padding: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', marginBottom: '1.5rem'}}>


                  <h4 style={{margin: '0 0 0.5rem 0'}}>Status:</h4>
                  {userStatus === 'applicant' && <p style={{color: 'orange', fontWeight: 'bold'}}>Already in Applicants</p>}
                  {userStatus === 'beneficiary' && <p style={{color: 'green', fontWeight: 'bold'}}>✅ Approved Beneficiary - Eligible for claiming</p>}
                  {userStatus === null && <p style={{color: 'red', fontWeight: 'bold'}}>{isClaimingMode ? '❌ Not a beneficiary - Must be approved first' : 'Not registered - Can add to applicants'}</p>}
                </div>

                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  {isClaimingMode ? (
                    userStatus === 'beneficiary' && (
                      <button className="auth-button approve-btn" onClick={markAsReceived}>
                        ✅ Mark as Received
                      </button>
                    )
                  ) : (
                    userStatus === null && (
                      <button className="auth-button" onClick={addToApplicants}>
                        ➕ Add to Applicants
                      </button>
                    )
                  )}
                  <button className="auth-button stop-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            ) : (

              // Base scan OR Ayuda select: User info only + restart
              <>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                  <h3 className="auth-title" style={{margin: 0}}>User Info</h3>
                  <button onClick={closeModal} style={{background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--color-text-muted)'}}>×</button>
                </div>

                <div style={{marginBottom: '1.5rem'}}>
                  <h4 style={{marginBottom: '0.5rem'}}>User: {(userData?.first_name || '') + ' ' + (userData?.last_name || '')}</h4>
                  {userData?.middle_name && <p><strong>Middle Name:</strong> {userData.middle_name}</p>}
                  {userData?.birth_date && <p><strong>Birth Date:</strong> {userData.birth_date}</p>}
                  {userData?.contact_number && <p><strong>Contact:</strong> {userData.contact_number}</p>}
                  {userData?.email && <p><strong>Email:</strong> {userData.email}</p>}
                  {userData?.address_line && <p><strong>Address:</strong> {userData.address_line}, {userData.barangay}, {userData.city}, {userData.province}</p>}
                  {userData?.created_at && <p><strong>Created:</strong> {new Date(userData.created_at).toLocaleString('en-US', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })}</p>}
                </div>

                <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
                  <button className="auth-button stop-btn" onClick={closeModal}>
                    Close
                  </button>
                </div>
              </>
            )}
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
