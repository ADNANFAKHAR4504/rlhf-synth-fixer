# Secure AWS Infrastructure for Financial Application - CloudFormation Template

## Overview
This CloudFormation template creates a secure, highly available AWS infrastructure for a financial application with emphasis on encryption, security controls, and fault tolerance.

## Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure for financial application with high availability, encryption, and strict security controls'

Parameters:
  EnvironmentSuffix:
    Description: Environment suffix for resource naming
    Type: String
    Default: dev
  EnvironmentName:
    Description: Environment name prefix for resources
    Type: String
    Default: FinApp-Prod
  InstanceType:
    Description: EC2 instance type
    Type: String
    Default: t3.medium
    AllowedValues: [t3.small, t3.medium, t3.large, m5.large, m5.xlarge]
  SSHLocation:
    Description: IP address range for SSH access
    Type: String
    Default: 10.0.0.0/8
    AllowedPattern: (\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c02fb55956c7d316
    us-west-1:
      AMI: ami-011996ff98de391d1
    us-west-2:
      AMI: ami-0c2d06d50ce30b442
    eu-west-1:
      AMI: ami-0d71ea30463e0ff8d
```

## Key Components

### 1. Network Architecture
- **VPC**: 10.0.0.0/16 CIDR block with DNS support enabled
- **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) across different AZs
- **Private Subnets**: Two subnets (10.0.11.0/24, 10.0.12.0/24) across different AZs
- **NAT Gateways**: Two NAT Gateways for high availability, one per AZ
- **Internet Gateway**: For public subnet internet access
- **Route Tables**: Separate route tables for public and private subnets

### 2. Security Components

#### KMS Encryption
```yaml
FinAppKMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: KMS Key for Financial Application encryption
    KeyPolicy:
      Statement:
        - Sid: Enable IAM User Permissions
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: 'kms:*'
          Resource: '*'
```

#### Security Groups
- **LoadBalancer Security Group**: Allows HTTP (80) and HTTPS (443) from internet
- **WebServer Security Group**: Allows HTTP from Load Balancer, SSH from Bastion
- **Bastion Security Group**: Allows SSH from specified IP range

Security group rules are created separately to avoid circular dependencies:
```yaml
LoadBalancerToWebServerEgress:
  Type: AWS::EC2::SecurityGroupEgress
  Properties:
    GroupId: !Ref LoadBalancerSecurityGroup
    IpProtocol: tcp
    FromPort: 80
    ToPort: 80
    DestinationSecurityGroupId: !Ref WebServerSecurityGroup
```

### 3. Storage with Encryption

#### Application Data Bucket
```yaml
ApplicationDataBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: !Sub 'finapp-${EnvironmentSuffix}-app-data-${AWS::AccountId}'
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: aws:kms
            KMSMasterKeyID: !Ref FinAppKMSKey
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: true
      RestrictPublicBuckets: true
    VersioningConfiguration:
      Status: Enabled
```

#### Bucket Policy Enforcing TLS
```yaml
ApplicationDataBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref ApplicationDataBucket
    PolicyDocument:
      Statement:
        - Sid: DenyInsecureConnections
          Effect: Deny
          Principal: '*'
          Action: 's3:*'
          Resource:
            - !Sub '${ApplicationDataBucket}/*'
            - !Ref ApplicationDataBucket
          Condition:
            Bool:
              'aws:SecureTransport': 'false'
```

### 4. Compute Layer

#### Launch Template
```yaml
LaunchTemplate:
  Type: AWS::EC2::LaunchTemplate
  Properties:
    LaunchTemplateName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-LaunchTemplate'
    LaunchTemplateData:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      IamInstanceProfile:
        Arn: !GetAtt EC2InstanceProfile.Arn
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      BlockDeviceMappings:
        - DeviceName: /dev/xvda
          Ebs:
            VolumeType: gp3
            VolumeSize: 20
            Encrypted: true
            KmsKeyId: !Ref FinAppKMSKey
```

#### Auto Scaling Group
```yaml
AutoScalingGroup:
  Type: AWS::AutoScaling::AutoScalingGroup
  Properties:
    AutoScalingGroupName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-ASG'
    LaunchTemplate:
      LaunchTemplateId: !Ref LaunchTemplate
      Version: !GetAtt LaunchTemplate.LatestVersionNumber
    MinSize: 2
    MaxSize: 6
    DesiredCapacity: 2
    VPCZoneIdentifier:
      - !Ref PrivateSubnet1
      - !Ref PrivateSubnet2
    TargetGroupARNs:
      - !Ref TargetGroup
    HealthCheckType: ELB
    HealthCheckGracePeriod: 300
```

### 5. Load Balancing

#### Application Load Balancer
```yaml
ApplicationLoadBalancer:
  Type: AWS::ElasticLoadBalancingV2::LoadBalancer
  Properties:
    Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-ALB'
    Scheme: internet-facing
    Type: application
    SecurityGroups:
      - !Ref LoadBalancerSecurityGroup
    Subnets:
      - !Ref PublicSubnet1
      - !Ref PublicSubnet2
```

### 6. IAM Roles and Policies

#### EC2 Instance Role
```yaml
EC2InstanceRole:
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
      - PolicyName: S3AccessPolicy
        PolicyDocument:
          Version: '2012-10-17'
          Statement:
            - Effect: Allow
              Action:
                - s3:GetObject
                - s3:PutObject
                - s3:DeleteObject
              Resource: !Sub '${ApplicationDataBucket}/*'
            - Effect: Allow
              Action:
                - s3:ListBucket
              Resource: !Ref ApplicationDataBucket
            - Effect: Allow
              Action:
                - kms:Decrypt
                - kms:GenerateDataKey
              Resource: !GetAtt FinAppKMSKey.Arn
```

### 7. Monitoring and Scaling

#### CloudWatch Alarms
```yaml
CPUAlarmHigh:
  Type: AWS::CloudWatch::Alarm
  Properties:
    AlarmName: !Sub '${EnvironmentName}-${EnvironmentSuffix}-CPU-High'
    AlarmDescription: Alarm when CPU exceeds 70%
    MetricName: CPUUtilization
    Namespace: AWS/EC2
    Statistic: Average
    Period: 300
    EvaluationPeriods: 2
    Threshold: 70
    ComparisonOperator: GreaterThanThreshold
    AlarmActions:
      - !Ref ScaleUpPolicy
```

## Security Best Practices Implemented

1. **Encryption at Rest**:
   - KMS encryption for S3 buckets
   - EBS volume encryption using KMS
   - Versioning enabled on application data bucket

2. **Encryption in Transit**:
   - S3 bucket policies enforce TLS for all data transfers
   - Security groups restrict traffic to necessary ports only

3. **Network Security**:
   - Private subnets for EC2 instances
   - NAT Gateways for outbound internet access
   - Bastion host for secure SSH access
   - Security groups follow least privilege principle

4. **IAM Security**:
   - Instance roles instead of hardcoded credentials
   - Least privilege IAM policies
   - Separate policies for different access patterns

5. **High Availability**:
   - Multi-AZ deployment across 2 availability zones
   - Auto Scaling Group with minimum 2 instances
   - Redundant NAT Gateways
   - Application Load Balancer distributing traffic

6. **Resource Management**:
   - All resources use EnvironmentSuffix for isolation
   - No retention policies (all resources deletable)
   - Proper tagging for resource identification
   - CloudWatch monitoring and auto-scaling

## Outputs

```yaml
Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-VPC-ID'
  
  LoadBalancerURL:
    Description: URL of the Application Load Balancer
    Value: !Sub 'http://${ApplicationLoadBalancer.DNSName}'
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-ALB-URL'
  
  ApplicationDataBucket:
    Description: S3 bucket for application data
    Value: !Ref ApplicationDataBucket
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-App-Data-Bucket'
  
  LoggingBucket:
    Description: S3 bucket for logs
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-Logs-Bucket'
  
  KMSKeyId:
    Description: KMS Key ID for encryption
    Value: !Ref FinAppKMSKey
    Export:
      Name: !Sub '${EnvironmentName}-${EnvironmentSuffix}-KMS-Key'
```

## Deployment Instructions

1. Save the template as `TapStack.yml`
2. Convert to JSON if needed: `cfn-flip lib/TapStack.yml > lib/TapStack.json`
3. Deploy using AWS CLI:
```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX}
```

## Testing

The solution includes comprehensive unit and integration tests:
- **Unit Tests**: Validate template structure, parameters, resources, and security configurations
- **Integration Tests**: Verify deployed resources, connectivity, encryption, and high availability

## Key Improvements

1. **Removed KeyPairName requirement**: Made optional to allow deployment without pre-existing key pairs
2. **Added AMI mappings**: Support for multiple regions with appropriate AMIs
3. **Fixed circular dependencies**: Separated security group rules to avoid circular references
4. **Enhanced naming conventions**: All resources include EnvironmentSuffix for proper isolation
5. **Improved S3 bucket names**: Use lowercase and account ID to ensure uniqueness
6. **Added lifecycle policies**: Automatic log rotation and archival
7. **Comprehensive monitoring**: CloudWatch alarms and logging configuration
8. **Bastion host**: Secure access to private instances
9. **Auto-scaling policies**: Dynamic scaling based on CPU utilization
10. **Complete test coverage**: Unit and integration tests for all components