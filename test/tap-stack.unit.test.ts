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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
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
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct properties', () => {
      const vpc = template.Resources.VPC.Properties;
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
    });

    test('should have 3 public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet3).toBeDefined();
      
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnet, index) => {
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(true);
        expect(template.Resources[subnet].Properties.CidrBlock).toBe(`10.0.${index}.0/24`);
      });
    });

    test('should have 3 private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet3).toBeDefined();
      
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach((subnet, index) => {
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
        expect(template.Resources[subnet].Properties.CidrBlock).toBe(`10.0.${index + 3}.0/24`);
      });
    });

    test('should have 3 NAT Gateways', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
      
      ['NatGateway1', 'NatGateway2', 'NatGateway3'].forEach(nat => {
        expect(template.Resources[nat].Type).toBe('AWS::EC2::NatGateway');
      });
    });

    test('should have Elastic IPs for NAT Gateways', () => {
      expect(template.Resources.NatGatewayEIP1).toBeDefined();
      expect(template.Resources.NatGatewayEIP2).toBeDefined();
      expect(template.Resources.NatGatewayEIP3).toBeDefined();
      
      ['NatGatewayEIP1', 'NatGatewayEIP2', 'NatGatewayEIP3'].forEach(eip => {
        expect(template.Resources[eip].Type).toBe('AWS::EC2::EIP');
        expect(template.Resources[eip].Properties.Domain).toBe('vpc');
      });
    });

    test('should have separate route tables for each public subnet', () => {
      expect(template.Resources.PublicRouteTable1).toBeDefined();
      expect(template.Resources.PublicRouteTable2).toBeDefined();
      expect(template.Resources.PublicRouteTable3).toBeDefined();
      
      ['PublicRouteTable1', 'PublicRouteTable2', 'PublicRouteTable3'].forEach(rt => {
        expect(template.Resources[rt].Type).toBe('AWS::EC2::RouteTable');
      });
    });

    test('should have route table associations', () => {
      const associations = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PublicSubnet3RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'PrivateSubnet3RouteTableAssociation'
      ];
      
      associations.forEach(assoc => {
        expect(template.Resources[assoc]).toBeDefined();
        expect(template.Resources[assoc].Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct rules', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      const sg = template.Resources.ALBSecurityGroup.Properties;
      
      expect(sg.SecurityGroupIngress).toHaveLength(2);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(80);
      expect(sg.SecurityGroupIngress[0].ToPort).toBe(80);
      expect(sg.SecurityGroupIngress[1].FromPort).toBe(443);
      expect(sg.SecurityGroupIngress[1].ToPort).toBe(443);
    });

    test('should have Bastion Host security group', () => {
      expect(template.Resources.BastionHostSecurityGroup).toBeDefined();
      const sg = template.Resources.BastionHostSecurityGroup.Properties;
      
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(22);
      expect(sg.SecurityGroupIngress[0].CidrIp).toBe('0.0.0.0/0');
    });

    test('should have Database security group with restricted access', () => {
      expect(template.Resources.DatabaseSecurityGroup).toBeDefined();
      const sg = template.Resources.DatabaseSecurityGroup.Properties;
      
      expect(sg.SecurityGroupIngress).toHaveLength(1);
      expect(sg.SecurityGroupIngress[0].FromPort).toBe(3306);
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'WebServerSecurityGroup' });
    });

    test('should have Web Server security group', () => {
      expect(template.Resources.WebServerSecurityGroup).toBeDefined();
      const sg = template.Resources.WebServerSecurityGroup.Properties;
      
      expect(sg.SecurityGroupIngress).toHaveLength(3);
      // Check HTTP from ALB
      expect(sg.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      // Check SSH from Bastion
      expect(sg.SecurityGroupIngress[2].SourceSecurityGroupId).toEqual({ Ref: 'BastionHostSecurityGroup' });
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance with correct configuration', () => {
      expect(template.Resources.RDSInstance).toBeDefined();
      const rds = template.Resources.RDSInstance.Properties;
      
      expect(rds.Engine).toBe('mysql');
      expect(rds.MultiAZ).toBe(true);
      expect(rds.StorageEncrypted).toBe(true);
      expect(rds.BackupRetentionPeriod).toBe(7);
      expect(rds.PubliclyAccessible).toBe(false);
    });

    test('should have DB subnet group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      const dbSubnet = template.Resources.DBSubnetGroup.Properties;
      
      expect(dbSubnet.SubnetIds).toHaveLength(3);
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(dbSubnet.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet3' });
    });

    test('should have RDS secret for credentials', () => {
      expect(template.Resources.RDSSecret).toBeDefined();
      expect(template.Resources.RDSSecret.Type).toBe('AWS::SecretsManager::Secret');
      
      const secret = template.Resources.RDSSecret.Properties;
      expect(secret.GenerateSecretString.SecretStringTemplate).toBe('{"username": "admin"}');
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
    });

    test('RDS should be destroyable', () => {
      expect(template.Resources.RDSInstance.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Bastion Host', () => {
    test('should have Bastion Host EC2 instance', () => {
      expect(template.Resources.BastionHost).toBeDefined();
      expect(template.Resources.BastionHost.Type).toBe('AWS::EC2::Instance');
      
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.InstanceType).toBe('t3.micro');
      expect(bastion.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('should have encrypted EBS volume', () => {
      const bastion = template.Resources.BastionHost.Properties;
      expect(bastion.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(bastion.BlockDeviceMappings[0].Ebs.DeleteOnTermination).toBe(true);
    });

    test('should have IAM role and instance profile', () => {
      expect(template.Resources.BastionHostRole).toBeDefined();
      expect(template.Resources.BastionHostInstanceProfile).toBeDefined();
      
      const role = template.Resources.BastionHostRole.Properties;
      expect(role.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB configured', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Subnets).toHaveLength(3);
    });

    test('ALB should be destroyable', () => {
      const alb = template.Resources.ApplicationLoadBalancer.Properties;
      const deletionProtection = alb.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'deletion_protection.enabled'
      );
      expect(deletionProtection.Value).toBe('false');
    });

    test('should have target group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      const tg = template.Resources.ALBTargetGroup.Properties;
      
      expect(tg.Port).toBe(80);
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.TargetType).toBe('instance');
    });

    test('should have listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      const listener = template.Resources.ALBListener.Properties;
      
      expect(listener.Port).toBe(80);
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.DefaultActions[0].Type).toBe('forward');
    });
  });

  describe('VPC Flow Logs', () => {
    test('should have VPC Flow Log configured', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      const flowLog = template.Resources.VPCFlowLog.Properties;
      
      expect(flowLog.ResourceType).toBe('VPC');
      expect(flowLog.ResourceId).toEqual({ Ref: 'VPC' });
      expect(flowLog.LogDestinationType).toBe('s3');
      expect(flowLog.TrafficType).toBe('ALL');
    });

    test('should have S3 bucket for flow logs with encryption', () => {
      expect(template.Resources.VPCFlowLogsBucket).toBeDefined();
      const bucket = template.Resources.VPCFlowLogsBucket.Properties;
      
      expect(bucket.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('should have S3 bucket policy for flow logs', () => {
      expect(template.Resources.VPCFlowLogsBucketPolicy).toBeDefined();
      const policy = template.Resources.VPCFlowLogsBucketPolicy.Properties.PolicyDocument;
      
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Principal.Service).toBe('delivery.logs.amazonaws.com');
    });

    test('should have VPC Flow Logs IAM role', () => {
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
      const role = template.Resources.VPCFlowLogsRole.Properties;
      
      expect(role.AssumeRolePolicyDocument.Statement[0].Principal.Service)
        .toBe('vpc-flow-logs.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have all required infrastructure outputs', () => {
      const expectedOutputs = [
        'StackName',
        'EnvironmentSuffix',
        'VPC',
        'PublicSubnets',
        'PrivateSubnets',
        'ALBDNSName',
        'BastionHostPublicIP',
        'RDSEndpoint',
        'VPCFlowLogsBucket'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPC output should be correct', () => {
      const output = template.Outputs.VPC;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'VPC' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-VPCID',
      });
    });

    test('PublicSubnets output should combine all public subnets', () => {
      const output = template.Outputs.PublicSubnets;
      expect(output.Description).toBe('List of public subnet IDs');
      expect(output.Value['Fn::Join'][1]).toHaveLength(3);
      expect(output.Value['Fn::Join'][1][0]).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('ALBDNSName output should be correct', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Description).toBe('DNS name for the Application Load Balancer');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
      });
    });

    test('RDSEndpoint output should be correct', () => {
      const output = template.Outputs.RDSEndpoint;
      expect(output.Description).toBe('Endpoint for the RDS instance');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'],
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(40); // VPC infrastructure has many resources
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have expected outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(9);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources should use environment suffix', () => {
      const resourcesWithNames = [
        'VPC', 'InternetGateway', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3',
        'PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'NatGateway1',
        'NatGateway2', 'NatGateway3', 'ALBSecurityGroup', 'BastionHostSecurityGroup',
        'DatabaseSecurityGroup', 'RDSInstance', 'BastionHost', 'ApplicationLoadBalancer'
      ];
      
      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.Properties && resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });

    test('all resources should have Production environment tag', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties && resource.Properties.Tags) {
          const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
          if (envTag) {
            expect(envTag.Value).toBe('Production');
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have public access where not required', () => {
      // RDS should not be publicly accessible
      expect(template.Resources.RDSInstance.Properties.PubliclyAccessible).toBe(false);
      
      // Private subnets should not map public IPs
      ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3'].forEach(subnet => {
        expect(template.Resources[subnet].Properties.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('encryption should be enabled where applicable', () => {
      // RDS encryption
      expect(template.Resources.RDSInstance.Properties.StorageEncrypted).toBe(true);
      
      // S3 bucket encryption
      expect(template.Resources.VPCFlowLogsBucket.Properties.BucketEncryption).toBeDefined();
      
      // Bastion host EBS encryption
      expect(template.Resources.BastionHost.Properties.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('security groups should follow least privilege', () => {
      // Database should only accept from web servers
      const dbSg = template.Resources.DatabaseSecurityGroup.Properties;
      expect(dbSg.SecurityGroupIngress).toHaveLength(1);
      expect(dbSg.SecurityGroupIngress[0].SourceSecurityGroupId).toBeDefined();
      
      // Web servers should only accept from ALB and Bastion
      const webSg = template.Resources.WebServerSecurityGroup.Properties;
      webSg.SecurityGroupIngress.forEach((rule: any) => {
        expect(rule.SourceSecurityGroupId || rule.CidrIp).toBeDefined();
        if (rule.CidrIp) {
          expect(rule.CidrIp).not.toBe('0.0.0.0/0');
        }
      });
    });

    test('should use Secrets Manager for database credentials', () => {
      expect(template.Resources.RDSSecret).toBeDefined();
      
      const rds = template.Resources.RDSInstance.Properties;
      expect(rds.MasterUsername['Fn::Sub']).toContain('secretsmanager');
      expect(rds.MasterUserPassword['Fn::Sub']).toContain('secretsmanager');
    });
  });

  describe('High Availability', () => {
    test('resources should be distributed across multiple AZs', () => {
      // Check subnets are in different AZs
      ['PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'].forEach((subnet, index) => {
        const az = template.Resources[subnet].Properties.AvailabilityZone;
        expect(az['Fn::Select'][0]).toBe(index);
      });
      
      // RDS should be Multi-AZ
      expect(template.Resources.RDSInstance.Properties.MultiAZ).toBe(true);
      
      // ALB should span multiple subnets
      expect(template.Resources.ApplicationLoadBalancer.Properties.Subnets).toHaveLength(3);
    });

    test('each private subnet should have its own NAT Gateway', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway3).toBeDefined();
      
      // Check private routes point to different NAT gateways
      expect(template.Resources.PrivateRoute1.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway1' });
      expect(template.Resources.PrivateRoute2.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway2' });
      expect(template.Resources.PrivateRoute3.Properties.NatGatewayId).toEqual({ Ref: 'NatGateway3' });
    });
  });
});
