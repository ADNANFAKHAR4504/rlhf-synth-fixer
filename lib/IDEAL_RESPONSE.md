# TapStack CloudFormation Template

Production-ready infrastructure-as-code template for deploying a scalable web application on AWS.

## Deployment Prerequisites

### Region Requirement
- **Required Region**: us-west-2 (Oregon)
- The template includes a validation rule that prevents deployment in any other region
- Attempting to deploy in a different region will fail with: "This template can only be deployed in us-west-2 region"

### SSL/TLS Certificate Options

The template supports three certificate configurations:

#### Option 1: HTTP Only (No Certificate)
- Leave `DomainName` parameter empty (default)
- ALB will serve traffic over HTTP on port 80
- No HTTPS listener is created
- Use ALB DNS name directly: `http://<alb-dns-name>.us-west-2.elb.amazonaws.com`

#### Option 2: Existing Certificate (Recommended for Production)
- **Prerequisites**:
  - ACM certificate must already exist in us-west-2 region
  - Certificate must be validated and in "Issued" status
  - Note the certificate ARN: `arn:aws:acm:us-west-2:<account-id>:certificate/<cert-id>`
- **Parameters**:
  - Set `DomainName` to your domain (e.g., "example.com")
  - Set `CreateCertificate` to "false"
  - Set `CertificateArn` to your existing certificate ARN
- **Result**: ALB will serve HTTPS traffic on port 443 and redirect HTTP to HTTPS

#### Option 3: Create New Certificate
- **Prerequisites**:
  - You must have access to update DNS records for your domain
  - Domain must be registered and DNS hosted in Route 53 or external DNS provider
- **Parameters**:
  - Set `DomainName` to your domain (e.g., "example.com")
  - Set `CreateCertificate` to "true"
  - Leave `CertificateArn` empty
- **Important**: 
  - Template will create the certificate but it will remain in "Pending Validation" status
  - You must manually add the DNS validation CNAME records to your DNS zone
  - Stack creation will complete, but HTTPS won't work until certificate is validated
  - Check ACM console for validation records after stack creation
- **Result**: ALB will serve HTTPS traffic on port 443 and redirect HTTP to HTTPS (after validation)

### Certificate Region Constraint
- **Critical**: ACM certificates are region-specific
- The certificate must exist in us-west-2 (same region as the ALB)
- Certificates from other regions (e.g., us-east-1) cannot be used
- If using an existing certificate, verify it's in us-west-2:
  ```bash
  aws acm list-certificates --region us-west-2
  ```

### Database Password
- Default password is provided but should be changed for production
- Password is stored in AWS Secrets Manager
- The secret is created automatically: `TapApp-Production-db-password`
- To update password after deployment:
  ```bash
  aws secretsmanager update-secret \
    --secret-id TapApp-Production-db-password \
    --secret-string '{"username":"admin","password":"<new-password>"}' \
    --region us-west-2
  ```

