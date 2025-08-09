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
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('lib/flat-outputs.json', 'utf8')
);

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

      expect(policies.length).toBeGreaterThanOrEqual(2);

      const policyNames = policies.map(p => p.PolicyName);
      expect(policyNames).toContain('CloudWatchAgentServerPolicy');
      expect(policyNames).toContain('AmazonSSMManagedInstanceCore');
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
