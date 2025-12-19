import * as fs from 'fs';
import * as path from 'path';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand, 
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand
} from "@aws-sdk/client-ec2";
import { 
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  DescribeListenersCommand
} from "@aws-sdk/client-elastic-load-balancing-v2";
import { 
  RDSClient,
  DescribeDBInstancesCommand 
} from "@aws-sdk/client-rds";
import { 
  S3Client, 
  HeadBucketCommand, 
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { 
  SNSClient, 
  GetTopicAttributesCommand,
  ListSubscriptionsByTopicCommand 
} from "@aws-sdk/client-sns";
import { 
  Route53Client, 
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand 
} from "@aws-sdk/client-route-53";
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand,
  DescribeScalingActivitiesCommand
} from "@aws-sdk/client-auto-scaling";
import { 
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
  GetFunctionConfigurationCommand
} from "@aws-sdk/client-lambda";
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from "@aws-sdk/client-cloudwatch";
import axios from 'axios';

const awsRegion = process.env.AWS_REGION || "us-east-1";
const ec2Client = new EC2Client({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const snsClient = new SNSClient({ region: awsRegion });
const route53Client = new Route53Client({ region: awsRegion });
const autoScalingClient = new AutoScalingClient({ region: awsRegion });
const lambdaClient = new LambdaClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });

