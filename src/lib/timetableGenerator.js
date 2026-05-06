/**
 * Constraint-Based Timetable Generator with STRICT Credit Enforcement
 *
 * Rules enforced:
 * 1. Max 15 credit-points per week across all subjects
 * 2. 1 credit = 1 × 50-min theory session
 * 3. Lab subjects = 2 credits = 2 consecutive 50-min sessions in a Lab room
 * 4. Credit cap per subject is LOCKED — never exceeded (STRICT)
 * 5. Once a subject's credits are exhausted → removed from available pool permanently
 * 6. Faculty weekly load tracked → once full → marked "engaged"
 * 7. Lab room auto-assigned from available Lab-type rooms
 * 8. Lab name shown in timetable cell
 * 9. No faculty/room double-booking at same time slot
 * 10. Max 1 session per subject per day (spread across week)
 * 11. Labs scheduled in 2 consecutive slots, no crossing the break slot
 * 12. Order: Labs → Theory → Electives
 * 13. FAIL-SAFE: If all subjects exhausted, stop generation and return error
 * 14. FINAL VALIDATION: Discard timetable if any credit violations detected
 */

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const DAY_ORDER = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5 };

// ─── Credit requirements (locked) ──────────────────────────────────────────

export function getSubjectCredits(subject) {
  const credits = Number(subject.credits) || 3;
  const type = (subject.type || 'Theory').toLowerCase();

  if (type === 'lab' || credits === 2) {
    // Lab: 2 credits = 2 consecutive sessions
    return { totalSessions: 2, labBlocks: 1, theorySessions: 0, isLab: true, creditPoints: 2 };
  }
  if (credits === 3) {
    return { totalSessions: 3, labBlocks: 0, theorySessions: 3, isLab: false, creditPoints: 3 };
  }
  if (credits === 4) {
    if (type === 'lab') {
      // 4-credit lab subject: 3 theory + 1 lab block (2 sessions) = 5 sessions total but 4 credit points
      return { totalSessions: 5, labBlocks: 1, theorySessions: 3, isLab: false, creditPoints: 4 };
    }
    return { totalSessions: 4, labBlocks: 0, theorySessions: 4, isLab: false, creditPoints: 4 };
  }
  // Fallback: use credit count directly
  const n = subject.hours_per_week || credits;
  return { totalSessions: n, labBlocks: 0, theorySessions: n, isLab: false, creditPoints: n };
}

// ─── Grid helpers ───────────────────────────────────────────────────────────

function makeGrid(days, slots) {
  const grid = {};
  for (const d of days) {
    grid[d] = {};
    for (let s = 0; s < slots; s++) grid[d][s] = null;
  }
  return grid;
}

function gridToSchedule(grid) {
  const schedule = [];
  for (const [day, slots] of Object.entries(grid)) {
    for (const [slot, entry] of Object.entries(slots)) {
      if (entry) schedule.push({ ...entry, day, slot: Number(slot) });
    }
  }
  schedule.sort((a, b) => (DAY_ORDER[a.day] - DAY_ORDER[b.day]) || (a.slot - b.slot));
  return schedule;
}

// ─── Constraint checker ─────────────────────────────────────────────────────

