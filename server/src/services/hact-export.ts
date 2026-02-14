// ============================================================
// HACT v3.5 Export Service
// Converts Firestore documents to HACT-compliant JSON
// ============================================================

import { collections, getDoc } from './firestore.js';
import { appToHact, appToLabel } from '../models/hact-codes.js';
import type { PropertyDoc, TenantDoc, CaseDoc } from '../models/firestore-schemas.js';

export async function exportPropertyAsHact(propertyId: string) {
  const property = await getDoc<PropertyDoc>(collections.properties, propertyId);
  if (!property) return null;

  return {
    '$schema': 'http://www.oscre.org/ns/referencedatamodel/PropertyTypes',
    PropertyType: {
      PropertyPrimaryTypeCode: '07-00-00', // Housing
      PropertySubtypeCode: [appToHact('PropertySubtypeCode', property.type) || '07-01-00'],
    },
    PhysicalCharacteristics: [{
      ConstructionMethodCode: property.hact?.constructionMethodCode || appToHact('ConstructionMethodCode', 'brick'),
      FormCode: property.hact?.propertyPhysicalFormCode || appToHact('PropertyPhysicalFormCode', 'purpose-built'),
      Adjacency: property.hact?.propertyAdjacencyCode || '40',
    }],
    Unit: [{
      InterestTenureType: appToHact('TenureTypeCode', property.tenureType) || '100',
      PhysicalCharacteristics: {
        NumberOfSingleBedrooms: Math.max(0, property.bedrooms - 1),
        NumberOfDoubleBedrooms: Math.min(property.bedrooms, 1),
      },
    }],
    UPRN: property.uprn,
    Address: {
      BuildingNumber: property.address.split(' ')[0],
      StreetName: property.address.split(' ').slice(1).join(' '),
      PostalCode: property.postcode,
    },
  };
}

export async function exportTenantAsHact(tenantId: string) {
  const tenant = await getDoc<TenantDoc>(collections.tenants, tenantId);
  if (!tenant) return null;

  return {
    '$schema': 'http://www.oscre.org/ns/referencedatamodel/CustomerData',
    PersonName: {
      Title: tenant.title,
      GivenName: tenant.firstName,
      FamilyName: tenant.lastName,
    },
    DateOfBirth: tenant.dob,
    Communication: [
      {
        Channel: {
          Code: appToHact('CommunicationChannelCode', 'email') || '20',
        },
        Value: tenant.email,
      },
      {
        Channel: {
          Code: appToHact('CommunicationChannelCode', 'phone') || '10',
        },
        Value: tenant.phone,
      },
    ],
    ContactPreferences: {
      PreferredChannel: appToHact('CommunicationChannelCode', tenant.communicationPreference) || '20',
    },
    PaymentMethod: {
      Code: appToHact('PaymentMethodCode', tenant.paymentMethod) || '10',
      Label: appToLabel('PaymentMethodCode', tenant.paymentMethod),
    },
    TenancyDetails: {
      TenancyId: tenant.tenancyId,
      StartDate: tenant.tenancyStartDate,
      TenureTypeCode: appToHact('TenureTypeCode', tenant.tenancyType) || '100',
      PropertyUPRN: tenant.propertyId,
    },
    Household: tenant.household.map((m: any) => ({
      Name: m.name,
      Relationship: m.relationship,
      DateOfBirth: m.dob,
      IsDependent: m.isDependent,
    })),
  };
}

export async function exportCaseAsHact(caseId: string) {
  const caseDoc = await getDoc<CaseDoc>(collections.cases, caseId);
  if (!caseDoc) return null;

  if (caseDoc.type === 'repair') {
    return {
      '$schema': 'http://www.oscre.org/ns/referencedatamodel/RaiseRepair-M3SoR-v7',
      WorkOrder: {
        Reference: caseDoc.reference,
        Description: caseDoc.description,
        Priority: caseDoc.priority,
        SORCode: caseDoc.sorCode,
        Trade: caseDoc.trade,
        Status: caseDoc.status,
        RaisedDate: caseDoc.createdDate,
        TargetDate: caseDoc.targetDate,
        CompletionDate: caseDoc.completionDate,
        Cost: caseDoc.cost,
        PropertyUPRN: caseDoc.propertyId,
        TenantReference: caseDoc.tenantId,
      },
    };
  }

  if (caseDoc.type === 'complaint') {
    return {
      '$schema': 'http://www.oscre.org/ns/referencedatamodel/ComplaintCaseFile',
      Complaint: {
        Reference: caseDoc.reference,
        Stage: caseDoc.stage,
        Category: caseDoc.category,
        Description: caseDoc.description,
        Status: caseDoc.status,
        RaisedDate: caseDoc.createdDate,
        AcknowledgeDeadline: caseDoc.acknowledgeDeadline,
        ResponseDeadline: caseDoc.responseDeadline,
        Finding: caseDoc.finding,
        Remedy: caseDoc.remedy,
        Compensation: caseDoc.compensation,
        OmbudsmanEscalation: caseDoc.ombudsmanEscalation,
        TenantReference: caseDoc.tenantId,
        PropertyUPRN: caseDoc.propertyId,
      },
    };
  }

  // Generic case export
  return {
    Case: {
      Reference: caseDoc.reference,
      Type: caseDoc.type,
      Description: caseDoc.description,
      Status: caseDoc.status,
      Priority: caseDoc.priority,
      RaisedDate: caseDoc.createdDate,
      TenantReference: caseDoc.tenantId,
      PropertyUPRN: caseDoc.propertyId,
    },
  };
}

export async function bulkExport(entityType: string, ids?: string[]) {
  const results: any[] = [];

  if (entityType === 'properties') {
    const docs = ids
      ? await Promise.all(ids.map(id => exportPropertyAsHact(id)))
      : (await collections.properties.get()).docs.map(d => d.id).slice(0, 100);
    if (Array.isArray(docs) && typeof docs[0] === 'string') {
      for (const id of docs as unknown as string[]) {
        const exported = await exportPropertyAsHact(id);
        if (exported) results.push(exported);
      }
    } else {
      return docs.filter(Boolean);
    }
  }

  return results;
}
