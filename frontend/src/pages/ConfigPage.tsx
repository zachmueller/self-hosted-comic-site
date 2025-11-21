import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '../auth/useRequireAuth';
import { useAuth } from '../auth/useAuth';
import { ColorPaletteEditor } from '../components/config/ColorPaletteEditor';
import { ColorPalette } from '../types/config';
import { loadSiteConfig, updateColorPalette, resetColorPalette, defaultColors } from '../styles/theme';
import './ConfigPage.css';

function ConfigPage() {
  const { isLoading: authLoading } = useRequireAuth();
  const { tokens } = useAuth();
  const navigate = useNavigate();
  
  const [colorPalette, setColorPalette] = useState<ColorPalette>(defaultColors);
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
        
        const config = await loadSiteConfig();
        setColorPalette(config.colorPalette);
      } catch (err) {
        console.error('Error fetching config:', err);
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
        // Use default palette on error
        setColorPalette(defaultColors);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      fetchConfig();
    }
  }, [authLoading]);

  const handleSave = async (newPalette: ColorPalette) => {
    if (!tokens?.idToken) {
      setError('Authentication required. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const config = await updateColorPalette(newPalette, tokens.idToken);
      setColorPalette(config.colorPalette);
      setSuccessMessage('Color palette saved successfully! Changes applied immediately.');
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error saving config:', err);
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (!tokens?.idToken) {
      setError('Authentication required. Please log in again.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const config = await resetColorPalette(tokens.idToken);
      setColorPalette(config.colorPalette);
      setSuccessMessage('Color palette reset to defaults!');
      
      // Auto-dismiss success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Error resetting config:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
    } finally {
      setIsSaving(false);
    }
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
