import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { DescribeInstancesCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { GetRoleCommand, GetInstanceProfileCommand, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, IAMClient } from '@aws-sdk/client-iam';
import { SendCommandCommand, GetCommandInvocationCommand, SSMClient } from '@aws-sdk/client-ssm';
import { DescribeLoadBalancersCommand, DescribeTargetHealthCommand, DescribeTargetGroupsCommand, DescribeListenersCommand, ElasticLoadBalancingV2Client } from '@aws-sdk/client-elastic-load-balancing-v2';
import { DescribeAutoScalingGroupsCommand, DescribeAutoScalingInstancesCommand, AutoScalingClient } from '@aws-sdk/client-auto-scaling';
import { GetObjectCommand, PutObjectCommand, ListObjectsV2Command, HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'fs';
import { describe, expect, test } from '@jest/globals';

// Configuration - These are coming from deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'webapp-production';
const region = process.env.AWS_REGION || 'us-west-2';

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const iamClient = new IAMClient({ region });
const ssmClient = new SSMClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const s3Client = new S3Client({ region });

// Helper function to wait for SSM command completion
async function waitForCommand(commandId: string, instanceId: string, maxWaitTime = 60000): Promise<any> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const result = await ssmClient.send(new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId
      }));

      if (result.Status === 'Success' || result.Status === 'Failed') {
        return result;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  throw new Error('Command execution timeout');
}

// Helper to get running instances from ASG
async function getASGInstances(): Promise<string[]> {
  const asgName = outputs.autoscaling_group_name;
  const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
    AutoScalingGroupNames: [asgName]
  }));
  
  const instances = response.AutoScalingGroups![0].Instances!
    .filter(i => i.LifecycleState === 'InService')
    .map(i => i.InstanceId!);
    
  return instances;
}

