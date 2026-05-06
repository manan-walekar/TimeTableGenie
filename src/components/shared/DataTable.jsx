import React, { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, ArrowUpDown, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DataTable({ columns, data, onDelete, onAdd, addLabel = "Add New" }) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const filtered = useMemo(() => {
    let items = [...data];
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(item =>
        columns.some(col => String(item[col.key] || '').toLowerCase().includes(q))
      );
    }
    if (sortKey) {
      items.sort((a, b) => {
        const av = a[sortKey] || '';
        const bv = b[sortKey] || '';
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return items;
  }, [data, search, sortKey, sortDir, columns]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {onAdd && (
          <Button onClick={onAdd} className="shrink-0">
            <Plus className="w-4 h-4 mr-2" />
            {addLabel}
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map(col => (
                <TableHead key={col.key}>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider hover:text-foreground transition-colors"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    <ArrowUpDown className="w-3 h-3" />
                  </button>
                </TableHead>
              ))}
              {onDelete && <TableHead className="w-12" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (onDelete ? 1 : 0)} className="text-center py-12 text-muted-foreground">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(item => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                  >
                    {columns.map(col => (
                      <TableCell key={col.key} className="py-3">
                        {col.render ? col.render(item[col.key], item) : (item[col.key] || '—')}
                      </TableCell>
                    ))}
                    {onDelete && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(item.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">{filtered.length} of {data.length} records</p>
    </div>
  );
}