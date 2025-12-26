# AWS CloudFormation Template for VPC Infrastructure

Here's a production-ready AWS CloudFormation YAML template that creates a complete VPC infrastructure with EC2 instances, IAM roles, and S3 bucket for CloudWatch Logs in the us-west-2 region.

## Template Structure

The template creates the following resources:
- VPC with public and private subnets in different AZs
- Internet Gateway and NAT Gateway for proper routing
- EC2 instance (t3.micro) in the public subnet
- IAM role with S3 read-only access attached to EC2
- S3 bucket for CloudWatch Logs with proper bucket policy
- All resources properly tagged with Name and Environment

## CloudFormation Template

**File: `lib/TapStack.yml`**

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: >
  AWS CloudFormation template to create a VPC with public and private subnets,
  EC2 instances, IAM roles, and S3 bucket for CloudWatch Logs.

Parameters:
  EnvironmentName:
    Type: String
    Description: Environment name (e.g., dev, prod)
    Default: dev

Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: !Ref "AWS::Region"
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PublicSubnet
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: !Ref "AWS::Region"
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PrivateSubnet
        - Key: Environment
          Value: !Ref EnvironmentName

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW
        - Key: Environment
          Value: !Ref EnvironmentName

  IGWAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PublicRouteTable
        - Key: Environment
          Value: !Ref EnvironmentName

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: IGWAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NatEIP
        - Key: Environment
          Value: !Ref EnvironmentName

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-NatGateway
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-PrivateRouteTable
        - Key: Environment
          Value: !Ref EnvironmentName

  PrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  S3ReadOnlyRole:
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
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:Get*
                  - s3:List*
                Resource: "*"
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-S3ReadOnlyRole
        - Key: Environment
          Value: !Ref EnvironmentName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref S3ReadOnlyRole
      Path: "/"

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t3.micro
      ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      SubnetId: !Ref PublicSubnet
      IamInstanceProfile: !Ref EC2InstanceProfile
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-EC2Instance
        - Key: Environment
          Value: !Ref EnvironmentName

  CloudWatchLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-cloudwatch-logs
        - Key: Environment
          Value: !Ref EnvironmentName

  CloudWatchLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref CloudWatchLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AllowCloudWatchLogsPutObject
            Effect: Allow
            Principal:
              Service: !Sub logs.${AWS::Region}.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:aws:s3:::${CloudWatchLogsBucket}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
```

## Key Features and Best Practices

### 1. **Dynamic Resource Selection**
- Uses `Fn::Select` with `Fn::GetAZs` for dynamic availability zone selection
- Uses SSM parameter for latest Amazon Linux 2 AMI (`{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}`)

### 2. **Proper Networking Setup**
- VPC with 10.0.0.0/16 CIDR block
- Public subnet (10.0.1.0/24) in first AZ with auto-assign public IP
- Private subnet (10.0.2.0/24) in second AZ
- Internet Gateway for public internet access
- NAT Gateway in public subnet for private subnet outbound access
- Proper route tables and associations

### 3. **Security Best Practices**
- IAM role with least privilege (S3 read-only access)
- Instance profile properly attached to EC2
- S3 bucket policy restricting CloudWatch Logs service access
- Modern S3 ownership controls

### 4. **Resource Tagging**
- Consistent tagging with Name and Environment across all resources
- Parameterized environment name for reusability

### 5. **Template Compliance**
- Passes cfn-lint validation
- Uses AWS best practices for naming and structure
- No hardcoded sensitive values
- Proper dependency management with DependsOn

## Deployment

The template can be deployed using AWS CLI:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentName=dev \
  --region us-west-2
```

This template meets all requirements specified in the prompt and follows AWS CloudFormation best practices for production deployments.