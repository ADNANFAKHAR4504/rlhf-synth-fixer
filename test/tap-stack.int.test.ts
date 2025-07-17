// Configuration - These are coming from cdk-outputs after cdk deploy
import fs from 'fs';
const outputs = JSON.parse(
  fs.readFileSync('cdk-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  test('VPC Outputs should exist for both regions', () => {
    expect(outputs.VpcIdR1).toBeDefined();
    expect(outputs.VpcIdR2).toBeDefined();
  });

  test('EC2 Instances should exist for both regions', () => {
    expect(outputs.EC2InstanceR1Id).toBeDefined();
    expect(outputs.EC2InstanceR2Id).toBeDefined();
  });

  test('RDS Instances should exist for both regions', () => {
    expect(outputs.RDSInstanceR1Id).toBeDefined();
    expect(outputs.RDSInstanceR2Id).toBeDefined();
  });

  test('Subnets should exist for both regions', () => {
    [
      'PublicSubnet1R1Id', 'PublicSubnet2R1Id', 'PrivateSubnet1R1Id', 'PrivateSubnet2R1Id',
      'PublicSubnet1R2Id', 'PublicSubnet2R2Id', 'PrivateSubnet1R2Id', 'PrivateSubnet2R2Id'
    ].forEach(subnetIdKey => {
      expect(outputs[subnetIdKey]).toBeDefined();
    });
  });

  test('NAT Gateways and EIPs should exist for both regions', () => {
    expect(outputs.NatGatewayR1Id).toBeDefined();
    expect(outputs.NatGatewayR2Id).toBeDefined();
    expect(outputs.NatEIPR1Id).toBeDefined();
    expect(outputs.NatEIPR2Id).toBeDefined();
  });

  test('Route Tables should exist for both regions', () => {
    expect(outputs.PublicRouteTableR1Id).toBeDefined();
    expect(outputs.PublicRouteTableR2Id).toBeDefined();
    expect(outputs.PrivateRouteTableR1Id).toBeDefined();
    expect(outputs.PrivateRouteTableR2Id).toBeDefined();
  });

  test('Security Groups should exist for both regions', () => {
    expect(outputs.ELBSecurityGroupR1Id).toBeDefined();
    expect(outputs.AppSecurityGroupR1Id).toBeDefined();
    expect(outputs.ELBSecurityGroupR2Id).toBeDefined();
    expect(outputs.AppSecurityGroupR2Id).toBeDefined();
  });

  // Add more integration tests as needed for your stack's outputs
});
