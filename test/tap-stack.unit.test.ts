import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: Record<string, any>;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
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
      expect(template.Description).toBe(
        'IaC - AWS Nova Model Breaking - High Availability Web Application Infrastructure'
      );
    });

    test('should validate CloudFormation template structure', () => {
      // Test that the template has all required sections
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'Environment',
        'InstanceType',
        'DBInstanceClass',
        'KeyPairName',
        'AllowedCIDR',
        'ResourceNamePrefix',
      ];

      expectedParams.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('IaC - AWS Nova Model Breaking');
      expect(param.Description).toBe('Project name for resource tagging');
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual([
        'development',
        'staging',
        'production',
      ]);
      expect(param.Description).toBe('Environment type');
    });

    test('InstanceType parameter should have correct properties', () => {
      const param = template.Parameters.InstanceType;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('t3.medium');
      expect(param.AllowedValues).toEqual([
        't3.small',
        't3.medium',
        't3.large',
        't3.xlarge',
      ]);
      expect(param.Description).toBe('EC2 instance type for web servers');
    });
  });

  describe('Resources', () => {
    test('should have VPC and networking resources', () => {
      const networkingResources = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
      ];

      networkingResources.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
      });
    });

    test('should have security groups', () => {
      const securityGroups = [
        'LoadBalancerSecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
      ];

      securityGroups.forEach(resourceName => {
        expect(template.Resources[resourceName]).toBeDefined();
        expect(template.Resources[resourceName].Type).toBe(
          'AWS::EC2::SecurityGroup'
        );
      });
    });

    test('should have RDS database', () => {
      const database = template.Resources.Database;
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::RDS::DBInstance');
      expect(database.Properties.Engine).toBe('mysql');
      expect(database.Properties.MultiAZ).toBe(true);
    });

    test('should have Application Load Balancer', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(0);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have CloudWatch alarms', () => {
      const alarms = ['CPUAlarmHigh', 'CPUAlarmLow', 'DatabaseCPUAlarm'];

      alarms.forEach(alarmName => {
        expect(template.Resources[alarmName]).toBeDefined();
        expect(template.Resources[alarmName].Type).toBe(
          'AWS::CloudWatch::Alarm'
        );
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerURL',
        'LoadBalancerDNSName',
        'DatabaseEndpoint',
        'DatabasePort',
        'AutoScalingGroupName',
        'SNSTopicArn',
        'PublicSubnets',
        'PrivateSubnets',
        'Region',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Description).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPC-ID',
      });
    });

    test('LoadBalancerURL output should be correct', () => {
      const output = template.Outputs.LoadBalancerURL;
      expect(output.Description).toBe('Application Load Balancer URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'http://${ApplicationLoadBalancer.DNSName}',
      });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Address'],
      });
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

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });

    test('should have substantial number of resources for HA architecture', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // High availability architecture should have many resources
    });
  });

  describe('High Availability Features', () => {
    test('should have multi-AZ deployment', () => {
      // Check for resources in multiple AZs
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have redundant NAT gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
    });

    test('should have auto scaling configured', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toBeGreaterThanOrEqual(0);
      expect(asg.Properties.MaxSize).toBeGreaterThan(asg.Properties.MinSize);
      expect(asg.Properties.DesiredCapacity).toBeGreaterThan(0);
    });

    test('should have RDS Multi-AZ enabled', () => {
      const database = template.Resources.Database;
      expect(database.Properties.MultiAZ).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have proper tags', () => {
      const vpc = template.Resources.VPC;
      const tags = vpc.Properties.Tags;
      expect(tags).toBeDefined();

      const nameTag = tags.find((tag: { Key: string }) => tag.Key === 'Name');
      const projectTag = tags.find(
        (tag: { Key: string }) => tag.Key === 'Project'
      );
      const envTag = tags.find(
        (tag: { Key: string }) => tag.Key === 'Environment'
      );

      expect(nameTag).toBeDefined();
      expect(projectTag).toBeDefined();
      expect(envTag).toBeDefined();
    });
  });
});
