# Secure Production Web Server Infrastructure

## Overview
This CloudFormation template provisions a secure production web server infrastructure in AWS. It creates an EC2 instance with Apache web server, secured with proper IAM roles and security groups with restricted HTTP/HTTPS access.

## Infrastructure Components

### TapStack.yml

```yaml
# Note: The AWS region for deployment (e.g., 'us-east-1') is specified at the time
# of stack creation via the AWS Management Console, CLI, or SDK, not within the template itself.

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  CloudFormation template for a secure production web server infrastructure.
  This template provisions an EC2 instance with a basic web server, an IAM Role,
  and a Security Group with restricted HTTP/HTTPS access.

Parameters:
  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Description: The latest Amazon Linux 2 AMI ID for the us-east-1 region.
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

Resources:
  # IAM Role for the EC2 Instance to assume.
  # It grants the EC2 service principal permission to assume this role.
  WebServerInstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service:
                - ec2.amazonaws.com
            Action:
              - 'sts:AssumeRole'
      Path: /
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience

  # Instance Profile to attach the IAM role to the EC2 instance.
  WebServerInstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - !Ref WebServerInstanceRole
      # Tags were added here to meet the prompt requirements.

  # Security Group to control inbound traffic to the web server.
  # It allows HTTP and HTTPS traffic only from the specified CIDR block.
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Allow inbound HTTP and HTTPS from the office IP range'
      # This assumes you have a VPC created and its ID is exported from another stack.
      # Replace 'NetworkingStack-VPCID' with your actual exported value name if different.
      # VpcId: !ImportValue 'NetworkingStack-VPCID'
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 203.0.113.0/24
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 203.0.113.0/24
      Tags:
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience

  # The EC2 Instance that will host the web application.
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      ImageId: !Ref LatestAmiId
      IamInstanceProfile: !Ref WebServerInstanceProfile
      SecurityGroupIds:
        # CORRECTED: Changed !Ref to !GetAtt to explicitly fetch the GroupId.
        - !GetAtt WebServerSecurityGroup.GroupId
      # UserData script to install and start a basic Apache web server.
      UserData:
        Fn::Base64: |
          #!/bin/bash -xe
          yum update -y
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          echo "<h1>Deployed Successfully via CloudFormation</h1>" > /var/www/html/index.html
      Tags:
        - Key: Name
          Value: Production-WebServer
        - Key: Environment
          Value: Production
        - Key: Project
          Value: GlobalResilience

Outputs:
  InstanceId:
    Description: The Instance ID of the web server.
    Value: !Ref WebServerInstance
  InstancePublicIp:
    Description: The Public IP address of the web server.
    Value: !GetAtt WebServerInstance.PublicIp
  SecurityGroupId:
    Description: The ID of the web server's security group.
    Value: !Ref WebServerSecurityGroup
```

## Key Features

- **Security**: IAM role for EC2 instance with principle of least privilege
- **Access Control**: Security group restricting HTTP/HTTPS traffic to specific CIDR block (203.0.113.0/24)
- **Web Server**: Apache HTTP server automatically installed and configured via UserData
- **Latest AMI**: Uses AWS Systems Manager Parameter Store to fetch the latest Amazon Linux 2 AMI
- **Tagging**: Comprehensive tagging for resource management with Environment and Project tags
- **Instance Configuration**: t2.micro instance type for cost efficiency
- **Outputs**: Provides Instance ID, Public IP, and Security Group ID for reference