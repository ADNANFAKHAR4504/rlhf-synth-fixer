I'll help you create a comprehensive CloudFormation template that follows AWS security best practices. This template will set up a secure, production-ready infrastructure in us-east-1.

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure multi-AZ infrastructure with EC2, VPC, and security best practices'

Parameters:
  AllowedSSHCIDR:
    Type: String
    Description: 'CIDR block allowed for SSH access (e.g., your office IP)'
    Default: '10.0.0.0/8'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR block (e.g., 192.168.1.0/24)'
  
  AllowedHTTPCIDR:
    Type: String
    Description: 'CIDR block allowed for HTTP access'
    Default: '0.0.0.0/0'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'
    ConstraintDescription: 'Must be a valid CIDR block (e.g., 0.0.0.0/0 for public access)'
  
  InstanceType:
    Type: String
    Description: 'EC2 instance type'
    Default: 't3.micro'
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
      - t3.large
    ConstraintDescription: 'Must be a valid EC2 instance type'
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: 'Name of an existing EC2 KeyPair for SSH access'
    ConstraintDescription: 'Must be the name of an existing EC2 KeyPair'

Mappings:
  RegionMap:
    us-west-2:
      AMI: ami-0c2d3e23b7e5a2b8e  # Amazon Linux 2023 AMI

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-IGW'

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1a
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1b
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Subnet-AZ2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1a
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: us-east-1b
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Subnet-AZ2'

  # NAT Gateway
  NatGatewayEIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-EIP'

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-NAT-Gateway'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Public-Routes'

  DefaultPublicRoute:
    Type: AWS::EC2::Route
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-Private-Routes'

  DefaultPrivateRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet2

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-WebServer-SG'
      GroupDescription: 'Security group for web server with restricted access'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedHTTPCIDR
          Description: 'HTTP access from allowed CIDR'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedSSHCIDR
          Description: 'SSH access from allowed CIDR'
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: 'HTTP outbound for package updates'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: 'HTTPS outbound for package updates and AWS API calls'
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer-SG'

  # VPC Flow Logs
  VPCFlowLogRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: vpc-flow-logs.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: CloudWatchLogsPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogGroups
                  - logs:DescribeLogStreams
                Resource: '*'

  VPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/vpc/flowlogs/${AWS::StackName}'
      RetentionInDays: 30

  VPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      ResourceType: VPC
      ResourceId: !Ref VPC
      TrafficType: ALL
      LogDestinationType: cloud-watch-logs
      LogGroupName: !Ref VPCFlowLogGroup
      DeliverLogsPermissionArn: !GetAtt VPCFlowLogRole.Arn
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-VPC-FlowLog'

  # IAM Role for EC2 Instance
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
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: SecretsManagerAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - secretsmanager:GetSecretValue
                  - secretsmanager:DescribeSecret
                Resource: !Ref ApplicationSecret
              - Effect: Allow
                Action:
                  - secretsmanager:ListSecrets
                Resource: '*'
                Condition:
                  StringEquals:
                    'secretsmanager:ResourceTag/Application': !Ref AWS::StackName

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # Secrets Manager
  ApplicationSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}/application/secrets'
      Description: 'Application secrets for the web server'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: 'password'
        PasswordLength: 16
        ExcludeCharacters: '"@/\'
      Tags:
        - Key: Application
          Value: !Ref AWS::StackName
        - Key: Environment
          Value: production

  # EC2 Instance
  WebServerInstance:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: !FindInMap [RegionMap, !Ref 'AWS::Region', AMI]
      InstanceType: !Ref InstanceType
      KeyName: !Ref KeyPairName
      SubnetId: !Ref PublicSubnet1
      SecurityGroupIds:
        - !Ref WebServerSecurityGroup
      IamInstanceProfile: !Ref EC2InstanceProfile
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent aws-cli
          
          # Configure CloudWatch Agent
          cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
          {
            "metrics": {
              "namespace": "AWS/EC2/Custom",
              "metrics_collected": {
                "cpu": {
                  "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                  "metrics_collection_interval": 60
                },
                "disk": {
                  "measurement": ["used_percent"],
                  "metrics_collection_interval": 60,
                  "resources": ["*"]
                },
                "mem": {
                  "measurement": ["mem_used_percent"],
                  "metrics_collection_interval": 60
                }
              }
            },
            "logs": {
              "logs_collected": {
                "files": {
                  "collect_list": [
                    {
                      "file_path": "/var/log/messages",
                      "log_group_name": "/aws/ec2/${AWS::StackName}/system",
                      "log_stream_name": "{instance_id}/messages"
                    }
                  ]
                }
              }
            }
          }
          EOF
          
          # Start CloudWatch Agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
            -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
          
          # Install and start a simple web server
          yum install -y httpd
          systemctl start httpd
          systemctl enable httpd
          
          # Create a simple index page
          cat > /var/www/html/index.html << 'EOF'
          <!DOCTYPE html>
          <html>
          <head>
              <title>Secure Web Server</title>
          </head>
          <body>
              <h1>Welcome to Your Secure Web Server!</h1>
              <p>This server is running in a secure AWS environment with:</p>
              <ul>
                  <li>VPC with public and private subnets</li>
                  <li>Restricted security groups</li>
                  <li>IAM roles with minimal permissions</li>
                  <li>CloudWatch monitoring</li>
                  <li>VPC Flow Logs</li>
                  <li>AWS Secrets Manager integration</li>
              </ul>
          </body>
          </html>
          EOF
          
          # Set proper permissions
          chown apache:apache /var/www/html/index.html
          chmod 644 /var/www/html/index.html
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-WebServer'

  # CloudWatch Log Groups
  SystemLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/ec2/${AWS::StackName}/system'
      RetentionInDays: 30

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC-ID'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1-ID'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2-ID'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1-ID'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2-ID'

  WebServerInstanceId:
    Description: 'Web Server Instance ID'
    Value: !Ref WebServerInstance

  WebServerPublicIP:
    Description: 'Web Server Public IP'
    Value: !GetAtt WebServerInstance.PublicIp

  WebServerURL:
    Description: 'Web Server URL'
    Value: !Sub 'http://${WebServerInstance.PublicIp}'

  ApplicationSecretArn:
    Description: 'Application Secret ARN'
    Value: !Ref ApplicationSecret

  SecurityGroupId:
    Description: 'Web Server Security Group ID'
    Value: !Ref WebServerSecurityGroup
    Export:
      Name: !Sub '${AWS::StackName}-WebServer-SG-ID'
