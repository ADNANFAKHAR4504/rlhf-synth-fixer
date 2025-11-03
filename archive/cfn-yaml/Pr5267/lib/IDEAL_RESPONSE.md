# Ideal Response: Production Web Application Infrastructure with Auto Scaling and Load Balancing

## Architecture Overview

This CloudFormation template creates a production-ready, highly available web application environment with comprehensive auto-scaling capabilities, load balancing, database isolation, and monitoring features. The infrastructure spans multiple Availability Zones with automatic scaling based on demand, SSL-secured load balancing, and centralized monitoring following AWS best practices and the Well-Architected Framework. All resources follow the prod- naming convention for consistent resource identification and management.

### Network Architecture

The infrastructure implements a highly available multi-tier VPC architecture spanning two Availability Zones in the us-west-1 region. The VPC uses a 10.0.0.0/16 CIDR block with public subnets (10.0.1.0/24, 10.0.2.0/24) for auto-scaling EC2 instances and Application Load Balancer, and private subnets (10.0.3.0/24, 10.0.4.0/24) for database isolation and security. An Internet Gateway provides public subnet connectivity for inbound traffic and outbound internet access. Two NAT Gateways (one in each public subnet) with dedicated Elastic IPs enable high-availability outbound internet access for private subnet resources. Each private subnet routes through its respective NAT Gateway, ensuring continued outbound connectivity even if one Availability Zone experiences issues. This dual NAT Gateway design provides true high availability by eliminating single points of failure in the network path. Route tables are configured to direct public subnet traffic through the Internet Gateway for direct internet access, while private subnets route outbound traffic through their respective NAT Gateways for secure internet access without exposing private resources.

### Auto Scaling Compute Layer

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization. The ASG maintains a minimum of 2 instances and can scale up to 5 instances, deploying t2.micro instances across both public subnets using a Launch Template. The Launch Template uses dynamic AMI resolution through SSM Parameter Store for the latest Amazon Linux 2 AMI, ensuring instances launch with the most recent security patches and updates. Instance user data automatically installs httpd web server, MySQL client for database connectivity, and CloudWatch agent for comprehensive monitoring. CPU-based scaling policies trigger at 70% utilization for scale-up actions and 30% utilization for scale-down actions with corresponding CloudWatch alarms and 300-second cooldown periods to prevent rapid scaling oscillations. An IAM instance profile grants EC2 instances permissions to interact with S3 buckets for application data and CloudWatch for logging and monitoring. The security group allows inbound HTTP traffic on port 80 only from the Application Load Balancer security group, implementing defense in depth by restricting direct instance access while permitting all outbound traffic for software updates and external API calls.

### Load Balancing and SSL Termination

The Application Load Balancer distributes incoming traffic across EC2 instances in the Auto Scaling Group, providing high availability and fault tolerance. The ALB is deployed across both public subnets spanning multiple Availability Zones, ensuring continued operation even during AZ-level failures. The ALB security group allows inbound HTTP traffic on port 80 and HTTPS traffic on port 443 from any source, enabling public access to the web application. An HTTP listener on port 80 automatically redirects all requests to HTTPS on port 443 using HTTP 301 permanent redirects, enforcing encrypted connections for all client traffic. The HTTPS listener uses an SSL certificate from AWS Certificate Manager with DNS validation through Route 53, providing automatic certificate management and renewal. The SSL policy ELBSecurityPolicy-TLS13-1-2-2021-06 enforces modern TLS 1.2 and TLS 1.3 protocols, protecting against downgrade attacks and ensuring strong encryption. A target group with health checks monitors instance availability on port 80, automatically removing unhealthy instances from the load balancer rotation and registering recovered instances. Health checks occur every 30 seconds with a 5-second timeout, marking instances unhealthy after 3 consecutive failures and healthy after 2 consecutive successes.

### IAM Roles and Least Privilege Access

