## Model Response

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Test environment with VPC, EC2, and monitoring - following AWS best practices'

# =============================================================================
# PARAMETERS
# =============================================================================
Parameters:
  EnvironmentName:
    Description: 'Environment name prefix for resource naming'
    Type: String
    Default: 'TestEnv'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9-]*$'
    ConstraintDescription: 'Must begin with a letter and contain only alphanumeric characters and hyphens'

  KeyPairName:
    Description: 'EC2 Key Pair for SSH access (optional)'
    Type: String
    Default: ''

  LatestAmiId:
    Description: 'Latest Amazon Linux 2 AMI ID'
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'

# =============================================================================
# CONDITIONS
# =============================================================================
Conditions:
  HasKeyPair: !Not [!Equals [!Ref KeyPairName, '']]

# =============================================================================
# RESOURCES
# =============================================================================
Resources:

  # ---------------------------------------------------------------------------
  # VPC & NETWORKING RESOURCES
  # ---------------------------------------------------------------------------
  
  # Main VPC
  VPC:
    Type: 'AWS::EC2::VPC'
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-VPC'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: 'TestEnvironment'

  # Internet Gateway
  InternetGateway:
    Type: 'AWS::EC2::InternetGateway'
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-IGW'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: 'AWS::EC2::VPCGatewayAttachment'
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnet
  PublicSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Public'

  # Private Subnet
  PrivateSubnet:
    Type: 'AWS::EC2::Subnet'
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Subnet'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Type
          Value: 'Private'

  # Elastic IP for NAT Gateway
  NatGatewayEIP:
    Type: 'AWS::EC2::EIP'
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-EIP'
        - Key: Environment
          Value: !Ref EnvironmentName

  # NAT Gateway
  NatGateway:
    Type: 'AWS::EC2::NatGateway'
    Properties:
      AllocationId: !GetAtt NatGatewayEIP.AllocationId
      SubnetId: !Ref PublicSubnet
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-NAT-Gateway'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Public Route Table
  PublicRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Public-Routes'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Default Public Route
  DefaultPublicRoute:
    Type: 'AWS::EC2::Route'
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Public Subnet Route Table Association
  PublicSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet

  # Private Route Table
  PrivateRouteTable:
    Type: 'AWS::EC2::RouteTable'
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Private-Routes'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Default Private Route (through NAT Gateway)
  DefaultPrivateRoute:
    Type: 'AWS::EC2::Route'
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  # Private Subnet Route Table Association
  PrivateSubnetRouteTableAssociation:
    Type: 'AWS::EC2::SubnetRouteTableAssociation'
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      SubnetId: !Ref PrivateSubnet

  # ---------------------------------------------------------------------------
  # SECURITY GROUPS
  # ---------------------------------------------------------------------------
  
  # Web Security Group
  WebSecurityGroup:
    Type: 'AWS::EC2::SecurityGroup'
    Properties:
      GroupName: !Sub '${EnvironmentName}-Web-SG'
      GroupDescription: 'Security group for web servers allowing HTTP and SSH'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'Allow HTTP from anywhere'
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: '0.0.0.0/0'
          Description: 'Allow SSH from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-Web-SG'
        - Key: Environment
          Value: !Ref EnvironmentName

  # ---------------------------------------------------------------------------
  # IAM RESOURCES
  # ---------------------------------------------------------------------------
  
  # IAM Role for EC2 Instance
  EC2Role:
    Type: 'AWS::IAM::Role'
    Properties:
      RoleName: !Sub '${EnvironmentName}-EC2-Role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/AmazonS3FullAccess'
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Role'
        - Key: Environment
          Value: !Ref EnvironmentName

  # Instance Profile for EC2
  EC2InstanceProfile:
    Type: 'AWS::IAM::InstanceProfile'
    Properties:
      InstanceProfileName: !Sub '${EnvironmentName}-EC2-Profile'
      Roles:
        - !Ref EC2Role

  # ---------------------------------------------------------------------------
  # CLOUDWATCH RESOURCES
  # ---------------------------------------------------------------------------
  
  # CloudWatch Log Group for EC2 Instance
  EC2LogGroup:
    Type: 'AWS::Logs::LogGroup'
    Properties:
      LogGroupName: !Sub '/aws/ec2/${EnvironmentName}'
      RetentionInDays: 14
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-EC2-Logs'
        - Key: Environment
          Value: !Ref EnvironmentName

  # ---------------------------------------------------------------------------
  # COMPUTE RESOURCES
  # ---------------------------------------------------------------------------
  
  # EC2 Instance
  WebServer:
    Type: 'AWS::EC2::Instance'
    Properties:
      ImageId: !Ref LatestAmiId
      InstanceType: 't2.micro'
      KeyName: !If [HasKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue']
      IamInstanceProfile: !Ref EC2InstanceProfile
      SecurityGroupIds:
        - !Ref WebSecurityGroup
      SubnetId: !Ref PublicSubnet
      Monitoring: true  # Enable detailed monitoring
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          yum update -y
          yum install -y awslogs httpd
          
          # Configure CloudWatch Logs Agent
          cat > /etc/awslogs/awslogs.conf << EOF
          [general]
          state_file = /var/lib/awslogs/agent-state
          
          [/var/log/messages]
          file = /var/log/messages
          log_group_name = ${EC2LogGroup}
          log_stream_name = {instance_id}/var/log/messages
          datetime_format = %b %d %H:%M:%S
          
          [/var/log/httpd/access_log]
          file = /var/log/httpd/access_log
          log_group_name = ${EC2LogGroup}
          log_stream_name = {instance_id}/var/log/httpd/access_log
          datetime_format = [%d/%b/%Y:%H:%M:%S %z]
          
          [/var/log/httpd/error_log]
          file = /var/log/httpd/error_log
          log_group_name = ${EC2LogGroup}
          log_stream_name = {instance_id}/var/log/httpd/error_log
          datetime_format = [%a %b %d %H:%M:%S %Y]
          EOF
          
          # Set region for awslogs
          sed -i 's/region = us-east-1/region = ${AWS::Region}/g' /etc/awslogs/awscli.conf
          
          # Start services
          systemctl start awslogsd
          systemctl enable awslogsd
          systemctl start httpd
          systemctl enable httpd
          
          # Create a simple index page
          echo "<h1>Test Environment Web Server</h1>" > /var/www/html/index.html
          echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
          echo "<p>Region: ${AWS::Region}</p>" >> /var/www/html/index.html
          
      Tags:
        - Key: Name
          Value: !Sub '${EnvironmentName}-WebServer'
        - Key: Environment
          Value: !Ref EnvironmentName
        - Key: Project
          Value: 'TestEnvironment'

# =============================================================================
# OUTPUTS
# =============================================================================
Outputs:
  VPCId:
    Description: 'ID of the VPC'
    Value: !Ref VPC
    Export:
      Name: !Sub '${EnvironmentName}-VPC-ID'

  PublicSubnetId:
    Description: 'ID of the public subnet'
    Value: !Ref PublicSubnet
    Export:
      Name: !Sub '${EnvironmentName}-Public-Subnet-ID'

  PrivateSubnetId:
    Description: 'ID of the private subnet'
    Value: !Ref PrivateSubnet
    Export:
      Name: !Sub '${EnvironmentName}-Private-Subnet-ID'

  WebServerInstanceId:
    Description: 'Instance ID of the web server'
    Value: !Ref WebServer

  WebServerPublicIP:
    Description: 'Public IP address of the web server'
    Value: !GetAtt WebServer.PublicIp

  WebServerPublicDNS:
    Description: 'Public DNS name of the web server'
    Value: !GetAtt WebServer.PublicDnsName

  WebURL:
    Description: 'URL of the web server'
    Value: !Sub 'http://${WebServer.PublicIp}'

  SecurityGroupId:
    Description: 'ID of the web security group'
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub '${EnvironmentName}-Web-SG-ID'

  NATGatewayId:
    Description: 'ID of the NAT Gateway'
    Value: !Ref NatGateway
    Export:
      Name: !Sub '${EnvironmentName}-NAT-Gateway-ID'

  CloudWatchLogGroup:
    Description: 'CloudWatch Log Group for EC2 instance'
    Value: !Ref EC2LogGroup
```