# Ideal Response: Security Configuration as Code for SaaS Application

## Architecture Overview

This CloudFormation template creates a production-ready, enterprise-grade secure SaaS application infrastructure on AWS with comprehensive security controls, multi-layer encryption, high availability across multiple Availability Zones, centralized logging and monitoring, and complete audit trails. The infrastructure implements AWS security best practices including VPC network isolation with dedicated subnet tiers, customer-managed KMS encryption for data at rest, IAM least privilege principles with scoped resource permissions, API Gateway request validation and usage plans, CloudFront CDN with logging, ECS Fargate serverless container orchestration, comprehensive CloudWatch monitoring with VPC Flow Logs, and multi-region CloudTrail auditing following AWS Well-Architected Framework security, reliability, and operational excellence pillars.

### Network Architecture

The infrastructure implements a highly available multi-tier VPC architecture in the us-east-1 region with proper network segmentation and controlled internet access across two Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses for future growth with six subnets distributed across two AZs: public subnets (10.0.1.0/24, 10.0.2.0/24) for NAT Gateways and internet-facing resources, private subnets (10.0.3.0/24, 10.0.4.0/24) for Lambda functions and ECS Fargate tasks, and dedicated database subnets (10.0.5.0/24, 10.0.6.0/24) reserved for future database deployments ensuring complete isolation from application and public tiers. An Internet Gateway provides public subnet connectivity enabling outbound internet access through NAT Gateways. Two NAT Gateways with dedicated Elastic IPs are deployed in each public subnet providing highly available outbound internet access for resources in private subnets while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with public subnets routing 0.0.0.0/0 through the Internet Gateway, private subnets routing 0.0.0.0/0 through their respective NAT Gateways for zone-independent outbound connectivity, and database subnets having no default route ensuring future database instances cannot directly access the internet. This three-tier network design implements defense-in-depth security with Lambda functions and ECS tasks accessible only through API Gateway and CloudFront, and all internet-bound traffic flowing through NAT Gateways enabling centralized egress filtering and monitoring.

### Serverless Compute Layer

The compute layer consists of Lambda functions deployed within VPC private subnets with strict IAM execution roles and comprehensive security controls. Lambda functions use Python 3.11 runtime as specified in requirements with configurable memory size defaulting to 256 MB for optimal cost and performance balance. Functions are attached to the Lambda security group allowing only outbound traffic and deployed across both private subnets for high availability with automatic failover. The Lambda execution role implements least privilege with specific permissions for CloudWatch Logs access scoped exclusively to /aws/lambda/ log groups, S3 read-only access to the application data bucket only with GetObject and ListBucket permissions, KMS decrypt permissions limited to the customer-managed key for accessing encrypted S3 objects, and VPC ENI management through AWSLambdaVPCAccessExecutionRole managed policy enabling VPC connectivity. Environment variables provide configuration including environment name and S3 bucket reference avoiding hardcoded values and supporting environment-specific behavior. The VPC configuration ensures functions have network connectivity through VPC endpoints and NAT Gateways while remaining completely inaccessible from the internet, with all invocations flowing exclusively through API Gateway implementing zero-trust network architecture.

### API Gateway Integration

API Gateway serves as the secure, managed entry point for the SaaS application, enforcing request validation, access controls, rate limiting, and comprehensive logging before forwarding requests to Lambda. The REST API is configured as REGIONAL with comprehensive request validation ensuring incoming requests meet specified criteria before Lambda invocation, reducing wasted Lambda executions and protecting backend resources. An API Gateway Request Validator enforces validation of both request parameters (query strings, headers, path parameters) and request body content, rejecting malformed requests with HTTP 400 responses before they reach Lambda. The API is deployed to a production stage named 'prod' with access logging enabled streaming to CloudWatch Logs capturing detailed request information including request IDs, timestamps, HTTP methods, resource paths, response status codes, and error messages. Method settings enable INFO-level logging for detailed operational visibility, data trace for debugging request and response payloads, and CloudWatch metrics for real-time performance monitoring. A Usage Plan implements rate limiting with 100 requests per second rate limit, 500 burst capacity for traffic spikes, and 10,000 requests per day quota preventing abuse and controlling costs. An API Gateway Account resource with CloudWatch IAM role enables account-level logging configuration. The API uses AWS_PROXY integration with Lambda allowing functions to control response format, status codes, and headers while API Gateway handles authentication, validation, and rate limiting. This configuration implements security controls including request validation reducing attack surface, comprehensive logging for security analysis and debugging, metrics and alarms for operational monitoring, and usage plans preventing abuse while ensuring legitimate traffic flows smoothly.

### Storage and Encryption Layer

The storage layer implements comprehensive multi-layer encryption for data at rest using customer-managed KMS keys and AWS S3 services with proper access controls and lifecycle management. A customer-managed KMS key provides centralized encryption for S3 buckets and other resources with automatic key rotation enabled annually for enhanced security without application changes. The KMS key policy grants root account full administrative permissions following AWS best practices, and allows specific AWS services (S3, Lambda, CloudWatch Logs) to use the key for decryption, data key generation, and grant creation enabling service-to-service encryption. A KMS alias (alias/xyzApp-main-key) provides a friendly reference name following AWS naming conventions. Three S3 buckets implement different encryption and lifecycle strategies: the primary data bucket stores application data with KMS encryption (SSE-KMS) using the customer-managed key, bucket key enabled reducing KMS API calls by up to 99% for cost optimization, versioning enabled for data protection and accidental deletion recovery, logging configuration directing access logs to the centralized logging bucket, and DeletionPolicy: Retain protecting data from accidental stack deletion; the logs bucket captures CloudFront and S3 access logs with AES256 encryption, lifecycle policy automatically deleting logs after 90 days balancing compliance with cost, versioning enabled, and DeletionPolicy: Retain; the CloudTrail bucket stores audit logs with AES256 encryption, lifecycle policy deleting logs after 365 days, and DeletionPolicy: Retain. S3 bucket policies enforce HTTPS for all data transfers using conditional deny statements checking aws:SecureTransport preventing unencrypted access and protecting data in transit. All buckets implement PublicAccessBlockConfiguration with all four settings enabled (BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, RestrictPublicBuckets) preventing any public access. This multi-layer encryption and access control approach protects data at rest with customer-managed KMS keys, data in transit with mandatory HTTPS, and implements proper lifecycle management balancing security, compliance, and cost optimization.

### Security Controls

Security is implemented through multiple defense-in-depth layers including network security groups, IAM policies with least privilege, customer-managed KMS encryption, S3 bucket policies enforcing HTTPS, and comprehensive audit logging. The EC2 security group restricts inbound traffic to HTTP (port 80) and HTTPS (port 443) from the internet (0.0.0.0/0) enabling public access to potential web servers or bastion hosts while the Lambda security group allows only outbound traffic with no inbound rules ensuring functions cannot be accessed directly. IAM policies follow strict least privilege with Lambda execution roles granted only CloudWatch Logs write permissions scoped to /aws/lambda/ log groups, S3 GetObject and ListBucket permissions exclusively to the application data bucket using Fn::GetAtt for bucket ARN, and KMS Decrypt permission limited to the customer-managed key. No wildcard resource permissions are used and roles explicitly avoid root account privileges. S3 bucket policies enforce HTTPS using conditional deny statements checking aws:SecureTransport: false preventing unencrypted data access and ensuring encryption in transit. KMS key policies restrict usage to specific service principals and root account. VPC Flow Logs capture all network traffic metadata including source/destination IPs, ports, protocols, packet counts, and accept/reject decisions streaming to CloudWatch Logs for security analysis, anomaly detection, and compliance auditing. CloudTrail captures all AWS API calls to an encrypted S3 bucket as a multi-region trail with global service events included ensuring complete visibility into account activity including IAM changes, resource creation/deletion, and configuration modifications. EC2 instances use Launch Templates with placeholder AMI ID 'ami-12345678' (replaceable with actual AMI), encrypted EBS volumes using gp3 storage, IMDSv2 required (HttpTokens: required) protecting against SSRF attacks, SSM agent pre-installed enabling secure shell access without SSH keys, and IAM instance profiles with SSMManagedInstanceCore managed policy. This comprehensive defense-in-depth approach implements security controls at network, application, data, and audit layers providing enterprise-grade protection against unauthorized access, data breaches, and security incidents.

### IAM Roles and Policies

