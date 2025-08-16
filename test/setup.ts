import { jest } from '@jest/globals';

// Mock AWS SDK modules that might be used in tests
jest.mock('@aws-sdk/client-ec2', () => ({
  EC2Client: jest.fn(),
  DescribeVpcsCommand: jest.fn(),
  DescribeSecurityGroupsCommand: jest.fn(),
  DescribeSubnetsCommand: jest.fn(),
}));

// Set test timeout for integration tests
jest.setTimeout(180000);