```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Complete stack with S3, EC2, and auto-generated KeyPair in us-east-1'

Parameters:
  EnvironmentType:
    Description: 'Environment type (dev/stage/prod)'
    Type: String
    Default: 'dev'
    AllowedValues: ['dev', 'stage', 'prod']
    ConstraintDescription: 'Must be dev, stage, or prod'

  AllowedSSHIP:
    Description: 'IP address allowed to SSH (recommend /32 for security)'
    Type: String
    Default: '0.0.0.0/0'
    AllowedPattern: '^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\/([0-9]|[1-2][0-9]|3[0-2]))$'
    ConstraintDescription: 'Must be a valid IP CIDR range'

Resources:
  # 1. Create a new EC2 Key Pair and store the private key in Secrets Manager
  EC2KeyPair:
    Type: AWS::EC2::KeyPair
    Properties:
      KeyName: !Sub 'TapStack-KeyPair-${EnvironmentType}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType
        - Key: ManagedBy
          Value: CloudFormation

  KeyPairSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'ec2/keypair/${EC2KeyPair}'
      Description: 'Private key for EC2 instances in TapStack'
      SecretString: !Sub '{"KeyPairId":"${EC2KeyPair}","KeyPairName":"${EC2KeyPair}"}'
      Tags:
        - Key: Environment
          Value: !Ref EnvironmentType

  # 2. Secure S3 Bucket
  SecureS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::AccountId}-${EnvironmentType}-secure-bucket'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        IgnorePublicAcls: true
        BlockPublicPolicy: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-secure-bucket'
        - Key: Environment
          Value: !Ref EnvironmentType

  # 3. EC2 Security Resources
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Enable SSH access to EC2 instance'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHIP
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-ec2-sg'

  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: [ec2.amazonaws.com]
            Action: ['sts:AssumeRole']
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-ec2-role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles: [!Ref EC2InstanceRole]

  # 4. EC2 Instance
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 in us-east-1
      KeyName: !Ref EC2KeyPair
      SecurityGroupIds: [!GetAtt EC2SecurityGroup.GroupId]
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentType}-ec2-instance'
        - Key: Environment
          Value: !Ref EnvironmentType
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y aws-cli jq
          echo "KeyPair: ${EC2KeyPair}" > /home/ec2-user/keypair-info.txt

Outputs:
  S3BucketName:
    Description: 'Name of the secure S3 bucket'
    Value: !Ref SecureS3Bucket

  EC2InstanceId:
    Description: 'Instance ID of the EC2 instance'
    Value: !Ref EC2Instance

  EC2PublicIP:
    Description: 'Public IP address of the EC2 instance'
    Value: !GetAtt EC2Instance.PublicIp

  KeyPairName:
    Description: 'Name of the created EC2 Key Pair'
    Value: !Ref EC2KeyPair

  PrivateKeySecret:
    Description: 'Secrets Manager ARN containing key pair info'
    Value: !Ref KeyPairSecret```
