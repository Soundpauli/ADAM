import React from 'react';
import { Globe } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onChange: (lang: string) => void;
  disabled?: boolean;
  compact?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ 
  selectedLanguage, 
  onChange, 
  disabled = false,
  compact = false
}) => {
  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'DE', name: 'German', flag: '🇩🇪' },
    { code: 'FR', name: 'French', flag: '🇫🇷' },
  ];
  
  const selectedLang = languages.find(l => l.code === selectedLanguage) || languages[0];

  return (
    <div className="relative inline-block">
      <div className={`flex items-center ${compact ? 'space-x-1' : 'space-x-2'} rounded-md border border-gray-300 bg-white ${
        compact ? 'py-1 px-2' : 'py-2 px-3'
      } shadow-sm ${
        !disabled ? 'hover:bg-gray-50' : 'opacity-70'
      } transition-all duration-150`}>
        <span className="text-base">{selectedLang.flag}</span>
        <select
          value={selectedLanguage}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none bg-transparent text-sm font-medium text-gray-700 focus:outline-none disabled:cursor-not-allowed pr-6"
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code} className="flex items-center">
              {compact ? lang.code : lang.name}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-700">
          <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LanguageSelector;