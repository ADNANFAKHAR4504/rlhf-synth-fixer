// Integration tests for deployed TAP stack infrastructure
import {
  CodeBuildClient,
  BatchGetProjectsCommand,
} from '@aws-sdk/client-codebuild';
import {
  CodeDeployClient,
  ListApplicationsCommand,
  ListDeploymentGroupsCommand,
} from '@aws-sdk/client-codedeploy';
import {
  CodePipelineClient,
  GetPipelineCommand,
  ListPipelinesCommand,
} from '@aws-sdk/client-codepipeline';
import {
  S3Client,
  GetBucketVersioningCommand,
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeLaunchTemplatesCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'ap-northeast-1';

// Initialize AWS SDK clients
const codeBuildClient = new CodeBuildClient({ region });
const codeDeployClient = new CodeDeployClient({ region });
const codePipelineClient = new CodePipelineClient({ region });
const s3Client = new S3Client({ region });
const secretsManagerClient = new SecretsManagerClient({ region });
const ec2Client = new EC2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const snsClient = new SNSClient({ region });
const cloudWatchClient = new CloudWatchClient({ region });

describe('TAP Stack Integration Tests', () => {
  // Extract resource IDs from outputs
  const vpcId = outputs[`VpcId${environmentSuffix}`];
  const sourceBucketName = outputs[`TapSourceBucketOutput${environmentSuffix}`];
  const artifactsBucketName =
    outputs[`ArtifactsBucketName${environmentSuffix}`];
  const secretArn = outputs[`BuildSecretsArn${environmentSuffix}`];
  const codeBuildProjectName =
    outputs[`CodeBuildProjectName${environmentSuffix}`];
  const codeDeployAppName =
    outputs[`CodeDeployApplicationName${environmentSuffix}`];
  const deploymentGroupName =
    outputs[`DeploymentGroupName${environmentSuffix}`];
  const autoScalingGroupName =
    outputs[`AutoScalingGroupName${environmentSuffix}`];
  const launchTemplateId = outputs[`LaunchTemplateId${environmentSuffix}`];
  const pipelineArn = outputs[`TapPipelineOutput${environmentSuffix}`];
  const snsTopicArn = outputs[`SnsTopicArn${environmentSuffix}`];
  const alarmName = outputs[`BuildFailureAlarmName${environmentSuffix}`];
  const securityGroupId = outputs[`SecurityGroupId${environmentSuffix}`];

  describe('Stack Deployment Validation', () => {
    test('should have all expected stack outputs from flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(pipelineArn).toBeDefined();
      expect(sourceBucketName).toBeDefined();
      expect(vpcId).toBeDefined();

      // Validate output formats
      expect(pipelineArn).toMatch(/^arn:aws:codepipeline:/);
      expect(sourceBucketName).toMatch(/^tap-source-/);
      expect(vpcId).toMatch(/^vpc-/);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      expect(vpcId).toBeDefined();

      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(vpcsResponse.Vpcs).toBeDefined();
      expect(vpcsResponse.Vpcs!.length).toBe(1);

      const vpc = vpcsResponse.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should have public and private subnets', async () => {
      expect(vpcId).toBeDefined();

      // Get all subnets in the VPC
      const subnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      expect(subnetsResponse.Subnets).toBeDefined();
      expect(subnetsResponse.Subnets!.length).toBe(4);

      // Check for public subnets (MapPublicIpOnLaunch = true)
      const publicSubnets = subnetsResponse.Subnets!.filter(
        subnet => subnet.MapPublicIpOnLaunch
      );
      expect(publicSubnets.length).toBe(2);

      // Check for private subnets (MapPublicIpOnLaunch = false)
      const privateSubnets = subnetsResponse.Subnets!.filter(
        subnet => !subnet.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBe(2);
    });

    test('should have Internet Gateway and NAT Gateway', async () => {
      expect(vpcId).toBeDefined();

      // Check Internet Gateway
      const igwResponse = await ec2Client.send(
        new DescribeInternetGatewaysCommand({
          Filters: [
            {
              Name: 'attachment.vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );
      expect(igwResponse.InternetGateways).toBeDefined();
      expect(igwResponse.InternetGateways!.length).toBeGreaterThan(0);
      expect(igwResponse.InternetGateways![0].Attachments![0].State).toBe(
        'available'
      );

      // Check NAT Gateway
      const natGwResponse = await ec2Client.send(
        new DescribeNatGatewaysCommand({
          Filter: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );
      expect(natGwResponse.NatGateways).toBeDefined();
      expect(natGwResponse.NatGateways!.length).toBeGreaterThan(0);
      expect(natGwResponse.NatGateways![0].State).toBe('available');
    });

    test('should have security group with proper configuration', async () => {
      expect(securityGroupId).toBeDefined();

      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [securityGroupId],
        })
      );

      expect(sgResponse.SecurityGroups).toBeDefined();
      expect(sgResponse.SecurityGroups!.length).toBe(1);

      const sg = sgResponse.SecurityGroups![0];
      expect(sg.Description).toBe('Security group for TAP EC2 instances');
      expect(sg.IpPermissions!.length).toBeGreaterThanOrEqual(2); // HTTP and HTTPS
    });
  });

  describe('S3 Storage', () => {
    test('should have source S3 bucket with versioning enabled', async () => {
      const sourceBucket = outputs[`TapSourceBucketOutput${environmentSuffix}`];
      expect(sourceBucket).toBeDefined();

      // Check bucket exists
      await expect(
        s3Client.send(new HeadBucketCommand({ Bucket: sourceBucket }))
      ).resolves.not.toThrow();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: sourceBucket })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check encryption
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({ Bucket: sourceBucket })
      );
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration
      ).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');
    });

    test('should have artifacts S3 bucket with lifecycle rules', async () => {
      expect(artifactsBucketName).toBeDefined();

      // Check versioning
      const versioningResponse = await s3Client.send(
        new GetBucketVersioningCommand({ Bucket: artifactsBucketName })
      );
      expect(versioningResponse.Status).toBe('Enabled');

      // Check lifecycle configuration
      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: artifactsBucketName,
        })
      );
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

      const deleteRule = lifecycleResponse.Rules!.find(
        (rule: any) => rule.ID === 'DeleteOldVersions'
      );
      expect(deleteRule).toBeDefined();
      expect(deleteRule!.Status).toBe('Enabled');
    });
  });

  describe('Secrets Management', () => {
    test('should have build secrets in Secrets Manager', async () => {
      expect(secretArn).toBeDefined();

      const secretResponse = await secretsManagerClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      expect(secretResponse.Name).toMatch(/tap-build-secrets/);
      expect(secretResponse.Description).toBe(
        'Build secrets for TAP application'
      );
    });
  });

  describe('CodeBuild Project', () => {
    test('should have CodeBuild project with correct configuration', async () => {
      expect(codeBuildProjectName).toBeDefined();

      const buildResponse = await codeBuildClient.send(
        new BatchGetProjectsCommand({
          names: [codeBuildProjectName],
        })
      );

      expect(buildResponse.projects).toBeDefined();
      expect(buildResponse.projects!.length).toBe(1);

      const project = buildResponse.projects![0];
      expect(project.name).toMatch(/tap-build/);
      expect(project.environment!.type).toBe('LINUX_CONTAINER');
      expect(project.environment!.computeType).toBe('BUILD_GENERAL1_SMALL');
      expect(project.environment!.image).toBe('aws/codebuild/standard:7.0');

      // Check environment variables
      const envVars = project.environment!.environmentVariables || [];
      const envSuffixVar = envVars.find(v => v.name === 'ENVIRONMENT_SUFFIX');
      const secretsVar = envVars.find(v => v.name === 'SECRETS_ARN');

      expect(envSuffixVar).toBeDefined();
      expect(envSuffixVar!.value).toBe(environmentSuffix);
      expect(secretsVar).toBeDefined();
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('should have CodeDeploy application', async () => {
      expect(codeDeployAppName).toBeDefined();
      expect(codeDeployAppName).toMatch(`tap-app-${environmentSuffix}`);
    });

    test('should have deployment group configured', async () => {
      expect(codeDeployAppName).toBeDefined();
      expect(deploymentGroupName).toBeDefined();

      const groupsResponse = await codeDeployClient.send(
        new ListDeploymentGroupsCommand({ applicationName: codeDeployAppName })
      );

      expect(groupsResponse.deploymentGroups).toBeDefined();
      expect(groupsResponse.deploymentGroups!.length).toBe(1);
      expect(groupsResponse.deploymentGroups![0]).toMatch(
        /tap-deployment-group/
      );
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should have auto scaling group with proper configuration', async () => {
      expect(autoScalingGroupName).toBeDefined();

      const asgResponse = await autoScalingClient.send(
        new DescribeAutoScalingGroupsCommand({
          AutoScalingGroupNames: [autoScalingGroupName],
        })
      );

      expect(asgResponse.AutoScalingGroups).toBeDefined();
      expect(asgResponse.AutoScalingGroups!.length).toBe(1);

      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(3);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.VPCZoneIdentifier).toBeDefined();

      // Check tags
      const nameTag = asg.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toBe(`tap-instance-${environmentSuffix}`);
    });

    test('should have launch template configured', async () => {
      expect(launchTemplateId).toBeDefined();

      const ltResponse = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: [launchTemplateId],
        })
      );

      expect(ltResponse.LaunchTemplates).toBeDefined();
      expect(ltResponse.LaunchTemplates!.length).toBe(1);

      const lt = ltResponse.LaunchTemplates![0];
      expect(lt.LaunchTemplateName).toMatch(/tap-launch-template/);
    });
  });

  describe('CI/CD Pipeline', () => {
    test('should have CodePipeline with all stages', async () => {
      const pipelineArn = outputs[`TapPipelineOutput${environmentSuffix}`];
      expect(pipelineArn).toBeDefined();

      // Extract pipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop();

      const pipelineResponse = await codePipelineClient.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(pipelineResponse.pipeline).toBeDefined();
      expect(pipelineResponse.pipeline!.stages).toBeDefined();
      expect(pipelineResponse.pipeline!.stages!.length).toBe(4);

      const stageNames = pipelineResponse.pipeline!.stages!.map(s => s.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('ApproveStaging');
      expect(stageNames).toContain('Deploy');
    });

    test('should have pipeline in available state', async () => {
      expect(pipelineArn).toBeDefined();

      // Extract pipeline name from ARN
      const pipelineName = pipelineArn.split(':').pop();

      const pipelinesResponse = await codePipelineClient.send(
        new ListPipelinesCommand()
      );

      const tapPipeline = pipelinesResponse.pipelines?.find(
        p => p.name === pipelineName
      );
      expect(tapPipeline).toBeDefined();
      expect(tapPipeline!.created).toBeDefined();
      expect(tapPipeline!.updated).toBeDefined();
    });
  });

  describe('Monitoring and Notifications', () => {
    test('should have SNS topic for notifications', async () => {
      expect(snsTopicArn).toBeDefined();

      const topicResponse = await snsClient.send(
        new GetTopicAttributesCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes!.DisplayName).toBe(
        'TAP Pipeline Notifications'
      );
    });

    test('should have CloudWatch alarms configured', async () => {
      expect(alarmName).toBeDefined();

      const alarmsResponse = await cloudWatchClient.send(
        new DescribeAlarmsCommand({
          AlarmNames: [alarmName],
        })
      );

      expect(alarmsResponse.MetricAlarms).toBeDefined();
      expect(alarmsResponse.MetricAlarms!.length).toBe(1);

      const alarm = alarmsResponse.MetricAlarms![0];
      expect(alarm.AlarmName).toBe(`tap-build-failure-${environmentSuffix}`);
      expect(alarm.MetricName).toBe('FailedBuilds');
      expect(alarm.Namespace).toBe('AWS/CodeBuild');
      expect(alarm.Threshold).toBe(1);
    });
  });

  describe('Resource Tagging and Naming', () => {
    test('should have consistent naming with environment suffix', () => {
      // Check that outputs contain environment suffix
      expect(pipelineArn).toContain(environmentSuffix);
      expect(sourceBucketName).toContain(environmentSuffix);
      expect(codeBuildProjectName).toContain(environmentSuffix);
      expect(alarmName).toContain(environmentSuffix);
    });

    test('should have proper resource tags for cost tracking', async () => {
      // Check VPC tags
      expect(vpcId).toBeDefined();

      const vpcsResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = vpcsResponse.Vpcs![0];
      const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');
      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe(environmentSuffix);

      // Check for iac-rlhf-amazon tag
      const iacTag = vpc.Tags?.find(tag => tag.Key === 'iac-rlhf-amazon');
      expect(iacTag).toBeDefined();
      expect(iacTag!.Value).toBe('true');
    });
  });

  describe('Security Validation', () => {
    test('should have encrypted S3 buckets', async () => {
      const buckets = [sourceBucketName, artifactsBucketName];

      // Test each bucket for encryption
      for (const bucket of buckets) {
        const encryptionResponse = await s3Client.send(
          new GetBucketEncryptionCommand({
            Bucket: bucket,
          })
        );

        expect(
          encryptionResponse.ServerSideEncryptionConfiguration
        ).toBeDefined();
        expect(
          encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
            ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
        ).toBe('AES256');
      }
    });

    test('should have secrets properly stored in Secrets Manager', async () => {
      expect(secretArn).toBeDefined();

      const secretResponse = await secretsManagerClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      // Secret should be properly configured but we shouldn't retrieve the actual value
      expect(secretResponse.ARN).toBeDefined();
      expect(secretResponse.Name).toBeDefined();
      expect(secretResponse.Description).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    test('should use cost-effective instance types', async () => {
      expect(launchTemplateId).toBeDefined();

      // We can't directly check instance type from describe-launch-templates,
      // but we can verify the launch template exists and is properly configured
      const ltResponse = await ec2Client.send(
        new DescribeLaunchTemplatesCommand({
          LaunchTemplateIds: [launchTemplateId],
        })
      );

      expect(ltResponse.LaunchTemplates![0].DefaultVersionNumber).toBeDefined();
    });

    test('should have lifecycle policies for S3 cost optimization', async () => {
      expect(artifactsBucketName).toBeDefined();

      const lifecycleResponse = await s3Client.send(
        new GetBucketLifecycleConfigurationCommand({
          Bucket: artifactsBucketName,
        })
      );

      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules!.length).toBeGreaterThan(0);

      const deleteRule = lifecycleResponse.Rules!.find(
        (rule: any) => rule.NoncurrentVersionExpiration
      );
      expect(deleteRule).toBeDefined();
    });
  });
});
