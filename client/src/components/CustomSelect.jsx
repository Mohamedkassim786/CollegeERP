import React, { useState, useRef, useEffect, Children, isValidElement, forwardRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = forwardRef(({
    value,
    defaultValue,
    onChange,
    onBlur,
    children,
    className = '',
    name,
    required,
    disabled,
    ...rest
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalValue, setInternalValue] = useState(defaultValue || '');
    const dropdownRef = useRef(null);

    // Determine actual value (controlled vs uncontrolled)
    const activeValue = value !== undefined ? value : internalValue;

    // Flatten children to extract options
    const options = [];

    // Recursive function to extract option values from standard <option> tags
    const extractOptions = (node) => {
        Children.forEach(node, child => {
            if (!isValidElement(child)) return;

            if (child.type === 'option') {
                options.push({
                    value: child.props.value !== undefined ? child.props.value : child.props.children,
                    label: child.props.children,
                    disabled: child.props.disabled || false
                });
            } else if (child.props && child.props.children) {
                // If it's a map or fragment, dig deeper
                extractOptions(child.props.children);
            }
        });
    };

    extractOptions(children);

    const selectedOption = options.find(opt => String(opt.value) === String(activeValue)) || options.find(opt => opt.value === '') || options[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
                if (onBlur) onBlur({ target: { name, value: activeValue } });
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [activeValue, onBlur, name]);

    const handleSelect = (opt) => {
        if (opt.disabled) return;
        setIsOpen(false);
        setInternalValue(opt.value);
        if (onChange) {
            // Mock native event object shape
            onChange({
                target: { name, value: opt.value }
            });
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <div
                className={`flex items-center justify-between w-full px-4 py-3 bg-white/95 backdrop-blur-sm border-2 rounded-xl font-medium text-gray-800 transition-all duration-300 group ${isOpen ? 'ring-4 ring-blue-500/20 border-blue-600 shadow-lg' : 'border-gray-200 hover:border-blue-400 hover:shadow-md'} ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                {...rest}
            >
                <span className="truncate select-none">{selectedOption ? selectedOption.label : 'Select...'}</span>
                <div className={`p-1 rounded-lg transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500'}`}>
                    <ChevronDown size={16} className={`transition-transform duration-300 flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-[99999] w-full mt-2 bg-white/95 backdrop-blur-md border border-gray-100 rounded-xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] py-2 max-h-64 overflow-y-auto custom-scrollbar animate-slideDown origin-top ring-1 ring-black/5">
                    {options.length > 0 ? options.map((opt, idx) => {
                        const isSelected = String(opt.value) === String(activeValue);
                        return (
                            <div
                                key={idx}
                                className={`px-4 py-3 mx-2 my-1 rounded-lg flex items-center justify-between text-sm font-medium transition-all duration-200 ${opt.disabled ? 'text-gray-400 cursor-not-allowed bg-gray-50' : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-transparent hover:text-blue-700 cursor-pointer'} ${isSelected ? 'bg-blue-50 text-blue-700 font-bold shadow-sm ring-1 ring-blue-500/20' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleSelect(opt);
                                }}
                            >
                                <span className="truncate">{opt.label}</span>
                                {isSelected && <Check size={16} className="text-blue-600 animate-fadeIn flex-shrink-0 ml-2" />}
                            </div>
                        )
                    }) : (
                        <div className="px-5 py-6 text-sm text-gray-400 italic text-center flex flex-col items-center justify-center gap-2">
                            <span>No options available</span>
                        </div>
                    )}
                </div>
            )}

            {/* Native hidden select for form submissions and screen readers */}
            <select
                name={name}
                value={activeValue}
                onChange={onChange}
                className="hidden"
                required={required}
                disabled={disabled}
                ref={ref}
            >
                {children}
            </select>
        </div>
    );
});

CustomSelect.displayName = 'CustomSelect';

export default CustomSelect;
