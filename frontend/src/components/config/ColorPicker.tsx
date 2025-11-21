import { useState } from 'react';
import './ColorPicker.css';

interface ColorPickerProps {
  label: string;
  description: string;
  value: string;
  onChange: (value: string) => void;
}

export function ColorPicker({ label, description, value, onChange }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value);
  const [isValid, setIsValid] = useState(true);

  const validateHex = (hex: string): boolean => {
    return /^#[0-9A-Fa-f]{6}$/.test(hex);
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexInput(newValue);
    
    if (validateHex(newValue)) {
      setIsValid(true);
      onChange(newValue.toUpperCase());
    } else {
      setIsValid(false);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value.toUpperCase();
    setHexInput(newValue);
    setIsValid(true);
    onChange(newValue);
  };

  return (
    <div className="color-picker">
      <div className="color-picker__header">
        <label className="color-picker__label">{label}</label>
        <p className="color-picker__description">{description}</p>
      </div>

      <div className="color-picker__controls">
        <div className="color-picker__swatch-container">
          <input
            type="color"
            className="color-picker__color-input"
            value={value}
            onChange={handleColorPickerChange}
            aria-label={`${label} color picker`}
          />
          <div 
            className="color-picker__swatch"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
        </div>

        <div className="color-picker__text-container">
          <input
            type="text"
            className={`color-picker__text-input ${!isValid ? 'color-picker__text-input--invalid' : ''}`}
            value={hexInput}
            onChange={handleHexChange}
            onBlur={() => {
              // Reset to valid value on blur if invalid
              if (!isValid) {
                setHexInput(value);
                setIsValid(true);
              }
            }}
            placeholder="#RRGGBB"
            maxLength={7}
            aria-label={`${label} hex value`}
            aria-invalid={!isValid}
          />
          {!isValid && (
            <span className="color-picker__error" role="alert">
              Invalid hex color
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
