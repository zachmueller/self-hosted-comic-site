import { getContrastLevel, getContrastSuggestion, WCAG_THRESHOLDS } from '../../utils/contrastChecker';
import './ContrastWarning.css';

interface ContrastWarningProps {
  label: string;
  ratio: number;
  foreground: string;
  background: string;
}

export function ContrastWarning({ label, ratio, foreground, background }: ContrastWarningProps) {
  const level = getContrastLevel(ratio);
  const suggestion = getContrastSuggestion(foreground, background, ratio);
  
  const getStatusIcon = () => {
    switch (level) {
      case 'aaa':
        return '✅';
      case 'aa':
        return '✓';
      case 'fail':
        return '⚠️';
    }
  };

  const getStatusText = () => {
    switch (level) {
      case 'aaa':
        return 'Excellent (AAA)';
      case 'aa':
        return 'Good (AA)';
      case 'fail':
        return 'Poor (Fails AA)';
    }
  };

  return (
    <div className={`contrast-warning contrast-warning--${level}`}>
      <div className="contrast-warning__header">
        <span className="contrast-warning__icon" aria-hidden="true">
          {getStatusIcon()}
        </span>
        <div className="contrast-warning__info">
          <span className="contrast-warning__label">{label}</span>
          <span className="contrast-warning__ratio">
            {ratio.toFixed(2)}:1 - {getStatusText()}
          </span>
        </div>
      </div>

      <div className="contrast-warning__preview">
        <div 
          className="contrast-warning__sample"
          style={{
            backgroundColor: background,
            color: foreground,
          }}
        >
          Sample Text
        </div>
      </div>

      {level === 'fail' && (
        <div className="contrast-warning__suggestion">
          <p className="contrast-warning__suggestion-text">
            <strong>Suggestion:</strong> {suggestion}
          </p>
          <p className="contrast-warning__threshold">
            Minimum ratio for AA: {WCAG_THRESHOLDS.AA_NORMAL}:1
          </p>
        </div>
      )}

      {level === 'aa' && (
        <div className="contrast-warning__info-text">
          <p>
            Meets WCAG AA (good). For AAA (excellent), aim for {WCAG_THRESHOLDS.AAA_NORMAL}:1 or higher.
          </p>
        </div>
      )}
    </div>
  );
}