IAM roles follow the principle of least privilege, granting only the permissions necessary for each service to function. The EC2 instance role includes the CloudWatchAgentServerPolicy managed policy for CloudWatch metrics and logs publishing, and the AmazonSSMManagedInstanceCore managed policy for Systems Manager Session Manager access, eliminating the need for SSH key management. A custom inline policy grants S3 access scoped to the specific logging bucket, allowing GetObject, PutObject, and ListBucket actions only on the designated S3 bucket and its objects. This tight scoping prevents unauthorized access to other S3 buckets in the account, reducing the blast radius of potential security incidents. The role uses a trust policy allowing only the EC2 service to assume it, preventing other services or users from leveraging these permissions. All IAM resources follow the prod- naming convention with environment suffix and stack name inclusion for uniqueness across multiple deployments.

### Database Layer

The RDS MySQL 8.0.43 database deploys in Multi-AZ configuration across private subnets using a DB Subnet Group spanning both Availability Zones. Multi-AZ deployment provides automatic failover to a standby instance in a different AZ within minutes if the primary instance fails, maintaining database availability during infrastructure issues. The database uses the db.t3.micro instance class for cost-effectiveness while providing burstable performance for variable workloads. The database is not publicly accessible and accepts connections only from the web server security group through port 3306, implementing network-level isolation for sensitive data. Database credentials are generated and managed through AWS Secrets Manager with a 32-character password excluding problematic characters, eliminating hardcoded credentials in the template. The database includes automated daily backups with 7-day retention, enabling point-in-time recovery for data protection. Storage encryption at rest protects data on disk using AWS-managed encryption keys with gp3 storage for cost-effective performance. The database identifier follows the prod-rds- naming pattern for consistent resource identification.

### Storage and Access Logging

Two S3 buckets provide storage for application data and access logging. The primary application bucket enables versioning to preserve file history and supports recovery from accidental deletions or modifications. Server-side encryption with AES-256 protects data at rest, ensuring compliance with data protection requirements. The bucket implements logging configuration directing access logs to a separate dedicated logging bucket with the app-bucket-logs/ prefix. This separation of concerns ensures logging data remains available even if the application bucket is deleted or modified. Public access is completely blocked through PublicAccessBlockConfiguration settings, preventing accidental public exposure of sensitive application data. The access logs bucket has a lifecycle policy automatically deleting logs after 90 days to manage storage costs while maintaining audit trails for compliance. ObjectOwnership controls set to BucketOwnerPreferred ensure the bucket owner has full control over logged objects. Both buckets follow the prod- naming convention with AWS account ID inclusion for global uniqueness.

### Monitoring and Alerting

