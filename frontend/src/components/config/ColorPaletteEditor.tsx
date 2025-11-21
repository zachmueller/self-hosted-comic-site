import { useState, useEffect } from 'react';
import { ColorPicker } from './ColorPicker';
import { ContrastWarning } from './ContrastWarning';
import { ColorPalette } from '../../types/config';
import { calculateContrastRatio } from '../../utils/contrastChecker';
import { applyColorPalette } from '../../styles/theme';
import './ColorPaletteEditor.css';

interface ColorPaletteEditorProps {
  colorPalette: ColorPalette;
  onSave: (palette: ColorPalette) => void;
  onReset: () => void;
  isSaving: boolean;
}

export function ColorPaletteEditor({
  colorPalette,
  onSave,
  onReset,
  isSaving,
}: ColorPaletteEditorProps) {
  const [editedPalette, setEditedPalette] = useState<ColorPalette>(colorPalette);
  const [hasChanges, setHasChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Update edited palette when prop changes
  useEffect(() => {
    setEditedPalette(colorPalette);
    setHasChanges(false);
  }, [colorPalette]);

  // Check if palette has changed
  useEffect(() => {
    const changed = Object.keys(editedPalette).some(
      (key) => editedPalette[key as keyof ColorPalette] !== colorPalette[key as keyof ColorPalette]
    );
    setHasChanges(changed);
  }, [editedPalette, colorPalette]);

  const handleColorChange = (colorKey: keyof ColorPalette, value: string) => {
    setEditedPalette((prev) => ({
      ...prev,
      [colorKey]: value,
    }));
  };

  const handleSave = () => {
    onSave(editedPalette);
  };

  const handleReset = () => {
    onReset();
    setShowPreview(false);
  };

  const handleCancel = () => {
    setEditedPalette(colorPalette);
    setShowPreview(false);
  };

  const togglePreview = () => {
    setShowPreview(!showPreview);
    
    if (!showPreview) {
      // Apply preview colors
      applyColorPalette(editedPalette);
    } else {
      // Restore original colors
      applyColorPalette(colorPalette);
    }
  };

  // Calculate contrast ratios for accessibility warnings
  const textOnPrimaryContrast = calculateContrastRatio(editedPalette.text, editedPalette.primary);
  const textOnSecondaryContrast = calculateContrastRatio(editedPalette.text, editedPalette.secondary);
  const textSecondaryContrast = calculateContrastRatio(editedPalette.textSecondary, editedPalette.secondary);

  return (
    <div className="color-palette-editor">
      <div className="color-palette-editor__controls">
        <h2 className="color-palette-editor__section-title">Color Palette</h2>
        <p className="color-palette-editor__section-description">
          Choose colors that represent your comic's style and brand.
        </p>

        <div className="color-palette-editor__colors">
          <ColorPicker
            label="Primary Color"
            description="Main brand color for buttons and accents"
            value={editedPalette.primary}
            onChange={(value: string) => handleColorChange('primary', value)}
          />

          <ColorPicker
            label="Secondary Color"
            description="Supporting color for backgrounds and subtle elements"
            value={editedPalette.secondary}
            onChange={(value: string) => handleColorChange('secondary', value)}
          />

          <ColorPicker
            label="Highlight Color"
            description="Accent color for emphasis and calls-to-action"
            value={editedPalette.highlight}
            onChange={(value: string) => handleColorChange('highlight', value)}
          />

          <ColorPicker
            label="Text Color"
            description="Primary text color for body content"
            value={editedPalette.text}
            onChange={(value: string) => handleColorChange('text', value)}
          />

          <ColorPicker
            label="Secondary Text Color"
            description="Lighter text color for secondary information"
            value={editedPalette.textSecondary}
            onChange={(value: string) => handleColorChange('textSecondary', value)}
          />
        </div>

        <div className="color-palette-editor__accessibility">
          <h3 className="color-palette-editor__subsection-title">Accessibility Check</h3>
          <p className="color-palette-editor__subsection-description">
            These warnings help ensure your colors are readable, but you can save anyway if desired.
          </p>

          <ContrastWarning
            label="Text on Primary"
            ratio={textOnPrimaryContrast}
            foreground={editedPalette.text}
            background={editedPalette.primary}
          />

          <ContrastWarning
            label="Text on Secondary"
            ratio={textOnSecondaryContrast}
            foreground={editedPalette.text}
            background={editedPalette.secondary}
          />

          <ContrastWarning
            label="Secondary Text on Secondary Background"
            ratio={textSecondaryContrast}
            foreground={editedPalette.textSecondary}
            background={editedPalette.secondary}
          />
        </div>

        <div className="color-palette-editor__actions">
          <button
            className="color-palette-editor__button color-palette-editor__button--preview"
            onClick={togglePreview}
            disabled={!hasChanges}
          >
            {showPreview ? '👁️ Hide Preview' : '👁️ Preview Changes'}
          </button>

          <button
            className="color-palette-editor__button color-palette-editor__button--reset"
            onClick={handleReset}
            disabled={isSaving}
          >
            Reset to Defaults
          </button>

          <button
            className="color-palette-editor__button color-palette-editor__button--cancel"
            onClick={handleCancel}
            disabled={!hasChanges || isSaving}
          >
            Cancel
          </button>

          <button
            className="color-palette-editor__button color-palette-editor__button--save"
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="color-palette-editor__preview">
        <h2 className="color-palette-editor__section-title">Live Preview</h2>
        <p className="color-palette-editor__section-description">
          See how your colors look in context
        </p>

        <div className="color-palette-editor__preview-card" style={{
          backgroundColor: editedPalette.secondary,
          color: editedPalette.text,
        }}>
          <h3 style={{ color: editedPalette.text }}>Sample Comic Title</h3>
          <p style={{ color: editedPalette.textSecondary }}>
            This is how secondary text will appear on your site
          </p>
          <button
            className="color-palette-editor__preview-button"
            style={{
              backgroundColor: editedPalette.primary,
              color: '#ffffff',
            }}
          >
            Primary Button
          </button>
          <button
            className="color-palette-editor__preview-button"
            style={{
              backgroundColor: editedPalette.highlight,
              color: editedPalette.text,
            }}
          >
            Highlight Button
          </button>
        </div>

        <div className="color-palette-editor__preview-swatches">
          <div className="color-palette-editor__swatch" style={{ backgroundColor: editedPalette.primary }}>
            <span className="color-palette-editor__swatch-label">Primary</span>
            <span className="color-palette-editor__swatch-value">{editedPalette.primary}</span>
          </div>
          <div className="color-palette-editor__swatch" style={{ backgroundColor: editedPalette.secondary }}>
            <span className="color-palette-editor__swatch-label">Secondary</span>
            <span className="color-palette-editor__swatch-value">{editedPalette.secondary}</span>
          </div>
          <div className="color-palette-editor__swatch" style={{ backgroundColor: editedPalette.highlight }}>
            <span className="color-palette-editor__swatch-label">Highlight</span>
            <span className="color-palette-editor__swatch-value">{editedPalette.highlight}</span>
          </div>
          <div className="color-palette-editor__swatch" style={{ backgroundColor: editedPalette.text }}>
            <span className="color-palette-editor__swatch-label" style={{ color: '#ffffff' }}>Text</span>
            <span className="color-palette-editor__swatch-value" style={{ color: '#ffffff' }}>{editedPalette.text}</span>
          </div>
          <div className="color-palette-editor__swatch" style={{ backgroundColor: editedPalette.textSecondary }}>
            <span className="color-palette-editor__swatch-label" style={{ color: '#ffffff' }}>Text Secondary</span>
            <span className="color-palette-editor__swatch-value" style={{ color: '#ffffff' }}>{editedPalette.textSecondary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
