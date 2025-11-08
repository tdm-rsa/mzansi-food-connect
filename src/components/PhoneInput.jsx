import { useState, useEffect } from 'react';

export default function PhoneInput({ value, onChange, placeholder, className, ...props }) {
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number as +27XX XXX XXXX
  const formatPhoneNumber = (input) => {
    // Remove all non-digits except +
    const cleaned = input.replace(/[^\d+]/g, '');
    
    // Remove + if it's not at the start
    const sanitized = cleaned.charAt(0) === '+' ? '+' + cleaned.slice(1).replace(/\+/g, '') : cleaned;
    
    // If it starts with 0, convert to +27
    if (sanitized.startsWith('0')) {
      return formatWith27(sanitized.substring(1));
    }
    
    // If it starts with 27, add +
    if (sanitized.startsWith('27') && !sanitized.startsWith('+27')) {
      return formatWith27(sanitized.substring(2));
    }
    
    // If it starts with +27, format it
    if (sanitized.startsWith('+27')) {
      return formatWith27(sanitized.substring(3));
    }
    
    // Otherwise, assume it's a local number and add +27
    return formatWith27(sanitized);
  };

  const formatWith27 = (digits) => {
    // Remove any non-digits
    const nums = digits.replace(/\D/g, '');

    // Format as +27 XX XXX XXXX (with space after +27)
    let formatted = '+27';
    if (nums.length > 0) {
      formatted += ' ' + nums.substring(0, 2);
    }
    if (nums.length > 2) {
      formatted += ' ' + nums.substring(2, 5);
    }
    if (nums.length > 5) {
      formatted += ' ' + nums.substring(5, 9);
    }

    return formatted;
  };

  // Clean phone number for storage (remove spaces, keep +27)
  const cleanPhoneNumber = (formatted) => {
    return formatted.replace(/\s/g, '');
  };

  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value));
    } else {
      setDisplayValue('+27 ');
    }
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    
    // Don't allow deleting the +27 prefix (now with space)
    if (input.length < 4) {
      setDisplayValue('+27 ');
      onChange({ target: { value: '+27' } });
      return;
    }
    
    const formatted = formatPhoneNumber(input);
    setDisplayValue(formatted);
    
    // Pass cleaned value to parent
    const cleaned = cleanPhoneNumber(formatted);
    onChange({ target: { value: cleaned } });
  };

  const handleKeyDown = (e) => {
    // Prevent backspace from deleting +27 (with space)
    if (e.key === 'Backspace' && displayValue.length <= 4) {
      e.preventDefault();
    }
  };

  return (
    <input
      type="tel"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || "+27 XX XXX XXXX"}
      className={className}
      {...props}
    />
  );
}
