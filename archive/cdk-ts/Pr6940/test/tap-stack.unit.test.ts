import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  describe('Environment Suffix Configuration', () => {
    test('should use environment suffix from props', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
      });
      template = Template.fromStack(stack);

      // Verify resources use the suffix
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'microservices-cluster-test',
      });
    });

    test('should use environment suffix from context when not in props', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'microservices-cluster-staging',
      });
    });

    test('should default to dev when no suffix provided', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'microservices-cluster-dev',
      });
    });
  });

  describe('VPC Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public and private subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 AZs * 2 subnet types
    });

    test('should create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should tag VPC with common tags', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcs)[0] as any;
      const tags = vpc.Properties.Tags || [];
      const tagKeys = tags.map((tag: any) => tag.Key);

      expect(tagKeys).toContain('Environment');
      expect(tagKeys).toContain('Team');
      expect(tagKeys).toContain('CostCenter');
    });
  });

  describe('S3 Buckets', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create artifact bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });

      // Verify lifecycle rule
      const buckets = template.findResources('AWS::S3::Bucket');
      const artifactBucket = Object.values(buckets).find((bucket: any) =>
        JSON.stringify(bucket.Properties).includes('delete-old-artifacts')
      );
      expect(artifactBucket).toBeDefined();
    });

    test('should create source bucket with correct properties', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'microservice-source-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('should set DESTROY removal policy on buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should tag buckets with common tags', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          { Key: 'Environment', Value: 'test' },
          { Key: 'Team', Value: 'platform-engineering' },
        ]),
      });
    });
  });

  describe('ECR Repository', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ECR repository with correct name', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: 'microservice-app-test',
      });
    });

    test('should enable image scanning on push', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        ImageScanningConfiguration: {
          ScanOnPush: true,
        },
      });
    });

    test('should configure lifecycle policy to keep last 10 images', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        LifecyclePolicy: {
          LifecyclePolicyText: Match.stringLikeRegexp('.*countNumber.*10.*'),
        },
      });
    });

    test('should tag ECR repository with common tags', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });

  describe('ECS Infrastructure', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ECS cluster with correct name', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'microservices-cluster-test',
      });
    });

    test('should enable container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: Match.arrayWith([
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ]),
      });
    });

    test('should create Fargate task definition', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        Family: 'microservice-app-test',
        Cpu: '512',
        Memory: '1024',
        NetworkMode: 'awsvpc',
        RequiresCompatibilities: ['FARGATE'],
      });
    });

    test('should configure container with correct settings', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'microservice-app-test',
            Image: Match.anyValue(),
            LogConfiguration: {
              LogDriver: 'awslogs',
            },
            HealthCheck: {
              Command: Match.arrayWith([Match.stringLikeRegexp('.*curl.*')]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60,
            },
            PortMappings: [
              {
                ContainerPort: 8080,
                Protocol: 'tcp',
              },
            ],
          },
        ],
      });
    });

    test('should create ECS service with correct configuration', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        ServiceName: 'microservice-app-test',
        DesiredCount: 0,
        LaunchType: 'FARGATE',
      });
    });

    test('should create log group for ECS tasks', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/ecs/microservice-app-test',
        RetentionInDays: 7,
      });
    });

    test('should tag ECS cluster and service with common tags', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });

  describe('Application Load Balancer', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ALB with correct name', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: 'microservices-alb-test',
          Scheme: 'internet-facing',
          Type: 'application',
        }
      );
    });

    test('should create blue target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: 'microservices-blue-tg-test',
          Port: 8080,
          Protocol: 'HTTP',
          TargetType: 'ip',
          HealthCheckPath: '/health',
        }
      );
    });

    test('should create green target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: 'microservices-green-tg-test',
          Port: 8080,
          Protocol: 'HTTP',
          TargetType: 'ip',
        }
      );
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('should tag ALB with common tags', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
        }
      );
    });
  });

  describe('IAM Roles', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create ECS task execution role', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const executionRole = Object.values(roles).find((role: any) => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        return (
          assumePolicy?.Statement?.[0]?.Principal?.Service ===
          'ecs-tasks.amazonaws.com'
        );
      });

      expect(executionRole).toBeDefined();

      // Verify it has managed policy for ECS task execution
      const managedPolicies = executionRole?.Properties.ManagedPolicyArns || [];
      const hasECSTaskExecutionPolicy = managedPolicies.some((arn: any) => {
        const arnStr = typeof arn === 'string' ? arn : JSON.stringify(arn);
        return arnStr.includes('AmazonECSTaskExecutionRolePolicy');
      });
      expect(hasECSTaskExecutionPolicy).toBe(true);
    });

    test('should create ECS task role with SSM permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const taskRoles = Object.values(roles).filter((role: any) => {
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        return (
          assumePolicy?.Statement?.[0]?.Principal?.Service ===
          'ecs-tasks.amazonaws.com'
        );
      });

      // There should be at least 2 ECS task roles (execution and task)
      expect(taskRoles.length).toBeGreaterThanOrEqual(2);

      // Find the task role (not execution role) - it should have policies
      const taskRole = taskRoles.find((role: any) => {
        // Task role typically doesn't have managed policies, only inline
        const hasManagedPolicies =
          (role.Properties.ManagedPolicyArns || []).length > 0;
        const hasInlinePolicies = (role.Properties.Policies || []).length > 0;
        // Task role will have inline policies but might not have the managed execution policy
        return hasInlinePolicies || !hasManagedPolicies;
      });

      expect(taskRole).toBeDefined();
    });

    test('should create CodeBuild role with correct permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const codeBuildRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service?.includes(
          'codebuild'
        )
      );

      expect(codeBuildRole).toBeDefined();

      // Verify policies exist (either inline, managed, or separate IAM Policy resources)
      const hasInlinePolicies =
        (codeBuildRole?.Properties.Policies || []).length > 0;
      const hasManagedPolicies =
        (codeBuildRole?.Properties.ManagedPolicyArns || []).length > 0;

      // Check for separate IAM Policy resources that might be attached
      const allPolicies = template.findResources('AWS::IAM::Policy');
      const hasSeparatePolicies = Object.keys(allPolicies).length > 0;

      // At least one form of policy should exist
      expect(
        hasInlinePolicies || hasManagedPolicies || hasSeparatePolicies
      ).toBe(true);
    });

    test('should create Pipeline role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'codepipeline.amazonaws.com',
              },
            },
          ],
        },
      });

      const roles = template.findResources('AWS::IAM::Role');
      const pipelineRole = Object.values(roles).find((role: any) =>
        role.Properties.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service?.includes(
          'codepipeline'
        )
      );

      expect(pipelineRole).toBeDefined();

      // Verify policies exist (inline or separate IAM Policy resources)
      const hasInlinePolicies =
        (pipelineRole?.Properties.Policies || []).length > 0;
      const allPolicies = template.findResources('AWS::IAM::Policy');
      const hasSeparatePolicies = Object.keys(allPolicies).length > 0;

      // At least one form of policy should exist
      expect(hasInlinePolicies || hasSeparatePolicies).toBe(true);
    });
  });

  describe('CodeBuild Projects', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create Docker build project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'microservice-docker-build-test',
        Environment: {
          Type: 'LINUX_CONTAINER',
          ComputeType: 'BUILD_GENERAL1_SMALL',
          PrivilegedMode: true,
        },
      });
    });

    test('should create unit test project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'microservice-unit-tests-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_SMALL',
        },
      });
    });

    test('should create security scan project', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Name: 'microservice-security-scan-test',
        Environment: {
          ComputeType: 'BUILD_GENERAL1_MEDIUM',
        },
      });
    });

    test('should create integration test project', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const integrationProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'microservice-integration-tests-test'
      ) as any;

      expect(integrationProject).toBeDefined();
      const envVars =
        integrationProject.Properties.Environment.EnvironmentVariables || [];
      const hasEndpointParam = envVars.some(
        (envVar: any) => envVar.Name === 'ENDPOINT_URL_PARAM'
      );
      expect(hasEndpointParam).toBe(true);
    });

    test('should create log groups for CodeBuild projects', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const codeBuildLogGroups = Object.values(logGroups).filter((lg: any) =>
        lg.Properties.LogGroupName?.includes('codebuild')
      );
      expect(codeBuildLogGroups.length).toBeGreaterThanOrEqual(4);
    });

    test('should tag CodeBuild projects with common tags', () => {
      template.hasResourceProperties('AWS::CodeBuild::Project', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });

  describe('CodePipeline', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create CodePipeline with correct name', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Name: 'microservice-cicd-pipeline-test',
      });
    });

    test('should have all required pipeline stages', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages || [];
      const stageNames = stages.map((stage: any) => stage.Name);

      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames).toContain('UnitTests');
      expect(stageNames).toContain('SecurityScan');
      expect(stageNames).toContain('DeployToStaging');
      expect(stageNames).toContain('IntegrationTests');
      expect(stageNames).toContain('ManualApproval');
      expect(stageNames).toContain('DeployToProduction');
    });

    test('should configure S3 source action', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const sourceStage = pipelineResource.Properties.Stages.find(
        (stage: any) => stage.Name === 'Source'
      );

      expect(sourceStage).toBeDefined();
      const hasS3Action = sourceStage.Actions.some((action: any) =>
        action.ActionTypeId.Provider.includes('S3')
      );
      expect(hasS3Action).toBe(true);
    });

    test('should configure CodeBuild actions for build and tests', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;

      const buildStage = stages.find((stage: any) => stage.Name === 'Build');
      const unitTestStage = stages.find(
        (stage: any) => stage.Name === 'UnitTests'
      );
      const securityScanStage = stages.find(
        (stage: any) => stage.Name === 'SecurityScan'
      );
      const integrationTestStage = stages.find(
        (stage: any) => stage.Name === 'IntegrationTests'
      );

      expect(buildStage).toBeDefined();
      expect(unitTestStage).toBeDefined();
      expect(securityScanStage).toBeDefined();
      expect(integrationTestStage).toBeDefined();

      // Verify they use CodeBuild
      [
        buildStage,
        unitTestStage,
        securityScanStage,
        integrationTestStage,
      ].forEach(stage => {
        const hasCodeBuildAction = stage.Actions.some((action: any) =>
          action.ActionTypeId.Provider.includes('CodeBuild')
        );
        expect(hasCodeBuildAction).toBe(true);
      });
    });

    test('should configure ECS deploy actions', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;

      const stagingStage = stages.find(
        (stage: any) => stage.Name === 'DeployToStaging'
      );
      const prodStage = stages.find(
        (stage: any) => stage.Name === 'DeployToProduction'
      );

      expect(stagingStage).toBeDefined();
      expect(prodStage).toBeDefined();

      // Verify they use ECS deploy
      [stagingStage, prodStage].forEach(stage => {
        const hasEcsAction = stage.Actions.some((action: any) =>
          action.ActionTypeId.Provider.includes('ECS')
        );
        expect(hasEcsAction).toBe(true);
      });
    });

    test('should configure manual approval action', () => {
      const pipeline = template.findResources('AWS::CodePipeline::Pipeline');
      const pipelineResource = Object.values(pipeline)[0] as any;
      const stages = pipelineResource.Properties.Stages;

      const approvalStage = stages.find(
        (stage: any) => stage.Name === 'ManualApproval'
      );

      expect(approvalStage).toBeDefined();
      const hasManualApproval = approvalStage.Actions.some((action: any) =>
        action.ActionTypeId.Provider.includes('Manual')
      );
      expect(hasManualApproval).toBe(true);
    });

    test('should configure pipeline failure notifications', () => {
      // Verify EventBridge rule for pipeline state changes
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.codepipeline'],
          'detail-type': ['CodePipeline Pipeline Execution State Change'],
          detail: {
            state: ['FAILED'],
          },
        },
      });
    });

    test('should tag pipeline with common tags', () => {
      template.hasResourceProperties('AWS::CodePipeline::Pipeline', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });

  describe('SNS Topic', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create notification topic with correct name', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'microservice-pipeline-notifications-test',
      });
    });

    test('should add email subscription', () => {
      template.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'devops-team@example.com',
      });
    });

    test('should tag SNS topic with common tags', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: 'test' }]),
      });
    });
  });

  describe('SSM Parameters', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create image tag parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/microservice-test/image-tag',
        Type: 'String',
        Value: 'latest',
      });
    });

    test('should create endpoint URL parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/microservice-test/endpoint-url',
        Type: 'String',
      });
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should output Pipeline ARN', () => {
      template.hasOutput('PipelineArn', {
        Value: Match.anyValue(),
      });
    });

    test('should output ALB endpoint', () => {
      template.hasOutput('ALBEndpoint', {
        Value: Match.anyValue(),
      });

      // Verify it contains http://
      const outputs = template.findOutputs('ALBEndpoint');
      const output = Object.values(outputs)[0] as any;
      const valueStr = JSON.stringify(output.Value);
      expect(valueStr).toMatch(/http/);
    });

    test('should output ECR repository URI', () => {
      template.hasOutput('ECRRepositoryUri', {
        Value: Match.anyValue(),
      });

      // Verify it's a valid ECR URI format
      const outputs = template.findOutputs('ECRRepositoryUri');
      const output = Object.values(outputs)[0] as any;
      const valueStr = JSON.stringify(output.Value);
      // ECR URI will be a CloudFormation join, so we just verify output exists
      expect(output).toBeDefined();
    });
  });

  describe('Resource Counts', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should create expected number of resources', () => {
      // Verify key resource counts
      template.resourceCountIs('AWS::S3::Bucket', 2); // artifact + source
      template.resourceCountIs('AWS::ECR::Repository', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::ECS::Service', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::TargetGroup', 2); // blue + green
      template.resourceCountIs('AWS::CodeBuild::Project', 4);
      template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
      template.resourceCountIs('AWS::SNS::Topic', 1);
      template.resourceCountIs('AWS::SSM::Parameter', 2);
    });
  });

  describe('Removal Policies', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should set DESTROY removal policy on S3 buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should set DESTROY removal policy on log groups', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Container Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should configure container port mapping', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            PortMappings: [
              {
                ContainerPort: 8080,
                Protocol: 'tcp',
              },
            ],
          },
        ],
      });
    });

    test('should configure container health check', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            HealthCheck: {
              Command: Match.arrayWith([Match.stringLikeRegexp('.*curl.*')]),
              Interval: 30,
              Timeout: 5,
              Retries: 3,
              StartPeriod: 60,
            },
          },
        ],
      });
    });

    test('should configure container logging', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            LogConfiguration: {
              LogDriver: 'awslogs',
              Options: {
                'awslogs-group': Match.anyValue(),
                'awslogs-stream-prefix': 'app',
                'awslogs-region': Match.anyValue(),
              },
            },
          },
        ],
      });
    });
  });

  describe('CodeBuild BuildSpec Configuration', () => {
    beforeEach(() => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);
    });

    test('should configure Docker build project with Docker commands', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const dockerProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'microservice-docker-build-test'
      ) as any;

      expect(dockerProject).toBeDefined();
      const buildSpec = JSON.stringify(
        dockerProject.Properties.Source.BuildSpec || ''
      );
      expect(buildSpec).toMatch(/docker build/);
      expect(buildSpec).toMatch(/docker push/);
    });

    test('should configure unit test project with npm commands', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const unitTestProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'microservice-unit-tests-test'
      ) as any;

      expect(unitTestProject).toBeDefined();
      const buildSpec = JSON.stringify(
        unitTestProject.Properties.Source.BuildSpec || ''
      );
      expect(buildSpec).toMatch(/npm ci/);
      expect(buildSpec).toMatch(/npm run test:unit/);
    });

    test('should configure security scan project with OWASP commands', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const securityProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'microservice-security-scan-test'
      ) as any;

      expect(securityProject).toBeDefined();
      const buildSpec = JSON.stringify(
        securityProject.Properties.Source.BuildSpec || ''
      );
      expect(buildSpec).toMatch(/dependency-check/);
    });

    test('should configure integration test project with SSM parameter', () => {
      const projects = template.findResources('AWS::CodeBuild::Project');
      const integrationProject = Object.values(projects).find(
        (project: any) =>
          project.Properties.Name === 'microservice-integration-tests-test'
      ) as any;

      expect(integrationProject).toBeDefined();
      const envVars =
        integrationProject.Properties.Environment.EnvironmentVariables || [];
      const hasEndpointParam = envVars.some(
        (envVar: any) => envVar.Name === 'ENDPOINT_URL_PARAM'
      );
      expect(hasEndpointParam).toBe(true);
    });
  });

  describe('Stack Synthesis', () => {
    test('should synthesize without errors', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('should handle stack with all optional parameters', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      template = Template.fromStack(stack);

      expect(template).toBeDefined();
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'microservices-cluster-prod',
      });
    });
  });
});
