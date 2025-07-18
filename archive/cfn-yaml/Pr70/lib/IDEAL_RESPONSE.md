Below is a set of AWS CloudFormation YAML templates designed to meet the specified requirements. These templates include a main template for creating environment-specific resources and a nested stack for common resources like VPC.

#### **Common Resources Template (common-resources.yaml)**

This template defines the VPC and other shared resources.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Common resources shared across environments

Parameters:
  EnvironmentName:
    Type: String
    Description: The name of the environment (dev, test, prod)
  AvailabilityZone:
    Type: String
    Description: AWS availability zone
  InstanceType:
    Type: String
    Description: EC2 instance type
  LatestAmiId:
    Type: String
    Description: Latest AMI ID for the availability zone

Resources:
  SharedVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-shared-vpc'
        - Key: Environment
          Value: !Ref AWS::StackName
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref SharedVPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Ref AvailabilityZone
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-public-subnet'
        - Key: Environment
          Value: !Ref AWS::StackName
Outputs:
  VPCId:
    Description: The ID of the VPC
    Value: !Ref SharedVPC
    Export:
      Name: !Sub '${EnvironmentName}-VPCId'

  PublicSubnetId:
    Description: The ID of the public subnet
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${EnvironmentName}-PublicSubnetId'
```

#### **Environment-Specific Template (environment-specific.yaml)**

This template creates environment-specific resources and references the common resources.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Environment-specific resources

Parameters:
  EnvironmentName:
    Type: String
    Description: The name of the environment (dev, test, prod)
    AllowedValues:
      - dev
      - test
      - prod

  VPCId:
    Type: AWS::EC2::VPC::Id
    Description: The ID of the VPC

  PublicSubnetId:
    Type: AWS::EC2::Subnet::Id
    Description: The ID of the public subnet

Conditions:
  IsProduction: !Equals [!Ref EnvironmentName, prod]

Resources:
  AppS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${EnvironmentSuffix}-app-s3-bucket-${AWS::AccountId}'
      Tags:
        - Key: Environment
          Value: !Ref AWS::StackName

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP and HTTPS traffic
      VpcId: !Ref VPCId
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Environment
          Value: !Ref AWS::StackName
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
      Policies:
        - PolicyName: S3ReadAccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt AppS3Bucket.Arn
                  - !Sub '${AppS3Bucket.Arn}/*'
      Tags:
        - Key: Environment
          Value: !Ref AWS::StackName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole
      Tags:
        - Key: Environment
          Value: !Ref AWS::StackName

  ProductionOnlyInstance:
    Type: AWS::EC2::Instance
    Condition: IsProduction
    Properties:
      IamInstanceProfile: !Ref EC2InstanceProfile
      InstanceType: !Ref InstanceType
      ImageId: !Ref LatestAmiId
      SecurityGroupIds:
        - !Ref AppSecurityGroup
      SubnetId: !Ref PublicSubnetId
      Tags:
        - Key: Environment
          Value: !Ref AWS::StackName

Outputs:
  S3BucketName:
    Description: The name of the S3 bucket
    Value: !Ref AppS3Bucket

  SecurityGroupId:
    Description: The ID of the security group
    Value: !Ref AppSecurityGroup
```

#### **Deploying the Stacks**

To deploy these stacks, you can use the AWS CLI. First, deploy the common resources stack:

```sh
aws cloudformation deploy \
  --stack-name common-resources \
  --template-file common-resources.yaml \
  --parameter-overrides EnvironmentName=dev \
  --region us-east-1
```

Then, deploy the environment-specific stack:

```sh
aws cloudformation deploy \
  --stack-name dev-environment \
  --template-file environment-specific.yaml \
  --parameter-overrides EnvironmentName=dev VPCId=<VPCId-from-common-resources-output> PublicSubnetId=<PublicSubnetId-from-common-resources-output> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

#### **Enabling Drift Detection**

To enable drift detection, you can use the AWS CLI or Management Console:

```sh
aws cloudformation detect-stack-drift \
  --stack-name dev-environment \
  --region us-east-1
```

These templates ensure that resources are tagged with the environment name, use cross-stack references, apply conditions for environment-specific configurations, and parameterize inputs for flexibility. The IAM policies and other security configurations should be added similarly, ensuring consistency across environments.
