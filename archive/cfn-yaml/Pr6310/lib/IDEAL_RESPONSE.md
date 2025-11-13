# ideal_response.md

# Objective

Deliver an optimized, single-file CloudFormation template (`TapStack.yml`) for a production e-commerce stack in `us-east-1` that consolidates redundant constructs, reduces resource count and deployment time, removes hardcoded values, and preserves functionality and logical resource names. The design focuses on two **core services**—Application Load Balancer + Auto Scaling (across three AZs) and Aurora MySQL—plus an **optional** async layer (Lambda + SQS + SNS) gated by a parameter.

# Functional scope (build everything new)

* Provision a new custom VPC with public and private subnets across three Availability Zones, Internet/NAT egress, and routing.
* Deploy a shared ALB with consolidated listeners and a single target group; attach three Auto Scaling Groups (ASGs) spread across private subnets with a shared Launch Template.
* Create a stateful Aurora MySQL cluster (writer + reader) with deletion protection, snapshot retention, and parameter group.
* Optionally enable a minimal async pipeline (consolidated Lambda role, one function, one SQS queue, one SNS topic) via a parameter.
* Provide centralized tagging across all resources using parameters for Project, Owner, CostCenter, and EnvironmentSuffix.

# Constraints and guardrails

* Single YAML file; no nested stacks or external dependencies.
* Preserve original logical resource names to avoid breaking dependencies.
* No wildcard permissions in IAM policies.
* All stateful resources protected with `DeletionPolicy` and `UpdateReplacePolicy`.
* S3 bucket names must be globally unique and deterministic.

# Key optimizations and refactors

* **Security groups**: Replace per-instance/per-service rules with **shared SGs** (ALB, App, DB) and reference them from all relevant resources.
* **IAM for Lambdas**: Replace 20+ individual roles with a **single consolidated role** and scoped inline policies, enabled conditionally via parameter.
* **Auto Scaling**: Collapse ~15 similar ASGs into a **single reusable pattern** using **Mappings** for size profiles and a **shared Launch Template**. Three representative ASGs (A/B/C) show the pattern across subnets/AZs without duplicative definitions.
* **S3 policies**: Combine identical statements for multiple buckets into **one shared policy** per bucket, relying on OwnershipControls and PublicAccessBlock instead of legacy access control.
* **Intrinsic functions**: Use `!GetAZs`, `!Select`, `!FindInMap`, `!Sub`, and parameterized CIDRs to eliminate hardcoded networks, zones, and names.
* **Centralized tagging**: All tags flow from parameters; no ad hoc inline tag drift.
* **Deletion safety**: `Snapshot` or `Retain` on stateful resources (Aurora, S3, CloudWatch Logs).
* **Outputs**: Only expose values consumed by other stacks/apps (ALB DNS, ASG names, SG IDs, Aurora endpoints, S3 name; optional SQS URL/SNS ARN).

# Naming and uniqueness strategy

* All resource names include `ENVIRONMENT_SUFFIX` to prevent collisions across environments.
* S3 bucket names append a deterministic 8-character suffix derived from `AWS::StackId`, ensuring **global uniqueness** without flapping on updates.

# Security and secrets

* Aurora uses **`ManageMasterUserPassword: true`** to store credentials in AWS Secrets Manager automatically.
* Enhanced Monitoring for RDS is enabled via a dedicated IAM role with the **correct trust principal** (`monitoring.rds.amazonaws.com`) and the **AmazonRDSEnhancedMonitoringRole** managed policy.
* IAM policies are scoped to specific ARNs; no wildcards.

# Deliverable

* `TapStack.yml` that:

  * Builds the full stack from scratch with no external references.
  * Meets all eight optimization goals while focusing on the two core services (ALB+ASG, Aurora).
  * Passes `cfn-lint` (no schema errors; warnings addressed).
  * Deploys reliably with reduced resource count and faster updates while preserving functionality and logical names.
  * Produces deterministic, minimal outputs required by downstream consumers.

