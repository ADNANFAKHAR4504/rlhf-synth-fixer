import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
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
  DescribeRuleCommand,
  EventBridgeClient,
} from '@aws-sdk/client-eventbridge';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  GetRolePolicyCommand,
  IAMClient,
} from '@aws-sdk/client-iam';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLocationCommand,
  GetBucketVersioningCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const stackName = process.env.STACK_NAME || 'TapStack';
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);
const cloudformation = new CloudFormationClient({ region });
const codepipeline = new CodePipelineClient({ region });
const codebuild = new CodeBuildClient({ region });
const codedeploy = new CodeDeployClient({ region });
const s3 = new S3Client({ region });
const sns = new SNSClient({ region });
const iam = new IAMClient({ region });
const events = new EventBridgeClient({ region });

describe('TapStack CI/CD Pipeline Integration Tests', () => {
  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      const required = [
        'PipelineName',
        'ArtifactsBucket',
        'NotificationsTopic',
        'CodeDeployApplication',
        'Ec2InstanceProfile',
      ];
      required.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(outputs[key]).not.toBe('');
      });
    });
  });

  describe('S3 Artifacts Bucket', () => {
    test('should have artifacts bucket with correct configuration', async () => {
      const bucketName = outputs.ArtifactsBucket;

      // Check bucket exists
      await expect(
        s3.send(new HeadBucketCommand({ Bucket: bucketName }))
      ).resolves.not.toThrow();

      // Check bucket is in correct region
      const locationRes = await s3.send(
        new GetBucketLocationCommand({ Bucket: bucketName })
      );
      expect([null, '', region]).toContain(locationRes.LocationConstraint);

      // Check bucket encryption
      const encryptionRes = await s3.send(
        new GetBucketEncryptionCommand({ Bucket: bucketName })
      );
      expect(
        encryptionRes.ServerSideEncryptionConfiguration?.Rules
      ).toBeDefined();
      expect(
        encryptionRes.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('AES256');

      // Check versioning is enabled
      const versioningRes = await s3.send(
        new GetBucketVersioningCommand({ Bucket: bucketName })
      );
      expect(versioningRes.Status).toBe('Enabled');

      // Check lifecycle configuration exists
      await expect(
        s3.send(
          new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName })
        )
      ).resolves.not.toThrow();
    });

    test('should have expected bucket name format', () => {
      const bucketName = outputs.ArtifactsBucket;
      expect(bucketName).toMatch(/^prod-cicd-artifacts-\d+-[a-z0-9-]+$/);
    });
  });

  describe('SNS Notifications Topic', () => {
    test('should have SNS topic with correct configuration', async () => {
      const topicArn = outputs.NotificationsTopic;

      const response = await sns.send(
        new GetTopicAttributesCommand({ TopicArn: topicArn })
      );

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.DisplayName).toBe(
        'Production CI/CD Pipeline Notifications'
      );
    });
  });

  describe('CodePipeline', () => {
    test('should have pipeline with correct configuration', async () => {
      const pipelineName = outputs.PipelineName;

      const response = await codepipeline.send(
        new GetPipelineCommand({ name: pipelineName })
      );

      expect(response.pipeline?.name).toBe(pipelineName);
      expect(response.pipeline?.stages).toHaveLength(4); // Source, Build, ManualApproval, Deploy

      const stageNames = response.pipeline?.stages?.map(stage => stage.name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('ManualApproval');
      expect(stageNames).toContain('Deploy');
    });

    test('should have pipeline in valid state', async () => {
      const pipelineName = outputs.PipelineName;

      const response = await codepipeline.send(
        new GetPipelineStateCommand({ name: pipelineName })
      );

      expect(response.pipelineName).toBe(pipelineName);
      expect(response.stageStates).toBeDefined();
      expect(response.stageStates?.length).toBeGreaterThan(0);
    });
  });

  describe('CodeBuild Project', () => {
    test('should have build project with correct configuration', async () => {
      const response = await codebuild.send(
        new BatchGetProjectsCommand({ names: ['prod-build-project'] })
      );

      const project = response.projects?.[0];
      expect(project).toBeDefined();
      expect(project?.name).toBe('prod-build-project');
      expect(project?.description).toBe(
        'Production build project for CI/CD pipeline'
      );
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project?.timeoutInMinutes).toBe(15);
      expect(project?.artifacts?.type).toBe('CODEPIPELINE');
      expect(project?.source?.type).toBe('CODEPIPELINE');
    });
  });

  describe('CodeDeploy Application', () => {
    test('should have deployment application with correct configuration', async () => {
      const applicationName = outputs.CodeDeployApplication;

      const response = await codedeploy.send(
        new GetApplicationCommand({ applicationName })
      );

      expect(response.application?.applicationName).toBe(applicationName);
      expect(response.application?.computePlatform).toBe('Server');
    });

    test('should have deployment group with correct configuration', async () => {
      const applicationName = outputs.CodeDeployApplication;

      const response = await codedeploy.send(
        new GetDeploymentGroupCommand({
          applicationName,
          deploymentGroupName: 'prod-deployment-group',
        })
      );

      expect(response.deploymentGroupInfo?.deploymentGroupName).toBe(
        'prod-deployment-group'
      );
      expect(response.deploymentGroupInfo?.deploymentConfigName).toBe(
        'CodeDeployDefault.AllAtOnce'
      );
      expect(
        response.deploymentGroupInfo?.autoRollbackConfiguration?.enabled
      ).toBe(true);

      const tagFilters = response.deploymentGroupInfo?.ec2TagFilters;
      expect(tagFilters).toBeDefined();
      expect(
        tagFilters?.some(
          filter =>
            filter.Key === 'Environment' && filter.Value === 'Production'
        )
      ).toBe(true);
      expect(
        tagFilters?.some(
          filter =>
            filter.Key === 'Application' && filter.Value === 'prod-cicd-target'
        )
      ).toBe(true);
    });
  });

  describe('IAM Roles', () => {
    test('should have CodePipeline service role with correct policies', async () => {
      const response = await iam.send(
        new GetRoleCommand({ RoleName: 'prod-codepipeline-service-role' })
      );

      expect(response.Role?.RoleName).toBe('prod-codepipeline-service-role');
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'codepipeline.amazonaws.com'
      );

      // Check inline policy exists
      const policyResponse = await iam.send(
        new GetRolePolicyCommand({
          RoleName: 'prod-codepipeline-service-role',
          PolicyName: 'ProdCodePipelineServicePolicy',
        })
      );
      expect(policyResponse.PolicyDocument).toBeDefined();
    });

    test('should have CodeBuild service role with correct policies', async () => {
      const response = await iam.send(
        new GetRoleCommand({ RoleName: 'prod-codebuild-service-role' })
      );

      expect(response.Role?.RoleName).toBe('prod-codebuild-service-role');
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'codebuild.amazonaws.com'
      );
    });

    test('should have CodeDeploy service role with correct policies', async () => {
      const response = await iam.send(
        new GetRoleCommand({ RoleName: 'prod-codedeploy-service-role' })
      );

      expect(response.Role?.RoleName).toBe('prod-codedeploy-service-role');
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'codedeploy.amazonaws.com'
      );
    });

    test('should have EC2 instance role for CodeDeploy', async () => {
      const response = await iam.send(
        new GetRoleCommand({ RoleName: 'prod-ec2-codedeploy-role' })
      );

      expect(response.Role?.RoleName).toBe('prod-ec2-codedeploy-role');
      expect(response.Role?.AssumeRolePolicyDocument).toContain(
        'ec2.amazonaws.com'
      );
    });
  });

  describe('EC2 Instance Profile', () => {
    test('should have instance profile for EC2 targets', async () => {
      const instanceProfileArn = outputs.Ec2InstanceProfile;
      const profileName = instanceProfileArn.split('/').pop();

      const response = await iam.send(
        new GetInstanceProfileCommand({ InstanceProfileName: profileName! })
      );

      expect(response.InstanceProfile?.InstanceProfileName).toBe(
        'prod-ec2-codedeploy-profile'
      );
      expect(response.InstanceProfile?.Roles).toHaveLength(1);
      expect(response.InstanceProfile?.Roles?.[0].RoleName).toBe(
        'prod-ec2-codedeploy-role'
      );
    });
  });

  describe('CloudWatch Event Rules', () => {
    test('should have pipeline state change event rule', async () => {
      const response = await events.send(
        new DescribeRuleCommand({ Name: 'prod-pipeline-state-change' })
      );

      expect(response.Name).toBe('prod-pipeline-state-change');
      expect(response.State).toBe('ENABLED');
      expect(response.Description).toBe(
        'Capture pipeline state changes for notifications'
      );

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codepipeline');
      expect(eventPattern['detail-type']).toContain(
        'CodePipeline Pipeline Execution State Change'
      );
    });

    test('should have CodeBuild state change event rule', async () => {
      const response = await events.send(
        new DescribeRuleCommand({ Name: 'prod-codebuild-state-change' })
      );

      expect(response.Name).toBe('prod-codebuild-state-change');
      expect(response.State).toBe('ENABLED');
      expect(response.Description).toBe(
        'Capture CodeBuild state changes for notifications'
      );

      const eventPattern = JSON.parse(response.EventPattern || '{}');
      expect(eventPattern.source).toContain('aws.codebuild');
      expect(eventPattern['detail-type']).toContain(
        'CodeBuild Build State Change'
      );
    });
  });
});
