import { expect } from '@jest/globals';
import template from '../lib/TapStack.json';

describe('TapStack CloudFormation Template Unit Tests', () => {
  describe('Template Structure', () => {
    test('should have correct template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe('Unified Template: Deploys a Primary stack or a Replica stack based on parameters. v2.0');
    });
  });

  describe('Parameters', () => {
    test('should define DeploymentType parameter with correct allowed values', () => {
      expect(template.Parameters.DeploymentType).toBeDefined();
      expect(template.Parameters.DeploymentType.Type).toBe('String');
      expect(template.Parameters.DeploymentType.AllowedValues).toEqual(['Primary', 'Replica']);
      expect(template.Parameters.DeploymentType.Description).toContain('Choose "Primary" for your main region');
    });

    test('should define EnvironmentSuffix parameter with correct default', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('Environment suffix for resource naming');
    });

    test('should define DomainName parameter with correct default', () => {
      expect(template.Parameters.DomainName).toBeDefined();
      expect(template.Parameters.DomainName.Type).toBe('String');
      expect(template.Parameters.DomainName.Default).toBe('example.com');
      expect(template.Parameters.DomainName.Description).toContain('apex domain name');
    });

    test('should define Subdomain parameter with correct default', () => {
      expect(template.Parameters.Subdomain).toBeDefined();
      expect(template.Parameters.Subdomain.Type).toBe('String');
      expect(template.Parameters.Subdomain.Default).toBe('app');
      expect(template.Parameters.Subdomain.Description).toContain('subdomain for your application');
    });

    test('should define DBUsername parameter with correct default', () => {
      expect(template.Parameters.DBUsername).toBeDefined();
      expect(template.Parameters.DBUsername.Type).toBe('String');
      expect(template.Parameters.DBUsername.Default).toBe('dbadmin');
      expect(template.Parameters.DBUsername.Description).toContain('master username for the RDS database');
    });

    test('should define PrimaryDbIdentifier parameter for replica deployments', () => {
      expect(template.Parameters.PrimaryDbIdentifier).toBeDefined();
      expect(template.Parameters.PrimaryDbIdentifier.Type).toBe('String');
      expect(template.Parameters.PrimaryDbIdentifier.Default).toBe('');
      expect(template.Parameters.PrimaryDbIdentifier.Description).toContain('DB Identifier of the primary RDS instance');
    });

    test('should define PrimaryRegion parameter with correct default', () => {
      expect(template.Parameters.PrimaryRegion).toBeDefined();
      expect(template.Parameters.PrimaryRegion.Type).toBe('String');
      expect(template.Parameters.PrimaryRegion.Default).toBe('us-east-1');
      expect(template.Parameters.PrimaryRegion.Description).toContain('AWS Region of the source/primary database');
    });
  });

  describe('Conditions', () => {
    test('should define IsPrimaryDeployment condition', () => {
      expect(template.Conditions.IsPrimaryDeployment).toBeDefined();
      expect(template.Conditions.IsPrimaryDeployment['Fn::Equals']).toBeDefined();
      expect(template.Conditions.IsPrimaryDeployment['Fn::Equals'][0].Ref).toBe('DeploymentType');
      expect(template.Conditions.IsPrimaryDeployment['Fn::Equals'][1]).toBe('Primary');
    });

    test('should define IsReplicaDeployment condition', () => {
      expect(template.Conditions.IsReplicaDeployment).toBeDefined();
      expect(template.Conditions.IsReplicaDeployment['Fn::Equals']).toBeDefined();
      expect(template.Conditions.IsReplicaDeployment['Fn::Equals'][0].Ref).toBe('DeploymentType');
      expect(template.Conditions.IsReplicaDeployment['Fn::Equals'][1]).toBe('Replica');
    });
  });

  describe('Metadata', () => {
    test('should define parameter groups for CloudFormation interface', () => {
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });

    test('should have Core Deployment Configuration parameter group', () => {
      const coreGroup = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0];
      expect(coreGroup.Label.default).toBe('Core Deployment Configuration');
      expect(coreGroup.Parameters).toContain('DeploymentType');
      expect(coreGroup.Parameters).toContain('EnvironmentSuffix');
    });

    test('should have Primary Deployment Settings parameter group', () => {
      const primaryGroup = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[1];
      expect(primaryGroup.Label.default).toBe('Primary Deployment Settings (Only used if DeploymentType is Primary)');
      expect(primaryGroup.Parameters).toContain('DomainName');
      expect(primaryGroup.Parameters).toContain('Subdomain');
      expect(primaryGroup.Parameters).toContain('DBUsername');
    });

    test('should have Replica Deployment Settings parameter group', () => {
      const replicaGroup = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[2];
      expect(replicaGroup.Label.default).toBe('Replica Deployment Settings (Only used if DeploymentType is Replica)');
      expect(replicaGroup.Parameters).toContain('PrimaryDbIdentifier');
      expect(replicaGroup.Parameters).toContain('PrimaryRegion');
    });
  });

  describe('Primary Deployment Resources', () => {
    describe('VPC', () => {
      test('should define VPC with correct properties and condition', () => {
        expect(template.Resources.VPC).toBeDefined();
        expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
        expect(template.Resources.VPC.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.VPC.Properties.CidrBlock).toBe('10.0.0.0/16');
        expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
        expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
        expect(template.Resources.VPC.Properties.Tags).toHaveLength(1);
        expect(template.Resources.VPC.Properties.Tags[0].Key).toBe('Name');
        expect(template.Resources.VPC.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-vpc');
      });
    });

    describe('Internet Gateway', () => {
      test('should define Internet Gateway with correct properties and condition', () => {
        expect(template.Resources.InternetGateway).toBeDefined();
        expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
        expect(template.Resources.InternetGateway.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.InternetGateway.Properties.Tags).toHaveLength(1);
        expect(template.Resources.InternetGateway.Properties.Tags[0].Key).toBe('Name');
        expect(template.Resources.InternetGateway.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-igw');
      });
    });

    describe('VPC Gateway Attachment', () => {
      test('should define VPC Gateway Attachment with correct references', () => {
        expect(template.Resources.AttachGateway).toBeDefined();
        expect(template.Resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
        expect(template.Resources.AttachGateway.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.AttachGateway.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.AttachGateway.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
      });
    });

    describe('Subnets', () => {
      test('should define PublicSubnet1 with correct properties', () => {
        expect(template.Resources.PublicSubnet1).toBeDefined();
        expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PublicSubnet1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PublicSubnet1.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
        expect(template.Resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(template.Resources.PublicSubnet1.Properties.AvailabilityZone['Fn::Select']).toBeDefined();
        expect(template.Resources.PublicSubnet1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-public-subnet-az1');
      });

      test('should define PrivateSubnet1 with correct properties', () => {
        expect(template.Resources.PrivateSubnet1).toBeDefined();
        expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PrivateSubnet1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateSubnet1.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toBe('10.0.10.0/24');
        expect(template.Resources.PrivateSubnet1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-subnet-az1');
      });

      test('should define PrivateSubnet2 with correct properties', () => {
        expect(template.Resources.PrivateSubnet2).toBeDefined();
        expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources.PrivateSubnet2.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateSubnet2.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.PrivateSubnet2.Properties.CidrBlock).toBe('10.0.11.0/24');
        expect(template.Resources.PrivateSubnet2.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-subnet-az2');
      });
    });

    describe('Route Tables', () => {
      test('should define PublicRouteTable1 with correct properties', () => {
        expect(template.Resources.PublicRouteTable1).toBeDefined();
        expect(template.Resources.PublicRouteTable1.Type).toBe('AWS::EC2::RouteTable');
        expect(template.Resources.PublicRouteTable1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PublicRouteTable1.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.PublicRouteTable1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-public-rt-az1');
      });

      test('should define PublicRoute1 with correct routing', () => {
        expect(template.Resources.PublicRoute1).toBeDefined();
        expect(template.Resources.PublicRoute1.Type).toBe('AWS::EC2::Route');
        expect(template.Resources.PublicRoute1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PublicRoute1.Properties.RouteTableId.Ref).toBe('PublicRouteTable1');
        expect(template.Resources.PublicRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(template.Resources.PublicRoute1.Properties.GatewayId.Ref).toBe('InternetGateway');
      });

      test('should define PrivateRouteTable1 with correct properties', () => {
        expect(template.Resources.PrivateRouteTable1).toBeDefined();
        expect(template.Resources.PrivateRouteTable1.Type).toBe('AWS::EC2::RouteTable');
        expect(template.Resources.PrivateRouteTable1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateRouteTable1.Properties.VpcId.Ref).toBe('VPC');
        expect(template.Resources.PrivateRouteTable1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-private-rt-az1');
      });

      test('should define PrivateRoute1 with NAT Gateway routing', () => {
        expect(template.Resources.PrivateRoute1).toBeDefined();
        expect(template.Resources.PrivateRoute1.Type).toBe('AWS::EC2::Route');
        expect(template.Resources.PrivateRoute1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateRoute1.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
        expect(template.Resources.PrivateRoute1.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
        expect(template.Resources.PrivateRoute1.Properties.NatGatewayId.Ref).toBe('NatGateway1');
      });
    });

    describe('Subnet Route Table Associations', () => {
      test('should define PublicSubnet1Association', () => {
        expect(template.Resources.PublicSubnet1Association).toBeDefined();
        expect(template.Resources.PublicSubnet1Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(template.Resources.PublicSubnet1Association.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PublicSubnet1Association.Properties.SubnetId.Ref).toBe('PublicSubnet1');
        expect(template.Resources.PublicSubnet1Association.Properties.RouteTableId.Ref).toBe('PublicRouteTable1');
      });

      test('should define PrivateSubnet1Association', () => {
        expect(template.Resources.PrivateSubnet1Association).toBeDefined();
        expect(template.Resources.PrivateSubnet1Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(template.Resources.PrivateSubnet1Association.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateSubnet1Association.Properties.SubnetId.Ref).toBe('PrivateSubnet1');
        expect(template.Resources.PrivateSubnet1Association.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      });

      test('should define PrivateSubnet2Association', () => {
        expect(template.Resources.PrivateSubnet2Association).toBeDefined();
        expect(template.Resources.PrivateSubnet2Association.Type).toBe('AWS::EC2::SubnetRouteTableAssociation');
        expect(template.Resources.PrivateSubnet2Association.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrivateSubnet2Association.Properties.SubnetId.Ref).toBe('PrivateSubnet2');
        expect(template.Resources.PrivateSubnet2Association.Properties.RouteTableId.Ref).toBe('PrivateRouteTable1');
      });
    });

    describe('NAT Gateway', () => {
      test('should define EIP1 for NAT Gateway', () => {
        expect(template.Resources.EIP1).toBeDefined();
        expect(template.Resources.EIP1.Type).toBe('AWS::EC2::EIP');
        expect(template.Resources.EIP1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.EIP1.Properties.Domain).toBe('vpc');
      });

      test('should define NatGateway1 with correct properties', () => {
        expect(template.Resources.NatGateway1).toBeDefined();
        expect(template.Resources.NatGateway1.Type).toBe('AWS::EC2::NatGateway');
        expect(template.Resources.NatGateway1.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.NatGateway1.Properties.AllocationId['Fn::GetAtt']).toEqual(['EIP1', 'AllocationId']);
        expect(template.Resources.NatGateway1.Properties.SubnetId.Ref).toBe('PublicSubnet1');
        expect(template.Resources.NatGateway1.Properties.Tags[0].Value['Fn::Sub']).toBe('${EnvironmentSuffix}-nat-gw-az1');
      });
    });

    describe('KMS Key', () => {
      test('should define KMSKey with correct properties', () => {
        expect(template.Resources.KMSKey).toBeDefined();
        expect(template.Resources.KMSKey.Type).toBe('AWS::KMS::Key');
        expect(template.Resources.KMSKey.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.KMSKey.Properties.Description).toBe('General purpose KMS key');
        expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Version).toBe('2012-10-17');
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement).toHaveLength(1);
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Sid).toBe('Allow administration of the key');
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Effect).toBe('Allow');
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Principal.AWS['Fn::Sub']).toBe('arn:aws:iam::${AWS::AccountId}:root');
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Action).toBe('kms:*');
        expect(template.Resources.KMSKey.Properties.KeyPolicy.Statement[0].Resource).toBe('*');
      });
    });

    describe('S3 Bucket', () => {
      test('should define WebAppBucket with correct properties', () => {
        expect(template.Resources.WebAppBucket).toBeDefined();
        expect(template.Resources.WebAppBucket.Type).toBe('AWS::S3::Bucket');
        expect(template.Resources.WebAppBucket.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.WebAppBucket.Properties.BucketName['Fn::Sub']).toBe('${Subdomain}-${DomainName}-${AWS::Region}');
        expect(template.Resources.WebAppBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
        expect(template.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
        expect(template.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
        expect(template.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
        expect(template.Resources.WebAppBucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
        expect(template.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
        expect(template.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(template.Resources.WebAppBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID.Ref).toBe('KMSKey');
      });
    });

    describe('CloudFront', () => {
      test('should define CloudFrontOAI with correct properties', () => {
        expect(template.Resources.CloudFrontOAI).toBeDefined();
        expect(template.Resources.CloudFrontOAI.Type).toBe('AWS::CloudFront::CloudFrontOriginAccessIdentity');
        expect(template.Resources.CloudFrontOAI.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.CloudFrontOAI.Properties.CloudFrontOriginAccessIdentityConfig.Comment['Fn::Sub']).toBe('OAI for ${DomainName}');
      });

      test('should define WebAppBucketPolicy with CloudFront access', () => {
        expect(template.Resources.WebAppBucketPolicy).toBeDefined();
        expect(template.Resources.WebAppBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
        expect(template.Resources.WebAppBucketPolicy.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.WebAppBucketPolicy.Properties.Bucket.Ref).toBe('WebAppBucket');
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement).toHaveLength(1);
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Sid).toBe('AllowCloudFront');
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Effect).toBe('Allow');
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Principal.CanonicalUser['Fn::GetAtt']).toEqual(['CloudFrontOAI', 'S3CanonicalUserId']);
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Action).toBe('s3:GetObject');
        expect(template.Resources.WebAppBucketPolicy.Properties.PolicyDocument.Statement[0].Resource['Fn::Sub']).toBe('arn:aws:s3:::${WebAppBucket}/*');
      });

      test('should define CloudFrontDistribution with correct configuration', () => {
        expect(template.Resources.CloudFrontDistribution).toBeDefined();
        expect(template.Resources.CloudFrontDistribution.Type).toBe('AWS::CloudFront::Distribution');
        expect(template.Resources.CloudFrontDistribution.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.Enabled).toBe(true);
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultRootObject).toBe('index.html');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins).toHaveLength(1);
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].Id).toBe('S3Origin');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].DomainName['Fn::GetAtt']).toEqual(['WebAppBucket', 'DomainName']);
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.Origins[0].S3OriginConfig.OriginAccessIdentity['Fn::Sub']).toBe('origin-access-identity/cloudfront/${CloudFrontOAI}');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.TargetOriginId).toBe('S3Origin');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ForwardedValues.QueryString).toBe(false);
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.DefaultCacheBehavior.ForwardedValues.Cookies.Forward).toBe('none');
        expect(template.Resources.CloudFrontDistribution.Properties.DistributionConfig.PriceClass).toBe('PriceClass_All');
      });
    });

    describe('RDS Resources', () => {
      test('should define DBSecret with correct properties', () => {
        expect(template.Resources.DBSecret).toBeDefined();
        expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
        expect(template.Resources.DBSecret.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.DBSecret.Properties.Name['Fn::Sub']).toBe('${EnvironmentSuffix}/rds-credentials');
        expect(template.Resources.DBSecret.Properties.GenerateSecretString.SecretStringTemplate['Fn::Sub']).toBe('{"username": "${DBUsername}"}');
        expect(template.Resources.DBSecret.Properties.GenerateSecretString.GenerateStringKey).toBe('password');
        expect(template.Resources.DBSecret.Properties.GenerateSecretString.PasswordLength).toBe(16);
        expect(template.Resources.DBSecret.Properties.GenerateSecretString.ExcludePunctuation).toBe(true);
      });

      test('should define PrimaryDBSubnetGroup with correct subnets', () => {
        expect(template.Resources.PrimaryDBSubnetGroup).toBeDefined();
        expect(template.Resources.PrimaryDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
        expect(template.Resources.PrimaryDBSubnetGroup.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrimaryDBSubnetGroup.Properties.DBSubnetGroupDescription).toBe('DB Subnet Group for Primary DB');
        expect(template.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds).toHaveLength(2);
        expect(template.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds[0].Ref).toBe('PrivateSubnet1');
        expect(template.Resources.PrimaryDBSubnetGroup.Properties.SubnetIds[1].Ref).toBe('PrivateSubnet2');
      });

      test('should define DBSecurityGroup with correct properties', () => {
        expect(template.Resources.DBSecurityGroup).toBeDefined();
        expect(template.Resources.DBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
        expect(template.Resources.DBSecurityGroup.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.DBSecurityGroup.Properties.GroupDescription).toBe('Allow traffic from App Security Group');
        expect(template.Resources.DBSecurityGroup.Properties.VpcId.Ref).toBe('VPC');
      });

      test('should define PrimaryDBInstance with correct properties', () => {
        expect(template.Resources.PrimaryDBInstance).toBeDefined();
        expect(template.Resources.PrimaryDBInstance.Type).toBe('AWS::RDS::DBInstance');
        expect(template.Resources.PrimaryDBInstance.Condition).toBe('IsPrimaryDeployment');
        expect(template.Resources.PrimaryDBInstance.Properties.DBInstanceIdentifier['Fn::Sub']).toBe('${EnvironmentSuffix}-primary-db-${AWS::Region}');
        expect(template.Resources.PrimaryDBInstance.Properties.Engine).toBe('mysql');
        expect(template.Resources.PrimaryDBInstance.Properties.EngineVersion).toBe('8.0');
        expect(template.Resources.PrimaryDBInstance.Properties.DBInstanceClass).toBe('db.t3.micro');
        expect(template.Resources.PrimaryDBInstance.Properties.AllocatedStorage).toBe('20');
        expect(template.Resources.PrimaryDBInstance.Properties.MasterUsername['Fn::Sub']).toBe('{{resolve:secretsmanager:${DBSecret}:SecretString:username}}');
        expect(template.Resources.PrimaryDBInstance.Properties.MasterUserPassword['Fn::Sub']).toBe('{{resolve:secretsmanager:${DBSecret}:SecretString:password}}');
        expect(template.Resources.PrimaryDBInstance.Properties.DBSubnetGroupName.Ref).toBe('PrimaryDBSubnetGroup');
        expect(template.Resources.PrimaryDBInstance.Properties.VPCSecurityGroups).toHaveLength(1);
        expect(template.Resources.PrimaryDBInstance.Properties.VPCSecurityGroups[0].Ref).toBe('DBSecurityGroup');
        expect(template.Resources.PrimaryDBInstance.Properties.PubliclyAccessible).toBe(false);
        expect(template.Resources.PrimaryDBInstance.Properties.StorageEncrypted).toBe(true);
        expect(template.Resources.PrimaryDBInstance.Properties.KmsKeyId.Ref).toBe('KMSKey');
        expect(template.Resources.PrimaryDBInstance.Properties.MultiAZ).toBe(false);
        expect(template.Resources.PrimaryDBInstance.Properties.DeletionProtection).toBe(false);
      });
    });
  });

  describe('Replica Deployment Resources', () => {
    test('should define ReplicaDBSubnetGroup with imported subnet', () => {
      expect(template.Resources.ReplicaDBSubnetGroup).toBeDefined();
      expect(template.Resources.ReplicaDBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.ReplicaDBSubnetGroup.Condition).toBe('IsReplicaDeployment');
      expect(template.Resources.ReplicaDBSubnetGroup.Properties.DBSubnetGroupDescription).toBe('Subnet group for RDS Replica');
      expect(template.Resources.ReplicaDBSubnetGroup.Properties.SubnetIds).toHaveLength(1);
      expect(template.Resources.ReplicaDBSubnetGroup.Properties.SubnetIds[0]['Fn::ImportValue']['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet1Id');
    });

    test('should define RDSReadReplica with correct properties', () => {
      expect(template.Resources.RDSReadReplica).toBeDefined();
      expect(template.Resources.RDSReadReplica.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.RDSReadReplica.Condition).toBe('IsReplicaDeployment');
      expect(template.Resources.RDSReadReplica.Properties.DBInstanceClass).toBe('db.t3.micro');
      expect(template.Resources.RDSReadReplica.Properties.DBSubnetGroupName.Ref).toBe('ReplicaDBSubnetGroup');
      expect(template.Resources.RDSReadReplica.Properties.SourceDBInstanceIdentifier.Ref).toBe('PrimaryDbIdentifier');
      expect(template.Resources.RDSReadReplica.Properties.SourceRegion.Ref).toBe('PrimaryRegion');
      expect(template.Resources.RDSReadReplica.Properties.StorageEncrypted).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should define PrimaryDatabaseIdentifier output for primary deployment', () => {
      expect(template.Outputs.PrimaryDatabaseIdentifier).toBeDefined();
      expect(template.Outputs.PrimaryDatabaseIdentifier.Condition).toBe('IsPrimaryDeployment');
      expect(template.Outputs.PrimaryDatabaseIdentifier.Description).toBe('Identifier for the primary RDS instance (USE THIS FOR REPLICA DEPLOYMENTS)');
      expect(template.Outputs.PrimaryDatabaseIdentifier.Value.Ref).toBe('PrimaryDBInstance');
      expect(template.Outputs.PrimaryDatabaseIdentifier.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-PrimaryDBIdentifier');
    });

    test('should define VPCId output for primary deployment', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Condition).toBe('IsPrimaryDeployment');
      expect(template.Outputs.VPCId.Description).toBe('ID of the created VPC');
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
      expect(template.Outputs.VPCId.Export.Name['Fn::Sub']).toBe('${AWS::StackName}-VPCId');
    });

    test('should define PrivateSubnet1Id output for primary deployment', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id.Condition).toBe('IsPrimaryDeployment');
      expect(template.Outputs.PrivateSubnet1Id.Description).toBe('ID of Private Subnet 1');
      expect(template.Outputs.PrivateSubnet1Id.Value.Ref).toBe('PrivateSubnet1');
      expect(template.Outputs.PrivateSubnet1Id.Export.Name['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet1Id');
    });

    test('should define PrivateSubnet2Id output for primary deployment', () => {
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id.Condition).toBe('IsPrimaryDeployment');
      expect(template.Outputs.PrivateSubnet2Id.Description).toBe('ID of Private Subnet 2');
      expect(template.Outputs.PrivateSubnet2Id.Value.Ref).toBe('PrivateSubnet2');
      expect(template.Outputs.PrivateSubnet2Id.Export.Name['Fn::Sub']).toBe('${EnvironmentSuffix}-PrivateSubnet2Id');
    });

    test('should define ReadReplicaEndpoint output for replica deployment', () => {
      expect(template.Outputs.ReadReplicaEndpoint).toBeDefined();
      expect(template.Outputs.ReadReplicaEndpoint.Condition).toBe('IsReplicaDeployment');
      expect(template.Outputs.ReadReplicaEndpoint.Description).toBe('Endpoint for the RDS Read Replica in this region');
      expect(template.Outputs.ReadReplicaEndpoint.Value['Fn::GetAtt']).toEqual(['RDSReadReplica', 'Endpoint.Address']);
    });
  });

  describe('Template Validation', () => {
    test('should have all required resource types defined', () => {
      const resourceTypes = Object.values(template.Resources).map((resource: any) => resource.Type);
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
        expect(template.Resources[resourceName].Condition).toBe('IsPrimaryDeployment');
      });

      replicaResources.forEach(resourceName => {
        expect(template.Resources[resourceName].Condition).toBe('IsReplicaDeployment');
      });
    });

    test('should have proper environment suffix usage in resource names', () => {
      const resourcesWithEnvironmentSuffix = ['VPC', 'InternetGateway', 'PublicSubnet1', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable1', 'NatGateway1', 'PrivateRouteTable1', 'DBSecret', 'PrimaryDBInstance'];
      
      resourcesWithEnvironmentSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName];
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
