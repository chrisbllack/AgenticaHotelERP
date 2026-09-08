import type {
  ShiftHandoverRecord,
  PreventativeMaintenanceSchedule,
  PmInspectionLog,
  CompetitorRate,
  MarketEvent,
  DynamicRateRecommendation,
  YieldRule,
  NightAuditReport,
  GuestSurveyResponse,
  ServiceRecoveryTicket,
  LostAndFoundItem,
  RoomEnergyReading,
  SmartRoomControl,
} from "../types";

// ==========================================
// 1. SHIFT HANDOVER DEMO DATA
// ==========================================
export const initialHandovers: ShiftHandoverRecord[] = [
  {
    id: "sho-20260907-pm",
    handoverNumber: "SHO-20260907-02",
    shiftType: "evening_pm",
    shiftDate: "2026-09-07",
    departingStaffName: "Blessing Effiong (Receptionist)",
    incomingStaffName: "Chidi Amadi (Night Supervisor)",
    status: "submitted",
    submittedAt: "2026-09-07 21:45:00",
    openingFloat: 50000,
    expectedCashDrop: 245000,
    countedCashTotal: 245000,
    cashVariance: 0,
    varianceExplanation: "Cash count exact. All POS receipt slips audited and attached.",
    denominations: {
      n1000: 220, // 220,000
      n500: 40,   // 20,000
      n200: 20,   // 4,000
      n100: 10,   // 1,000
      n50: 0,     // 0
    },
    posCardBatchesSettled: true,
    totalCardPayments: 1840000,
    tasks: [
      {
        id: "task-1",
        description: "Welcome VIP Guest Chief Adeyemi arriving late flight (approx. 23:30). Suite 050 key card pre-encoded and chilled fruit platter placed in room.",
        category: "vip_arrival",
        status: "pending",
        priority: "urgent",
        dueTime: "23:30",
      },
      {
        id: "task-2",
        description: "Perform physical key card drawer audit before launching Night Audit run.",
        category: "key_audit",
        status: "pending",
        priority: "high",
        dueTime: "01:30",
      },
      {
        id: "task-3",
        description: "Wake-up call scheduled for Room 004 (Mr. Ibrahim) at 05:30 AM for early airport taxi transfer.",
        category: "wakeup_call",
        status: "pending",
        priority: "high",
        dueTime: "05:30",
      },
      {
        id: "task-4",
        description: "Follow up with Maintenance (Yusuf) regarding AC drainage drip reported in Room 006.",
        category: "maintenance",
        status: "in_progress",
        priority: "normal",
        dueTime: "22:30",
      },
      {
        id: "task-5",
        description: "Luggage tag #LUG-882 stored in bell closet for Room 012 guest departing 07:00 tomorrow.",
        category: "luggage",
        status: "completed",
        priority: "normal",
      },
    ],
    guestNotes: [
      {
        id: "gn-1",
        guestName: "Alhaji Garba Shehu",
        roomNumber: "049",
        note: "VIP guest noted preference for feather-free non-allergenic pillows. Housekeeping already replaced them.",
        severity: "info",
      },
      {
        id: "gn-2",
        guestName: "Dr. Nnamdi Azikiwe Jr.",
        roomNumber: "002",
        note: "Requested late check-out tomorrow at 14:00. Approved by GM Chidinma Ike without surcharge.",
        severity: "attention",
        actionRequired: "Ensure key card validity extended to 14:00 during night audit.",
      },
      {
        id: "gn-3",
        guestName: "Mrs. Folake Solanke",
        roomNumber: "006",
        note: "Reported slight vibration noise from AC condenser on balcony. Work order WO-4402 logged.",
        severity: "attention",
        actionRequired: "Night duty engineer to inspect during 23:00 rounds.",
      },
    ],
    departingStaffPinVerified: true,
    incomingStaffPinVerified: false,
    handoverSummaryNotes: "Quiet evening shift. Total 14 check-ins processed smoothly, 3 corporate direct bills routed to City Ledger. Cash drawer balanced to the kobo.",
  },
  {
    id: "sho-20260907-am",
    handoverNumber: "SHO-20260907-01",
    shiftType: "morning_am",
    shiftDate: "2026-09-07",
    departingStaffName: "Chidi Amadi (Front Desk Manager)",
    incomingStaffName: "Blessing Effiong (Receptionist)",
    status: "acknowledged",
    submittedAt: "2026-09-07 14:02:00",
    acknowledgedAt: "2026-09-07 14:10:00",
    openingFloat: 50000,
    expectedCashDrop: 160000,
    countedCashTotal: 160000,
    cashVariance: 0,
    varianceExplanation: "Perfect reconciliation.",
    denominations: {
      n1000: 150,
      n500: 16,
      n200: 10,
      n100: 0,
      n50: 0,
    },
    posCardBatchesSettled: true,
    totalCardPayments: 920000,
    tasks: [
      {
        id: "task-am-1",
        description: "Process 8 scheduled morning departures and verify folio zero balance.",
        category: "checkout",
        status: "completed",
        priority: "high",
      },
      {
        id: "task-am-2",
        description: "Coordinate with Executive Housekeeper for early turnover of 5 Deluxe rooms.",
        category: "other",
        status: "completed",
        priority: "normal",
      },
    ],
    guestNotes: [
      {
        id: "gn-am-1",
        guestName: "Mr. Kenneth Okonkwo",
        roomNumber: "010",
        note: "Complimented breakfast buffet. Inquired about booking banquet hall for October anniversary.",
        severity: "info",
        actionRequired: "Sales contact forwarded to Events team.",
      },
    ],
    departingStaffPinVerified: true,
    incomingStaffPinVerified: true,
    handoverSummaryNotes: "Morning departures cleared on schedule. Group checkouts from Shell corporate retreat completed with zero billing disputes.",
  },
];

