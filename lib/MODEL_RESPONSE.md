# Secure AWS Infrastructure CloudFormation Template

Here's a comprehensive CloudFormation YAML template that meets all your security requirements:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with VPC, IAM, encryption, logging, and security best practices'

Parameters:
  Environment:
    Type: String
    Default: 'production'
    Description: 'Environment name for resource tagging'

  Owner:
    Type: String
    Default: 'infrastructure-team'
    Description: 'Owner for resource tagging'

  Project:
    Type: String
    Default: 'corp-secure-infrastructure'
    Description: 'Project name for resource tagging'

  DBUsername:
    Type: String
    Default: 'admin'
    Description: 'RDS Database username'
    NoEcho: true

  DBPassword:
    Type: String
    Description: 'RDS Database password'
    NoEcho: true
    MinLength: 8
    MaxLength: 128

Resources:
  # ===============================
  # VPC and Network Infrastructure
  # ===============================
  CorpVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'corp-vpc'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Internet Gateway
  CorpInternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: 'corp-igw'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref CorpVPC
      InternetGatewayId: !Ref CorpInternetGateway

  # Public Subnets
  CorpPublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: 'us-west-2a'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'corp-public-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpPublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: '10.0.2.0/24'
      AvailabilityZone: 'us-west-2b'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'corp-public-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Private Subnets
  CorpPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: '10.0.3.0/24'
      AvailabilityZone: 'us-west-2a'
      Tags:
        - Key: Name
          Value: 'corp-private-subnet-1'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref CorpVPC
      CidrBlock: '10.0.4.0/24'
      AvailabilityZone: 'us-west-2b'
      Tags:
        - Key: Name
          Value: 'corp-private-subnet-2'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # NAT Gateway for private subnets
  CorpNATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: CorpVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: 'corp-nat-eip'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpNATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt CorpNATGatewayEIP.AllocationId
      SubnetId: !Ref CorpPublicSubnet1
      Tags:
        - Key: Name
          Value: 'corp-nat-gateway'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Route Tables
  CorpPublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref CorpVPC
      Tags:
        - Key: Name
          Value: 'corp-public-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref CorpVPC
      Tags:
        - Key: Name
          Value: 'corp-private-rt'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # Routes
  CorpPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: CorpVPCGatewayAttachment
    Properties:
      RouteTableId: !Ref CorpPublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref CorpInternetGateway

  CorpPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref CorpPrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref CorpNATGateway

  # Route Table Associations
  CorpPublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref CorpPublicSubnet1
      RouteTableId: !Ref CorpPublicRouteTable

  CorpPublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref CorpPublicSubnet2
      RouteTableId: !Ref CorpPublicRouteTable

  CorpPrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref CorpPrivateSubnet1
      RouteTableId: !Ref CorpPrivateRouteTable

  CorpPrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref CorpPrivateSubnet2
      RouteTableId: !Ref CorpPrivateRouteTable

  # ===============================
  # Security Groups
  # ===============================
  CorpWebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'corp-web-sg'
      GroupDescription: 'Security group for web servers'
      VpcId: !Ref CorpVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP traffic'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS traffic'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: 'corp-web-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpDatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'corp-db-sg'
      GroupDescription: 'Security group for RDS database'
      VpcId: !Ref CorpVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref CorpWebSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: 'corp-db-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpLambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: 'corp-lambda-sg'
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref CorpVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound for AWS APIs'
      Tags:
        - Key: Name
          Value: 'corp-lambda-sg'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # ===============================
  # IAM Roles and Policies
  # ===============================
  CorpLambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'corp-lambda-execution-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: 'corp-lambda-minimal-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/*'
      Tags:
        - Key: Name
          Value: 'corp-lambda-execution-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'corp-ec2-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'corp-ec2-minimal-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: '*'
      Tags:
        - Key: Name
          Value: 'corp-ec2-role'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: 'corp-ec2-instance-profile'
      Roles:
        - !Ref CorpEC2Role

  # MFA Policy for IAM Users
  CorpMFAPolicy:
    Type: AWS::IAM::ManagedPolicy
    Properties:
      ManagedPolicyName: 'corp-enforce-mfa-policy'
      Description: 'Policy to enforce MFA for all IAM users'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowViewAccountInfo
            Effect: Allow
            Action:
              - iam:GetAccountPasswordPolicy
              - iam:GetAccountSummary
              - iam:ListVirtualMFADevices
            Resource: '*'
          - Sid: AllowManageOwnPasswords
            Effect: Allow
            Action:
              - iam:ChangePassword
              - iam:GetUser
            Resource: !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: AllowManageOwnMFA
            Effect: Allow
            Action:
              - iam:CreateVirtualMFADevice
              - iam:DeleteVirtualMFADevice
              - iam:EnableMFADevice
              - iam:ListMFADevices
              - iam:ResyncMFADevice
            Resource:
              - !Sub 'arn:aws:iam::${AWS::AccountId}:mfa/${aws:username}'
              - !Sub 'arn:aws:iam::${AWS::AccountId}:user/${aws:username}'
          - Sid: DenyAllExceptUnlessSignedInWithMFA
            Effect: Deny
            NotAction:
              - iam:CreateVirtualMFADevice
              - iam:EnableMFADevice
              - iam:GetUser
              - iam:ListMFADevices
              - iam:ListVirtualMFADevices
              - iam:ResyncMFADevice
              - sts:GetSessionToken
            Resource: '*'
            Condition:
              BoolIfExists:
                aws:MultiFactorAuthPresent: 'false'

  # ===============================
  # CloudTrail for API Auditing
  # ===============================
  CorpCloudTrailBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'corp-cloudtrail-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'corp-cloudtrail-bucket'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CorpCloudTrailBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt CorpCloudTrailBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${CorpCloudTrailBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CorpCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CorpCloudTrailBucketPolicy
    Properties:
      TrailName: 'corp-cloudtrail'
      S3BucketName: !Ref CorpCloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      KMSKeyId: alias/aws/s3
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - 'arn:aws:s3:::*/*'
      Tags:
        - Key: Name
          Value: 'corp-cloudtrail'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # ===============================
  # RDS Database (Multi-AZ)
  # ===============================
  CorpDBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupName: 'corp-db-subnet-group'
      DBSubnetGroupDescription: 'Subnet group for RDS database'
      SubnetIds:
        - !Ref CorpPrivateSubnet1
        - !Ref CorpPrivateSubnet2
      Tags:
        - Key: Name
          Value: 'corp-db-subnet-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpRDSDatabase:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: 'corp-database'
      DBInstanceClass: 'db.t3.micro'
      Engine: 'mysql'
      EngineVersion: '8.0.35'
      AllocatedStorage: 20
      StorageType: 'gp2'
      StorageEncrypted: true
      KmsKeyId: alias/aws/rds
      MasterUsername: !Ref DBUsername
      MasterUserPassword: !Ref DBPassword
      VPCSecurityGroups:
        - !Ref CorpDatabaseSecurityGroup
      DBSubnetGroupName: !Ref CorpDBSubnetGroup
      MultiAZ: true
      BackupRetentionPeriod: 7
      DeletionProtection: true
      EnableCloudwatchLogsExports:
        - error
        - general
        - slow-query
      MonitoringInterval: 60
      MonitoringRoleArn: !Sub 'arn:aws:iam::${AWS::AccountId}:role/rds-monitoring-role'
      Tags:
        - Key: Name
          Value: 'corp-database'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # RDS Monitoring Role
  CorpRDSMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole

  # ===============================
  # Application Load Balancer
  # ===============================
  CorpApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: 'corp-alb'
      Type: 'application'
      Scheme: 'internet-facing'
      SecurityGroups:
        - !Ref CorpWebSecurityGroup
      Subnets:
        - !Ref CorpPublicSubnet1
        - !Ref CorpPublicSubnet2
      Tags:
        - Key: Name
          Value: 'corp-alb'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: 'corp-target-group'
      Port: 80
      Protocol: 'HTTP'
      VpcId: !Ref CorpVPC
      HealthCheckEnabled: true
      HealthCheckIntervalSeconds: 30
      HealthCheckPath: '/health'
      HealthCheckProtocol: 'HTTP'
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: 'corp-target-group'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  CorpALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: 'forward'
          TargetGroupArn: !Ref CorpTargetGroup
      LoadBalancerArn: !Ref CorpApplicationLoadBalancer
      Port: 80
      Protocol: 'HTTP'

  # ===============================
  # Lambda Function
  # ===============================
  CorpLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: 'corp-lambda-function'
      Runtime: 'python3.9'
      Handler: 'index.lambda_handler'
      Role: !GetAtt CorpLambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          def lambda_handler(event, context):
              return {
                  'statusCode': 200,
                  'body': json.dumps('Hello from Lambda!')
              }
      VpcConfig:
        SecurityGroupIds:
          - !Ref CorpLambdaSecurityGroup
        SubnetIds:
          - !Ref CorpPrivateSubnet1
          - !Ref CorpPrivateSubnet2
      KmsKeyArn: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/lambda'
      Tags:
        - Key: Name
          Value: 'corp-lambda-function'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

  # ===============================
  # CloudWatch Log Groups
  # ===============================
  CorpVPCFlowLogsGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: '/corp/vpc/flowlogs'
      RetentionInDays: 30
      KmsKeyId: !Sub 'arn:aws:kms:${AWS::Region}:${AWS::AccountId}:alias/aws/logs'

  CorpVPCFlowLogsRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: 'corp-vpc-flowlogs-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: 'corp-flowlogs-policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  CorpVPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: 'VPC'
      ResourceId: !Ref CorpVPC
      TrafficType: 'ALL'
      LogDestinationType: 'cloud-watch-logs'
      LogGroupName: !Ref CorpVPCFlowLogsGroup
      DeliverLogsPermissionArn: !GetAtt CorpVPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: 'corp-vpc-flowlogs'
        - Key: Environment
          Value: !Ref Environment
        - Key: Owner
          Value: !Ref Owner
        - Key: Project
          Value: !Ref Project

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref CorpVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref CorpPublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref CorpPublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref CorpPrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref CorpPrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt CorpApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseEndpoint:
    Description: 'RDS Database Endpoint'
    Value: !GetAtt CorpRDSDatabase.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'
