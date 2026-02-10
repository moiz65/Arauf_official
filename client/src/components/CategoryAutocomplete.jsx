import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const CategoryAutocomplete = ({ 
  value, 
  onChange, 
  placeholder = "Enter category name...",
  categoryType = "Expense",
  required = false 
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Fetch all existing categories when component mounts or categoryType changes
  useEffect(() => {
    fetchAllCategories();
  }, [categoryType]);

  // Filter suggestions based on input
  useEffect(() => {
    if (value && suggestions.length > 0) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && value.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
    setActiveSuggestion(-1);
  }, [value, suggestions]);

  const fetchAllCategories = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CATEGORIES.LIST(categoryType));
      if (response.ok) {
        const result = await response.json();
        const allCategories = result.data
          .filter(cat => 
            cat.status === 'Active' && 
            cat.name !== 'All' && 
            cat.type === categoryType &&
            !['Expense', 'Income', 'Asset', 'Liability'].includes(cat.name) // Exclude type names as categories
          )
          .map(cat => ({
            name: cat.name,
            type: cat.type
          }));
        setSuggestions(allCategories);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setSuggestions([]);
    }
  };

  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.name);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestion(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (activeSuggestion >= 0 && filteredSuggestions[activeSuggestion]) {
          handleSuggestionClick(filteredSuggestions[activeSuggestion]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setActiveSuggestion(-1);
        break;
      default:
        break;
    }
  };

  const handleInputFocus = () => {
    if (value && filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e) => {
    // Delay hiding suggestions to allow click on suggestions
    setTimeout(() => {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }, 150);
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        required={required}
        className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
      
      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.name}
              className={`px-3 py-2 cursor-pointer text-sm ${
                index === activeSuggestion
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100'
              }`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="font-medium">{suggestion.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1">
        Type to search existing categories or enter a new one
      </p>
    </div>
  );
};

export default CategoryAutocomplete;