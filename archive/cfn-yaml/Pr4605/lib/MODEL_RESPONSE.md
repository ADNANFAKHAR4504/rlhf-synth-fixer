# AWS CloudFormation Template Analysis

## Requirements Analysis

### Key Components

1. **Networking**
   - VPC with CIDR 10.0.0.0/16
   - 2 subnets in different AZs
   - Internet Gateway
   - Route Table

2. **Compute**
   - EC2 instance with AMI parameter
   - Elastic IP
   - Security Group (HTTP/SSH)
   - Detailed monitoring
   - EBS encryption

3. **IAM**
   - IAM Role and Instance Profile
   - EC2 to S3 access permissions

4. **Storage**
   - Two S3 buckets (general and logs)
   - Versioning enabled
   - Encryption enabled

5. **Security**
   - Storage encryption
   - Resource tagging

6. **Monitoring**
   - CloudWatch alarm (CPU > 80%)

7. **Outputs**
   - Various resource IDs

### Key Constraints

- **Region**: us-east-1 (using AWS::Region pseudoparameter)
- **Cross-Account Compatibility**: Must be executable across accounts
- **No Hardcoding**: Use parameters and pseudo-parameters
- **Security**: Follow AWS best practices
- **Cost Management**: Implement allocation tagging

### Template Structure

The CloudFormation template will include:
1. Parameters section
2. Metadata section (parameter grouping)
3. Resources section
4. Outputs section
## Implementation

The following CloudFormation template implements all requirements with proper security, monitoring, and compliance measures.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Foundational cloud environment with VPC, EC2, S3, IAM, and monitoring'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - VPCCidr
          - Subnet1Cidr
          - Subnet2Cidr
      - Label:
          default: "EC2 Configuration"
        Parameters:
          - InstanceType
          - AMIId
          - KeyPairName
      - Label:
          default: "Tagging Configuration"
        Parameters:
          - EnvironmentName
          - ProjectName
          - Owner
          - CostCenter
    ParameterLabels:
      VPCCidr:
        default: "VPC CIDR Block"
      Subnet1Cidr:
        default: "Subnet 1 CIDR Block"
      Subnet2Cidr:
        default: "Subnet 2 CIDR Block"
      InstanceType:
        default: "EC2 Instance Type"
      AMIId:
        default: "Amazon Machine Image ID"
      KeyPairName:
        default: "Key Pair Name"
      EnvironmentName:
        default: "Environment Name"
      ProjectName:
        default: "Project Name"
      Owner:
        default: "Owner"
      CostCenter:
        default: "Cost Center"

Parameters:
  VPCCidr:
    Type: String
    Default: "10.0.0.0/16"
    Description: "CIDR block for the VPC"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: "Must be a valid CIDR range"

  Subnet1Cidr:
    Type: String
    Default: "10.0.1.0/24"
    Description: "CIDR block for the first subnet"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: "Must be a valid CIDR range"

  Subnet2Cidr:
    Type: String
    Default: "10.0.2.0/24"
    Description: "CIDR block for the second subnet"
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: "Must be a valid CIDR range"

  InstanceType:
    Type: String
    Default: "t3.micro"
    Description: "EC2 instance type"
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium
      - t3.micro
      - t3.small
      - t3.medium
    ConstraintDescription: "Must be a valid EC2 instance type"

  AMIId:
    Type: AWS::EC2::Image::Id
    Description: "AMI ID for the EC2 instance"
    ConstraintDescription: "Must be a valid AMI ID"

  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: "Name of an existing EC2 KeyPair to enable SSH access"
    ConstraintDescription: "Must be the name of an existing EC2 KeyPair"

  EnvironmentName:
    Type: String
    Default: "Development"
    Description: "Environment name for tagging"
    AllowedValues:
      - Development
      - Staging
      - Production
    ConstraintDescription: "Must be Development, Staging, or Production"

  ProjectName:
    Type: String
    Default: "Foundation"
    Description: "Project name for tagging"

  Owner:
    Type: String
    Description: "Owner email or name for tagging"

  CostCenter:
    Type: String
    Description: "Cost center identifier for billing purposes"

