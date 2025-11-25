### Reasoning Trace
---

Let me create a comprehensive CloudFormation template that meets all the specified requirements. I need to include:

1. S3 bucket with versioning enabled
2. IAM role with read-only access to S3
3. EC2 instance (t3.micro or larger) with:
   - SSH key pair parameter
   - Security group restricting SSH to specific IP
   - IAM instance profile attached
4. All resources prefixed with 'Prod'
5. Consistent tagging with 'Environment: Production'
6. Proper dependency management
7. YAML format

Let me structure this template carefully to ensure all dependencies are properly managed and all requirements are met.
### Answer 
---

# Production-Ready CloudFormation Template

Below is a complete CloudFormation template that provisions a production-ready infrastructure with EC2, S3, IAM, and security configurations following AWS best practices:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production-ready infrastructure with EC2, S3, IAM, and security configurations'

# Template Metadata for documentation and organization
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Network Configuration"
        Parameters:
          - AllowedSSHIP
      - Label:
          default: "Compute Configuration"
        Parameters:
          - KeyPairName
          - InstanceType
      - Label:
          default: "Storage Configuration"
        Parameters:
          - S3BucketNameSuffix
    ParameterLabels:
      AllowedSSHIP:
        default: "Allowed SSH IP Address"
      KeyPairName:
        default: "EC2 Key Pair Name"
      InstanceType:
        default: "EC2 Instance Type"
      S3BucketNameSuffix:
        default: "S3 Bucket Name Suffix"

# Parameters for template customization
Parameters:
  AllowedSSHIP:
    Description: 'IP address allowed to SSH to the EC2 instance (e.g., 203.0.113.0/32)'
    Type: String
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid IP CIDR range of the form x.x.x.x/x'
    Default: '0.0.0.0/32'
  
  KeyPairName:
    Description: 'Name of an existing EC2 KeyPair to enable SSH access'
    Type: AWS::EC2::KeyPair::KeyName
    ConstraintDescription: 'Must be the name of an existing EC2 KeyPair'
  
  InstanceType:
    Description: 'EC2 instance type for production workload'
    Type: String
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type'
  
  S3BucketNameSuffix:
    Description: 'Suffix for S3 bucket name to ensure global uniqueness'
    Type: String
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: 'Must contain only lowercase letters, numbers, and hyphens'
    MinLength: 3
    MaxLength: 20

# Mappings for AMI selection based on region
Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55731490381
    us-west-2:
      AMI: ami-0352d5a37fb4f603f
    eu-west-1:
      AMI: ami-0f29c8402f8cce65c
    ap-southeast-1:
      AMI: ami-0e5182fad1edfaa68
    ap-northeast-1:
      AMI: ami-0992fc94ca0f1415a

Resources:
  # S3 Bucket with versioning for data protection
  ProdS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-data-${AWS::AccountId}-${S3BucketNameSuffix}'
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
          - Id: TransitionToIA
            Status: Enabled
            Transitions:
              - StorageClass: STANDARD_IA
                TransitionInDays: 30
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdS3Bucket
        - Key: ManagedBy
          Value: CloudFormation

  # S3 Bucket Policy for additional security
  ProdS3BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ProdS3Bucket
      PolicyDocument:
        Statement:
          - Sid: DenyInsecureConnections
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt ProdS3Bucket.Arn
              - !Sub '${ProdS3Bucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': false

  # IAM Role for EC2 instance with read-only S3 access
  ProdEC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'ProdEC2Role-${AWS::StackName}'
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
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: ProdS3ReadOnlyPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                  - 's3:GetObjectVersionTagging'
                  - 's3:GetObjectTagging'
                  - 's3:ListBucket'
                  - 's3:ListBucketVersions'
                  - 's3:GetBucketLocation'
                  - 's3:GetBucketVersioning'
                Resource:
                  - !GetAtt ProdS3Bucket.Arn
                  - !Sub '${ProdS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListAllMyBuckets'
                  - 's3:GetBucketLocation'
                Resource: '*'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2Role
        - Key: ManagedBy
          Value: CloudFormation

  # Instance Profile for EC2 role attachment
  ProdEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'ProdEC2InstanceProfile-${AWS::StackName}'
      Roles:
        - !Ref ProdEC2Role

  # Security Group for EC2 instance
  ProdSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'ProdSecurityGroup-${AWS::StackName}'
      GroupDescription: 'Production security group for EC2 instance with restricted SSH access'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
          Description: 'SSH access from specified IP only'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for AWS services'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdSecurityGroup
        - Key: ManagedBy
          Value: CloudFormation

  # EC2 Instance with production configuration
  ProdEC2Instance:
    Type: AWS::EC2::Instance
    DependsOn: 
      - ProdEC2InstanceProfile
      - ProdS3Bucket
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      IamInstanceProfile: !Ref ProdEC2InstanceProfile
      SecurityGroups:
        - !Ref ProdSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            DeleteOnTermination: true
      Monitoring: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash -xe
          # Update system
          yum update -y
          
          # Install AWS CLI and CloudWatch agent
          yum install -y aws-cli amazon-cloudwatch-agent
          
          # Install SSM agent for session manager access
          yum install -y amazon-ssm-agent
          systemctl enable amazon-ssm-agent
          systemctl start amazon-ssm-agent
          
          # Create working directory
          mkdir -p /opt/prod-app
          
          # Configure AWS CLI
          aws configure set region ${AWS::Region}
          
          # Test S3 access
          echo "Testing S3 read access to ${ProdS3Bucket}"
          aws s3 ls s3://${ProdS3Bucket}/ --region ${AWS::Region}
          
          # Create status file
          echo "Production EC2 instance initialized at $(date)" > /opt/prod-app/status.txt
          echo "S3 Bucket: ${ProdS3Bucket}" >> /opt/prod-app/status.txt
          echo "Instance Role: ${ProdEC2Role}" >> /opt/prod-app/status.txt
          
          # Send completion signal
          /opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource ProdEC2Instance --region ${AWS::Region}
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2Instance
        - Key: ManagedBy
          Value: CloudFormation
        - Key: Backup
          Value: Daily
    CreationPolicy:
      ResourceSignal:
        Timeout: PT10M

  # CloudWatch Alarm for EC2 instance monitoring
  ProdEC2CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'ProdEC2-HighCPU-${AWS::StackName}'
      AlarmDescription: 'Alert when CPU exceeds 80% for 5 minutes'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 1
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: InstanceId
          Value: !Ref ProdEC2Instance
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: ProdEC2CPUAlarm
        - Key: ManagedBy
          Value: CloudFormation

