### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template. I need to create a template that includes:

1. VPC with CIDR 10.0.0.0/16
2. 3 public subnets across 3 AZs
3. 3 private subnets across 3 AZs
4. Internet Gateway for public subnets
5. NAT Gateways (one in each public subnet)
6. Route tables and associations
7. S3 bucket with versioning and public access blocked
8. IAM roles for EC2 to access S3
9. EC2 instances (t2.micro) in private subnets
10. Security groups restricting SSH access
11. Parameters for reusability
12. Outputs for important resources
13. Best practices for security and scalability

Let me create a comprehensive CloudFormation template with all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template that provisions a secure and scalable AWS VPC infrastructure. This template follows AWS best practices for security, scalability, and reusability.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure and Scalable VPC Infrastructure with EC2 instances and S3 bucket'

# Parameters for reusability and customization
Parameters:
  ProjectName:
    Type: String
    Default: SecureVPC
    Description: Project name to be used for resource naming
    MinLength: 1
    MaxLength: 50
    AllowedPattern: ^[a-zA-Z][a-zA-Z0-9-]*$
    
  Environment:
    Type: String
    Default: Production
    Description: Environment name
    AllowedValues:
      - Development
      - Staging
      - Production
      
  SSHAllowedIP:
    Type: String
    Description: IP address allowed to SSH into EC2 instances (e.g., 203.0.113.0/32)
    AllowedPattern: ^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])/(3[0-2]|[1-2][0-9]|[0-9])$
    ConstraintDescription: Must be a valid IP CIDR range of the form x.x.x.x/x
    
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access
    ConstraintDescription: Must be the name of an existing EC2 KeyPair
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
    Description: Latest Amazon Linux 2 AMI ID

