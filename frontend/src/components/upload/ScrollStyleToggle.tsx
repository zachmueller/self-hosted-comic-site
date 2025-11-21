import './ScrollStyleToggle.css';

interface ScrollStyleToggleProps {
  value: 'carousel' | 'long-form';
  onChange: (style: 'carousel' | 'long-form') => void;
}

function ScrollStyleToggle({ value, onChange }: ScrollStyleToggleProps) {
  return (
    <div className="scroll-style-toggle">
      <button
        type="button"
        onClick={() => onChange('carousel')}
        className={`toggle-button ${value === 'carousel' ? 'active' : ''}`}
        aria-pressed={value === 'carousel'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M9 5v14M15 5v14" />
        </svg>
        <span>Carousel</span>
        <span className="toggle-description">Swipeable panels</span>
      </button>
      
      <button
        type="button"
        onClick={() => onChange('long-form')}
        className={`toggle-button ${value === 'long-form' ? 'active' : ''}`}
        aria-pressed={value === 'long-form'}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="6" rx="2" />
          <rect x="3" y="11" width="18" height="6" rx="2" />
          <rect x="3" y="19" width="18" height="2" rx="1" />
        </svg>
        <span>Long Form</span>
        <span className="toggle-description">Vertical scroll</span>
      </button>
    </div>
  );
}

export default ScrollStyleToggle;
