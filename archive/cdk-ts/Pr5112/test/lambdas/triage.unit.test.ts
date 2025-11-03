import { KinesisStreamEvent, KinesisStreamRecord, Context } from 'aws-lambda';
import { handler, calculateRiskScore } from '../../lib/lambdas/triage/index';
import type { RiskProfile } from '../../lib/lambdas/triage/index';

describe('Triage Lambda', () => {
  let mockContext: Context;

  beforeEach(() => {
    jest.clearAllMocks();
    mockContext = {} as Context;
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Handler Function', () => {
    test('should process empty event successfully', async () => {
      const event: KinesisStreamEvent = {
        Records: [],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);
    });

    test('should process single transaction record successfully', async () => {
      const transaction = {
        transactionId: 'txn-123',
        customerId: 'cust-456',
        amount: 5000,
        currency: 'USD',
        type: 'wire_transfer',
        timestamp: new Date().toISOString(),
      };

      const record: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-123',
          data: Buffer.from(JSON.stringify(transaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-1',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [record],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);
      expect(console.log).toHaveBeenCalledWith('Triage Lambda invoked with', 1, 'records');
    });

    test('should process multiple transaction records', async () => {
      const records: KinesisStreamRecord[] = [];

      for (let i = 0; i < 5; i++) {
        const transaction = {
          transactionId: `txn-${i}`,
          customerId: `cust-${i}`,
          amount: 1000 * (i + 1),
          currency: 'USD',
          type: 'wire_transfer',
          timestamp: new Date().toISOString(),
        };

        records.push({
          kinesis: {
            kinesisSchemaVersion: '1.0',
            partitionKey: `partition-${i}`,
            sequenceNumber: `seq-${i}`,
            data: Buffer.from(JSON.stringify(transaction)).toString('base64'),
            approximateArrivalTimestamp: Date.now() / 1000,
          },
          eventSource: 'aws:kinesis',
          eventVersion: '1.0',
          eventID: `event-${i}`,
          eventName: 'aws:kinesis:record',
          invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
          awsRegion: 'us-east-1',
          eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
        });
      }

      const event: KinesisStreamEvent = {
        Records: records,
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);
      expect(console.log).toHaveBeenCalledWith('Triage Lambda invoked with', 5, 'records');
    });

    test('should handle record processing errors and return batch failures', async () => {
      const invalidRecord: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-fail-123',
          data: Buffer.from('invalid json').toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-fail',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [invalidRecord],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('seq-fail-123');
      expect(console.error).toHaveBeenCalled();
    });

    test('should complete within 200ms target', async () => {
      const transaction = {
        transactionId: 'txn-perf',
        customerId: 'cust-perf',
        amount: 10000,
        currency: 'USD',
        type: 'wire_transfer',
        timestamp: new Date().toISOString(),
      };

      const record: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-perf',
          data: Buffer.from(JSON.stringify(transaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-perf',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [record],
      };

      const startTime = Date.now();
      await handler(event, mockContext);
      const endTime = Date.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(200);
    });

    test('should log processing completion time', async () => {
      const event: KinesisStreamEvent = {
        Records: [],
      };

      await handler(event, mockContext);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/Batch processing completed in \d+ms/)
      );
    });

    test('should handle high-risk transactions and trigger investigation', async () => {
      // Mock Math.min to return a high risk score (>= 70) to trigger investigation
      const mathMinSpy = jest.spyOn(Math, 'min').mockReturnValue(75);

      const highRiskTransaction = {
        transactionId: 'txn-high-risk',
        customerId: 'cust-suspicious',
        amount: 50000,
        currency: 'USD',
        type: 'wire_transfer',
        destinationCountry: 'XX',
        timestamp: new Date().toISOString(),
      };

      const record: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-high-risk',
          data: Buffer.from(JSON.stringify(highRiskTransaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-high-risk',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [record],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);

      // Verify investigation was triggered for high risk score
      expect(console.log).toHaveBeenCalledWith(
        'Triggering investigation for transaction:',
        'txn-high-risk'
      );
      expect(console.log).toHaveBeenCalledWith(
        'Risk analysis:',
        expect.objectContaining({
          riskScore: 75,
        })
      );

      mathMinSpy.mockRestore();
    });

    test('should not trigger investigation for low risk score', async () => {
      const lowRiskTransaction = {
        transactionId: 'txn-low-risk',
        customerId: 'cust-safe',
        amount: 100,
        currency: 'USD',
        type: 'transfer',
        timestamp: new Date().toISOString(),
      };

      const record: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-low-risk',
          data: Buffer.from(JSON.stringify(lowRiskTransaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-low-risk',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [record],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);
      // Risk score would be 25 (base ML score) which is < 70, so no investigation triggered
    });

    test('should handle transactions with missing optional fields', async () => {
      const minimalTransaction = {
        transactionId: 'txn-minimal',
        customerId: 'cust-minimal',
        amount: 1000,
        currency: 'USD',
        type: 'transfer',
        timestamp: new Date().toISOString(),
      };

      const record: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-minimal',
          data: Buffer.from(JSON.stringify(minimalTransaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-minimal',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [record],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toEqual([]);
    });

    test('should process mixed valid and invalid records', async () => {
      const validTransaction = {
        transactionId: 'txn-valid',
        customerId: 'cust-valid',
        amount: 5000,
        currency: 'USD',
        type: 'wire_transfer',
        timestamp: new Date().toISOString(),
      };

      const validRecord: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-1',
          sequenceNumber: 'seq-valid',
          data: Buffer.from(JSON.stringify(validTransaction)).toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-valid',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const invalidRecord: KinesisStreamRecord = {
        kinesis: {
          kinesisSchemaVersion: '1.0',
          partitionKey: 'partition-2',
          sequenceNumber: 'seq-invalid',
          data: Buffer.from('{invalid').toString('base64'),
          approximateArrivalTimestamp: Date.now() / 1000,
        },
        eventSource: 'aws:kinesis',
        eventVersion: '1.0',
        eventID: 'event-invalid',
        eventName: 'aws:kinesis:record',
        invokeIdentityArn: 'arn:aws:iam::123456789012:role/lambda-role',
        awsRegion: 'us-east-1',
        eventSourceARN: 'arn:aws:kinesis:us-east-1:123456789012:stream/test',
      };

      const event: KinesisStreamEvent = {
        Records: [validRecord, invalidRecord],
      };

      const result = await handler(event, mockContext);

      expect(result).toBeDefined();
      expect(result.batchItemFailures).toHaveLength(1);
      expect(result.batchItemFailures[0].itemIdentifier).toBe('seq-invalid');
    });

  });

  describe('calculateRiskScore Function', () => {
    test('should add 20 points when velocity fraud is true', () => {
      const permissionsCheck: RiskProfile = {
        allowed: true,
        riskLevel: 'LOW',
      };

      const score = calculateRiskScore(true, permissionsCheck, 50);

      expect(score).toBe(70); // 50 + 20
    });

    test('should add 15 points when permissions check is not allowed', () => {
      const permissionsCheck: RiskProfile = {
        allowed: false,
        riskLevel: 'LOW',
      };

      const score = calculateRiskScore(false, permissionsCheck, 50);

      expect(score).toBe(65); // 50 + 15
    });

    test('should add 15 points when risk level is HIGH', () => {
      const permissionsCheck: RiskProfile = {
        allowed: true,
        riskLevel: 'HIGH',
      };

      const score = calculateRiskScore(false, permissionsCheck, 50);

      expect(score).toBe(65); // 50 + 15
    });

    test('should add 10 points when risk level is MEDIUM', () => {
      const permissionsCheck: RiskProfile = {
        allowed: true,
        riskLevel: 'MEDIUM',
      };

      const score = calculateRiskScore(false, permissionsCheck, 50);

      expect(score).toBe(60); // 50 + 10
    });

    test('should cap score at 100', () => {
      const permissionsCheck: RiskProfile = {
        allowed: false,
        riskLevel: 'HIGH',
      };

      const score = calculateRiskScore(true, permissionsCheck, 90);

      expect(score).toBe(100); // 90 + 20 + 15 + 15 = 140, capped at 100
    });

    test('should handle LOW risk level without adding points', () => {
      const permissionsCheck: RiskProfile = {
        allowed: true,
        riskLevel: 'LOW',
      };

      const score = calculateRiskScore(false, permissionsCheck, 50);

      expect(score).toBe(50); // No additions
    });

    test('should accumulate multiple risk factors', () => {
      const permissionsCheck: RiskProfile = {
        allowed: false,
        riskLevel: 'MEDIUM',
      };

      const score = calculateRiskScore(true, permissionsCheck, 40);

      expect(score).toBe(85); // 40 + 20 (velocity) + 15 (not allowed) + 10 (medium)
    });
  });
});
