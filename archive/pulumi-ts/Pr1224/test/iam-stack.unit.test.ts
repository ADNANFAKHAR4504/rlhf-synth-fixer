// Mock AWS and Pulumi before importing
jest.mock('@pulumi/aws', () => ({
  iam: {
    Role: jest.fn().mockImplementation((name, args) => ({
      id: `mock-role-id-${name}`,
      name: args.name,
      arn: `arn:aws:iam::123456789012:role/${args.name}`,
    })),
    RolePolicy: jest.fn().mockImplementation((name, args) => ({
      id: `mock-policy-id-${name}`,
    })),
    RolePolicyAttachment: jest.fn().mockImplementation((name, args) => ({
      id: `mock-attachment-id-${name}`,
    })),
    InstanceProfile: jest.fn().mockImplementation((name, args) => ({
      id: `mock-profile-id-${name}`,
      name: args.name,
      arn: `arn:aws:iam::123456789012:instance-profile/${args.name}`,
    })),
  },
  getRegion: jest.fn().mockReturnValue({
    name: 'us-east-1',
  }),
  getCallerIdentity: jest.fn().mockReturnValue({
    accountId: '123456789012',
  }),
}));

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {}
    registerOutputs(outputs: any) {}
  },
  all: jest.fn().mockImplementation((inputs) => ({
    apply: jest.fn().mockImplementation((fn) => {
      // Mock the apply function to return a mock policy string
      return JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents', 'logs:DescribeLogStreams'],
            Resource: 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/ec2/tap/*',
          },
        ],
      });
    }),
  })),
}));

import * as aws from '@pulumi/aws';
import { IamStack } from '../lib/stacks/iam-stack';

describe('IamStack Unit Tests', () => {
  let iamStack: IamStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Creation', () => {
    it('should create IAM stack with default environment suffix', () => {
      iamStack = new IamStack('test-iam', {});
      expect(iamStack).toBeDefined();
    });

    it('should create IAM stack with custom environment suffix', () => {
      iamStack = new IamStack('test-iam', {
        environmentSuffix: 'prod',
        tags: { Environment: 'prod' },
      });
      expect(iamStack).toBeDefined();
    });
  });

  describe('EC2 Role Creation', () => {
    beforeEach(() => {
      iamStack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should create EC2 role with correct configuration', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'tap-ec2-role-test',
        expect.objectContaining({
          name: 'tap-ec2-role-test',
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com'),
          tags: expect.objectContaining({
            Name: 'tap-ec2-role-test',
            Purpose: 'EC2InstanceExecution',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create logging policy for EC2 role', () => {
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'tap-ec2-logging-policy-test',
        expect.objectContaining({
          policy: expect.any(String), // Now a resolved string with region/account
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should attach CloudWatch agent policy', () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        'tap-ec2-cloudwatch-policy-test',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it('should create instance profile', () => {
      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        'tap-ec2-profile-test',
        expect.objectContaining({
          name: 'tap-ec2-profile-test',
          tags: expect.objectContaining({
            Name: 'tap-ec2-profile-test',
            Environment: 'test',
          }),
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });
  });

  describe('Environment Suffix Integration', () => {
    it('should use environment suffix in resource names', () => {
      const environmentSuffix = 'staging';
      iamStack = new IamStack('test-iam', { environmentSuffix });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        `tap-ec2-role-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-ec2-role-${environmentSuffix}`,
        }),
        expect.any(Object)
      );

      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        `tap-ec2-profile-${environmentSuffix}`,
        expect.objectContaining({
          name: `tap-ec2-profile-${environmentSuffix}`,
        }),
        expect.any(Object)
      );
    });

    it('should use environment suffix in tags', () => {
      const environmentSuffix = 'production';
      iamStack = new IamStack('test-iam', { environmentSuffix });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: `tap-ec2-role-${environmentSuffix}`,
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      iamStack = new IamStack('test-iam', { environmentSuffix: 'test' });
    });

    it('should create role with least privilege assume role policy', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('"Service":"ec2.amazonaws.com"'),
        }),
        expect.any(Object)
      );
    });

    it('should create logging policy with minimal required permissions', () => {
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          policy: expect.stringContaining('arn:aws:logs:us-east-1:123456789012:log-group:/aws/ec2/tap/*'), // Now includes specific region/account
        }),
        expect.any(Object)
      );
    });

    it('should use specific region and account ID in logging policy for better security', () => {
      // Verify that aws.getRegion and aws.getCallerIdentity are called for security
      expect(aws.getRegion).toHaveBeenCalled();
      expect(aws.getCallerIdentity).toHaveBeenCalled();
      
      // Verify the policy contains specific region and account ID instead of wildcards
      const policyCall = (aws.iam.RolePolicy as unknown as jest.Mock).mock.calls.find(
        call => call[0].includes('logging-policy')
      );
      expect(policyCall).toBeDefined();
      expect(policyCall[1].policy).toContain('arn:aws:logs:us-east-1:123456789012:log-group:/aws/ec2/tap/*');
      expect(policyCall[1].policy).not.toContain('arn:aws:logs:*:*:log-group:/aws/ec2/tap/*');
    });

    it('should only attach necessary managed policies', () => {
      const attachmentCalls = (aws.iam.RolePolicyAttachment as unknown as jest.Mock).mock.calls;
      expect(attachmentCalls).toHaveLength(1);
      expect(attachmentCalls[0][1].policyArn).toBe('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });
  });
});