// ==========================================
// 2. PREVENTATIVE MAINTENANCE DEMO DATA
// ==========================================
export const initialPmSchedules: PreventativeMaintenanceSchedule[] = [
  {
    id: "pm-hvac-q3",
    scheduleCode: "PM-HVAC-01",
    title: "Quarterly Guest Room VRV Air Conditioning Service",
    equipmentType: "HVAC & Air Con",
    targetType: "room",
    targetIds: ["Room 001", "Room 002", "Room 003", "Room 004", "Room 005", "Room 006", "Room 007", "Room 008"],
    frequency: "quarterly",
    assignedEngineer: "Yusuf Abdullahi (HVAC Tech)",
    lastCompletedDate: "2026-06-12",
    nextDueDate: "2026-09-12",
    status: "due_soon",
    complianceScore: 95,
    notes: "Inspect Daikin VRV indoor evaporator units, sanitize condensate drain trays, check R410A pressure, clean washable filters.",
    checklist: [
      { id: "chk-1", item: "Clean and chemical-wash indoor filter mesh", passed: true, reading: "Clean" },
      { id: "chk-2", item: "Flush condensate drain line with anti-algae tablet", passed: true, reading: "Clear flow" },
      { id: "chk-3", item: "Measure supply vs return air temperature delta (Target: >8°C)", passed: true, reading: "Delta 9.4°C" },
      { id: "chk-4", item: "Check blower fan motor bearings and sound vibration", passed: true, reading: "Normal 38dB" },
      { id: "chk-5", item: "Inspect refrigerant pipe insulation & flares for oily residue", passed: true, reading: "Zero leaks" },
      { id: "chk-6", item: "Test wall thermostat calibration & remote sensor responsiveness", passed: true, reading: "±0.5°C tolerance" },
    ],
  },
  {
    id: "pm-fire-m",
    scheduleCode: "PM-FIRE-02",
    title: "Monthly Fire Detection & Extinguisher Inspection",
    equipmentType: "Fire & Smoke Safety",
    targetType: "floor",
    targetIds: ["Floor 1 Corridor", "Floor 2 Corridor", "Floor 3 Corridor", "Floor 4 Corridor", "Floor 5 Corridor", "Kitchen"],
    frequency: "monthly",
    assignedEngineer: "Emeka Chukwu (Chief Engineer)",
    lastCompletedDate: "2026-08-08",
    nextDueDate: "2026-09-08",
    status: "due_soon",
    complianceScore: 100,
    notes: "Statutory safety audit per Lagos State Fire Service regulations. Inspect pressure needles, tamper seals, and call points.",
    checklist: [
      { id: "chk-f1", item: "Verify CO2 and ABC Dry Powder extinguisher pressure gauges in green zone", passed: true, reading: "14.5 Bar" },
      { id: "chk-f2", item: "Check tamper seals and safety pull-pins intact", passed: true, reading: "100% Intact" },
      { id: "chk-f3", item: "Inspect emergency fire hose reel nozzles and main booster pressure", passed: true, reading: "6.2 Bar static" },
      { id: "chk-f4", item: "Test smoke detector optical chambers via aerosol tester", passed: true, reading: "Zone 1-5 OK" },
      { id: "chk-f5", item: "Verify fire exit emergency magnetic release doors unlock on alarm test", passed: true, reading: "Instant release" },
    ],
  },
  {
    id: "pm-plumb-m",
    scheduleCode: "PM-PLUMB-03",
    title: "Bi-Weekly Central Boiler & Water Treatment Inspection",
    equipmentType: "Plumbing & Water Heaters",
    targetType: "central_plant",
    targetIds: ["Central Boiler Room (Basement)", "Rooftop Water Storage Tanks"],
    frequency: "bi_weekly",
    assignedEngineer: "Emeka Chukwu (Chief Engineer)",
    lastCompletedDate: "2026-08-25",
    nextDueDate: "2026-09-08",
    status: "due_soon",
    complianceScore: 98,
    notes: "Monitor hot water delivery temperature at furthest tap (Target: 52°C - 55°C) to prevent Legionella risk.",
    checklist: [
      { id: "chk-p1", item: "Calibrate primary calorifier water temperature setpoint", passed: true, reading: "60.2°C" },
      { id: "chk-p2", item: "Check water circulation booster pump dual redundancy auto-switch", passed: true, reading: "Pump B Auto-kick OK" },
      { id: "chk-p3", item: "Measure water softener brine tank salt level and TDS reading", passed: true, reading: "140 ppm TDS" },
      { id: "chk-p4", item: "Inspect pressure relief valves and expansion vessels", passed: true, reading: "4.0 Bar" },
      { id: "chk-p5", item: "Perform boiler bottom blowdown to purge scale sediment", passed: true, reading: "Completed" },
    ],
  },
  {
    id: "pm-locks-m",
    scheduleCode: "PM-LOCK-04",
    title: "Bi-Annual Dormakaba RFID Door Lock Diagnostics",
    equipmentType: "RFID Door Locks",
    targetType: "room",
    targetIds: ["Floor 1 (Rooms 001-010)", "Floor 2 (Rooms 011-020)"],
    frequency: "semi_annual",
    assignedEngineer: "Yusuf Abdullahi (Technician)",
    lastCompletedDate: "2026-03-10",
    nextDueDate: "2026-09-10",
    status: "due_soon",
    complianceScore: 92,
    notes: "Diagnostic readout of door lock battery voltages, clock synchronization, and mechanical latch retraction.",
    checklist: [
      { id: "chk-l1", item: "Battery pack voltage test (Replace if below 4.6V DC)", passed: true, reading: "5.8V (4x AA)" },
      { id: "chk-l2", item: "Test emergency brass master key cylinder smooth rotation", passed: true, reading: "Lubricated" },
      { id: "chk-l3", item: "Verify audit trail timestamp sync with PMS server", passed: true, reading: "Synced" },
      { id: "chk-l4", item: "Check strike plate alignment and deadbolt deadlocking throw", passed: true, reading: "Positive engagement" },
    ],
  },
  {
    id: "pm-gen-w",
    scheduleCode: "PM-ELEC-05",
    title: "Weekly Backup Diesel Generator (500kVA) Load Test",
    equipmentType: "Electrical & Backup Generator",
    targetType: "central_plant",
    targetIds: ["Generator House 1 (CAT 500kVA)", "Automatic Transfer Switch ATS-1"],
    frequency: "weekly",
    assignedEngineer: "Emeka Chukwu (Chief Engineer)",
    lastCompletedDate: "2026-08-31",
    nextDueDate: "2026-09-07",
    status: "overdue",
    complianceScore: 88,
    notes: "Critical hotel power security. Test auto-start upon mains failure simulation (Target transfer under 8 seconds).",
    checklist: [
      { id: "chk-g1", item: "Check fuel day tank level (Must be above 85% capacity)", passed: true, reading: "92% (1,450L)" },
      { id: "chk-g2", item: "Inspect engine oil dipstick level and coolant clarity", passed: true, reading: "15W40 Oil Full" },
      { id: "chk-g3", item: "Test starter battery bank terminal voltage and trickle charger", passed: true, reading: "27.4V DC" },
      { id: "chk-g4", item: "Simulate utility outage: measure ATS transfer time", passed: true, reading: "6.2 seconds" },
      { id: "chk-g5", item: "Run under 60% building load for 30 minutes; monitor oil pressure & Hz", passed: true, reading: "50.1 Hz / 4.8 Bar" },
    ],
  },
  {
    id: "pm-lift-m",
    scheduleCode: "PM-LIFT-06",
    title: "Monthly Passenger Lift Safety & Shaft Intercom Audit",
    equipmentType: "Elevators & Lifts",
    targetType: "common_area",
    targetIds: ["Guest Lift A (Main Lobby)", "Guest Lift B (Main Lobby)", "Service Lift (Back of House)"],
    frequency: "monthly",
    assignedEngineer: "Schindler OEM Certified Tech & Yusuf Abdullahi",
    lastCompletedDate: "2026-08-14",
    nextDueDate: "2026-09-14",
    status: "scheduled",
    complianceScore: 97,
    notes: "Full regulatory car leveling check, infrared curtain door detectors, emergency battery lowering (ARD), and SOS cabin intercom.",
    checklist: [
      { id: "chk-e1", item: "Verify cabin floor leveling accuracy at all 5 floor landings (±3mm)", passed: true, reading: "+1mm delta" },
      { id: "chk-e2", item: "Test infrared door light curtain sensitive auto-reversal", passed: true, reading: "Reverses instantly" },
      { id: "chk-e3", item: "Test automatic rescue device (ARD) battery auto-lowering to nearest floor", passed: true, reading: "Operational" },
      { id: "chk-e4", item: "Test emergency hands-free cabin call speaker to Front Desk and Security", passed: true, reading: "Audio clear" },
      { id: "chk-e5", item: "Inspect traction wire rope lubrication and guide shoe wear", passed: true, reading: "Within spec" },
    ],
  },
];

