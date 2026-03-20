import { Router } from 'express';
import { collections, batchWrite, setDoc } from '../services/firestore.js';
import { authMiddleware } from '../middleware/auth.js';
import { requirePersona } from '../middleware/rbac.js';

export const importRouter = Router();
importRouter.use(authMiddleware);
importRouter.use(requirePersona('manager'));

// ============================================================
// HACT v3.5 Entity Templates — required & optional fields
// ============================================================

interface FieldDef {
  field: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'boolean' | 'email' | 'postcode';
}

const ENTITY_TEMPLATES: Record<string, FieldDef[]> = {
  properties: [
    { field: 'id', label: 'Property ID', required: true, type: 'string' },
    { field: 'address', label: 'Address', required: true, type: 'string' },
    { field: 'postcode', label: 'Postcode', required: true, type: 'postcode' },
    { field: 'uprn', label: 'UPRN', required: false, type: 'string' },
    { field: 'type', label: 'Property Type', required: true, type: 'string' },
    { field: 'bedrooms', label: 'Bedrooms', required: true, type: 'number' },
    { field: 'floorArea', label: 'Floor Area (sqm)', required: false, type: 'number' },
    { field: 'heatingType', label: 'Heating Type', required: false, type: 'string' },
    { field: 'tenureType', label: 'Tenure Type', required: false, type: 'string' },
    { field: 'isVoid', label: 'Is Void', required: false, type: 'boolean' },
    { field: 'voidSince', label: 'Void Since', required: false, type: 'date' },
    { field: 'constructionYear', label: 'Construction Year', required: false, type: 'number' },
    { field: 'epcRating', label: 'EPC Rating', required: false, type: 'string' },
    { field: 'weeklyRent', label: 'Weekly Rent', required: false, type: 'number' },
    { field: 'serviceCharge', label: 'Service Charge', required: false, type: 'number' },
    { field: 'dampRisk', label: 'Damp Risk Score', required: false, type: 'number' },
    { field: 'blockId', label: 'Block ID', required: false, type: 'string' },
    { field: 'estateId', label: 'Estate ID', required: false, type: 'string' },
    { field: 'localAuthorityId', label: 'Local Authority ID', required: false, type: 'string' },
    { field: 'regionId', label: 'Region ID', required: false, type: 'string' },
    { field: 'lat', label: 'Latitude', required: false, type: 'number' },
    { field: 'lng', label: 'Longitude', required: false, type: 'number' },
  ],
  tenants: [
    { field: 'id', label: 'Tenant ID', required: true, type: 'string' },
    { field: 'firstName', label: 'First Name', required: true, type: 'string' },
    { field: 'lastName', label: 'Last Name', required: true, type: 'string' },
    { field: 'title', label: 'Title', required: false, type: 'string' },
    { field: 'email', label: 'Email', required: true, type: 'email' },
    { field: 'phone', label: 'Phone', required: true, type: 'string' },
    { field: 'mobile', label: 'Mobile', required: false, type: 'string' },
    { field: 'dob', label: 'Date of Birth', required: false, type: 'date' },
    { field: 'propertyId', label: 'Property ID', required: true, type: 'string' },
    { field: 'tenancyId', label: 'Tenancy ID', required: false, type: 'string' },
    { field: 'tenancyStartDate', label: 'Tenancy Start Date', required: true, type: 'date' },
    { field: 'tenancyType', label: 'Tenancy Type', required: false, type: 'string' },
    { field: 'tenancyStatus', label: 'Tenancy Status', required: false, type: 'string' },
    { field: 'weeklyCharge', label: 'Weekly Charge', required: false, type: 'number' },
    { field: 'rentBalance', label: 'Rent Balance', required: false, type: 'number' },
    { field: 'ucStatus', label: 'UC Status', required: false, type: 'string' },
    { field: 'paymentMethod', label: 'Payment Method', required: false, type: 'string' },
    { field: 'communicationPreference', label: 'Communication Preference', required: false, type: 'string' },
    { field: 'assignedOfficer', label: 'Assigned Officer', required: false, type: 'string' },
  ],
  cases: [
    { field: 'id', label: 'Case ID', required: true, type: 'string' },
    { field: 'reference', label: 'Reference', required: true, type: 'string' },
    { field: 'type', label: 'Type (repair/complaint/asb)', required: true, type: 'string' },
    { field: 'tenantId', label: 'Tenant ID', required: true, type: 'string' },
    { field: 'propertyId', label: 'Property ID', required: true, type: 'string' },
    { field: 'subject', label: 'Subject', required: true, type: 'string' },
    { field: 'description', label: 'Description', required: true, type: 'string' },
    { field: 'status', label: 'Status', required: true, type: 'string' },
    { field: 'priority', label: 'Priority', required: true, type: 'string' },
    { field: 'handler', label: 'Handler', required: false, type: 'string' },
    { field: 'createdDate', label: 'Created Date', required: true, type: 'date' },
    { field: 'targetDate', label: 'Target Date', required: false, type: 'date' },
    { field: 'closedDate', label: 'Closed Date', required: false, type: 'date' },
    { field: 'sorCode', label: 'SOR Code', required: false, type: 'string' },
    { field: 'trade', label: 'Trade', required: false, type: 'string' },
    { field: 'cost', label: 'Cost', required: false, type: 'number' },
    { field: 'category', label: 'Category', required: false, type: 'string' },
  ],
  rentTransactions: [
    { field: 'id', label: 'Transaction ID', required: true, type: 'string' },
    { field: 'tenantId', label: 'Tenant ID', required: true, type: 'string' },
    { field: 'propertyId', label: 'Property ID', required: true, type: 'string' },
    { field: 'date', label: 'Date', required: true, type: 'date' },
    { field: 'amount', label: 'Amount', required: true, type: 'number' },
    { field: 'type', label: 'Type (debit/credit)', required: true, type: 'string' },
    { field: 'description', label: 'Description', required: false, type: 'string' },
    { field: 'reference', label: 'Reference', required: false, type: 'string' },
    { field: 'paymentMethod', label: 'Payment Method', required: false, type: 'string' },
    { field: 'balance', label: 'Running Balance', required: false, type: 'number' },
  ],
};