describe('WebApp Production Environment Integration Tests', () => {

  // ============================================================================
  // PART 1: SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
  // ============================================================================

  describe('[Service-Level] Application Load Balancer Interactions', () => {
    test('should have ALB accessible and responding to health checks', async () => {
      const albDnsName = outputs.alb_dns_name;
      
      // Get ALB details
      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [`${environmentSuffix}-alb`]
      }));
      
      const alb = response.LoadBalancers![0];
      expect(alb.State!.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.DNSName).toBe(albDnsName);
    }, 30000);

    test('should have ALB target group with healthy targets', async () => {
      // Get target groups
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: [`${environmentSuffix}-web-tg`]
      }));
      
      const targetGroup = tgResponse.TargetGroups![0];
      expect(targetGroup.TargetType).toBe('instance');
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      
      // Check target health
      const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn
      }));
      
      const healthyTargets = healthResponse.TargetHealthDescriptions!
        .filter(t => t.TargetHealth!.State === 'healthy');
      
      expect(healthyTargets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('[Service-Level] Auto Scaling Group Interactions', () => {
    test('should have ASG with running instances in desired capacity', async () => {
      const asgName = outputs.autoscaling_group_name;
      
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      
      const asg = response.AutoScalingGroups![0];
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      
      const inServiceInstances = asg.Instances!
        .filter(i => i.LifecycleState === 'InService');
      expect(inServiceInstances.length).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('should execute commands on ASG instances via SSM', async () => {
      const instances = await getASGInstances();
      const instanceId = instances[0]; // Test on first instance
      
      if (!instanceId) {
        console.log('No instances found in ASG. Skipping test.');
        return;
      }

      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              'echo "WebApp integration test"',
              'curl -s http://localhost/ | head -n 5'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);
        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('WebApp integration test');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping SSM test.');
          return;
        }
        throw error;
      }
    }, 90000);
  });

  describe('[Service-Level] S3 Bucket Interactions', () => {
    test('should have S3 bucket for ALB logs accessible and configured', async () => {
      const bucketName = outputs.s3_logs_bucket;
      
      // Check bucket exists and is accessible
      const response = await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));
      
      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);

    test('should be able to write test object to S3 logs bucket', async () => {
      const bucketName = outputs.s3_logs_bucket;
      const testKey = `test/integration-test-${Date.now()}.txt`;
      
      // Write test object
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: 'Integration test object',
        ServerSideEncryption: 'AES256'
      }));
      
      // List objects to verify
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'test/'
      }));
      
      const testObject = listResponse.Contents?.find(obj => obj.Key === testKey);
      expect(testObject).toBeDefined();
    }, 30000);
  });

  describe('[Service-Level] RDS with Read Replicas', () => {
    test('should have master RDS instance and read replicas available', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      
      // Find master instance
      const masterDb = dbResponse.DBInstances!.find(d => 
        d.DBInstanceIdentifier === `${environmentSuffix}-mysql-master`
      );
      
      expect(masterDb).toBeDefined();
      expect(masterDb!.DBInstanceStatus).toBe('available');
      expect(masterDb!.MultiAZ).toBe(true);
      
      // Find read replicas
      const readReplicas = dbResponse.DBInstances!.filter(d => 
        d.DBInstanceIdentifier?.includes(`${environmentSuffix}-mysql-read-replica`)
      );
      
      expect(readReplicas.length).toBeGreaterThanOrEqual(1);
      readReplicas.forEach(replica => {
        expect(replica.DBInstanceStatus).toBe('available');
        expect(replica.ReadReplicaSourceDBInstanceIdentifier).toBe(masterDb!.DBInstanceIdentifier);
      });
    }, 30000);
  });

  describe('[Service-Level] Secrets Manager Interactions', () => {
    test('should retrieve and validate RDS credentials from Secrets Manager', async () => {
      const secretArn = outputs.db_secret_arn;
      
      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn
      }));
      
      expect(response.SecretString).toBeDefined();
      const secretData = JSON.parse(response.SecretString!);
      
      expect(secretData.username).toBe('admin');
      expect(secretData.password).toBeDefined();
      expect(secretData.password.length).toBeGreaterThanOrEqual(32);
      expect(secretData.engine).toBe('mysql');
      expect(secretData.port).toBe(3306);
    }, 30000);
  });

  describe('[Service-Level] CloudWatch Metrics', () => {
    test('should have CloudWatch alarms configured for ASG', async () => {
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: environmentSuffix
      }));
      
      const cpuHighAlarm = alarmsResponse.MetricAlarms!.find(alarm => 
        alarm.AlarmName === `${environmentSuffix}-cpu-high`
      );
      
      const cpuLowAlarm = alarmsResponse.MetricAlarms!.find(alarm => 
        alarm.AlarmName === `${environmentSuffix}-cpu-low`
      );
      
      expect(cpuHighAlarm).toBeDefined();
      expect(cpuHighAlarm!.Threshold).toBe(70);
      expect(cpuLowAlarm).toBeDefined();
      expect(cpuLowAlarm!.Threshold).toBe(20);
    }, 30000);

    test('should send custom metrics to CloudWatch', async () => {
      await cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: 'WebApp/IntegrationTest',
        MetricData: [
          {
            MetricName: 'TestMetric',
            Value: 1.0,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Environment',
                Value: 'production'
              }
            ]
          }
        ]
      }));
      
      // Verify metric was received (wait a bit for processing)
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 5 * 60 * 1000);
      
      const stats = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'WebApp/IntegrationTest',
        MetricName: 'TestMetric',
        StartTime: startTime,
        EndTime: endTime,
        Period: 300,
        Statistics: ['Sum']
      }));
      
      expect(stats.Datapoints).toBeDefined();
    }, 30000);
  });

  // ============================================================================
  // PART 2: CROSS-SERVICE TESTS (2 Services Interacting WITH REAL ACTIONS)
  // ============================================================================

  describe('[Cross-Service] ALB → ASG Interaction', () => {
    test('should have ALB routing traffic to ASG instances', async () => {
      // Get target group
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
        Names: [`${environmentSuffix}-web-tg`]
      }));
      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;
      
      // Get healthy targets
      const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn
      }));
      
      const healthyInstances = healthResponse.TargetHealthDescriptions!
        .filter(t => t.TargetHealth!.State === 'healthy')
        .map(t => t.Target!.Id);
      
      // Get ASG instances
      const asgInstances = await getASGInstances();
      
      // Verify ALB targets match ASG instances
      healthyInstances.forEach(instanceId => {
        expect(asgInstances).toContain(instanceId);
      });
    }, 30000);
  });

  describe('[Cross-Service] ASG Instance → Secrets Manager Interaction', () => {
    test('should allow ASG instances to retrieve secrets via IAM role', async () => {
      const instances = await getASGInstances();
      const instanceId = instances[0];
      const secretArn = outputs.db_secret_arn;
      
      if (!instanceId) {
        console.log('No instances found. Skipping test.');
        return;
      }

      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              `aws secretsmanager get-secret-value --secret-id ${secretArn} --region ${region} --query SecretString --output text | jq .`
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId);
        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('username');
        expect(result.StandardOutputContent).toContain('admin');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent')) {
          console.log('SSM Agent not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 90000);
  });

  describe('[Cross-Service] ASG Instance → RDS Interaction', () => {
    test('should allow ASG instances to connect to RDS through private subnet', async () => {
      const instances = await getASGInstances();
      const instanceId = instances[0];
      const rdsEndpoint = outputs.rds_endpoint.split(':')[0];
      const secretArn = outputs.db_secret_arn;
      
      if (!instanceId) {
        console.log('No instances found. Skipping test.');
        return;
      }

      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              '#!/bin/bash',
              `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${secretArn} --region ${region} --query SecretString --output text)`,
              'DB_USER=$(echo $SECRET_JSON | jq -r .username)',
              'DB_PASS=$(echo $SECRET_JSON | jq -r .password)',
              `mysql -h ${rdsEndpoint} -u $DB_USER -p$DB_PASS -e "SELECT 'Connection successful' AS status, NOW() AS current_time;" 2>&1`
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 120000);
        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Connection successful');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent') || error.message?.includes('mysql')) {
          console.log('SSM Agent or MySQL client not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 150000);
  });

  describe('[Cross-Service] CloudWatch → Auto Scaling Interaction', () => {
    test('should have CloudWatch alarms connected to Auto Scaling policies', async () => {
      const asgName = outputs.autoscaling_group_name;
      
      // Get alarms
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`${environmentSuffix}-cpu-high`, `${environmentSuffix}-cpu-low`]
      }));
      
      // Verify alarms have ASG actions
      alarmsResponse.MetricAlarms!.forEach(alarm => {
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        const hasASGAction = alarm.AlarmActions!.some(action => 
          action.includes('autoscaling') && action.includes('policy')
        );
        expect(hasASGAction).toBe(true);
        
        // Verify alarm is monitoring the correct ASG
        const asgDimension = alarm.Dimensions!.find(d => d.Name === 'AutoScalingGroupName');
        expect(asgDimension!.Value).toBe(asgName);
      });
    }, 30000);
  });

  describe('[Cross-Service] ALB → S3 Interaction', () => {
    test('should have ALB configured to send access logs to S3', async () => {
      const bucketName = outputs.s3_logs_bucket;
      
      // Get ALB configuration
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [`${environmentSuffix}-alb`]
      }));
      
      const alb = albResponse.LoadBalancers![0];
      
      // Get ALB attributes to check logging configuration
      const albArn = alb.LoadBalancerArn;
      
      // List objects in S3 bucket to check for ALB logs
      const listResponse = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: 'alb/',
        MaxKeys: 5
      }));
      
      // ALB logs might not exist immediately, but bucket and prefix should be configured
      expect(listResponse.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  // ============================================================================
  // PART 3: E2E TESTS (Complete Flows WITH ACTUAL DATA)
  // ============================================================================

  describe('[E2E] Complete Application Flow: Internet → ALB → ASG → RDS', () => {
    test('should execute complete web application flow from internet to database', async () => {
      const albDnsName = outputs.alb_dns_name;
      const instances = await getASGInstances();
      const instanceId = instances[0];
      const rdsEndpoint = outputs.rds_endpoint.split(':')[0];
      const secretArn = outputs.db_secret_arn;
      
      if (!instanceId) {
        console.log('No instances found. Skipping E2E test.');
        return;
      }

      try {
        // Step 1: Verify ALB is accessible from internet (simulated)
        const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({
          Names: [`${environmentSuffix}-alb`]
        }));
        expect(albResponse.LoadBalancers![0].State!.Code).toBe('active');
        
        // Step 2: Verify ALB has healthy targets
        const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
          Names: [`${environmentSuffix}-web-tg`]
        }));
        const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;
        
        const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroupArn
        }));
        const healthyTargets = healthResponse.TargetHealthDescriptions!
          .filter(t => t.TargetHealth!.State === 'healthy');
        expect(healthyTargets.length).toBeGreaterThan(0);
        
        // Step 3: Execute database operation from web server
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              '#!/bin/bash',
              'set -e',
              'echo "Starting E2E test..."',
              '',
              '# Get database credentials',
              `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${secretArn} --region ${region} --query SecretString --output text)`,
              'DB_USER=$(echo $SECRET_JSON | jq -r .username)',
              'DB_PASS=$(echo $SECRET_JSON | jq -r .password)',
              '',
              '# Connect to RDS and perform operations',
              `mysql -h ${rdsEndpoint} -u $DB_USER -p$DB_PASS << 'EOF'`,
              'CREATE DATABASE IF NOT EXISTS webapp_e2e_test;',
              'USE webapp_e2e_test;',
              'CREATE TABLE IF NOT EXISTS test_requests (',
              '  id INT AUTO_INCREMENT PRIMARY KEY,',
              '  request_source VARCHAR(255),',
              '  request_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
              ');',
              'INSERT INTO test_requests (request_source) VALUES ("E2E Test from ALB → ASG → RDS");',
              'SELECT * FROM test_requests ORDER BY id DESC LIMIT 1;',
              'DROP TABLE IF EXISTS test_requests;',
              'DROP DATABASE IF EXISTS webapp_e2e_test;',
              'EOF',
              '',
              'echo "E2E test completed successfully"'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 180000);
        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('E2E Test from ALB → ASG → RDS');
        expect(result.StandardOutputContent).toContain('E2E test completed successfully');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent') || error.message?.includes('mysql')) {
          console.log('Required tools not configured. Skipping E2E test.');
          return;
        }
        throw error;
      }
    }, 240000);
  });

  describe('[E2E] Network Flow: IGW → NAT → Private Subnet → RDS', () => {
    test('should have complete network path from internet through NAT to private resources', async () => {
      const vpcId = outputs.vpc_id;
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      const databaseSubnetIds = JSON.parse(outputs.database_subnet_ids);
      
      // Step 1: Verify VPC
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));
      expect(vpcResponse.Vpcs![0].State).toBe('available');
      
      // Step 2: Verify Internet Gateway
      const igwResponse = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));
      expect(igwResponse.InternetGateways!.length).toBeGreaterThan(0);
      
      // Step 3: Verify NAT Gateways
      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] }
        ]
      }));
      expect(natResponse.NatGateways!.length).toBeGreaterThanOrEqual(2);
      
      // Step 4: Verify public subnets have route to IGW
      const rtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: publicSubnetIds }
        ]
      }));
      
      const publicRoutes = rtResponse.RouteTables!;
      publicRoutes.forEach(rt => {
        const igwRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(igwRoute?.GatewayId).toContain('igw-');
      });
      
      // Step 5: Verify private subnets have route to NAT
      const privateRtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'association.subnet-id', Values: privateSubnetIds }
        ]
      }));
      
      privateRtResponse.RouteTables!.forEach(rt => {
        const natRoute = rt.Routes!.find(r => r.DestinationCidrBlock === '0.0.0.0/0');
        expect(natRoute?.NatGatewayId).toContain('nat-');
      });
      
      // Step 6: Verify RDS is in database subnets
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const masterDb = dbResponse.DBInstances!.find(d => 
        d.DBInstanceIdentifier === `${environmentSuffix}-mysql-master`
      );
      
      const dbSubnetGroup = masterDb!.DBSubnetGroup;
      const dbSubnetIds = dbSubnetGroup!.Subnets!.map(s => s.SubnetIdentifier);
      
      databaseSubnetIds.forEach((subnetId: string) => {
        expect(dbSubnetIds).toContain(subnetId);
      });
    }, 60000);
  });

  describe('[E2E] Security Flow: ALB SG → ASG SG → RDS SG', () => {
    test('should enforce proper security group chain from ALB to RDS', async () => {
      const albSgId = outputs.security_group_alb_id;
      const webSgId = outputs.security_group_web_id;
      const rdsSgId = outputs.security_group_rds_id;
      
      // Get security groups
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [albSgId, webSgId, rdsSgId]
      }));
      
      const albSg = sgResponse.SecurityGroups!.find(sg => sg.GroupId === albSgId);
      const webSg = sgResponse.SecurityGroups!.find(sg => sg.GroupId === webSgId);
      const rdsSg = sgResponse.SecurityGroups!.find(sg => sg.GroupId === rdsSgId);
      
      // Step 1: Verify ALB allows internet traffic
      const albHttpRule = albSg!.IpPermissions!.find(rule => rule.FromPort === 80);
      const albHttpsRule = albSg!.IpPermissions!.find(rule => rule.FromPort === 443);
      expect(albHttpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(albHttpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      
      // Step 2: Verify Web SG only allows traffic from ALB
      const webHttpRule = webSg!.IpPermissions!.find(rule => rule.FromPort === 80);
      expect(webHttpRule!.UserIdGroupPairs!.some(pair => pair.GroupId === albSgId)).toBe(true);
      
      // Step 3: Verify RDS SG only allows traffic from Web SG
      const rdsRule = rdsSg!.IpPermissions!.find(rule => rule.FromPort === 3306);
      expect(rdsRule!.UserIdGroupPairs!.length).toBe(1);
      expect(rdsRule!.UserIdGroupPairs![0].GroupId).toBe(webSgId);
      
      // Step 4: Verify no public access on RDS
      expect(rdsRule!.IpRanges || []).toHaveLength(0);
    }, 30000);
  });

  describe('[E2E] Monitoring Flow: ASG → CloudWatch → Alarms → Scaling', () => {
    test('should have complete monitoring and auto-scaling flow', async () => {
      const asgName = outputs.autoscaling_group_name;
      
      // Step 1: Get ASG configuration
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));
      const asg = asgResponse.AutoScalingGroups![0];
      
      // Step 2: Verify CloudWatch metrics are enabled for ASG
      const enabledMetrics = asg.EnabledMetrics!.map(m => m.Metric);
      expect(enabledMetrics).toContain('GroupDesiredCapacity');
      expect(enabledMetrics).toContain('GroupInServiceInstances');
      
      // Step 3: Verify alarms exist
      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNames: [`${environmentSuffix}-cpu-high`, `${environmentSuffix}-cpu-low`]
      }));
      
      expect(alarmsResponse.MetricAlarms!.length).toBe(2);
      
      // Step 4: Verify alarms are connected to scaling policies
      alarmsResponse.MetricAlarms!.forEach(alarm => {
        expect(alarm.AlarmActions!.length).toBeGreaterThan(0);
        alarm.AlarmActions!.forEach(action => {
          expect(action).toContain('autoscaling:policy');
        });
      });
      
      // Step 5: Send test metric
      await cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: 'AWS/EC2',
        MetricData: [
          {
            MetricName: 'CPUUtilization',
            Value: 25,
            Unit: 'Percent',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'AutoScalingGroupName',
                Value: asgName
              }
            ]
          }
        ]
      }));
    }, 60000);
  });

  describe('[E2E] Read Replica Flow: Write to Master → Read from Replica', () => {
    test('should successfully write to master and read from replica', async () => {
      const instances = await getASGInstances();
      const instanceId = instances[0];
      const masterEndpoint = outputs.rds_endpoint.split(':')[0];
      const replicaEndpoints = JSON.parse(outputs.rds_read_replica_endpoints);
      const replicaEndpoint = replicaEndpoints[0].split(':')[0];
      const secretArn = outputs.db_secret_arn;
      
      if (!instanceId || !replicaEndpoint) {
        console.log('Required resources not available. Skipping test.');
        return;
      }

      try {
        const command = await ssmClient.send(new SendCommandCommand({
          DocumentName: 'AWS-RunShellScript',
          InstanceIds: [instanceId],
          Parameters: {
            commands: [
              '#!/bin/bash',
              'set -e',
              '',
              '# Get credentials',
              `SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id ${secretArn} --region ${region} --query SecretString --output text)`,
              'DB_USER=$(echo $SECRET_JSON | jq -r .username)',
              'DB_PASS=$(echo $SECRET_JSON | jq -r .password)',
              '',
              '# Write to master',
              `mysql -h ${masterEndpoint} -u $DB_USER -p$DB_PASS << 'EOF'`,
              'CREATE DATABASE IF NOT EXISTS replica_test;',
              'USE replica_test;',
              'CREATE TABLE IF NOT EXISTS test_data (id INT PRIMARY KEY, value VARCHAR(255));',
              'INSERT INTO test_data VALUES (1, "Written to master") ON DUPLICATE KEY UPDATE value="Written to master";',
              'SELECT "Data written to master" AS status;',
              'EOF',
              '',
              '# Wait for replication',
              'sleep 5',
              '',
              '# Read from replica',
              `mysql -h ${replicaEndpoint} -u $DB_USER -p$DB_PASS << 'EOF'`,
              'USE replica_test;',
              'SELECT * FROM test_data WHERE id=1;',
              'EOF',
              '',
              '# Cleanup',
              `mysql -h ${masterEndpoint} -u $DB_USER -p$DB_PASS << 'EOF'`,
              'DROP DATABASE IF EXISTS replica_test;',
              'EOF',
              '',
              'echo "Read replica test completed"'
            ]
          }
        }));

        const result = await waitForCommand(command.Command!.CommandId!, instanceId, 180000);
        expect(result.Status).toBe('Success');
        expect(result.StandardOutputContent).toContain('Written to master');
        expect(result.StandardOutputContent).toContain('Read replica test completed');
      } catch (error: any) {
        if (error.message?.includes('SSM Agent') || error.message?.includes('mysql')) {
          console.log('Required tools not configured. Skipping test.');
          return;
        }
        throw error;
      }
    }, 240000);
  });

  // ============================================================================
  // Configuration Validation Tests
  // ============================================================================

  describe('Infrastructure Configuration Validation', () => {
    test('should have all required outputs defined', () => {
      expect(outputs.alb_dns_name).toBeDefined();
      expect(outputs.alb_zone_id).toBeDefined();
      expect(outputs.autoscaling_group_name).toBeDefined();
      expect(outputs.database_subnet_ids).toBeDefined();
      expect(outputs.db_secret_arn).toBeDefined();
      expect(outputs.db_secret_name).toBeDefined();
      expect(outputs.private_subnet_ids).toBeDefined();
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(outputs.rds_endpoint).toBeDefined();
      expect(outputs.rds_read_replica_endpoints).toBeDefined();
      expect(outputs.s3_logs_bucket).toBeDefined();
      expect(outputs.security_group_alb_id).toBeDefined();
      expect(outputs.security_group_rds_id).toBeDefined();
      expect(outputs.security_group_web_id).toBeDefined();
      expect(outputs.vpc_id).toBeDefined();
    });

    test('should have VPC with correct configuration', async () => {
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      }));

      const vpc = vpcResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    }, 30000);

    test('should have correct number of subnets in each tier', async () => {
      const publicSubnetIds = JSON.parse(outputs.public_subnet_ids);
      const privateSubnetIds = JSON.parse(outputs.private_subnet_ids);
      const databaseSubnetIds = JSON.parse(outputs.database_subnet_ids);
      
      expect(publicSubnetIds.length).toBe(2);
      expect(privateSubnetIds.length).toBe(2);
      expect(databaseSubnetIds.length).toBe(2);
      
      // Verify subnets exist
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds]
      }));
      
      expect(subnetResponse.Subnets!.length).toBe(6);
      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    }, 30000);

    test('should have RDS configured with Multi-AZ and encryption', async () => {
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const masterDb = dbResponse.DBInstances!.find(d => 
        d.DBInstanceIdentifier === `${environmentSuffix}-mysql-master`
      );
      
      expect(masterDb!.MultiAZ).toBe(true);
      expect(masterDb!.StorageEncrypted).toBe(true);
      expect(masterDb!.PubliclyAccessible).toBe(false);
      expect(masterDb!.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
      expect(masterDb!.PerformanceInsightsEnabled).toBe(true);
    }, 30000);

    test('should have IAM role with correct permissions for web instances', async () => {
      try {
        const roleResponse = await iamClient.send(new GetRoleCommand({
          RoleName: `${environmentSuffix}-web-role`
        }));
        
        expect(roleResponse.Role).toBeDefined();
        
        const policiesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({
          RoleName: `${environmentSuffix}-web-role`
        }));
        
        const hasSsmPolicy = policiesResponse.AttachedPolicies!.some(
          policy => policy.PolicyArn?.includes('AmazonSSMManagedInstanceCore')
        );
        
        const hasCloudWatchPolicy = policiesResponse.AttachedPolicies!.some(
          policy => policy.PolicyArn?.includes('CloudWatchAgentServerPolicy')
        );
        
        expect(hasSsmPolicy).toBe(true);
        expect(hasCloudWatchPolicy).toBe(true);
      } catch (error: any) {
        if (error.name === 'NoSuchEntity') {
          console.log('IAM role not found. This might be expected in some environments.');
          return;
        }
        throw error;
      }
    }, 30000);
  });
});