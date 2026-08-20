import { useState, useEffect } from 'react';

/**
 * Componente CurrencyInput
 * Permite ingresar montos de dinero visualizando puntos de miles y comas decimales en formato de Argentina (1.500.000,00).
 * Retorna el valor numérico (float) al callback onChange.
 */
export default function CurrencyInput({ 
  value, 
  onChange, 
  placeholder = "0,00", 
  className = "form-control", 
  currencySymbol = "$", 
  required = false,
  autoFocus = false
}) {
  const formatValue = (val) => {
    if (val === undefined || val === null || val === '') return '';
    if (typeof val === 'number') {
      if (isNaN(val) || val === 0) return '';
      const parts = val.toString().split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      const decimalPart = parts[1] !== undefined ? ',' + parts[1].slice(0, 2) : '';
      return integerPart + decimalPart;
    }
    return String(val);
  };

  const [inputValue, setInputValue] = useState(() => formatValue(value));

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setInputValue(formatValue(value));
    }
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value;

    // Permitir dígitos, coma y signo menos
    let clean = raw.replace(/[^0-9,-]/g, '');

    // Limitar a una sola coma
    const commaIndex = clean.indexOf(',');
    if (commaIndex !== -1) {
      const before = clean.substring(0, commaIndex);
      const after = clean.substring(commaIndex + 1).replace(/,/g, '').slice(0, 2);
      clean = before + ',' + after;
    }

    // Formatear separador de miles con puntos
    const parts = clean.split(',');
    let integerDigits = parts[0].replace(/\./g, '');
    let formattedInteger = integerDigits ? integerDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';

    let formattedString = formattedInteger;
    if (parts.length > 1) {
      formattedString += ',' + parts[1];
    }

    setInputValue(formattedString);

    // Calcular valor float real para el estado del padre
    if (!integerDigits && parts.length === 1) {
      onChange('');
      return;
    }

    const floatStr = integerDigits + (parts[1] !== undefined ? '.' + parts[1] : '');
    const num = parseFloat(floatStr);
    onChange(isNaN(num) ? '' : num);
  };

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
      {currencySymbol && (
        <span style={{
          position: 'absolute',
          left: '0.85rem',
          color: 'var(--text-muted)',
          fontWeight: '700',
          fontSize: '0.9rem',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {currencySymbol}
        </span>
      )}
      <input
        type="text"
        className={className}
        style={{ paddingLeft: currencySymbol ? (currencySymbol.length > 2 ? '2.8rem' : '2.2rem') : '0.85rem' }}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        autoFocus={autoFocus}
      />
    </div>
  );
}
