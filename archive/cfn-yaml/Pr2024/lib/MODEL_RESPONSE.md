# Security Configuration as Code - CloudFormation YAML Solution

## Task Overview
This CloudFormation template creates a comprehensive secure AWS infrastructure following security best practices. The solution implements a robust security framework with restrictive access controls, encryption at rest and in transit, network isolation, and advanced threat monitoring.

## Solution Architecture

### Network Security
- **VPC with isolated subnets**: Public subnets for internet-facing resources and private subnets for sensitive resources
- **Security Groups**: Restrictive ingress/egress rules following least privilege principles
- **Network ACLs**: Additional layer of network security

### Encryption and Data Protection
- **S3 Server-Side Encryption**: All S3 buckets encrypted using AES256 with bucket key optimization
- **RDS Encryption**: Database storage encrypted at rest
- **SNS Encryption**: Security alerts encrypted using AWS managed KMS keys

### Access Control and Identity
- **IAM Roles**: Least privilege roles for EC2 instances with minimal required permissions
- **Instance Profiles**: Secure attachment of IAM roles to EC2 instances
- **MFA and Session Management**: Integration with AWS Systems Manager for secure access

### Monitoring and Compliance
- **GuardDuty**: AI/ML-powered threat detection with latest 2025 features
- **AWS Config**: Configuration monitoring and compliance rules
- **CloudWatch Logs**: Centralized logging for security events
- **SNS Notifications**: Real-time security alerts

## Key Security Features Implemented

### 1. EC2 Security Groups
```yaml
# EC2 Security Group with restrictive SSH access
EC2SecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: 'Security group for EC2 instances - SSH access from trusted CIDR only'
    SecurityGroupIngress:
      - IpProtocol: tcp
        FromPort: 22
        ToPort: 22
        CidrIp: !Ref TrustedCidrBlock
        Description: 'SSH access from trusted CIDR block'
```

### 2. S3 Bucket Encryption and Policies
```yaml
# S3 Bucket with comprehensive security configuration
SecureS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
          BucketKeyEnabled: true
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    VersioningConfiguration:
      Status: Enabled
```

### 3. RDS Private Subnet Deployment
```yaml
# RDS Instance in private subnet with encryption
RDSInstance:
  Type: AWS::RDS::DBInstance
  Properties:
    StorageEncrypted: true
    PubliclyAccessible: false
    VPCSecurityGroups:
      - !Ref RDSSecurityGroup
    DBSubnetGroupName: !Ref DBSubnetGroup
    EnablePerformanceInsights: true
    DeletionProtection: true
```

### 4. IAM Roles with Least Privilege
```yaml
# EC2 Role with minimal permissions
EC2Role:
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
      - PolicyName: S3ReadOnlyAccess
        PolicyDocument:
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:ListBucket
              Resource:
                - !Sub '${SecureS3Bucket}/*'
                - !Ref SecureS3Bucket
```

### 5. SNS Topic for Security Alerts
```yaml
# SNS Topic for security compliance alerts
SecurityAlertsTopic:
  Type: AWS::SNS::Topic
  Properties:
    TopicName: !Sub '${AWS::StackName}-SecurityAlerts'
    DisplayName: 'Security Compliance Alerts'
    KmsMasterKeyId: alias/aws/sns
```

## Latest AWS Security Features (2025)

### 1. GuardDuty Enhanced Detection
- **S3 Malware Protection**: Automatic scanning of uploaded objects
- **EKS Audit Logs**: Kubernetes security monitoring
- **RDS Login Events**: Database access monitoring
- **Lambda Network Logs**: Serverless security monitoring
- **EBS Malware Protection**: Runtime threat detection

### 2. AWS Config Advanced Rules
- **S3 Encryption Compliance**: Automated checking of bucket encryption
- **Security Group Compliance**: Monitoring of SSH access restrictions  
- **RDS Encryption Compliance**: Database storage encryption validation

## Security Compliance Features

### Encryption at Rest
- All S3 buckets use AES256 encryption
- RDS storage encryption enabled
- EBS volumes encrypted (when EC2 instances are deployed)

### Encryption in Transit
- S3 bucket policies deny non-HTTPS requests
- RDS connections use SSL/TLS
- SNS topics use KMS encryption

### Access Control
- Security groups deny all traffic except explicitly allowed
- IAM roles follow least privilege principle
- S3 bucket policies prevent public access

### Monitoring and Alerting
- GuardDuty monitors for threats across multiple data sources
- Config rules monitor compliance violations
- SNS alerts notify of security events
- CloudWatch logs retain security events for 365 days

## Infrastructure Components

### Network Infrastructure
- **VPC**: 10.0.0.0/16 CIDR block
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24 (Multi-AZ)
- **Private Subnets**: 10.0.3.0/24, 10.0.4.0/24 (Multi-AZ)
- **Internet Gateway**: For public subnet internet access
- **Route Tables**: Separate routing for public and private subnets

### Security Components
- **Security Groups**: Restrictive network access controls
- **IAM Roles**: Service-specific roles with minimal permissions
- **Bucket Policies**: Enforce encryption and secure transport
- **GuardDuty Detector**: AI/ML threat detection
- **Config Rules**: Compliance monitoring

### Data Storage
- **Primary S3 Bucket**: Encrypted, versioned, private
- **Logging S3 Bucket**: For access logs with lifecycle policies
- **Config S3 Bucket**: For configuration snapshots
- **RDS MySQL**: Encrypted, private, multi-AZ available

### Monitoring and Alerting
- **SNS Topic**: Security alert notifications
- **CloudWatch Log Group**: Centralized security logging
- **GuardDuty**: Threat detection and monitoring
- **Config**: Configuration compliance monitoring

## Deployment Parameters

The template accepts the following parameters for customization:

- **TrustedCidrBlock**: CIDR block for SSH access (default: 10.0.0.0/8)
- **DBUsername**: Database administrator username
- **DBPassword**: Database administrator password (NoEcho)
- **NotificationEmail**: Email address for security alerts

## Security Best Practices Implemented

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege Access**: Minimal required permissions for all resources
3. **Encryption Everywhere**: Data encrypted at rest and in transit
4. **Network Isolation**: Private subnets for sensitive resources
5. **Continuous Monitoring**: Real-time threat detection and compliance monitoring
6. **Incident Response**: Automated alerting for security events
7. **Audit Trail**: Comprehensive logging and configuration tracking

## Compliance and Governance

The template includes AWS Config rules to monitor compliance with:
- S3 bucket encryption requirements
- Security group SSH access restrictions
- RDS storage encryption requirements

## Cost Optimization

- **S3 Intelligent Tiering**: Automatic cost optimization for infrequently accessed data
- **RDS t3.micro**: Right-sized instance for development/testing
- **GuardDuty**: Pay-as-you-go threat detection
- **S3 Lifecycle Policies**: Automatic deletion of old logs

This solution provides a comprehensive, secure, and compliant AWS infrastructure foundation that can be extended based on specific application requirements while maintaining strong security postures.

## File Structure

The solution consists of a single CloudFormation YAML template:

```
lib/TapStack.yml - Complete CloudFormation template with all security configurations
```

This template can be deployed using AWS CloudFormation console, CLI, or CI/CD pipelines, and includes all necessary resources for a secure AWS infrastructure deployment.