# Outputs for reference and integration
Outputs:
  S3BucketName:
    Description: 'Name of the production S3 bucket with versioning'
    Value: !Ref ProdS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-ProdS3Bucket'
  
  S3BucketArn:
    Description: 'ARN of the production S3 bucket'
    Value: !GetAtt ProdS3Bucket.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ProdS3BucketArn'
  
  EC2InstanceId:
    Description: 'Instance ID of the production EC2 instance'
    Value: !Ref ProdEC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2Instance'
  
  EC2InstancePublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt ProdEC2Instance.PublicIp
  
  EC2InstancePrivateIP:
    Description: 'Private IP address of the EC2 instance'
    Value: !GetAtt ProdEC2Instance.PrivateIp
  
  IAMRoleArn:
    Description: 'ARN of the IAM role for EC2 instance'
    Value: !GetAtt ProdEC2Role.Arn
    Export:
      Name: !Sub '${AWS::StackName}-ProdEC2RoleArn'
  
  SecurityGroupId:
    Description: 'Security Group ID for the EC2 instance'
    Value: !GetAtt ProdSecurityGroup.GroupId
    Export:
      Name: !Sub '${AWS::StackName}-ProdSecurityGroupId'
  
  SSHCommand:
    Description: 'SSH connection command'
    Value: !Sub 'ssh -i ~/.ssh/${KeyPairName}.pem ec2-user@${ProdEC2Instance.PublicIp}'
```

## Template Architecture Overview

This CloudFormation template implements a production-ready infrastructure with the following key components:

### **1. Storage Layer (S3)**
- **Versioning**: Enabled to maintain complete object history for disaster recovery
- **Encryption**: AES256 server-side encryption for data at rest
- **Lifecycle Policies**: Automatic transition to Infrequent Access storage class and old version cleanup
- **Public Access Block**: Prevents accidental public exposure
- **Secure Transport**: Enforces HTTPS-only connections via bucket policy

### **2. Compute Layer (EC2)**
- **Instance Configuration**: Parameterized instance type (defaulting to t3.micro)
- **Encrypted EBS Volume**: 20GB GP3 volume with encryption enabled
- **Monitoring**: Detailed CloudWatch monitoring and CPU utilization alarm
- **User Data**: Automated initialization script for AWS CLI and S3 connectivity testing
- **Session Manager**: SSM agent installation for secure, auditable access

### **3. Security & Access Management**
- **IAM Role**: Read-only S3 access following least privilege principle
- **Security Group**: Restrictive SSH access from specified IP only
- **Instance Profile**: Proper role attachment to EC2 instance
- **CloudWatch Integration**: Permissions for metrics and logs

### **4. Production Best Practices**
- **Resource Naming**: Consistent 'Prod' prefix for all resources
- **Tagging Strategy**: Uniform 'Environment: Production' tags plus additional metadata tags
- **Dependency Management**: Explicit and implicit dependencies ensure proper creation order
- **Parameter Validation**: Input constraints and patterns for security
- **Regional AMI Mapping**: Multi-region support through mappings
- **Stack Outputs**: Exportable values for cross-stack references

### **5. Operational Excellence**
- **CloudWatch Alarm**: CPU monitoring with 80% threshold alert
- **Creation Policy**: Signal-based validation of EC2 initialization
- **Metadata Organization**: Grouped parameters with descriptive labels
- **Backup Tags**: Support for automated backup policies

This template demonstrates enterprise-grade infrastructure as code, combining security, scalability, and maintainability in a single, validated CloudFormation template ready for production deployment.