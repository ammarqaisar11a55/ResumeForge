import { Bold, Italic } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, type TextareaHTMLAttributes } from 'react';
import { TextArea } from '../../../components/ui/TextInput';
import { IconButton } from '../../../components/ui/IconButton';
import { MOD_LABEL, isModKey } from '../../../lib/platform';

interface RichTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  value: string;
  onChange: (value: string) => void;
  /** Show the bold/italic toolbar. */
  toolbar?: boolean;
}

/**
 * Plain textarea with light inline formatting: selected text can be wrapped
 * in **bold** or *italic*, which the renderer turns into real emphasis.
 */
export const RichTextArea = forwardRef<HTMLTextAreaElement, RichTextAreaProps>(function RichTextArea(
  { value, onChange, toolbar = true, onKeyDown, ...props },
  ref,
) {
  const inner = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => inner.current!);

  const wrap = (marker: string) => {
    const el = inner.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    const selected = value.slice(start, end) || 'text';
    const next = `${value.slice(0, start)}${marker}${selected}${marker}${value.slice(end)}`;
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  };

  return (
    <div className="relative">
      <TextArea
        ref={inner}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (isModKey(e) && !e.shiftKey && (e.key === 'b' || e.key === 'i')) {
            e.preventDefault();
            wrap(e.key === 'b' ? '**' : '*');
            return;
          }
          onKeyDown?.(e);
        }}
        className={toolbar ? 'pr-16' : undefined}
        {...props}
      />
      {toolbar && (
        <div className="absolute top-1 right-1 flex gap-0.5">
          <IconButton size="xs" label="Bold" shortcut={[MOD_LABEL, 'B']} onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('**')}>
            <Bold className="size-3.5" />
          </IconButton>
          <IconButton size="xs" label="Italic" shortcut={[MOD_LABEL, 'I']} onMouseDown={(e) => e.preventDefault()} onClick={() => wrap('*')}>
            <Italic className="size-3.5" />
          </IconButton>
        </div>
      )}
    </div>
  );
});