function canPlace(grid, days, subject, fac, room, day, slot, opts) {
  const {
    slotsPerDay = 7,
    breakAfterSlot = 3,
    maxFacultyHoursPerDay = 6,
    maxFacultyHoursPerWeek,  // passed as remaining capacity
    maxLecturesPerDay = 5,
    maxLabsPerDay = 1,
    maxConsecutiveClasses = 3,
    isLab = false,
  } = opts;

  const labSlots = 2;

  // ── Basic range / break checks ──
  if (slot >= slotsPerDay) return { ok: false, reason: 'Slot out of range' };
  if (slot === breakAfterSlot) return { ok: false, reason: 'Break slot' };

  if (isLab) {
    if (slot + labSlots > slotsPerDay) return { ok: false, reason: 'Lab block exceeds day' };
    for (let ls = slot; ls < slot + labSlots; ls++) {
      if (ls === breakAfterSlot) return { ok: false, reason: 'Lab crosses break slot' };
      if (grid[day][ls] !== null) return { ok: false, reason: `Slot ${ls} occupied` };
    }
    if (room.type !== 'Lab') return { ok: false, reason: `${room.name} is not a Lab room` };
  } else {
    if (grid[day][slot] !== null) return { ok: false, reason: 'Slot occupied' };
  }

  // ── Same subject already on this day ──
  for (let s = 0; s < slotsPerDay; s++) {
    if (grid[day][s]?.subject_code === subject.code) {
      return { ok: false, reason: `${subject.code} already on ${day}` };
    }
  }

  // ── Faculty: slot conflict (same day) ──
  const checkSlots = isLab ? [slot, slot + 1] : [slot];
  for (const cs of checkSlots) {
    if (grid[day][cs]?.faculty_name === fac.name) {
      return { ok: false, reason: `Faculty ${fac.name} busy at ${day} slot ${cs}` };
    }
  }

  // ── Room: slot conflict (same day) ──
  for (const cs of checkSlots) {
    if (grid[day][cs]?.room_name === room.name) {
      return { ok: false, reason: `Room ${room.name} occupied at ${day} slot ${cs}` };
    }
  }

  // ── Faculty daily limit ──
  let facDayCount = 0;
  for (let s = 0; s < slotsPerDay; s++) {
    if (grid[day][s]?.faculty_name === fac.name) facDayCount++;
  }
  if (facDayCount + (isLab ? 2 : 1) > maxFacultyHoursPerDay) {
    return { ok: false, reason: `Faculty ${fac.name} daily limit exceeded` };
  }

  // ── Faculty weekly limit (passed as remaining hours) ──
  if (maxFacultyHoursPerWeek !== undefined) {
    let facWeekCount = 0;
    for (const d of days) {
      for (let s = 0; s < slotsPerDay; s++) {
        if (grid[d][s]?.faculty_name === fac.name) facWeekCount++;
      }
    }
    if (facWeekCount + (isLab ? 2 : 1) > maxFacultyHoursPerWeek) {
      return { ok: false, reason: `Faculty ${fac.name} weekly limit exceeded` };
    }
  }

  // ── Faculty consecutive classes ──
  if (!isLab) {
    let run = 1;
    for (let s = slot - 1; s >= 0 && s !== breakAfterSlot; s--) {
      if (grid[day][s]?.faculty_name === fac.name) run++; else break;
    }
    for (let s = slot + 1; s < slotsPerDay && s !== breakAfterSlot; s++) {
      if (grid[day][s]?.faculty_name === fac.name) run++; else break;
    }
    if (run > maxConsecutiveClasses) {
      return { ok: false, reason: `Faculty ${fac.name} consecutive limit` };
    }
  }

  // ── Daily lecture/lab caps ──
  let dayLec = 0, dayLab = 0;
  for (let s = 0; s < slotsPerDay; s++) {
    const e = grid[day][s];
    if (e) { if (e.is_lab) dayLab++; else dayLec++; }
  }
  if (isLab && dayLab >= maxLabsPerDay) return { ok: false, reason: `Lab day cap reached on ${day}` };
  if (!isLab && dayLec >= maxLecturesPerDay) return { ok: false, reason: `Lecture day cap reached on ${day}` };

  // ── Faculty available_slots ──
  if (fac.available_slots?.length > 0) {
    const abbr = day.slice(0, 3);
    if (!fac.available_slots.includes(`${abbr}-${slot + 1}`)) {
      return { ok: false, reason: `Faculty ${fac.name} not available` };
    }
  }

  return { ok: true };
}

// ─── Day-spread scorer ──────────────────────────────────────────────────────

function scoreDay(usedDays, day) {
  if (usedDays.size === 0) return 0;
  let minGap = Infinity;
  for (const d of usedDays) {
    const gap = Math.abs(DAY_ORDER[day] - DAY_ORDER[d]);
    if (gap < minGap) minGap = gap;
  }
  return -minGap; // lower = better spread
}

// ─── Place / unplace ────────────────────────────────────────────────────────

function placeEntry(grid, subject, fac, room, day, slot, isLab) {
  const entry = {
    subject_code: subject.code,
    subject_name: subject.name,
    faculty_name: fac.name,
    room_name: room.name,
    room_type: room.type,
    is_lab: isLab,
    // For labs: show lab name explicitly
    lab_name: isLab ? (subject.lab_name || subject.name + ' Lab') : null,
  };
  if (isLab) {
    grid[day][slot] = { ...entry, lab_slot: 'start' };
    grid[day][slot + 1] = { ...entry, lab_slot: 'end' };
  } else {
    grid[day][slot] = entry;
  }
}

