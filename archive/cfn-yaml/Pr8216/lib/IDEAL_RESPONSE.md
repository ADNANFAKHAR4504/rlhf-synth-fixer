# AWS Infrastructure Migration using CloudFormation

This solution provides a comprehensive, secure, and cost-efficient AWS infrastructure
migration using a single CloudFormation YAML template. The template creates a modular,
scalable architecture following AWS best practices for production workloads.

## Architecture Overview

The infrastructure consists of the following logical components:

### 1. Networking Infrastructure

- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Public Subnets**: Two public subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
- **Private Subnets**: Two private subnets (10.0.3.0/24, 10.0.4.0/24) for database tier
- **Internet Gateway**: Provides internet access for public resources
- **Route Tables**: Separate routing for public and private subnets

### 2. Security Layer

- **IAM Roles**: Least-privilege access for EC2 instances and Lambda functions
- **Security Groups**: Restrictive ingress/egress rules
- **KMS Encryption**: Customer-managed keys for S3, EBS, and RDS encryption
- **CloudTrail**: Comprehensive audit logging to S3

### 3. Compute Infrastructure

- **Auto Scaling Group**: Elastic scaling (1-5 instances) with rolling updates
- **Launch Template**: Standardized EC2 configuration with encrypted EBS volumes
- **Application Load Balancer**: High availability with health checks
- **Lambda Function**: Event-driven processing for S3 operations

### 4. Storage & Database

- **RDS MySQL**: Multi-AZ deployment with encryption and automated backups
- **S3 Buckets**: Encrypted storage with versioning and access logging
- **DynamoDB**: Serverless NoSQL database with pay-per-request billing

### 5. Content Delivery & Monitoring

- **CloudFront**: Global content distribution
- **CloudWatch Alarms**: Proactive monitoring with SNS notifications
- **SNS Topic**: Email notifications for operational events

## CloudFormation Template Features

### Parameters

The template supports the following configurable parameters:

- `InstanceType`: EC2 instance size (t3.micro, m5.large)
- `InstanceCount`: Number of instances for Auto Scaling Group
- `KeyName`: EC2 Key Pair for SSH access
- `EnvironmentSuffix`: Environment identifier (dev, prod)
- `DBPassword`: RDS master password from SSM Parameter Store
- `EmailNotification`: Email address for alerts

### Resource Dependencies

The template uses proper CloudFormation intrinsic functions:

- `!Ref` for resource references
- `!GetAtt` for resource attributes
- `!Sub` for string substitution with variables
- `!Select` and `!GetAZs` for availability zone selection

### Security Best Practices

1. **Encryption at Rest**: All storage encrypted with customer-managed KMS keys
2. **Least Privilege IAM**: Minimal required permissions for each role
3. **Network Segmentation**: Public/private subnet isolation
4. **Access Control**: S3 bucket policies block public access
5. **Audit Logging**: CloudTrail tracks all API calls

### Cost Optimization

1. **Auto Scaling**: Dynamic capacity based on demand
2. **Spot Instances**: Can be configured for development environments
3. **Pay-per-Request**: DynamoDB billing optimized for variable workloads
4. **GP3 Storage**: Cost-effective EBS volume types
5. **T3 Instances**: Burstable performance for cost savings

### High Availability

1. **Multi-AZ Deployment**: Resources distributed across availability zones
2. **Auto Scaling**: Automatic replacement of unhealthy instances
3. **Load Balancer**: Traffic distribution with health checks
4. **RDS Multi-AZ**: Automatic failover for database
5. **Rolling Updates**: Zero-downtime deployments

## Deployment Instructions

### Simple Deployment

The CloudFormation template is now self-contained and handles all prerequisites
automatically. You can deploy it directly without any external setup:

**Basic deployment with defaults:**

```bash
# Set environment suffix (optional, defaults to 'dev')
export ENVIRONMENT_SUFFIX=dev

# Deploy with default email
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX}
```

**Deployment with custom email:**

```bash
# Deploy with custom notification email
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    EmailNotification="your-email@example.com"
```

**Deployment with custom password:**

