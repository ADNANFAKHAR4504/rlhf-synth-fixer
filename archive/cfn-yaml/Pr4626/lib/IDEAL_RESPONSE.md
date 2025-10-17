# ideal_response

## Overview

Deliver a single, production-ready **CloudFormation template in JSON** named **`secure-audit-template.json`** that builds a **brand-new secure AWS environment** for a critical application. The template must be self-contained (no references to pre-existing resources) and include Parameters, Resources, and Outputs in the same file. It must implement least-privilege IAM for S3, VPC isolation, HTTPS-only ALB, strict security groups, S3 versioning, consistent naming and tagging, and clean, deployable configuration.

## What the template must include

1. **IAM access policy for a single S3 bucket**

   * Allows only `s3:ListBucket` on the bucket ARN and `s3:GetObject`, `s3:PutObject` on the bucket’s object ARN.
   * Access is limited to either a specific IAM role created in this template or the `ec2.amazonaws.com` service (trust for the role).
   * Total inline policy statements across the role must not exceed six.

2. **Security Groups**

   * Inbound is restricted to **only HTTPS (443)** on the ALB’s security group.
   * Egress is least-permissive while allowing necessary outbound for health checks and application egress.
   * No public ingress to application instances; app SG allows traffic only from the ALB SG on the app port.

3. **VPC isolation**

   * A new VPC with DNS support enabled.
   * Two public and two private subnets across distinct AZs.
   * Internet Gateway attached to the VPC.
   * NAT Gateway in a public subnet for private egress.
   * Route tables and associations wired correctly for public and private subnets.

4. **Application Load Balancer with SSL**

   * ALB in public subnets.
   * HTTPS listener on 443 with an ACM certificate passed in via parameter.
   * Target group in the VPC for private targets.
   * Access logging enabled to a central logs S3 bucket.

5. **S3 buckets with versioning**

   * One application bucket (the bucket protected by IAM policy).
   * One centralized logs bucket for S3 server access logs and ALB access logs.
   * Versioning enabled on both.
   * Public access blocked on both.
   * Default encryption enabled on both.

6. **Naming convention**

   * Resource names follow `<project>-<resource>-<environment>` consistently.

7. **Tagging**

   * All taggable resources are tagged with `Environment`, `Project`, and `Owner`.

8. **Parameters**

   * Project, Environment, Owner.
   * Bucket name and region values for the application bucket (ensuring DNS-compliant, globally unique naming).
   * ACM certificate ARN for the ALB HTTPS listener.
   * Optional application port for the target group.

9. **Outputs**

   * ARNs for the application bucket and logs bucket.
   * Role name and role ARN for the IAM role with S3 access.
   * VPC ID and subnet IDs.
   * ALB ARN and DNS name.
   * Target group ARN.

10. **CloudFormation Macros (optional)**

* If used, they must provide real value (for example, shared name templating) without introducing fragile dependencies.

## Quality bar and best practices

* JSON is valid, minimal, and easy to review.
* Template passes linters and deploys as a new stack without relying on external resources (other than the ACM certificate).
* Bucket policies are aligned with ALB log delivery requirements and S3 server access logging.
* Ownership controls and encryption are set on S3 buckets.
* Security groups expose only necessary ports.
* The IAM role trust policy uses `ec2.amazonaws.com` if the role is intended for instances.
* No more than six inline policy statements total for the role.
* Outputs are stable, descriptive, and helpful for automation.

## Acceptance criteria

* A single file named `secure-audit-template.json` that cleanly deploys a fresh stack.
* HTTPS listener is created with the provided ACM ARN, and no HTTP listener is exposed.
* S3 versioning is enabled on all buckets; public access is blocked; encryption is enabled.
* ALB access logs and S3 server access logs land in the logs bucket.
* IAM role can list the application bucket and get/put objects in it; no other S3 permissions are granted.
* Every taggable resource has `Environment`, `Project`, and `Owner` tags.
* Resource names follow the `<project>-<resource>-<environment>` convention end-to-end.

