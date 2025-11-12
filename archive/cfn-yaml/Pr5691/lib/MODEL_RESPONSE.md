### Reasoning Trace
---

This is a comprehensive request for an AWS CloudFormation template. I need to create a complete YAML template that includes:

1. VPC with CIDR 10.0.0.0/16
2. 2 public subnets and 2 private subnets across different AZs
3. Internet Gateway for public access
4. NAT Gateway in one public subnet
5. Route tables with proper routing
6. Security groups with SSH access from specific IP range
7. EC2 instance in private subnet
8. IAM role with limited S3 permissions
9. CloudTrail enabled with logs in S3
10. S3 bucket with access logging
11. All resources tagged with Environment: Production
12. Follow AWS best practices

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that implements a secure VPC architecture with all the specified requirements. This template follows AWS best practices for security, availability, and cost efficiency.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS VPC Architecture with CloudTrail, EC2, and S3 Integration'

Parameters:
  SSHAllowedCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR block allowed for SSH access (Change to your IP range)'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'EC2 Key Pair for SSH access'
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

Mappings:
  SubnetConfig:
    VPC:
      CIDR: '10.0.0.0/16'
    PublicSubnet1:
      CIDR: '10.0.1.0/24'
    PublicSubnet2:
      CIDR: '10.0.2.0/24'
    PrivateSubnet1:
      CIDR: '10.0.10.0/24'
    PrivateSubnet2:
      CIDR: '10.0.11.0/24'

