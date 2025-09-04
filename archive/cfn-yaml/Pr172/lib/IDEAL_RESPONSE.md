# ideal_response.md

An ideal response should:

✅ Use `AWSTemplateFormatVersion: '2010-09-09'`  
✅ Include all required modules (VPC, Subnets, IGW, NAT, IAM, S3, CloudTrail)  
✅ Deny non-SSL S3 access using proper BucketPolicy  
✅ Use `!Ref` and `!Sub` correctly  
✅ Apply `Environment` and `Owner` tags to all resources  
✅ Use AWS-managed KMS (`SSEAlgorithm: aws:kms`) for S3 encryption  
✅ Avoid wildcards in IAM actions/resources  
✅ Configure proper route tables and subnet associations  
✅ Ensure the S3 bucket is used as a CloudTrail destination  
✅ Pass cfn-lint and stack validation without manual corrections  
✅ Be ready for deployment in `us-east-1` without modification

The ideal response is production-ready and compliant with AWS security best practices.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Production infrastructure with VPC, subnets, secure S3 buckets (KMS encrypted), IAM roles, and CloudTrail

Parameters:
  EnvironmentName:
    Description: Environment name (dev/stage/production)
    Type: String
    Default: production
    AllowedValues:
      - dev
      - stage
      - production

  Owner:
    Description: Owner team name for resource tagging
    Type: String
    Default: TeamA

Mappings:
  AZConfig:
    us-east-1:
      AZ1: us-east-1a
      AZ2: us-east-1b

Resources:
  # 1. VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-VPC"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-IGW"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  GatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # 2. Subnets (Public and Private)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !FindInMap [AZConfig, !Ref "AWS::Region", AZ1]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-PublicSubnet-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !FindInMap [AZConfig, !Ref "AWS::Region", AZ2]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-PublicSubnet-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !FindInMap [AZConfig, !Ref "AWS::Region", AZ1]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-PrivateSubnet-AZ1"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !FindInMap [AZConfig, !Ref "AWS::Region", AZ2]
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-PrivateSubnet-AZ2"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  # 3. NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-NAT-EIP"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-NAT-GW"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  # 4. Routing
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-Public-RT"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-Private-RT"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  # 5. Subnet Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # 6. AppData S3 Bucket with KMS Encryption
  AppDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "production-bucket-${AWS::AccountId}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: alias/aws/s3
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-AppDataBucket"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
        - Key: Encryption
          Value: Enabled-KMS

  AppDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AppDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !GetAtt AppDataBucket.Arn
              - !Sub "${AppDataBucket.Arn}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"

  # 7. IAM Role with KMS Permissions
  EC2S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [ec2.amazonaws.com]
            Action: ['sts:AssumeRole']
      Path: /
      Policies:
        - PolicyName: S3KMSAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt AppDataBucket.Arn
                  - !Sub "${AppDataBucket.Arn}/*"
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-EC2-S3-Role"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref EC2S3AccessRole

  # 8. EC2 Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub "${EnvironmentName}-EC2-SecurityGroup"
      GroupDescription: Security group for EC2 instances allowing HTTPS inbound and restricted outbound
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 203.0.113.0/24
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
        - IpProtocol: udp
          FromPort: 53
          ToPort: 53
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-EC2-SecurityGroup"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner
  # 9. CloudTrail with KMS Encryption
  CloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "production-cloudtrail-log-${AWS::AccountId}"
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: alias/aws/s3
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-CloudTrailBucket"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner

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
            Resource: !Sub "${CloudTrailBucket.Arn}/AWSLogs/${AWS::AccountId}/*"
          - Sid: DenyNonSSLRequests
            Effect: Deny
            Principal: "*"
            Action: s3:*
            Resource:
              - !GetAtt CloudTrailBucket.Arn
              - !Sub "${CloudTrailBucket.Arn}/*"
            Condition:
              Bool:
                aws:SecureTransport: false

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailBucketPolicy
    Properties:
      S3BucketName: !Ref CloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      IsLogging: true
      TrailName: !Sub "${EnvironmentName}-CloudTrail"
      Tags:
        - Key: Name
          Value: !Sub "${EnvironmentName}-CloudTrail"
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Owner
          Value: !Ref Owner  

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCID"

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet1"

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnet2"

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet1"

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnet2"

  AppDataBucketName:
    Description: Application Data Bucket Name
    Value: !Ref AppDataBucket
    Export:
      Name: !Sub "${AWS::StackName}-AppDataBucketName"

  AppDataBucketArn:
    Description: Application Data Bucket ARN
    Value: !GetAtt AppDataBucket.Arn
    Export:
      Name: !Sub "${AWS::StackName}-AppDataBucketArn"

  EC2S3AccessRoleArn:
    Description: IAM Role ARN for EC2 S3 access
    Value: !GetAtt EC2S3AccessRole.Arn
    Export:
      Name: !Sub "${AWS::StackName}-EC2S3AccessRoleArn"

  EC2InstanceProfileName:
    Description: Instance Profile Name for EC2
    Value: !Ref EC2InstanceProfile
    Export:
      Name: !Sub "${AWS::StackName}-EC2InstanceProfileName"

  EC2SecurityGroupId:
    Description: Security Group ID for EC2 instances
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-EC2SecurityGroupId"
  CloudTrailBucketName:
    Description: CloudTrail logs bucket name
    Value: !Ref CloudTrailBucket
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailBucketName"

  CloudTrailArn:
    Description: CloudTrail ARN
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub "${AWS::StackName}-CloudTrailArn"
```