// ─── Credit constraint helpers (STRICT) ───────────────────────────────────────

function hasRemainingCredits(subjectStatus, subjectCode) {
  const ss = subjectStatus[subjectCode];
  if (!ss) return false;
  return ss.creditsUsed < ss.creditPoints;
}

function getAvailableSubjects(subjects, subjectStatus) {
  return subjects.filter(s => hasRemainingCredits(subjectStatus, s.code));
}

function checkSubjectCreditLimit(subjectStatus, subjectCode, additionalCredits = 1, debugMode = false) {
  const ss = subjectStatus[subjectCode];
  if (!ss) return { ok: false, reason: 'Subject not found in status' };

  if (debugMode) {
    console.log({
      subject: ss.name,
      code: subjectCode,
      used: ss.creditsUsed,
      additional: additionalCredits,
      total: ss.creditPoints,
      wouldExceed: ss.creditsUsed + additionalCredits > ss.creditPoints
    });
  }

  if (ss.creditsUsed + additionalCredits > ss.creditPoints) {
    return {
      ok: false,
      reason: `Subject ${ss.name} (${subjectCode}) would exceed credit limit: ${ss.creditsUsed} + ${additionalCredits} > ${ss.creditPoints}`
    };
  }

  return { ok: true };
}

function validateFinalCredits(subjectStatus) {
  const violations = [];
  for (const [code, ss] of Object.entries(subjectStatus)) {
    if (ss.creditsUsed > ss.creditPoints) {
      violations.push({
        subject: ss.name,
        code,
        used: ss.creditsUsed,
        limit: ss.creditPoints,
        exceeded: ss.creditsUsed - ss.creditPoints
      });
    }
  }
  return violations;
}

// ─── Main generator ─────────────────────────────────────────────────────────

