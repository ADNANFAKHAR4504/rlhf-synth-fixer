
---

### ❌ `model_failure.md`

## ❌ Common Mistakes

### 1. Missing `PublicAccessBlockConfiguration` for S3 Bucket
**Impact**: Leaves S3 bucket vulnerable to public access.

### 2. Missing or Incorrect EC2 KeyName Parameter
**Impact**: Instance provisioning fails due to lack of valid KeyPair.

### 3. Hardcoded Availability Zone
**Impact**: Fails CloudFormation validation if AZ is deprecated or unavailable.

### 4. Missing Security Group Rules
**Impact**: EC2 cannot be accessed over SSH for initial login.

### 5. Missing ImageId or incorrect AMI
**Impact**: Stack fails due to invalid or region-mismatched AMI.

### 6. Missing Required Capabilities
**Impact**: AWS CLI deployment fails due to insufficient IAM permissions.

```bash
Error: Requires capabilities: [CAPABILITY_NAMED_IAM]

Below are examples of incorrect CloudFormation YAML templates and explanations of their failures:

### Example 1: Missing Public Access Block on S3

```yaml
Resources:
  SecureS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Ref S3BucketName
      # Missing PublicAccessBlockConfiguration
Incorrect AMI ID
Resources:
  MyEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      ImageId: ami-12345678 # Incorrect AMI ID
      KeyName: !Ref KeyName
Missing Security Group
Resources:
  MyEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c55b159cbfafe1f0
      KeyName: !Ref KeyName
      # Missing SecurityGroupIds
Unrestricted SSH Access
  MySecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH access via port 22
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0 # Should be restricted to a specific IP
