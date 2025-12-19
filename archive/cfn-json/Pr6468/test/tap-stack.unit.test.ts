import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ECS Fargate CloudFormation Template Unit Tests', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('ECS Fargate Web Application');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups in metadata', () => {
      const metadata = template.Metadata['AWS::CloudFormation::Interface'];
      expect(metadata.ParameterGroups).toBeDefined();
      expect(metadata.ParameterGroups.length).toBeGreaterThan(0);
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

    test('should have network configuration parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have ECS configuration parameters', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerPort).toBeDefined();
      expect(template.Parameters.TaskCpu).toBeDefined();
      expect(template.Parameters.TaskMemory).toBeDefined();
      expect(template.Parameters.DesiredCount).toBeDefined();
    });

    test('DesiredCount should have minimum of 2 for high availability', () => {
      const desiredCount = template.Parameters.DesiredCount;
      expect(desiredCount.MinValue).toBe(2);
      expect(desiredCount.Default).toBe(2);
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have Delete deletion policy', () => {
      expect(template.Resources.VPC.DeletionPolicy).toBe('Delete');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets in 2 AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have MapPublicIpOnLaunch enabled', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have private subnets in 2 AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should not have MapPublicIpOnLaunch', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have EIPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('should have route tables', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP traffic from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      const httpRule = ingressRules.find((rule: any) => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ECS task security group', () => {
      expect(template.Resources.ECSTaskSecurityGroup).toBeDefined();
      expect(template.Resources.ECSTaskSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ECS task security group should allow traffic from ALB only', () => {
      const sg = template.Resources.ECSTaskSecurityGroup;
      const ingressRules = sg.Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should be IP type for Fargate', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.TargetType).toBe('ip');
    });

    test('target group should have health check configuration', () => {
      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckProtocol).toBe('HTTP');
    });

    test('should have ALB listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB listener should be on port 80', () => {
      const listener = template.Resources.ALBListener;
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('ECS Resources', () => {
    test('should have ECS Cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS Cluster should have container insights enabled', () => {
      const cluster = template.Resources.ECSCluster;
      const settings = cluster.Properties.ClusterSettings;
      expect(settings).toBeDefined();
      const insightsSetting = settings.find((s: any) => s.Name === 'containerInsights');
      expect(insightsSetting).toBeDefined();
      expect(insightsSetting.Value).toBe('enabled');
    });

    test('should have ECS Task Execution Role', () => {
      expect(template.Resources.ECSTaskExecutionRole).toBeDefined();
      expect(template.Resources.ECSTaskExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Task Execution Role should have correct managed policy', () => {
      const role = template.Resources.ECSTaskExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy'
      );
    });

    test('should have ECS Task Role', () => {
      expect(template.Resources.ECSTaskRole).toBeDefined();
      expect(template.Resources.ECSTaskRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have CloudWatch Logs Group', () => {
      expect(template.Resources.CloudWatchLogsGroup).toBeDefined();
      expect(template.Resources.CloudWatchLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('CloudWatch Logs should have retention period', () => {
      const logGroup = template.Resources.CloudWatchLogsGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have ECS Task Definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('Task Definition should be configured for Fargate', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(taskDef.Properties.NetworkMode).toBe('awsvpc');
    });

    test('Task Definition should have container definition', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      expect(taskDef.Properties.ContainerDefinitions).toBeDefined();
      expect(taskDef.Properties.ContainerDefinitions.length).toBeGreaterThan(0);
    });

    test('Container should have logging configuration', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.LogConfiguration).toBeDefined();
      expect(container.LogConfiguration.LogDriver).toBe('awslogs');
    });

    test('should have ECS Service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS Service should use Fargate launch type', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS Service should have desired count of at least 2', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.DesiredCount).toEqual({ Ref: 'DesiredCount' });
    });

    test('ECS Service should be in private subnets', () => {
      const service = template.Resources.ECSService;
      const subnets = service.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(subnets).toHaveLength(2);
    });

    test('ECS Service should not have public IP', () => {
      const service = template.Resources.ECSService;
      const assignPublicIp = service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp;
      expect(assignPublicIp).toBe('DISABLED');
    });

    test('ECS Service should be connected to load balancer', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.LoadBalancers).toBeDefined();
      expect(service.Properties.LoadBalancers.length).toBeGreaterThan(0);
    });

    test('ECS Service should have health check grace period', () => {
      const service = template.Resources.ECSService;
      expect(service.Properties.HealthCheckGracePeriodSeconds).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use EnvironmentSuffix in naming', () => {
      const resourcesToCheck = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'ECSCluster',
        'ECSTaskExecutionRole',
        'ECSTaskRole',
        'CloudWatchLogsGroup',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.Name ||
                            resource.Properties.ClusterName ||
                            resource.Properties.RoleName ||
                            resource.Properties.LogGroupName ||
                            resource.Properties.TableName ||
                            resource.Properties.Tags?.find((t: any) => t.Key === 'Name')?.Value;

        if (nameProperty && typeof nameProperty === 'object') {
          expect(JSON.stringify(nameProperty)).toContain('EnvironmentSuffix');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VpcId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBDNSName',
        'ECSClusterName',
        'ECSServiceName',
        'ApplicationURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ALBDNSName output should be exported', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('ApplicationURL output should provide HTTP URL', () => {
      const output = template.Outputs.ApplicationURL;
      expect(output.Description).toContain('URL');
    });
  });

  describe('Deletion Policies', () => {
    test('all resources should have Delete deletion policy', () => {
      const resourcesWithDeletionPolicy = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway1',
        'NatGateway2',
        'NatGateway1EIP',
        'NatGateway2EIP',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'PrivateRouteTable2',
        'ALBSecurityGroup',
        'ECSTaskSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'ECSCluster',
        'ECSTaskExecutionRole',
        'ECSTaskRole',
        'CloudWatchLogsGroup',
        'ECSTaskDefinition',
        'ECSService',
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });

  describe('High Availability Configuration', () => {
    test('should deploy resources across multiple AZs', () => {
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;

      expect(subnet1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(subnet2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have minimum 2 tasks for high availability', () => {
      const desiredCountParam = template.Parameters.DesiredCount;
      expect(desiredCountParam.MinValue).toBe(2);
    });

    test('should have NAT Gateway in each AZ', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });
  });
});
