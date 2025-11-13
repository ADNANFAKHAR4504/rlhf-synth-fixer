import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have the expected description and version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Production-ready containerized product catalog API with RDS Aurora Serverless v2 database'
      );
    });

    test('should expose parameters, resources, and outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter should describe resource naming', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix).toBeDefined();
      expect(envSuffix.Type).toBe('String');
      expect(envSuffix.Default).toBe('dev');
      expect(envSuffix.Description).toBe('Unique suffix for resource naming to avoid conflicts');
    });

    test('TaskCpu parameter should restrict allowed values', () => {
      const taskCpu = template.Parameters.TaskCpu;
      expect(taskCpu.AllowedValues).toEqual(['256', '512', '1024', '2048', '4096']);
      expect(taskCpu.Default).toBe('512');
    });

    test('DesiredCount parameter should define valid range', () => {
      const desiredCount = template.Parameters.DesiredCount;
      expect(desiredCount.MinValue).toBe(1);
      expect(desiredCount.MaxValue).toBe(10);
      expect(desiredCount.Default).toBe(2);
    });
  });

  describe('Core Resources', () => {
    test('VPC should enable DNS support', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('ApplicationLoadBalancer should reference public subnets and ALB security group', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
      expect(alb.Properties.SecurityGroups).toEqual([{ Ref: 'ALBSecurityGroup' }]);
    });

    test('DBCluster should be Aurora PostgreSQL with serverless scaling', () => {
      const dbCluster = template.Resources.DBCluster;
      expect(dbCluster.Type).toBe('AWS::RDS::DBCluster');
      expect(dbCluster.Properties.Engine).toBe('aurora-postgresql');
      expect(dbCluster.Properties.ServerlessV2ScalingConfiguration).toEqual({
        MinCapacity: { Ref: 'MinDatabaseCapacity' },
        MaxCapacity: { Ref: 'MaxDatabaseCapacity' },
      });
      expect(dbCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('ECSService should run a Fargate service in private subnets', () => {
      const ecsService = template.Resources.ECSService;
      expect(ecsService.Type).toBe('AWS::ECS::Service');
      expect(ecsService.Properties.LaunchType).toBe('FARGATE');
      expect(ecsService.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe(
        'DISABLED'
      );
      expect(ecsService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });

    test('ECSTaskDefinition should use the container image parameter and log group', () => {
      const taskDef = template.Resources.ECSTaskDefinition;
      const container = taskDef.Properties.ContainerDefinitions[0];
      expect(container.Image).toEqual({ Ref: 'ContainerImage' });
      expect(container.LogConfiguration.Options['awslogs-group']).toEqual({
        Ref: 'ApplicationLogGroup',
      });
    });
  });

  describe('Outputs', () => {
    test('should expose networking and service outputs', () => {
      expect(template.Outputs.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.LoadBalancerDNS.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(template.Outputs.ECSClusterName.Value).toEqual({ Ref: 'ECSCluster' });
      expect(template.Outputs.DatabaseClusterEndpoint.Value).toEqual({
        'Fn::GetAtt': ['DBCluster', 'Endpoint.Address'],
      });
    });
  });

  describe('Template Summary', () => {
    test('should define expected counts for parameters, resources, and outputs', () => {
      expect(Object.keys(template.Parameters)).toHaveLength(13);
      expect(Object.keys(template.Resources)).toHaveLength(36);
      expect(Object.keys(template.Outputs)).toHaveLength(14);
    });
  });
});
