import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON-converted template
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
      expect(template.Description).toContain('Production-ready AWS Cloud Environment');
    });

    test('should have metadata section with parameter interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toContain('Environment suffix');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have compute configuration parameters', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.MinInstances).toBeDefined();
      expect(template.Parameters.MaxInstances).toBeDefined();
      expect(template.Parameters.DesiredInstances).toBeDefined();
    });

    test('should have network configuration parameters', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PublicSubnet2CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet1CIDR).toBeDefined();
      expect(template.Parameters.PrivateSubnet2CIDR).toBeDefined();
    });

    test('should have correct CIDR defaults', () => {
      expect(template.Parameters.VpcCIDR.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.PublicSubnet1CIDR.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2CIDR.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PrivateSubnet1CIDR.Default).toBe('10.0.10.0/24');
      expect(template.Parameters.PrivateSubnet2CIDR.Default).toBe('10.0.11.0/24');
    });
  });

  describe('Mappings', () => {
    test('should have RegionMap for AMI IDs', () => {
      expect(template.Mappings.RegionMap).toBeDefined();
    });

    test('should have us-east-1 region in AMI mapping', () => {
      expect(template.Mappings.RegionMap['us-east-1']).toBeDefined();
      expect(template.Mappings.RegionMap['us-east-1'].AMI).toBeDefined();
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should enable DNS hostnames and support', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('VPC should use CIDR from parameter', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toEqual({ Ref: 'VpcCIDR' });
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have VPC Gateway Attachment', () => {
      expect(template.Resources.AttachGateway).toBeDefined();
      expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('should have 2 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should auto-assign public IPs', () => {
      expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(template.Resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('should have 2 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('private subnets should not auto-assign public IPs', () => {
      expect(template.Resources.PrivateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(template.Resources.PrivateSubnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have 2 NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
      expect(template.Resources.NatGateway2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have 2 Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
      expect(template.Resources.NatGateway1EIP.Type).toBe('AWS::EC2::EIP');
      expect(template.Resources.NatGateway2EIP.Type).toBe('AWS::EC2::EIP');
    });

    test('EIPs should depend on gateway attachment', () => {
      expect(template.Resources.NatGateway1EIP.DependsOn).toBe('AttachGateway');
      expect(template.Resources.NatGateway2EIP.DependsOn).toBe('AttachGateway');
    });

    test('should have route tables for public and private subnets', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable1).toBeDefined();
      expect(template.Resources.PrivateRouteTable2).toBeDefined();
    });

    test('public route should go through Internet Gateway', () => {
      const publicRoute = template.Resources.DefaultPublicRoute;
      expect(publicRoute).toBeDefined();
      expect(publicRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(publicRoute.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    });

    test('private routes should go through NAT Gateways', () => {
      const privateRoute1 = template.Resources.DefaultPrivateRoute1;
      const privateRoute2 = template.Resources.DefaultPrivateRoute2;
      expect(privateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(privateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB Security Group should allow HTTPS and HTTP from internet', () => {
      const sg = template.Resources.ALBSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(2);
      const httpsRule = sg.SecurityGroupIngress.find((r: any) => r.FromPort === 443);
      const httpRule = sg.SecurityGroupIngress.find((r: any) => r.FromPort === 80);
      expect(httpsRule).toBeDefined();
      expect(httpRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 Security Group', () => {
      expect(template.Resources.EC2SecurityGroup).toBeDefined();
      expect(template.Resources.EC2SecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('EC2 Security Group should only allow traffic from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(80);
    });

    test('should have RDS Security Group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('RDS Security Group should only allow PostgreSQL from EC2', () => {
      const sg = template.Resources.RDSSecurityGroup.Properties;
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(5432);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(5432);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 IAM Role', () => {
      expect(template.Resources.EC2Role).toBeDefined();
      expect(template.Resources.EC2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 Role should have CloudWatch and SSM policies', () => {
      const role = template.Resources.EC2Role.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have VPC Flow Logs IAM Role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have VPC Flow Logs Log Group', () => {
      expect(template.Resources.VPCFlowLogsGroup).toBeDefined();
      expect(template.Resources.VPCFlowLogsGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Flow Logs should have 7-day retention', () => {
      expect(template.Resources.VPCFlowLogsGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have VPC Flow Log', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
    });

    test('Flow Log should capture all traffic', () => {
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });
  });

  describe('RDS Database', () => {
    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('DB Subnet Group should use private subnets', () => {
      const subnetGroup = template.Resources.DBSubnetGroup.Properties;
      expect(subnetGroup.SubnetIds).toHaveLength(2);
      expect(subnetGroup.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(subnetGroup.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have RDS Instance', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      expect(template.Resources.RDSInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should be PostgreSQL engine', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.Engine).toBe('postgres');
      expect(rds.EngineVersion).toMatch(/^15\./);
    });

    test('RDS should have correct deletion policies', () => {
      expect(template.Resources.RDSInstance.DeletionPolicy).toBe('Delete');
      expect(template.Resources.RDSInstance.UpdateReplacePolicy).toBe('Delete');
    });

    test('RDS should have DeletionProtection disabled', () => {
      expect(template.Resources.RDSInstance.Properties.DeletionProtection).toBe(false);
    });

    test('RDS should be Multi-AZ', () => {
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
    });

    test('RDS should have automated backups', () => {
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.BackupRetentionPeriod).toEqual({ Ref: 'DBBackupRetentionPeriod' });
      expect(rds.PreferredBackupWindow).toBeDefined();
    });

    test('RDS should have storage encrypted', () => {
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('RDS should not be publicly accessible', () => {
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(false);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });

    test('should have ALB Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('Target Group should have health checks configured', () => {
      const tg = template.Resources.ALBTargetGroup.Properties;
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckPath).toBe('/');
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB Listener should forward to target group', () => {
      const listener = template.Resources.ALBListener.Properties;
      expect(listener.DefaultActions[0].Type).toBe('forward');
      expect(listener.DefaultActions[0].TargetGroupArn).toEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('should have Launch Template', () => {
      expect(template.Resources.LaunchTemplate).toBeDefined();
      expect(template.Resources.LaunchTemplate.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('Launch Template should use AMI from mapping', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.ImageId).toBeDefined();
      expect(lt.ImageId['Fn::FindInMap']).toBeDefined();
    });

    test('Launch Template should have user data', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.UserData).toBeDefined();
      expect(lt.UserData['Fn::Base64']).toBeDefined();
    });

    test('Launch Template should use IAM instance profile', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.IamInstanceProfile.Arn).toEqual({ 'Fn::GetAtt': ['EC2InstanceProfile', 'Arn'] });
    });

    test('Launch Template should require IMDSv2', () => {
      const lt = template.Resources.LaunchTemplate.Properties.LaunchTemplateData;
      expect(lt.MetadataOptions.HttpTokens).toBe('required');
    });

    test('should have Auto Scaling Group', () => {
      expect(template.Resources.AutoScalingGroup).toBeDefined();
      expect(template.Resources.AutoScalingGroup.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    });

    test('ASG should be in private subnets', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('ASG should depend on NAT Gateways', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.DependsOn).toContain('NatGateway1');
      expect(asg.DependsOn).toContain('NatGateway2');
    });

    test('ASG should use ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should be attached to target group', () => {
      const asg = template.Resources.AutoScalingGroup.Properties;
      expect(asg.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should include EnvironmentSuffix', () => {
      const resources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'NatGateway1',
        'NatGateway2',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'RDSSecurityGroup',
        'EC2Role',
        'EC2InstanceProfile',
        'VPCFlowLogsRole',
        'VPCFlowLogsGroup',
        'DBSubnetGroup',
        'RDSInstance',
        'ApplicationLoadBalancer',
        'ALBTargetGroup',
        'LaunchTemplate',
        'AutoScalingGroup',
      ];

      resources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource && resource.Properties) {
          const props = JSON.stringify(resource.Properties);
          // Check if the properties contain a reference to EnvironmentSuffix
          const hasEnvSuffix = props.includes('EnvironmentSuffix') ||
            props.includes('${EnvironmentSuffix}');
          expect(hasEnvSuffix).toBe(true);
        }
      });
    });

    test('all resource tags should include EnvironmentSuffix in name', () => {
      const taggedResources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'RDSInstance'];

      taggedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((t: any) => t.Key === 'Name');
          if (nameTag && nameTag.Value && nameTag.Value['Fn::Sub']) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
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
        'ALBDNSName',
        'ALBUrl',
        'RDSEndpoint',
        'RDSPort',
        'RDSConnectionString',
        'AutoScalingGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      const outputsWithExports = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBDNSName',
        'RDSEndpoint',
        'RDSPort',
        'AutoScalingGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      outputsWithExports.forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        if (output.Export && output.Export.Name && output.Export.Name['Fn::Sub']) {
          expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required CloudFormation sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have 37 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(37);
    });

    test('should have 16 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(16);
    });

    test('should have 13 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(13);
    });
  });

  describe('Best Practices', () => {
    test('all resources should have tags', () => {
      const resourcesRequiringTags = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'RDSInstance',
        'ApplicationLoadBalancer',
      ];

      resourcesRequiringTags.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties.Tags).toBeDefined();
        expect(Array.isArray(resource.Properties.Tags)).toBe(true);
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });

    test('resources should have Environment and ManagedBy tags', () => {
      const taggedResources = ['VPC', 'RDSInstance', 'ApplicationLoadBalancer'];

      taggedResources.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        const tags = resource.Properties.Tags;
        const envTag = tags.find((t: any) => t.Key === 'Environment');
        const managedByTag = tags.find((t: any) => t.Key === 'ManagedBy');

        expect(envTag).toBeDefined();
        expect(managedByTag).toBeDefined();
        expect(managedByTag.Value).toBe('cloudformation');
      });
    });

    test('security groups should have descriptions', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];

      securityGroups.forEach(sgKey => {
        const sg = template.Resources[sgKey];
        expect(sg.Properties.GroupDescription).toBeDefined();
        expect(sg.Properties.GroupDescription.length).toBeGreaterThan(0);
      });
    });

    test('all ingress rules should have descriptions', () => {
      const securityGroups = ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];

      securityGroups.forEach(sgKey => {
        const sg = template.Resources[sgKey];
        sg.Properties.SecurityGroupIngress.forEach((rule: any) => {
          expect(rule.Description).toBeDefined();
        });
      });
    });
  });
});
