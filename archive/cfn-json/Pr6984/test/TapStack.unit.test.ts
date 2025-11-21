import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template;
  const ENVIRONMENT_SUFFIX = 'synth101912542';

  beforeAll(() => {
    const templatePath = join(process.cwd(), 'lib', 'TapStack.json');
    const templateContent = readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-environment');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have EnvironmentName parameter with allowed values', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.ApplicationName.Type).toBe('String');
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });

    test('should have ContainerPort parameter', () => {
      expect(template.Parameters.ContainerPort).toBeDefined();
      expect(template.Parameters.ContainerPort.Type).toBe('Number');
      expect(template.Parameters.ContainerPort.Default).toBe(80);
    });
  });

  describe('Environment Mappings', () => {
    test('should have dev environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig).toBeDefined();
      expect(devConfig.VpcCidr).toBe('10.0.0.0/16');
      expect(devConfig.TaskCpu).toBe('256');
      expect(devConfig.TaskMemory).toBe('512');
    });

    test('should have staging environment configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig).toBeDefined();
      expect(stagingConfig.VpcCidr).toBe('10.1.0.0/16');
      expect(stagingConfig.TaskCpu).toBe('512');
      expect(stagingConfig.TaskMemory).toBe('1024');
    });

    test('should have prod environment configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig).toBeDefined();
      expect(prodConfig.VpcCidr).toBe('10.2.0.0/16');
      expect(prodConfig.TaskCpu).toBe('1024');
      expect(prodConfig.TaskMemory).toBe('2048');
    });

    test('should have unique CIDR blocks per environment', () => {
      const devCidr = template.Mappings.EnvironmentConfig.dev.VpcCidr;
      const stagingCidr = template.Mappings.EnvironmentConfig.staging.VpcCidr;
      const prodCidr = template.Mappings.EnvironmentConfig.prod.VpcCidr;

      expect(devCidr).not.toBe(stagingCidr);
      expect(devCidr).not.toBe(prodCidr);
      expect(stagingCidr).not.toBe(prodCidr);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should use environment-specific CIDR from mapping', () => {
      const vpcCidr = template.Resources.VPC.Properties.CidrBlock;
      expect(vpcCidr).toBeDefined();
      expect(vpcCidr['Fn::FindInMap']).toBeDefined();
    });

    test('VPC should enable DNS support and hostnames', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IP for NAT Gateway', () => {
      expect(template.Resources.EIP).toBeDefined();
      expect(template.Resources.EIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should be in different availability zones', () => {
      const az1 = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const az2 = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(az1).not.toEqual(az2);
    });

    test('private subnets should be in different availability zones', () => {
      const az1 = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const az2 = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      expect(az1).not.toEqual(az2);
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route to Internet Gateway for public subnets', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toBeDefined();
    });

    test('should have route to NAT Gateway for private subnets', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Properties.NatGatewayId).toBeDefined();
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP inbound', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      const httpRule = ingress.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ECS security group should allow traffic from ALB', () => {
      const ingress = template.Resources.ECSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
    });
  });

  describe('ECS Resources', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have name with EnvironmentSuffix', () => {
      const clusterName = template.Resources.ECSCluster.Properties.ClusterName;
      expect(clusterName).toBeDefined();
      expect(clusterName['Fn::Sub']).toBeDefined();
      expect(clusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('task definition should use Fargate', () => {
      const requires = template.Resources.ECSTaskDefinition.Properties.RequiresCompatibilities;
      expect(requires).toContain('FARGATE');
      expect(template.Resources.ECSTaskDefinition.Properties.NetworkMode).toBe('awsvpc');
    });

    test('task definition should have container definition', () => {
      const containers = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions;
      expect(Array.isArray(containers)).toBe(true);
      expect(containers.length).toBeGreaterThan(0);
    });

    test('container definition should have literal string name', () => {
      const containerName = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].Name;
      expect(typeof containerName).toBe('string');
      expect(containerName).toBe('app-container');
    });

    test('container should have port mapping', () => {
      const portMappings = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].PortMappings;
      expect(Array.isArray(portMappings)).toBe(true);
      expect(portMappings.length).toBeGreaterThan(0);
    });

    test('container should have CloudWatch logs configuration', () => {
      const logConfig = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].LogConfiguration;
      expect(logConfig).toBeDefined();
      expect(logConfig.LogDriver).toBe('awslogs');
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should use Fargate launch type', () => {
      expect(template.Resources.ECSService.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should have network configuration', () => {
      const networkConfig = template.Resources.ECSService.Properties.NetworkConfiguration;
      expect(networkConfig).toBeDefined();
      expect(networkConfig.AwsvpcConfiguration).toBeDefined();
      expect(networkConfig.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('ECS service should deploy to private subnets', () => {
      const subnets = template.Resources.ECSService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(2);
    });

    test('ECS service should have load balancer configuration', () => {
      const loadBalancers = template.Resources.ECSService.Properties.LoadBalancers;
      expect(Array.isArray(loadBalancers)).toBe(true);
      expect(loadBalancers.length).toBeGreaterThan(0);
    });

    test('ECS service load balancer should reference correct container name', () => {
      const containerName = template.Resources.ECSService.Properties.LoadBalancers[0].ContainerName;
      expect(containerName).toBe('app-container');
    });

    test('ECS service should have deployment circuit breaker', () => {
      const deploymentConfig = template.Resources.ECSService.Properties.DeploymentConfiguration;
      expect(deploymentConfig.DeploymentCircuitBreaker).toBeDefined();
      expect(deploymentConfig.DeploymentCircuitBreaker.Enable).toBe(true);
    });

    test('should have IAM role for ECS', () => {
      expect(template.Resources.ECSClusterRole).toBeDefined();
      expect(template.Resources.ECSClusterRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.LoadBalancer).toBeDefined();
      expect(template.Resources.LoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.LoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const subnets = template.Resources.LoadBalancer.Properties.Subnets;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(2);
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should use IP target type for Fargate', () => {
      expect(template.Resources.TargetGroup.Properties.TargetType).toBe('ip');
    });

    test('target group should have health check', () => {
      const healthCheck = template.Resources.TargetGroup.Properties.HealthCheckPath;
      expect(healthCheck).toBeDefined();
    });

    test('should have HTTP listener', () => {
      expect(template.Resources.ListenerHTTP).toBeDefined();
      expect(template.Resources.ListenerHTTP.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTP listener should forward to target group', () => {
      const defaultActions = template.Resources.ListenerHTTP.Properties.DefaultActions;
      expect(Array.isArray(defaultActions)).toBe(true);
      expect(defaultActions[0].Type).toBe('forward');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDB table', () => {
      expect(template.Resources.ApplicationTable).toBeDefined();
      expect(template.Resources.ApplicationTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should use PAY_PER_REQUEST billing', () => {
      expect(template.Resources.ApplicationTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have EnvironmentSuffix in name', () => {
      const tableName = template.Resources.ApplicationTable.Properties.TableName;
      expect(tableName).toBeDefined();
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DynamoDB table should have key schema', () => {
      const keySchema = template.Resources.ApplicationTable.Properties.KeySchema;
      expect(Array.isArray(keySchema)).toBe(true);
      expect(keySchema.length).toBeGreaterThan(0);
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('DynamoDB table should have attribute definitions', () => {
      const attributes = template.Resources.ApplicationTable.Properties.AttributeDefinitions;
      expect(Array.isArray(attributes)).toBe(true);
      expect(attributes.length).toBeGreaterThan(0);
    });

    test('DynamoDB table should have streams enabled', () => {
      const streamSpec = template.Resources.ApplicationTable.Properties.StreamSpecification;
      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBeDefined();
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const pitr = template.Resources.ApplicationTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should NOT have DeletionProtection', () => {
      expect(template.Resources.ApplicationTable.Properties.DeletionProtectionEnabled).toBeUndefined();
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have auto scaling target', () => {
      expect(template.Resources.AutoScalingTarget).toBeDefined();
      expect(template.Resources.AutoScalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('auto scaling target should use correct service namespace', () => {
      expect(template.Resources.AutoScalingTarget.Properties.ServiceNamespace).toBe('ecs');
    });

    test('auto scaling target should use correct scalable dimension', () => {
      expect(template.Resources.AutoScalingTarget.Properties.ScalableDimension).toBe('ecs:service:DesiredCount');
    });

    test('auto scaling target should have ResourceId with Fn::Join', () => {
      const resourceId = template.Resources.AutoScalingTarget.Properties.ResourceId;
      expect(resourceId['Fn::Join']).toBeDefined();
    });

    test('should have CPU scaling policy', () => {
      expect(template.Resources.CPUScalingPolicy).toBeDefined();
      expect(template.Resources.CPUScalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('CPU scaling policy should use target tracking', () => {
      expect(template.Resources.CPUScalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('should have memory scaling policy', () => {
      expect(template.Resources.MemoryScalingPolicy).toBeDefined();
      expect(template.Resources.MemoryScalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('memory scaling policy should use target tracking', () => {
      expect(template.Resources.MemoryScalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.CloudWatchLogGroup).toBeDefined();
      expect(template.Resources.CloudWatchLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention period', () => {
      expect(template.Resources.CloudWatchLogGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('should have ECS CPU utilization alarm', () => {
      expect(template.Resources.ECSCPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.ECSCPUUtilizationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DynamoDB throttle alarm', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ALB target health alarm', () => {
      expect(template.Resources.ALBTargetHealthAlarm).toBeDefined();
      expect(template.Resources.ALBTargetHealthAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('dashboard should have DashboardBody as string with Fn::Sub', () => {
      const dashboardBody = template.Resources.CloudWatchDashboard.Properties.DashboardBody;
      expect(dashboardBody['Fn::Sub']).toBeDefined();
      expect(typeof dashboardBody['Fn::Sub']).toBe('string');
    });

    test('should have SNS topic for alarms', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('SSM Parameter Resources', () => {
    test('should have SSM parameter for database endpoint', () => {
      expect(template.Resources.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(template.Resources.SSMParameterDatabaseEndpoint.Type).toBe('AWS::SSM::Parameter');
    });

    test('database endpoint parameter should be SecureString', () => {
      expect(template.Resources.SSMParameterDatabaseEndpoint.Properties.Type).toBe('String');
    });

    test('should have SSM parameter for API key', () => {
      expect(template.Resources.SSMParameterAPIKey).toBeDefined();
      expect(template.Resources.SSMParameterAPIKey.Type).toBe('AWS::SSM::Parameter');
    });

    test('API key parameter should be String', () => {
      expect(template.Resources.SSMParameterAPIKey.Properties.Type).toBe('String');
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('should output public subnet IDs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
    });

    test('should output private subnet IDs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should output ECS cluster name', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should output ECS service name', () => {
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should output Load Balancer DNS', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should output DynamoDB table name', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
    });

    test('should output DynamoDB table ARN', () => {
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
    });
  });

  describe('EnvironmentSuffix Usage', () => {
    test('VPC should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ECS Cluster should use EnvironmentSuffix in name', () => {
      const clusterName = template.Resources.ECSCluster.Properties.ClusterName;
      expect(clusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DynamoDB table should use EnvironmentSuffix in name', () => {
      const tableName = template.Resources.ApplicationTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Load Balancer should use EnvironmentSuffix in name', () => {
      const lbName = template.Resources.LoadBalancer.Properties.Name;
      expect(lbName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatch log group should use EnvironmentSuffix', () => {
      const logGroupName = template.Resources.CloudWatchLogGroup.Properties.LogGroupName;
      expect(logGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic should use EnvironmentSuffix in name', () => {
      const topicName = template.Resources.SNSTopic.Properties.TopicName;
      expect(topicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('No Retain Policies', () => {
    test('DynamoDB table should NOT have RetainPolicy', () => {
      expect(template.Resources.ApplicationTable.DeletionPolicy).toBeUndefined();
      expect(template.Resources.ApplicationTable.UpdateReplacePolicy).toBeUndefined();
    });

    test('CloudWatch log group should NOT have RetainPolicy', () => {
      expect(template.Resources.CloudWatchLogGroup.DeletionPolicy).toBeUndefined();
      expect(template.Resources.CloudWatchLogGroup.UpdateReplacePolicy).toBeUndefined();
    });

    test('no resources should have Retain deletion policy', () => {
      const resources = Object.values(template.Resources) as Array<{ DeletionPolicy?: string }>;
      const retainResources = resources.filter(r => r.DeletionPolicy === 'Retain');
      expect(retainResources.length).toBe(0);
    });
  });

  describe('Resource Count', () => {
    test('should have at least 30 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });
});
