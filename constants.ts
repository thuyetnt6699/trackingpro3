import { Carrier } from './types';

// Provided API Key
export const TRACKING_MORE_API_KEY = 'u84jhs7u-c3em-42ro-4r72-63idxaxliyrg';

// Common Chinese Carriers
export const CHINA_CARRIERS: Carrier[] = [
  { name: 'SF Express (Thuận Phong)', code: 'sf-express' },
  { name: 'Debon (Deppon)', code: 'deppon' },
  { name: 'ZTO Express', code: 'zto' },
  { name: 'YTO Express', code: 'yto' },
  { name: 'STO Express', code: 'sto' },
  { name: 'Yunda Express', code: 'yunda' },
  { name: 'China EMS', code: 'china-ems' },
  { name: 'J&T Express China', code: 'jtexpress' },
  { name: 'Best Express', code: 'bestex' },
];

export const MOCK_DELAY = 800; // ms to simulate network