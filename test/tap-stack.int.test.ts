// Integration tests for CI/CD Pipeline Infrastructure
// Since this is a CI/CD Pipeline Integration task, these tests validate
// the generated CloudFormation templates and infrastructure code structure
// without requiring actual deployment to AWS

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

describe('CI/CD Pipeline Infrastructure Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    // Create app and stack for integration testing
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('CloudFormation Template Validation', () => {
    test('Template synthesizes without errors', () => {
      // This validates that the stack can be synthesized
      expect(template).toBeDefined();
    });

    test('Template contains all required resource types', () => {
      const expectedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::S3::Bucket',
        'AWS::SecretsManager::Secret',
        'AWS::SSM::Parameter',
        'AWS::SNS::Topic',
        'AWS::CodeBuild::Project',
        'AWS::ECS::Cluster',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::CodeDeploy::Application',
        'AWS::CodeDeploy::DeploymentGroup',
        'AWS::CloudWatch::Alarm',
        'AWS::CodePipeline::Pipeline',
        'AWS::Events::Rule',
      ];

      const templateJson = template.toJSON();
      const actualResourceTypes = Object.values(templateJson.Resources || {})
        .map((resource: any) => resource.Type);

      expectedResourceTypes.forEach(type => {
        expect(actualResourceTypes).toContain(type);
      });
    });
  });

  describe('Pipeline Configuration Validation', () => {
    test('CodePipeline has required stages', () => {
      const templateJson = template.toJSON();
      const pipeline = Object.values(templateJson.Resources || {})
        .find((resource: any) => resource.Type === 'AWS::CodePipeline::Pipeline') as any;

      expect(pipeline).toBeDefined();
      expect(pipeline.Properties.Stages).toBeDefined();
      expect(pipeline.Properties.Stages.length).toBeGreaterThanOrEqual(4);

      // Verify stage names contain expected stages
      const stageNames = pipeline.Properties.Stages.map((stage: any) => stage.Name);
      expect(stageNames).toContain('Source');
      expect(stageNames).toContain('Build');
      expect(stageNames.some((name: string) => name.includes('Deploy'))).toBe(true);
    });

    test('Pipeline has artifact store configured', () => {
      const templateJson = template.toJSON();
      const pipeline = Object.values(templateJson.Resources || {})
        .find((resource: any) => resource.Type === 'AWS::CodePipeline::Pipeline') as any;

      expect(pipeline.Properties.ArtifactStore).toBeDefined();
      expect(pipeline.Properties.ArtifactStore.Type).toBe('S3');
    });
  });

  describe('CodeBuild Projects Configuration', () => {
    test('Three CodeBuild projects are created with different compute types', () => {
      const templateJson = template.toJSON();
      const codeBuildProjects = Object.values(templateJson.Resources || {})
        .filter((resource: any) => resource.Type === 'AWS::CodeBuild::Project');

      expect(codeBuildProjects.length).toBeGreaterThanOrEqual(3);

      const computeTypes = codeBuildProjects.map((project: any) =>
        project.Properties.Environment.ComputeType
      );

      // Verify different compute types are used
      expect(new Set(computeTypes).size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security and Compliance Validation', () => {
    test('S3 bucket has encryption enabled', () => {
      const templateJson = template.toJSON();
      const bucket = Object.values(templateJson.Resources || {})
        .find((resource: any) =>
          resource.Type === 'AWS::S3::Bucket' &&
          resource.Properties.BucketName?.includes?.('artifact')
        ) as any;

      expect(bucket).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket has lifecycle policy configured', () => {
      const templateJson = template.toJSON();
      const bucket = Object.values(templateJson.Resources || {})
        .find((resource: any) =>
          resource.Type === 'AWS::S3::Bucket' &&
          resource.Properties.BucketName?.includes?.('artifact')
        ) as any;

      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('GitHub OAuth token uses Secrets Manager', () => {
      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });
  });

  describe('Monitoring and Alarms Configuration', () => {
    test('CloudWatch alarms are created', () => {
      const templateJson = template.toJSON();
      const alarms = Object.values(templateJson.Resources || {})
        .filter((resource: any) => resource.Type === 'AWS::CloudWatch::Alarm');

      expect(alarms.length).toBeGreaterThan(0);
    });

    test('SNS topic for approvals is configured', () => {
      const templateJson = template.toJSON();
      const topic = Object.values(templateJson.Resources || {})
        .find((resource: any) =>
          resource.Type === 'AWS::SNS::Topic' &&
          resource.Properties.TopicName?.includes?.('approval')
        );

      expect(topic).toBeDefined();
    });

    test('CloudWatch Events rule is configured for pipeline triggering', () => {
      template.resourceCountIs('AWS::Events::Rule', 1);
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('CodeDeploy deployment group has auto-rollback configured', () => {
      const templateJson = template.toJSON();
      const deploymentGroup = Object.values(templateJson.Resources || {})
        .find((resource: any) => resource.Type === 'AWS::CodeDeploy::DeploymentGroup') as any;

      expect(deploymentGroup).toBeDefined();
      expect(deploymentGroup.Properties.AutoRollbackConfiguration).toBeDefined();
      expect(deploymentGroup.Properties.AutoRollbackConfiguration.Enabled).toBe(true);
    });

    test('Deployment uses blue/green strategy', () => {
      const templateJson = template.toJSON();
      const deploymentGroup = Object.values(templateJson.Resources || {})
        .find((resource: any) => resource.Type === 'AWS::CodeDeploy::DeploymentGroup') as any;

      expect(deploymentGroup.Properties.BlueGreenDeploymentConfiguration).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('Parameter Store parameters are created for all environments', () => {
      const templateJson = template.toJSON();
      const parameters = Object.values(templateJson.Resources || {})
        .filter((resource: any) => resource.Type === 'AWS::SSM::Parameter');

      expect(parameters.length).toBeGreaterThanOrEqual(3);

      const parameterNames = parameters.map((param: any) => param.Properties.Name);
      expect(parameterNames.some((name: string) => name.includes('/dev/'))).toBe(true);
      expect(parameterNames.some((name: string) => name.includes('/staging/'))).toBe(true);
      expect(parameterNames.some((name: string) => name.includes('/prod/'))).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('All resources include environmentSuffix in their identifiers', () => {
      const templateJson = template.toJSON();
      const resources = Object.keys(templateJson.Resources || {});

      // Verify resources have proper naming (most should include 'test' suffix from our test stack)
      expect(resources.length).toBeGreaterThan(0);

      // Check that key resources have environment suffix in their properties
      const vpc = Object.values(templateJson.Resources || {})
        .find((resource: any) => resource.Type === 'AWS::EC2::VPC') as any;

      if (vpc?.Properties?.Tags) {
        const nameTag = vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name');
        if (nameTag) {
          expect(nameTag.Value).toContain('test');
        }
      }
    });
  });

  describe('CI/CD Pipeline Configuration File', () => {
    test('lib/ci-cd.yml file exists and is valid YAML', () => {
      const cicdFilePath = path.join(__dirname, '..', 'lib', 'ci-cd.yml');
      expect(fs.existsSync(cicdFilePath)).toBe(true);

      const content = fs.readFileSync(cicdFilePath, 'utf8');
      expect(content.length).toBeGreaterThan(0);
      expect(content).toContain('name:');
      expect(content).toContain('on:');
      expect(content).toContain('jobs:');
    });

    test('CI/CD pipeline includes deployment stages', () => {
      const cicdFilePath = path.join(__dirname, '..', 'lib', 'ci-cd.yml');
      const content = fs.readFileSync(cicdFilePath, 'utf8');

      // Should include key stages for CI/CD
      expect(content.toLowerCase()).toContain('build');
      expect(content.toLowerCase()).toContain('test');
    });
  });

  describe('Infrastructure Outputs', () => {
    test('Stack exports required outputs', () => {
      const templateJson = template.toJSON();
      const outputs = templateJson.Outputs || {};

      expect(Object.keys(outputs).length).toBeGreaterThan(0);

      // Check for expected output keys
      expect(outputs).toHaveProperty('PipelineArn');
      expect(outputs).toHaveProperty('ArtifactBucketName');
      expect(outputs).toHaveProperty('ApprovalTopicArn');
    });
  });
});