Resources:
  # ==================== VPC Configuration ====================
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'
        - Key: Environment
          Value: Production

  # ==================== Internet Gateway ====================
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'
        - Key: Environment
          Value: Production

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # ==================== Public Subnets ====================
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet-AZ1'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Public

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PublicSubnet-AZ2'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Public

  # ==================== Private Subnets ====================
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet-AZ1'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Private

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-PrivateSubnet-AZ2'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Private

  # ==================== NAT Gateway ====================
  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'
        - Key: Environment
          Value: Production

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway'
        - Key: Environment
          Value: Production

  # ==================== Route Tables ====================
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-RouteTable'
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

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

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-RouteTable'
        - Key: Environment
          Value: Production

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway

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

  # ==================== Security Groups ====================
  BastionSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for bastion host - SSH access from specific IP'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedCIDR
          Description: 'SSH access from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Bastion-SG'
        - Key: Environment
          Value: Production

  PrivateInstanceSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for private EC2 instances'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          SourceSecurityGroupId: !Ref BastionSecurityGroup
          Description: 'SSH access from bastion host'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: 'HTTPS from within VPC'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
          Description: 'HTTP from within VPC'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS to internet'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP to internet'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: 'SSH within VPC'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Instance-SG'
        - Key: Environment
          Value: Production

  # ==================== S3 Buckets ====================
  CloudTrailS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-cloudtrail-logs-${AWS::AccountId}'
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
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      LoggingConfiguration:
        DestinationBucketName: !Ref AccessLoggingBucket
        LogFilePrefix: cloudtrail-access-logs/
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail-Bucket'
        - Key: Environment
          Value: Production

  AccessLoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-access-logs-${AWS::AccountId}'
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
          - Id: DeleteOldAccessLogs
            Status: Enabled
            ExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Access-Logs-Bucket'
        - Key: Environment
          Value: Production

  CloudTrailS3BucketPolicy:
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
            Resource: !GetAtt CloudTrailS3Bucket.Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailS3Bucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': bucket-owner-full-control

  # ==================== CloudTrail ====================
  CloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn:
      - CloudTrailS3BucketPolicy
    Properties:
      TrailName: !Sub '${AWS::StackName}-CloudTrail'
      S3BucketName: !Ref CloudTrailS3Bucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EnableLogFileValidation: true
      EventSelectors:
        - IncludeManagementEvents: true
          ReadWriteType: All
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub '${CloudTrailS3Bucket.Arn}/'
                - !Sub '${AccessLoggingBucket.Arn}/'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-CloudTrail'
        - Key: Environment
          Value: Production

  # ==================== IAM Role for EC2 ====================
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-EC2-Limited-S3-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: LimitedS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: AllowS3ListBucket
                Effect: Allow
                Action:
                  - 's3:ListBucket'
                  - 's3:GetBucketLocation'
                Resource: !Sub 'arn:aws:s3:::${AWS::StackName}-*'
              - Sid: AllowS3ObjectOperations
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:DeleteObject'
                Resource: !Sub 'arn:aws:s3:::${AWS::StackName}-*/*'
              - Sid: DenyAllOtherServices
                Effect: Deny
                NotAction:
                  - 's3:*'
                  - 'logs:*'
                  - 'cloudwatch:*'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-EC2-Role'
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-EC2-Instance-Profile'
      Roles:
        - !Ref EC2InstanceRole

  # ==================== EC2 Instance ====================
  PrivateEC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.micro
      KeyName: !Ref KeyPairName
      IamInstanceProfile: !Ref EC2InstanceProfile
      SubnetId: !Ref PrivateSubnet1
      SecurityGroupIds:
        - !Ref PrivateInstanceSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 20
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          
          # Install CloudWatch Agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
          
          # Install AWS CLI
          yum install -y aws-cli
          
          # Configure CloudWatch Agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
          {
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "${AWS::StackName}/var/log/messages",
                      "log_stream_name": "{instance_id}"
                    }
                  ]
                }
              }
            },
            "metrics": {
              "namespace": "${AWS::StackName}/EC2",
              "metrics_collected": {
                "cpu": {
                  "measurement": [
                    {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"}
                  ],
                  "totalcpu": false
                },
                "mem": {
                  "measurement": [
                    {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
                  ]
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch Agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config \
            -m ec2 \
            -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Instance'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Application

  # ==================== Bastion Host (Optional - for SSH access) ====================
  BastionHost:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: t3.nano
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref BastionSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeSize: 8
            VolumeType: gp3
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          
          # Harden SSH
          sed -i 's/#PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
          sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/g' /etc/ssh/sshd_config
          systemctl restart sshd
          
          # Install fail2ban
          amazon-linux-extras install -y epel
          yum install -y fail2ban
          systemctl enable fail2ban
          systemctl start fail2ban
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Bastion-Host'
        - Key: Environment
          Value: Production
        - Key: Type
          Value: Bastion

  # ==================== VPC Flow Logs ====================
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: CloudWatchLogPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'logs:CreateLogGroup'
                  - 'logs:CreateLogStream'
                  - 'logs:PutLogEvents'
                  - 'logs:DescribeLogGroups'
                  - 'logs:DescribeLogStreams'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC-FlowLog-Role'
        - Key: Environment
          Value: Production

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${AWS::StackName}'
      RetentionInDays: 30

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      ResourceId: !Ref VPC
      ResourceType: VPC
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC-FlowLog'
        - Key: Environment
          Value: Production

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  BastionHostPublicIP:
    Description: Bastion Host Public IP
    Value: !GetAtt BastionHost.PublicIp

  PrivateInstanceId:
    Description: Private EC2 Instance ID
    Value: !Ref PrivateEC2Instance

  CloudTrailBucketName:
    Description: CloudTrail S3 Bucket Name
    Value: !Ref CloudTrailS3Bucket

  AccessLogsBucketName:
    Description: Access Logs S3 Bucket Name
    Value: !Ref AccessLoggingBucket

  NATGatewayEIP:
    Description: NAT Gateway Elastic IP
    Value: !Ref NATGatewayEIP
```

## Key Features Explained

### **Architecture Components:**

1. **VPC Configuration**
   - CIDR block: 10.0.0.0/16 as specified
   - DNS support enabled for better service discovery

2. **Subnet Layout**
   - 2 Public Subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs
   - 2 Private Subnets (10.0.10.0/24, 10.0.11.0/24) in different AZs
   - Proper tagging for identification

3. **Gateway Configuration**
   - Internet Gateway for public subnet connectivity
   - NAT Gateway in PublicSubnet1 for outbound private traffic
   - Cost-efficient single NAT Gateway (can be modified for HA)

4. **Routing**
   - Public route table directing traffic to Internet Gateway
   - Private route table directing traffic through NAT Gateway
   - Proper subnet associations

5. **Security Groups**
   - Bastion SG: SSH access only from specified CIDR
   - Private Instance SG: SSH from bastion, limited egress

6. **IAM Role**
   - Limited S3 access (only to stack-prefixed buckets)
   - Explicit deny for other AWS services
   - CloudWatch permissions for monitoring

7. **CloudTrail & Logging**
   - Multi-region trail with log file validation
   - S3 bucket with encryption and versioning
   - Access logging enabled with lifecycle policies
   - VPC Flow Logs for network monitoring

8. **EC2 Instances**
   - Private instance with IAM role in private subnet
   - Bastion host in public subnet for secure access
   - CloudWatch agent pre-configured
   - Encrypted EBS volumes

### **Best Practices Implemented:**

- **Security**: Encryption at rest, least privilege IAM, security groups, private subnets
- **Cost Efficiency**: Single NAT Gateway, t3 instances, lifecycle policies for logs
- **Availability**: Multi-AZ deployment, automated updates
- **Monitoring**: CloudTrail, VPC Flow Logs, CloudWatch integration
- **Compliance**: All resources tagged with Environment: Production

### **Deployment Instructions:**

1. Save the template as `vpc-architecture.yaml`
2. Create an EC2 Key Pair in your AWS account
3. Deploy using AWS CLI:
```bash
aws cloudformation create-stack \
  --stack-name secure-vpc-stack \
  --template-body file://vpc-architecture.yaml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=SSHAllowedCIDR,ParameterValue=your-ip/32 \
  --capabilities CAPABILITY_NAMED_IAM
```

4. Monitor stack creation:
```bash
aws cloudformation describe-stacks --stack-name secure-vpc-stack
```

This template provides a production-ready, secure VPC architecture that meets all specified requirements while following AWS best practices for enterprise deployments.