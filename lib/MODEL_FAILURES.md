# Model Failures - AWS CloudFormation Secure Infrastructure

## Common Implementation Mistakes

### 1. IAM Role and Policy Failures

#### Overly Permissive IAM Policies
```yaml
# ❌ FAILURE: Too broad permissions
S3ReadOnlyPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyDocument:
      Statement:
        - Effect: Allow
          Action: 's3:*'  # Too broad!
          Resource: '*'
```

```yaml
# ❌ FAILURE: Wildcard resources
S3ReadOnlyPolicy:
  Type: AWS::IAM::Policy
  Properties:
    PolicyDocument:
      Statement:
        - Effect: Allow
          Action: ['s3:GetObject', 's3:ListBucket']
          Resource: 'arn:aws:s3:::*'  # Too broad!
```

#### Missing Trust Policy
```yaml
# ❌ FAILURE: No assume role policy
S3ReadOnlyRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: 'my-app-Role-ReadS3'
    # Missing AssumeRolePolicyDocument!
```

#### Incorrect Service Principal
```yaml
# ❌ FAILURE: Wrong service principal
S3ReadOnlyRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Statement:
        - Effect: Allow
          Principal:
            Service: 'lambda.amazonaws.com'  # Wrong if using EC2!
          Action: sts:AssumeRole
```

### 2. CloudTrail Configuration Failures

#### Single Region Trail
```yaml
# ❌ FAILURE: Not multi-region
CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    TrailName: 'my-app-cloudtrail'
    IsMultiRegionTrail: false  # Should be true for compliance
    IncludeGlobalServiceEvents: false  # Should be true
```

#### Missing Logging Configuration
```yaml
# ❌ FAILURE: No logging enabled
CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    TrailName: 'my-app-cloudtrail'
    IsMultiRegionTrail: true
    # Missing IsLogging: true
    # Missing S3BucketName
```

#### Insecure CloudTrail Log Bucket
```yaml
# ❌ FAILURE: No encryption on CloudTrail logs
CloudTrailLogsBucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: 'my-app-cloudtrail-logs'
    # Missing BucketEncryption configuration
    # Missing PublicAccessBlockConfiguration
```

### 3. S3 Bucket Security Failures

#### No Encryption Configuration
```yaml
# ❌ FAILURE: S3 bucket without encryption
AppS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    BucketName: 'my-app-bucket'
    # Missing BucketEncryption
    # Missing PublicAccessBlockConfiguration
```

#### Public Access Allowed
```yaml
# ❌ FAILURE: Public access not blocked
AppS3Bucket:
  Type: AWS::S3::Bucket
  Properties:
    PublicAccessBlockConfiguration:
      BlockPublicAcls: false  # Should be true
      BlockPublicPolicy: false  # Should be true
      IgnorePublicAcls: false  # Should be true
      RestrictPublicBuckets: false  # Should be true
```

#### Missing TLS Enforcement
```yaml
# ❌ FAILURE: No TLS requirement
AppS3BucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    PolicyDocument:
      Statement:
        # Missing DenyNonSSLRequests statement
```

### 4. VPC and Subnet Failures

#### Single Subnet Deployment
```yaml
# ❌ FAILURE: Only one subnet
SubnetA:
  Type: AWS::EC2::Subnet
  Properties:
    VpcId: !Ref ExistingVPCId
    AvailabilityZone: us-east-1a
    CidrBlock: '10.0.1.0/24'
# Missing SubnetB - violates redundancy requirement
```

#### Overlapping CIDR Blocks
```yaml
# ❌ FAILURE: Overlapping subnets
SubnetA:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: '10.0.1.0/24'
SubnetB:
  Type: AWS::EC2::Subnet
  Properties:
    CidrBlock: '10.0.1.128/25'  # Overlaps with SubnetA!
```

#### Same Availability Zone
```yaml
# ❌ FAILURE: Both subnets in same AZ
SubnetA:
  Type: AWS::EC2::Subnet
  Properties:
    AvailabilityZone: us-east-1a
SubnetB:
  Type: AWS::EC2::Subnet
  Properties:
    AvailabilityZone: us-east-1a  # Should be different AZ!
```

### 5. KMS Key Configuration Failures

#### Missing Key Policy
```yaml
# ❌ FAILURE: No key policy defined
S3KMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: 'KMS key for S3 bucket encryption'
    # Missing KeyPolicy - will fail deployment
```

#### Insufficient Key Permissions
```yaml
# ❌ FAILURE: Key policy doesn't allow S3 to use key
S3KMSKey:
  Type: AWS::KMS::Key
  Properties:
    KeyPolicy:
      Statement:
        - Sid: 'Enable IAM User Permissions'
          Effect: Allow
          Principal:
            AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
          Action: 'kms:*'
          Resource: '*'
        # Missing statement allowing S3 service to use the key
```

#### Key Rotation Disabled
```yaml
# ❌ FAILURE: Key rotation not enabled
S3KMSKey:
  Type: AWS::KMS::Key
  Properties:
    EnableKeyRotation: false  # Should be true for security
```

### 6. EC2 Monitoring Failures

#### Detailed Monitoring Disabled
```yaml
# ❌ FAILURE: Basic monitoring only
SampleEC2Instance:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: ami-0c02fb55956c7d316
    InstanceType: t3.micro
    Monitoring: false  # Should be true for detailed monitoring
```

#### Missing IAM Role Attachment
```yaml
# ❌ FAILURE: EC2 instance without IAM role
SampleEC2Instance:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: ami-0c02fb55956c7d316
    InstanceType: t3.micro
    # Missing IamInstanceProfile
```

