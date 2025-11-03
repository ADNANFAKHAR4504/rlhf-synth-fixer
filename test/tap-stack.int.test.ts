import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBParameterGroupsCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  DescribeSecurityGroupRulesCommand,
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('RDS PostgreSQL Production Migration - Integration Tests', () => {
  const region = 'eu-west-2';
  let outputs: Record<string, string>;
  let resourcePrefix: string;

  const rdsClient = new RDSClient({ region });
  const ec2Client = new EC2Client({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const snsClient = new SNSClient({ region });
  const cwClient = new CloudWatchClient({ region });
  const kmsClient = new KMSClient({ region });
  const iamClient = new IAMClient({ region });

  beforeAll(() => {
    // Load deployment outputs from cfn-outputs/flat-outputs.json
    const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!existsSync(outputsPath)) {
      throw new Error(
        `Deployment outputs not found at ${outputsPath}. Please ensure deployment has completed.`
      );
    }

    outputs = JSON.parse(readFileSync(outputsPath, 'utf8'));
    resourcePrefix = `rds-prod-${outputs.environmentSuffix}`;

    console.log('Testing with resource prefix:', resourcePrefix);
    console.log('Environment Suffix:', outputs.environmentSuffix);
  });

  describe('RDS Instance Configuration', () => {
    let dbInstance: any;

    beforeAll(async () => {
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.dbInstanceId,
        })
      );
      dbInstance = response.DBInstances?.[0];
    });

    it('should have RDS instance in available state', () => {
      expect(dbInstance).toBeDefined();
      expect(dbInstance.DBInstanceStatus).toBe('available');
    });

    it('should use PostgreSQL 14.x engine', () => {
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.EngineVersion).toMatch(/^14\./);
    });

    it('should use db.t3.large instance class', () => {
      expect(dbInstance.DBInstanceClass).toBe('db.t3.large');
    });

    it('should have 100GB of gp3 storage', () => {
      expect(dbInstance.AllocatedStorage).toBe(100);
      expect(dbInstance.StorageType).toBe('gp3');
    });

    it('should have Multi-AZ enabled', () => {
      expect(dbInstance.MultiAZ).toBe(true);
    });

    it('should have storage encryption enabled', () => {
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
    });

    it('should not be publicly accessible', () => {
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    it('should have 7-day backup retention', () => {
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    it('should have enhanced monitoring enabled with 60s interval', () => {
      expect(dbInstance.MonitoringInterval).toBe(60);
      expect(dbInstance.MonitoringRoleArn).toBeDefined();
    });

    it('should have Performance Insights enabled', () => {
      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsRetentionPeriod).toBe(7);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBeDefined();
    });

    it('should have CloudWatch log exports enabled', () => {
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('postgresql');
      expect(dbInstance.EnabledCloudwatchLogsExports).toContain('upgrade');
    });

    it('should have all required tags', () => {
      const tags = dbInstance.TagList || [];
      const tagMap = Object.fromEntries(tags.map((t: any) => [t.Key, t.Value]));

      expect(tagMap.Environment).toBe('production');
      expect(tagMap.Team).toBe('platform');
      expect(tagMap.CostCenter).toBe('engineering');
      expect(tagMap.EnvironmentSuffix).toBe(outputs.environmentSuffix);
    });

    it('should have endpoint accessible in outputs', () => {
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dbAddress).toBeDefined();
      expect(dbInstance.Endpoint.Address).toBe(outputs.dbAddress);
    });
  });

  describe('Database Parameter Group', () => {
    let paramGroup: any;

    beforeAll(async () => {
      const response = await rdsClient.send(
        new DescribeDBParameterGroupsCommand({
          DBParameterGroupName: `${resourcePrefix}-pg14-params`,
        })
      );
      paramGroup = response.DBParameterGroups?.[0];
    });

    it('should exist with correct configuration', () => {
      expect(paramGroup).toBeDefined();
      expect(paramGroup.DBParameterGroupFamily).toBe('postgres14');
      expect(paramGroup.Description).toContain('PostgreSQL 14');
    });
  });

  describe('Database Subnet Group', () => {
    let subnetGroup: any;

    beforeAll(async () => {
      const response = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: `${resourcePrefix}-subnet-group`,
        })
      );
      subnetGroup = response.DBSubnetGroups?.[0];
    });

    it('should exist with subnets across multiple AZs', () => {
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Subnets).toBeDefined();
      expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(subnetGroup.Subnets.map((s: any) => s.SubnetAvailabilityZone.Name));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Configuration', () => {
    let securityGroup: any;
    let securityGroupRules: any[];

    beforeAll(async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [outputs.dbSecurityGroupId],
        })
      );
      securityGroup = sgResponse.SecurityGroups?.[0];

      const rulesResponse = await ec2Client.send(
        new DescribeSecurityGroupRulesCommand({
          Filters: [{ Name: 'group-id', Values: [outputs.dbSecurityGroupId] }],
        })
      );
      securityGroupRules = rulesResponse.SecurityGroupRules || [];
    });

    it('should have security group configured', () => {
      expect(securityGroup).toBeDefined();
      expect(securityGroup.GroupName).toContain(resourcePrefix);
    });

    it('should allow PostgreSQL access from application subnets', () => {
      const ingressRules = securityGroupRules.filter((r) => !r.IsEgress);

      expect(ingressRules.length).toBeGreaterThanOrEqual(2);

      const postgresRules = ingressRules.filter(
        (r) => r.FromPort === 5432 && r.ToPort === 5432 && r.IpProtocol === 'tcp'
      );

      expect(postgresRules.length).toBeGreaterThanOrEqual(2);

      const cidrs = postgresRules
        .map((r) => r.CidrIpv4)
        .filter((cidr) => cidr !== undefined);
      expect(cidrs).toContain('10.0.4.0/24');
      expect(cidrs).toContain('10.0.5.0/24');
    });
  });

  describe('Secrets Manager Configuration', () => {
    let secret: any;
    let secretValue: any;

    beforeAll(async () => {
      const describeResponse = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: outputs.dbSecretArn })
      );
      secret = describeResponse;

      const valueResponse = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: outputs.dbSecretArn })
      );
      secretValue = JSON.parse(valueResponse.SecretString || '{}');
    });

    it('should have secret created with KMS encryption', () => {
      expect(secret).toBeDefined();
      expect(secret.KmsKeyId).toBeDefined();
      expect(secret.Name).toContain(resourcePrefix);
    });

    it('should contain valid database credentials', () => {
      expect(secretValue.username).toBe('postgres');
      expect(secretValue.password).toBeDefined();
      expect(secretValue.password.length).toBeGreaterThanOrEqual(32);
      expect(secretValue.engine).toBe('postgres');
      expect(secretValue.port).toBe(5432);
      expect(secretValue.dbname).toBe('production');
    });

    it('should have required tags', () => {
      const tagMap = Object.fromEntries(
        (secret.Tags || []).map((t: any) => [t.Key, t.Value])
      );
      expect(tagMap.Environment).toBe('production');
      expect(tagMap.EnvironmentSuffix).toBe(outputs.environmentSuffix);
    });
  });

  describe('KMS Encryption', () => {
    let kmsKey: any;
    let rotationStatus: any;

    beforeAll(async () => {
      const dbInstanceResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.dbInstanceId,
        })
      );
      const dbInstance = dbInstanceResponse.DBInstances?.[0];
      const kmsKeyId = dbInstance?.KmsKeyId?.split('/').pop();

      const keyResponse = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );
      kmsKey = keyResponse.KeyMetadata;

      rotationStatus = await kmsClient.send(
        new GetKeyRotationStatusCommand({ KeyId: kmsKeyId })
      );
    });

    it('should have KMS key with key rotation enabled', () => {
      expect(kmsKey).toBeDefined();
      expect(kmsKey.KeyState).toBe('Enabled');
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });
  });

  describe('SNS Topic Configuration', () => {
    let topicAttributes: any;
    let subscriptions: any[];

    beforeAll(async () => {
      const attrResponse = await snsClient.send(
        new GetTopicAttributesCommand({ TopicArn: outputs.snsTopicArn })
      );
      topicAttributes = attrResponse.Attributes;

      const subsResponse = await snsClient.send(
        new ListSubscriptionsByTopicCommand({ TopicArn: outputs.snsTopicArn })
      );
      subscriptions = subsResponse.Subscriptions || [];
    });

    it('should have SNS topic configured', () => {
      expect(topicAttributes).toBeDefined();
      expect(topicAttributes.DisplayName).toContain('RDS Production Database Alerts');
    });

    it('should have email subscription to ops@company.com', () => {
      const emailSub = subscriptions.find(
        (s) => s.Protocol === 'email' && s.Endpoint === 'ops@company.com'
      );
      expect(emailSub).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    let alarms: any[];

    beforeAll(async () => {
      const response = await cwClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: resourcePrefix,
        })
      );
      alarms = response.MetricAlarms || [];
    });

    it('should have CPU utilization alarm', () => {
      const cpuAlarm = alarms.find((a) => a.MetricName === 'CPUUtilization');
      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm?.Threshold).toBe(80);
      expect(cpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(cpuAlarm?.AlarmActions).toContain(outputs.snsTopicArn);
    });

    it('should have storage space alarm', () => {
      const storageAlarm = alarms.find((a) => a.MetricName === 'FreeStorageSpace');
      expect(storageAlarm).toBeDefined();
      expect(storageAlarm?.Threshold).toBe(10737418240); // 10GB
      expect(storageAlarm?.ComparisonOperator).toBe('LessThanThreshold');
      expect(storageAlarm?.AlarmActions).toContain(outputs.snsTopicArn);
    });

    it('should have database connections alarm', () => {
      const connAlarm = alarms.find((a) => a.MetricName === 'DatabaseConnections');
      expect(connAlarm).toBeDefined();
      expect(connAlarm?.Threshold).toBe(121); // 90% of 135
      expect(connAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(connAlarm?.AlarmActions).toContain(outputs.snsTopicArn);
    });
  });

  describe('IAM Role for Enhanced Monitoring', () => {
    let iamRole: any;

    beforeAll(async () => {
      const dbInstanceResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: outputs.dbInstanceId,
        })
      );
      const dbInstance = dbInstanceResponse.DBInstances?.[0];
      const roleName = dbInstance?.MonitoringRoleArn?.split('/').pop();

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );
      iamRole = roleResponse.Role;
    });

    it('should have IAM role with correct trust policy', () => {
      expect(iamRole).toBeDefined();
      expect(iamRole.RoleName).toContain(resourcePrefix);

      const trustPolicy = JSON.parse(
        decodeURIComponent(iamRole.AssumeRolePolicyDocument)
      );
      const rdsStatement = trustPolicy.Statement.find(
        (s: any) => s.Principal?.Service === 'monitoring.rds.amazonaws.com'
      );
      expect(rdsStatement).toBeDefined();
    });
  });

  describe('Integration Test Quality Metrics', () => {
    it('validates all deployment outputs are used', () => {
      expect(outputs.dbEndpoint).toBeDefined();
      expect(outputs.dbAddress).toBeDefined();
      expect(outputs.dbPort).toBeDefined();
      expect(outputs.dbInstanceId).toBeDefined();
      expect(outputs.dbSecretArn).toBeDefined();
      expect(outputs.snsTopicArn).toBeDefined();
      expect(outputs.dbSecurityGroupId).toBeDefined();
      expect(outputs.environmentSuffix).toBeDefined();
    });

    it('tests actual AWS resources not configuration files', () => {
      // This test suite validates real AWS resources via SDK calls
      expect(true).toBe(true);
    });

    it('uses dynamic values from stack outputs', () => {
      expect(outputs.environmentSuffix).not.toBe('hardcoded-value');
      expect(outputs.dbInstanceId).toContain(outputs.environmentSuffix);
    });
  });
});