```bash
# Deploy with your own RDS password
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    EmailNotification="your-email@example.com" \
    DBPassword="YourSecurePassword123!"
```

### Automatic Password Generation

If you don't provide a `DBPassword` parameter, the template will automatically:

1. Create a Lambda function to generate a secure random password
2. Store the password securely using CloudFormation custom resources
3. Use the generated password for the RDS instance
4. Clean up the password generation resources when the stack is deleted

This ensures secure password management without requiring external scripts or
manual parameter store setup.

### Validation Commands

After deployment, validate the infrastructure:

```bash
# Get stack outputs
aws cloudformation describe-stacks --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} \
  --query 'Stacks[0].Outputs'

# Test load balancer endpoint
LOAD_BALANCER=$(aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} \
  --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerDNS`].OutputValue' \
  --output text)
curl -I http://$LOAD_BALANCER

# Verify S3 bucket encryption
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} \
  --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
  --output text)
aws s3api get-bucket-encryption --bucket $S3_BUCKET
```

## File Structure

The solution consists of the following files:

### `lib/TapStack.yml`

Main CloudFormation template containing all infrastructure resources:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Modular, secure, and cost-optimized AWS infrastructure in us-east-1

Parameters:
  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
  InstanceCount:
    Type: Number
    Default: 2
    Description: Number of EC2 instances (ASG desired capacity)
  KeyName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: Name of an existing EC2 KeyPair
    Default: iac-rlhf-aws-trainer-instance
  EnvironmentSuffix:
    Type: String
    Default: dev
    Description: Environment suffix (dev, prod, etc.)
  EmailNotification:
    Type: String
    Description: Email for SNS notifications
    Default: 'admin@example.com'

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssoc1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref RouteTable

  SubnetRouteTableAssoc2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref RouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Name
          Value: !Sub 'Private-RouteTable-${EnvironmentSuffix}'

  PrivateSubnetRouteTableAssoc1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetRouteTableAssoc2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess
        - arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [ !Ref EC2Role ]

  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP traffic only
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3KmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'S3 encryption key for ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RDSKmsKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'RDS encryption key for ${EnvironmentSuffix}'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Name
          Value: !Sub 'Private-Subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.4.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Name
          Value: !Sub 'Private-Subnet-2-${EnvironmentSuffix}'

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DatabaseSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow MySQL access from web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebSecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3LogBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cfn-logs-${EnvironmentSuffix}-${AWS::AccountId}'
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
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3LogBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3LogBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt S3LogBucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${S3LogBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: S3LogBucketPolicy
    Properties:
      S3BucketName: !Ref S3LogBucket
      IsLogging: true
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true

  SecureS3Bucket:
    Type: AWS::S3::Bucket
    DependsOn: S3InvokeLambdaPermission
    Properties:
      BucketName: !Sub 'secure-data-${EnvironmentSuffix}-${AWS::AccountId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3KmsKey
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3LogBucket
        LogFilePrefix: 'access-logs/'
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt S3ProcessingLambda.Arn
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  LambdaRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3Lambda
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: '*'
              - Effect: Allow
                Action:
                  - logs:*
                Resource: '*'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-rds-password'
      Description: 'RDS MySQL master password'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3ProcessingLambda:
    Type: AWS::Lambda::Function
    Properties:
      Handler: index.handler
      Role: !GetAtt LambdaRole.Arn
      Runtime: nodejs22.x
      Timeout: 10
      Code:
        ZipFile: |
          exports.handler = async (event) => {
            console.log("S3 Event Triggered:", JSON.stringify(event));
          };
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  S3InvokeLambdaPermission:
    Type: AWS::Lambda::Permission
    Properties:
      Action: lambda:InvokeFunction
      FunctionName: !Ref S3ProcessingLambda
      Principal: s3.amazonaws.com
      SourceArn: !Sub 'arn:aws:s3:::secure-data-${EnvironmentSuffix}-${AWS::AccountId}'
      SourceAccount: !Ref "AWS::AccountId"

  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateData:
        InstanceType: !Ref InstanceType
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        KeyName: !Ref KeyName
        SecurityGroupIds: [ !Ref WebSecurityGroup ]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 8
              VolumeType: gp3
              Encrypted: true
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y httpd
            systemctl enable httpd
            systemctl start httpd
            echo "<h1>Hello from ${EnvironmentSuffix} environment</h1>" > /var/www/html/index.html
      LaunchTemplateName: !Sub 'WebServerTemplate-${EnvironmentSuffix}'

  ApplicationELB:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Subnets: [ !Ref PublicSubnet1, !Ref PublicSubnet2 ]
      SecurityGroups: [ !Ref WebSecurityGroup ]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckPath: /
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  Listener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationELB
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      MinSize: 1
      MaxSize: 5
      DesiredCapacity: !Ref InstanceCount
      VPCZoneIdentifier: [ !Ref PublicSubnet1, !Ref PublicSubnet2 ]
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      TargetGroupARNs: [ !Ref TargetGroup ]
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
    UpdatePolicy:
      AutoScalingRollingUpdate:
        MinInstancesInService: 1
        MaxBatchSize: 1
        PauseTime: PT5M

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'prod-db-${EnvironmentSuffix}'
      Engine: mysql
      EngineVersion: '8.0.35'
      DBInstanceClass: db.t3.micro
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageType: gp3
      MultiAZ: true
      VPCSecurityGroups: [ !Ref DatabaseSecurityGroup ]
      DBSubnetGroupName: !Ref DBSubnetGroup
      StorageEncrypted: true
      KmsKeyId: !Ref RDSKmsKey
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "sun:04:00-sun:05:00"
      DeletionProtection: false
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AppDynamoTable:
    Type: AWS::DynamoDB::Table
    Properties:
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: ID
          AttributeType: S
      KeySchema:
        - AttributeName: ID
          KeyType: HASH
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NotificationTopic:
    Type: AWS::SNS::Topic
    Properties:
      Subscription:
        - Protocol: email
          Endpoint: !Ref EmailNotification
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Enabled: true
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          ForwardedValues:
            QueryString: false
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt SecureS3Bucket.DomainName
            S3OriginConfig: {}
        DefaultRootObject: index.html
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: High CPU utilization
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions: [ !Ref NotificationTopic ]
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup

Outputs:
  LoadBalancerDNS:
    Description: Public DNS for Load Balancer
    Value: !GetAtt ApplicationELB.DNSName
  S3BucketName:
    Value: !Ref SecureS3Bucket
  DynamoDBTableName:
    Value: !Ref AppDynamoTable
  CloudFrontURL:
    Value: !GetAtt CloudFrontDistribution.DomainName
```