Mappings:
  SubnetConfig:
    VPC:
      CIDR: 10.0.0.0/16
    PublicSubnet1:
      CIDR: 10.0.1.0/24
    PublicSubnet2:
      CIDR: 10.0.2.0/24
    PublicSubnet3:
      CIDR: 10.0.3.0/24
    PrivateSubnet1:
      CIDR: 10.0.11.0/24
    PrivateSubnet2:
      CIDR: 10.0.12.0/24
    PrivateSubnet3:
      CIDR: 10.0.13.0/24

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !FindInMap [SubnetConfig, VPC, CIDR]
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-IGW'
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicSubnet1'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicSubnet2'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PublicSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs 'us-west-2']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicSubnet3'
        - Key: Type
          Value: Public
        - Key: Environment
          Value: !Ref Environment

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet1, CIDR]
      AvailabilityZone: !Select [0, !GetAZs 'us-west-2']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet1'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet2, CIDR]
      AvailabilityZone: !Select [1, !GetAZs 'us-west-2']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet2'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !FindInMap [SubnetConfig, PrivateSubnet3, CIDR]
      AvailabilityZone: !Select [2, !GetAZs 'us-west-2']
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateSubnet3'
        - Key: Type
          Value: Private
        - Key: Environment
          Value: !Ref Environment

  # Elastic IPs for NAT Gateways
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW1-EIP'

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW2-EIP'

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW3-EIP'

  # NAT Gateways
  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW1'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW2'

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-NATGW3'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PublicRouteTable'
        - Key: Type
          Value: Public

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  # Public Subnet Route Table Associations
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

  PublicSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable1'
        - Key: Type
          Value: Private

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable2'
        - Key: Type
          Value: Private

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-PrivateRouteTable3'
        - Key: Type
          Value: Private

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnet3RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # S3 Bucket with security configurations
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${ProjectName}-${Environment}-${AWS::AccountId}-secure-bucket'
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
          Value: !Sub '${ProjectName}-${Environment}-S3Bucket'
        - Key: Environment
          Value: !Ref Environment

  # S3 Bucket Policy
  S3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref S3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${S3Bucket.Arn}/*'
              - !GetAtt S3Bucket.Arn
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # IAM Role for EC2 instances to access S3
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-${Environment}-EC2Role'
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
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
                  - 's3:GetBucketLocation'
                  - 's3:GetObjectVersion'
                  - 's3:PutObjectAcl'
                  - 's3:GetObjectAcl'
                Resource:
                  - !Sub '${S3Bucket.Arn}'
                  - !Sub '${S3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListAllMyBuckets'
                Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EC2Role'
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-${Environment}-EC2InstanceProfile'
      Roles:
        - !Ref EC2Role

  # Security Groups
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-${Environment}-EC2-SG'
      GroupDescription: Security group for EC2 instances in private subnets
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHAllowedIP
          Description: SSH access from specific IP
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 10.0.0.0/16
          Description: HTTPS traffic within VPC
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 10.0.0.0/16
          Description: HTTP traffic within VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS traffic to internet
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP traffic to internet
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 10.0.0.0/16
          Description: SSH within VPC
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-EC2-SG'
        - Key: Environment
          Value: !Ref Environment

  # Launch Template for EC2 instances
  EC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${ProjectName}-${Environment}-LaunchTemplate'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: t2.micro
        KeyName: !Ref KeyPairName
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Environment
                Value: !Ref Environment
              - Key: ManagedBy
                Value: CloudFormation
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y aws-cli
            
            # Install CloudWatch agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
            rpm -U ./amazon-cloudwatch-agent.rpm
            
            # Create a test file in S3
            echo "Instance launched at $(date)" > /tmp/instance-info.txt
            aws s3 cp /tmp/instance-info.txt s3://${S3Bucket}/instances/$(ec2-metadata --instance-id | cut -d " " -f 2)/launch-info.txt
            
            # Install SSM agent (already included in Amazon Linux 2)
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent

  # EC2 Instances in Private Subnets
  EC2Instance1:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Instance1'
        - Key: Environment
          Value: !Ref Environment

  EC2Instance2:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Instance2'
        - Key: Environment
          Value: !Ref Environment

  EC2Instance3:
    Type: AWS::EC2::Instance
    Properties:
      LaunchTemplate:
        LaunchTemplateId: !Ref EC2LaunchTemplate
        Version: !GetAtt EC2LaunchTemplate.LatestVersionNumber
      SubnetId: !Ref PrivateSubnet3
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-Instance3'
        - Key: Environment
          Value: !Ref Environment

  # VPC Flow Logs for monitoring
  VPCFlowLogsRole:
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

  VPCFlowLogsLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/${ProjectName}-${Environment}'
      RetentionInDays: 30

  VPCFlowLogs:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogsLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogsRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-${Environment}-FlowLogs'

# Outputs for reference and cross-stack usage
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-ID'

  VPCCidr:
    Description: VPC CIDR Block
    Value: !GetAtt VPC.CidrBlock
    Export:
      Name: !Sub '${ProjectName}-${Environment}-VPC-CIDR'

  PublicSubnetIds:
    Description: Public Subnet IDs
    Value: !Join [',', [!Ref PublicSubnet1, !Ref PublicSubnet2, !Ref PublicSubnet3]]
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PublicSubnetIds'

  PrivateSubnetIds:
    Description: Private Subnet IDs
    Value: !Join [',', [!Ref PrivateSubnet1, !Ref PrivateSubnet2, !Ref PrivateSubnet3]]
    Export:
      Name: !Sub '${ProjectName}-${Environment}-PrivateSubnetIds'

  S3BucketName:
    Description: Name of the S3 bucket
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3Bucket'

  S3BucketArn:
    Description: ARN of the S3 bucket
    Value: !GetAtt S3Bucket.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-S3BucketArn'

  EC2SecurityGroupId:
    Description: Security Group ID for EC2 instances
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${ProjectName}-${Environment}-EC2-SG'

  EC2Instance1Id:
    Description: Instance ID of EC2 Instance 1
    Value: !Ref EC2Instance1

  EC2Instance2Id:
    Description: Instance ID of EC2 Instance 2
    Value: !Ref EC2Instance2

  EC2Instance3Id:
    Description: Instance ID of EC2 Instance 3
    Value: !Ref EC2Instance3

  EC2RoleArn:
    Description: ARN of the IAM role for EC2 instances
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${ProjectName}-${Environment}-EC2RoleArn'

  NATGateway1IP:
    Description: Elastic IP address of NAT Gateway 1
    Value: !Ref NATGateway1EIP

  NATGateway2IP:
    Description: Elastic IP address of NAT Gateway 2
    Value: !Ref NATGateway2EIP

  NATGateway3IP:
    Description: Elastic IP address of NAT Gateway 3
    Value: !Ref NATGateway3EIP
```

## Template Overview and Key Features

This CloudFormation template creates a comprehensive, secure, and scalable AWS infrastructure with the following components:

### **1. Network Architecture**
- **VPC** with CIDR block 10.0.0.0/16
- **3 Public Subnets** (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24) across 3 AZs
- **3 Private Subnets** (10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24) across 3 AZs
- **Internet Gateway** for public subnet internet access
- **3 NAT Gateways** (one per AZ) for high availability

### **2. Security Features**
- **Security Groups** with restrictive rules (SSH only from specified IP)
- **S3 Bucket** with:
  - Versioning enabled
  - Server-side encryption (AES256)
  - Public access completely blocked
  - SSL-only access policy
  - Lifecycle policy for old versions
- **VPC Flow Logs** for network monitoring
- **IAM Roles** with least privilege access

### **3. Compute Resources**
- **3 EC2 instances** (t2.micro) in private subnets
- **Launch Template** for consistent instance configuration
- **Instance Profile** with S3 access permissions
- **SSM Agent** for secure remote management

### **4. Best Practices Implemented**

#### **Scalability**
- Multi-AZ deployment for high availability
- Separate NAT Gateway per AZ to avoid cross-AZ charges
- Launch template for easy scaling

#### **Security**
- Private subnets for compute resources
- Restrictive security groups
- Encrypted S3 storage
- VPC Flow Logs for auditing
- No direct internet access to private resources

#### **Reusability**
- Parameterized inputs (Project Name, Environment, SSH IP, Key Pair)
- Exported outputs for cross-stack references
- Consistent tagging strategy
- Environment-based naming convention

### **5. Parameters for Customization**
- `ProjectName`: For resource naming
- `Environment`: Development/Staging/Production
- `SSHAllowedIP`: Restrict SSH access to specific IP
- `KeyPairName`: Existing EC2 key pair
- `LatestAmiId`: Automatically uses latest Amazon Linux 2 AMI

### **6. Deployment Instructions**

1. **Prerequisites**:
   - Create an EC2 Key Pair in us-west-2 region
   - Note your public IP address for SSH access

2. **Deploy via AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name secure-vpc-infrastructure \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=ProjectName,ParameterValue=MyProject \
    ParameterKey=Environment,ParameterValue=Production \
    ParameterKey=SSHAllowedIP,ParameterValue=YOUR_IP/32 \
    ParameterKey=KeyPairName,ParameterValue=YOUR_KEY_PAIR \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

3. **Deploy via AWS Console**:
   - Navigate to CloudFormation in us-west-2
   - Create stack → Upload template
   - Fill in the parameters
   - Check "I acknowledge that AWS CloudFormation might create IAM resources with custom names"
   - Create stack

### **7. Cost Optimization**
- Uses t2.micro instances (free tier eligible)
- NAT Gateways are the primary cost driver (~$45/month each)
- For development environments, consider using a single NAT Gateway

This template is production-ready and follows AWS Well-Architected Framework principles for security, reliability, performance efficiency, cost optimization, and operational excellence.