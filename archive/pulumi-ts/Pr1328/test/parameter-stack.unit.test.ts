import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ParameterStack } from '../lib/parameter-stack';
import { RdsStack } from '../lib/rds-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('ParameterStack', () => {
  let stack: ParameterStack;
  const mockParameter = {
    name: pulumi.Output.create('/tap/test/database/test'),
    arn: pulumi.Output.create(
      'arn:aws:ssm:us-west-2:123456789012:parameter/tap/test/database/test'
    ),
  };

  const mockRdsStack = {
    dbEndpoint: pulumi.Output.create('db.example.com:3306'),
    dbInstance: { id: pulumi.Output.create('db-instance-id') },
  } as unknown as RdsStack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS SSM Parameter
    jest
      .spyOn(aws.ssm, 'Parameter')
      .mockImplementation((() => mockParameter) as any);
  });

  describe('constructor', () => {
    it('should create database endpoint parameter', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-endpoint-param-test'),
        expect.objectContaining({
          name: '/tap/test/database/endpoint',
          type: 'String',
          value: mockRdsStack.dbEndpoint,
          description: 'RDS database endpoint',
          tier: 'Standard',
          allowedPattern: '^[a-zA-Z0-9\\.:-]+$',
          tags: expect.objectContaining({
            Name: 'tap-db-endpoint-param-test',
            Component: 'Database',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create database username parameter', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-username-param-test'),
        expect.objectContaining({
          name: '/tap/test/database/username',
          type: 'String',
          value: 'admin',
          description: 'RDS database username',
          tier: 'Standard',
          tags: expect.objectContaining({
            Name: 'tap-db-username-param-test',
            Component: 'Database',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create database password parameter as SecureString', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-password-param-test'),
        expect.objectContaining({
          name: '/tap/test/database/password',
          type: 'SecureString',
          value: 'changeme123!',
          description: 'RDS database password (encrypted)',
          tier: 'Standard',
          keyId: 'alias/aws/ssm',
          tags: expect.objectContaining({
            Name: 'tap-db-password-param-test',
            Component: 'Database',
            Sensitive: 'true',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create database name parameter', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-name-param-test'),
        expect.objectContaining({
          name: '/tap/test/database/name',
          type: 'String',
          value: 'tapapp',
          description: 'RDS database name',
          tier: 'Standard',
          tags: expect.objectContaining({
            Name: 'tap-db-name-param-test',
            Component: 'Database',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create all four parameters', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledTimes(4);
    });

    it('should use default environment suffix when not provided', () => {
      stack = new ParameterStack('test-params', {
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-endpoint-param-dev'),
        expect.objectContaining({
          name: '/tap/dev/database/endpoint',
        }),
        expect.any(Object)
      );
    });

    it('should expose all parameter objects', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(stack.dbEndpointParam).toBeDefined();
      expect(stack.dbUsernameParam).toBeDefined();
      expect(stack.dbPasswordParam).toBeDefined();
      expect(stack.dbNameParam).toBeDefined();
    });

    it('should use KMS encryption for password parameter', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        expect.stringContaining('tap-db-password-param-test'),
        expect.objectContaining({
          type: 'SecureString',
          keyId: 'alias/aws/ssm',
        }),
        expect.any(Object)
      );
    });

    it('should add sensitive tag to password parameter', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      const passwordParamCall = (
        aws.ssm.Parameter as unknown as jest.Mock
      ).mock.calls.find(call => call[0].includes('tap-db-password-param-test'));

      expect(passwordParamCall[1].tags.Sensitive).toBe('true');
    });

    it('should set correct parameter path hierarchy', () => {
      stack = new ParameterStack('test-params', {
        environmentSuffix: 'test',
        rdsStack: mockRdsStack,
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      });

      const paramNames = (
        aws.ssm.Parameter as unknown as jest.Mock
      ).mock.calls.map(call => call[1].name);

      expect(paramNames).toContain('/tap/test/database/endpoint');
      expect(paramNames).toContain('/tap/test/database/username');
      expect(paramNames).toContain('/tap/test/database/password');
      expect(paramNames).toContain('/tap/test/database/name');
    });
  });
});
