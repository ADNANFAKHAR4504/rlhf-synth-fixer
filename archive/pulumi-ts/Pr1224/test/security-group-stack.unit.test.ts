// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  ec2: {
    SecurityGroup: jest.fn().mockImplementation((name, args) => ({
      id: `mock-sg-id-${name}`,
      name: args.name,
    })),
  },
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
}));

import * as aws from '@pulumi/aws';
import { SecurityGroupStack } from '../lib/stacks/security-group-stack';

describe('SecurityGroupStack Unit Tests', () => {
  let securityGroupStack: SecurityGroupStack;
  const mockVpcId = 'vpc-12345678';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create security group stack with required parameters', () => {
      securityGroupStack = new SecurityGroupStack('test-sg', {
        vpcId: mockVpcId,
      });
      expect(securityGroupStack).toBeDefined();
    });

    it('should create security group stack with custom values', () => {
      securityGroupStack = new SecurityGroupStack('test-sg', {
        environmentSuffix: 'prod',
        vpcId: mockVpcId,
        tags: { Environment: 'prod' },
      });
      expect(securityGroupStack).toBeDefined();
    });
  });

  describe('Security Group Creation', () => {
    beforeEach(() => {
      securityGroupStack = new SecurityGroupStack('test-sg', {
        environmentSuffix: 'test',
        vpcId: mockVpcId,
        tags: { Environment: 'test' },
      });
    });

    it('should create web security group with HTTP/HTTPS access', () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-web-sg-test',
        expect.objectContaining({
          name: 'tap-web-sg-test',
          description: 'Security group for web tier',
          vpcId: mockVpcId,
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTP from anywhere',
            }),
            expect.objectContaining({
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTPS from anywhere',
            }),
          ]),
          tags: expect.objectContaining({
            Name: 'tap-web-sg-test',
            Tier: 'web',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create app security group with restricted access from web tier', () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-app-sg-test',
        expect.objectContaining({
          name: 'tap-app-sg-test',
          description: 'Security group for application tier',
          vpcId: mockVpcId,
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 8080,
              toPort: 8080,
              protocol: 'tcp',
              description: 'App port from web tier',
            }),
          ]),
          tags: expect.objectContaining({
            Name: 'tap-app-sg-test',
            Tier: 'application',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create database security group with restricted access from app tier', () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-db-sg-test',
        expect.objectContaining({
          name: 'tap-db-sg-test',
          description: 'Security group for database tier',
          vpcId: mockVpcId,
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp',
              description: 'MySQL from app tier',
            }),
          ]),
          tags: expect.objectContaining({
            Name: 'tap-db-sg-test',
            Tier: 'database',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create all security groups with outbound rules', () => {
      const securityGroupCalls = (aws.ec2.SecurityGroup as unknown as jest.Mock).mock.calls;
      
      // Check that each security group has restrictive egress rules
      const webSgCall = securityGroupCalls.find(call => call[0].includes('web-sg'));
      expect(webSgCall[1].egress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            description: 'HTTPS outbound for updates and API calls',
          }),
          expect.objectContaining({
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            description: 'HTTP outbound for package updates',
          }),
          expect.objectContaining({
            fromPort: 53,
            toPort: 53,
            protocol: 'udp',
            description: 'DNS resolution',
          }),
        ])
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in security group names', () => {
      const environmentSuffix = 'staging';
      securityGroupStack = new SecurityGroupStack('test-sg', {
        environmentSuffix,
        vpcId: mockVpcId,
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        `tap-web-sg-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-web-sg-${environmentSuffix}`,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        `tap-app-sg-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-app-sg-${environmentSuffix}`,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        `tap-db-sg-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-db-sg-${environmentSuffix}`,
        }),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      securityGroupStack = new SecurityGroupStack('test-sg', {
        environmentSuffix,
        vpcId: mockVpcId,
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-web-sg-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      securityGroupStack = new SecurityGroupStack('test-sg', {
        environmentSuffix: 'test',
        vpcId: mockVpcId,
      });
    });

    it('should implement proper tier isolation', () => {
      const securityGroupCalls = (aws.ec2.SecurityGroup as unknown as jest.Mock).mock.calls;
      
      // Web tier should allow internet access
      const webSgCall = securityGroupCalls.find(call => call[0].includes('web'));
      expect(webSgCall[1].ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ cidrBlocks: ['0.0.0.0/0'] }),
        ])
      );

      // App tier should only allow access from security groups (not CIDR blocks)
      const appSgCall = securityGroupCalls.find(call => call[0].includes('app'));
      expect(appSgCall[1].ingress[0]).toHaveProperty('securityGroups');
      expect(appSgCall[1].ingress[0]).not.toHaveProperty('cidrBlocks');

      // DB tier should only allow access from security groups (not CIDR blocks)
      const dbSgCall = securityGroupCalls.find(call => call[0].includes('db'));
      expect(dbSgCall[1].ingress[0]).toHaveProperty('securityGroups');
      expect(dbSgCall[1].ingress[0]).not.toHaveProperty('cidrBlocks');
    });

    it('should use appropriate ports for each tier', () => {
      const securityGroupCalls = (aws.ec2.SecurityGroup as unknown as jest.Mock).mock.calls;
      
      // Web tier: HTTP (80) and HTTPS (443)
      const webSgCall = securityGroupCalls.find(call => call[0].includes('web'));
      const webPorts = webSgCall[1].ingress.map((rule: any) => rule.fromPort);
      expect(webPorts).toContain(80);
      expect(webPorts).toContain(443);

      // App tier: 8080
      const appSgCall = securityGroupCalls.find(call => call[0].includes('app'));
      expect(appSgCall[1].ingress[0].fromPort).toBe(8080);

      // DB tier: 3306 (MySQL)
      const dbSgCall = securityGroupCalls.find(call => call[0].includes('db'));
      expect(dbSgCall[1].ingress[0].fromPort).toBe(3306);
    });
  });
});
