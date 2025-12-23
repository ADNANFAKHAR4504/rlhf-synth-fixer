import { ComplianceType } from '@aws-sdk/client-config-service';
import { mockClient } from 'aws-sdk-client-mock';
import {
  ConfigServiceClient,
  PutEvaluationsCommand,
} from '@aws-sdk/client-config-service';
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2';

const configMock = mockClient(ConfigServiceClient);
const ec2Mock = mockClient(EC2Client);

// Import the handler
import { handler } from '../lib/lambda/config-tag-checker';

describe('Lambda Config Tag Checker', () => {
  beforeEach(() => {
    configMock.reset();
    ec2Mock.reset();
  });

  describe('handler function', () => {
    it('should be defined', () => {
      expect(handler).toBeDefined();
    });

    it('should be a function', () => {
      expect(typeof handler).toBe('function');
    });
  });

  describe('compliant resource with all required tags', () => {
    it('should return COMPLIANT when all tags are present', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'Owner', Value: 'team-a' },
                  { Key: 'CostCenter', Value: 'cc-123' },
                ],
              },
            ],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Compliant);
      expect(body.annotation).toBe('All required tags are present');
    });
  });

  describe('non-compliant resource missing tags', () => {
    it('should return NON_COMPLIANT when missing one tag', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'Owner', Value: 'team-a' },
                  // Missing CostCenter tag
                ],
              },
            ],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toContain('Missing required tags');
      expect(body.annotation).toContain('CostCenter');
    });

    it('should return NON_COMPLIANT when missing multiple tags', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  // Missing Owner and CostCenter tags
                ],
              },
            ],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toContain('Missing required tags');
      expect(body.annotation).toContain('Owner');
      expect(body.annotation).toContain('CostCenter');
    });

    it('should return NON_COMPLIANT when all tags are missing', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                Tags: [],
              },
            ],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toContain('Missing required tags');
      expect(body.annotation).toContain('Environment');
      expect(body.annotation).toContain('Owner');
      expect(body.annotation).toContain('CostCenter');
    });
  });

  describe('error handling', () => {
    it('should handle EC2 API errors gracefully', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock
        .on(DescribeInstancesCommand)
        .rejects(new Error('EC2 API Error'));

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toContain('Error');
    });

    it('should handle empty reservations', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toBe('Resource does not have required tags');
    });

    it('should handle missing instance in reservations', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toContain('Error');
    });
  });

  describe('non-EC2 resources', () => {
    it('should return NON_COMPLIANT for non-EC2 resources', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::S3::Bucket',
          resourceId: 'my-bucket',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      configMock.on(PutEvaluationsCommand).resolves({});

      const result = await handler(event);

      expect(result.statusCode).toBe(200);
      const body = JSON.parse(result.body);
      expect(body.compliance).toBe(ComplianceType.Non_Compliant);
      expect(body.annotation).toBe('Resource does not have required tags');
    });
  });

  describe('PutEvaluations call', () => {
    it('should call PutEvaluations with correct parameters', async () => {
      const event = {
        configurationItem: JSON.stringify({
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-1234567890abcdef0',
          configurationItemCaptureTime: '2025-12-02T00:00:00.000Z',
        }),
        invokingEvent: JSON.stringify({}),
        resultToken: 'test-token-123',
      };

      ec2Mock.on(DescribeInstancesCommand).resolves({
        Reservations: [
          {
            Instances: [
              {
                InstanceId: 'i-1234567890abcdef0',
                Tags: [
                  { Key: 'Environment', Value: 'prod' },
                  { Key: 'Owner', Value: 'team-a' },
                  { Key: 'CostCenter', Value: 'cc-123' },
                ],
              },
            ],
          },
        ],
      });

      configMock.on(PutEvaluationsCommand).resolves({});

      await handler(event);

      expect(configMock.calls()).toHaveLength(1);
      const putEvaluationsCall = configMock.call(0);
      expect(putEvaluationsCall.args[0].input).toMatchObject({
        ResultToken: 'test-token-123',
        Evaluations: expect.arrayContaining([
          expect.objectContaining({
            ComplianceResourceType: 'AWS::EC2::Instance',
            ComplianceResourceId: 'i-1234567890abcdef0',
            ComplianceType: ComplianceType.Compliant,
          }),
        ]),
      });
    });
  });
});
