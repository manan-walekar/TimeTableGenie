import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Pencil, Trash2, GripVertical, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const DAYS = ['MON', 'TUE', 'WED', 'THUR', 'FRI', 'SAT'];
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SLOT_LABELS = ['1 LECTURE', '2 LECTURE', '3 LECTURE', '4 LECTURE', 'LUNCH', '5 LECTURE', '6 LECTURE', '7 LECTURE', '8 LECTURE', '9 LECTURE'];
const TIME_RANGES = ['8:50 To 9:20', '9:20 To 10:10', '10:10 To 11:00', '11:00 To 11:50', '11:50 To 12:35', '12:20 To 13:10', '13:10 To 14:00', '14:00 To 14:50', '14:50 To 15:40', '15:40 To 16:30'];
const LUNCH_SLOT = 4;

const SLOT_COLORS = [
  'bg-blue-100 border-blue-300 text-blue-800',
  'bg-green-100 border-green-300 text-green-800',
  'bg-yellow-100 border-yellow-300 text-yellow-800',
  'bg-pink-100 border-pink-300 text-pink-800',
  'bg-purple-100 border-purple-300 text-purple-800',
  'bg-orange-100 border-orange-300 text-orange-800',
  'bg-teal-100 border-teal-300 text-teal-800',
];

