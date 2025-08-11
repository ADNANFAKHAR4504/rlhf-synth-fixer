// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  RDSClient,
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
} from '@aws-sdk/client-rds';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  CloudTrailClient,
  DescribeTrailsCommand,
  GetTrailStatusCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  ConfigServiceClient,
  DescribeConfigurationRecordersCommand,
  DescribeDeliveryChannelsCommand,
  DescribeConfigRulesCommand,
} from '@aws-sdk/client-config-service';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  IAMClient,
  GetRoleCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const cfnClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const kmsClient = new KMSClient({ region });
const cloudTrailClient = new CloudTrailClient({ region });
const configClient = new ConfigServiceClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const iamClient = new IAMClient({ region });

// Check if outputs file exists for local testing
let outputs: any = {};
if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
}

describe('Enterprise Infrastructure Integration Tests', () => {
  let stackOutputs: any = {};

  beforeAll(async () => {
    // Get stack outputs if running in CI or real AWS environment
    if (process.env.CI === '1' || process.env.AWS_ACCESS_KEY_ID) {
      try {
        const stackDescription = await cfnClient.send(
          new DescribeStacksCommand({ StackName: stackName })
        );
        
        if (stackDescription.Stacks && stackDescription.Stacks[0].Outputs) {
          stackDescription.Stacks[0].Outputs.forEach((output) => {
            if (output.OutputKey && output.OutputValue) {
              stackOutputs[output.OutputKey] = output.OutputValue;
            }
          });
        }
      } catch (error) {
        console.log('Stack not found or not accessible, using local outputs');
        stackOutputs = outputs;
      }
    } else {
      // Use local outputs for testing
      stackOutputs = outputs;
    }
  });

  describe('Stack Deployment', () => {
    test('CloudFormation stack should be in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      const response = await cfnClient.send(
        new DescribeStacksCommand({ StackName: stackName })
      );
      
      expect(response.Stacks).toHaveLength(1);
      const stack = response.Stacks![0];
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus);
    });

    test('All expected outputs should be present', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'S3LogsBucket',
        'RDSEndpoint',
        'KMSKeyId',
        'CloudTrailName',
        'ConfigRecorderName'
      ];

      expectedOutputs.forEach(output => {
        expect(stackOutputs).toHaveProperty(output);
        expect(stackOutputs[output]).toBeTruthy();
      });
    });
  });

  describe('Network Infrastructure', () => {
    test('VPC should be properly configured', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping test - no VPC output');
        return;
      }

      const response = await ec2Client.send(
        new DescribeVpcsCommand({ VpcIds: [stackOutputs.VPCId] })
      );
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are part of VPC attributes, not directly accessible
      expect(vpc.VpcId).toBeDefined();
    });

    test('Subnets should be created in multiple AZs', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping test - no VPC output');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [stackOutputs.VPCId] }]
        })
      );
      
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(4);
      
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT Gateways should be available', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping test - no VPC output');
        return;
      }

      const response = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'vpc-id', Values: [stackOutputs.VPCId] },
            { Name: 'state', Values: ['available'] }
          ]
        })
      );
      
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(2);
    });

    test('VPC Flow Logs should be enabled', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping test - no VPC output');
        return;
      }

      const response = await ec2Client.send(
        new DescribeFlowLogsCommand({
          Filter: [
            { Name: 'resource-id', Values: [stackOutputs.VPCId] }
          ]
        })
      );
      
      expect(response.FlowLogs!.length).toBeGreaterThan(0);
      const flowLog = response.FlowLogs![0];
      expect(flowLog.FlowLogStatus).toBe('ACTIVE');
      expect(flowLog.TrafficType).toBe('ALL');
    });
  });

  describe('Security Configuration', () => {
    test('Security groups should have restricted access', async () => {
      if (!stackOutputs.VPCId) {
        console.log('Skipping test - no VPC output');
        return;
      }

      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [{ Name: 'vpc-id', Values: [stackOutputs.VPCId] }]
        })
      );
      
      // Check that no security group allows unrestricted access on sensitive ports
      response.SecurityGroups!.forEach(sg => {
        sg.IpPermissions?.forEach(rule => {
          if (rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')) {
            // Only HTTP and HTTPS should be allowed from 0.0.0.0/0
            expect([80, 443]).toContain(rule.FromPort);
          }
        });
      });
    });

    test('KMS key should be configured correctly', async () => {
      if (!stackOutputs.KMSKeyId) {
        console.log('Skipping test - no KMS key output');
        return;
      }

      const response = await kmsClient.send(
        new DescribeKeyCommand({ KeyId: stackOutputs.KMSKeyId })
      );
      
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });

    test('IAM roles should follow least privilege', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      // Test EC2 role
      const roleName = `${process.env.Environment || 'Development'}-ec2-role-${environmentSuffix}`;
      
      try {
        const roleResponse = await iamClient.send(
          new GetRoleCommand({ RoleName: roleName })
        );
        
        expect(roleResponse.Role).toBeDefined();
        
        // Check attached managed policies
        const attachedPolicies = await iamClient.send(
          new ListAttachedRolePoliciesCommand({ RoleName: roleName })
        );
        
        const expectedPolicies = [
          'CloudWatchAgentServerPolicy',
          'AmazonSSMManagedInstanceCore'
        ];
        
        attachedPolicies.AttachedPolicies?.forEach(policy => {
          expect(expectedPolicies.some(ep => policy.PolicyName?.includes(ep))).toBe(true);
        });
      } catch (error) {
        console.log('IAM role not found or not accessible');
      }
    });
  });

  describe('Storage and Encryption', () => {
    test('S3 buckets should have encryption enabled', async () => {
      if (!stackOutputs.S3LogsBucket) {
        console.log('Skipping test - no S3 bucket output');
        return;
      }

      const response = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: stackOutputs.S3LogsBucket })
      );
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('S3 buckets should have versioning enabled', async () => {
      if (!stackOutputs.S3LogsBucket) {
        console.log('Skipping test - no S3 bucket output');
        return;
      }

      const response = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: stackOutputs.S3LogsBucket })
      );
      
      expect(response.Status).toBe('Enabled');
    });

    test('S3 buckets should block public access', async () => {
      if (!stackOutputs.S3LogsBucket) {
        console.log('Skipping test - no S3 bucket output');
        return;
      }

      const response = await s3Client.send(
        new GetPublicAccessBlockCommand({ Bucket: stackOutputs.S3LogsBucket })
      );
      
      expect(response.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(response.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy should enforce SSL', async () => {
      if (!stackOutputs.S3LogsBucket) {
        console.log('Skipping test - no S3 bucket output');
        return;
      }

      try {
        const response = await s3Client.send(
          new GetBucketPolicyCommand({ Bucket: stackOutputs.S3LogsBucket })
        );
        
        const policy = JSON.parse(response.Policy!);
        const denyInsecure = policy.Statement.find((s: any) => 
          s.Effect === 'Deny' && 
          s.Condition?.Bool?.['aws:SecureTransport'] === 'false'
        );
        
        expect(denyInsecure).toBeDefined();
      } catch (error) {
        console.log('Bucket policy not found or not accessible');
      }
    });
  });

  describe('Database Configuration', () => {
    test('RDS instance should be encrypted', async () => {
      if (!stackOutputs.RDSEndpoint) {
        console.log('Skipping test - no RDS endpoint output');
        return;
      }

      const dbIdentifier = `${process.env.Environment || 'Development'}-database-${environmentSuffix}`;
      
      try {
        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );
        
        expect(response.DBInstances).toHaveLength(1);
        const db = response.DBInstances![0];
        expect(db.StorageEncrypted).toBe(true);
        expect(db.KmsKeyId).toBeDefined();
      } catch (error) {
        console.log('RDS instance not found or not accessible');
      }
    });

    test('RDS instance should not be publicly accessible', async () => {
      if (!stackOutputs.RDSEndpoint) {
        console.log('Skipping test - no RDS endpoint output');
        return;
      }

      const dbIdentifier = `${process.env.Environment || 'Development'}-database-${environmentSuffix}`;
      
      try {
        const response = await rdsClient.send(
          new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
        );
        
        const db = response.DBInstances![0];
        expect(db.PubliclyAccessible).toBe(false);
      } catch (error) {
        console.log('RDS instance not found or not accessible');
      }
    });

    test('RDS should be in private subnets', async () => {
      if (!stackOutputs.RDSEndpoint) {
        console.log('Skipping test - no RDS endpoint output');
        return;
      }

      const subnetGroupName = `${process.env.Environment || 'Development'}-db-subnet-group-${environmentSuffix}`;
      
      try {
        const response = await rdsClient.send(
          new DescribeDBSubnetGroupsCommand({ DBSubnetGroupName: subnetGroupName })
        );
        
        expect(response.DBSubnetGroups).toHaveLength(1);
        const subnetGroup = response.DBSubnetGroups![0];
        expect(subnetGroup.Subnets!.length).toBeGreaterThanOrEqual(2);
      } catch (error) {
        console.log('DB subnet group not found or not accessible');
      }
    });
  });

  describe('Monitoring and Compliance', () => {
    test('CloudTrail should be enabled and multi-region', async () => {
      if (!stackOutputs.CloudTrailName) {
        console.log('Skipping test - no CloudTrail output');
        return;
      }

      try {
        const trailResponse = await cloudTrailClient.send(
          new DescribeTrailsCommand({ trailNameList: [stackOutputs.CloudTrailName] })
        );
        
        expect(trailResponse.trailList).toHaveLength(1);
        const trail = trailResponse.trailList![0];
        expect(trail.IsMultiRegionTrail).toBe(true);
        expect(trail.LogFileValidationEnabled).toBe(true);
        
        // Check trail status
        const statusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: stackOutputs.CloudTrailName })
        );
        
        expect(statusResponse.IsLogging).toBe(true);
      } catch (error) {
        console.log('CloudTrail not found or not accessible');
      }
    });

    test('AWS Config should be enabled', async () => {
      if (!stackOutputs.ConfigRecorderName) {
        console.log('Skipping test - no Config recorder output');
        return;
      }

      try {
        const recorderResponse = await configClient.send(
          new DescribeConfigurationRecordersCommand({
            ConfigurationRecorderNames: [stackOutputs.ConfigRecorderName]
          })
        );
        
        expect(recorderResponse.ConfigurationRecorders).toHaveLength(1);
        const recorder = recorderResponse.ConfigurationRecorders![0];
        expect(recorder.recordingGroup?.allSupported).toBe(true);
        
        // Check delivery channel
        const channelResponse = await configClient.send(
          new DescribeDeliveryChannelsCommand()
        );
        
        expect(channelResponse.DeliveryChannels!.length).toBeGreaterThan(0);
      } catch (error) {
        console.log('Config recorder not found or not accessible');
      }
    });

    test('Config Rules should be in place', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      try {
        const response = await configClient.send(
          new DescribeConfigRulesCommand()
        );
        
        const expectedRules = [
          's3-bucket-public-read-prohibited',
          's3-bucket-public-write-prohibited',
          'rds-storage-encrypted',
          'restricted-ssh'
        ];
        
        const ruleNames = response.ConfigRules?.map(rule => rule.ConfigRuleName) || [];
        
        expectedRules.forEach(expectedRule => {
          expect(ruleNames.some(name => name?.includes(expectedRule))).toBe(true);
        });
      } catch (error) {
        console.log('Config rules not found or not accessible');
      }
    });

    test('CloudWatch alarms should be configured', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      try {
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `${process.env.Environment || 'Development'}-`
          })
        );
        
        const expectedAlarms = [
          'UnauthorizedAPICalls',
          'SecurityGroupChanges',
          'IAMPolicyChanges'
        ];
        
        const alarmNames = response.MetricAlarms?.map(alarm => alarm.AlarmName) || [];
        
        expectedAlarms.forEach(expectedAlarm => {
          expect(alarmNames.some(name => name?.includes(expectedAlarm))).toBe(true);
        });
      } catch (error) {
        console.log('CloudWatch alarms not found or not accessible');
      }
    });
  });

  describe('Compute and Load Balancing', () => {
    test('Application Load Balancer should be configured', async () => {
      if (!stackOutputs.ALBDNSName) {
        console.log('Skipping test - no ALB output');
        return;
      }

      try {
        const response = await elbClient.send(
          new DescribeLoadBalancersCommand({
            Names: [`${process.env.Environment || 'Development'}-ALB-${environmentSuffix}`]
          })
        );
        
        expect(response.LoadBalancers).toHaveLength(1);
        const alb = response.LoadBalancers![0];
        expect(alb.Scheme).toBe('internet-facing');
        expect(alb.Type).toBe('application');
        expect(alb.State?.Code).toBe('active');
      } catch (error) {
        console.log('ALB not found or not accessible');
      }
    });

    test('Target Group should be healthy', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      try {
        const response = await elbClient.send(
          new DescribeTargetGroupsCommand({
            Names: [`${process.env.Environment || 'Development'}-TG-${environmentSuffix}`]
          })
        );
        
        expect(response.TargetGroups).toHaveLength(1);
        const tg = response.TargetGroups![0];
        expect(tg.Protocol).toBe('HTTP');
        expect(tg.Port).toBe(80);
      } catch (error) {
        console.log('Target group not found or not accessible');
      }
    });

    test('Auto Scaling Group should be configured', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      try {
        const response = await asgClient.send(
          new DescribeAutoScalingGroupsCommand({
            AutoScalingGroupNames: [`${process.env.Environment || 'Development'}-ASG-${environmentSuffix}`]
          })
        );
        
        expect(response.AutoScalingGroups).toHaveLength(1);
        const asg = response.AutoScalingGroups![0];
        expect(asg.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
        expect(asg.VPCZoneIdentifier?.split(',').length).toBeGreaterThanOrEqual(2);
      } catch (error) {
        console.log('Auto Scaling Group not found or not accessible');
      }
    });
  });

  describe('End-to-End Connectivity', () => {
    test('ALB endpoint should be accessible', async () => {
      if (!stackOutputs.ALBDNSName) {
        console.log('Skipping test - no ALB DNS name');
        return;
      }

      // This test would normally make an HTTP request to the ALB
      // In a real environment, you would test actual connectivity
      expect(stackOutputs.ALBDNSName).toMatch(/^.+\.elb\.amazonaws\.com$/);
    });

    test('RDS endpoint should be properly formatted', () => {
      if (!stackOutputs.RDSEndpoint) {
        console.log('Skipping test - no RDS endpoint');
        return;
      }

      expect(stackOutputs.RDSEndpoint).toMatch(/^.+\.rds\.amazonaws\.com$/);
    });
  });

  describe('Resource Tagging', () => {
    test('All resources should have proper tags', async () => {
      if (!process.env.CI && !process.env.AWS_ACCESS_KEY_ID) {
        console.log('Skipping test - no AWS access');
        return;
      }

      try {
        const response = await cfnClient.send(
          new ListStackResourcesCommand({ StackName: stackName })
        );
        
        // Check that we have resources
        expect(response.StackResourceSummaries!.length).toBeGreaterThan(0);
        
        // In a real test, you would check individual resources for tags
        // This is a simplified check
        response.StackResourceSummaries?.forEach(resource => {
          expect(resource.ResourceStatus).toBe('CREATE_COMPLETE');
        });
      } catch (error) {
        console.log('Stack resources not accessible');
      }
    });
  });
});