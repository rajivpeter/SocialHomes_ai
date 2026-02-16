// ============================================================
// SocialHomes.Ai — Firestore Serialization Tests
// Tests serializeFirestoreData handles all Firestore-specific
// types and converts them to plain JSON-safe values.
// ============================================================

import { describe, it, expect, vi } from 'vitest';

// ── Mock @google-cloud/firestore ──
// vi.mock is hoisted, so the factory cannot reference variables defined
// after it in the source. We define everything inline inside the factory.

vi.mock('@google-cloud/firestore', () => {
  class Timestamp {
    _seconds: number;
    _nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
      this._seconds = seconds;
      this._nanoseconds = nanoseconds;
    }
    toDate(): Date {
      return new Date(this._seconds * 1000 + this._nanoseconds / 1_000_000);
    }
    static fromDate(date: Date): Timestamp {
      const seconds = Math.floor(date.getTime() / 1000);
      const nanoseconds = (date.getTime() % 1000) * 1_000_000;
      return new Timestamp(seconds, nanoseconds);
    }
  }

  const mockCollection = () => ({
    doc: () => ({
      get: async () => ({ exists: false }),
      set: async () => undefined,
    }),
    add: async () => ({ id: 'mock-id' }),
  });

  return {
    Firestore: class {
      collection = mockCollection;
    },
    FieldValue: {
      serverTimestamp: () => ({ _methodName: 'FieldValue.serverTimestamp' }),
      increment: (n: number) => ({ _methodName: 'FieldValue.increment', operand: n }),
    },
    Timestamp,
  };
});

// Import the module under test AFTER mock is registered
import { serializeFirestoreData } from './firestore.js';
import { Timestamp } from '@google-cloud/firestore';

// Helper: create Timestamp-like objects using the mocked Timestamp class
function makeTimestamp(seconds: number, nanoseconds = 0) {
  return new (Timestamp as any)(seconds, nanoseconds);
}

// Mock DocumentReference (duck-typed: has _path and _converter)
function makeDocRef(path: string) {
  return { path, _path: path, _converter: {}, constructor: { name: 'DocumentReference' } };
}

// Mock GeoPoint (duck-typed: has latitude/longitude, constructor name)
function makeGeoPoint(latitude: number, longitude: number) {
  const gp = { latitude, longitude };
  Object.defineProperty(gp, 'constructor', { value: { name: 'GeoPoint' }, writable: false, enumerable: false });
  return gp;
}

// ── Tests ──

describe('serializeFirestoreData', () => {
  it('converts Firestore Timestamp to ISO string', () => {
    // 2026-02-16T12:00:00.000Z
    const ts = makeTimestamp(1771243200, 0);
    const result = serializeFirestoreData(ts);

    expect(typeof result).toBe('string');
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    const parsed = new Date(result);
    expect(parsed.getUTCFullYear()).toBe(2026);
  });

  it('converts native Date to ISO string', () => {
    const date = new Date('2026-06-15T10:30:00.000Z');
    const result = serializeFirestoreData(date);

    expect(typeof result).toBe('string');
    expect(result).toBe('2026-06-15T10:30:00.000Z');
  });

  it('handles arrays recursively', () => {
    const ts1 = makeTimestamp(1771243200, 0);
    const ts2 = makeTimestamp(1771329600, 0);
    const input = [ts1, 'hello', 42, ts2];

    const result = serializeFirestoreData(input);

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(4);
    expect(typeof result[0]).toBe('string');
    expect(result[1]).toBe('hello');
    expect(result[2]).toBe(42);
    expect(typeof result[3]).toBe('string');
  });

  it('handles nested objects recursively', () => {
    const ts = makeTimestamp(1771243200, 0);
    const input = {
      name: 'Test Property',
      address: {
        line1: '10 Downing Street',
        city: 'London',
        createdAt: ts,
      },
      value: 250000,
    };

    const result = serializeFirestoreData(input);

    expect(result.name).toBe('Test Property');
    expect(result.address.line1).toBe('10 Downing Street');
    expect(result.address.city).toBe('London');
    expect(typeof result.address.createdAt).toBe('string');
    expect(result.value).toBe(250000);
  });

  it('handles null values', () => {
    const result = serializeFirestoreData(null);
    expect(result).toBeNull();
  });

  it('handles undefined values', () => {
    const result = serializeFirestoreData(undefined);
    expect(result).toBeUndefined();
  });

  it('passes through primitive values unchanged', () => {
    expect(serializeFirestoreData('hello')).toBe('hello');
    expect(serializeFirestoreData(42)).toBe(42);
    expect(serializeFirestoreData(true)).toBe(true);
    expect(serializeFirestoreData(0)).toBe(0);
    expect(serializeFirestoreData('')).toBe('');
  });

  it('converts DocumentReference to path string', () => {
    const docRef = makeDocRef('properties/prop-001');
    const result = serializeFirestoreData(docRef);

    expect(typeof result).toBe('string');
    expect(result).toBe('properties/prop-001');
  });

  it('converts GeoPoint to {latitude, longitude} object', () => {
    const geoPoint = makeGeoPoint(51.4720, -0.0590);
    const result = serializeFirestoreData(geoPoint);

    expect(result).toEqual({
      latitude: 51.4720,
      longitude: -0.0590,
    });
  });

  it('handles deeply nested mixed structures', () => {
    const ts = makeTimestamp(1771243200, 0);

    const input = {
      id: 'prop-001',
      history: [
        { action: 'created', when: ts, by: 'admin' },
        { action: 'updated', when: new Date('2026-03-01T00:00:00Z'), by: 'system' },
      ],
      metadata: {
        nested: {
          deep: {
            timestamp: ts,
            value: null,
          },
        },
      },
    };

    const result = serializeFirestoreData(input);

    expect(result.id).toBe('prop-001');
    expect(result.history).toHaveLength(2);
    expect(typeof result.history[0].when).toBe('string');
    expect(result.history[0].by).toBe('admin');
    expect(typeof result.history[1].when).toBe('string');
    expect(result.metadata.nested.deep.value).toBeNull();
    expect(typeof result.metadata.nested.deep.timestamp).toBe('string');
  });

  it('handles object with null fields inside arrays', () => {
    const input = [
      { name: 'Alice', phone: null },
      { name: 'Bob', phone: '07700900000' },
      null,
    ];

    const result = serializeFirestoreData(input);

    expect(result).toHaveLength(3);
    expect(result[0].phone).toBeNull();
    expect(result[1].phone).toBe('07700900000');
    expect(result[2]).toBeNull();
  });

  it('handles empty arrays and objects', () => {
    expect(serializeFirestoreData([])).toEqual([]);
    expect(serializeFirestoreData({})).toEqual({});
  });
});
