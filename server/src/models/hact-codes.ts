// ============================================================
// HACT v3.5 Code List Mappings — Bidirectional
// Source: UK Housing Data Standard Version 3.5 JSON schemas
// ============================================================

export interface CodeMapping {
  hactCode: string;
  label: string;
  appValue: string;
}

// ---- PropertyPrimaryTypeCode (PropertyTypes.json) ----
export const PropertyPrimaryTypeCode: CodeMapping[] = [
  { hactCode: '01-00-00', label: 'Agriculture', appValue: 'agriculture' },
  { hactCode: '02-00-00', label: 'Healthcare', appValue: 'healthcare' },
  { hactCode: '03-00-00', label: 'Industrial', appValue: 'industrial' },
  { hactCode: '04-00-00', label: 'Leisure', appValue: 'leisure' },
  { hactCode: '05-00-00', label: 'Office', appValue: 'office' },
  { hactCode: '06-00-00', label: 'Retail', appValue: 'retail' },
  { hactCode: '07-00-00', label: 'Multi-Family/Housing', appValue: 'housing' },
  { hactCode: '08-00-00', label: 'Miscellaneous', appValue: 'miscellaneous' },
  { hactCode: '09-00-00', label: 'Land', appValue: 'land' },
  { hactCode: '10-00-00', label: 'Garage/Parking', appValue: 'garage' },
  { hactCode: '11-00-00', label: 'Community', appValue: 'community' },
  { hactCode: '12-00-00', label: 'Education', appValue: 'education' },
  { hactCode: '13-00-00', label: 'Other', appValue: 'other' },
];

// ---- PropertySubtypeCode (Housing subtypes) ----
export const PropertySubtypeCode: CodeMapping[] = [
  { hactCode: '07-01-00', label: 'Flat/Apartment', appValue: 'flat' },
  { hactCode: '07-01-10', label: 'Studio', appValue: 'studio' },
  { hactCode: '07-01-20', label: 'Bedsit', appValue: 'bedsit' },
  { hactCode: '07-02-00', label: 'Maisonette', appValue: 'maisonette' },
  { hactCode: '07-03-00', label: 'House - Detached', appValue: 'house' },
  { hactCode: '07-04-00', label: 'House - Semi-Detached', appValue: 'house' },
  { hactCode: '07-05-00', label: 'House - Terraced', appValue: 'house' },
  { hactCode: '07-06-00', label: 'House - End Terrace', appValue: 'house' },
  { hactCode: '07-07-00', label: 'Bungalow', appValue: 'bungalow' },
  { hactCode: '07-09-00', label: 'Room/Bedspace', appValue: 'bedsit' },
  { hactCode: '07-10-00', label: 'Shared House', appValue: 'house' },
  { hactCode: '07-11-00', label: 'Sheltered/Retirement', appValue: 'flat' },
  { hactCode: '07-12-00', label: 'Supported Housing', appValue: 'flat' },
];

// ---- TenureTypeCode ----
export const TenureTypeCode: CodeMapping[] = [
  { hactCode: '0', label: 'Unknown', appValue: 'unknown' },
  { hactCode: '10', label: 'Freehold', appValue: 'freehold' },
  { hactCode: '20', label: 'Long Leasehold', appValue: 'long-lease' },
  { hactCode: '30', label: 'Short Leasehold', appValue: 'short-lease' },
  { hactCode: '40', label: 'Licence', appValue: 'licence' },
  { hactCode: '100', label: 'Secure Tenancy', appValue: 'secure' },
  { hactCode: '110', label: 'Assured Tenancy', appValue: 'assured' },
  { hactCode: '120', label: 'Assured Shorthold Tenancy', appValue: 'ast' },
  { hactCode: '130', label: 'Starter Tenancy', appValue: 'starter' },
  { hactCode: '140', label: 'Introductory Tenancy', appValue: 'starter' },
  { hactCode: '150', label: 'Demoted Tenancy', appValue: 'demoted' },
  { hactCode: '160', label: 'Fixed Term Tenancy', appValue: 'fixed-term' },
  { hactCode: '170', label: 'Flexible Tenancy', appValue: 'flexible' },
  { hactCode: '180', label: 'Shared Ownership', appValue: 'shared-ownership' },
  { hactCode: '190', label: 'Shared Equity', appValue: 'shared-equity' },
  { hactCode: '200', label: 'Rent to Buy', appValue: 'rent-to-buy' },
  { hactCode: '210', label: 'Help to Buy', appValue: 'help-to-buy' },
  { hactCode: '220', label: 'Market Rent', appValue: 'market-rent' },
  { hactCode: '230', label: 'Affordable Rent', appValue: 'affordable-rent' },
  { hactCode: '240', label: 'Social Rent', appValue: 'social-rent' },
  { hactCode: '250', label: 'Intermediate Rent', appValue: 'intermediate-rent' },
];

// ---- ConstructionMethodCode ----
export const ConstructionMethodCode: CodeMapping[] = [
  { hactCode: '0', label: 'Unknown', appValue: 'unknown' },
  { hactCode: '10', label: 'Traditional Brick/Block', appValue: 'brick' },
  { hactCode: '20', label: 'Timber Frame', appValue: 'timber-frame' },
  { hactCode: '30', label: 'Steel Frame', appValue: 'steel-frame' },
  { hactCode: '40', label: 'Concrete Frame', appValue: 'concrete-frame' },
  { hactCode: '50', label: 'Pre-fabricated Concrete', appValue: 'prefab-concrete' },
  { hactCode: '60', label: 'System Build', appValue: 'system-build' },
  { hactCode: '70', label: 'Modular', appValue: 'modular' },
  { hactCode: '80', label: 'CLT', appValue: 'clt' },
  { hactCode: '90', label: 'SIPs', appValue: 'sips' },
  { hactCode: '100', label: 'ICF', appValue: 'icf' },
];

