The error occurs because AWS::S3::Object is not a valid CloudFormation resource type. I'll fix this by removing the invalid resource and using only the custom resource approach to create the Lambda zip file.

Here's the corrected CloudFormation template:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS environment with comprehensive security controls and best practices'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

Resources:
  # KMS Key for encryption
  SecureKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS Key for ${EnvironmentSuffix} environment encryption'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow CloudTrail encryption
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - kms:CreateGrant
              - kms:Decrypt
              - kms:DescribeKey
              - kms:Encrypt
              - kms:GenerateDataKey
              - kms:ReEncrypt*
            Resource: '*'
          - Sid: Allow CloudWatch Logs encryption
            Effect: Allow
            Principal:
              Service: !Sub 'logs.us-east-1.amazonaws.com'
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'
          - Sid: Allow S3 service
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - kms:Encrypt
              - kms:Decrypt
              - kms:ReEncrypt*
              - kms:GenerateDataKey*
              - kms:DescribeKey
            Resource: '*'

  SecureKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/secure-${EnvironmentSuffix}-key'
      TargetKeyId: !Ref SecureKMSKey

  # VPC Configuration
  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'secure-vpc-${EnvironmentSuffix}'

  # Private Subnets (no public IPs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}'

  # Public Subnet (only for NAT Gateway - explicitly required)
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: us-east-1a
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-${EnvironmentSuffix}'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateway (requires public IP - explicitly required)
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub 'nat-gateway-${EnvironmentSuffix}'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}'

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-${EnvironmentSuffix}'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  # Route Table Associations
  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
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

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Secure security group for EC2 instances'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH access from bastion host only'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP from ALB only'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTPS from ALB only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for updates'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for updates'
      Tags:
        - Key: Name
          Value: !Sub 'ec2-sg-${EnvironmentSuffix}'

  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for bastion host'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0
          Description: 'SSH access - should be restricted to specific IPs in production'
      Tags:
        - Key: Name
          Value: !Sub 'bastion-sg-${EnvironmentSuffix}'

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP access'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS access'
      Tags:
        - Key: Name
          Value: !Sub 'alb-sg-${EnvironmentSuffix}'

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Lambda functions'
      VpcId: !Ref SecureVPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS API calls'
      Tags:
        - Key: Name
          Value: !Sub 'lambda-sg-${EnvironmentSuffix}'

  # S3 Bucket for logging (must be created first)
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'security-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled

  # S3 Bucket Policy for CloudTrail
  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !GetAtt LoggingBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:us-east-1:${AWS::AccountId}:trail/secure-trail-${EnvironmentSuffix}'
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub '${LoggingBucket.Arn}/cloudtrail-logs/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:us-east-1:${AWS::AccountId}:trail/secure-trail-${EnvironmentSuffix}'

  # S3 Bucket for Lambda deployment packages
  LambdaDeploymentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'lambda-deployment-${AWS::AccountId}-${EnvironmentSuffix}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref SecureKMSKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: lambda-deployment-access-logs/

  # IAM Role for Lambda Zip Creator (must be created before the function)
  LambdaZipCreatorRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:PutObject
                  - s3:PutObjectAcl
                Resource: !Sub '${LambdaDeploymentBucket}/*'
              - Effect: Allow
                Action:
                  - kms:Encrypt
                  - kms:Decrypt
                  - kms:ReEncrypt*
                  - kms:GenerateDataKey*
                  - kms:DescribeKey
                Resource: !GetAtt SecureKMSKey.Arn

  # Custom Lambda function to create the zip file
  LambdaZipCreatorFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'lambda-zip-creator-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaZipCreatorRole.Arn
      Timeout: 60
      Code:
        ZipFile: |
          import json
          import boto3
          import zipfile
          import io
          import cfnresponse

          def lambda_handler(event, context):
              try:
                  if event['RequestType'] == 'Create' or event['RequestType'] == 'Update':
                      bucket_name = event['ResourceProperties']['BucketName']
                      
                      # Create the Lambda function code
                      lambda_code = '''import json
          import boto3
          import logging
          import os
          from datetime import datetime

          # Configure logging
          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          def lambda_handler(event, context):
              """
              Secure Lambda function for processing events
              """
              try:
                  # Log the event for audit purposes
                  logger.info(f"Processing event: {json.dumps(event, default=str)}")
                  
                  # Get environment variables
                  environment = os.environ.get('ENVIRONMENT', 'unknown')
                  
                  # Example secure processing
                  response_data = {
                      'statusCode': 200,
                      'environment': environment,
                      'timestamp': datetime.utcnow().isoformat(),
                      'message': 'Function executed successfully',
                      'requestId': context.aws_request_id
                  }
                  
                  logger.info(f"Function completed successfully: {response_data}")
                  
                  return {
                      'statusCode': 200,
                      'headers': {
                          'Content-Type': 'application/json',
                          'X-Content-Type-Options': 'nosniff',
                          'X-Frame-Options': 'DENY',
                          'X-XSS-Protection': '1; mode=block'
                      },
                      'body': json.dumps(response_data)
                  }
                  
              except Exception as e:
                  logger.error(f"Error processing event: {str(e)}")
                  return {
                      'statusCode': 500,
                      'headers': {
                          'Content-Type': 'application/json'
                      },
                      'body': json.dumps({
                          'error': 'Internal server error',
                          'requestId': context.aws_request_id
                      })
                  }
          '''
                      
                      # Create zip file in memory
                      zip_buffer = io.BytesIO()
                      with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                          zip_file.writestr('index.py', lambda_code)
                      
                      # Upload to S3
                      s3_client = boto3.client('s3')
                      s3_client.put_object(
                          Bucket=bucket_name,
                          Key='lambda-function.zip',
                          Body=zip_buffer.getvalue(),
                          ContentType='application/zip'
                      )
                      
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Message': 'Lambda zip file created successfully'})
                  else:
                      cfnresponse.send(event, context, cfnresponse.SUCCESS, {'Message': 'No action required'})
              except Exception as e:
                  print(f"Error: {str(e)}")
                  cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})

  # Custom Resource to trigger the zip file creation
  LambdaZipCreator:
    Type: AWS::CloudFormation::CustomResource
    Properties:
      ServiceToken: !GetAtt LambdaZipCreatorFunction.Arn
      BucketName: !Ref LambdaDeploymentBucket

  # Secrets Manager for EC2 user data
  EC2UserDataSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'ec2-userdata-${EnvironmentSuffix}'
      Description: 'Secure storage for EC2 user data'
      KmsKeyId: !Ref SecureKMSKey
      SecretString: !Sub |
        {
          "userdata": "#!/bin/bash\nyum update -y\nyum install -y amazon-cloudwatch-agent\n# Additional secure configuration here"
        }

  # IAM Roles with least privilege
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2Role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                Resource: !Ref EC2UserDataSecret
              - Effect: Allow
                Action:
                  - kms:Decrypt
                Resource: !GetAtt SecureKMSKey.Arn

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'LambdaExecutionRole-${EnvironmentSuffix}'
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
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:GenerateDataKey
                Resource: !GetAtt SecureKMSKey.Arn

  CloudTrailRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'CloudTrailRole-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub 'arn:aws:logs:us-east-1:${AWS::AccountId}:log-group:/aws/cloudtrail/*'

  # CloudWatch Log Group for CloudTrail
  CloudTrailLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/cloudtrail/${EnvironmentSuffix}'
      RetentionInDays: 90
      KmsKeyId: !GetAtt SecureKMSKey.Arn

  # CloudTrail for audit logging
  SecureCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - LoggingBucketPolicy
    Properties:
      TrailName: !Sub 'secure-trail-${EnvironmentSuffix}'
      S3BucketName: !Ref LoggingBucket
      S3KeyPrefix: 'cloudtrail-logs/'
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      IsLogging: true
      EnableLogFileValidation: true
      KMSKeyId: !Ref SecureKMSKey
      CloudWatchLogsLogGroupArn: !GetAtt CloudTrailLogGroup.Arn
      CloudWatchLogsRoleArn: !GetAtt CloudTrailRole.Arn
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: 'AWS::S3::Object'
              Values:
                - !Sub '${LoggingBucket}/*'
                - !Sub '${LambdaDeploymentBucket}/*'

  # CloudWatch Alarms for security incidents
  UnauthorizedAPICallsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'UnauthorizedAPICalls-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for unauthorized API calls'
      MetricName: ErrorCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold

  RootAccountUsageAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'RootAccountUsage-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm for root account usage'
      MetricName: RootAccountUsageEventCount
      Namespace: CloudTrailMetrics
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold

  # Lambda function - Now depends on zip file creation
  SecureLambdaFunction:
    Type: AWS::Lambda::Function
    DependsOn: LambdaZipCreator
    Properties:
      FunctionName: !Sub 'secure-function-${EnvironmentSuffix}'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        S3Bucket: !Ref LambdaDeploymentBucket
        S3Key: 'lambda-function.zip'
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      KmsKeyArn: !GetAtt SecureKMSKey.Arn
      Environment:
        Variables:
          ENVIRONMENT: !Ref EnvironmentSuffix

  # MFA Policy for users (example group)
  MFARequiredGroup:
    Type: AWS::IAM::Group
    Properties:
      GroupName: !Sub 'MFARequired-${EnvironmentSuffix}'
      Policies:
        - PolicyName: RequireMFA
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Deny
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
                    'aws:MultiFactorAuthPresent': 'false'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  KMSKeyId:
    Description: 'KMS Key ID'
    Value: !Ref SecureKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  LambdaDeploymentBucket:
    Description: 'S3 Bucket for Lambda deployments'
    Value: !Ref LambdaDeploymentBucket
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Bucket'

  CloudTrailArn:
    Description: 'CloudTrail ARN'
    Value: !GetAtt SecureCloudTrail.Arn
    Export:
      Name: !Sub '${AWS::StackName}-CloudTrail-ARN'

  LambdaFunctionArn:
    Description: 'Lambda Function ARN'
    Value: !GetAtt SecureLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-Function-ARN'
```

Key Changes Made:

1. Removed Invalid Resource
   Removed AWS::S3::Object which is not a valid CloudFormation resource type
2. Fixed Resource Dependencies
   Moved LambdaZipCreatorRole before LambdaZipCreatorFunction
   Added proper KMS permissions to the zip creator role
   Ensured proper dependency chain for Lambda function creation
3. Improved Error Handling
   Added better error handling in the custom resource Lambda function
   Added proper response messages for CloudFormation
   Stack Policy (stack-policy.json)

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": ["Update:Delete", "Update:Replace"],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "ResourceType": [
            "AWS::KMS::Key",
            "AWS::CloudTrail::Trail",
            "AWS::EC2::VPC",
            "AWS::S3::Bucket"
          ]
        }
      }
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
```

Deployment Commands:
Clean up any failed stacks first:
aws cloudformation delete-stack --stack-name your-failed-stack-name --region us-east-1
Deploy the fixed template:
aws cloudformation create-stack \
 --stack-name secure-environment-dev \
 --template-body file://secure-cloudformation-template.yaml \
 --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
 --capabilities CAPABILITY_NAMED_IAM \
 --stack-policy-body file://stack-policy.json \
 --region us-east-1
What This Template Does:
Creates Lambda Deployment Package: The custom resource automatically creates a zip file with secure Lambda code and uploads it to S3
Fixes CloudTrail: Includes the required IsLogging: true property
Maintains Security: All security requirements are met including encryption, VPC isolation, and least privilege access
Proper Dependencies: Resources are created in the correct order
The template should now deploy successfully without validation errors!
