import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Cross-Region Validation Tests', () => {
  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-east-2';

  describe('Failover Validator', () => {
    test('validator lambda should execute successfully', async () => {
      const lambda = new LambdaClient({ region: primaryRegion });

      const response = await lambda.send(
        new InvokeCommand({
          FunctionName: `failover-validator-${environmentSuffix}`,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(JSON.stringify({
            validateConnectivity: true,
          })),
        })
      );

      expect(response.StatusCode).toBe(200);
      expect(response.Payload).toBeDefined();

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.primaryRegion).toBeDefined();
      expect(body.secondaryRegion).toBeDefined();
      expect(body.failover).toBeDefined();
      expect(body.failover.ready).toBeDefined();
    }, 60000);

    test('validator should report healthy regions', async () => {
      const lambda = new LambdaClient({ region: primaryRegion });

      const response = await lambda.send(
        new InvokeCommand({
          FunctionName: `failover-validator-${environmentSuffix}`,
          InvocationType: 'RequestResponse',
        })
      );

      const payload = JSON.parse(Buffer.from(response.Payload!).toString());
      const body = JSON.parse(payload.body);

      expect(body.primaryRegion.healthy).toBe(true);
      expect(body.secondaryRegion.healthy).toBe(true);
      expect(body.replication.withinThreshold).toBe(true);
    }, 60000);
  });

  describe('Lambda Functions', () => {
    test('trade processor should exist in primary region', async () => {
      const lambda = new LambdaClient({ region: primaryRegion });

      const response = await lambda.send(
        new InvokeCommand({
          FunctionName: `trade-processor-primary-${environmentSuffix}`,
          InvocationType: 'DryRun',
        })
      );

      expect(response.StatusCode).toBe(204);
    });

    test('trade processor should exist in secondary region', async () => {
      const lambda = new LambdaClient({ region: secondaryRegion });

      const response = await lambda.send(
        new InvokeCommand({
          FunctionName: `trade-processor-secondary-${environmentSuffix}`,
          InvocationType: 'DryRun',
        })
      );

      expect(response.StatusCode).toBe(204);
    });
  });
});