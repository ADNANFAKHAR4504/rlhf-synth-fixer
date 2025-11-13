### Reasoning Trace
---

This is a comprehensive request for a CloudFormation template for a fintech startup called PayFlow Solutions. Let me break down the requirements:

1. **High-level requirements**:
   - 50,000 daily transactions
   - 99.99% uptime
   - PCI DSS Level 1 compliance
   - Blue-green deployments with zero downtime
   - Weekly release cycles

2. **Infrastructure components needed**:
   - VPC across 3 availability zones
   - Application Load Balancer with:
     - Path-based routing
     - Weighted target groups for blue-green
     - Custom health checks every 30 seconds
     - 30-second deregistration delay
   - Auto Scaling Groups with:
     - Mixed instances policy (t3.medium, t3.large, m5.large)
     - Launch templates with IMDSv2 only
     - Scaling based on ALB request count (1000) and CPU (70%)
   - RDS Aurora PostgreSQL:
     - 1 writer, 2 reader replicas
     - Custom parameter group with pg_stat_statements
     - 7-day backup retention
     - KMS encryption
   - Route 53:
     - Hosted zone for api.payflow.io
     - Weighted routing (90% prod, 10% canary)
     - HTTPS health checks every 30 seconds
   - Security Groups:
     - ALB: ports 80/443 from internet
     - EC2: only from ALB
     - RDS: only from EC2 in private subnets
   - S3 bucket for ALB logs:
     - SSE with AWS managed keys
     - 90-day retention lifecycle
   - CloudWatch monitoring:
     - Composite alarms for error rate >1%, p99 >500ms, DB connections >80%
     - SNS integration
   - Systems Manager Parameter Store with prefix structure

Let me create a comprehensive CloudFormation template that addresses all these requirements.
### Answer 
---

I'll create a comprehensive CloudFormation template for PayFlow Solutions that addresses all your requirements for a highly available, secure, and scalable fintech infrastructure. This template implements blue-green deployments, multi-AZ resilience, and strict security controls.

## PayFlowInfraStack.yaml

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'PayFlow Solutions - Highly Available Fintech Infrastructure with Blue-Green Deployment'

Parameters:
  Environment:
    Type: String
    Default: production
    AllowedValues:
      - production
      - staging
    Description: Environment name
  
  DomainName:
    Type: String
    Default: api.payflow.io
    Description: Primary domain name for the application
  
  DBMasterUsername:
    Type: String
    Default: dbadmin
    NoEcho: true
    Description: Database master username
  
  DBMasterPassword:
    Type: String
    NoEcho: true
    MinLength: 16
    Description: Database master password (min 16 characters)
  
  PagerDutyEmail:
    Type: String
    Description: PagerDuty integration email for alerts
  
  KeyPairName:
    Type: AWS::EC2::KeyPair::KeyName
    Description: EC2 Key Pair for SSH access (emergency only)

Mappings:
  RegionConfig:
    us-east-1:
      AMI: ami-0e86e20dae9224db8  # Ubuntu 22.04 LTS
    us-west-2:
      AMI: ami-0aff18ec83b712f05  # Ubuntu 22.04 LTS
    eu-west-1:
      AMI: ami-0932dacac40965a65  # Ubuntu 22.04 LTS

