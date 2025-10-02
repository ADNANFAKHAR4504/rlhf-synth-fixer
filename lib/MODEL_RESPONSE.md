# Basic Web Infrastructure (Failed Implementation)

Here's a simple CloudFormation template for a web infrastructure to handle 3,000 daily users:

## Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Simple web infrastructure'

Resources:
  # Basic VPC
  MyVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16

  # Single public subnet
  PublicSubnet:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref MyVPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: us-east-1a

  # Internet Gateway
  IGW:
    Type: AWS::EC2::InternetGateway

  AttachGW:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref MyVPC
      InternetGatewayId: !Ref IGW

  # Route table
  RouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref MyVPC

  Route:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref RouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref IGW

  SubnetAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet
      RouteTableId: !Ref RouteTable

  # Security Group - Too permissive
  WebSG:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Web security group
      VpcId: !Ref MyVPC
      SecurityGroupIngress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0

  # Single EC2 instance
  WebServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0abcdef1234567890  # Hardcoded AMI
      InstanceType: t2.large  # Oversized
      SubnetId: !Ref PublicSubnet
      SecurityGroupIds:
        - !Ref WebSG
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum install -y httpd
          systemctl start httpd
          echo "<h1>Hello World</h1>" > /var/www/html/index.html

  # S3 bucket - no encryption
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-static-bucket-123

Outputs:
  WebsiteURL:
    Value: !Sub 'http://${WebServer.PublicIp}'
```

## Issues with this Implementation

This basic template has several critical problems:

1. **No High Availability**: Single instance in one AZ
2. **No Load Balancing**: Direct access to single instance
3. **Security Issues**: Overly permissive security group allowing all traffic
4. **No Auto Scaling**: Cannot handle traffic spikes
5. **Hardcoded Values**: AMI ID will become outdated
6. **No Monitoring**: No CloudWatch alarms or dashboards
7. **Cost Inefficiency**: t2.large instance for basic web serving
8. **No Encryption**: S3 bucket lacks encryption
9. **Single Point of Failure**: Everything depends on one instance
10. **No Health Checks**: No way to detect if service is healthy

This template would fail to meet the requirements for a reliable, cost-efficient infrastructure for 3,000 daily users.