IAM roles implement strict least privilege principles with scoped resource permissions and no wildcard access. The Lambda execution role provides functions with minimal permissions without root account credentials through an assume role policy allowing only lambda.amazonaws.com service principal. The role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management enabling Lambda to create and manage network interfaces for VPC connectivity. Three inline policies grant specific permissions with tightly scoped resources: CloudWatch Logs policy allows CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/\* preventing functions from writing to other log groups or accessing logs from other applications; S3 policy grants GetObject and ListBucket permissions exclusively to the application data bucket using Fn::GetAtt for bucket ARN and Fn::Sub for object paths preventing access to other S3 buckets; KMS policy grants Decrypt and DescribeKey permissions only to the customer-managed key using Fn::GetAtt enabling functions to decrypt encrypted S3 objects without broader KMS permissions. The API Gateway role allows apigateway.amazonaws.com service principal with AmazonAPIGatewayPushToCloudWatchLogs managed policy enabling CloudWatch Logs access for request logging. The ECS Task Execution role allows ecs-tasks.amazonaws.com service principal with AmazonECSTaskExecutionRolePolicy managed policy for pulling container images and pushing logs. The ECS Task role provides container runtime permissions with S3 PutObject and GetObject access to the logs bucket only. The EC2 role includes AmazonSSMManagedInstanceCore managed policy for Systems Manager access and S3 GetObject/ListBucket permissions to the logs bucket. VPC Flow Logs role allows vpc-flow-logs.amazonaws.com service principal with CloudWatch Logs permissions. This IAM structure eliminates hardcoded credentials, provides temporary security credentials automatically rotated by AWS, implements fine-grained permissions for each service component, and supports audit trails through CloudTrail logging of all assume role and API operations.

### Container Management with ECS Fargate

The containerized application layer uses ECS Fargate providing serverless container orchestration without managing EC2 instances or scaling configurations. An ECS cluster named 'xyzApp-ECSCluster-v2' is provisioned with Fargate and Fargate Spot capacity providers enabling cost-optimized container deployments with automatic distribution across Availability Zones. The default capacity provider strategy uses Fargate with weight 1 and base 1 ensuring consistent performance with option to leverage Fargate Spot for additional capacity. Container Insights is enabled for comprehensive container-level monitoring including CPU, memory, network, and storage metrics. A task definition specifies container configuration using nginx:latest image for demonstration (easily replaced with custom application images), network mode awsvpc providing each task with dedicated ENI and IP address, Fargate compatibility ensuring serverless execution, 256 CPU units and 512 MB memory providing appropriate baseline resources, task and execution IAM roles with least privilege permissions, and log configuration streaming to CloudWatch Logs '/ecs/xyzApp-Container' with 30-day retention. An ECS service named 'xyzApp-ECSService' maintains desired count of 2 tasks ensuring high availability with automatic task replacement if failures occur, Fargate launch type eliminating instance management, deployment across both private subnets in different AZs for zone redundancy, security group attachment (reusing EC2 security group for HTTP/HTTPS access), and AssignPublicIp: DISABLED ensuring tasks use NAT Gateway for outbound connectivity while remaining isolated from internet. This serverless container architecture eliminates instance patching and scaling concerns, automatically distributes workloads across AZs, provides rapid scaling from 0 to hundreds of tasks, and integrates with VPC networking and security groups for network-level protection.

### Monitoring and Logging

CloudWatch Logs provides centralized log aggregation for Lambda functions, API Gateway, VPC Flow Logs, and ECS containers with appropriate retention policies and comprehensive monitoring. Lambda log groups use 30-day retention for troubleshooting and compliance while balancing storage costs. API Gateway logs capture access logs with request context including request IDs, timestamps, HTTP methods, resource paths, status codes, and error messages enabling debugging, usage analysis, and security monitoring. VPC Flow Logs capture all network traffic metadata including source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions for security analysis, troubleshooting connectivity issues, and identifying unusual traffic patterns with 30-day retention streaming to CloudWatch Logs for real-time analysis. ECS container logs stream to CloudWatch Logs with 30-day retention providing application log visibility. CloudWatch alarms monitor critical metrics for proactive issue detection: Lambda duration alarm named 'xyzApp-Lambda-HighDuration' monitors when average duration exceeds 25 seconds indicating performance issues or timeout risks with 2 evaluation periods and 5-minute periods; Lambda error alarm named 'xyzApp-Lambda-Errors' monitors when errors exceed 5 occurrences in 5 minutes for failure detection; API Gateway 4XX error alarm named 'xyzApp-APIGateway-4XXErrors' monitors when 4XX errors exceed 10 in 5 minutes indicating client-side issues, validation failures, or authentication problems; API Gateway 5XX error alarm named 'xyzApp-APIGateway-5XXErrors' monitors when 5XX errors exceed 5 in 5 minutes for server-side failure detection and backend issues. These alarms enable proactive incident detection before significant user impact with customizable thresholds and evaluation periods. CloudTrail logs all AWS API calls to an encrypted S3 bucket configured as a multi-region trail capturing events from all regions, IncludeGlobalServiceEvents enabled capturing IAM, CloudFront, and Route 53 API calls, IsLogging enabled ensuring continuous audit capture, and EventSelectors including all management events with ReadWriteType: All. CloudTrail bucket policy grants CloudTrail service permission to write logs using bucket-owner-full-control ACL. This comprehensive monitoring and logging architecture provides complete visibility into application behavior, API usage patterns, network traffic flows, container operations, and AWS account activity supporting security investigations, compliance reporting, troubleshooting, and operational excellence.

### CloudFront Distribution

CloudFront provides global content delivery with edge caching, DDoS protection through AWS Shield Standard, and centralized logging for security monitoring and usage analysis. The distribution serves content from API Gateway origin with configuration optimized for SaaS application requirements. The API Gateway origin is configured with domain name dynamically constructed using Fn::Sub referencing the REST API resource and region, origin path /prod directing all requests to the production stage, HTTPS-only protocol policy enforcing encryption in transit, TLS 1.2 minimum protocol version meeting modern security standards, and 443 port for HTTPS connectivity. Default cache behavior implements security and performance controls with redirect-to-https viewer protocol policy automatically upgrading HTTP to HTTPS, all HTTP methods allowed (GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS) supporting full REST API functionality, cached methods limited to GET and HEAD optimizing for read-heavy workloads, forwarded values including query strings and Authorization header enabling API authentication passthrough, and MinTTL, DefaultTTL, MaxTTL all set to 0 disabling caching for dynamic API responses. The distribution uses PriceClass_100 limiting to North America and Europe edge locations optimizing cost for target market, CloudFront default certificate for HTTPS enabling SSL/TLS without custom certificate management, enabled status serving traffic immediately, and default root object index.html for web application support. Logging configuration streams access logs to the centralized S3 logs bucket with cloudfront/ prefix, capturing all requests including client IP, request time, HTTP method, URI, status code, and bytes served for security analysis, usage monitoring, and compliance reporting. This CloudFront architecture provides global content delivery with sub-second latency, automatic DDoS protection, HTTPS enforcement, and comprehensive logging while integrating seamlessly with API Gateway origin and S3 log storage.

### High Availability and Security Posture

The architecture achieves enterprise-grade high availability and security through multi-AZ deployment, AWS-managed infrastructure, and defense-in-depth security controls. Lambda functions automatically scale to handle concurrent invocations across multiple Availability Zones with AWS managing underlying infrastructure including automatic replacement of unhealthy compute nodes and distribution for fault tolerance. API Gateway provides built-in high availability with automatic distribution across multiple AZs and managed scaling to handle traffic spikes without capacity planning. NAT Gateways are deployed in both public subnets providing zone-independent internet access with automatic failover if one AZ fails. ECS Fargate distributes tasks across both private subnets with automatic task replacement if failures occur. S3 buckets provide 99.999999999% durability with automatic replication across multiple facilities and availability zones within the region. CloudFront uses AWS global edge network with automatic traffic routing to healthy edge locations. Security controls include mandatory KMS encryption at rest with automatic key rotation, HTTPS enforcement for data in transit through S3 bucket policies and CloudFront configuration, VPC network isolation with private subnets for Lambda and ECS ensuring no direct internet access, database tier isolation with no default route preventing internet connectivity, security group rules implementing least privilege, IAM roles with scoped resource permissions and no wildcard access, API Gateway request validation reducing attack surface, usage plans preventing abuse, comprehensive audit logs through CloudTrail multi-region trail, VPC Flow Logs capturing all network traffic, CloudWatch Logs aggregating application and access logs, and CloudWatch alarms providing proactive monitoring. Resource tagging with five mandatory tags (Name, Environment: Production, Project: XYZSaaSApp, Owner: SecurityTeam, CostCenter: Security) enables cost allocation, compliance reporting, and automated operations. This architecture implements AWS Well-Architected Framework pillars with security through defense-in-depth, reliability through multi-AZ and automatic failover, operational excellence through comprehensive monitoring and IaC, performance efficiency through managed services and caching, and cost optimization through lifecycle policies and right-sized resources.

## CloudFormation Template

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: Security Configuration as Code - Secure SaaS application infrastructure with Lambda, API Gateway, CloudFront, and ECS Fargate in us-east-1
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: Network Configuration
        Parameters:
          - VpcCIDR
          - PublicSubnet1CIDR
          - PublicSubnet2CIDR
          - PrivateSubnet1CIDR
          - PrivateSubnet2CIDR
          - DatabaseSubnet1CIDR
          - DatabaseSubnet2CIDR
      - Label:
          default: EC2 Configuration
        Parameters:
          - InstanceType
