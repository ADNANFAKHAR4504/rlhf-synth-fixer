# Cloud Environment Setup - CloudFormation YAML Response

Based on the task requirements for trainr938, I'll create a comprehensive CloudFormation YAML template that sets up a basic cloud environment with S3, EC2, and DynamoDB resources. The template will include proper security configurations, monitoring, and all required constraints.

## CloudFormation Template

Here's the complete CloudFormation YAML template for `lib/TapStack.yml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Cloud Environment Setup - S3, EC2, and DynamoDB Infrastructure'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'dev'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'
  
  BucketName:
    Type: String
    Default: 'cloud-setup-bucket'
    Description: 'Name prefix for the S3 bucket'
    AllowedPattern: '^[a-z0-9-]+$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
  
  InstanceType:
    Type: String
    Default: 't3.micro'
    Description: 'EC2 instance type'
    AllowedValues: 
      - t3.micro
      - t3.small
      - t3.medium
    ConstraintDescription: 'Must be a valid EC2 instance type'
  
  SSHAccessIP:
    Type: String
    Default: '203.0.113.0/32'
    Description: 'IP address allowed for SSH access (CIDR notation)'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 203.0.113.0/32)'
  
  VpcId:
    Type: 'AWS::EC2::VPC::Id'
    Description: 'VPC ID where EC2 instance will be deployed'
  
  SubnetId:
    Type: 'AWS::EC2::Subnet::Id'
    Description: 'Subnet ID where EC2 instance will be deployed'
  
  DynamoDBTableName:
    Type: String
    Default: 'CloudSetupTable'
    Description: 'Name for the DynamoDB table'
    AllowedPattern: '^[a-zA-Z0-9-_]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters, hyphens, and underscores'
  
  DynamoDBPrimaryKey:
    Type: String
    Default: 'id'
    Description: 'Primary key name for the DynamoDB table'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9_]*$'
    ConstraintDescription: 'Must start with a letter and contain only alphanumeric characters and underscores'

Resources:
  # S3 Bucket with versioning
  CloudSetupS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Sub '${BucketName}-${EnvironmentSuffix}-${AWS::AccountId}'
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
              SSEAlgorithm: AES256
      Tags:
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # IAM Role for EC2 instance
  EC2InstanceRole:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub 'CloudSetup-EC2Role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: 'S3ListBucketPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 's3:ListBucket'
                Resource: !GetAtt CloudSetupS3Bucket.Arn
      Tags:
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub 'CloudSetup-EC2Profile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

  # Security Group for EC2
  EC2SecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub 'CloudSetup-SG-${EnvironmentSuffix}'
      GroupDescription: 'Security group for CloudSetup EC2 instance'
      VpcId: !Ref VpcId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAccessIP
          Description: 'SSH access from specified IP'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # EC2 Instance
  CloudSetupEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: !Ref InstanceType
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      SubnetId: !Ref SubnetId
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      Tags:
        - Key: 'Name'
          Value: !Sub 'CloudSetup-Instance-${EnvironmentSuffix}'
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # CloudWatch Alarm for CPU utilization
  CPUAlarmHigh:
    Type: 'AWS::CloudWatch::Alarm'
    Properties:
      AlarmName: !Sub 'CloudSetup-HighCPU-${EnvironmentSuffix}'
      AlarmDescription: 'Alarm when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref CloudSetupEC2Instance
      AlarmActions:
        - !Ref CPUAlarmTopic
      TreatMissingData: notBreaching

  # SNS Topic for CloudWatch Alarm
  CPUAlarmTopic:
    Type: 'AWS::SNS::Topic'
    Properties:
      TopicName: !Sub 'CloudSetup-CPUAlarm-${EnvironmentSuffix}'
      DisplayName: 'CloudSetup CPU Alarm Notifications'
      Tags:
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

  # DynamoDB Table
  CloudSetupDynamoDBTable:
    Type: 'AWS::DynamoDB::Table'
    Properties:
      TableName: !Sub '${DynamoDBTableName}-${EnvironmentSuffix}'
      AttributeDefinitions:
        - AttributeName: !Ref DynamoDBPrimaryKey
          AttributeType: S
      KeySchema:
        - AttributeName: !Ref DynamoDBPrimaryKey
          KeyType: HASH
      ProvisionedThroughput:
        ReadCapacityUnits: 5
        WriteCapacityUnits: 5
      DeletionProtectionEnabled: false
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: false
      SSESpecification:
        SSEEnabled: true
      Tags:
        - Key: 'Project'
          Value: 'CloudSetup'
        - Key: 'Environment'
          Value: !Ref EnvironmentSuffix

Outputs:
  S3BucketName:
    Description: 'Name of the created S3 bucket'
    Value: !Ref CloudSetupS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  S3BucketArn:
    Description: 'ARN of the created S3 bucket'
    Value: !GetAtt CloudSetupS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketArn'

  EC2InstanceId:
    Description: 'Instance ID of the created EC2 instance'
    Value: !Ref CloudSetupEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceId'

  EC2InstancePublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt CloudSetupEC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-EC2PublicIP'

  EC2SecurityGroupId:
    Description: 'Security Group ID for the EC2 instance'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'

  DynamoDBTableName:
    Description: 'Name of the created DynamoDB table'
    Value: !Ref CloudSetupDynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  DynamoDBTableArn:
    Description: 'ARN of the created DynamoDB table'
    Value: !GetAtt CloudSetupDynamoDBTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'

  IAMRoleArn:
    Description: 'ARN of the IAM role attached to EC2 instance'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRoleArn'

  CloudWatchAlarmName:
    Description: 'Name of the CloudWatch CPU alarm'
    Value: !Ref CPUAlarmHigh
    Export:
      Name: !Sub '${AWS::StackName}-CPUAlarmName'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

This CloudFormation template creates a comprehensive cloud environment setup that meets all the specified requirements:

1. **S3 Bucket** with versioning enabled, encryption, and public access blocked
2. **EC2 Instance** deployed in the specified VPC and subnet with monitoring enabled
3. **IAM Role** attached to EC2 with s3:ListBucket permission for the created bucket
4. **Security Group** allowing SSH access only from the specified IP address
5. **CloudWatch Alarm** monitoring CPU utilization with a 70% threshold
6. **DynamoDB Table** with configurable primary key and read capacity set to 5
7. **SNS Topic** for alarm notifications
8. **Proper tagging** with 'Project: CloudSetup' on all resources
9. **Parameterized configuration** for flexibility
10. **Comprehensive outputs** for integration and monitoring

The template uses best practices including:
- Parameter validation with allowed patterns
- Resource encryption where applicable
- Proper IAM policies with least privilege
- CloudWatch monitoring and alerting
- Consistent tagging strategy
- Export values for stack integration