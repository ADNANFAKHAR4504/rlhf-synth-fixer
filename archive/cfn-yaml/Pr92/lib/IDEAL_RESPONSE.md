```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Unified Template: Deploys a Primary stack or a Replica stack based on parameters. v2.0'

Parameters:
  DeploymentType:
    Type: String
    Description: 'Choose "Primary" for your main region or "Replica" for secondary regions.'
    AllowedValues:
      - Primary
      - Replica
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for naming (e.g., dev, pr42)'
    Default: 'dev'
  DomainName:
    Type: String
    Description: '(Required for Primary) The apex domain name for your application (e.g., example.com).'
  Subdomain:
    Type: String
    Description: '(Required for Primary) The subdomain for your application (e.g., app for app.example.com).'
  PrimaryDbIdentifier:
    Type: String
    Description: '(Required for Replica) The DB Identifier of the primary RDS instance (e.g., prod-primary-db-us-east-1).'
    Default: ''
  PrimaryRegion:
    Type: String
    Description: '(Required for Replica) The AWS Region of the source/primary database.'
    Default: 'us-east-1'

Conditions:
  IsPrimaryDeployment: !Equals [!Ref DeploymentType, 'Primary']
  IsReplicaDeployment: !Equals [!Ref DeploymentType, 'Replica']

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Core Deployment Configuration'
        Parameters:
          - DeploymentType
          - EnvironmentSuffix
      - Label:
          default: 'Primary Deployment Settings (Only used if DeploymentType is Primary)'
        Parameters:
          - DomainName
          - Subdomain
      - Label:
          default: 'Replica Deployment Settings (Only used if DeploymentType is Replica)'
        Parameters:
          - PrimaryDbIdentifier
          - PrimaryRegion

Resources:
  # --- PRIMARY-ONLY RESOURCES ---
  VPC:
    Type: AWS::EC2::VPC
    Condition: IsPrimaryDeployment
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-vpc'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Condition: IsPrimaryDeployment
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-subnet-az1'
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-az1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-subnet-az2'

  PublicRouteTable1:
    Type: AWS::EC2::RouteTable
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-public-rt-az1'
  PublicRoute1:
    Type: AWS::EC2::Route
    Condition: IsPrimaryDeployment
    Properties:
      RouteTableId: !Ref PublicRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway
  PublicSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryDeployment
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable1
  EIP1:
    Type: AWS::EC2::EIP
    Condition: IsPrimaryDeployment
    Properties:
      Domain: vpc
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Condition: IsPrimaryDeployment
    Properties:
      AllocationId: !GetAtt EIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-nat-gw-az1'
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Condition: IsPrimaryDeployment
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentSuffix}-private-rt-az1'
  PrivateRoute1:
    Type: AWS::EC2::Route
    Condition: IsPrimaryDeployment
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1
  PrivateSubnet1Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryDeployment
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2Association:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsPrimaryDeployment
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable1

  KMSKey:
    Type: AWS::KMS::Key
    Condition: IsPrimaryDeployment
    Properties:
      Description: 'General purpose KMS key'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Allow administration of the key'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'

  WebAppBucket:
    Type: AWS::S3::Bucket
    Condition: IsPrimaryDeployment
    Properties:
      BucketName: !Sub '${Subdomain}-${DomainName}-${AWS::Region}'
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref KMSKey

  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Condition: IsPrimaryDeployment
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: !Sub 'OAI for ${DomainName}'

  WebAppBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: IsPrimaryDeployment
    Properties:
      Bucket: !Ref WebAppBucket
      PolicyDocument:
        Statement:
          - Sid: 'AllowCloudFront'
            Effect: Allow
            Principal:
              CanonicalUser: !GetAtt CloudFrontOAI.S3CanonicalUserId
            Action: 's3:GetObject'
            Resource: !Sub 'arn:aws:s3:::${WebAppBucket}/*'

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Condition: IsPrimaryDeployment
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultRootObject: 'index.html'
        Origins:
          - Id: 'S3Origin'
            DomainName: !GetAtt WebAppBucket.DomainName
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        DefaultCacheBehavior:
          TargetOriginId: 'S3Origin'
          ViewerProtocolPolicy: 'redirect-to-https'
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
        PriceClass: 'PriceClass_All'

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Condition: IsPrimaryDeployment
    Properties:
      Name: !Sub '${EnvironmentSuffix}/rds-credentials'
      SecretString: '{"username": "dbadmin", "password": "admin1234"}'

  PrimaryDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Condition: IsPrimaryDeployment
    Properties:
      DBSubnetGroupDescription: 'DB Subnet Group for Primary DB'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
  
  DBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsPrimaryDeployment
    Properties:
      GroupDescription: 'Allow traffic from App Security Group'
      VpcId: !Ref VPC
      
  PrimaryDBInstance:
    Type: AWS::RDS::DBInstance
    Condition: IsPrimaryDeployment
    Properties:
      DBInstanceIdentifier: !Sub '${EnvironmentSuffix}-primary-db-${AWS::Region}'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      DBInstanceClass: 'db.t3.micro'
      AllocatedStorage: '20'
      MasterUsername: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:username}}'
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBSubnetGroupName: !Ref PrimaryDBSubnetGroup
      VPCSecurityGroups:
        - !Ref DBSecurityGroup
      PubliclyAccessible: false
      StorageEncrypted: true
      KmsKeyId: !Ref KMSKey
      MultiAZ: false # Set to false for faster dev/test deployments
      DeletionProtection: false

  # --- REPLICA-ONLY RESOURCES ---
  ReplicaDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Condition: IsReplicaDeployment
    Properties:
      DBSubnetGroupDescription: "Subnet group for RDS Replica"
      # This looks up the subnets created by the Primary deployment in THIS region.
      # This assumes you have already run the template with 'Primary' mode in this region.
      SubnetIds:
         - Fn::ImportValue: !Sub '${EnvironmentSuffix}-PrivateSubnet1Id'

  RDSReadReplica:
    Type: AWS::RDS::DBInstance
    Condition: IsReplicaDeployment
    Properties:
      DBInstanceClass: 'db.t3.micro'
      DBSubnetGroupName: !Ref ReplicaDBSubnetGroup
      SourceDBInstanceIdentifier: !Ref PrimaryDbIdentifier
      SourceRegion: !Ref PrimaryRegion

Outputs:
  PrimaryDatabaseIdentifier:
    Condition: IsPrimaryDeployment
    Description: 'Identifier for the primary RDS instance (USE THIS FOR REPLICA DEPLOYMENTS)'
    Value: !Ref PrimaryDBInstance
    Export:
      Name: !Sub '${AWS::StackName}-PrimaryDBIdentifier'
  VPCId:
    Condition: IsPrimaryDeployment
    Description: 'ID of the created VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'
  PrivateSubnet1Id:
    Condition: IsPrimaryDeployment
    Description: 'ID of Private Subnet 1'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${EnvironmentSuffix}-PrivateSubnet1Id' # Simpler export name for replicas to find
  PrivateSubnet2Id:
    Condition: IsPrimaryDeployment
    Description: 'ID of Private Subnet 2'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${EnvironmentSuffix}-PrivateSubnet2Id'
  ReadReplicaEndpoint:
    Condition: IsReplicaDeployment
    Description: 'Endpoint for the RDS Read Replica in this region'
    Value: !GetAtt RDSReadReplica.Endpoint.Address
```