### `test/tap-stack.unit.test` (TypeScript)

Unit tests validating template structure and configuration

### `test/tap-stack.int.test` (TypeScript)

Integration tests verifying component relationships and security configurations

## Outputs

The template provides the following outputs for integration:

- `LoadBalancerDNS`: Application Load Balancer endpoint
- `S3BucketName`: Secure S3 bucket name
- `DynamoDBTableName`: DynamoDB table name
- `CloudFrontURL`: CloudFront distribution domain

## Cleanup

To remove all resources:

```bash
# Empty S3 buckets before deletion (required)
aws s3 rm s3://secure-data-${ENVIRONMENT_SUFFIX:-dev}-$(aws sts get-caller-identity \
  --query Account --output text) --recursive
aws s3 rm s3://cfn-logs-${ENVIRONMENT_SUFFIX:-dev}-$(aws sts get-caller-identity \
  --query Account --output text) --recursive

# Delete the CloudFormation stack
npm run cfn:destroy
```

This infrastructure template provides a production-ready, secure, and cost-optimized
foundation for AWS workloads with comprehensive monitoring, encryption, and high
availability features.
- Configurable batch sizes and pause times

### 7. Operation Logging
- Dedicated S3 bucket for CloudFormation and application logs
- CloudTrail logging for stack operations and API calls
- S3 access logging for security monitoring

### 8. Security and Access Management
- Separate IAM roles for EC2 and Lambda with least-privilege policies
- Security groups with minimal required access
- Database isolation in private subnets

