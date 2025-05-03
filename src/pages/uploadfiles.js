import React, { useState, useEffect } from 'react';
import FileUploader from '../components/complex/uploadFilesFromUsers';
import Modal from "../components/complex/modal";







const App = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadDetails, setUploadDetails] = useState(null);
  const [userEmail, setUserEmail] = useState(null);

  useEffect(() => {
    // Se ejecuta solo en el cliente para evitar errores en el servidor
    if (typeof window !== 'undefined') {
      const email = localStorage.getItem('userEmail');
      if (email) {
        const transformUserId = (userId) => userId.replace(/[@.]/g, '_');
        setUserEmail(transformUserId(email));
      }
    }
  }, []);

  const handleUploadComplete = (userId, memoryData) => {
    setUploadDetails('files saved successfully');
    setIsModalOpen(true);
  };

  return (
    <div>
      <FileUploader 
        userId={userEmail}
        onUploadComplete={handleUploadComplete} 
      />

      {/* Modal para mostrar el mensaje de éxito */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div style={{ padding: "20px", textAlign: "center", color: "white" }}>
          {uploadDetails}
        </div>
      </Modal>
    </div>
  );
};

export default App;


