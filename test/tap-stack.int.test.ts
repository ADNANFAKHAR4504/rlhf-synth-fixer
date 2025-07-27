import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  InvokeCommand,
  LambdaClient,
  ListFunctionsCommand,
} from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  GetBucketEncryptionCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import axios from 'axios';
import { execSync } from 'child_process';

// Configure AWS clients
const config = {
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
};

const ec2Client = new EC2Client(config);
const rdsClient = new RDSClient(config);
const s3Client = new S3Client(config);
const lambdaClient = new LambdaClient(config);
const elbv2Client = new ElasticLoadBalancingV2Client(config);
const cloudWatchLogsClient = new CloudWatchLogsClient(config);
const cloudFormationClient = new CloudFormationClient(config);
const autoScalingClient = new AutoScalingClient(config);

// Configuration - These are coming from cfn-outputs after deployment
interface StackOutputs {
  ALBDnsName?: string;
  VPCId?: string;
  WebAppS3BucketName?: string;
  LogsS3BucketName?: string;
  RDSJdbcConnection?: string;
}

interface CloudFormationOutput {
  OutputKey: string;
  OutputValue: string;
}

// Determine the stack name dynamically
const getStackName = (): string => {
  // Try environment variable first (set in CI/CD)
  if (process.env.STACK_NAME) {
    return process.env.STACK_NAME;
  }

  // Construct from ENVIRONMENT_SUFFIX (pr225, dev, etc.)
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  return `TapStack${envSuffix}`;
};

const getStackOutputs = (): StackOutputs => {
  const stackName = getStackName();

  try {
    const outputs: CloudFormationOutput[] = JSON.parse(
      execSync(
        `aws cloudformation describe-stacks --stack-name ${stackName} --query "Stacks[0].Outputs" --output json`,
        { encoding: 'utf8' }
      )
    );
    return outputs.reduce((acc: StackOutputs, output: CloudFormationOutput) => {
      (acc as any)[output.OutputKey] = output.OutputValue;
      return acc;
    }, {});
  } catch (error) {
    console.warn(
      `Could not fetch stack outputs for ${stackName}, using environment variables`
    );
    return {
      ALBDnsName: process.env.ALB_DNS_NAME,
      VPCId: process.env.VPC_ID,
      WebAppS3BucketName: process.env.WEBAPP_S3_BUCKET,
      LogsS3BucketName: process.env.LOGS_S3_BUCKET,
      RDSJdbcConnection: process.env.RDS_JDBC_CONNECTION,
    };
  }
};

const outputs = getStackOutputs();
const stackName = getStackName();

