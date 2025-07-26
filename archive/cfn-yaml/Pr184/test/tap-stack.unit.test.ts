import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Multi-Environment CloudFormation Template for Dev, Test, and Production Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameters, mappings, conditions, resources, and outputs', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = ['EnvironmentSuffix', 'Environment', 'Owner', 'CostCenter'];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('Environment parameter should have correct allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual(['dev', 'test', 'prod']);
      expect(param.Default).toBe('dev');
    });
  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have configurations for all environments', () => {
      const envs = ['dev', 'test', 'prod'];
      envs.forEach(env => {
        expect(template.Mappings.EnvironmentConfig[env]).toBeDefined();
        expect(template.Mappings.EnvironmentConfig[env].InstanceType).toBeDefined();
        expect(template.Mappings.EnvironmentConfig[env].MinSize).toBeDefined();
        expect(template.Mappings.EnvironmentConfig[env].MaxSize).toBeDefined();
      });
    });

    test('production should have larger instance types', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.InstanceType).toBe('m5.large');
      expect(prodConfig.MinSize).toBeGreaterThan(1);
    });
  });

  describe('Conditions', () => {
    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have internet gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public and private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should have NAT gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });

    test('should have route tables configured correctly', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });
  });

  describe('Security and IAM', () => {
    test('should have EC2 IAM role with least privilege', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
    });

    test('should have security groups with proper restrictions', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
    });

    test('web server security group should restrict SSH access in production', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const sshRule = webSG.Properties.SecurityGroupIngress.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.CidrIp).toEqual({
        'Fn::If': ['IsProduction', '10.0.0.0/16', '0.0.0.0/0']
      });
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use latest Amazon Linux AMI', () => {
      const launchTemplate = template.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBe(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });
  });

  describe('Monitoring and Compliance', () => {
    test('should have CloudWatch alarm', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
      expect(template.Resources.CPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have SNS topic for notifications', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have AWS Config for production compliance', () => {
      expect(template.Resources.ConfigConfigurationRecorder).toBeDefined();
      expect(template.Resources.ConfigRole).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have Point-in-Time Recovery enabled for production', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });

    test('should have proper tagging', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.Tags).toBeDefined();
      expect(table.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerArn',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'AutoScalingGroupName',
        'SNSTopicArn',
        'StackName',
        'EnvironmentSuffix'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have comprehensive infrastructure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // Should have many resources for full infrastructure
    });

    test('should have multiple parameters for configuration', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(4);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Resource Tagging Strategy', () => {
    test('should have consistent tagging across resources', () => {
      const taggedResources = ['VPC', 'ApplicationLoadBalancer', 'TurnAroundPromptTable'];
      
      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        
        const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
      });
    });
  });

  describe('Multi-Environment Configuration', () => {
    test('should use mappings for environment-specific configurations', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.MinSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MinSize']
      });
      expect(asg.Properties.MaxSize).toEqual({
        'Fn::FindInMap': ['EnvironmentConfig', { Ref: 'Environment' }, 'MaxSize']
      });
    });

    test('should use conditions for production-specific resources', () => {
      const configRecorder = template.Resources.ConfigConfigurationRecorder;
      expect(configRecorder.Condition).toBe('IsProduction');
    });
  });
});
