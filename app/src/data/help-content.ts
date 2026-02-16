export interface HelpSection {
  title: string;
  description: string;
  sections: {
    heading: string;
    content: string;
  }[];
  tips?: string[];
  relatedPages?: { label: string; path: string }[];
}

export const helpContent: Record<string, HelpSection> = {
  '/dashboard': {
    title: 'Dashboard',
    description:
      'Your executive command centre providing a real-time overview of organisational performance across all key housing management areas.',
    sections: [
      {
        heading: 'KPI Cards',
        content:
          'The top row displays nine Key Performance Indicator cards covering Properties, Tenancies, Repairs, Rent Collection, Arrears, Compliance, Complaints, Voids, and AI Alerts. Each card shows the current figure alongside a trend indicator (up/down arrow with percentage change). Click any card to navigate directly to the relevant module for deeper analysis.',
      },
      {
        heading: 'Charts and Trends',
        content:
          'The Rent Collection Trend chart tracks monthly collection rates against the 97% sector target. The Repairs by Priority chart breaks down open repairs into Emergency (24-hour response), Urgent (5 working days), Routine (20 working days), and Planned categories. Both charts update in real time as data changes.',
      },
      {
        heading: 'Big 6 Compliance Grid',
        content:
          'Displays compliance status across the six regulatory areas: Gas Safety, Electrical (EICR), Fire Risk Assessment, Asbestos, Legionella, and Lifts. Each cell shows a RAG (Red/Amber/Green) status. Green means all certificates are current. Amber means certificates are expiring within 30 days. Red means certificates have expired or are overdue.',
      },
      {
        heading: "Awaab's Law Active Cases",
        content:
          "Shows any open damp and mould cases that fall under Awaab's Law 2023. Cases display countdown timers against statutory deadlines. Emergency hazards must receive an initial response within 24 hours and a repair within 7 days. Significant hazards must be investigated within 14 days and repaired within 28 days.",
      },
      {
        heading: 'AI Insights and Recent Activity',
        content:
          'The AI Insights feed surfaces predictions and recommendations from eight machine learning models, including arrears risk, damp probability, complaint likelihood, and repair recurrence. Each insight has a confidence score and a suggested action. The Recent Activity timeline logs the latest actions taken across the system by all users.',
      },
    ],
    tips: [
      'Click any KPI card to drill down into the relevant module.',
      'The dashboard view adapts based on your persona -- a Housing Officer sees their caseload, while the COO sees the full portfolio.',
      'Use the persona switcher in the top-right to see how the dashboard appears for different roles.',
      'AI Insights with confidence scores above 85% have historically been highly accurate.',
    ],
    relatedPages: [
      { label: 'Morning Briefing', path: '/briefing' },
      { label: 'Compliance', path: '/compliance' },
      { label: 'AI Centre', path: '/ai' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/briefing': {
    title: 'Morning Briefing',
    description:
      'A daily personalised briefing tailored to your role, summarising what needs your attention today and highlighting overnight changes.',
    sections: [
      {
        heading: 'How the Briefing Works',
        content:
          'The morning briefing is generated fresh each day based on your persona and assigned caseload. It aggregates overnight events, weather forecasts, compliance deadlines, and AI predictions into a single prioritised view. The briefing adapts its content, language, and level of detail to your role.',
      },
      {
        heading: 'Weather and External Factors',
        content:
          'The weather section shows a 5-day forecast with Met Office warnings. This is operationally significant because heavy rain increases damp and mould risk, freezing conditions affect boiler breakdowns, and high winds may cause emergency repairs. Properties at elevated risk are flagged automatically.',
      },
      {
        heading: 'Urgent Items',
        content:
          'Items requiring immediate attention are displayed at the top with red indicators. These include SLA breaches, expired compliance certificates, statutory deadline warnings, emergency repairs awaiting allocation, and high-risk safeguarding flags. Each item links directly to the relevant record.',
      },
      {
        heading: 'Tasks and Predictions',
        content:
          'Your task list combines scheduled activities (inspections, visits, reviews) with AI-recommended actions. Predictions highlight tenants at risk of arrears, properties likely to develop damp issues, and repairs with high recurrence probability. Acting on predictions early can prevent escalation.',
      },
      {
        heading: 'Patch Snapshot',
        content:
          'For housing officers and team managers, the patch snapshot shows a geographical summary of your assigned area. It includes open case counts, upcoming visits, and any properties requiring urgent attention. This helps you plan your day and prioritise site visits efficiently.',
      },
    ],
    tips: [
      'Check your briefing first thing each morning before starting casework.',
      'Items marked with an AI sparkle icon are predictions -- acting on these proactively can prevent complaints.',
      'The briefing respects your persona: switch roles to see how different team members experience their day.',
      'Weather warnings automatically cross-reference against your property stock for damp risk.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'AI Centre', path: '/ai' },
    ],
  },

  '/explore': {
    title: 'Explore',
    description:
      'A geographical drill-down tool for exploring your housing stock from country level down to individual units and tenants.',
    sections: [
      {
        heading: 'Navigation Hierarchy',
        content:
          'Explore follows a top-down geographical hierarchy: Country, Region, Local Authority, Estate, Block, Unit, and Tenant. Click any level to drill down further. Use the breadcrumb trail at the top to navigate back up the hierarchy. Each level shows aggregated metrics relevant to that scope.',
      },
      {
        heading: 'Interactive Map',
        content:
          'The Leaflet map displays property markers colour-coded by status. Green markers indicate properties with no issues. Amber markers flag properties with upcoming compliance deadlines or open repairs. Red markers highlight properties with overdue compliance, emergency repairs, or active Awaab\'s Law cases. Click any marker to view the property details panel.',
      },
      {
        heading: '3D Building Visualisation',
        content:
          'At block level, a 3D visualisation shows the building with individual units. Units are colour-coded by occupancy status (occupied, void, under offer) and can be clicked to view tenancy details. This is particularly useful for understanding the composition of a block and identifying clusters of voids or issues.',
      },
      {
        heading: 'Context Panel',
        content:
          'The right-hand context panel displays metrics for the currently selected level. At estate level, this includes total units, occupancy rate, open repairs, compliance status, and average rent collection. At unit level, it shows the current tenancy, rent account balance, repair history, and compliance certificates.',
      },
    ],
    tips: [
      'Use the map zoom controls or scroll to navigate geographically.',
      'At estate level, the compliance heatmap quickly identifies buildings needing attention.',
      'The 3D view at block level is ideal for identifying void clusters that may indicate wider estate issues.',
      'Right-click a property marker for quick actions like raising a repair or scheduling an inspection.',
    ],
    relatedPages: [
      { label: 'Properties', path: '/properties' },
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Compliance', path: '/compliance' },
    ],
  },

  '/tenancies': {
    title: 'Tenancies',
    description:
      'Manage all tenancy records including tenant details, rent accounts, vulnerability flags, household composition, and communication history.',
    sections: [
      {
        heading: 'Tenant List',
        content:
          'The main view displays all tenants with key information: name, property address, tenancy type (secure, assured, starter, licence), rent balance, and status indicators. Use the search bar to find specific tenants by name, reference number, or address. Filter by tenancy type, arrears status, or vulnerability flags.',
      },
      {
        heading: 'Tenant Detail View',
        content:
          'Click any tenant to open their full record. The detail view is organised into tabs: Overview (key details and alerts), Rent Account (balance, payment history, arrears actions), Cases (repairs, complaints, ASB linked to this tenancy), Communications (letters, emails, SMS history), and Household (all household members and their details).',
      },
      {
        heading: 'Rent Account',
        content:
          'The rent account tab shows the current balance, weekly rent charge, payment method (direct debit, Universal Credit, standing order, cash), and a full transaction history. Negative balances indicate arrears. The AI arrears risk score predicts the likelihood of the tenant falling further into arrears based on payment patterns, UC status, and seasonal factors.',
      },
      {
        heading: 'Vulnerability Flags',
        content:
          'Vulnerability flags are displayed as coloured badges on tenant records. These include categories such as mental health, physical disability, learning difficulty, domestic abuse, substance misuse, hoarding, and safeguarding concerns. Flags are GDPR-sensitive and only visible to authorised staff. They drive additional safeguarding checks in workflows.',
      },
      {
        heading: 'Household Members',
        content:
          'The household tab lists all occupants including joint tenants, household members, and permitted occupiers. Each member shows their relationship to the lead tenant, date of birth, and any individual vulnerability flags. Accurate household data is essential for right-to-buy assessments, succession, and mutual exchange applications.',
      },
    ],
    tips: [
      'Use the arrears filter to quickly find tenants in significant arrears (over four weeks rent).',
      'The AI risk score updates daily -- tenants with scores above 70% should receive proactive support.',
      'Check vulnerability flags before conducting any enforcement action such as issuing a NOSP.',
      'The communication tab shows all contact across channels, giving a complete picture before tenant interactions.',
    ],
    relatedPages: [
      { label: 'Rent & Income', path: '/rent' },
      { label: 'Properties', path: '/properties' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  '/properties': {
    title: 'Properties',
    description:
      'View and manage your entire property portfolio including compliance status, repair history, damp risk assessments, and current tenancy information.',
    sections: [
      {
        heading: 'Property Portfolio View',
        content:
          'The properties list displays all units in your stock with key attributes: address, property type (house, flat, bungalow, bedsit), number of bedrooms, current tenant, and compliance status. The RAG indicator on each property reflects its overall compliance health across all six regulatory areas.',
      },
      {
        heading: 'Compliance Certificates',
        content:
          'The compliance tab on each property shows certificate status for Gas Safety (annual CP12), Electrical Installation Condition Report (EICR, 5-yearly), Fire Risk Assessment, Asbestos survey, Legionella risk assessment, and Lift servicing (where applicable). Each certificate displays its issue date, expiry date, and current status.',
      },
      {
        heading: 'Damp and Mould Risk',
        content:
          "Properties are assessed for damp and mould risk using a combination of sensor data, repair history, property archetype, and environmental factors. Risk levels are categorised as Low, Medium, High, and Critical. Properties rated High or Critical require inspection under Awaab's Law timescales. The AI model updates risk scores weekly.",
      },
      {
        heading: 'Maintenance History',
        content:
          'The maintenance history tab provides a chronological log of all repairs, planned works, and capital investment carried out on the property. This includes responsive repairs, cyclical maintenance (decorating, gutter clearance), and major works (kitchen/bathroom replacement, roofing, window renewal). Cost data is shown against each work order.',
      },
      {
        heading: 'Void and Letting Status',
        content:
          'If a property is void (empty), the detail view shows the void stage: notice period, keys received, void inspection, repair works, quality check, ready to let, under offer, or let. Void turnaround time is tracked against the organisational target. Extended voids (over 28 days) are flagged for management review.',
      },
    ],
    tips: [
      'Sort by compliance status to quickly identify properties with expired or expiring certificates.',
      'The damp risk score is predictive -- a rising score warrants a proactive inspection even if no repair has been reported.',
      'Use the property archetype filter to identify systemic issues (e.g., all 1960s system-built flats).',
      'Export property data for asset management reporting using the download button.',
    ],
    relatedPages: [
      { label: 'Compliance', path: '/compliance' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Explore', path: '/explore' },
      { label: 'Allocations', path: '/allocations' },
    ],
  },

  '/repairs': {
    title: 'Repairs',
    description:
      'Manage the repairs backlog including priority categorisation, SLA tracking, contractor allocation, and Awaab\'s Law compliance monitoring.',
    sections: [
      {
        heading: 'Repairs Backlog',
        content:
          'The main view lists all open repairs sorted by priority. Each repair shows its reference number, property address, reported date, priority level, assigned contractor, and SLA status. The backlog can be filtered by priority (Emergency, Urgent, Routine, Planned), trade (plumbing, electrical, joinery, roofing, etc.), SLA status, and date range.',
      },
      {
        heading: 'Priority Levels and SLA',
        content:
          'Repairs are categorised into four priority levels with corresponding SLA targets. Emergency (24 hours): danger to life, total loss of heating/hot water, major water leak, security breach. Urgent (5 working days): partial loss of facility, significant but not dangerous issues. Routine (20 working days): minor repairs, cosmetic issues. Planned: scheduled improvements or replacements.',
      },
      {
        heading: 'SLA Status Indicators',
        content:
          'Each repair displays an SLA status: On Track (green, within target), At Risk (amber, approaching deadline), Breached (red, past target date). Breached SLAs are escalated automatically and appear on the dashboard. The SLA countdown timer shows exact days and hours remaining for active repairs.',
      },
      {
        heading: "Awaab's Law Flagging",
        content:
          "Repairs involving damp, mould, or condensation are automatically flagged as potential Awaab's Law cases. These repairs have additional statutory timescales: emergency hazards must be assessed within 24 hours, significant hazards within 14 days. Repair deadlines are 7 days for emergencies and 28 days for significant hazards. The system tracks these deadlines independently of standard SLAs.",
      },
      {
        heading: 'Contractor Information',
        content:
          'Each repair record shows the assigned contractor, their contact details, and appointment date/time if scheduled. The system tracks contractor performance metrics including average completion time, first-time fix rate, and tenant satisfaction scores. This data informs future contractor allocation decisions.',
      },
    ],
    tips: [
      'Use the "Breached" filter to immediately see all SLA-breached repairs requiring escalation.',
      "Repairs flagged with the Awaab's Law icon have separate statutory deadlines -- check both the standard SLA and the Awaab's Law timer.",
      'The AI recurrence predictor flags repairs likely to return within 12 months, suggesting a more comprehensive repair or capital investment.',
      'Right-click a repair for quick actions: reassign contractor, update status, send tenant notification.',
    ],
    relatedPages: [
      { label: "Awaab's Law", path: '/compliance/awaabs-law' },
      { label: 'Properties', path: '/properties' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/rent': {
    title: 'Rent & Income',
    description:
      'Track rent collection performance, manage arrears cases, view tenant statements, and monitor payment patterns across your portfolio.',
    sections: [
      {
        heading: 'Collection Performance',
        content:
          'The headline figure shows current rent collection rate against the 97% sector target. The trend chart displays weekly and monthly collection rates over the past 12 months. Collection is calculated as total rent received divided by total rent due (debit). The dashboard breaks this down by payment method, team, patch, and property type.',
      },
      {
        heading: 'Arrears Management',
        content:
          'The arrears section lists all tenants with outstanding balances, sorted by severity. Arrears are categorised as: Mild (1-2 weeks), Moderate (3-4 weeks), Serious (5-8 weeks), and Critical (8+ weeks or NOSP stage). Each case shows the current balance, weekly charge, payment agreement status, and the AI-predicted trajectory.',
      },
      {
        heading: 'Tenant Statements',
        content:
          'Click any tenant to view their full rent statement showing all debits (rent charges, service charges, court costs) and credits (payments, Housing Benefit, Universal Credit housing element). Statements can be filtered by date range and exported as PDF for correspondence or court proceedings.',
      },
      {
        heading: 'Payment History',
        content:
          'The payment history tab shows individual transactions with dates, amounts, payment methods, and references. Patterns are highlighted by the AI: irregular payments, declining amounts, missed direct debits, and UC payment gaps. These patterns feed into the arrears risk prediction model.',
      },
      {
        heading: 'Universal Credit Impact',
        content:
          'Tenants receiving Universal Credit are flagged with a UC indicator. The system tracks UC payment cycles, managed payment requests (APA -- Alternative Payment Arrangements), and the transition from legacy benefits. UC tenants statistically have higher arrears rates, and the system adjusts risk scores accordingly.',
      },
    ],
    tips: [
      'Focus arrears intervention on tenants in the "Moderate" category to prevent escalation to "Serious".',
      'The AI arrears predictor can identify tenants likely to fall into arrears before it happens -- use this for early intervention.',
      'Check UC payment dates when planning arrears calls, as tenants may be between payment cycles.',
      'Export statements before any legal action to ensure you have a complete and accurate record.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Reports', path: '/reports' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  '/compliance': {
    title: 'Compliance',
    description:
      'Monitor and manage regulatory compliance across the Big 6 safety areas: Gas, Electrical, Fire, Asbestos, Legionella, and Lifts.',
    sections: [
      {
        heading: 'Big 6 Overview',
        content:
          'The compliance dashboard provides a summary across all six regulatory areas. Each area shows the total number of properties requiring certification, the number currently compliant, those expiring within 30 days, and those overdue. The overall compliance percentage is displayed prominently with a RAG status.',
      },
      {
        heading: 'Gas Safety (CP12)',
        content:
          'All properties with gas installations require an annual Landlord Gas Safety Record (CP12) from a Gas Safe registered engineer. The system tracks certificate dates and flags properties approaching their 12-month anniversary. It is a criminal offence to let a property without a valid CP12. Access refusals are tracked with an escalation workflow.',
      },
      {
        heading: 'Electrical (EICR)',
        content:
          'Electrical Installation Condition Reports are required at least every 5 years under the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020 (extended to social housing). The system tracks EICR dates, categories of deficiency (C1 danger present, C2 potentially dangerous, C3 improvement recommended, FI further investigation), and remedial work completion.',
      },
      {
        heading: 'Fire Risk Assessment',
        content:
          'Fire Risk Assessments are required under the Regulatory Reform (Fire Safety) Order 2005 and must be reviewed regularly. Higher-risk buildings (over 18m, with cladding, or sheltered housing) require more frequent assessments. The system tracks assessment dates, action items arising, and completion of remedial works.',
      },
      {
        heading: 'Asbestos, Legionella, and Lifts',
        content:
          'Asbestos management surveys identify the presence, location, and condition of asbestos-containing materials. Re-inspections are due annually or when condition changes. Legionella risk assessments are required for all water systems, with monitoring schedules for higher-risk properties. Lift installations require LOLER (Lifting Operations and Lifting Equipment Regulations) inspections every 6 months.',
      },
    ],
    tips: [
      'Properties showing red on any compliance area should be treated as the highest priority.',
      'Set up automated notifications 60 days before certificate expiry to allow time for access and scheduling.',
      'Track access refusals carefully -- three failed attempts may justify legal access under certain tenancy agreements.',
      'Use the compliance export for your annual RSH return and board reporting.',
    ],
    relatedPages: [
      { label: "Awaab's Law", path: '/compliance/awaabs-law' },
      { label: 'Properties', path: '/properties' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/compliance/awaabs-law': {
    title: "Awaab's Law",
    description:
      "Track damp and mould cases against statutory deadlines set by Awaab's Law 2023, with countdown timers and escalation workflows.",
    sections: [
      {
        heading: "What is Awaab's Law?",
        content:
          "Awaab's Law, introduced in 2023 following the death of Awaab Ishak from prolonged exposure to mould in his home, sets fixed timescales for social landlords to address hazards including damp and mould. The law amends the Social Housing (Regulation) Act 2023 and imposes statutory duties with specific response deadlines.",
      },
      {
        heading: 'Hazard Categories',
        content:
          'Cases are classified into two categories. Emergency Hazards are those posing an imminent risk to health and safety, requiring an initial response within 24 hours and repair completion within 7 calendar days. Significant Hazards are serious but not immediately dangerous, requiring investigation within 14 calendar days and repair completion within 28 calendar days.',
      },
      {
        heading: 'Countdown Timers',
        content:
          'Each active case displays countdown timers showing time remaining against statutory deadlines. Timers change colour as deadlines approach: green (on track), amber (less than 25% of time remaining), red (breached). Breached deadlines are reportable to the Regulator of Social Housing (RSH) and may trigger regulatory intervention.',
      },
      {
        heading: 'Case Workflow',
        content:
          'The typical workflow for an Awaab\'s Law case is: Report received, Hazard assessed and categorised, Investigation scheduled, Inspection conducted, Remedial works raised, Works completed, Follow-up inspection, and Case closed. Each stage is timestamped, creating an auditable record for regulatory reporting.',
      },
      {
        heading: 'Regulatory Reporting',
        content:
          "All Awaab's Law cases feed into the organisation's regulatory reporting. The RSH may request information on response times, breach rates, and outcomes. The Reports module includes pre-built Awaab's Law reports that summarise performance against statutory deadlines for board and regulator submissions.",
      },
    ],
    tips: [
      'Treat any report of damp, mould, or condensation as a potential Awaab\'s Law case until assessment proves otherwise.',
      'The 24-hour emergency response clock starts from the moment the report is received, not when it is triaged.',
      'Document every action with timestamps -- the audit trail is your evidence of compliance.',
      'Use the AI damp risk model to proactively identify properties before tenants report issues.',
    ],
    relatedPages: [
      { label: 'Compliance', path: '/compliance' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Properties', path: '/properties' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/complaints': {
    title: 'Complaints',
    description:
      'Manage complaints in line with the Housing Ombudsman Complaint Handling Code, tracking cases through Stage 1 and Stage 2 with learning actions.',
    sections: [
      {
        heading: 'Complaint Handling Code',
        content:
          'All complaints are managed in accordance with the Housing Ombudsman Complaint Handling Code (2024 revision). The Code mandates a two-stage process: Stage 1 (10 working days for response, extendable to 20 with agreement) and Stage 2 (20 working days for response, extendable to 40 in exceptional circumstances). The system enforces these timescales automatically.',
      },
      {
        heading: 'Case Management',
        content:
          'Each complaint record captures: the complainant details, category (repairs, ASB, staff conduct, service failure, communication), the nature of the complaint, desired outcome, investigation notes, and the formal response. Cases move through stages: Received, Acknowledged (within 5 working days), Investigation, Response Drafted, Response Sent, and either Resolved or Escalated.',
      },
      {
        heading: 'Stage 1 and Stage 2',
        content:
          'Stage 1 complaints are investigated and responded to by a manager not involved in the original issue. If the complainant is dissatisfied with the Stage 1 response, they can request escalation to Stage 2, which must be handled by a more senior manager or panel. Stage 2 is the final stage of the internal process before the Housing Ombudsman.',
      },
      {
        heading: 'Housing Ombudsman Tracking',
        content:
          'Cases referred to the Housing Ombudsman are tracked separately with their own reference numbers and timescales. The system logs Ombudsman determinations (maladministration, service failure, no maladministration) and any compensation orders. This data feeds into the annual self-assessment against the Complaint Handling Code.',
      },
      {
        heading: 'Learning Actions',
        content:
          'Every closed complaint generates a learning action: what went wrong, what systemic change is needed, and who is responsible for implementing it. Learning actions are tracked to completion and reviewed by senior management. Patterns across complaints (e.g., repeated issues with a specific contractor) are surfaced by the AI.',
      },
    ],
    tips: [
      'Acknowledge every complaint within 5 working days, even if the investigation will take longer.',
      'The complaint risk predictor identifies tenants likely to escalate -- proactive contact can often resolve issues before a formal complaint.',
      'Always check if a repair-related complaint should also trigger an Awaab\'s Law assessment.',
      'Review learning actions monthly to identify systemic improvements across the organisation.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Reports', path: '/reports' },
      { label: 'ASB', path: '/asb' },
    ],
  },

  '/allocations': {
    title: 'Allocations',
    description:
      'Manage void properties through the lettings process, from tenancy termination to new tenancy commencement, with waiting list and void monitoring.',
    sections: [
      {
        heading: 'Void Pipeline',
        content:
          'The void pipeline shows all empty properties progressing through the lettings stages: Notice Period (tenant has given notice), Keys Received (property handed back), Void Inspection (condition assessment), Repair Works (making good), Quality Check (inspection of completed works), Ready to Let (available for allocation), Under Offer (applicant identified), and Let (new tenancy signed).',
      },
      {
        heading: 'Void Monitoring',
        content:
          'Each void property displays its total void duration, current stage duration, and estimated re-let date. The organisational target for void turnaround is typically 20-28 calendar days. Properties exceeding the target are flagged amber; those exceeding double the target are flagged red. Extended voids incur significant rent loss and are reported to the board.',
      },
      {
        heading: 'Allocation Waiting List',
        content:
          'The waiting list shows applicants registered for housing, their priority band (Emergency, Band A, Band B, Band C), property requirements (bedrooms, accessibility, location preferences), and waiting time. Allocations follow the published allocation policy, which may prioritise based on housing need, local connection, or transfer requirements.',
      },
      {
        heading: 'Matching and Offers',
        content:
          'When a property reaches "Ready to Let" status, the system suggests matching applicants based on property size, accessibility, location, and applicant priority. Housing officers can review the shortlist, verify eligibility, and make a formal offer. The offer process is auditable for fairness and policy compliance.',
      },
      {
        heading: 'Void Cost Tracking',
        content:
          'Every void property tracks associated costs: rent loss (weekly charge multiplied by void days), repair works, and any capital improvements carried out during the void period. This data feeds into the void management KPI reported to the board and RSH via the annual return.',
      },
    ],
    tips: [
      'Prioritise void inspections within 48 hours of keys received to minimise turnaround time.',
      'The estimated re-let date factors in repair complexity -- flag properties needing major works early.',
      'Use the waiting list match score to shortlist suitable applicants before the property is fully ready.',
      'Track void loss weekly and escalate any property void for more than 28 days.',
    ],
    relatedPages: [
      { label: 'Properties', path: '/properties' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Tenancies', path: '/tenancies' },
    ],
  },

  '/asb': {
    title: 'Anti-Social Behaviour',
    description:
      'Manage ASB cases with severity categorisation, escalation stages, evidence tracking, and multi-agency coordination.',
    sections: [
      {
        heading: 'ASB Case Categories',
        content:
          'Cases are categorised by severity. Category 1 (High): violence or threats of violence, hate crime, serious criminal activity, drug dealing. Category 2 (Medium): persistent noise nuisance, harassment, vandalism, alcohol-related disorder. Category 3 (Low): minor nuisance, lifestyle differences, occasional disturbances. Category determines response timescales and escalation thresholds.',
      },
      {
        heading: 'Escalation Stages',
        content:
          'ASB cases follow a progressive escalation pathway: Verbal Warning, Written Warning, Acceptable Behaviour Contract (ABC), Community Protection Warning (CPW), Community Protection Notice (CPN), Injunction, Possession Proceedings, and Closure Order. Each escalation stage requires documented evidence and, in most cases, a review with a senior officer.',
      },
      {
        heading: 'Evidence Tracking',
        content:
          'All evidence is logged against each case with date, time, source, and type (diary sheets, witness statements, photographs, CCTV, police reports, professional witness reports). The evidence timeline provides a chronological view. Evidence quality and quantity are assessed against the threshold required for each enforcement action.',
      },
      {
        heading: 'Multi-Agency Working',
        content:
          'Serious ASB cases often involve partnership working with the Police, Environmental Health, Social Services, and other agencies. The system supports case conferences, action plans shared across agencies, and information sharing protocols compliant with GDPR. Multi-agency actions are tracked alongside housing management actions.',
      },
      {
        heading: 'Victim and Witness Support',
        content:
          'The system maintains separate records for victims and witnesses, with vulnerability assessments and support plans. Contact preferences (e.g., no letters to the address) are respected across all communications. Victim updates are scheduled automatically at minimum fortnightly intervals as required by the ASB, Crime and Policing Act 2014.',
      },
    ],
    tips: [
      'Always complete a risk assessment for both the perpetrator and the victim at case opening.',
      'Ensure diary sheets are completed by complainants to build the evidence base before escalation.',
      'Check vulnerability flags for both parties before taking enforcement action.',
      'The AI sentiment analysis can help identify escalating language patterns in reported incidents.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Complaints', path: '/complaints' },
      { label: 'Communications', path: '/communications' },
    ],
  },

  '/communications': {
    title: 'Communications',
    description:
      'Send and manage tenant communications across SMS, email, and letter channels, with template management, bulk campaigns, and sentiment analysis.',
    sections: [
      {
        heading: 'Communication Channels',
        content:
          'The system supports three primary communication channels: SMS (via GOV.UK Notify), Email (via GOV.UK Notify or SMTP), and Letters (generated as PDF for print and post). Each channel has delivery tracking showing sent, delivered, read, and failed statuses. Channel preference is recorded per tenant and respected automatically.',
      },
      {
        heading: 'Bulk Campaigns',
        content:
          'Bulk communications can be sent to groups of tenants filtered by property, estate, region, tenancy type, arrears status, or custom criteria. Campaigns support personalisation using merge fields (tenant name, property address, rent balance, etc.). Each campaign tracks delivery statistics and response rates.',
      },
      {
        heading: 'GOV.UK Notify Integration',
        content:
          'SMS and email communications are delivered through GOV.UK Notify, a government-approved messaging platform. This ensures high delivery rates, GDPR compliance, and cost-effective messaging. Notify provides delivery receipts and supports both one-off and bulk sends.',
      },
      {
        heading: 'Sentiment Analysis',
        content:
          'Incoming communications (emails, logged phone calls) are analysed by the AI for sentiment: positive, neutral, negative, or distressed. Distressed communications are flagged immediately to the housing officer. Negative sentiment trends across a tenancy can predict complaint risk and trigger proactive outreach.',
      },
      {
        heading: 'Communication History',
        content:
          'Every communication sent or received is logged against the tenant record, creating a complete contact history. This includes automated notifications (rent reminders, appointment confirmations) and manual correspondence. The history is searchable, filterable by channel, and exportable for Subject Access Requests (SARs).',
      },
    ],
    tips: [
      'Always check the tenant\'s preferred communication channel before sending.',
      'Use the preview function to verify merge fields before sending bulk campaigns.',
      'Negative sentiment alerts should be reviewed within 24 hours.',
      'Communication records are discoverable in legal proceedings -- ensure all contact is professional and appropriate.',
    ],
    relatedPages: [
      { label: 'Communication Templates', path: '/communications/templates' },
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Complaints', path: '/complaints' },
    ],
  },

  '/communications/templates': {
    title: 'Communication Templates',
    description:
      'Create and manage reusable templates for tenant communications across email, SMS, and letter channels.',
    sections: [
      {
        heading: 'Template Library',
        content:
          'The template library contains pre-built templates for common housing management communications: rent arrears letters (stages 1-4), repair appointment confirmations, complaint acknowledgements, ASB warnings, void property offers, and compliance access request letters. Each template is categorised by purpose and channel.',
      },
      {
        heading: 'Creating Templates',
        content:
          'New templates can be created using the rich text editor. Templates support merge fields enclosed in double curly brackets (e.g., {{tenant_name}}, {{property_address}}, {{rent_balance}}). Available merge fields are listed in the sidebar. Templates must be approved by a manager before they become available for use across the organisation.',
      },
      {
        heading: 'Template Versioning',
        content:
          'Templates are version-controlled, meaning edits create a new version while preserving the original. This is important for legal compliance -- you can always demonstrate which version of a letter was sent at any point in time. Previous versions can be viewed but not modified.',
      },
      {
        heading: 'Channel-Specific Formatting',
        content:
          'SMS templates have a 160-character limit per segment (longer messages are split). Email templates support HTML formatting including headers, paragraphs, links, and organisation branding. Letter templates include letterhead, address blocks, reference numbers, and are formatted for window envelopes.',
      },
    ],
    tips: [
      'Keep SMS templates concise -- each 160-character segment incurs a cost.',
      'Test all merge fields with sample data before deploying a new template.',
      'Include a reference number in every template to help tenants identify their case when responding.',
      'Review and update templates annually to ensure they reflect current policy and legislation.',
    ],
    relatedPages: [
      { label: 'Communications', path: '/communications' },
      { label: 'Tenancies', path: '/tenancies' },
    ],
  },

  '/reports': {
    title: 'Reports',
    description:
      'Generate and export regulatory, operational, and board-level reports from over 30 pre-built templates covering TSM, HCLIC, RSH, and Awaab\'s Law.',
    sections: [
      {
        heading: 'Report Categories',
        content:
          'Reports are organised into categories: Regulatory (TSM, HCLIC, RSH IDA submissions), Operational (repairs performance, arrears analysis, void turnaround, compliance status), Board (executive summaries, KPI dashboards, risk registers), and Ad Hoc (custom date ranges and filters). Each report can be previewed on screen, exported as PDF, or downloaded as CSV/Excel.',
      },
      {
        heading: 'Tenant Satisfaction Measures (TSM)',
        content:
          'TSM reports follow the HACT v3.5 methodology mandated by the RSH. They cover 22 measures across five themes: Overall Satisfaction, Keeping Properties in Good Repair, Maintaining Building Safety, Respectful and Helpful Engagement, Effective Handling of Complaints, and Responsible Neighbourhood Management. Results are benchmarked against sector median and quartile positions.',
      },
      {
        heading: 'HCLIC and RSH Returns',
        content:
          'The Housing Complaints and Learning Information Centre (HCLIC) report summarises complaint volumes, categories, outcomes, and learning actions for submission to the Housing Ombudsman. The RSH Intelligence and Data Analysis (IDA) return includes financial, governance, and viability data. Both reports are generated automatically from system data.',
      },
      {
        heading: "Awaab's Law Reports",
        content:
          "Dedicated reports track performance against Awaab's Law statutory deadlines. These include: total cases, cases within timescale, breaches by category (emergency/significant), average response times, and remedial action completion rates. These reports are essential for demonstrating compliance to the RSH.",
      },
      {
        heading: 'Scheduling and Distribution',
        content:
          'Reports can be scheduled for automatic generation (daily, weekly, monthly, quarterly) and distributed via email to specified recipients. Board reports are typically generated monthly. Regulatory returns are generated according to submission deadlines. Scheduled reports use the latest data at the time of generation.',
      },
    ],
    tips: [
      'Run TSM reports quarterly to track progress before the annual submission deadline.',
      "Use the comparison view to benchmark your performance against sector quartiles.",
      'Schedule board reports to generate automatically on the first Monday of each month.',
      'Export raw data as CSV for further analysis in Excel or business intelligence tools.',
    ],
    relatedPages: [
      { label: 'TSM Report', path: '/reports/tsm' },
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Compliance', path: '/compliance' },
    ],
  },

  '/reports/tsm': {
    title: 'TSM Report',
    description:
      'Generate Tenant Satisfaction Measures reports following the HACT v3.5 methodology, with benchmarking against sector median and quartile positions.',
    sections: [
      {
        heading: 'What are TSMs?',
        content:
          'Tenant Satisfaction Measures (TSMs) are a set of 22 tenant satisfaction and landlord performance measures introduced by the Regulator of Social Housing. Social landlords with 1,000+ homes must collect and report TSMs annually. The measures combine tenant perception survey results with management performance data.',
      },
      {
        heading: 'Survey Methodology',
        content:
          'Tenant perception surveys must follow the HACT v3.5 methodology to ensure consistency across the sector. This specifies sample sizes (minimum 600 for landlords with 10,000+ homes), question wording, response scales, and data collection methods (postal, telephone, online). The system generates survey instruments and tracks response rates.',
      },
      {
        heading: 'Benchmarking',
        content:
          'TSM results are benchmarked against sector performance using median and quartile positions. Upper quartile indicates performance better than 75% of providers. Median is the middle point. Lower quartile indicates performance below 75% of providers. Benchmarking data is provided by the RSH following annual submissions.',
      },
      {
        heading: 'Performance Measures',
        content:
          'Management performance measures (not survey-based) include: homes meeting the Decent Homes Standard, gas and electrical safety compliance rates, fire risk assessment completion, complaint handling timeliness, and ASB case resolution. These are calculated automatically from system data.',
      },
      {
        heading: 'Submission and Publication',
        content:
          'TSM results must be submitted annually to the RSH and are published for tenants and the public. The system generates the submission file in the required format. Published results allow tenants to compare their landlord\'s performance against others in the sector.',
      },
    ],
    tips: [
      'Aim for upper quartile performance across all measures to demonstrate sector-leading service.',
      'Monitor survey response rates to ensure statistical validity.',
      'Management performance measures update in real time -- check them monthly rather than waiting for the annual submission.',
      'Use the trend view to identify improving or declining measures over the past 3 years.',
    ],
    relatedPages: [
      { label: 'Reports', path: '/reports' },
      { label: 'Compliance', path: '/compliance' },
      { label: 'Complaints', path: '/complaints' },
    ],
  },

  '/ai': {
    title: 'AI Centre',
    description:
      'Access the AI insights hub with eight prediction models, natural language querying, and proactive intelligence across all housing management areas.',
    sections: [
      {
        heading: 'Prediction Models',
        content:
          'The AI Centre provides access to eight prediction models: Arrears Risk (predicts likelihood of rent arrears), Damp & Mould Risk (predicts property damp probability), Complaint Probability (predicts complaint likelihood based on service interactions), Repair Recurrence (predicts whether a repair will return within 12 months), Void Duration (predicts expected void turnaround), Tenancy Sustainment (predicts tenancy failure risk), ASB Escalation (predicts case severity trajectory), and Disrepair Claim Risk (predicts legal disrepair claim probability).',
      },
      {
        heading: 'How Predictions Work',
        content:
          'Each model analyses historical data, current conditions, and external factors to generate a risk score between 0-100%. Scores above 70% are flagged as high risk. Models retrain monthly using the latest data. Prediction accuracy is tracked and displayed alongside each score, typically ranging from 78-92% depending on the model.',
      },
      {
        heading: 'Natural Language Assistant',
        content:
          'The Yantra natural language assistant allows you to ask questions in plain English. Examples: "How many repairs are breaching SLA?", "Show me tenants in arrears over four weeks", "Which properties have expiring gas certificates?". The assistant queries the live dataset and returns answers with supporting data.',
      },
      {
        heading: 'Proactive Insights',
        content:
          'The AI generates proactive insights that appear across the system: on the dashboard, in the morning briefing, on individual tenant and property records, and in the Yantra Assist panel. Insights include recommendations for action, such as "Contact Mrs Patel regarding potential arrears -- UC payment due date has changed".',
      },
      {
        heading: 'AI Transparency',
        content:
          'Every AI prediction includes an explanation of the key factors driving the score. For example, an arrears risk score of 82% might list: "UC payment gap detected (3 weeks), previous arrears episode (Jan 2024), seasonal pattern (winter heating costs)". This transparency supports officer decision-making and GDPR compliance.',
      },
    ],
    tips: [
      'Review AI predictions daily as part of your morning workflow -- early action prevents escalation.',
      'Predictions with a confidence score below 60% should be treated as indicative rather than definitive.',
      'Use the natural language assistant for ad hoc queries instead of building manual reports.',
      'Provide feedback on prediction accuracy using the thumbs up/down icons to improve future model performance.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Morning Briefing', path: '/briefing' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/admin': {
    title: 'Admin',
    description:
      'System administration including organisation setup, user management with role-based access control, teams, workflows, integrations, and GDPR-compliant audit logs.',
    sections: [
      {
        heading: 'Organisation Setup',
        content:
          'Configure your organisation profile including name, registered address, RSH registration number, stock profile, and branding (logo, colours). Organisation settings affect report headers, communication templates, and regulatory submissions. Multi-entity setups (e.g., group structures) can be configured to share data across subsidiaries.',
      },
      {
        heading: 'User Management (RBAC)',
        content:
          'Users are managed through Role-Based Access Control. Predefined roles include: System Administrator (full access), Director (all data, read-only on admin), Manager (team-scoped data and actions), Housing Officer (caseload-scoped data and actions), and Operative (repairs module only). Custom roles can be created with granular permissions across each module.',
      },
      {
        heading: 'Teams and Patches',
        content:
          'Organise staff into teams (e.g., North Patch, South Patch, Income Team, Repairs Team) and assign geographic patches or functional responsibilities. Team membership drives what data each user sees and which cases appear on their dashboard and briefing. Managers can view across their team; directors can view across all teams.',
      },
      {
        heading: 'Workflow Automation',
        content:
          'Configure automated workflows for common processes: arrears escalation stages, complaint acknowledgement, repair SLA reminders, compliance expiry notifications, and void stage progression. Each workflow defines triggers (e.g., "arrears exceeds 4 weeks"), conditions (e.g., "no active payment plan"), and actions (e.g., "send Stage 2 letter, create task for officer").',
      },
      {
        heading: 'Audit Logs (GDPR)',
        content:
          'Every data access, modification, and deletion is logged in the immutable audit trail. Logs capture: who, what, when, and from where (IP address). Audit logs support GDPR compliance for Subject Access Requests (SARs), data breach investigations, and regulatory inspections. Logs are retained for 7 years in accordance with data retention policy.',
      },
    ],
    tips: [
      'Review user access quarterly and disable accounts for departed staff immediately.',
      'Use the principle of least privilege -- only grant permissions staff actually need.',
      'Test workflow automations in a sandbox environment before deploying to production.',
      'Audit logs cannot be modified or deleted, ensuring they serve as a reliable record for regulators.',
    ],
    relatedPages: [
      { label: 'Dashboard', path: '/dashboard' },
      { label: 'Reports', path: '/reports' },
    ],
  },

  '/tenant-portal': {
    title: 'Tenant Portal',
    description:
      'A self-service portal for tenants to view their rent account, report repairs, check communications, and manage their tenancy online.',
    sections: [
      {
        heading: 'Portal Overview',
        content:
          'The Tenant Portal provides a secure, self-service interface for tenants. Once logged in, tenants can view their rent account balance and payment history, report new repairs with photos, track the progress of existing repairs, view communications from their landlord, and update their contact details. The portal reduces call volumes and empowers tenants.',
      },
      {
        heading: 'Viewing Rent Account',
        content:
          'Tenants can see their current rent balance, weekly charge, recent transactions, and payment method. If in arrears, the portal displays a clear explanation and offers options to set up a payment plan or contact the income team. Tenants on Universal Credit can view their UC payment schedule.',
      },
      {
        heading: 'Reporting Repairs',
        content:
          'The repair reporting form guides tenants through describing the issue, selecting the affected room and component, and uploading photographs. The AI assists by suggesting the repair category based on the description. Tenants receive a reference number and can track progress through to completion.',
      },
      {
        heading: 'Viewing Communications',
        content:
          'All letters, emails, and SMS messages sent by the landlord are available in the communications section. Tenants can read messages, download PDF copies of letters, and respond to queries. This reduces disputes about whether correspondence was received.',
      },
      {
        heading: 'Accessibility',
        content:
          'The portal meets WCAG 2.1 AA accessibility standards. It supports screen readers, keyboard navigation, high contrast mode, and text resizing. Content is written in plain English at a reading age suitable for the widest audience. Multi-language support is available for the most common community languages.',
      },
    ],
    tips: [
      'Encourage tenants to register for the portal to reduce incoming call volumes.',
      'Repairs reported via the portal include photos, which helps with triage and scheduling.',
      'The portal is mobile-responsive, allowing tenants to access services from any device.',
      'Portal usage data can be used to demonstrate digital service adoption for regulatory reporting.',
    ],
    relatedPages: [
      { label: 'Tenancies', path: '/tenancies' },
      { label: 'Repairs', path: '/repairs' },
      { label: 'Rent & Income', path: '/rent' },
    ],
  },

  '/search': {
    title: 'Search',
    description:
      'Global search results across tenants, properties, cases, repairs, and communications, with filters to narrow results by type.',
    sections: [
      {
        heading: 'How Search Works',
        content:
          'The global search bar in the header searches across all major data types simultaneously: tenant names and references, property addresses, repair references, complaint references, ASB case references, and communication content. Results are grouped by type and ranked by relevance.',
      },
      {
        heading: 'Filtering Results',
        content:
          'Use the type filters (Tenants, Properties, Cases, Communications) to narrow results to a specific category. Within each category, additional filters are available: for example, filtering tenants by arrears status, or repairs by priority level. Combining search terms with filters provides precise results.',
      },
      {
        heading: 'Quick Actions',
        content:
          'From the search results, you can perform quick actions without opening the full record: view a tenant summary, check a property\'s compliance status, or see a repair\'s current stage. Click any result to navigate to its full detail page.',
      },
    ],
    tips: [
      'Use reference numbers (e.g., TEN-001, REP-042) for the fastest exact match.',
      'Search is case-insensitive and supports partial matches.',
      'Recent searches are remembered for quick re-access.',
      'You can search directly from the keyboard shortcut Ctrl+K.',
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
 * Uses startsWith matching to handle parameterised routes
 * (e.g. /tenancies/ten-001 matches /tenancies).
 */
export function getHelpForRoute(pathname: string): HelpSection | null {
  // Exact match first
  if (helpContent[pathname]) return helpContent[pathname];

  // Try progressively shorter prefixes (handles /compliance/awaabs-law before /compliance)
  const sorted = Object.keys(helpContent).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route)) {
      return helpContent[route];
    }
  }

  return null;
}
