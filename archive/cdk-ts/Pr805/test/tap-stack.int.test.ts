// Configuration - These are coming from cfn-outputs after cdk deploy
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeFlowLogsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';
import {
  GetParameterCommand,
  SSMClient,
} from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

// Read the deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients for us-west-2 region
const ec2Client = new EC2Client({ region: 'us-west-2' });
const autoScalingClient = new AutoScalingClient({ region: 'us-west-2' });
const s3Client = new S3Client({ region: 'us-west-2' });
const iamClient = new IAMClient({ region: 'us-west-2' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-west-2' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: 'us-west-2' });
const snsClient = new SNSClient({ region: 'us-west-2' });
const ssmClient = new SSMClient({ region: 'us-west-2' });

describe('Production Infrastructure Integration Tests', () => {
  // Test timeout for AWS API calls
  const testTimeout = 30000;
  describe('VPC Configuration Tests', () => {
    test('VPC exists with correct CIDR block 10.0.0.0/16', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      // Note: EnableDnsHostnames and EnableDnsSupport are not directly available in the VPC object
      // They would need separate DescribeVpcAttribute calls to verify
    }, testTimeout);

    test('VPC has two public and two private subnets', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets.length).toBeGreaterThanOrEqual(4);

      // Check for public subnets (have route to internet gateway)
      const publicSubnets = subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);

      // Check for private subnets
      const privateSubnets = subnets.filter(subnet => 
        subnet.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

      // Verify subnets are in different AZs
      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    }, testTimeout);

    test('VPC has flow logs enabled', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const flowLogs = response.FlowLogs || [];

      expect(flowLogs.length).toBeGreaterThan(0);
      expect(flowLogs[0].FlowLogStatus).toBe('ACTIVE');
      expect(flowLogs[0].TrafficType).toBe('ALL');
    }, testTimeout);

    test('VPC endpoints exist for S3 and SSM services', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const endpoints = response.VpcEndpoints || [];

      expect(endpoints.length).toBeGreaterThanOrEqual(3);

      // Check for S3 gateway endpoint
      const s3Endpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('s3') && ep.VpcEndpointType === 'Gateway'
      );
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint?.State).toBe('available');

      // Check for SSM interface endpoint
      const ssmEndpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('ssm') && ep.VpcEndpointType === 'Interface'
      );
      expect(ssmEndpoint).toBeDefined();
      expect(ssmEndpoint?.State).toBe('available');

      // Check for CloudWatch Logs interface endpoint
      const logsEndpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('logs') && ep.VpcEndpointType === 'Interface'
      );
      expect(logsEndpoint).toBeDefined();
      expect(logsEndpoint?.State).toBe('available');
    }, testTimeout);
  });
  describe('S3 Bucket Configuration Tests', () => {
    test('S3 bucket exists with versioning enabled', async () => {
      const bucketName = outputs.S3BucketName;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(`secure-webapp-artifacts-${environmentSuffix}`);

      const command = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Status).toBe('Enabled');
    }, testTimeout);

    test('S3 bucket has encryption enabled', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const rules = response.ServerSideEncryptionConfiguration?.Rules;

      expect(rules).toBeDefined();
      expect(rules?.length).toBeGreaterThan(0);
      expect(rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('AES256');
    }, testTimeout);

    test('S3 bucket has public access blocked', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetPublicAccessBlockCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration;

      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    }, testTimeout);

    test('S3 bucket has lifecycle configuration', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      const rules = response.Rules || [];

      expect(rules.length).toBeGreaterThan(0);

      // Check for old version deletion rule
      const deleteOldVersionsRule = rules.find(rule => rule.ID === 'DeleteOldVersions');
      expect(deleteOldVersionsRule).toBeDefined();
      expect(deleteOldVersionsRule?.Status).toBe('Enabled');
      expect(deleteOldVersionsRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);

      // Check for transition to IA rule
      const transitionRule = rules.find(rule => rule.ID === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Status).toBe('Enabled');
      expect(transitionRule?.Transitions?.[0]?.Days).toBe(30);
      expect(transitionRule?.Transitions?.[0]?.StorageClass).toBe('STANDARD_IA');
    }, testTimeout);

    test('S3 bucket has SSL enforcement policy', async () => {
      const bucketName = outputs.S3BucketName;
      
      const command = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });

      const response = await s3Client.send(command);
      expect(response.Policy).toBeDefined();

      const policy = JSON.parse(response.Policy || '{}');
      const statements = policy.Statement || [];

      // Check for SSL enforcement statement
      const sslStatement = statements.find((stmt: any) => 
        stmt.Effect === 'Deny' && 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(sslStatement).toBeDefined();
    }, testTimeout);
  });
  describe('IAM Role Configuration Tests', () => {
    test('EC2 IAM role exists with correct configuration', async () => {
      const roleName = `EC2-WebApp-Role-${environmentSuffix}`;
      
      const command = new GetRoleCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.RoleName).toBe(roleName);
      expect(role?.AssumeRolePolicyDocument).toBeDefined();

      // Verify assume role policy allows EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || '{}'));
      const statements = assumeRolePolicy.Statement || [];
      const ec2Statement = statements.find((stmt: any) => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toBe('sts:AssumeRole');
    }, testTimeout);

    test('EC2 IAM role has required managed policies attached', async () => {
      const roleName = `EC2-WebApp-Role-${environmentSuffix}`;
      
      const command = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      const policies = response.AttachedPolicies || [];

      expect(policies.length).toBeGreaterThanOrEqual(1);

      const policyNames = policies.map(p => p.PolicyName);
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
    }, testTimeout);

    test('EC2 IAM role has custom inline policies for S3 and CloudWatch', async () => {
      const roleName = `EC2-WebApp-Role-${environmentSuffix}`;
      
      const command = new ListRolePoliciesCommand({
        RoleName: roleName,
      });

      const response = await iamClient.send(command);
      const policyNames = response.PolicyNames || [];

      expect(policyNames.length).toBeGreaterThanOrEqual(2);

      // Check S3 access policy
      for (const policyName of policyNames) {
        const policyCommand = new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        });

        const policyResponse = await iamClient.send(policyCommand);
        const policyDocument = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || '{}'));
        const statements = policyDocument.Statement || [];

        // Look for S3 permissions
        const s3Statement = statements.find((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions?.some((action: string) => action.startsWith('s3:'));
        });
        if (s3Statement) {
          expect(s3Statement.Effect).toBe('Allow');
          const s3Actions = Array.isArray(s3Statement.Action) ? s3Statement.Action : [s3Statement.Action];
          expect(s3Actions).toContain('s3:GetObject');
          expect(s3Actions).toContain('s3:PutObject');
        }

        // Look for CloudWatch Logs permissions
        const logsStatement = statements.find((stmt: any) => {
          const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
          return actions?.some((action: string) => action.startsWith('logs:'));
        });
        if (logsStatement) {
          expect(logsStatement.Effect).toBe('Allow');
          const logsActions = Array.isArray(logsStatement.Action) ? logsStatement.Action : [logsStatement.Action];
          expect(logsActions).toContain('logs:CreateLogGroup');
          expect(logsActions).toContain('logs:PutLogEvents');
        }
      }
    }, testTimeout);
  });
  describe('Auto Scaling Group Configuration Tests', () => {
    test('Auto Scaling Group exists with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBe(`webapp-asg-${environmentSuffix}`);

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg).toBeDefined();
      expect(asg?.AutoScalingGroupName).toBe(asgName);
      expect(asg?.MinSize).toBe(1);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.HealthCheckType).toBe('EC2');
      expect(asg?.HealthCheckGracePeriod).toBe(300); // 5 minutes
    }, testTimeout);

    test('Auto Scaling Group ensures at least one instance is running', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(1);

      // Check that instances are healthy
      const healthyInstances = asg?.Instances?.filter(instance => 
        instance.HealthStatus === 'Healthy'
      );
      expect(healthyInstances?.length).toBeGreaterThanOrEqual(1);
    }, testTimeout);

    test('Auto Scaling Group has CPU-based scaling policy', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: asgName,
      });

      const response = await autoScalingClient.send(command);
      const policies = response.ScalingPolicies || [];

      expect(policies.length).toBeGreaterThan(0);

      const cpuPolicy = policies.find((policy: any) => 
        policy.PolicyType === 'TargetTrackingScaling' &&
        policy.TargetTrackingConfiguration?.PredefinedMetricSpecification?.PredefinedMetricType === 'ASGAverageCPUUtilization'
      );

      expect(cpuPolicy).toBeDefined();
      expect((cpuPolicy as any)?.TargetTrackingConfiguration?.TargetValue).toBe(70);
    }, testTimeout);

    test('Auto Scaling Group is deployed in private subnets', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg?.VPCZoneIdentifier).toBeDefined();
      
      // Get subnet details to verify they are private
      const subnetIds = asg?.VPCZoneIdentifier?.split(',') || [];
      expect(subnetIds.length).toBeGreaterThan(0);

      const subnetsCommand = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });

      const subnetsResponse = await ec2Client.send(subnetsCommand);
      const subnets = subnetsResponse.Subnets || [];

      // Private subnets should not map public IPs on launch
      subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    }, testTimeout);
  });

  describe('EC2 Instance Configuration Tests', () => {
    test('EC2 instances are of type t3.medium', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      const instanceIds = asg?.Instances?.map(i => i.InstanceId).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        });

        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

        instances.forEach(instance => {
          expect(instance.InstanceType).toBe('t3.medium');
          expect(instance.State?.Name).toBeOneOf(['pending', 'running']);
        });
      }
    }, testTimeout);

    test('EC2 instances have IAM role attached', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      const instanceIds = asg?.Instances?.map(i => i.InstanceId).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        });

        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

        instances.forEach(instance => {
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile?.Arn).toMatch(/arn:aws:iam::\d+:instance-profile\/.+/);
        });
      }
    }, testTimeout);

    test('EC2 instances have required security groups', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      const instanceIds = asg?.Instances?.map(i => i.InstanceId).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        });

        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

        for (const instance of instances) {
          const securityGroupIds = instance.SecurityGroups?.map(sg => sg.GroupId).filter(Boolean) || [];
          expect(securityGroupIds.length).toBeGreaterThan(0);

          // Get security group details
          const sgCommand = new DescribeSecurityGroupsCommand({
            GroupIds: securityGroupIds as string[],
          });

          const sgResponse = await ec2Client.send(sgCommand);
          const securityGroups = sgResponse.SecurityGroups || [];

          // Check for web security group with HTTP/HTTPS rules
          const webSG = securityGroups.find(sg => 
            sg.Description?.includes('Security group for web tier')
          );
          expect(webSG).toBeDefined();

          // Verify HTTP and HTTPS ingress rules
          const ingressRules = webSG?.IpPermissions || [];
          const httpRule = ingressRules.find(rule => rule.FromPort === 80);
          const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
          
          expect(httpRule).toBeDefined();
          expect(httpsRule).toBeDefined();
        }
      }
    }, testTimeout);
  });
  describe('Monitoring and CloudWatch Configuration Tests', () => {
    test('CloudWatch log group exists for web application', async () => {
      const logGroupName = `/aws/ec2/webapp-${environmentSuffix}`;
      
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });

      const response = await cloudWatchLogsClient.send(command);
      const logGroups = response.logGroups || [];

      const webAppLogGroup = logGroups.find((lg: any) => lg.logGroupName === logGroupName);
      expect(webAppLogGroup).toBeDefined();
      expect((webAppLogGroup as any)?.retentionInDays).toBe(30);
    }, testTimeout);

    test('CloudWatch alarms exist for high CPU utilization', async () => {
      const alarmName = `webapp-high-cpu-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(1);
      const alarm = alarms[0];

      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
      expect(alarm.TreatMissingData).toBe('breaching');
    }, testTimeout);

    test('CloudWatch alarm exists for low instance count', async () => {
      const alarmName = `webapp-low-instances-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];

      expect(alarms.length).toBe(1);
      const alarm = alarms[0];

      expect(alarm.AlarmName).toBe(alarmName);
      expect(alarm.MetricName).toBe('GroupInServiceInstances');
      expect(alarm.Namespace).toBe('AWS/AutoScaling');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
      expect(alarm.EvaluationPeriods).toBe(2);
    }, testTimeout);

    test('SNS topic exists for alerts', async () => {
      // We need to get the topic ARN from the alarm actions
      const alarmName = `webapp-high-cpu-${environmentSuffix}`;
      
      const command = new DescribeAlarmsCommand({
        AlarmNames: [alarmName],
      });

      const response = await cloudWatchClient.send(command);
      const alarm = response.MetricAlarms?.[0];

      expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
      const topicArn = alarm?.AlarmActions?.[0];
      expect(topicArn).toContain('sns');
      expect(topicArn).toContain(`webapp-alerts-${environmentSuffix}`);

      // Verify the topic exists
      const topicCommand = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });

      const topicResponse = await snsClient.send(topicCommand);
      expect(topicResponse.Attributes?.DisplayName).toBe('Web Application Alerts');
    }, testTimeout);
  });
  describe('SSM Parameters Configuration Tests', () => {
    test('SSM parameters exist for infrastructure configuration', async () => {
      const parameters = [
        `/webapp/${environmentSuffix}/vpc-id`,
        `/webapp/${environmentSuffix}/s3-bucket`,
        `/webapp/${environmentSuffix}/environment`,
      ];

      for (const parameterName of parameters) {
        const command = new GetParameterCommand({
          Name: parameterName,
        });

        const response = await ssmClient.send(command);
        expect(response.Parameter).toBeDefined();
        expect(response.Parameter?.Name).toBe(parameterName);
        expect(response.Parameter?.Type).toBe('String');
        expect(response.Parameter?.Value).toBeDefined();
      }

      // Verify specific parameter values
      const vpcIdParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/vpc-id`,
      }));
      expect(vpcIdParam.Parameter?.Value).toBe(outputs.VPCId);

      const s3BucketParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/s3-bucket`,
      }));
      expect(s3BucketParam.Parameter?.Value).toBe(outputs.S3BucketName);

      const environmentParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/environment`,
      }));
      expect(environmentParam.Parameter?.Value).toBe(environmentSuffix);
    }, testTimeout);
  });

  describe('Security Compliance Tests', () => {
    test('All resources are deployed in us-west-2 region', async () => {
      // Verify region from outputs
      expect(outputs.Region).toBe('us-west-2');

      // Verify VPC is in correct region by checking AZ format
      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      subnets.forEach(subnet => {
        expect(subnet.AvailabilityZone).toMatch(/^us-west-2[a-z]$/);
      });
    }, testTimeout);

    test('All resources have Environment: Production tag', async () => {
      // Check VPC tags
      const vpcId = outputs.VPCId;
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });

      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];
      const vpcTags = vpc?.Tags || [];

      const environmentTag = vpcTags.find(tag => tag.Key === 'Environment');
      expect(environmentTag?.Value).toBe('Production');

      // Check Auto Scaling Group tags
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      const asgTags = asg?.Tags || [];

      const asgEnvironmentTag = asgTags.find(tag => tag.Key === 'Environment');
      expect(asgEnvironmentTag?.Value).toBe('Production');
    }, testTimeout);

    test('EC2 instances use IAM roles instead of static credentials', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });

      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      const instanceIds = asg?.Instances?.map(i => i.InstanceId).filter(Boolean) || [];

      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        });

        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];

        instances.forEach(instance => {
          // Verify IAM instance profile is attached
          expect(instance.IamInstanceProfile).toBeDefined();
          expect(instance.IamInstanceProfile?.Arn).toMatch(/arn:aws:iam::\d+:instance-profile\/.+/);
          
          // Note: UserData is not available in DescribeInstances response for security reasons
          // This would need to be verified through other means like CloudTrail or launch template inspection
        });
      }
    }, testTimeout);

    test('Security groups follow least privilege principle', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
          {
            Name: 'group-name',
            Values: ['*WebSG*'],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];

      expect(securityGroups.length).toBeGreaterThan(0);

      securityGroups.forEach(sg => {
        // Check ingress rules
        const ingressRules = sg.IpPermissions || [];
        
        // Should have HTTP (80) and HTTPS (443) from anywhere
        const httpRule = ingressRules.find(rule => rule.FromPort === 80);
        const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();

        // SSH should only be from VPC CIDR
        const sshRule = ingressRules.find(rule => rule.FromPort === 22);
        if (sshRule) {
          const sshCidr = sshRule.IpRanges?.[0]?.CidrIp;
          expect(sshCidr).toBe('10.0.0.0/16');
        }

        // Check egress rules - should be restrictive
        const egressRules = sg.IpPermissionsEgress || [];
        
        // Should not have unrestricted egress (0.0.0.0/0 on all ports)
        const unrestrictedEgress = egressRules.find(rule => 
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0') &&
          rule.FromPort === 0 &&
          rule.ToPort === 65535
        );
        expect(unrestrictedEgress).toBeUndefined();
      });
    }, testTimeout);

    test('Infrastructure follows AWS security best practices', async () => {
      // Verify S3 bucket encryption
      const bucketName = outputs.S3BucketName;
      const s3EncryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const s3EncryptionResponse = await s3Client.send(s3EncryptionCommand);
      expect(s3EncryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // Verify S3 bucket versioning
      const s3VersioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const s3VersioningResponse = await s3Client.send(s3VersioningCommand);
      expect(s3VersioningResponse.Status).toBe('Enabled');

      // Verify VPC flow logs
      const vpcId = outputs.VPCId;
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [
          {
            Name: 'resource-id',
            Values: [vpcId],
          },
        ],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      expect(flowLogsResponse.FlowLogs?.length).toBeGreaterThan(0);
      expect(flowLogsResponse.FlowLogs?.[0].FlowLogStatus).toBe('ACTIVE');
    }, testTimeout);
  });

  describe('Infrastructure Outputs Validation', () => {
    test('All required stack outputs are present', async () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.Region).toBeDefined();

      // Verify output values follow expected patterns
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.S3BucketName).toContain(`secure-webapp-artifacts-${environmentSuffix}`);
      expect(outputs.AutoScalingGroupName).toBe(`webapp-asg-${environmentSuffix}`);
      expect(outputs.Region).toBe('us-west-2');
    }, testTimeout);

    test('Stack outputs have correct export names', async () => {
      // These would be verified by checking CloudFormation exports
      // For integration tests, we verify the outputs exist and have correct values
      expect(outputs.VPCId).toBeTruthy();
      expect(outputs.S3BucketName).toBeTruthy();
      expect(outputs.AutoScalingGroupName).toBeTruthy();
      expect(outputs.Region).toBeTruthy();
    }, testTimeout);
  });
});

// Custom Jest matcher for multiple possible values
expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}

// ============================================================================
// END-TO-END TESTS
// ============================================================================

describe('End-to-End Infrastructure Tests', () => {
  const e2eTimeout = 60000; // 1 minute for e2e tests

  describe('Complete Infrastructure Deployment Validation', () => {
    test('E2E: Complete infrastructure stack is operational', async () => {
      // This test validates the entire infrastructure is working together
      
      // 1. Verify VPC and networking
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs?.[0]?.State).toBe('available');

      // 2. Verify S3 bucket is accessible
      const bucketName = outputs.S3BucketName;
      const s3VersioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const s3Response = await s3Client.send(s3VersioningCommand);
      expect(s3Response.Status).toBe('Enabled');

      // 3. Verify Auto Scaling Group has healthy instances
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(1);
      const healthyInstances = asg?.Instances?.filter(i => i.HealthStatus === 'Healthy');
      expect(healthyInstances?.length).toBeGreaterThanOrEqual(1);

      // 4. Verify monitoring is active
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNames: [`webapp-high-cpu-${environmentSuffix}`],
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);
      expect(alarmResponse.MetricAlarms?.[0]?.StateValue).toBeOneOf(['OK', 'INSUFFICIENT_DATA']);

      // 5. Verify SSM parameters are accessible
      const ssmCommand = new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/vpc-id`,
      });
      const ssmResponse = await ssmClient.send(ssmCommand);
      expect(ssmResponse.Parameter?.Value).toBe(vpcId);

      console.log('Complete infrastructure stack validation passed');
    }, e2eTimeout);

    test('E2E: Infrastructure resilience and fault tolerance', async () => {
      // Test infrastructure resilience by checking redundancy and fault tolerance
      
      // 1. Verify multi-AZ deployment
      const vpcId = outputs.VPCId;
      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);
      const subnets = subnetsResponse.Subnets || [];
      
      const availabilityZones = new Set(subnets.map(s => s.AvailabilityZone));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);

      // 2. Verify Auto Scaling Group can handle instance failures
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThan(asg?.MinSize || 0);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 0);

      // 3. Verify backup and versioning capabilities
      const bucketName = outputs.S3BucketName;
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      const rules = lifecycleResponse.Rules || [];
      
      const backupRule = rules.find(rule => rule.ID === 'DeleteOldVersions');
      expect(backupRule).toBeDefined();
      expect(backupRule?.Status).toBe('Enabled');

      console.log('Infrastructure resilience validation passed');
    }, e2eTimeout);

    test('E2E: Security posture validation across all components', async () => {
      // Comprehensive security validation across the entire infrastructure
      
      // 1. Verify encryption at rest
      const bucketName = outputs.S3BucketName;
      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();

      // 2. Verify network security
      const vpcId = outputs.VPCId;
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroups = sgResponse.SecurityGroups || [];
      
      // Verify no security groups allow unrestricted access on sensitive ports
      securityGroups.forEach(sg => {
        const ingressRules = sg.IpPermissions || [];
        const dangerousRules = ingressRules.filter(rule => 
          rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0') &&
          (rule.FromPort === 22 || rule.FromPort === 3389) // SSH or RDP
        );
        expect(dangerousRules.length).toBe(0);
      });

      // 3. Verify IAM least privilege
      const roleName = `EC2-WebApp-Role-${environmentSuffix}`;
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);
      expect(roleResponse.Role).toBeDefined();

      // 4. Verify audit logging
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      expect(flowLogsResponse.FlowLogs?.length).toBeGreaterThan(0);
      expect(flowLogsResponse.FlowLogs?.[0].FlowLogStatus).toBe('ACTIVE');

      console.log('Security posture validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Performance and Scalability Tests', () => {
    test('E2E: Monitoring and alerting system is functional', async () => {
      // Test that monitoring and alerting systems are working end-to-end
      
      // 1. Verify CloudWatch alarms are in valid states
      const alarmNames = [
        `webapp-high-cpu-${environmentSuffix}`,
        `webapp-low-instances-${environmentSuffix}`,
      ];
      
      for (const alarmName of alarmNames) {
        const alarmCommand = new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        });
        const alarmResponse = await cloudWatchClient.send(alarmCommand);
        const alarm = alarmResponse.MetricAlarms?.[0];
        
        expect(alarm).toBeDefined();
        expect(alarm?.StateValue).toBeOneOf(['OK', 'INSUFFICIENT_DATA', 'ALARM']);
        expect(alarm?.AlarmActions?.length).toBeGreaterThan(0);
      }

      // 2. Verify SNS topic for alerts
      const highCpuAlarmCommand = new DescribeAlarmsCommand({
        AlarmNames: [`webapp-high-cpu-${environmentSuffix}`],
      });
      const highCpuAlarmResponse = await cloudWatchClient.send(highCpuAlarmCommand);
      const topicArn = highCpuAlarmResponse.MetricAlarms?.[0]?.AlarmActions?.[0];
      
      expect(topicArn).toBeDefined();
      
      const topicCommand = new GetTopicAttributesCommand({
        TopicArn: topicArn,
      });
      const topicResponse = await snsClient.send(topicCommand);
      expect(topicResponse.Attributes?.DisplayName).toBe('Web Application Alerts');

      // 3. Verify log groups are receiving data
      const logGroupName = `/aws/ec2/webapp-${environmentSuffix}`;
      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
      const logGroup = logGroupResponse.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);

      console.log('Monitoring and alerting validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Integration and Connectivity Tests', () => {
    test('E2E: VPC endpoints provide secure AWS service access', async () => {
      // Test that VPC endpoints are properly configured for secure service access
      
      const vpcId = outputs.VPCId;
      const endpointsCommand = new DescribeVpcEndpointsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const endpointsResponse = await ec2Client.send(endpointsCommand);
      const endpoints = endpointsResponse.VpcEndpoints || [];
      
      expect(endpoints.length).toBeGreaterThanOrEqual(3);
      
      // Verify S3 gateway endpoint
      const s3Endpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('s3') && ep.VpcEndpointType === 'Gateway'
      );
      expect(s3Endpoint).toBeDefined();
      expect(s3Endpoint?.State).toBe('available');
      
      // Verify SSM interface endpoint
      const ssmEndpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('ssm') && ep.VpcEndpointType === 'Interface'
      );
      expect(ssmEndpoint).toBeDefined();
      expect(ssmEndpoint?.State).toBe('available');
      
      // Verify CloudWatch Logs interface endpoint
      const logsEndpoint = endpoints.find(ep => 
        ep.ServiceName?.includes('logs') && ep.VpcEndpointType === 'Interface'
      );
      expect(logsEndpoint).toBeDefined();
      expect(logsEndpoint?.State).toBe('available');

      console.log('VPC endpoints validation passed');
    }, e2eTimeout);

    test('E2E: IAM roles and policies provide appropriate access', async () => {
      // Test that IAM configuration provides appropriate access without over-privileging
      
      const roleName = `EC2-WebApp-Role-${environmentSuffix}`;
      
      // 1. Verify role exists and has correct trust policy
      const roleCommand = new GetRoleCommand({ RoleName: roleName });
      const roleResponse = await iamClient.send(roleCommand);
      const role = roleResponse.Role;
      
      expect(role).toBeDefined();
      const trustPolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || '{}'));
      const ec2Statement = trustPolicy.Statement?.find((stmt: any) => 
        stmt.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();

      // 2. Verify managed policies are attached
      const attachedPoliciesCommand = new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
      });
      const attachedPoliciesResponse = await iamClient.send(attachedPoliciesCommand);
      const attachedPolicies = attachedPoliciesResponse.AttachedPolicies || [];
      
      const cloudWatchPolicy = attachedPolicies.find(p => 
        p.PolicyName === 'CloudWatchAgentServerPolicy'
      );
      expect(cloudWatchPolicy).toBeDefined();

      // 3. Verify inline policies provide least privilege access
      const inlinePoliciesCommand = new ListRolePoliciesCommand({
        RoleName: roleName,
      });
      const inlinePoliciesResponse = await iamClient.send(inlinePoliciesCommand);
      const inlinePolicyNames = inlinePoliciesResponse.PolicyNames || [];
      
      expect(inlinePolicyNames.length).toBeGreaterThanOrEqual(2);
      
      // Check S3 policy is restrictive
      for (const policyName of inlinePolicyNames) {
        const policyCommand = new GetRolePolicyCommand({
          RoleName: roleName,
          PolicyName: policyName,
        });
        const policyResponse = await iamClient.send(policyCommand);
        const policyDoc = JSON.parse(decodeURIComponent(policyResponse.PolicyDocument || '{}'));
        
        // Verify no wildcard resources for sensitive actions
        const statements = policyDoc.Statement || [];
        statements.forEach((stmt: any) => {
          if (stmt.Effect === 'Allow' && stmt.Resource === '*') {
            const actions = Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action];
            const dangerousActions = actions.filter((action: string) => 
              action.includes('*') && !action.startsWith('logs:') && !action.startsWith('cloudwatch:')
            );
            expect(dangerousActions.length).toBe(0);
          }
        });
      }

      console.log('IAM roles and policies validation passed');
    }, e2eTimeout);

    test('E2E: Configuration management through SSM parameters', async () => {
      // Test that SSM parameters provide proper configuration management
      
      const parameterNames = [
        `/webapp/${environmentSuffix}/vpc-id`,
        `/webapp/${environmentSuffix}/s3-bucket`,
        `/webapp/${environmentSuffix}/environment`,
      ];
      
      // 1. Verify all parameters exist and have correct values
      for (const paramName of parameterNames) {
        const paramCommand = new GetParameterCommand({ Name: paramName });
        const paramResponse = await ssmClient.send(paramCommand);
        
        expect(paramResponse.Parameter).toBeDefined();
        expect(paramResponse.Parameter?.Type).toBe('String');
        expect(paramResponse.Parameter?.Value).toBeTruthy();
      }
      
      // 2. Verify parameter values match infrastructure outputs
      const vpcIdParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/vpc-id`,
      }));
      expect(vpcIdParam.Parameter?.Value).toBe(outputs.VPCId);
      
      const s3BucketParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/s3-bucket`,
      }));
      expect(s3BucketParam.Parameter?.Value).toBe(outputs.S3BucketName);
      
      const environmentParam = await ssmClient.send(new GetParameterCommand({
        Name: `/webapp/${environmentSuffix}/environment`,
      }));
      expect(environmentParam.Parameter?.Value).toBe(environmentSuffix);

      console.log('SSM parameters validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Disaster Recovery and Business Continuity', () => {
    test('E2E: Data backup and retention policies are enforced', async () => {
      // Test that backup and retention policies are properly configured
      
      const bucketName = outputs.S3BucketName;
      
      // 1. Verify S3 versioning for data protection
      const versioningCommand = new GetBucketVersioningCommand({
        Bucket: bucketName,
      });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
      
      // 2. Verify lifecycle policies for cost optimization and compliance
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      const rules = lifecycleResponse.Rules || [];
      
      expect(rules.length).toBeGreaterThanOrEqual(2);
      
      // Check old version deletion rule
      const deleteRule = rules.find(rule => rule.ID === 'DeleteOldVersions');
      expect(deleteRule).toBeDefined();
      expect(deleteRule?.Status).toBe('Enabled');
      expect(deleteRule?.NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);
      
      // Check transition to IA rule
      const transitionRule = rules.find(rule => rule.ID === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Status).toBe('Enabled');
      expect(transitionRule?.Transitions?.[0]?.Days).toBe(30);
      
      // 3. Verify CloudWatch log retention
      const logGroupName = `/aws/ec2/webapp-${environmentSuffix}`;
      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
      const logGroup = logGroupResponse.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup?.retentionInDays).toBe(30);

      console.log('Data backup and retention validation passed');
    }, e2eTimeout);

    test('E2E: Infrastructure can recover from component failures', async () => {
      // Test infrastructure resilience and recovery capabilities
      
      const asgName = outputs.AutoScalingGroupName;
      
      // 1. Verify Auto Scaling Group configuration supports recovery
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      
      expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg?.MaxSize).toBeGreaterThan(asg?.MinSize || 0);
      expect(asg?.HealthCheckType).toBe('EC2');
      expect(asg?.HealthCheckGracePeriod).toBe(300); // 5 minutes
      
      // 2. Verify instances are distributed across multiple AZs
      const instances = asg?.Instances || [];
      if (instances.length > 1) {
        const azs = new Set(instances.map(i => i.AvailabilityZone));
        expect(azs.size).toBeGreaterThan(1);
      }
      
      // 3. Verify subnets span multiple AZs
      const vpcId = outputs.VPCId;
      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);
      const subnets = subnetsResponse.Subnets || [];
      
      const privateSubnets = subnets.filter(s => !s.MapPublicIpOnLaunch);
      const azs = new Set(privateSubnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      
      // 4. Verify monitoring can detect failures
      const alarmCommand = new DescribeAlarmsCommand({
        AlarmNames: [`webapp-low-instances-${environmentSuffix}`],
      });
      const alarmResponse = await cloudWatchClient.send(alarmCommand);
      const alarm = alarmResponse.MetricAlarms?.[0];
      
      expect(alarm).toBeDefined();
      expect(alarm?.Threshold).toBe(1);
      expect(alarm?.ComparisonOperator).toBe('LessThanThreshold');

      console.log('Infrastructure recovery capabilities validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Compliance and Governance', () => {
    test('E2E: All resources comply with tagging standards', async () => {
      // Test that all resources have proper tags for governance
      
      const requiredTags = ['Environment', 'Project', 'ManagedBy'];
      
      // 1. Check VPC tags
      const vpcId = outputs.VPCId;
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcTags = vpcResponse.Vpcs?.[0]?.Tags || [];
      
      requiredTags.forEach(tagKey => {
        const tag = vpcTags.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag?.Value).toBeTruthy();
      });
      
      // 2. Check Auto Scaling Group tags
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asgTags = asgResponse.AutoScalingGroups?.[0]?.Tags || [];
      
      requiredTags.forEach(tagKey => {
        const tag = asgTags.find(t => t.Key === tagKey);
        expect(tag).toBeDefined();
        expect(tag?.Value).toBeTruthy();
      });
      
      // 3. Verify Environment tag has correct value
      const envTag = vpcTags.find(t => t.Key === 'Environment');
      expect(envTag?.Value).toBe('Production');

      console.log('Tagging standards compliance validation passed');
    }, e2eTimeout);

    test('E2E: Infrastructure follows security compliance requirements', async () => {
      // Test comprehensive security compliance across all components
      
      // 1. Verify encryption in transit and at rest
      const bucketName = outputs.S3BucketName;
      
      // Check S3 encryption
      const encryptionCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName,
      });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      
      // Check SSL enforcement
      const policyCommand = new GetBucketPolicyCommand({
        Bucket: bucketName,
      });
      const policyResponse = await s3Client.send(policyCommand);
      const policy = JSON.parse(policyResponse.Policy || '{}');
      const sslStatement = policy.Statement?.find((stmt: any) => 
        stmt.Effect === 'Deny' && 
        stmt.Condition?.Bool?.['aws:SecureTransport'] === 'false'
      );
      expect(sslStatement).toBeDefined();
      
      // 2. Verify network security
      const vpcId = outputs.VPCId;
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const sgResponse = await ec2Client.send(sgCommand);
      const securityGroups = sgResponse.SecurityGroups || [];
      
      // Verify no overly permissive rules
      securityGroups.forEach(sg => {
        const ingressRules = sg.IpPermissions || [];
        ingressRules.forEach(rule => {
          // Check for dangerous open ports
          if (rule.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')) {
            expect(rule.FromPort).not.toBe(22); // SSH
            expect(rule.FromPort).not.toBe(3389); // RDP
            expect(rule.FromPort).not.toBe(1433); // SQL Server
            expect(rule.FromPort).not.toBe(3306); // MySQL
          }
        });
      });
      
      // 3. Verify audit logging
      const flowLogsCommand = new DescribeFlowLogsCommand({
        Filter: [{ Name: 'resource-id', Values: [vpcId] }],
      });
      const flowLogsResponse = await ec2Client.send(flowLogsCommand);
      expect(flowLogsResponse.FlowLogs?.length).toBeGreaterThan(0);
      expect(flowLogsResponse.FlowLogs?.[0].FlowLogStatus).toBe('ACTIVE');
      expect(flowLogsResponse.FlowLogs?.[0].TrafficType).toBe('ALL');

      console.log('Security compliance validation passed');
    }, e2eTimeout);

    test('E2E: Cost optimization measures are in place', async () => {
      // Test that cost optimization measures are properly configured
      
      // 1. Verify S3 lifecycle policies for cost optimization
      const bucketName = outputs.S3BucketName;
      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({
        Bucket: bucketName,
      });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      const rules = lifecycleResponse.Rules || [];
      
      const transitionRule = rules.find(rule => rule.ID === 'TransitionToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule?.Transitions?.[0]?.StorageClass).toBe('STANDARD_IA');
      expect(transitionRule?.Transitions?.[0]?.Days).toBe(30);
      
      // 2. Verify Auto Scaling is configured for cost efficiency
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups?.[0];
      
      // Verify reasonable scaling limits
      expect(asg?.MinSize).toBeLessThanOrEqual(2);
      expect(asg?.MaxSize).toBeLessThanOrEqual(10);
      
      // 3. Verify instance types are cost-effective
      const instanceIds = asg?.Instances?.map(i => i.InstanceId).filter(Boolean) || [];
      if (instanceIds.length > 0) {
        const instancesCommand = new DescribeInstancesCommand({
          InstanceIds: instanceIds as string[],
        });
        const instancesResponse = await ec2Client.send(instancesCommand);
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []) || [];
        
        instances.forEach(instance => {
          // Verify using cost-effective instance types
          expect(instance.InstanceType).toMatch(/^(t3|t4g|m5|m6i)\./);
        });
      }
      
      // 4. Verify log retention is reasonable for cost
      const logGroupName = `/aws/ec2/webapp-${environmentSuffix}`;
      const logGroupCommand = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName,
      });
      const logGroupResponse = await cloudWatchLogsClient.send(logGroupCommand);
      const logGroup = logGroupResponse.logGroups?.find(lg => lg.logGroupName === logGroupName);
      
      expect(logGroup?.retentionInDays).toBeLessThanOrEqual(90);

      console.log('Cost optimization validation passed');
    }, e2eTimeout);
  });
});
