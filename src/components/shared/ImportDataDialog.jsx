import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileJson, FileSpreadsheet, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props:
 *  open, onOpenChange, entityName (display), onImport(records[])
 */
export default function ImportDataDialog({ open, onOpenChange, entityName, onImport }) {
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');
  const inputRef = useRef();

  const reset = () => { setStatus(null); setMessage(''); };

  const handleFile = async (file) => {
    if (!file) return;
    setStatus('loading');
    setMessage('');
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      let records = [];

      if (ext === 'json') {
        const text = await file.text();
        const parsed = JSON.parse(text);
        records = Array.isArray(parsed) ? parsed : [parsed];
      } else if (ext === 'csv') {
        const text = await file.text();
        records = parseCSV(text);
      } else if (ext === 'xlsx' || ext === 'xls') {
        records = await parseExcel(file);
      } else {
        throw new Error('Unsupported file type. Use JSON, CSV, or Excel.');
      }

      if (!records.length) throw new Error('No records found in file.');
      await onImport(records);
      setStatus('success');
      setMessage(`${records.length} record${records.length > 1 ? 's' : ''} imported successfully`);
    } catch (e) {
      setStatus('error');
      setMessage(e.message || 'Import failed');
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import {entityName} Data</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Format badges */}
          <div className="flex gap-2">
            {[
              { icon: FileJson, label: 'JSON', color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
              { icon: FileSpreadsheet, label: 'CSV', color: 'text-green-600 bg-green-50 border-green-200' },
              { icon: FileSpreadsheet, label: 'Excel', color: 'text-blue-600 bg-blue-50 border-blue-200' },
            ].map(({ icon: Icon, label, color }) => (
              <span key={label} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium ${color}`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </span>
            ))}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors',
              dragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/40'
            )}
          >
            <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm font-medium">Drop your file here</p>
            <p className="text-xs text-muted-foreground mt-1">or click to browse (.json, .csv, .xlsx)</p>
            <input
              ref={inputRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Status */}
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Processing file…
            </div>
          )}
          {status === 'success' && (
            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />{message}
            </div>
          )}
          {status === 'error' && (
            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{message}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); reset(); }}>
              {status === 'success' ? 'Close' : 'Cancel'}
            </Button>
            {status === 'success' && (
              <Button size="sm" onClick={() => { reset(); }}>Import More</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Parsers ── */

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  return lines.slice(1).map(line => {
    const vals = splitCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i]?.trim().replace(/^"|"$/g, '') ?? ''; });
    return obj;
  });
}

function splitCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuote = false;
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; }
    else if (ch === ',' && !inQuote) { result.push(cur); cur = ''; }
    else { cur += ch; }
  }
  result.push(cur);
  return result;
}

async function parseExcel(file) {
  // Load SheetJS from CDN dynamically
  if (!window.XLSX) {
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  const XLSX = window.XLSX;
  const ab = await file.arrayBuffer();
  const wb = XLSX.read(ab, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { defval: '' });
}