export const initialPmLogs: PmInspectionLog[] = [
  {
    id: "pml-001",
    scheduleId: "pm-hvac-q3",
    scheduleTitle: "Quarterly Guest Room VRV Air Conditioning Service",
    equipmentType: "HVAC & Air Con",
    inspectedTarget: "Room 001",
    technicianName: "Yusuf Abdullahi",
    inspectedAt: "2026-09-06 11:30:00",
    result: "passed",
    readings: { "Delta T": "9.2°C", "Filter Condition": "Cleaned", "Noise": "37 dB" },
    findings: "Evaporator fins cleaned, condensate pan chlorinated, thermostat accurate.",
  },
  {
    id: "pml-002",
    scheduleId: "pm-hvac-q3",
    scheduleTitle: "Quarterly Guest Room VRV Air Conditioning Service",
    equipmentType: "HVAC & Air Con",
    inspectedTarget: "Room 006",
    technicianName: "Yusuf Abdullahi",
    inspectedAt: "2026-09-07 16:45:00",
    result: "failed_repair_needed",
    readings: { "Delta T": "6.1°C", "Vibration": "Elevated 52 dB", "Drain": "Minor sludge" },
    findings: "Condenser mounting bracket rubber damper degraded causing vibration buzz. Replacement damper ordered.",
    spawnedWorkOrderId: "WO-4402",
  },
  {
    id: "pml-003",
    scheduleId: "pm-fire-m",
    scheduleTitle: "Monthly Fire Detection & Extinguisher Inspection",
    equipmentType: "Fire & Smoke Safety",
    inspectedTarget: "Floor 2 Corridor",
    technicianName: "Emeka Chukwu",
    inspectedAt: "2026-09-05 09:15:00",
    result: "passed",
    readings: { "Extinguisher Pressure": "14.2 Bar", "Emergency Light Duration": "90 mins OK" },
    findings: "All emergency signage illuminated, break-glass units verified.",
  },
];

