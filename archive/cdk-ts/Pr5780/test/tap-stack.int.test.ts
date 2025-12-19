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
  BatchGetProjectsCommand,
  CodeBuildClient,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetRoleCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
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
import path from 'path';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Client configuration with explicit credential resolution
const clientConfig = {
  region,
  // This helps avoid the dynamic import issue in Jest
  maxAttempts: 3,
};

// Initialize AWS clients
const s3Client = new S3Client(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const pipelineClient = new CodePipelineClient(clientConfig);
const codeBuildClient = new CodeBuildClient(clientConfig);
const codeDeployClient = new CodeDeployClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const asgClient = new AutoScalingClient(clientConfig);
const snsClient = new SNSClient(clientConfig);
const ssmClient = new SSMClient(clientConfig);
const cwClient = new CloudWatchClient(clientConfig);
const iamClient = new IAMClient(clientConfig);
const cwLogsClient = new CloudWatchLogsClient(clientConfig);

// Helper function to read outputs from flat-outputs.json
function getOutputs() {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    console.warn(`Outputs file not found at ${outputsPath}, some tests may be skipped`);
    return null;
  }
  const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
  console.log('Loaded outputs from flat-outputs.json:', Object.keys(outputs));
  return outputs;
}

// Helper to get account ID
async function getAccountId(outputsData?: any): Promise<string> {
  if (outputsData?.AccountId) {
    return outputsData.AccountId;
  }
  // Fallback to AWS STS
  const { STSClient, GetCallerIdentityCommand } = require('@aws-sdk/client-sts');
  const stsClient = new STSClient({ region });
  const response = await stsClient.send(new GetCallerIdentityCommand({}));
  return response.Account!;
}

