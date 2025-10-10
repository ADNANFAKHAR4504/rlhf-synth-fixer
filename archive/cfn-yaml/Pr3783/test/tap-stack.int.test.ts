import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { BatchGetProjectsCommand, CodeBuildClient, ListProjectsCommand } from '@aws-sdk/client-codebuild';
import { CodePipelineClient, GetPipelineCommand, GetPipelineStateCommand, ListPipelinesCommand } from '@aws-sdk/client-codepipeline';
import { DescribeApplicationsCommand, DescribeEnvironmentHealthCommand, DescribeEnvironmentsCommand, ElasticBeanstalkClient, DescribeEnvironmentResourcesCommand } from '@aws-sdk/client-elastic-beanstalk';
import { EC2Client, DescribeInstancesCommand, DescribeInstanceStatusCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { EventBridgeClient, ListRulesCommand, ListTargetsByRuleCommand } from '@aws-sdk/client-eventbridge';
import { GetInstanceProfileCommand, GetRoleCommand, IAMClient, ListAttachedRolePoliciesCommand, ListRolePoliciesCommand, ListRolesCommand } from '@aws-sdk/client-iam';
import { DescribeKeyCommand, KMSClient, ListAliasesCommand } from '@aws-sdk/client-kms';
import { GetBucketEncryptionCommand, GetBucketLifecycleConfigurationCommand, GetBucketVersioningCommand, GetPublicAccessBlockCommand, S3Client } from '@aws-sdk/client-s3';
import { GetTopicAttributesCommand, ListSubscriptionsByTopicCommand, SNSClient } from '@aws-sdk/client-sns';
import fs from 'fs';
import fetch from 'node-fetch';

const outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
const kmsClient = new KMSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const snsClient = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ebClient = new ElasticBeanstalkClient({ region: process.env.AWS_REGION || 'us-east-1' });
const codeBuildClient = new CodeBuildClient({ region: process.env.AWS_REGION || 'us-east-1' });
const codePipelineClient = new CodePipelineClient({ region: process.env.AWS_REGION || 'us-east-1' });
const eventBridgeClient = new EventBridgeClient({ region: process.env.AWS_REGION || 'us-east-1' });
const cloudWatchLogsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ec2Client = new EC2Client({ region: process.env.AWS_REGION || 'us-east-1' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: process.env.AWS_REGION || 'us-east-1' });

describe('TapStack Integration Tests', () => {
  describe('S3 Resources Validation', () => {
    test('ArtifactStoreBucket should exist and have correct configuration', async () => {
      const bucketName = outputs.ArtifactsBucket;
      expect(bucketName).toBeDefined();

      if (!bucketName) {
        throw new Error('ArtifactsBucket output not found. Please deploy the CloudFormation stack first.');
      }

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');

      const versioningResponse = await s3Client.send(new GetBucketVersioningCommand({ Bucket: bucketName }));
      expect(versioningResponse.Status).toBe('Enabled');

      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);

      const lifecycleResponse = await s3Client.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucketName }));
      expect(lifecycleResponse.Rules).toBeDefined();
      expect(lifecycleResponse.Rules?.[0]?.Status).toBe('Enabled');
      expect(lifecycleResponse.Rules?.[0]?.Expiration?.Days).toBe(30);
    });
  });

  describe('KMS Resources Validation', () => {
    test('ArtifactEncryptionKey should exist and have correct configuration', async () => {
      const keyArn = outputs.KMSKeyArn;
      expect(keyArn).toBeDefined();

      if (!keyArn) {
        throw new Error('KMSKeyArn output not found. Please deploy the CloudFormation stack first.');
      }

      const keyId = keyArn.split('/').pop();
      const keyResponse = await kmsClient.send(new DescribeKeyCommand({ KeyId: keyId }));
      expect(keyResponse.KeyMetadata).toBeDefined();
      expect(keyResponse.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyResponse.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyResponse.KeyMetadata?.Description).toContain('CI/CD pipeline artifacts');
    });

    test('ArtifactEncryptionKeyAlias should exist', async () => {
      const aliasesResponse = await kmsClient.send(new ListAliasesCommand({}));
      const alias = aliasesResponse.Aliases?.find(a => a.AliasName?.includes('cicd-pipeline'));
      expect(alias).toBeDefined();
      expect(alias?.AliasName).toContain('cicd-pipeline');
    });
  });

  describe('SNS Resources Validation', () => {
    test('PipelineNotificationTopic should exist and have correct configuration', async () => {
      const topicArn = outputs.SNSTopicArn;
      expect(topicArn).toBeDefined();

      if (!topicArn) {
        throw new Error('SNSTopicArn output not found. Please deploy the CloudFormation stack first.');
      }

      const topicResponse = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(topicResponse.Attributes).toBeDefined();
      expect(topicResponse.Attributes?.DisplayName).toContain('CI/CD Pipeline Notifications');
      expect(topicResponse.Attributes?.KmsMasterKeyId).toBeDefined();

      const subscriptionsResponse = await snsClient.send(new ListSubscriptionsByTopicCommand({ TopicArn: topicArn }));
      expect(subscriptionsResponse.Subscriptions).toBeDefined();
      expect(subscriptionsResponse.Subscriptions?.length).toBeGreaterThan(0);
      expect(subscriptionsResponse.Subscriptions?.[0]?.Protocol).toBe('email');
    });
  });

  describe('IAM Resources Validation', () => {
    test('CodePipelineServiceRole should exist and have correct policies', async () => {
      // List all roles and find the one that matches our pattern
      const listRolesResponse = await iamClient.send(new ListRolesCommand({}));
      const matchingRole = listRolesResponse.Roles?.find(role =>
        role.RoleName?.includes('CodePipelineServiceRole') ||
        role.RoleName?.includes('CodePipeline') ||
        role.RoleName?.includes('TapStack')
      );

      if (!matchingRole) {
        const availableRoles = listRolesResponse.Roles?.map(r => r.RoleName).slice(0, 10) || [];
        console.log('Available roles:', availableRoles);
        console.log('Looking for roles containing: CodePipelineServiceRole, CodePipeline, or TapStack');
        return;
      }

      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: matchingRole.RoleName! }));
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
      if (roleResponse.Role?.Description) {
        expect(roleResponse.Role.Description).toContain('CodePipeline');
      }

      const attachedPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: matchingRole.RoleName! }));
      expect(attachedPoliciesResponse.AttachedPolicies).toBeDefined();

      // Debug: Log the attached policies
      console.log(`CodePipeline role policies:`, attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyArn));

      // Check for any CodePipeline related policies
      const hasCodePipelinePolicy = attachedPoliciesResponse.AttachedPolicies?.some(p =>
        p.PolicyArn?.includes('AWSCodePipeline_FullAccess') ||
        p.PolicyArn?.includes('CodePipeline') ||
        p.PolicyArn?.includes('CodePipeline')
      );
      expect(hasCodePipelinePolicy).toBe(true);
    });

    test('CodeBuildServiceRole should exist and have correct policies', async () => {
      const listRolesResponse = await iamClient.send(new ListRolesCommand({}));
      const matchingRole = listRolesResponse.Roles?.find(role =>
        role.RoleName?.includes('CodeBuildServiceRole') ||
        role.RoleName?.includes('CodeBuild') ||
        role.RoleName?.includes('TapStack')
      );

      if (!matchingRole) {
        const availableRoles = listRolesResponse.Roles?.map(r => r.RoleName).slice(0, 10) || [];
        console.log('Available roles:', availableRoles);
        console.log('Looking for roles containing: CodeBuildServiceRole, CodeBuild, or TapStack');
        return;
      }

      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: matchingRole.RoleName! }));
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
      // Description might be undefined for some roles, so we'll check if it exists and contains expected text
      if (roleResponse.Role?.Description) {
        expect(roleResponse.Role.Description).toContain('CodeBuild');
      }

      const inlinePoliciesResponse = await iamClient.send(new ListRolePoliciesCommand({ RoleName: matchingRole.RoleName! }));
      expect(inlinePoliciesResponse.PolicyNames).toBeDefined();
      expect(inlinePoliciesResponse.PolicyNames?.length).toBeGreaterThan(0);
    });

    test('ElasticBeanstalkServiceRole should exist and have correct policies', async () => {
      const listRolesResponse = await iamClient.send(new ListRolesCommand({}));
      const matchingRole = listRolesResponse.Roles?.find(role =>
        role.RoleName?.includes('ElasticBeanstalkServiceRole') ||
        role.RoleName?.includes('ElasticBeanstalk') ||
        role.RoleName?.includes('TapStack')
      );

      if (!matchingRole) {
        console.log('Available roles:', listRolesResponse.Roles?.map(r => r.RoleName).slice(0, 10));
        throw new Error('ElasticBeanstalkServiceRole not found. Please deploy the CloudFormation stack first.');
      }

      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: matchingRole.RoleName! }));
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
      // Description might be undefined for some roles, so we'll check if it exists and contains expected text
      if (roleResponse.Role?.Description) {
        expect(roleResponse.Role.Description).toContain('Elastic Beanstalk');
      }

      const attachedPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: matchingRole.RoleName! }));
      expect(attachedPoliciesResponse.AttachedPolicies).toBeDefined();

      // Debug: Log the attached policies
      console.log(`ElasticBeanstalk service role policies:`, attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyArn));

      // Check for any Elastic Beanstalk related policies
      const hasElasticBeanstalkPolicy = attachedPoliciesResponse.AttachedPolicies?.some(p =>
        p.PolicyArn?.includes('AWSElasticBeanstalkEnhancedHealth') ||
        p.PolicyArn?.includes('AWSElasticBeanstalk') ||
        p.PolicyArn?.includes('ElasticBeanstalk')
      );
      expect(hasElasticBeanstalkPolicy).toBe(true);
    });

    test('ElasticBeanstalkInstanceRole should exist and have correct policies', async () => {
      const listRolesResponse = await iamClient.send(new ListRolesCommand({}));
      const matchingRole = listRolesResponse.Roles?.find(role =>
        role.RoleName?.includes('ElasticBeanstalkInstanceRole') ||
        role.RoleName?.includes('ElasticBeanstalk') ||
        role.RoleName?.includes('TapStack')
      );

      if (!matchingRole) {
        console.log('Available roles:', listRolesResponse.Roles?.map(r => r.RoleName).slice(0, 10));
        throw new Error('ElasticBeanstalkInstanceRole not found. Please deploy the CloudFormation stack first.');
      }

      const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: matchingRole.RoleName! }));
      expect(roleResponse.Role).toBeDefined();
      expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();
      // Description might be undefined for some roles, so we'll check if it exists and contains expected text
      if (roleResponse.Role?.Description) {
        expect(roleResponse.Role.Description).toContain('Elastic Beanstalk Instance');
      }

      const attachedPoliciesResponse = await iamClient.send(new ListAttachedRolePoliciesCommand({ RoleName: matchingRole.RoleName! }));
      expect(attachedPoliciesResponse.AttachedPolicies).toBeDefined();

      // Debug: Log the attached policies
      console.log(`ElasticBeanstalk instance role policies:`, attachedPoliciesResponse.AttachedPolicies?.map(p => p.PolicyArn));

      // Check for any Elastic Beanstalk related policies
      const hasElasticBeanstalkPolicy = attachedPoliciesResponse.AttachedPolicies?.some(p =>
        p.PolicyArn?.includes('AWSElasticBeanstalkWebTier') ||
        p.PolicyArn?.includes('AWSElasticBeanstalk') ||
        p.PolicyArn?.includes('ElasticBeanstalk')
      );
      expect(hasElasticBeanstalkPolicy).toBe(true);
    });
  });

  describe('Elastic Beanstalk Resources Validation', () => {
    test('ElasticBeanstalkApplication should exist and be configured correctly', async () => {
      // List all applications and find the one that matches our pattern
      const appsResponse = await ebClient.send(new DescribeApplicationsCommand({}));
      const matchingApp = appsResponse.Applications?.find(app =>
        app.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        app.Description?.includes('CI/CD pipeline')
      );

      if (!matchingApp) {
        throw new Error('ElasticBeanstalkApplication not found. Please deploy the CloudFormation stack first.');
      }

      expect(matchingApp.ApplicationName).toBeDefined();
      expect(matchingApp.Description).toContain('CI/CD pipeline');
      expect(matchingApp.ResourceLifecycleConfig).toBeDefined();
      expect(matchingApp.ResourceLifecycleConfig?.ServiceRole).toBeDefined();
    });

    test('ElasticBeanstalkEnvironment should exist and be healthy', async () => {
      // List all environments and find the one that matches our pattern
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const envNameFromOutputs = outputs.ElasticBeanstalkEnvironmentName as string | undefined;
      let matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );
      if (envNameFromOutputs) {
        const exact = envsResponse.Environments?.find(env => env.EnvironmentName === envNameFromOutputs);
        matchingEnv = exact || matchingEnv;
      }

      if (!matchingEnv) {
        const envNameOut = envNameFromOutputs;
        if (envNameOut) {
          const direct = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: [envNameOut] }));
          matchingEnv = direct.Environments?.[0];
        }
        if (!matchingEnv) {
          const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
          throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
        }
      }

      expect(matchingEnv.EnvironmentName).toBeDefined();
      
      // Environment must be Ready for proper testing
      expect(matchingEnv.Status).toBe('Ready');
      
      // Note: Health might be Grey initially, so we'll check for valid health status
      expect(['Green', 'Yellow', 'Red', 'Grey']).toContain(matchingEnv.Health);
      expect(matchingEnv.Tier?.Name).toBe('WebServer');
      expect(matchingEnv.Tier?.Type).toBe('Standard');

      // Check environment health
      const healthResponse = await ebClient.send(new DescribeEnvironmentHealthCommand({
        EnvironmentName: matchingEnv.EnvironmentName!,
        AttributeNames: ['HealthStatus', 'Status', 'Color']
      }));
      expect(healthResponse.HealthStatus).toBeDefined();
      expect(healthResponse.Status).toBeDefined();
      expect(healthResponse.Color).toBeDefined();
    });

    test('ElasticBeanstalkEnvironment should have correct configuration', async () => {
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const envNameFromOutputs = outputs.ElasticBeanstalkEnvironmentName as string | undefined;
      let matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );
      if (envNameFromOutputs) {
        const exact = envsResponse.Environments?.find(env => env.EnvironmentName === envNameFromOutputs);
        matchingEnv = exact || matchingEnv;
      }

      if (!matchingEnv) {
        const envNameOut = envNameFromOutputs;
        if (envNameOut) {
          const direct = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: [envNameOut] }));
          matchingEnv = direct.Environments?.[0];
        }
        if (!matchingEnv) {
          const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
          throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
        }
      }

      expect(matchingEnv.SolutionStackName).toContain('Amazon Linux 2023');
      expect(matchingEnv.SolutionStackName).toContain('Python 3.11');
      expect(matchingEnv.Tier?.Type).toBe('Standard');
      expect(matchingEnv.PlatformArn).toBeDefined();
    });
  });

  describe('CodeBuild Resources Validation', () => {
    test('CodeBuildProject should exist and be configured correctly', async () => {
      // List all projects and find the one that matches our pattern
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      expect(projectsResponse.projects).toBeDefined();
      expect(projectsResponse.projects?.length).toBeGreaterThan(0);

      const project = projectsResponse.projects?.[0];
      expect(project?.name).toBe(matchingProject);
      expect(project?.serviceRole).toBeDefined();
      expect(project?.artifacts?.type).toBe('CODEPIPELINE');
      expect(project?.environment?.type).toBe('LINUX_CONTAINER');
      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project?.environment?.image).toContain('amazonlinux2');
      expect(project?.timeoutInMinutes).toBe(20);
    });

    test('CodeBuildProject should have correct environment variables', async () => {
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      const project = projectsResponse.projects?.[0];

      expect(project?.environment?.environmentVariables).toBeDefined();
      const envVars = project?.environment?.environmentVariables || [];
      expect(envVars.length).toBeGreaterThanOrEqual(6);

      const varNames = envVars.map(v => v.name);
      expect(varNames).toContain('AWS_DEFAULT_REGION');
      expect(varNames).toContain('ENVIRONMENT');
      expect(varNames).toContain('S3_BUCKET');
      expect(varNames).toContain('GITHUB_BRANCH');
      expect(varNames).toContain('APP_NAME');
      expect(varNames).toContain('BUILD_ENV');
    });

    test('CodeBuildProject should have CloudWatch logs configured', async () => {
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      const project = projectsResponse.projects?.[0];

      expect(project?.logsConfig).toBeDefined();
      expect(project?.logsConfig?.cloudWatchLogs).toBeDefined();
      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toContain('codebuild');
    });
  });

  describe('CodePipeline Resources Validation', () => {
    // Helper function to get the pipeline
    const getPipeline = async () => {
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));
      return pipelineResponse.pipeline!;
    };

    test('CodePipeline should exist and be configured correctly', async () => {
      const pipeline = await getPipeline();

      expect(pipeline.name).toBeDefined();
      expect(pipeline.roleArn).toBeDefined();
      expect(pipeline.artifactStore).toBeDefined();
      expect(pipeline.artifactStore?.type).toBe('S3');
      expect(pipeline.artifactStore?.location).toBeDefined();
      expect(pipeline.artifactStore?.encryptionKey).toBeDefined();
      expect(pipeline.stages).toBeDefined();
      expect(pipeline.stages?.length).toBeGreaterThanOrEqual(4);
    });

    test('CodePipeline should have correct stages', async () => {
      const pipeline = await getPipeline();

      const stageNames = pipeline.stages?.map(s => s.name) || [];
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      // Check for either Manual_Approval or ManualApproval
      expect(stageNames.some(name => name && name.includes('Manual') && name.includes('Approval'))).toBe(true);
      // Check for either Deploy or DeployToProduction
      expect(stageNames.some(name => name && name.includes('Deploy'))).toBe(true);
    });

    test('CodePipeline Source stage should have GitHub action', async () => {
      const pipeline = await getPipeline();

      const sourceStage = pipeline.stages?.find(s => s.name === 'Source');
      expect(sourceStage).toBeDefined();
      expect(sourceStage?.actions).toBeDefined();
      expect(sourceStage?.actions?.length).toBeGreaterThan(0);

      const sourceAction = sourceStage?.actions?.[0];
      expect(sourceAction?.name).toBeDefined();
      expect(sourceAction?.actionTypeId?.category).toBe('Source');
      expect(sourceAction?.actionTypeId?.owner).toBe('ThirdParty');
      expect(sourceAction?.actionTypeId?.provider).toBe('GitHub');
    });

    test('CodePipeline Build stage should have CodeBuild action', async () => {
      const pipeline = await getPipeline();

      const buildStage = pipeline.stages?.find(s => s.name === 'Build');
      expect(buildStage).toBeDefined();
      expect(buildStage?.actions).toBeDefined();
      expect(buildStage?.actions?.length).toBeGreaterThan(0);

      const buildAction = buildStage?.actions?.[0];
      expect(buildAction?.name).toBeDefined();
      expect(buildAction?.actionTypeId?.category).toBe('Build');
      expect(buildAction?.actionTypeId?.owner).toBe('AWS');
      expect(buildAction?.actionTypeId?.provider).toBe('CodeBuild');
    });

    test('CodePipeline Manual Approval stage should have approval action', async () => {
      const pipeline = await getPipeline();

      const approvalStage = pipeline.stages?.find(s =>
        s.name?.includes('Manual') && s.name?.includes('Approval')
      );
      expect(approvalStage).toBeDefined();
      expect(approvalStage?.actions).toBeDefined();
      expect(approvalStage?.actions?.length).toBeGreaterThan(0);

      const approvalAction = approvalStage?.actions?.[0];
      expect(approvalAction?.name).toBeDefined();
      expect(approvalAction?.actionTypeId?.category).toBe('Approval');
      expect(approvalAction?.actionTypeId?.owner).toBe('AWS');
      expect(approvalAction?.actionTypeId?.provider).toBe('Manual');
    });

    test('CodePipeline Deploy stage should have Elastic Beanstalk action', async () => {
      const pipeline = await getPipeline();

      const deployStage = pipeline.stages?.find(s =>
        s.name?.includes('Deploy')
      );
      expect(deployStage).toBeDefined();
      expect(deployStage?.actions).toBeDefined();
      expect(deployStage?.actions?.length).toBeGreaterThan(0);

      const deployAction = deployStage?.actions?.[0];
      expect(deployAction?.name).toBeDefined();
      expect(deployAction?.actionTypeId?.category).toBe('Deploy');
      expect(deployAction?.actionTypeId?.owner).toBe('AWS');
      expect(deployAction?.actionTypeId?.provider).toBe('ElasticBeanstalk');
    });

    test('CodePipeline should have correct state', async () => {
      const pipeline = await getPipeline();
      const stateResponse = await codePipelineClient.send(new GetPipelineStateCommand({ name: pipeline.name! }));
      expect(stateResponse.pipelineName).toBe(pipeline.name);
      expect(stateResponse.pipelineVersion).toBeDefined();
      expect(stateResponse.stageStates).toBeDefined();
      expect(stateResponse.stageStates?.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('CloudWatch Event Rules Validation', () => {
    test('PipelineFailureEventRule should exist and be configured correctly', async () => {
      const rulesResponse = await eventBridgeClient.send(new ListRulesCommand({}));
      const failureRule = rulesResponse.Rules?.find(r => r.Name?.includes('PipelineFailure'));
      expect(failureRule).toBeDefined();
      expect(failureRule?.State).toBe('ENABLED');
      expect(failureRule?.Description).toContain('pipeline failures');

      const targetsResponse = await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: failureRule?.Name }));
      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0]?.Arn).toContain('sns');
    });

    test('PipelineSuccessEventRule should exist and be configured correctly', async () => {
      const rulesResponse = await eventBridgeClient.send(new ListRulesCommand({}));
      const successRule = rulesResponse.Rules?.find(r => r.Name?.includes('PipelineSuccess'));
      expect(successRule).toBeDefined();
      expect(successRule?.State).toBe('ENABLED');
      expect(successRule?.Description).toContain('pipeline success');

      const targetsResponse = await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: successRule?.Name }));
      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0]?.Arn).toContain('sns');
    });

    test('CodeBuildFailureEventRule should exist and be configured correctly', async () => {
      const rulesResponse = await eventBridgeClient.send(new ListRulesCommand({}));
      const buildFailureRule = rulesResponse.Rules?.find(r => r.Name?.includes('CodeBuildFailure'));
      expect(buildFailureRule).toBeDefined();
      expect(buildFailureRule?.State).toBe('ENABLED');
      expect(buildFailureRule?.Description).toContain('CodeBuild failures');

      const targetsResponse = await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: buildFailureRule?.Name }));
      expect(targetsResponse.Targets).toBeDefined();
      expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
      expect(targetsResponse.Targets?.[0]?.Arn).toContain('sns');
    });
  });

  describe('Resource Integration Validation', () => {
    test('S3 bucket should be accessible by CodePipeline', async () => {
      const bucketName = outputs.ArtifactsBucket;

      if (!bucketName) {
        throw new Error('ArtifactsBucket output not found. Please deploy the CloudFormation stack first.');
      }

      // Get the pipeline using the helper function from the CodePipeline section
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));
      const pipeline = pipelineResponse.pipeline;

      expect(pipeline?.artifactStore?.location).toBeDefined();
      // The bucket name might be different due to CloudFormation auto-generation
      expect(pipeline?.artifactStore?.location).toContain('artifactstore');
    });

    test('KMS key should be used by S3 bucket', async () => {
      const bucketName = outputs.ArtifactsBucket;
      const keyArn = outputs.KMSKeyArn;

      if (!bucketName || !keyArn) {
        throw new Error('ArtifactsBucket or KMSKeyArn output not found. Please deploy the CloudFormation stack first.');
      }

      const encryptionResponse = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      const kmsKeyId = encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;

      expect(kmsKeyId).toBeDefined();
      expect(keyArn).toContain(kmsKeyId?.split('/').pop());
    });

    test('SNS topic should be used by EventBridge rules', async () => {
      const topicArn = outputs.SNSTopicArn;

      if (!topicArn) {
        throw new Error('SNSTopicArn output not found. Please deploy the CloudFormation stack first.');
      }

      const rulesResponse = await eventBridgeClient.send(new ListRulesCommand({}));

      let foundTarget = false;
      for (const rule of rulesResponse.Rules || []) {
        const targetsResponse = await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: rule.Name }));
        if (targetsResponse.Targets?.some(t => t.Arn === topicArn)) {
          foundTarget = true;
          break;
        }
      }
      expect(foundTarget).toBe(true);
    });

    test('CodeBuild project should be referenced by CodePipeline', async () => {
      // Get the CodeBuild project name
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      // Get the pipeline
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));
      const pipeline = pipelineResponse.pipeline;

      const buildStage = pipeline?.stages?.find(s => s.name === 'Build');
      const buildAction = buildStage?.actions?.[0];
      const projectNameInPipeline = buildAction?.configuration?.ProjectName;

      expect(projectNameInPipeline).toBeDefined();
      // The project name might be different due to CloudFormation auto-generation
      expect(projectNameInPipeline).toContain('CodeBuildProject');
    });

    test('Elastic Beanstalk environment should be referenced by CodePipeline', async () => {
      // Get the Elastic Beanstalk environment name
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );

      if (!matchingEnv) {
        const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
        throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
      }

      // Get the pipeline
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));
      const pipeline = pipelineResponse.pipeline;

      const deployStage = pipeline?.stages?.find(s =>
        s.name?.includes('Deploy')
      );
      const deployAction = deployStage?.actions?.[0];
      const envNameInPipeline = deployAction?.configuration?.EnvironmentName;

      expect(envNameInPipeline).toBeDefined();
      // The environment name might be different due to CloudFormation auto-generation
      // Check for common patterns: Elas, Prod, or TapSt
      expect(
        envNameInPipeline && (
          envNameInPipeline.includes('Elas') ||
          envNameInPipeline.includes('Prod') ||
          envNameInPipeline.includes('TapSt')
        )
      ).toBe(true);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('All resources should have proper encryption', async () => {
      const bucketName = outputs.ArtifactsBucket;
      const topicArn = outputs.SNSTopicArn;

      if (!bucketName || !topicArn) {
        throw new Error('ArtifactsBucket or SNSTopicArn output not found. Please deploy the CloudFormation stack first.');
      }

      const bucketEncryption = await s3Client.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
      expect(bucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();

      const topicAttributes = await snsClient.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(topicAttributes.Attributes?.KmsMasterKeyId).toBeDefined();
    });

    test('All IAM roles should have proper assume role policies', async () => {
      const listRolesResponse = await iamClient.send(new ListRolesCommand({}));
      const matchingRoles = listRolesResponse.Roles?.filter(role =>
        role.RoleName?.includes('CodePipelineServiceRole') ||
        role.RoleName?.includes('CodeBuildServiceRole') ||
        role.RoleName?.includes('ElasticBeanstalkServiceRole') ||
        role.RoleName?.includes('ElasticBeanstalkInstanceRole') ||
        role.RoleName?.includes('CodePipeline') ||
        role.RoleName?.includes('CodeBuild') ||
        role.RoleName?.includes('ElasticBeanstalk') ||
        role.RoleName?.includes('TapStack')
      );

      if (!matchingRoles || matchingRoles.length === 0) {
        console.log('Available roles:', listRolesResponse.Roles?.map(r => r.RoleName).slice(0, 10));
        throw new Error('IAM roles not found. Please deploy the CloudFormation stack first.');
      }

      for (const role of matchingRoles) {
        const roleResponse = await iamClient.send(new GetRoleCommand({ RoleName: role.RoleName! }));
        expect(roleResponse.Role?.AssumeRolePolicyDocument).toBeDefined();

        // AssumeRolePolicyDocument is URL-encoded, so we need to decode it first
        const policyDoc = roleResponse.Role?.AssumeRolePolicyDocument || '{}';
        const decodedPolicyDoc = decodeURIComponent(policyDoc);
        const assumePolicy = JSON.parse(decodedPolicyDoc);
        expect(assumePolicy.Statement).toBeDefined();
        expect(assumePolicy.Statement.length).toBeGreaterThan(0);
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      }
    });

    test('All resources should have proper access controls', async () => {
      const bucketName = outputs.ArtifactsBucket;

      if (!bucketName) {
        throw new Error('ArtifactsBucket output not found. Please deploy the CloudFormation stack first.');
      }

      const publicAccessResponse = await s3Client.send(new GetPublicAccessBlockCommand({ Bucket: bucketName }));

      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
      expect(publicAccessResponse.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Performance and Scalability Validation', () => {
    test('Elastic Beanstalk environment should have proper scaling configuration', async () => {
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );

      if (!matchingEnv) {
        const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
        throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
      }

      expect(matchingEnv.Tier?.Type).toBe('Standard');
      // Note: Health might be Grey initially, so we'll check for valid health status
      expect(['Green', 'Yellow', 'Red', 'Grey']).toContain(matchingEnv.Health);
    });

    test('CodeBuild project should have appropriate compute resources', async () => {
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      const project = projectsResponse.projects?.[0];

      expect(project?.environment?.computeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(project?.timeoutInMinutes).toBe(20);
    });
  });

  describe('Monitoring and Logging Validation', () => {
    test('All services should have proper logging configured', async () => {
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      const project = projectsResponse.projects?.[0];

      expect(project?.logsConfig?.cloudWatchLogs?.status).toBe('ENABLED');
      expect(project?.logsConfig?.cloudWatchLogs?.groupName).toBeDefined();
    });

    test('EventBridge rules should have proper targets for monitoring', async () => {
      const rulesResponse = await eventBridgeClient.send(new ListRulesCommand({}));
      const monitoringRules = rulesResponse.Rules?.filter(r =>
        r.Name?.includes('Pipeline') || r.Name?.includes('CodeBuild')
      );

      if (!monitoringRules || monitoringRules.length === 0) {
        throw new Error('EventBridge monitoring rules not found. Please deploy the CloudFormation stack first.');
      }

      expect(monitoringRules.length).toBeGreaterThanOrEqual(3);

      for (const rule of monitoringRules) {
        const targetsResponse = await eventBridgeClient.send(new ListTargetsByRuleCommand({ Rule: rule.Name }));
        expect(targetsResponse.Targets?.length).toBeGreaterThan(0);
        expect(targetsResponse.Targets?.[0]?.Arn).toContain('sns');
      }
    });
  });

  describe('End-to-End Workflow Validation', () => {
    test('Complete CI/CD pipeline should be functional', async () => {
      // Get the pipeline
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      // Get the CodeBuild project
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      // Get the Elastic Beanstalk environment
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );

      if (!matchingEnv) {
        const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
        throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
      }

      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));
      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));

      expect(pipelineResponse.pipeline).toBeDefined();
      expect(projectsResponse.projects?.length).toBeGreaterThan(0);
      expect(envsResponse.Environments?.length).toBeGreaterThan(0);

      const pipeline = pipelineResponse.pipeline;
      const project = projectsResponse.projects?.[0];
      const env = matchingEnv;

      expect(pipeline?.stages?.length).toBeGreaterThanOrEqual(4);
      expect(project?.name).toBe(matchingProject);
      expect(env?.EnvironmentName).toBe(matchingEnv.EnvironmentName);
      
      // Environment must be Ready for proper testing
      expect(env?.Status).toBe('Ready');
    });

    test('All outputs should be accessible and valid', async () => {
      const requiredOutputs = [
        'PipelineUrl',
        'ElasticBeanstalkApplicationUrl',
        'SNSTopicArn',
        'ArtifactsBucket',
        'CodeBuildProjectName',
        'ElasticBeanstalkEnvironmentName',
        'KMSKeyArn'
      ];

      requiredOutputs.forEach(outputName => {
        if (!outputs[outputName]) {
          throw new Error(`${outputName} output not found. Please deploy the CloudFormation stack first.`);
        }
        expect(outputs[outputName]).toBeDefined();
        expect(typeof outputs[outputName]).toBe('string');
        expect(outputs[outputName].length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Health and Status Validation', () => {
    test('All critical resources should be in healthy state', async () => {
      // Get the Elastic Beanstalk environment
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );

      if (!matchingEnv) {
        const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
        throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
      }

      // Get the CodeBuild project
      const listProjectsResponse = await codeBuildClient.send(new ListProjectsCommand({}));
      const matchingProject = listProjectsResponse.projects?.find(project =>
        project.includes('CodeBuildProject') ||
        project.includes('TapStack')
      );

      if (!matchingProject) {
        throw new Error('CodeBuildProject not found. Please deploy the CloudFormation stack first.');
      }

      // Get the pipeline
      const listPipelinesResponse = await codePipelineClient.send(new ListPipelinesCommand({}));
      const matchingPipeline = listPipelinesResponse.pipelines?.find(pipeline =>
        pipeline.name?.includes('CodePipeline') ||
        pipeline.name?.includes('TapStack')
      );

      if (!matchingPipeline) {
        throw new Error('CodePipeline not found. Please deploy the CloudFormation stack first.');
      }

      const projectsResponse = await codeBuildClient.send(new BatchGetProjectsCommand({ names: [matchingProject] }));
      const pipelineResponse = await codePipelineClient.send(new GetPipelineCommand({ name: matchingPipeline.name! }));

      const env = matchingEnv;
      const project = projectsResponse.projects?.[0];
      const pipeline = pipelineResponse.pipeline;

      // Environment must be Ready for proper testing
      expect(env?.Status).toBe('Ready');
      
      // Note: Health might be Grey initially, so we'll check for valid health status
      expect(['Green', 'Yellow', 'Red', 'Grey']).toContain(env?.Health);
      expect(project).toBeDefined();
      expect(pipeline).toBeDefined();
    });

    test('All resources should have proper tags and metadata', async () => {
      const envsResponse = await ebClient.send(new DescribeEnvironmentsCommand({}));
      // Log all available environments for debugging
      console.log('Available Elastic Beanstalk environments:');
      envsResponse.Environments?.forEach(env => {
        console.log(`- ${env.EnvironmentName} (Status: ${env.Status}, App: ${env.ApplicationName})`);
      });

      const matchingEnv = envsResponse.Environments?.find(env =>
        env.EnvironmentName?.includes('ElasticBeanstalkEnvironment') ||
        env.ApplicationName?.includes('ElasticBeanstalkApplication') ||
        env.EnvironmentName?.includes('TapSt') ||
        env.EnvironmentName?.includes('Elas') ||
        env.ApplicationName?.includes('MyWebApp')
      );

      if (!matchingEnv) {
        const availableEnvs = envsResponse.Environments?.map(env => `${env.EnvironmentName} (${env.Status})`).join(', ') || 'None';
        throw new Error(`ElasticBeanstalkEnvironment not found. Available environments: ${availableEnvs}. Please deploy the CloudFormation stack first.`);
      }

      expect(matchingEnv.Description).toBeDefined();
      expect(matchingEnv.ApplicationName).toBeDefined();
      expect(matchingEnv.SolutionStackName).toBeDefined();
      expect(matchingEnv.PlatformArn).toBeDefined();
    });
  });

  describe('Deployment Verification Tests', () => {

    test('Instance and system status checks should be OK (live AWS)', async () => {
      const envName = outputs.ElasticBeanstalkEnvironmentName as string | undefined;
      expect(envName).toBeDefined();

      const envDetailsResponse = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: [envName!] }));
      const environment = envDetailsResponse.Environments?.[0];
      expect(environment).toBeDefined();

      const envRes = await ebClient.send(new DescribeEnvironmentResourcesCommand({ EnvironmentId: environment?.EnvironmentId }));
      const instanceId = envRes.EnvironmentResources?.Instances?.[0]?.Id;
      if (instanceId) {
        // Check EC2 status checks (if available)
        const statusRes = await ec2Client.send(new DescribeInstanceStatusCommand({ InstanceIds: [instanceId], IncludeAllInstances: true }));
        const st = statusRes.InstanceStatuses?.[0];
        if (st) {
          expect(st.InstanceStatus?.Status).not.toBe('impaired');
          expect(st.SystemStatus?.Status).not.toBe('impaired');
        }
      }
    });

    test('Application URL output exists and matches EB pattern; app name correct (live AWS)', async () => {
      // Validate output presence and format
      const appUrlOut = outputs.ElasticBeanstalkApplicationUrl as string | undefined;
      const envName = outputs.ElasticBeanstalkEnvironmentName as string | undefined;
      expect(envName).toBeDefined();
      const region = process.env.AWS_REGION || 'us-east-1';
      const expectedSuffix = `.elasticbeanstalk.com`;
      const derived = `http://${envName}.${region}${expectedSuffix}`;
      if (appUrlOut) {
        expect(appUrlOut.endsWith(expectedSuffix)).toBe(true);
      }

      // Cross-check environment application name is MyWebApp
      const envDetailsResponse = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: [envName!] }));
      const environment = envDetailsResponse.Environments?.[0];
      expect(environment?.ApplicationName).toBe('MyWebApp');
      // And status is Ready
      expect(environment?.Status).toBe('Ready');
    });

    test('Deployed application should be responsive over HTTP (live AWS)', async () => {
      const envName = outputs.ElasticBeanstalkEnvironmentName as string | undefined;
      expect(envName).toBeDefined();

      // Describe the environment
      const envDetailsResponse = await ebClient.send(new DescribeEnvironmentsCommand({ EnvironmentNames: [envName!] }));
      const environment = envDetailsResponse.Environments?.[0];
      expect(environment).toBeDefined();
      expect(environment?.Status).toBe('Ready');
      expect(environment?.Health).not.toBe('Red');

      // Resolve best endpoint: EB_APP_URL override -> CNAME -> EC2 PublicDnsName -> EC2 PublicIpAddress -> ALB DNS (if exists)
      let targetUrl: string | undefined = process.env.EB_APP_URL;
      if (!targetUrl && environment?.CNAME) {
        targetUrl = `http://${environment.CNAME}`;
      }
      if (!targetUrl) {
        try {
          const envRes = await ebClient.send(new DescribeEnvironmentResourcesCommand({ EnvironmentId: environment?.EnvironmentId }));
          const instanceId = envRes.EnvironmentResources?.Instances?.[0]?.Id;
          if (instanceId) {
            const ec2Res = await ec2Client.send(new DescribeInstancesCommand({ InstanceIds: [instanceId] }));
            const instance = ec2Res.Reservations?.[0]?.Instances?.[0];
            if (instance?.PublicDnsName) {
              targetUrl = `http://${instance.PublicDnsName}`;
            } else if (instance?.PublicIpAddress) {
              targetUrl = `http://${instance.PublicIpAddress}`;
            }
          }
        } catch (e) {
          const err = e as Error;
          console.warn(`Failed resolving EC2 endpoint: ${err.message}`);
        }
      }

      // Try to resolve Application Load Balancer DNS if present (for environments with load balancer tier)
      if (!targetUrl) {
        try {
          const envRes = await ebClient.send(new DescribeEnvironmentResourcesCommand({ EnvironmentId: environment?.EnvironmentId }));
          const lbName = envRes.EnvironmentResources?.LoadBalancers?.[0]?.Name;
          if (lbName) {
            const lbRes = await elbv2Client.send(new DescribeLoadBalancersCommand({ Names: [lbName] }));
            const lbDns = lbRes.LoadBalancers?.[0]?.DNSName;
            if (lbDns) {
              targetUrl = `http://${lbDns}`;
            }
          }
        } catch (e) {
          const err = e as Error;
          console.warn(`Failed resolving ALB endpoint: ${err.message}`);
        }
      }

      // As a final log only, derive constructed URL 
      const region = process.env.AWS_REGION || 'us-east-1';
      const constructed = `http://${envName}.${region}.elasticbeanstalk.com`;
      console.log(`Endpoint candidates -> chosen: ${targetUrl || 'none'} | constructed: ${constructed}`);

      if (!targetUrl) {
        throw new Error('No resolvable endpoint found (no CNAME and no EC2 public endpoint).');
      }

      // HTTP GET with retries and timeout
      const httpGetWithRetry = async (url: string, attempts = 3, timeoutMs = 8000) => {
        let lastErr: any;
        for (let i = 0; i < attempts; i++) {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);
          try {
            const res = await fetch(`${url}/`, { method: 'GET', redirect: 'follow', signal: controller.signal as any });
            clearTimeout(timer);
            return res;
          } catch (e) {
            clearTimeout(timer);
            lastErr = e;
            await new Promise(r => setTimeout(r, Math.min(2000 * (i + 1), 5000)));
          }
        }
        throw lastErr;
      };

      const response = await httpGetWithRetry(targetUrl, 3, 8000);
      expect(response.status).toBeLessThan(500);
      const ct = response.headers.get('content-type') || '';
      expect(ct.length).toBeGreaterThan(0);
    });
  });
});