import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { DatabaseStack } from '../lib/database-stack';

jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('DatabaseStack', () => {
  let stack: DatabaseStack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Pulumi core functions
    (pulumi as any).all = jest
      .fn()
      .mockImplementation(values => Promise.resolve(values));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).ComponentResource = jest.fn();

    // Mock AWS DynamoDB Table constructor
    const mockTable = {
      arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/mock-table',
    };
    (aws.dynamodb.Table as any) = jest.fn().mockImplementation(() => mockTable);
  });

  describe('with environment suffix', () => {
    beforeEach(() => {
      stack = new DatabaseStack('TestDatabaseStack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should have expected outputs', () => {
      expect(stack.licensesTableArn).toBeDefined();
      expect(stack.analyticsTableArn).toBeDefined();
    });

    it('should create licenses DynamoDB table', () => {
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        expect.stringContaining('licenses-test'),
        expect.objectContaining({
          attributes: expect.arrayContaining([
            expect.objectContaining({
              name: 'licenseKey',
              type: 'S',
            }),
            expect.objectContaining({
              name: 'customerId',
              type: 'S',
            }),
          ]),
          hashKey: 'licenseKey',
          rangeKey: 'customerId',
          billingMode: 'PAY_PER_REQUEST',
        }),
        expect.any(Object)
      );
    });

    it('should create analytics DynamoDB table', () => {
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        expect.stringContaining('download-analytics-test'),
        expect.objectContaining({
          attributes: expect.arrayContaining([
            expect.objectContaining({
              name: 'downloadId',
              type: 'S',
            }),
            expect.objectContaining({
              name: 'timestamp',
              type: 'N',
            }),
            expect.objectContaining({
              name: 'customerId',
              type: 'S',
            }),
          ]),
          hashKey: 'downloadId',
          rangeKey: 'timestamp',
          billingMode: 'PAY_PER_REQUEST',
        }),
        expect.any(Object)
      );
    });

    it('should configure global secondary indexes', () => {
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        expect.stringContaining('download-analytics'),
        expect.objectContaining({
          globalSecondaryIndexes: expect.arrayContaining([
            expect.objectContaining({
              name: 'CustomerIndex',
              hashKey: 'customerId',
              rangeKey: 'timestamp',
              projectionType: 'ALL',
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should enable point-in-time recovery', () => {
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          pointInTimeRecovery: expect.objectContaining({
            enabled: true,
          }),
        }),
        expect.any(Object)
      );
    });
  });
});