import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - ECS Batch Processing System', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for ECS Batch Processing', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ECS Batch Processing');
    });

    test('should have required template sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBeDefined();
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      const attachment = template.Resources.AttachGateway;
      expect(attachment).toBeDefined();
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(attachment.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct properties', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('private subnets should have correct CIDR blocks', () => {
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;

      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have public route table and route', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('should have route table associations for public subnets', () => {
      expect(template.Resources.PublicSubnet1RouteTableAssociation).toBeDefined();
      expect(template.Resources.PublicSubnet2RouteTableAssociation).toBeDefined();
    });
  });

  describe('S3 and Secrets Manager Resources', () => {
    test('should have S3 bucket resource', () => {
      expect(template.Resources.S3Bucket).toBeDefined();
      expect(template.Resources.S3Bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.S3Bucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have Secrets Manager secret', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('Secrets Manager secret should have valid JSON credentials', () => {
      const secret = template.Resources.DBSecret;
      const secretString = JSON.parse(secret.Properties.SecretString);
      expect(secretString.username).toBeDefined();
      expect(secretString.password).toBeDefined();
      expect(secretString.engine).toBe('postgres');
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster resource', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const containerInsights = cluster.Properties.ClusterSettings.find(
        (setting: any) => setting.Name === 'containerInsights'
      );
      expect(containerInsights).toBeDefined();
      expect(containerInsights.Value).toBe('enabled');
    });

    test('ECS cluster should have Fargate capacity providers', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE');
      expect(cluster.Properties.CapacityProviders).toContain('FARGATE_SPOT');
    });

    test('ECS cluster should have default capacity provider strategy', () => {
      const cluster = template.Resources.ECSCluster;
      const strategy = cluster.Properties.DefaultCapacityProviderStrategy;
      expect(strategy).toHaveLength(1);
      expect(strategy[0].CapacityProvider).toBe('FARGATE');
      expect(strategy[0].Weight).toBe(1);
      expect(strategy[0].Base).toBe(2);
    });
  });

  describe('IAM Roles', () => {
    test('should have Task Execution Role', () => {
      expect(template.Resources.TaskExecutionRole).toBeDefined();
      expect(template.Resources.TaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Task Execution Role should have ECS trust policy', () => {
      const role = template.Resources.TaskExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('ecs-tasks.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('Task Execution Role should have Secrets Manager access policy', () => {
      const role = template.Resources.TaskExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('should have Task Role', () => {
      expect(template.Resources.TaskRole).toBeDefined();
      expect(template.Resources.TaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('Task Role should have S3 write access policy', () => {
      const role = template.Resources.TaskRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'S3WriteAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
    });

    test('Task Role should have X-Ray access policy', () => {
      const role = template.Resources.TaskRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'XRayAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('xray:PutTraceSegments');
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should have log groups for all services', () => {
      expect(template.Resources.DataIngestionLogGroup).toBeDefined();
      expect(template.Resources.TransactionProcessingLogGroup).toBeDefined();
      expect(template.Resources.ReportGenerationLogGroup).toBeDefined();
      expect(template.Resources.XRayLogGroup).toBeDefined();
    });

    test('log groups should have 30-day retention', () => {
      const logGroups = [
        'DataIngestionLogGroup',
        'TransactionProcessingLogGroup',
        'ReportGenerationLogGroup',
        'XRayLogGroup'
      ];

      logGroups.forEach(logGroupName => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });
    });
  });

  describe('Task Definitions', () => {
    test('should have three task definitions', () => {
      expect(template.Resources.DataIngestionTaskDefinition).toBeDefined();
      expect(template.Resources.TransactionProcessingTaskDefinition).toBeDefined();
      expect(template.Resources.ReportGenerationTaskDefinition).toBeDefined();
    });

    test('all task definitions should be Fargate compatible', () => {
      const taskDefs = [
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition'
      ];

      taskDefs.forEach(taskDefName => {
        const taskDef = template.Resources[taskDefName];
        expect(taskDef.Type).toBe('AWS::ECS::TaskDefinition');
        expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
        expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
      });
    });

    test('all task definitions should have 1024 CPU and 2048 memory', () => {
      const taskDefs = [
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition'
      ];

      taskDefs.forEach(taskDefName => {
        const taskDef = template.Resources[taskDefName];
        expect(taskDef.Properties.Cpu).toBe('1024');
        expect(taskDef.Properties.Memory).toBe('2048');
      });
    });

    test('all task definitions should have X-Ray sidecar container', () => {
      const taskDefs = [
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition'
      ];

      taskDefs.forEach(taskDefName => {
        const taskDef = template.Resources[taskDefName];
        const xrayContainer = taskDef.Properties.ContainerDefinitions.find(
          (c: any) => c.Name === 'xray-daemon'
        );
        expect(xrayContainer).toBeDefined();
        expect(xrayContainer.Essential).toBe(false);
        expect(xrayContainer.Image).toContain('xray');
      });
    });

    test('all task definitions should have secrets from Secrets Manager', () => {
      const taskDefs = [
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition'
      ];

      taskDefs.forEach(taskDefName => {
        const taskDef = template.Resources[taskDefName];
        const mainContainer = taskDef.Properties.ContainerDefinitions[0];
        expect(mainContainer.Secrets).toBeDefined();
        expect(mainContainer.Secrets[0].Name).toBe('DB_CREDENTIALS');
      });
    });

    test('all task definitions should have health checks', () => {
      const taskDefs = [
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition'
      ];

      taskDefs.forEach(taskDefName => {
        const taskDef = template.Resources[taskDefName];
        const mainContainer = taskDef.Properties.ContainerDefinitions[0];
        expect(mainContainer.HealthCheck).toBeDefined();
        expect(mainContainer.HealthCheck.Interval).toBe(30);
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ECS tasks security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ECS security group should allow traffic from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('ALB security group should allow HTTP traffic', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const httpRule = sg.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should have correct health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.Properties.HealthCheckTimeoutSeconds).toBe(5);
      expect(tg.Properties.HealthyThresholdCount).toBe(2);
      expect(tg.Properties.UnhealthyThresholdCount).toBe(3);
    });

    test('target group should use IP target type for Fargate', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('ECS Services', () => {
    test('should have three ECS services', () => {
      expect(template.Resources.DataIngestionService).toBeDefined();
      expect(template.Resources.TransactionProcessingService).toBeDefined();
      expect(template.Resources.ReportGenerationService).toBeDefined();
    });

    test('all services should use Fargate launch type', () => {
      const services = [
        'DataIngestionService',
        'TransactionProcessingService',
        'ReportGenerationService'
      ];

      services.forEach(serviceName => {
        const service = template.Resources[serviceName];
        expect(service.Type).toBe('AWS::ECS::Service');
        expect(service.Properties.LaunchType).toBe('FARGATE');
      });
    });

    test('all services should have exactly 2 desired tasks', () => {
      const services = [
        'DataIngestionService',
        'TransactionProcessingService',
        'ReportGenerationService'
      ];

      services.forEach(serviceName => {
        const service = template.Resources[serviceName];
        expect(service.Properties.DesiredCount).toBe(2);
      });
    });

    test('all services should have circuit breaker enabled', () => {
      const services = [
        'DataIngestionService',
        'TransactionProcessingService',
        'ReportGenerationService'
      ];

      services.forEach(serviceName => {
        const service = template.Resources[serviceName];
        expect(service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker.Enable).toBe(true);
        expect(service.Properties.DeploymentConfiguration.DeploymentCircuitBreaker.Rollback).toBe(true);
      });
    });

    test('report generation service should have load balancer configured', () => {
      const service = template.Resources.ReportGenerationService;
      expect(service.Properties.LoadBalancers).toBeDefined();
      expect(service.Properties.LoadBalancers[0].ContainerName).toBe('report-generation');
      expect(service.Properties.LoadBalancers[0].ContainerPort).toBe(80);
    });

    test('report generation service should depend on ALB listener', () => {
      const service = template.Resources.ReportGenerationService;
      expect(service.DependsOn).toContain('ALBListener');
    });

    test('services should NOT have placement strategies (Fargate incompatible)', () => {
      const services = [
        'DataIngestionService',
        'TransactionProcessingService',
        'ReportGenerationService'
      ];

      services.forEach(serviceName => {
        const service = template.Resources[serviceName];
        expect(service.Properties.PlacementStrategies).toBeUndefined();
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should have scalable targets for all services', () => {
      expect(template.Resources.DataIngestionScalableTarget).toBeDefined();
      expect(template.Resources.TransactionProcessingScalableTarget).toBeDefined();
      expect(template.Resources.ReportGenerationScalableTarget).toBeDefined();
    });

    test('all scalable targets should have min capacity of 2 and max capacity of 10', () => {
      const targets = [
        'DataIngestionScalableTarget',
        'TransactionProcessingScalableTarget',
        'ReportGenerationScalableTarget'
      ];

      targets.forEach(targetName => {
        const target = template.Resources[targetName];
        expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
        expect(target.Properties.MinCapacity).toBe(2);
        expect(target.Properties.MaxCapacity).toBe(10);
      });
    });

    test('should have scaling policies for all services', () => {
      expect(template.Resources.DataIngestionScaleUpPolicy).toBeDefined();
      expect(template.Resources.TransactionProcessingScaleUpPolicy).toBeDefined();
      expect(template.Resources.ReportGenerationScaleUpPolicy).toBeDefined();
    });

    test('all scaling policies should use target tracking with 70% CPU', () => {
      const policies = [
        'DataIngestionScaleUpPolicy',
        'TransactionProcessingScaleUpPolicy',
        'ReportGenerationScaleUpPolicy'
      ];

      policies.forEach(policyName => {
        const policy = template.Resources[policyName];
        expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
        expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
        expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
      });
    });

    test('scaling policies should have correct cooldown periods', () => {
      const policies = [
        'DataIngestionScaleUpPolicy',
        'TransactionProcessingScaleUpPolicy',
        'ReportGenerationScaleUpPolicy'
      ];

      policies.forEach(policyName => {
        const policy = template.Resources[policyName];
        const config = policy.Properties.TargetTrackingScalingPolicyConfiguration;
        expect(config.ScaleInCooldown).toBe(300);
        expect(config.ScaleOutCooldown).toBe(60);
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ECSClusterName',
        'LoadBalancerDNS',
        'DataIngestionServiceName',
        'TransactionProcessingServiceName',
        'ReportGenerationServiceName',
        'S3BucketName',
        'VPCId',
        'SecretArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
      });
    });

    test('ECS cluster output should have export', () => {
      const output = template.Outputs.ECSClusterName;
      expect(output.Export).toBeDefined();
      expect(output.Export.Name).toEqual({ 'Fn::Sub': '${AWS::StackName}-ECSCluster' });
    });

    test('ALB DNS output should have export', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Export).toBeDefined();
      expect(output.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources with names should include environment suffix', () => {
      const resourcesWithNames = [
        'ECSCluster',
        'TaskExecutionRole',
        'TaskRole',
        'DataIngestionLogGroup',
        'TransactionProcessingLogGroup',
        'ReportGenerationLogGroup',
        'XRayLogGroup',
        'DataIngestionTaskDefinition',
        'TransactionProcessingTaskDefinition',
        'ReportGenerationTaskDefinition',
        'ECSSecurityGroup',
        'ALBSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'DataIngestionService',
        'TransactionProcessingService',
        'ReportGenerationService'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties.ClusterName || resource.Properties.RoleName ||
            resource.Properties.LogGroupName || resource.Properties.Family ||
            resource.Properties.GroupName || resource.Properties.Name ||
            resource.Properties.ServiceName) {
          const nameValue = resource.Properties.ClusterName || resource.Properties.RoleName ||
                           resource.Properties.LogGroupName || resource.Properties.Family ||
                           resource.Properties.GroupName || resource.Properties.Name ||
                           resource.Properties.ServiceName;
          expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });

    test('S3 bucket name should include environment suffix', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Properties.BucketName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('secret name should include environment suffix', () => {
      const secret = template.Resources.DBSecret;
      expect(secret.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
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

    test('should have exactly 37 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(37);
    });
  });
});