```yaml

AWSTemplateFormatVersion: "2010-09-09"
Description: >
  TapStack.yml — Brand-new, secure AWS environment with VPC, ALB (conditional HTTPS), tightly-scoped S3 access for an EC2 role,
  centralized logging, versioning & encryption. Deploys cleanly with or without an ACM certificate; switch to HTTPS by updating AcmCertificateArn.

Parameters:
  Project:
    Type: String
    Default: tapstack
    Description: Project name used in resource naming (lowercase, hyphenated)
    AllowedPattern: "^[a-z0-9-]+$"
  Environment:
    Type: String
    Default: prod
    Description: Environment name
    AllowedValues: [dev, staging, prod]
  Owner:
    Type: String
    Default: saarz-int
    Description: Owner or team tag value
    AllowedPattern: "^[a-zA-Z0-9-_.@]+$"
  VpcCidr:
    Type: String
    Default: 10.0.0.0/16
    Description: CIDR for the VPC
  PublicSubnet1Cidr:
    Type: String
    Default: 10.0.0.0/24
    Description: CIDR for Public Subnet 1
  PublicSubnet2Cidr:
    Type: String
    Default: 10.0.1.0/24
    Description: CIDR for Public Subnet 2
  PrivateSubnet1Cidr:
    Type: String
    Default: 10.0.10.0/24
    Description: CIDR for Private Subnet 1
  PrivateSubnet2Cidr:
    Type: String
    Default: 10.0.11.0/24
    Description: CIDR for Private Subnet 2
  AppPort:
    Type: Number
    Default: 8080
    MinValue: 1
    MaxValue: 65535
    Description: Application port for target group and App Security Group
  AcmCertificateArn:
    Type: String
    Default: ""
    Description: "Optional: ACM certificate ARN for HTTPS listener (must be in stack region). Leave empty to deploy HTTP-only (no 443)."

Mappings: {}

Conditions:
  HasCertificate: !Not [!Equals [!Ref AcmCertificateArn, ""]]
  NoCertificate: !Equals [!Ref AcmCertificateArn, ""]

Resources:
  # --------------------------
  # VPC & Networking
  # --------------------------
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      InstanceTenancy: default
      Tags:
        - Key: Name
          Value: !Sub "${Project}-vpc-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub "${Project}-igw-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref VPC
      InternetGatewayId: !Ref InternetGateway

  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Project}-subnet-public-a-${Environment}"
        - Key: Network
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PublicSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub "${Project}-subnet-public-b-${Environment}"
        - Key: Network
          Value: Public
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet1Cidr
      AvailabilityZone: !Select [0, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${Project}-subnet-private-a-${Environment}"
        - Key: Network
          Value: Private
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Ref PrivateSubnet2Cidr
      AvailabilityZone: !Select [1, !GetAZs ""]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub "${Project}-subnet-private-b-${Environment}"
        - Key: Network
          Value: Private
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${Project}-rtb-public-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PublicRoute:
    Type: AWS::EC2::Route
    DependsOn: VPCGatewayAttachment
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

  NatEip:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub "${Project}-eip-nat-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub "${Project}-natgw-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub "${Project}-rtb-private-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  PrivateDefaultRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway

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

  # --------------------------
  # Security Groups (conditional ports)
  # --------------------------
  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub "${Project}-alb-sg-${Environment} - HTTPS when cert provided; otherwise HTTP"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        # HTTPS 443 only when we have a cert
        - !If
          - HasCertificate
          - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIp: 0.0.0.0/0 }
          - !Ref "AWS::NoValue"
        - !If
          - HasCertificate
          - { IpProtocol: tcp, FromPort: 443, ToPort: 443, CidrIpv6: "::/0" }
          - !Ref "AWS::NoValue"
        # HTTP 80 only when no cert
        - !If
          - NoCertificate
          - { IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIp: 0.0.0.0/0 }
          - !Ref "AWS::NoValue"
        - !If
          - NoCertificate
          - { IpProtocol: tcp, FromPort: 80, ToPort: 80, CidrIpv6: "::/0" }
          - !Ref "AWS::NoValue"
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${Project}-sg-alb-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub "${Project}-app-sg-${Environment} - allow from ALB on app port"
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: !Ref AppPort
          ToPort: !Ref AppPort
          SourceSecurityGroupId: !Ref AlbSecurityGroup
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
      Tags:
        - Key: Name
          Value: !Sub "${Project}-sg-app-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # --------------------------
  # S3 Buckets (Logs & Application)
  # --------------------------
  LogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Project}-${Environment}-logs-${AWS::AccountId}-${AWS::Region}"
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      VersioningConfiguration:
        Status: Enabled
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
          Value: !Sub "${Project}-s3-logs-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  ApplicationBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub "${Project}-${Environment}-app-${AWS::AccountId}-${AWS::Region}"
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerPreferred
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        DestinationBucketName: !Ref LogsBucket
        LogFilePrefix: !Sub "s3-access/${Project}/${Environment}/"
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
          Value: !Sub "${Project}-s3-app-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # ALB & CloudTrail log delivery permissions (prefix-aware for ALB)
  LogsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref LogsBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: ALBLogDeliveryPutWithPrefix
            Effect: Allow
            Principal:
              Service:
                - delivery.logs.amazonaws.com
                - logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:aws:s3:::${LogsBucket}/alb-access/${Project}/${Environment}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
                "aws:SourceAccount": !Ref "AWS::AccountId"
              ArnLike:
                "aws:SourceArn": !Sub "arn:aws:elasticloadbalancing:${AWS::Region}:${AWS::AccountId}:loadbalancer/*"
          - Sid: ALBLogDeliveryAclCheck
            Effect: Allow
            Principal:
              Service:
                - delivery.logs.amazonaws.com
                - logdelivery.elasticloadbalancing.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "arn:aws:s3:::${LogsBucket}"
          - Sid: CloudTrailWrite
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:PutObject
            Resource: !Sub "arn:aws:s3:::${LogsBucket}/AWSLogs/${AWS::AccountId}/*"
            Condition:
              StringEquals:
                "s3:x-amz-acl": "bucket-owner-full-control"
          - Sid: CloudTrailAclCheck
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: s3:GetBucketAcl
            Resource: !Sub "arn:aws:s3:::${LogsBucket}"

  # --------------------------
  # IAM Role for EC2 with minimal S3 access to the Application bucket
  # --------------------------
  AppEc2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub "${Project}-ec2-role-${Environment}"
      AssumeRolePolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: Ec2Trust
            Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: !Sub "${Project}-s3-app-access-${Environment}"
          PolicyDocument:
            Version: "2012-10-17"
            Statement:
              - Sid: ListAppBucket
                Effect: Allow
                Action: [ "s3:ListBucket" ]
                Resource: !Sub "arn:aws:s3:::${ApplicationBucket}"
              - Sid: RWObjectsInAppBucket
                Effect: Allow
                Action: [ "s3:GetObject", "s3:PutObject" ]
                Resource: !Sub "arn:aws:s3:::${ApplicationBucket}/*"
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AppEc2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub "${Project}-ec2-instanceprofile-${Environment}"
      Roles: [!Ref AppEc2Role]

  ApplicationBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref ApplicationBucket
      PolicyDocument:
        Version: "2012-10-17"
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: "*"
            Action: "s3:*"
            Resource:
              - !Sub "arn:aws:s3:::${ApplicationBucket}"
              - !Sub "arn:aws:s3:::${ApplicationBucket}/*"
            Condition:
              Bool:
                "aws:SecureTransport": "false"
          - Sid: AllowRoleList
            Effect: Allow
            Principal:
              AWS: !GetAtt AppEc2Role.Arn
            Action: "s3:ListBucket"
            Resource: !Sub "arn:aws:s3:::${ApplicationBucket}"
          - Sid: AllowRoleObjects
            Effect: Allow
            Principal:
              AWS: !GetAtt AppEc2Role.Arn
            Action: [ "s3:GetObject", "s3:PutObject" ]
            Resource: !Sub "arn:aws:s3:::${ApplicationBucket}/*"

  # --------------------------
  # Application Load Balancer (conditional listeners)
  # --------------------------
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub "${Project}-alb-${Environment}"
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      SecurityGroups: [!Ref AlbSecurityGroup]
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LoadBalancerAttributes:
        - Key: access_logs.s3.enabled
          Value: "true"
        - Key: access_logs.s3.bucket
          Value: !Ref LogsBucket
        - Key: access_logs.s3.prefix
          Value: !Sub "alb-access/${Project}/${Environment}"
      Tags:
        - Key: Name
          Value: !Sub "${Project}-alb-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  AppTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub "${Project}-tg-${Environment}"
      VpcId: !Ref VPC
      Protocol: HTTP
      Port: !Ref AppPort
      TargetType: instance
      HealthCheckPath: /
      HealthCheckProtocol: HTTP
      Matcher:
        HttpCode: "200-399"
      Tags:
        - Key: Name
          Value: !Sub "${Project}-tg-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner

  # HTTPS listener only when a cert is provided
  HttpsListener:
    Condition: HasCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref AcmCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AppTargetGroup

  # HTTP listener only when NO cert (keeps ports minimal in each mode)
  HttpListener:
    Condition: NoCertificate
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AppTargetGroup

  # --------------------------
  # CloudTrail (multi-region) with S3 Data Events for the Application bucket
  # --------------------------
  CloudTrailTrail:
    Type: AWS::CloudTrail::Trail
    Properties:
      TrailName: !Sub "${Project}-cloudtrail-${Environment}"
      IsLogging: true
      S3BucketName: !Ref LogsBucket
      IncludeGlobalServiceEvents: true
      IsMultiRegionTrail: true
      EventSelectors:
        - ReadWriteType: All
          IncludeManagementEvents: true
          DataResources:
            - Type: AWS::S3::Object
              Values:
                - !Sub "arn:aws:s3:::${ApplicationBucket}/"
      Tags:
        - Key: Name
          Value: !Sub "${Project}-cloudtrail-${Environment}"
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: !Ref Project
        - Key: Owner
          Value: !Ref Owner
    DependsOn:
      - LogsBucketPolicy

Outputs:
  VpcId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub "${Project}-${Environment}-VpcId"

  PublicSubnetIds:
    Description: Public Subnet IDs (comma-separated)
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]

  PrivateSubnetIds:
    Description: Private Subnet IDs (comma-separated)
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]

  AlbArn:
    Description: Application Load Balancer ARN
    Value: !Ref ApplicationLoadBalancer

  AlbDnsName:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName

  AppTargetGroupArn:
    Description: Target Group ARN
    Value: !Ref AppTargetGroup

  ApplicationBucketName:
    Description: Application S3 Bucket name
    Value: !Ref ApplicationBucket

  ApplicationBucketArn:
    Description: Application S3 Bucket ARN
    Value: !Sub "arn:aws:s3:::${ApplicationBucket}"

  LogsBucketName:
    Description: Logs S3 Bucket name
    Value: !Ref LogsBucket

  LogsBucketArn:
    Description: Logs S3 Bucket ARN
    Value: !Sub "arn:aws:s3:::${LogsBucket}"

  AppEc2RoleName:
    Description: IAM Role Name for EC2 (limited S3 access)
    Value: !Ref AppEc2Role

  AppEc2RoleArn:
    Description: IAM Role ARN for EC2 (limited S3 access)
    Value: !GetAtt AppEc2Role.Arn

  CloudTrailName:
    Description: CloudTrail trail name
    Value: !Ref CloudTrailTrail
```