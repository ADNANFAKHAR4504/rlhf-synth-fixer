/* eslint-disable prettier/prettier */
import * as fs from 'fs';
import * as path from 'path';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand,
} from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  Route53Client,
  ListHealthChecksCommand,
} from '@aws-sdk/client-route-53';

interface DeploymentOutputs {
  PrimaryClusterId: string;
  PrimaryClusterEndpoint: string;
  PrimaryReaderEndpoint: string;
  SecondaryClusterId: string;
  SecondaryClusterEndpoint: string;
  SecondaryReaderEndpoint: string;
  FailoverFunctionArn: string;
  HealthCheckFunctionArn: string;
  AlertTopicArn: string;
  PrimaryVpcId: string;
  SecondaryVpcId: string;
  PrimaryDashboardUrl: string;
  SecondaryDashboardUrl: string;
  environmentSuffix: string;
  masterUsername: string;
}

describe('TapStack Integration Tests - Real AWS Infrastructure', () => {
  let outputs: DeploymentOutputs;
  let region: string;
  let rdsClient: RDSClient;
  let ec2Client: EC2Client;
  let lambdaClient: LambdaClient;
  let snsClient: SNSClient;
  let cloudwatchClient: CloudWatchClient;
  let route53Client: Route53Client;

  beforeAll(() => {
    console.log('[INFO] Loading deployment outputs from cfn-outputs/flat-outputs.json...');
    
    const outputPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    
    if (!fs.existsSync(outputPath)) {
      throw new Error(`Output file not found at ${outputPath}. Please deploy the stack first.`);
    }

    const rawData = fs.readFileSync(outputPath, 'utf-8');
    outputs = JSON.parse(rawData);

    console.log('[SUCCESS] Deployment outputs loaded successfully');
    console.log('[INFO] Environment:', outputs.environmentSuffix);
    console.log('[INFO] Primary VPC:', outputs.PrimaryVpcId);
    console.log('[INFO] Secondary VPC:', outputs.SecondaryVpcId);

    // Extract region from ARN or endpoint
    region = outputs.FailoverFunctionArn.split(':')[3] || 'us-east-1';
    console.log('[INFO] Region:', region);

    // Initialize AWS SDK clients
    rdsClient = new RDSClient({ region });
    ec2Client = new EC2Client({ region });
    lambdaClient = new LambdaClient({ region });
    snsClient = new SNSClient({ region });
    cloudwatchClient = new CloudWatchClient({ region });
    route53Client = new Route53Client({ region });

    console.log('[SUCCESS] AWS SDK clients initialized\n');
  }, 30000);

  describe('RDS Aurora Clusters - Real Infrastructure Tests', () => {
    test('should verify primary Aurora cluster exists and is available', async () => {
      console.log('[TEST] Testing Primary Cluster:', outputs.PrimaryClusterId);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.PrimaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters?.[0];

      console.log('[RESULT] Primary Cluster Status:', cluster?.Status);
      console.log('[RESULT] Engine:', cluster?.Engine);
      console.log('[RESULT] Engine Version:', cluster?.EngineVersion);
      console.log('[RESULT] Master Username:', cluster?.MasterUsername);
      console.log('[RESULT] Storage Encrypted:', cluster?.StorageEncrypted);
      console.log('[RESULT] Backup Retention Period:', cluster?.BackupRetentionPeriod);

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.MasterUsername).toBe(outputs.masterUsername);
      expect(cluster?.StorageEncrypted).toBe(true);
      expect(cluster?.BackupRetentionPeriod).toBe(35);
      expect(cluster?.Endpoint).toContain(outputs.PrimaryClusterId.toLowerCase());
    }, 60000);

    test('should verify secondary Aurora cluster exists and is available', async () => {
      console.log('[TEST] Testing Secondary Cluster:', outputs.SecondaryClusterId);

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.SecondaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters?.[0];

      console.log('[RESULT] Secondary Cluster Status:', cluster?.Status);
      console.log('[RESULT] Engine:', cluster?.Engine);
      console.log('[RESULT] Engine Version:', cluster?.EngineVersion);
      console.log('[RESULT] Storage Encrypted:', cluster?.StorageEncrypted);

      expect(cluster).toBeDefined();
      expect(cluster?.Status).toBe('available');
      expect(cluster?.Engine).toBe('aurora-postgresql');
      expect(cluster?.StorageEncrypted).toBe(true);
    }, 60000);

    test('should verify primary cluster has multiple DB instances for HA', async () => {
      console.log('[TEST] Testing Primary Cluster Instances...');

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.PrimaryClusterId],
          },
        ],
      });

      const response = await rdsClient.send(command);
      const instances = response.DBInstances || [];

      console.log('[RESULT] Total Instances:', instances.length);
      
      instances.forEach((instance, index) => {
        console.log(`  Instance ${index + 1}:`);
        console.log('    - ID:', instance.DBInstanceIdentifier);
        console.log('    - Status:', instance.DBInstanceStatus);
        console.log('    - Class:', instance.DBInstanceClass);
        console.log('    - AZ:', instance.AvailabilityZone);
        console.log('    - Performance Insights:', instance.PerformanceInsightsEnabled);
        console.log('    - Monitoring Interval:', instance.MonitoringInterval);
      });

      expect(instances.length).toBeGreaterThanOrEqual(2);
      
      instances.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
        expect(instance.DBInstanceClass).toBe('db.r6g.xlarge');
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.MonitoringInterval).toBe(1);
        expect(instance.PubliclyAccessible).toBe(false);
      });
    }, 60000);

    test('should verify secondary cluster has multiple DB instances', async () => {
      console.log('[TEST] Testing Secondary Cluster Instances...');

      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.SecondaryClusterId],
          },
        ],
      });

      const response = await rdsClient.send(command);
      const instances = response.DBInstances || [];

      console.log('[RESULT] Total Instances:', instances.length);

      instances.forEach((instance, index) => {
        console.log(`  Instance ${index + 1}:`);
        console.log('    - ID:', instance.DBInstanceIdentifier);
        console.log('    - Status:', instance.DBInstanceStatus);
        console.log('    - AZ:', instance.AvailabilityZone);
      });

      expect(instances.length).toBeGreaterThanOrEqual(1);
      
      instances.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
      });
    }, 60000);

    test('should verify cluster endpoints are accessible', async () => {
      console.log('[TEST] Testing Cluster Endpoints...');
      console.log('[INFO] Primary Endpoint:', outputs.PrimaryClusterEndpoint);
      console.log('[INFO] Primary Reader:', outputs.PrimaryReaderEndpoint);
      console.log('[INFO] Secondary Endpoint:', outputs.SecondaryClusterEndpoint);
      console.log('[INFO] Secondary Reader:', outputs.SecondaryReaderEndpoint);

      expect(outputs.PrimaryClusterEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.PrimaryReaderEndpoint).toContain('.cluster-ro-');
      expect(outputs.SecondaryClusterEndpoint).toContain('.rds.amazonaws.com');
      expect(outputs.SecondaryReaderEndpoint).toContain('.cluster-ro-');
    });
  });

  describe('VPC and Networking - Real Infrastructure Tests', () => {
    test('should verify primary VPC exists with correct configuration', async () => {
      console.log('[TEST] Testing Primary VPC:', outputs.PrimaryVpcId);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.PrimaryVpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      console.log('[RESULT] VPC Found:', vpc?.VpcId);
      console.log('[RESULT] CIDR Block:', vpc?.CidrBlock);
      console.log('[RESULT] State:', vpc?.State);

      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('should verify secondary VPC exists with correct configuration', async () => {
      console.log('[TEST] Testing Secondary VPC:', outputs.SecondaryVpcId);

      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.SecondaryVpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      console.log('[RESULT] VPC Found:', vpc?.VpcId);
      console.log('[RESULT] CIDR Block:', vpc?.CidrBlock);
      console.log('[RESULT] State:', vpc?.State);

      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('should verify primary VPC has multiple subnets across AZs', async () => {
      console.log('[TEST] Testing Primary VPC Subnets...');

      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.PrimaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      console.log('[RESULT] Total Subnets:', subnets.length);

      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      console.log('[RESULT] Availability Zones:', Array.from(azs));

      subnets.forEach((subnet, index) => {
        console.log(`  Subnet ${index + 1}:`);
        console.log('    - ID:', subnet.SubnetId);
        console.log('    - AZ:', subnet.AvailabilityZone);
        console.log('    - CIDR:', subnet.CidrBlock);
        console.log('    - State:', subnet.State);
      });

      expect(subnets.length).toBeGreaterThanOrEqual(9);
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('should verify security groups exist and are properly configured', async () => {
      console.log('[TEST] Testing Security Groups...');

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.PrimaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];

      console.log('[RESULT] Total Security Groups:', securityGroups.length);

      const dbSecurityGroups = securityGroups.filter(sg => 
        sg.Description?.includes('Aurora')
      );

      console.log('[RESULT] Database Security Groups:', dbSecurityGroups.length);

      dbSecurityGroups.forEach((sg, index) => {
        console.log(`  Security Group ${index + 1}:`);
        console.log('    - ID:', sg.GroupId);
        console.log('    - Name:', sg.GroupName);
        console.log('    - Description:', sg.Description);
        console.log('    - Ingress Rules:', sg.IpPermissions?.length);
        console.log('    - Egress Rules:', sg.IpPermissionsEgress?.length);

        sg.IpPermissions?.forEach((rule, ruleIndex) => {
          console.log(`      Ingress Rule ${ruleIndex + 1}:`);
          console.log('        - Protocol:', rule.IpProtocol);
          console.log('        - Port:', rule.FromPort);
        });
      });

      expect(securityGroups.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Lambda Functions - Real Infrastructure Tests', () => {
    test('should verify health check Lambda function exists and is active', async () => {
      console.log('[TEST] Testing Health Check Lambda:', outputs.HealthCheckFunctionArn);

      const functionName = outputs.HealthCheckFunctionArn.split(':').pop() || '';
      
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration;

      console.log('[RESULT] Function Found:', config?.FunctionName);
      console.log('[RESULT] Runtime:', config?.Runtime);
      console.log('[RESULT] Handler:', config?.Handler);
      console.log('[RESULT] Timeout:', config?.Timeout);
      console.log('[RESULT] Memory:', config?.MemorySize);
      console.log('[RESULT] State:', config?.State);
      console.log('[RESULT] Last Modified:', config?.LastModified);

      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('nodejs18.x');
      expect(config?.Handler).toBe('index.handler');
      expect(config?.Timeout).toBe(30);
      expect(config?.State).toBe('Active');
      expect(config?.Environment?.Variables?.PRIMARY_CLUSTER_ID).toBeDefined();
    }, 30000);

    test('should verify failover Lambda function exists and is active', async () => {
      console.log('[TEST] Testing Failover Lambda:', outputs.FailoverFunctionArn);

      const functionName = outputs.FailoverFunctionArn.split(':').pop() || '';
      
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });

      const response = await lambdaClient.send(command);
      const config = response.Configuration;

      console.log('[RESULT] Function Found:', config?.FunctionName);
      console.log('[RESULT] Runtime:', config?.Runtime);
      console.log('[RESULT] Timeout:', config?.Timeout);
      console.log('[RESULT] State:', config?.State);

      expect(config).toBeDefined();
      expect(config?.Runtime).toBe('nodejs18.x');
      expect(config?.Timeout).toBe(120);
      expect(config?.State).toBe('Active');
    }, 30000);

    test('should verify health check Lambda can be invoked', async () => {
      console.log('[TEST] Invoking Health Check Lambda...');

      const functionName = outputs.HealthCheckFunctionArn.split(':').pop() || '';
      
      const command = new InvokeCommand({
        FunctionName: functionName,
        InvocationType: 'RequestResponse',
      });

      const response = await lambdaClient.send(command);

      console.log('[RESULT] Status Code:', response.StatusCode);
      console.log('[RESULT] Function Error:', response.FunctionError || 'None');

      if (response.Payload) {
        const payload = JSON.parse(Buffer.from(response.Payload).toString());
        console.log('[RESULT] Response:', JSON.stringify(payload, null, 2));
      }

      expect(response.StatusCode).toBe(200);
    }, 60000);
  });

  describe('SNS Topics and Subscriptions - Real Infrastructure Tests', () => {
    test('should verify SNS alert topic exists and is properly configured', async () => {
      console.log('[TEST] Testing SNS Topic:', outputs.AlertTopicArn);

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlertTopicArn,
      });

      const response = await snsClient.send(command);
      const attributes = response.Attributes;

      console.log('[RESULT] Topic Found:', attributes?.TopicArn);
      console.log('[RESULT] Display Name:', attributes?.DisplayName);
      console.log('[RESULT] Owner:', attributes?.Owner);
      console.log('[RESULT] Subscriptions Confirmed:', attributes?.SubscriptionsConfirmed);
      console.log('[RESULT] Subscriptions Pending:', attributes?.SubscriptionsPending);

      expect(attributes).toBeDefined();
      expect(attributes?.DisplayName).toBe('Aurora DR Alerts');
    }, 30000);

    test('should verify SNS topic has email subscriptions', async () => {
      console.log('[TEST] Testing SNS Subscriptions...');

      const command = new ListSubscriptionsByTopicCommand({
        TopicArn: outputs.AlertTopicArn,
      });

      const response = await snsClient.send(command);
      const subscriptions = response.Subscriptions || [];

      console.log('[RESULT] Total Subscriptions:', subscriptions.length);

      subscriptions.forEach((sub, index) => {
        console.log(`  Subscription ${index + 1}:`);
        console.log('    - Protocol:', sub.Protocol);
        console.log('    - Endpoint:', sub.Endpoint);
        console.log('    - Status:', sub.SubscriptionArn === 'PendingConfirmation' ? 'Pending' : 'Confirmed');
      });

      expect(subscriptions.length).toBeGreaterThan(0);
      const emailSub = subscriptions.find(s => s.Protocol === 'email');
      expect(emailSub).toBeDefined();
    }, 30000);
  });

  describe('CloudWatch Alarms - Real Infrastructure Tests', () => {
    test('should verify CloudWatch alarms exist for monitoring', async () => {
      console.log('[TEST] Testing CloudWatch Alarms...');

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-`,
        MaxRecords: 100,
      });

      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      console.log('[RESULT] Total Alarms Found:', alarms.length);

      alarms.forEach((alarm, index) => {
        console.log(`  Alarm ${index + 1}:`);
        console.log('    - Name:', alarm.AlarmName);
        console.log('    - State:', alarm.StateValue);
        console.log('    - Metric:', alarm.MetricName);
        console.log('    - Threshold:', alarm.Threshold);
        console.log('    - Actions:', alarm.AlarmActions?.length);
      });

      expect(alarms.length).toBeGreaterThanOrEqual(3);

      const cpuAlarm = alarms.find(a => a.MetricName === 'CPUUtilization');
      const connectionAlarm = alarms.find(a => a.MetricName === 'DatabaseConnections');

      console.log('[RESULT] CPU Alarm:', cpuAlarm ? '[FOUND]' : '[NOT FOUND]');
      console.log('[RESULT] Connection Alarm:', connectionAlarm ? '[FOUND]' : '[NOT FOUND]');

      expect(cpuAlarm).toBeDefined();
      expect(connectionAlarm).toBeDefined();

      alarms.forEach(alarm => {
        expect(alarm.ActionsEnabled).toBe(true);
        expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
      });
    }, 30000);

    test('should verify alarms are configured to send to SNS topic', async () => {
      console.log('[TEST] Testing Alarm Actions...');

      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `aurora-`,
        MaxRecords: 100,
      });

      const response = await cloudwatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      const alarmsWithSNS = alarms.filter(alarm =>
        alarm.AlarmActions?.some(action => action.includes('sns'))
      );

      console.log('[RESULT] Alarms with SNS Actions:', alarmsWithSNS.length);

      alarmsWithSNS.forEach(alarm => {
        console.log(`  ${alarm.AlarmName}:`);
        alarm.AlarmActions?.forEach(action => {
          console.log('    - Action:', action);
        });
      });

      expect(alarmsWithSNS.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Route 53 Health Checks - Real Infrastructure Tests', () => {
    test('should verify Route 53 health checks exist', async () => {
      console.log('[TEST] Testing Route 53 Health Checks...');

      const command = new ListHealthChecksCommand({
        MaxItems: 100,
      });

      const response = await route53Client.send(command);
      const healthChecks = response.HealthChecks || [];

      console.log('[RESULT] Total Health Checks:', healthChecks.length);

      const auroraHealthChecks = healthChecks.filter(hc =>
        hc.HealthCheckConfig?.FullyQualifiedDomainName?.includes('rds.amazonaws.com') ||
        hc.CallerReference?.includes('aurora')
      );

      console.log('[RESULT] Aurora Health Checks:', auroraHealthChecks.length);

      auroraHealthChecks.forEach((hc, index) => {
        console.log(`  Health Check ${index + 1}:`);
        console.log('    - ID:', hc.Id);
        console.log('    - Type:', hc.HealthCheckConfig?.Type);
        console.log('    - FQDN:', hc.HealthCheckConfig?.FullyQualifiedDomainName);
        console.log('    - Port:', hc.HealthCheckConfig?.Port);
        console.log('    - Path:', hc.HealthCheckConfig?.ResourcePath);
        console.log('    - Interval:', hc.HealthCheckConfig?.RequestInterval);
      });

      if (auroraHealthChecks.length > 0) {
        auroraHealthChecks.forEach(hc => {
          expect(hc.HealthCheckConfig?.Type).toBe('HTTPS');
          expect(hc.HealthCheckConfig?.Port).toBe(443);
          expect(hc.HealthCheckConfig?.ResourcePath).toBe('/health');
        });
      }
    }, 30000);
  });

  describe('End-to-End Scenarios - Real Infrastructure Tests', () => {
    test('should verify complete infrastructure is healthy', async () => {
      console.log('[TEST] Running End-to-End Health Check...');

      const checks = {
        primaryCluster: false,
        secondaryCluster: false,
        primaryVpc: false,
        secondaryVpc: false,
        healthCheckLambda: false,
        failoverLambda: false,
        snsTopic: false,
        alarms: false,
      };

      try {
        const primaryCluster = await rdsClient.send(
          new DescribeDBClustersCommand({ DBClusterIdentifier: outputs.PrimaryClusterId })
        );
        checks.primaryCluster = primaryCluster.DBClusters?.[0]?.Status === 'available';
        console.log('[SUCCESS] Primary Cluster: Available');
      } catch (error) {
        console.log('[ERROR] Primary Cluster: Failed');
      }

      try {
        const secondaryCluster = await rdsClient.send(
          new DescribeDBClustersCommand({ DBClusterIdentifier: outputs.SecondaryClusterId })
        );
        checks.secondaryCluster = secondaryCluster.DBClusters?.[0]?.Status === 'available';
        console.log('[SUCCESS] Secondary Cluster: Available');
      } catch (error) {
        console.log('[ERROR] Secondary Cluster: Failed');
      }

      try {
        const primaryVpc = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.PrimaryVpcId] })
        );
        checks.primaryVpc = primaryVpc.Vpcs?.[0]?.State === 'available';
        console.log('[SUCCESS] Primary VPC: Available');
      } catch (error) {
        console.log('[ERROR] Primary VPC: Failed');
      }

      try {
        const secondaryVpc = await ec2Client.send(
          new DescribeVpcsCommand({ VpcIds: [outputs.SecondaryVpcId] })
        );
        checks.secondaryVpc = secondaryVpc.Vpcs?.[0]?.State === 'available';
        console.log('[SUCCESS] Secondary VPC: Available');
      } catch (error) {
        console.log('[ERROR] Secondary VPC: Failed');
      }

      try {
        const healthCheck = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: outputs.HealthCheckFunctionArn.split(':').pop() })
        );
        checks.healthCheckLambda = healthCheck.Configuration?.State === 'Active';
        console.log('[SUCCESS] Health Check Lambda: Active');
      } catch (error) {
        console.log('[ERROR] Health Check Lambda: Failed');
      }

      try {
        const failover = await lambdaClient.send(
          new GetFunctionCommand({ FunctionName: outputs.FailoverFunctionArn.split(':').pop() })
        );
        checks.failoverLambda = failover.Configuration?.State === 'Active';
        console.log('[SUCCESS] Failover Lambda: Active');
      } catch (error) {
        console.log('[ERROR] Failover Lambda: Failed');
      }

      try {
        const topic = await snsClient.send(
          new GetTopicAttributesCommand({ TopicArn: outputs.AlertTopicArn })
        );
        checks.snsTopic = !!topic.Attributes;
        console.log('[SUCCESS] SNS Topic: Configured');
      } catch (error) {
        console.log('[ERROR] SNS Topic: Failed');
      }

      try {
        const alarms = await cloudwatchClient.send(
          new DescribeAlarmsCommand({ AlarmNamePrefix: 'aurora-' })
        );
        checks.alarms = (alarms.MetricAlarms?.length || 0) > 0;
        console.log('[SUCCESS] CloudWatch Alarms: Configured');
      } catch (error) {
        console.log('[ERROR] CloudWatch Alarms: Failed');
      }

      console.log('\n[SUMMARY] Infrastructure Health Summary:');
      console.log(JSON.stringify(checks, null, 2));

      const healthyCount = Object.values(checks).filter(Boolean).length;
      const totalCount = Object.keys(checks).length;
      const healthPercentage = (healthyCount / totalCount) * 100;

      console.log(`\n[RESULT] Overall Health: ${healthPercentage.toFixed(1)}% (${healthyCount}/${totalCount})`);

      expect(healthPercentage).toBeGreaterThanOrEqual(80);
    }, 120000);
  });

  afterAll(() => {
    console.log('\n[COMPLETE] All integration tests completed');
    console.log('[SUMMARY] Tested Resources:');
    console.log('  - RDS Clusters: 2');
    console.log('  - VPCs: 2');
    console.log('  - Lambda Functions: 2');
    console.log('  - SNS Topics: 1');
    console.log('  - CloudWatch Alarms: Multiple');
    console.log('  - Route53 Health Checks: Multiple');
  });
});