## TapStack.yml

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Description: "TAP Stack - Task Assignment Platform CloudFormation Template"

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: "Environment Configuration"
        Parameters:
          - EnvironmentSuffix
          - Environment
      - Label:
          default: "Network Configuration"
        Parameters:
          - VpcCidr
          - PublicSubnetCidr1
          - PublicSubnetCidr2
          - PrivateSubnetCidr1
          - PrivateSubnetCidr2
      - Label:
          default: "Database Configuration"
        Parameters:
          - DBName
          - DBUser
          - DBInstanceClass
          - DatabasePassword
      - Label:
          default: "SSL Certificate Configuration"
        Parameters:
          - DomainName
          - CreateCertificate
          - CertificateArn

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: "production"
    Description: "Environment suffix for resource naming (e.g., dev, staging, prod)"
    AllowedPattern: "^[a-zA-Z0-9]+$"
    ConstraintDescription: "Must contain only alphanumeric characters"

  Environment:
    Type: String
    Default: "Production"
    Description: "Environment name (dev, staging, Production)"
    AllowedValues:
      - dev
      - staging
      - Production
    ConstraintDescription: "Must be one of: dev, staging, Production"

  AppName:
    Type: String
    Default: TapApp
    Description: Name of the application
    MinLength: 1
    MaxLength: 50

  VpcCidr:
    Type: String
    Default: "10.0.0.0/16"
    Description: CIDR block for the VPC
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 10.0.0.0/16)"

  PublicSubnetCidr1:
    Type: String
    Default: "10.0.1.0/24"
    Description: CIDR block for the first public subnet
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 10.0.1.0/24)"

  PublicSubnetCidr2:
    Type: String
    Default: "10.0.2.0/24"
    Description: CIDR block for the second public subnet
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 10.0.2.0/24)"

  PrivateSubnetCidr1:
    Type: String
    Default: "10.0.10.0/24"
    Description: CIDR block for the first private subnet
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 10.0.10.0/24)"

  PrivateSubnetCidr2:
    Type: String
    Default: "10.0.20.0/24"
    Description: CIDR block for the second private subnet
    AllowedPattern: "^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])(\\/([0-9]|[1-2][0-9]|3[0-2]))$"
    ConstraintDescription: "Must be a valid CIDR block (e.g., 10.0.20.0/24)"

  DBName:
    Type: String
    Default: tapdb
    Description: Database name
    MinLength: 1
    MaxLength: 64
    AllowedPattern: "^[a-zA-Z][a-zA-Z0-9]*$"
    ConstraintDescription: "Must begin with a letter and contain only alphanumeric characters"

  DBUser:
    Type: String
    Default: admin
    Description: Database master username
    MinLength: 1
    MaxLength: 16
    AllowedPattern: "^[a-zA-Z][a-zA-Z0-9]*$"
    ConstraintDescription: "Must begin with a letter and contain only alphanumeric characters"

  DatabasePassword:
    Type: String
    Default: "TapApp2024!SecurePass"
    Description: "Database master password (min 8 characters, must include uppercase, lowercase, number, and special character)"
    NoEcho: true
    MinLength: 8
    MaxLength: 41
    AllowedPattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$"
    ConstraintDescription: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"

  DBInstanceClass:
    Type: String
    Default: db.t3.micro
    Description: Database instance class
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium
      - db.t3.large
    ConstraintDescription: "Must select a valid DB instance type"

  DomainName:
    Type: String
    Default: ""
    Description: "Domain name for SSL certificate (leave empty to skip HTTPS)"
    AllowedPattern: "^$|^(\\*\\.)?(((?!-)[A-Za-z0-9-]{0,62}[A-Za-z0-9])\\.)+(?!-)[A-Za-z0-9-]{1,62}[A-Za-z0-9]$"
    ConstraintDescription: "Must be a valid domain name or empty"

  CreateCertificate:
    Type: String
    Default: "false"
    Description: "Create a new ACM certificate for the domain"
    AllowedValues:
      - "true"
      - "false"

  CertificateArn:
    Type: String
    Default: ""
    Description: "ARN of existing ACM certificate (leave empty if creating new)"
    AllowedPattern: "^$|^arn:aws:acm:[a-z0-9-]+:[0-9]{12}:certificate/[a-zA-Z0-9-]+$"
    ConstraintDescription: "Must be a valid ACM certificate ARN or empty"

Rules:
  RegionCheck:
    Assertions:
      - Assert: !Equals [!Ref "AWS::Region", "us-west-2"]
        AssertDescription: "This template can only be deployed in us-west-2 region"

Conditions:
  HasDomain: !Not [!Equals [!Ref DomainName, ""]]
  ShouldCreateCertificate: !And
    - !Condition HasDomain
    - !Equals [!Ref CreateCertificate, "true"]
  ShouldUseCertificate: !Or
    - !Condition ShouldCreateCertificate
    - !Not [!Equals [!Ref CertificateArn, ""]]
  HasCertificateArn: !Not [!Equals [!Ref CertificateArn, ""]]
  HasHTTPS: !Or
    - !Condition ShouldCreateCertificate
    - !Condition HasCertificateArn
  HasHTTP: !Not [!Condition HasHTTPS]

Mappings:
  RegionMap:
    us-east-1:
      AMI: ami-0c55b159cbfafe1f0
    us-west-2:
      AMI: ami-0d1cd67c26f5fca19
    eu-west-1:
      AMI: ami-0bbc25e23a7640b9b
    ap-southeast-1:
      AMI: ami-0c802847a7dd848c0

