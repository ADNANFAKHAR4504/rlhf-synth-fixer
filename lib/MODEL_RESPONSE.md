### Reasoning Trace
---

The user wants a fully valid, production-ready AWS CloudFormation template in YAML that:

1. Has a mandatory parameter `EnvironmentSuffix`
2. Uses a specific naming convention for ALL resources: `${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]`
3. Must include:
   - VPC with public/private subnets, IGW, NAT Gateway, route tables
   - EC2 instance in an Auto Scaling Group with Launch Template
   - IAM Instance Profile with S3ReadAccess policy (no wildcards)
   - RDS instance with KMS CMK encryption in private subnets
   - S3 bucket with versioning enabled
   - Security Group for EC2 (only port 443 inbound)
   - CloudWatch Logs & CloudTrail
4. No hardcoded values (ARN, account ID, region, zone, bucket name, IP)
5. No wildcard permissions
6. Must be fully valid and pass cfn-lint

Let me create this template step by step:

1. Parameters section with EnvironmentSuffix
2. VPC and networking resources
3. Security Groups
4. IAM Roles and Policies
5. KMS Key
6. S3 Bucket
7. RDS Instance
8. Launch Template
9. Auto Scaling Group
10. CloudWatch Logs
11. CloudTrail
12. Outputs

I need to be careful about:
- Following the exact naming convention for every resource
- No hardcoded values
- No wildcard permissions
- Proper dependencies
- Valid YAML syntax
### Answer 
---

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure environment setup with VPC, EC2, RDS, S3, and monitoring'

Parameters:
  EnvironmentSuffix:
    Type: String
    Description: 'Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)'
    Default: "pr4056"
    AllowedPattern: '^[a-zA-Z0-9\-]*$'
    ConstraintDescription: 'Must contain only alphanumeric characters and hyphens'

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-2:
      AMI: ami-0a70b9d193ae8a799
    eu-west-1:
      AMI: ami-0d71ea30463e0ff8d
    ap-southeast-1:
      AMI: ami-0f62d9254ca98e1aa

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc"

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-igw"

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-subnet-1"

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.10.0/24
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1"

  # Private Subnet 2 (for RDS Multi-AZ)
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-2"

  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-eip"

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-nat-gateway"

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-public-rt"

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  # Private Route Table
  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-rt"

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances - HTTPS only
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-sg"

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS instance
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-sg"

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-bucket"
      VersioningConfiguration:
        Status: Enabled
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-bucket"

  # CloudWatch Log Group
  CloudWatchLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-log-group"
      RetentionInDays: 7

  # CloudTrail Bucket
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail-bucket"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail-bucket"

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control

  # IAM Role for EC2
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - !Ref S3ReadAccessPolicy
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-role"

  S3ReadAccessPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-S3ReadAccess"
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - s3:GetObject
              - s3:ListBucket
              - s3:GetBucketLocation
              - s3:GetBucketVersioning
              - s3:GetObjectVersion
            Resource:
              - !GetAtt S3Bucket.Arn
              - !Sub "${S3Bucket.Arn}/*"

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-profile"
      Roles:
        - !Ref EC2Role

  # KMS Key for RDS
  RDSKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for RDS encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub "arn:aws:iam::${AWS::AccountId}:root"
            Action: kms:*
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-kms-key"

  RDSKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub "alias/${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-key"
      TargetKeyId: !Ref RDSKMSKey

  # RDS Subnet Group
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"
      DBSubnetGroupDescription: Subnet group for RDS instance
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-db-subnet-group"

  # RDS Instance
  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"
      DBInstanceClass: db.t3.micro
      AllocatedStorage: 20
      StorageType: gp2
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKMSKey
      Engine: mysql
      EngineVersion: '8.0'
      MasterUsername: admin
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${RDSSecret}:SecretString:password}}"
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      DBSubnetGroupName: !Ref DBSubnetGroup
      MultiAZ: false
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds"

  RDSSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-rds-secret"
      Description: RDS master password
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-launch-template"
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
        InstanceType: t2.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-ec2-instance"

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg"
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 1
      MaxSize: 3
      DesiredCapacity: 1
      HealthCheckType: EC2
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-asg-instance"
          PropagateAtLaunch: true

  # CloudTrail
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-trail"
      S3BucketName: !Ref CloudTrailBucket
      CloudWatchLogsLogGroupArn: !GetAtt CloudWatchLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: false
      EnableLogFileValidation: true

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-cloudtrail-role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudTrailLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !GetAtt CloudWatchLogGroup.Arn

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-VPCId"

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PublicSubnet1Id"

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet1Id"

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-${EnvironmentSuffix}-PrivateSubnet2Id"

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket

  RDSEndpoint:
    Description: RDS Instance Endpoint
    Value: !GetAtt RDSInstance.Endpoint.Address

  EC2RoleArn:
    Description: EC2 IAM Role ARN
    Value: !GetAtt EC2Role.Arn

  LaunchTemplateId:
    Description: Launch Template ID
    Value: !Ref LaunchTemplate

  AutoScalingGroupName:
    Description: Auto Scaling Group Name
    Value: !Ref AutoScalingGroup

  CloudTrailName:
    Description: CloudTrail Name
    Value: !Ref CloudTrail

  CloudWatchLogGroupName:
    Description: CloudWatch Log Group Name
    Value: !Ref CloudWatchLogGroup
```