import * as AWS from 'aws-sdk';

// Configure AWS SDK
const region = 'eu-west-1';
AWS.config.update({ region });

// Initialize AWS clients
const cloudwatch = new AWS.CloudWatch();
const backup = new AWS.Backup();

describe('TapStack Integration Tests - Real AWS Resources', () => {
  describe('CloudWatch Monitoring', () => {
    it('should have Lambda error alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const lambdaErrorAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('lambda-error-alarm')
      );

      expect(lambdaErrorAlarms).toBeDefined();
      expect(lambdaErrorAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    it('should have DynamoDB throttle alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const dynamoThrottleAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('dynamo-throttle-alarm')
      );

      expect(dynamoThrottleAlarms).toBeDefined();
      expect(dynamoThrottleAlarms!.length).toBeGreaterThan(0);
    }, 30000);

    it('should have API Gateway error alarms configured', async () => {
      const alarms = await cloudwatch.describeAlarms().promise();

      const api4xxAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('api-4xx-alarm')
      );
      const api5xxAlarms = alarms.MetricAlarms?.filter(a =>
        a.AlarmName?.includes('api-5xx-alarm')
      );

      expect(api4xxAlarms).toBeDefined();
      expect(api4xxAlarms!.length).toBeGreaterThan(0);
      expect(api5xxAlarms).toBeDefined();
      expect(api5xxAlarms!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('AWS Backup', () => {
    it('should have backup plan configured', async () => {
      const backupPlans = await backup.listBackupPlans().promise();

      const paymentBackupPlan = backupPlans.BackupPlansList?.find(p =>
        p.BackupPlanName?.includes('payment-backup-plan')
      );

      expect(paymentBackupPlan).toBeDefined();
    }, 30000);

    it('should have backup selections for DynamoDB tables', async () => {
      const backupPlans = await backup.listBackupPlans().promise();
      const paymentBackupPlan = backupPlans.BackupPlansList?.find(p =>
        p.BackupPlanName?.includes('payment-backup-plan')
      );

      if (paymentBackupPlan?.BackupPlanId) {
        const selections = await backup
          .listBackupSelections({ BackupPlanId: paymentBackupPlan.BackupPlanId })
          .promise();

        expect(selections.BackupSelectionsList).toBeDefined();
        expect(selections.BackupSelectionsList!.length).toBeGreaterThan(0);
      }
    }, 30000);
  });
});
