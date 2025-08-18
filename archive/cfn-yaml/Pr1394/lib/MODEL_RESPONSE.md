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
    Description: EC2 instance type for production environment
  
  ProdEnvNotificationEmail:
    Type: String
    Default: ''
    Description: Email address for CloudWatch alarm notifications (optional)
    AllowedPattern: '^$|^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
  
  ProdEnvKeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access to instances

Conditions:
  ProdEnvHasEmail: !Not [!Equals [!Ref ProdEnvNotificationEmail, '']]

Resources:
  # VPC Configuration
  ProdEnvVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: ProdEnvVPC
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # Private Subnets
  ProdEnvPrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdEnvVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a
      Tags:
        - Key: Name
          Value: ProdEnvPrivateSubnet1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  ProdEnvPrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref ProdEnvVPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: us-east-1b
      Tags:
        - Key: Name
          Value: ProdEnvPrivateSubnet2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # Route Tables
  ProdEnvPrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdEnvVPC
      Tags:
        - Key: Name
          Value: ProdEnvPrivateRouteTable1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  ProdEnvPrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref ProdEnvVPC
      Tags:
        - Key: Name
          Value: ProdEnvPrivateRouteTable2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # Route Table Associations
  ProdEnvPrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdEnvPrivateSubnet1
      RouteTableId: !Ref ProdEnvPrivateRouteTable1

  ProdEnvPrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref ProdEnvPrivateSubnet2
      RouteTableId: !Ref ProdEnvPrivateRouteTable2

  # Security Group
  ProdEnvSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: ProdEnvSecurityGroup
      GroupDescription: Security group for production environment EC2 instances
      VpcId: !Ref ProdEnvVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH access within VPC
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
          Description: HTTP access within VPC
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: HTTPS access within VPC
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 10.0.0.0/16
          Description: All traffic within VPC
      Tags:
        - Key: Name
          Value: ProdEnvSecurityGroup
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # S3 Bucket
  ProdEnvDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prodenv-data-bucket-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: ProdEnvDataBucket
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # IAM Role for EC2 instances
  ProdEnvEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: ProdEnvEC2Role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: ProdEnvS3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${ProdEnvDataBucket}/*'
                  - !GetAtt ProdEnvDataBucket.Arn
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: '*'
      Tags:
        - Key: Name
          Value: ProdEnvEC2Role
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # Instance Profile
  ProdEnvInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: ProdEnvInstanceProfile
      Roles:
        - !Ref ProdEnvEC2Role

  # EC2 Instances
  ProdEnvInstance1:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316
      InstanceType: !Ref ProdEnvInstanceType
      KeyName: !Ref ProdEnvKeyPairName
      SubnetId: !Ref ProdEnvPrivateSubnet1
      SecurityGroupIds:
        - !Ref ProdEnvSecurityGroup
      IamInstanceProfile: !Ref ProdEnvInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      Tags:
        - Key: Name
          Value: ProdEnvInstance1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  ProdEnvInstance2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c02fb55956c7d316
      InstanceType: !Ref ProdEnvInstanceType
      KeyName: !Ref ProdEnvKeyPairName
      SubnetId: !Ref ProdEnvPrivateSubnet2
      SecurityGroupIds:
        - !Ref ProdEnvSecurityGroup
      IamInstanceProfile: !Ref ProdEnvInstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
      Tags:
        - Key: Name
          Value: ProdEnvInstance2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # SNS Topic
  ProdEnvCpuAlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: ProdEnvCpuAlertTopic
      DisplayName: Production Environment CPU Alert Topic
      Tags:
        - Key: Name
          Value: ProdEnvCpuAlertTopic
        - Key: Environment
          Value: Production
        - Key: Project
          Value: ProdEnv

  # SNS Subscription (conditional)
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
      AlarmName: ProdEnvInstance1-HighCPU
      AlarmDescription: Alarm when CPU exceeds 80% for Instance 1
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
      AlarmName: ProdEnvInstance2-HighCPU
      AlarmDescription: Alarm when CPU exceeds 80% for Instance 2
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
    Description: VPC ID for the production environment
    Value: !Ref ProdEnvVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  ProdEnvDataBucketName:
    Description: Name of the S3 data bucket
    Value: !Ref ProdEnvDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-DataBucket-Name'

  ProdEnvSNSTopicArn:
    Description: ARN of the CPU alert SNS topic
    Value: !Ref ProdEnvCpuAlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic-ARN'

  ProdEnvInstance1Id:
    Description: Instance ID of the first EC2 instance
    Value: !Ref ProdEnvInstance1
    Export:
      Name: !Sub '${AWS::StackName}-Instance1-ID'

  ProdEnvInstance2Id:
    Description: Instance ID of the second EC2 instance
    Value: !Ref ProdEnvInstance2
    Export:
      Name: !Sub '${AWS::StackName}-Instance2-ID'
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
