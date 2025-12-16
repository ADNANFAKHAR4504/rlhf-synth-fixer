import fs from 'fs';
import path from 'path';

describe('CI/CD Pipeline CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/cicd-pipeline.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have comprehensive description with all features', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Self-sufficient multi-stage CI/CD pipeline');
      expect(template.Description).toContain('Blue/Green deployments');
      expect(template.Description).toContain('ECS infrastructure');
      expect(template.Description).toContain('5-stage pipeline');
      expect(template.Description).toContain('Customer-managed KMS encryption');
    });
  });

  describe('Parameters', () => {
    test('should have updated required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'GitHubConnectionArn', // Updated from GitHubToken
        'GitHubOwner',
        'RepositoryName', 
        'BranchName',
        'NotificationEmail',
        'ContainerPort', // New parameter
      ];

      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('should NOT have deprecated GitHub OAuth parameters', () => {
      expect(template.Parameters.GitHubToken).toBeUndefined();
      expect(template.Parameters.ECSClusterNameStaging).toBeUndefined();
      expect(template.Parameters.ECSServiceNameStaging).toBeUndefined();
      expect(template.Parameters.ECSClusterNameProduction).toBeUndefined();
      expect(template.Parameters.ECSServiceNameProduction).toBeUndefined();
    });

    test('GitHubConnectionArn parameter should have proper validation', () => {
      const param = template.Parameters.GitHubConnectionArn;
      expect(param.Type).toBe('String');
      expect(param.Description).toContain('CodeStar Connection');
      expect(param.AllowedPattern).toBe('^arn:aws:codeconnections:[a-z0-9-]+:[0-9]+:connection/[a-f0-9-]+$');
    });

    test('ContainerPort parameter should be properly configured', () => {
      const param = template.Parameters.ContainerPort;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(80);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(65535);
    });

    test('parameter validation patterns should be secure', () => {
      expect(template.Parameters.GitHubOwner.AllowedPattern).toBe('^[a-zA-Z0-9_.-]+$');
      expect(template.Parameters.RepositoryName.AllowedPattern).toBe('^[a-zA-Z0-9_.-]+$');
      expect(template.Parameters.BranchName.AllowedPattern).toBe('^[a-zA-Z0-9_./\\-]+$');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have complete VPC infrastructure', () => {
      const vpcResources = [
        'VPC',
        'InternetGateway', 
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PublicRouteTable',
        'DefaultPublicRoute',
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
      ];

      vpcResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('VPC should have proper CIDR and DNS configuration', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB and ECS security groups', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingressRules.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('ECS security group should only allow traffic from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const ingressRule = sg.Properties.SecurityGroupIngress[0];
      
      expect(ingressRule.SourceSecurityGroupId).toEqual({
        Ref: 'ALBSecurityGroup'
      });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have complete ALB configuration', () => {
      const albResources = [
        'ApplicationLoadBalancer',
        'TargetGroupBlue',
        'TargetGroupGreen',
        'ALBListener',
      ];

      albResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('target groups should be configured for Blue/Green deployments', () => {
      const blueTarget = template.Resources.TargetGroupBlue;
      const greenTarget = template.Resources.TargetGroupGreen;
      
      expect(blueTarget.Properties.TargetType).toBe('ip');
      expect(greenTarget.Properties.TargetType).toBe('ip');
      expect(blueTarget.Properties.Protocol).toBe('HTTP');
      expect(greenTarget.Properties.Protocol).toBe('HTTP');
    });

    test('target groups should have health checks configured', () => {
      const targetGroup = template.Resources.TargetGroupBlue;
      expect(targetGroup.Properties.HealthCheckEnabled).toBe(true);
      expect(targetGroup.Properties.HealthCheckPath).toBe('/');
      expect(targetGroup.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.Properties.HealthyThresholdCount).toBe(2);
      expect(targetGroup.Properties.UnhealthyThresholdCount).toBe(5);
    });
  });

  describe('ECS Resources', () => {
    test('should have complete ECS infrastructure', () => {
      const ecsResources = [
        'ECSCluster',
        'ECSTaskDefinition', 
        'ECSTaskExecutionRole',
        'ECSLogGroup',
        'ECSServiceStaging',
        'ECSServiceProduction',
      ];

      ecsResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('ECS cluster should have Fargate capacity providers', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('ECS services should use CODE_DEPLOY deployment controller', () => {
      const stagingService = template.Resources.ECSServiceStaging;
      const productionService = template.Resources.ECSServiceProduction;
      
      expect(stagingService.Properties.DeploymentController.Type).toBe('CODE_DEPLOY');
      expect(productionService.Properties.DeploymentController.Type).toBe('CODE_DEPLOY');
    });

    test('ECS task definition should be properly configured', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.Cpu).toBe('256');
      expect(taskDef.Properties.Memory).toBe('512');
    });

    test('container definition should reference ECR repository', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const containerDef = taskDef.Properties.ContainerDefinitions[0];
      
      expect(containerDef.Name).toBe('app');
      expect(containerDef.Image).toEqual({
        'Fn::Sub': '${ECRRepository.RepositoryUri}:latest'
      });
    });
  });

  describe('ECR Repository', () => {
    test('should have ECR repository with security features', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Type).toBe('AWS::ECR::Repository');
      expect(ecr.Properties.ImageScanningConfiguration.ScanOnPush).toBe(true);
      expect(ecr.Properties.ImageTagMutability).toBe('MUTABLE');
    });

    test('ECR repository should have lifecycle policy', () => {
      const ecr = template.Resources.ECRRepository;
      expect(ecr.Properties.LifecyclePolicy).toBeDefined();
      expect(ecr.Properties.LifecyclePolicy.LifecyclePolicyText).toContain('Keep last 30 images');
    });
  });

  describe('KMS Resources', () => {
    test('should have KMS key for artifact encryption', () => {
      expect(template.Resources.ArtifactEncryptionKey).toBeDefined();
      expect(template.Resources.ArtifactEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have proper security configuration', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      expect(kmsKey.Properties.Description['Fn::Sub']).toContain('Customer-managed KMS key');
      expect(kmsKey.Properties.PendingWindowInDays).toBe(7);
      expect(kmsKey.DeletionPolicy).toBe('Delete');
    });

    test('KMS key should have comprehensive tags', () => {
      const kmsKey = template.Resources.ArtifactEncryptionKey;
      const tags = kmsKey.Properties.Tags;
      expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'CICD-Pipeline')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'ManagedBy' && tag.Value === 'CloudFormation')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'CostCenter' && tag.Value === 'Infrastructure')).toBe(true);
    });
  });

  describe('S3 Resources', () => {
    test('S3 bucket should have security and lifecycle configuration', () => {
      const bucket = template.Resources.PipelineArtifactBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].BucketKeyEnabled).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(90);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have all required IAM roles with proper naming', () => {
      const roles = [
        'CodeBuildServiceRole',
        'CodeDeployServiceRole',
        'CodePipelineServiceRole',
        'ECSTaskExecutionRole',
      ];

      roles.forEach(role => {
        expect(template.Resources[role]).toBeDefined();
        expect(template.Resources[role].Type).toBe('AWS::IAM::Role');
        // Check that role names include environment suffix
        expect(template.Resources[role].Properties.RoleName).toEqual(
          expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
        );
      });
    });

    test('CodeBuild role should have scoped permissions', () => {
      const role = template.Resources.CodeBuildServiceRole;
      const policies = role.Properties.Policies;
      
      // Should have separate policies for different services
      expect(policies.some((p: any) => p.PolicyName === 'CodeBuildLogsPolicy')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'CodeBuildS3Policy')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'CodeBuildKMSPolicy')).toBe(true);
      expect(policies.some((p: any) => p.PolicyName === 'CodeBuildECRPolicy')).toBe(true);
    });

    test('CodePipeline role should have properly scoped ECS permissions', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const ecsPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CodePipelineECSPolicy');
      
      expect(ecsPolicy).toBeDefined();
      const statements = ecsPolicy.PolicyDocument.Statement;
      
      // Should NOT use wildcards for ECS resources
      statements.forEach((statement: any) => {
        if (statement.Resource) {
          expect(statement.Resource).not.toBe('*');
        }
      });
    });

    test('CodePipeline role should have CodeStar connections permission', () => {
      const role = template.Resources.CodePipelineServiceRole;
      const codeStarPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CodePipelineCodeStarPolicy');
      
      expect(codeStarPolicy).toBeDefined();
      expect(codeStarPolicy.PolicyDocument.Statement[0].Action).toContain('codeconnections:UseConnection');
    });
  });

  describe('CodeBuild Projects', () => {
    test('build project should have proper environment variables', () => {
      const buildProject = template.Resources.BuildProject;
      const envVars = buildProject.Properties.Environment.EnvironmentVariables;
      
      const requiredVars = ['AWS_DEFAULT_REGION', 'AWS_ACCOUNT_ID', 'IMAGE_REPO_NAME', 'IMAGE_TAG', 'ECR_REPOSITORY_URI'];
      requiredVars.forEach(varName => {
        expect(envVars.some((env: any) => env.Name === varName)).toBe(true);
      });
    });

    test('build project buildspec should generate required artifacts', () => {
      const buildProject = template.Resources.BuildProject;
      const buildSpec = buildProject.Properties.Source.BuildSpec;
      
      expect(buildSpec).toContain('imagedefinitions.json');
      expect(buildSpec).toContain('taskdef.json');
      expect(buildSpec).toContain('appspec.yaml');
    });

    test('test project should have comprehensive testing phases', () => {
      const testProject = template.Resources.TestProject;
      const buildSpec = testProject.Properties.Source.BuildSpec;
      
      expect(buildSpec).toContain('Running security tests');
      expect(buildSpec).toContain('Running unit tests');
      expect(buildSpec).toContain('Running integration tests');
      expect(buildSpec).toContain('Running performance tests');
    });
  });

  describe('CodeDeploy Configuration', () => {
    test('deployment groups should have complete LoadBalancerInfo configuration', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;
      
      [stagingGroup, productionGroup].forEach(group => {
        expect(group.Properties.LoadBalancerInfo).toBeDefined();
        expect(group.Properties.LoadBalancerInfo.TargetGroupPairInfoList).toBeDefined();
        expect(group.Properties.LoadBalancerInfo.TargetGroupPairInfoList[0].TargetGroups).toHaveLength(2);
        expect(group.Properties.LoadBalancerInfo.TargetGroupPairInfoList[0].ProdTrafficRoute.ListenerArns).toBeDefined();
      });
    });

    test('deployment groups should reference ECS cluster and services correctly', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      const productionGroup = template.Resources.DeploymentGroupProduction;
      
      expect(stagingGroup.Properties.ECSServices[0].ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(stagingGroup.Properties.ECSServices[0].ServiceName).toEqual({ 'Fn::GetAtt': ['ECSServiceStaging', 'Name'] });
      
      expect(productionGroup.Properties.ECSServices[0].ClusterName).toEqual({ Ref: 'ECSCluster' });
      expect(productionGroup.Properties.ECSServices[0].ServiceName).toEqual({ 'Fn::GetAtt': ['ECSServiceProduction', 'Name'] });
    });

    test('deployment groups should have Blue/Green configuration', () => {
      const stagingGroup = template.Resources.DeploymentGroupStaging;
      expect(stagingGroup.Properties.DeploymentStyle.DeploymentType).toBe('BLUE_GREEN');
      expect(stagingGroup.Properties.BlueGreenDeploymentConfiguration.TerminateBlueInstancesOnDeploymentSuccess.Action).toBe('TERMINATE');
      expect(stagingGroup.Properties.BlueGreenDeploymentConfiguration.TerminateBlueInstancesOnDeploymentSuccess.TerminationWaitTimeInMinutes).toBe(5);
    });
  });

  describe('CodePipeline Configuration', () => {
    test('pipeline should use CodeStar connections instead of GitHub OAuth', () => {
      const pipeline = template.Resources.CICDPipeline;
      const sourceAction = pipeline.Properties.Stages[0].Actions[0];
      
      expect(sourceAction.ActionTypeId.Provider).toBe('CodeStarSourceConnection');
      expect(sourceAction.ActionTypeId.Owner).toBe('AWS');
      expect(sourceAction.Configuration.ConnectionArn).toEqual({ Ref: 'GitHubConnectionArn' });
      expect(sourceAction.Configuration.FullRepositoryId).toEqual({
        'Fn::Sub': '${GitHubOwner}/${RepositoryName}'
      });
    });

    test('pipeline should have 5 stages in correct order', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stages = pipeline.Properties.Stages;
      
      expect(stages).toHaveLength(5);
      expect(stages[0].Name).toBe('Source');
      expect(stages[1].Name).toBe('Build');
      expect(stages[2].Name).toBe('Test');
      expect(stages[3].Name).toBe('Deploy-Staging');
      expect(stages[4].Name).toBe('Deploy-Production');
    });

    test('deploy stages should reference correct artifacts and templates', () => {
      const pipeline = template.Resources.CICDPipeline;
      const stagingDeploy = pipeline.Properties.Stages[3].Actions[0];
      const prodDeploy = pipeline.Properties.Stages[4].Actions[1];
      
      [stagingDeploy, prodDeploy].forEach(action => {
        expect(action.Configuration.TaskDefinitionTemplatePath).toBe('taskdef.json');
        expect(action.Configuration.AppSpecTemplatePath).toBe('appspec.yaml');
        expect(action.Configuration.ImageDefinitionsFileName).toBe('imagedefinitions.json');
      });
    });

    test('production deployment should have manual approval', () => {
      const pipeline = template.Resources.CICDPipeline;
      const prodStage = pipeline.Properties.Stages[4];
      
      const approvalAction = prodStage.Actions.find((a: any) => a.ActionTypeId.Provider === 'Manual');
      const deployAction = prodStage.Actions.find((a: any) => a.ActionTypeId.Provider === 'CodeDeployToECS');
      
      expect(approvalAction).toBeDefined();
      expect(deployAction).toBeDefined();
      expect(approvalAction.RunOrder).toBe(1);
      expect(deployAction.RunOrder).toBe(2);
    });
  });

  describe('CloudWatch and Monitoring', () => {
    test('should have CloudWatch Events for both pipeline and CodeDeploy', () => {
      expect(template.Resources.PipelineStateChangeRule).toBeDefined();
      expect(template.Resources.CodeDeployStateChangeRule).toBeDefined();
    });

    test('CloudWatch Events should monitor appropriate states', () => {
      const pipelineRule = template.Resources.PipelineStateChangeRule;
      const codedeployRule = template.Resources.CodeDeployStateChangeRule;
      
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('STARTED');
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('SUCCEEDED');
      expect(pipelineRule.Properties.EventPattern.detail.state).toContain('FAILED');
      
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('START');
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('SUCCESS');
      expect(codedeployRule.Properties.EventPattern.detail.state).toContain('FAILURE');
    });

    test('SNS topic should be encrypted with KMS', () => {
      const snsTopic = template.Resources.PipelineNotificationTopic;
      expect(snsTopic.Properties.KmsMasterKeyId).toEqual({ Ref: 'ArtifactEncryptionKey' });
    });
  });

  describe('Resource Tagging', () => {
    test('all major resources should have comprehensive tags', () => {
      const taggedResources = [
        'VPC',
        'ECSCluster',
        'ECRRepository', 
        'ApplicationLoadBalancer',
        'BuildProject',
        'TestProject',
        'CICDPipeline',
        'ArtifactEncryptionKey'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        
        expect(tags.some((tag: any) => tag.Key === 'Project' && tag.Value === 'CICD-Pipeline')).toBe(true);
        expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
        expect(tags.some((tag: any) => tag.Key === 'ManagedBy' && tag.Value === 'CloudFormation')).toBe(true);
      });
    });

    test('cost center tag should be present on infrastructure resources', () => {
      const costCenterResources = ['BuildProject', 'TestProject', 'CICDPipeline', 'ArtifactEncryptionKey'];
      
      costCenterResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags || [];
        
        expect(tags.some((tag: any) => tag.Key === 'CostCenter' && tag.Value === 'Infrastructure')).toBe(true);
      });
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete deletion policy for test environments', () => {
      const resourcesWithDeletionPolicy = [
        'VPC',
        'ECSCluster',
        'ECRRepository',
        'ApplicationLoadBalancer',
        'ArtifactEncryptionKey',
        'PipelineArtifactBucket',
        'BuildProjectLogGroup',
        'TestProjectLogGroup',
        'ECSLogGroup'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('Outputs', () => {
    test('should have comprehensive outputs for integration testing', () => {
      const requiredOutputs = [
        'PipelineArn',
        'PipelineName',
        'ArtifactBucketName',
        'KMSKeyId',
        'ECSClusterName',
        'ECRRepositoryUri',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerURL',
        'VPCId',
        'TargetGroupBlueArn',
        'TargetGroupGreenArn'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Description).toBeDefined();
        expect(template.Outputs[output].Value).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringContaining('${AWS::StackName}')
        });
      });
    });

    test('ALB URL should be properly formatted', () => {
      const albUrl = template.Outputs.ApplicationLoadBalancerURL;
      expect(albUrl.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}'
      });
    });
  });

  describe('Template Validation', () => {
    test('template should be valid JSON', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not contain deprecated or insecure configurations', () => {
      const templateString = JSON.stringify(template);
      
      // Should not contain deprecated GitHub OAuth
      expect(templateString).not.toContain('OAuthToken');
      expect(templateString).not.toContain('ThirdParty');
      
      // Should not contain wildcard permissions for ECS
      const codeDeployPolicies = template.Resources.CodePipelineServiceRole.Properties.Policies
        .find((p: any) => p.PolicyName === 'CodePipelineECSPolicy');
      
      if (codeDeployPolicies) {
        const statements = codeDeployPolicies.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (statement.Resource && statement.Action.some((action: string) => action.startsWith('ecs:'))) {
            expect(statement.Resource).not.toBe('*');
          }
        });
      }
    });

    test('all resource references should be valid', () => {
      const allResources = Object.keys(template.Resources);
      const templateString = JSON.stringify(template);
      
      // Check that all Ref and Fn::GetAtt references exist
      const refPattern = /"Ref":\s*"([^"]+)"/g;
      let match;
      while ((match = refPattern.exec(templateString)) !== null) {
        const referencedResource = match[1];
        if (!referencedResource.startsWith('AWS::') && !template.Parameters[referencedResource]) {
          expect(allResources).toContain(referencedResource);
        }
      }
    });
  });
});