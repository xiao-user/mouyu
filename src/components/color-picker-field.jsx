import { useMemo, useRef } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function isHexColor(value) {
  return typeof value === 'string' && /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(value);
}

function normalizeHexColor(value, fallback) {
  const normalized = String(value || '').trim();
  return isHexColor(normalized) ? normalized : fallback;
}

export function ColorPickerField({
  value,
  onChange,
  defaultValue = '#000000',
  triggerLabel = '选择颜色',
  resetLabel = '重置',
}) {
  const safeDefaultValue = useMemo(() => normalizeHexColor(defaultValue, '#000000'), [defaultValue]);
  const safeValue = useMemo(() => normalizeHexColor(value, safeDefaultValue), [value, safeDefaultValue]);
  const colorInputRef = useRef(null);

  return (
    <div className="relative flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-9 gap-2 px-3"
        onClick={() => colorInputRef.current?.click()}
      >
        <span
          aria-hidden
          className="h-4 w-4 rounded border border-border/70"
          style={{ backgroundColor: safeValue }}
        />
        <span>{triggerLabel}</span>
      </Button>
      <Button variant="outline" size="sm" className="h-9 px-3" onClick={() => onChange(safeDefaultValue)}>
        {resetLabel}
      </Button>

      <Input
        ref={colorInputRef}
        type="color"
        value={safeValue}
        onChange={(event) => onChange(normalizeHexColor(event.target.value, safeDefaultValue))}
        className="pointer-events-none absolute left-0 top-full mt-2 h-px w-px opacity-0"
        tabIndex={-1}
        aria-hidden
      />
    </div>
  );
}
