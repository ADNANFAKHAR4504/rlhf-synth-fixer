import fs from 'fs';
import path from 'path';

// --- Configuration ---
const PROJECT_NAME = 'TapStack'; 

const outputsFilePath = 'cfn-outputs/flat-outputs.json';
let outputs: any;

try {
  const outputsContent = fs.readFileSync(outputsFilePath, 'utf8');
  outputs = JSON.parse(outputsContent);
  console.log(`✅ Successfully loaded outputs from: ${outputsFilePath}`);
} catch (error) {
  console.error(`❌ Error reading or parsing outputs file: ${outputsFilePath}`);
  console.error(`Please ensure the file exists and is valid JSON before running integration tests.`);
  console.error(`Error details:`, error);
  process.exit(1);
}

// --- Test Suite ---
describe('CloudFormation Stack Outputs Verification (Post-Deployment)', () => {

  test('should have a valid VpcId output', () => {
    const vpcId = outputs.VpcId;
    expect(vpcId).toBeDefined();
    expect(typeof vpcId).toBe('string');
    expect(vpcId).toMatch(/^vpc-[0-9a-f]{17}$/);
  });

  test('should have valid PublicSubnetIds output', () => {
    const publicSubnets = outputs.PublicSubnetIds;
    expect(publicSubnets).toBeDefined();
    expect(typeof publicSubnets).toBe('string');
    
    const subnetArray = publicSubnets.split(',');
    expect(subnetArray).toHaveLength(2);
    
    // Fixed: Added explicit string type for subnetId
    subnetArray.forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[0-9a-f]{17}$/);
    });
  });

  test('should have valid PrivateSubnetIds output', () => {
    const privateSubnets = outputs.PrivateSubnetIds;
    expect(privateSubnets).toBeDefined();
    expect(typeof privateSubnets).toBe('string');
    
    const subnetArray = privateSubnets.split(',');
    expect(subnetArray).toHaveLength(2);
    
    // Fixed: Added explicit string type for subnetId
    subnetArray.forEach((subnetId: string) => {
      expect(subnetId).toMatch(/^subnet-[0-9a-f]{17}$/);
    });
  });

  test.each([
    'AlbSecurityGroupId',
    'AppSecurityGroupId',
    'DbSecurityGroupId',
  ])('should have a valid %s output', (outputName) => {
    const sgId = outputs[outputName];
    expect(sgId).toBeDefined();
    expect(typeof sgId).toBe('string');
    expect(sgId).toMatch(/^sg-[0-9a-f]{17}$/);
  });

  test('should have a valid DbSubnetGroupName output', () => {
    const dbSubnetGroup = outputs.DbSubnetGroupName;
    expect(dbSubnetGroup).toBeDefined();
    expect(typeof dbSubnetGroup).toBe('string');
    expect(dbSubnetGroup).toContain(PROJECT_NAME.toLowerCase());
  });

  test('should have a valid Ec2InstanceRoleArn output', () => {
    const roleArn = outputs.Ec2InstanceRoleArn;
    expect(roleArn).toBeDefined();
    expect(typeof roleArn).toBe('string');
    expect(roleArn).toMatch(/^arn:aws:iam::\d{12}:role\/.*$/);
    expect(roleArn).toContain(PROJECT_NAME);
  });

  test('should have a valid NatEipR1PublicIp output', () => {
    const publicIp = outputs.NatEipR1PublicIp;
    expect(publicIp).toBeDefined();
    expect(typeof publicIp).toBe('string');
    expect(publicIp).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/);
  });

  test('should have a valid NatEipR1AllocationId output', () => {
    const allocId = outputs.NatEipR1AllocationId;
    expect(allocId).toBeDefined();
    expect(typeof allocId).toBe('string');
    expect(allocId).toMatch(/^eipalloc-[0-9a-f]{17}$/);
  });
});