function getAbbr(name = '') {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

// Animated cell wrapper — scales in on add, scales out on remove
function AnimatedCell({ entryKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={entryKey}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default function DraggableTimetableGrid({ schedule, subjectColorMap, onEdit, onRemove, onSwap, onAdd }) {
  const [dragOver, setDragOver] = useState(null);

  const getEntry = (dayFull, slotIdx) => schedule.find(s => s.day === dayFull && s.slot === slotIdx);

  const handleDragEnd = (result) => {
    setDragOver(null);
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const [srcDay, srcSlot] = draggableId.split('::');
    const [dstDay, dstSlot] = destination.droppableId.split('::');
    if (srcDay === dstDay && srcSlot === dstSlot) return;
    onSwap(srcDay, parseInt(srcSlot), dstDay, parseInt(dstSlot));
  };

  // Label for the add dialog title: "DAY - SLOT_LABEL (TIME)"
  const getSlotLabel = (dayFull, mappedSlot) => {
    const dayShort = FULL_DAYS.indexOf(dayFull) >= 0 ? DAYS[FULL_DAYS.indexOf(dayFull)] : dayFull;
    const slotIdx = mappedSlot < LUNCH_SLOT ? mappedSlot : mappedSlot + 1;
    const label = SLOT_LABELS[slotIdx] || `Slot ${mappedSlot + 1}`;
    const time = TIME_RANGES[slotIdx] || '';
    return `${dayShort.toUpperCase()} - ${label} (${time})`;
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd} onDragUpdate={u => setDragOver(u.destination?.droppableId || null)}>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse min-w-[900px]">
          <thead>
            <tr className="border-b border-border">
              <th className="border border-border px-2 py-2 bg-muted/50 text-left font-semibold w-16">Slot No.</th>
              {SLOT_LABELS.map((label, i) => (
                <th key={i} className={cn("border border-border px-2 py-1.5 font-semibold text-center",
                  i === LUNCH_SLOT ? "bg-orange-50 text-orange-600" : "bg-muted/30")}>
                  {i + 1}
                  <div className={i === LUNCH_SLOT ? "text-orange-600 font-bold" : "text-primary"}>{label}</div>
                </th>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th className="border border-border px-2 py-1.5 bg-muted/50 font-semibold">Slot No.</th>
              {TIME_RANGES.map((t, i) => (
                <th key={i} className={cn("border border-border px-1 py-1 text-center font-normal text-[10px] leading-tight",
                  i === LUNCH_SLOT ? "bg-orange-50 text-orange-500" : "text-muted-foreground")}>
                  {t}
                </th>
              ))}
            </tr>
            <tr className="border-b border-border">
              <th className="border border-border px-2 py-1.5 bg-muted/50 font-semibold">DAY</th>
              {TIME_RANGES.map((_, i) => (
                <th key={i} className={cn("border border-border", i === LUNCH_SLOT && "bg-orange-50")} />
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map((day, dayIdx) => (
              <tr key={day} className="border-b border-border">
                <td className="border border-border px-2 py-1.5 font-bold text-center bg-muted/30">{day}</td>
                {SLOT_LABELS.map((_, slotIdx) => {
                  if (slotIdx === LUNCH_SLOT) {
                    return (
                      <td key={slotIdx} className="border border-border px-1 py-1 text-center bg-orange-50">
                        <span className="text-orange-500 font-semibold text-[11px]">LUNCH</span>
                      </td>
                    );
                  }
                  const mappedSlot = slotIdx < LUNCH_SLOT ? slotIdx : slotIdx - 1;
                  const dayFull = FULL_DAYS[dayIdx];
                  const droppableId = `${dayFull}::${mappedSlot}`;
                  const entry = getEntry(dayFull, mappedSlot);
                  const colorClass = entry ? (subjectColorMap[entry.subject_code] || SLOT_COLORS[0]) : '';
                  const isOver = dragOver === droppableId;

                  return (
                    <Droppable droppableId={droppableId} key={slotIdx}>
                      {(provided) => (
                        <td
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            "border border-border px-1 py-1 min-w-[90px] transition-colors",
                            isOver && !entry && "bg-primary/10",
                            isOver && entry && "ring-2 ring-primary/50 ring-inset"
                          )}
                        >
                          {entry ? (
                            <AnimatedCell entryKey={`${dayFull}-${mappedSlot}-${entry.subject_code}`}>
                              <Draggable draggableId={`${dayFull}::${mappedSlot}`} index={0}>
                                {(drag, snapshot) => (
                                  <div
                                    ref={drag.innerRef}
                                    {...drag.draggableProps}
                                    className={cn(
                                      `rounded border text-center relative group/cell`,
                                      colorClass,
                                      snapshot.isDragging && "shadow-xl opacity-90 rotate-1 scale-105 z-50"
                                    )}
                                  >
                                    {/* Drag handle */}
                                    <div {...drag.dragHandleProps}
                                      className="absolute top-0.5 left-0.5 opacity-0 group-hover/cell:opacity-60 cursor-grab active:cursor-grabbing">
                                      <GripVertical className="w-3 h-3" />
                                    </div>

                                    <div className="px-1.5 py-1.5">
                                       <p className="font-bold text-[12px]">{entry.subject_code}</p>
                                       {entry.is_lab && (
                                         <p className="text-[9px] font-semibold opacity-90 truncate">{entry.lab_name || entry.subject_name + ' Lab'}</p>
                                       )}
                                       <p className="text-[10px] opacity-80">{getAbbr(entry.faculty_name)}</p>
                                       <p className="text-[9px] opacity-60 truncate">{entry.room_name}</p>
                                     </div>

                                    {/* Action buttons — Edit + Delete only */}
                                    <div className="absolute inset-0 bg-black/65 rounded opacity-0 group-hover/cell:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                      <button
                                        onClick={() => onEdit(dayFull, mappedSlot, entry)}
                                        className="p-1.5 rounded-md bg-white/20 hover:bg-white/40 text-white transition-colors"
                                        title="Edit"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => onRemove(dayFull, mappedSlot)}
                                        className="p-1.5 rounded-md bg-red-500/70 hover:bg-red-600 text-white transition-colors"
                                        title="Remove"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            </AnimatedCell>
                          ) : (
                            /* Empty cell — show + button on hover */
                            <motion.div
                              className={cn(
                                "min-h-[52px] rounded border-2 border-dashed transition-colors group/empty flex items-center justify-center cursor-pointer",
                                isOver ? "border-primary/40 bg-primary/5" : "border-transparent hover:border-primary/30 hover:bg-primary/5"
                              )}
                              onClick={() => onAdd(dayFull, mappedSlot, getSlotLabel(dayFull, mappedSlot))}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                            >
                              <Plus className="w-4 h-4 text-primary/40 group-hover/empty:text-primary/70 transition-colors opacity-0 group-hover/empty:opacity-100" />
                            </motion.div>
                          )}
                          <div className="hidden">{provided.placeholder}</div>
                        </td>
                      )}
                    </Droppable>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DragDropContext>
  );
}