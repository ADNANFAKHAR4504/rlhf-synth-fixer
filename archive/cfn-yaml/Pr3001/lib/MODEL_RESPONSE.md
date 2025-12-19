AWSTemplateFormatVersion: '2010-09-09'
Description: >
  Secure cloud environment with EC2 instances enforcing robust security measures,
  compliance with AWS best practices, and environment-specific configurations.
  
# =============================================================================
# PARAMETERS - Environment-specific configurations
# =============================================================================
Parameters:
  ProjectName:
    Type: String
    Default: 'SecureApp'
    Description: 'Name of the project for resource naming convention'
    MinLength: 1
    MaxLength: 20
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'
    
  Environment:
    Type: String
    Default: 'prod'
    AllowedValues: ['dev', 'staging', 'prod']
    Description: 'Environment type for resource naming and configuration'
    
  VpcId:
    Type: AWS::EC2::VPC::Id
    Description: 'VPC ID where resources will be created'
    
  SubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: 'Subnet ID for EC2 instance placement'
    
  AllowedSSHCidr:
    Type: String
    Default: '10.0.0.0/8'
    Description: 'CIDR block allowed for SSH access (port 22)'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR block (e.g., 10.0.0.0/8)'
    
  InstanceType:
    Type: String
    Default: 't3.micro'
    AllowedValues: ['t3.micro', 't3.small', 't3.medium']
    Description: 'EC2 instance type'
    
  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

