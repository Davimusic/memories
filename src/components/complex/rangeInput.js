import { useState, useEffect } from 'react';






const cssStyles = `
.rangeContainer {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0 10px;
}

.rangeInputWrapper {
  position: relative;
  width: 100%;
}

.rangeInputProgress {
  -webkit-appearance: none; /* For WebKit browsers */
  appearance: none;
  width: 100%;
  height: 4px;
  background: linear-gradient(
    to right,
    var(--progress-color) 0%,
    var(--progress-color) var(--progress),
    var(--track-color) var(--progress),
    var(--track-color) 100%
  );
  border-radius: 2px;
  outline: none;
  margin: 10px 0;
}

/* Ocultar el thumb para Chrome, Safari y Opera */
.rangeInputProgress::-webkit-slider-thumb {
  -webkit-appearance: none !important;
  appearance: none !important;
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Ocultar el thumb en Firefox */
.rangeInputProgress::-moz-range-thumb {
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

/* Ocultar el thumb en IE/Edge */
.rangeInputProgress::-ms-thumb {
  width: 0 !important;
  height: 0 !important;
  background: transparent !important;
  border: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

.rangeValueMinimal {
  font-size: 0.85rem;
  color: var(--text-color);
  margin-left: 10px;
  min-width: 30px;
  text-align: center;
  font-family: 'Arial', sans-serif;
}

/* Clases de colores dinámicos */
.color1 { --color: var(--color1); }
.color2 { --color: var(--color2); }
.color3 { --color: var(--color3); }
.color4 { --color: var(--color4); }
.color5 { --color: var(--color5); }

.backgroundColor1 { --backgroundColor: var(--backgroundColor1); }
.backgroundColor2 { --backgroundColor: var(--backgroundColor2); }
.backgroundColor3 { --backgroundColor: var(--backgroundColor3); }
.backgroundColor4 { --backgroundColor: var(--backgroundColor4); }
.backgroundColor5 { --backgroundColor: var(--backgroundColor5); }
`;

const RangeInput = ({
  min = 0,
  max = 100,
  step = 1,
  value: propValue = 0,
  onChange,
  progressColor = 'backgroundColor4', // Color para la parte avanzada
  trackColor = 'backgroundColor1',    // Color para la parte fija
  showLabel = true,
  children
}) => {
  const [localValue, setLocalValue] = useState(propValue);
  const [isDragging, setIsDragging] = useState(false);

  // Calcular el porcentaje de progreso
  const progressPercentage = ((localValue - min) / (max - min)) * 100;

  // Sincronizar con el valor prop cuando no se está interactuando
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(propValue);
    }
  }, [propValue, isDragging]);

  const handleChange = (e) => {
    const newValue = Number(e.target.value);
    setLocalValue(newValue);

    if (!isDragging && onChange) {
      onChange(newValue);
    }
  };

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      if (onChange && localValue !== propValue) {
        onChange(localValue);
      }
    }
  };

  return (
    <>
      <style>{cssStyles}</style>
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {children}
        <div className="rangeContainer">
          <div className="rangeInputWrapper">
            <input
              type="range"
              min={min}
              max={max}
              step={step}
              value={isDragging ? localValue : propValue}
              onChange={handleChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className="rangeInputProgress"
              style={{
                '--progress': `${progressPercentage}%`,
                '--progress-color': `var(--${progressColor})`,
                '--track-color': `var(--${trackColor})`,
              }}
            />
          </div>
          {showLabel && (
            <div className="rangeValueMinimal">
              {Number.isInteger(localValue)
                ? localValue
                : parseFloat(localValue.toFixed(1))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RangeInput;
