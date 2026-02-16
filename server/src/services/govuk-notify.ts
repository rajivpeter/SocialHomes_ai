// ============================================================
// SocialHomes.Ai — GOV.UK Notify Template Library
// Comprehensive template library for social housing communications
// Uses GOV.UK Notify personalisation syntax: ((field_name))
// ============================================================

/**
 * Template category types covering all major housing communication areas.
 */
export type TemplateCategory =
  | 'rent-arrears'
  | 'repairs'
  | 'asb'
  | 'compliance'
  | 'tenancy'
  | 'damp-mould'
  | 'general';

/**
 * A GOV.UK Notify-formatted template for housing communications.
 */
export interface NotifyTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  subject: string;
  body: string;
  personalisationFields: string[];
}

// ============================================================
// Template Definitions
// ============================================================

const templates: NotifyTemplate[] = [
  // ----------------------------------------------------------------
  // RENT ARREARS
  // ----------------------------------------------------------------
  {
    id: 'rent-arrears-gentle-reminder',
    name: 'Rent Arrears — Gentle Reminder',
    category: 'rent-arrears',
    subject: 'Your rent account — a friendly reminder',
    body: `Dear ((tenant_name)),

We hope this letter finds you well. We are writing to let you know that your rent account at ((property_address)) currently shows an outstanding balance of £((arrears_amount)).

We understand that managing household finances can sometimes be challenging, and we want to ensure you are aware of this balance so that it does not grow further.

If you have already made a payment that has not yet been reflected on your account, please disregard this letter. Otherwise, we would be grateful if you could arrange payment at your earliest convenience.

If you are experiencing any financial difficulties, please do not hesitate to contact your Housing Officer, ((officer_name)), on ((officer_phone)). We have a range of support services available, including money advice and benefits checks, and we are here to help.

Yours sincerely,
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'arrears_amount',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'rent-arrears-formal-warning',
    name: 'Rent Arrears — Formal Warning (NOSP Warning)',
    category: 'rent-arrears',
    subject: 'Formal notice regarding your rent arrears — action required',
    body: `Dear ((tenant_name)),

Re: Rent Account at ((property_address))
Account Reference: ((account_reference))

We have previously written to you regarding the outstanding balance on your rent account. Despite our earlier correspondence, the arrears on your account have now reached £((arrears_amount)), which represents ((weeks_in_arrears)) weeks of unpaid rent.

We take rent arrears very seriously, as rental income enables us to maintain homes and deliver services to all our residents. We are therefore writing to formally notify you that unless a satisfactory arrangement is made within 14 days of the date of this letter, we may have no alternative but to commence legal proceedings, which could ultimately put your tenancy at risk.

We strongly urge you to contact us immediately to discuss your situation. Our Income Team can be reached on ((income_team_phone)) or by email at ((income_team_email)). We can help you to:

- Agree a realistic and affordable repayment plan
- Check whether you are receiving all the benefits you are entitled to
- Refer you to independent money and debt advice services
- Explore whether a Discretionary Housing Payment may be available

We would much prefer to resolve this matter without legal action, and we remain committed to supporting you.

Yours sincerely,
((officer_name))
Income Recovery Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'account_reference',
      'arrears_amount',
      'weeks_in_arrears',
      'income_team_phone',
      'income_team_email',
      'officer_name',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'rent-arrears-pre-action',
    name: 'Rent Arrears — Pre-Action Protocol Letter',
    category: 'rent-arrears',
    subject: 'Pre-action protocol — rent arrears at ((property_address))',
    body: `Dear ((tenant_name)),

Re: Pre-Action Protocol for Possession Claims — Rent Arrears
Property: ((property_address))
Account Reference: ((account_reference))
Current Arrears: £((arrears_amount))

IMPORTANT: Please read this letter carefully. It concerns the possible loss of your home.

In accordance with the Pre-Action Protocol for Possession Claims by Social Landlords, we are writing to inform you that we are considering issuing court proceedings to recover possession of your home due to rent arrears.

Before we take this step, we are required to:

1. Provide you with details of your arrears — Your current arrears stand at £((arrears_amount)) as at ((statement_date)).

2. Offer to discuss the matter — We invite you to attend a meeting at our offices on ((meeting_date)) at ((meeting_time)), or to contact ((officer_name)) on ((officer_phone)) to arrange an alternative appointment.

3. Consider your personal circumstances — If there are reasons why possession proceedings would cause you particular hardship, including any health conditions, disabilities, or caring responsibilities, please let us know.

4. Signpost you to independent advice — We strongly recommend you seek independent legal and financial advice. You can contact:
   - Citizens Advice: 0800 144 8848
   - Shelter Housing Advice Helpline: 0808 800 4444
   - Your local council's Housing Options team

If you engage with us and agree a repayment plan that you maintain, we will not proceed with legal action.

If we do not hear from you within 14 days of this letter, we will proceed with serving a Notice of Seeking Possession.

Yours sincerely,
((officer_name))
Senior Income Recovery Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'account_reference',
      'arrears_amount',
      'statement_date',
      'meeting_date',
      'meeting_time',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'rent-arrears-payment-plan',
    name: 'Rent Arrears — Payment Plan Offer',
    category: 'rent-arrears',
    subject: 'Your repayment plan — confirmation',
    body: `Dear ((tenant_name)),

Re: Repayment Agreement for Rent Arrears
Property: ((property_address))
Account Reference: ((account_reference))

Thank you for speaking with us about the outstanding balance on your rent account. We are pleased to confirm the following repayment arrangement:

Current arrears: £((arrears_amount))
Weekly repayment amount: £((weekly_repayment)) (in addition to your current rent of £((weekly_rent)))
Total weekly payment: £((total_weekly_payment))
Start date: ((start_date))
Expected clearance date: ((clearance_date))

Please ensure that payments are made on time each week. If you pay by Direct Debit, we will adjust the amount automatically. If you pay by another method, please ensure the total amount of £((total_weekly_payment)) is paid each week.

If your circumstances change at any time and you are unable to maintain these payments, please contact us immediately on ((officer_phone)) so that we can review the arrangement. It is important that you do not simply stop paying, as this may result in further action being taken.

We are pleased that we have been able to agree this plan with you and we will continue to support you in maintaining your tenancy.

Yours sincerely,
((officer_name))
Income Recovery Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'account_reference',
      'arrears_amount',
      'weekly_repayment',
      'weekly_rent',
      'total_weekly_payment',
      'start_date',
      'clearance_date',
      'officer_phone',
      'officer_name',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // REPAIRS
  // ----------------------------------------------------------------
  {
    id: 'repairs-confirmation',
    name: 'Repairs — Repair Reported Confirmation',
    category: 'repairs',
    subject: 'Your repair has been reported — reference ((repair_reference))',
    body: `Dear ((tenant_name)),

Thank you for reporting a repair at ((property_address)). We have logged your request and the details are as follows:

Repair Reference: ((repair_reference))
Description: ((repair_description))
Priority: ((repair_priority))
Target Completion Date: ((target_date))

What happens next:
- If your repair requires an appointment, we will contact you within ((contact_timeframe)) to arrange a convenient date and time.
- For emergency repairs, our contractor will attend within ((emergency_timeframe)).
- You can track the progress of your repair by contacting us on ((contact_phone)) and quoting your reference number.

Please ensure that access is available to your property at the agreed time. If you need to change an appointment, please give us at least 24 hours' notice.

If you have any questions, please do not hesitate to contact us.

Yours sincerely,
Repairs Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'repair_reference',
      'repair_description',
      'repair_priority',
      'target_date',
      'contact_timeframe',
      'emergency_timeframe',
      'contact_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'repairs-appointment',
    name: 'Repairs — Appointment Confirmation',
    category: 'repairs',
    subject: 'Repair appointment confirmed — ((appointment_date))',
    body: `Dear ((tenant_name)),

We are writing to confirm the following repair appointment at ((property_address)):

Repair Reference: ((repair_reference))
Date: ((appointment_date))
Time Slot: ((appointment_time))
Contractor: ((contractor_name))
Work to be carried out: ((repair_description))

Please ensure that an adult (aged 18 or over) is present at the property during the appointment to provide access. If you are unable to keep this appointment, please contact us on ((contact_phone)) at least 24 hours in advance so that we can rearrange.

Please note that if access is not provided on two occasions, we may need to charge for any subsequent visits or make alternative access arrangements.

If the repair is in a communal area and does not require access to your home, no action is needed from you.

Yours sincerely,
Repairs Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'repair_reference',
      'appointment_date',
      'appointment_time',
      'contractor_name',
      'repair_description',
      'contact_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'repairs-completion',
    name: 'Repairs — Work Completed Notification',
    category: 'repairs',
    subject: 'Your repair has been completed — ((repair_reference))',
    body: `Dear ((tenant_name)),

We are pleased to confirm that the following repair at ((property_address)) has been completed:

Repair Reference: ((repair_reference))
Work Carried Out: ((repair_description))
Completed On: ((completion_date))
Completed By: ((contractor_name))

If you are not satisfied with the quality of the work, or if the issue has not been fully resolved, please contact us within 28 days on ((contact_phone)) or email ((contact_email)), quoting your repair reference number. We will arrange for the work to be inspected and, if necessary, rectified.

We are committed to maintaining your home to a high standard and we value your feedback.

Yours sincerely,
Repairs Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'repair_reference',
      'repair_description',
      'completion_date',
      'contractor_name',
      'contact_phone',
      'contact_email',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'repairs-satisfaction-survey',
    name: 'Repairs — Satisfaction Survey',
    category: 'repairs',
    subject: 'How was your recent repair? We value your feedback',
    body: `Dear ((tenant_name)),

We recently completed a repair at your home at ((property_address)) (Reference: ((repair_reference))).

Your feedback helps us to improve the service we provide to all our residents. We would be very grateful if you could take a few minutes to let us know how we did.

Please complete our short survey by visiting: ((survey_link))

Alternatively, you can provide feedback by:
- Calling us on ((contact_phone))
- Emailing ((contact_email))
- Writing to us at ((office_address))

Your responses are confidential and will be used solely to improve our repairs service.

Thank you for taking the time to share your views.

Yours sincerely,
Customer Experience Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'repair_reference',
      'survey_link',
      'contact_phone',
      'contact_email',
      'office_address',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // ASB (Anti-Social Behaviour)
  // ----------------------------------------------------------------
  {
    id: 'asb-initial-warning',
    name: 'ASB — Initial Warning Letter',
    category: 'asb',
    subject: 'Anti-social behaviour — initial warning',
    body: `Dear ((tenant_name)),

Re: Reports of Anti-Social Behaviour
Property: ((property_address))
Case Reference: ((case_reference))

We have received reports of anti-social behaviour associated with your tenancy at the above address. The nature of the behaviour reported is as follows:

((behaviour_description))

Date(s) of incident(s): ((incident_dates))

As your landlord, we have a responsibility to ensure that all residents can live peacefully in their homes. Your tenancy agreement (clause ((tenancy_clause))) clearly states that you, members of your household, and your visitors must not engage in behaviour that causes, or is likely to cause, nuisance, annoyance, or disturbance to neighbours or others in the locality.

This letter serves as a formal warning. We ask that you take immediate steps to ensure that the reported behaviour does not continue.

We would like to offer you the opportunity to discuss this matter. Please contact ((officer_name)) on ((officer_phone)) or by email at ((officer_email)) within 7 days of receiving this letter.

Please be aware that if reports of anti-social behaviour continue, we may need to take further action, which could include:
- A formal interview under caution
- Seeking an injunction
- Applying for a possession order

We hope that this matter can be resolved without the need for further action.

Yours sincerely,
((officer_name))
Anti-Social Behaviour Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'case_reference',
      'behaviour_description',
      'incident_dates',
      'tenancy_clause',
      'officer_name',
      'officer_phone',
      'officer_email',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'asb-investigation-update',
    name: 'ASB — Investigation Update',
    category: 'asb',
    subject: 'Update on your anti-social behaviour case — ((case_reference))',
    body: `Dear ((tenant_name)),

Re: Anti-Social Behaviour Case Update
Case Reference: ((case_reference))
Property: ((property_address))

We are writing to provide you with an update on the anti-social behaviour case that you reported to us.

Current status: ((case_status))

Actions taken since our last update:
((actions_taken))

Next steps:
((next_steps))

We understand that experiencing anti-social behaviour can be very distressing, and we want to assure you that we are taking your concerns seriously. ((additional_support))

If you experience any further incidents, please report them to us as soon as possible by:
- Calling ((contact_phone))
- Emailing ((contact_email))
- Using our online reporting form at ((reporting_link))

If you feel unsafe at any time, please contact the police on 999 (emergency) or 101 (non-emergency).

Your designated officer for this case is ((officer_name)), who can be contacted on ((officer_phone)).

Yours sincerely,
((officer_name))
Anti-Social Behaviour Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'case_reference',
      'case_status',
      'actions_taken',
      'next_steps',
      'additional_support',
      'contact_phone',
      'contact_email',
      'reporting_link',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'asb-case-closure',
    name: 'ASB — Case Closure Notification',
    category: 'asb',
    subject: 'Anti-social behaviour case closed — ((case_reference))',
    body: `Dear ((tenant_name)),

Re: Closure of Anti-Social Behaviour Case
Case Reference: ((case_reference))

We are writing to inform you that the above anti-social behaviour case has now been closed. The reason for closure is as follows:

((closure_reason))

Summary of actions taken:
((actions_summary))

If you experience any further incidents of anti-social behaviour in the future, please do not hesitate to contact us and we will open a new case. You can report issues by calling ((contact_phone)) or emailing ((contact_email)).

We hope that the situation has been resolved to your satisfaction. If you have any concerns about this case being closed, please contact ((officer_name)) on ((officer_phone)) within 14 days and we will review the decision.

You also have the right to request a review of our handling of your case through the Community Trigger (also known as the ASB Case Review). Information about this process is available on your local council's website or by contacting us.

Yours sincerely,
((officer_name))
Anti-Social Behaviour Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'case_reference',
      'closure_reason',
      'actions_summary',
      'contact_phone',
      'contact_email',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // COMPLIANCE
  // ----------------------------------------------------------------
  {
    id: 'compliance-gas-safety',
    name: 'Compliance — Gas Safety Appointment',
    category: 'compliance',
    subject: 'Annual gas safety check — appointment confirmation',
    body: `Dear ((tenant_name)),

Re: Annual Gas Safety Inspection
Property: ((property_address))

By law, we are required to carry out an annual gas safety check at your home. This is to ensure that all gas appliances, flues, and pipework are safe and working correctly.

We have arranged the following appointment:

Date: ((appointment_date))
Time: ((appointment_time))
Engineer: ((engineer_name)) (Gas Safe Registered No. ((gas_safe_number)))

IMPORTANT: This inspection is a legal requirement under the Gas Safety (Installation and Use) Regulations 1998. You must provide access for this inspection.

What to expect:
- The inspection will take approximately ((duration)) minutes
- The engineer will check all gas appliances, flues, and associated pipework
- You will receive a copy of the gas safety certificate (CP12) once the inspection is complete

Please ensure that an adult (aged 18 or over) is at the property during the appointment. If you need to rearrange, please contact us on ((contact_phone)) at least 48 hours in advance.

If access is not provided and we are unable to complete the inspection, we may need to seek a court injunction to gain access to your property. We wish to avoid this and appreciate your cooperation.

Yours sincerely,
Compliance Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'appointment_date',
      'appointment_time',
      'engineer_name',
      'gas_safe_number',
      'duration',
      'contact_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'compliance-electrical-inspection',
    name: 'Compliance — Electrical Inspection Notice',
    category: 'compliance',
    subject: 'Electrical safety inspection — access required',
    body: `Dear ((tenant_name)),

Re: Electrical Installation Condition Report (EICR)
Property: ((property_address))

We are required by the Electrical Safety Standards in the Private Rented Sector (England) Regulations 2020 to carry out a periodic electrical safety inspection at your home. This inspection must be completed at least every five years.

Your inspection has been scheduled for:

Date: ((appointment_date))
Time: ((appointment_time))
Contractor: ((contractor_name)) (NICEIC/NAPIT Registered)

The inspection will involve testing all fixed electrical installations in your home, including the consumer unit (fuse box), wiring, sockets, and light fittings. The inspection typically takes between ((duration_min)) and ((duration_max)) hours.

During the inspection:
- The electricity supply will need to be switched off for short periods
- Please ensure all electrical appliances are switched off
- The electrician may need access to all rooms, including loft spaces and cupboards

If you need to rearrange this appointment, please contact us on ((contact_phone)) as soon as possible. Please note that this is a legal requirement and access must be provided.

Yours sincerely,
Compliance Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'appointment_date',
      'appointment_time',
      'contractor_name',
      'duration_min',
      'duration_max',
      'contact_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'compliance-fire-risk',
    name: 'Compliance — Fire Risk Assessment Notification',
    category: 'compliance',
    subject: 'Fire safety works at your building — important information',
    body: `Dear ((tenant_name)),

Re: Fire Risk Assessment — ((building_name))
Property: ((property_address))

Following a recent Fire Risk Assessment of your building, we are writing to inform you of the findings and the actions we will be taking to ensure your safety.

Assessment Date: ((assessment_date))
Risk Rating: ((risk_rating))

Key findings:
((findings_summary))

Planned remedial works:
((remedial_works))

Expected start date: ((works_start_date))
Expected completion: ((works_end_date))

What this means for you:
((resident_impact))

In the meantime, please ensure that:
- Communal areas, corridors, and stairwells are kept clear of personal belongings
- Fire doors are not propped open or obstructed
- You are familiar with the evacuation procedure for your building
- Smoke detectors in your home are tested regularly

If you have any concerns about fire safety in your building, please contact ((officer_name)) on ((officer_phone)) or email ((officer_email)).

In the event of a fire, always call 999.

Yours sincerely,
((officer_name))
Building Safety Manager
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'building_name',
      'property_address',
      'assessment_date',
      'risk_rating',
      'findings_summary',
      'remedial_works',
      'works_start_date',
      'works_end_date',
      'resident_impact',
      'officer_name',
      'officer_phone',
      'officer_email',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // TENANCY
  // ----------------------------------------------------------------
  {
    id: 'tenancy-welcome',
    name: 'Tenancy — Welcome Letter',
    category: 'tenancy',
    subject: 'Welcome to your new home at ((property_address))',
    body: `Dear ((tenant_name)),

Welcome to ((organisation_name)). We are delighted that you have chosen to make your home with us at ((property_address)).

Your tenancy details:
Tenancy Reference: ((tenancy_reference))
Tenancy Type: ((tenancy_type))
Start Date: ((tenancy_start_date))
Weekly Rent: £((weekly_rent))
Payment Reference: ((payment_reference))

Your Housing Officer is ((officer_name)), who can be contacted on ((officer_phone)) or by email at ((officer_email)). They will arrange a settling-in visit within the first six weeks of your tenancy.

Getting started:
- Your rent is due weekly in advance. You can pay by Direct Debit, standing order, online, or at any Post Office.
- If you are in receipt of Universal Credit, please ensure your housing costs element is set up and provide us with your UC journal reference.
- Please contact your energy supplier to transfer the gas and electricity accounts into your name.
- Please ensure you have adequate contents insurance. We insure the building, but not your personal belongings.
- Your tenancy handbook, which contains important information about your rights and responsibilities, is enclosed with this letter.

If you need any support during your move, including help with furniture, benefit claims, or setting up utility accounts, please let us know. We have a range of support services available.

We look forward to you being part of our community.

Yours sincerely,
((officer_name))
Housing Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'organisation_name',
      'tenancy_reference',
      'tenancy_type',
      'tenancy_start_date',
      'weekly_rent',
      'payment_reference',
      'officer_name',
      'officer_phone',
      'officer_email',
      'date',
    ],
  },
  {
    id: 'tenancy-review',
    name: 'Tenancy — Annual Tenancy Review',
    category: 'tenancy',
    subject: 'Your annual tenancy review — appointment',
    body: `Dear ((tenant_name)),

Re: Annual Tenancy Review
Property: ((property_address))
Tenancy Reference: ((tenancy_reference))

It is time for your annual tenancy review. This is an opportunity for us to discuss how your tenancy is going, check that your home is in good condition, and ensure you are receiving all the support you may need.

We have arranged for your Housing Officer, ((officer_name)), to visit you:

Date: ((visit_date))
Time: ((visit_time))

During the visit, we will:
- Carry out a property condition check
- Update your household details and contact information
- Discuss any repairs or improvements needed
- Check whether you are accessing all available support services
- Review your rent account

Please have the following information available:
- Details of everyone living at the property
- Any changes to your income or employment
- Any concerns about your home or neighbourhood

If this appointment is not convenient, please contact ((officer_name)) on ((officer_phone)) to arrange an alternative date.

Yours sincerely,
((officer_name))
Housing Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'tenancy_reference',
      'officer_name',
      'visit_date',
      'visit_time',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'tenancy-end',
    name: 'Tenancy — End of Tenancy Confirmation',
    category: 'tenancy',
    subject: 'Confirmation of tenancy termination — ((property_address))',
    body: `Dear ((tenant_name)),

Re: End of Tenancy
Property: ((property_address))
Tenancy Reference: ((tenancy_reference))
Termination Date: ((termination_date))

We write to confirm that your tenancy at the above address will end on ((termination_date)), as per your notice dated ((notice_date)).

Before you leave, please ensure the following:

1. Property Condition: The property should be left in a clean, tidy condition, free from all personal belongings and rubbish. Any tenant fixtures or alterations should be removed and the property restored to its original condition unless we have agreed otherwise in writing.

2. Keys: All keys, including any copies, must be returned to our office at ((office_address)) by 12 noon on ((termination_date)). Please note that rent will continue to be charged until all keys are returned.

3. Meters: Please take final readings of all gas, electricity, and water meters and notify your suppliers of your departure.

4. Rent Account: Any outstanding rent or charges must be cleared. Your final rent balance will be confirmed once the property has been inspected. If you have overpaid, a refund will be arranged.

5. Pre-Termination Inspection: We will carry out a pre-termination inspection on ((inspection_date)) at ((inspection_time)). Please ensure access is available.

6. Redirecting Post: Please arrange for your post to be redirected via Royal Mail.

If you have any questions about the move-out process, please contact ((officer_name)) on ((officer_phone)).

We wish you well in your new home.

Yours sincerely,
((officer_name))
Housing Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'tenancy_reference',
      'termination_date',
      'notice_date',
      'office_address',
      'inspection_date',
      'inspection_time',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'tenancy-mutual-exchange',
    name: 'Tenancy — Mutual Exchange Decision',
    category: 'tenancy',
    subject: 'Mutual exchange application — decision',
    body: `Dear ((tenant_name)),

Re: Application for Mutual Exchange
Your Property: ((current_address))
Exchange Property: ((exchange_address))
Exchange Partner: ((exchange_partner_name))

Thank you for your application to mutually exchange your tenancy. We have now completed our assessment and are writing to inform you of our decision.

Decision: ((decision))

((decision_details))

((conditions))

If your application has been approved, please note the following:
- The exchange must be completed within ((completion_period)) of the date of this letter
- Both parties must sign a Deed of Assignment before the exchange can take place
- You must not move into the exchange property until all legal documents have been completed
- Both properties must pass a satisfactory inspection before the exchange is finalised

If your application has been refused, you have the right to appeal this decision within 42 days. Please contact ((officer_name)) on ((officer_phone)) if you wish to discuss the reasons for refusal or to lodge an appeal.

Yours sincerely,
((officer_name))
Housing Officer
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'current_address',
      'exchange_address',
      'exchange_partner_name',
      'decision',
      'decision_details',
      'conditions',
      'completion_period',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // DAMP & MOULD
  // ----------------------------------------------------------------
  {
    id: 'damp-mould-acknowledgement',
    name: 'Damp & Mould — Investigation Acknowledgement',
    category: 'damp-mould',
    subject: 'Damp and mould report received — ((case_reference))',
    body: `Dear ((tenant_name)),

Re: Report of Damp and Mould
Property: ((property_address))
Case Reference: ((case_reference))

Thank you for reporting damp and mould at your home. We take all reports of damp and mould very seriously, and we are committed to resolving this matter as quickly as possible.

We have logged your report and a surveyor will attend your property to carry out a full investigation:

Survey Date: ((survey_date))
Time: ((survey_time))

During the investigation, the surveyor will:
- Inspect the affected areas and take moisture readings
- Identify the likely cause of the damp and mould
- Take photographs to record the condition
- Recommend the appropriate remedial works

In the meantime, we recommend the following to help manage the situation:
- Wipe away visible mould using a damp cloth with a mild detergent — do not use bleach
- Try to keep the property well ventilated by opening windows where safe to do so
- If you have extractor fans in the kitchen and bathroom, please ensure they are switched on when cooking or bathing
- If you or anyone in your household is experiencing health problems that you believe may be related to the damp and mould, please seek medical advice from your GP

We understand that living with damp and mould can be distressing and may affect your health. If you have any vulnerabilities or health conditions that are being made worse by the conditions in your home, please let us know immediately so that we can prioritise your case.

Yours sincerely,
((officer_name))
Property Services Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'case_reference',
      'survey_date',
      'survey_time',
      'officer_name',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'damp-mould-remedial-works',
    name: 'Damp & Mould — Remedial Works Scheduled',
    category: 'damp-mould',
    subject: 'Damp and mould remedial works — appointment details',
    body: `Dear ((tenant_name)),

Re: Damp and Mould Remedial Works
Property: ((property_address))
Case Reference: ((case_reference))

Following the survey carried out at your home on ((survey_date)), we are writing to confirm the remedial works that have been approved and scheduled.

Diagnosis: ((diagnosis))

The following works will be carried out:
((works_description))

Contractor: ((contractor_name))
Start Date: ((works_start_date))
Estimated Duration: ((works_duration))
Access Required: ((access_requirements))

Please note:
- An adult (aged 18 or over) must be present to provide access
- You may need to move furniture away from the affected areas before work commences
- If you have any health conditions or vulnerabilities that may be affected by the works (for example, respiratory conditions, or young children in the home), please let us know so we can make appropriate arrangements

((temporary_decant_info))

If you need to rearrange the appointment, or if you have any questions about the planned works, please contact ((officer_name)) on ((officer_phone)).

We apologise for any inconvenience and are committed to resolving this issue for you.

Yours sincerely,
((officer_name))
Property Services Team
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'case_reference',
      'survey_date',
      'diagnosis',
      'works_description',
      'contractor_name',
      'works_start_date',
      'works_duration',
      'access_requirements',
      'temporary_decant_info',
      'officer_name',
      'officer_phone',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'damp-mould-awaabs-law',
    name: 'Damp & Mould — Awaab\'s Law Notice',
    category: 'damp-mould',
    subject: 'Important notice — damp and mould hazard response under Awaab\'s Law',
    body: `Dear ((tenant_name)),

Re: Damp and Mould Hazard — Awaab's Law Compliance
Property: ((property_address))
Case Reference: ((case_reference))
Hazard Classification: ((hazard_classification))

We are writing to you in accordance with our obligations under Awaab's Law (Social Housing (Regulation) Act 2023), which sets strict timeframes for social landlords to investigate and remedy damp and mould hazards.

Following your report of damp and mould on ((report_date)), we have taken the following actions in line with the statutory requirements:

Investigation:
- Your report was acknowledged within ((acknowledgement_days)) working day(s)
- A full investigation was completed on ((investigation_date))
- The hazard has been classified as: ((hazard_classification))

Findings:
((investigation_findings))

Remedial Action:
Under Awaab's Law, we are required to begin remedial works within ((statutory_start_days)) calendar days and complete them within ((statutory_completion_days)) calendar days of the hazard being identified.

Planned works: ((planned_works))
Works start date: ((works_start_date))
Target completion date: ((target_completion_date))

Your Rights:
- You have the right to a home that is free from Category 1 and Category 2 damp and mould hazards
- If we fail to meet the statutory timeframes, you may make a complaint to the Housing Ombudsman
- You may also contact your local council's Environmental Health team
- Free legal advice is available from Shelter on 0808 800 4444

If you or any member of your household is experiencing health issues related to the damp and mould, we strongly urge you to visit your GP and inform them of the conditions in your home.

We take our responsibilities under Awaab's Law extremely seriously and will keep you updated on the progress of the remedial works.

Yours sincerely,
((officer_name))
Head of Property Safety
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'property_address',
      'case_reference',
      'hazard_classification',
      'report_date',
      'acknowledgement_days',
      'investigation_date',
      'investigation_findings',
      'statutory_start_days',
      'statutory_completion_days',
      'planned_works',
      'works_start_date',
      'target_completion_date',
      'officer_name',
      'organisation_name',
      'date',
    ],
  },

  // ----------------------------------------------------------------
  // GENERAL
  // ----------------------------------------------------------------
  {
    id: 'general-newsletter',
    name: 'General — Resident Newsletter',
    category: 'general',
    subject: '((organisation_name)) — ((newsletter_title))',
    body: `Dear Resident,

Welcome to the ((newsletter_period)) edition of our resident newsletter.

((newsletter_content))

Key Updates:
((key_updates))

Upcoming Events:
((upcoming_events))

Get in Touch:
If you have any questions or would like to get involved in any of our activities, please contact us:
- Phone: ((contact_phone))
- Email: ((contact_email))
- Website: ((website_url))
- Office: ((office_address))

Office Opening Hours: ((office_hours))

We value your feedback and are always looking for ways to improve our services. If you have any suggestions, please let us know.

Best wishes,
((organisation_name))
((date))`,
    personalisationFields: [
      'organisation_name',
      'newsletter_title',
      'newsletter_period',
      'newsletter_content',
      'key_updates',
      'upcoming_events',
      'contact_phone',
      'contact_email',
      'website_url',
      'office_address',
      'office_hours',
      'date',
    ],
  },
  {
    id: 'general-service-update',
    name: 'General — Service Update',
    category: 'general',
    subject: 'Service update — ((update_subject))',
    body: `Dear ((tenant_name)),

We are writing to let you know about a change to our services that may affect you.

((update_details))

What this means for you:
((impact_description))

When this takes effect: ((effective_date))

What you need to do:
((action_required))

If you have any questions or concerns about this change, please contact us on ((contact_phone)) or email ((contact_email)). Our team will be happy to help.

We are committed to keeping you informed about changes to our services and welcome any feedback you may have.

Yours sincerely,
((officer_name))
((officer_title))
((organisation_name))
((date))`,
    personalisationFields: [
      'tenant_name',
      'update_subject',
      'update_details',
      'impact_description',
      'effective_date',
      'action_required',
      'contact_phone',
      'contact_email',
      'officer_name',
      'officer_title',
      'organisation_name',
      'date',
    ],
  },
  {
    id: 'general-emergency',
    name: 'General — Emergency Notification',
    category: 'general',
    subject: 'URGENT: ((emergency_subject)) — action required',
    body: `Dear ((tenant_name)),

IMPORTANT — PLEASE READ THIS MESSAGE CAREFULLY

We are contacting you urgently regarding: ((emergency_subject))

Property/Area Affected: ((affected_area))

((emergency_details))

Immediate actions you should take:
((immediate_actions))

Emergency services have been contacted: ((emergency_services_status))

For your safety:
((safety_instructions))

Key contacts:
- Emergency services: 999
- ((organisation_name)) emergency line: ((emergency_phone))
- Gas emergency (if applicable): 0800 111 999
- Water emergency (if applicable): ((water_emergency_number))
- Electricity emergency: 105

((temporary_arrangements))

We will provide further updates as the situation develops. Please check ((communication_channel)) for the latest information.

We apologise for any disruption and are working to resolve this as quickly as possible.

((organisation_name))
((date))
((time))`,
    personalisationFields: [
      'tenant_name',
      'emergency_subject',
      'affected_area',
      'emergency_details',
      'immediate_actions',
      'emergency_services_status',
      'safety_instructions',
      'emergency_phone',
      'water_emergency_number',
      'temporary_arrangements',
      'communication_channel',
      'organisation_name',
      'date',
      'time',
    ],
  },
];

// ============================================================
// Template Library Functions
// ============================================================

/**
 * Retrieve all available GOV.UK Notify templates.
 */
export function getAllTemplates(): NotifyTemplate[] {
  return templates;
}

/**
 * Retrieve a single template by its unique ID.
 * Returns undefined if no template with the given ID exists.
 */
export function getTemplateById(id: string): NotifyTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * Retrieve all templates belonging to a given category.
 * Returns an empty array if the category has no templates or is unrecognised.
 */
export function getTemplatesByCategory(category: TemplateCategory): NotifyTemplate[] {
  return templates.filter((t) => t.category === category);
}

/**
 * Render a template by replacing all `((field_name))` placeholders with the
 * corresponding values from the supplied personalisation map.
 *
 * Fields present in the template but absent from the personalisation map are
 * left as `((field_name))` so that callers can identify missing data.
 *
 * Returns both the rendered subject and body.
 *
 * @throws Error if the template ID is not found.
 */
export function renderTemplate(
  templateId: string,
  personalisation: Record<string, string>
): { subject: string; body: string; missingFields: string[] } {
  const template = getTemplateById(templateId);
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  const missingFields: string[] = [];

  const replacer = (text: string): string => {
    return text.replace(/\(\(([a-zA-Z_][a-zA-Z0-9_]*)\)\)/g, (_match, fieldName: string) => {
      if (fieldName in personalisation) {
        return personalisation[fieldName];
      }
      if (!missingFields.includes(fieldName)) {
        missingFields.push(fieldName);
      }
      return `((${fieldName}))`;
    });
  };

  return {
    subject: replacer(template.subject),
    body: replacer(template.body),
    missingFields,
  };
}
