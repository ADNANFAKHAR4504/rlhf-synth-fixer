import fs from 'fs';
import path from 'path';

// Note: environmentSuffix is not used in the template, simplifying the tests.
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('ECS Fargate WebApp CloudFormation Template', () => {
  // FIX: Explicitly set the type of 'template' to 'any' or 'object'
  let template: any; 

  beforeAll(() => {
    // Ensure the template is saved in JSON format at this path
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    // The JSON.parse result is assigned to the explicitly typed variable
    template = JSON.parse(templateContent); 
  });

  // --- General Structure Tests ---
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('CloudFormation template to deploy a containerized web application using ECS, Fargate, and ALB');
    });

    test('should have Resources, Parameters, and Outputs sections defined', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // --- Parameters Tests ---
  describe('Parameters', () => {
    const expectedParameters = [
      'VpcCidrBlock', 'PublicSubnet1Cidr', 'PublicSubnet2Cidr',
      'PrivateSubnet1Cidr', 'PrivateSubnet2Cidr', 'ImageEcrRepositoryName'
    ];

    test(`should have exactly ${expectedParameters.length} parameters`, () => {
      expect(Object.keys(template.Parameters).length).toBe(expectedParameters.length);
    });

    expectedParameters.forEach(paramName => {
      test(`should have ${paramName} parameter with type String`, () => {
        expect(template.Parameters[paramName]).toBeDefined();
        expect(template.Parameters[paramName].Type).toBe('String');
      });
    });
  });

  // --- Core Resources Tests ---
  describe('Core ECS & Networking Resources', () => {
    test('VPC resource should be defined', () => {
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VPC.Properties.CidrBlock).toEqual({ Ref: 'VpcCidrBlock' });
    });

    test('Subnets should be defined as EC2::Subnet', () => {
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
    });

    test('ECSCluster should be defined as AWS::ECS::Cluster', () => {
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('EcrRepository should be defined as AWS::ECR::Repository', () => {
      expect(template.Resources.EcrRepository.Type).toBe('AWS::ECR::Repository');
    });

    test('TaskDefinition should use FARGATE compatibility', () => {
      const td = template.Resources.TaskDefinition;
      expect(td.Type).toBe('AWS::ECS::TaskDefinition');
      expect(td.Properties.NetworkMode).toBe('awsvpc');
      expect(td.Properties.RequiresCompatibilities).toContain('FARGATE');
      expect(td.Properties.ExecutionRoleArn).toBeDefined();
      expect(td.Properties.ContainerDefinitions[0].LogConfiguration.LogDriver).toBe('awslogs');
    });

    test('ECSService should use FARGATE launch type and depend on Listener', () => {
      const service = template.Resources.ECSService;
      expect(service.Type).toBe('AWS::ECS::Service');
      expect(service.Properties.LaunchType).toBe('FARGATE');
      expect(service.DependsOn).toContain('Listener');
      expect(service.Properties.NetworkConfiguration.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });
  });

  // --- Load Balancer & Auto Scaling Tests ---
  describe('ALB and Auto Scaling', () => {
    test('ALB should be defined as ElasticLoadBalancingV2::LoadBalancer', () => {
      expect(template.Resources.ALB.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ALB.Properties.Subnets.length).toBe(2);
    });

    test('Listener should forward to TargetGroup', () => {
      const listener = template.Resources.Listener;
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.LoadBalancerArn).toEqual({ Ref: 'ALB' });
    });

    test('ScalingTarget should be an ApplicationAutoScaling::ScalableTarget', () => {
      const target = template.Resources.ScalingTarget;
      expect(target.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
      expect(target.Properties.ScalableDimension).toBe('ecs:service:DesiredCount');
      expect(target.Properties.ServiceNamespace).toBe('ecs');
      expect(target.Properties.MinCapacity).toBe(2);
      expect(target.Properties.MaxCapacity).toBe(4);
      // Ensures the 'Tags' property was correctly removed as per the linter fix
      expect(target.Properties.Tags).toBeUndefined();
    });

    test('ScalingPolicy should use TargetTrackingScaling and correct property name', () => {
      const policy = template.Resources.ScalingPolicyCPU;
      expect(policy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
      expect(policy.Properties.PolicyType).toBe('TargetTrackingScaling');
      // This is the key fix for E3002
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration).toBeDefined(); 
      expect(policy.Properties.TargetTrackingScalingPolicyConfiguration.PredefinedMetricSpecification.PredefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
    });
  });

  // --- Outputs Tests ---
  describe('Outputs', () => {
    const expectedOutputs = [
      'VPCId', 'PublicSubnet1Id', 'PublicSubnet2Id',
      'PrivateSubnet1Id', 'PrivateSubnet2Id', 'EcrRepositoryUri',
      'ECSClusterName', 'ECSServiceName', 'ALBDNSName'
    ];

    test(`should have exactly ${expectedOutputs.length} required outputs`, () => {
      expect(Object.keys(template.Outputs).length).toBe(expectedOutputs.length);
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toContain('DNS name of the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ALB', 'DNSName'],
      });
    });

    test('EcrRepositoryUri output should be correct', () => {
      const output = template.Outputs.EcrRepositoryUri;
      expect(output.Description).toBe('The URI of the ECR repository.');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['EcrRepository', 'RepositoryUri'],
      });
    });
  });
});