// ==========================================
// 3. YIELD & REVENUE MANAGEMENT DEMO DATA
// ==========================================
export const initialCompetitorRates: CompetitorRate[] = [
  { competitorName: "Eko Hotels & Suites (Victoria Island)", roomType: "Standard King", rate: 58000, varianceVsUs: 132, channel: "Direct / OTA" },
  { competitorName: "Radisson Blu Anchorage (VI)", roomType: "Superior Room", rate: 64000, varianceVsUs: 156, channel: "Expedia" },
  { competitorName: "The Wheatbaker (Ikoyi)", roomType: "Executive King", rate: 95000, varianceVsUs: 46, channel: "Booking.com" },
  { competitorName: "Lagos Continental (Victoria Island)", roomType: "Deluxe City View", rate: 48000, varianceVsUs: 20, channel: "OTA Parity" },
  { competitorName: "Southern Sun Ikoyi", roomType: "Standard Room", rate: 42000, varianceVsUs: 68, channel: "GDS Sabre" },
];

export const initialMarketEvents: MarketEvent[] = [
  {
    id: "evt-01",
    name: "Nigeria International Energy Summit (NIES)",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    impactLevel: "compression",
    estimatedInflow: "4,500 delegates (Island hotels at 95%+ projected occupancy)",
  },
  {
    id: "evt-02",
    name: "Lagos Fashion Week (Autumn Showcase)",
    startDate: "2026-09-24",
    endDate: "2026-09-27",
    impactLevel: "high",
    estimatedInflow: "High-spending leisure & VIP guest influx",
  },
  {
    id: "evt-03",
    name: "West Africa FinTech & Banking Congress",
    startDate: "2026-10-05",
    endDate: "2026-10-08",
    impactLevel: "high",
    estimatedInflow: "2,200 international executives",
  },
  {
    id: "evt-04",
    name: "Lagos City Half Marathon Weekend",
    startDate: "2026-10-17",
    endDate: "2026-10-19",
    impactLevel: "medium",
    estimatedInflow: "Domestic weekend tourism bump",
  },
];

export const initialRateRecommendations: DynamicRateRecommendation[] = [
  {
    roomTypeId: "STD-TYPE",
    roomTypeName: "Standard Room",
    currentBaseRate: 25000,
    recommendedRate: 29500,
    variancePercent: 18,
    confidenceScore: 94,
    demandFactor: "Compression Event",
    suggestedAction: "Increase Rate",
    minStayRequirement: 2,
    projectedRevPARGain: 3850,
    applied: false,
  },
  {
    roomTypeId: "DLX-TYPE",
    roomTypeName: "Deluxe Room",
    currentBaseRate: 40000,
    recommendedRate: 48000,
    variancePercent: 20,
    confidenceScore: 96,
    demandFactor: "High Weekend Pace",
    suggestedAction: "Increase Rate",
    minStayRequirement: 2,
    projectedRevPARGain: 6200,
    applied: false,
  },
  {
    roomTypeId: "EXE-TYPE",
    roomTypeName: "Executive Suite",
    currentBaseRate: 65000,
    recommendedRate: 78000,
    variancePercent: 20,
    confidenceScore: 91,
    demandFactor: "Surge Occupancy",
    suggestedAction: "Increase Rate",
    minStayRequirement: 1,
    projectedRevPARGain: 11500,
    applied: false,
  },
  {
    roomTypeId: "PRM-TYPE",
    roomTypeName: "Presidential Suite",
    currentBaseRate: 150000,
    recommendedRate: 175000,
    variancePercent: 16.7,
    confidenceScore: 88,
    demandFactor: "Compression Event",
    suggestedAction: "Increase Rate",
    minStayRequirement: 3,
    projectedRevPARGain: 22000,
    applied: false,
  },
];