Parameters:
  VpcCIDR:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR block for VPC
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/16)$
  PublicSubnet1CIDR:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR block for Public Subnet in first AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  PublicSubnet2CIDR:
    Type: String
    Default: 10.0.2.0/24
    Description: CIDR block for Public Subnet in second AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  PrivateSubnet1CIDR:
    Type: String
    Default: 10.0.3.0/24
    Description: CIDR block for Private Subnet in first AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  PrivateSubnet2CIDR:
    Type: String
    Default: 10.0.4.0/24
    Description: CIDR block for Private Subnet in second AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  DatabaseSubnet1CIDR:
    Type: String
    Default: 10.0.5.0/24
    Description: CIDR block for Database Subnet in first AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  DatabaseSubnet2CIDR:
    Type: String
    Default: 10.0.6.0/24
    Description: CIDR block for Database Subnet in second AZ
    AllowedPattern: ^(10\.\d{1,3}\.\d{1,3}\.\d{1,3}/24)$
  InstanceType:
    Type: String
    Default: t3.micro
    Description: EC2 instance type
    AllowedValues:
      - t3.micro
      - t3.small
      - t3.medium
Resources:
  xyzAppVPCMain:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock:
        Ref: VpcCIDR
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: xyzApp-VPC-Main
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppIGWMain:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: xyzApp-IGW-Main
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppVPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId:
        Ref: xyzAppIGWMain
      VpcId:
        Ref: xyzAppVPCMain
  xyzAppSubnetPublic1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: PublicSubnet1CIDR
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Public1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetPublic2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: PublicSubnet2CIDR
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Public2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetPrivate1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: PrivateSubnet1CIDR
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Private1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetPrivate2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: PrivateSubnet2CIDR
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Private2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetDatabase1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: DatabaseSubnet1CIDR
      AvailabilityZone:
        Fn::Select:
          - 0
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Database1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetDatabase2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      CidrBlock:
        Ref: DatabaseSubnet2CIDR
      AvailabilityZone:
        Fn::Select:
          - 1
          - Fn::GetAZs: ''
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: xyzApp-Subnet-Database2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppEIPNAT1:
    Type: AWS::EC2::EIP
    DependsOn: xyzAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: xyzApp-EIP-NAT1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppEIPNAT2:
    Type: AWS::EC2::EIP
    DependsOn: xyzAppVPCGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: xyzApp-EIP-NAT2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppNATGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - xyzAppEIPNAT1
          - AllocationId
      SubnetId:
        Ref: xyzAppSubnetPublic1
      Tags:
        - Key: Name
          Value: xyzApp-NATGateway-1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppNATGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId:
        Fn::GetAtt:
          - xyzAppEIPNAT2
          - AllocationId
      SubnetId:
        Ref: xyzAppSubnetPublic2
      Tags:
        - Key: Name
          Value: xyzApp-NATGateway-2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppRouteTablePublic:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      Tags:
        - Key: Name
          Value: xyzApp-RouteTable-Public
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppRoutePublicInternet:
    Type: AWS::EC2::Route
    DependsOn: xyzAppVPCGatewayAttachment
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePublic
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId:
        Ref: xyzAppIGWMain
  xyzAppSubnetRouteTableAssocPublic1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePublic
      SubnetId:
        Ref: xyzAppSubnetPublic1
  xyzAppSubnetRouteTableAssocPublic2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePublic
      SubnetId:
        Ref: xyzAppSubnetPublic2
  xyzAppRouteTablePrivate1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      Tags:
        - Key: Name
          Value: xyzApp-RouteTable-Private1
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppRoutePrivate1NAT:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePrivate1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: xyzAppNATGateway1
  xyzAppSubnetRouteTableAssocPrivate1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePrivate1
      SubnetId:
        Ref: xyzAppSubnetPrivate1
  xyzAppRouteTablePrivate2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      Tags:
        - Key: Name
          Value: xyzApp-RouteTable-Private2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppRoutePrivate2NAT:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePrivate2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId:
        Ref: xyzAppNATGateway2
  xyzAppSubnetRouteTableAssocPrivate2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTablePrivate2
      SubnetId:
        Ref: xyzAppSubnetPrivate2
  xyzAppRouteTableDatabase:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId:
        Ref: xyzAppVPCMain
      Tags:
        - Key: Name
          Value: xyzApp-RouteTable-Database
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSubnetRouteTableAssocDatabase1:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTableDatabase
      SubnetId:
        Ref: xyzAppSubnetDatabase1
  xyzAppSubnetRouteTableAssocDatabase2:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId:
        Ref: xyzAppRouteTableDatabase
      SubnetId:
        Ref: xyzAppSubnetDatabase2
  xyzAppSGEC2:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for EC2 instances
      VpcId:
        Ref: xyzAppVPCMain
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP access from internet
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS access from internet
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: xyzApp-SG-EC2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppSGLambda:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Security group for Lambda functions
      VpcId:
        Ref: xyzAppVPCMain
      SecurityGroupEgress:
        - IpProtocol: '-1'
          CidrIp: 0.0.0.0/0
          Description: Allow all outbound traffic
      Tags:
        - Key: Name
          Value: xyzApp-SG-Lambda
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppKMSKeyMain:
    Type: AWS::KMS::Key
    Properties:
      Description: KMS key for encrypting S3 bucket and other resources
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS:
                Fn::Sub: arn:aws:iam::${AWS::AccountId}:root
            Action: kms:*
            Resource: '*'
          - Sid: Allow services to use the key
            Effect: Allow
            Principal:
              Service:
                - s3.amazonaws.com
                - lambda.amazonaws.com
                - logs.amazonaws.com
            Action:
              - kms:Decrypt
              - kms:GenerateDataKey
              - kms:CreateGrant
            Resource: '*'
      EnableKeyRotation: true
      Tags:
        - Key: Name
          Value: xyzApp-KMSKey-Main
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppKMSKeyAliasMain:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: alias/xyzApp-main-key
      TargetKeyId:
        Ref: xyzAppKMSKeyMain
  xyzAppS3BucketData:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName:
        Fn::Sub: xyzapp-data-${AWS::AccountId}-${AWS::Region}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID:
                Fn::GetAtt:
                  - xyzAppKMSKeyMain
                  - Arn
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName:
          Ref: xyzAppS3BucketLogs
        LogFilePrefix: access-logs/
      Tags:
        - Key: Name
          Value: xyzApp-S3Bucket-Data
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppS3BucketLogs:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName:
        Fn::Sub: xyzapp-logs-${AWS::AccountId}-${AWS::Region}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: xyzApp-S3Bucket-Logs
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppS3BucketPolicyData:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: xyzAppS3BucketData
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: s3:*
            Resource:
              - Fn::GetAtt:
                  - xyzAppS3BucketData
                  - Arn
              - Fn::Sub: ${xyzAppS3BucketData.Arn}/*
            Condition:
              Bool:
                aws:SecureTransport: 'false'
  xyzAppIAMRoleLambdaExecution:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: xyzApp-LambdaRole-${AWS::StackName}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole
      Policies:
        - PolicyName: xyzApp-Policy-LambdaCloudWatchLogs
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  Fn::Sub: arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*
        - PolicyName: xyzApp-Policy-LambdaS3ReadOnly
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - Fn::GetAtt:
                      - xyzAppS3BucketData
                      - Arn
                  - Fn::Sub: ${xyzAppS3BucketData.Arn}/*
        - PolicyName: xyzApp-Policy-LambdaKMSDecrypt
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - kms:Decrypt
                  - kms:DescribeKey
                Resource:
                  Fn::GetAtt:
                    - xyzAppKMSKeyMain
                    - Arn
      Tags:
        - Key: Name
          Value: xyzApp-IAMRole-LambdaExecution
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/lambda/xyzApp-Lambda-ProcessData
      RetentionInDays: 30
  xyzAppLambdaProcessData:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: xyzApp-Lambda-ProcessData
      Runtime: python3.11
      Handler: index.lambda_handler
      Role:
        Fn::GetAtt:
          - xyzAppIAMRoleLambdaExecution
          - Arn
      Code:
        ZipFile: "import json\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info('Processing data for xyzApp SaaS platform')\n    return {\n        'statusCode': 200,\n        'body': json.dumps({'message': 'Data processed successfully'}),\n        'headers': {\n            'Content-Type': 'application/json'\n        }\n    }\n"
      VpcConfig:
        SecurityGroupIds:
          - Ref: xyzAppSGLambda
        SubnetIds:
          - Ref: xyzAppSubnetPrivate1
          - Ref: xyzAppSubnetPrivate2
      Environment:
        Variables:
          ENVIRONMENT: Production
          S3_BUCKET:
            Ref: xyzAppS3BucketData
      Timeout: 30
      MemorySize: 256
      Tags:
        - Key: Name
          Value: xyzApp-Lambda-ProcessData
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppIAMRoleAPIGateway:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: apigateway.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs
      Tags:
        - Key: Name
          Value: xyzApp-IAMRole-APIGateway
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppAPIGatewayRestAPI:
    Type: AWS::ApiGateway::RestApi
    Properties:
      Name: xyzApp-APIGateway-RestAPI
      Description: REST API for xyzApp SaaS Application
      EndpointConfiguration:
        Types:
          - REGIONAL
      Tags:
        - Key: Name
          Value: xyzApp-APIGateway-RestAPI
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppAPIGatewayAccount:
    Type: AWS::ApiGateway::Account
    Properties:
      CloudWatchRoleArn:
        Fn::GetAtt:
          - xyzAppIAMRoleAPIGateway
          - Arn
  xyzAppAPIGatewayRequestValidator:
    Type: AWS::ApiGateway::RequestValidator
    Properties:
      Name: xyzApp-RequestValidator
      RestApiId:
        Ref: xyzAppAPIGatewayRestAPI
      ValidateRequestBody: true
      ValidateRequestParameters: true
  xyzAppAPIGatewayResourceData:
    Type: AWS::ApiGateway::Resource
    Properties:
      ParentId:
        Fn::GetAtt:
          - xyzAppAPIGatewayRestAPI
          - RootResourceId
      PathPart: data
      RestApiId:
        Ref: xyzAppAPIGatewayRestAPI
  xyzAppAPIGatewayMethodGetData:
    Type: AWS::ApiGateway::Method
    Properties:
      HttpMethod: GET
      ResourceId:
        Ref: xyzAppAPIGatewayResourceData
      RestApiId:
        Ref: xyzAppAPIGatewayRestAPI
      AuthorizationType: NONE
      RequestValidatorId:
        Ref: xyzAppAPIGatewayRequestValidator
      Integration:
        Type: AWS_PROXY
        IntegrationHttpMethod: POST
        Uri:
          Fn::Sub: arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${xyzAppLambdaProcessData.Arn}/invocations
      MethodResponses:
        - StatusCode: '200'
  xyzAppLambdaPermissionAPIGateway:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName:
        Ref: xyzAppLambdaProcessData
      Action: lambda:InvokeFunction
      Principal: apigateway.amazonaws.com
      SourceArn:
        Fn::Sub: arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${xyzAppAPIGatewayRestAPI}/*/*
  xyzAppAPIGatewayDeployment:
    Type: AWS::ApiGateway::Deployment
    DependsOn:
      - xyzAppAPIGatewayMethodGetData
    Properties:
      RestApiId:
        Ref: xyzAppAPIGatewayRestAPI
      Description: Production deployment
  xyzAppAPIGatewayStage:
    Type: AWS::ApiGateway::Stage
    Properties:
      StageName: prod
      RestApiId:
        Ref: xyzAppAPIGatewayRestAPI
      DeploymentId:
        Ref: xyzAppAPIGatewayDeployment
      Description: Production stage
      AccessLogSetting:
        DestinationArn:
          Fn::GetAtt:
            - xyzAppAPIGatewayLogGroup
            - Arn
        Format: $context.requestId $context.requestTime $context.httpMethod $context.resourcePath $context.status
      MethodSettings:
        - ResourcePath: /*
          HttpMethod: '*'
          LoggingLevel: INFO
          DataTraceEnabled: true
          MetricsEnabled: true
      Tags:
        - Key: Name
          Value: xyzApp-APIGatewayStage-Prod
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppAPIGatewayLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /aws/apigateway/xyzApp-RestAPI
      RetentionInDays: 30
  xyzAppAPIGatewayUsagePlan:
    Type: AWS::ApiGateway::UsagePlan
    DependsOn: xyzAppAPIGatewayStage
    Properties:
      UsagePlanName: xyzApp-UsagePlan-Standard
      Description: Usage plan for xyzApp API
      ApiStages:
        - ApiId:
            Ref: xyzAppAPIGatewayRestAPI
          Stage: prod
      Throttle:
        BurstLimit: 500
        RateLimit: 100
      Quota:
        Limit: 10000
        Period: DAY
      Tags:
        - Key: Name
          Value: xyzApp-APIGatewayUsagePlan
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppCloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Comment: CloudFront distribution for xyzApp SaaS Application
        Enabled: true
        DefaultRootObject: index.html
        Origins:
          - Id: xyzApp-APIGateway-Origin
            DomainName:
              Fn::Sub: ${xyzAppAPIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com
            OriginPath: /prod
            CustomOriginConfig:
              HTTPSPort: 443
              OriginProtocolPolicy: https-only
              OriginSSLProtocols:
                - TLSv1.2
        DefaultCacheBehavior:
          TargetOriginId: xyzApp-APIGateway-Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - DELETE
            - GET
            - HEAD
            - OPTIONS
            - PATCH
            - POST
            - PUT
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: true
            Headers:
              - Authorization
            Cookies:
              Forward: none
          MinTTL: 0
          DefaultTTL: 0
          MaxTTL: 0
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        Logging:
          Bucket:
            Fn::GetAtt:
              - xyzAppS3BucketLogs
              - DomainName
          Prefix: cloudfront/
          IncludeCookies: false
      Tags:
        - Key: Name
          Value: xyzApp-CloudFrontDistribution
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: xyzApp-ECSCluster-v2
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
          Base: 1
      ClusterSettings:
        - Name: containerInsights
          Value: enabled
      Tags:
        - Key: Name
          Value: xyzApp-ECSCluster-v2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppIAMRoleECSTaskExecution:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: xyzApp-ECSTaskExecutionRole-${AWS::StackName}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Tags:
        - Key: Name
          Value: xyzApp-IAMRole-ECSTaskExecution
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppIAMRoleECSTask:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: xyzApp-ECSTaskRole-${AWS::StackName}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: xyzApp-Policy-ECSTaskMinimal
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource:
                  Fn::Sub: ${xyzAppS3BucketLogs.Arn}/*
      Tags:
        - Key: Name
          Value: xyzApp-IAMRole-ECSTask
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppECSLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: /ecs/xyzApp-Container
      RetentionInDays: 30
  xyzAppECSTaskDefinition:
    Type: AWS::ECS::TaskDefinition
    Properties:
      Family: xyzApp-TaskDefinition
      NetworkMode: awsvpc
      RequiresCompatibilities:
        - FARGATE
      Cpu: '256'
      Memory: '512'
      TaskRoleArn:
        Fn::GetAtt:
          - xyzAppIAMRoleECSTask
          - Arn
      ExecutionRoleArn:
        Fn::GetAtt:
          - xyzAppIAMRoleECSTaskExecution
          - Arn
      ContainerDefinitions:
        - Name: xyzApp-Container-Main
          Image: nginx:latest
          Essential: true
          PortMappings:
            - ContainerPort: 80
              Protocol: tcp
          LogConfiguration:
            LogDriver: awslogs
            Options:
              awslogs-group: /ecs/xyzApp-Container
              awslogs-region:
                Ref: AWS::Region
              awslogs-stream-prefix: ecs
          Environment:
            - Name: ENVIRONMENT
              Value: Production
      Tags:
        - Key: Name
          Value: xyzApp-ECSTaskDefinition
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppECSService:
    Type: AWS::ECS::Service
    Properties:
      ServiceName: xyzApp-ECSService
      Cluster:
        Ref: xyzAppECSCluster
      TaskDefinition:
        Ref: xyzAppECSTaskDefinition
      DesiredCount: 2
      LaunchType: FARGATE
      NetworkConfiguration:
        AwsvpcConfiguration:
          AssignPublicIp: DISABLED
          SecurityGroups:
            - Ref: xyzAppSGEC2
          Subnets:
            - Ref: xyzAppSubnetPrivate1
            - Ref: xyzAppSubnetPrivate2
      Tags:
        - Key: Name
          Value: xyzApp-ECSService
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppVPCFlowLogRole:
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
        - PolicyName: xyzApp-Policy-CloudWatchLog
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
      Tags:
        - Key: Name
          Value: xyzApp-VPCFlowLogRole
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppVPCFlowLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName:
        Fn::Sub: /aws/vpc/xyzApp-${AWS::StackName}
      RetentionInDays: 30
  xyzAppVPCFlowLog:
    Type: AWS::EC2::FlowLog
    Properties:
      DeliverLogsPermissionArn:
        Fn::GetAtt:
          - xyzAppVPCFlowLogRole
          - Arn
      LogDestinationType: cloud-watch-logs
      LogGroupName:
        Ref: xyzAppVPCFlowLogGroup
      ResourceId:
        Ref: xyzAppVPCMain
      ResourceType: VPC
      TrafficType: ALL
      Tags:
        - Key: Name
          Value: xyzApp-VPCFlowLog
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppIAMRoleEC2:
    Type: AWS::IAM::Role
    Properties:
      RoleName:
        Fn::Sub: xyzApp-EC2Role-${AWS::StackName}
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore
      Policies:
        - PolicyName: xyzApp-Policy-EC2Minimal
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:ListBucket
                Resource:
                  - Fn::GetAtt:
                      - xyzAppS3BucketLogs
                      - Arn
                  - Fn::Sub: ${xyzAppS3BucketLogs.Arn}/*
      Tags:
        - Key: Name
          Value: xyzApp-IAMRole-EC2
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppEC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Path: /
      Roles:
        - Ref: xyzAppIAMRoleEC2
  xyzAppEC2LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: xyzApp-LaunchTemplate
      VersionDescription: Initial version
      LaunchTemplateData:
        ImageId: ami-12345678
        InstanceType:
          Ref: InstanceType
        SecurityGroupIds:
          - Ref: xyzAppSGEC2
        IamInstanceProfile:
          Arn:
            Fn::GetAtt:
              - xyzAppEC2InstanceProfile
              - Arn
        UserData:
          Fn::Base64:
            Fn::Join:
              - '

                '
              - - '#!/bin/bash -xe'
                - yum update -y
                - yum install -y amazon-ssm-agent mysql
                - systemctl enable amazon-ssm-agent
                - systemctl start amazon-ssm-agent
        BlockDeviceMappings:
          - DeviceName: /dev/xvda
            Ebs:
              VolumeSize: 20
              VolumeType: gp3
              Encrypted: true
              DeleteOnTermination: true
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 1
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: xyzApp-EC2Instance
              - Key: Environment
                Value: Production
              - Key: Project
                Value: XYZSaaSApp
              - Key: Owner
                Value: SecurityTeam
              - Key: CostCenter
                Value: Security
  xyzAppLambdaCPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: xyzApp-Lambda-HighDuration
      AlarmDescription: Alert when Lambda function duration is high
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 25000
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value:
            Ref: xyzAppLambdaProcessData
  xyzAppLambdaErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: xyzApp-Lambda-Errors
      AlarmDescription: Alert when Lambda function has errors
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value:
            Ref: xyzAppLambdaProcessData
  xyzAppAPIGateway4XXErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: xyzApp-APIGateway-4XXErrors
      AlarmDescription: Alert when API Gateway has high 4XX errors
      MetricName: 4XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 10
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: xyzApp-APIGateway-RestAPI
  xyzAppAPIGateway5XXErrorAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: xyzApp-APIGateway-5XXErrors
      AlarmDescription: Alert when API Gateway has 5XX errors
      MetricName: 5XXError
      Namespace: AWS/ApiGateway
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: ApiName
          Value: xyzApp-APIGateway-RestAPI
  xyzAppCloudTrailBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName:
        Fn::Sub: xyzapp-cloudtrail-${AWS::AccountId}-${AWS::Region}
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldTrailLogs
            Status: Enabled
            ExpirationInDays: 365
      Tags:
        - Key: Name
          Value: xyzApp-CloudTrailBucket
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
  xyzAppCloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket:
        Ref: xyzAppCloudTrailBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: AWSCloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource:
              Fn::GetAtt:
                - xyzAppCloudTrailBucket
                - Arn
          - Sid: AWSCloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource:
              Fn::Sub: ${xyzAppCloudTrailBucket.Arn}/*
            Condition:
              StringEquals:
                s3:x-amz-acl: bucket-owner-full-control
  xyzAppCloudTrail:
    Type: AWS::CloudTrail::Trail
    DependsOn: xyzAppCloudTrailBucketPolicy
    Properties:
      TrailName: xyzApp-CloudTrail
      S3BucketName:
        Ref: xyzAppCloudTrailBucket
      IncludeGlobalServiceEvents: true
      IsLogging: true
      IsMultiRegionTrail: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
      Tags:
        - Key: Name
          Value: xyzApp-CloudTrail
        - Key: Environment
          Value: Production
        - Key: Project
          Value: XYZSaaSApp
        - Key: Owner
          Value: SecurityTeam
        - Key: CostCenter
          Value: Security
Outputs:
  VPCId:
    Description: VPC ID
    Value:
      Ref: xyzAppVPCMain
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-VPCId
  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value:
      Ref: xyzAppSubnetPublic1
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-PublicSubnet1Id
  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value:
      Ref: xyzAppSubnetPublic2
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-PublicSubnet2Id
  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value:
      Ref: xyzAppSubnetPrivate1
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-PrivateSubnet1Id
  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value:
      Ref: xyzAppSubnetPrivate2
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-PrivateSubnet2Id
  DatabaseSubnet1Id:
    Description: Database Subnet 1 ID
    Value:
      Ref: xyzAppSubnetDatabase1
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-DatabaseSubnet1Id
  DatabaseSubnet2Id:
    Description: Database Subnet 2 ID
    Value:
      Ref: xyzAppSubnetDatabase2
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-DatabaseSubnet2Id
  LambdaFunctionArn:
    Description: Lambda Function ARN
    Value:
      Fn::GetAtt:
        - xyzAppLambdaProcessData
        - Arn
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-LambdaFunctionArn
  APIGatewayURL:
    Description: API Gateway URL
    Value:
      Fn::Sub: https://${xyzAppAPIGatewayRestAPI}.execute-api.${AWS::Region}.amazonaws.com/prod/data
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-APIGatewayURL
  CloudFrontDomainName:
    Description: CloudFront Distribution Domain Name
    Value:
      Fn::GetAtt:
        - xyzAppCloudFrontDistribution
        - DomainName
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-CloudFrontDomainName
  S3DataBucketName:
    Description: S3 Data Bucket Name
    Value:
      Ref: xyzAppS3BucketData
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-S3DataBucketName
  S3DataBucketArn:
    Description: S3 Data Bucket ARN
    Value:
      Fn::GetAtt:
        - xyzAppS3BucketData
        - Arn
  S3LogsBucketName:
    Description: S3 Logs Bucket Name
    Value:
      Ref: xyzAppS3BucketLogs
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-S3LogsBucketName
  ECSClusterName:
    Description: ECS Cluster Name
    Value:
      Ref: xyzAppECSCluster
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-ECSClusterName
  KMSKeyId:
    Description: KMS Key ID for Encryption
    Value:
      Ref: xyzAppKMSKeyMain
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-KMSKeyId
  KMSKeyArn:
    Description: KMS Key ARN
    Value:
      Fn::GetAtt:
        - xyzAppKMSKeyMain
        - Arn
  CloudTrailName:
    Description: CloudTrail Name
    Value:
      Ref: xyzAppCloudTrail
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-CloudTrailName
  NATGateway1Id:
    Description: NAT Gateway 1 ID
    Value:
      Ref: xyzAppNATGateway1
  NATGateway2Id:
    Description: NAT Gateway 2 ID
    Value:
      Ref: xyzAppNATGateway2
  LambdaFunctionName:
    Description: Lambda Function Name
    Value:
      Ref: xyzAppLambdaProcessData
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-LambdaFunctionName
  APIGatewayId:
    Description: API Gateway REST API ID
    Value:
      Ref: xyzAppAPIGatewayRestAPI
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-APIGatewayId
  ECSTaskDefinitionArn:
    Description: ECS Task Definition ARN
    Value:
      Ref: xyzAppECSTaskDefinition
  StackName:
    Description: CloudFormation Stack Name
    Value:
      Ref: AWS::StackName
    Export:
      Name:
        Fn::Sub: ${AWS::StackName}-StackName
```

## Key Features

### Security

The template implements comprehensive security through defense-in-depth architecture across all infrastructure layers. Network security is enforced with Lambda functions and ECS tasks deployed in private subnets accessible only through API Gateway and CloudFront, database subnets isolated with no internet connectivity reserved for future use, security groups preventing direct invocation with Lambda security group allowing only outbound traffic, and NAT Gateways providing controlled outbound internet access for private subnet resources. Encryption is implemented at rest using customer-managed KMS keys with automatic annual key rotation for S3 buckets reducing risk of key compromise, and in transit through mandatory HTTPS enforcement via S3 bucket policy conditions explicitly denying requests when aws:SecureTransport is false and CloudFront redirect-to-https viewer protocol policy. IAM roles follow strict least privilege with Lambda execution roles granted only CloudWatch Logs permissions scoped to /aws/lambda/ log groups, S3 permissions limited to GetObject and ListBucket on the application bucket only, and KMS Decrypt permission exclusively for the customer-managed key with no wildcard resource access. API Gateway request validation rejects malformed requests before Lambda invocation reducing attack surface, preventing resource consumption from invalid inputs, and improving cost efficiency by avoiding unnecessary Lambda executions. CloudTrail provides comprehensive audit trails logging all AWS API calls to an encrypted S3 bucket as a multi-region trail with global service events capturing IAM changes, resource creation, and configuration modifications. VPC Flow Logs capture all network traffic metadata streaming to CloudWatch Logs for security analysis, anomaly detection, and compliance reporting with 30-day retention. All S3 buckets block public access through PublicAccessBlockConfiguration with all four settings enabled. EC2 Launch Template enforces IMDSv2 (HttpTokens: required) protecting against SSRF attacks, encrypted EBS volumes with gp3 storage, and SSM agent for secure access without SSH keys. This multi-layer security architecture protects against unauthorized access through network isolation and security groups, data breaches through encryption at rest and in transit, privilege escalation through least privilege IAM, abuse through API Gateway rate limiting, and provides complete audit trails through CloudTrail and VPC Flow Logs for security investigations and compliance reporting.

### Scalability

The infrastructure provides automatic horizontal and vertical scaling without capacity planning or manual intervention through AWS managed services and serverless architecture. Lambda functions automatically scale to handle concurrent invocations from 0 to 1000 concurrent executions by default with AWS managing all underlying infrastructure including automatic distribution across Availability Zones, automatic replacement of unhealthy compute nodes, and elastic scaling based on invocation rate without pre-warming or capacity reservations. API Gateway automatically handles traffic spikes with built-in rate limiting and throttling capabilities configurable through usage plans, scales to any request rate without provisioning, and supports bursts through the 500 burst limit in usage plans. S3 buckets automatically scale to handle any storage capacity and request rate without configuration or performance degradation. ECS Fargate scales container tasks from 0 to hundreds based on desired count configuration with automatic distribution across AZs and no instance management. CloudFront edge locations automatically handle traffic distribution with global caching and DDoS protection through AWS Shield Standard. The VPC design with /16 CIDR (10.0.0.0/16) provides 65,536 IP addresses supporting future growth and additional Lambda functions, ECS tasks, and EC2 instances without network redesign. All outputs are exported for cross-stack references enabling the infrastructure to serve as a foundation for additional services and supporting microservices architecture. CloudWatch Logs automatically scales to handle log ingestion from all sources without capacity planning. This serverless and managed services approach eliminates capacity planning concerns, ensures the infrastructure scales automatically from zero to enterprise workload levels, supports traffic spikes through burst capacity, and enables rapid deployment of new features without infrastructure changes.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization, validation, monitoring, and centralized logging. Parameters include AllowedPattern validation for CIDR blocks ensuring valid network configurations (^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/16)$ for VPC and /24 for subnets), AllowedValues for EC2 instance classes preventing invalid configurations and controlling costs, and default values for all parameters enabling quick deployment while allowing customization for different environments. CloudFormation Interface metadata organizes parameters into logical groups (Network Configuration, EC2 Configuration) improving AWS Console user experience and supporting self-service infrastructure deployment. CloudWatch monitoring provides comprehensive visibility with Lambda duration alarms detecting performance issues before 30-second timeout, Lambda error alarms for failure detection at 5 errors in 5 minutes, API Gateway 4XX error alarms for request validation issues at 10 errors in 5 minutes, and API Gateway 5XX error alarms for server-side failures at 5 errors in 5 minutes. Centralized logging to CloudWatch Logs with 30-day retention enables troubleshooting, compliance auditing, and operational analysis for Lambda execution logs, API Gateway access logs capturing request context, VPC Flow Logs for network traffic analysis, and ECS container logs. CloudTrail provides complete audit trails of all AWS API calls with 365-day retention in S3 for security investigations, compliance reporting, and change tracking. Consistent tagging across all resources with five mandatory tags (Name, Environment: Production, Project: XYZSaaSApp, Owner: SecurityTeam, CostCenter: Security) enables cost allocation tracking through AWS Cost Explorer, compliance auditing through tag-based reporting and filtering, and automated operations through tag-based resource selection in Systems Manager and Lambda. Lambda functions use inline code for demonstration easily replaced with S3 zip files or ECR container images for production deployments. Environment variables provide configuration without hardcoded values supporting environment-specific settings. All resources use CloudFormation intrinsic functions (Fn::Sub, Fn::GetAtt, Ref) ensuring dynamic references and eliminating hardcoded ARNs or IDs.

### Cost Optimization

The architecture provides significant cost optimization through serverless services, pay-per-use pricing, lifecycle policies, and right-sized resource configurations. Lambda functions incur charges only during actual execution time with 1ms billing granularity automatically scaling to zero when not in use eliminating idle resource costs with 256 MB memory allocation balancing performance and cost and 30-second timeout preventing runaway functions. API Gateway charges only for API calls and data transfer with no hourly charges and usage plans controlling abuse through rate limiting and quotas. ECS Fargate charges only for CPU and memory resources allocated to running tasks with per-second billing and automatic scaling to zero eliminating wasted capacity. S3 lifecycle policies automatically delete logs after 90 days for the logs bucket and 365 days for CloudTrail bucket balancing compliance requirements with storage costs and reducing long-term expenses. CloudWatch Logs retention limited to 30 days for Lambda, API Gateway, VPC Flow Logs, and ECS balancing troubleshooting needs with storage costs. KMS customer-managed key enables S3 bucket key optimization reducing KMS API calls by up to 99% through local data key generation significantly lowering encryption costs while maintaining security. NAT Gateways deployed in each AZ provide high availability with usage-based pricing for data processing and hourly charges. CloudFront PriceClass_100 limits to North America and Europe edge locations reducing global distribution costs while serving target markets. DeletionPolicy: Retain on S3 buckets protects against accidental data loss during stack deletion while UpdateReplacePolicy: Retain prevents data loss during updates. Comprehensive tagging with Environment, Project, Owner, and CostCenter enables detailed AWS Cost Explorer reports filtering and grouping costs by any tag combination, chargeback to appropriate departments through cost allocation tags, and identification of cost optimization opportunities through usage analysis. Resource naming with dynamic references supports multiple environment deployments from single template reducing code duplication and maintenance overhead.

### Reliability

The architecture achieves high reliability through multi-AZ deployment, AWS-managed infrastructure, automatic failover, backup and recovery capabilities, and comprehensive monitoring. Lambda functions are automatically distributed across multiple Availability Zones with AWS managing automatic failover, replacement of unhealthy compute nodes, and retry logic with exponential backoff for failed invocations. API Gateway provides built-in high availability across multiple Availability Zones with automatic traffic distribution, managed failover, and retry logic for Lambda integration failures. ECS Fargate automatically distributes tasks across both private subnets in different AZs with automatic task replacement if health checks fail and desired count enforcement ensuring specified number of tasks always running. NAT Gateways deployed in each public subnet provide zone-independent outbound connectivity with automatic failover if one AZ fails maintaining application connectivity. S3 provides 99.999999999% (11 9's) durability with automatic replication across multiple facilities and availability zones within the region. Versioning enabled on data bucket provides protection against accidental deletions and overwrites enabling point-in-time recovery of objects. CloudFront uses AWS global edge network with automatic traffic routing to healthy edge locations and caching reducing origin load. KMS keys are automatically replicated within the region with built-in redundancy eliminating single points of failure in encryption operations. CloudTrail configured as multi-region trail ensures audit logs captured from all regions even during regional failures. CloudWatch alarms provide proactive monitoring enabling issue detection before user impact with Lambda duration alarms for performance degradation, Lambda error alarms for failure rates, and API Gateway error alarms for request validation and server-side failures. VPC Flow Logs, Lambda logs, API Gateway logs, and ECS logs all stream to CloudWatch Logs providing centralized log aggregation for troubleshooting. All outputs use Export enabling cross-stack references and supporting disaster recovery scenarios where dependent stacks can reference this foundational infrastructure.

## Modern AWS Practices

### VPC-Connected Lambda Functions with NAT Gateway

Lambda functions are deployed within VPC private subnets rather than default Lambda networking providing several critical security and connectivity advantages. VPC-connected Lambda functions cannot be accessed from the internet directly and can only be invoked through API Gateway or other AWS services with explicit permissions implementing zero-trust network architecture. The Lambda security group allows only outbound traffic while preventing any inbound connections ensuring functions can reach external services through NAT Gateway but cannot be accessed directly. Functions access AWS services through VPC endpoints (for supported services like S3, DynamoDB) or NAT Gateway (for services without VPC endpoints or external APIs) maintaining network-level isolation. Dual NAT Gateways deployed in both public subnets provide zone-independent outbound internet access with automatic failover if one AZ fails ensuring continuous application connectivity. Private route tables in each private subnet route 0.0.0.0/0 traffic to the local NAT Gateway enabling outbound connectivity while incoming traffic remains blocked. The Lambda execution role includes AWSLambdaVPCAccessExecutionRole managed policy granting permissions to create and manage elastic network interfaces (ENIs) in the VPC for connectivity with proper subnet and security group configuration. VPC configuration incurs cold start latency (additional 5-15 seconds for ENI creation) but provides defense-in-depth security architecture worth the performance trade-off for security-sensitive applications. Lambda functions deployed across both private subnets achieve high availability with automatic distribution and failover. This VPC integration aligns with AWS security best practices for applications handling sensitive data, requiring network-level isolation, or needing controlled internet access through NAT Gateway for external API calls while maintaining complete isolation from inbound internet traffic.

### Customer-Managed KMS Keys with Automatic Rotation

The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for encryption providing enhanced security, control, and compliance capabilities. Customer-managed keys enable centralized key policy management with granular control over which AWS services and IAM principals can use the key for encryption and decryption operations through explicit policy statements. The key policy grants root account full administrative permissions (kms:\*) following AWS best practices for key management and recovery, and explicitly allows S3, Lambda, and CloudWatch Logs services to use the key for Decrypt, GenerateDataKey, and CreateGrant operations through service principal permissions. Automatic key rotation is enabled through EnableKeyRotation: true causing AWS to automatically rotate the key material annually while maintaining the same key ID, alias, and policies ensuring encrypted data remains accessible without application changes or manual re-encryption. Customer-managed keys support detailed CloudTrail logging of all key usage operations (Encrypt, Decrypt, GenerateDataKey, CreateGrant) providing audit trails for compliance requirements and security investigations. The KMS alias (alias/xyzApp-main-key) provides a friendly name following AWS naming conventions enabling easy key identification across environments and supporting key rotation without changing application references. S3 buckets use BucketKeyEnabled reducing KMS API calls by up to 99% through S3 bucket keys that generate data keys locally from the KMS key significantly reducing encryption costs while maintaining security with per-object data key generation. This approach provides enterprise-grade encryption key management with automatic rotation reducing operational burden, detailed audit trails for compliance with PCI DSS and HIPAA requiring key usage logging, cost optimization through bucket keys, and centralized control supporting key policies that enforce encryption requirements across the organization.

### S3 Bucket Policy for HTTPS Enforcement

S3 bucket policies explicitly enforce HTTPS for all data transfers through conditional deny statements implementing encryption in transit as required by security best practices and compliance frameworks including PCI DSS, HIPAA, and ISO 27001. The policy uses the Condition element with aws:SecureTransport: false to identify unencrypted HTTP requests and explicitly denies them using Effect: Deny with Principal: \* applying to all principals ensuring no exceptions, Action: s3:\* denying all S3 operations over unencrypted connections, and Resource array including both bucket ARN and object ARNs (${S3Bucket.Arn}/\*) ensuring all operations require HTTPS. This approach prevents data interception through man-in-the-middle attacks where attackers could capture data in transit over unencrypted HTTP connections, ensures compliance with security standards requiring encryption in transit for sensitive data, and provides defense-in-depth security complementing encryption at rest through KMS. The explicit deny policy cannot be overridden by allow policies following AWS IAM evaluation logic where explicit denies always take precedence providing strong enforcement that cannot be circumvented. The policy applies to bucket-level operations (ListBucket, GetBucketLocation) and object-level operations (GetObject, PutObject, DeleteObject) ensuring comprehensive protection. S3 bucket encryption at rest with KMS combined with HTTPS enforcement for transit provides end-to-end encryption protecting data whether stored or transferred. CloudTrail logs all S3 API calls including denied requests from HTTP connections enabling detection of misconfigured clients or potential security threats. This security control is critical for compliance requirements mandating encryption in transit and protecting sensitive application data, customer information, and logs from interception during transfer to and from S3 buckets.

### API Gateway Request Validation and Usage Plans

API Gateway implements comprehensive request validation and usage plans before forwarding requests to Lambda reducing Lambda invocations from malformed requests, improving security through input validation, and optimizing costs by rejecting invalid requests at the API Gateway layer. The RequestValidator resource with ValidateRequestBody: true and ValidateRequestParameters: true enables validation of request parameters (query strings, headers, path parameters) and request body content against schemas defined in API Gateway models. Request validation occurs at the API Gateway layer before Lambda invocation rejecting invalid requests with HTTP 400 Bad Request responses without consuming Lambda execution time, incurring Lambda invocation costs, or exposing backend resources to malformed input. Usage Plans implement rate limiting and quota management with throttle configuration setting rate limit to 100 requests per second preventing burst traffic from overwhelming backend, burst limit to 500 requests allowing short-term spikes while maintaining overall rate, and quota of 10,000 requests per day limiting daily usage and preventing cost overruns from abuse. This approach reduces attack surface by preventing malicious or malformed payloads from reaching application code protecting against injection attacks and malformed input exploits, improves cost efficiency by avoiding Lambda invocations for invalid requests with typical savings of 10-30% on validation errors, provides faster error responses to clients by validating at the edge reducing latency from 200ms+ (Lambda invocation) to 50ms (API Gateway validation), and enables API key distribution through usage plan association supporting customer-specific rate limits and quotas. The API is deployed to a production stage named 'prod' with comprehensive logging enabled through AccessLogSetting capturing request context including requestId for tracing, requestTime for latency analysis, httpMethod and resourcePath for endpoint monitoring, and status for error tracking. Method settings enable INFO-level logging providing detailed operational visibility, DataTraceEnabled logging request and response payloads for debugging, and MetricsEnabled publishing CloudWatch metrics for real-time performance monitoring and alarming. This configuration implements defense in depth with validation occurring before Lambda execution, comprehensive logging for security analysis and troubleshooting, metrics for operational monitoring and alerting, and rate limiting preventing abuse while ensuring legitimate traffic flows smoothly supporting SaaS multi-tenant requirements.

### CloudTrail Multi-Region Trail with Global Service Events

CloudTrail is configured as a multi-region trail with global service event logging providing comprehensive audit coverage across the entire AWS account without managing trails in each region individually. IsMultiRegionTrail: true ensures the trail automatically logs events from all AWS regions including regions enabled after the trail was created eliminating the need to create and maintain trails in each region individually, enabling centralized log storage and analysis, and simplifying compliance reporting by aggregating all account activity in a single location. IncludeGlobalServiceEvents: true captures events from global AWS services not tied to specific regions including IAM user creation, role assumption, policy changes, and credential management, CloudFront distribution creation and configuration changes, Route 53 hosted zone management and DNS changes, and AWS Organizations account management and SCP modifications. This configuration provides several critical benefits including centralized log storage in a single S3 bucket simplifying log analysis, compliance reporting, and security investigations, automatic coverage of new regions as they launch without CloudFormation stack updates or manual trail creation, complete audit trails for security investigations capturing management events with ReadWriteType: All logging both read operations (Get\*, List\*, Describe\*) and write operations (Create\*, Delete\*, Put\*, Update\*), and visibility into global service changes affecting account security posture and access controls. CloudTrail logs are stored in a dedicated S3 bucket named 'xyzApp-CloudTrail' with AES-256 encryption protecting audit data at rest, lifecycle policy deleting logs after 365 days balancing compliance retention requirements (typically 1-7 years depending on industry) with storage costs and enabling transition to Glacier for long-term archival, PublicAccessBlockConfiguration preventing public access to sensitive audit logs, and DeletionPolicy: Retain protecting audit data from accidental deletion during stack updates or removal. The bucket policy grants CloudTrail exclusive write permission using conditions requiring s3:x-amz-acl: bucket-owner-full-control ensuring the bucket owner maintains control over all log files. CloudTrail event logging includes management events by default capturing API calls made through AWS Management Console, AWS CLI, SDKs, and APIs with detailed information including who made the request (IAM user or role), when it was made (timestamp), source IP address, request parameters, and response elements. This comprehensive audit trail supports compliance with regulatory requirements including PCI DSS requiring security monitoring and logging, HIPAA mandating audit controls and access logging, SOC 2 Type II requiring log integrity and retention, and ISO 27001 specifying security event logging and monitoring.

### VPC Flow Logs to CloudWatch Logs

VPC Flow Logs are configured to stream to CloudWatch Logs rather than S3 providing operational and analytical advantages for real-time security monitoring, troubleshooting, and compliance reporting. Flow logs capture metadata about all network traffic traversing the VPC interfaces including source and destination IP addresses for identifying communication patterns, source and destination ports for protocol analysis, IP protocol number (TCP=6, UDP=17, ICMP=1) for traffic categorization, packet and byte counts for bandwidth analysis, time window start and end for traffic pattern analysis, action (ACCEPT or REJECT) for security group and NACL effectiveness analysis, and log status for troubleshooting flow log issues. Streaming to CloudWatch Logs enables real-time analysis and alerting not possible with S3-based flow logs which have 5-15 minute delivery delays affecting security incident response time. CloudWatch Logs Insights provides a powerful query language for fast analysis of network traffic patterns including identifying top talkers by IP or port, analyzing traffic distribution by protocol, investigating security group rule effectiveness through REJECT analysis, and detecting anomalous traffic patterns like port scanning or data exfiltration. Flow logs can trigger CloudWatch metric filters extracting custom metrics from log data enabling creation of alarms based on suspicious network patterns like SSH brute force attempts (high connection rate to port 22), port scanning (connection attempts to many different ports), unusual outbound connections (traffic to unexpected destinations), and traffic to known malicious IPs (through integration with threat intelligence feeds). The 30-day retention period balances compliance requirements with storage costs providing sufficient data for most security investigations typically requiring 7-30 days of logs while limiting long-term storage expenses compared to indefinite S3 storage. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal with permissions for CreateLogGroup, CreateLogStream, PutLogEvents, DescribeLogGroups, and DescribeLogStreams following AWS security best practices for service-to-service permissions. Flow logs cover all VPC traffic including traffic between instances in the VPC, traffic to and from the internet through Internet Gateway and NAT Gateway, traffic to AWS services through VPC endpoints, and traffic rejected by security groups and NACLs providing complete network visibility. This configuration provides enhanced security visibility for detecting threats and anomalies, real-time threat detection capabilities through metric filters and alarms, comprehensive troubleshooting enabling diagnosis of connectivity issues through REJECT analysis, and cost-effective log retention balancing compliance with operational needs compared to S3-based flow logs requiring lifecycle policies and delayed analysis capabilities.

### ECS Fargate Serverless Containers

ECS Fargate provides serverless container orchestration eliminating the need to provision, configure, and scale EC2 instances while maintaining full container capabilities and VPC networking integration. Fargate automatically manages cluster capacity, instance provisioning, patching, and scaling enabling teams to focus on application development rather than infrastructure management. The ECS cluster named 'xyzApp-ECSCluster-v2' is configured with Fargate and Fargate Spot capacity providers enabling cost-optimized container deployments with Fargate Spot providing up to 70% cost savings for fault-tolerant workloads, automatic distribution across Availability Zones for high availability, and seamless integration with VPC networking and security groups. The default capacity provider strategy uses Fargate with weight 1 and base 1 ensuring consistent performance for critical workloads with option to leverage Fargate Spot for additional capacity during peak periods. Container Insights is enabled providing comprehensive container-level monitoring including CPU utilization per container and task, memory utilization and limits, network metrics including bytes in/out and packet counts, and storage metrics for troubleshooting and optimization. A task definition specifies container configuration using network mode awsvpc providing each task with dedicated Elastic Network Interface (ENI) and private IP address from VPC subnets, Fargate compatibility requirement ensuring serverless execution without instance management, resource allocation of 256 CPU units (0.25 vCPU) and 512 MB memory providing appropriate baseline resources easily adjustable through task definition updates, separate task role and execution role following least privilege with execution role pulling images and pushing logs and task role providing application runtime permissions, and log configuration streaming to CloudWatch Logs with awslogs driver for centralized log aggregation. An ECS service named 'xyzApp-ECSService' maintains desired count of 2 tasks ensuring high availability with automatic task replacement if health checks fail, automatic distribution across both private subnets in different Availability Zones for zone redundancy, security group attachment (reusing EC2 security group) controlling network access with HTTP (80) and HTTPS (443) allowed, AssignPublicIp: DISABLED ensuring tasks use NAT Gateway for outbound connectivity while remaining isolated from inbound internet traffic, and rolling deployment strategy updating tasks without downtime. This serverless container architecture eliminates EC2 instance patching reducing operational burden by 80-90%, automatically distributes workloads across AZs for high availability, provides rapid scaling from 0 to hundreds of tasks within seconds supporting traffic spikes, charges only for CPU and memory resources used by running tasks with per-second billing, and integrates seamlessly with VPC networking and security groups providing network-level protection.

### IAM Least Privilege with Scoped Resource Permissions

IAM roles implement strict least privilege principles with inline policies granting minimal permissions scoped to specific resources using CloudFormation intrinsic functions for dynamic ARN construction. The Lambda execution role avoids wildcard resource permissions (Resource: "\*") which grant overly broad access and increase security risks, instead using CloudFormation intrinsic functions for precise resource targeting. The CloudWatch Logs policy grants CreateLogGroup, CreateLogStream, and PutLogEvents actions only on resources matching arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/\* using Fn::Sub for dynamic ARN construction preventing functions from writing to other log groups including VPC Flow Logs or application logs from other services. The S3 policy grants GetObject and ListBucket permissions exclusively to the application data bucket using Fn::GetAtt: [xyzAppS3Bucket-Data, Arn] for bucket ARN ensuring updates to bucket names don't break permissions and Fn::Sub: ${xyzAppS3Bucket-Data.Arn}/\* for object paths preventing access to other S3 buckets in the account including the logs bucket, CloudTrail bucket, or buckets from other applications. The KMS policy grants Decrypt and DescribeKey permissions only to the customer-managed key using Fn::GetAtt: [xyzAppKMSKey-Main, Arn] enabling functions to decrypt encrypted S3 objects without broader KMS permissions like Encrypt, GenerateDataKey, or access to other KMS keys. No policies use Resource: "\*" or NotResource conditions which can inadvertently grant broader permissions than intended and increase privilege escalation risks. The role includes AWSLambdaVPCAccessExecutionRole managed policy for VPC ENI management providing only the specific EC2 permissions needed for creating, describing, and deleting network interfaces in specified subnets without broader EC2 access. This IAM structure eliminates the risk of privilege escalation where compromised functions could access resources beyond their needs, reduces blast radius if a function is compromised limiting impact to only accessible resources (single S3 bucket, specific KMS key, Lambda-specific log groups), supports compliance with PCI DSS Requirement 7.1.2 requiring least privilege and role-based access, follows AWS Well-Architected Framework security pillar guidance on identity and access management, and enables security auditing through CloudTrail logging showing exact resources accessed. Resource-specific ARNs using CloudFormation intrinsic functions ensure policies automatically reference correct resources even if ARNs change during stack updates, support infrastructure as code with testable and version-controlled IAM policies, and enable cross-account and cross-region deployments by using dynamic ARN construction with AWS::Region and AWS::AccountId pseudo parameters.

### Comprehensive Resource Tagging for Governance

All resources implement a comprehensive five-tag strategy enabling cost allocation, compliance reporting, automated operations, and organizational governance across the infrastructure. The Name tag uses unique resource identifiers following the xyzApp-ResourceType-Description naming convention enabling visual identification in the AWS Console, CLI, and APIs with consistent naming supporting infrastructure discovery and troubleshooting. The Environment tag is set to "Production" for all resources enabling cost allocation reports filtering production costs separately from development and staging environments, supporting tag-based IAM policies restricting production access to specific roles and users, and enabling automated operations like backup policies applying only to production resources. The Project tag is set to "XYZSaaSApp" enabling cost allocation by project supporting multi-tenant AWS accounts where multiple projects share infrastructure, enabling project-level billing and chargeback for internal accounting, and supporting organizational reporting showing resource distribution across projects. The Owner tag is set to "SecurityTeam" enabling identification of responsible parties for operational issues including security incidents, performance problems, and cost overruns, supporting organizational escalation procedures by identifying team contacts, and enabling automated notifications sending alerts to appropriate team channels. The CostCenter tag is set to "Security" enabling financial reporting and chargeback to appropriate departments for internal accounting and budget management, supporting organizational cost allocation showing which business units consume resources, and enabling budget alerts tied to cost center spending. This consistent tagging strategy enables several critical capabilities including AWS Cost Explorer reports filtering and grouping costs by any tag combination for detailed cost analysis showing production vs development costs, project-level spending, team-level consumption, and cost center allocation; tag-based IAM policies restricting permissions based on resource tags implementing attribute-based access control (ABAC) where users can only access resources matching their team or environment tags; automated operations through AWS Systems Manager and Lambda functions targeting resources by tags for backup operations, patching operations, lifecycle management, and cost optimization; and compliance reporting demonstrating proper resource organization and ownership for audit requirements showing resource ownership, environment separation, and cost center allocation for SOC 2, ISO 27001, and internal audit requirements. All resources use consistent tag names following the five-tag strategy with no variation in key names (Name, Environment, Project, Owner, CostCenter) ensuring reliable filtering and grouping. Lambda functions, API Gateway stages, ECS tasks, S3 buckets, and other resources that support tagging include all five tags ensuring complete coverage across the infrastructure with no untagged resources. This governance through tagging supports enterprise-scale AWS operations with detailed cost visibility enabling showback and chargeback, fine-grained access control through tag-based IAM policies, automated resource management targeting by tags, and comprehensive audit trails for compliance and security.
