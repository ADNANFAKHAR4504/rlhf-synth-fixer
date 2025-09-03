import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
      expect(template.Description).toBe(
        'High Availability Web Application Infrastructure with Multi-AZ Deployment'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const requiredParameters = [
        'EnvironmentSuffix',
        'InstanceType',
        'DBInstanceClass',
        'DBUsername',
        'MinSize',
        'MaxSize',
        'DesiredCapacity',
        'NotificationEmail',
      ];

      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9-]*$');
    });
  });

  describe('Resources', () => {
    test('should have required resources', () => {
      const requiredResources = [
        'TurnAroundPromptTable',
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'Database',
        'ApplicationLoadBalancer',
        'AutoScalingGroup',
      ];

      requiredResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('Database should have Multi-AZ enabled', () => {
      const db = template.Resources.Database;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.Engine).toBe('mysql');
    });

    test('ApplicationLoadBalancer should have correct properties', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('AutoScalingGroup should have correct properties', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBeDefined();
      expect(asg.Properties.MaxSize).toBeDefined();
      expect(asg.Properties.DesiredCapacity).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have required outputs', () => {
      const requiredOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'DatabaseEndpoint',
        'DatabasePort',
        'LoadBalancerDNS',
        'AutoScalingGroupName',
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
    });

    test('DatabaseEndpoint output should reference the RDS instance', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Address'],
      });
    });

    test('LoadBalancerDNS output should reference the ALB', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });
  });

  describe('Resource Properties Validation', () => {
    test('PublicSubnet1 should have MapPublicIpOnLaunch set to true', () => {
      const subnet = template.Resources.PublicSubnet1;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('PrivateSubnet1 should not have MapPublicIpOnLaunch', () => {
      const subnet = template.Resources.PrivateSubnet1;
      expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
    });

    test('DatabaseSecret should have correct properties', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
    });
  });
});
