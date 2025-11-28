import fs from 'fs';
import path from 'path';

describe('Blue-Green ECS Stack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/blue-green-ecs-stack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Blue-Green ECS deployment');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(20);
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have VpcCIDR parameter', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });

    test('should have ContainerPort parameter', () => {
      expect(template.Parameters.ContainerPort).toBeDefined();
      expect(template.Parameters.ContainerPort.Default).toBe(80);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have three public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
    });

    test('should have three private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
      expect(template.Resources.PublicSubnet3.Properties.CidrBlock).toBe('10.0.3.0/24');
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.11.0/24');
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.12.0/24');
      expect(template.Resources.PrivateSubnet3.Properties.CidrBlock).toBe('10.0.13.0/24');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateways for each AZ', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway3EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Network ACL', () => {
    test('should have Network ACL', () => {
      expect(template.Resources.NetworkAcl).toBeDefined();
      expect(template.Resources.NetworkAcl.Type).toBe('AWS::EC2::NetworkAcl');
    });

    test('should allow traffic on port 80', () => {
      const rule = template.Resources.NetworkAclEntryInboundHTTP;
      expect(rule).toBeDefined();
      expect(rule.Properties.PortRange.From).toBe(80);
      expect(rule.Properties.PortRange.To).toBe(80);
    });

    test('should allow traffic on port 443', () => {
      const rule = template.Resources.NetworkAclEntryInboundHTTPS;
      expect(rule).toBeDefined();
      expect(rule.Properties.PortRange.From).toBe(443);
      expect(rule.Properties.PortRange.To).toBe(443);
    });

    test('should allow traffic on port 8080', () => {
      const rule = template.Resources.NetworkAclEntryInbound8080;
      expect(rule).toBeDefined();
      expect(rule.Properties.PortRange.From).toBe(8080);
      expect(rule.Properties.PortRange.To).toBe(8080);
    });

    test('should allow ephemeral ports for return traffic', () => {
      const rule = template.Resources.NetworkAclEntryInboundEphemeral;
      expect(rule).toBeDefined();
      expect(rule.Properties.PortRange.From).toBe(1024);
      expect(rule.Properties.PortRange.To).toBe(65535);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP and HTTPS', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(sg.Properties.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.Properties.SecurityGroupIngress[1].FromPort).toBe(443);
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have blue target group', () => {
      expect(template.Resources.BlueTargetGroup).toBeDefined();
      expect(template.Resources.BlueTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have green target group', () => {
      expect(template.Resources.GreenTargetGroup).toBeDefined();
      expect(template.Resources.GreenTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target groups should have health check interval of 15 seconds', () => {
      expect(template.Resources.BlueTargetGroup.Properties.HealthCheckIntervalSeconds).toBe(15);
      expect(template.Resources.GreenTargetGroup.Properties.HealthCheckIntervalSeconds).toBe(15);
    });

    test('target groups should have deregistration delay of 30 seconds', () => {
      const blueAttrs = template.Resources.BlueTargetGroup.Properties.TargetGroupAttributes;
      const greenAttrs = template.Resources.GreenTargetGroup.Properties.TargetGroupAttributes;

      expect(blueAttrs).toBeDefined();
      expect(greenAttrs).toBeDefined();

      const blueDelay = blueAttrs.find((attr: any) => attr.Key === 'deregistration_delay.timeout_seconds');
      const greenDelay = greenAttrs.find((attr: any) => attr.Key === 'deregistration_delay.timeout_seconds');

      expect(blueDelay.Value).toBe('30');
      expect(greenDelay.Value).toBe('30');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB listener should have weighted routing', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].ForwardConfig).toBeDefined();
      expect(listener.Properties.DefaultActions[0].ForwardConfig.TargetGroups).toHaveLength(2);
    });

    test('ALB listener should route 100% to blue initially', () => {
      const listener = template.Resources.ALBListener;
      const targetGroups = listener.Properties.DefaultActions[0].ForwardConfig.TargetGroups;
      expect(targetGroups[0].Weight).toBe(100);
      expect(targetGroups[1].Weight).toBe(0);
    });
  });

  describe('ECS Cluster', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have Container Insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const setting = cluster.Properties.ClusterSettings.find((s: any) => s.Name === 'containerInsights');
      expect(setting.Value).toBe('enabled');
    });
  });

  describe('IAM Roles', () => {
    test('should have task execution role', () => {
      expect(template.Resources.TaskExecutionRole).toBeDefined();
      expect(template.Resources.TaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have task role', () => {
      expect(template.Resources.TaskRole).toBeDefined();
      expect(template.Resources.TaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('task execution role should have correct managed policy', () => {
      const role = template.Resources.TaskExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy');
    });

    test('task execution role should have Secrets Manager permissions', () => {
      const role = template.Resources.TaskExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'SecretsManagerAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('secretsmanager:GetSecretValue');
    });

    test('task execution role should have ECR permissions', () => {
      const role = template.Resources.TaskExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'ECRAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('ecr:GetAuthorizationToken');
    });

    test('task execution role should have CloudWatch Logs permissions', () => {
      const role = template.Resources.TaskExecutionRole;
      const policy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsAccess');
      expect(policy).toBeDefined();
      expect(policy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
    });
  });

  describe('Task Definition', () => {
    test('should have task definition', () => {
      expect(template.Resources.TaskDefinition).toBeDefined();
      expect(template.Resources.TaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('task definition should have at least 1 vCPU (1024 units)', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.Cpu).toBe('1024');
    });

    test('task definition should have at least 2GB RAM (2048 units)', () => {
      const taskDef = template.Resources.TaskDefinition;
      expect(taskDef.Properties.Memory).toBe('2048');
    });

    test('container should have CPU and memory limits', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Cpu).toBe(1024);
      expect(container.Memory).toBe(2048);
    });

    test('container should have CloudWatch Logs configuration', () => {
      const taskDef = template.Resources.TaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
      expect(container.LogConfiguration.Options['awslogs-stream-prefix']).toBe('ecs');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group', () => {
      expect(template.Resources.LogGroup).toBeDefined();
      expect(template.Resources.LogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have 30-day retention', () => {
      const logGroup = template.Resources.LogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('ECS Services', () => {
    test('should have blue ECS service', () => {
      expect(template.Resources.BlueECSService).toBeDefined();
      expect(template.Resources.BlueECSService.Type).toBe('AWS::ECS::Service');
    });

    test('should have green ECS service', () => {
      expect(template.Resources.GreenECSService).toBeDefined();
      expect(template.Resources.GreenECSService.Type).toBe('AWS::ECS::Service');
    });

    test('both services should have desired count of 3', () => {
      expect(template.Resources.BlueECSService.Properties.DesiredCount).toBe(3);
      expect(template.Resources.GreenECSService.Properties.DesiredCount).toBe(3);
    });

    test('services should have circuit breaker enabled', () => {
      const blueCircuitBreaker = template.Resources.BlueECSService.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;
      const greenCircuitBreaker = template.Resources.GreenECSService.Properties.DeploymentConfiguration.DeploymentCircuitBreaker;

      expect(blueCircuitBreaker.Enable).toBe(true);
      expect(blueCircuitBreaker.Rollback).toBe(true);
      expect(greenCircuitBreaker.Enable).toBe(true);
      expect(greenCircuitBreaker.Rollback).toBe(true);
    });

    test('services should be deployed in private subnets', () => {
      const blueConfig = template.Resources.BlueECSService.Properties.NetworkConfiguration.AwsvpcConfiguration;
      const greenConfig = template.Resources.GreenECSService.Properties.NetworkConfiguration.AwsvpcConfiguration;

      expect(blueConfig.AssignPublicIp).toBe('DISABLED');
      expect(greenConfig.AssignPublicIp).toBe('DISABLED');
    });
  });

  describe('Auto Scaling', () => {
    test('should have scaling target for blue service', () => {
      expect(template.Resources.BlueServiceScalingTarget).toBeDefined();
      expect(template.Resources.BlueServiceScalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('should have scaling target for green service', () => {
      expect(template.Resources.GreenServiceScalingTarget).toBeDefined();
      expect(template.Resources.GreenServiceScalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('scaling targets should have min capacity of 3', () => {
      expect(template.Resources.BlueServiceScalingTarget.Properties.MinCapacity).toBe(3);
      expect(template.Resources.GreenServiceScalingTarget.Properties.MinCapacity).toBe(3);
    });

    test('scaling targets should have max capacity of 10', () => {
      expect(template.Resources.BlueServiceScalingTarget.Properties.MaxCapacity).toBe(10);
      expect(template.Resources.GreenServiceScalingTarget.Properties.MaxCapacity).toBe(10);
    });

    test('should have CPU scaling policy for blue service', () => {
      expect(template.Resources.BlueServiceScalingPolicyCPU).toBeDefined();
      expect(template.Resources.BlueServiceScalingPolicyCPU.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('should have memory scaling policy for blue service', () => {
      expect(template.Resources.BlueServiceScalingPolicyMemory).toBeDefined();
      expect(template.Resources.BlueServiceScalingPolicyMemory.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('should have CPU scaling policy for green service', () => {
      expect(template.Resources.GreenServiceScalingPolicyCPU).toBeDefined();
    });

    test('should have memory scaling policy for green service', () => {
      expect(template.Resources.GreenServiceScalingPolicyMemory).toBeDefined();
    });

    test('CPU scaling should trigger at 70% utilization', () => {
      const bluePolicy = template.Resources.BlueServiceScalingPolicyCPU;
      const greenPolicy = template.Resources.GreenServiceScalingPolicyCPU;

      expect(bluePolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
      expect(greenPolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(70.0);
    });

    test('memory scaling should trigger at 80% utilization', () => {
      const bluePolicy = template.Resources.BlueServiceScalingPolicyMemory;
      const greenPolicy = template.Resources.GreenServiceScalingPolicyMemory;

      expect(bluePolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(80.0);
      expect(greenPolicy.Properties.TargetTrackingScalingPolicyConfiguration.TargetValue).toBe(80.0);
    });
  });

  describe('Service Discovery', () => {
    test('should have service discovery namespace', () => {
      expect(template.Resources.ServiceDiscoveryNamespace).toBeDefined();
      expect(template.Resources.ServiceDiscoveryNamespace.Type).toBe('AWS::ServiceDiscovery::PrivateDnsNamespace');
    });

    test('should have blue service discovery service', () => {
      expect(template.Resources.BlueServiceDiscoveryService).toBeDefined();
      expect(template.Resources.BlueServiceDiscoveryService.Type).toBe('AWS::ServiceDiscovery::Service');
    });

    test('should have green service discovery service', () => {
      expect(template.Resources.GreenServiceDiscoveryService).toBeDefined();
      expect(template.Resources.GreenServiceDiscoveryService.Type).toBe('AWS::ServiceDiscovery::Service');
    });

    test('service discovery should use DNS A records', () => {
      const blueService = template.Resources.BlueServiceDiscoveryService;
      expect(blueService.Properties.DnsConfig.DnsRecords[0].Type).toBe('A');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have SNS topic', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have unhealthy target alarm for blue', () => {
      expect(template.Resources.BlueUnhealthyTargetAlarm).toBeDefined();
      expect(template.Resources.BlueUnhealthyTargetAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have unhealthy target alarm for green', () => {
      expect(template.Resources.GreenUnhealthyTargetAlarm).toBeDefined();
      expect(template.Resources.GreenUnhealthyTargetAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarms should trigger when 2 or more tasks fail', () => {
      expect(template.Resources.BlueUnhealthyTargetAlarm.Properties.Threshold).toBe(2);
      expect(template.Resources.GreenUnhealthyTargetAlarm.Properties.Threshold).toBe(2);
    });

    test('alarms should have 10-minute evaluation period', () => {
      const blueAlarm = template.Resources.BlueUnhealthyTargetAlarm;
      const period = blueAlarm.Properties.Period;
      const evaluationPeriods = blueAlarm.Properties.EvaluationPeriods;
      const totalSeconds = period * evaluationPeriods;

      expect(totalSeconds).toBe(600); // 10 minutes = 600 seconds
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    const resourcesToCheck = [
      'VPC',
      'InternetGateway',
      'PublicSubnet1',
      'PublicSubnet2',
      'PublicSubnet3',
      'PrivateSubnet1',
      'PrivateSubnet2',
      'PrivateSubnet3',
      'NatGateway1EIP',
      'NatGateway2EIP',
      'NatGateway3EIP',
      'NatGateway1',
      'NatGateway2',
      'NatGateway3',
      'PublicRouteTable',
      'PrivateRouteTable1',
      'PrivateRouteTable2',
      'PrivateRouteTable3',
      'NetworkAcl',
      'ALBSecurityGroup',
      'ECSSecurityGroup',
      'ApplicationLoadBalancer',
      'BlueTargetGroup',
      'GreenTargetGroup',
      'ECSCluster',
      'TaskExecutionRole',
      'TaskRole',
      'LogGroup',
      'TaskDefinition',
      'ServiceDiscoveryNamespace',
      'BlueServiceDiscoveryService',
      'GreenServiceDiscoveryService',
      'BlueECSService',
      'GreenECSService',
      'BlueServiceScalingPolicyCPU',
      'BlueServiceScalingPolicyMemory',
      'GreenServiceScalingPolicyCPU',
      'GreenServiceScalingPolicyMemory',
      'SNSTopic',
      'BlueUnhealthyTargetAlarm',
      'GreenUnhealthyTargetAlarm',
    ];

    test('resources should use environmentSuffix in naming', () => {
      const resourcesWithSuffix = new Set<string>();

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (!resource) return;

        const resourceStr = JSON.stringify(resource);
        if (resourceStr.includes('${EnvironmentSuffix}') || resourceStr.includes('EnvironmentSuffix')) {
          resourcesWithSuffix.add(resourceName);
        }
      });

      // At least 80% should use environmentSuffix
      const percentage = (resourcesWithSuffix.size / resourcesToCheck.length) * 100;
      expect(percentage).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ECSClusterName',
        'LoadBalancerDNS',
        'BlueTargetGroupArn',
        'GreenTargetGroupArn',
        'BlueServiceName',
        'GreenServiceName',
        'SNSTopicArn',
        'ServiceDiscoveryNamespace',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('LoadBalancerDNS output should reference ALB DNS name', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Value['Fn::GetAtt']).toEqual(['ApplicationLoadBalancer', 'DNSName']);
    });
  });

  describe('Deletion Policies', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('no resources should have Retain update replace policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40);
    });
  });
});