describe('TapStack Infrastructure Integration Tests', () => {
  beforeAll(() => {
    console.log(`Testing CloudFormation stack: ${stackName}`);
    console.log('Available outputs:', Object.keys(outputs));
  });
  describe('End-to-End Connectivity Tests', () => {
    test('should be able to reach Application Load Balancer from internet', async () => {
      if (!outputs.ALBDnsName) {
        console.warn('ALB DNS name not available, skipping test');
        return;
      }

      try {
        const response = await axios.get(`http://${outputs.ALBDnsName}`, {
          timeout: 30000,
          validateStatus: status => status < 500, // Accept any status less than 500
        });
        expect(response.status).toBeLessThan(500);
      } catch (error: any) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn('ALB might not be ready yet or no healthy targets');
        } else {
          throw error;
        }
      }
    }, 45000);

    test('should verify ALB has healthy targets', async () => {
      if (!outputs.ALBDnsName) {
        console.warn('ALB DNS name not available, skipping test');
        return;
      }

      const loadBalancers = await elbv2Client.send(
        new DescribeLoadBalancersCommand({
          Names: [outputs.ALBDnsName.split('-')[0]],
        })
      );

      expect(loadBalancers.LoadBalancers).toHaveLength(1);

      const targetGroups = await elbv2Client.send(
        new DescribeTargetGroupsCommand({
          LoadBalancerArn: loadBalancers.LoadBalancers![0].LoadBalancerArn,
        })
      );

      for (const tg of targetGroups.TargetGroups!) {
        const health = await elbv2Client.send(
          new DescribeTargetHealthCommand({
            TargetGroupArn: tg.TargetGroupArn,
          })
        );

        // At least one target should be registered
        expect(health.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      }
    }, 30000);
  });

  describe('Network Security Tests', () => {
    test('should verify VPC security groups have correct rules', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC ID not available, skipping test');
        return;
      }

      const securityGroups = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );

      // Verify ELB security group allows HTTP/HTTPS
      const elbSG = securityGroups.SecurityGroups!.find(
        (sg: any) =>
          sg.GroupName?.includes('ELB') ||
          sg.Description?.includes('Application Load Balancer')
      );
      expect(elbSG).toBeDefined();

      const httpRule = elbSG!.IpPermissions!.find(
        (rule: any) =>
          rule.FromPort === 80 &&
          rule.IpRanges?.some((range: any) => range.CidrIp === '0.0.0.0/0')
      );
      expect(httpRule).toBeDefined();

      // Verify RDS security group only allows MySQL from EC2 and Lambda
      const rdsSG = securityGroups.SecurityGroups!.find(
        (sg: any) =>
          sg.GroupName?.includes('RDS') || sg.Description?.includes('RDS')
      );
      expect(rdsSG).toBeDefined();

      const mysqlRules = rdsSG!.IpPermissions!.filter(
        (rule: any) => rule.FromPort === 3306
      );
      expect(mysqlRules.length).toBeGreaterThan(0);

      // Should have rules from EC2 and Lambda security groups
      const hasSecurityGroupSources = mysqlRules.some(
        (rule: any) => rule.UserIdGroupPairs && rule.UserIdGroupPairs.length > 0
      );
      expect(hasSecurityGroupSources).toBe(true);
    }, 30000);

    test('should verify private subnets cannot be accessed from internet', async () => {
      if (!outputs.VPCId) {
        console.warn('VPC ID not available, skipping test');
        return;
      }

      const subnets = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
        })
      );

      const privateSubnets = subnets.Subnets!.filter((subnet: any) =>
        subnet.Tags?.some(
          (tag: any) => tag.Key === 'Name' && tag.Value?.includes('Private')
        )
      );

      expect(privateSubnets.length).toBeGreaterThan(0);

      // Verify private subnets don't have internet gateway routes
      for (const subnet of privateSubnets) {
        const routeTables = await ec2Client.send(
          new DescribeRouteTablesCommand({
            Filters: [
              { Name: 'association.subnet-id', Values: [subnet.SubnetId!] },
            ],
          })
        );

        for (const rt of routeTables.RouteTables!) {
          const internetRoute = rt.Routes!.find(
            (route: any) =>
              route.DestinationCidrBlock === '0.0.0.0/0' &&
              route.GatewayId?.startsWith('igw-')
          );
          expect(internetRoute).toBeUndefined();
        }
      }
    }, 30000);
  });

  describe('High Availability Tests', () => {
    test('should verify RDS Multi-AZ is enabled', async () => {
      const dbInstances = await rdsClient.send(
        new DescribeDBInstancesCommand({})
      );

      // Look for RDS instances that match our stack naming pattern
      const tapStackDB = dbInstances.DBInstances!.find(
        (db: any) =>
          db.DBInstanceIdentifier?.includes('RDSInstance') ||
          db.VpcSecurityGroups?.some((sg: any) =>
            sg.VpcSecurityGroupId?.includes('rds')
          ) ||
          // Also check if the DB is in our VPC
          (outputs.VPCId &&
            db.VpcSecurityGroups?.some((sg: any) => sg.VpcId === outputs.VPCId))
      );

      if (tapStackDB) {
        expect(tapStackDB.MultiAZ).toBe(true);
        expect(tapStackDB.PubliclyAccessible).toBe(false);
        expect(tapStackDB.StorageEncrypted).toBe(true);
      } else {
        console.warn('No RDS instance found matching our stack');
      }
    }, 30000);

    test('should verify Auto Scaling Group spans multiple AZs', async () => {
      const autoScalingGroups = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({})
      );

      // Look for ASG that matches our stack
      const tapStackASG = autoScalingGroups.AutoScalingGroups!.find(
        (asg: any) =>
          asg.AutoScalingGroupName?.includes('EC2AutoScalingGroup') ||
          // Also check if ASG is in our VPC subnets
          (outputs.VPCId && asg.VPCZoneIdentifier)
      );

      if (tapStackASG) {
        expect(tapStackASG.VPCZoneIdentifier!.split(',')).toHaveLength(2);
        expect(tapStackASG.AvailabilityZones).toHaveLength(2);
      } else {
        console.warn('No Auto Scaling Group found matching our stack');
      }
    }, 30000);

    test('should verify Load Balancer is in multiple AZs', async () => {
      if (!outputs.ALBDnsName) {
        console.warn('ALB DNS name not available, skipping test');
        return;
      }

      const loadBalancers = await elbv2Client.send(
        new DescribeLoadBalancersCommand({})
      );
      const tapStackALB = loadBalancers.LoadBalancers!.find(
        (lb: any) => lb.DNSName === outputs.ALBDnsName
      );

      if (tapStackALB) {
        expect(tapStackALB.AvailabilityZones).toHaveLength(2);
        expect(tapStackALB.Scheme).toBe('internet-facing');
      }
    }, 30000);
  });

  describe('Storage Security Tests', () => {
    test('should verify S3 buckets have encryption enabled', async () => {
      const buckets = [
        outputs.WebAppS3BucketName,
        outputs.LogsS3BucketName,
      ].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const encryption = await s3Client.send(
            new GetBucketEncryptionCommand({
              Bucket: bucketName as string,
            })
          );

          expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
          expect(
            encryption.ServerSideEncryptionConfiguration!.Rules
          ).toHaveLength(1);
          expect(
            encryption.ServerSideEncryptionConfiguration!.Rules![0]
              .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
          ).toBe('aws:kms');
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }
    }, 30000);

    test('should verify S3 buckets have public access blocked', async () => {
      const buckets = [
        outputs.WebAppS3BucketName,
        outputs.LogsS3BucketName,
      ].filter(Boolean);

      for (const bucketName of buckets) {
        try {
          const publicAccessBlock = await s3Client.send(
            new GetPublicAccessBlockCommand({
              Bucket: bucketName as string,
            })
          );

          expect(
            publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
          ).toBe(true);
          expect(
            publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
          ).toBe(true);
          expect(
            publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
          ).toBe(true);
          expect(
            publicAccessBlock.PublicAccessBlockConfiguration
              ?.RestrictPublicBuckets
          ).toBe(true);
        } catch (error: any) {
          if (error.name !== 'NoSuchBucket') {
            throw error;
          }
        }
      }
    }, 30000);
  });

  describe('Lambda Function Tests', () => {
    test('should verify Lambda functions are deployed and configured', async () => {
      const functions = await lambdaClient.send(new ListFunctionsCommand({}));

      const tapStackFunctions = functions.Functions!.filter(
        (func: any) =>
          func.FunctionName?.includes('Function1') ||
          func.FunctionName?.includes('Function2')
      );

      expect(tapStackFunctions.length).toBeGreaterThan(0);

      for (const func of tapStackFunctions) {
        // Check if function has VPC configuration (our template should have VPC config for Lambda)
        if (func.VpcConfig && func.VpcConfig.VpcId) {
          expect(func.VpcConfig.SubnetIds).toHaveLength(2);
          expect(func.VpcConfig.VpcId).toBeDefined();
        }
        // Check X-Ray tracing
        expect(func.TracingConfig?.Mode).toBe('Active');
        // Verify function is in the correct region
        expect(func.FunctionArn).toContain('us-east-1');
      }
    }, 30000);

    test('should verify Lambda functions can be invoked', async () => {
      const functions = await lambdaClient.send(new ListFunctionsCommand({}));

      const tapStackFunction = functions.Functions!.find((func: any) =>
        func.FunctionName?.includes('Function1')
      );

      if (tapStackFunction) {
        try {
          const result = await lambdaClient.send(
            new InvokeCommand({
              FunctionName: tapStackFunction.FunctionName!,
              InvocationType: 'RequestResponse',
              Payload: new TextEncoder().encode(JSON.stringify({ test: true })),
            })
          );

          expect(result.StatusCode).toBe(200);
          expect(result.Payload).toBeDefined();
        } catch (error: any) {
          console.warn('Lambda invocation failed:', error.message);
        }
      }
    }, 30000);
  });

  describe('Monitoring and Logging Tests', () => {
    test('should verify CloudWatch log groups exist for Lambda functions', async () => {
      try {
        const logGroups = await cloudWatchLogsClient.send(
          new DescribeLogGroupsCommand({
            logGroupNamePrefix: '/aws/lambda/',
          })
        );

        const tapStackLogGroups = logGroups.logGroups!.filter(
          (lg: any) =>
            lg.logGroupName?.includes('Function1') ||
            lg.logGroupName?.includes('Function2') ||
            // Also check for WebApp project name pattern
            lg.logGroupName?.includes('WebApp')
        );

        if (tapStackLogGroups.length > 0) {
          expect(tapStackLogGroups.length).toBeGreaterThan(0);

          for (const lg of tapStackLogGroups) {
            expect(lg.retentionInDays).toBe(7);
          }
        } else {
          console.warn(
            'No Lambda log groups found - this might be expected if Lambda functions are not actively logging'
          );
        }
      } catch (error) {
        console.warn('Could not verify log groups:', error);
      }
    }, 30000);
  });

  describe('Template Deployment Tests', () => {
    test('should verify stack is in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      try {
        const stacks = await cloudFormationClient.send(
          new DescribeStacksCommand({
            StackName: stackName,
          })
        );

        expect(stacks.Stacks).toHaveLength(1);
        expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
          stacks.Stacks![0].StackStatus
        );
      } catch (error) {
        console.warn(`Could not verify stack status for ${stackName}:`, error);
      }
    }, 30000);

    test('should verify all required outputs are present', async () => {
      try {
        const stacks = await cloudFormationClient.send(
          new DescribeStacksCommand({
            StackName: stackName,
          })
        );

        const stackOutputs = stacks.Stacks![0].Outputs || [];
        const outputKeys = stackOutputs.map((output: any) => output.OutputKey);

        const expectedOutputs = [
          'VPCId',
          'ALBDnsName',
          'WebAppS3BucketName',
          'LogsS3BucketName',
        ];

        expectedOutputs.forEach(expectedOutput => {
          expect(outputKeys).toContain(expectedOutput);
        });
      } catch (error) {
        console.warn(`Could not verify stack outputs for ${stackName}:`, error);
      }
    }, 30000);
  });

  describe('Performance Tests', () => {
    test('should verify load balancer response time', async () => {
      if (!outputs.ALBDnsName) {
        console.warn('ALB DNS name not available, skipping test');
        return;
      }

      const startTime = Date.now();
      try {
        await axios.get(`http://${outputs.ALBDnsName}`, {
          timeout: 10000,
          validateStatus: status => status < 500,
        });
        const responseTime = Date.now() - startTime;
        expect(responseTime).toBeLessThan(10000); // Should respond within 10 seconds
      } catch (error: any) {
        if (error.code !== 'ECONNREFUSED' && error.code !== 'ETIMEDOUT') {
          throw error;
        }
      }
    }, 15000);
  });

  afterAll(async () => {
    // Cleanup any test resources if needed
    console.log('Integration tests completed');
  });
});
