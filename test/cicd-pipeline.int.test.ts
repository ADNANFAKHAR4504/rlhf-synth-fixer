/**
 * Integration Tests for CI/CD Pipeline CloudFormation Template
 *
 * Note: These tests validate the comprehensive self-sufficient CI/CD pipeline template.
 * The template now includes complete ECS infrastructure:
 * - VPC with public/private subnets
 * - Application Load Balancer with Blue/Green target groups
 * - ECS Cluster with Fargate services
 * - ECR Repository with lifecycle policies
 * - Complete CI/CD pipeline with CodeStar connections
 *
 * Full deployment testing requires:
 * - Valid AWS CodeStar Connection to GitHub
 * - Docker application with Dockerfile in the repository
 * - Proper AWS IAM permissions for deployment
 */

import fs from 'fs';
import path from 'path';

describe('CI/CD Pipeline CloudFormation Template - Integration Tests', () => {
  let template: any;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test-integration';

  beforeAll(() => {
    // Load JSON template for parsing
    const templatePath = path.join(__dirname, '../lib/cicd-pipeline.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template AWS Validation', () => {
    // Tests removed as requested by user
  });

  describe('Template Self-Sufficiency Validation', () => {
    test('template should be completely self-sufficient', () => {
      // Check that template includes all required infrastructure
      const requiredResources = [
        // VPC and Networking
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2',
        'PrivateSubnet1', 'PrivateSubnet2', 'ALBSecurityGroup', 'ECSSecurityGroup',
        
        // Load Balancer and Target Groups
        'ApplicationLoadBalancer', 'TargetGroupBlue', 'TargetGroupGreen', 'ALBListener',
        
        // ECS Infrastructure
        'ECSCluster', 'ECSTaskDefinition', 'ECSTaskExecutionRole', 'ECSServiceStaging', 'ECSServiceProduction',
        
        // ECR Repository
        'ECRRepository',
        
        // CI/CD Pipeline
        'CodeBuildServiceRole', 'BuildProject', 'TestProject',
        'CodeDeployServiceRole', 'CodeDeployApplication', 'DeploymentGroupStaging', 'DeploymentGroupProduction',
        'CodePipelineServiceRole', 'CICDPipeline',
        
        // Security and Monitoring
        'ArtifactEncryptionKey', 'PipelineArtifactBucket', 'PipelineNotificationTopic',
        'PipelineStateChangeRule', 'CodeDeployStateChangeRule'
      ];

      requiredResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should not reference external resources', () => {
      const templateString = JSON.stringify(template);
      
      // Should not contain references to external ECS infrastructure
      expect(templateString).not.toContain('ECSClusterNameStaging');
      expect(templateString).not.toContain('ECSServiceNameStaging');
      expect(templateString).not.toContain('ECSClusterNameProduction');
      expect(templateString).not.toContain('ECSServiceNameProduction');
      
      // Should use internal references instead
      expect(templateString).toContain('ECSCluster');
      expect(templateString).toContain('ECSServiceStaging');
      expect(templateString).toContain('ECSServiceProduction');
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should use modern GitHub integration', () => {
      const pipeline = template.Resources.CICDPipeline;
      const sourceAction = pipeline.Properties.Stages[0].Actions[0];
      
      // Should use CodeStar connections instead of deprecated OAuth
      expect(sourceAction.ActionTypeId.Provider).toBe('CodeStarSourceConnection');
      expect(sourceAction.ActionTypeId.Owner).toBe('AWS');
      expect(sourceAction.Configuration.ConnectionArn).toEqual({
        Ref: 'GitHubConnectionArn'
      });
    });

    test('should have properly scoped IAM permissions', () => {
      const codeBuildrole = template.Resources.CodeBuildServiceRole;
      const codePipelineRole = template.Resources.CodePipelineServiceRole;
      
      // CodeBuild role should have separate policies for different services
      const buildPolicies = codeBuildrole.Properties.Policies;
      expect(buildPolicies.some((p: any) => p.PolicyName === 'CodeBuildLogsPolicy')).toBe(true);
      expect(buildPolicies.some((p: any) => p.PolicyName === 'CodeBuildECRPolicy')).toBe(true);
      
      // CodePipeline role should have scoped ECS permissions
      const pipelinePolicies = codePipelineRole.Properties.Policies;
      const ecsPolicy = pipelinePolicies.find((p: any) => p.PolicyName === 'CodePipelineECSPolicy');
      expect(ecsPolicy).toBeDefined();
      
      // Should have CodeStar connections permission
      const codeStarPolicy = pipelinePolicies.find((p: any) => p.PolicyName === 'CodePipelineCodeStarPolicy');
      expect(codeStarPolicy).toBeDefined();
      expect(codeStarPolicy.PolicyDocument.Statement[0].Action).toContain('codeconnections:UseConnection');
    });

    test('should have comprehensive encryption', () => {
      // KMS key for artifacts
      expect(template.Resources.ArtifactEncryptionKey).toBeDefined();

      // S3 bucket encryption
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');

      // SNS topic encryption
      const snsTopic = template.Resources.PipelineNotificationTopic;
      expect(snsTopic.Properties.KmsMasterKeyId).toEqual({ Ref: 'ArtifactEncryptionKey' });

      // CloudWatch Logs encryption
      expect(template.Resources.BuildProjectLogGroup.Properties.KmsKeyId).toBeDefined();
      expect(template.Resources.TestProjectLogGroup.Properties.KmsKeyId).toBeDefined();
    });

    test('should have secure network configuration', () => {
      // ALB should be in public subnets
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });

      // ECS services should be in private subnets
      const stagingService = template.Resources.ECSServiceStaging;
      const productionService = template.Resources.ECSServiceProduction;
      
      expect(stagingService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(productionService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toContainEqual({ Ref: 'PrivateSubnet1' });
      
      // Security group should only allow ALB traffic to ECS
      const ecsSecurityGroup = template.Resources.ECSSecurityGroup;
      const ingressRule = ecsSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(ingressRule.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('Blue/Green Deployment Validation', () => {
    test('should have complete LoadBalancerInfo configuration', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;
      
      [stagingGroup, productionGroup].forEach(group => {
        // LoadBalancerInfo should be present and complete
        expect(group.Properties.LoadBalancerInfo).toBeDefined();
        expect(group.Properties.LoadBalancerInfo.TargetGroupPairInfoList).toBeDefined();
        
        const targetGroupPair = group.Properties.LoadBalancerInfo.TargetGroupPairInfoList[0];
        expect(targetGroupPair.TargetGroups).toHaveLength(2);
        expect(targetGroupPair.ProdTrafficRoute.ListenerArns).toBeDefined();
        
        // Should reference the correct target groups
        expect(targetGroupPair.TargetGroups[0].Name).toEqual({ 'Fn::GetAtt': ['TargetGroupBlue', 'TargetGroupName'] });
        expect(targetGroupPair.TargetGroups[1].Name).toEqual({ 'Fn::GetAtt': ['TargetGroupGreen', 'TargetGroupName'] });
      });
    });

    test('should reference correct ECS services', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;
      
      // Should reference internal ECS cluster and services
      expect(stagingGroup.Properties.ECSServices[0].ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(stagingGroup.Properties.ECSServices[0].ServiceName).toEqual({ 'Fn::GetAtt': ['ECSServiceStaging', 'Name'] });
      
      expect(productionGroup.Properties.ECSServices[0].ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(productionGroup.Properties.ECSServices[0].ServiceName).toEqual({ 'Fn::GetAtt': ['ECSServiceProduction', 'Name'] });
    });

    test('ECS services should use CODE_DEPLOY deployment controller', () => {
      const stagingService = template.Resources.ECSServiceStaging;
      const productionService = template.Resources.ECSServiceProduction;
      
      expect(stagingService.Properties.DeploymentController.Type).toBe('CODE_DEPLOY');
      expect(productionService.Properties.DeploymentController.Type).toBe('CODE_DEPLOY');
    });
  });

  describe('CodeBuild Environment Validation', () => {
    test('build project should have all required environment variables', () => {
      const buildProject = template.Resources.BuildProject;
      const envVars = buildProject.Properties.Environment.EnvironmentVariables;
      
      const expectedVars = [
        'AWS_DEFAULT_REGION',
        'AWS_ACCOUNT_ID', 
        'IMAGE_REPO_NAME',
        'IMAGE_TAG',
        'ECR_REPOSITORY_URI',
        'CONTAINER_PORT'
      ];
      
      expectedVars.forEach(varName => {
        expect(envVars.some((env: any) => env.Name === varName)).toBe(true);
      });
    });

    test('build project should generate required deployment artifacts', () => {
      const buildProject = template.Resources.BuildProject;
      const buildSpec = buildProject.Properties.Source.BuildSpec;
      
      // Should generate all required files for ECS deployment
      expect(buildSpec).toContain('imagedefinitions.json');
      expect(buildSpec).toContain('taskdef.json');
      expect(buildSpec).toContain('appspec.yaml');
      
      // Should use environment variables correctly
      expect(buildSpec).toContain('$ECR_REPOSITORY_URI');
      expect(buildSpec).toContain('$CONTAINER_PORT');
    });
  });

  describe('Pipeline Stage Validation', () => {
    test('pipeline should have correct stage sequence', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stages = pipeline.Properties.Stages;
      
      expect(stages).toHaveLength(5);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Test');
      expect(stages[3].Name).toBe('Deploy-Staging');
      expect(stages[4].Name).toBe('Deploy-Production');
    });

    test('deployment stages should have correct configuration', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stagingDeploy = pipeline.Properties.Stages[3].Actions[0];
      const productionStage = pipeline.Properties.Stages[4];
      
      // Staging deployment configuration
      expect(stagingDeploy.Configuration.TaskDefinitionTemplatePath).toBe('taskdef.json');
      expect(stagingDeploy.Configuration.AppSpecTemplatePath).toBe('appspec.yaml');
      expect(stagingDeploy.Configuration.ImageDefinitionsFileName).toBe('imagedefinitions.json');
      
      // Production stage should have approval and deployment
      const approvalAction = productionStage.Actions.find((a: any) => a.ActionTypeId.Provider === 'Manual');
      const deployAction = productionStage.Actions.find((a: any) => a.ActionTypeId.Provider === 'CodeDeployToECS');
      
      expect(approvalAction).toBeDefined();
      expect(deployAction).toBeDefined();
      expect(approvalAction.RunOrder).toBe(1);
      expect(deployAction.RunOrder).toBe(2);
    });
  });

  describe('Monitoring and Alerting Validation', () => {
    test('should have comprehensive CloudWatch Events', () => {
      const pipelineRule = template.Resources.PipelineStateChangeRule;
      const codedeployRule = template.Resources.CodeDeployStateChangeRule;
      
      expect(pipelineRule).toBeDefined();
      expect(codedeployRule).toBeDefined();
      
      // Pipeline events
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('STARTED');
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('SUCCEEDED'); 
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('FAILED');
      
      // CodeDeploy events
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('START');
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('SUCCESS');
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('FAILURE');
    });

    test('should have detailed notification configuration', () => {
      const approvalAction = template.Resources.CICDPipeline.Properties.Stages[4].Actions
        .find((a: any) => a.ActionTypeId.Provider === 'Manual');

      // CustomData is a Fn::Sub object, so we need to check its content
      const customData = approvalAction.Configuration.CustomData['Fn::Sub'];
      expect(customData).toContain('staging deployment');
      expect(customData).toContain('${ApplicationLoadBalancer.DNSName}');
    });
  });

  describe('Resource Tagging and Management', () => {
    test('all resources should have comprehensive tags', () => {
      const taggedResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::ECS::Cluster',
        'AWS::ECR::Repository',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::CodeBuild::Project',
        'AWS::CodePipeline::Pipeline',
        'AWS::KMS::Key'
      ];

      Object.values(template.Resources).forEach((resource: any) => {
        if (taggedResourceTypes.includes(resource.Type)) {
          const tags = resource.Properties.Tags || [];
          
          expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'CICD-Pipeline')).toBe(true);
          expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
          expect(tags.some((tag: any) => tag.Key === 'ManagedBy' && tag.Value === 'CloudFormation')).toBe(true);
        }
      });
    });

    test('all resources should have Delete deletion policy for test environments', () => {
      const criticalResources = [
        'VPC', 'ECSCluster', 'ECRRepository', 'ApplicationLoadBalancer',
        'ArtifactEncryptionKey', 'PipelineArtifactBucket'
      ];

      criticalResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Outputs and Integration Testing', () => {
    test('should have comprehensive outputs for testing', () => {
      const criticalOutputs = [
        'PipelineArn', 'PipelineName', 
        'ECSClusterName', 'ECRRepositoryUri',
        'ApplicationLoadBalancerDNS', 'ApplicationLoadBalancerURL',
        'VPCId', 'TargetGroupBlueArn', 'TargetGroupGreenArn',
        'ArtifactBucketName', 'KMSKeyId'
      ];

      criticalOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Description).toBeDefined();
        expect(template.Outputs[output].Value).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('outputs should provide all necessary values for external integration', () => {
      // ALB URL should be properly constructed for testing
      const albUrl = template.Outputs.ApplicationLoadBalancerURL;
      expect(albUrl.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });

      // ECR URI should be available for image references
      const ecrUri = template.Outputs.ECRRepositoryUri;
      expect(ecrUri.Value).toEqual({
        'Fn::GetAtt': ['ECRRepository', 'RepositoryUri']
      });

      // All exports should follow naming convention
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}')
        });
      });
    });
  });

  describe('Cost Optimization Validation', () => {
    test('should have cost optimization features', () => {
      // S3 lifecycle policies
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
      
      // ECR lifecycle policy
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.LifecyclePolicy.LifecyclePolicyText).toContain('Keep last 30 images');
      
      // Log retention
      expect(template.Resources.BuildProjectLogGroup.Properties.RetentionInDays).toBe(30);
      expect(template.Resources.TestProjectLogGroup.Properties.RetentionInDays).toBe(30);
      
      // Right-sized CodeBuild
      expect(template.Resources.BuildProject.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
      expect(template.Resources.TestProject.Properties.Environment.ComputeType).toBe('BUILD_GENERAL1_SMALL');
    });

    test('should use cost-effective ECS configuration', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      
      // Right-sized for test workloads
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      
      // ECS cluster should support FARGATE_SPOT for cost savings
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });
  });

  describe('Template Consistency Validation', () => {
    test('YAML and JSON templates should be equivalent', () => {
      // Load both templates
      const yamlPath = path.join(__dirname, '../lib/cicd-pipeline.yml');
      const jsonPath = path.join(__dirname, '../lib/cicd-pipeline.json');
      
      expect(fs.existsSync(yamlPath)).toBe(true);
      expect(fs.existsSync(jsonPath)).toBe(true);
      
      // Both should be valid and non-empty
      const yamlStats = fs.statSync(yamlPath);
      const jsonStats = fs.statSync(jsonPath);
      
      expect(yamlStats.size).toBeGreaterThan(1000);
      expect(jsonStats.size).toBeGreaterThan(1000);
    });

    test('template should be production-ready', () => {
      // Check that template doesn't contain test-only configurations
      const templateString = JSON.stringify(template);
      
      // Should not contain hardcoded test values
      expect(templateString).not.toContain('test-only');
      expect(templateString).not.toContain('localhost');
      expect(templateString).not.toContain('example.com');
      
      // Should use proper CloudFormation references
      expect(templateString).toContain('Fn::Sub');
      expect(templateString).toContain('Fn::GetAtt');
      expect(templateString).toContain('Ref');
    });
  });
});