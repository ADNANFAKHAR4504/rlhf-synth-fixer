# Secure Web Application Infrastructure CloudFormation Template

Below is a comprehensive CloudFormation template that meets all your requirements. This template creates a production-ready, secure infrastructure with proper networking, security, monitoring, and compliance features.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and production-ready web application infrastructure with VPC, security groups, IAM roles, S3, CloudTrail, CloudWatch, and AWS Config'

Parameters:
  AllowedIPRange:
    Type: String
    Default: '0.0.0.0/0'
    Description: 'IP range allowed to access the application (CIDR format)'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR range (e.g., 10.0.0.0/8)'

  ProjectName:
    Type: String
    Default: 'SecureWebApp'
    Description: 'Name prefix for all resources'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Must start with a letter and contain only alphanumeric characters and hyphens'

Resources:
  # =====================================
  # VPC and Networking Resources
  # =====================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-VPC'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-IGW'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Subnet-AZ2'

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ1'

  NatGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-EIP-AZ2'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-AZ1'

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-NAT-AZ2'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ1'

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Private-Routes-AZ2'

  DefaultPrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      SubnetId: !Ref PrivateSubnet2

  # =====================================
  # Security Groups
  # =====================================
  
  WebApplicationSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-WebApp-SG'
      GroupDescription: 'Security group for web application with restricted IP access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTP access from allowed IP range'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedIPRange
          Description: 'HTTPS access from allowed IP range'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-WebApp-SG'

  # =====================================
  # IAM Resources
  # =====================================
  
  ApplicationRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-Application-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
                - lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: !Sub '${ProjectName}-S3-DynamoDB-Policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub '${S3Bucket}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource: !Ref S3Bucket
              - Effect: Allow
                Action:
                  - 'dynamodb:GetItem'
                  - 'dynamodb:PutItem'
                  - 'dynamodb:UpdateItem'
                  - 'dynamodb:DeleteItem'
                  - 'dynamodb:Query'
                  - 'dynamodb:Scan'
                Resource: !Sub 'arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/${ProjectName}-*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Application-Role'

  ApplicationInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-Application-InstanceProfile'
      Roles:
        - !Ref ApplicationRole

  # =====================================
  # S3 Resources
  # =====================================
  
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-app-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 7
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-App-Bucket'

  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
            BucketKeyEnabled: true
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
          Value: !Sub '${ProjectName}-CloudTrail-Bucket'

  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudTrailS3Bucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !Ref CloudTrailS3Bucket
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailS3Bucket}/AWSLogs/${AWS::AccountId}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'

  # =====================================
  # CloudTrail Resources
  # =====================================
  
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: CloudTrailBucketPolicy
    Properties:
      TrailName: !Sub '${ProjectName}-CloudTrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      S3KeyPrefix: 'AWSLogs'
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${S3Bucket}/*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-CloudTrail'

  # =====================================
  # CloudWatch Resources
  # =====================================
  
  UnauthorizedAPICallsMetricFilter:
    Type: AWS::Logs::MetricFilter
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-CloudTrail'
      FilterPattern: '{ ($.errorCode = "*UnauthorizedOperation") || ($.errorCode = "AccessDenied*") }'
      MetricTransformations:
        - MetricNamespace: 'CloudTrailMetrics'
          MetricName: 'UnauthorizedAPICalls'
          MetricValue: '1'
          DefaultValue: 0

  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${ProjectName}-UnauthorizedAPICalls'
      AlarmDescription: 'Alarm for unauthorized API calls detected by CloudTrail'
      MetricName: 'UnauthorizedAPICalls'
      Namespace: 'CloudTrailMetrics'
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      TreatMissingData: notBreaching

  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${ProjectName}-CloudTrail'
      RetentionInDays: 30

  # =====================================
  # AWS Config Resources
  # =====================================
  
  ConfigServiceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-Config-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: config.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/ConfigRole'
      Policies:
        - PolicyName: !Sub '${ProjectName}-Config-S3-Policy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetBucketAcl'
                  - 's3:ListBucket'
                Resource: !Ref ConfigS3Bucket
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                Resource: !Sub '${ConfigS3Bucket}/AWSLogs/${AWS::AccountId}/Config/*'

  ConfigS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-config-${AWS::AccountId}-${AWS::Region}'
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
          - Id: DeleteOldConfigData
            Status: Enabled
            ExpirationInDays: 365

  ConfigDeliveryChannel:
    Type: AWS::Config::DeliveryChannel
    Properties:
      Name: !Sub '${ProjectName}-Config-DeliveryChannel'
      S3BucketName: !Ref ConfigS3Bucket
      S3KeyPrefix: !Sub 'AWSLogs/${AWS::AccountId}/Config'

  ConfigurationRecorder:
    Type: AWS::Config::ConfigurationRecorder
    Properties:
      Name: !Sub '${ProjectName}-Config-Recorder'
      RoleARN: !GetAtt ConfigServiceRole.Arn
      RecordingGroup:
        AllSupported: true
        IncludeGlobalResourceTypes: true

  IAMPolicyChangesConfigRule:
    Type: AWS::Config::ConfigRule
    DependsOn: ConfigurationRecorder
    Properties:
      ConfigRuleName: !Sub '${ProjectName}-iam-policy-changes'
      Description: 'Checks whether the account password policy for IAM users meets the specified requirements'
      Source:
        Owner: AWS
        SourceIdentifier: IAM_POLICY_CHANGE

  # =====================================
  # DynamoDB Table (Example)
  # =====================================
  
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub '${ProjectName}-AppData'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: 'id'
          AttributeType: 'S'
      KeySchema:
        - AttributeName: 'id'
          KeyType: 'HASH'
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-AppData-Table'

# =====================================
# Outputs
# =====================================

Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-VPC-ID'

  PublicSubnets:
    Description: 'List of public subnet IDs'
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-Public-Subnets'

  PrivateSubnets:
    Description: 'List of private subnet IDs'
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub '${ProjectName}-Private-Subnets'

  ApplicationSecurityGroup:
    Description: 'Security Group ID for web application'
    Value: !Ref WebApplicationSecurityGroup
    Export:
      Name: !Sub '${ProjectName}-WebApp-SG-ID'

  ApplicationRoleArn:
    Description: 'ARN of the application IAM role'
    Value: !GetAtt ApplicationRole.Arn
    Export:
      Name: !Sub '${ProjectName}-Application-Role-ARN'

  S3BucketName:
    Description: 'Name of the application S3 bucket'
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${ProjectName}-S3-Bucket-Name'

  DynamoDBTableName:
    Description: 'Name of the DynamoDB table'
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${ProjectName}-DynamoDB-Table-Name'

  CloudTrailArn:
    Description: 'ARN of the CloudTrail'
    Value: !GetAtt CloudTrail.Arn
    Export:
      Name: !Sub '${ProjectName}-CloudTrail-ARN'
```

# Key Features and Explanations

## 1. VPC and Networking
- Creates a VPC with CIDR `10.0.0.0/16`
- Deploys public and private subnets across two Availability Zones
- Configures NAT Gateways in each AZ for high availability
- Sets up proper route tables for internet and NAT gateway routing

## 2. Security Groups
- Restricts application access to specified IP ranges
- Allows HTTP (port 80) and HTTPS (port 443) only from allowed IPs
- Follows principle of least privilege

## 3. IAM Role
- Creates a role with minimal permissions for S3 and DynamoDB access
- Includes instance profile for EC2 instances
- Follows AWS security best practices

## 4. S3 Buckets
- Application bucket with AES-256 encryption
- CloudTrail logs bucket with lifecycle policies
- Public access blocked on all buckets
- Versioning enabled for data protection

## 5. CloudTrail
- Logs all API calls across all AWS regions
- Stores logs in a dedicated S3 bucket
- Includes log file validation for integrity

## 6. CloudWatch Monitoring
- Metric filter for unauthorized API calls
- Alarm triggers on security violations
- Log group for CloudTrail logs with retention policy

## 7. AWS Config
- Monitors IAM policy changes
- Records all resource configurations
- Stores configuration data in a dedicated S3 bucket

## 8. Additional Security Features
- All S3 buckets have encryption enabled
- DynamoDB table includes encryption and point-in-time recovery
- Lifecycle policies for cost optimization
- Comprehensive tagging strategy

# Deployment Instructions

1. Save the template as `secure-infrastructure.yaml`

2. Deploy using AWS CLI:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-web-app-infrastructure \
     --template-body file://secure-infrastructure.yaml \
     --parameters ParameterKey=AllowedIPRange,ParameterValue=YOUR_IP_RANGE/32 \
     --capabilities CAPABILITY_NAMED_IAM \
   ```

3. Monitor deployment progress:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-web-app-infrastructure \
   ```

This template provides a solid foundation for a secure, production-ready web application infrastructure that meets all specified requirements and follows AWS best practices.