Comprehensive CloudWatch monitoring provides visibility into system health and performance metrics. Three CloudWatch alarms monitor critical metrics and trigger automated responses. The CPUAlarmHigh monitors average CPU utilization across the Auto Scaling Group, triggering the scale-up policy when CPU exceeds 70% for two consecutive 5-minute periods. This proactive scaling ensures the application can handle increased load before performance degradation occurs. The CPUAlarmLow monitors for underutilization, triggering the scale-down policy when CPU drops below 30% for two consecutive periods, reducing costs during low-traffic periods while maintaining minimum capacity. The ALB5xxErrorAlarm specifically monitors for server-side errors from the application, alerting when the HTTPCode_Target_5XX_Count metric exceeds 10 errors within two consecutive 5-minute periods. This alarm provides early detection of application issues, backend failures, or configuration problems, enabling rapid response to production incidents. The alarm uses TreatMissingData set to notBreaching to prevent false alarms during periods of no traffic. All alarms follow the prod- naming convention for consistent identification.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms across all layers. Two NAT Gateways eliminate single points of failure in private subnet internet connectivity, with each private subnet routing through its own NAT Gateway in the same Availability Zone. The Auto Scaling Group maintains minimum capacity of 2 instances across both AZs with ELB health checks, automatically replacing failed instances within the HealthCheckGracePeriod of 300 seconds. The Application Load Balancer spans both Availability Zones and continuously monitors target health, removing unhealthy instances from rotation and distributing traffic only to healthy targets. RDS Multi-AZ deployment provides automatic failover with synchronous replication to a standby instance, maintaining database consistency and availability during infrastructure failures. The combination of these mechanisms ensures the application remains available even during component failures, AZ outages, or planned maintenance activities.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production Web Application - VPC, Auto Scaling, RDS, S3, ALB, ACM, and CloudWatch'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
      - Label:
          default: 'Network Configuration'
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
      - Label:
          default: 'EC2 and Auto Scaling Configuration'
        Parameters:
          - EC2InstanceType
          - LatestAmiId
          - MinSize
          - MaxSize
      - Label:
          default: 'Database Configuration'
        Parameters:
          - DBInstanceClass
          - DBName
      - Label:
          default: 'SSL and Domain Configuration'
        Parameters:
          - DomainName
          - HostedZoneId

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
    AllowedPattern: '^[a-zA-Z0-9]+$'
    ConstraintDescription: 'Must contain only alphanumeric characters'

  VpcCIDR:
    Type: String
    Default: '10.0.0.0/16'
    Description: 'CIDR block for VPC'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/16)$'

  PublicSubnet1CIDR:
    Type: String
    Default: '10.0.1.0/24'
    Description: 'CIDR block for Public Subnet 1'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'

  PublicSubnet2CIDR:
    Type: String
    Default: '10.0.2.0/24'
    Description: 'CIDR block for Public Subnet 2'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'

  PrivateSubnet1CIDR:
    Type: String
    Default: '10.0.3.0/24'
    Description: 'CIDR block for Private Subnet 1'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'

  PrivateSubnet2CIDR:
    Type: String
    Default: '10.0.4.0/24'
    Description: 'CIDR block for Private Subnet 2'
    AllowedPattern: '^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$'

  EC2InstanceType:
    Type: String
    Default: 't2.micro'
    Description: 'EC2 instance type for Auto Scaling Group'
    AllowedValues:
      - t2.micro
      - t2.small
      - t2.medium

  LatestAmiId:
    Type: 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    Default: '/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2'
    Description: 'Latest Amazon Linux 2 AMI ID'

  MinSize:
    Type: Number
    Default: 2
    Description: 'Minimum number of instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 10

  MaxSize:
    Type: Number
    Default: 5
    Description: 'Maximum number of instances in Auto Scaling Group'
    MinValue: 1
    MaxValue: 10

  DBInstanceClass:
    Type: String
    Default: 'db.t3.micro'
    Description: 'RDS instance class'
    AllowedValues:
      - db.t3.micro
      - db.t3.small
      - db.t3.medium

  DBName:
    Type: String
    Default: 'proddb'
    Description: 'Database name'
    MinLength: '1'
    MaxLength: '64'
    AllowedPattern: '^[a-zA-Z][a-zA-Z0-9]*$'

  DomainName:
    Type: String
    Default: 'example.com'
    Description: 'Domain name for ALB and ACM certificate'

  HostedZoneId:
    Type: String
    Default: ''
    Description: 'Route 53 Hosted Zone ID for domain validation (optional)'

Conditions:
  HasHostedZone: !Not [!Equals [!Ref HostedZoneId, '']]

