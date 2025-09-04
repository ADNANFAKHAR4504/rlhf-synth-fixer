import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template (Unit)', () => {
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
    test('should have required parameters', () => {
      expect(Object.keys(template.Parameters)).toEqual(
        expect.arrayContaining(['EnvironmentSuffix', 'VpcCidr'])
      );
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

    test('VpcCidr parameter should have validation pattern', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.Default).toBe('10.0.0.0/16');
      expect(vpcCidrParam.Description).toBe('CIDR block for the VPC');
      expect(vpcCidrParam.AllowedPattern).toBe(
        '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/(1[6-9]|2[0-8]))$'
      );
      expect(vpcCidrParam.ConstraintDescription).toBe(
        'Must be a valid IP CIDR range of the form x.x.x.x/16-28'
      );
    });
  });

  describe('Networking Resources', () => {
    test('should include VPC and Internet Gateway', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe(
        'AWS::EC2::InternetGateway'
      );
      expect(template.Resources.VPCGatewayAttachment).toBeDefined();
    });

    test('should include two public and two private subnets across AZs', () => {
      const pub1 = template.Resources.PublicSubnet1.Properties;
      const pub2 = template.Resources.PublicSubnet2.Properties;
      const priv1 = template.Resources.PrivateSubnet1.Properties;
      const priv2 = template.Resources.PrivateSubnet2.Properties;

      expect(pub1.MapPublicIpOnLaunch).toBe(true);
      expect(pub2.MapPublicIpOnLaunch).toBe(true);
      expect(priv1.MapPublicIpOnLaunch).toBe(false);
      expect(priv2.MapPublicIpOnLaunch).toBe(false);

      expect(pub1.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(pub2.AvailabilityZone['Fn::Select'][0]).toBe(1);
      expect(priv1.AvailabilityZone['Fn::Select'][0]).toBe(0);
      expect(priv2.AvailabilityZone['Fn::Select'][0]).toBe(1);
    });

    test('should include NAT Gateway in public subnet with EIP', () => {
      const nat = template.Resources.NatGateway;
      expect(nat).toBeDefined();
      expect(nat.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.AllocationId['Fn::GetAtt']).toEqual([
        'EIPNatGateway',
        'AllocationId',
      ]);
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });

    test('EIP should depend on VPC Gateway Attachment', () => {
      const eip = template.Resources.EIPNatGateway;
      expect(eip).toBeDefined();
      expect(eip.Type).toBe('AWS::EC2::EIP');
      expect(eip.DependsOn).toBe('VPCGatewayAttachment');
      expect(eip.Properties.Domain).toBe('vpc');
    });

    test('VPCGatewayAttachment should not have explicit dependencies (implicit via Ref)', () => {
      const attachment = template.Resources.VPCGatewayAttachment;
      expect(attachment.DependsOn).toBeUndefined();
    });

    test('NatGateway should depend on VPCGatewayAttachment', () => {
      const natGateway = template.Resources.NatGateway;
      expect(natGateway.DependsOn).toBe('VPCGatewayAttachment');
    });

    test('should configure routes: public via IGW, private via NAT', () => {
      const publicRoute = template.Resources.PublicRoute.Properties;
      expect(publicRoute.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(publicRoute.GatewayId).toEqual({ Ref: 'InternetGateway' });

      const privRoute1 = template.Resources.PrivateRoute1Default.Properties;
      const privRoute2 = template.Resources.PrivateRoute2Default.Properties;
      expect(privRoute1.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privRoute1.NatGatewayId).toEqual({ Ref: 'NatGateway' });
      expect(privRoute2.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(privRoute2.NatGatewayId).toEqual({ Ref: 'NatGateway' });
    });
  });

  describe('Security Groups', () => {
    test('should include security groups for public and private subnets', () => {
      const publicSG = template.Resources.PublicSecurityGroup;
      const privateSG = template.Resources.PrivateSecurityGroup;
      
      expect(publicSG).toBeDefined();
      expect(publicSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(publicSG.Properties.GroupDescription).toBe('Security group for resources in public subnets');
      expect(publicSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
      
      expect(privateSG).toBeDefined();
      expect(privateSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(privateSG.Properties.GroupDescription).toBe('Security group for resources in private subnets');
      expect(privateSG.Properties.VpcId).toEqual({ Ref: 'VPC' });
    });

    test('public security group should allow HTTP/HTTPS ingress', () => {
      const publicSG = template.Resources.PublicSecurityGroup;
      const ingress = publicSG.Properties.SecurityGroupIngress;
      
      const httpRule = ingress.find((rule: any) => rule.FromPort === 80);
      const httpsRule = ingress.find((rule: any) => rule.FromPort === 443);
      
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      expect(httpsRule).toBeDefined();
      expect(httpsRule.IpProtocol).toBe('tcp');
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('private security group should allow traffic from public security group', () => {
      const privateSG = template.Resources.PrivateSecurityGroup;
      const ingress = privateSG.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(1);
      expect(ingress[0].IpProtocol).toBe('-1');
      expect(ingress[0].SourceSecurityGroupId).toEqual({ Ref: 'PublicSecurityGroup' });
    });

    test('PrivateSecurityGroup should not have explicit dependencies (implicit via Ref)', () => {
      const privateSG = template.Resources.PrivateSecurityGroup;
      expect(privateSG.DependsOn).toBeUndefined();
    });
  });

  describe('S3 Bucket Security', () => {
    test('ArtifactsBucket must have versioning enabled and security controls', () => {
      const bucket = template.Resources.ArtifactsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      const pab = bucket.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('ArtifactsBucket should not have hardcoded name for auto-generation', () => {
      const bucket = template.Resources.ArtifactsBucket;
      // Should not have BucketName property, allowing CloudFormation to auto-generate
      expect(bucket.Properties.BucketName).toBeUndefined();
    });
  });

  describe('Least-Privilege IAM', () => {
    test('PrivateInstanceRole should allow only minimal S3 read on specific resources', () => {
      const role = template.Resources.PrivateInstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument;
      expect(assume.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assume.Statement[0].Action).toBe('sts:AssumeRole');

      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      const listStmt = statements.find((s: any) => s.Sid === 'ListBucket');
      const getStmt = statements.find((s: any) => s.Sid === 'GetObjects');
      expect(listStmt.Action).toBe('s3:ListBucket');
      expect(listStmt.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ArtifactsBucket}',
      });
      expect(getStmt.Action).toBe('s3:GetObject');
      expect(getStmt.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${ArtifactsBucket}/*',
      });
    });

    test('PrivateInstanceProfile should be configured correctly', () => {
      const instanceProfile = template.Resources.PrivateInstanceProfile;
      expect(instanceProfile).toBeDefined();
      expect(instanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
      expect(instanceProfile.Properties.Roles).toEqual([
        { Ref: 'PrivateInstanceRole' }
      ]);
    });

    test('PrivateInstanceRole should not have explicit dependencies (implicit via Ref)', () => {
      const role = template.Resources.PrivateInstanceRole;
      expect(role.DependsOn).toBeUndefined();
    });

    test('PrivateInstanceProfile should not have explicit dependencies (implicit via Ref)', () => {
      const instanceProfile = template.Resources.PrivateInstanceProfile;
      expect(instanceProfile.DependsOn).toBeUndefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('TurnAroundPromptTable configuration', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.DeletionProtectionEnabled).toBe(false);
      expect(table.Properties.AttributeDefinitions).toHaveLength(1);
      expect(table.Properties.AttributeDefinitions[0]).toEqual({
        AttributeName: 'id',
        AttributeType: 'S',
      });
      expect(table.Properties.KeySchema).toHaveLength(1);
      expect(table.Properties.KeySchema[0]).toEqual({
        AttributeName: 'id',
        KeyType: 'HASH',
      });
    });
  });

  describe('Outputs', () => {
    test('should expose required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'NatGatewayId',
        'ArtifactsBucketName',
        'PrivateInstanceRoleArn',
        'PrivateInstanceProfileArn',
        'PublicSecurityGroupId',
        'PrivateSecurityGroupId',
      ];
      expectedOutputs.forEach(name =>
        expect(template.Outputs[name]).toBeDefined()
      );
    });

    test('output values should be correctly wired', () => {
      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.NatGatewayId.Value).toEqual({ Ref: 'NatGateway' });
      expect(template.Outputs.ArtifactsBucketName.Value).toEqual({
        Ref: 'ArtifactsBucket',
      });
      expect(template.Outputs.PrivateInstanceRoleArn.Value).toEqual({
        'Fn::GetAtt': ['PrivateInstanceRole', 'Arn'],
      });
      expect(template.Outputs.PrivateInstanceProfileArn.Value).toEqual({
        'Fn::GetAtt': ['PrivateInstanceProfile', 'Arn'],
      });
      expect(template.Outputs.PublicSecurityGroupId.Value).toEqual({
        Ref: 'PublicSecurityGroup',
      });
      expect(template.Outputs.PrivateSecurityGroupId.Value).toEqual({
        Ref: 'PrivateSecurityGroup',
      });
    });
  });
});
