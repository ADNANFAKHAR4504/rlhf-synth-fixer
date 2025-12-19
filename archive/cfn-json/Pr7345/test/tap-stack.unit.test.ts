import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
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
      expect(paramGroups.length).toBeGreaterThanOrEqual(2);
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
      expect(containerPortParam.Default).toBe(80);
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have NAT Gateway for private subnet connectivity', () => {
      expect(template.Resources.NATGateway1).toBeDefined();
      expect(template.Resources.NATGateway1.Type).toBe('AWS::EC2::NatGateway');
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster resource', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
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
      expect(template.Resources.CloudWatchLogGroup.Type).toBe('AWS::Logs::LogGroup');
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
  });

  describe('KMS Key', () => {
    test('should have KMS key for log encryption', () => {
      expect(template.Resources.LogEncryptionKey).toBeDefined();
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

    test('should have task role', () => {
      expect(template.Resources.TaskRole).toBeDefined();
      expect(template.Resources.TaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('task role should have Delete policies', () => {
      const role = template.Resources.TaskRole;
      expect(role.DeletionPolicy).toBe('Delete');
      expect(role.UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('Task Definition', () => {
    test('should have task definition', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
      expect(template.Resources.TaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
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

    test('container definition should have correct configuration', () => {
      const taskDef = template.Resources.TaskDefinition;
      const containers = taskDef.Properties.ContainerDefinitions;
      expect(containers).toBeDefined();
      expect(Array.isArray(containers)).toBe(true);
      expect(containers.length).toBeGreaterThan(0);

      const container = containers[0];
      expect(container.Name).toBe('fraud-detector');
      expect(container.Essential).toBe(true);
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
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
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

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
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
  });

  describe('Application Load Balancer', () => {
    test('should have ALB resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
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
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('target group should have Delete policies', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.DeletionPolicy).toBe('Delete');
      expect(tg.UpdateReplacePolicy).toBe('Delete');
    });

    test('target group should have health check configured', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
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
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should have Delete policies', () => {
      const service = template.Resources.ECSService;
      expect(service.DeletionPolicy).toBe('Delete');
      expect(service.UpdateReplacePolicy).toBe('Delete');
    });

    test('ECS service should have desired count of 2', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toBe(2);
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
      expect(lb.ContainerName).toBe('fraud-detector');
    });

    test('ECS service should have health check grace period', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.HealthCheckGracePeriodSeconds).toBe(60);
    });

    test('ECS service should depend on ALB listener', () => {
      const service = template.Resources.ECSService;
      expect(service.DependsOn).toContain('ALBListener');
    });
  });

  describe('Auto Scaling', () => {
    test('should have scaling target', () => {
      expect(template.Resources.ServiceScalingTarget).toBeDefined();
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

  describe('Deletion Policies', () => {
    test('all resources with deletion policies should have Delete set', () => {
      const resourcesWithDeletionPolicy = Object.keys(template.Resources).filter(
        resourceKey => template.Resources[resourceKey].DeletionPolicy
      );

      resourcesWithDeletionPolicy.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).toBe('Delete');
        expect(resource.UpdateReplacePolicy).toBe('Delete');
      });
    });

    test('no resources should have Retain or Snapshot policies', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
          expect(resource.DeletionPolicy).not.toBe('Snapshot');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
          expect(resource.UpdateReplacePolicy).not.toBe('Snapshot');
        }
      });
    });
  });

  describe('Environment Suffix Usage', () => {
    test('resource names should include environment suffix where applicable', () => {
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
  });

  describe('Resource Count', () => {
    test('should have expected critical resources', () => {
      const expectedResources = [
        'VPC',
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
  });
});
