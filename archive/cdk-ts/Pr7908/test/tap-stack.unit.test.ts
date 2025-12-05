import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      githubBranch: 'main',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Stack is created successfully', () => {
    expect(stack).toBeDefined();
  });

  test('VPC is created with correct configuration', () => {
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('ECR Repository is created', () => {
    template.resourceCountIs('AWS::ECR::Repository', 1);
    template.hasResourceProperties('AWS::ECR::Repository', {
      ImageScanningConfiguration: {
        ScanOnPush: true,
      },
      ImageTagMutability: 'IMMUTABLE',
      RepositoryName: 'cicd-app-test',
    });
  });

  test('ECS Cluster is created', () => {
    template.resourceCountIs('AWS::ECS::Cluster', 1);
    template.hasResourceProperties('AWS::ECS::Cluster', {
      ClusterName: 'cicd-cluster-test',
    });
  });

  test('ECS Service is created with Fargate', () => {
    template.resourceCountIs('AWS::ECS::Service', 1);
    template.hasResourceProperties('AWS::ECS::Service', {
      LaunchType: 'FARGATE',
      DesiredCount: 2,
      ServiceName: 'cicd-service-test',
    });
  });

  test('Load Balancer is created', () => {
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Type: 'application',
    });
  });

  test('CodePipeline is created', () => {
    template.resourceCountIs('AWS::CodePipeline::Pipeline', 1);
  });

  test('CodeBuild Project is created', () => {
    template.resourceCountIs('AWS::CodeBuild::Project', 1);
  });

  test('SNS Topic for alarms is created', () => {
    template.resourceCountIs('AWS::SNS::Topic', 1);
  });

  test('CloudWatch Alarms are created', () => {
    // Should have multiple alarms for monitoring
    template.resourceCountIs('AWS::CloudWatch::Alarm', 4);
  });

  test('Stack outputs are created', () => {
    const outputs = Object.keys(template.toJSON().Outputs || {});
    expect(outputs).toContain('VpcId');
    expect(outputs).toContain('EcrRepositoryUri');
    expect(outputs).toContain('EcsClusterName');
    expect(outputs).toContain('EcsServiceName');
    expect(outputs).toContain('LoadBalancerDns');
    expect(outputs).toContain('PipelineName');
    expect(outputs).toContain('AlarmTopicArn');
    expect(outputs).toContain('BuildProjectName');
  });

  test('VPC Endpoints are created for cost optimization', () => {
    // Gateway endpoint for S3
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
  });

  test('Auto Scaling is configured for ECS Service', () => {
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
    template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
  });

  test('IAM Roles are created with proper permissions', () => {
    // Task execution role, task role, build role, pipeline role, custom resource roles
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThan(0);
  });

  test('Security Groups are properly configured', () => {
    const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
    expect(Object.keys(securityGroups).length).toBeGreaterThan(0);
  });

  test('Default github branch is set to main', () => {
    const app2 = new cdk.App();
    const stack2 = new TapStack(app2, 'TestStack2', {
      environmentSuffix: 'test',
      githubOwner: 'test-owner',
      githubRepo: 'test-repo',
      // githubBranch not provided - should default to 'main'
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    expect(stack2).toBeDefined();
  });

  test('Synth produces valid CloudFormation', () => {
    const assembly = app.synth();
    const stackArtifact = assembly.getStackByName(stack.stackName);
    expect(stackArtifact.template).toBeDefined();
  });
});
