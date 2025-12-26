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
        'Highly Available Auto-Scaling Web Application Infrastructure'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should not have DatabasePassword parameter (using Secrets Manager)', () => {
      expect(template.Parameters.DatabasePassword).toBeUndefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', () => {
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe(
        '10.0.1.0/24'
      );
      expect(template.Resources.PublicSubnet2.Properties.CidrBlock).toBe(
        '10.0.2.0/24'
      );
    });

    test('private subnets should have correct CIDR blocks', () => {
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe(
        '10.0.3.0/24'
      );
      expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe(
        '10.0.4.0/24'
      );
    });

    test('should have NAT Gateway with EIP', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have WebServer security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      expect(template.Resources.WebServerSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('should have Database security group', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      expect(template.Resources.DatabaseSecurityGroup.Type).toBe(
        'AWS::EC2::SecurityGroup'
      );
    });

    test('ALB security group should allow HTTP on port 80', () => {
      const sg =
        template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(sg).toHaveLength(1);
      expect(sg[0].FromPort).toBe(80);
      expect(sg[0].ToPort).toBe(80);
      expect(sg[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('WebServer security group should allow traffic from ALB on port 8080', () => {
      const sg =
        template.Resources.WebServerSecurityGroup.Properties
          .SecurityGroupIngress;
      expect(sg).toHaveLength(1);
      expect(sg[0].FromPort).toBe(8080);
      expect(sg[0].ToPort).toBe(8080);
      expect(sg[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });

    test('Database security group should allow MySQL traffic from WebServers', () => {
      const sg =
        template.Resources.DatabaseSecurityGroup.Properties
          .SecurityGroupIngress;
      expect(sg).toHaveLength(1);
      expect(sg[0].FromPort).toBe(3306);
      expect(sg[0].ToPort).toBe(3306);
      expect(sg[0].SourceSecurityGroupId).toEqual({
        Ref: 'WebServerSecurityGroup',
      });
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe(
        'AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe(
        'AWS::ElasticLoadBalancingV2::TargetGroup'
      );
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.ApplicationLoadBalancer.Properties.Scheme).toBe(
        'internet-facing'
      );
    });

    test('Target Group should target port 8080', () => {
      expect(template.Resources.ALBTargetGroup.Properties.Port).toBe(8080);
      expect(template.Resources.ALBTargetGroup.Properties.Protocol).toBe(
        'HTTP'
      );
    });

    test('Listener should forward HTTP traffic on port 80', () => {
      expect(template.Resources.ALBListener.Properties.Port).toBe(80);
      expect(template.Resources.ALBListener.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe(
        'AWS::EC2::LaunchTemplate'
      );
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe(
        'AWS::AutoScaling::AutoScalingGroup'
      );
    });

    test('Launch Template should use t2.micro instances', () => {
      expect(
        template.Resources.LaunchTemplate.Properties.LaunchTemplateData
          .InstanceType
      ).toBe('t2.micro');
    });

    test('Auto Scaling Group should have correct capacity settings', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.MinSize).toBe('2');
      expect(asg.MaxSize).toBe('6');
      expect(asg.DesiredCapacity).toBe('2');
    });

    test('Auto Scaling Group should use ELB health checks', () => {
      expect(
        template.Resources.AutoScalingGroup.Properties.HealthCheckType
      ).toBe('ELB');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS Database', () => {
      expect(template.Resources.Database).toBeDefined();
      expect(template.Resources.Database.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have Database Subnet Group', () => {
      expect(template.Resources.DatabaseSubnetGroup).toBeDefined();
      expect(template.Resources.DatabaseSubnetGroup.Type).toBe(
        'AWS::RDS::DBSubnetGroup'
      );
    });

    test('Database should use MySQL 8.0', () => {
      const db = template.Resources.Database.Properties;
      expect(db.Engine).toBe('mysql');
      expect(db.EngineVersion).toBe('8.0.39');
    });

    test('Database should be Multi-AZ', () => {
      expect(template.Resources.Database.Properties.MultiAZ).toBe(true);
    });

    test('Database should use Secrets Manager for password', () => {
      expect(template.Resources.Database.Properties.MasterUserPassword).toEqual(
        {
          "Fn::Sub": "{{resolve:secretsmanager:tap-database-password-${EnvironmentSuffix}:SecretString:password}}",
        }
      );
    });

    test('Database should have deletion policy Delete', () => {
      expect(template.Resources.Database.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment: production tag', () => {
      const resourcesWithTags = [
        'DatabasePasswordSecret',
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway1EIP',
        'NatGateway1',
        'PublicRouteTable',
        'PrivateRouteTable1',
        'ALBSecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'DatabaseSubnetGroup',
        'Database',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment'
          );
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('production');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerArn',
        'AutoScalingGroupName',
        'DatabaseEndpoint',
        'DatabasePort',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ALB DNS output should reference correct attribute', () => {
      const output = template.Outputs.ApplicationLoadBalancerDNS;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('Database endpoint output should reference correct attribute', () => {
      const output = template.Outputs.DatabaseEndpoint;
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

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have exactly 28 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(28);
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12);
    });
  });
});
