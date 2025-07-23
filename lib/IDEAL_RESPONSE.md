# AWS CloudFormation Template for Secure, Scalable Cloud Environment

I'll design a comprehensive AWS CloudFormation template that meets all your requirements for a secure, scalable production environment. This solution includes VPC networking, EC2 compute, Lambda functions, S3 storage, and SNS messaging services.

## Architecture Overview

The infrastructure consists of:
- **VPC**: Custom VPC with public and private subnets for network isolation
- **Networking**: Internet Gateway for public access and NAT Gateway for private subnet outbound connectivity
- **Compute**: t2.micro EC2 instance in the public subnet with secure SSH access
- **Serverless**: Lambda function triggered by S3 uploads, publishing notifications to SNS
- **Storage**: S3 bucket configured for Lambda triggers
- **Messaging**: SNS topic for notifications

## CloudFormation Template

### lib/TapStack.yml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: AWS CloudFormation template for a secure, scalable cloud environment.

Parameters:
  KeyPairName:
    Type: String
    Description: Name of an existing EC2 KeyPair to enable SSH access to the instance
    Default: 'my-key-pair'
  
  SSHCidr:
    Type: String
    Description: CIDR block for SSH access
    Default: '0.0.0.0/0'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

  LatestAmiId:
    Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
    Description: Latest Amazon Linux 2 AMI ID
    Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2

Resources:
  # VPC and Networking Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: cf-task-vpc
        - Key: Environment
          Value: Production

  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: cf-task-public-subnet
        - Key: Environment
          Value: Production

  PrivateSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: cf-task-private-subnet
        - Key: Environment
          Value: Production

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: cf-task-igw
        - Key: Environment
          Value: Production

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: cf-task-public-rt
        - Key: Environment
          Value: Production

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: cf-task-private-rt
        - Key: Environment
          Value: Production

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  NATGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NATGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: cf-task-nat
        - Key: Environment
          Value: Production

  PrivateRouteToNAT:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway

  PublicSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref PublicRouteTable

  PrivateSubnetRouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet
      RouteTableId: !Ref PrivateRouteTable

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # EC2 Resources
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Enable SSH access
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref SSHCidr
      Tags:
        - Key: Name
          Value: cf-task-sg
        - Key: Environment
          Value: Production

  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Ref LatestAmiId
      KeyName: !Ref KeyPairName
      NetworkInterfaces:
        - DeviceIndex: 0
          SubnetId: !Ref PublicSubnet
          GroupSet:
            - !Ref EC2SecurityGroup
          AssociatePublicIpAddress: true
      Tags:
        - Key: Name
          Value: cf-task-ec2
        - Key: Environment
          Value: Production

  # S3 Resources
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'cf-task-s3bucket-${AWS::StackName}'
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: s3:ObjectCreated:*
            Function: !GetAtt LambdaFunction.Arn
      Tags:
        - Key: Name
          Value: cf-task-s3bucket
        - Key: Environment
          Value: Production

  # SNS Resources
  SNSTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: cf-task-snstopic
      Tags:
        - Key: Environment
          Value: Production

  # Lambda Resources
  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: cf-task-lambda-role
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
      Policies:
        - PolicyName: LambdaS3Policy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:GetObjectVersion
                Resource: !Sub 'arn:aws:s3:::cf-task-s3bucket-${AWS::StackName}/*'
        - PolicyName: LambdaSNSPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sns:Publish
                Resource: !Ref SNSTopic
      Tags:
        - Key: Name
          Value: cf-task-lambda-role
        - Key: Environment
          Value: Production

  LambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: cf-task-lambda
      Handler: index.handler
      Role: !GetAtt LambdaExecutionRole.Arn
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          
          def handler(event, context):
              try:
                  sns = boto3.client('sns')
                  topic_arn = os.environ['SNS_TOPIC_ARN']
                  
                  # Extract S3 bucket and object information from the event
                  bucket_name = event['Records'][0]['s3']['bucket']['name']
                  object_key = event['Records'][0]['s3']['object']['key']
                  
                  message = f'File {object_key} was uploaded to bucket {bucket_name}'
                  
                  response = sns.publish(
                      TopicArn=topic_arn,
                      Message=message,
                      Subject='S3 File Upload Notification'
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Notification sent successfully',
                          'messageId': response['MessageId']
                      })
                  }
              except Exception as e:
                  print(f'Error: {str(e)}')
                  raise e
      Runtime: python3.12
      Environment:
        Variables:
          SNS_TOPIC_ARN: !Ref SNSTopic
      Tags:
        - Key: Name
          Value: cf-task-lambda
        - Key: Environment
          Value: Production

  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref LambdaFunction
      Action: lambda:InvokeFunction
      Principal: s3.amazonaws.com
      SourceArn: !Sub 'arn:aws:s3:::cf-task-s3bucket-${AWS::StackName}'

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnetId:
    Description: Public Subnet ID
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet-ID'

  PrivateSubnetId:
    Description: Private Subnet ID
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet-ID'

  EC2InstanceId:
    Description: EC2 Instance ID
    Value: !Ref EC2Instance
    Export:
      Name: !Sub '${AWS::StackName}-EC2-ID'

  EC2PublicIP:
    Description: EC2 Instance Public IP
    Value: !GetAtt EC2Instance.PublicIp
    Export:
      Name: !Sub '${AWS::StackName}-EC2-PublicIP'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3Bucket-Name'

  SNSTopicArn:
    Description: SNS Topic ARN
    Value: !Ref SNSTopic
    Export:
      Name: !Sub '${AWS::StackName}-SNSTopic-ARN'

  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value: !GetAtt LambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-Lambda-ARN'

  NATGatewayId:
    Description: NAT Gateway ID
    Value: !Ref NATGateway
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway-ID'
```

## Key Features and Design Decisions

### 1. Network Architecture
- **VPC**: Custom VPC with 10.0.0.0/16 CIDR block providing 65,536 IP addresses
- **Public Subnet**: 10.0.1.0/24 with automatic public IP assignment for internet-facing resources
- **Private Subnet**: 10.0.2.0/24 for secure backend resources without direct internet access
- **Dynamic AZ Selection**: Uses `!Select [0, !GetAZs '']` to automatically select the first available AZ

### 2. Security Implementation
- **Least Privilege IAM**: Lambda execution role with minimal required permissions
- **Security Groups**: SSH access restricted to specified CIDR blocks
- **Private Networking**: Private subnet resources access internet only through NAT Gateway
- **No Administrative Access**: Complies with requirement to avoid AdministratorAccess policies

### 3. Scalability and Best Practices
- **Parameterized Template**: Flexible configuration through CloudFormation parameters
- **Resource Naming**: Consistent cf-task- prefix for all resources
- **Proper Tagging**: Environment: Production tags on all resources
- **Latest Runtime**: Python 3.12 for Lambda function (latest available)
- **SSM Parameter**: Dynamic AMI ID lookup for latest Amazon Linux 2

### 4. Serverless Architecture
- **Event-Driven**: S3 uploads automatically trigger Lambda execution
- **Error Handling**: Comprehensive exception handling in Lambda function
- **Monitoring**: CloudWatch logs integration through AWSLambdaBasicExecutionRole

## Deployment Instructions

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. Existing EC2 Key Pair for SSH access
3. CloudFormation deployment permissions

### Deployment Commands

```bash
# Deploy the CloudFormation stack
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name MyProductionStack \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    KeyPairName=your-key-pair-name \
    SSHCidr=your.ip.address/32