export const initialYieldRules: YieldRule[] = [
  {
    id: "yr-1",
    name: "High Compression Surge Trigger",
    condition: "Occupancy > 80% with > 5 days until arrival date",
    action: "Automatically increase BAR (Best Available Rate) by +15% and enforce 2-night minimum stay",
    isActive: true,
    lastTriggered: "2026-09-05 18:30",
  },
  {
    id: "yr-2",
    name: "Last-Minute Filler (Off-Peak Midweek)",
    condition: "Occupancy < 55% at 48 hours prior to arrival on Tuesday/Wednesday",
    action: "Release 'Direct Web Secret Deal' at -10% discount to loyalty members only",
    isActive: true,
    lastTriggered: "2026-09-02 12:00",
  },
  {
    id: "yr-3",
    name: "CompSet Underpricing Protection",
    condition: "Our Deluxe rate is > 30% below Radisson Blu / Eko Hotel parity on identical dates",
    action: "Notify Revenue Manager and recommend rate normalization upward by +₦5,000",
    isActive: true,
    lastTriggered: "2026-09-07 08:00",
  },
  {
    id: "yr-4",
    name: "Suite Yield Maximizer",
    condition: "Executive & Presidential Suites pace > 60% booked 14 days out",
    action: "Close out promotional and OTA wholesale discount codes; direct booking only",
    isActive: true,
  },
];

// ==========================================
// 4. NIGHT AUDIT ARCHIVE DEMO DATA
// ==========================================
export const initialAuditReports: NightAuditReport[] = [
  {
    id: "nar-20260906",
    businessDate: "2026-09-06",
    completedAt: "2026-09-07 03:22:15",
    auditorName: "Chidi Amadi (Night Manager)",
    roomsCharged: 38,
    totalRoomRevenue: 1350000,
    totalTaxPosted: 101250, // 7.5% VAT
    totalServiceChargePosted: 135000, // 10%
    totalFnbRevenue: 412000,
    totalOtherRevenue: 68000,
    grandTotalRevenue: 2066250,
    totalPaymentsCollected: 1890000,
    cityLedgerTransfers: 245000,
    cashierVariancesTotal: 0,
    noShowsCount: 1,
    roomsOooCount: 2,
    endingOccupancyRate: 76,
    adr: 35526,
    revpar: 27000,
    trialBalanceBalanced: true,
    status: "balanced",
  },
  {
    id: "nar-20260905",
    businessDate: "2026-09-05",
    completedAt: "2026-09-06 03:15:40",
    auditorName: "Chidi Amadi (Night Manager)",
    roomsCharged: 40,
    totalRoomRevenue: 1420000,
    totalTaxPosted: 106500,
    totalServiceChargePosted: 142000,
    totalFnbRevenue: 520000,
    totalOtherRevenue: 85000,
    grandTotalRevenue: 2273500,
    totalPaymentsCollected: 2150000,
    cityLedgerTransfers: 180000,
    cashierVariancesTotal: 0,
    noShowsCount: 0,
    roomsOooCount: 2,
    endingOccupancyRate: 80,
    adr: 35500,
    revpar: 28400,
    trialBalanceBalanced: true,
    status: "balanced",
  },
];

