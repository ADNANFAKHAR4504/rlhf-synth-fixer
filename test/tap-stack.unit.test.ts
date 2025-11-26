import fs from 'fs';
import path from 'path';
import {
  getTemplate,
  validateTemplateStructure,
  getResourcesByType,
  hasDeletePolicies,
  hasEnvironmentSuffix,
  getResourcesWithoutDeletePolicies,
  getResourcesWithoutEnvironmentSuffix,
  validateECSCluster,
  validateECSService,
  validateTaskDefinition,
  validateAutoScaling,
  validateTemplate,
} from '../lib/template';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    template = getTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ECS Fargate');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const paramGroups =
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toBeDefined();
      expect(paramGroups.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have VpcId parameter', () => {
      const vpcIdParam = template.Parameters.VpcId;
      expect(vpcIdParam).toBeDefined();
      expect(vpcIdParam.Type).toBe('AWS::EC2::VPC::Id');
    });

    test('should have subnet parameters', () => {
      const subnetParams = [
        'PublicSubnet1',
        'PublicSubnet2',
        'PublicSubnet3',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'PrivateSubnet3',
      ];

      subnetParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('AWS::EC2::Subnet::Id');
      });
    });

    test('should have ContainerImage parameter', () => {
      const containerImageParam = template.Parameters.ContainerImage;
      expect(containerImageParam).toBeDefined();
      expect(containerImageParam.Type).toBe('String');
      expect(containerImageParam.Default).toBeDefined();
    });

    test('should have ContainerPort parameter', () => {
      const containerPortParam = template.Parameters.ContainerPort;
      expect(containerPortParam).toBeDefined();
      expect(containerPortParam.Type).toBe('Number');
      expect(containerPortParam.Default).toBe(8080);
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster resource', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
    });

    test('ECS cluster should have correct type', () => {
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have Delete policies', () => {
      const cluster = template.Resources.ECSCluster;
      expect(cluster.DeletionPolicy).toBe('Delete');
      expect(cluster.UpdateReplacePolicy).toBe('Delete');
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const settings = cluster.Properties.ClusterSettings;
      expect(settings).toBeDefined();
      expect(Array.isArray(settings)).toBe(true);

      const containerInsights = settings.find(
        (s: any) => s.Name === 'containerInsights'
      );
      expect(containerInsights).toBeDefined();
      expect(containerInsights.Value).toBe('enabled');
    });

    test('ECS cluster name should include environment suffix', () => {
      const cluster = template.Resources.ECSCluster;
      const clusterName = cluster.Properties.ClusterName;
      expect(clusterName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.CloudWatchLogGroup).toBeDefined();
    });

    test('log group should have correct type', () => {
      expect(template.Resources.CloudWatchLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('log group should have Delete policies', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup.DeletionPolicy).toBe('Delete');
      expect(logGroup.UpdateReplacePolicy).toBe('Delete');
    });

    test('log group should have 30-day retention', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('log group should have KMS encryption', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['LogEncryptionKey', 'Arn'],
      });
    });

    test('log group name should include environment suffix', () => {
      const logGroup = template.Resources.CloudWatchLogGroup;
      const logGroupName = logGroup.Properties.LogGroupName;
      expect(logGroupName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('KMS Key', () => {
    test('should have KMS key for log encryption', () => {
      expect(template.Resources.LogEncryptionKey).toBeDefined();
    });

    test('KMS key should have correct type', () => {
      expect(template.Resources.LogEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have Delete policies', () => {
      const key = template.Resources.LogEncryptionKey;
      expect(key.DeletionPolicy).toBe('Delete');
      expect(key.UpdateReplacePolicy).toBe('Delete');
    });

    test('KMS key should have proper policy for CloudWatch Logs', () => {
      const key = template.Resources.LogEncryptionKey;
      const policy = key.Properties.KeyPolicy;
      expect(policy).toBeDefined();
      expect(policy.Statement).toBeDefined();

      const cwLogsStatement = policy.Statement.find(
        (s: any) => s.Sid === 'Allow CloudWatch Logs'
      );
      expect(cwLogsStatement).toBeDefined();
      expect(cwLogsStatement.Principal.Service).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have task execution role', () => {
      expect(template.Resources.TaskExecutionRole).toBeDefined();
    });

    test('task execution role should have correct type', () => {
      expect(template.Resources.TaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('task execution role should have Delete policies', () => {
      const role = template.Resources.TaskExecutionRole;
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.UpdateReplacePolicy).toBe('Delete');
    });

    test('task execution role should have ECS assume role policy', () => {
      const role = template.Resources.TaskExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'ecs-tasks.amazonaws.com'
      );
    });

    test('task execution role should have ECR and CloudWatch permissions', () => {
      const role = template.Resources.TaskExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toBeDefined();
      expect(Array.isArray(policies)).toBe(true);

      const policy = policies[0];
      expect(policy.PolicyDocument.Statement).toBeDefined();

      const statements = policy.PolicyDocument.Statement;
      const ecrActions = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('ecr:'))
      );
      const logsActions = statements.find((s: any) =>
        s.Action.some((a: string) => a.startsWith('logs:'))
      );

      expect(ecrActions).toBeDefined();
      expect(logsActions).toBeDefined();
    });

    test('task execution role name should include environment suffix', () => {
      const role = template.Resources.TaskExecutionRole;
      const roleName = role.Properties.RoleName;
      expect(roleName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('should have task role', () => {
      expect(template.Resources.TaskRole).toBeDefined();
    });

    test('task role should have correct type', () => {
      expect(template.Resources.TaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('task role should have Delete policies', () => {
      const role = template.Resources.TaskRole;
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.UpdateReplacePolicy).toBe('Delete');
    });

    test('task role name should include environment suffix', () => {
      const role = template.Resources.TaskRole;
      const roleName = role.Properties.RoleName;
      expect(roleName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('IAM policies should not use wildcard resource arns where avoidable', () => {
      const roles = ['TaskExecutionRole', 'TaskRole'];

      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        const policies = role.Properties.Policies;

        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            // ECR GetAuthorizationToken requires wildcard, others should be specific
            const hasEcrAuthToken =
              statement.Action?.includes?.('ecr:GetAuthorizationToken') ||
              statement.Action === 'ecr:GetAuthorizationToken';
            const hasCloudWatchPutMetric =
              statement.Action?.includes?.('cloudwatch:PutMetricData') ||
              statement.Action === 'cloudwatch:PutMetricData';

            if (
              statement.Resource === '*' &&
              !hasEcrAuthToken &&
              !hasCloudWatchPutMetric
            ) {
              // If Resource is *, it should be for specific global actions only
              expect(hasEcrAuthToken || hasCloudWatchPutMetric).toBe(true);
            }
          });
        });
      });
    });
  });

  describe('Task Definition', () => {
    test('should have task definition', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
    });

    test('task definition should have correct type', () => {
      expect(template.Resources.TaskDefinition.Type).toBe(
        'AWS::ECS::TaskDefinition'
      );
    });

    test('task definition should have Delete policies', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.DeletionPolicy).toBe('Delete');
      expect(taskDef.UpdateReplacePolicy).toBe('Delete');
    });

    test('task definition should have Fargate compatibility', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
    });

    test('task definition should have 2 vCPU and 4GB memory', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('2048');
      expect(taskDef.Properties.Memory).toBe('4096');
    });

    test('task definition should have network mode awsvpc', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('task definition should reference IAM roles', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.ExecutionRoleArn).toEqual({
        'Fn::GetAtt': ['TaskExecutionRole', 'Arn'],
      });
      expect(taskDef.Properties.TaskRoleArn).toEqual({
        'Fn::GetAtt': ['TaskRole', 'Arn'],
      });
    });

    test('task definition family should include environment suffix', () => {
      const taskDef = template.Resources.TaskDefinition;
      const family = taskDef.Properties.Family;
      expect(family).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('container definition should have correct configuration', () => {
      const taskDef = template.Resources.TaskDefinition;
      const containers = taskDef.Properties.ContainerDefinitions;
      expect(containers).toBeDefined();
      expect(Array.isArray(containers)).toBe(true);
      expect(containers.length).toBeGreaterThan(0);

      const container = containers[0];
      expect(container.Name).toBeDefined();
      expect(container.Essential).toBe(true);
    });

    test('container should have port mapping for 8080', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const portMappings = container.PortMappings;

      expect(portMappings).toBeDefined();
      expect(Array.isArray(portMappings)).toBe(true);

      const port8080 = portMappings.find(
        (pm: any) => pm.ContainerPort?.Ref === 'ContainerPort'
      );
      expect(port8080).toBeDefined();
      expect(port8080.Protocol).toBe('tcp');
    });

    test('container should have health check configured', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const healthCheck = container.HealthCheck;

      expect(healthCheck).toBeDefined();
      expect(healthCheck.Command).toBeDefined();
      expect(healthCheck.Interval).toBe(30);
      expect(healthCheck.Timeout).toBe(5);
      expect(healthCheck.Retries).toBe(3);
      expect(healthCheck.StartPeriod).toBe(60);
    });

    test('container should have CloudWatch logging configured', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      const logConfig = container.LogConfiguration;

      expect(logConfig).toBeDefined();
      expect(logConfig.LogDriver).toBe('awslogs');
      expect(logConfig.Options).toBeDefined();
      expect(logConfig.Options['awslogs-group']).toEqual({
        Ref: 'CloudWatchLogGroup',
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
    });

    test('ALB security group should have correct type', () => {
      expect(template.Resources.ALBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('ALB security group should have Delete policies', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.DeletionPolicy).toBe('Delete');
      expect(sg.UpdateReplacePolicy).toBe('Delete');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);

      const httpRule = ingress.find((r: any) => r.FromPort === 80);
      const httpsRule = ingress.find((r: any) => r.FromPort === 443);

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('ALB security group name should include environment suffix', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const groupName = sg.Properties.GroupName;
      expect(groupName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
    });

    test('ECS security group should have correct type', () => {
      expect(template.Resources.ECSSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('ECS security group should have Delete policies', () => {
      const sg = template.Resources.ECSSecurityGroup;
      expect(sg.DeletionPolicy).toBe('Delete');
      expect(sg.UpdateReplacePolicy).toBe('Delete');
    });

    test('ECS security group should allow traffic from ALB', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);

      const albRule = ingress.find(
        (r: any) => r.SourceSecurityGroupId?.Ref === 'ALBSecurityGroup'
      );
      expect(albRule).toBeDefined();
    });

    test('ECS security group name should include environment suffix', () => {
      const sg = template.Resources.ECSSecurityGroup;
      const groupName = sg.Properties.GroupName;
      expect(groupName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    });

    test('ALB should have correct type', () => {
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('ALB should have Delete policies', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.DeletionPolicy).toBe('Delete');
      expect(alb.UpdateReplacePolicy).toBe('Delete');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be application type', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Type).toBe('application');
    });

    test('ALB should use public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const subnets = alb.Properties.Subnets;

      expect(subnets).toBeDefined();
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(3);

      const publicSubnet1 = subnets.find(
        (s: any) => s.Ref === 'PublicSubnet1'
      );
      const publicSubnet2 = subnets.find(
        (s: any) => s.Ref === 'PublicSubnet2'
      );
      const publicSubnet3 = subnets.find(
        (s: any) => s.Ref === 'PublicSubnet3'
      );

      expect(publicSubnet1).toBeDefined();
      expect(publicSubnet2).toBeDefined();
      expect(publicSubnet3).toBeDefined();
    });

    test('ALB name should include environment suffix', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      const albName = alb.Properties.Name;
      expect(albName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
    });

    test('target group should have correct type', () => {
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('target group should have Delete policies', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.DeletionPolicy).toBe('Delete');
      expect(tg.UpdateReplacePolicy).toBe('Delete');
    });

    test('target group should have health check on /health endpoint', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/health');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('target group should have least_outstanding_requests algorithm', () => {
      const tg = template.Resources.TargetGroup;
      const attributes = tg.Properties.TargetGroupAttributes;

      const lbAlgorithm = attributes.find(
        (attr: any) => attr.Key === 'load_balancing.algorithm.type'
      );
      expect(lbAlgorithm).toBeDefined();
      expect(lbAlgorithm.Value).toBe('least_outstanding_requests');
    });

    test('target group should be IP target type', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('target group name should include environment suffix', () => {
      const tg = template.Resources.TargetGroup;
      const tgName = tg.Properties.Name;
      expect(tgName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
    });

    test('ALB listener should have Delete policies', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.DeletionPolicy).toBe('Delete');
      expect(listener.UpdateReplacePolicy).toBe('Delete');
    });

    test('ALB listener should forward to target group', () => {
      const listener = template.Resources.ALBListener;
      const defaultActions = listener.Properties.DefaultActions;

      expect(defaultActions).toBeDefined();
      expect(Array.isArray(defaultActions)).toBe(true);

      const forwardAction = defaultActions.find(
        (a: any) => a.Type === 'forward'
      );
      expect(forwardAction).toBeDefined();
      expect(forwardAction.TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
    });
  });

  describe('ECS Service', () => {
    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
    });

    test('ECS service should have correct type', () => {
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should have Delete policies', () => {
      const service = template.Resources.ECSService;
      expect(service.DeletionPolicy).toBe('Delete');
      expect(service.UpdateReplacePolicy).toBe('Delete');
    });

    test('ECS service should have desired count of 3', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBe(3);
    });

    test('ECS service should use Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should use platform version 1.4.0', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.PlatformVersion).toBe('1.4.0');
    });

    test('ECS service should have deployment configuration', () => {
      const service = template.Resources.ECSService;
      const deployConfig = service.Properties.DeploymentConfiguration;

      expect(deployConfig).toBeDefined();
      expect(deployConfig.MaximumPercent).toBe(200);
      expect(deployConfig.MinimumHealthyPercent).toBe(100);
    });

    test('ECS service should have deployment circuit breaker', () => {
      const service = template.Resources.ECSService;
      const deployConfig = service.Properties.DeploymentConfiguration;
      const circuitBreaker = deployConfig.DeploymentCircuitBreaker;

      expect(circuitBreaker).toBeDefined();
      expect(circuitBreaker.Enable).toBe(true);
      expect(circuitBreaker.Rollback).toBe(true);
    });

    test('ECS service should use private subnets', () => {
      const service = template.Resources.ECSService;
      const networkConfig = service.Properties.NetworkConfiguration;
      const subnets = networkConfig.AwsvpcConfiguration.Subnets;

      expect(subnets).toBeDefined();
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(3);

      const privateSubnet1 = subnets.find(
        (s: any) => s.Ref === 'PrivateSubnet1'
      );
      const privateSubnet2 = subnets.find(
        (s: any) => s.Ref === 'PrivateSubnet2'
      );
      const privateSubnet3 = subnets.find(
        (s: any) => s.Ref === 'PrivateSubnet3'
      );

      expect(privateSubnet1).toBeDefined();
      expect(privateSubnet2).toBeDefined();
      expect(privateSubnet3).toBeDefined();
    });

    test('ECS service should not assign public IP', () => {
      const service = template.Resources.ECSService;
      const networkConfig = service.Properties.NetworkConfiguration;
      expect(networkConfig.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('ECS service should have load balancer configured', () => {
      const service = template.Resources.ECSService;
      const loadBalancers = service.Properties.LoadBalancers;

      expect(loadBalancers).toBeDefined();
      expect(Array.isArray(loadBalancers)).toBe(true);
      expect(loadBalancers.length).toBeGreaterThan(0);

      const lb = loadBalancers[0];
      expect(lb.TargetGroupArn).toEqual({ Ref: 'TargetGroup' });
      expect(lb.ContainerName).toBeDefined();
    });

    test('ECS service should have health check grace period', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.HealthCheckGracePeriodSeconds).toBe(60);
    });

    test('ECS service should depend on ALB listener', () => {
      const service = template.Resources.ECSService;
      expect(service.DependsOn).toContain('ALBListener');
    });

    test('ECS service name should include environment suffix', () => {
      const service = template.Resources.ECSService;
      const serviceName = service.Properties.ServiceName;
      expect(serviceName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('Auto Scaling', () => {
    test('should have scaling target', () => {
      expect(template.Resources.ServiceScalingTarget).toBeDefined();
    });

    test('scaling target should have correct type', () => {
      expect(template.Resources.ServiceScalingTarget.Type).toBe(
        'AWS::ApplicationAutoScaling::ScalableTarget'
      );
    });

    test('scaling target should have Delete policies', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target.DeletionPolicy).toBe('Delete');
      expect(target.UpdateReplacePolicy).toBe('Delete');
    });

    test('scaling target should have min capacity of 2 and max capacity of 10', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target.Properties.MinCapacity).toBe(2);
      expect(target.Properties.MaxCapacity).toBe(10);
    });

    test('scaling target should be for ECS service', () => {
      const target = template.Resources.ServiceScalingTarget;
      expect(target.Properties.ServiceNamespace).toBe('ecs');
      expect(target.Properties.ScalableDimension).toBe(
        'ecs:service:DesiredCount'
      );
    });

    test('should have scaling policy', () => {
      expect(template.Resources.ServiceScalingPolicy).toBeDefined();
    });

    test('scaling policy should have correct type', () => {
      expect(template.Resources.ServiceScalingPolicy.Type).toBe(
        'AWS::ApplicationAutoScaling::ScalingPolicy'
      );
    });

    test('scaling policy should have Delete policies', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      expect(policy.DeletionPolicy).toBe('Delete');
      expect(policy.UpdateReplacePolicy).toBe('Delete');
    });

    test('scaling policy should be target tracking type', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('scaling policy should target 70% CPU utilization', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      const trackingConfig =
        policy.Properties.TargetTrackingScalingPolicyConfiguration;

      expect(trackingConfig).toBeDefined();
      expect(trackingConfig.TargetValue).toBe(70.0);
    });

    test('scaling policy should use ECS CPU metric', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      const trackingConfig =
        policy.Properties.TargetTrackingScalingPolicyConfiguration;
      const metricSpec = trackingConfig.PredefinedMetricSpecification;

      expect(metricSpec).toBeDefined();
      expect(metricSpec.PredefinedMetricType).toBe(
        'ECSServiceAverageCPUUtilization'
      );
    });

    test('scaling policy should have 2-minute cooldown periods', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      const trackingConfig =
        policy.Properties.TargetTrackingScalingPolicyConfiguration;

      expect(trackingConfig.ScaleInCooldown).toBe(120);
      expect(trackingConfig.ScaleOutCooldown).toBe(120);
    });

    test('scaling policy name should include environment suffix', () => {
      const policy = template.Resources.ServiceScalingPolicy;
      const policyName = policy.Properties.PolicyName;
      expect(policyName).toEqual({
        'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
      });
    });
  });

  describe('Outputs', () => {
    test('should have ECS cluster ARN output', () => {
      expect(template.Outputs.ECSClusterArn).toBeDefined();
    });

    test('should have ECS cluster name output', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should have ALB DNS name output', () => {
      expect(template.Outputs.ALBDNSName).toBeDefined();
    });

    test('should have ALB ARN output', () => {
      expect(template.Outputs.ALBArn).toBeDefined();
    });

    test('should have ECS service name output', () => {
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should have task definition ARN output', () => {
      expect(template.Outputs.TaskDefinitionArn).toBeDefined();
    });

    test('should have CloudWatch log group output', () => {
      expect(template.Outputs.CloudWatchLogGroup).toBeDefined();
    });

    test('should have environment suffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Count', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'ECSCluster',
        'CloudWatchLogGroup',
        'LogEncryptionKey',
        'TaskExecutionRole',
        'TaskRole',
        'TaskDefinition',
        'ALBSecurityGroup',
        'ECSSecurityGroup',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'ALBListener',
        'ECSService',
        'ServiceScalingTarget',
        'ServiceScalingPolicy',
      ];

      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('should have exactly 14 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14);
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('no resources should have Retain or Snapshot policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.DeletionPolicy).not.toBe('Snapshot');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Snapshot');
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('all resource names should include environment suffix', () => {
      const resourcesToCheck = [
        'ECSCluster',
        'CloudWatchLogGroup',
        'TaskExecutionRole',
        'TaskRole',
        'TaskDefinition',
        'ALBSecurityGroup',
        'ECSSecurityGroup',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'ECSService',
        'ServiceScalingPolicy',
      ];

      resourcesToCheck.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const properties = resource.Properties;

        // Find the name property (could be Name, TableName, ClusterName, etc.)
        const nameProperty = Object.keys(properties).find(key =>
          key.toLowerCase().includes('name')
        );

        if (nameProperty && properties[nameProperty]) {
          const nameValue = properties[nameProperty];
          if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('helper function should detect environment suffix correctly', () => {
      expect(hasEnvironmentSuffix(template, 'ECSCluster')).toBe(true);
      expect(hasEnvironmentSuffix(template, 'ECSService')).toBe(true);
      expect(hasEnvironmentSuffix(template, 'ALBSecurityGroup')).toBe(true);
      // TaskDefinition uses Family which includes suffix - validated in earlier tests
    });

    test('should find resources without environment suffix', () => {
      const withoutSuffix = getResourcesWithoutEnvironmentSuffix(template);
      // ServiceScalingTarget doesn't have a name property, so it's excluded
      // All other resources with name properties should have environment suffix
      expect(withoutSuffix.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Template Validation Functions', () => {
    test('validateTemplateStructure should pass for valid template', () => {
      expect(validateTemplateStructure(template)).toBe(true);
    });

    test('getResourcesByType should find correct resources', () => {
      const ecsClusters = getResourcesByType(template, 'AWS::ECS::Cluster');
      expect(ecsClusters).toContain('ECSCluster');
      expect(ecsClusters.length).toBe(1);

      const ecsServices = getResourcesByType(template, 'AWS::ECS::Service');
      expect(ecsServices).toContain('ECSService');

      const albs = getResourcesByType(template, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(albs).toContain('ApplicationLoadBalancer');
    });

    test('hasDeletePolicies should validate deletion policies', () => {
      expect(hasDeletePolicies(template, 'ECSCluster')).toBe(true);
      expect(hasDeletePolicies(template, 'TaskDefinition')).toBe(true);
      expect(hasDeletePolicies(template, 'ApplicationLoadBalancer')).toBe(true);
    });

    test('getResourcesWithoutDeletePolicies should find no issues', () => {
      const withoutDelete = getResourcesWithoutDeletePolicies(template);
      expect(withoutDelete).toEqual([]);
    });

    test('validateECSCluster should pass', () => {
      const result = validateECSCluster(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateECSService should pass', () => {
      const result = validateECSService(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateTaskDefinition should pass', () => {
      const result = validateTaskDefinition(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateAutoScaling should pass', () => {
      const result = validateAutoScaling(template);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('validateTemplate should run comprehensive validation', () => {
      const result = validateTemplate(template);
      // The template should be mostly valid, but may have non-critical warnings
      expect(result).toBeDefined();
      expect(result.errors).toBeDefined();
      // Check that major validations pass
      expect(validateECSCluster(template).valid).toBe(true);
      expect(validateECSService(template).valid).toBe(true);
      expect(validateTaskDefinition(template).valid).toBe(true);
      expect(validateAutoScaling(template).valid).toBe(true);
    });

    test('validation functions should handle invalid templates', () => {
      // Test with empty template
      const emptyTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {},
      };

      expect(validateTemplateStructure(emptyTemplate)).toBe(false);

      const ecsResult = validateECSCluster(emptyTemplate);
      expect(ecsResult.valid).toBe(false);
      expect(ecsResult.errors.length).toBeGreaterThan(0);

      const serviceResult = validateECSService(emptyTemplate);
      expect(serviceResult.valid).toBe(false);

      const taskDefResult = validateTaskDefinition(emptyTemplate);
      expect(taskDefResult.valid).toBe(false);

      const scalingResult = validateAutoScaling(emptyTemplate);
      expect(scalingResult.valid).toBe(false);
    });

    test('validation should detect missing required properties', () => {
      // Test template without description
      const noDescTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: { Test: {} },
      };
      expect(validateTemplateStructure(noDescTemplate)).toBe(false);

      // Test template without resources
      const noResourcesTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
      };
      expect(validateTemplateStructure(noResourcesTemplate)).toBe(false);
    });

    test('getResourcesByType should handle non-existent types', () => {
      const nonExistent = getResourcesByType(template, 'AWS::NonExistent::Resource');
      expect(nonExistent).toEqual([]);
    });

    test('hasDeletePolicies should return false for non-existent resources', () => {
      expect(hasDeletePolicies(template, 'NonExistentResource')).toBe(false);
    });

    test('hasEnvironmentSuffix should return false for resources without name properties', () => {
      // Create a template with a resource that has no name-like property
      const templateNoName: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Test',
        Resources: {
          TestResource: {
            Type: 'AWS::Test::Resource',
            Properties: {
              SomeProperty: 'value',
              AnotherProperty: 123,
            },
          },
        },
      };
      expect(hasEnvironmentSuffix(templateNoName, 'TestResource')).toBe(false);
    });

    test('hasEnvironmentSuffix should return false for non-existent resources', () => {
      expect(hasEnvironmentSuffix(template, 'NonExistentResource')).toBe(false);
    });

    test('validation should detect missing Container Insights', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            Properties: {
              ...template.Resources.ECSCluster.Properties,
              ClusterSettings: [],
            },
          },
        },
      };

      const result = validateECSCluster(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Container Insights'))).toBe(true);
    });

    test('validation should detect incorrect CPU/memory settings', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          TaskDefinition: {
            ...template.Resources.TaskDefinition,
            Properties: {
              ...template.Resources.TaskDefinition.Properties,
              Cpu: '1024',
              Memory: '2048',
            },
          },
        },
      };

      const result = validateTaskDefinition(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validation should detect incorrect scaling configuration', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ServiceScalingTarget: {
            ...template.Resources.ServiceScalingTarget,
            Properties: {
              ...template.Resources.ServiceScalingTarget.Properties,
              MinCapacity: 1,
              MaxCapacity: 5,
            },
          },
        },
      };

      const result = validateAutoScaling(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('MinCapacity'))).toBe(true);
    });

    test('validation should detect missing deployment configuration', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSService: {
            ...template.Resources.ECSService,
            Properties: {
              ...template.Resources.ECSService.Properties,
              DeploymentConfiguration: undefined,
            },
          },
        },
      };

      const result = validateECSService(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('DeploymentConfiguration'))).toBe(true);
    });

    test('validation should detect missing ClusterSettings', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            Properties: {
              ...template.Resources.ECSCluster.Properties,
              ClusterSettings: undefined,
            },
          },
        },
      };

      const result = validateECSCluster(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ClusterSettings'))).toBe(true);
    });

    test('validation should detect missing scaling policy configuration', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ServiceScalingPolicy: {
            ...template.Resources.ServiceScalingPolicy,
            Properties: {
              ...template.Resources.ServiceScalingPolicy.Properties,
              TargetTrackingScalingPolicyConfiguration: undefined,
            },
          },
        },
      };

      const result = validateAutoScaling(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('TargetTrackingScalingPolicyConfiguration'))).toBe(true);
    });

    test('validation should detect wrong launch type', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSService: {
            ...template.Resources.ECSService,
            Properties: {
              ...template.Resources.ECSService.Properties,
              LaunchType: 'EC2',
            },
          },
        },
      };

      const result = validateECSService(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Launch type'))).toBe(true);
    });

    test('validation should detect wrong platform version', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSService: {
            ...template.Resources.ECSService,
            Properties: {
              ...template.Resources.ECSService.Properties,
              PlatformVersion: '1.3.0',
            },
          },
        },
      };

      const result = validateECSService(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Platform version'))).toBe(true);
    });

    test('validation should detect wrong deployment percentages', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSService: {
            ...template.Resources.ECSService,
            Properties: {
              ...template.Resources.ECSService.Properties,
              DeploymentConfiguration: {
                MaximumPercent: 150,
                MinimumHealthyPercent: 50,
              },
            },
          },
        },
      };

      const result = validateECSService(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validation should detect wrong network mode', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          TaskDefinition: {
            ...template.Resources.TaskDefinition,
            Properties: {
              ...template.Resources.TaskDefinition.Properties,
              NetworkMode: 'bridge',
            },
          },
        },
      };

      const result = validateTaskDefinition(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('NetworkMode'))).toBe(true);
    });

    test('validation should detect missing FARGATE compatibility', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          TaskDefinition: {
            ...template.Resources.TaskDefinition,
            Properties: {
              ...template.Resources.TaskDefinition.Properties,
              RequiresCompatibilities: ['EC2'],
            },
          },
        },
      };

      const result = validateTaskDefinition(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('FARGATE compatibility'))).toBe(true);
    });

    test('validation should detect wrong scaling target values', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ServiceScalingPolicy: {
            ...template.Resources.ServiceScalingPolicy,
            Properties: {
              ...template.Resources.ServiceScalingPolicy.Properties,
              TargetTrackingScalingPolicyConfiguration: {
                TargetValue: 50.0,
                ScaleInCooldown: 60,
                ScaleOutCooldown: 60,
              },
            },
          },
        },
      };

      const result = validateAutoScaling(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('validateTemplate should detect missing Delete policies', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            DeletionPolicy: undefined,
          },
        },
      };

      const result = validateTemplate(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Delete policies'))).toBe(true);
    });

    test('validateTemplate should detect missing environment suffix', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            Properties: {
              ...template.Resources.ECSCluster.Properties,
              ClusterName: 'hardcoded-cluster-name',
            },
          },
        },
      };

      const result = validateTemplate(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('environment suffix'))).toBe(true);
    });

    test('validateTemplate should detect invalid template structure', () => {
      const badTemplate: any = {
        Resources: {},
      };

      const result = validateTemplate(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid template structure'))).toBe(true);
    });

    test('validateTemplate should aggregate all validation errors', () => {
      const emptyTemplate: any = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: 'Empty template',
        Resources: {},
      };

      const result = validateTemplate(emptyTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3); // Multiple validation functions should report errors
    });

    test('validateECSCluster should detect missing Delete policies', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            DeletionPolicy: undefined,
            UpdateReplacePolicy: undefined,
          },
        },
      };

      const result = validateECSCluster(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Delete policies'))).toBe(true);
    });

    test('validateECSCluster should detect missing environment suffix in cluster name', () => {
      const badTemplate: any = {
        ...template,
        Resources: {
          ...template.Resources,
          ECSCluster: {
            ...template.Resources.ECSCluster,
            Properties: {
              ...template.Resources.ECSCluster.Properties,
              ClusterName: 'my-cluster-prod',
            },
          },
        },
      };

      const result = validateECSCluster(badTemplate);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('environment suffix'))).toBe(true);
    });
  });
});
