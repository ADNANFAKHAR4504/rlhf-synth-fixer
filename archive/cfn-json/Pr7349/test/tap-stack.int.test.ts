import fs from 'fs';
import path from 'path';

describe('Integration Tests', () => {
  let outputs: any;

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
  });

  test('should have all required outputs', () => {
    expect(outputs).toBeDefined();
    expect(outputs.VPCId).toBeDefined();
    expect(outputs.PublicSubnets).toBeDefined();
    expect(outputs.PrivateSubnets).toBeDefined();
    expect(outputs.EKSClusterName).toBeDefined();
    expect(outputs.EnvironmentSuffix).toBeDefined();
  });

  test('VPC ID should be a valid AWS VPC ID format', () => {
    expect(outputs.VPCId).toMatch(/^vpc-[0-9a-f]+$/);
  });

  test('Public Subnets should be a comma-separated list', () => {
    expect(outputs.PublicSubnets).toBeDefined();
    expect(typeof outputs.PublicSubnets).toBe('string');
    expect(outputs.PublicSubnets.split(',')).toHaveLength(3);
  });

  test('Private Subnets should be a comma-separated list', () => {
    expect(outputs.PrivateSubnets).toBeDefined();
    expect(typeof outputs.PrivateSubnets).toBe('string');
    expect(outputs.PrivateSubnets.split(',')).toHaveLength(3);
  });

  test('EKS Cluster Name should include environment suffix', () => {
    expect(outputs.EKSClusterName).toContain(outputs.EnvironmentSuffix);
  });

  test('OIDC Issuer URL should be a valid HTTPS URL', () => {
    expect(outputs.OIDCIssuerURL).toMatch(/^https:\/\//);
  });

  test('Node Group Name should include environment suffix', () => {
    expect(outputs.NodeGroupName).toContain(outputs.EnvironmentSuffix);
  });

  test('Cluster Security Group ID should be a valid AWS SG ID format', () => {
    expect(outputs.ClusterSecurityGroupId).toMatch(/^sg-[0-9a-f]+$/);
  });

  test('Environment Suffix should be a string', () => {
    expect(typeof outputs.EnvironmentSuffix).toBe('string');
    expect(outputs.EnvironmentSuffix.length).toBeGreaterThan(0);
  });

  test('Node Group ARN should have correct format', () => {
    expect(outputs.NodeGroupArn).toMatch(/^arn:aws:eks/);
  });

  test('EKS Cluster Endpoint should be a valid HTTPS URL', () => {
    expect(outputs.EKSClusterEndpoint).toMatch(/^https:\/\//);
  });

  test('EKS Cluster ARN should have correct format', () => {
    expect(outputs.EKSClusterArn).toMatch(/^arn:aws:eks/);
  });
});