export function generateTimetable(subjects, faculty, rooms, constraints = {}) {
  const {
    activeDayToggles = null,
    workingDays = 5,
    slotsPerDay = 7,
    maxLecturesPerDay = 5,
    maxLabsPerDay = 1,
    maxFacultyHoursPerDay = 6,
    maxFacultyHoursPerWeek = 20,
    maxConsecutiveClasses = 3,
    breakAfterSlot = 3,
    blockedDays = [],
    subjectPriority = '',
    weeklyCreditsLimit = 15,  // ← total credit cap for the whole timetable
    debugMode = false,  // ← enable debug logging
  } = constraints;

  // ── Active days ──
  let activeDays;
  if (activeDayToggles) {
    activeDays = ALL_DAYS.filter(d => activeDayToggles[d] && !blockedDays.includes(d));
  } else {
    activeDays = ALL_DAYS.slice(0, Math.min(workingDays, 6)).filter(d => !blockedDays.includes(d));
  }
  if (activeDays.length === 0) {
    return { schedule: [], conflicts: ['No active working days configured.'], subjectStatus: {}, facultyStatus: {} };
  }

  const totalSlots = Math.min(slotsPerDay, 9);
  const grid = makeGrid(activeDays, totalSlots);
  const conflicts = [];

  // ── Status trackers ──
  // subjectStatus[code] = { assigned: 0, required: N, creditPoints: N, status: 'pending'|'completed' }
  const subjectStatus = {};
  for (const s of subjects) {
    const req = getSubjectCredits(s);
    subjectStatus[s.code] = {
      name: s.name,
      assigned: 0,          // sessions placed
      required: req.totalSessions,
      creditPoints: req.creditPoints,
      creditsUsed: 0,        // credit-points consumed
      status: 'pending',
    };
  }

  // facultyStatus[name] = { hoursUsed: 0, hoursCap: N, status: 'available'|'engaged' }
  const facultyStatus = {};
  for (const f of faculty) {
    facultyStatus[f.name] = {
      hoursUsed: 0,
      hoursCap: f.total_hours_per_week || maxFacultyHoursPerWeek,
      status: 'available',
    };
  }

  // ── Weekly credit budget ──
  let weekCreditBudget = weeklyCreditsLimit;

  // ── Room pools ──
  const labRooms = rooms.filter(r => r.type === 'Lab');
  const theoryRooms = rooms.filter(r => r.type !== 'Lab');

  // ── Sort subjects: Labs first, then by priority, then theory, electives last ──
  const sortedSubjects = [...subjects].sort((a, b) => {
    const aType = (a.type || 'Theory').toLowerCase();
    const bType = (b.type || 'Theory').toLowerCase();
    const aIsLab = aType === 'lab' || Number(a.credits) === 2;
    const bIsLab = bType === 'lab' || Number(b.credits) === 2;
    if (aIsLab && !bIsLab) return -1;
    if (!aIsLab && bIsLab) return 1;
    const aIsElective = aType === 'elective';
    const bIsElective = bType === 'elective';
    if (!aIsElective && bIsElective) return 1;
    if (aIsElective && !bIsElective) return -1;
    if (subjectPriority) {
      if (a.code === subjectPriority) return -1;
      if (b.code === subjectPriority) return 1;
    }
    return (Number(b.credits) || 3) - (Number(a.credits) || 3);
  });

  const effConstraints = {
    slotsPerDay: totalSlots,
    maxLecturesPerDay,
    maxLabsPerDay,
    maxFacultyHoursPerDay,
    maxConsecutiveClasses,
    breakAfterSlot,
  };

  // ─── FAIL-SAFE: Check if any subjects have remaining credits ──────────────
  const availableSubjects = getAvailableSubjects(sortedSubjects, subjectStatus);
  if (availableSubjects.length === 0) {
    return {
      schedule: [],
      conflicts: ['FAIL-SAFE: Unable to generate timetable: All subjects have exhausted their credit limits.'],
      subjectStatus,
      facultyStatus,
      weekCreditsUsed: weeklyCreditsLimit - weekCreditBudget,
      weekCreditsLimit: weeklyCreditsLimit,
      generationFailed: true,
    };
  }

  if (debugMode) {
    console.log(`Available subjects with remaining credits: ${availableSubjects.length}/${subjects.length}`);
  }

  // ─── Assign each subject ────────────────────────────────────────────────

  for (const subject of sortedSubjects) {
    const req = getSubjectCredits(subject);
    const ss = subjectStatus[subject.code];

    // ── STRICT: Check if subject has remaining credits before attempting ───
    if (!hasRemainingCredits(subjectStatus, subject.code)) {
      if (debugMode) {
        console.log(`Subject ${subject.name} (${subject.code}) has no remaining credits, skipping`);
      }
      ss.status = 'completed';
      continue;
    }

    // ── Credit budget check ──
    if (weekCreditBudget <= 0) {
      conflicts.push(`BUDGET: Weekly 15-credit limit reached. ${subject.name} (${subject.code}) skipped.`);
      ss.status = 'skipped';
      continue;
    }
    if (req.creditPoints > weekCreditBudget) {
      conflicts.push(`BUDGET: ${subject.name} needs ${req.creditPoints} credits but only ${weekCreditBudget} remain.`);
      ss.status = 'skipped';
      continue;
    }

    // Already completed
    if (ss.status === 'completed') continue;

    const usedDays = new Set();

    // ── Assign lab blocks ──
    for (let lb = 0; lb < req.labBlocks; lb++) {
      // ── STRICT: Check credit limit before assigning lab block (2 credits) ──
      const creditCheck = checkSubjectCreditLimit(subjectStatus, subject.code, 2, debugMode);
      if (!creditCheck.ok) {
        conflicts.push(`CREDIT LIMIT: ${creditCheck.reason}`);
        break;
      }

      if (labRooms.length === 0) {
        conflicts.push(`LAB ROOM: No Lab rooms available for ${subject.name}`);
        break;
      }

      let placed = false;
      const orderedDays = [...activeDays].sort((a, b) => scoreDay(usedDays, a) - scoreDay(usedDays, b));

      outer:
      for (const day of orderedDays) {
        for (let slot = 0; slot < totalSlots - 1; slot++) {
          // Pick best available faculty (optimized: balance load + prefer higher capacity)
          const facCandidates = faculty
            .filter(f => facultyStatus[f.name]?.status === 'available')
            .sort((a, b) => {
              const hoursDiff = facultyStatus[a.name].hoursUsed - facultyStatus[b.name].hoursUsed;
              if (hoursDiff !== 0) return hoursDiff;
              return (facultyStatus[b.name].hoursCap - facultyStatus[b.name].hoursUsed) - 
                     (facultyStatus[a.name].hoursCap - facultyStatus[a.name].hoursUsed);
            });

          for (const fac of facCandidates) {
            for (const room of labRooms) {
              const check = canPlace(grid, activeDays, subject, fac, room, day, slot, {
                ...effConstraints,
                maxFacultyHoursPerWeek: facultyStatus[fac.name].hoursCap,
                isLab: true,
              });
              if (check.ok) {
                placeEntry(grid, subject, fac, room, day, slot, true);
                // Update trackers
                facultyStatus[fac.name].hoursUsed += 2;
                if (facultyStatus[fac.name].hoursUsed >= facultyStatus[fac.name].hoursCap) {
                  facultyStatus[fac.name].status = 'engaged';
                }
                ss.assigned += 2;
                ss.creditsUsed += 2;
                usedDays.add(day);
                placed = true;
                break outer;
              }
            }
          }
        }
      }

      if (!placed) {
        conflicts.push(`LAB: Could not place lab block for ${subject.name} (${subject.code})`);
      }
    }

    // ── Assign theory sessions ──
    for (let lec = 0; lec < req.theorySessions; lec++) {
      // ── STRICT: Check credit limit before assigning theory session (1 credit) ──
      const creditCheck = checkSubjectCreditLimit(subjectStatus, subject.code, 1, debugMode);
      if (!creditCheck.ok) {
        conflicts.push(`CREDIT LIMIT: ${creditCheck.reason}`);
        break;
      }

      // Check subject not already completed/over-assigned
      if (ss.assigned >= ss.required) break;

      let placed = false;
      const orderedDays = [...activeDays].sort((a, b) => scoreDay(usedDays, a) - scoreDay(usedDays, b));

      outer:
      for (const day of orderedDays) {
        for (let slot = 0; slot < totalSlots; slot++) {
          const facCandidates = faculty
            .filter(f => facultyStatus[f.name]?.status === 'available')
            .sort((a, b) => {
              const hoursDiff = facultyStatus[a.name].hoursUsed - facultyStatus[b.name].hoursUsed;
              if (hoursDiff !== 0) return hoursDiff;
              return (facultyStatus[b.name].hoursCap - facultyStatus[b.name].hoursUsed) -
                     (facultyStatus[a.name].hoursCap - facultyStatus[a.name].hoursUsed);
            });

          const roomPool = theoryRooms.length > 0 ? theoryRooms : rooms.filter(r => r.type !== 'Lab');
          const finalPool = roomPool.length > 0 ? roomPool : rooms;

          for (const fac of facCandidates) {
            for (const room of finalPool) {
              const check = canPlace(grid, activeDays, subject, fac, room, day, slot, {
                ...effConstraints,
                maxFacultyHoursPerWeek: facultyStatus[fac.name].hoursCap,
                isLab: false,
              });
              if (check.ok) {
                placeEntry(grid, subject, fac, room, day, slot, false);
                facultyStatus[fac.name].hoursUsed += 1;
                if (facultyStatus[fac.name].hoursUsed >= facultyStatus[fac.name].hoursCap) {
                  facultyStatus[fac.name].status = 'engaged';
                }
                ss.assigned += 1;
                ss.creditsUsed += 1;
                usedDays.add(day);
                placed = true;
                break outer;
              }
            }
          }
        }
      }

      if (!placed) {
        conflicts.push(`THEORY: ${subject.name} (${subject.code}) — placed ${ss.assigned}/${ss.required} sessions`);
        break;
      }
    }

    // ── Mark subject completed if all sessions placed ──
    if (ss.assigned >= ss.required) {
      ss.status = 'completed';
      weekCreditBudget -= req.creditPoints;
    } else if (ss.assigned > 0) {
      ss.status = 'partial';
      // Consume whatever credits were actually used
      weekCreditBudget -= ss.creditsUsed;
    }

    // ── FAIL-SAFE: Re-check if any subjects have remaining credits ──────────
    const remainingSubjects = getAvailableSubjects(sortedSubjects, subjectStatus);
    if (remainingSubjects.length === 0 && ss.status !== 'completed') {
      // All subjects exhausted but current one not completed
      if (debugMode) {
        console.log('All subjects exhausted, stopping generation');
      }
      break;
    }
  }

  // ── Post-validation ──
  for (const day of activeDays) {
    const seenFac = {}, seenRoom = {};
    for (let s = 0; s < totalSlots; s++) {
      const e = grid[day][s];
      if (!e) continue;
      if (seenFac[e.faculty_name]) {
        conflicts.push(`OVERLAP: ${e.faculty_name} double-booked on ${day} slot ${s}`);
      }
      seenFac[e.faculty_name] = true;
      if (seenRoom[e.room_name]) {
        conflicts.push(`OVERLAP: Room ${e.room_name} double-booked on ${day} slot ${s}`);
      }
      seenRoom[e.room_name] = true;
    }
  }

  // ── FINAL VALIDATION: Check for credit violations ────────────────────────
  const creditViolations = validateFinalCredits(subjectStatus);
  if (creditViolations.length > 0) {
    // Discard timetable if any credit violations detected
    const violationMessages = creditViolations.map(v =>
      `CREDIT VIOLATION: ${v.subject} (${v.code}) used ${v.used}/${v.limit} credits (exceeded by ${v.exceeded})`
    );
    return {
      schedule: [],
      conflicts: [
        'FINAL VALIDATION FAILED: Timetable discarded due to credit violations.',
        ...violationMessages
      ],
      subjectStatus,
      facultyStatus,
      weekCreditsUsed: weeklyCreditsLimit - weekCreditBudget,
      weekCreditsLimit: weeklyCreditsLimit,
      generationFailed: true,
      creditViolations,
    };
  }

  if (debugMode) {
    console.log('Final validation passed: No credit violations detected');
    console.log('Subject status summary:');
    for (const [code, ss] of Object.entries(subjectStatus)) {
      console.log(`  ${ss.name} (${code}): ${ss.creditsUsed}/${ss.creditPoints} credits - ${ss.status}`);
    }
  }

  return {
    schedule: gridToSchedule(grid),
    conflicts,
    subjectStatus,
    facultyStatus,
    weekCreditsUsed: weeklyCreditsLimit - weekCreditBudget,
    weekCreditsLimit: weeklyCreditsLimit,
  };
}