// ==========================================
// 5. GUEST SENTIMENT & RECOVERY DEMO DATA
// ==========================================
export const initialGuestSurveys: GuestSurveyResponse[] = [
  {
    id: "surv-101",
    guestId: "gst-1",
    guestName: "Adaeze Okonkwo",
    stayId: "stay-001",
    roomNumber: "001",
    checkoutDate: "2026-09-06",
    submittedAt: "2026-09-06 15:30:00",
    channel: "Post-Stay Email",
    overallScore: 9,
    npsType: "promoter",
    categories: {
      frontDesk: 5,
      cleanliness: 5,
      dining: 5,
      roomComfort: 4,
      value: 4,
    },
    sentiment: "positive",
    comment: "The Jollof at Palm Restaurant deserves an award! Staff remembered my name from last visit. Will be back next month for tech summit.",
    highlights: ["Exceptional Dining", "Courteous Front Office", "Immaculate Cleanliness"],
  },
  {
    id: "surv-102",
    guestId: "gst-2",
    guestName: "Yusuf Bello",
    stayId: "stay-002",
    roomNumber: "002",
    checkoutDate: "2026-09-06",
    submittedAt: "2026-09-06 16:45:00",
    channel: "Post-Stay Email",
    overallScore: 5,
    npsType: "detractor",
    categories: {
      frontDesk: 2,
      cleanliness: 4,
      dining: 3,
      roomComfort: 3,
      value: 3,
    },
    sentiment: "negative",
    comment: "Checkout on Sunday morning took over 25 minutes! Only one cashier terminal was operating while 6 guests queued. Made me rush for airport taxi.",
    highlights: ["Slow Checkout Queue", "Insufficient Front Desk Staff"],
    serviceRecoveryTicketId: "rec-001",
  },
  {
    id: "surv-103",
    guestId: "gst-3",
    guestName: "Fatima Abubakar",
    stayId: "stay-003",
    roomNumber: "005",
    checkoutDate: "2026-09-05",
    submittedAt: "2026-09-05 19:20:00",
    channel: "In-Room QR / Tablet",
    overallScore: 10,
    npsType: "promoter",
    categories: {
      frontDesk: 5,
      cleanliness: 5,
      dining: 5,
      roomComfort: 5,
      value: 5,
    },
    sentiment: "positive",
    comment: "Housekeeping team is exceptional. Ngozi left beautiful towel origami and the bed linen smelled fresh and crisp. Perfect stay.",
    highlights: ["Towel Art", "Exemplary Housekeeping", "Quiet Atmosphere"],
  },
  {
    id: "surv-104",
    guestId: "gst-4",
    guestName: "Tunde Fashola",
    stayId: "stay-004",
    roomNumber: "008",
    checkoutDate: "2026-09-05",
    submittedAt: "2026-09-05 21:10:00",
    channel: "WhatsApp Concierge",
    overallScore: 6,
    npsType: "detractor",
    categories: {
      frontDesk: 4,
      cleanliness: 4,
      dining: 2,
      roomComfort: 4,
      value: 3,
    },
    sentiment: "neutral",
    comment: "Poolside bar ran out of Chapman and bitters by 6pm on a warm Saturday evening. Room was lovely and bed was comfortable though.",
    highlights: ["Poolside Bar Stockout", "Good Bed Comfort"],
    serviceRecoveryTicketId: "rec-002",
  },
  {
    id: "surv-105",
    guestId: "gst-5",
    guestName: "Chioma Eze",
    stayId: "stay-005",
    roomNumber: "045",
    checkoutDate: "2026-09-04",
    submittedAt: "2026-09-04 14:00:00",
    channel: "OTA Direct Review",
    overallScore: 8,
    npsType: "promoter",
    categories: {
      frontDesk: 4,
      cleanliness: 5,
      dining: 4,
      roomComfort: 4,
      value: 4,
    },
    sentiment: "positive",
    comment: "Deluxe room on Floor 4 has an incredible view over the lagoon. Fast Wi-Fi (over 80Mbps) allowed me to work remotely without any drops.",
    highlights: ["High Speed Fiber Wi-Fi", "Lagoon View", "Quiet Work Environment"],
  },
  {
    id: "surv-106",
    guestId: "gst-6",
    guestName: "Engr. Babatunde Balogun",
    stayId: "stay-006",
    roomNumber: "006",
    checkoutDate: "2026-09-07",
    submittedAt: "2026-09-07 10:15:00",
    channel: "In-Room QR / Tablet",
    overallScore: 4,
    npsType: "detractor",
    categories: {
      frontDesk: 3,
      cleanliness: 4,
      dining: 4,
      roomComfort: 2,
      value: 2,
    },
    sentiment: "negative",
    comment: "Air conditioning in Room 006 made a low persistent vibration noise all night. Front desk offered to move me but it was already midnight.",
    highlights: ["Noisy Air Conditioner", "Disturbed Sleep"],
    serviceRecoveryTicketId: "rec-003",
  },
];

export const initialRecoveryTickets: ServiceRecoveryTicket[] = [
  {
    id: "rec-001",
    surveyId: "surv-102",
    guestName: "Yusuf Bello",
    guestPhone: "+234 802 334 5566",
    guestEmail: "yusuf.bello@lagostech.ng",
    roomNumber: "002",
    issueSummary: "Sunday checkout delay of 25+ minutes caused guest near-miss on airport transfer.",
    department: "Front Desk",
    priority: "high",
    status: "contacted",
    assignedManager: "Chidi Amadi (Front Desk Manager)",
    compensationOffered: "2,000 Bonus Loyalty Points + Complimentary Executive Airport Transfer on next booking",
    resolutionNotes: "Spoke with Mr. Bello by phone. Apologized sincerely for the cashier shortage caused by sudden system printer jam. He accepted the gesture and booked his return for October 12.",
    createdAt: "2026-09-06 17:00:00",
  },
  {
    id: "rec-002",
    surveyId: "surv-104",
    guestName: "Tunde Fashola",
    guestPhone: "+234 803 555 8899",
    guestEmail: "tfashola@zenithcapital.com",
    roomNumber: "008",
    issueSummary: "Poolside bar ran out of signature Chapman beverage stock during peak Saturday sunset hour.",
    department: "Food & Beverage",
    priority: "high",
    status: "resolved",
    assignedManager: "Tunde Bakare (Restaurant & Bar Manager)",
    compensationOffered: "Complimentary Cocktail & Tapas Voucher for 2 guests valid for 60 days",
    resolutionNotes: "Addressed inventory par levels with procurement team to prevent weekend stockouts. Voucher dispatched via WhatsApp concierge.",
    createdAt: "2026-09-05 22:00:00",
    resolvedAt: "2026-09-06 10:30:00",
  },
  {
    id: "rec-003",
    surveyId: "surv-106",
    guestName: "Engr. Babatunde Balogun",
    guestPhone: "+234 809 111 2233",
    guestEmail: "b.balogun@dangotegroup.com",
    roomNumber: "006",
    issueSummary: "AC condenser vibration caused sleep disturbance in Room 006.",
    department: "Maintenance",
    priority: "urgent",
    status: "open",
    assignedManager: "Emeka Chukwu (Chief Engineer) & Chidinma Ike (GM)",
    compensationOffered: "1-Night Complimentary Stay Voucher + Room Upgrade to Executive Suite on next visit",
    resolutionNotes: "Engineering dispatched immediately (WO-4402) to replace damper bracket. General Manager personal follow-up email drafted.",
    createdAt: "2026-09-07 10:30:00",
  },
];

