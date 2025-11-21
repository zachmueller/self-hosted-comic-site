import { useRequireAuth } from '../auth/useRequireAuth';

function UploadPage() {
  const { isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <div className="upload-page">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="upload-page">
      <h2>Upload Comic</h2>
      <p>Upload and manage your comics</p>
      <div className="placeholder-content">
        <p>Upload interface will be implemented here.</p>
        <p>This is a protected page - only authenticated users can access it.</p>
      </div>
    </div>
  );
}

export default UploadPage;