// ─── Count helper ───────────────────────────────────────────────────────────

function countScheduled(grid, days, slotsPerDay, code, isLab) {
  let count = 0;
  for (const d of days) {
    for (let s = 0; s < slotsPerDay; s++) {
      const e = grid[d][s];
      if (e && e.subject_code === code && !!e.is_lab === isLab) count++;
    }
  }
  return count;
}

// ─── Auto Fix ────────────────────────────────────────────────────────────────

export function autoFixTimetable(schedule, conflicts, subjects, faculty, rooms) {
  const fixed = schedule.map(e => ({ ...e }));

  // Fix faculty clashes
  const bySlot = {};
  fixed.forEach((e, i) => {
    const key = `${e.day}-${e.slot}`;
    if (!bySlot[key]) bySlot[key] = [];
    bySlot[key].push({ e, i });
  });

  for (const entries of Object.values(bySlot)) {
    const seenFac = new Set(), seenRoom = new Set();
    for (const { e, i } of entries) {
      if (seenFac.has(e.faculty_name)) {
        const used = new Set(entries.map(x => x.e.faculty_name));
        const alt = faculty.find(f => !used.has(f.name));
        if (alt) fixed[i] = { ...fixed[i], faculty_name: alt.name };
      } else seenFac.add(e.faculty_name);

      if (seenRoom.has(e.room_name)) {
        const used = new Set(entries.map(x => x.e.room_name));
        const alt = rooms.find(r => !used.has(r.name));
        if (alt) fixed[i] = { ...fixed[i], room_name: alt.name };
      } else seenRoom.add(e.room_name);
    }
  }

  fixed.sort((a, b) => (DAY_ORDER[a.day] - DAY_ORDER[b.day]) || (a.slot - b.slot));
  return { schedule: fixed, conflicts: [], subjectStatus: {}, facultyStatus: {} };
}

export { getSubjectCredits as getCreditRequirements };
export const DAYS = ALL_DAYS;
export const SLOTS_PER_DAY = 9;