### 7. Naming Convention Failures

#### Incorrect Resource Names
```yaml
# ❌ FAILURE: Not following my-app-* convention
S3ReadOnlyRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: 'ReadS3Role'  # Should be 'my-app-Role-ReadS3'

CloudTrail:
  Type: AWS::CloudTrail::Trail
  Properties:
    TrailName: 'cloudtrail'  # Should be 'my-app-cloudtrail'
```

### 8. Parameter and Condition Failures

#### Missing Required Parameters
```yaml
# ❌ FAILURE: No VPC parameter
Parameters:
  # Missing ExistingVPCId parameter
  AvailabilityZones:
    Type: List<AWS::EC2::AvailabilityZone::Name>
```

#### Incorrect Condition Logic
```yaml
# ❌ FAILURE: Wrong condition
Conditions:
  CreateS3BucketCondition: !Equals [!Ref CreateS3Bucket, 'yes']  # Should be 'true'
```

### 9. Security Group Failures

#### Overly Permissive Security Group
```yaml
# ❌ FAILURE: Too open security group
EC2SecurityGroup:
  Type: AWS::EC2::SecurityGroup
  Properties:
    SecurityGroupIngress:
      - IpProtocol: -1  # All protocols
        FromPort: -1    # All ports
        ToPort: -1      # All ports
        CidrIp: 0.0.0.0/0  # All IPs
```

#### Missing Security Group
```yaml
# ❌ FAILURE: EC2 instance without security group
SampleEC2Instance:
  Type: AWS::EC2::Instance
  Properties:
    ImageId: ami-0c02fb55956c7d316
    InstanceType: t3.micro
    # Missing SecurityGroupIds
```

### 10. Output and Export Failures

#### Missing Critical Outputs
```yaml
# ❌ FAILURE: No outputs for validation
Outputs:
  # Missing IAMRoleArn, S3BucketName, CloudTrailName, etc.
```

#### Incorrect Export Names
```yaml
# ❌ FAILURE: Export name conflicts
Outputs:
  IAMRoleArn:
    Export:
      Name: 'IAMRoleArn'  # Should include stack name to avoid conflicts
```

## Common Deployment Failures

### 1. Permission Issues
```bash
# ❌ FAILURE: Missing IAM capabilities
aws cloudformation deploy --template-file template.yaml --stack-name my-app-secure-infra
# Missing --capabilities CAPABILITY_NAMED_IAM
```

### 2. Resource Dependency Issues
```yaml
# ❌ FAILURE: Missing DependsOn
CloudTrailLogsBucketPolicy:
  Type: AWS::S3::BucketPolicy
  Properties:
    Bucket: !Ref CloudTrailLogsBucket
    # Missing DependsOn: CloudTrailLogsBucket
```

### 3. Template Validation Errors
```yaml
# ❌ FAILURE: Invalid YAML syntax
Resources:
  S3KMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow  # Missing Sid, Principal, Action, Resource
```

## Security Vulnerabilities

### 1. Data Exposure Risks
- S3 buckets without encryption
- CloudTrail logs without encryption
- Public access to resources
- Unencrypted data in transit

### 2. Privilege Escalation Risks
- Overly permissive IAM policies
- Missing resource-level restrictions
- Broad service principals in trust policies

### 3. Compliance Violations
- Single-region CloudTrail
- Missing global service events
- No detailed EC2 monitoring
- Insufficient audit logging

## Testing and Validation Failures

### 1. Incomplete Validation
```bash
# ❌ FAILURE: Not testing all requirements
aws iam get-role --role-name my-app-Role-ReadS3
# Missing validation of CloudTrail, S3 encryption, subnets, monitoring
```

### 2. Incorrect Test Commands
```bash
# ❌ FAILURE: Wrong bucket name in test
aws s3 ls s3://wrong-bucket-name/
# Should test with actual bucket name from outputs
```

### 3. Missing Error Handling
```bash
# ❌ FAILURE: No error checking
aws cloudformation deploy --template-file template.yaml
# Should check exit codes and handle failures
```

## Best Practices Violations

### 1. Hardcoded Values
```yaml
# ❌ FAILURE: Hardcoded ARNs
S3ReadOnlyPolicy:
  Properties:
    PolicyDocument:
      Statement:
        - Resource: 'arn:aws:s3:::hardcoded-bucket-name'
# Should use !Sub and parameters
```

### 2. Missing Tags
```yaml
# ❌ FAILURE: Resources without tags
S3KMSKey:
  Type: AWS::KMS::Key
  Properties:
    Description: 'KMS key for S3 bucket encryption'
    # Missing Tags for resource management
```

### 3. No Documentation
```yaml
# ❌ FAILURE: No comments or descriptions
S3ReadOnlyRole:
  Type: AWS::IAM::Role
  Properties:
    RoleName: 'my-app-Role-ReadS3'
    # Missing comments explaining purpose and permissions
```

## Recovery and Mitigation

### 1. Immediate Actions
- Review CloudTrail logs for unauthorized access
- Check S3 bucket access logs
- Verify IAM role permissions
- Test encryption configurations

### 2. Remediation Steps
- Update IAM policies to follow least privilege
- Enable encryption on all S3 buckets
- Configure multi-region CloudTrail
- Implement proper security groups

### 3. Prevention Measures
- Use AWS Config rules for compliance monitoring
- Implement automated security scanning
- Regular security audits and penetration testing
- Continuous monitoring and alerting
