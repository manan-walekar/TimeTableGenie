import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function FormDialog({ open, onOpenChange, title, fields, onSubmit }) {
  const [values, setValues] = React.useState({});

  React.useEffect(() => {
    if (open) {
      const defaults = {};
      fields.forEach(f => { defaults[f.key] = f.default || ''; });
      setValues(defaults);
    }
  }, [open, fields]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map(field => (
            <div key={field.key} className="space-y-1.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.type === 'select' ? (
                <Select
                  value={values[field.key] || ''}
                  onValueChange={v => setValues(prev => ({ ...prev, [field.key]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options.map(opt => (
                      <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id={field.key}
                  type={field.type || 'text'}
                  required={field.required}
                  placeholder={field.placeholder || ''}
                  value={values[field.key] || ''}
                  onChange={e => setValues(prev => ({ ...prev, [field.key]: field.type === 'number' ? Number(e.target.value) : e.target.value }))}
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}