Resources:
  # VPC and Networking
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-vpc"
        - Key: Environment
          Value: !Ref Environment

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-igw"
        - Key: Environment
          Value: !Ref Environment

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-public-subnet-1"
        - Key: Environment
          Value: !Ref Environment

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-public-subnet-2"
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr1
      AvailabilityZone: !Select [0, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-private-subnet-1"
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnetCidr2
      AvailabilityZone: !Select [1, !GetAZs ""]
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-private-subnet-2"
        - Key: Environment
          Value: !Ref Environment

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-public-rt"
        - Key: Environment
          Value: !Ref Environment

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-private-rt"
        - Key: Environment
          Value: !Ref Environment

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: Allow HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-alb-sg"
        - Key: Environment
          Value: !Ref Environment

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: Allow HTTP from ALB
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-ec2-sg"
        - Key: Environment
          Value: !Ref Environment

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS database
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref EC2SecurityGroup
          Description: Allow MySQL from EC2
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref LambdaSecurityGroup
          Description: Allow MySQL from Lambda
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-rds-sg"
        - Key: Environment
          Value: !Ref Environment

  LambdaSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId: !Ref VPC
      SecurityGroupEgress:
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: Allow HTTPS for AWS API calls
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          DestinationSecurityGroupId: !Ref RDSSecurityGroup
          Description: Allow MySQL to RDS
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-lambda-sg"
        - Key: Environment
          Value: !Ref Environment

  # IAM Roles
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy
      Policies:
        - PolicyName: !Sub "${AppName}-ec2-policy"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/webapp/${AppName}:*"
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt TurnAroundPromptTable.Arn
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-ec2-role"
        - Key: Environment
          Value: !Ref Environment

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  LambdaExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: !Sub "${AppName}-lambda-policy"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource: !Sub "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${AppName}-monitor:*"
              - Effect: Allow
                Action:
                  - cloudwatch:PutMetricData
                Resource: "*"
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:Query
                  - dynamodb:Scan
                Resource: !GetAtt TurnAroundPromptTable.Arn
              - Effect: Allow
                Action:
                  - rds:DescribeDBInstances
                Resource: !Sub "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:db:*"
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-lambda-role"
        - Key: Environment
          Value: !Ref Environment

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${AppName}-alb"
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-alb"
        - Key: Environment
          Value: !Ref Environment

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${AppName}-tg"
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /health
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-tg"
        - Key: Environment
          Value: !Ref Environment

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasHTTP
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasHTTPS
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !If
            - ShouldCreateCertificate
            - !Ref SSLCertificate
            - !Ref CertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  HTTPRedirectListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasHTTPS
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: "443"
            StatusCode: HTTP_301

  # SSL Certificate
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: ShouldCreateCertificate
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      SubjectAlternativeNames:
        - !Ref DomainName
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-cert"
        - Key: Environment
          Value: !Ref Environment

  # Launch Template and Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub "${AppName}-lt"
      LaunchTemplateData:
        ImageId: !FindInMap [RegionMap, !Ref "AWS::Region", AMI]
        InstanceType: t3.micro
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y amazon-cloudwatch-agent nginx
            
            # Configure Nginx
            cat > /etc/nginx/nginx.conf <<'EOF'
            user nginx;
            worker_processes auto;
            error_log /var/log/nginx/error.log;
            pid /run/nginx.pid;

            events {
                worker_connections 1024;
            }

            http {
                log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                                '$status $body_bytes_sent "$http_referer" '
                                '"$http_user_agent" "$http_x_forwarded_for"';

                access_log /var/log/nginx/access.log main;

                sendfile on;
                tcp_nopush on;
                tcp_nodelay on;
                keepalive_timeout 65;
                types_hash_max_size 2048;

                include /etc/nginx/mime.types;
                default_type application/octet-stream;

                server {
                    listen 80;
                    server_name _;

                    location /health {
                        access_log off;
                        return 200 "healthy\n";
                        add_header Content-Type text/plain;
                    }

                    location / {
                        root /usr/share/nginx/html;
                        index index.html;
                    }
                }
            }
            EOF

            # Create health check endpoint
            echo "healthy" > /usr/share/nginx/html/health

            # Start Nginx
            systemctl start nginx
            systemctl enable nginx

            # Configure CloudWatch Agent
            cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<'EOF'
            {
              "logs": {
                "logs_collected": {
                  "files": {
                    "collect_list": [
                      {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "/aws/webapp/${AppName}",
                        "log_stream_name": "{instance_id}/nginx-access"
                      },
                      {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "/aws/webapp/${AppName}",
                        "log_stream_name": "{instance_id}/nginx-error"
                      }
                    ]
                  }
                }
              }
            }
            EOF

            # Start CloudWatch Agent
            /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
              -a fetch-config \
              -m ec2 \
              -s \
              -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub "${AppName}-instance"
              - Key: Environment
                Value: !Ref Environment

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub "${AppName}-asg"
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 6
      DesiredCapacity: 2
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-asg-instance"
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref Environment
          PropagateAtLaunch: true

  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 60
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 60
      ScalingAdjustment: -1

  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale up if CPU > 70%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      AlarmActions:
        - !Ref ScaleUpPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: GreaterThanThreshold

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: Scale down if CPU < 30%
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      AlarmActions:
        - !Ref ScaleDownPolicy
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      ComparisonOperator: LessThanThreshold

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS database
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-db-subnet-group"
        - Key: Environment
          Value: !Ref Environment

  DatabasePasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub "${AppName}-${Environment}-db-password"
      Description: "Database password for TapApp RDS instance"
      SecretString: !Sub |
        {
          "username": "${DBUser}",
          "password": "${DatabasePassword}"
        }
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-db-password"
        - Key: Environment
          Value: !Ref Environment

  RDSDatabase:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBInstanceIdentifier: !Sub "${AppName}-db"
      Engine: mysql
      EngineVersion: "8.0.35"
      DBInstanceClass: !Ref DBInstanceClass
      AllocatedStorage: 20
      StorageType: gp3
      StorageEncrypted: true
      MasterUsername: !Ref DBUser
      MasterUserPassword: !Sub "{{resolve:secretsmanager:${AppName}-${Environment}-db-password:SecretString:password}}"
      DBName: !Ref DBName
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      PreferredBackupWindow: "03:00-04:00"
      PreferredMaintenanceWindow: "mon:04:00-mon:05:00"
      MultiAZ: false
      EnablePerformanceInsights: false
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-db"
        - Key: Environment
          Value: !Ref Environment

  # DynamoDB Table
  TurnAroundPromptTable:
    Type: AWS::DynamoDB::Table
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      TableName: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
      KeySchema:
        - AttributeName: id
          KeyType: HASH
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      Tags:
        - Key: Name
          Value: !Sub "TurnAroundPromptTable${EnvironmentSuffix}"
        - Key: Environment
          Value: !Ref Environment

  # Lambda Function
  MonitoringLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub "${AppName}-monitor"
      Runtime: python3.11
      Handler: index.lambda_handler
      Role: !GetAtt LambdaExecutionRole.Arn
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Environment:
        Variables:
          TABLE_NAME: !Ref TurnAroundPromptTable
          DB_HOST: !GetAtt RDSDatabase.Endpoint.Address
          DB_NAME: !Ref DBName
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime

          cloudwatch = boto3.client('cloudwatch')
          dynamodb = boto3.resource('dynamodb')

          def lambda_handler(event, context):
              table_name = os.environ['TABLE_NAME']
              table = dynamodb.Table(table_name)
              
              try:
                  response = table.scan(Select='COUNT')
                  item_count = response['Count']
                  
                  cloudwatch.put_metric_data(
                      Namespace='TapApp/Monitoring',
                      MetricData=[
                          {
                              'MetricName': 'DynamoDBItemCount',
                              'Value': item_count,
                              'Unit': 'Count',
                              'Timestamp': datetime.utcnow()
                          }
                      ]
                  )
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Monitoring complete',
                          'itemCount': item_count
                      })
                  }
              except Exception as e:
                  print(f"Error: {str(e)}")
                  return {
                      'statusCode': 500,
                      'body': json.dumps({'error': str(e)})
                  }
      Timeout: 60
      Tags:
        - Key: Name
          Value: !Sub "${AppName}-monitor"
        - Key: Environment
          Value: !Ref Environment

  LambdaScheduleRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub "${AppName}-monitor-schedule"
      Description: Trigger monitoring Lambda every 5 minutes
      ScheduleExpression: rate(5 minutes)
      State: ENABLED
      Targets:
        - Arn: !GetAtt MonitoringLambda.Arn
          Id: !Sub "${AppName}-monitor-target"

  LambdaSchedulePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref MonitoringLambda
      Action: lambda:InvokeFunction
      Principal: events.amazonaws.com
      SourceArn: !GetAtt LambdaScheduleRule.Arn

  # CloudWatch Log Groups
  WebAppLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/webapp/${AppName}"
      RetentionInDays: 7

  LambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub "/aws/lambda/${AppName}-monitor"
      RetentionInDays: 7

  # CloudWatch Dashboard
  MonitoringDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "${AppName}-dashboard"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                  [".", "RequestCount", {"stat": "Sum"}],
                  [".", "HTTPCode_Target_5XX_Count", {"stat": "Sum"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "ALB Metrics",
                "yAxis": {
                  "left": {
                    "label": "Count"
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "EC2 CPU Utilization",
                "yAxis": {
                  "left": {
                    "label": "Percent",
                    "min": 0,
                    "max": 100
                  }
                }
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                  [".", "DatabaseConnections", {"stat": "Average"}],
                  [".", "FreeStorageSpace", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "RDS Metrics"
              }
            },
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["TapApp/Monitoring", "DynamoDBItemCount", {"stat": "Average"}]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "DynamoDB Item Count"
              }
            }
          ]
        }

