import Select, { StylesConfig, components } from 'react-select';
import { TIMEZONE_OPTIONS, type TimezoneOption } from '@/constants/timezones';

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isDisabled?: boolean;
  /** When true, allows clearing the selection (for optional fields like site timezone) */
  allowClear?: boolean;
}

const selectStyles: StylesConfig<TimezoneOption, false> = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderColor: state.isFocused ? '#1B4332' : '#cbd5e1',
    borderWidth: 1,
    boxShadow: state.isFocused ? '0 0 0 2px rgba(27, 67, 50, 0.2)' : 'none',
    '&:hover': {
      borderColor: state.isFocused ? '#1B4332' : '#94a3b8',
    },
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#1B4332' : state.isFocused ? '#f1f5f9' : 'white',
    color: state.isSelected ? 'white' : '#1e293b',
    cursor: 'pointer',
  }),
  singleValue: (base) => ({
    ...base,
    color: '#1e293b',
  }),
  input: (base) => ({
    ...base,
    color: '#1e293b',
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b',
  }),
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 shrink-0">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);

function CustomMenuList(props: React.PropsWithChildren) {
  const { children, ...rest } = props as React.ComponentProps<typeof components.MenuList>;
  return (
    <components.MenuList {...rest}>
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-2">
        <SearchIcon />
        <span className="text-sm text-slate-500">Type to search timezones...</span>
      </div>
      {children}
    </components.MenuList>
  );
}

export function TimezoneSelect({ value, onChange, placeholder = 'Search or select timezone...', isDisabled, allowClear }: TimezoneSelectProps) {
  const options = [...TIMEZONE_OPTIONS];
  const existingOption = options.find((o) => o.value === value);
  if (value && !existingOption) {
    options.unshift({ value, label: `${value} (current)` });
  }

  const selectedOption = value ? (options.find((o) => o.value === value) ?? null) : null;

  return (
    <Select<TimezoneOption>
      isClearable={allowClear}
      isSearchable
      options={options}
      value={selectedOption}
      onChange={(opt) => onChange(opt?.value ?? (allowClear ? '' : 'UTC'))}
      placeholder={placeholder}
      isDisabled={isDisabled}
      styles={selectStyles}
      components={{ MenuList: CustomMenuList }}
      noOptionsMessage={({ inputValue }) =>
        inputValue ? `No timezone found for "${inputValue}"` : 'Type to search timezones'
      }
      filterOption={(option, input) => {
        const search = input.toLowerCase();
        const label = option.label.toLowerCase();
        const val = option.value.toLowerCase();
        return label.includes(search) || val.includes(search);
      }}
    />
  );
}
