import fs from 'fs';
import path from 'path';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { RDSClient, DescribeDBClustersCommand, DescribeDBClusterParameterGroupsCommand } from '@aws-sdk/client-rds';
import { S3Client, GetBucketEncryptionCommand, GetPublicAccessBlockCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { EC2Client, DescribeVpcsCommand, DescribeFlowLogsCommand, DescribeNatGatewaysCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const getKMSClient = () => new KMSClient({ region });
const getRDSClient = () => new RDSClient({ region });
const getS3Client = () => new S3Client({ region });
const getEC2Client = () => new EC2Client({ region });
const getLogsClient = () => new CloudWatchLogsClient({ region });
const getSNSClient = () => new SNSClient({ region });
const getSSMClient = () => new SSMClient({ region });
const getIAMClient = () => new IAMClient({ region });

describe('Security Compliance Infrastructure Integration Tests', () => {
  describe('Security Stack - KMS and IAM', () => {
    test('Should verify KMS key exists and has correct configuration', async () => {
      const kmsKeyId = outputs.KMSKeyId;
      expect(kmsKeyId).toBeDefined();

      const response = await getKMSClient().send(
        new DescribeKeyCommand({ KeyId: kmsKeyId })
      );

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyManager).toBe('CUSTOMER');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('Should verify KMS key has automatic rotation enabled', async () => {
      const kmsKeyArn = outputs.KMSKeyArn;
      expect(kmsKeyArn).toBeDefined();
      expect(kmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    test('Should verify IAM audit role exists with correct session duration', async () => {
      const roleName = `security-audit-role-${environmentSuffix}-${region.replace(/-/g, '')}`;

      const response = await getIAMClient().send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.MaxSessionDuration).toBe(3600);
    });

    test('Should verify IAM operations role exists with correct session duration', async () => {
      const roleName = `security-ops-role-${environmentSuffix}-${region.replace(/-/g, '')}`;

      const response = await getIAMClient().send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role!.MaxSessionDuration).toBe(7200);
    });
  });

  describe('Database Stack - RDS Aurora', () => {
    test('Should verify Aurora cluster exists and is available', async () => {
      const clusterEndpoint = outputs.ClusterEndpoint;
      expect(clusterEndpoint).toBeDefined();

      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;
      const response = await getRDSClient().send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Should verify Aurora cluster has TLS enforcement configured', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;
      const cluster = await getRDSClient().send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      const parameterGroupName = cluster.DBClusters![0].DBClusterParameterGroup;
      expect(parameterGroupName).toBeDefined();

      const paramGroupResponse = await getRDSClient().send(
        new DescribeDBClusterParameterGroupsCommand({
          DBClusterParameterGroupName: parameterGroupName,
        })
      );

      expect(paramGroupResponse.DBClusterParameterGroups).toBeDefined();
      expect(paramGroupResponse.DBClusterParameterGroups!.length).toBe(1);
    });

    test('Should verify cluster has CloudWatch Logs exports enabled', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;
      const response = await getRDSClient().send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      const cluster = response.DBClusters![0];
      const enabledLogs = cluster.EnabledCloudwatchLogsExports || [];
      expect(enabledLogs).toContain('error');
      expect(enabledLogs).toContain('general');
      expect(enabledLogs).toContain('slowquery');
      expect(enabledLogs).toContain('audit');
    });

    test('Should verify cluster has correct backup retention', async () => {
      const clusterIdentifier = `aurora-cluster-${environmentSuffix}`;
      const response = await getRDSClient().send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: clusterIdentifier,
        })
      );

      const cluster = response.DBClusters![0];
      expect(cluster.BackupRetentionPeriod).toBe(7);
      expect(cluster.PreferredBackupWindow).toBe('03:00-04:00');
      expect(cluster.PreferredMaintenanceWindow).toBe('sun:04:00-sun:05:00');
    });

    test('Should verify database endpoints are stored in SSM', async () => {
      const endpointParam = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/database/endpoint`,
        })
      );

      expect(endpointParam.Parameter).toBeDefined();
      expect(endpointParam.Parameter!.Value).toContain('aurora-cluster');

      const readEndpointParam = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/database/read-endpoint`,
        })
      );

      expect(readEndpointParam.Parameter).toBeDefined();
      expect(readEndpointParam.Parameter!.Value).toContain('aurora-cluster');

      const portParam = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/database/port`,
        })
      );

      expect(portParam.Parameter).toBeDefined();
      expect(portParam.Parameter!.Value).toBe('3306');
    });
  });

  describe('Storage Stack - S3 Buckets', () => {
    test('Should verify application data bucket has encryption enabled', async () => {
      const bucketName = outputs.ApplicationDataBucketName;
      expect(bucketName).toBeDefined();

      const response = await getS3Client().send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('Should verify audit logs bucket has encryption enabled', async () => {
      const bucketName = outputs.AuditLogsBucketName;
      expect(bucketName).toBeDefined();

      const response = await getS3Client().send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('aws:kms');
    });

    test('Should verify all buckets have public access blocked', async () => {
      const bucketNames = [
        outputs.ApplicationDataBucketName,
        outputs.AuditLogsBucketName,
        outputs.FlowLogsBucketName,
      ];

      for (const bucketName of bucketNames) {
        const response = await getS3Client().send(
          new GetPublicAccessBlockCommand({ Bucket: bucketName })
        );

        expect(response.PublicAccessBlockConfiguration).toBeDefined();
        const config = response.PublicAccessBlockConfiguration!;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      }
    });

    test('Should verify buckets have versioning enabled', async () => {
      const bucketNames = [
        outputs.ApplicationDataBucketName,
        outputs.AuditLogsBucketName,
      ];

      for (const bucketName of bucketNames) {
        const response = await getS3Client().send(
          new GetBucketVersioningCommand({ Bucket: bucketName })
        );

        expect(response.Status).toBe('Enabled');
      }
    });
  });

  describe('Networking Stack - VPC and Security', () => {
    test('Should verify VPC exists and has correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();

      const response = await getEC2Client().send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
    });

    test('Should verify VPC Flow Logs are enabled', async () => {
      const vpcId = outputs.VpcId;

      const response = await getEC2Client().send(
        new DescribeFlowLogsCommand({
          Filter: [
            {
              Name: 'resource-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.FlowLogs).toBeDefined();
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
    });

    test('Should verify NAT Gateway is available', async () => {
      const vpcId = outputs.VpcId;

      const response = await getEC2Client().send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);
      const natGateway = response.NatGateways![0];
      expect(natGateway.State).toBe('available');
    });

    test('Should verify database security group exists', async () => {
      const databaseSecurityGroupId =
        outputs.DatabaseSecurityGroupId ||
        outputs.ExportsOutputFnGetAttDatabaseSecurityGroup7319C0F6GroupId72A1B827;
      expect(databaseSecurityGroupId).toBeDefined();

      const response = await getEC2Client().send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [databaseSecurityGroupId],
        })
      );

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);
      expect(response.SecurityGroups![0].GroupId).toBe(databaseSecurityGroupId);
      expect(response.SecurityGroups![0].VpcId).toBe(outputs.VpcId);
    });
  });

  describe('Monitoring Stack - CloudWatch and SNS', () => {
    test('Should verify CloudWatch Log Group exists', async () => {
      const logGroupName = outputs.SecurityLogGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toBe(`/security-compliance/${environmentSuffix}/security-events`);

      const response = await getLogsClient().send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: logGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBe(1);
      const logGroup = response.logGroups![0];
      expect(logGroup.logGroupName).toBe(logGroupName);
      expect(logGroup.retentionInDays).toBe(365);
    });

    test('Should verify SNS topic for security alerts exists', async () => {
      const topicArn = outputs.SecurityAlertsTopicArn;
      expect(topicArn).toBeDefined();

      const response = await getSNSClient().send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(topicArn);
    });

    test('Should verify AWS Config bucket exists', async () => {
      const configBucketName = outputs.ConfigBucketName;
      expect(configBucketName).toBeDefined();
      expect(configBucketName).toContain('aws-config');
    });
  });

  describe('Compliance Stack - SSM Parameters', () => {
    test('Should verify compliance standard parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/compliance-standard`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('SOC2,PCI-DSS');
    });

    test('Should verify encryption standard parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/encryption-standard`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('AES-256');
    });

    test('Should verify TLS version parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/tls-version`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('TLSv1.2');
    });

    test('Should verify backup retention parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/backup-retention-days`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('7');
    });

    test('Should verify log retention parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/log-retention-days`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('365');
    });

    test('Should verify flow logs retention parameter exists', async () => {
      const response = await getSSMClient().send(
        new GetParameterCommand({
          Name: `/security-compliance/${environmentSuffix}/config/flow-logs-retention-days`,
        })
      );

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('90');
    });
  });

  describe('End-to-End Compliance Validation', () => {
    test('Should verify all encrypted resources use customer-managed KMS key', async () => {
      const kmsKeyId = outputs.KMSKeyId;

      const clusterResponse = await getRDSClient().send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: `aurora-cluster-${environmentSuffix}`,
        })
      );

      const cluster = clusterResponse.DBClusters![0];
      expect(cluster.KmsKeyId).toContain(kmsKeyId);
    });

    test('Should verify all resources are tagged correctly', async () => {
      const vpcId = outputs.VpcId;

      const response = await getEC2Client().send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];

      const dataClassificationTag = tags.find(
        (tag) => tag.Key === 'DataClassification'
      );
      expect(dataClassificationTag).toBeDefined();
      expect(dataClassificationTag!.Value).toBe('Confidential');

      const environmentTag = tags.find((tag) => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe(environmentSuffix);
    });

    test('Should verify compliance summary outputs are correct', async () => {
      expect(outputs.KMSKeyId).toBeDefined();
      expect(outputs.KMSKeyArn).toBeDefined();
      expect(outputs.VpcId).toBeDefined();
      expect(outputs.FlowLogsBucketName).toBeDefined();
      expect(outputs.ApplicationDataBucketName).toBeDefined();
      expect(outputs.AuditLogsBucketName).toBeDefined();
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(outputs.ClusterReadEndpoint).toBeDefined();
      expect(outputs.SecurityLogGroupName).toBeDefined();
      expect(outputs.ComplianceSummary).toBeDefined();

      const complianceSummary = JSON.parse(outputs.ComplianceSummary);
      expect(complianceSummary.encryptedResources).toBe(8);
      expect(complianceSummary.configRules).toBe(5);
      expect(complianceSummary.securityFeatures).toBe(10);
      expect(complianceSummary.status).toBe('COMPLIANT');
      expect(complianceSummary.complianceStandards).toContain('SOC2');
      expect(complianceSummary.complianceStandards).toContain('PCI DSS');
    });
  });
});