Outputs:
  TurnAroundPromptTableName:
    Description: Name of the DynamoDB table
    Value: !Ref TurnAroundPromptTable
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableName"

  TurnAroundPromptTableArn:
    Description: ARN of the DynamoDB table
    Value: !GetAtt TurnAroundPromptTable.Arn
    Export:
      Name: !Sub "${AWS::StackName}-TurnAroundPromptTableArn"

  StackName:
    Description: Name of this CloudFormation stack
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub "${AWS::StackName}-StackName"

  EnvironmentSuffix:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub "${AWS::StackName}-EnvironmentSuffix"

  Environment:
    Description: Environment name used for this deployment
    Value: !Ref Environment
    Export:
      Name: !Sub "${AWS::StackName}-Environment"

  ApplicationLoadBalancerDNS:
    Description: DNS name of the Application Load Balancer
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub "${AWS::StackName}-ApplicationLoadBalancerDNS"

  WebAppURL:
    Description: URL of the Application Load Balancer
    Value: !Sub "https://${ApplicationLoadBalancer.DNSName}"
    Export:
      Name: !Sub "${AWS::StackName}-WebAppURL"

  DatabaseEndpoint:
    Description: RDS Database Endpoint
    Value: !GetAtt RDSDatabase.Endpoint.Address
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseEndpoint"

  DatabasePort:
    Description: RDS Database Port
    Value: !GetAtt RDSDatabase.Endpoint.Port
    Export:
      Name: !Sub "${AWS::StackName}-DatabasePort"

  DatabaseName:
    Description: RDS Database Name
    Value: !Ref DBName
    Export:
      Name: !Sub "${AWS::StackName}-DatabaseName"

  DatabasePasswordSecretArn:
    Description: ARN of the Secrets Manager secret containing the database password
    Value: !Ref DatabasePasswordSecret
    Export:
      Name: !Sub "${AWS::StackName}-DatabasePasswordSecretArn"

  VPCId:
    Description: VPC ID where resources are deployed
    Value: !Ref VPC
    Export:
      Name: !Sub "${AWS::StackName}-VPCId"

  PublicSubnetIds:
    Description: Public subnet IDs for ALB
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PublicSubnetIds"

  PrivateSubnetIds:
    Description: Private subnet IDs for EC2 instances and RDS
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub "${AWS::StackName}-PrivateSubnetIds"

  SecurityGroupIds:
    Description: Security Group IDs for reference
    Value: !Join
      - ","
      - - !Ref ALBSecurityGroup
        - !Ref EC2SecurityGroup
        - !Ref RDSSecurityGroup
        - !Ref LambdaSecurityGroup
    Export:
      Name: !Sub "${AWS::StackName}-SecurityGroupIds"

  AutoScalingGroupName:
    Description: Name of the Auto Scaling Group
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub "${AWS::StackName}-AutoScalingGroupName"

  WebAppLogGroupName:
    Description: CloudWatch Logs Group for the web application
    Value: !Ref WebAppLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-WebAppLogGroupName"

  LambdaLogGroupName:
    Description: CloudWatch Logs Group for the Lambda function
    Value: !Ref LambdaLogGroup
    Export:
      Name: !Sub "${AWS::StackName}-LambdaLogGroupName"

  MonitoringLambdaArn:
    Description: ARN of the monitoring Lambda function
    Value: !GetAtt MonitoringLambda.Arn
    Export:
      Name: !Sub "${AWS::StackName}-MonitoringLambdaArn"

  DashboardURL:
    Description: CloudWatch Dashboard URL
    Value: !Sub "https://${AWS::Region}.console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AppName}-dashboard"
    Export:
      Name: !Sub "${AWS::StackName}-DashboardURL"

  SSLCertificateArnCreated:
    Description: ARN of the created SSL certificate (if applicable)
    Condition: ShouldCreateCertificate
    Value: !Ref SSLCertificate
    Export:
      Name: !Sub "${AWS::StackName}-SSLCertificateArnCreated"

  SSLCertificateArnProvided:
    Description: ARN of the provided SSL certificate (if applicable)
    Condition: HasCertificateArn
    Value: !Ref CertificateArn
    Export:
      Name: !Sub "${AWS::StackName}-SSLCertificateArnProvided"

  DomainName:
    Description: Domain name for the application (if provided)
    Condition: HasDomain
    Value: !Ref DomainName
    Export:
      Name: !Sub "${AWS::StackName}-DomainName"
```