// ==========================================
// 8. LOST AND FOUND (M-HKP) DEMO DATA
// ==========================================
export const initialLostAndFound: LostAndFoundItem[] = [
  {
    id: "lf-001",
    itemNumber: "LF-20260905-01",
    name: "Apple iPhone 15 Pro (Titanium Gray)",
    category: "Electronics",
    description: "Gray titanium finish with clear MagSafe case. Found plugged into nightstand outlet.",
    roomNumber: "001",
    locationFound: "Room 001 - Bedside nightstand drawer",
    foundByStaffName: "Mary Okon (Senior Attendant)",
    foundDate: "2026-09-05",
    estimatedValue: 1450000,
    storageLocker: "Locker HK-A02 (High Security Safe)",
    status: "claimed",
    guestId: "guest-Okonkwo",
    guestName: "Adaeze Okonkwo",
    guestEmail: "adaeze.okonkwo@mtngroup.com",
    guestPhone: "+234-803-123-4567",
    claimedAt: "2026-09-06 11:20",
    claimedBy: "Adaeze Okonkwo (Verified by National ID)",
    emailSentAt: "2026-09-06 11:22",
    notes: "Guest called front desk immediately after airport dropoff. Device powered off and safely secured in vault.",
  },
  {
    id: "lf-002",
    itemNumber: "LF-20260906-02",
    name: "Rolex Datejust 41mm (Two-Tone)",
    category: "Jewelry & Valuables",
    description: "Gold and oystersteel chronometer in green velour pouch. Engraved caseback.",
    roomNumber: "050",
    locationFound: "Room 050 - Presidential Suite Dressing Room Vanity",
    foundByStaffName: "Ibrahim Sani (Floor Supervisor)",
    foundDate: "2026-09-06",
    estimatedValue: 18500000,
    storageLocker: "Executive Safe Vault #1",
    status: "logged",
    guestId: "guest-Bello",
    guestName: "Yusuf Bello",
    guestEmail: "yusuf.bello@dangote.com",
    guestPhone: "+234-802-012-3456",
    notes: "High value item. Registered in presence of Duty Manager and Head of Security.",
  },
  {
    id: "lf-003",
    itemNumber: "LF-20260904-03",
    name: "Leather Briefcase with Legal Documents",
    category: "Documents & Passports",
    description: "Brown calfskin briefcase with brass locks. Contains corporate contracts and passport copy.",
    roomNumber: "015",
    locationFound: "Room 015 - Executive Desk chair",
    foundByStaffName: "Grace Danjuma (Housekeeper)",
    foundDate: "2026-09-04",
    estimatedValue: 350000,
    storageLocker: "Locker HK-B12",
    status: "returned",
    guestId: "guest-Obi",
    guestName: "Ngozi Obi",
    guestEmail: "ngozi.obi@gtbank.com",
    guestPhone: "+234-701-567-8901",
    claimedAt: "2026-09-04 18:30",
    claimedBy: "Ngozi Obi",
    returnedAt: "2026-09-04 18:45",
    returnedByStaff: "Chidi Amadi (Front Desk Manager)",
    emailSentAt: "2026-09-04 18:46",
    notes: "Handed over to guest in lobby after signature and ID match.",
  },
  {
    id: "lf-004",
    itemNumber: "LF-20260828-04",
    name: "Ray-Ban Aviator Sunglasses & Case",
    category: "Other",
    description: "Gold frame polarized green lenses in brown leather snap case.",
    locationFound: "The Palms Poolside Cabana #4",
    foundByStaffName: "Samuel Peters (Pool Attendant)",
    foundDate: "2026-08-28",
    estimatedValue: 120000,
    storageLocker: "Locker HK-C05",
    status: "logged",
    notes: "Unclaimed for 10 days. Follow par holding rules (90-day retention policy).",
  },
  {
    id: "lf-005",
    itemNumber: "LF-20260715-05",
    name: "Damaged Power Bank & Frayed Cables",
    category: "Electronics",
    description: "Swollen lithium battery pack (safety hazard) with frayed USB-C cable.",
    roomNumber: "009",
    locationFound: "Room 009 - Bathroom floor",
    foundByStaffName: "Fatima Garba",
    foundDate: "2026-07-15",
    estimatedValue: 15000,
    storageLocker: "Hazard E-Waste Bin #3",
    status: "disposed",
    disposedAt: "2026-08-20",
    disposalReason: "Swollen hazardous battery past 30 days retention policy. Disposed per Lagos State Waste Management (LAWMA) guidelines.",
    notes: "Approved by Chief Engineer.",
  },
];

