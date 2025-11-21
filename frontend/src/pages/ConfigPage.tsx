import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '../auth/useRequireAuth';
import { ColorPaletteEditor } from '../components/config/ColorPaletteEditor';
import { ColorPalette, DEFAULT_COLOR_PALETTE } from '../types/config';
import './ConfigPage.css';

function ConfigPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const navigate = useNavigate();
  
  const [colorPalette, setColorPalette] = useState<ColorPalette>(DEFAULT_COLOR_PALETTE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiUrl = import.meta.env.VITE_API_URL;
        if (!apiUrl) {
          throw new Error('API URL not configured');
        }

        const response = await fetch(`${apiUrl}/config`);
        if (!response.ok) {
          throw new Error('Failed to fetch configuration');
        }

        const data = await response.json();
        if (data.colorPalette) {
          setColorPalette(data.colorPalette);
        }
      } catch (err) {
        console.error('Error fetching config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        // Use default palette on error
        setColorPalette(DEFAULT_COLOR_PALETTE);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchConfig();
    }
  }, [authLoading]);

  const handleSave = async (newPalette: ColorPalette) => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const apiUrl = import.meta.env.VITE_API_URL;
      if (!apiUrl) {
        throw new Error('API URL not configured');
      }

      const response = await fetch(`${apiUrl}/config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ colorPalette: newPalette }),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      const data = await response.json();
      setColorPalette(data.colorPalette);
      setSuccessMessage('Color palette saved successfully! Refresh the page to see changes.');
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setColorPalette(DEFAULT_COLOR_PALETTE);
    setSuccessMessage(null);
    setError(null);
  };

  if (authLoading || isLoading) {
    return (
      <div className="config-page">
        <div className="config-page__loading">
          <div className="config-page__spinner"></div>
          <p>Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="config-page">
      <div className="config-page__header">
        <div className="config-page__title-section">
          <button
            className="config-page__back-button"
            onClick={() => navigate('/')}
            aria-label="Back to home"
          >
            ← Back
          </button>
          <h1 className="config-page__title">Site Configuration</h1>
        </div>
        <p className="config-page__description">
          Customize your comic site's color palette to match your brand and style.
        </p>
      </div>

      {error && (
        <div className="config-page__error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successMessage && (
        <div className="config-page__success" role="status">
          <strong>Success!</strong> {successMessage}
        </div>
      )}

      <ColorPaletteEditor
        colorPalette={colorPalette}
        onSave={handleSave}
        onReset={handleReset}
        isSaving={isSaving}
      />
    </div>
  );
}

export default ConfigPage;
