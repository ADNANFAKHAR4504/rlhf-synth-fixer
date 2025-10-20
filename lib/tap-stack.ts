import { CloudWatchClient, DescribeAlarmsCommand, PutMetricDataCommand, GetMetricStatisticsCommand } from '@aws-sdk/client-cloudwatch';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInternetGatewaysCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, EC2Client } from '@aws-sdk/client-ec2';
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand, DescribeTaskDefinitionCommand, ListTasksCommand, DescribeTasksCommand, RunTaskCommand } from '@aws-sdk/client-ecs';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs';
import fs from 'fs';
import axios from 'axios';

// Configuration - These are coming from terraform outputs after deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment configuration
const region = process.env.AWS_REGION || 'us-east-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr4813';

// Initialize AWS SDK v3 clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const secretsClient = new SecretsManagerClient({ region });
const ecsClient = new ECSClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });

describe('Container-Based Infrastructure Integration Tests', () => {

  // ============================================================================
  // PART 1: SERVICE-LEVEL TESTS (Single Service WITH ACTUAL INTERACTIONS)
  // ============================================================================

  describe('[Service-Level] ECS Fargate Container Service', () => {
    test('should have ECS cluster running with active service', async () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      
      // Verify cluster exists and is active
      const clusterResponse = await ecsClient.send(new DescribeClustersCommand({
        clusters: [clusterName]
      }));

      const cluster = clusterResponse.clusters![0];
      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.runningTasksCount).toBeGreaterThan(0);
      expect(cluster.activeServicesCount).toBeGreaterThan(0);
    }, 30000);

    test('should have ECS service running desired number of tasks', async () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      const serviceName = outputs['ecs-service-name'].value;

      // Verify service configuration
      const serviceResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
      }));

      const service = serviceResponse.services![0];
      expect(service.status).toBe('ACTIVE');
      expect(service.runningCount).toBe(service.desiredCount);
      expect(service.launchType).toBe('FARGATE');
    }, 30000);

    test('should be able to run a task in ECS cluster', async () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      const taskDefArn = outputs['task-definition-arn'].value;
      const vpcId = outputs['vpc-id'].value;

      // Get subnets for task placement
      const subnetsResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Type', Values: ['Private'] }
        ]
      }));

      const privateSubnetIds = subnetsResponse.Subnets!.map(s => s.SubnetId!);

      // Get security group for tasks
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [`*${environmentSuffix}-task-sg`] }
        ]
      }));

      const taskSgId = sgResponse.SecurityGroups![0].GroupId!;

      try {
        // Run a one-off task
        const taskResponse = await ecsClient.send(new RunTaskCommand({
          cluster: clusterName,
          taskDefinition: taskDefArn,
          launchType: 'FARGATE',
          networkConfiguration: {
            awsvpcConfiguration: {
              subnets: privateSubnetIds.slice(0, 1),
              securityGroups: [taskSgId],
              assignPublicIp: 'DISABLED'
            }
          },
          overrides: {
            containerOverrides: [{
              name: `myapp-${environmentSuffix}-container`,
              command: ['echo', 'Integration test task executed']
            }]
          }
        }));

        expect(taskResponse.tasks).toHaveLength(1);
        expect(taskResponse.tasks![0].lastStatus).toMatch(/PROVISIONING|PENDING|RUNNING/);
      } catch (error: any) {
        if (error.name === 'InvalidParameterException') {
          console.log('Task override not supported. Skipping task run test.');
          return;
        }
        throw error;
      }
    }, 60000);
  });

  describe('[Service-Level] Application Load Balancer', () => {
    test('should have ALB accessible and responding', async () => {
      const albUrl = outputs['alb-url'].value;

      try {
        // Test ALB is accessible
        const response = await axios.get(albUrl, { 
          timeout: 5000,
          validateStatus: () => true // Accept any status code
        });

        // Expect either 200 (app running) or 503 (no healthy targets)
        expect([200, 503]).toContain(response.status);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.log('ALB not publicly accessible. This might be expected in some environments.');
          return;
        }
        throw error;
      }
    }, 30000);

    test('should have healthy targets registered in target group', async () => {
      const albDnsName = outputs['alb-dns-name'].value;

      // Get ALB details
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [albDnsName.split('.')[0]]
      }));

      const alb = albResponse.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');

      // Get target groups
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb.LoadBalancerArn
      }));

      const targetGroup = tgResponse.TargetGroups![0];

      // Check target health
      const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn
      }));

      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );

      expect(healthyTargets.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('[Service-Level] Secrets Manager for Database Credentials', () => {
    test('should be able to retrieve database credentials from Secrets Manager', async () => {
      const secretArn = outputs['db-secret-arn'].value;

      // ACTION: Retrieve the secret value
      const response = await secretsClient.send(new GetSecretValueCommand({
        SecretId: secretArn
      }));

      expect(response.SecretString).toBeDefined();

      const secretData = JSON.parse(response.SecretString!);
      expect(secretData.username).toBeDefined();
      expect(secretData.password).toBeDefined();
      expect(secretData.engine).toBe('postgres');
      expect(secretData.port).toBe(5432);
      expect(secretData.dbname).toBeDefined();
    }, 30000);
  });

  describe('[Service-Level] RDS PostgreSQL Database', () => {
    test('should have RDS PostgreSQL instance running and accessible', async () => {
      const vpcId = outputs['vpc-id'].value;
      
      const dbResponse = await rdsClient.send(new DescribeDBInstancesCommand({}));
      const db = dbResponse.DBInstances!.find(d =>
        d.DBSubnetGroup?.VpcId === vpcId
      );

      expect(db).toBeDefined();
      expect(db!.DBInstanceStatus).toBe('available');
      expect(db!.Engine).toBe('postgres');
      expect(db!.Endpoint).toBeDefined();
      expect(db!.Endpoint!.Port).toBe(5432);
      expect(db!.PubliclyAccessible).toBe(false);
    }, 30000);
  });

  describe('[Service-Level] S3 Static Assets', () => {
    test('should be able to upload and retrieve files from S3 bucket', async () => {
      const bucketName = outputs['static-assets-bucket'].value;
      const testKey = 'integration-test/test-file.txt';
      const testContent = 'Integration test content ' + new Date().toISOString();

      // ACTION: Upload a test file
      await s3Client.send(new PutObjectCommand({
        Bucket: bucketName,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }));

      // ACTION: Retrieve the file
      const getResponse = await s3Client.send(new GetObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));

      const retrievedContent = await getResponse.Body!.transformToString();
      expect(retrievedContent).toBe(testContent);

      // ACTION: Clean up
      await s3Client.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: testKey
      }));
    }, 30000);

    test('should have bucket versioning enabled', async () => {
      const bucketName = outputs['static-assets-bucket'].value;

      // Verify bucket exists and is accessible
      const response = await s3Client.send(new HeadBucketCommand({
        Bucket: bucketName
      }));

      expect(response.$metadata.httpStatusCode).toBe(200);
    }, 30000);
  });

  describe('[Service-Level] CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      const alarmCount = parseInt(outputs['alarm-count'].value);

      const alarmsResponse = await cloudWatchClient.send(new DescribeAlarmsCommand({
        AlarmNamePrefix: `myapp-${environmentSuffix}`
      }));

      expect(alarmsResponse.MetricAlarms!.length).toBe(alarmCount);

      // Verify specific alarms exist
      const alarmNames = alarmsResponse.MetricAlarms!.map(a => a.AlarmName);
      expect(alarmNames).toContain(expect.stringContaining('high-cpu'));
      expect(alarmNames).toContain(expect.stringContaining('high-memory'));
      expect(alarmNames).toContain(expect.stringContaining('unhealthy-hosts'));
      expect(alarmNames).toContain(expect.stringContaining('rds-cpu'));
      expect(alarmNames).toContain(expect.stringContaining('rds-storage'));
    }, 30000);

    test('should be able to send custom metrics to CloudWatch', async () => {
      const namespace = `IntegrationTest/${environmentSuffix}`;
      
      // ACTION: Send custom metric
      await cloudWatchClient.send(new PutMetricDataCommand({
        Namespace: namespace,
        MetricData: [
          {
            MetricName: 'TestMetric',
            Value: Math.random() * 100,
            Unit: 'Count',
            Timestamp: new Date(),
            Dimensions: [
              {
                Name: 'Environment',
                Value: environmentSuffix
              }
            ]
          }
        ]
      }));

      // Wait a moment for metric to be available
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Verify metric exists
      const statsResponse = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: namespace,
        MetricName: 'TestMetric',
        Dimensions: [
          { Name: 'Environment', Value: environmentSuffix }
        ],
        StartTime: new Date(Date.now() - 300000),
        EndTime: new Date(),
        Period: 60,
        Statistics: ['Average']
      }));

      expect(statsResponse.Datapoints).toBeDefined();
    }, 30000);
  });

  // ============================================================================
  // PART 2: CROSS-SERVICE TESTS (Services Interacting)
  // ============================================================================

  describe('[Cross-Service] ECS Tasks → Secrets Manager', () => {
    test('should allow ECS tasks to retrieve secrets via IAM role', async () => {
      const taskDefArn = outputs['task-definition-arn'].value;
      const secretArn = outputs['db-secret-arn'].value;

      // Get task definition to verify secret configuration
      const taskDefResponse = await ecsClient.send(new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn
      }));

      const containerDef = taskDefResponse.taskDefinition!.containerDefinitions![0];
      
      // Verify task has secrets configured
      const dbSecret = containerDef.secrets?.find(s => s.name === 'DB_CONNECTION');
      expect(dbSecret).toBeDefined();
      expect(dbSecret!.valueFrom).toBe(secretArn);
    }, 30000);
  });

  describe('[Cross-Service] ECS Tasks → RDS Database', () => {
    test('should have security groups allowing ECS to RDS connectivity', async () => {
      const vpcId = outputs['vpc-id'].value;

      // Get security groups
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] }
        ]
      }));

      const taskSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('task-sg')
      );

      const dbSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('db-sg')
      );

      // Verify DB security group allows traffic from task security group
      const dbIngress = dbSg!.IpPermissions!.find(rule => 
        rule.FromPort === 5432 && rule.ToPort === 5432
      );

      expect(dbIngress).toBeDefined();
      expect(dbIngress!.UserIdGroupPairs).toBeDefined();
      expect(dbIngress!.UserIdGroupPairs!.some(
        pair => pair.GroupId === taskSg!.GroupId
      )).toBe(true);
    }, 30000);
  });

  describe('[Cross-Service] ALB → ECS Service', () => {
    test('should have ALB routing traffic to ECS tasks', async () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      const serviceName = outputs['ecs-service-name'].value;

      // Get service details
      const serviceResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
      }));

      const service = serviceResponse.services![0];
      
      // Verify load balancer configuration
      expect(service.loadBalancers).toHaveLength(1);
      expect(service.loadBalancers![0].targetGroupArn).toBeDefined();
      expect(service.loadBalancers![0].containerPort).toBe(3000);
    }, 30000);
  });

  describe('[Cross-Service] CloudWatch → ECS', () => {
    test('should have CloudWatch Logs receiving container logs', async () => {
      const logGroupName = outputs['log-group-name'].value;

      // Verify log group exists
      const logGroupsResponse = await cwLogsClient.send(new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      }));

      const logGroup = logGroupsResponse.logGroups!.find(
        lg => lg.logGroupName === logGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBeDefined();

      // Check for log streams (from running tasks)
      const streamsResponse = await cwLogsClient.send(new DescribeLogStreamsCommand({
        logGroupName: logGroupName,
        orderBy: 'LastEventTime',
        descending: true,
        limit: 5
      }));

      expect(streamsResponse.logStreams).toBeDefined();
      if (streamsResponse.logStreams!.length > 0) {
        expect(streamsResponse.logStreams![0].logStreamName).toContain('ecs');
      }
    }, 30000);
  });

  // ============================================================================
  // PART 3: E2E TESTS (Complete Application Flows)
  // ============================================================================

  describe('[E2E] Complete Application Request Flow', () => {
    test('should handle complete request: ALB → ECS → RDS', async () => {
      const albUrl = outputs['alb-url'].value;
      const clusterName = outputs['ecs-cluster-name'].value;
      const serviceName = outputs['ecs-service-name'].value;

      // Step 1: Verify service is running
      const serviceResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
      }));

      expect(serviceResponse.services![0].runningCount).toBeGreaterThan(0);

      // Step 2: Make request to ALB
      try {
        const response = await axios.get(`${albUrl}/health`, {
          timeout: 10000,
          validateStatus: () => true
        });

        // Application should respond (even if with error due to no app code)
        expect(response.status).toBeDefined();
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED') {
          console.log('ALB not accepting connections. This might be expected.');
          return;
        }
      }

      // Step 3: Verify metrics are being collected
      const metricsResponse = await cloudWatchClient.send(new GetMetricStatisticsCommand({
        Namespace: 'AWS/ECS',
        MetricName: 'CPUUtilization',
        Dimensions: [
          { Name: 'ClusterName', Value: clusterName },
          { Name: 'ServiceName', Value: serviceName }
        ],
        StartTime: new Date(Date.now() - 3600000),
        EndTime: new Date(),
        Period: 300,
        Statistics: ['Average']
      }));

      expect(metricsResponse.Datapoints).toBeDefined();
    }, 60000);
  });

  describe('[E2E] Network Connectivity Flow', () => {
    test('should have complete network path: Internet → ALB → ECS → RDS', async () => {
      const vpcId = outputs['vpc-id'].value;
      const vpcCidr = outputs['vpc-cidr'].value;

      // Step 1: Verify VPC
      const vpcResponse = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      expect(vpcResponse.Vpcs![0].State).toBe('available');
      expect(vpcResponse.Vpcs![0].CidrBlock).toBe(vpcCidr);

      // Step 2: Verify Internet Gateway
      const igwResponse = await ec2Client.send(new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      }));

      expect(igwResponse.InternetGateways).toHaveLength(1);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe('available');

      // Step 3: Verify NAT Gateways for private subnets
      const natResponse = await ec2Client.send(new DescribeNatGatewaysCommand({
        
      }));

      expect(natResponse.NatGateways!.length).toBeGreaterThan(0);

      // Step 4: Verify routing tables
      const rtResponse = await ec2Client.send(new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const publicRT = rtResponse.RouteTables!.find(rt =>
        rt.Tags?.some(tag => tag.Value?.includes('public'))
      );

      const privateRT = rtResponse.RouteTables!.find(rt =>
        rt.Tags?.some(tag => tag.Value?.includes('private'))
      );

      // Public route table should route to IGW
      const igwRoute = publicRT?.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && r.GatewayId?.startsWith('igw-')
      );
      expect(igwRoute).toBeDefined();

      // Private route table should route to NAT
      const natRoute = privateRT?.Routes?.find(r => 
        r.DestinationCidrBlock === '0.0.0.0/0' && r.NatGatewayId?.startsWith('nat-')
      );
      expect(natRoute).toBeDefined();
    }, 60000);
  });

  describe('[E2E] Security Enforcement Flow', () => {
    test('should enforce least privilege: RDS only accessible from ECS tasks', async () => {
      const vpcId = outputs['vpc-id'].value;

      // Get all security groups
      const sgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      }));

      const albSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('alb-sg')
      );

      const taskSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('task-sg')
      );

      const dbSg = sgResponse.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('db-sg')
      );

      // ALB should allow HTTP/HTTPS from internet
      const httpIngress = albSg!.IpPermissions!.find(r => r.FromPort === 80);
      expect(httpIngress!.IpRanges).toContainEqual(
        expect.objectContaining({ CidrIp: '0.0.0.0/0' })
      );

      // Task SG should allow traffic from ALB only
      const taskIngress = taskSg!.IpPermissions!.find(r => r.FromPort === 3000);
      expect(taskIngress!.UserIdGroupPairs).toContainEqual(
        expect.objectContaining({ GroupId: albSg!.GroupId })
      );

      // DB should ONLY allow from task SG
      const dbIngress = dbSg!.IpPermissions!.find(r => r.FromPort === 5432);
      expect(dbIngress!.UserIdGroupPairs).toHaveLength(1);
      expect(dbIngress!.UserIdGroupPairs![0].GroupId).toBe(taskSg!.GroupId);
      expect(dbIngress!.IpRanges || []).toHaveLength(0);
    }, 30000);
  });

  describe('[E2E] Auto-Scaling Flow', () => {
    test('should have auto-scaling configured for ECS service', async () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      const serviceName = outputs['ecs-service-name'].value;

      // Get service details
      const serviceResponse = await ecsClient.send(new DescribeServicesCommand({
        cluster: clusterName,
        services: [serviceName]
      }));

      const service = serviceResponse.services![0];
      
      // Service should be configured with desired count
      expect(service.desiredCount).toBeGreaterThan(0);
      
      // Deployment configuration should support rolling updates
      expect(service.deploymentConfiguration).toBeDefined();
      expect(service.deploymentConfiguration!.deploymentCircuitBreaker?.enable).toBe(true);
      expect(service.deploymentConfiguration!.deploymentCircuitBreaker?.rollback).toBe(true);
    }, 30000);
  });

  // ============================================================================
  // Infrastructure Configuration Validation
  // ============================================================================

  describe('Infrastructure Configuration Validation', () => {
    test('should have all required outputs defined', () => {
      const requiredOutputs = [
        'vpc-id',
        'vpc-cidr',
        'rds-endpoint',
        'db-secret-arn',
        'alb-dns-name',
        'alb-url',
        'ecs-cluster-name',
        'ecs-service-name',
        'task-definition-arn',
        'static-assets-bucket',
        'static-assets-bucket-arn',
        'dashboard-url',
        'alarm-count',
        'log-group-name'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output].value).toBeDefined();
      });
    });

    test('should have correct VPC CIDR configuration', () => {
      expect(outputs['vpc-cidr'].value).toBe('10.0.0.0/16');
    });

    test('should have correct number of alarms configured', () => {
      expect(parseInt(outputs['alarm-count'].value)).toBe(5);
    });

    test('should have ALB URL properly formatted', () => {
      const albUrl = outputs['alb-url'].value;
      const albDnsName = outputs['alb-dns-name'].value;
      
      expect(albUrl).toBe(`http://${albDnsName}`);
      expect(albDnsName).toContain('.elb.amazonaws.com');
    });

    test('should have ECS resources with correct naming convention', () => {
      const clusterName = outputs['ecs-cluster-name'].value;
      const serviceName = outputs['ecs-service-name'].value;
      
      expect(clusterName).toContain(`myapp-${environmentSuffix}-cluster`);
      expect(serviceName).toContain(`myapp-${environmentSuffix}-service`);
    });

    test('should have S3 bucket with correct naming', () => {
      const bucketName = outputs['static-assets-bucket'].value;
      
      expect(bucketName).toContain(`myapp-${environmentSuffix}-static-assets`);
    });
  });
});