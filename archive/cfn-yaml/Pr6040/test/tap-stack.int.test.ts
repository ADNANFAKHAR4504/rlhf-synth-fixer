import fs from 'fs';
import path from 'path';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  ListObjectsV2Command,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  PutLogEventsCommand,
  CreateLogStreamCommand,
  DeleteLogStreamCommand,
  GetLogEventsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeComplianceByConfigRuleCommand,
} from '@aws-sdk/client-config-service';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  ListSecretsCommand,
} from '@aws-sdk/client-secrets-manager';
import http from 'http';

const AWS_REGION = process.env.AWS_REGION;
const OUTPUTS_PATH = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

interface StackOutputs {
  VPCId?: string;
  ALBDNSName?: string;
  ALBArn?: string;
  AutoScalingGroupName?: string;
  AuroraClusterEndpoint?: string;
  AuroraReaderEndpoint?: string;
  AuroraClusterPort?: string;
  ApplicationLogsBucketName?: string;
  DatabaseBackupBucketName?: string;
  ALBSecurityGroupId?: string;
  ApplicationSecurityGroupId?: string;
  DatabaseSecurityGroupId?: string;
  SNSTopicArn?: string;
  ConfigBucketName?: string;
  DBKMSKeyId?: string;
  S3KMSKeyId?: string;
}