// ---- PropertyPhysicalFormCode ----
export const PropertyPhysicalFormCode: CodeMapping[] = [
  { hactCode: '0', label: 'Unknown', appValue: 'unknown' },
  { hactCode: '10', label: 'Purpose Built', appValue: 'purpose-built' },
  { hactCode: '10-10', label: 'Purpose Built - Low Rise (1-3 storeys)', appValue: 'low-rise' },
  { hactCode: '10-20', label: 'Purpose Built - Medium Rise (4-6 storeys)', appValue: 'medium-rise' },
  { hactCode: '20', label: 'Converted', appValue: 'converted' },
  { hactCode: '20-10', label: 'Converted - House to Flats', appValue: 'converted-house' },
  { hactCode: '30', label: 'Non-traditional', appValue: 'non-traditional' },
];

// ---- PropertyAdjacencyCode ----
export const PropertyAdjacencyCode: CodeMapping[] = [
  { hactCode: '0', label: 'Unknown', appValue: 'unknown' },
  { hactCode: '10', label: 'Detached', appValue: 'detached' },
  { hactCode: '20', label: 'Semi-Detached', appValue: 'semi-detached' },
  { hactCode: '30', label: 'Terraced', appValue: 'terraced' },
  { hactCode: '30-10', label: 'Terraced - Mid', appValue: 'mid-terrace' },
  { hactCode: '30-20', label: 'Terraced - End', appValue: 'end-terrace' },
  { hactCode: '40', label: 'Block', appValue: 'block' },
];

// ---- CommunicationChannelCode (CustomerData.json) ----
export const CommunicationChannelCode: CodeMapping[] = [
  { hactCode: '10', label: 'Telephone', appValue: 'phone' },
  { hactCode: '20', label: 'Email', appValue: 'email' },
  { hactCode: '30', label: 'Letter/Post', appValue: 'letter' },
  { hactCode: '40', label: 'SMS/Text', appValue: 'sms' },
  { hactCode: '50', label: 'Web Portal', appValue: 'portal' },
  { hactCode: '60', label: 'Social Media', appValue: 'social-media' },
  { hactCode: '70', label: 'Face to Face', appValue: 'face-to-face' },
];

// ---- PaymentMethodCode ----
export const PaymentMethodCode: CodeMapping[] = [
  { hactCode: '10', label: 'Direct Debit', appValue: 'dd' },
  { hactCode: '20', label: 'Standing Order', appValue: 'so' },
  { hactCode: '30', label: 'Cash', appValue: 'cash' },
  { hactCode: '40', label: 'Card Payment', appValue: 'card' },
  { hactCode: '50', label: 'Housing Benefit', appValue: 'hb' },
  { hactCode: '60', label: 'Universal Credit', appValue: 'uc' },
  { hactCode: '70', label: 'Cheque', appValue: 'cheque' },
];

// ---- HeatingTypeCode ----
export const HeatingTypeCode: CodeMapping[] = [
  { hactCode: '10', label: 'Gas Central Heating', appValue: 'gas-central' },
  { hactCode: '20', label: 'Electric Heating', appValue: 'electric' },
  { hactCode: '30', label: 'District Heating', appValue: 'district' },
  { hactCode: '40', label: 'Communal Heating', appValue: 'communal' },
  { hactCode: '50', label: 'Storage Heaters', appValue: 'storage-heaters' },
  { hactCode: '60', label: 'Heat Pump', appValue: 'heat-pump' },
];

// ---- Lookup Utilities ----
export type CodeListName =
  | 'PropertyPrimaryTypeCode'
  | 'PropertySubtypeCode'
  | 'TenureTypeCode'
  | 'ConstructionMethodCode'
  | 'PropertyPhysicalFormCode'
  | 'PropertyAdjacencyCode'
  | 'CommunicationChannelCode'
  | 'PaymentMethodCode'
  | 'HeatingTypeCode';

const allCodeLists: Record<CodeListName, CodeMapping[]> = {
  PropertyPrimaryTypeCode,
  PropertySubtypeCode,
  TenureTypeCode,
  ConstructionMethodCode,
  PropertyPhysicalFormCode,
  PropertyAdjacencyCode,
  CommunicationChannelCode,
  PaymentMethodCode,
  HeatingTypeCode,
};

/** Convert app value (e.g. "flat") to HACT code (e.g. "07-01-00") */
export function appToHact(codeList: CodeListName, appValue: string): string | undefined {
  return allCodeLists[codeList]?.find(c => c.appValue === appValue)?.hactCode;
}

/** Convert HACT code to app value */
export function hactToApp(codeList: CodeListName, hactCode: string): string | undefined {
  return allCodeLists[codeList]?.find(c => c.hactCode === hactCode)?.appValue;
}

/** Get label from app value */
export function appToLabel(codeList: CodeListName, appValue: string): string | undefined {
  return allCodeLists[codeList]?.find(c => c.appValue === appValue)?.label;
}

/** Get full code list for seeding */
export function getCodeList(codeList: CodeListName): CodeMapping[] {
  return allCodeLists[codeList] || [];
}

/** Get all code list names */
export function getAllCodeListNames(): CodeListName[] {
  return Object.keys(allCodeLists) as CodeListName[];
}