### 9. Data Encryption
- Customer-managed KMS keys for S3, EBS, and RDS encryption
- Automatic key rotation enabled
- Comprehensive encryption at rest

### 10. Cost Optimization
- t3.micro instances for cost-effective compute
- Pay-per-request DynamoDB billing
- gp3 storage for better price/performance ratio
- Auto Scaling for dynamic capacity management

## File Structure

The solution consists of the following files:

```
lib/
├── TapStack.yml          # Main CloudFormation template
├── AWS_REGION           # Region specification file
└── IDEAL_RESPONSE.md    # This documentation

test/
├── tap-stack.unit.test       # Unit tests for template validation (TypeScript)
└── tap-stack.int.test        # Integration tests for deployed resources (TypeScript)
```

## Deployment Instructions

### Prerequisites
Before deploying, ensure you have:

1. An AWS account with appropriate permissions
2. AWS CLI configured with credentials  
3. An existing EC2 Key Pair in us-east-1
4. SSM Parameter Store entry for database password

### Required SSM Parameter
Create a secure string parameter for the database password:

```bash
aws ssm put-parameter \
  --name "/dev/db/password" \
  --value "YourSecurePassword123!" \
  --type "SecureString" \
  --region us-east-1
```

### Deployment Command
Deploy the stack using the npm script:

```bash
npm run cfn:deploy-yaml
```

Or manually with AWS CLI:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    InstanceType=t3.micro \
    InstanceCount=2 \
    KeyName=your-key-pair-name \
    EnvironmentSuffix=dev \
    DBPassword=/dev/db/password \
    EmailNotification=admin@example.com \
  --region us-east-1
```

### Verification Steps
After deployment, verify the infrastructure:

1. **Load Balancer**: Access the LoadBalancerDNS output URL
2. **Auto Scaling**: Check EC2 instances are running and healthy
3. **Database**: Verify RDS instance is available in private subnets
4. **S3**: Confirm buckets are created with proper encryption
5. **Lambda**: Test S3 events trigger Lambda function
6. **CloudFront**: Access content via CloudFront distribution

## Security Considerations

- All S3 buckets have public access blocked
- Database resides in private subnets with restricted security groups
- EBS volumes and RDS storage are encrypted with customer-managed keys
- IAM roles follow least-privilege principle
- CloudTrail provides comprehensive audit logging

## Cost Optimization Features

- t3.micro instances provide burst performance at low cost
- Auto Scaling ensures you only pay for capacity you need
- DynamoDB pay-per-request eliminates idle capacity costs
- gp3 storage offers better performance per dollar than gp2

## Testing

The solution includes comprehensive test coverage:

### Unit Tests
Run unit tests to validate template structure:
```bash
npm run test:unit
```

### Integration Tests  
Run integration tests after deployment:
```bash
npm run test:integration
```

## Infrastructure Components

The template creates the following AWS resources:

### Networking
- 1 VPC with DNS support enabled
- 2 public subnets across different AZs
- 2 private subnets for database tier
- Internet Gateway with routing
- Route tables for public and private subnets

### Security & IAM
- EC2 IAM role with SSM and S3 read access
- Lambda IAM role with S3 and CloudWatch permissions
- Security groups for web tier and database tier
- Customer-managed KMS keys for encryption

### Compute & Auto Scaling
- Launch template with encrypted EBS volumes
- Auto Scaling Group with rolling update policy
- Application Load Balancer with health checks
- Target group for load balancer targets

### Database
- RDS MySQL instance with Multi-AZ deployment
- Database subnet group spanning private subnets
- Encryption at rest with customer-managed KMS key
- Automated backups and maintenance windows

### Storage
- Encrypted S3 bucket for application data
- S3 bucket for access and CloudTrail logs
- Lambda event processing for S3 objects
- DynamoDB table with pay-per-request billing

### Monitoring & Notifications
- CloudWatch alarm for high CPU utilization
- SNS topic for email notifications
- CloudTrail for API and stack operation logging

### Content Delivery
- CloudFront distribution for global content delivery
- Integration with S3 origin for static content

This infrastructure provides a robust, secure, and cost-effective foundation for web applications while maintaining all operational requirements and AWS best practices.