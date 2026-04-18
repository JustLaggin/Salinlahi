import './ConfirmDialog.css';

function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText = "Confirm", cancelText = "Cancel", type = "warning" }) {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className="confirm-header">
          <h3 className="confirm-title">{title}</h3>
        </div>
        
        <div className="confirm-body">
          <p className="confirm-message">{message}</p>
        </div>
        
        <div className="confirm-footer">
          <button 
            className="confirm-btn cancel-btn" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-btn confirm-btn-${type}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;