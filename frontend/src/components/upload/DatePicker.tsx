import './DatePicker.css';

interface DatePickerProps {
  id: string;
  value: string;
  onChange: (date: string) => void;
  error?: string;
  allowEmpty?: boolean;
}

function DatePicker({ id, value, onChange, error, allowEmpty = false }: DatePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    if (allowEmpty) {
      onChange('');
    }
  };

  return (
    <div className="date-picker">
      <div className="date-picker-input-wrapper">
        <input
          type="date"
          id={id}
          value={value}
          onChange={handleChange}
          className={`date-input ${error ? 'error' : ''}`}
        />
        {allowEmpty && value && (
          <button
            type="button"
            onClick={handleClear}
            className="date-clear-button"
            aria-label="Clear date"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}

export default DatePicker;