# =============================================================================
# RESOURCES - Core infrastructure components
# =============================================================================
Resources:
  # ---------------------------------------------------------------------------
  # KMS Key for EBS Volume Encryption
  # ---------------------------------------------------------------------------
  EBSEncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for EBS encryption - ${ProjectName}-${Environment}'
      KeyPolicy:
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow use of the key for EBS
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EBS-Key-${Environment}'
        - Key: Purpose
          Value: 'EBS Volume Encryption'
        - Key: Environment
          Value: !Ref Environment

  EBSEncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${ProjectName}-ebs-key-${Environment}'
      TargetKeyId: !Ref EBSEncryptionKey

  # ---------------------------------------------------------------------------
  # Security Group - Restricted network access
  # ---------------------------------------------------------------------------
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${ProjectName}-EC2-SG-${Environment}'
      GroupDescription: 'Security group for EC2 instances with restricted access'
      VpcId: !Ref VpcId
      # Inbound Rules - SSH access limited to specific CIDR
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCidr
          Description: 'SSH access from allowed CIDR block'
      # Outbound Rules - HTTPS only (port 443)
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS outbound traffic only'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EC2-SG-${Environment}'
        - Key: Purpose
          Value: 'EC2 Security Group'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # IAM Role - Least privilege permissions for EC2
  # ---------------------------------------------------------------------------
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${ProjectName}-EC2-Role-${Environment}'
      Description: 'IAM role for EC2 instances with least privilege access'
      # Trust policy - Allow EC2 to assume this role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
            Condition:
              StringEquals:
                'aws:RequestedRegion': !Ref 'AWS::Region'
      # Managed policies for basic EC2 functionality
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-EC2-Role-${Environment}'
        - Key: Purpose
          Value: 'EC2 IAM Role'
        - Key: Environment
          Value: !Ref Environment

  # ---------------------------------------------------------------------------
  # IAM Policy - S3 Read Access (Least Privilege)
  # ---------------------------------------------------------------------------
  S3ReadOnlyPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-S3-ReadOnly-Policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # List buckets (required for S3 console access)
          - Effect: Allow
            Action:
              - 's3:ListAllMyBuckets'
              - 's3:GetBucketLocation'
            Resource: '*'
          # Read access to specific bucket pattern (organization-specific)
          - Effect: Allow
            Action:
              - 's3:ListBucket'
              - 's3:GetObject'
            Resource:
              - !Sub 'arn:aws:s3:::${ProjectName}-*-${Environment}'
              - !Sub 'arn:aws:s3:::${ProjectName}-*-${Environment}/*'
      Roles:
        - !Ref EC2Role

  # ---------------------------------------------------------------------------
  # IAM Policy - CloudWatch Monitoring (Least Privilege)
  # ---------------------------------------------------------------------------
  CloudWatchPolicy:
    Type: AWS::IAM::Policy
    Properties:
      PolicyName: !Sub '${ProjectName}-CloudWatch-Policy-${Environment}'
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          # CloudWatch metrics and logs permissions
          - Effect: Allow
            Action:
              - 'cloudwatch:PutMetricData'
              - 'cloudwatch:GetMetricStatistics'
              - 'cloudwatch:ListMetrics'
              - 'logs:CreateLogGroup'
              - 'logs:CreateLogStream'
              - 'logs:PutLogEvents'
              - 'logs:DescribeLogStreams'
            Resource: '*'
          # EC2 describe permissions for CloudWatch agent
          - Effect: Allow
            Action:
              - 'ec2:DescribeVolumes'
              - 'ec2:DescribeTags'
            Resource: '*'
      Roles:
        - !Ref EC2Role

  # ---------------------------------------------------------------------------
  # IAM Instance Profile - Link role to EC2
  # ---------------------------------------------------------------------------
  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${ProjectName}-EC2-Profile-${Environment}'
      Roles:
        - !Ref EC2Role

  # ---------------------------------------------------------------------------
  # EC2 Instance - Secure configuration with encryption and monitoring
  # ---------------------------------------------------------------------------
  SecureEC2Instance:
    Type: AWS::EC2::Instance
    DeletionPolicy: Retain  # Protect against accidental deletion
    UpdateReplacePolicy: Retain
    Properties:
      # Basic configuration
      ImageId: !Ref LatestAmiId
      InstanceType: !Ref InstanceType
      SubnetId: !Ref SubnetId
      
      # Security configuration
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      
      # Monitoring configuration
      Monitoring: true  # Enable detailed CloudWatch monitoring
      
      # Storage configuration with encryption
      BlockDeviceMappings:
        - DeviceName: '/dev/xvda'
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref EBSEncryptionKey
            DeleteOnTermination: true
      
      # User data for CloudWatch agent installation
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          
          # Configure CloudWatch agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
          {
            "metrics": {
              "namespace": "${ProjectName}/${Environment}",
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 300
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 300,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 300
                }
              }
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/${ProjectName}/${Environment}/system",
                      "log_stream_name": "{instance_id}"
                    }
                  ]
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

      # Resource tags following naming convention
      Tags:
        - Key: Name
          Value: !Sub '${ProjectName}-Instance-${Environment}'
        - Key: Purpose
          Value: 'Secure EC2 Instance'
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref ProjectName
        - Key: Backup
          Value: 'Required'

# =============================================================================
# OUTPUTS - Resource identifiers for reference
# =============================================================================
Outputs:
  InstanceId:
    Description: 'ID of the created EC2 instance'
    Value: !Ref SecureEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-InstanceId'
      
  SecurityGroupId:
    Description: 'ID of the security group'
    Value: !Ref EC2SecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-SecurityGroupId'
      
  IAMRoleArn:
    Description: 'ARN of the IAM role'
    Value: !GetAtt EC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-IAMRoleArn'
      
  KMSKeyId:
    Description: 'ID of the KMS key used for EBS encryption'
    Value: !Ref EBSEncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMSKeyId'

# =============================================================================
# METADATA - Additional template information
# =============================================================================
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Project Configuration"
        Parameters:
          - ProjectName
          - Environment
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcId
          - SubnetId
          - AllowedSSHCidr
      - Label:
          default: "Instance Configuration"
        Parameters:
          - InstanceType
          - LatestAmiId
    ParameterLabels:
      ProjectName:
        default: "Project Name"
      Environment:
        default: "Environment Type"
      VpcId:
        default: "VPC ID"
      SubnetId:
        default: "Subnet ID"
      AllowedSSHCidr:
        default: "Allowed SSH CIDR"
      InstanceType:
        default: "Instance Type"
      LatestAmiId:
        default: "AMI ID"