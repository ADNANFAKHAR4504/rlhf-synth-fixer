// End-to-End Infrastructure Tests
// These tests validate the complete infrastructure stack end-to-end
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
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
  IAMClient,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketPolicyCommand,
  GetBucketVersioningCommand,
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

// Test timeout for AWS API calls
const e2eTimeout = 60000; // 1 minute for e2e tests

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

describe('End-to-End Infrastructure Tests', () => {
  
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

      console.log('✅ Complete infrastructure stack validation passed');
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

      console.log('✅ Infrastructure resilience validation passed');
    }, e2eTimeout);
  });

  describe('Security Posture and Compliance E2E Tests', () => {
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

      console.log('✅ Security posture validation passed');
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

      console.log('✅ Security compliance validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Performance and Scalability E2E Tests', () => {
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

      console.log('✅ Monitoring and alerting validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Integration and Connectivity E2E Tests', () => {
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

      console.log('✅ VPC endpoints validation passed');
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

      console.log('✅ IAM roles and policies validation passed');
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

      console.log('✅ SSM parameters validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Disaster Recovery and Business Continuity E2E Tests', () => {
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

      console.log('✅ Data backup and retention validation passed');
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

      console.log('✅ Infrastructure recovery capabilities validation passed');
    }, e2eTimeout);
  });

  describe('Infrastructure Compliance and Governance E2E Tests', () => {
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

      console.log('✅ Tagging standards compliance validation passed');
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

      console.log('✅ Cost optimization validation passed');
    }, e2eTimeout);
  });
});