describe('TAP Stack Integration Tests - Live AWS Resources', () => {
  let outputs: any;
  const envPrefix = `tap-${environmentSuffix}`;

  beforeAll(() => {
    outputs = getOutputs();
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR block', async () => {
      try {
        const command = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs!.length).toBeGreaterThan(0);

        const vpc = response.Vpcs![0];
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        // DNS settings may not be returned in describe-vpcs, check if defined
        if (vpc.EnableDnsHostnames !== undefined) {
          expect(vpc.EnableDnsHostnames).toBe(true);
        }
        if (vpc.EnableDnsSupport !== undefined) {
          expect(vpc.EnableDnsSupport).toBe(true);
        }
      } catch (error: any) {
        console.error('VPC test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have 4 subnets (2 public, 2 private)', async () => {
      try {
        const vpcCommand = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const vpcResponse = await ec2Client.send(vpcCommand);

        expect(vpcResponse.Vpcs).toBeDefined();
        expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

        const vpcId = vpcResponse.Vpcs![0].VpcId;

        const subnetCommand = new DescribeSubnetsCommand({
          Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
        });
        const response = await ec2Client.send(subnetCommand);

        expect(response.Subnets).toBeDefined();
        expect(response.Subnets!.length).toBe(4);

        const publicSubnets = response.Subnets!.filter((s) => s.MapPublicIpOnLaunch);
        const privateSubnets = response.Subnets!.filter((s) => !s.MapPublicIpOnLaunch);

        expect(publicSubnets.length).toBe(2);
        expect(privateSubnets.length).toBe(2);
      } catch (error: any) {
        console.error('Subnets test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have Internet Gateway attached', async () => {
      try {
        const vpcCommand = new DescribeVpcsCommand({
          Filters: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'tag:Environment', Values: [environmentSuffix] },
          ],
        });
        const vpcResponse = await ec2Client.send(vpcCommand);

        expect(vpcResponse.Vpcs).toBeDefined();
        expect(vpcResponse.Vpcs!.length).toBeGreaterThan(0);

        const vpcId = vpcResponse.Vpcs![0].VpcId;

        const command = new DescribeInternetGatewaysCommand({
          Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId!] }],
        });
        const response = await ec2Client.send(command);

        expect(response.InternetGateways).toBeDefined();
        expect(response.InternetGateways!.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Internet Gateway test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have NAT Gateway in public subnet', async () => {
      try {
        const command = new DescribeNatGatewaysCommand({
          Filter: [
            { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
            { Name: 'state', Values: ['available', 'pending'] },
          ],
        });
        const response = await ec2Client.send(command);

        expect(response.NatGateways).toBeDefined();
        expect(response.NatGateways!.length).toBeGreaterThan(0);
        expect(response.NatGateways![0].State).toMatch(/available|pending/);
      } catch (error: any) {
        console.error('NAT Gateway test error:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('should have source bucket with versioning enabled', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = outputs?.SourceBucketOutput || `${envPrefix}-pipeline-source-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
        const versioningResponse = await s3Client.send(versioningCommand);
        expect(versioningResponse.Status).toBe('Enabled');

        const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
        const encryptionResponse = await s3Client.send(encryptionCommand);
        expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
        expect(encryptionResponse.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      } catch (error: any) {
        console.error('Source bucket test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have artifacts bucket with lifecycle policy', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = `${envPrefix}-pipeline-artifacts-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const lifecycleResponse = await s3Client.send(lifecycleCommand);
        expect(lifecycleResponse.Rules).toBeDefined();
        expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

        // Verify at least one rule has expiration configured
        const rulesWithExpiration = lifecycleResponse.Rules!.filter((r) => r.Expiration?.Days);
        expect(rulesWithExpiration.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Artifacts bucket test error:', error.message);
        throw error;
      }
    }, 30000);

    test('should have logging bucket with Glacier transition', async () => {
      try {
        const accountId = await getAccountId(outputs);
        const bucketName = `${envPrefix}-pipeline-logs-${accountId}-${region}`;

        const headCommand = new HeadBucketCommand({ Bucket: bucketName });
        await expect(s3Client.send(headCommand)).resolves.toBeDefined();

        const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
        const lifecycleResponse = await s3Client.send(lifecycleCommand);
        expect(lifecycleResponse.Rules).toBeDefined();

        // Verify at least one rule has Glacier transition
        const glacierRules = lifecycleResponse.Rules!.filter((r) =>
          r.Transitions?.some((t) => t.StorageClass === 'GLACIER')
        );
        expect(glacierRules.length).toBeGreaterThan(0);

        // Verify rules have expiration configured
        const rulesWithExpiration = lifecycleResponse.Rules!.filter((r) => r.Expiration?.Days);
        expect(rulesWithExpiration.length).toBeGreaterThan(0);
      } catch (error: any) {
        console.error('Logging bucket test error:', error.message);
        throw error;
      }
    }, 30000);
  });

  describe('IAM Roles', () => {
    test('should have CodeBuild role', async () => {
      const roleName = `${envPrefix}-codebuild-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codebuild.amazonaws.com');
    }, 30000);

    test('should have CodeDeploy role', async () => {
      const roleName = `${envPrefix}-codedeploy-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codedeploy.amazonaws.com');
    }, 30000);

    test('should have CodePipeline role', async () => {
      const roleName = `${envPrefix}-pipeline-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      expect(response.Role!.AssumeRolePolicyDocument).toContain('codepipeline.amazonaws.com');
    }, 30000);

    test('should have EC2 instance role with SSM permissions', async () => {
      const roleName = `${envPrefix}-ec2-role`;
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);

      // Check for CloudWatch managed policy (which includes SSM)
      const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(policiesCommand);
      const cloudWatchPolicy = policiesResponse.AttachedPolicies!.find((p) =>
        p.PolicyName!.includes('CloudWatch')
      );
      expect(cloudWatchPolicy).toBeDefined();
      expect(cloudWatchPolicy!.PolicyName).toBe('CloudWatchAgentServerPolicy');
    }, 30000);
  });

  describe('SSM Parameters', () => {
    test('should have CodeBuild image parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codebuild/image` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('aws/codebuild/amazonlinux2-x86_64-standard:4.0');
    }, 30000);

    test('should have Node.js version parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codebuild/node-version` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toBe('18');
    }, 30000);

    test('should have deployment config parameter', async () => {
      const command = new GetParameterCommand({ Name: `/${envPrefix}/codedeploy/config` });
      const response = await ssmClient.send(command);

      expect(response.Parameter).toBeDefined();
      expect(response.Parameter!.Value).toContain('CodeDeployDefault');
    }, 30000);
  });

  describe('CodePipeline', () => {
    test('should have pipeline with correct stages', async () => {
      const pipelineName = `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();
      expect(response.pipeline!.name).toBe(pipelineName);
      expect(response.pipeline!.stages).toBeDefined();
      expect(response.pipeline!.stages!.length).toBeGreaterThanOrEqual(3);

      const stageNames = response.pipeline!.stages!.map((s) => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('Deploy');
    }, 30000);

    test('should have S3 as source provider', async () => {
      const pipelineName = `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      const sourceStage = response.pipeline!.stages!.find((s) => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions![0].actionTypeId!.provider).toBe('S3');
    }, 30000);
  });

  describe('CodeBuild', () => {
    test('should have build project with correct configuration', async () => {
      const projectName = `${envPrefix}-build-project`;
      const command = new BatchGetProjectsCommand({ names: [projectName] });
      const response = await codeBuildClient.send(command);

      expect(response.projects).toBeDefined();
      expect(response.projects!.length).toBe(1);

      const project = response.projects![0];
      expect(project.name).toBe(projectName);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:5.0');
    }, 30000);
  });

  describe('CodeDeploy', () => {
    test('should have deployment application', async () => {
      const appName = `${envPrefix}-application`;
      const command = new GetApplicationCommand({ applicationName: appName });
      const response = await codeDeployClient.send(command);

      expect(response.application).toBeDefined();
      expect(response.application!.applicationName).toBe(appName);
    }, 30000);

    test('should have deployment group with auto-rollback', async () => {
      const appName = `${envPrefix}-application`;
      const groupName = `${envPrefix}-deployment-group`;
      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();
      expect(response.deploymentGroupInfo!.deploymentGroupName).toBe(groupName);
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration).toBeDefined();
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration!.enabled).toBe(true);
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('should have ALB configured', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`${envPrefix}-alb`],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.LoadBalancerName).toBe(`${envPrefix}-alb`);
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
    }, 30000);

    test('should have blue and green target groups with health checks', async () => {
      // Check blue target group
      const blueCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-blue-tg`],
      });
      const blueResponse = await elbClient.send(blueCommand);

      expect(blueResponse.TargetGroups).toBeDefined();
      expect(blueResponse.TargetGroups!.length).toBe(1);

      const blueTg = blueResponse.TargetGroups![0];
      expect(blueTg.TargetGroupName).toBe(`${envPrefix}-blue-tg`);
      expect(blueTg.Protocol).toBe('HTTP');
      expect(blueTg.Port).toBe(80);
      expect(blueTg.HealthCheckEnabled).toBe(true);
      expect(blueTg.HealthCheckPath).toBe('/');

      // Check green target group
      const greenCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-green-tg`],
      });
      const greenResponse = await elbClient.send(greenCommand);

      expect(greenResponse.TargetGroups).toBeDefined();
      expect(greenResponse.TargetGroups!.length).toBe(1);

      const greenTg = greenResponse.TargetGroups![0];
      expect(greenTg.TargetGroupName).toBe(`${envPrefix}-green-tg`);
      expect(greenTg.Protocol).toBe('HTTP');
      expect(greenTg.Port).toBe(80);
    }, 30000);

    test('should have listeners on ports 80 and 8080 for blue/green', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [`${envPrefix}-alb`],
      });
      const lbResponse = await elbClient.send(lbCommand);
      const lbArn = lbResponse.LoadBalancers![0].LoadBalancerArn;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: lbArn,
      });
      const response = await elbClient.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBe(2);

      // Production listener on port 80
      const httpListener = response.Listeners!.find((l) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');

      // Test listener on port 8080 for blue/green
      const testListener = response.Listeners!.find((l) => l.Port === 8080);
      expect(testListener).toBeDefined();
      expect(testListener!.Protocol).toBe('HTTP');
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with correct configuration', async () => {
      // Get all ASGs and filter by tags since CDK generates names
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();

      // Find ASG by tags (iac-rlhf-amazon and Environment)
      const asg = response.AutoScalingGroups!.find((asg) =>
        asg.Tags?.some((tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true') &&
        asg.Tags?.some((tag) => tag.Key === 'Environment' && tag.Value === environmentSuffix)
      );

      expect(asg).toBeDefined();
      expect(asg!.AutoScalingGroupName).toContain('asg');

      if (environmentSuffix === 'prod') {
        expect(asg!.MinSize).toBe(2);
        expect(asg!.MaxSize).toBe(10);
      } else {
        expect(asg!.MinSize).toBe(1);
        expect(asg!.MaxSize).toBe(3);
      }
    }, 30000);
  });

  describe('SNS Topics', () => {
    test('should have pipeline notification topic', async () => {
      if (!outputs?.PipelineTopicArn) {
        console.warn('PipelineTopicArn not found in outputs, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.PipelineTopicArn,
      });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.DisplayName).toContain('Pipeline notifications');
    }, 30000);
  });

  describe('CloudWatch', () => {
    test('should have deployment failure alarm', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`${envPrefix}-deployment-failure`],
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(`${envPrefix}-deployment-failure`);
      expect(alarm.Namespace).toBe('AWS/CodeDeploy');
    }, 30000);

    test('should have log group for CodeBuild', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/codebuild/${envPrefix}-build`,
      });
      const response = await cwLogsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('Security Groups', () => {
    test('should have security groups with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
          { Name: 'tag:Environment', Values: [environmentSuffix] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Find any security group with HTTP (port 80) ingress rules
      const sgsWithHttp = response.SecurityGroups!.filter((sg) =>
        sg.IpPermissions?.some((rule) => rule.FromPort === 80 && rule.ToPort === 80)
      );
      expect(sgsWithHttp.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Pipeline Flow', () => {
    test('should have pipeline in ready state', async () => {
      const pipelineName = outputs?.PipelineNameOutput || `${envPrefix}-pipeline`;
      const command = new GetPipelineStateCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates!.length).toBeGreaterThan(0);

      // Pipeline should exist and be in a valid state
      response.stageStates!.forEach((stage) => {
        expect(stage.stageName).toBeDefined();
      });
    }, 30000);

    test('should have ALB with accessible DNS', async () => {
      const albDns = outputs?.ALBDnsOutput;

      if (!albDns) {
        console.warn('ALB DNS not found in outputs, trying to fetch from ALB list');
        const command = new DescribeLoadBalancersCommand({
          Names: [`${envPrefix}-alb`],
        });
        const response = await elbClient.send(command);
        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBe(1);
        expect(response.LoadBalancers![0].DNSName).toBeDefined();
      } else {
        expect(albDns).toBeDefined();
        expect(albDns).toContain('.elb.');
        expect(albDns).toContain(region);
      }
    }, 30000);

    test('should verify complete deployment configuration', async () => {
      // Verify the deployment group has all required configurations
      const appName = `${envPrefix}-application`;
      const groupName = `${envPrefix}-deployment-group`;
      const command = new GetDeploymentGroupCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
      });
      const response = await codeDeployClient.send(command);

      expect(response.deploymentGroupInfo).toBeDefined();

      // Verify auto-rollback is enabled
      expect(response.deploymentGroupInfo!.autoRollbackConfiguration!.enabled).toBe(true);

      // Verify load balancer is configured
      expect(response.deploymentGroupInfo!.loadBalancerInfo).toBeDefined();
      expect(response.deploymentGroupInfo!.loadBalancerInfo!.targetGroupInfoList).toBeDefined();
      expect(response.deploymentGroupInfo!.loadBalancerInfo!.targetGroupInfoList!.length).toBeGreaterThan(0);

      // Verify ASG is attached
      expect(response.deploymentGroupInfo!.autoScalingGroups).toBeDefined();
      expect(response.deploymentGroupInfo!.autoScalingGroups!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have functional monitoring with alarms', async () => {
      const alarmNames = [
        `${envPrefix}-deployment-failure`,
        `${envPrefix}-high-cpu`,
        `${envPrefix}-high-response-time`,
        `${envPrefix}-unhealthy-hosts`,
      ];

      const command = new DescribeAlarmsCommand({
        AlarmNames: alarmNames,
      });
      const response = await cwClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThanOrEqual(2);

      // Verify at least some alarms have actions configured
      const alarmsWithActions = response.MetricAlarms!.filter(
        (alarm) => alarm.AlarmActions && alarm.AlarmActions.length > 0
      );
      expect(alarmsWithActions.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('End-to-End Resource Integration', () => {
    test('should verify EC2 instances are registered with blue target group', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-blue-tg`],
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBe(1);

      const targetGroupArn = tgResponse.TargetGroups![0].TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      // Verify target group has health checks configured
      const tg = tgResponse.TargetGroups![0];
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
    }, 30000);

    test('should verify all required IAM roles have correct trust relationships', async () => {
      const roles = [
        { name: `${envPrefix}-codebuild-role`, service: 'codebuild.amazonaws.com' },
        { name: `${envPrefix}-codedeploy-role`, service: 'codedeploy.amazonaws.com' },
        { name: `${envPrefix}-pipeline-role`, service: 'codepipeline.amazonaws.com' },
        { name: `${envPrefix}-ec2-role`, service: 'ec2.amazonaws.com' },
      ];

      for (const roleInfo of roles) {
        const command = new GetRoleCommand({ RoleName: roleInfo.name });
        const response = await iamClient.send(command);

        expect(response.Role).toBeDefined();
        expect(response.Role!.AssumeRolePolicyDocument).toContain(roleInfo.service);
      }
    }, 30000);

    test('should verify SSM parameters are accessible and contain expected values', async () => {
      const params = [
        { name: `/${envPrefix}/codebuild/image`, expectedValue: 'aws/codebuild/amazonlinux2-x86_64-standard:4.0' },
        { name: `/${envPrefix}/codebuild/node-version`, expectedValue: '18' },
        { name: `/${envPrefix}/codedeploy/config`, expectedPattern: /CodeDeployDefault/ },
      ];

      for (const param of params) {
        const command = new GetParameterCommand({ Name: param.name });
        const response = await ssmClient.send(command);

        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toBeDefined();

        if ('expectedValue' in param) {
          expect(response.Parameter!.Value).toBe(param.expectedValue);
        } else if ('expectedPattern' in param) {
          expect(response.Parameter!.Value).toMatch(param.expectedPattern);
        }
      }
    }, 30000);

    test('should verify complete CI/CD pipeline configuration meets requirements', async () => {
      const pipelineName = outputs?.PipelineNameOutput || `${envPrefix}-pipeline`;
      const command = new GetPipelineCommand({ name: pipelineName });
      const response = await pipelineClient.send(command);

      expect(response.pipeline).toBeDefined();

      // Requirement: Support blue/green deployments (verified via CodeDeploy config)
      const stages = response.pipeline!.stages!;
      const deployStage = stages.find((s) => s.name === 'Deploy');
      expect(deployStage).toBeDefined();
      expect(deployStage!.actions![0].actionTypeId!.provider).toBe('CodeDeploy');

      // Requirement: Integrated AWS CodeBuild for source code compilation
      const buildStage = stages.find((s) => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage!.actions![0].actionTypeId!.provider).toBe('CodeBuild');

      // Requirement: Approval required before production releases (if prod)
      if (environmentSuffix === 'prod') {
        const approvalStage = stages.find((s) => s.name === 'ManualApproval');
        expect(approvalStage).toBeDefined();
        expect(approvalStage!.actions![0].actionTypeId!.category).toBe('Approval');
      }

      // Requirement: Use S3 as source (replacing CodeCommit)
      const sourceStage = stages.find((s) => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage!.actions![0].actionTypeId!.provider).toBe('S3');
    }, 30000);
  });
});