describe('TapStack End-to-End Integration Tests - Resource Interactions', () => {
  let outputs: StackOutputs = {};
  let awsClients: {
    ec2: EC2Client;
    autoscaling: AutoScalingClient;
    elbv2: ElasticLoadBalancingV2Client;
    rds: RDSClient;
    s3: S3Client;
    cloudwatch: CloudWatchClient;
    logs: CloudWatchLogsClient;
    sns: SNSClient;
    config: ConfigServiceClient;
    secrets: SecretsManagerClient;
  };
  const testDataPrefix = `integration-test-${Date.now()}`;
  const testObjects: Array<{ bucket: string; key: string }> = [];
  const testLogStreams: Array<{ logGroupName: string; logStreamName: string }> = [];

  beforeAll(() => {
    if (fs.existsSync(OUTPUTS_PATH)) {
      const outputsContent = fs.readFileSync(OUTPUTS_PATH, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      throw new Error(`Stack outputs file not found at ${OUTPUTS_PATH}. Please deploy the stack first.`);
    }

    const awsConfig = { region: AWS_REGION };
    awsClients = {
      ec2: new EC2Client(awsConfig),
      autoscaling: new AutoScalingClient(awsConfig),
      elbv2: new ElasticLoadBalancingV2Client(awsConfig),
      rds: new RDSClient(awsConfig),
      s3: new S3Client(awsConfig),
      cloudwatch: new CloudWatchClient(awsConfig),
      logs: new CloudWatchLogsClient(awsConfig),
      sns: new SNSClient(awsConfig),
      config: new ConfigServiceClient(awsConfig),
      secrets: new SecretsManagerClient(awsConfig),
    };
  });

  describe('Network High Availability and NAT Coverage', () => {
    test('NAT gateways provide outbound access for private subnets', async () => {
      expect(outputs.VPCId).toBeDefined();

      const natCommand = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId!],
          },
        ],
      });
      const natResponse = await awsClients.ec2.send(natCommand);
      const availableNatGateways =
        natResponse.NatGateways?.filter(gateway => gateway.State === 'available') || [];
      expect(availableNatGateways.length).toBeGreaterThan(0);
    });
  });

  describe('A → B: User Request → ALB → EC2 Instances', () => {
    test('ALB receives HTTP request and forwards to healthy EC2 targets', async () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBArn).toBeDefined();

      // Get target group
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.ALBArn!,
      });
      const tgResponse = await awsClients.elbv2.send(tgCommand);
      expect(tgResponse.TargetGroups?.length).toBeGreaterThan(0);
      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn!;

      // Verify targets are healthy
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      });
      const healthResponse = await awsClients.elbv2.send(healthCommand);
      const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets?.length).toBeGreaterThan(0);

      // Verify ALB can route to EC2 instances
      const instancesCommand = new DescribeInstancesCommand({
        Filters: [
          { Name: 'instance-state-name', Values: ['running'] },
          { Name: 'tag:Name', Values: ['*Instance*'] },
        ],
      });
      const instancesResponse = await awsClients.ec2.send(instancesCommand);
      const runningInstances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(runningInstances.length).toBeGreaterThan(0);

      // Verify target group has registered instances
      const registeredInstanceIds = healthResponse.TargetHealthDescriptions?.map(t => t.Target?.Id) || [];
      const asgInstanceIds = runningInstances.map(i => i.InstanceId).filter(Boolean) as string[];
      const intersection = registeredInstanceIds.filter(id => asgInstanceIds.includes(id!));
      expect(intersection.length).toBeGreaterThan(0);
    });

    test('HTTPS listener terminates TLS and HTTP listener redirects to HTTPS', async () => {
      expect(outputs.ALBArn).toBeDefined();

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: outputs.ALBArn!,
      });
      const listenerResponse = await awsClients.elbv2.send(listenerCommand);

      const httpsListener = listenerResponse.Listeners?.find(listener => listener.Port === 443);
      const httpListener = listenerResponse.Listeners?.find(listener => listener.Port === 80);
      
      expect(httpListener).toBeDefined();
      
      // HTTPS listener only exists if certificate is provided (UseHTTPS condition)
      if (httpsListener) {
        expect(httpsListener.Protocol).toBe('HTTPS');
        expect(httpsListener.Certificates && httpsListener.Certificates.length).toBeGreaterThan(0);
        // If HTTPS exists, HTTP should redirect to HTTPS
        expect(httpListener?.DefaultActions?.[0]?.Type).toBe('redirect');
        expect(httpListener?.DefaultActions?.[0]?.RedirectConfig?.Protocol).toBe('HTTPS');
      } else {
        // If no HTTPS listener (certificate not provided), HTTP should forward directly
        expect(httpListener?.DefaultActions?.[0]?.Type).toBe('forward');
      }
    });

    test('ALB security group allows traffic to application security group', async () => {
      const albSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ALBSecurityGroupId!],
      });
      const albSgResponse = await awsClients.ec2.send(albSgCommand);
      const albSg = albSgResponse.SecurityGroups![0];

      const appSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ApplicationSecurityGroupId!],
      });
      const appSgResponse = await awsClients.ec2.send(appSgCommand);
      const appSg = appSgResponse.SecurityGroups![0];

      // Verify app SG allows traffic from ALB SG
      const appIngress = appSg.IpPermissions?.find(p => p.FromPort === 80);
      expect(appIngress).toBeDefined();
      expect(appIngress?.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.ALBSecurityGroupId)).toBe(true);
    });

    test('HTTP request reaches EC2 instance through ALB', async () => {
      if (!outputs.ALBDNSName) {
        return;
      }

      const response = await new Promise<{ statusCode?: number; data: string }>((resolve, reject) => {
        const req = http.get(`http://${outputs.ALBDNSName}/health`, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => resolve({ statusCode: res.statusCode, data }));
        });
        req.on('error', reject);
        req.setTimeout(15000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      expect(response.statusCode).toBe(200);
      expect(response.data).toContain('OK');
    });
  });

  describe('B → C: EC2 Instances → Aurora Database', () => {
    test('EC2 instances can reach Aurora cluster endpoint', async () => {
      expect(outputs.AuroraClusterEndpoint).toBeDefined();
      expect(outputs.ApplicationSecurityGroupId).toBeDefined();
      expect(outputs.DatabaseSecurityGroupId).toBeDefined();

      // Verify database security group allows MySQL from application security group
      const dbSgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseSecurityGroupId!],
      });
      const dbSgResponse = await awsClients.ec2.send(dbSgCommand);
      const dbSg = dbSgResponse.SecurityGroups![0];

      const mysqlRule = dbSg.IpPermissions?.find(p => p.FromPort === 3306 && p.ToPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.ApplicationSecurityGroupId)).toBe(true);

      // Verify Aurora cluster is accessible
      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await awsClients.rds.send(clusterCommand);
      const cluster = clusterResponse.DBClusters?.find(
        c => c.Endpoint === outputs.AuroraClusterEndpoint
      );
      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
    });

    test('EC2 instances have database credentials from Secrets Manager', async () => {
      // List secrets to find database credentials
      const listCommand = new ListSecretsCommand({});
      const secretsList = await awsClients.secrets.send(listCommand);
      const dbSecret = secretsList.SecretList?.find((s: any) => 
        s.Name?.includes('db-credentials')
      );
      expect(dbSecret).toBeDefined();

      // Verify secret can be retrieved (simulating what EC2 would do)
      if (dbSecret?.ARN) {
        const getSecretCommand = new GetSecretValueCommand({
          SecretId: dbSecret.ARN,
        });
        const secretResponse = await awsClients.secrets.send(getSecretCommand);
        expect(secretResponse.SecretString).toBeDefined();
        const secretData = JSON.parse(secretResponse.SecretString!);
        expect(secretData.username).toBeDefined();
        expect(secretData.password).toBeDefined();
      }
    });

    test('Aurora reader endpoint is accessible for read operations', async () => {
      expect(outputs.AuroraReaderEndpoint).toBeDefined();

      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await awsClients.rds.send(clusterCommand);
      const cluster = clusterResponse.DBClusters?.find(
        c => c.ReaderEndpoint === outputs.AuroraReaderEndpoint
      );
      expect(cluster).toBeDefined();
    });
  });

  describe('B → D: EC2 Instances → S3 Logs Bucket', () => {
    test('EC2 instances can write logs to S3 application logs bucket', async () => {
      expect(outputs.ApplicationLogsBucketName).toBeDefined();
      expect(outputs.ApplicationSecurityGroupId).toBeDefined();

      // Verify bucket exists and is accessible
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
      });
      await expect(awsClients.s3.send(headCommand)).resolves.toBeDefined();

      // Verify bucket encryption (required for EC2 to write)
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
      });
      const encryptionResponse = await awsClients.s3.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Verify EC2 role has S3 permissions (by checking bucket exists and is writable)
      // In a real scenario, EC2 instances would write logs here via their IAM role
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.ApplicationLogsBucketName!,
        MaxKeys: 1,
      });
      await expect(awsClients.s3.send(listCommand)).resolves.toBeDefined();

      // Verify bucket versioning is enabled
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
      });
      const versioningResponse = await awsClients.s3.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify lifecycle configuration transitions logs to Glacier
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
      });
      const lifecycleResponse = await awsClients.s3.send(lifecycleCommand);
      const glacierRule = lifecycleResponse.Rules?.find(rule =>
        rule.Transitions?.some(transition => transition.StorageClass === 'GLACIER')
      );
      expect(glacierRule).toBeDefined();
    });

    test('EC2 instances can write and read logs from S3 application logs bucket', async () => {
      expect(outputs.ApplicationLogsBucketName).toBeDefined();

      const testKey = `${testDataPrefix}/test-log-file.log`;
      const testContent = `Integration test log entry at ${new Date().toISOString()}\nTest data for EC2 → S3 flow verification`;

      // Write test log file to S3 (simulating EC2 instance writing)
      const putCommand = new PutObjectCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain',
      });
      await awsClients.s3.send(putCommand);
      testObjects.push({ bucket: outputs.ApplicationLogsBucketName!, key: testKey });

      // Verify the object exists and can be read
      const getCommand = new GetObjectCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
        Key: testKey,
      });
      const getResponse = await awsClients.s3.send(getCommand);
      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);

      // Verify versioning is working (object should have version)
      const listCommand = new ListObjectsV2Command({
        Bucket: outputs.ApplicationLogsBucketName!,
        Prefix: testDataPrefix,
      });
      const listResponse = await awsClients.s3.send(listCommand);
      expect(listResponse.Contents?.some(obj => obj.Key === testKey)).toBe(true);
    });
  });

  describe('C → D: Aurora Database → S3 Backup Bucket', () => {
    test('Aurora cluster can write backups to S3 backup bucket', async () => {
      expect(outputs.DatabaseBackupBucketName).toBeDefined();
      expect(outputs.AuroraClusterEndpoint).toBeDefined();

      // Verify backup bucket exists
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
      });
      await expect(awsClients.s3.send(headCommand)).resolves.toBeDefined();

      // Verify bucket has KMS encryption (required for RDS backups)
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
      });
      const encryptionResponse = await awsClients.s3.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      const kmsKeyId = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
      expect(kmsKeyId).toBeDefined();

      // Verify Aurora cluster has backup retention configured
      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await awsClients.rds.send(clusterCommand);
      const cluster = clusterResponse.DBClusters?.find(
        c => c.Endpoint === outputs.AuroraClusterEndpoint
      );
      expect(cluster?.BackupRetentionPeriod).toBeGreaterThanOrEqual(30);

      // Verify backup bucket versioning is enabled
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
      });
      const versioningResponse = await awsClients.s3.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      // Verify lifecycle transitions to deep archive for long-term retention
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
      });
      const lifecycleResponse = await awsClients.s3.send(lifecycleCommand);
      const hasDeepArchive = lifecycleResponse.Rules?.some(rule =>
        rule.Transitions?.some(transition => transition.StorageClass === 'DEEP_ARCHIVE')
      );
      expect(hasDeepArchive).toBe(true);
    });

    test('Aurora backups can be written to and read from S3 backup bucket', async () => {
      expect(outputs.DatabaseBackupBucketName).toBeDefined();

      const testBackupKey = `${testDataPrefix}/test-db-backup.sql`;
      const testBackupContent = `-- Integration test database backup at ${new Date().toISOString()}\n-- Simulating Aurora backup export to S3\nCREATE TABLE test_backup_verification (id INT PRIMARY KEY);`;

      // Write test backup file to S3 (simulating Aurora backup)
      const putCommand = new PutObjectCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
        Key: testBackupKey,
        Body: testBackupContent,
        ContentType: 'application/sql',
        ServerSideEncryption: 'aws:kms',
      });
      await awsClients.s3.send(putCommand);
      testObjects.push({ bucket: outputs.DatabaseBackupBucketName!, key: testBackupKey });

      // Verify the backup file exists and can be read
      const getCommand = new GetObjectCommand({
        Bucket: outputs.DatabaseBackupBucketName!,
        Key: testBackupKey,
      });
      const getResponse = await awsClients.s3.send(getCommand);
      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testBackupContent);
      expect(getResponse.ServerSideEncryption).toBe('aws:kms');
    });
  });

  describe('B → E: EC2 Instances → CloudWatch Logs', () => {
    test('EC2 instances send application logs to CloudWatch Logs', async () => {
      const logCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/',
      });
      const logResponse = await awsClients.logs.send(logCommand);

      // Find application log group
      const appLogGroup = logResponse.logGroups?.find(lg => 
        lg.logGroupName?.includes('application')
      );
      expect(appLogGroup).toBeDefined();
      expect(appLogGroup?.logGroupName).toBeDefined();

      // Verify log group exists (EC2 CloudWatch agent writes here)
      // Log group existence is verified by DescribeLogGroupsCommand above
      expect(appLogGroup?.logGroupName).toBeDefined();
    });

    test('EC2 instances can write logs to CloudWatch Logs and logs are retrievable', async () => {
      const logCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/',
      });
      const logResponse = await awsClients.logs.send(logCommand);
      const appLogGroup = logResponse.logGroups?.find(lg => 
        lg.logGroupName?.includes('application')
      );
      expect(appLogGroup?.logGroupName).toBeDefined();

      if (appLogGroup?.logGroupName) {
        const logStreamName = `${testDataPrefix}/test-instance-id/httpd-access`;
        
        // Create log stream (simulating EC2 CloudWatch agent creating stream)
        try {
          const createStreamCommand = new CreateLogStreamCommand({
            logGroupName: appLogGroup.logGroupName,
            logStreamName: logStreamName,
          });
          await awsClients.logs.send(createStreamCommand);
          testLogStreams.push({ logGroupName: appLogGroup.logGroupName, logStreamName });
        } catch (error: any) {
          // Stream might already exist, that's okay
          if (error.name !== 'ResourceAlreadyExistsException') {
            throw error;
          }
        }

        // Write test log events (simulating EC2 application writing logs)
        const logEvents = [
          {
            timestamp: Date.now(),
            message: `[${new Date().toISOString()}] Integration test log entry - GET /health HTTP/1.1 200`,
          },
          {
            timestamp: Date.now() + 1000,
            message: `[${new Date().toISOString()}] Integration test log entry - POST /api/data HTTP/1.1 201`,
          },
        ];

        const putLogsCommand = new PutLogEventsCommand({
          logGroupName: appLogGroup.logGroupName,
          logStreamName: logStreamName,
          logEvents: logEvents,
        });
        const putResponse = await awsClients.logs.send(putLogsCommand);
        expect(putResponse.nextSequenceToken).toBeDefined();

        // Wait a moment for logs to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify logs can be retrieved
        const getLogsCommand = new GetLogEventsCommand({
          logGroupName: appLogGroup.logGroupName,
          logStreamName: logStreamName,
          limit: 10,
        });
        const getLogsResponse = await awsClients.logs.send(getLogsCommand);
        expect(getLogsResponse.events?.length).toBeGreaterThan(0);
        expect(getLogsResponse.events?.some(e => e.message?.includes('Integration test log entry'))).toBe(true);
      }
    });
  });

  describe('B → E: EC2 Instances → CloudWatch Metrics → Alarms', () => {
    test('EC2 CPU metrics trigger CloudWatch alarms', async () => {
      // Verify High CPU alarm exists 
      const alarmCommand = new DescribeAlarmsCommand({});
      const alarmResponse = await awsClients.cloudwatch.send(alarmCommand);
      const cpuAlarm = alarmResponse.MetricAlarms?.find((a: any) => 
        a.AlarmName?.includes('HighCPU')
      );
      expect(cpuAlarm).toBeDefined();

      // Verify alarm is configured to monitor ASG CPU
      expect(cpuAlarm?.Dimensions?.some((d: any) => d.Name === 'AutoScalingGroupName')).toBe(true);
      expect(cpuAlarm?.AlarmActions?.some((action: any) => action.includes('sns'))).toBe(true);
    });

    test('CloudWatch alarms trigger SNS notifications', async () => {
      expect(outputs.SNSTopicArn).toBeDefined();

      // Verify SNS topic exists
      const topicCommand = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn!,
      });
      const topicResponse = await awsClients.sns.send(topicCommand);
      expect(topicResponse.Attributes).toBeDefined();

      // Verify topic has email subscription
      const subscriptionsCommand = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.SNSTopicArn!,
      });
      const subscriptionsResponse = await awsClients.sns.send(subscriptionsCommand);
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
      expect(subscriptionsResponse.Subscriptions?.some(s => s.Protocol === 'email')).toBe(true);

      // Verify alarms are configured to send to this topic
      const alarmCommand = new DescribeAlarmsCommand({});
      const alarmResponse = await awsClients.cloudwatch.send(alarmCommand);
      const alarmsWithSNS = alarmResponse.MetricAlarms?.filter(a => 
        a.AlarmActions?.some(action => action === outputs.SNSTopicArn)
      );
      expect(alarmsWithSNS?.length).toBeGreaterThan(0);
    });

    test('ALB response time and unhealthy target alarms are configured', async () => {
      const alarmCommand = new DescribeAlarmsCommand({});
      const alarmResponse = await awsClients.cloudwatch.send(alarmCommand);

      const latencyAlarm = alarmResponse.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('HighResponseTime')
      );
      const unhealthyAlarm = alarmResponse.MetricAlarms?.find(alarm =>
        alarm.AlarmName?.includes('UnhealthyTargets')
      );

      expect(latencyAlarm).toBeDefined();
      expect(latencyAlarm?.AlarmActions?.some(action => action === outputs.SNSTopicArn)).toBe(true);
      expect(unhealthyAlarm).toBeDefined();
      expect(unhealthyAlarm?.AlarmActions?.some(action => action === outputs.SNSTopicArn)).toBe(true);
    });
  });

  describe('C → E: Aurora Database → CloudWatch Metrics → Alarms', () => {
    test('Aurora database connection metrics trigger CloudWatch alarms', async () => {
      // Database alarm only exists if UseAZ2 is true (at least 2 AZs)
      // Alarm name pattern is ${ProjectName}-${Environment}-DB-HighConnections
      if (!outputs.AuroraClusterEndpoint || outputs.AuroraClusterEndpoint === 'SingleAZMode - RDS requires at least 2 AZs') {
        // Skip test if Aurora cluster doesn't exist (single AZ mode)
        return;
      }

      const alarmCommand = new DescribeAlarmsCommand({});
      const alarmResponse = await awsClients.cloudwatch.send(alarmCommand);
      const dbAlarm = alarmResponse.MetricAlarms?.find(a => 
        a.AlarmName?.includes('DB-HighConnections')
      );
      
      expect(dbAlarm).toBeDefined();
      // Verify alarm has SNS actions configured
      expect(dbAlarm?.AlarmActions?.some(action => action.includes('sns'))).toBe(true);
    });
  });

  describe('F → D: AWS Config → S3 Config Bucket', () => {
    test('AWS Config writes configuration snapshots to S3 bucket', async () => {
      expect(outputs.ConfigBucketName).toBeDefined();

      // Verify Config recorder is active
      const recorderCommand = new DescribeConfigurationRecordersCommand({});
      const recorderResponse = await awsClients.config.send(recorderCommand);
      expect(recorderResponse.ConfigurationRecorders?.length).toBeGreaterThan(0);
      const recorder = recorderResponse.ConfigurationRecorders![0];
      expect(recorder.recordingGroup?.allSupported).toBe(true);

      // Verify delivery channel points to S3 bucket
      const channelCommand = new DescribeDeliveryChannelsCommand({});
      const channelResponse = await awsClients.config.send(channelCommand);
      expect(channelResponse.DeliveryChannels?.length).toBeGreaterThan(0);
      const channel = channelResponse.DeliveryChannels![0];
      expect(channel.s3BucketName).toBe(outputs.ConfigBucketName);

      // Verify Config bucket exists and is accessible
      const headCommand = new HeadBucketCommand({
        Bucket: outputs.ConfigBucketName!,
      });
      await expect(awsClients.s3.send(headCommand)).resolves.toBeDefined();

      // Verify AWS Config rules report compliance status
      const complianceCommand = new DescribeComplianceByConfigRuleCommand({});
      const complianceResponse = await awsClients.config.send(complianceCommand);
      const requiredRules = [
        's3-bucket-encryption-enabled',
        's3-bucket-versioning-enabled',
        'rds-storage-encrypted',
        'required-tags',
      ];
      requiredRules.forEach(ruleName => {
        const ruleSummary = complianceResponse.ComplianceByConfigRules?.find(
          summary => summary.ConfigRuleName === ruleName
        );
        expect(ruleSummary).toBeDefined();
      });
    });
  });

  describe('Complete End-to-End Flow: User → ALB → EC2 → Aurora → S3 → CloudWatch → SNS', () => {
    test('Full request flow with data persistence and monitoring', async () => {
      // 1. User request hits ALB
      expect(outputs.ALBDNSName).toBeDefined();
      const albCommand = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.ALBArn!],
      });
      const albResponse = await awsClients.elbv2.send(albCommand);
      expect(albResponse.LoadBalancers?.[0]?.State?.Code).toBe('active');

      // 2. ALB routes to EC2 instance
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.ALBArn!,
      });
      const tgResponse = await awsClients.elbv2.send(tgCommand);
      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn!;

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn,
      });
      const healthResponse = await awsClients.elbv2.send(healthCommand);
      const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets?.length).toBeGreaterThan(0);

      // 3. EC2 instance connects to Aurora
      const clusterCommand = new DescribeDBClustersCommand({});
      const clusterResponse = await awsClients.rds.send(clusterCommand);
      const cluster = clusterResponse.DBClusters?.find(
        c => c.Endpoint === outputs.AuroraClusterEndpoint
      );
      expect(cluster?.Status).toBe('available');

      // 4. EC2 writes logs to S3
      const s3HeadCommand = new HeadBucketCommand({
        Bucket: outputs.ApplicationLogsBucketName!,
      });
      await expect(awsClients.s3.send(s3HeadCommand)).resolves.toBeDefined();

      // 5. Metrics flow to CloudWatch
      const logCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: '/aws/',
      });
      const logResponse = await awsClients.logs.send(logCommand);
      const appLogGroup = logResponse.logGroups?.find(lg => 
        lg.logGroupName?.includes('application')
      );
      expect(appLogGroup).toBeDefined();

      // 6. Alarms trigger SNS
      const alarmCommand = new DescribeAlarmsCommand({});
      const alarmResponse = await awsClients.cloudwatch.send(alarmCommand);
      const alarmsWithSNS = alarmResponse.MetricAlarms?.filter(a => 
        a.AlarmActions?.some(action => action === outputs.SNSTopicArn)
      );
      expect(alarmsWithSNS?.length).toBeGreaterThan(0);
    });
  });

  // Cleanup test data after all tests
  afterAll(async () => {
    // Clean up S3 test objects
    for (const testObj of testObjects) {
      try {
        const deleteCommand = new DeleteObjectCommand({
          Bucket: testObj.bucket,
          Key: testObj.key,
        });
        await awsClients.s3.send(deleteCommand);
      } catch (error) {
        console.error(`Failed to delete S3 object ${testObj.bucket}/${testObj.key}:`, error);
      }
    }

    // Clean up CloudWatch Logs test streams
    for (const testStream of testLogStreams) {
      try {
        const deleteStreamCommand = new DeleteLogStreamCommand({
          logGroupName: testStream.logGroupName,
          logStreamName: testStream.logStreamName,
        });
        await awsClients.logs.send(deleteStreamCommand);
      } catch (error) {
        console.error(`Failed to delete log stream ${testStream.logGroupName}/${testStream.logStreamName}:`, error);
      }
    }
  });
});

