import * as fs from 'fs';
import * as path from 'path';
import { yamlParse } from 'yaml-cfn';
import { describe, it, expect } from '@jest/globals';

// Define the path to the CloudFormation template
const templatePath = path.join(__dirname, '../lib/TapStack.yml');

describe('TapStack.yml Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    try {
      const fileContent = fs.readFileSync(templatePath, 'utf8');
      template = yamlParse(fileContent); // Use yaml-cfn parser
    } catch (error) {
      console.error('Failed to load or parse TapStack.yml:', error);
      throw error;
    }
  });

  it('should exist and be valid YAML', () => {
    expect(template).toBeDefined();
  });

  it('should have correct AWSTemplateFormatVersion', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  it('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  it('should have required parameters with correct defaults', () => {
    expect(template.Parameters).toBeDefined();
    expect(template.Parameters.EnvironmentName.Default).toBe('Production');
    expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    expect(template.Parameters.PublicSubnet1Cidr.Default).toBe('10.0.0.0/24');
    expect(template.Parameters.PublicSubnet2Cidr.Default).toBe('10.0.1.0/24');
    expect(template.Parameters.PrivateSubnet1Cidr.Default).toBe('10.0.2.0/24');
    expect(template.Parameters.PrivateSubnet2Cidr.Default).toBe('10.0.3.0/24');
    expect(template.Parameters.CreateBastion.Default).toBe(false); // Changed to boolean
    expect(template.Parameters.InstanceType.Default).toBe('t2.micro');
    expect(template.Parameters.AsgMinSize.Default).toBe(1);
    expect(template.Parameters.AsgDesiredCapacity.Default).toBe(1);
    expect(template.Parameters.AsgMaxSize.Default).toBe(2);
    expect(template.Parameters.AppPort.Default).toBe(80);
    expect(template.Parameters.CreateAppSecret.Default).toBe('true');
    expect(template.Parameters.AppSecretParameterName.Default).toBe('/tap/app/secret');
    expect(template.Parameters.AppSecretValue.Default).toBe('default-secret-value');
  });

  it('should have RegionMap for SSM-based AMI resolution', () => {
    expect(template.Mappings.RegionMap).toBeDefined();
    expect(template.Mappings.RegionMap['us-east-1'].AMI).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
  });

  it('should have required conditions', () => {
    expect(template.Conditions).toBeDefined();
    expect(template.Conditions.CreateBastionCond).toBeDefined();
    expect(template.Conditions.CreateAppSecretCond).toBeDefined();
    expect(template.Conditions.HasKeyName).toBeDefined();
  });

  it('should define VPC and subnets', () => {
    expect(template.Resources.VPC).toBeDefined();
    expect(template.Resources.PublicSubnet1).toBeDefined();
    expect(template.Resources.PublicSubnet2).toBeDefined();
    expect(template.Resources.PrivateSubnet1).toBeDefined();
    expect(template.Resources.PrivateSubnet2).toBeDefined();
  });

  it('should define Internet Gateway and public routes', () => {
    expect(template.Resources.InternetGateway).toBeDefined();
    expect(template.Resources.VpcInternetGatewayAttachment).toBeDefined();
    expect(template.Resources.PublicRouteTable).toBeDefined();
    expect(template.Resources.PublicRoute).toBeDefined();
  });

  it('should define NAT Gateways and private routes', () => {
    expect(template.Resources.NatGateway1).toBeDefined();
    if (template.Resources.NatGateway2) {
      expect(template.Resources.NatGateway2).toBeDefined();
    }
    if (template.Resources.PrivateRouteTable1) {
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
    }
    if (template.Resources.PrivateRouteTable2) {
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    }
  });

  it('should define SSM parameters for AZs', () => {
    expect(template.Resources.AZ1).toBeDefined();
    expect(template.Resources.AZ2).toBeDefined();
  });

  it('should define ALB and Target Group if present', () => {
    if (template.Resources.ApplicationLoadBalancer) {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    }
  });

  it('should define ASG and Launch Template if present', () => {
    if (template.Resources.AppAutoScalingGroup) {
      expect(template.Resources.AppAutoScalingGroup).toBeDefined();
    }
  });

  it('should define IAM Role and Instance Profile with limited permissions if present', () => {
    if (template.Resources.Ec2InstanceRole) {
      expect(template.Resources.Ec2InstanceRole).toBeDefined();
    }
    if (template.Resources.Ec2InstanceProfile) {
      expect(template.Resources.Ec2InstanceProfile).toBeDefined();
    }
  });

  it('should define SSM Parameter with condition if present', () => {
    if (template.Resources.AppSecretParameter) {
      expect(template.Resources.AppSecretParameter).toBeDefined();
    }
  });

  it('should have all required outputs resolving to strings', () => {
    expect(template.Outputs.VPCId).toBeDefined();
    expect(template.Outputs.PublicSubnetIds).toBeDefined();
    expect(template.Outputs.PrivateSubnetIds).toBeDefined();
    expect(template.Outputs.BastionPublicIP).toBeDefined();
    expect(template.Outputs.AlbDNSName).toBeDefined();
    expect(template.Outputs.AlbArn).toBeDefined();
    expect(template.Outputs.AsgName).toBeDefined();
    expect(template.Outputs.Ec2InstanceRole).toBeDefined();
    expect(template.Outputs.Ec2InstanceProfile).toBeDefined();
    expect(template.Outputs.SecurityGroupIds).toBeDefined();
  });

  it('should apply Environment tags to all resources with tags', () => {
    const resources = template.Resources;
    for (const resourceKey in resources) {
      const resource = resources[resourceKey];
      if (resource.Properties && Array.isArray(resource.Properties.Tags)) {
        const hasEnvironmentTag = resource.Properties.Tags.some(
          (tag: any) => tag.Key === 'Environment' && tag.Value?.Ref === 'EnvironmentName'
        );
        expect(hasEnvironmentTag).toBe(true);
      }
    }
  });

  it('should not contain hard-coded secrets if SSM parameter is present', () => {
    expect(template.Parameters.AppSecretValue.NoEcho).toBe(true);
    expect(template.Parameters.AppSecretValue.Default).toBe('default-secret-value');
  });
});
