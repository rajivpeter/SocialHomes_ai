// ============================================================
// SocialHomes.Ai — Mock Service Endpoints
// Simulated endpoints for Tier 3 services not yet integrated:
// DWP Universal Credit, IoT Sensors, GoCardless, NOMIS.
// These provide realistic responses for demo/development.
// ============================================================

// ── DWP Universal Credit (simulated) ──
export interface UcVerification {
  tenantId: string;
  nino: string;
  ucStatus: 'active' | 'pending' | 'transitioning' | 'not-applicable' | 'managed-payment';
  monthlyAmount: number;
  housingElement: number;
  paymentDate: string;
  directPaymentToLandlord: boolean;
  lastVerified: string;
}

export function mockUcVerification(tenantId: string): UcVerification {
  const statuses: UcVerification['ucStatus'][] = ['active', 'pending', 'transitioning', 'managed-payment', 'not-applicable'];
  const status = statuses[Math.abs(hashCode(tenantId)) % statuses.length];
  const isActive = status === 'active' || status === 'managed-payment';

  return {
    tenantId,
    nino: `QQ${String(Math.abs(hashCode(tenantId)) % 1000000).padStart(6, '0')}C`,
    ucStatus: status,
    monthlyAmount: isActive ? 300 + Math.round(Math.abs(hashCode(tenantId + 'amt')) % 800) : 0,
    housingElement: isActive ? 400 + Math.round(Math.abs(hashCode(tenantId + 'he')) % 600) : 0,
    paymentDate: isActive ? `2026-03-${String(7 + Math.abs(hashCode(tenantId + 'pd')) % 21).padStart(2, '0')}` : '',
    directPaymentToLandlord: status === 'managed-payment',
    lastVerified: new Date().toISOString(),
  };
}

// ── IoT Sensor Data (simulated) ──
export interface IoTSensorReading {
  propertyId: string;
  sensorId: string;
  location: string;
  readings: {
    temperature: number;
    humidity: number;
    dewPoint: number;
    co2Level: number;
    pressure: number;
  };
  alerts: { type: string; severity: 'info' | 'warning' | 'critical'; message: string }[];
  batteryLevel: number;
  lastReading: string;
}

export function mockIoTSensorData(propertyId: string): IoTSensorReading[] {
  const seed = Math.abs(hashCode(propertyId));
  const numSensors = 2 + (seed % 3);
  const locations = ['Living Room', 'Bedroom 1', 'Bedroom 2', 'Kitchen', 'Bathroom'];

  return Array.from({ length: numSensors }, (_, i) => {
    const locSeed = Math.abs(hashCode(propertyId + i));
    const temp = 16 + (locSeed % 8);
    const humidity = 45 + (locSeed % 40);
    const dewPoint = temp - 4 - (locSeed % 8);
    const co2 = 400 + (locSeed % 600);

    const alerts: IoTSensorReading['alerts'] = [];
    if (humidity > 70) alerts.push({ type: 'high-humidity', severity: 'warning', message: `Humidity at ${humidity}% — ventilation needed` });
    if (humidity > 85) alerts.push({ type: 'critical-humidity', severity: 'critical', message: `Humidity at ${humidity}% — mould growth risk` });
    if (temp < 18) alerts.push({ type: 'low-temperature', severity: 'info', message: `Temperature ${temp}°C — below recommended 18°C` });
    if (co2 > 800) alerts.push({ type: 'high-co2', severity: 'warning', message: `CO2 at ${co2}ppm — room needs ventilation` });

    return {
      propertyId,
      sensorId: `SENSOR-${propertyId.slice(-4)}-${i + 1}`,
      location: locations[i % locations.length],
      readings: {
        temperature: temp,
        humidity,
        dewPoint,
        co2Level: co2,
        pressure: 1010 + (locSeed % 20),
      },
      alerts,
      batteryLevel: 60 + (locSeed % 40),
      lastReading: new Date(Date.now() - (locSeed % 3600) * 1000).toISOString(),
    };
  });
}

