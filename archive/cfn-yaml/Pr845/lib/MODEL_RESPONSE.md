I'll create a secure AWS infrastructure using CloudFormation that meets all your requirements. Here are the two deliverables:

## 1. CloudFormation Template: `secure_infrastructure.yaml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure with encrypted storage, least-privilege IAM, and comprehensive logging'

Parameters:
  AllowedSSHCIDR:
    Type: String
    Description: 'CIDR block allowed for SSH access (e.g., YOUR_IP/32)'
    Default: '0.0.0.0/32'
    AllowedPattern: '^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR notation (e.g., 192.168.1.1/32)'

  UniqueId:
    Type: String
    Description: 'Unique identifier for resource naming'
    Default: !Sub '${AWS::StackName}-${AWS::AccountId}'

Resources:
  # ============================================================================
  # VPC AND NETWORKING COMPONENTS
  # ============================================================================

  SecureVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-vpc'
        - Key: Environment
          Value: 'Production'

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SecureVPC
      CidrBlock: '10.0.1.0/24'
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref SecureVPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-rt'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  SubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  # ============================================================================
  # ENCRYPTION KEY FOR S3 BUCKETS
  # ============================================================================

  S3EncryptionKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS Key for S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow S3 Service'
            Effect: Allow
            Principal:
              Service: s3.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'
          - Sid: 'Allow EC2 Instance Role'
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
            Resource: '*'

  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${AWS::StackName}-s3-encryption-key'
      TargetKeyId: !Ref S3EncryptionKey

  # ============================================================================
  # S3 BUCKETS WITH ENCRYPTION AND ACCESS LOGGING
  # ============================================================================

  # Dedicated bucket for storing S3 access logs
  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 's3-access-logs-${UniqueId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'S3 Access Logs Bucket'
        - Key: Purpose
          Value: 'Access Logging'

  # Website content bucket
  WebsiteContentBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'website-content-${UniqueId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'website-content-access-logs/'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'Website Content Bucket'
        - Key: Purpose
          Value: 'Static Content Storage'

  # Application logs bucket
  ApplicationLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'application-logs-${UniqueId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'application-logs-access-logs/'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'Application Logs Bucket'
        - Key: Purpose
          Value: 'Application Log Storage'

  # Backup data bucket
  BackupDataBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'backup-data-${UniqueId}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'backup-data-access-logs/'
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: 'Backup Data Bucket'
        - Key: Purpose
          Value: 'Backup Storage'

  # ============================================================================
  # S3 BUCKET POLICIES FOR ACCESS CONTROL
  # ============================================================================

  WebsiteContentBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref WebsiteContentBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPublicAccess'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${WebsiteContentBucket}/*'
              - !Sub '${WebsiteContentBucket}'
            Condition:
              StringNotEquals:
                'aws:PrincipalArn': !GetAtt EC2InstanceRole.Arn
          - Sid: 'AllowEC2InstanceReadAccess'
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - 's3:GetObject'
              - 's3:ListBucket'
            Resource:
              - !Sub '${WebsiteContentBucket}/*'
              - !Sub '${WebsiteContentBucket}'

  ApplicationLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyPublicAccess'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${ApplicationLogsBucket}/*'
              - !Sub '${ApplicationLogsBucket}'
            Condition:
              StringNotEquals:
                'aws:PrincipalArn': !GetAtt EC2InstanceRole.Arn
          - Sid: 'AllowEC2InstanceWriteAccess'
            Effect: Allow
            Principal:
              AWS: !GetAtt EC2InstanceRole.Arn
            Action:
              - 's3:PutObject'
              - 's3:PutObjectAcl'
              - 's3:ListBucket'
            Resource:
              - !Sub '${ApplicationLogsBucket}/*'
              - !Sub '${ApplicationLogsBucket}'

  BackupDataBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref BackupDataBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'DenyAllAccess'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub '${BackupDataBucket}/*'
              - !Sub '${BackupDataBucket}'

  # ============================================================================
  # IAM ROLE AND POLICIES FOR EC2 INSTANCE
  # ============================================================================

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-instance-role'
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
        - PolicyName: 'S3AccessPolicy'
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Sid: 'ReadWebsiteContent'
                Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${WebsiteContentBucket}/*'
                  - !Sub '${WebsiteContentBucket}'
              - Sid: 'WriteApplicationLogs'
                Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:ListBucket'
                Resource:
                  - !Sub '${ApplicationLogsBucket}/*'
                  - !Sub '${ApplicationLogsBucket}'
              - Sid: 'KMSAccess'
                Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                Resource: !GetAtt S3EncryptionKey.Arn
      Tags:
        - Key: Name
          Value: 'EC2 Instance Role'
        - Key: Purpose
          Value: 'Least Privilege S3 Access'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-ec2-instance-profile'
      Roles:
        - !Ref EC2InstanceRole

  # ============================================================================
  # SECURITY GROUP FOR EC2 INSTANCE
  # ============================================================================

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-ec2-security-group'
      GroupDescription: 'Security group for EC2 instance with restricted SSH access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from specified CIDR'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name
          Value: 'EC2 Security Group'
        - Key: Purpose
          Value: 'Restricted SSH Access'

  # ============================================================================
  # EC2 INSTANCE WITH ENCRYPTED EBS VOLUME
  # ============================================================================

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !Sub '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      InstanceType: 't2.micro'
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref EC2SecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      BlockDeviceMappings:
        - DeviceName: '/dev/xvda'
          Ebs:
            VolumeType: 'gp3'
            VolumeSize: 8
            Encrypted: true
            DeleteOnTermination: true
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli

          # Create a test script to verify S3 access
          cat > /home/ec2-user/test_s3_access.sh << 'EOF'
          #!/bin/bash
          echo "Testing S3 access..."

          # Test read access to website-content bucket
          echo "Testing read access to website-content bucket:"
          aws s3 ls s3://${WebsiteContentBucket}/ || echo "Read access test failed"

          # Test write access to application-logs bucket
          echo "Testing write access to application-logs bucket:"
          echo "Test log entry $(date)" > /tmp/test-log.txt
          aws s3 cp /tmp/test-log.txt s3://${ApplicationLogsBucket}/test-log.txt || echo "Write access test failed"

          echo "S3 access tests completed."
          EOF

          chmod +x /home/ec2-user/test_s3_access.sh
          chown ec2-user:ec2-user /home/ec2-user/test_s3_access.sh

          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
          rpm -U ./amazon-cloudwatch-agent.rpm
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-secure-ec2-instance'
        - Key: Environment
          Value: 'Production'
        - Key: Purpose
          Value: 'Web Application Server'

# ============================================================================
# OUTPUTS
# ============================================================================

Outputs:
  VPCId:
    Description: 'ID of the created VPC'
    Value: !Ref SecureVPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  EC2InstanceId:
    Description: 'ID of the created EC2 instance'
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance-ID'

  EC2PublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Public-IP'

  WebsiteContentBucket:
    Description: 'Name of the website content S3 bucket'
    Value: !Ref WebsiteContentBucket
    Export:
      Name: !Sub '${AWS::StackName}-Website-Content-Bucket'

  ApplicationLogsBucket:
    Description: 'Name of the application logs S3 bucket'
    Value: !Ref ApplicationLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-Application-Logs-Bucket'

  BackupDataBucket:
    Description: 'Name of the backup data S3 bucket'
    Value: !Ref BackupDataBucket
    Export:
      Name: !Sub '${AWS::StackName}-Backup-Data-Bucket'

  S3AccessLogsBucket:
    Description: 'Name of the S3 access logs bucket'
    Value: !Ref S3AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3-Access-Logs-Bucket'

  KMSKeyId:
    Description: 'ID of the KMS key used for S3 encryption'
    Value: !Ref S3EncryptionKey
    Export:
      Name: !Sub '${AWS::StackName}-KMS-Key-ID'

  EC2InstanceRoleArn:
    Description: 'ARN of the EC2 instance IAM role'
    Value: !GetAtt EC2InstanceRole.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2-Instance-Role-ARN'
```

## 2. README.md

````markdown
# Secure AWS Infrastructure with CloudFormation

## Overview

This CloudFormation template creates a highly secure, production-ready AWS infrastructure designed to host web applications with strong emphasis on data encryption, least-privilege access controls, and comprehensive access logging. The infrastructure follows AWS security best practices and implements defense-in-depth security principles.

## Infrastructure Purpose

The infrastructure is designed to:

- Host a web application on a secure EC2 instance with encrypted storage
- Provide segregated S3 storage for different data types (content, logs, backups)
- Implement strict access controls using IAM roles and S3 bucket policies
- Enable comprehensive access logging and monitoring
- Ensure all data is encrypted at rest using AWS KMS

## Architecture Components

### Networking Layer

- **VPC (`SecureVPC`)**: Isolated network environment with CIDR 10.0.0.0/16
- **Public Subnet (`PublicSubnet`)**: Single public subnet (10.0.1.0/24) for EC2 instance
- **Internet Gateway (`InternetGateway`)**: Provides internet access for the public subnet
- **Route Table (`PublicRouteTable`)**: Routes traffic from public subnet to internet gateway

### Compute Layer

- **EC2 Instance (`EC2Instance`)**:
  - Uses latest Amazon Linux 2 AMI (dynamically resolved via SSM parameter)
  - t2.micro instance type for cost optimization
  - **Encrypted EBS root volume** using AWS managed encryption
  - Deployed in public subnet with public IP for management access
  - Includes user data script for initial configuration and S3 access testing

### Storage Layer

- **Four S3 Buckets**:
  1. `website-content-${UniqueId}`: Stores static website content
  2. `application-logs-${UniqueId}`: Receives application log files
  3. `backup-data-${UniqueId}`: Stores backup data (no EC2 access)
  4. `s3-access-logs-${UniqueId}`: Centralized storage for S3 access logs

### Encryption and Key Management

- **KMS Key (`S3EncryptionKey`)**: Customer-managed KMS key for S3 bucket encryption
- **KMS Key Alias (`S3EncryptionKeyAlias`)**: User-friendly alias for the encryption key
- All S3 buckets use server-side encryption with the custom KMS key
- EBS volume encryption enabled by default

### Identity and Access Management

- **EC2 Instance Role (`EC2InstanceRole`)**: Implements least-privilege access principle
- **Instance Profile (`EC2InstanceProfile`)**: Attaches IAM role to EC2 instance
- **S3 Bucket Policies**: Explicit access control for each bucket

### Security Controls

- **Security Group (`EC2SecurityGroup`)**: Restricts inbound access to SSH (port 22) from specified CIDR only
- **Public Access Block**: Enabled on all S3 buckets to prevent accidental public exposure
- **S3 Access Logging**: Enabled on all data buckets, logs stored in dedicated bucket

## Security Design Choices

### 1. Encryption at Rest

- **EBS Encryption**: The EC2 instance's root volume has encryption enabled through the `BlockDeviceMappings` property with `Encrypted: true`
- **S3 Encryption**: All buckets use server-side encryption with a customer-managed KMS key, providing better control over encryption keys than AWS-managed keys
- **KMS Key Policy**: Restricts key usage to specific principals (root account, S3 service, EC2 instance role)

### 2. Least Privilege Access

- **EC2 Instance Role**: The `EC2InstanceRole` grants only the minimum permissions required:
  - Read-only access to `website-content` bucket (`s3:GetObject`, `s3:ListBucket`)
  - Write access to `application-logs` bucket (`s3:PutObject`, `s3:PutObjectAcl`, `s3:ListBucket`)
  - KMS decrypt/encrypt permissions for the S3 encryption key
  - No access to `backup-data` bucket
- **S3 Bucket Policies**: Each bucket has explicit policies that:
  - Deny all public access
  - Allow access only from the specific EC2 instance role
  - Use condition statements to enforce role-based access

### 3. Network Security

- **Security Group**: The `EC2SecurityGroup` implements a restrictive inbound rule allowing SSH access only from a specified CIDR block (parameterized for flexibility)
- **VPC Isolation**: Resources are deployed in a dedicated VPC, providing network-level isolation

### 4. Access Logging and Monitoring

- **S3 Access Logging**: All three data buckets (`website-content`, `application-logs`, `backup-data`) have access logging enabled, with logs stored in the dedicated `s3-access-logs` bucket
- **CloudWatch Integration**: EC2 instance role includes `CloudWatchAgentServerPolicy` for monitoring capabilities

## CloudFormation Template Structure

### Resource Fulfillment Breakdown

1. **VPC Requirement**:
   - Fulfilled by `SecureVPC` resource with associated networking components (`PublicSubnet`, `InternetGateway`, `PublicRouteTable`)

2. **EC2 Instance Requirement**:
   - Fulfilled by `EC2Instance` resource using latest Amazon Linux 2 AMI (resolved via SSM parameter `{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}`)
   - Instance type set to `t2.micro`
   - Encrypted EBS volume configured in `BlockDeviceMappings` with `Encrypted: true`

3. **S3 Buckets Requirement**:
   - Three data buckets: `WebsiteContentBucket`, `ApplicationLogsBucket`, `BackupDataBucket`
   - Additional `S3AccessLogsBucket` for centralized access logging
   - All buckets have KMS encryption enabled via `BucketEncryption` property

4. **IAM Role Requirement**:
   - `EC2InstanceRole` implements least privilege with specific S3 permissions
   - Attached to EC2 instance via `EC2InstanceProfile`
   - Role ARN referenced in S3 bucket policies for explicit access control

5. **Security Group Requirement**:
   - `EC2SecurityGroup` allows SSH (port 22) from parameterized CIDR block
   - Attached to EC2 instance via `SecurityGroupIds` property

6. **Encryption Enforcement**:
   - EBS encryption: `Encrypted: true` in EC2 instance's block device mapping
   - S3 encryption: `ServerSideEncryptionConfiguration` with KMS key in all buckets

7. **Access Controls**:
   - S3 bucket policies (`WebsiteContentBucketPolicy`, `ApplicationLogsBucketPolicy`, `BackupDataBucketPolicy`) explicitly allow only the EC2 instance role
   - `PublicAccessBlockConfiguration` prevents public access on all buckets

## Deployment Instructions

### Prerequisites

- AWS CLI configured with appropriate permissions
- Valid CIDR block for SSH access (your public IP/32)

### Deployment Steps

1. **Clone or download the template**:
   ```bash
   # Save the template as secure_infrastructure.yaml
   ```
````

2. **Deploy the stack**:

   ```bash
   aws cloudformation create-stack \
     --stack-name secure-infrastructure \
     --template-body file://secure_infrastructure.yaml \
     --parameters ParameterKey=AllowedSSHCIDR,ParameterValue=YOUR_PUBLIC_IP/32 \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Monitor deployment**:

   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-infrastructure \
     --region us-east-1 \
     --query 'Stacks[0].StackStatus'
   ```

4. **Retrieve outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name secure-infrastructure \
     --region us-east-1 \
     --query 'Stacks[0].Outputs'
   ```

## Validation and Testing

### 1. Verify EBS Encryption

```bash
# Get the EC2 instance ID from stack outputs
INSTANCE_ID=$(aws cloudformation describe-stacks --stack-name secure-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`EC2InstanceId`].OutputValue' --output text)

# Check EBS volume encryption
aws ec2 describe-volumes \
  --filters "Name=attachment.instance-id,Values=$INSTANCE_ID" \
  --query 'Volumes[0].Encrypted'
```

### 2. Verify S3 Bucket Encryption

```bash
# Check encryption configuration for website content bucket
BUCKET_NAME=$(aws cloudformation describe-stacks --stack-name secure-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`WebsiteContentBucket`].OutputValue' --output text)

aws s3api get-bucket-encryption --bucket $BUCKET_NAME
```

### 3. Test S3 Access from EC2 Instance

```bash
# SSH to the EC2 instance
EC2_IP=$(aws cloudformation describe-stacks --stack-name secure-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`EC2PublicIP`].OutputValue' --output text)

ssh -i your-key.pem ec2-user@$EC2_IP

# Run the pre-installed test script
./test_s3_access.sh
```

### 4. Verify S3 Access Logging

```bash
# Check if access logs are being generated (may take a few hours)
LOGS_BUCKET=$(aws cloudformation describe-stacks --stack-name secure-infrastructure --query 'Stacks[0].Outputs[?OutputKey==`S3AccessLogsBucket`].OutputValue' --output text)

aws s3 ls s3://$LOGS_BUCKET/ --recursive
```

### 5. Test Security Group Restrictions

```bash
# This should fail from an unauthorized IP
ssh -i your-key.pem ec2-user@$EC2_IP
# Connection should be refused if not from allowed CIDR
```

### 6. Verify IAM Role Permissions

```bash
# From the EC2 instance, test unauthorized access (should fail)
aws s3 ls s3://backup-data-bucket-name/
# This should return an access denied error
```

## Security Validation Checklist

- [ ] EBS volume is encrypted
- [ ] All S3 buckets have encryption enabled with KMS
- [ ] S3 buckets block public access
- [ ] EC2 instance can read from website-content bucket
- [ ] EC2 instance can write to application-logs bucket
- [ ] EC2 instance cannot access backup-data bucket
- [ ] SSH access restricted to specified CIDR only
- [ ] S3 access logs are being generated
- [ ] IAM role follows least privilege principle
- [ ] KMS key policy restricts access appropriately

## Cleanup

To avoid ongoing charges, delete the stack when no longer needed:

```bash
aws cloudformation delete-stack \
  --stack-name secure-infrastructure \
  --region us-east-1
```

**Note**: S3 buckets with content may need to be emptied manually before stack deletion.

## Cost Considerations

This infrastructure uses cost-optimized resources:

- t2.micro EC2 instance (eligible for free tier)
- GP3 EBS volume (8GB)
- S3 Standard storage class
- Customer-managed KMS key (charges apply for key usage)

Estimated monthly cost: $10-20 USD (excluding free tier benefits)

## Support and Troubleshooting

Common issues and solutions:

1. **Stack creation fails**: Check IAM permissions and parameter values
2. **SSH connection refused**: Verify security group CIDR parameter
3. **S3 access denied**: Check IAM role policies and bucket policies
4. **Encryption verification fails**: Ensure KMS key permissions are correct

For additional support, review AWS CloudFormation events and CloudTrail logs for detailed error information.

```

This comprehensive solution provides a production-ready, secure AWS infrastructure that meets all your specified requirements. The CloudFormation template includes detailed comments explaining each component, and the README provides thorough documentation of the security design choices and validation procedures.
```