// ============================================================
// Validation helpers
// ============================================================

const UK_POSTCODE_REGEX = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
// Also accept DD/MM/YYYY and DD-MM-YYYY
const DATE_UK_REGEX = /^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/;

function normaliseDate(value: string): string | null {
  if (DATE_REGEX.test(value)) return value;
  if (DATE_UK_REGEX.test(value)) {
    const parts = value.split(/[\/\-]/);
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  // Try parsing as a date
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function validateField(
  value: any,
  fieldDef: FieldDef,
): string | null {
  const strVal = String(value ?? '').trim();

  if (fieldDef.required && (!strVal || strVal === 'undefined' || strVal === 'null')) {
    return `${fieldDef.label} is required`;
  }

  if (!strVal || strVal === 'undefined' || strVal === 'null') return null;

  switch (fieldDef.type) {
    case 'number': {
      const num = Number(strVal);
      if (isNaN(num)) return `${fieldDef.label} must be a number`;
      break;
    }
    case 'date': {
      const normalised = normaliseDate(strVal);
      if (!normalised) return `${fieldDef.label} must be a valid date (YYYY-MM-DD or DD/MM/YYYY)`;
      break;
    }
    case 'boolean': {
      const lower = strVal.toLowerCase();
      if (!['true', 'false', 'yes', 'no', '1', '0', 'y', 'n'].includes(lower)) {
        return `${fieldDef.label} must be true/false, yes/no, or 1/0`;
      }
      break;
    }
    case 'email': {
      if (!EMAIL_REGEX.test(strVal)) return `${fieldDef.label} must be a valid email address`;
      break;
    }
    case 'postcode': {
      if (!UK_POSTCODE_REGEX.test(strVal)) return `${fieldDef.label} must be a valid UK postcode`;
      break;
    }
  }

  return null;
}

function normaliseBool(value: string): boolean {
  const lower = String(value).toLowerCase().trim();
  return ['true', 'yes', '1', 'y'].includes(lower);
}

function coerceValue(value: any, type: FieldDef['type']): any {
  const strVal = String(value ?? '').trim();
  if (!strVal || strVal === 'undefined' || strVal === 'null') return undefined;

  switch (type) {
    case 'number': return Number(strVal);
    case 'boolean': return normaliseBool(strVal);
    case 'date': return normaliseDate(strVal) || strVal;
    default: return strVal;
  }
}

// ============================================================
// Field mapping suggestion (header name similarity)
// ============================================================

function suggestMappings(
  sourceHeaders: string[],
  targetFields: FieldDef[],
): { sourceField: string; targetField: string; confidence: number }[] {
  const suggestions: { sourceField: string; targetField: string; confidence: number }[] = [];

  for (const source of sourceHeaders) {
    const normalised = source.toLowerCase().replace(/[^a-z0-9]/g, '');
    let bestMatch = '';
    let bestScore = 0;

    for (const target of targetFields) {
      const targetNorm = target.field.toLowerCase().replace(/[^a-z0-9]/g, '');
      const labelNorm = target.label.toLowerCase().replace(/[^a-z0-9]/g, '');

      // Exact match on field name
      if (normalised === targetNorm) {
        bestMatch = target.field;
        bestScore = 1.0;
        break;
      }

      // Exact match on label
      if (normalised === labelNorm) {
        bestMatch = target.field;
        bestScore = 0.95;
        continue;
      }

      // Contains match
      if (normalised.includes(targetNorm) || targetNorm.includes(normalised)) {
        const score = 0.7 + (Math.min(normalised.length, targetNorm.length) / Math.max(normalised.length, targetNorm.length)) * 0.2;
        if (score > bestScore) {
          bestMatch = target.field;
          bestScore = score;
        }
      }

      // Label contains
      if (normalised.includes(labelNorm) || labelNorm.includes(normalised)) {
        const score = 0.6 + (Math.min(normalised.length, labelNorm.length) / Math.max(normalised.length, labelNorm.length)) * 0.2;
        if (score > bestScore) {
          bestMatch = target.field;
          bestScore = score;
        }
      }

      // Common aliases
      const aliases: Record<string, string[]> = {
        id: ['identifier', 'key', 'ref', 'code'],
        address: ['addr', 'street', 'addressline1', 'addressline', 'propertyaddress'],
        postcode: ['zipcode', 'zip', 'postalcode', 'post_code'],
        firstName: ['forename', 'givenname', 'first_name', 'fname'],
        lastName: ['surname', 'familyname', 'last_name', 'lname'],
        email: ['emailaddress', 'email_address', 'e_mail'],
        phone: ['telephone', 'phonenumber', 'tel', 'phone_number'],
        mobile: ['mobilephone', 'cellphone', 'mobile_number'],
        bedrooms: ['beds', 'noofbedrooms', 'numbedrooms', 'num_bedrooms'],
        weeklyRent: ['rent', 'rentamount', 'rent_amount', 'weeklyrentcharge'],
        tenancyStartDate: ['startdate', 'movedindate', 'tenancystart', 'start_date'],
        type: ['propertytype', 'casetype', 'transactiontype', 'property_type'],
        isVoid: ['void', 'isvoid', 'vacant', 'empty'],
        constructionYear: ['yearbuilt', 'builtyear', 'year_built', 'constructionyear'],
        epcRating: ['epc', 'energyrating', 'epc_rating'],
        uprn: ['uprn_number', 'unique_property_reference'],
        description: ['desc', 'details', 'notes'],
        createdDate: ['created', 'datecreated', 'raiseddate', 'logged_date'],
        amount: ['value', 'sum', 'payment', 'transactionamount'],
        dob: ['dateofbirth', 'birthdate', 'date_of_birth', 'birthday'],
        ucStatus: ['universalcredit', 'uc', 'ucstatus', 'uc_status'],
      };

      const fieldAliases = aliases[target.field] || [];
      for (const alias of fieldAliases) {
        if (normalised === alias || normalised.includes(alias) || alias.includes(normalised)) {
          const score = normalised === alias ? 0.9 : 0.65;
          if (score > bestScore) {
            bestMatch = target.field;
            bestScore = score;
          }
        }
      }
    }

    if (bestMatch && bestScore >= 0.5) {
      suggestions.push({
        sourceField: source,
        targetField: bestMatch,
        confidence: Math.round(bestScore * 100) / 100,
      });
    }
  }

  return suggestions;
}

// ============================================================
// GET /api/v1/import/templates
// Return CSV template headers for each entity type
// ============================================================

importRouter.get('/templates', (_req, res) => {
  const templates: Record<string, { headers: string[]; fields: FieldDef[]; description: string }> = {};

  const descriptions: Record<string, string> = {
    properties: 'Property stock data including addresses, types, and compliance information',
    tenants: 'Tenant and tenancy records with contact details and rent information',
    cases: 'Repairs, complaints, ASB, and other case records',
    rentTransactions: 'Rent payment and charge transaction history',
  };

  for (const [entityType, fields] of Object.entries(ENTITY_TEMPLATES)) {
    templates[entityType] = {
      headers: fields.map(f => f.field),
      fields,
      description: descriptions[entityType] || entityType,
    };
  }

  res.json(templates);
});

// ============================================================
// POST /api/v1/import/validate
// Validate uploaded data and return field mapping suggestions
// ============================================================

importRouter.post('/validate', async (req, res, next) => {
  try {
    const { entityType, records, sourceHeaders } = req.body as {
      entityType: string;
      records: Record<string, any>[];
      sourceHeaders?: string[];
    };

    if (!entityType || !ENTITY_TEMPLATES[entityType]) {
      return res.status(400).json({ error: `Invalid entity type. Must be one of: ${Object.keys(ENTITY_TEMPLATES).join(', ')}` });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const fields = ENTITY_TEMPLATES[entityType];
    const errors: { row: number; field: string; message: string }[] = [];
    let valid = 0;

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      let rowValid = true;

      for (const fieldDef of fields) {
        const error = validateField(record[fieldDef.field], fieldDef);
        if (error) {
          errors.push({ row: i + 1, field: fieldDef.field, message: error });
          rowValid = false;
        }
      }

      if (rowValid) valid++;
    }

    // Generate mapping suggestions if source headers provided
    const suggestedMapping = sourceHeaders
      ? suggestMappings(sourceHeaders, fields)
      : [];

    res.json({
      valid,
      invalid: records.length - valid,
      total: records.length,
      errors: errors.slice(0, 200), // Cap at 200 errors to prevent huge responses
      suggestedMapping,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/v1/import/preview
// Preview the first 10 records after transformation
// ============================================================

importRouter.post('/preview', async (req, res, next) => {
  try {
    const { entityType, records, mapping } = req.body as {
      entityType: string;
      records: Record<string, any>[];
      mapping: Record<string, string>; // sourceField -> targetField
    };

    if (!entityType || !ENTITY_TEMPLATES[entityType]) {
      return res.status(400).json({ error: `Invalid entity type. Must be one of: ${Object.keys(ENTITY_TEMPLATES).join(', ')}` });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const fields = ENTITY_TEMPLATES[entityType];
    const fieldMap = new Map(fields.map(f => [f.field, f]));
    const preview: Record<string, any>[] = [];

    // Apply mapping and coerce types for first 10 records
    const previewRecords = records.slice(0, 10);

    for (const record of previewRecords) {
      const transformed: Record<string, any> = {};

      if (mapping && Object.keys(mapping).length > 0) {
        // Apply source->target mapping
        for (const [sourceField, targetField] of Object.entries(mapping)) {
          const fieldDef = fieldMap.get(targetField);
          if (fieldDef && record[sourceField] !== undefined) {
            transformed[targetField] = coerceValue(record[sourceField], fieldDef.type);
          }
        }
      } else {
        // Direct mapping (assume source fields match target fields)
        for (const fieldDef of fields) {
          if (record[fieldDef.field] !== undefined) {
            transformed[fieldDef.field] = coerceValue(record[fieldDef.field], fieldDef.type);
          }
        }
      }

      preview.push(transformed);
    }

    // Show which fields are mapped
    const targetFields = fields.map(f => ({
      field: f.field,
      label: f.label,
      required: f.required,
      mapped: mapping
        ? Object.values(mapping).includes(f.field)
        : fields.some(fd => preview.length > 0 && preview[0][fd.field] !== undefined),
    }));

    res.json({
      preview,
      targetFields,
      totalRecords: records.length,
      previewCount: preview.length,
    });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// POST /api/v1/import/execute
// Execute the import, writing records to Firestore in batches
// ============================================================

importRouter.post('/execute', async (req, res, next) => {
  try {
    const { entityType, records, mapping } = req.body as {
      entityType: 'properties' | 'tenants' | 'cases' | 'rentTransactions';
      records: Record<string, any>[];
      mapping: Record<string, string>;
    };

    if (!entityType || !ENTITY_TEMPLATES[entityType]) {
      return res.status(400).json({ error: `Invalid entity type. Must be one of: ${Object.keys(ENTITY_TEMPLATES).join(', ')}` });
    }

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ error: 'No records provided' });
    }

    const fields = ENTITY_TEMPLATES[entityType];
    const fieldMap = new Map(fields.map(f => [f.field, f]));

    // Resolve the correct Firestore collection
    const collectionMap: Record<string, FirebaseFirestore.CollectionReference> = {
      properties: collections.properties,
      tenants: collections.tenants,
      cases: collections.cases,
      rentTransactions: collections.rentTransactions,
    };

    const collection = collectionMap[entityType];
    if (!collection) {
      return res.status(400).json({ error: `No collection found for entity type: ${entityType}` });
    }

    let imported = 0;
    let skipped = 0;
    const errors: { row: number; message: string }[] = [];
    const batchOps: { collection: FirebaseFirestore.CollectionReference; id: string; data: Record<string, any> }[] = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];

      try {
        const transformed: Record<string, any> = {};

        if (mapping && Object.keys(mapping).length > 0) {
          for (const [sourceField, targetField] of Object.entries(mapping)) {
            const fieldDef = fieldMap.get(targetField);
            if (fieldDef && record[sourceField] !== undefined) {
              transformed[targetField] = coerceValue(record[sourceField], fieldDef.type);
            }
          }
        } else {
          for (const fieldDef of fields) {
            if (record[fieldDef.field] !== undefined) {
              transformed[fieldDef.field] = coerceValue(record[fieldDef.field], fieldDef.type);
            }
          }
        }

        // Require an ID for each record
        const id = transformed.id || record.id;
        if (!id) {
          errors.push({ row: i + 1, message: 'Missing ID field' });
          skipped++;
          continue;
        }

        // Validate required fields
        const requiredFields = fields.filter(f => f.required);
        let hasErrors = false;
        for (const reqField of requiredFields) {
          const val = transformed[reqField.field];
          if (val === undefined || val === null || val === '') {
            errors.push({ row: i + 1, message: `Missing required field: ${reqField.label}` });
            hasErrors = true;
          }
        }

        if (hasErrors) {
          skipped++;
          continue;
        }

        // Add import metadata
        transformed.importedAt = new Date().toISOString();
        transformed.importedBy = req.user?.email || 'system';

        batchOps.push({ collection, id: String(id), data: transformed });
      } catch (err: any) {
        errors.push({ row: i + 1, message: err.message || 'Unknown error processing record' });
        skipped++;
      }
    }

    // Write in batches of 500 (Firestore limit)
    try {
      if (batchOps.length > 0) {
        await batchWrite(batchOps);
        imported = batchOps.length;
      }
    } catch (err: any) {
      return res.status(500).json({
        error: 'Firestore batch write failed',
        message: err.message,
        imported: 0,
        skipped: records.length,
        errors,
      });
    }

    res.json({
      imported,
      skipped,
      total: records.length,
      errors: errors.slice(0, 100),
    });
  } catch (err) {
    next(err);
  }
});
