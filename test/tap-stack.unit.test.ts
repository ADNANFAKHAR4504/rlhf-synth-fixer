import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Complete CI/CD Pipeline for Microservices Deployment with VPC, EC2, CodePipeline, CodeBuild, and CodeDeploy'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('ProjectName parameter should have correct properties', () => {
      const projectNameParam = template.Parameters.ProjectName;
      expect(projectNameParam.Type).toBe('String');
      expect(projectNameParam.Default).toBe('Corp-MicroservicesPipeline');
      expect(projectNameParam.Description).toBe('Name of the project for resource naming');
    });

    test('should have GitHubRepoOwner parameter', () => {
      expect(template.Parameters.GitHubRepoOwner).toBeDefined();
    });

    test('should have GitHubRepoName parameter', () => {
      expect(template.Parameters.GitHubRepoName).toBeDefined();
    });

    test('should have GitHubBranch parameter', () => {
      expect(template.Parameters.GitHubBranch).toBeDefined();
    });

    test('should have GitHubToken parameter', () => {
      expect(template.Parameters.GitHubToken).toBeDefined();
      expect(template.Parameters.GitHubToken.NoEcho).toBe(true);
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.medium');
    });

    test('should have KeyPairName parameter', () => {
      expect(template.Parameters.KeyPairName).toBeDefined();
      expect(template.Parameters.KeyPairName.Type).toBe('AWS::EC2::KeyPair::KeyName');
    });

    test('should have MinInstances parameter', () => {
      expect(template.Parameters.MinInstances).toBeDefined();
      expect(template.Parameters.MinInstances.Type).toBe('Number');
      expect(template.Parameters.MinInstances.Default).toBe(2);
    });

    test('should have MaxInstances parameter', () => {
      expect(template.Parameters.MaxInstances).toBeDefined();
      expect(template.Parameters.MaxInstances.Type).toBe('Number');
      expect(template.Parameters.MaxInstances.Default).toBe(6);
    });
  });

  describe('Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.CorpVPC).toBeDefined();
    });

    test('CorpVPC should be a VPC', () => {
      const vpc = template.Resources.CorpVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.CorpInternetGateway).toBeDefined();
    });

    test('should have public subnets', () => {
      expect(template.Resources.CorpPublicSubnet1).toBeDefined();
      expect(template.Resources.CorpPublicSubnet2).toBeDefined();
    });

    test('should have private subnets', () => {
      expect(template.Resources.CorpPrivateSubnet1).toBeDefined();
      expect(template.Resources.CorpPrivateSubnet2).toBeDefined();
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.CorpNATGateway).toBeDefined();
    });

    test('should have security groups', () => {
      expect(template.Resources.CorpWebServerSecurityGroup).toBeDefined();
      expect(template.Resources.CorpLoadBalancerSecurityGroup).toBeDefined();
    });

    test('should have IAM roles', () => {
      expect(template.Resources.CorpCodePipelineServiceRole).toBeDefined();
      expect(template.Resources.CorpCodeBuildServiceRole).toBeDefined();
      expect(template.Resources.CorpCodeDeployServiceRole).toBeDefined();
      expect(template.Resources.CorpEC2InstanceRole).toBeDefined();
    });

    test('should have S3 artifact store', () => {
      expect(template.Resources.CorpArtifactStore).toBeDefined();
      expect(template.Resources.CorpArtifactStore.Type).toBe('AWS::S3::Bucket');
    });

    test('should have EC2 launch template', () => {
      expect(template.Resources.CorpLaunchTemplate).toBeDefined();
      expect(template.Resources.CorpLaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.CorpAutoScalingGroup).toBeDefined();
      expect(template.Resources.CorpAutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have Application Load Balancer', () => {
      expect(template.Resources.CorpApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.CorpApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have target group', () => {
      expect(template.Resources.CorpTargetGroup).toBeDefined();
      expect(template.Resources.CorpTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have CodeDeploy application', () => {
      expect(template.Resources.CorpCodeDeployApplication).toBeDefined();
      expect(template.Resources.CorpCodeDeployApplication.Type).toBe('AWS::CodeDeploy::Application');
    });

    test('should have CodeDeploy deployment group', () => {
      expect(template.Resources.CorpCodeDeployDeploymentGroup).toBeDefined();
      expect(template.Resources.CorpCodeDeployDeploymentGroup.Type).toBe('AWS::CodeDeploy::DeploymentGroup');
    });

    test('should have CodeBuild project', () => {
      expect(template.Resources.CorpCodeBuildProject).toBeDefined();
      expect(template.Resources.CorpCodeBuildProject.Type).toBe('AWS::CodeBuild::Project');
    });

    test('should have CodePipeline', () => {
      expect(template.Resources.CorpCodePipeline).toBeDefined();
      expect(template.Resources.CorpCodePipeline.Type).toBe('AWS::CodePipeline::Pipeline');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should follow Corp- naming convention', () => {
      const resourceNames = Object.keys(template.Resources);
      const corpResources = resourceNames.filter(name => name.startsWith('Corp'));
      expect(corpResources.length).toBeGreaterThan(0);
      
      // Check that all main resources follow the naming convention
      const expectedCorpResources = [
        'CorpVPC',
        'CorpInternetGateway',
        'CorpPublicSubnet1',
        'CorpPublicSubnet2',
        'CorpPrivateSubnet1',
        'CorpPrivateSubnet2',
        'CorpNATGateway',
        'CorpWebServerSecurityGroup',
        'CorpLoadBalancerSecurityGroup',
        'CorpCodePipelineServiceRole',
        'CorpCodeBuildServiceRole',
        'CorpCodeDeployServiceRole',
        'CorpEC2InstanceRole',
        'CorpArtifactStore',
        'CorpLaunchTemplate',
        'CorpAutoScalingGroup',
        'CorpApplicationLoadBalancer',
        'CorpTargetGroup',
        'CorpCodeDeployApplication',
        'CorpCodeDeployDeploymentGroup',
        'CorpCodeBuildProject',
        'CorpCodePipeline'
      ];

      expectedCorpResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'CodePipelineName',
        'ArtifactStoreBucket'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'CorpVPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['CorpApplicationLoadBalancer', 'DNSName'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ALB-DNS',
      });
    });

    test('CodePipelineName output should be correct', () => {
      const output = template.Outputs.CodePipelineName;
      expect(output.Description).toBe('CodePipeline Name');
      expect(output.Value).toEqual({ Ref: 'CorpCodePipeline' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Pipeline-Name',
      });
    });

    test('ArtifactStoreBucket output should be correct', () => {
      const output = template.Outputs.ArtifactStoreBucket;
      expect(output.Description).toBe('S3 Bucket for Pipeline Artifacts');
      expect(output.Value).toEqual({ Ref: 'CorpArtifactStore' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Artifact-Store-Bucket',
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources for complete CI/CD pipeline', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for complete pipeline
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(5); // Should have multiple parameters
    });

    test('should have exactly four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(4);
    });
  });

  describe('CI/CD Pipeline Configuration', () => {
    test('CodePipeline should have correct stages', () => {
      const pipeline = template.Resources.CorpCodePipeline;
      const stages = pipeline.Properties.Stages;
      
      expect(stages).toHaveLength(3);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Deploy');
    });

    test('CodePipeline should use S3 artifact store', () => {
      const pipeline = template.Resources.CorpCodePipeline;
      const artifactStore = pipeline.Properties.ArtifactStore;
      
      expect(artifactStore.Type).toBe('S3');
      expect(artifactStore.Location).toEqual({ Ref: 'CorpArtifactStore' });
    });

    test('CodeBuild should have correct environment', () => {
      const codebuild = template.Resources.CorpCodeBuildProject;
      const environment = codebuild.Properties.Environment;
      
      expect(environment.Type).toBe('LINUX_CONTAINER');
      expect(environment.ComputeType).toBe('BUILD_GENERAL1_MEDIUM');
      expect(environment.Image).toBe('aws/codebuild/amazonlinux2-x86_64-standard:3.0');
    });

    test('CodeDeploy should have correct deployment configuration', () => {
      const codedeploy = template.Resources.CorpCodeDeployDeploymentGroup;
      
      expect(codedeploy.Properties.DeploymentConfigName).toBe('CodeDeployDefault.AllInstancesOneAtATime');
      expect(codedeploy.Properties.AutoRollbackConfiguration.Enabled).toBe(true);
    });
  });
});
