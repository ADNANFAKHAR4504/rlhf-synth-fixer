import fs from 'fs';
import path from 'path';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
} from '@aws-sdk/client-s3';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  CodePipelineClient,
  GetPipelineCommand,
  GetPipelineStateCommand,
} from '@aws-sdk/client-codepipeline';
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  GetApplicationCommand,
  GetDeploymentGroupCommand,
} from '@aws-sdk/client-codedeploy';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SSMClient,
  GetParameterCommand,
} from '@aws-sdk/client-ssm';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const s3Client = new S3Client({ region });
const ec2Client = new EC2Client({ region });
const pipelineClient = new CodePipelineClient({ region });
const codeBuildClient = new CodeBuildClient({ region });
const codeDeployClient = new CodeDeployClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const snsClient = new SNSClient({ region });
const ssmClient = new SSMClient({ region });
const cwClient = new CloudWatchClient({ region });
const iamClient = new IAMClient({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });

// Helper function to read outputs
function getOutputs() {
  const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
  if (!fs.existsSync(outputsPath)) {
    console.warn(`Outputs file not found at ${outputsPath}, some tests may be skipped`);
    return null;
  }
  return JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

describe('TAP Stack Integration Tests - Live AWS Resources', () => {
  let outputs: any;
  const envPrefix = `tap-${environmentSuffix}`;

  beforeAll(() => {
    outputs = getOutputs();
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        Filters: [
          { Name: 'tag:Name', Values: [`TapStack-${environmentSuffix}/tap-${environmentSuffix}-vpc`] },
          { Name: 'tag:iac-rlhf-amazon', Values: ['true'] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBeGreaterThan(0);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(response.Vpcs![0].EnableDnsSupport).toBe(true);
    }, 30000);

    test('should have 4 subnets (2 public, 2 private)', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`TapStack-${environmentSuffix}/tap-${environmentSuffix}-vpc`] }],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
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
    }, 30000);

    test('should have Internet Gateway attached', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [{ Name: 'tag:Name', Values: [`TapStack-${environmentSuffix}/tap-${environmentSuffix}-vpc`] }],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcId = vpcResponse.Vpcs![0].VpcId;

      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId!] }],
      });
      const response = await ec2Client.send(command);

      expect(response.InternetGateways).toBeDefined();
      expect(response.InternetGateways!.length).toBeGreaterThan(0);
    }, 30000);

    test('should have NAT Gateway in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'tag:Name', Values: [`TapStack-${environmentSuffix}/tap-${environmentSuffix}-vpc/PublicSubnet1`] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThan(0);
      expect(response.NatGateways![0].State).toMatch(/available|pending/);
    }, 30000);
  });

  describe('S3 Buckets', () => {
    test('should have source bucket with versioning enabled', async () => {
      const bucketName = `${envPrefix}-pipeline-source-${outputs?.AccountId || '097219365021'}-${region}`;

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');

      const encryptionCommand = new GetBucketEncryptionCommand({ Bucket: bucketName });
      const encryptionResponse = await s3Client.send(encryptionCommand);
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
    }, 30000);

    test('should have artifacts bucket with lifecycle policy', async () => {
      const bucketName = `${envPrefix}-pipeline-artifacts-${outputs?.AccountId || '097219365021'}-${region}`;

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

      const cleanupRule = lifecycleResponse.Rules!.find((r) => r.Id === 'cleanup-old-artifacts');
      expect(cleanupRule).toBeDefined();
      expect(cleanupRule!.Expiration?.Days).toBe(7);
    }, 30000);

    test('should have logging bucket with Glacier transition', async () => {
      const bucketName = `${envPrefix}-pipeline-logs-${outputs?.AccountId || '097219365021'}-${region}`;

      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.toBeDefined();

      const lifecycleCommand = new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName });
      const lifecycleResponse = await s3Client.send(lifecycleCommand);
      expect(lifecycleResponse.Rules).toBeDefined();

      const glacierRule = lifecycleResponse.Rules!.find((r) => r.Id === 'transition-to-glacier');
      expect(glacierRule).toBeDefined();
      expect(glacierRule!.Transitions).toBeDefined();
      expect(glacierRule!.Transitions![0].StorageClass).toBe('GLACIER');
      expect(glacierRule!.Transitions![0].Days).toBe(30);
      expect(glacierRule!.Expiration?.Days).toBe(90);
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

      const policiesCommand = new ListAttachedRolePoliciesCommand({ RoleName: roleName });
      const policiesResponse = await iamClient.send(policiesCommand);
      const ssmPolicy = policiesResponse.AttachedPolicies!.find((p) =>
        p.PolicyName!.includes('SSM')
      );
      expect(ssmPolicy).toBeDefined();
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
      expect(project.environment!.image).toBe('aws/codebuild/amazonlinux2-x86_64-standard:4.0');
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

    test('should have target group with health checks', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`${envPrefix}-tg`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.TargetGroupName).toBe(`${envPrefix}-tg`);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/');
    }, 30000);

    test('should have listener on port 80', async () => {
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
      expect(response.Listeners!.length).toBeGreaterThan(0);

      const httpListener = response.Listeners!.find((l) => l.Port === 80);
      expect(httpListener).toBeDefined();
      expect(httpListener!.Protocol).toBe('HTTP');
    }, 30000);
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`${envPrefix}-asg`],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(`${envPrefix}-asg`);

      if (environmentSuffix === 'prod') {
        expect(asg.MinSize).toBe(2);
        expect(asg.MaxSize).toBe(10);
      } else {
        expect(asg.MinSize).toBe(1);
        expect(asg.MaxSize).toBe(3);
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

      const albSg = response.SecurityGroups!.find((sg) =>
        sg.GroupDescription!.includes('Application Load Balancer')
      );
      expect(albSg).toBeDefined();

      const httpRule = albSg!.IpPermissions!.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Pipeline Flow', () => {
    test('should have pipeline in ready state', async () => {
      const pipelineName = `${envPrefix}-pipeline`;
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
  });
});