// ── GoCardless Direct Debit (simulated) ──
export interface DirectDebitMandate {
  tenantId: string;
  mandateId: string;
  status: 'active' | 'pending' | 'cancelled' | 'failed';
  accountName: string;
  sortCode: string;
  accountNumberLast4: string;
  amount: number;
  frequency: 'weekly' | 'fortnightly' | 'monthly';
  nextPaymentDate: string;
  createdAt: string;
}

export function mockGoCardlessMandate(tenantId: string, weeklyRent: number): DirectDebitMandate {
  const seed = Math.abs(hashCode(tenantId));
  const statuses: DirectDebitMandate['status'][] = ['active', 'active', 'active', 'pending', 'cancelled'];
  const frequencies: DirectDebitMandate['frequency'][] = ['monthly', 'weekly', 'fortnightly'];

  const freq = frequencies[seed % frequencies.length];
  const amount = freq === 'monthly' ? weeklyRent * 4.33 : freq === 'fortnightly' ? weeklyRent * 2 : weeklyRent;

  return {
    tenantId,
    mandateId: `MD-${String(seed % 100000).padStart(5, '0')}`,
    status: statuses[seed % statuses.length],
    accountName: 'Mr/Mrs Tenant',
    sortCode: `${String(10 + seed % 90).padStart(2, '0')}-${String(seed % 100).padStart(2, '0')}-${String(seed % 100).padStart(2, '0')}`,
    accountNumberLast4: String(seed % 10000).padStart(4, '0'),
    amount: Math.round(amount * 100) / 100,
    frequency: freq,
    nextPaymentDate: `2026-03-${String(1 + seed % 28).padStart(2, '0')}`,
    createdAt: '2025-06-15T00:00:00.000Z',
  };
}

// ── NOMIS Labour Market (simulated) ──
export interface NomisLMIData {
  lsoaCode: string;
  economicActivity: {
    employmentRate: number;
    unemploymentRate: number;
    economicInactivityRate: number;
  };
  occupations: { name: string; percentage: number }[];
  averageWeeklyEarnings: number;
  benefitClaimants: {
    jsaRate: number;
    ucRate: number;
    esaRate: number;
  };
  qualifications: {
    noQualifications: number;
    level1: number;
    level2: number;
    level3: number;
    level4Plus: number;
  };
  lastUpdated: string;
}

export function mockNomisData(lsoaCode: string): NomisLMIData {
  const seed = Math.abs(hashCode(lsoaCode));
  const deprivation = (seed % 10) / 10; // 0-1 proxy for deprivation

  return {
    lsoaCode,
    economicActivity: {
      employmentRate: Math.round((75 - deprivation * 20) * 10) / 10,
      unemploymentRate: Math.round((4 + deprivation * 8) * 10) / 10,
      economicInactivityRate: Math.round((20 + deprivation * 12) * 10) / 10,
    },
    occupations: [
      { name: 'Professional', percentage: Math.round((25 - deprivation * 15) * 10) / 10 },
      { name: 'Associate Professional', percentage: Math.round((15 - deprivation * 5) * 10) / 10 },
      { name: 'Skilled Trades', percentage: Math.round((10 + deprivation * 5) * 10) / 10 },
      { name: 'Elementary Occupations', percentage: Math.round((10 + deprivation * 10) * 10) / 10 },
    ],
    averageWeeklyEarnings: Math.round(450 - deprivation * 150),
    benefitClaimants: {
      jsaRate: Math.round((1 + deprivation * 4) * 10) / 10,
      ucRate: Math.round((5 + deprivation * 15) * 10) / 10,
      esaRate: Math.round((3 + deprivation * 8) * 10) / 10,
    },
    qualifications: {
      noQualifications: Math.round((8 + deprivation * 15) * 10) / 10,
      level1: Math.round((12 + deprivation * 5) * 10) / 10,
      level2: Math.round(15 * 10) / 10,
      level3: Math.round((15 - deprivation * 3) * 10) / 10,
      level4Plus: Math.round((35 - deprivation * 20) * 10) / 10,
    },
    lastUpdated: new Date().toISOString(),
  };
}

// ── Utility ──
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash;
}
