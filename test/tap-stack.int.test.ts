import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Outputs', () => {
  const outputsPath = path.resolve(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  let outputs: Record<string, unknown>;

  beforeAll(() => {
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Expected outputs file at ${outputsPath}`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  it('contains VpcId and VpcCidr outputs', () => {
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('VpcCidr');
    expect(typeof outputs.VpcId).toBe('string');
    expect(typeof outputs.VpcCidr).toBe('string');
  });

  it('VpcId matches AWS format', () => {
    const vpcId = outputs.VpcId as string;
    expect(vpcId).toMatch(/^vpc-[0-9a-f]{8,}$/);
  });

  it('VpcCidr is a valid CIDR block', () => {
    const cidr = outputs.VpcCidr as string;
    const cidrParts = cidr.split('/');
    expect(cidrParts).toHaveLength(2);

    const [ip, prefixStr] = cidrParts;
    const octets = ip.split('.').map((octet) => Number(octet));
    expect(octets).toHaveLength(4);
    octets.forEach((octet) => {
      expect(Number.isInteger(octet)).toBe(true);
      expect(octet).toBeGreaterThanOrEqual(0);
      expect(octet).toBeLessThanOrEqual(255);
    });

    const prefix = Number(prefixStr);
    expect(Number.isInteger(prefix)).toBe(true);
    expect(prefix).toBeGreaterThanOrEqual(8);
    expect(prefix).toBeLessThanOrEqual(28);
  });

  it('VpcCidr resides within the 10.0.0.0/8 private range', () => {
    const cidr = outputs.VpcCidr as string;
    const [ip] = cidr.split('/');
    const firstOctet = Number(ip.split('.')[0]);
    expect(firstOctet).toBe(10);
  });

  it('VpcCidr offers at least 65,536 IP addresses', () => {
    const cidr = outputs.VpcCidr as string;
    const prefix = Number(cidr.split('/')[1]);
    const availableAddresses = Math.pow(2, 32 - prefix);
    expect(availableAddresses).toBeGreaterThanOrEqual(65_536);
  });
});
