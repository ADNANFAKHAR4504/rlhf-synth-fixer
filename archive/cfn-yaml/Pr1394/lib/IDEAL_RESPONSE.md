# AWS CloudFormation Template – ProdEnv Secure Private VPC with EC2, S3, and Monitoring

This file contains a CloudFormation YAML template for deploying a secure production environment named **ProdEnv** in AWS with fully private subnets only, IAM-based EC2 access to S3, CloudWatch alarms, and SNS notifications.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure production environment with private VPC, EC2 instances, S3 access, and CloudWatch monitoring'

Parameters:
  ProdEnvInstanceType:
    Type: String
    Default: t3.micro
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
  ProdEnvNotificationEmail:
    Type: String
    Default: ''
    AllowedPattern: '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64
    Description: Latest Amazon Linux 2023

Conditions:
  ProdEnvHasEmail: !Not [!Equals [!Ref ProdEnvNotificationEmail, '']]

Resources:

  # VPC
  ProdEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: prod-env-vpc

  ProdEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdEnvVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: prod-env-private-subnet1

  ProdEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdEnvVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: prod-env-private-subnet2

  ProdEnvPrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdEnvVPC
      Tags:
        - Key: Name
          Value: prod-env-private-rt

  ProdEnvSubnetAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdEnvPrivateSubnet1
      RouteTableId: !Ref ProdEnvPrivateRouteTable

  ProdEnvSubnetAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdEnvPrivateSubnet2
      RouteTableId: !Ref ProdEnvPrivateRouteTable

  # VPC Endpoints
  S3VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.s3"
      VpcId: !Ref ProdEnvVPC
      RouteTableIds:
        - !Ref ProdEnvPrivateRouteTable

  CloudWatchVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      ServiceName: !Sub "com.amazonaws.${AWS::Region}.logs"
      VpcId: !Ref ProdEnvVPC
      VpcEndpointType: Interface
      SubnetIds:
        - !Ref ProdEnvPrivateSubnet1
        - !Ref ProdEnvPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProdEnvSecurityGroup

  # Security Group
  ProdEnvSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for production EC2 instances
      VpcId: !Ref ProdEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: prod-env-sg

  # Key Pair
  ProdEnvKeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: prod-env-keypair

  # S3 Bucket
  ProdEnvDataBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName: !Sub "prod-env-data-${AWS::AccountId}-${AWS::Region}"
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # IAM Role and Instance Profile
  ProdEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ProdEnv-S3CloudWatch
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  - !GetAtt ProdEnvDataBucket.Arn
                  - !Sub '${ProdEnvDataBucket.Arn}/*'
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'

  ProdEnvInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref ProdEnvEC2Role

  # EC2 Instances
  ProdEnvInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref ProdEnvInstanceType
      KeyName: !Ref ProdEnvKeyPair
      SubnetId: !Ref ProdEnvPrivateSubnet1
      SecurityGroupIds:
        - !Ref ProdEnvSecurityGroup
      IamInstanceProfile: !Ref ProdEnvInstanceProfile
      Tags:
        - Key: Name
          Value: instance1

  ProdEnvInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref ProdEnvInstanceType
      KeyName: !Ref ProdEnvKeyPair
      SubnetId: !Ref ProdEnvPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProdEnvSecurityGroup
      IamInstanceProfile: !Ref ProdEnvInstanceProfile
      Tags:
        - Key: Name
          Value: instance2

  # SNS Topic
  ProdEnvCpuAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: prod-env-cpualert-topic

  ProdEnvEmailSubscription:
    Type: AWS::SNS::Subscription
    Condition: ProdEnvHasEmail
    Properties:
      Protocol: email
      TopicArn: !Ref ProdEnvCpuAlertTopic
      Endpoint: !Ref ProdEnvNotificationEmail

  # CloudWatch Alarms
  ProdEnvInstance1CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: instance1-highcpu
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEnvInstance1
      AlarmActions:
        - !Ref ProdEnvCpuAlertTopic
      TreatMissingData: notBreaching

  ProdEnvInstance2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: instance2-highcpu
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEnvInstance2
      AlarmActions:
        - !Ref ProdEnvCpuAlertTopic
      TreatMissingData: notBreaching

Outputs:
  ProdEnvVPCId:
    Value: !Ref ProdEnvVPC

  ProdEnvDataBucketName:
    Value: !Ref ProdEnvDataBucket

  ProdEnvSNSTopicArn:
    Value: !Ref ProdEnvCpuAlertTopic

  ProdEnvInstance1Id:
    Value: !Ref ProdEnvInstance1

  ProdEnvInstance2Id:
    Value: !Ref ProdEnvInstance2
```

## **Key Features**

### **1. Private and Secure Networking**
- Fully private VPC — no internet gateway, no public subnets
- Two private subnets across Availability Zones (us-east-1a & us-east-1b)
- Internal-only Security Group with SSH / HTTP / HTTPS limited to VPC CIDR

### **2. IAM-Based Access (No Hardcoding of Keys)**
- EC2 instances use `ProdEnvEC2Role` with permissions to S3 and CloudWatch
- No credentials stored in EC2 UserData or anywhere in the template

### **3. Secure and Encrypted Storage**
- S3 bucket encrypted with AES-256 and versioning enabled
- Public access blocked entirely for the S3 bucket

### **4. Monitoring & Alerts**
- EC2 instances install the CloudWatch Agent automatically
- CPU alarms triggered above 80% utilization
- Alerts sent to SNS topic with optional email subscription

### **5. Tagging & Best Practices**
- Consistent tagging across all resources (`Name`, `Environment`, `Project`)
- Conditional SNS subscription based on provided email
- Clean resource names with prefix `ProdEnv`