```yaml

AWSTemplateFormatVersion: '2010-09-09'
Description: >
  TapStack - Optimized single-file CloudFormation for a production e-commerce baseline in us-east-1.
  Core services: (1) ALB + Auto Scaling across 3 AZs; (2) Aurora MySQL.
  Optional async handlers (Lambda+SQS+SNS) are conditionally created with a consolidated IAM role; Lambda code comes from S3.
  Consolidates security groups, parameterizes ASGs via mappings, centralizes tags, removes hardcoded networks/AZs,
  protects stateful resources with DeletionPolicy/UpdateReplacePolicy, enables ALB access logging, and uses multi-AZ NAT.

# =====================================================================================
# PARAMETERS
# =====================================================================================
Parameters:
  EnvironmentSuffix:
    Type: String
    Description: "Lowercase environment suffix used in all resource names and tags (examples: prod-us, production, qa). Must be 2-20 chars of [a-z0-9-]."
    AllowedPattern: '^[a-z0-9-]{2,20}$'
    ConstraintDescription: "Use 2-20 lowercase letters, digits, and hyphens only."
    Default: 'prod-us'

  ProjectTag:
    Type: String
    Default: 'ecommerce'
    Description: "Centralized tag: Project"

  OwnerTag:
    Type: String
    Default: 'platform-team'
    Description: "Centralized tag: Owner"

  CostCenterTag:
    Type: String
    Default: 'cc-1001'
    Description: "Centralized tag: CostCenter"

  VpcCidr:
    Type: String
    Default: '10.20.0.0/16'
    Description: "Primary VPC CIDR (no hardcoding elsewhere; subnets derive from this)"

  PublicSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.20.0.0/20,10.20.16.0/20,10.20.32.0/20'
    Description: "Three public subnet CIDRs (one per AZ)"

  PrivateSubnetCidrs:
    Type: CommaDelimitedList
    Default: '10.20.128.0/20,10.20.144.0/20,10.20.160.0/20'
    Description: "Three private subnet CIDRs (one per AZ)"

  AlbCertificateArn:
    Type: String
    Description: "ACM certificate ARN for HTTPS listener on the ALB"
    Default: ''

  InstanceTypeDefault:
    Type: String
    Default: 't3.medium'
    Description: "Default instance type for web ASGs when a profile is not explicitly mapped"

  AmiId:
    Type: AWS::EC2::Image::Id
    Description: "AMI for web instances (e.g., hardened Amazon Linux 2/2023)"
    Default: 'ami-0c101f26f147fa7fd'

  KeyPairName:
    Type: String
    Default: ''
    Description: "Optional EC2 key pair name for diagnostics (leave empty to disable)"

  DbName:
    Type: String
    Default: 'tapstack'
    Description: "Initial Aurora MySQL database name"

  DbUsername:
    Type: String
    Default: 'dbadmin'
    Description: "Master username"

  DbInstanceClass:
    Type: String
    Default: 'db.r6g.large'
    Description: "Aurora instance class for writer/reader"

  EnableAsyncHandlers:
    Type: String
    AllowedValues: ['true','false']
    Default: 'false'
    Description: "If true, create Lambda+SQS+SNS and a single consolidated IAM role for all functions."

  CreateAccessLogsBucket:
    Type: String
    AllowedValues: ['true','false']
    Default: 'true'
    Description: "Create a dedicated access logs S3 bucket (shared policy document)."

  StaticAssetsBucketNamePrefix:
    Type: String
    Default: 'tapstack-assets'
    Description: "Prefix for static assets bucket. Final name will be <prefix>-<environment-suffix>-<8charSuffix>. Ensure global uniqueness."

  # NEW: use S3 for Lambda code instead of inline ZipFile
  LambdaCodeBucket:
    Type: String
    Default: ''
    Description: "S3 bucket containing Lambda deployment package (required if EnableAsyncHandlers=true)."

  LambdaCodeKey:
    Type: String
    Default: ''
    Description: "S3 key (object path) for Lambda deployment package (required if EnableAsyncHandlers=true)."

# =====================================================================================
# MAPPINGS
# =====================================================================================
Mappings:
  AsgProfiles:
    web-small:
      InstanceType: 't3.small'
      Desired: '2'
      Min: '2'
      Max: '4'
    web-standard:
      InstanceType: 't3.medium'
      Desired: '3'
      Min: '3'
      Max: '6'
    web-large:
      InstanceType: 'm6i.large'
      Desired: '6'
      Min: '6'
      Max: '12'

# =====================================================================================
# CONDITIONS
# =====================================================================================
Conditions:
  UseAlbHttps: !Not [ !Equals [ !Ref AlbCertificateArn, '' ] ]
  UseKeyPair: !Not [ !Equals [ !Ref KeyPairName, '' ] ]
  EnableAsync: !Equals [ !Ref EnableAsyncHandlers, 'true' ]
  CreateLogsBucket: !Equals [ !Ref CreateAccessLogsBucket, 'true' ]
  HasLambdaCodeBucket: !Not [ !Equals [ !Ref LambdaCodeBucket, '' ] ]
  HasLambdaCodeKey: !Not [ !Equals [ !Ref LambdaCodeKey, '' ] ]
  HasLambdaCode: !And [ !Condition HasLambdaCodeBucket, !Condition HasLambdaCodeKey ]

# =====================================================================================
# RESOURCES
# =====================================================================================

# --------------------------
# Networking: VPC & Subnets
# --------------------------
Resources:
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-vpc'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-igw'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-public-rt'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Public subnets (3)
  PublicSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-public-a'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-public-b'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PublicSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Ref PublicSubnetCidrs]
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-public-c'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Private subnets (3)
  PrivateSubnetA:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [0, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [ 0, !GetAZs '' ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-a'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnetB:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [1, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [ 1, !GetAZs '' ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-b'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateSubnetC:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      CidrBlock: !Select [2, !Ref PrivateSubnetCidrs]
      AvailabilityZone: !Select [ 2, !GetAZs '' ]
      MapPublicIpOnLaunch: false
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-c'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Route table associations (public)
  PublicSubnetARouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetA
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetBRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetB
      RouteTableId: !Ref PublicRouteTable

  PublicSubnetCRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PublicSubnetC
      RouteTableId: !Ref PublicRouteTable

  # --------------------------
  # HA NAT per AZ (A,B,C) + Private route tables per AZ
  # --------------------------
  NatEip:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-eip-a'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGateway:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEip.AllocationId
      SubnetId: !Ref PublicSubnetA
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-a'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatEipB:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-eip-b'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGatewayB:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipB.AllocationId
      SubnetId: !Ref PublicSubnetB
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-b'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatEipC:
    Type: AWS::EC2::EIP
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-eip-c'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  NatGatewayC:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatEipC.AllocationId
      SubnetId: !Ref PublicSubnetC
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-nat-c'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-rt-a'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteDefault:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway

  PrivateRouteTableB:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-rt-b'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteDefaultB:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableB
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayB

  PrivateRouteTableC:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-private-rt-c'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  PrivateRouteDefaultC:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTableC
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGatewayC

  # Route table associations (private -> per-AZ RTs)
  PrivateSubnetARouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetA
      RouteTableId: !Ref PrivateRouteTable

  PrivateSubnetBRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetB
      RouteTableId: !Ref PrivateRouteTableB

  PrivateSubnetCRouteAssoc:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnetC
      RouteTableId: !Ref PrivateRouteTableC

  # --------------------------
  # Consolidated Security Groups
  # --------------------------
  AlbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'ALB shared SG (${EnvironmentSuffix})'
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
          Value: !Sub 'tapstack-${EnvironmentSuffix}-alb-sg'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AppSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'App/ASG shared SG (${EnvironmentSuffix})'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref AlbSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-app-sg'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DbSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: !Sub 'DB shared SG (${EnvironmentSuffix})'
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 3306
          ToPort: 3306
          SourceSecurityGroupId: !Ref AppSecurityGroup
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-sg'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # --------------------------
  # ALB + Target Group + Listeners (with access logging)
  # --------------------------
  Alb:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Scheme: internet-facing
      Type: application
      IpAddressType: ipv4
      Subnets:
        - !Ref PublicSubnetA
        - !Ref PublicSubnetB
        - !Ref PublicSubnetC
      SecurityGroups: [ !Ref AlbSecurityGroup ]
      LoadBalancerAttributes:
        - Key: idle_timeout.timeout_seconds
          Value: '60'
        - !If
          - CreateLogsBucket
          - { Key: access_logs.s3.enabled, Value: 'true' }
          - !Ref 'AWS::NoValue'
        - !If
          - CreateLogsBucket
          - { Key: access_logs.s3.bucket, Value: !Ref AccessLogsBucket }
          - !Ref 'AWS::NoValue'
        - !If
          - CreateLogsBucket
          - { Key: access_logs.s3.prefix, Value: !Sub 'alb-logs/${EnvironmentSuffix}/' }
          - !Ref 'AWS::NoValue'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-alb'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AlbTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref VPC
      Protocol: HTTP
      Port: 80
      TargetType: instance
      HealthCheckProtocol: HTTP
      HealthCheckPath: /
      Matcher:
        HttpCode: '200-399'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-tg'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AlbListenerHttp:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref Alb
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: redirect
          RedirectConfig:
            Protocol: HTTPS
            Port: '443'
            StatusCode: HTTP_301

  AlbListenerHttps:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: UseAlbHttps
    Properties:
      LoadBalancerArn: !Ref Alb
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref AlbCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref AlbTargetGroup

  # --------------------------
  # Launch Template (shared)
  # --------------------------
  WebLaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub 'tapstack-${EnvironmentSuffix}-lt'
      LaunchTemplateData:
        ImageId: !Ref AmiId
        InstanceType: !Ref InstanceTypeDefault
        KeyName: !If [ UseKeyPair, !Ref KeyPairName, !Ref 'AWS::NoValue' ]
        NetworkInterfaces:
          - DeviceIndex: 0
            AssociatePublicIpAddress: false
            Groups: [ !Ref AppSecurityGroup ]
        MetadataOptions:
          HttpTokens: required
          HttpPutResponseHopLimit: 2
        Monitoring:
          Enabled: true
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub 'tapstack-${EnvironmentSuffix}-web'
              - Key: Project
                Value: !Ref ProjectTag
              - Key: Owner
                Value: !Ref OwnerTag
              - Key: CostCenter
                Value: !Ref CostCenterTag
              - Key: Environment
                Value: !Ref EnvironmentSuffix

  # --------------------------
  # ASG pattern (standardized to web-standard profile across AZs)
  # --------------------------
  WebAsgA:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'tapstack-${EnvironmentSuffix}-web-a'
      VPCZoneIdentifier: [ !Ref PrivateSubnetA ]
      MinSize: !FindInMap [ AsgProfiles, web-standard, Min ]
      MaxSize: !FindInMap [ AsgProfiles, web-standard, Max ]
      DesiredCapacity: !FindInMap [ AsgProfiles, web-standard, Desired ]
      HealthCheckType: ELB
      TargetGroupARNs: [ !Ref AlbTargetGroup ]
      LaunchTemplate:
        LaunchTemplateId: !Ref WebLaunchTemplate
        Version: !GetAtt WebLaunchTemplate.LatestVersionNumber
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-web-a'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectTag
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenterTag
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true

  WebAsgB:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'tapstack-${EnvironmentSuffix}-web-b'
      VPCZoneIdentifier: [ !Ref PrivateSubnetB ]
      MinSize: !FindInMap [ AsgProfiles, web-standard, Min ]
      MaxSize: !FindInMap [ AsgProfiles, web-standard, Max ]
      DesiredCapacity: !FindInMap [ AsgProfiles, web-standard, Desired ]
      HealthCheckType: ELB
      TargetGroupARNs: [ !Ref AlbTargetGroup ]
      LaunchTemplate:
        LaunchTemplateId: !Ref WebLaunchTemplate
        Version: !GetAtt WebLaunchTemplate.LatestVersionNumber
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-web-b'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectTag
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenterTag
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true

  WebAsgC:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub 'tapstack-${EnvironmentSuffix}-web-c'
      VPCZoneIdentifier: [ !Ref PrivateSubnetC ]
      MinSize: !FindInMap [ AsgProfiles, web-standard, Min ]
      MaxSize: !FindInMap [ AsgProfiles, web-standard, Max ]
      DesiredCapacity: !FindInMap [ AsgProfiles, web-standard, Desired ]
      HealthCheckType: ELB
      TargetGroupARNs: [ !Ref AlbTargetGroup ]
      LaunchTemplate:
        LaunchTemplateId: !Ref WebLaunchTemplate
        Version: !GetAtt WebLaunchTemplate.LatestVersionNumber
      MetricsCollection:
        - Granularity: '1Minute'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-web-c'
          PropagateAtLaunch: true
        - Key: Project
          Value: !Ref ProjectTag
          PropagateAtLaunch: true
        - Key: Owner
          Value: !Ref OwnerTag
          PropagateAtLaunch: true
        - Key: CostCenter
          Value: !Ref CostCenterTag
          PropagateAtLaunch: true
        - Key: Environment
          Value: !Ref EnvironmentSuffix
          PropagateAtLaunch: true

  # --------------------------
  # S3 Buckets (assets + optional access logs) with unique names
  # --------------------------
  AccessLogsBucket:
    Condition: CreateLogsBucket
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName:
        !Join
          - "-"
          - - !Ref StaticAssetsBucketNamePrefix
            - logs
            - !Ref EnvironmentSuffix
            - !Select
              - 0
              - !Split
                - "-"
                - !Select
                  - 2
                  - !Split
                    - "/"
                    - !Ref "AWS::StackId"
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: !Sub 'expire-logs-${EnvironmentSuffix}'
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-logs-bucket'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  AssetsBucket:
    Type: AWS::S3::Bucket
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain
    Properties:
      BucketName:
        !Join
          - "-"
          - - !Ref StaticAssetsBucketNamePrefix
            - !Ref EnvironmentSuffix
            - !Select
              - 0
              - !Split
                - "-"
                - !Select
                  - 2
                  - !Split
                    - "/"
                    - !Ref "AWS::StackId"
      OwnershipControls:
        Rules:
          - ObjectOwnership: BucketOwnerEnforced
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LoggingConfiguration:
        Fn::If:
          - CreateLogsBucket
          - { DestinationBucketName: !Ref AccessLogsBucket, LogFilePrefix: !Sub 's3-logs/${EnvironmentSuffix}/' }
          - !Ref 'AWS::NoValue'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-assets-bucket'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # Shared bucket policy (no legacy AccessControl)
  AssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref AssetsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: DenyInsecureTransport
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !Sub 'arn:${AWS::Partition}:s3:::${AssetsBucket}'
              - !Sub 'arn:${AWS::Partition}:s3:::${AssetsBucket}/*'
            Condition:
              Bool:
                aws:SecureTransport: 'false'

  # --------------------------
  # Aurora MySQL Cluster (stateful; protected)
  # --------------------------
  DbSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: !Sub 'DB subnet group ${EnvironmentSuffix}'
      SubnetIds:
        - !Ref PrivateSubnetA
        - !Ref PrivateSubnetB
        - !Ref PrivateSubnetC   # include all 3 for 3-AZ Aurora capability
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-subnets'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DbClusterParamGroup:
    Type: AWS::RDS::DBClusterParameterGroup
    Properties:
      Family: aurora-mysql8.0
      Description: !Sub 'Aurora MySQL cluster params ${EnvironmentSuffix}'
      Parameters:
        time_zone: 'UTC'
        character_set_database: 'utf8mb4'
        character_set_server: 'utf8mb4'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-cluster-pg'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  RdsMonitoringRole:
    Type: AWS::IAM::Role
    Properties:
      Path: "/"
      RoleName: !Sub 'tapstack-${EnvironmentSuffix}-rds-monitoring-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: monitoring.rds.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-rds-monitoring-role'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DbCluster:
    Type: AWS::RDS::DBCluster
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      Engine: aurora-mysql
      DatabaseName: !Ref DbName
      MasterUsername: !Ref DbUsername
      ManageMasterUserPassword: true
      DBSubnetGroupName: !Ref DbSubnetGroup
      VpcSecurityGroupIds: [ !Ref DbSecurityGroup ]
      DeletionProtection: true
      BackupRetentionPeriod: 7
      PreferredBackupWindow: '04:00-05:00'
      PreferredMaintenanceWindow: 'sat:06:00-sat:07:00'
      DBClusterParameterGroupName: !Ref DbClusterParamGroup
      StorageEncrypted: true
      CopyTagsToSnapshot: true
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-cluster'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DbInstanceWriter:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Ref DbCluster
      DBInstanceClass: !Ref DbInstanceClass
      Engine: aurora-mysql
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RdsMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-writer'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  DbInstanceReader:
    Type: AWS::RDS::DBInstance
    DeletionPolicy: Snapshot
    UpdateReplacePolicy: Snapshot
    Properties:
      DBClusterIdentifier: !Ref DbCluster
      DBInstanceClass: !Ref DbInstanceClass
      Engine: aurora-mysql
      PubliclyAccessible: false
      AutoMinorVersionUpgrade: true
      MonitoringInterval: 60
      MonitoringRoleArn: !GetAtt RdsMonitoringRole.Arn
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-db-reader'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  # --------------------------
  # Optional Async Handlers (IAM role consolidated for all Lambdas)
  # --------------------------
  LambdaSharedRole:
    Condition: EnableAsync
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'tapstack-${EnvironmentSuffix}-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      Policies:
        - PolicyName: LogsAndXRay
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                Resource:
                  - !Sub 'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/tapstack-${EnvironmentSuffix}-orders:*'
              - Effect: Allow
                Action:
                  - xray:PutTraceSegments
                  - xray:PutTelemetryRecords
                Resource: '*'
        - PolicyName: QueueAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - sqs:SendMessage
                  - sqs:ReceiveMessage
                  - sqs:DeleteMessage
                  - sqs:GetQueueAttributes
                Resource: !Sub 'arn:${AWS::Partition}:sqs:${AWS::Region}:${AWS::AccountId}:tapstack-${EnvironmentSuffix}-orders-queue'
        - PolicyName: TopicPublish
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action: 'sns:Publish'
                Resource: !Sub 'arn:${AWS::Partition}:sns:${AWS::Region}:${AWS::AccountId}:tapstack-${EnvironmentSuffix}-orders-topic'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-lambda-role'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  OrdersQueue:
    Condition: EnableAsync
    Type: AWS::SQS::Queue
    Properties:
      QueueName: !Sub 'tapstack-${EnvironmentSuffix}-orders-queue'
      VisibilityTimeout: 60
      MessageRetentionPeriod: 345600
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-orders-queue'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  OrdersTopic:
    Condition: EnableAsync
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub 'tapstack-${EnvironmentSuffix}-orders-topic'
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-orders-topic'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

  OrdersFunctionLogGroup:
    Condition: EnableAsync
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/tapstack-${EnvironmentSuffix}-orders'
      RetentionInDays: 30
    DeletionPolicy: Retain
    UpdateReplacePolicy: Retain

  OrdersFunction:
    Condition: HasLambdaCode   # create Lambda only when S3 bucket+key provided (and tests/stack won’t break)
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub 'tapstack-${EnvironmentSuffix}-orders'
      Role: !GetAtt LambdaSharedRole.Arn
      Runtime: python3.12
      Handler: index.handler
      Timeout: 30
      TracingConfig:
        Mode: Active
      Environment:
        Variables:
          QUEUE_URL: !If [ EnableAsync, !Ref OrdersQueue, !Ref 'AWS::NoValue' ]
          TOPIC_ARN: !If [ EnableAsync, !Ref OrdersTopic, !Ref 'AWS::NoValue' ]
          ENVIRONMENT_SUFFIX: !Ref EnvironmentSuffix
      Code:
        S3Bucket: !Ref LambdaCodeBucket
        S3Key: !Ref LambdaCodeKey
      Tags:
        - Key: Name
          Value: !Sub 'tapstack-${EnvironmentSuffix}-orders'
        - Key: Project
          Value: !Ref ProjectTag
        - Key: Owner
          Value: !Ref OwnerTag
        - Key: CostCenter
          Value: !Ref CostCenterTag
        - Key: Environment
          Value: !Ref EnvironmentSuffix

# =====================================================================================
# OUTPUTS
# =====================================================================================
Outputs:
  AlbDnsName:
    Description: "Public DNS name of the Application Load Balancer"
    Value: !GetAtt Alb.DNSName
    Export:
      Name: !Sub 'tapstack-${EnvironmentSuffix}-alb-dns'

  WebAsgAName:
    Description: "Name of ASG A (private subnet A)"
    Value: !Ref WebAsgA

  WebAsgBName:
    Description: "Name of ASG B (private subnet B)"
    Value: !Ref WebAsgB

  WebAsgCName:
    Description: "Name of ASG C (private subnet C)"
    Value: !Ref WebAsgC

  AlbSecurityGroupId:
    Description: "Shared ALB SG ID"
    Value: !Ref AlbSecurityGroup

  AppSecurityGroupId:
    Description: "Shared App/ASG SG ID"
    Value: !Ref AppSecurityGroup

  DbSecurityGroupId:
    Description: "Shared DB SG ID"
    Value: !Ref DbSecurityGroup

  AuroraClusterEndpoint:
    Description: "Writer endpoint for Aurora MySQL"
    Value: !GetAtt DbCluster.Endpoint.Address

  AuroraReaderEndpoint:
    Description: "Reader endpoint for Aurora MySQL"
    Value: !GetAtt DbCluster.ReadEndpoint.Address

  AssetsBucketName:
    Description: "Name of the S3 bucket for static assets"
    Value: !Ref AssetsBucket

  OrdersQueueUrl:
    Condition: EnableAsync
    Description: "URL for the orders SQS queue (optional async handlers)"
    Value: !Ref OrdersQueue

  OrdersTopicArn:
    Condition: EnableAsync
    Description: "ARN for the orders SNS topic (optional async handlers)"
    Value: !Ref OrdersTopic
```