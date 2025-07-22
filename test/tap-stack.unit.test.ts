import { expect } from '@jest/globals';
import template from '../lib/TapStack.json';

const typedTemplate = template as any;

describe('TapStack CloudFormation Template Unit Tests', () => {
  describe('Template Structure', () => {
    test('should have correct template format version', () => {
      expect(typedTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });
    test('should have correct description', () => {
      expect(typedTemplate.Description).toBe('Unified Template: Deploys a Primary stack or a Replica stack based on parameters. v2.0');
    });
  });

  describe('Parameters', () => {
    test('should define DeploymentType parameter with correct allowed values', () => {
      expect(typedTemplate.Parameters.DeploymentType).toBeDefined();
      expect(typedTemplate.Parameters.DeploymentType.Type).toBe('String');
      expect(typedTemplate.Parameters.DeploymentType.AllowedValues).toEqual(['Primary', 'Replica']);
      expect(typedTemplate.Parameters.DeploymentType.Description).toContain('Choose "Primary" for your main region');
    });
    test('should define EnvironmentSuffix parameter with correct properties', () => {
      expect(typedTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(typedTemplate.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(typedTemplate.Parameters.EnvironmentSuffix.Description).toContain('Suffix for naming');
      expect(typedTemplate.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });
    test('should define DomainName parameter', () => {
      expect(typedTemplate.Parameters.DomainName).toBeDefined();
      expect(typedTemplate.Parameters.DomainName.Type).toBe('String');
      expect(typedTemplate.Parameters.DomainName.Description).toContain('apex domain name');
    });
    test('should define Subdomain parameter', () => {
      expect(typedTemplate.Parameters.Subdomain).toBeDefined();
      expect(typedTemplate.Parameters.Subdomain.Type).toBe('String');
      expect(typedTemplate.Parameters.Subdomain.Description).toContain('subdomain for your application');
    });
    test('should define PrimaryDbIdentifier parameter for replica deployments', () => {
      expect(typedTemplate.Parameters.PrimaryDbIdentifier).toBeDefined();
      expect(typedTemplate.Parameters.PrimaryDbIdentifier.Type).toBe('String');
      expect(typedTemplate.Parameters.PrimaryDbIdentifier.Description).toContain('DB Identifier of the primary RDS instance');
      expect(typedTemplate.Parameters.PrimaryDbIdentifier.Default).toBe('');
    });
    test('should define PrimaryRegion parameter with correct default', () => {
      expect(typedTemplate.Parameters.PrimaryRegion).toBeDefined();
      expect(typedTemplate.Parameters.PrimaryRegion.Type).toBe('String');
      expect(typedTemplate.Parameters.PrimaryRegion.Default).toBe('us-east-1');
      expect(typedTemplate.Parameters.PrimaryRegion.Description).toContain('AWS Region of the source/primary database');
    });
  });

  describe('Conditions', () => {
    test('should define IsPrimaryDeployment condition', () => {
      expect(typedTemplate.Conditions.IsPrimaryDeployment).toBeDefined();
      expect(typedTemplate.Conditions.IsPrimaryDeployment['Fn::Equals']).toBeDefined();
      expect(typedTemplate.Conditions.IsPrimaryDeployment['Fn::Equals'][0].Ref).toBe('DeploymentType');
      expect(typedTemplate.Conditions.IsPrimaryDeployment['Fn::Equals'][1]).toBe('Primary');
    });

    test('should define IsReplicaDeployment condition', () => {
      expect(typedTemplate.Conditions.IsReplicaDeployment).toBeDefined();
      expect(typedTemplate.Conditions.IsReplicaDeployment['Fn::Equals']).toBeDefined();
      expect(typedTemplate.Conditions.IsReplicaDeployment['Fn::Equals'][0].Ref).toBe('DeploymentType');
      expect(typedTemplate.Conditions.IsReplicaDeployment['Fn::Equals'][1]).toBe('Replica');
    });
  });

  describe('Metadata', () => {
    test('should define parameter groups for CloudFormation interface', () => {
      expect(typedTemplate.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(typedTemplate.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(typedTemplate.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });
    test('should have Core Deployment Configuration parameter group', () => {
      const coreGroup = typedTemplate.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0];
      expect(coreGroup.Label.default).toBe('Core Deployment Configuration');
      expect(coreGroup.Parameters).toContain('DeploymentType');
      expect(coreGroup.Parameters).toContain('EnvironmentSuffix');
    });
    test('should have Primary Deployment Settings parameter group', () => {
      const primaryGroup = typedTemplate.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[1];
      expect(primaryGroup.Label.default).toBe('Primary Deployment Settings (Only used if DeploymentType is Primary)');
      expect(primaryGroup.Parameters).toContain('DomainName');
      expect(primaryGroup.Parameters).toContain('Subdomain');
    });
    test('should have Replica Deployment Settings parameter group', () => {
      const replicaGroup = typedTemplate.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[2];
      expect(replicaGroup.Label.default).toBe('Replica Deployment Settings (Only used if DeploymentType is Replica)');
      expect(replicaGroup.Parameters).toContain('PrimaryDbIdentifier');
      expect(replicaGroup.Parameters).toContain('PrimaryRegion');
    });
  });

  describe('Primary Deployment Resources', () => {
    describe('VPC', () => {
      test('should define VPC with correct properties and condition', () => {
        expect(typedTemplate.Resources.VPC).toBeDefined();
        expect(typedTemplate.Resources.VPC.Type).toBe('AWS::EC2::VPC');
        expect(typedTemplate.Resources.VPC.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(typedTemplate.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
        expect(typedTemplate.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
        expect(typedTemplate.Resources.VPC.Properties.Tags).toHaveLength(1);
        expect(typedTemplate.Resources.VPC.Properties.Tags[0].Key).toBe('Name');
        expect(typedTemplate.Resources.VPC.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-vpc');
      });
    });
    describe('Internet Gateway', () => {
      test('should define Internet Gateway with correct properties and condition', () => {
        expect(typedTemplate.Resources.InternetGateway).toBeDefined();
        expect(typedTemplate.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
        expect(typedTemplate.Resources.InternetGateway.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.InternetGateway.Properties.Tags).toHaveLength(1);
        expect(typedTemplate.Resources.InternetGateway.Properties.Tags[0].Key).toBe('Name');
        expect(typedTemplate.Resources.InternetGateway.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-igw');
      });
    });
    describe('VPC Gateway Attachment', () => {
      test('should define VPC Gateway Attachment with correct references', () => {
        expect(typedTemplate.Resources.AttachGateway).toBeDefined();
        expect(typedTemplate.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(typedTemplate.Resources.AttachGateway.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.AttachGateway.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.AttachGateway.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
      });
    });
    describe('Subnets', () => {
      test('should define PublicSubnet1 with correct properties', () => {
        expect(typedTemplate.Resources.PublicSubnet1).toBeDefined();
        expect(typedTemplate.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(typedTemplate.Resources.PublicSubnet1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PublicSubnet1.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(typedTemplate.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(typedTemplate.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
        expect(typedTemplate.Resources.PublicSubnet1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-public-subnet-az1');
      });
      test('should define PrivateSubnet1 with correct properties', () => {
        expect(typedTemplate.Resources.PrivateSubnet1).toBeDefined();
        expect(typedTemplate.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(typedTemplate.Resources.PrivateSubnet1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateSubnet1.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
        expect(typedTemplate.Resources.PrivateSubnet1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-subnet-az1');
      });
      test('should define PrivateSubnet2 with correct properties', () => {
        expect(typedTemplate.Resources.PrivateSubnet2).toBeDefined();
        expect(typedTemplate.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
        expect(typedTemplate.Resources.PrivateSubnet2.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateSubnet2.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
        expect(typedTemplate.Resources.PrivateSubnet2.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-subnet-az2');
      });
    });
    describe('Route Tables', () => {
      test('should define PublicRouteTable1 with correct properties', () => {
        expect(typedTemplate.Resources.PublicRouteTable1).toBeDefined();
        expect(typedTemplate.Resources.PublicRouteTable1.Type).toBe('AWS::EC2::RouteTable');
        expect(typedTemplate.Resources.PublicRouteTable1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PublicRouteTable1.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.PublicRouteTable1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-public-rt-az1');
      });
      test('should define PrivateRouteTable1 with correct properties', () => {
        expect(typedTemplate.Resources.PrivateRouteTable1).toBeDefined();
        expect(typedTemplate.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
        expect(typedTemplate.Resources.PrivateRouteTable1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateRouteTable1.Properties.VpcId.Ref).toBe('VPC');
        expect(typedTemplate.Resources.PrivateRouteTable1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-rt-az1');
      });
      test('should define PublicRoute1 with correct routing', () => {
        expect(typedTemplate.Resources.PublicRoute1).toBeDefined();
        expect(typedTemplate.Resources.PublicRoute1.Type).toBe('AWS::EC2::Route');
        expect(typedTemplate.Resources.PublicRoute1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PublicRoute1.Properties.RouteTableId.Ref).toBe('PublicRouteTable1');
        expect(typedTemplate.Resources.PublicRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(typedTemplate.Resources.PublicRoute1.Properties.GatewayId.Ref).toBe('InternetGateway');
      });
      test('should define PrivateRoute1 with NAT Gateway routing', () => {
        expect(typedTemplate.Resources.PrivateRoute1).toBeDefined();
        expect(typedTemplate.Resources.PrivateRoute1.Type).toBe('AWS::EC2::Route');
        expect(typedTemplate.Resources.PrivateRoute1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateRoute1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
        expect(typedTemplate.Resources.PrivateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(typedTemplate.Resources.PrivateRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      });
    });
    describe('Subnet Route Table Associations', () => {
      test('should define PublicSubnet1Association', () => {
        expect(typedTemplate.Resources.PublicSubnet1Association).toBeDefined();
        expect(typedTemplate.Resources.PublicSubnet1Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(typedTemplate.Resources.PublicSubnet1Association.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PublicSubnet1Association.Properties.SubnetId.Ref).toBe('PublicSubnet1');
        expect(typedTemplate.Resources.PublicSubnet1Association.Properties.RouteTableId.Ref).toBe('PublicRouteTable1');
      });
      test('should define PrivateSubnet1Association', () => {
        expect(typedTemplate.Resources.PrivateSubnet1Association).toBeDefined();
        expect(typedTemplate.Resources.PrivateSubnet1Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(typedTemplate.Resources.PrivateSubnet1Association.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateSubnet1Association.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
        expect(typedTemplate.Resources.PrivateSubnet1Association.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      });
      test('should define PrivateSubnet2Association', () => {
        expect(typedTemplate.Resources.PrivateSubnet2Association).toBeDefined();
        expect(typedTemplate.Resources.PrivateSubnet2Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(typedTemplate.Resources.PrivateSubnet2Association.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrivateSubnet2Association.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
        expect(typedTemplate.Resources.PrivateSubnet2Association.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      });
    });
    describe('NAT Gateway', () => {
      test('should define EIP1 for NAT Gateway', () => {
        expect(typedTemplate.Resources.EIP1).toBeDefined();
        expect(typedTemplate.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
        expect(typedTemplate.Resources.EIP1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.EIP1.Properties.Domain).toBe('vpc');
      });
      test('should define NatGateway1 with correct properties', () => {
        expect(typedTemplate.Resources.NatGateway1).toBeDefined();
        expect(typedTemplate.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
        expect(typedTemplate.Resources.NatGateway1.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.NatGateway1.Properties.AllocationId['Fn::GetAtt']).toEqual(['EIP1', 'AllocationId']);
        expect(typedTemplate.Resources.NatGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
        expect(typedTemplate.Resources.NatGateway1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-nat-gw-az1');
      });
    });
    describe('KMS Key', () => {
      test('should define KMSKey with correct properties', () => {
        expect(typedTemplate.Resources.KMSKey).toBeDefined();
        expect(typedTemplate.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
        expect(typedTemplate.Resources.KMSKey.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.KMSKey.Properties.Description).toBe('General purpose KMS key');
        expect(typedTemplate.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement).toHaveLength(1);
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Sid).toBe('Allow administration of the key');
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Effect).toBe('Allow');
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Action).toBe('kms:*');
        expect(typedTemplate.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Resource).toBe('*');
      });
    });
    describe('S3 Bucket', () => {
      test('should define WebAppBucket with correct properties', () => {
        expect(typedTemplate.Resources.WebAppBucket).toBeDefined();
        expect(typedTemplate.Resources.WebAppBucket.Type).toBe('AWS::S3::Bucket');
        expect(typedTemplate.Resources.WebAppBucket.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.WebAppBucket.Properties.BucketName['Fn::Sub']).toBe('${Subdomain}-${DomainName}-${AWS::Region}');
        expect(typedTemplate.Resources.WebAppBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(typedTemplate.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(typedTemplate.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(typedTemplate.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(typedTemplate.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        expect(typedTemplate.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
        expect(typedTemplate.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(typedTemplate.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('KMSKey');
      });
    });
    describe('CloudFront', () => {
      test('should define CloudFrontOAI with correct properties', () => {
        expect(typedTemplate.Resources.CloudFrontOAI).toBeDefined();
        expect(typedTemplate.Resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
        expect(typedTemplate.Resources.CloudFrontOAI.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.CloudFrontOAI.Properties.CloudFrontOriginAccessIdentityConfig.Comment['Fn::Sub']).toBe('OAI for ${DomainName}');
      });
      test('should define WebAppBucketPolicy with CloudFront access', () => {
        expect(typedTemplate.Resources.WebAppBucketPolicy).toBeDefined();
        expect(typedTemplate.Resources.WebAppBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.Bucket.Ref).toBe('WebAppBucket');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement).toHaveLength(1);
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Sid).toBe('AllowCloudFront');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Effect).toBe('Allow');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Principal.CanonicalUser['Fn::GetAtt']).toEqual(['CloudFrontOAI', 'S3CanonicalUserId']);
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Action).toBe('s3:GetObject');
        expect(typedTemplate.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Resource['Fn::Sub']).toBe('arn:aws:s3:::${WebAppBucket}/*');
      });
      test('should define CloudFrontDistribution with correct configuration', () => {
        expect(typedTemplate.Resources.CloudFrontDistribution).toBeDefined();
        expect(typedTemplate.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
        expect(typedTemplate.Resources.CloudFrontDistribution.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.Enabled).toBe(true);
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultRootObject).toBe('index.html');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins).toHaveLength(1);
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].Id).toBe('S3Origin');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].DomainName['Fn::GetAtt']).toEqual(['WebAppBucket', 'DomainName']);
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].S3OriginConfig.OriginAccessIdentity['Fn::Sub']).toBe('origin-access-identity/cloudfront/${CloudFrontOAI}');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.TargetOriginId).toBe('S3Origin');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ForwardedValues.QueryString).toBe(false);
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ForwardedValues.Cookies.Forward).toBe('none');
        expect(typedTemplate.Resources.CloudFrontDistribution.Properties.DistributionConfig.PriceClass).toBe('PriceClass_All');
      });
    });
    describe('RDS Resources', () => {
      test('should define DBSecret with correct properties', () => {
        expect(typedTemplate.Resources.DBSecret).toBeDefined();
        expect(typedTemplate.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
        expect(typedTemplate.Resources.DBSecret.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.DBSecret.Properties.Name['Fn::Sub']).toBe('${EnvironmentSuffix}/rds-credentials');
        expect(typedTemplate.Resources.DBSecret.Properties.SecretString).toBe('{"username": "dbadmin", "password": "admin1234"}');
      });
      test('should define PrimaryDBSubnetGroup with correct subnets', () => {
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup).toBeDefined();
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Properties.DBSubnetGroupDescription).toBe('DB Subnet Group for Primary DB');
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds).toHaveLength(2);
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds[0].Ref).toBe('PrivateSubnet1');
        expect(typedTemplate.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds[1].Ref).toBe('PrivateSubnet2');
      });
      test('should define DBSecurityGroup with correct properties', () => {
        expect(typedTemplate.Resources.DBSecurityGroup).toBeDefined();
        expect(typedTemplate.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        expect(typedTemplate.Resources.DBSecurityGroup.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.DBSecurityGroup.Properties.GroupDescription).toBe('Allow traffic from App Security Group');
        expect(typedTemplate.Resources.DBSecurityGroup.Properties.VpcId.Ref).toBe('VPC');
      });
      test('should define PrimaryDBInstance with correct properties', () => {
        expect(typedTemplate.Resources.PrimaryDBInstance).toBeDefined();
        expect(typedTemplate.Resources.PrimaryDBInstance.Type).toBe('AWS::RDS::DBInstance');
        expect(typedTemplate.Resources.PrimaryDBInstance.Condition).toBe('IsPrimaryDeployment');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.DBInstanceIdentifier['Fn::Sub']).toBe('${EnvironmentSuffix}-primary-db-${AWS::Region}');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.Engine).toBe('mysql');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.EngineVersion).toBe('8.0.35');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.DBInstanceClass).toBe('db.t3.micro');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.AllocatedStorage).toBe('20');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.MasterUsername['Fn::Sub']).toBe('{{resolve:secretsmanager:${DBSecret}:SecretString:username}}');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.MasterUserPassword['Fn::Sub']).toBe('{{resolve:secretsmanager:${DBSecret}:SecretString:password}}');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.DBSubnetGroupName.Ref).toBe('PrimaryDBSubnetGroup');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.VPCSecurityGroups).toHaveLength(1);
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.VPCSecurityGroups[0].Ref).toBe('DBSecurityGroup');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.PubliclyAccessible).toBe(false);
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.StorageEncrypted).toBe(true);
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.KmsKeyId.Ref).toBe('KMSKey');
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.MultiAZ).toBe(false);
        expect(typedTemplate.Resources.PrimaryDBInstance.Properties.DeletionProtection).toBe(false);
      });
    });
  });

  describe('Replica Deployment Resources', () => {
    test('should define ReplicaDBSubnetGroup with imported subnet', () => {
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup).toBeDefined();
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup.Condition).toBe('IsReplicaDeployment');
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS Replica');
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup.Properties.SubnetIds).toHaveLength(1);
      expect(typedTemplate.Resources.ReplicaDBSubnetGroup.Properties.SubnetIds[0]['Fn::ImportValue']['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet1Id');
    });
    test('should define RDSReadReplica with correct properties', () => {
      expect(typedTemplate.Resources.RDSReadReplica).toBeDefined();
      expect(typedTemplate.Resources.RDSReadReplica.Type).toBe('AWS::RDS::DBInstance');
      expect(typedTemplate.Resources.RDSReadReplica.Condition).toBe('IsReplicaDeployment');
      expect(typedTemplate.Resources.RDSReadReplica.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(typedTemplate.Resources.RDSReadReplica.Properties.DBSubnetGroupName.Ref).toBe('ReplicaDBSubnetGroup');
      expect(typedTemplate.Resources.RDSReadReplica.Properties.SourceDBInstanceIdentifier.Ref).toBe('PrimaryDbIdentifier');
      expect(typedTemplate.Resources.RDSReadReplica.Properties.SourceRegion.Ref).toBe('PrimaryRegion');
      // StorageEncrypted should not be present for read replicas
      expect(typedTemplate.Resources.RDSReadReplica.Properties.StorageEncrypted).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should define PrimaryDatabaseIdentifier output for primary deployment', () => {
      expect(typedTemplate.Outputs.PrimaryDatabaseIdentifier).toBeDefined();
      expect(typedTemplate.Outputs.PrimaryDatabaseIdentifier.Condition).toBe('IsPrimaryDeployment');
      expect(typedTemplate.Outputs.PrimaryDatabaseIdentifier.Description).toBe('Identifier for the primary RDS instance (USE THIS FOR REPLICA DEPLOYMENTS)');
      expect(typedTemplate.Outputs.PrimaryDatabaseIdentifier.Value.Ref).toBe('PrimaryDBInstance');
      expect(typedTemplate.Outputs.PrimaryDatabaseIdentifier.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-PrimaryDBIdentifier');
    });
    test('should define VPCId output for primary deployment', () => {
      expect(typedTemplate.Outputs.VPCId).toBeDefined();
      expect(typedTemplate.Outputs.VPCId.Condition).toBe('IsPrimaryDeployment');
      expect(typedTemplate.Outputs.VPCId.Description).toBe('ID of the created VPC');
      expect(typedTemplate.Outputs.VPCId.Value.Ref).toBe('VPC');
      expect(typedTemplate.Outputs.VPCId.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPCId');
    });
    test('should define PrivateSubnet1Id output for primary deployment', () => {
      expect(typedTemplate.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(typedTemplate.Outputs.PrivateSubnet1Id.Condition).toBe('IsPrimaryDeployment');
      expect(typedTemplate.Outputs.PrivateSubnet1Id.Description).toBe('ID of Private Subnet 1');
      expect(typedTemplate.Outputs.PrivateSubnet1Id.Value.Ref).toBe('PrivateSubnet1');
      expect(typedTemplate.Outputs.PrivateSubnet1Id.Export.Name['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet1Id');
    });
    test('should define PrivateSubnet2Id output for primary deployment', () => {
      expect(typedTemplate.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(typedTemplate.Outputs.PrivateSubnet2Id.Condition).toBe('IsPrimaryDeployment');
      expect(typedTemplate.Outputs.PrivateSubnet2Id.Description).toBe('ID of Private Subnet 2');
      expect(typedTemplate.Outputs.PrivateSubnet2Id.Value.Ref).toBe('PrivateSubnet2');
      expect(typedTemplate.Outputs.PrivateSubnet2Id.Export.Name['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet2Id');
    });
    test('should define ReadReplicaEndpoint output for replica deployment', () => {
      expect(typedTemplate.Outputs.ReadReplicaEndpoint).toBeDefined();
      expect(typedTemplate.Outputs.ReadReplicaEndpoint.Condition).toBe('IsReplicaDeployment');
      expect(typedTemplate.Outputs.ReadReplicaEndpoint.Description).toBe('Endpoint for the RDS Read Replica in this region');
      expect(typedTemplate.Outputs.ReadReplicaEndpoint.Value['Fn::GetAtt']).toEqual(['RDSReadReplica', 'Endpoint.Address']);
    });
  });

  describe('Template Validation', () => {
    test('should have all required resource types defined', () => {
      const resourceTypes = Object.values(typedTemplate.Resources).map((resource: any) => resource.Type);
      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');
      expect(resourceTypes).toContain('AWS::EC2::Route');
      expect(resourceTypes).toContain('AWS::EC2::SubnetRouteTableAssociation');
      expect(resourceTypes).toContain('AWS::EC2::EIP');
      expect(resourceTypes).toContain('AWS::EC2::NatGateway');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
      expect(resourceTypes).toContain('AWS::KMS::Key');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::S3::BucketPolicy');
      expect(resourceTypes).toContain('AWS::CloudFront::CloudFrontOriginAccessIdentity');
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
      expect(resourceTypes).toContain('AWS::SecretsManager::Secret');
      expect(resourceTypes).toContain('AWS::RDS::DBSubnetGroup');
      expect(resourceTypes).toContain('AWS::RDS::DBInstance');
    });
    test('should have proper condition usage for all resources', () => {
      const primaryResources = ['VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable1', 'PublicRoute1', 'PublicSubnet1Association', 'EIP1', 'NatGateway1', 'PrivateRouteTable1', 'PrivateRoute1', 'PrivateSubnet1Association', 'PrivateSubnet2Association', 'KMSKey', 'WebAppBucket', 'CloudFrontOAI', 'WebAppBucketPolicy', 'CloudFrontDistribution', 'DBSecret', 'PrimaryDBSubnetGroup', 'DBSecurityGroup', 'PrimaryDBInstance'];
      const replicaResources = ['ReplicaDBSubnetGroup', 'RDSReadReplica'];
      primaryResources.forEach(resourceName => {
        expect(typedTemplate.Resources[resourceName].Condition).toBe('IsPrimaryDeployment');
      });
      replicaResources.forEach(resourceName => {
        expect(typedTemplate.Resources[resourceName].Condition).toBe('IsReplicaDeployment');
      });
    });
    test('should have proper environment suffix usage in resource names', () => {
      const resourcesWithEnvironmentSuffix = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable1', 'NatGateway1', 'PrivateRouteTable1', 'DBSecret', 'PrimaryDBInstance'];
      resourcesWithEnvironmentSuffix.forEach(resourceName => {
        const resource = typedTemplate.Resources[resourceName];
        if (resource.Properties.Tags) {
          const nameTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Name');
          if (nameTag) {
            expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
        if (resource.Properties.Name) {
          expect(resource.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
        if (resource.Properties.DBInstanceIdentifier) {
          expect(resource.Properties.DBInstanceIdentifier['Fn::Sub']).toContain('${EnvironmentSuffix}');
        }
      });
    });
  });
});
