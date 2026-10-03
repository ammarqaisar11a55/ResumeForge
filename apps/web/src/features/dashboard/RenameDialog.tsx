import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Dialog } from '../../components/ui/Dialog';
import { Field } from '../../components/ui/Field';
import { TextInput } from '../../components/ui/TextInput';

export function RenameDialog({
  open,
  initialTitle,
  onOpenChange,
  onRename,
}: {
  open: boolean;
  initialTitle: string;
  onOpenChange: (open: boolean) => void;
  onRename: (title: string) => void;
}) {
  // The parent remounts this dialog per resume (key), so initial state is enough.
  const [title, setTitle] = useState(initialTitle);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onRename(title.trim());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Rename resume">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field label="Resume name">
          {({ id }) => (
            <TextInput
              id={id}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          )}
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={!title.trim()}>
            Rename
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