# Monitor deployment progress
aws cloudformation describe-stacks --stack-name MyProductionStack

# Retrieve stack outputs
aws cloudformation describe-stacks \
  --stack-name MyProductionStack \
  --query 'Stacks[0].Outputs'
```

### Testing the Solution

1. **Upload a test file to S3**:
   ```bash
   aws s3 cp test-file.txt s3://cf-task-s3bucket-MyProductionStack/
   ```

2. **Verify Lambda execution**:
   ```bash
   aws logs describe-log-groups --log-group-name-prefix /aws/lambda/cf-task-lambda
   ```

3. **Check SNS notifications**:
   ```bash
   aws sns list-subscriptions-by-topic --topic-arn <SNS-TOPIC-ARN>
   ```

## Security Considerations

- **Network Isolation**: Private subnet resources cannot be directly accessed from the internet
- **IAM Roles**: Lambda uses service-linked roles with minimal required permissions
- **Encryption**: Consider adding S3 bucket encryption and SNS message encryption for enhanced security
- **VPC Flow Logs**: Consider enabling VPC Flow Logs for network monitoring
- **CloudTrail**: Enable AWS CloudTrail for API call auditing

## Cost Optimization

- **Free Tier Eligible**: t2.micro instance eligible for AWS Free Tier
- **Pay-per-use**: Lambda and SNS charges only when used
- **NAT Gateway**: Primary cost driver - consider NAT instance for lower costs in development
- **EIP**: Charged when not associated with running instances

## Monitoring and Maintenance

- **CloudWatch Metrics**: Monitor EC2, Lambda, and VPC metrics
- **Lambda Logs**: Monitor function execution and errors
- **S3 Access Logs**: Enable for audit trail of bucket access
- **Regular Updates**: Keep AMI and Lambda runtime versions current

This solution provides a robust, secure, and scalable foundation for production workloads while adhering to AWS best practices and your specific requirements.