```

## Key Security Features Implemented:

### 🔒 **Network Security**
- **VPC with proper CIDR segmentation** (10.0.0.0/16)
- **Public/Private subnet architecture** across 2 AZs
- **NAT Gateway** for secure outbound internet access from private subnets
- **VPC Flow Logs** for network traffic monitoring

### 🛡️ **Access Control**
- **Restrictive Security Groups** with parameterized CIDR blocks
- **IAM roles with minimal permissions** (principle of least privilege)
- **No hardcoded credentials** - everything uses IAM roles and Secrets Manager

### 📊 **Monitoring & Logging**
- **CloudWatch Agent** for detailed EC2 metrics
- **VPC Flow Logs** for network monitoring
- **CloudWatch Log Groups** with retention policies
- **Custom metrics** for CPU, memory, and disk usage

### 🔐 **Secrets Management**
- **AWS Secrets Manager** for secure credential storage
- **Automatic password generation** with complexity requirements
- **Proper IAM permissions** for secret access

## Usage Instructions:

1. **Save the template** as `TapStack.yml`

2. **Deploy using AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name tap-secure-infrastructure \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=KeyPairName,ParameterValue=your-key-pair \
               ParameterKey=AllowedSSHCIDR,ParameterValue=YOUR.IP.ADDRESS/32 \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

3. **Or deploy via AWS Console**:
   - Upload the template
   - Specify your key pair name
   - Set your IP address for SSH access
   - Review and create

## Production Considerations:

- **Update the AMI ID** to the latest Amazon Linux 2023 AMI for us-east-1
- **Adjust CIDR blocks** if they conflict with your existing networks
- **Consider using AWS Systems Manager Session Manager** instead of SSH for even better security
- **Add Application Load Balancer** for production workloads
- **Implement backup strategies** for your EC2 instances
- **Set up CloudTrail** for API logging
- **Consider using AWS Config** for compliance monitoring

This template provides a solid foundation that you can extend as your infrastructure grows!