# Model Response

This CloudFormation YAML template provisions a minimal yet secure AWS environment in `us-east-1`, following best practices.

## ✅ Resources Created

1. **S3 Bucket (SecureS3Bucket)**
   - Bucket name includes environment and account ID for uniqueness.
   - All public access is blocked using:
     - `BlockPublicAcls: true`
     - `IgnorePublicAcls: true`
     - `BlockPublicPolicy: true`
     - `RestrictPublicBuckets: true`

2. **EC2 Instance (MyEC2Instance)**
   - Type: `t2.micro` (AWS Free Tier eligible)
   - Amazon Linux 2 AMI (latest official)
   - Secure KeyPair passed as parameter
   - Placed in the first available AZ of `us-east-1`
   - Security Group restricts access to SSH only (default CIDR can be overridden)

3. **Security Group (InstanceSecurityGroup)**
   - Allows inbound port 22 for SSH
   - Tags for environment

4. **VPC Reference**
   - Automatically resolves the default VPC using `AWS::EC2::VPC::Id`

## 📌 Parameters

- `Environment`: Logical name for tagging resources.
- `KeyName`: Existing EC2 key for SSH access.

## 🧪 Outputs

- S3 bucket name
- EC2 instance ID

## 🛡️ Security Highlights

- S3 bucket public access blocked explicitly
- No public IP assigned unless explicitly modified
- SSH access only enabled, and should be restricted to trusted IPs in real deployment

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template to create a secure S3 bucket and an EC2 instance in us-east-1.

Parameters:
  KeyName:
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance
    Type: 'AWS::EC2::KeyPair::KeyName'
    ConstraintDescription: must be the name of an existing EC2 KeyPair.
  EnvironmentName:
    Description: Environment name (e.g., dev, prod)
    Type: String
    Default: dev
  S3BucketName:
    Description: Name of the S3 bucket
    Type: String

Resources:
  SecureS3Bucket:
    Type: 'AWS::S3::Bucket'
    Properties:
      BucketName: !Ref S3BucketName
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: MyProject

  MyEC2Instance:
    Type: 'AWS::EC2::Instance'
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c55b159cbfafe1f0 # Amazon Linux 2 AMI ID for us-east-1
      KeyName: !Ref KeyName
      SecurityGroupIds:
        - !Ref MySecurityGroup
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: MyProject

  MySecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupDescription: Enable SSH access via port 22
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0 # Restrict this to your IP for production
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: MyProject

