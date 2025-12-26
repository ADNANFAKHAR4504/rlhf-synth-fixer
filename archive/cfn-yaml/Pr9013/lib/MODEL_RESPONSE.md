### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template that creates an enterprise-ready cloud environment. Let me break down the requirements:

1. **Network Infrastructure:**
   - VPC with CIDR 10.0.0.0/16
   - 2 Subnets in different AZs
   - Internet Gateway
   - Route tables for internet connectivity

2. **Compute:**
   - EC2 instance with modern AMI
   - Elastic IP
   - Security Group (HTTP port 80, SSH port 22)

3. **IAM:**
   - IAM role for EC2 to access S3
   - Trust relationships and policies

4. **Storage:**
   - 2 S3 buckets (general purpose with versioning, logging bucket)
   - Encryption at rest for S3 and EBS
   - AWS managed keys

5. **Monitoring:**
   - CloudWatch detailed monitoring
   - CPU alarm at 80% threshold

6. **Best Practices:**
   - Consistent tagging strategy
   - Cost allocation tags
   - Proper outputs (VPC ID, Subnet IDs, EC2 Instance ID)
   - YAML format
   - Intrinsic functions
   - Resource dependencies

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

# Enterprise-Ready CloudFormation Template

Below is a comprehensive CloudFormation template that establishes a secure, scalable cloud environment with all the requested components. This template implements AWS best practices for security, scalability, and operational excellence.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Enterprise-ready foundational infrastructure for modern application deployment'

Parameters:
  EnvironmentName:
    Description: An environment name that is prefixed to resource names
    Type: String
    Default: 'Production'
  
  KeyPairName:
    Description: EC2 Key Pair for SSH access
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
  
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: Latest Amazon Linux 2 AMI ID from SSM Parameter Store

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'

Resources:
  # ==========================================
  # NETWORKING INFRASTRUCTURE
  # ==========================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'
        - Key: ManagedBy
          Value: 'CloudFormation'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ1'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'
        - Key: Type
          Value: 'Public'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet-AZ2'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'
        - Key: Type
          Value: 'Public'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'

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

  # ==========================================
  # SECURITY GROUP
  # ==========================================
  
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${EnvironmentName}-WebServer-SG'
      GroupDescription: Security group for web server with HTTP and SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP traffic'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'Allow SSH traffic'
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-SG'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'

  # ==========================================
  # IAM ROLES AND POLICIES
  # ==========================================
  
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-S3-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt GeneralPurposeBucket.Arn
                  - !Sub '${GeneralPurposeBucket.Arn}/*'
                  - !GetAtt LoggingBucket.Arn
                  - !Sub '${LoggingBucket.Arn}/*'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Infrastructure'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-Instance-Profile'
      Roles:
        - !Ref EC2Role

  # ==========================================
  # S3 STORAGE
  # ==========================================
  
  GeneralPurposeBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-general-purpose-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-General-Purpose-Bucket'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Storage'
        - Key: Purpose
          Value: 'General'

  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentName}-logging-${AWS::AccountId}'
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
          Value: !Sub '${EnvironmentName}-Logging-Bucket'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Storage'
        - Key: Purpose
          Value: 'Logging'

  LoggingBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LoggingBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowSSLRequestsOnly
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt LoggingBucket.Arn
              - !Sub '${LoggingBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # ==========================================
  # EC2 COMPUTE
  # ==========================================
  
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Enterprise Application Server - ${EnvironmentName}</h1>" > /var/www/html/index.html
          
          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Compute'
        - Key: Application
          Value: 'WebServer'

  ElasticIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      InstanceId: !Ref WebServerInstance
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: CostCenter
          Value: 'Network'

  # ==========================================
  # MONITORING AND ALERTING
  # ==========================================
  
  HighCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${EnvironmentName}-WebServer-HighCPU'
      AlarmDescription: 'Alert when CPU utilization exceeds 80%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref WebServerInstance
      TreatMissingData: notBreaching

  # ==========================================
  # CLOUDWATCH LOG GROUP
  # ==========================================
  
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentName}/application'
      RetentionInDays: 30

# ==========================================
# OUTPUTS
# ==========================================

Outputs:
  VPCId:
    Description: VPC ID for the enterprise infrastructure
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID in first Availability Zone
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID in second Availability Zone
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  EC2InstanceId:
    Description: EC2 Instance ID of the web server
    Value: !Ref WebServerInstance
    Export:
      Name: !Sub '${AWS::StackName}-EC2Instance-ID'

  ElasticIPAddress:
    Description: Elastic IP address of the web server
    Value: !Ref ElasticIP

  WebServerURL:
    Description: URL to access the web server
    Value: !Sub 'http://${ElasticIP}'

  GeneralPurposeBucketName:
    Description: Name of the general purpose S3 bucket
    Value: !Ref GeneralPurposeBucket
    Export:
      Name: !Sub '${AWS::StackName}-GeneralPurposeBucket'

  LoggingBucketName:
    Description: Name of the logging S3 bucket
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-LoggingBucket'

  SecurityGroupId:
    Description: Security Group ID for the web server
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroup-ID'

  IAMRoleArn:
    Description: ARN of the IAM role for EC2 instances
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2Role-ARN'
```

## Key Features Implemented

### 1. **Network Architecture**
- VPC with 10.0.0.0/16 CIDR block providing 65,536 IP addresses
- Two public subnets (10.0.1.0/24 and 10.0.2.0/24) across different availability zones
- Internet Gateway with proper route table configuration for outbound internet access

### 2. **Security Implementation**
- Security Group with controlled inbound rules (HTTP:80, SSH:22)
- All S3 buckets have encryption at rest using AES256
- EBS volume encryption enabled
- Public access blocked on S3 buckets
- IAM role with least privilege principle

### 3. **High Availability Design**
- Multi-AZ subnet deployment for fault tolerance
- Elastic IP for consistent public endpoint
- Versioning enabled on general-purpose bucket for data recovery

### 4. **Operational Excellence**
- CloudWatch detailed monitoring enabled
- CPU utilization alarm at 80% threshold
- Log group for centralized application logging
- S3 lifecycle policies for cost optimization

### 5. **Cost Management**
- Comprehensive tagging strategy with:
  - Environment tags
  - CostCenter tags for cost allocation
  - Purpose/Type tags for resource categorization
- Exported outputs for cross-stack references

### 6. **Best Practices**
- Uses AWS Systems Manager Parameter Store for AMI selection (always latest)
- Implements proper resource dependencies
- Uses intrinsic functions (!Ref, !GetAtt, !Sub, etc.)
- Parameterized for reusability across environments
- UserData script for automated web server setup

## Deployment Instructions

1. **Prerequisites:**
   - Create or identify an EC2 Key Pair in your target region
   - Ensure you have appropriate AWS permissions

2. **Deploy the stack:**
```bash
aws cloudformation create-stack \
  --stack-name enterprise-infrastructure \
  --template-body file://template.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=EnvironmentName,ParameterValue=Production \
  --capabilities CAPABILITY_NAMED_IAM
```

3. **Monitor the deployment:**
```bash
aws cloudformation describe-stacks \
  --stack-name enterprise-infrastructure \
  --query 'Stacks[0].StackStatus'
```

This template provides a production-ready foundation that can be extended with additional resources such as RDS databases, Lambda functions, or containerized workloads while maintaining security and operational best practices.