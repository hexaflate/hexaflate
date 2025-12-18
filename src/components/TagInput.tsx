import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { THEME_COLOR, THEME_COLOR_DARK, withOpacity } from '../utils/themeColors';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

const TagInput: React.FC<TagInputProps> = ({ 
  value = [], 
  onChange, 
  placeholder = "Type and press space to add tags...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value[value.length - 1]);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Add any remaining input as a tag when focus is lost
    if (inputValue.trim()) {
      addTag(inputValue);
      setInputValue('');
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleTagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    inputRef.current?.focus();
  };

  return (
    <div 
      className={`flex flex-wrap items-center gap-2 p-2.5 border rounded-xl min-h-[42px] max-h-[120px] overflow-y-auto bg-white/80 backdrop-blur-sm transition-all duration-200 ${
        isFocused 
          ? 'border-primary-400 ring-2 ring-primary-100 shadow-sm' 
          : 'border-neutral-200/80 hover:border-neutral-300'
      } ${className}`}
      onClick={handleTagClick}
    >
      {/* Tags */}
      {value.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs bg-gradient-to-r from-primary-50 to-primary-100/50 text-primary-700 rounded-lg border border-primary-200/80 flex-shrink-0 font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag);
            }}
            className="ml-1 text-primary-500 hover:text-primary-700 focus:outline-none transition-colors"
          >
            <X size={12} />
          </button>
        </span>
      ))}
      
      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[100px] max-w-[200px] outline-none text-sm bg-transparent flex-shrink-0 placeholder:text-neutral-400"
      />
    </div>
  );
};

export default TagInput;