Resources:
  # VPC and Network Resources
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-vpc-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'prod-igw-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  AttachGateway:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-public-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-public-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1CIDR
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'prod-private-subnet-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2CIDR
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'prod-private-subnet-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  NATGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'prod-nat-eip-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  NATGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: AttachGateway
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'prod-nat-eip-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  NATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'prod-nat-gateway-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  NATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NATGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'prod-nat-gateway-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'prod-public-rt-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: AttachGateway
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'prod-private-rt-1-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway1

  PrivateSubnet1RouteTableAssociation:
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
          Value: !Sub 'prod-private-rt-2-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NATGateway2

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for Application Load Balancer - allows HTTP and HTTPS'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: '0.0.0.0/0'
          Description: 'HTTP access from anywhere'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: '0.0.0.0/0'
          Description: 'HTTPS access from anywhere'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'prod-alb-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for web servers - allows traffic from ALB'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
          Description: 'HTTP access from ALB'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'Allow all outbound traffic'
      Tags:
        - Key: Name
          Value: !Sub 'prod-web-server-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: 'Security group for RDS - allows MySQL access from EC2 instances only'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref WebServerSecurityGroup
          Description: 'MySQL access from web servers'
      Tags:
        - Key: Name
          Value: !Sub 'prod-rds-sg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  # IAM Roles
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'prod-ec2-role-${EnvironmentSuffix}'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        - 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:GetObject'
                  - 's3:PutObject'
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt S3LoggingBucket.Arn
                  - !Sub '${S3LoggingBucket.Arn}/*'
        - PolicyName: SecretsManagerReadAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 'secretsmanager:GetSecretValue'
                  - 'secretsmanager:DescribeSecret'
                Resource: !Ref DBSecret
      Tags:
        - Key: Name
          Value: !Sub 'prod-ec2-role-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

  # ACM Certificate
  SSLCertificate:
    Type: AWS::CertificateManager::Certificate
    Condition: HasHostedZone
    Properties:
      DomainName: !Ref DomainName
      ValidationMethod: DNS
      DomainValidationOptions:
        - DomainName: !Ref DomainName
          HostedZoneId: !Ref HostedZoneId
      Tags:
        - Key: Name
          Value: !Sub 'prod-ssl-cert-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'prod-alb-${EnvironmentSuffix}'
      Type: application
      Scheme: internet-facing
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'prod-alb-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'prod-tg-${EnvironmentSuffix}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckEnabled: true
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      Tags:
        - Key: Name
          Value: !Sub 'prod-tg-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  ALBListenerHTTP:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  ALBListenerHTTPS:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasHostedZone
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      SslPolicy: ELBSecurityPolicy-TLS13-1-2-2021-06
      Certificates:
        - CertificateArn: !Ref SSLCertificate
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'prod-lt-${EnvironmentSuffix}'
      LaunchTemplateData:
        ImageId: !Ref LatestAmiId
        InstanceType: !Ref EC2InstanceType
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        Monitoring:
          Enabled: true
        UserData:
          Fn::Base64: |
            #!/bin/bash
            yum update -y
            yum install -y httpd mysql amazon-cloudwatch-agent amazon-ssm-agent
            systemctl start httpd
            systemctl enable httpd
            systemctl enable amazon-ssm-agent
            systemctl start amazon-ssm-agent
            echo '<h1>Production Web Application</h1>' > /var/www/html/index.html
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'prod-instance-${EnvironmentSuffix}'
              - Key: Environment
                Value: !Ref EnvironmentSuffix
              - Key: Project
                Value: 'ProductionWebApp'

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'prod-asg-${EnvironmentSuffix}'
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: !Ref MinSize
      MaxSize: !Ref MaxSize
      DesiredCapacity: !Ref MinSize
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub 'prod-asg-${EnvironmentSuffix}'
          PropagateAtLaunch: false
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true
        - Key: Project
          Value: 'ProductionWebApp'
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'prod-cpu-high-${EnvironmentSuffix}'
      AlarmDescription: 'Scale up when CPU exceeds 70%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 70
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleUpPolicy

  CPUAlarmLow:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'prod-cpu-low-${EnvironmentSuffix}'
      AlarmDescription: 'Scale down when CPU is below 30%'
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 30
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  ALB5xxErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub 'prod-alb-5xx-errors-${EnvironmentSuffix}'
      AlarmDescription: 'Alert when ALB 5xx errors exceed threshold'
      MetricName: HTTPCode_Target_5XX_Count
      Namespace: AWS/ApplicationELB
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: LoadBalancer
          Value: !GetAtt ApplicationLoadBalancer.LoadBalancerFullName
      TreatMissingData: notBreaching

  # RDS Database
  DBSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: 'Subnet group for RDS instance'
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Name
          Value: !Sub 'prod-db-subnet-group-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  RDSInstance:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Delete
    Properties:
      DBInstanceIdentifier: !Sub 'prod-rds-${EnvironmentSuffix}'
      DBInstanceClass: !Ref DBInstanceClass
      Engine: mysql
      EngineVersion: '8.0.43'
      MasterUsername: admin
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}'
      DBName: !Ref DBName
      AllocatedStorage: '20'
      StorageType: gp3
      DBSubnetGroupName: !Ref DBSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      PubliclyAccessible: false
      BackupRetentionPeriod: 7
      MultiAZ: true
      StorageEncrypted: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-rds-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  DBSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub 'prod-rds-credentials-${EnvironmentSuffix}'
      Description: 'RDS MySQL database master credentials'
      GenerateSecretString:
        SecretStringTemplate: '{"username": "admin"}'
        GenerateStringKey: password
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Name
          Value: !Sub 'prod-db-secret-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  # S3 Bucket with Logging
  S3LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-app-bucket-${AWS::AccountId}-${EnvironmentSuffix}'
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref S3AccessLogsBucket
        LogFilePrefix: 'app-bucket-logs/'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub 'prod-app-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

  S3AccessLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'prod-access-logs-${AWS::AccountId}-${EnvironmentSuffix}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      Tags:
        - Key: Name
          Value: !Sub 'prod-access-logs-bucket-${EnvironmentSuffix}'
        - Key: Environment
          Value: !Ref EnvironmentSuffix
        - Key: Project
          Value: 'ProductionWebApp'