// ==========================================
// 9. ROOM ENERGY TELEMETRY (M-ENG) DEMO DATA
// ==========================================
// 50 rooms with realistic power, HVAC, temperature, and vacant waste alerts
export const initialEnergyReadings: RoomEnergyReading[] = Array.from({ length: 50 }, (_, i) => {
  const roomNum = i + 1;
  const roomNumber = String(roomNum).padStart(3, "0");
  const floor = Math.ceil(roomNum / 10);
  
  // Occupied rooms match demo seed
  const isOccupied = [1, 2, 5, 10, 15, 20, 25, 41, 42, 48, 49, 50].includes(roomNum);
  
  // Specific vacant rooms with HIGH energy consumption alerts (e.g. AC left at 18°C or lights on in vacant room)
  const isHighVacantAnomaly = [4, 16, 28].includes(roomNum);

  let powerDrawKw = 0.32;
  let currentTemp = 23;
  let targetTemp = 24;
  let hvacState: RoomEnergyReading["hvacState"] = "eco_standby";
  let lightingState: RoomEnergyReading["lightingState"] = "all_off";
  let waterFlowLpm = 0;
  let highAlert = false;
  let alertReason: string | undefined;

  if (isOccupied) {
    powerDrawKw = Number((2.1 + ((roomNum * 7) % 15) * 0.1).toFixed(2));
    currentTemp = 21;
    targetTemp = 20;
    hvacState = "cooling";
    lightingState = "all_on";
  } else if (isHighVacantAnomaly) {
    // Vacant but wasting high energy!
    powerDrawKw = roomNum === 4 ? 3.45 : roomNum === 16 ? 2.85 : 3.12;
    currentTemp = 18;
    targetTemp = 18;
    hvacState = "cooling";
    lightingState = "all_on";
    highAlert = true;
    alertReason = roomNum === 4
      ? "Vacant Room AC running at 18°C full compressor load (3.45 kW) with all master lights active."
      : roomNum === 16
        ? "Vacant Room AC compressor running (2.85 kW) without keycard inserted. Probable housekeeping bypass key left."
        : "Vacant Room high draw (3.12 kW) + Balcony door sensor open while AC actively cooling.";
  } else {
    // Normal vacant room on eco standby
    powerDrawKw = Number((0.25 + ((roomNum * 3) % 10) * 0.02).toFixed(2));
    currentTemp = 25;
    targetTemp = 26;
    hvacState = "eco_standby";
    lightingState = "all_off";
  }

  const dailyKwh = Number((powerDrawKw * 14.5 + ((roomNum * 11) % 20)).toFixed(1));

  return {
    roomId: `room-${roomNumber}`,
    roomNumber,
    floor,
    occupancyStatus: isOccupied ? "occupied" : "vacant",
    keycardInserted: isOccupied,
    powerDrawKw,
    dailyKwh,
    currentTemp,
    targetTemp,
    hvacState,
    lightingState,
    waterFlowLpm,
    highConsumptionAlert: highAlert,
    alertReason,
    ecoModeEngaged: !isOccupied && !isHighVacantAnomaly,
    lastTelemetryTime: "Just now (Live IoT Stream)",
  };
});

// ==========================================
// 10. SMART ROOM CONTROLS (M-GST) DEMO DATA
// ==========================================
export const initialSmartRoomControls: Record<string, SmartRoomControl> = {
  "room-001": {
    roomId: "room-001",
    roomNumber: "001",
    reservationId: "res-001",
    guestName: "Chief Adebayo Alade",
    dndActive: false,
    murActive: false,
    targetTemperature: 21,
    currentTemperature: 21.5,
    hvacMode: "cool",
    fanSpeed: "medium",
    lightingScene: "relax",
    lights: {
      master: true,
      entryway: false,
      bedroom: true,
      bathroom: true,
      nightstand: true,
    },
    doorLocked: true,
    privacyLatchEngaged: false,
    lastUpdated: "2026-09-07 20:30",
  },
  "room-002": {
    roomId: "room-002",
    roomNumber: "002",
    reservationId: "res-002",
    guestName: "Sarah Jenkins",
    dndActive: true,
    murActive: false,
    targetTemperature: 20,
    currentTemperature: 20.2,
    hvacMode: "cool",
    fanSpeed: "low",
    lightingScene: "night",
    lights: {
      master: true,
      entryway: false,
      bedroom: false,
      bathroom: true,
      nightstand: true,
    },
    doorLocked: true,
    privacyLatchEngaged: true,
    lastUpdated: "2026-09-07 21:10",
  },
  "room-050": {
    roomId: "room-050",
    roomNumber: "050",
    reservationId: "res-010",
    guestName: "Alhaji Yusuf Bello",
    dndActive: false,
    murActive: true,
    targetTemperature: 19,
    currentTemperature: 19.8,
    hvacMode: "cool",
    fanSpeed: "auto",
    lightingScene: "bright",
    lights: {
      master: true,
      entryway: true,
      bedroom: true,
      bathroom: true,
      nightstand: false,
    },
    doorLocked: true,
    privacyLatchEngaged: false,
    lastUpdated: "2026-09-07 19:45",
  },
  "room-015": {
    roomId: "room-015",
    roomNumber: "015",
    reservationId: "res-005",
    guestName: "Ngozi Obi",
    dndActive: false,
    murActive: false,
    targetTemperature: 22,
    currentTemperature: 22.0,
    hvacMode: "cool",
    fanSpeed: "auto",
    lightingScene: "ambient",
    lights: {
      master: true,
      entryway: false,
      bedroom: true,
      bathroom: false,
      nightstand: true,
    },
    doorLocked: true,
    privacyLatchEngaged: false,
    lastUpdated: "2026-09-07 18:20",
  },
};

