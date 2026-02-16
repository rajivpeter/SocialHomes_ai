// ============================================================
// SocialHomes.Ai — Comprehensive User Guide Content
// Detailed help for every page with process flows, field
// descriptions, status definitions, and best practices.
// ============================================================

export interface HelpTopic {
  id: string;
  title: string;
  icon?: 'steps' | 'alert' | 'info';
  content: string;
  steps?: { step: number; title: string; description: string }[];
  fields?: { name: string; description: string }[];
  statuses?: { status: string; color: string; description: string }[];
  subtopics?: { title: string; content: string }[];
}

export interface HelpPage {
  title: string;
  description: string;
  topics: HelpTopic[];
  tips?: string[];
  relatedPages?: { label: string; path: string }[];
}

export const helpContent: Record<string, HelpPage> = {

  // ──────────────────────────────────────────────────
  // DASHBOARD
  // ──────────────────────────────────────────────────
  '/dashboard': {
    title: 'Dashboard',
    description: 'Your executive command centre providing a real-time overview of organisational performance across all key housing management areas. The dashboard adapts its content and detail level based on your active persona.',
    topics: [
      {
        id: 'dash-kpi',
        title: 'KPI Cards',
        icon: 'info',
        content: 'The top row displays nine Key Performance Indicator cards. Each card shows the current figure alongside a trend indicator (up/down arrow with percentage change). Click any card to navigate directly to the relevant module.',
        fields: [
          { name: 'Properties', description: 'Total managed units in your portfolio. Includes houses, flats, bungalows, and sheltered units.' },
          { name: 'Tenancies', description: 'Active tenancies across all tenancy types: secure, assured, assured shorthold, starter, and licence.' },
          { name: 'Repairs', description: 'Open repair work orders across all priorities. Emergency, Urgent, Routine, and Planned.' },
          { name: 'Rent Collection', description: 'Current period collection rate as a percentage. Sector target is 97%.' },
          { name: 'Arrears', description: 'Total outstanding arrears balance across all rent accounts in debit.' },
          { name: 'Compliance', description: 'Overall Big 6 compliance percentage across Gas, Electrical, Fire, Asbestos, Legionella, and Lifts.' },
          { name: 'Complaints', description: 'Open complaints at Stage 1 and Stage 2 of the Housing Ombudsman Complaint Handling Code.' },
          { name: 'Voids', description: 'Properties currently empty and progressing through the lettings pipeline.' },
          { name: 'AI Alerts', description: 'Active AI-generated predictions and recommendations requiring officer review.' },
        ],
      },
      {
        id: 'dash-charts',
        title: 'Charts and Trends',
        icon: 'info',
        content: 'Interactive charts provide visual analysis of key operational metrics. All charts respond to the current date range and persona filters.',
        subtopics: [
          { title: 'Rent Collection Trend', content: 'Tracks monthly collection rates over 12 months against the 97% sector target (shown as a dashed line). Hover over data points to see exact figures. Green bars indicate months meeting target; amber bars indicate months below target.' },
          { title: 'Repairs by Priority', content: 'Stacked bar chart breaking down open repairs into Emergency (red, 24-hour response), Urgent (amber, 5 working days), Routine (blue, 20 working days), and Planned (grey, scheduled). Shows volume trends over 6 months.' },
          { title: 'Compliance Overview', content: 'Doughnut chart showing the proportion of compliant (green), expiring within 30 days (amber), and overdue (red) certificates across all six regulatory areas.' },
        ],
      },
      {
        id: 'dash-big6',
        title: 'Big 6 Compliance Grid',
        icon: 'alert',
        content: 'Displays compliance status across the six mandatory regulatory areas. Each cell uses RAG (Red/Amber/Green) status coding.',
        statuses: [
          { status: 'Green — Compliant', color: 'bg-emerald-500', description: 'All certificates current. No action required.' },
          { status: 'Amber — Expiring', color: 'bg-amber-500', description: 'One or more certificates expiring within 30 days. Schedule renewals urgently.' },
          { status: 'Red — Overdue', color: 'bg-red-500', description: 'Certificates have expired. Regulatory breach — immediate action required.' },
        ],
        subtopics: [
          { title: 'Gas Safety (CP12)', content: 'Annual Landlord Gas Safety Record. Criminal offence to let without valid certificate. Gas Safe registered engineer required.' },
          { title: 'Electrical (EICR)', content: 'Electrical Installation Condition Report. Required every 5 years. Deficiencies categorised C1 (danger present), C2 (potentially dangerous), C3 (improvement recommended).' },
          { title: 'Fire Risk Assessment', content: 'Required under the Regulatory Reform (Fire Safety) Order 2005. Higher-risk buildings (18m+, cladding, sheltered) need more frequent assessments.' },
          { title: 'Asbestos', content: 'Management surveys identify presence, location, and condition of asbestos-containing materials. Annual re-inspection required.' },
          { title: 'Legionella', content: 'Water system risk assessments with monitoring schedules for higher-risk properties such as sheltered housing and communal water systems.' },
          { title: 'Lifts (LOLER)', content: 'Lifting Operations and Lifting Equipment Regulations inspections required every 6 months for all passenger and goods lifts.' },
        ],
      },
      {
        id: 'dash-awaabs',
        title: "Awaab's Law Active Cases",
        icon: 'alert',
        content: "Shows any open damp and mould cases that fall under Awaab's Law 2023. Cases display countdown timers against statutory deadlines. Breaches are reportable to the Regulator of Social Housing.",
        statuses: [
          { status: 'Emergency Hazard', color: 'bg-red-500', description: 'Imminent risk to health. Initial response within 24 hours, repair within 7 calendar days.' },
          { status: 'Significant Hazard', color: 'bg-amber-500', description: 'Serious but not immediately dangerous. Investigation within 14 days, repair within 28 calendar days.' },
        ],
        fields: [
          { name: 'Case Reference', description: 'Unique identifier for the damp/mould case, linked to the repair and property records.' },
          { name: 'Property', description: 'Address of the affected property, clickable to navigate to property detail.' },
          { name: 'Category', description: 'Emergency or Significant hazard classification, determining statutory timescales.' },
          { name: 'Days Remaining', description: 'Countdown timer. Green when on track, amber when <25% time remaining, red when breached.' },
          { name: 'Stage', description: 'Current workflow stage: Reported, Assessed, Investigation, Repair Raised, Works in Progress, Completed, Follow-up.' },
        ],
      },
      {
        id: 'dash-ai',
        title: 'AI Insights and Activity Feed',
        icon: 'info',
        content: 'The AI Insights feed surfaces predictions and recommendations from eight machine learning models. The Recent Activity timeline logs the latest actions taken across the system.',
        subtopics: [
          { title: 'AI Prediction Models', content: 'Eight models: Arrears Risk, Damp & Mould Risk, Complaint Probability, Repair Recurrence, Void Duration, Tenancy Sustainment, ASB Escalation, and Disrepair Claim Risk. Each prediction includes a confidence score (0-100%) and a recommended action.' },
          { title: 'Confidence Scoring', content: 'Scores above 85% have historically been highly accurate. Scores between 60-85% are indicative and warrant monitoring. Below 60% are flagged as low confidence and should not drive enforcement action.' },
          { title: 'Recent Activity', content: 'Chronological log of all system actions: repairs raised, complaints logged, payments received, compliance certificates uploaded, and AI recommendations actioned. Filterable by module and user.' },
        ],
      },
      {
        id: 'dash-personas',
        title: 'Persona Switching',
        icon: 'info',
        content: 'The dashboard adapts its content based on your active persona. Use the persona switcher in the top-right header to change views.',
        subtopics: [
          { title: 'Chief Operating Officer', content: 'Full portfolio view with strategic KPIs, financial summary, regulatory compliance overview, and board-level metrics.' },
          { title: 'Head of Housing', content: 'Service area operations with team performance, SLA compliance, complaint trends, and resource allocation.' },
          { title: 'Team Manager', content: 'Team-scoped view showing caseload distribution, individual officer performance, and escalated items.' },
          { title: 'Housing Officer', content: 'Personal caseload showing assigned tenancies, open repairs, upcoming visits, and AI recommendations for your patch.' },
          { title: 'Repairs Operative', content: 'Mobile-optimised job list with today\'s appointments, navigation links, access instructions, and completion forms.' },
        ],
      },
    ],
    tips: [
      'Click any KPI card to drill down into the relevant module for detailed analysis.',
      'The dashboard view adapts based on your persona — a Housing Officer sees their caseload, while the COO sees the full portfolio.',
      'Use the persona switcher in the top-right to preview how different roles experience the system.',
      'AI Insights with confidence scores above 85% have historically been highly accurate and should be prioritised.',
      'Check the dashboard first thing each morning alongside your Morning Briefing for a complete operational picture.',
    ],
    relatedPages: [
      { label: 'Morning Briefing', path: '/briefing' },
      { label: 'Compliance', path: '/compliance' },
      { label: 'AI Centre', path: '/ai' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // MORNING BRIEFING
  // ──────────────────────────────────────────────────
  '/briefing': {
    title: 'Morning Briefing',
    description: 'A daily personalised briefing tailored to your role, summarising what needs your attention today and highlighting overnight changes, weather impacts, and AI predictions.',
    topics: [
      {
        id: 'brief-how',
        title: 'How the Briefing Works',
        icon: 'info',
        content: 'The morning briefing is generated fresh each day based on your persona and assigned caseload. It aggregates overnight events, weather forecasts, compliance deadlines, and AI predictions into a single prioritised view.',
        subtopics: [
          { title: 'Generation Timing', content: 'The briefing regenerates at 06:00 each day using the latest overnight data. It can be manually refreshed at any time using the refresh button.' },
          { title: 'Persona Adaptation', content: 'Content, language, and detail level adapt to your role. A COO sees strategic risks; a Housing Officer sees their specific patch actions.' },
          { title: 'Priority Ordering', content: 'Items are ranked by urgency: statutory deadlines first, SLA breaches second, AI predictions third, routine tasks last.' },
        ],
      },
      {
        id: 'brief-weather',
        title: 'Weather and External Factors',
        icon: 'alert',
        content: 'The weather section shows a 5-day forecast sourced from the Open-Meteo API. This is operationally significant for housing management.',
        subtopics: [
          { title: 'Heavy Rain', content: 'Increases damp and mould risk. Properties with existing damp history or poor ventilation are automatically flagged when rainfall exceeds 10mm/day.' },
          { title: 'Freezing Conditions', content: 'Temperatures below 0°C increase boiler breakdown risk and burst pipe probability. Vulnerable tenants (elderly, disabled) are flagged for welfare checks.' },
          { title: 'High Winds', content: 'Wind speeds above 45mph may cause roof damage, fallen trees, and emergency repair demand. Stock in exposed locations is flagged.' },
          { title: 'Flood Warnings', content: 'DEFRA flood alerts are cross-referenced against your property locations. Properties in active flood warning zones are highlighted with evacuation guidance.' },
        ],
      },
      {
        id: 'brief-urgent',
        title: 'Urgent Items',
        icon: 'alert',
        content: 'Items requiring immediate attention are displayed at the top with red indicators. Each item links directly to the relevant record.',
        fields: [
          { name: 'SLA Breaches', description: 'Repairs or complaints that have exceeded their target response time.' },
          { name: 'Expired Compliance', description: 'Properties with expired certificates — regulatory breach in progress.' },
          { name: 'Statutory Deadlines', description: "Awaab's Law, Ombudsman, or court deadlines approaching within 48 hours." },
          { name: 'Emergency Repairs', description: 'Emergency priority repairs awaiting allocation or contractor response.' },
          { name: 'Safeguarding Flags', description: 'High-risk vulnerability alerts requiring immediate officer attention.' },
        ],
      },
      {
        id: 'brief-tasks',
        title: 'Tasks and Predictions',
        icon: 'steps',
        content: 'Your task list combines scheduled activities with AI-recommended actions. Acting on predictions early prevents escalation.',
        subtopics: [
          { title: 'Scheduled Tasks', content: 'Pre-planned activities: property inspections, tenancy visits, rent review meetings, contractor supervision, and court attendance.' },
          { title: 'AI Recommendations', content: 'Proactive actions suggested by the prediction models. Marked with a sparkle icon. Examples: "Contact Mr Shah — arrears risk increasing", "Schedule damp inspection at 14 Elm Road — humidity rising".' },
          { title: 'Overdue Tasks', content: 'Tasks past their target date. Highlighted in red with days overdue. These should be actioned or rescheduled before new tasks.' },
        ],
      },
      {
        id: 'brief-patch',
        title: 'Patch Snapshot',
        icon: 'info',
        content: 'For housing officers and team managers, the patch snapshot shows a geographical summary of your assigned area to help plan your day.',
        fields: [
          { name: 'Open Cases', description: 'Total active cases (repairs, complaints, ASB) within your patch area.' },
          { name: 'Upcoming Visits', description: 'Scheduled property or tenancy visits for today and tomorrow.' },
          { name: 'Urgent Properties', description: 'Properties requiring immediate attention due to compliance, safeguarding, or emergency issues.' },
          { name: 'Void Count', description: 'Empty properties in your patch area with days void and current stage.' },
        ],
      },
    ],
    tips: [
      'Check your briefing first thing each morning before starting casework.',
      'Items marked with an AI sparkle icon are predictions — acting on these proactively can prevent complaints and escalation.',
      'The briefing respects your persona: switch roles to see how different team members experience their day.',
      'Weather warnings automatically cross-reference against your property stock for damp, freeze, and flood risk.',
      'Use the "Mark as reviewed" button on each item to track what you have actioned.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'AI Centre', path: '/ai' },
    ],
  },

  // ──────────────────────────────────────────────────
  // EXPLORE
  // ──────────────────────────────────────────────────
  '/explore': {
    title: 'Explore',
    description: 'A geographical drill-down tool for exploring your housing stock from country level down to individual units and tenants, with interactive maps and 3D building visualisations.',
    topics: [
      {
        id: 'explore-hierarchy',
        title: 'Navigation Hierarchy',
        icon: 'steps',
        content: 'Explore follows a top-down geographical hierarchy. Click any level to drill down further. Use the breadcrumb trail at the top to navigate back up.',
        steps: [
          { step: 1, title: 'Country', description: 'England, Wales, Scotland, or Northern Ireland. Shows total stock and regional breakdown.' },
          { step: 2, title: 'Region', description: 'Geographic region (e.g., London, South East). Shows local authority areas within the region.' },
          { step: 3, title: 'Local Authority', description: 'Council area. Shows estates and standalone properties within the authority boundary.' },
          { step: 4, title: 'Estate', description: 'Named estate or development. Shows blocks, houses, and aggregate metrics.' },
          { step: 5, title: 'Block', description: 'Individual building. Shows 3D visualisation with units colour-coded by status.' },
          { step: 6, title: 'Unit', description: 'Individual dwelling. Shows tenancy, compliance, repairs, and rent details.' },
        ],
      },
      {
        id: 'explore-map',
        title: 'Interactive Map',
        icon: 'info',
        content: 'The Leaflet map displays property markers colour-coded by status. Click any marker to view the property details panel. Zoom and pan to navigate.',
        statuses: [
          { status: 'Green Marker', color: 'bg-emerald-500', description: 'Property with no current issues. All compliance certificates valid, no open repairs.' },
          { status: 'Amber Marker', color: 'bg-amber-500', description: 'Property with upcoming compliance deadlines (within 30 days) or open non-emergency repairs.' },
          { status: 'Red Marker', color: 'bg-red-500', description: "Property with overdue compliance, emergency repairs, or active Awaab's Law cases." },
          { status: 'Grey Marker', color: 'bg-gray-500', description: 'Void property — currently empty and progressing through the lettings pipeline.' },
        ],
      },
      {
        id: 'explore-3d',
        title: '3D Building Visualisation',
        icon: 'info',
        content: 'At block level, a 3D visualisation shows the building with individual units. Units are colour-coded by occupancy status and can be clicked to view tenancy details.',
        subtopics: [
          { title: 'Occupied Units', content: 'Shown in blue. Click to view the current tenant, rent balance, and open cases.' },
          { title: 'Void Units', content: 'Shown in grey with void stage indicator. Click to view void duration and current lettings stage.' },
          { title: 'Under Offer', content: 'Shown in amber. An applicant has been identified and the offer process is underway.' },
          { title: 'Issue Flagged', content: 'Pulsing red outline indicates an active emergency repair, compliance breach, or safeguarding concern.' },
        ],
      },
      {
        id: 'explore-context',
        title: 'Context Panel',
        icon: 'info',
        content: 'The right-hand context panel displays metrics for the currently selected level, adapting its content as you drill down.',
        fields: [
          { name: 'Total Units', description: 'Number of managed dwellings at the selected level.' },
          { name: 'Occupancy Rate', description: 'Percentage of units with active tenancies. Target is typically 98%+.' },
          { name: 'Open Repairs', description: 'Count of active repair work orders at this level, broken down by priority.' },
          { name: 'Compliance', description: 'RAG status across Big 6 areas for properties at this level.' },
          { name: 'Rent Collection', description: 'Average collection rate for tenancies at this level.' },
          { name: 'Crime Data', description: 'Street-level crime statistics from data.police.uk for the surrounding area.' },
        ],
      },
    ],
    tips: [
      'Use the map zoom controls or scroll wheel to navigate geographically.',
      'At estate level, the compliance heatmap quickly identifies buildings needing attention.',
      'The 3D view at block level is ideal for identifying void clusters that may indicate wider estate issues.',
      'Crime data overlays help contextualise ASB case patterns with police-reported incidents.',
    ],
    relatedPages: [
      { label: 'Properties', path: '/properties' },
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Compliance', path: '/compliance' },
    ],
  },

  // ──────────────────────────────────────────────────
  // REPAIRS  (the user specifically asked for full process)
  // ──────────────────────────────────────────────────
  '/repairs': {
    title: 'Repairs',
    description: "Manage the entire repairs lifecycle from initial report through to completion, including priority categorisation, SLA tracking, contractor allocation, and Awaab's Law compliance. This module is central to operational housing management.",
    topics: [
      {
        id: 'rep-process',
        title: 'The Repairs Process — End to End',
        icon: 'steps',
        content: 'Every repair follows a defined workflow from report to completion. Understanding each stage ensures correct handling, SLA compliance, and a positive tenant experience.',
        steps: [
          { step: 1, title: 'Repair Reported', description: 'Tenant reports an issue via phone, tenant portal, email, or in person during a visit. The system creates a work order with a unique reference number (e.g., REP-042). The reporter\'s description, affected room, and any photographs are captured.' },
          { step: 2, title: 'Triage and Priority', description: 'The repair is categorised by trade (plumbing, electrical, joinery, roofing, plastering, painting, glazing, locksmith, drainage, gas) and assigned a priority: Emergency (24hrs), Urgent (5 working days), Routine (20 working days), or Planned. The SLA clock starts immediately.' },
          { step: 3, title: 'Damp/Mould Check', description: "If the repair description mentions damp, mould, condensation, or related terms, the system automatically flags it for Awaab's Law assessment. A separate statutory timer is started alongside the standard SLA." },
          { step: 4, title: 'Contractor Allocation', description: 'The repair is assigned to an internal operative or external contractor based on trade, priority, geographic proximity, and contractor performance history. The contractor receives a notification with job details.' },
          { step: 5, title: 'Appointment Booking', description: 'An appointment is scheduled with the tenant. For emergency repairs, attendance must be within 24 hours (often same-day). For routine repairs, the tenant is offered a choice of appointment slots. Confirmation is sent via their preferred channel.' },
          { step: 6, title: 'Pre-Inspection (if needed)', description: 'Complex or high-value repairs may require a pre-inspection to assess scope, order materials, and confirm the repair specification before work begins.' },
          { step: 7, title: 'Works Carried Out', description: 'The operative attends, completes the repair, and records: work done, materials used, time on site, before/after photographs, and whether the repair is fully complete or requires a follow-up visit.' },
          { step: 8, title: 'Completion and Sign-off', description: 'The repair is marked as complete. For jobs over a cost threshold, a post-inspection may be required. The tenant is notified that the work is done.' },
          { step: 9, title: 'Tenant Satisfaction', description: 'A satisfaction survey is sent to the tenant (SMS or email) within 48 hours of completion. Results feed into contractor performance metrics and TSM reporting.' },
          { step: 10, title: 'Quality Review', description: 'A percentage of completed repairs are randomly selected for quality audit. Failed audits result in a recall and affect contractor scoring.' },
        ],
      },
      {
        id: 'rep-priority',
        title: 'Priority Levels and SLA Targets',
        icon: 'alert',
        content: 'Repairs are categorised into four priority levels, each with a defined Service Level Agreement (SLA) target. Getting the priority right is essential for tenant safety and regulatory compliance.',
        statuses: [
          { status: 'Emergency (P1)', color: 'bg-red-500', description: '24-hour response. Examples: total loss of heating/hot water, major water leak, dangerous electrical fault, security breach (broken front door/window), gas leak, fire damage.' },
          { status: 'Urgent (P2)', color: 'bg-amber-500', description: '5 working day response. Examples: partial loss of heating, minor leak, broken extractor fan, faulty smoke detector, blocked drain, partial loss of power.' },
          { status: 'Routine (P3)', color: 'bg-blue-500', description: '20 working day response. Examples: dripping tap, cracked tile, sticking door, loose handrail, minor plastering, fence repair.' },
          { status: 'Planned (P4)', color: 'bg-gray-400', description: 'Scheduled improvement. Examples: kitchen replacement, bathroom renewal, window upgrade, rewiring programme, external decoration cycle.' },
        ],
        subtopics: [
          { title: 'SLA Clock Rules', content: 'The SLA clock starts when the repair is reported, not when it is triaged or allocated. Weekends and bank holidays DO count for emergency repairs but do NOT count for urgent and routine repairs (working days only). The clock stops when the operative records completion on site.' },
          { title: 'SLA Escalation', content: 'At 50% elapsed: auto-notification to the assigned officer. At 75% elapsed: auto-escalation to team manager. At 100% (breach): auto-escalation to Head of Service and flagged on dashboard. Post-breach: daily escalation until resolved.' },
        ],
      },
      {
        id: 'rep-sla-status',
        title: 'SLA Status Indicators',
        icon: 'info',
        content: 'Each repair displays an SLA status badge that updates in real time. Monitor these to prevent breaches.',
        statuses: [
          { status: 'On Track (Green)', color: 'bg-emerald-500', description: 'Repair is within target timescale. More than 25% of SLA time remaining.' },
          { status: 'At Risk (Amber)', color: 'bg-amber-500', description: 'Less than 25% of SLA time remaining. Requires immediate attention to avoid breach.' },
          { status: 'Breached (Red)', color: 'bg-red-500', description: 'Past the target date. Regulatory and reputational risk. Appears on dashboard and in board reports.' },
          { status: 'Completed', color: 'bg-blue-500', description: 'Repair finished. Shows whether it was completed within or outside SLA.' },
          { status: 'Cancelled', color: 'bg-gray-400', description: 'Repair cancelled — duplicate, tenant withdrew, or no access after 3 attempts.' },
        ],
      },
      {
        id: 'rep-awaabs',
        title: "Awaab's Law — Damp & Mould Cases",
        icon: 'alert',
        content: "Repairs involving damp, mould, or condensation are automatically flagged as potential Awaab's Law cases with separate statutory timescales that run alongside standard SLAs.",
        steps: [
          { step: 1, title: 'Auto-Detection', description: 'When a repair description contains keywords (damp, mould, mold, condensation, mushroom, black spots, wet wall), the system flags it for Awaab\'s Law assessment.' },
          { step: 2, title: 'Hazard Classification', description: 'A surveyor or housing officer assesses the hazard: Emergency (imminent health risk) or Significant (serious but not immediately dangerous). Classification determines statutory timescales.' },
          { step: 3, title: 'Statutory Response', description: 'Emergency: initial response within 24 hours, repair within 7 calendar days. Significant: investigation within 14 calendar days, repair within 28 calendar days. These are CALENDAR days, not working days.' },
          { step: 4, title: 'Remedial Works', description: 'Works raised with appropriate trade and priority. May include specialist damp treatment, ventilation installation, insulation upgrades, or structural repairs.' },
          { step: 5, title: 'Follow-up Inspection', description: 'Post-repair inspection within 6 weeks to verify the issue has been resolved and has not returned. If the issue recurs, a new case is opened.' },
          { step: 6, title: 'Case Closure and Reporting', description: 'Case closed with full audit trail. Data feeds into RSH regulatory returns and board reporting on Awaab\'s Law compliance.' },
        ],
      },
      {
        id: 'rep-backlog',
        title: 'Using the Repairs Backlog',
        icon: 'info',
        content: 'The main repairs view lists all open work orders with filtering, sorting, and bulk action capabilities.',
        fields: [
          { name: 'Reference', description: 'Unique work order ID (e.g., REP-042). Click to open the full repair detail.' },
          { name: 'Property', description: 'Address of the property. Click to navigate to the property record.' },
          { name: 'Tenant', description: 'Name of the reporting tenant. Click to navigate to the tenancy record.' },
          { name: 'Trade', description: 'Repair trade category: plumbing, electrical, joinery, roofing, plastering, painting, glazing, locksmith, drainage, gas, general.' },
          { name: 'Priority', description: 'Emergency (P1), Urgent (P2), Routine (P3), or Planned (P4). Colour-coded badge.' },
          { name: 'Reported Date', description: 'Date and time the repair was first reported. SLA clock starts from this moment.' },
          { name: 'SLA Status', description: 'On Track / At Risk / Breached indicator with countdown timer.' },
          { name: 'Contractor', description: 'Assigned operative or contractor company. "Unallocated" if not yet assigned.' },
          { name: 'Appointment', description: 'Scheduled date and time slot. "TBC" if not yet booked.' },
        ],
        subtopics: [
          { title: 'Filtering', content: 'Use the filter bar to narrow repairs by: priority level, trade, SLA status (on track/at risk/breached), date range, assigned contractor, property/estate, or Awaab\'s Law flag. Filters combine with AND logic.' },
          { title: 'Sorting', content: 'Click any column header to sort. Default sort is by SLA urgency (breached first, then at risk, then on track). Can also sort by date, priority, or property.' },
          { title: 'Bulk Actions', content: 'Select multiple repairs using checkboxes for bulk operations: reassign contractor, change priority, export to CSV, or send batch tenant notifications.' },
        ],
      },
      {
        id: 'rep-contractor',
        title: 'Contractor Management',
        icon: 'info',
        content: 'Each repair record shows contractor details. The system tracks performance metrics to inform future allocation decisions.',
        fields: [
          { name: 'Contractor Name', description: 'Company or individual operative name.' },
          { name: 'Contact Details', description: 'Phone number and email for direct communication.' },
          { name: 'Avg Completion Time', description: 'Average days from allocation to completion across all their repairs.' },
          { name: 'First-Time Fix Rate', description: 'Percentage of repairs completed on the first visit without needing a follow-up.' },
          { name: 'Tenant Satisfaction', description: 'Average satisfaction score from post-completion surveys (1-5 stars).' },
          { name: 'Gas Safe / NICEIC', description: 'Registration numbers and expiry dates for regulated trades.' },
        ],
      },
      {
        id: 'rep-raising',
        title: 'How to Raise a New Repair',
        icon: 'steps',
        content: 'Housing officers and contact centre staff can raise repairs on behalf of tenants.',
        steps: [
          { step: 1, title: 'Click "New Repair"', description: 'Use the "+" button or "New Repair" button in the top-right of the repairs backlog.' },
          { step: 2, title: 'Select Property', description: 'Search by address, UPRN, or tenant name. The property and current tenant are auto-linked.' },
          { step: 3, title: 'Describe the Issue', description: 'Enter a clear description of the problem. The AI will suggest a trade and priority based on the description.' },
          { step: 4, title: 'Select Room and Component', description: 'Choose the affected room (kitchen, bathroom, bedroom, hallway, external) and component (boiler, toilet, window, door, roof, etc.).' },
          { step: 5, title: 'Confirm Priority', description: 'Review the AI-suggested priority and adjust if needed. Remember: emergency = danger to life or total loss of essential service.' },
          { step: 6, title: 'Add Photos (Optional)', description: 'Upload photographs of the issue. Photos assist with triage, ordering materials, and providing evidence.' },
          { step: 7, title: 'Submit', description: 'The repair is created, reference number generated, and the SLA clock starts. A confirmation is sent to the tenant via their preferred channel.' },
        ],
      },
    ],
    tips: [
      'Use the "Breached" filter to immediately see all SLA-breached repairs requiring escalation.',
      "Repairs flagged with the Awaab's Law icon have separate statutory deadlines — check both the standard SLA and the statutory timer.",
      'The AI recurrence predictor flags repairs likely to return within 12 months, suggesting a more comprehensive repair or capital investment.',
      'Always check vulnerability flags on the tenant record before scheduling — some tenants may need specific access arrangements or welfare checks.',
      'Emergency repairs should be allocated within 1 hour of being raised. If the contractor has not acknowledged within 2 hours, re-allocate.',
      'For no-access situations, document each attempt with date, time, and method. After 3 failed attempts, the repair can be cancelled with a written notification to the tenant.',
    ],
    relatedPages: [
      { label: "Awaab's Law", path: '/compliance/awaabs-law' },
      { label: 'Properties', path: '/properties' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // TENANCIES
  // ──────────────────────────────────────────────────
  '/tenancies': {
    title: 'Tenancies',
    description: 'Manage all tenancy records including tenant details, rent accounts, vulnerability flags, household composition, communication history, and AI risk scores.',
    topics: [
      {
        id: 'ten-list',
        title: 'Tenant List and Search',
        icon: 'info',
        content: 'The main view displays all tenants with key information. Use search and filters to find specific records quickly.',
        fields: [
          { name: 'Name', description: 'Tenant full name. Click to open their detailed record.' },
          { name: 'Reference', description: 'Unique tenancy reference (e.g., TEN-001). Used across all modules.' },
          { name: 'Property', description: 'Current property address. Click to navigate to the property record.' },
          { name: 'Tenancy Type', description: 'Secure, Assured, Assured Shorthold, Starter (12-month probationary), or Licence.' },
          { name: 'Start Date', description: 'Date the current tenancy commenced.' },
          { name: 'Rent Balance', description: 'Current balance. Negative = arrears (red). Positive = credit (green). Zero = clear (neutral).' },
          { name: 'Status', description: 'Active, Notice Period, Former Tenant, or Deceased.' },
          { name: 'Risk Score', description: 'AI-calculated arrears risk (0-100%). Updated daily based on payment patterns and external factors.' },
        ],
      },
      {
        id: 'ten-detail',
        title: 'Tenant Detail View — Tabs',
        icon: 'info',
        content: 'Click any tenant to open their full record. The detail view is organised into tabs for different aspects of the tenancy.',
        subtopics: [
          { title: 'Overview Tab', content: 'Key details at a glance: personal information, tenancy summary, current alerts, vulnerability flags, and AI risk scores. The overview surfaces the most important information without needing to navigate between tabs.' },
          { title: 'Rent Account Tab', content: 'Current balance, weekly rent charge, payment method, full transaction history, and AI arrears prediction. See the Rent & Income guide for detailed rent management procedures.' },
          { title: 'Cases Tab', content: 'All linked cases: open repairs, active complaints, ASB cases, and safeguarding records. Cases are shown chronologically with status indicators.' },
          { title: 'Communications Tab', content: 'Complete history of all contact: letters sent, emails, SMS messages, logged phone calls, and visit records. Includes automated notifications and manual correspondence.' },
          { title: 'Household Tab', content: 'All household members: joint tenants, household members, permitted occupiers. Each entry shows relationship, date of birth, and individual vulnerability flags.' },
        ],
      },
      {
        id: 'ten-vulnerability',
        title: 'Vulnerability Flags and Safeguarding',
        icon: 'alert',
        content: 'Vulnerability flags are GDPR-sensitive indicators that drive additional safeguarding checks in workflows. Only visible to authorised staff.',
        subtopics: [
          { title: 'Mental Health', content: 'Tenant has disclosed or been identified as having mental health conditions. May affect communication approach and enforcement decisions.' },
          { title: 'Physical Disability', content: 'Mobility, sensory, or other physical impairments. Consider property adaptations, access requirements, and communication format (large print, BSL).' },
          { title: 'Learning Difficulty', content: 'May require simplified communication, additional time for appointments, and advocacy support.' },
          { title: 'Domestic Abuse', content: 'SENSITIVE. Restricts information sharing. May require safe contact methods and referral to specialist services.' },
          { title: 'Hoarding', content: 'Property may have access and fire safety risks. Requires multi-agency approach with mental health support.' },
          { title: 'Safeguarding (Adult/Child)', content: 'Active safeguarding concern. All interactions must follow safeguarding procedures. Referrals to Social Services may be required.' },
        ],
        fields: [
          { name: 'Flag Level', description: 'Low (monitoring), Medium (additional support), High (active safeguarding plan), Critical (immediate risk).' },
          { name: 'Review Date', description: 'Date when the vulnerability flag should be reviewed and confirmed as still relevant.' },
          { name: 'Support Plan', description: 'Link to any active support plan, care coordinator details, or partner agency contacts.' },
        ],
      },
      {
        id: 'ten-rent',
        title: 'Rent Account Management',
        icon: 'info',
        content: 'The rent account shows the current balance, payment history, and arrears trajectory. Negative balances indicate arrears.',
        fields: [
          { name: 'Current Balance', description: 'Live account balance. Updated in real time as payments are received and charges applied.' },
          { name: 'Weekly Charge', description: 'Net rent + service charges. Shown separately: eligible rent, water rates, heating charges, service charges.' },
          { name: 'Payment Method', description: 'Direct Debit, Standing Order, Universal Credit direct payment, Allpay card, cash at PayPoint, or online portal.' },
          { name: 'AI Risk Score', description: 'Probability (0-100%) of falling further into arrears within the next 4 weeks. Based on payment patterns, UC status, seasonal factors, and life events.' },
        ],
        statuses: [
          { status: 'Clear', color: 'bg-emerald-500', description: 'Balance is zero or in credit. No action required.' },
          { status: 'Mild Arrears (1-2 weeks)', color: 'bg-amber-400', description: 'Early arrears. SMS reminder sent automatically. Officer should monitor.' },
          { status: 'Moderate Arrears (3-4 weeks)', color: 'bg-amber-600', description: 'Proactive contact required. Offer payment plan. Check vulnerability flags before any enforcement.' },
          { status: 'Serious Arrears (5-8 weeks)', color: 'bg-red-400', description: 'Formal arrears process. Stage 1 letter. Income officer review. Consider APA request if UC.' },
          { status: 'Critical Arrears (8+ weeks)', color: 'bg-red-600', description: 'NOSP territory. Legal review required. Check all vulnerability factors. Court action as last resort.' },
        ],
      },
      {
        id: 'ten-uc',
        title: 'Universal Credit Tenants',
        icon: 'info',
        content: 'Tenants receiving Universal Credit have specific management requirements due to the monthly payment cycle and housing element structure.',
        fields: [
          { name: 'UC Status', description: 'Active, Pending, Suspended, or Not on UC.' },
          { name: 'Housing Element', description: 'The UC housing element amount. May differ from the actual rent if there is a shortfall.' },
          { name: 'APA Status', description: 'Alternative Payment Arrangement — whether managed payments are in place (paid direct to landlord).' },
          { name: 'Payment Date', description: 'Expected date of next UC payment. Useful for timing arrears contact.' },
          { name: 'Shortfall', description: 'Difference between actual rent and UC housing element. Tenant must pay this themselves.' },
        ],
      },
    ],
    tips: [
      'Use the arrears filter to quickly find tenants in significant arrears (over four weeks rent).',
      'The AI risk score updates daily — tenants with scores above 70% should receive proactive support.',
      'Always check vulnerability flags before conducting any enforcement action such as issuing a NOSP.',
      'The communication tab shows all contact across channels, giving a complete picture before tenant interactions.',
      'For UC tenants, check the payment date before making arrears calls — they may be between payment cycles.',
      'Right-click a tenant for quick actions: send SMS, schedule visit, raise repair, log phone call.',
    ],
    relatedPages: [
      { label: 'Rent & Income', path: '/rent' },
      { label: 'Properties', path: '/properties' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  // ──────────────────────────────────────────────────
  // PROPERTIES
  // ──────────────────────────────────────────────────
  '/properties': {
    title: 'Properties',
    description: 'View and manage your entire property portfolio including compliance status, repair history, damp risk assessments, EPC ratings, and current tenancy information.',
    topics: [
      {
        id: 'prop-portfolio',
        title: 'Property Portfolio View',
        icon: 'info',
        content: 'The properties list displays all units in your managed stock with key attributes and compliance health indicators.',
        fields: [
          { name: 'Address', description: 'Full property address including postcode. Click to open detail view.' },
          { name: 'UPRN', description: 'Unique Property Reference Number — the national identifier for every addressable property in the UK.' },
          { name: 'Type', description: 'House, Flat, Bungalow, Maisonette, Bedsit, or Sheltered Unit.' },
          { name: 'Bedrooms', description: 'Number of bedrooms. Determines allocations eligibility and bedroom tax applicability.' },
          { name: 'Current Tenant', description: 'Name of the lead tenant. "VOID" if the property is empty.' },
          { name: 'Compliance RAG', description: 'Overall compliance status across all six regulatory areas. Red = any overdue. Amber = any expiring. Green = all current.' },
          { name: 'Damp Risk', description: 'AI-predicted damp risk: Low (0-25%), Medium (26-50%), High (51-75%), Critical (76-100%).' },
          { name: 'EPC Rating', description: 'Energy Performance Certificate rating (A-G). Target: minimum C by 2030 for social housing.' },
        ],
      },
      {
        id: 'prop-compliance',
        title: 'Compliance Certificates',
        icon: 'alert',
        content: 'The compliance tab on each property shows certificate status for all six regulatory areas.',
        fields: [
          { name: 'Certificate Type', description: 'Gas CP12, EICR, Fire Risk Assessment, Asbestos Survey, Legionella Assessment, or LOLER Inspection.' },
          { name: 'Issue Date', description: 'Date the certificate was issued by the qualified assessor.' },
          { name: 'Expiry Date', description: 'Date the certificate expires. Gas = 12 months. EICR = 5 years. Others vary.' },
          { name: 'Status', description: 'Valid (green), Expiring within 30 days (amber), Expired (red).' },
          { name: 'Assessor', description: 'Name and registration number of the qualified person who issued the certificate.' },
          { name: 'Actions', description: 'Any remedial actions identified (e.g., C1/C2 electrical deficiencies) with completion status.' },
        ],
      },
      {
        id: 'prop-damp',
        title: 'Damp and Mould Risk Assessment',
        icon: 'alert',
        content: "Properties are assessed for damp and mould risk using a multi-factor AI model. High and Critical risk properties require proactive inspection under Awaab's Law timescales.",
        subtopics: [
          { title: 'Risk Factors', content: 'The model considers: property age and construction type, historical repair data (damp-related repairs), sensor data (humidity and temperature where available), weather conditions (rainfall, temperature), ventilation type, EPC rating, and tenant-reported issues.' },
          { title: 'Risk Levels', content: 'Low (0-25%): No action needed, routine monitoring. Medium (26-50%): Schedule preventive inspection within 3 months. High (51-75%): Inspect within 30 days, consider proactive works. Critical (76-100%): Immediate inspection required, treat as potential Awaab\'s Law case.' },
          { title: 'Weekly Updates', content: 'Risk scores recalculate weekly incorporating the latest weather data, repair history, and sensor readings. Significant increases trigger alerts to the assigned housing officer.' },
        ],
      },
      {
        id: 'prop-maintenance',
        title: 'Maintenance History',
        icon: 'info',
        content: 'A chronological log of all repairs, planned works, and capital investment on the property. Essential for understanding property condition and lifecycle planning.',
        subtopics: [
          { title: 'Responsive Repairs', content: 'Day-to-day repairs reported by tenants or identified during inspections. Shows reference, date, trade, description, cost, and SLA compliance.' },
          { title: 'Cyclical Maintenance', content: 'Planned cyclical works: external/internal decoration, gutter clearance, grounds maintenance, communal cleaning schedules.' },
          { title: 'Capital Works', content: 'Major component replacements: kitchen (lifecycle 20yrs), bathroom (30yrs), windows (30yrs), roof (50yrs), boiler (15yrs), rewiring (30yrs). Shows date, cost, and remaining lifecycle.' },
        ],
      },
      {
        id: 'prop-void',
        title: 'Void and Letting Status',
        icon: 'steps',
        content: 'When a property is void (empty), the detail view shows its progress through the lettings pipeline. Target turnaround is typically 20-28 calendar days.',
        steps: [
          { step: 1, title: 'Notice Period', description: 'Tenant has given notice. Typically 4 weeks for periodic tenancies. Pre-termination inspection may be scheduled.' },
          { step: 2, title: 'Keys Received', description: 'Tenant has handed back keys. Former tenant liability ends. Void rent loss clock starts.' },
          { step: 3, title: 'Void Inspection', description: 'Property condition assessment. Identifies required works and estimated cost/duration.' },
          { step: 4, title: 'Repair Works', description: 'Making good: decoration, repairs, deep clean, safety checks. Target: complete within 10 working days.' },
          { step: 5, title: 'Quality Check', description: 'Post-repair inspection to confirm property meets lettable standard.' },
          { step: 6, title: 'Ready to Let', description: 'Property available for allocation. Matching against waiting list begins.' },
          { step: 7, title: 'Under Offer', description: 'Applicant identified and viewing/sign-up scheduled.' },
          { step: 8, title: 'Let', description: 'New tenancy signed. Void period ends. Keys handed to new tenant.' },
        ],
      },
    ],
    tips: [
      'Sort by compliance status to quickly identify properties with expired or expiring certificates.',
      'The damp risk score is predictive — a rising score warrants a proactive inspection even if no repair has been reported.',
      'Use the property archetype filter to identify systemic issues (e.g., all 1960s system-built flats may share the same damp problems).',
      'Export property data for asset management reporting using the download button.',
      'Check EPC ratings against the 2030 target — properties rated D or below need energy improvement planning.',
    ],
    relatedPages: [
      { label: 'Compliance', path: '/compliance' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Explore', path: '/explore' },
      { label: 'Allocations', path: '/allocations' },
    ],
  },

  // ──────────────────────────────────────────────────
  // RENT & INCOME
  // ──────────────────────────────────────────────────
  '/rent': {
    title: 'Rent & Income',
    description: 'Track rent collection performance, manage arrears cases, view tenant statements, and monitor payment patterns across your portfolio. Rent collection is the financial lifeblood of the organisation.',
    topics: [
      {
        id: 'rent-collection',
        title: 'Collection Performance',
        icon: 'info',
        content: 'The headline figure shows current rent collection rate. The sector target is 97%. Collection below 95% indicates serious organisational risk.',
        fields: [
          { name: 'Collection Rate', description: 'Total rent received ÷ total rent due (debit) × 100. Expressed as a percentage.' },
          { name: 'Period', description: 'Current financial week/month and year-to-date cumulative figure.' },
          { name: 'Trend Chart', description: 'Weekly and monthly collection rates over the past 12 months against the 97% target line.' },
          { name: 'Breakdown', description: 'Collection analysed by: payment method, team/patch, property type, and tenancy type.' },
        ],
      },
      {
        id: 'rent-arrears-process',
        title: 'Arrears Management Process',
        icon: 'steps',
        content: 'The arrears recovery process follows a staged approach, balancing income recovery with tenant support and vulnerability considerations.',
        steps: [
          { step: 1, title: 'Early Detection', description: 'AI identifies tenants at risk of arrears before they miss a payment. Proactive contact is made to offer support and prevent arrears from building.' },
          { step: 2, title: 'Mild Arrears (1-2 weeks)', description: 'Automated SMS reminder sent. Housing officer monitors. Gentle first contact to understand the reason and offer payment options.' },
          { step: 3, title: 'Moderate Arrears (3-4 weeks)', description: 'Stage 1 arrears letter sent. Personal contact by phone or visit. Offer a payment plan. Check vulnerability flags. Consider income maximisation referral.' },
          { step: 4, title: 'Serious Arrears (5-8 weeks)', description: 'Stage 2 formal letter. Arrears agreement offered. Income officer review. For UC tenants, request APA (managed payment). Debt advice referral offered.' },
          { step: 5, title: 'Critical Arrears (8+ weeks)', description: 'Notice of Seeking Possession (NOSP) consideration. Legal review. Panel decision required. Vulnerability assessment mandatory. Court action as absolute last resort.' },
          { step: 6, title: 'Legal Action', description: 'Court application for possession. Section 8 (grounds for possession) or Section 21 (no-fault, AST only). Legal team involvement mandatory. All arrears actions must be evidenced.' },
        ],
        subtopics: [
          { title: 'Payment Plans', content: 'Payment plans should be realistic and affordable. Assess the tenant\'s full financial position. A plan to clear arrears within 12 months is typical. Plans are reviewed monthly. Broken plans escalate to the next stage.' },
          { title: 'Income Maximisation', content: 'Before enforcement, check if the tenant is claiming all entitled benefits: UC housing element, Council Tax reduction, Discretionary Housing Payment (DHP), Pension Credit, Attendance Allowance, PIP. Referral to CAB or in-house welfare advisor.' },
        ],
      },
      {
        id: 'rent-statements',
        title: 'Tenant Statements',
        icon: 'info',
        content: 'Full rent statements showing all debits and credits with filtering and export capabilities.',
        fields: [
          { name: 'Debit', description: 'Weekly rent charge, service charges, court costs, rechargeable repairs.' },
          { name: 'Credit', description: 'Tenant payments, Housing Benefit, UC housing element, DHP payments, write-offs.' },
          { name: 'Running Balance', description: 'Cumulative balance after each transaction. Negative = arrears.' },
          { name: 'Date Range', description: 'Filter statements by date. Default shows current tenancy period.' },
          { name: 'Export', description: 'Download as PDF (for tenant correspondence) or CSV (for analysis).' },
        ],
      },
      {
        id: 'rent-uc',
        title: 'Universal Credit Impact',
        icon: 'alert',
        content: 'UC tenants have specific management requirements. The monthly payment cycle and direct-to-tenant payments create additional arrears risk.',
        subtopics: [
          { title: 'UC Housing Element', content: 'The housing element of UC covers rent costs. May not cover full rent if there is a shortfall (bedroom tax, benefit cap, LHA rate cap). The difference must be paid by the tenant.' },
          { title: 'Alternative Payment Arrangements (APA)', content: 'Request managed payments (direct to landlord) when: tenant is in 2+ months arrears, has a vulnerability, or has a history of rent debt. Applied via UC journal or phone.' },
          { title: 'Payment Gaps', content: '5-week wait at start of UC claim creates an automatic arrears period. Advance payments are available but must be repaid. Support tenant through this transition.' },
          { title: 'Monitoring', content: 'UC payment dates are tracked. Officers should time contact around payment dates. Missed UC payments may indicate a change in circumstances or sanctions.' },
        ],
      },
    ],
    tips: [
      'Focus arrears intervention on tenants in the "Moderate" category to prevent escalation to "Serious".',
      'The AI arrears predictor can identify tenants likely to fall into arrears before it happens — use this for early intervention.',
      'Check UC payment dates when planning arrears calls — tenants may be between payment cycles.',
      'Export statements before any legal action to ensure you have a complete and accurate record.',
      'Always offer income maximisation and debt advice before escalating to enforcement action.',
      'Document every contact attempt — the audit trail is essential evidence if proceedings are required.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Reports', path: '/reports' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  // ──────────────────────────────────────────────────
  // COMPLIANCE
  // ──────────────────────────────────────────────────
  '/compliance': {
    title: 'Compliance',
    description: 'Monitor and manage regulatory compliance across the Big 6 safety areas. Non-compliance is a criminal offence in several areas and a regulatory breach in all of them.',
    topics: [
      {
        id: 'comp-overview',
        title: 'Big 6 Overview Dashboard',
        icon: 'info',
        content: 'The compliance dashboard provides a summary across all six regulatory areas with counts and RAG status.',
        fields: [
          { name: 'Total Required', description: 'Number of properties requiring certification in this area (e.g., all properties with gas = gas CP12 required).' },
          { name: 'Compliant', description: 'Properties with valid, in-date certificates.' },
          { name: 'Expiring (30 days)', description: 'Certificates expiring within the next 30 days. Schedule renewals now.' },
          { name: 'Overdue', description: 'Expired certificates. Active regulatory breach. Highest priority.' },
          { name: 'Access Issues', description: 'Properties where access has been refused or not obtained. Escalation pathway applies.' },
        ],
      },
      {
        id: 'comp-gas',
        title: 'Gas Safety (CP12)',
        icon: 'alert',
        content: 'All properties with gas installations require an annual Landlord Gas Safety Record (CP12) from a Gas Safe registered engineer. It is a criminal offence to let a property without a valid certificate.',
        steps: [
          { step: 1, title: 'Schedule (60 days before expiry)', description: 'The system generates a scheduling notification 60 days before the current CP12 expires. Contact the tenant to arrange access.' },
          { step: 2, title: 'First Access Attempt', description: 'Arrange appointment with tenant. Send confirmation via preferred channel. Gas Safe engineer attends.' },
          { step: 3, title: 'Second Attempt (if failed)', description: 'If first attempt fails (no access), send a written letter giving 7 days notice of a rescheduled appointment.' },
          { step: 4, title: 'Third Attempt (if failed)', description: 'Final attempt with 48 hours written notice. Inform tenant that legal access will be sought if they refuse.' },
          { step: 5, title: 'Legal Access (if refused)', description: 'Injunction application to court for forced entry. Legal team involvement. This is an absolute last resort.' },
          { step: 6, title: 'Certificate Uploaded', description: 'CP12 uploaded to the system. New expiry date set. Compliance status updated to green.' },
        ],
      },
      {
        id: 'comp-electrical',
        title: 'Electrical (EICR)',
        icon: 'alert',
        content: 'Electrical Installation Condition Reports are required every 5 years. Deficiencies are categorised by severity.',
        statuses: [
          { status: 'C1 — Danger Present', color: 'bg-red-500', description: 'Risk of injury. Requires immediate remedial action before the property can be occupied.' },
          { status: 'C2 — Potentially Dangerous', color: 'bg-amber-500', description: 'Requires urgent remedial action. Must be resolved within 28 days.' },
          { status: 'C3 — Improvement Recommended', color: 'bg-blue-500', description: 'Recommended but not required by regulation. Good practice to address during planned works.' },
          { status: 'FI — Further Investigation', color: 'bg-purple-500', description: 'Issue requires further investigation to determine severity. Must be investigated promptly.' },
        ],
      },
      {
        id: 'comp-fire',
        title: 'Fire Risk Assessment',
        icon: 'alert',
        content: 'Required under the Regulatory Reform (Fire Safety) Order 2005. Assessment frequency depends on building risk profile.',
        subtopics: [
          { title: 'High-Rise (18m+)', content: 'Annual assessment. Additional requirements under the Building Safety Act 2022: Building Safety Case, Safety Certificate, and Accountable Person designation.' },
          { title: 'Medium-Rise', content: 'Assessment every 2-3 years depending on risk profile, cladding type, and occupancy.' },
          { title: 'Low-Rise / Houses', content: 'Assessment every 3-5 years. Primarily applicable to communal areas, HMOs, and sheltered housing.' },
          { title: 'Action Items', content: 'FRA actions are tracked to completion. Critical actions (means of escape, fire detection, compartmentation) have mandatory timescales.' },
        ],
      },
      {
        id: 'comp-access',
        title: 'Access Management',
        icon: 'steps',
        content: 'Managing access to properties for compliance inspections is a common challenge. The system provides a structured escalation pathway.',
        steps: [
          { step: 1, title: 'Initial Contact', description: 'Letter or call to arrange appointment. Offer choice of dates. Explain the legal requirement and why the inspection is needed.' },
          { step: 2, title: 'First Failed Attempt', description: 'Record the failed attempt with date, time, and circumstances. Send a follow-up letter with a new appointment date.' },
          { step: 3, title: 'Second Failed Attempt', description: 'Record second failure. Send a formal letter explaining that failure to allow access is a tenancy breach.' },
          { step: 4, title: 'Third Failed Attempt', description: 'Record third failure. Refer to legal team for injunction (gas) or tenancy enforcement.' },
          { step: 5, title: 'Legal Access', description: 'Court injunction for forced entry. Locksmith costs recharged to tenant. Only used for gas safety and urgent electrical issues.' },
        ],
      },
    ],
    tips: [
      'Properties showing red on any compliance area should be treated as the highest priority.',
      'Set up scheduling 60 days before certificate expiry to allow time for access and contractor booking.',
      'Track access refusals carefully — three documented failed attempts may justify legal access.',
      'Use the compliance export for your annual RSH return and board reporting.',
      'C1 and C2 electrical deficiencies must have remedial works tracked to completion.',
    ],
    relatedPages: [
      { label: "Awaab's Law", path: '/compliance/awaabs-law' },
      { label: 'Properties', path: '/properties' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // AWAAB'S LAW
  // ──────────────────────────────────────────────────
  '/compliance/awaabs-law': {
    title: "Awaab's Law",
    description: "Track damp and mould cases against statutory deadlines set by Awaab's Law 2023. This law sets fixed timescales that social landlords MUST meet. Failure to comply is a regulatory breach reportable to the RSH.",
    topics: [
      {
        id: 'awaab-what',
        title: "What is Awaab's Law?",
        icon: 'alert',
        content: "Awaab's Law was introduced in 2023 following the death of two-year-old Awaab Ishak from prolonged exposure to mould in his social housing home in Rochdale. The law amends the Social Housing (Regulation) Act 2023 and imposes statutory duties with specific response deadlines on all social landlords.",
        subtopics: [
          { title: 'Legal Basis', content: 'Section 10A of the Landlord and Tenant Act 1985 (as inserted by the Social Housing Regulation Act 2023). Applies to all registered providers of social housing in England.' },
          { title: 'Scope', content: 'Covers all hazards related to damp, mould, and condensation in social housing properties. Applies regardless of perceived cause (structural, lifestyle, or environmental).' },
          { title: 'Penalties', content: 'Non-compliance is a breach of the consumer standards enforced by the Regulator of Social Housing. Can result in regulatory notices, compliance orders, fines, and ultimately deregistration.' },
        ],
      },
      {
        id: 'awaab-categories',
        title: 'Hazard Categories and Timescales',
        icon: 'alert',
        content: 'Cases are classified into two categories with mandatory response timescales.',
        statuses: [
          { status: 'Emergency Hazard', color: 'bg-red-500', description: 'Imminent risk to health and safety. Initial response: 24 hours. Repair completion: 7 calendar days.' },
          { status: 'Significant Hazard', color: 'bg-amber-500', description: 'Serious but not immediately dangerous. Investigation: 14 calendar days. Repair completion: 28 calendar days.' },
        ],
        subtopics: [
          { title: 'Emergency Examples', content: 'Extensive black mould in a child\'s bedroom, mould in an immunocompromised person\'s home, mushroom/fungal growth indicating severe damp penetration, structural damp causing electrical hazards.' },
          { title: 'Significant Examples', content: 'Condensation mould on bathroom ceiling, damp patches on walls without occupant health impact, minor mould in a well-ventilated area, recurring condensation in kitchens.' },
          { title: 'Calendar Days', content: 'IMPORTANT: Timescales are in calendar days, NOT working days. Weekends and bank holidays count. The clock starts from the moment the report is received by the landlord.' },
        ],
      },
      {
        id: 'awaab-workflow',
        title: 'Case Workflow — Step by Step',
        icon: 'steps',
        content: 'Every damp/mould case follows a defined workflow with timestamps at each stage creating an auditable record for regulatory reporting.',
        steps: [
          { step: 1, title: 'Report Received', description: 'Tenant reports damp, mould, or condensation via any channel. Clock starts immediately. System auto-flags as potential Awaab\'s Law case.' },
          { step: 2, title: 'Acknowledgement', description: 'Acknowledge receipt to tenant within 24 hours. Confirm next steps and expected timescales.' },
          { step: 3, title: 'Hazard Assessment', description: 'Qualified surveyor or housing officer inspects and classifies as Emergency or Significant. For Emergency cases, this must happen within 24 hours of report.' },
          { step: 4, title: 'Investigation', description: 'Determine root cause: rising damp, penetrating damp, condensation, plumbing leak, structural defect. For Significant hazards, complete within 14 calendar days.' },
          { step: 5, title: 'Remedial Works Raised', description: 'Appropriate repair or improvement works raised with priority matching the hazard category. May include: damp-proof course, ventilation fans, insulation, plumbing repairs, roof repairs, repointing, mould treatment.' },
          { step: 6, title: 'Works Completed', description: 'Emergency repairs within 7 calendar days. Significant repairs within 28 calendar days. Completion recorded with photographs and operative sign-off.' },
          { step: 7, title: 'Tenant Confirmation', description: 'Contact tenant to confirm satisfaction with the repair. Record their feedback.' },
          { step: 8, title: 'Follow-up Inspection', description: 'Reinspect within 6 weeks to verify the issue has been resolved and has not returned. If issue recurs, open a new case.' },
          { step: 9, title: 'Case Closure', description: 'Close case with full audit trail: all dates, actions, photographs, and correspondence. Data feeds into regulatory reporting.' },
        ],
      },
      {
        id: 'awaab-timers',
        title: 'Countdown Timers',
        icon: 'info',
        content: 'Each active case displays countdown timers against statutory deadlines.',
        statuses: [
          { status: 'On Track (Green)', color: 'bg-emerald-500', description: 'More than 25% of time remaining. Progressing within timescales.' },
          { status: 'At Risk (Amber)', color: 'bg-amber-500', description: 'Less than 25% of time remaining. Escalate immediately.' },
          { status: 'Breached (Red)', color: 'bg-red-500', description: 'Statutory deadline passed. Regulatory breach. Report to RSH. Escalate to Director level.' },
        ],
      },
    ],
    tips: [
      'Treat ANY report of damp, mould, or condensation as a potential Awaab\'s Law case until assessment proves otherwise.',
      'The 24-hour emergency response clock starts from the moment the report is received, not when it is triaged.',
      'Document every action with timestamps — the audit trail is your evidence of compliance.',
      'Use the AI damp risk model to proactively identify properties before tenants report issues.',
      'Never attribute mould solely to "tenant lifestyle" — investigate structural and environmental causes first.',
      'Ensure vulnerable tenants (children, elderly, respiratory conditions) are prioritised for emergency classification.',
    ],
    relatedPages: [
      { label: 'Compliance', path: '/compliance' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Properties', path: '/properties' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // COMPLAINTS
  // ──────────────────────────────────────────────────
  '/complaints': {
    title: 'Complaints',
    description: 'Manage complaints in line with the Housing Ombudsman Complaint Handling Code (2024 revision). The Code mandates a two-stage process with strict timescales.',
    topics: [
      {
        id: 'comp-process',
        title: 'Complaint Handling Process',
        icon: 'steps',
        content: 'All complaints follow the Housing Ombudsman Complaint Handling Code. Understanding and following this process correctly is essential for regulatory compliance.',
        steps: [
          { step: 1, title: 'Complaint Received', description: 'A complaint is any expression of dissatisfaction about a service, action, or lack of action. It does not need to use the word "complaint". Log it immediately.' },
          { step: 2, title: 'Acknowledgement (5 working days)', description: 'Acknowledge the complaint in writing within 5 working days. Confirm the complaint definition, the investigating officer, and expected response date.' },
          { step: 3, title: 'Stage 1 Investigation', description: 'A manager NOT involved in the original issue investigates. Gather evidence, interview staff, review records. Consider the desired outcome.' },
          { step: 4, title: 'Stage 1 Response (10 working days)', description: 'Written response within 10 working days (extendable to 20 with tenant agreement). Must include: summary of complaint, investigation findings, decision, any remedy/compensation, and right to escalate.' },
          { step: 5, title: 'Escalation Request', description: 'If the tenant is dissatisfied, they can request escalation to Stage 2. Must be accepted unless clearly outside scope.' },
          { step: 6, title: 'Stage 2 Review (20 working days)', description: 'Handled by a more senior manager or panel. Reviews whether Stage 1 was properly handled and whether the outcome was reasonable. Written response within 20 working days (extendable to 40 in exceptional circumstances).' },
          { step: 7, title: 'Housing Ombudsman Referral', description: 'If still dissatisfied after Stage 2, the tenant can refer to the Housing Ombudsman. The system tracks Ombudsman cases separately.' },
          { step: 8, title: 'Learning Action', description: 'Every closed complaint generates a learning action: what went wrong, what systemic change is needed, and who is responsible for implementing it.' },
        ],
      },
      {
        id: 'comp-categories',
        title: 'Complaint Categories',
        icon: 'info',
        content: 'Complaints are categorised by type to enable trend analysis and identify systemic issues.',
        subtopics: [
          { title: 'Repairs', content: 'Quality of repair, time taken, repeated failures, contractor behaviour, missed appointments.' },
          { title: 'Anti-Social Behaviour', content: 'Handling of ASB reports, speed of response, effectiveness of enforcement, victim support.' },
          { title: 'Staff Conduct', content: 'Rudeness, failure to return calls, discriminatory behaviour, breach of procedure.' },
          { title: 'Service Failure', content: 'Missed appointments, incorrect charges, lost documents, failure to act on reports.' },
          { title: 'Communication', content: 'Not kept informed, conflicting information, failure to respond to correspondence.' },
          { title: 'Property Condition', content: 'Damp and mould, poor void standard, component failures, communal area maintenance.' },
        ],
      },
      {
        id: 'comp-ombudsman',
        title: 'Housing Ombudsman Determinations',
        icon: 'alert',
        content: 'Cases referred to the Housing Ombudsman result in formal determinations that must be complied with.',
        statuses: [
          { status: 'No Maladministration', color: 'bg-emerald-500', description: 'The landlord acted reasonably. No further action required.' },
          { status: 'Service Failure', color: 'bg-amber-500', description: 'Some shortcomings identified but not rising to maladministration. Minor remedy may be ordered.' },
          { status: 'Maladministration', color: 'bg-red-500', description: 'Significant failing in service delivery. Remedy ordered — typically compensation and service improvement.' },
          { status: 'Severe Maladministration', color: 'bg-red-700', description: 'Serious and persistent failings. Significant compensation and mandatory service improvements. May trigger RSH referral.' },
        ],
      },
    ],
    tips: [
      'Acknowledge every complaint within 5 working days, even if the investigation will take longer.',
      'The complaint risk predictor identifies tenants likely to escalate — proactive contact can resolve issues before a formal complaint.',
      'Always check if a repair-related complaint should also trigger an Awaab\'s Law assessment.',
      'Review learning actions monthly to identify systemic improvements across the organisation.',
      'Compensation should be proportionate and follow the organisation\'s compensation policy.',
      'Keep the complainant informed throughout — the most common complaint about complaints handling is being kept in the dark.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Reports', path: '/reports' },
      { label: 'ASB', path: '/asb' },
    ],
  },

  // ──────────────────────────────────────────────────
  // ALLOCATIONS
  // ──────────────────────────────────────────────────
  '/allocations': {
    title: 'Allocations',
    description: 'Manage void properties through the lettings process, from termination to new tenancy commencement, with waiting list management and void cost monitoring.',
    topics: [
      {
        id: 'alloc-pipeline',
        title: 'Void Pipeline Stages',
        icon: 'steps',
        content: 'Each void property progresses through defined stages. Target turnaround is 20-28 calendar days from keys received to new tenancy start.',
        steps: [
          { step: 1, title: 'Notice Period', description: 'Tenant has served notice. Pre-termination inspection scheduled to identify works needed.' },
          { step: 2, title: 'Keys Received', description: 'Keys handed back. Void clock starts. Meter readings taken. Property secured.' },
          { step: 3, title: 'Void Inspection', description: 'Condition assessment within 48 hours. Identify all required works and estimated duration.' },
          { step: 4, title: 'Repair Works', description: 'Repairs, decoration, deep clean, safety checks. Target: 10 working days maximum.' },
          { step: 5, title: 'Quality Check', description: 'Inspection confirms property meets lettable standard. All compliance certificates valid.' },
          { step: 6, title: 'Ready to Let', description: 'Property available for allocation. Matching against waiting list begins automatically.' },
          { step: 7, title: 'Under Offer', description: 'Applicant selected, viewing arranged, tenancy sign-up scheduled.' },
          { step: 8, title: 'Let', description: 'New tenancy starts. Void period ends. Rent charging begins.' },
        ],
      },
      {
        id: 'alloc-waiting',
        title: 'Waiting List and Matching',
        icon: 'info',
        content: 'The waiting list manages applicants for housing. Allocations follow the published allocation policy.',
        fields: [
          { name: 'Priority Band', description: 'Emergency (immediate risk), Band A (urgent need), Band B (moderate need), Band C (general need).' },
          { name: 'Bedrooms', description: 'Required number of bedrooms based on household composition and bedroom standard.' },
          { name: 'Accessibility', description: 'Wheelchair access, ground floor, level access shower, stairlift compatibility.' },
          { name: 'Area Preference', description: 'Preferred estates or areas. Not guaranteed but considered during matching.' },
          { name: 'Waiting Time', description: 'Time since application registered. Used as tiebreaker within the same priority band.' },
        ],
      },
      {
        id: 'alloc-costs',
        title: 'Void Cost Tracking',
        icon: 'info',
        content: 'Every void property incurs costs. Minimising void duration directly improves organisational finances.',
        fields: [
          { name: 'Rent Loss', description: 'Weekly rent × void days. The primary cost of voids. Reported to the board weekly.' },
          { name: 'Repair Costs', description: 'Making-good works: decoration, repairs, replacements. Tracked against void budget.' },
          { name: 'Council Tax', description: 'Landlord liable for council tax during void period (exemption may apply for first 6 months).' },
          { name: 'Total Void Cost', description: 'Rent loss + repairs + council tax. Benchmarked against sector averages.' },
        ],
      },
    ],
    tips: [
      'Prioritise void inspections within 48 hours of keys received to minimise turnaround time.',
      'Pre-order common materials (paint, door furniture, tap washers) to avoid delays during void works.',
      'Use the waiting list match score to shortlist applicants before the property is ready — paperwork can run in parallel.',
      'Track void loss weekly and escalate any property void for more than 28 days to Head of Service.',
    ],
    relatedPages: [
      { label: 'Properties', path: '/properties' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Tenancies', path: '/tenancies' },
    ],
  },

  // ──────────────────────────────────────────────────
  // ASB
  // ──────────────────────────────────────────────────
  '/asb': {
    title: 'Anti-Social Behaviour',
    description: 'Manage ASB cases with severity categorisation, progressive escalation, evidence tracking, victim support, and multi-agency coordination.',
    topics: [
      {
        id: 'asb-categories',
        title: 'ASB Case Categories',
        icon: 'alert',
        content: 'Cases are categorised by severity. Category determines response timescales and available enforcement tools.',
        statuses: [
          { status: 'Category 1 — High', color: 'bg-red-500', description: 'Violence, threats, hate crime, serious criminal activity, drug dealing. 24-hour initial response. Multi-agency involvement.' },
          { status: 'Category 2 — Medium', color: 'bg-amber-500', description: 'Persistent noise, harassment, vandalism, alcohol-related disorder. 5-day initial response. Escalation pathway active.' },
          { status: 'Category 3 — Low', color: 'bg-blue-500', description: 'Minor nuisance, lifestyle differences, occasional disturbance. 10-day initial response. Mediation may be appropriate.' },
        ],
      },
      {
        id: 'asb-escalation',
        title: 'Escalation Pathway',
        icon: 'steps',
        content: 'ASB cases follow a progressive escalation pathway. Each stage requires documented evidence and senior review before proceeding.',
        steps: [
          { step: 1, title: 'Verbal Warning', description: 'Informal discussion with the perpetrator about their behaviour and its impact. Document the conversation.' },
          { step: 2, title: 'Written Warning', description: 'Formal letter detailing the behaviour, impact on others, and consequences of continuation.' },
          { step: 3, title: 'Acceptable Behaviour Contract (ABC)', description: 'Voluntary agreement signed by the perpetrator agreeing to specific behaviour changes. Not legally binding but demonstrates willingness to engage.' },
          { step: 4, title: 'Community Protection Warning (CPW)', description: 'Formal warning under the ASB, Crime and Policing Act 2014. Sets out the behaviour that must stop.' },
          { step: 5, title: 'Community Protection Notice (CPN)', description: 'Legal notice requiring the person to stop specified behaviour. Breach is a criminal offence (fixed penalty notice or prosecution).' },
          { step: 6, title: 'Injunction', description: 'Court order prohibiting specific behaviours. Can include exclusion zones. Breach is contempt of court (fine or imprisonment).' },
          { step: 7, title: 'Possession Proceedings', description: 'Application to court to end the tenancy on ASB grounds (Ground 14 — nuisance or annoyance). Requires substantial evidence.' },
          { step: 8, title: 'Closure Order', description: 'Court order closing the property for up to 6 months. Used for properties associated with serious criminal activity (e.g., drug dealing, county lines).' },
        ],
      },
      {
        id: 'asb-evidence',
        title: 'Evidence Management',
        icon: 'info',
        content: 'All evidence is logged against each case with date, time, source, and type. Evidence quality determines which enforcement tools are available.',
        fields: [
          { name: 'Diary Sheets', description: 'Tenant-completed logs of incidents with dates, times, descriptions. The backbone of most ASB evidence.' },
          { name: 'Witness Statements', description: 'Formal statements from neighbours, staff, or third parties. Must be signed and dated.' },
          { name: 'Professional Witness', description: 'Reports from specialist professional witnesses deployed to observe and document ASB.' },
          { name: 'CCTV / Photos', description: 'Visual evidence from security cameras, photographs, or tenant-captured images.' },
          { name: 'Police Reports', description: 'Crime reference numbers, police statements, and intelligence shared under information sharing protocols.' },
          { name: 'Environmental Health', description: 'Noise recordings, statutory nuisance assessments from the local authority.' },
        ],
      },
      {
        id: 'asb-victim',
        title: 'Victim and Witness Support',
        icon: 'alert',
        content: 'The system maintains separate records for victims and witnesses with vulnerability assessments and support plans.',
        subtopics: [
          { title: 'Victim Updates', content: 'Minimum fortnightly contact with victims as required by the ASB, Crime and Policing Act 2014. Updates are scheduled automatically and tracked to ensure compliance.' },
          { title: 'Safe Communication', content: 'Contact preferences are respected: no letters to the address (visible to perpetrator), specific phone numbers only, safe meeting locations. All staff are alerted to these requirements.' },
          { title: 'Risk Assessment', content: 'Risk assessments completed for both victim and perpetrator at case opening. Reviewed at each escalation stage. Considers: mental health, physical safety, children in household, history of violence.' },
        ],
      },
    ],
    tips: [
      'Always complete a risk assessment for both the perpetrator and the victim at case opening.',
      'Ensure diary sheets are completed by complainants to build the evidence base before escalation.',
      'Check vulnerability flags for both parties before taking enforcement action.',
      'The AI sentiment analysis can help identify escalating language patterns in reported incidents.',
      'Multi-agency meetings should be minuted and action plans shared with all attendees.',
      'Never disclose the identity of complainants to perpetrators without explicit consent.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  // ──────────────────────────────────────────────────
  // COMMUNICATIONS
  // ──────────────────────────────────────────────────
  '/communications': {
    title: 'Communications',
    description: 'Send and manage tenant communications across SMS, email, and letter channels, with template management, bulk campaigns, delivery tracking, and AI sentiment analysis.',
    topics: [
      {
        id: 'comms-channels',
        title: 'Communication Channels',
        icon: 'info',
        content: 'Three primary channels are available. Each has delivery tracking and cost implications.',
        subtopics: [
          { title: 'SMS (via GOV.UK Notify)', content: 'Best for urgent notifications, appointment reminders, and payment alerts. 160-character segments. Highest read rate (98%). Cost: ~1.6p per message.' },
          { title: 'Email (via GOV.UK Notify)', content: 'Best for formal correspondence, arrears letters, and documents with attachments. Free via GOV.UK Notify. Tracks delivery, open, and click rates.' },
          { title: 'Letters (PDF generation)', content: 'Formal correspondence generated as PDF for print and post. Required for legal notices (NOSP, court proceedings). Formatted for window envelopes. Cost varies by postal service.' },
        ],
      },
      {
        id: 'comms-sending',
        title: 'Sending a Communication',
        icon: 'steps',
        content: 'The process for sending an individual or bulk communication.',
        steps: [
          { step: 1, title: 'Select Recipients', description: 'Individual tenant, or filtered group (by estate, arrears status, tenancy type, compliance status, etc.).' },
          { step: 2, title: 'Choose Template', description: 'Select from the template library or compose a free-text message. Templates have pre-approved wording.' },
          { step: 3, title: 'Review Merge Fields', description: 'Check that personalisation fields (name, address, balance, reference) are populated correctly. Preview the final message.' },
          { step: 4, title: 'Select Channel', description: 'Choose SMS, email, or letter. System respects tenant channel preference by default but can be overridden.' },
          { step: 5, title: 'Send / Schedule', description: 'Send immediately or schedule for a future date/time. Bulk sends are queued and processed within minutes.' },
          { step: 6, title: 'Track Delivery', description: 'Monitor delivery status: Queued, Sent, Delivered, Read (email), Failed. Failed deliveries are flagged for manual follow-up.' },
        ],
      },
      {
        id: 'comms-sentiment',
        title: 'AI Sentiment Analysis',
        icon: 'info',
        content: 'Incoming communications are analysed by AI for emotional tone. This drives proactive intervention.',
        statuses: [
          { status: 'Positive', color: 'bg-emerald-500', description: 'Tenant expressing satisfaction or gratitude. No action needed.' },
          { status: 'Neutral', color: 'bg-gray-400', description: 'Factual communication without strong emotion. Normal handling.' },
          { status: 'Negative', color: 'bg-amber-500', description: 'Expressing frustration or dissatisfaction. Review within 24 hours. Complaint risk elevated.' },
          { status: 'Distressed', color: 'bg-red-500', description: 'Expressing severe distress, desperation, or language suggesting self-harm. Immediate officer attention. Safeguarding referral may be needed.' },
        ],
      },
    ],
    tips: [
      'Always check the tenant\'s preferred communication channel before sending.',
      'Use the preview function to verify merge fields before sending bulk campaigns.',
      'Negative sentiment alerts should be reviewed within 24 hours to prevent complaint escalation.',
      'Communication records are discoverable in legal proceedings — ensure all contact is professional.',
      'For bulk campaigns, send a test to yourself first to check formatting and merge fields.',
    ],
    relatedPages: [
      { label: 'Templates', path: '/communications/templates' },
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Complaints', path: '/complaints' },
    ],
  },

  // ──────────────────────────────────────────────────
  // COMMUNICATION TEMPLATES
  // ──────────────────────────────────────────────────
  '/communications/templates': {
    title: 'Communication Templates',
    description: 'Create and manage reusable templates for tenant communications. Templates ensure consistent, approved messaging across the organisation.',
    topics: [
      {
        id: 'tmpl-library',
        title: 'Template Library',
        icon: 'info',
        content: 'Pre-built templates for common housing management communications, categorised by purpose and channel.',
        subtopics: [
          { title: 'Arrears Letters', content: 'Stages 1-4 arrears correspondence following the escalation process. Each stage has specific wording and legal requirements.' },
          { title: 'Repair Notifications', content: 'Appointment confirmations, completion notifications, satisfaction survey invitations, and no-access follow-ups.' },
          { title: 'Complaint Responses', content: 'Acknowledgement, Stage 1 response, Stage 2 response, and Ombudsman referral information templates.' },
          { title: 'ASB Correspondence', content: 'Warning letters, ABC agreement documents, CPW/CPN notices, and victim update letters.' },
          { title: 'Compliance Access', content: 'Gas safety appointment, EICR appointment, access reminder, and legal access warning letters.' },
          { title: 'Void Lettings', content: 'Offer letters, viewing invitations, tenancy sign-up confirmations, and welcome packs.' },
        ],
      },
      {
        id: 'tmpl-creating',
        title: 'Creating Templates',
        icon: 'steps',
        content: 'New templates use merge fields for personalisation and require manager approval before deployment.',
        steps: [
          { step: 1, title: 'Choose Channel', description: 'Select SMS (160-char limit per segment), Email (HTML formatting), or Letter (formatted for window envelope).' },
          { step: 2, title: 'Write Content', description: 'Use the rich text editor. Insert merge fields using the sidebar: {{tenant_name}}, {{property_address}}, {{rent_balance}}, {{reference}}, etc.' },
          { step: 3, title: 'Preview', description: 'Preview with sample data to verify formatting and merge field rendering across different tenants.' },
          { step: 4, title: 'Submit for Approval', description: 'Templates must be approved by a manager before becoming available organisation-wide.' },
          { step: 5, title: 'Deploy', description: 'Approved templates appear in the template library for all authorised users.' },
        ],
      },
    ],
    tips: [
      'Keep SMS templates under 160 characters to avoid multi-segment costs.',
      'Include a reference number in every template so tenants can identify their case when responding.',
      'Review and update templates annually to reflect current policy and legislation.',
      'Test all merge fields with sample data before deploying a new template.',
    ],
    relatedPages: [
      { label: 'Communications', path: '/communications' },
      { label: 'Tenancies', path: '/tenancies' },
    ],
  },

  // ──────────────────────────────────────────────────
  // REPORTS
  // ──────────────────────────────────────────────────
  '/reports': {
    title: 'Reports',
    description: 'Generate regulatory, operational, and board-level reports from 30+ pre-built templates covering TSM, HCLIC, RSH returns, and Awaab\'s Law compliance reporting.',
    topics: [
      {
        id: 'rep-categories',
        title: 'Report Categories',
        icon: 'info',
        content: 'Reports are organised into four main categories to serve different organisational needs.',
        subtopics: [
          { title: 'Regulatory', content: 'TSM annual return, HCLIC complaint data for Housing Ombudsman, RSH IDA financial return, and Awaab\'s Law compliance report. These have mandatory submission deadlines.' },
          { title: 'Operational', content: 'Repairs SLA performance, arrears analysis, void turnaround, compliance status, ASB case resolution, and communication volumes. Used for day-to-day management.' },
          { title: 'Board', content: 'Executive summaries, KPI dashboards, risk registers, and strategic performance overviews. Typically monthly or quarterly.' },
          { title: 'Ad Hoc', content: 'Custom reports with user-defined date ranges, filters, and data selections. Export as PDF, CSV, or Excel.' },
        ],
      },
      {
        id: 'rep-tsm',
        title: 'Tenant Satisfaction Measures (TSM)',
        icon: 'info',
        content: 'TSM reports follow the HACT v3.5 methodology mandated by the RSH. 22 measures across five themes, benchmarked against sector performance.',
        subtopics: [
          { title: '5 Themes', content: 'Overall Satisfaction, Keeping Properties in Good Repair, Maintaining Building Safety, Respectful and Helpful Engagement, Effective Handling of Complaints, Responsible Neighbourhood Management.' },
          { title: 'Benchmarking', content: 'Upper quartile = better than 75% of providers. Median = middle position. Lower quartile = worse than 75%. Aim for upper quartile across all measures.' },
          { title: 'Survey Requirements', content: 'Minimum 600 responses for providers with 10,000+ homes. Postal, telephone, or online collection. HACT v3.5 question wording must be used exactly.' },
        ],
      },
      {
        id: 'rep-scheduling',
        title: 'Scheduling and Distribution',
        icon: 'steps',
        content: 'Reports can be generated on demand or scheduled for automatic generation and email distribution.',
        steps: [
          { step: 1, title: 'Select Report', description: 'Choose from the template library or create an ad hoc report.' },
          { step: 2, title: 'Set Parameters', description: 'Date range, filters (property type, team, area), and comparison period.' },
          { step: 3, title: 'Preview', description: 'View the report on screen before exporting or scheduling.' },
          { step: 4, title: 'Export / Schedule', description: 'Download immediately (PDF/CSV/Excel) or schedule for recurring generation (daily/weekly/monthly/quarterly).' },
          { step: 5, title: 'Distribution', description: 'Scheduled reports are emailed to specified recipients automatically on generation.' },
        ],
      },
    ],
    tips: [
      'Run TSM reports quarterly to track progress before the annual submission deadline.',
      'Schedule board reports to generate on the first Monday of each month.',
      'Export raw data as CSV for further analysis in Excel or BI tools.',
      'Keep archived copies of all regulatory submissions for audit purposes.',
    ],
    relatedPages: [
      { label: 'TSM Report', path: '/reports/tsm' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Compliance', path: '/compliance' },
    ],
  },

  // ──────────────────────────────────────────────────
  // TSM REPORT
  // ──────────────────────────────────────────────────
  '/reports/tsm': {
    title: 'TSM Report',
    description: 'Generate Tenant Satisfaction Measures reports following the HACT v3.5 methodology, with sector benchmarking.',
    topics: [
      {
        id: 'tsm-what',
        title: 'What are TSMs?',
        icon: 'info',
        content: 'Tenant Satisfaction Measures are 22 measures introduced by the Regulator of Social Housing. Social landlords with 1,000+ homes must collect and report annually. Results are published and benchmarked.',
        subtopics: [
          { title: 'Perception Measures (12)', content: 'Based on tenant surveys: overall satisfaction, quality of home, safety of home, repairs service, time taken for repairs, communal areas, ASB handling, complaints handling, respectful treatment, being listened to, kept informed, fair treatment.' },
          { title: 'Performance Measures (10)', content: 'Calculated from management data: Decent Homes %, gas safety %, electrical safety %, fire safety %, complaint handling time, ASB case resolution, void turnaround, and others.' },
        ],
      },
    ],
    tips: [
      'Monitor survey response rates to ensure statistical validity.',
      'Management performance measures update in real time — check monthly.',
      'Use the trend view to identify improving or declining measures over 3 years.',
    ],
    relatedPages: [
      { label: 'Reports', path: '/reports' },
      { label: 'Compliance', path: '/compliance' },
    ],
  },

  // ──────────────────────────────────────────────────
  // AI CENTRE
  // ──────────────────────────────────────────────────
  '/ai': {
    title: 'AI Centre',
    description: 'Access eight prediction models, natural language querying via Yantra, and proactive intelligence across all housing management areas.',
    topics: [
      {
        id: 'ai-models',
        title: 'Prediction Models',
        icon: 'info',
        content: 'Eight AI models analyse historical data, current conditions, and external factors to generate risk scores.',
        subtopics: [
          { title: 'Arrears Risk', content: 'Predicts probability of rent arrears. Factors: payment history, UC status, seasonal patterns, life events, employment data.' },
          { title: 'Damp & Mould Risk', content: 'Predicts damp probability per property. Factors: property type, age, previous repairs, weather data, sensor readings, EPC rating.' },
          { title: 'Complaint Probability', content: 'Predicts likelihood of formal complaint. Factors: service interactions, repair delays, communication gaps, sentiment trends.' },
          { title: 'Repair Recurrence', content: 'Predicts whether a repair will return within 12 months. Factors: repair type, age of component, previous repairs at same property.' },
          { title: 'Void Duration', content: 'Predicts expected void turnaround time. Factors: property condition, repair complexity, waiting list demand, seasonal patterns.' },
          { title: 'Tenancy Sustainment', content: 'Predicts risk of tenancy failure. Factors: arrears trajectory, vulnerability flags, complaint history, engagement level.' },
          { title: 'ASB Escalation', content: 'Predicts case severity trajectory. Factors: incident frequency, escalation speed, perpetrator history, victim vulnerability.' },
          { title: 'Disrepair Claim Risk', content: 'Predicts legal disrepair claim probability. Factors: repair delays, complaint history, damp/mould issues, communication gaps.' },
        ],
      },
      {
        id: 'ai-scores',
        title: 'Understanding Risk Scores',
        icon: 'info',
        content: 'Each model generates a score between 0-100% with a confidence level and explanation of key contributing factors.',
        statuses: [
          { status: 'Low Risk (0-30%)', color: 'bg-emerald-500', description: 'No action needed. Normal monitoring.' },
          { status: 'Medium Risk (31-60%)', color: 'bg-amber-400', description: 'Monitor more closely. Consider preventive action.' },
          { status: 'High Risk (61-85%)', color: 'bg-amber-600', description: 'Proactive intervention recommended. Flag for officer review.' },
          { status: 'Critical Risk (86-100%)', color: 'bg-red-500', description: 'Immediate action required. Escalate to manager.' },
        ],
      },
      {
        id: 'ai-yantra',
        title: 'Yantra Natural Language Assistant',
        icon: 'info',
        content: 'Ask questions in plain English and receive answers from the live dataset. Click the sparkles icon in the header to open Yantra.',
        subtopics: [
          { title: 'Example Questions', content: '"How many repairs are breaching SLA?", "Show me tenants in arrears over four weeks", "Which properties have expiring gas certificates?", "What is our current collection rate?", "List all Category 1 ASB cases".' },
          { title: 'Capabilities', content: 'Yantra can query live data, generate summaries, draft communications, suggest actions, and explain AI predictions. It cannot modify data — all changes require manual confirmation.' },
        ],
      },
      {
        id: 'ai-transparency',
        title: 'AI Transparency and Ethics',
        icon: 'alert',
        content: 'Every AI prediction includes an explanation of key factors. This supports officer decision-making and GDPR compliance.',
        subtopics: [
          { title: 'Explainability', content: 'Every score shows the top 3-5 factors. Example: "Arrears risk 82%: UC payment gap (3 weeks), previous arrears (Jan 2024), seasonal heating costs, single income household."' },
          { title: 'Human Override', content: 'AI predictions are advisory only. Officers must apply professional judgement. Scores should never be the sole basis for enforcement action.' },
          { title: 'Feedback Loop', content: 'Use the thumbs up/down icons to rate prediction accuracy. Feedback improves future model performance. Models retrain monthly.' },
          { title: 'GDPR Compliance', content: 'AI processing is documented in the Data Protection Impact Assessment. Tenants have the right to request an explanation of automated decisions under Article 22 GDPR.' },
        ],
      },
    ],
    tips: [
      'Review AI predictions daily as part of your morning workflow — early action prevents escalation.',
      'Predictions below 60% confidence should be treated as indicative rather than definitive.',
      'Use Yantra for ad hoc queries instead of building manual reports.',
      'Provide feedback on prediction accuracy using thumbs up/down to improve the models.',
      'AI predictions should supplement, not replace, professional housing management judgement.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Morning Briefing', path: '/briefing' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // ADMIN
  // ──────────────────────────────────────────────────
  '/admin': {
    title: 'Admin',
    description: 'System administration: organisation setup, user management with RBAC, teams, workflow automation, integration management, and GDPR-compliant audit logs.',
    topics: [
      {
        id: 'admin-users',
        title: 'User Management (RBAC)',
        icon: 'info',
        content: 'Users are managed through Role-Based Access Control with predefined and custom roles.',
        subtopics: [
          { title: 'System Administrator', content: 'Full access to all modules, settings, and user management. Can create/disable users, assign roles, and configure workflows.' },
          { title: 'Director', content: 'All data visible (read-only on admin settings). Strategic reporting and oversight.' },
          { title: 'Manager', content: 'Team-scoped data and actions. Can view all cases within their team and approve escalations.' },
          { title: 'Housing Officer', content: 'Caseload-scoped data and actions. Sees assigned tenancies, properties, and related cases.' },
          { title: 'Operative', content: 'Repairs module only. Mobile-optimised view with assigned jobs, completion forms, and navigation.' },
        ],
      },
      {
        id: 'admin-workflows',
        title: 'Workflow Automation',
        icon: 'steps',
        content: 'Configure automated workflows for common processes to reduce manual work and ensure consistency.',
        steps: [
          { step: 1, title: 'Define Trigger', description: 'What event starts the workflow. Examples: "arrears exceeds 4 weeks", "compliance certificate expires", "repair breaches SLA".' },
          { step: 2, title: 'Set Conditions', description: 'Additional criteria. Examples: "no active payment plan", "tenant not vulnerable", "property type is flat".' },
          { step: 3, title: 'Configure Actions', description: 'What happens: send communication, create task, escalate to manager, change case status, send notification.' },
          { step: 4, title: 'Test', description: 'Run the workflow against test data to verify it triggers correctly and produces the expected outcome.' },
          { step: 5, title: 'Deploy', description: 'Activate the workflow. Monitor initial runs for unexpected behaviour.' },
        ],
      },
      {
        id: 'admin-audit',
        title: 'Audit Logs (GDPR)',
        icon: 'alert',
        content: 'Every data access, modification, and deletion is logged. Logs are immutable and retained for 7 years.',
        fields: [
          { name: 'Who', description: 'The authenticated user who performed the action.' },
          { name: 'What', description: 'The action taken: view, create, update, delete, export.' },
          { name: 'When', description: 'Precise timestamp (UTC) of the action.' },
          { name: 'Where', description: 'IP address and device information of the session.' },
          { name: 'Record', description: 'The specific entity affected (tenant, property, repair, etc.) with before/after values for changes.' },
        ],
      },
    ],
    tips: [
      'Review user access quarterly and disable accounts for departed staff immediately.',
      'Use the principle of least privilege — only grant permissions staff actually need.',
      'Test workflow automations with sample data before deploying to production.',
      'Audit logs cannot be modified or deleted — they serve as a reliable record for regulators and legal proceedings.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  // ──────────────────────────────────────────────────
  // TENANT PORTAL
  // ──────────────────────────────────────────────────
  '/tenant-portal': {
    title: 'Tenant Portal',
    description: 'A self-service portal for tenants to view their rent account, report repairs, check communications, and manage their tenancy online.',
    topics: [
      {
        id: 'portal-overview',
        title: 'Portal Features',
        icon: 'info',
        content: 'The Tenant Portal provides a secure, mobile-responsive self-service interface that reduces call volumes and empowers tenants.',
        subtopics: [
          { title: 'Rent Account', content: 'View current balance, weekly charge, recent transactions, and payment method. Set up payment plans. View UC payment schedule.' },
          { title: 'Report Repairs', content: 'Guided form: describe issue, select room and component, upload photographs. AI suggests category. Receive reference number and track progress.' },
          { title: 'Track Repairs', content: 'View status of all reported repairs: reported, allocated, appointment booked, in progress, completed. Receive SMS updates.' },
          { title: 'Communications', content: 'Read all letters, emails, and SMS messages sent by the landlord. Download PDF copies.' },
          { title: 'Update Details', content: 'Change phone number, email address, and communication preferences. Report changes in household composition.' },
        ],
      },
      {
        id: 'portal-access',
        title: 'Accessibility',
        icon: 'info',
        content: 'The portal meets WCAG 2.1 AA accessibility standards.',
        subtopics: [
          { title: 'Screen Readers', content: 'Full ARIA labelling and semantic HTML for screen reader compatibility.' },
          { title: 'Keyboard Navigation', content: 'All features accessible via keyboard without requiring a mouse.' },
          { title: 'High Contrast', content: 'High contrast mode available for visually impaired users.' },
          { title: 'Plain English', content: 'Content written at a reading age suitable for the widest audience. Jargon avoided.' },
        ],
      },
    ],
    tips: [
      'Encourage tenants to register to reduce incoming call volumes.',
      'Repairs reported via the portal include photos, improving triage accuracy.',
      'The portal is mobile-responsive — works on any device.',
      'Portal usage data demonstrates digital service adoption for regulatory reporting.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Rent & Income', path: '/rent' },
    ],
  },

  // ──────────────────────────────────────────────────
  // SEARCH
  // ──────────────────────────────────────────────────
  '/search': {
    title: 'Search',
    description: 'Global search across tenants, properties, repairs, complaints, ASB cases, and communications with type filtering and quick actions.',
    topics: [
      {
        id: 'search-how',
        title: 'How Search Works',
        icon: 'info',
        content: 'The global search bar in the header searches across all major data types simultaneously. Results are grouped by type and ranked by relevance.',
        subtopics: [
          { title: 'Searchable Data', content: 'Tenant names, reference numbers, property addresses, UPRNs, postcodes, repair references, complaint references, ASB case references, and communication content.' },
          { title: 'Filtering', content: 'Use type filters (Tenants, Properties, Cases, Communications) to narrow results. Within each type, additional sub-filters are available.' },
          { title: 'Quick Actions', content: 'From search results: view tenant summary, check property compliance, see repair status. Click any result for the full detail page.' },
        ],
      },
    ],
    tips: [
      'Use reference numbers (TEN-001, REP-042) for the fastest exact match.',
      'Search is case-insensitive and supports partial matching.',
      'Use the keyboard shortcut Ctrl+K to open search from anywhere.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Properties', path: '/properties' },
      { label: 'Repairs', path: '/repairs' },
    ],
  },
};

/**
 * Find the best matching help content for a given route path.
 * Uses exact match first, then longest-prefix startsWith matching.
 */
export function getHelpForRoute(pathname: string): HelpPage | null {
  if (helpContent[pathname]) return helpContent[pathname];

  const sorted = Object.keys(helpContent).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) {
      return helpContent[route];
    }
  }

  return null;
}