Resources:
  # VPC
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VPCCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-VPC"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-IGW"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Subnets
  Subnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref Subnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs !Ref "AWS::Region"]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Subnet1"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  Subnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref Subnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs !Ref "AWS::Region"]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Subnet2"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Route Table
  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-RouteTable"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  InternetRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: "0.0.0.0/0"
      GatewayId: !Ref InternetGateway

  Subnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref Subnet1
      RouteTableId: !Ref RouteTable

  Subnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref Subnet2
      RouteTableId: !Ref RouteTable

  # Security Group
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: "Allow HTTP and SSH traffic"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: "0.0.0.0/0"
          Description: "Allow HTTP from anywhere"
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: "0.0.0.0/0"
          Description: "Allow SSH from anywhere"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: "0.0.0.0/0"
          Description: "Allow all outbound traffic"
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-EC2-SecurityGroup"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # IAM Role for EC2
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${AWS::StackName}-EC2Role"
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
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
                  - !GetAtt GeneralStorageBucket.Arn
                  - !Sub "${GeneralStorageBucket.Arn}/*"
                  - !GetAtt LogsBucket.Arn
                  - !Sub "${LogsBucket.Arn}/*"
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-EC2Role"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${AWS::StackName}-EC2InstanceProfile"
      Roles:
        - !Ref EC2Role

  # EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Ref AMIId
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref Subnet1
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      Monitoring: true
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          # Install CloudWatch agent
          wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-EC2Instance"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # Elastic IP
  ElasticIP:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      InstanceId: !Ref EC2Instance
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-EIP"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # S3 Buckets
  GeneralStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-general-storage-${AWS::AccountId}-${AWS::Region}"
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
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-GeneralStorage"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${AWS::StackName}-logs-${AWS::AccountId}-${AWS::Region}"
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
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-Logs"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

  # CloudWatch Alarm
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "${AWS::StackName}-CPU-Utilization-High"
      AlarmDescription: "Triggers when EC2 CPU utilization exceeds 80%"
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref EC2Instance
      TreatMissingData: notBreaching
      Tags:
        - Key: Name
          Value: !Sub "${AWS::StackName}-CPUAlarm"
        - Key: EnvName
          Value: !Ref EnvironmentName
        - Key: ProjectName
          Value: !Ref ProjectName
        - Key: Owner
          Value: !Ref Owner
        - Key: CostCenter
          Value: !Ref CostCenter

Outputs:
  VPCId:
    Description: "VPC ID"
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPC-ID"

  Subnet1Id:
    Description: "Subnet 1 ID"
    Value: !Ref Subnet1
    Export:
      Name: !Sub "${AWS::StackName}-Subnet1-ID"

  Subnet2Id:
    Description: "Subnet 2 ID"
    Value: !Ref Subnet2
    Export:
      Name: !Sub "${AWS::StackName}-Subnet2-ID"

  EC2InstanceId:
    Description: "EC2 Instance ID"
    Value: !Ref EC2Instance
    Export:
      Name: !Sub "${AWS::StackName}-EC2Instance-ID"

  ElasticIP:
    Description: "Elastic IP Address"
    Value: !Ref ElasticIP
    Export:
      Name: !Sub "${AWS::StackName}-ElasticIP"

  GeneralStorageBucketName:
    Description: "General Storage S3 Bucket Name"
    Value: !Ref GeneralStorageBucket
    Export:
      Name: !Sub "${AWS::StackName}-GeneralStorageBucket"

  LogsBucketName:
    Description: "Logs S3 Bucket Name"
    Value: !Ref LogsBucket
    Export:
      Name: !Sub "${AWS::StackName}-LogsBucket"

  SecurityGroupId:
    Description: "EC2 Security Group ID"
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-SecurityGroup-ID"
```

## Key Features Explained

### 1. **Parameter Organization**
The template uses metadata to group parameters logically:
- Network Configuration
- EC2 Configuration
- Tagging Configuration

### 2. **Dynamic Resource Creation**
- Uses `!GetAZs` to automatically select availability zones
- Uses `AWS::AccountId` and `AWS::Region` pseudoparameters for unique S3 bucket names
- No hardcoded values anywhere

### 3. **Security Best Practices**
- **Encryption**: All S3 buckets and EBS volumes are encrypted
- **IAM Principle of Least Privilege**: EC2 role only has access to the specific S3 buckets created
- **Public Access Blocking**: S3 buckets have public access blocked
- **Security Groups**: Only necessary ports (80, 22) are open

### 4. **Monitoring**
- Detailed monitoring enabled on EC2
- CloudWatch alarm configured for CPU > 80%

### 5. **Cost Optimization**
- Consistent tagging across all resources
- S3 lifecycle policy on logs bucket to delete old logs

### 6. **Cross-Account Compatibility**
- No account-specific resources
- Uses parameters for all user-specific values
- Region-agnostic using pseudoparameters

## Usage Instructions

1. **Deploy the template**:
```bash
aws cloudformation create-stack \
  --stack-name my-foundation-stack \
  --template-body file://template.yaml \
  --parameters \
    ParameterKey=AMIId,ParameterValue=ami-xxxxxxxxx \
    ParameterKey=KeyPairName,ParameterValue=my-key-pair \
    ParameterKey=Owner,ParameterValue=john.doe@example.com \
    ParameterKey=CostCenter,ParameterValue=CC-12345 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

2. **Required Parameters**:
   - `AMIId`: You must provide a valid AMI ID for your region
   - `KeyPairName`: An existing EC2 key pair name
   - `Owner`: For tagging purposes
   - `CostCenter`: For billing allocation

3. **Optional Parameters**: All other parameters have sensible defaults but can be customized

This template provides a solid foundation that can be extended with additional resources like RDS databases, load balancers, or Lambda functions as needed.