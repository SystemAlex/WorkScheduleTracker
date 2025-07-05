'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DropDownProps {
  options: { label: string; value: string }[];
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function DropDown({
  options,
  placeholder = 'Seleccionar...',
  value,
  onChange,
  disabled,
}: DropDownProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  // Flag para controlar navegación con teclado y evitar override de activeIndex
  const isNavigatingWithKeyboard = React.useRef(false);

  React.useEffect(() => {
    const selectedLabel =
      options.find((opt) => opt.value === value)?.label || '';
    setInputValue(selectedLabel);
  }, [value, options]);

  const filteredOptions = inputValue
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(inputValue.toLowerCase()),
      )
    : options;

  // Solo actualizar activeIndex automáticamente cuando NO se está navegando con flechas
  React.useEffect(() => {
    if (!open) {
      setActiveIndex(null);
      return;
    }
    if (isNavigatingWithKeyboard.current) {
      // No tocar el índice porque el usuario navega con teclado
      return;
    }
    if (filteredOptions.length === 0) {
      setActiveIndex(null);
      return;
    }
    const index = filteredOptions.findIndex((opt) =>
      opt.label.toLowerCase().startsWith(inputValue.toLowerCase()),
    );
    setActiveIndex(index === -1 ? 0 : index);
  }, [inputValue, filteredOptions, open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setOpen(true);
      setActiveIndex(0);
      event.preventDefault();
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      isNavigatingWithKeyboard.current = true;
      setActiveIndex((prev) => {
        if (prev === null) return 0;
        if (event.key === 'ArrowDown') {
          return prev === filteredOptions.length - 1 ? 0 : prev + 1;
        } else {
          return prev === 0 ? filteredOptions.length - 1 : prev - 1;
        }
      });
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex !== null) {
        const selected = filteredOptions[activeIndex];
        onChange(selected.value);
        setInputValue(selected.label);
        setOpen(false);
        setActiveIndex(null);
        isNavigatingWithKeyboard.current = false;
      }
    } else if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(null);
      isNavigatingWithKeyboard.current = false;
    } else {
      // Cualquier otra tecla cancela la navegación con flechas
      isNavigatingWithKeyboard.current = false;
    }
  };

  const ignoreBlur = React.useRef(false);

  const handleInputBlur = () => {
    setTimeout(() => {
      if (ignoreBlur.current) {
        ignoreBlur.current = false;
        return;
      }
      if (activeIndex !== null && filteredOptions[activeIndex]) {
        const selected = filteredOptions[activeIndex];
        onChange(selected.value);
        setInputValue(selected.label);
      } else {
        const selectedLabel =
          options.find((opt) => opt.value === value)?.label || '';
        setInputValue(selectedLabel);
      }
      setOpen(false);
      setActiveIndex(null);
      isNavigatingWithKeyboard.current = false;
    }, 150);
  };

  const handleMouseDownDropdown = () => {
    ignoreBlur.current = true;
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <div className="relative">
          <input
            type="text"
            role="combobox"
            aria-controls="dropdown-list"
            aria-expanded={open}
            aria-activedescendant={
              activeIndex !== null ? `option-${activeIndex}` : undefined
            }
            placeholder={placeholder}
            disabled={disabled}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setOpen(true);
              isNavigatingWithKeyboard.current = false; // nuevo texto cancela navegación con flechas
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            onBlur={handleInputBlur}
            className={cn(
              'w-full rounded-md border border-input bg-background px-3 py-2 pr-8 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
            )}
          />
          <ChevronsUpDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onMouseDown={handleMouseDownDropdown}
      >
        <Command id="dropdown-list">
          <CommandEmpty>No se encontraron resultados.</CommandEmpty>
          <CommandGroup>
            {filteredOptions.map((opt, idx) => (
              <CommandItem
                id={`option-${idx}`}
                key={opt.value}
                value={opt.value}
                className={cn(
                  activeIndex === idx ? 'bg-primary text-white' : '',
                )}
                onSelect={(currentValue) => {
                  const match = options.find((o) => o.value === currentValue);
                  if (match) {
                    onChange(match.value);
                    setInputValue(match.label);
                    setOpen(false);
                    setActiveIndex(null);
                    isNavigatingWithKeyboard.current = false;
                  }
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === opt.value ? 'opacity-100' : 'opacity-0',
                  )}
                />
                {opt.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