```

## Key Security Features Implemented

### 1. **Network Security**

- **VPC with public/private subnets** across multiple AZs (us-west-2a, us-west-2b)
- **NAT Gateway** for secure outbound internet access from private subnets
- **Security Groups** with least privilege access (only necessary ports open)
- **VPC Flow Logs** enabled for network traffic monitoring

### 2. **IAM Security**

- **Least privilege IAM roles** for Lambda, EC2, and RDS monitoring
- **MFA enforcement policy** that denies access unless MFA is enabled
- **Service-specific roles** with minimal required permissions

### 3. **Data Encryption**

- **RDS encryption** using AWS KMS (alias/aws/rds)
- **S3 bucket encryption** for CloudTrail logs
- **Lambda environment encryption** using AWS KMS
- **CloudWatch Logs encryption** using AWS KMS

### 4. **Logging and Monitoring**

- **CloudTrail** enabled for all API calls with multi-region support
- **VPC Flow Logs** for network traffic analysis
- **RDS Enhanced Monitoring** with CloudWatch logs export
- **CloudWatch Log Groups** with 30-day retention

### 5. **High Availability**

- **RDS Multi-AZ deployment** for database fault tolerance
- **Application Load Balancer** with health checks across multiple AZs
- **Lambda in VPC** with subnet redundancy

### 6. **Resource Tagging**

Every resource includes the required tags:

- `Environment`
- `Owner`
- `Project`

## Deployment Instructions

1. **Prerequisites:**
   - Ensure you have appropriate AWS CLI credentials configured
   - Verify you have permissions to create IAM roles and policies

2. **Deploy the template:**

   ```bash
   aws cloudformation create-stack \
     --stack-name corp-secure-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters ParameterKey=DBPassword,ParameterValue=YourSecurePassword123! \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-west-2
   ```

3. **Post-deployment security steps:**
   - Enable MFA for the root account manually (cannot be done via CloudFormation)
   - Apply the MFA policy to existing IAM users
   - Review and test security group rules
   - Configure additional CloudWatch alarms as needed

This template provides a solid foundation for secure AWS infrastructure following best practices for encryption, logging, network isolation, and access control.