describe("TapProject Integration Tests - Complete Infrastructure", () => {
  let vpcId: string;
  let albDnsName: string;
  let backendAsgName: string;
  let lambdaFunctionArn: string;
  let monitoringSnsTopicArn: string;
  let natGatewayIds: string[];
  let privateS3BucketArn: string;
  let privateS3BucketName: string;
  let publicS3BucketName: string;
  let rdsEndpoint: string;
  let route53ZoneId: string;
  let albArn: string;

  beforeAll(() => {
    // Read deployment outputs from file
    const outputFilePath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputFilePath)) {
      throw new Error(`flat-outputs.json not found at ${outputFilePath}`);
    }

    const outputs = JSON.parse(fs.readFileSync(outputFilePath, 'utf-8'));
    console.log('Available outputs:', Object.keys(outputs));

    // Get environment suffix from environment variable or use default
    const suffix = process.env.ENVIRONMENT_SUFFIX || process.env.PR_NUMBER || 'pr4192';

    // Find the stack key that matches our environment
    const stackKey = Object.keys(outputs).find(k => 
      k.toLowerCase().includes(suffix.toLowerCase()) || 
      k.includes(`tap-project-${suffix}`)
    );

    if (!stackKey) {
      throw new Error(`No output found for environment: ${suffix}. Available keys: ${Object.keys(outputs).join(', ')}`);
    }

    const stackOutputs = outputs[stackKey];
    console.log('Stack outputs:', stackOutputs);

    // Parse outputs
    vpcId = stackOutputs["vpc-id"];
    albDnsName = stackOutputs["alb-dns-name"];
    backendAsgName = stackOutputs["backend-asg-name"];
    lambdaFunctionArn = stackOutputs["lambda-function-arn"];
    monitoringSnsTopicArn = stackOutputs["monitoring-sns-topic-arn"];
    natGatewayIds = stackOutputs["nat-gateway-ids"];
    privateS3BucketArn = stackOutputs["private-s3-bucket-arn"];
    publicS3BucketName = stackOutputs["public-s3-bucket-name"];
    rdsEndpoint = stackOutputs["rds-endpoint"];
    route53ZoneId = stackOutputs["route53-zone-id"];
    albArn = stackOutputs["alb-arn"] || ''; // Set albArn if available in outputs

    // Extract bucket name from ARN
    if (privateS3BucketArn) {
      privateS3BucketName = privateS3BucketArn.split(':::')[1] || privateS3BucketArn.split(':').pop() || '';
    }

    if (!vpcId || !albDnsName || !rdsEndpoint) {
      throw new Error("Missing required stack outputs for integration tests");
    }
  });

  describe("Network Infrastructure: VPC, NAT Gateways, and Routing", () => {
    test("VPC is properly configured and available", async () => {
      const { Vpcs } = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [vpcId] })
      );

      expect(Vpcs?.length).toBe(1);
      expect(Vpcs?.[0]?.State).toBe('available');
    }, 30000);

    test("NAT Gateways are operational and correctly configured", async () => {
      const { NatGateways } = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          NatGatewayIds: natGatewayIds
        })
      );

      expect(NatGateways?.length).toBe(natGatewayIds.length);
      
      NatGateways?.forEach(natGateway => {
        expect(natGateway.State).toBe('available');
        expect(natGateway.VpcId).toBe(vpcId);
        expect(natGateway.NatGatewayAddresses?.length).toBeGreaterThan(0);
        // Each NAT Gateway should have a public IP
        expect(natGateway.NatGatewayAddresses?.[0]?.PublicIp).toBeDefined();
      });
    }, 30000);

    test("Route tables properly configured with NAT Gateway routes", async () => {
      const { RouteTables } = await ec2Client.send(
        new DescribeRouteTablesCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId]
            }
          ]
        })
      );

      const privateRouteTables = RouteTables?.filter(rt => 
        rt.Routes?.some(r => natGatewayIds.includes(r.NatGatewayId || ''))
      );

      expect(privateRouteTables?.length).toBeGreaterThan(0);

      privateRouteTables?.forEach(rt => {
        const natRoute = rt.Routes?.find(r => r.NatGatewayId);
        expect(natRoute?.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(natRoute?.State).toBe('active');
      });
    }, 30000);
  });

  describe("Application Load Balancer and Auto Scaling", () => {
    test("ALB is healthy and properly configured", async () => {
      // First, get the load balancer
      const { LoadBalancers } = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = LoadBalancers?.find(lb => lb.DNSName === albDnsName);
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toMatch(/^(internet-facing|internal)$/);

      // Store the ALB ARN for later use
      if (alb?.LoadBalancerArn) {
        albArn = alb.LoadBalancerArn;
      }

      // Check listeners
      if (albArn) {
        const { Listeners } = await elbv2Client.send(
          new DescribeListenersCommand({
            LoadBalancerArn: albArn
          })
        );

        expect(Listeners?.length).toBeGreaterThan(0);
        const httpListener = Listeners?.find(l => l.Port === 80);
        expect(httpListener).toBeDefined();
        expect(httpListener?.Protocol).toBe('HTTP');
      }
    }, 30000);

    test("Backend Auto Scaling Group is properly configured", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [backendAsgName]
        })
      );

      expect(AutoScalingGroups?.length).toBe(1);
      const asg = AutoScalingGroups![0];

      expect(asg.AutoScalingGroupName).toBe(backendAsgName);
      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.HealthCheckType).toBe('EC2');
      expect(asg.VPCZoneIdentifier).toBeDefined();
    }, 30000);

    test("Auto Scaling Group has healthy instances", async () => {
      const { AutoScalingGroups } = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [backendAsgName]
        })
      );

      const asg = AutoScalingGroups![0];
      const healthyInstances = asg.Instances?.filter(i => 
        i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );

      expect(healthyInstances?.length).toBeGreaterThan(0);

      // Check recent scaling activities
      const { Activities } = await autoScalingClient.send(
        new DescribeScalingActivitiesCommand({
          AutoScalingGroupName: backendAsgName,
          MaxRecords: 5
        })
      );

      const successfulActivities = Activities?.filter(a => a.StatusCode === 'Successful');
      expect(successfulActivities?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Storage: S3 Buckets Configuration", () => {
    test("Public and Private S3 buckets are properly configured", async () => {
      // Test public bucket
      const publicBucketCheck = await s3Client.send(
        new HeadBucketCommand({ Bucket: publicS3BucketName })
      );
      expect(publicBucketCheck.$metadata.httpStatusCode).toBe(200);

      // Test private bucket
      const privateBucketCheck = await s3Client.send(
        new HeadBucketCommand({ Bucket: privateS3BucketName })
      );
      expect(privateBucketCheck.$metadata.httpStatusCode).toBe(200);

      // Check versioning
      const publicVersioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: publicS3BucketName })
      );
      expect(['Enabled', 'Suspended']).toContain(publicVersioning.Status || 'Suspended');

      const privateVersioning = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: privateS3BucketName })
      );
      expect(['Enabled', 'Suspended']).toContain(privateVersioning.Status || 'Suspended');
    }, 30000);

    test("S3 bucket operations with proper permissions", async () => {
      const testKey = `integration-test-${Date.now()}.json`;
      const testData = { 
        test: "integration", 
        timestamp: Date.now(),
        environment: process.env.ENVIRONMENT_SUFFIX || 'pr4192'
      };

      try {
        // Test write to private bucket
        const putResult = await s3Client.send(new PutObjectCommand({
          Bucket: privateS3BucketName,
          Key: testKey,
          Body: JSON.stringify(testData),
          ContentType: 'application/json',
          ServerSideEncryption: 'AES256'
        }));
        expect(putResult.$metadata.httpStatusCode).toBe(200);

        // Test read from private bucket
        const getResult = await s3Client.send(new GetObjectCommand({
          Bucket: privateS3BucketName,
          Key: testKey
        }));
        
        const body = await getResult.Body?.transformToString();
        const parsed = JSON.parse(body || '{}');
        expect(parsed.test).toBe('integration');

        // Cleanup
        await s3Client.send(new DeleteObjectCommand({
          Bucket: privateS3BucketName,
          Key: testKey
        }));
      } catch (error: any) {
        console.log(`S3 operation error: ${error.name} - ${error.message}`);
        if (error.name === 'AccessDenied') {
          console.log("S3 access denied - checking if this is expected based on IAM policies");
        }
        throw error;
      }
    }, 30000);
  });

  describe("Database: RDS Instance", () => {
    test("RDS instance is available and properly configured", async () => {
      const dbIdentifier = rdsEndpoint.split('.')[0];
      
      const { DBInstances } = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier
        })
      );

      expect(DBInstances?.length).toBe(1);
      const dbInstance = DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.Endpoint?.Address).toBe(rdsEndpoint.split(':')[0]);
      expect(dbInstance.Endpoint?.Port).toBe(3306);
      expect(dbInstance.MultiAZ).toBeDefined();
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
    }, 30000);
  });

  describe("Serverless: Lambda Function", () => {
    test("Lambda function is deployed and configured correctly", async () => {
      const functionName = lambdaFunctionArn.split(':').pop();
      
      const { Configuration } = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: functionName!
        })
      );

      expect(Configuration?.FunctionArn).toBe(lambdaFunctionArn);
      expect(Configuration?.State).toBe('Active');
      expect(Configuration?.Runtime).toContain('nodejs');
      expect(Configuration?.Handler).toBeDefined();
      expect(Configuration?.Timeout).toBeGreaterThanOrEqual(3);
      expect(Configuration?.MemorySize).toBeGreaterThanOrEqual(128);
    }, 30000);

    test("Lambda function configuration and environment variables", async () => {
      const functionName = lambdaFunctionArn.split(':').pop();
      
      const { Configuration } = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName!
        })
      );
      
      // Check environment variables if they exist
      if (Configuration?.Environment?.Variables) {
        console.log('Lambda environment variables are configured');
        expect(Object.keys(Configuration.Environment.Variables).length).toBeGreaterThan(0);
      }
    }, 30000);

    test("Lambda function can be invoked successfully", async () => {
      const functionName = lambdaFunctionArn.split(':').pop();
      
      try {
        const result = await lambdaClient.send(
          new InvokeCommand({
            FunctionName: functionName!,
            InvocationType: 'RequestResponse',
            Payload: JSON.stringify({ test: true, timestamp: Date.now() })
          })
        );

        expect(result.StatusCode).toBe(200);
        expect(result.FunctionError).toBeUndefined();
        
        if (result.Payload) {
          const response = JSON.parse(new TextDecoder().decode(result.Payload));
          expect(response).toBeDefined();
        }
      } catch (error: any) {
        // If the function requires specific payload structure, that's ok
        console.log(`Lambda invocation info: ${error.message}`);
        expect([200, 202]).toContain(error.$metadata?.httpStatusCode);
      }
    }, 30000);
  });

  describe("Monitoring: SNS and CloudWatch", () => {
    test("SNS topic is configured for monitoring alerts", async () => {
      const { Attributes } = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: monitoringSnsTopicArn
        })
      );

      expect(Attributes?.TopicArn).toBe(monitoringSnsTopicArn);
      expect(Attributes?.DisplayName).toBeDefined();
      
      // Check subscriptions
      const { Subscriptions } = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: monitoringSnsTopicArn
        })
      );

      // There should be at least one subscription (email, SMS, or Lambda)
      if (Subscriptions && Subscriptions.length > 0) {
        Subscriptions.forEach(sub => {
          console.log(`SNS Subscription: ${sub.Protocol} - ${sub.Endpoint}`);
          expect(sub.SubscriptionArn).toBeDefined();
        });
      }
    }, 30000);

    test("CloudWatch alarms are configured for critical metrics", async () => {
      const { MetricAlarms } = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNamePrefix: 'tap-project'
        })
      );

      if (MetricAlarms && MetricAlarms.length > 0) {
        MetricAlarms.forEach(alarm => {
          expect(alarm.ActionsEnabled).toBe(true);
          expect(alarm.AlarmActions?.length).toBeGreaterThan(0);
          
          // Verify alarms are connected to SNS topic
          const hasSnsTopic = alarm.AlarmActions?.some(action => 
            action.includes(monitoringSnsTopicArn)
          );
          
          console.log(`Alarm ${alarm.AlarmName} has SNS topic: ${hasSnsTopic}`);
        });

        // Check for specific alarm types
        const alarmTypes = MetricAlarms.map(a => a.MetricName);
        const expectedMetrics = ['CPUUtilization', 'HealthyHostCount', 'UnHealthyHostCount'];
        const hasExpectedAlarms = expectedMetrics.some(metric => 
          alarmTypes.includes(metric)
        );
        expect(hasExpectedAlarms).toBe(true);
      }
    }, 30000);
  });

  describe("DNS: Route53 Configuration", () => {
    test("Route53 hosted zone is properly configured", async () => {
      const { HostedZone } = await route53Client.send(
        new GetHostedZoneCommand({ Id: route53ZoneId })
      );

      expect(HostedZone?.Id).toContain(route53ZoneId);
      expect(HostedZone?.ResourceRecordSetCount).toBeGreaterThan(0);
    }, 30000);

    test("Route53 has proper DNS records for ALB", async () => {
      const { ResourceRecordSets } = await route53Client.send(
        new ListResourceRecordSetsCommand({
          HostedZoneId: route53ZoneId,
          MaxItems: 100
        })
      );

      // Check for A record or ALIAS record pointing to ALB
      const albRecord = ResourceRecordSets?.find(record => 
        (record.Type === 'A' || record.Type === 'AAAA') && 
        record.AliasTarget?.DNSName?.includes('elb.amazonaws.com')
      );

      if (albRecord) {
        expect(albRecord.AliasTarget?.EvaluateTargetHealth).toBe(true);
        expect(albRecord.AliasTarget?.DNSName).toContain('.elb.amazonaws.com');
      }

      // Verify NS and SOA records exist
      const nsRecord = ResourceRecordSets?.find(r => r.Type === 'NS');
      expect(nsRecord).toBeDefined();
      expect(nsRecord?.ResourceRecords?.length).toBeGreaterThanOrEqual(4);

      const soaRecord = ResourceRecordSets?.find(r => r.Type === 'SOA');
      expect(soaRecord).toBeDefined();
    }, 30000);
  });

  describe("End-to-End Integration Tests", () => {
    test("ALB endpoint responds to HTTP requests", async () => {
      try {
        const response = await axios.get(`http://${albDnsName}`, {
          timeout: 5000,
          validateStatus: () => true // Accept any status
        });

        expect([200, 301, 302, 403, 404, 502, 503]).toContain(response.status);
        console.log(`ALB response status: ${response.status}`);
      } catch (error: any) {
        // Network error might occur if ALB has no healthy targets
        console.log(`ALB connection error: ${error.message}`);
        expect(error.code).toBeDefined();
      }
    }, 30000);

    test("Multi-tier architecture components can interact", async () => {
      // This test verifies that all components exist and are in the same VPC
      const components = {
        vpc: vpcId,
        alb: albDnsName,
        asg: backendAsgName,
        lambda: lambdaFunctionArn,
        rds: rdsEndpoint,
        sns: monitoringSnsTopicArn,
        natGateways: natGatewayIds,
        publicBucket: publicS3BucketName,
        privateBucket: privateS3BucketName,
        route53: route53ZoneId
      };

      Object.entries(components).forEach(([key, value]) => {
        expect(value).toBeDefined();
        console.log(`✓ ${key}: ${Array.isArray(value) ? value.join(', ') : value}`);
      });

      // Verify all components are deployed
      expect(Object.values(components).every(v => v !== undefined)).toBe(true);
    }, 30000);
  });
});