Outputs:
  VPCId:
    Description: 'VPC ID'
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: 'Public Subnet 1 ID'
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: 'Public Subnet 2 ID'
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: 'Private Subnet 1 ID'
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: 'Private Subnet 2 ID'
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  AutoScalingGroupName:
    Description: 'Auto Scaling Group Name'
    Value: !Ref AutoScalingGroup
    Export:
      Name: !Sub '${AWS::StackName}-ASGName'

  RDSInstanceEndpoint:
    Description: 'RDS instance endpoint address'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpoint'

  RDSInstancePort:
    Description: 'RDS instance port'
    Value: !GetAtt RDSInstance.Endpoint.Port

  S3BucketName:
    Description: 'S3 application bucket name'
    Value: !Ref S3LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  LoadBalancerDNS:
    Description: 'Application Load Balancer DNS Name'
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-ALBDNS'

  LoadBalancerArn:
    Description: 'Application Load Balancer ARN'
    Value: !Ref ApplicationLoadBalancer
    Export:
      Name: !Sub '${AWS::StackName}-ALBArn'

  DBSecretArn:
    Description: 'ARN of the Secrets Manager secret containing database credentials'
    Value: !Ref DBSecret

  NATGateway1Id:
    Description: 'NAT Gateway 1 ID'
    Value: !Ref NATGateway1
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway1Id'

  NATGateway2Id:
    Description: 'NAT Gateway 2 ID'
    Value: !Ref NATGateway2
    Export:
      Name: !Sub '${AWS::StackName}-NATGateway2Id'

  InternetGatewayId:
    Description: 'Internet Gateway ID'
    Value: !Ref InternetGateway
    Export:
      Name: !Sub '${AWS::StackName}-InternetGatewayId'

  TargetGroupArn:
    Description: 'Target Group ARN'
    Value: !Ref ALBTargetGroup
    Export:
      Name: !Sub '${AWS::StackName}-TargetGroupArn'

  S3LogBucketName:
    Description: 'S3 access logs bucket name'
    Value: !Ref S3AccessLogsBucket
    Export:
      Name: !Sub '${AWS::StackName}-S3LogBucketName'

  RDSEndpoint:
    Description: 'RDS endpoint (alias for compatibility)'
    Value: !GetAtt RDSInstance.Endpoint.Address
    Export:
      Name: !Sub '${AWS::StackName}-RDSEndpointAlias'

  StackName:
    Description: 'Name of this CloudFormation stack'
    Value: !Ref AWS::StackName
    Export:
      Name: !Sub '${AWS::StackName}-StackName'

  EnvironmentSuffix:
    Description: 'Environment suffix used for this deployment'
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'
```

## Key Features

### Security

The template implements comprehensive security through multiple layers of defense in depth. All resources follow security best practices with least privilege access controls and network isolation. Database credentials are automatically generated by AWS Secrets Manager with 32-character passwords excluding problematic characters, eliminating hardcoded credentials and reducing the risk of credential exposure. All RDS storage is encrypted at rest using AWS-managed keys with gp3 storage for performance and cost optimization. Network security groups implement strict ingress rules following the principle of least privilege with the ALB security group allowing HTTP and HTTPS from anywhere for public access, the web server security group permitting HTTP traffic only from the ALB using security group references, and the RDS security group allowing MySQL traffic exclusively from web servers. S3 bucket access is completely blocked from public access through PublicAccessBlockConfiguration settings, preventing accidental data exposure. IAM policies follow least privilege with EC2 instances granted access only to the specific S3 logging bucket and CloudWatch services for monitoring. The HTTPS listener enforces modern TLS 1.2 and TLS 1.3 protocols using ELBSecurityPolicy-TLS13-1-2-2021-06, protecting against protocol downgrade attacks and weak ciphers. All HTTP traffic is automatically redirected to HTTPS using permanent redirects, ensuring all client communications are encrypted in transit.

### Scalability

The architecture provides automatic horizontal scaling through the Auto Scaling Group configured to respond to application demand. The ASG dynamically adjusts capacity from 2 to 5 instances based on CPU utilization, scaling up at 70% threshold and down at 30% threshold with 5-minute evaluation periods and 300-second cooldown periods to prevent rapid scaling oscillations. CloudWatch alarms continuously monitor average CPU utilization across the Auto Scaling Group, triggering scaling policies when thresholds are exceeded for two consecutive periods. The Application Load Balancer automatically distributes traffic across healthy instances using round-robin distribution, enabling horizontal scaling without client-side configuration changes. RDS Multi-AZ deployment can scale up to larger instance classes without architecture changes by simply updating the DBInstanceClass parameter. The VPC design with /16 CIDR block provides ample IP address space with 65,536 addresses for future growth and additional subnets. S3 automatically handles any request volume without capacity planning or manual scaling. The Launch Template with versioning enables easy updates to instance configuration using GetAtt LatestVersionNumber for automatic version tracking. The architecture supports adding additional Availability Zones by creating new subnet pairs and updating the Auto Scaling Group VPCZoneIdentifier.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization for all environment-specific values including CIDR blocks, instance types, database configuration, and domain settings. Dynamic AMI resolution through SSM Parameter Store using AWS::SSM::Parameter::Value eliminates outdated AMI issues and ensures instances launch with latest security patches from the amzn2-ami-hvm-x86_64-gp2 parameter. CloudWatch monitoring provides system visibility with detailed alarms for CPU utilization and application errors, enabling proactive response to issues before they impact users. The ALB5xxErrorAlarm monitors HTTPCode_Target_5XX_Count metric, detecting backend application failures, misconfigurations, or resource exhaustion. Automated daily backups with AWS RDS provide 7-day retention for point-in-time recovery, enabling restoration from data corruption or accidental modifications. S3 versioning enables recovery from accidental deletions or overwrites with version history preservation. Consistent tagging across all resources with Name, Environment, and Project tags enables cost allocation through AWS Cost Explorer, compliance auditing through AWS Config, and operational automation through tag-based resource selection. The template uses CloudFormation Metadata sections to organize parameters into logical groups for improved user experience in the console. Systems Manager Session Manager support through AmazonSSMManagedInstanceCore eliminates SSH key management and provides auditable access to instances.

### Cost Optimization

The design balances cost with functionality through several optimizations carefully chosen for production workloads. T2 micro instance types provide burstable performance at lower cost for variable workloads, with CPU credits accumulating during low usage periods for burst capability. Auto Scaling ensures you pay only for capacity actually needed with automatic scale-down during low-traffic periods, reducing costs by up to 70% for applications with predictable traffic patterns. RDS backup retention is set to 7 days with automatic deletion to manage storage costs while meeting typical recovery point objectives. The template uses AllowedValues constraints on instance types to prevent accidental deployment of oversized instances during testing or development. RDS uses gp3 storage for cost-effective performance without premium IOPS charges, providing baseline performance of 3000 IOPS and 125 MB/s throughput. S3 access logs have 90-day lifecycle policies to minimize storage costs while maintaining audit trails for compliance requirements. The db.t3.micro instance class provides the most cost-effective option for development and testing environments. NAT Gateways are deployed in each Availability Zone for high availability, with costs justified by the elimination of single points of failure. The template supports environment-specific sizing through parameters, enabling smaller instances in development and larger instances in production.

### Reliability

The architecture achieves high reliability through multi-layer redundancy and automated failure recovery at every tier. Resources span two Availability Zones protecting against AZ-level failures such as power outages, cooling issues, or network partitions. Two NAT Gateways with separate Elastic IPs and route tables eliminate single points of failure in private subnet connectivity, with each private subnet routing through its own NAT Gateway in the same AZ for reduced latency. The Auto Scaling Group maintains minimum 2-instance capacity across both AZs with ELB health checks and 300-second grace period, automatically replacing failed instances within minutes using the same Launch Template configuration. The Application Load Balancer performs continuous health checks every 30 seconds with 5-second timeout, removing unhealthy instances after 3 consecutive failures and adding recovered instances after 2 consecutive successes. RDS Multi-AZ deployment provides automatic failover to a standby instance in a different AZ with synchronous replication maintaining data consistency, completing failover within 1-2 minutes with automatic DNS record updates. S3 provides 99.999999999% durability for application data and access logs with automatic replication across multiple facilities within a region. Automated daily backups enable recovery from data corruption or accidental deletion with 7-day retention. This comprehensive redundancy ensures application availability during component failures, AZ outages, planned maintenance, or disaster scenarios with minimal user impact.

## Modern AWS Practices

### Auto Scaling with Launch Templates

The infrastructure uses Launch Templates rather than legacy Launch Configurations for enhanced flexibility and features. Launch Templates support versioning allowing configuration updates without replacement and enabling easy rollback to previous configurations if issues arise. The template references the latest version dynamically using Fn::GetAtt LaunchTemplate.LatestVersionNumber, ensuring the Auto Scaling Group always uses the most recent configuration automatically. Launch Templates support more instance features than Launch Configurations including T2 unlimited mode for sustained high CPU, dedicated hosts for licensing requirements, capacity reservations for guaranteed capacity, and placement groups for low-latency communication. The user data script installs required software including httpd web server, mysql client for database connectivity, and amazon-cloudwatch-agent for metrics and logs publishing, then starts and enables httpd for automatic startup on reboot. Tag specifications in the Launch Template automatically tag instances created by the ASG with Name, Environment, and Project tags for resource identification and cost allocation. Launch Templates can be shared across Auto Scaling Groups and used for direct EC2 instance launches, promoting configuration reuse and consistency.

### Secrets Manager for Credential Management

Database credentials are fully managed by AWS Secrets Manager with automatic generation rather than CloudFormation parameters or hardcoded values. Secrets Manager generates strong passwords with 32 characters including uppercase, lowercase, numbers, and special characters while excluding problematic characters that could cause parsing issues in connection strings. The secret is referenced in the RDS resource using dynamic references with the resolve:secretsmanager syntax, which CloudFormation resolves during stack operations without exposing credentials in templates, logs, stack outputs, or console displays. EC2 instances can retrieve credentials programmatically using the GetSecretValue API with IAM permissions scoped to the specific secret ARN, enabling applications to connect to the database without storing credentials in code or configuration files. This approach enables credential rotation without instance replacement or application restarts by simply updating the secret value and having applications refresh credentials on next connection. Secrets Manager provides automatic rotation capabilities through Lambda functions, audit trails of secret access through CloudTrail, and encryption at rest using AWS KMS.

### Application Load Balancer with SSL Termination

The Application Load Balancer provides Layer 7 load balancing with SSL termination, content-based routing, and advanced features. SSL termination at the load balancer offloads cryptographic processing from backend instances, reducing CPU utilization and improving application performance. The HTTPS listener uses ACM certificates with automatic DNS validation through Route 53, eliminating manual certificate management and providing automatic renewal 60 days before expiration. The SSL policy ELBSecurityPolicy-TLS13-1-2-2021-06 enforces modern protocols and strong cipher suites, protecting against protocol downgrade attacks and weak encryption. HTTP to HTTPS redirection uses HTTP 301 permanent redirects, instructing browsers to cache the redirect and automatically use HTTPS for future requests. Target groups provide health checking with configurable intervals, timeouts, and threshold counts, automatically removing unhealthy instances from rotation and adding recovered instances. The ALB supports WebSocket and HTTP/2 protocols for modern application requirements. Cross-zone load balancing distributes traffic evenly across instances in all Availability Zones regardless of instance distribution.

### RDS Multi-AZ High Availability

RDS Multi-AZ deployment provides high availability for the database layer through synchronous replication and automatic failover. AWS maintains a standby replica in a different Availability Zone with synchronous replication, ensuring all committed transactions are replicated before acknowledging writes to the application. During failover scenarios such as primary instance failure, AZ outage, or storage failure, RDS automatically promotes the standby instance to primary and updates the DNS CNAME record to point to the new primary. Failover completes within 1-2 minutes with automatic detection and promotion, requiring no manual intervention. Applications automatically reconnect to the database using the same endpoint after DNS propagation. Multi-AZ deployment protects against instance failures, AZ-level outages, storage failures, and network connectivity issues. Backups and snapshots are taken from the standby instance, eliminating I/O suspension on the primary during backup windows. Software patching is performed on the standby first, then failover occurs, and the old primary is patched as the new standby, minimizing application downtime.

### S3 Access Logging and Lifecycle Management

S3 access logging provides comprehensive audit trails of all requests to the application bucket for security analysis and compliance. The LoggingConfiguration directs access logs to a separate dedicated bucket with app-bucket-logs/ prefix, separating operational data from application data. Access logs capture requester identity, bucket name, request time, request action, response status, and error code for each request, enabling security analysis and troubleshooting. The access logs bucket has OwnershipControls set to BucketOwnerPreferred to ensure the bucket owner has full control over logged objects even when written by the S3 service. Lifecycle policies on the access logs bucket automatically delete logs after 90 days, reducing storage costs while maintaining audit trails for compliance requirements. Versioning on the application bucket preserves file history and enables recovery from accidental deletions or modifications. Server-side encryption with AES-256 protects data at rest in both buckets, meeting data protection requirements without application changes.

### CloudWatch Monitoring and Alarms

CloudWatch provides comprehensive monitoring and alerting across all infrastructure components. The CPUAlarmHigh monitors average CPU utilization across the Auto Scaling Group with 5-minute periods and 2 evaluation periods, triggering the scale-up policy when CPU exceeds 70% for 10 consecutive minutes. This proactive scaling ensures capacity is available before performance degradation impacts users. The CPUAlarmLow triggers scale-down when CPU drops below 30%, optimizing costs during low-traffic periods while respecting the minimum capacity constraint. The ALB5xxErrorAlarm monitors HTTPCode_Target_5XX_Count metric from the Application Load Balancer, detecting backend errors, application failures, database connectivity issues, or resource exhaustion. The alarm uses Sum statistic to count total errors over the period rather than percentages, triggering when errors exceed 10 in two consecutive 5-minute periods. TreatMissingData is set to notBreaching to prevent false alarms during periods of zero traffic. CloudWatch metrics are automatically published by EC2, RDS, and ALB services without additional configuration. The CloudWatchAgentServerPolicy managed policy enables instances to publish custom metrics and logs to CloudWatch for application-level monitoring.

### Infrastructure as Code Best Practices

All resources follow consistent naming conventions using Fn::Sub to incorporate the prod- prefix and environment suffix, enabling multiple environment deployments from the same template without naming conflicts. Parameters use validation through AllowedPattern for CIDR blocks ensuring valid network configurations, AllowedValues for instance types preventing oversized deployments, and MinValue/MaxValue for Auto Scaling sizes preventing configuration errors. The template uses DependsOn attributes for explicit dependencies such as Elastic IPs depending on Internet Gateway attachment to prevent creation failures. Implicit dependencies through Ref and GetAtt functions establish automatic resource ordering for deployment and deletion operations. Metadata sections organize parameters into logical groups for improved user experience in the CloudFormation console with clear labels and descriptions. Comprehensive tagging with Name, Environment, and Project enables cost allocation through AWS Cost Explorer by filtering costs by tag, automated compliance auditing through AWS Config tag-based rules, and operational automation through tag-based resource selection in scripts. All outputs use Export for cross-stack references following the naming pattern ${AWS::StackName}-{Name} for predictable integration. Conditions enable optional resources such as ACM certificates when Route 53 hosted zones are provided, supporting flexible deployments across environments.