Resources:
  # =====================================
  # VPC and Networking Infrastructure
  # =====================================
  
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-VPC'
        - Key: Environment
          Value: !Ref Environment

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-IGW'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  # Public Subnets (3 AZs)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.1.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Public-Subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.2.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Public-Subnet-2'

  PublicSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.3.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Public-Subnet-3'

  # Private Subnets for EC2 (3 AZs)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.11.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.12.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Subnet-2'

  PrivateSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.13.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Subnet-3'

  # Database Subnets (3 AZs)
  DBSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.21.0/24
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-Subnet-1'

  DBSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.22.0/24
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-Subnet-2'

  DBSubnet3:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: 10.0.23.0/24
      AvailabilityZone: !Select [2, !GetAZs '']
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-Subnet-3'

  # NAT Gateways for Private Subnets
  NATGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway2EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway3EIP:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway2EIP.AllocationId
      SubnetId: !Ref PublicSubnet2

  NATGateway3:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGateway3EIP.AllocationId
      SubnetId: !Ref PublicSubnet3

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Public-Routes'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PublicSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet1
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet2
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnet3
      RouteTableId: !Ref PublicRouteTable

  # Private Route Tables
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Routes-1'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway1

  PrivateSubnetRouteTableAssociation1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Routes-2'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway2

  PrivateSubnetRouteTableAssociation2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  PrivateRouteTable3:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Private-Routes-3'

  PrivateRoute3:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable3
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NATGateway3

  PrivateSubnetRouteTableAssociation3:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet3
      RouteTableId: !Ref PrivateRouteTable3

  # =====================================
  # Security Groups
  # =====================================
  
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
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-ALB-SG'

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
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref ALBSecurityGroup
        - IpProtocol: tcp
          FromPort: 8080
          ToPort: 8080
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-EC2-SG'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for RDS Aurora cluster
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-RDS-SG'

  # =====================================
  # S3 Bucket for ALB Logs
  # =====================================
  
  ALBLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'payflow-alb-logs-${AWS::AccountId}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-ALB-Logs'

  ALBLogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ALBLogsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowALBLogDelivery
            Effect: Allow
            Principal:
              Service: elasticloadbalancing.amazonaws.com
            Action:
              - s3:PutObject
            Resource: !Sub '${ALBLogsBucket.Arn}/*'

  # =====================================
  # Application Load Balancer
  # =====================================
  
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    DependsOn: ALBLogsBucketPolicy
    Properties:
      Name: !Sub 'PayFlow-${Environment}-ALB'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
        - !Ref PublicSubnet3
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: 'true'
        - Key: access_logs.s3.bucket
          Value: !Ref ALBLogsBucket
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - Key: routing.http2.enabled
          Value: 'true'
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-ALB'

  # Target Groups for Blue-Green Deployment
  BlueTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PayFlow-${Environment}-Blue-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health/deep
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      DeregistrationDelay: 30
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Blue-TG'
        - Key: Deployment
          Value: Blue

  GreenTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PayFlow-${Environment}-Green-TG'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health/deep
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      DeregistrationDelay: 30
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Green-TG'
        - Key: Deployment
          Value: Green

  WebhookTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'PayFlow-${Environment}-Webhook-TG'
      Port: 8080
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 10
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      DeregistrationDelay: 30
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Webhook-TG'

  # ALB Listeners
  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: 443
            StatusCode: HTTP_301
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          ForwardConfig:
            TargetGroups:
              - TargetGroupArn: !Ref BlueTargetGroup
                Weight: 100
              - TargetGroupArn: !Ref GreenTargetGroup
                Weight: 0
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref ALBCertificate

  # Listener Rules for Path-Based Routing
  WebhookListenerRule:
    Type: AWS::ElasticLoadBalancingV2::ListenerRule
    Properties:
      Actions:
        - Type: forward
          TargetGroupArn: !Ref WebhookTargetGroup
      Conditions:
        - Field: path-pattern
          PathPatternConfig:
            Values:
              - /webhooks/*
      ListenerArn: !Ref HTTPSListener
      Priority: 10

  # =====================================
  # ACM Certificate
  # =====================================
  
  ALBCertificate:
    Type: AWS::CertificateManager::Certificate
    Properties:
      DomainName: !Ref DomainName
      SubjectAlternativeNames:
        - !Sub '*.${DomainName}'
      ValidationMethod: DNS
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Certificate'

  # =====================================
  # IAM Roles and Instance Profiles
  # =====================================
  
  EC2Role:
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
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: ParameterStoreAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ssm:GetParameter
                  - ssm:GetParameters
                  - ssm:GetParameterHistory
                  - ssm:GetParametersByPath
                Resource: !Sub 'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/payflow/${Environment}/*'
        - PolicyName: KMSAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource: !GetAtt DatabaseKMSKey.Arn
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-EC2-Role'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2Role

  # =====================================
  # Launch Templates
  # =====================================
  
  BlueLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PayFlow-${Environment}-Blue-LT'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionConfig, !Ref 'AWS::Region', AMI]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required  # Enforce IMDSv2 only
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PayFlow-${Environment}-Blue-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Deployment
                Value: Blue
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install application dependencies
            apt-get install -y python3-pip nginx
            
            # Configure nginx for health checks
            cat > /etc/nginx/sites-available/default <<EOF
            server {
                listen 80;
                location /health/deep {
                    access_log off;
                    return 200 "Healthy";
                    add_header Content-Type text/plain;
                }
                location / {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                }
            }
            EOF
            
            systemctl restart nginx
            
            # Signal completion
            /opt/aws/bin/cfn-signal -e 0 --stack ${AWS::StackName} --resource BlueAutoScalingGroup --region ${AWS::Region}

  GreenLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PayFlow-${Environment}-Green-LT'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionConfig, !Ref 'AWS::Region', AMI]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required  # Enforce IMDSv2 only
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PayFlow-${Environment}-Green-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Deployment
                Value: Green
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install application dependencies
            apt-get install -y python3-pip nginx
            
            # Configure nginx for health checks
            cat > /etc/nginx/sites-available/default <<EOF
            server {
                listen 80;
                location /health/deep {
                    access_log off;
                    return 200 "Healthy";
                    add_header Content-Type text/plain;
                }
                location / {
                    proxy_pass http://localhost:8000;
                    proxy_set_header X-Real-IP \$remote_addr;
                    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
                    proxy_set_header Host \$http_host;
                }
            }
            EOF
            
            systemctl restart nginx
            
            # Signal completion
            /opt/aws/bin/cfn-signal -e 0 --stack ${AWS::StackName} --resource GreenAutoScalingGroup --region ${AWS::Region}

  WebhookLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'PayFlow-${Environment}-Webhook-LT'
      LaunchTemplateData:
        ImageId: !FindInMap [RegionConfig, !Ref 'AWS::Region', AMI]
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        KeyName: !Ref KeyPairName
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        MetadataOptions:
          HttpTokens: required  # Enforce IMDSv2 only
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'PayFlow-${Environment}-Webhook-Instance'
              - Key: Environment
                Value: !Ref Environment
              - Key: Service
                Value: Webhook
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            # Update system
            apt-get update && apt-get upgrade -y
            
            # Install CloudWatch Agent
            wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
            dpkg -i amazon-cloudwatch-agent.deb
            
            # Install webhook service dependencies
            apt-get install -y python3-pip
            
            # Create webhook service
            cat > /etc/systemd/system/webhook.service <<EOF
            [Unit]
            Description=PayFlow Webhook Service
            After=network.target
            
            [Service]
            Type=simple
            User=ubuntu
            WorkingDirectory=/opt/webhook
            ExecStart=/usr/bin/python3 /opt/webhook/server.py
            Restart=always
            
            [Install]
            WantedBy=multi-user.target
            EOF
            
            # Start health check endpoint on port 8080
            mkdir -p /opt/webhook
            cat > /opt/webhook/server.py <<EOF
            from http.server import HTTPServer, BaseHTTPRequestHandler
            
            class HealthHandler(BaseHTTPRequestHandler):
                def do_GET(self):
                    if self.path == '/health':
                        self.send_response(200)
                        self.end_headers()
                        self.wfile.write(b'Healthy')
            
            httpd = HTTPServer(('0.0.0.0', 8080), HealthHandler)
            httpd.serve_forever()
            EOF
            
            systemctl daemon-reload
            systemctl start webhook
            systemctl enable webhook

  # =====================================
  # Auto Scaling Groups
  # =====================================
  
  BlueAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'PayFlow-${Environment}-Blue-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: 3
      MaxSize: 15
      DesiredCapacity: 6
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref BlueTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref BlueLaunchTemplate
            Version: !GetAtt BlueLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: t3.medium
              WeightedCapacity: 1
            - InstanceType: t3.large
              WeightedCapacity: 2
            - InstanceType: m5.large
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 2
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Blue-ASG'
          PropagateAtLaunch: false

  GreenAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'PayFlow-${Environment}-Green-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: 0
      MaxSize: 15
      DesiredCapacity: 0
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref GreenTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref GreenLaunchTemplate
            Version: !GetAtt GreenLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: t3.medium
              WeightedCapacity: 1
            - InstanceType: t3.large
              WeightedCapacity: 2
            - InstanceType: m5.large
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 2
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Green-ASG'
          PropagateAtLaunch: false

  WebhookAutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'PayFlow-${Environment}-Webhook-ASG'
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
        - !Ref PrivateSubnet3
      MinSize: 3
      MaxSize: 9
      DesiredCapacity: 3
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      TargetGroupARNs:
        - !Ref WebhookTargetGroup
      MixedInstancesPolicy:
        LaunchTemplate:
          LaunchTemplateSpecification:
            LaunchTemplateId: !Ref WebhookLaunchTemplate
            Version: !GetAtt WebhookLaunchTemplate.LatestVersionNumber
          Overrides:
            - InstanceType: t3.medium
              WeightedCapacity: 1
            - InstanceType: t3.large
              WeightedCapacity: 2
        InstancesDistribution:
          OnDemandBaseCapacity: 1
          OnDemandPercentageAboveBaseCapacity: 50
          SpotAllocationStrategy: lowest-price
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Webhook-ASG'
          PropagateAtLaunch: false

  # Auto Scaling Policies
  BlueTargetTrackingCPU:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref BlueAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ASGAverageCPUUtilization
        TargetValue: 70

  BlueTargetTrackingALBRequests:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AutoScalingGroupName: !Ref BlueAutoScalingGroup
      PolicyType: TargetTrackingScaling
      TargetTrackingConfiguration:
        PredefinedMetricSpecification:
          PredefinedMetricType: ALBRequestCountPerTarget
          ResourceLabel: !Sub '${ApplicationLoadBalancer.LoadBalancerFullName}/${BlueTargetGroup.TargetGroupFullName}'
        TargetValue: 1000

  # =====================================
  # RDS Aurora PostgreSQL Cluster
  # =====================================
  
  DatabaseKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for PayFlow RDS encryption
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow RDS to use the key
            Effect: Allow
            Principal:
              Service: rds.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
            Resource: '*'

  DatabaseKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/payflow-${Environment}-rds'
      TargetKeyId: !Ref DatabaseKMSKey

  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for PayFlow Aurora cluster
      SubnetIds:
        - !Ref DBSubnet1
        - !Ref DBSubnet2
        - !Ref DBSubnet3
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-SubnetGroup'

  DBClusterParameterGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Description: Custom cluster parameter group for PayFlow Aurora PostgreSQL
      Family: aurora-postgresql14
      Parameters:
        shared_preload_libraries: pg_stat_statements
        pg_stat_statements.track: ALL
        log_statement: all
        log_min_duration_statement: 1000
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-ClusterParameterGroup'

  DBParameterGroup:
    Type: AWS::RDS::DBParameterGroup
    Properties:
      Description: Custom instance parameter group for PayFlow Aurora PostgreSQL
      Family: aurora-postgresql14
      Parameters:
        max_connections: 500
        shared_buffers: 2097152  # 16GB in 8KB pages
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-DB-ParameterGroup'

  AuroraDBCluster:
    Type: AWS::RDS::DBCluster
    Properties:
      DBClusterIdentifier: !Sub 'payflow-${Environment}-cluster'
      Engine: aurora-postgresql
      EngineVersion: '14.7'
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Ref DBMasterPassword
      DBSubnetGroupName: !Ref DBSubnetGroup
      DBClusterParameterGroupName: !Ref DBClusterParameterGroup
      VpcSecurityGroupIds:
        - !Ref RDSSecurityGroup
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '03:00-04:00'
      PreferredMaintenanceWindow: 'sun:04:00-sun:05:00'
      EnableCloudwatchLogsExports:
        - postgresql
      StorageEncrypted: true
      KmsKeyId: !Ref DatabaseKMSKey
      DeletionProtection: true
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Aurora-Cluster'

  AuroraDBInstance1:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'payflow-${Environment}-writer'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.r6g.xlarge
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-postgresql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Aurora-Writer'

  AuroraDBInstance2:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'payflow-${Environment}-reader-1'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.r6g.large
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-postgresql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Aurora-Reader-1'

  AuroraDBInstance3:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceIdentifier: !Sub 'payflow-${Environment}-reader-2'
      DBClusterIdentifier: !Ref AuroraDBCluster
      DBInstanceClass: db.r6g.large
      DBParameterGroupName: !Ref DBParameterGroup
      Engine: aurora-postgresql
      PubliclyAccessible: false
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-Aurora-Reader-2'

  # =====================================
  # Route 53 Configuration
  # =====================================
  
  HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      Tags:
        - Key: Name
          Value: !Sub 'PayFlow-${Environment}-HostedZone'

  # Production Record Set (90% weight)
  ProductionRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Production
      Weight: 90
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # Canary Record Set (10% weight)
  CanaryRecordSet:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref HostedZone
      Name: !Ref DomainName
      Type: A
      SetIdentifier: Canary
      Weight: 10
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # Route 53 Health Check
  PrimaryHealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      Type: HTTPS
      ResourcePath: /health/deep
      FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
      Port: 443
      RequestInterval: 30
      FailureThreshold: 3
      MeasureLatency: true
      AlarmIdentifier:
        Name: !Ref HealthCheckAlarm
        Region: !Ref AWS::Region

  # =====================================
  # SNS Topic for Alerts
  # =====================================
  
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'PayFlow-${Environment}-Alerts'
      DisplayName: PayFlow Infrastructure Alerts
      Subscription:
        - Endpoint: !Ref PagerDutyEmail
          Protocol: email

  # =====================================
  # CloudWatch Alarms
  # =====================================
  
  HealthCheckAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PayFlow-${Environment}-HealthCheck-Failed'
      AlarmDescription: Alert when Route53 health check fails
      MetricName: HealthCheckStatus
      Namespace: AWS/Route53
      Statistic: Minimum
      Period: 60
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: LessThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  ALBErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PayFlow-${Environment}-ALB-HighErrorRate'
      AlarmDescription: Alert when ALB error rate exceeds 1%
      Metrics:
        - Id: e1
          ReturnData: false
          Expression: m1+m2
        - Id: e2
          Expression: (e1/m3)*100
        - Id: m1
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: HTTPCode_Target_5XX_Count
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
        - Id: m2
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: HTTPCode_Target_4XX_Count
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
        - Id: m3
          ReturnData: false
          MetricStat:
            Metric:
              Namespace: AWS/ApplicationELB
              MetricName: RequestCount
              Dimensions:
                - Name: LoadBalancer
                  Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
            Period: 300
            Stat: Sum
      EvaluationPeriods: 2
      Threshold: 1
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  ALBLatencyP99Alarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PayFlow-${Environment}-ALB-HighP99Latency'
      AlarmDescription: Alert when P99 latency exceeds 500ms
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      ExtendedStatistic: p99
      Period: 300
      EvaluationPeriods: 2
      Threshold: 0.5
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  DatabaseConnectionsAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'PayFlow-${Environment}-DB-HighConnections'
      AlarmDescription: Alert when database connections exceed 80%
      MetricName: DatabaseConnections
      Namespace: AWS/RDS
      Dimensions:
        - Name: DBClusterIdentifier
          Value: !Ref AuroraDBCluster
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 400  # 80% of 500 max connections
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref AlertTopic

  CompositeAlarm:
    Type: AWS::CloudWatch::CompositeAlarm
    Properties:
      AlarmName: !Sub 'PayFlow-${Environment}-Critical-Service-Degradation'
      AlarmDescription: Composite alarm for critical service issues
      AlarmRule: !Sub |
        (ALARM("${ALBErrorRateAlarm}") AND ALARM("${ALBLatencyP99Alarm}"))
        OR ALARM("${DatabaseConnectionsAlarm}")
      ActionsEnabled: true
      AlarmActions:
        - !Ref AlertTopic

  # =====================================
  # Systems Manager Parameter Store
  # =====================================
  
  DatabaseEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/database/endpoint'
      Type: String
      Value: !GetAtt AuroraDBCluster.Endpoint.Address
      Description: Database cluster endpoint

  DatabaseReadEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/database/reader-endpoint'
      Type: String
      Value: !GetAtt AuroraDBCluster.ReaderEndpoint.Address
      Description: Database reader endpoint

  DatabasePortParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/database/port'
      Type: String
      Value: !GetAtt AuroraDBCluster.Endpoint.Port
      Description: Database port

  ALBEndpointParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/alb/endpoint'
      Type: String
      Value: !GetAtt ApplicationLoadBalancer.DNSName
      Description: Application Load Balancer endpoint

  BlueTargetGroupArnParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/deployment/blue/targetgroup'
      Type: String
      Value: !Ref BlueTargetGroup
      Description: Blue target group ARN

  GreenTargetGroupArnParameter:
    Type: AWS::SSM::Parameter
    Properties:
      Name: !Sub '/payflow/${Environment}/deployment/green/targetgroup'
      Type: String
      Value: !Ref GreenTargetGroup
      Description: Green target group ARN

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPC'

  ALBDNSName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALB-DNS'

  DatabaseClusterEndpoint:
    Description: Aurora Cluster Writer Endpoint
    Value: !GetAtt AuroraDBCluster.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Endpoint'

  DatabaseReaderEndpoint:
    Description: Aurora Cluster Reader Endpoint
    Value: !GetAtt AuroraDBCluster.ReaderEndpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-DB-Reader-Endpoint'

  HostedZoneId:
    Description: Route 53 Hosted Zone ID
    Value: !Ref HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZone'

  AlertTopicArn:
    Description: SNS Alert Topic ARN
    Value: !Ref AlertTopic
    Export:
      Name: !Sub '${AWS::StackName}-AlertTopic'

  ALBLogsBucketName:
    Description: S3 Bucket for ALB Access Logs
    Value: !Ref ALBLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-ALBLogsBucket'

  BlueAutoScalingGroupName:
    Description: Blue Auto Scaling Group Name
    Value: !Ref BlueAutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-Blue-ASG'

  GreenAutoScalingGroupName:
    Description: Green Auto Scaling Group Name
    Value: !Ref GreenAutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-Green-ASG'
```

## Key Features Implemented

### 1. **High Availability Architecture**
- Multi-AZ deployment across 3 availability zones
- Separate NAT gateways per AZ for redundancy
- Auto Scaling Groups with mixed instance policies

### 2. **Blue-Green Deployment Support**
- Weighted target groups (100% blue, 0% green initially)
- Separate launch templates and ASGs for blue/green environments
- 30-second deregistration delay for graceful connection draining

### 3. **Security Best Practices**
- IMDSv2 enforcement on all EC2 instances
- Principle of least privilege security groups
- KMS encryption for RDS
- S3 bucket encryption for ALB logs
- Private subnets for compute and database tiers

### 4. **Database Configuration**
- Aurora PostgreSQL cluster with 1 writer and 2 readers
- Custom parameter group with pg_stat_statements enabled
- 7-day backup retention
- KMS encryption at rest

### 5. **Monitoring and Alerting**
- Composite alarms for critical metrics
- Error rate, P99 latency, and database connection monitoring
- SNS integration for PagerDuty alerts
- Route 53 health checks with HTTPS endpoints

### 6. **Configuration Management**
- Systems Manager Parameter Store with prefix structure
- Organized parameter hierarchy for different components

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   # Set up AWS CLI and configure credentials
   aws configure
   
   # Create an EC2 key pair for emergency access
   aws ec2 create-key-pair --key-name payflow-keypair
   ```

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name PayFlowInfraStack \
     --template-body file://PayFlowInfraStack.yaml \
     --parameters \
       ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
       ParameterKey=PagerDutyEmail,ParameterValue=your-pagerduty@example.com \
       ParameterKey=KeyPairName,ParameterValue=payflow-keypair \
     --capabilities CAPABILITY_IAM
   ```

3. **Monitor deployment**:
   ```bash
   aws cloudformation wait stack-create-complete --stack-name PayFlowInfraStack
   ```

## Blue-Green Deployment Process

To perform a blue-green deployment:

1. **Update Green environment** with new application version
2. **Scale up Green ASG** to desired capacity
3. **Gradually shift traffic** by updating listener rule weights
4. **Monitor metrics** for errors and latency
5. **Complete cutover** or rollback based on performance

This infrastructure provides the robust, scalable, and secure foundation required for PayFlow Solutions' fintech platform while maintaining compliance and supporting continuous deployment practices.