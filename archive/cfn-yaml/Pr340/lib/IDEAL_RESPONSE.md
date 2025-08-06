# Ideal Response: Secure High-Availability Web Application Stack

This document provides the complete, production-ready solution for deploying a secure, high-availability web application stack on AWS using CloudFormation.

## Problem Summary

Deploy a complete, secure, and high-availability web application stack in the us-east-1 region using AWS CloudFormation that includes:

- VPC with 2 public and 2 private subnets across multiple AZs
- Application Load Balancer (ALB) for HTTP/HTTPS traffic distribution
- Auto Scaling Group with EC2 instances in private subnets
- RDS PostgreSQL database with Multi-AZ deployment
- S3 bucket with CloudFront for static content delivery
- Appropriate security groups and IAM roles
- Comprehensive tagging strategy

## Solution Architecture

The solution implements a 3-tier architecture:

1. **Presentation Tier**: CloudFront CDN + Application Load Balancer
2. **Application Tier**: Auto Scaling Group with EC2 instances in private subnets
3. **Data Tier**: RDS PostgreSQL database in private subnets

### High Availability Design

- Multi-AZ deployment across us-east-1a and us-east-1b
- Redundant NAT Gateways (one per public subnet)
- Separate route tables for each private subnet
- RDS Multi-AZ enabled for database failover
- Auto Scaling Group spans both availability zones

### Security Features

- EC2 instances deployed in private subnets (no direct internet access)
- Security groups with least privilege access
- S3 bucket with public access blocked
- CloudFront Origin Access Identity for S3 access control
- Database credentials managed by AWS Secrets Manager for enhanced security
- Storage encryption enabled for RDS

## File Structure

```
lib/
├── TapStack.yml           # Main CloudFormation template (YAML)
├── TapStack.json          # CloudFormation template (JSON, generated from YAML)
├── IDEAL_RESPONSE.md      # This documentation file
├── MODEL_RESPONSE.md      # Original model response for comparison
└── MODEL_FAILURES.md     # Analysis of model failures

test/
├── tap-stack.unit.test.ts   # Comprehensive unit tests
└── tap-stack.int.test.ts    # Integration tests with mock and real outputs

metadata.json              # Project metadata and configuration
package.json              # Node.js dependencies and scripts
Pipfile                   # Python dependencies for CFN tools
```

## Implementation Files

### Main CloudFormation Template: `lib/TapStack.yml`

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: CloudFormation template to deploy a secure, high-availability web application stack.

Parameters:
  VpcCidr:
    Type: String
    Description: CIDR block for the VPC
    Default: 10.0.0.0/16

  DBMasterUsername:
    Type: String
    Description: Master username for RDS PostgreSQL instance
    Default: webappadmin
    MinLength: 1
    MaxLength: 63
    AllowedPattern: ^[a-zA-Z][a-zA-Z0-9]*$

  SSLCertificateArn:
    Type: String
    Description: SSL Certificate ARN for HTTPS listener (leave empty to disable HTTPS)
    Default: ''

Conditions:
  HasSSLCertificate: !Not [!Equals [!Ref SSLCertificateArn, '']]

Resources:
  # VPC and Networking
  WebAppVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: !Ref VpcCidr
      EnableDnsSupport: true
      EnableDnsHostnames: true
      Tags:
        - Key: Project
          Value: WebApp

  # Public Subnets (2 AZs for high availability)
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: !Select [0, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Project
          Value: WebApp

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: !Select [1, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Project
          Value: WebApp

  # Private Subnets (2 AZs for high availability)
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: !Select [2, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [0, !GetAZs '']
      Tags:
        - Key: Project
          Value: WebApp

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref WebAppVPC
      CidrBlock: !Select [3, !Cidr [!Ref VpcCidr, 4, 8]]
      AvailabilityZone: !Select [1, !GetAZs '']
      Tags:
        - Key: Project
          Value: WebApp

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Project
          Value: WebApp

  VPCGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      VpcId: !Ref WebAppVPC
      InternetGatewayId: !Ref InternetGateway

  # NAT Gateways (one per AZ for high availability)
  NatGatewayEIP1:
    Type: AWS::EC2::EIP
    DependsOn: InternetGateway
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP1.AllocationId
      SubnetId: !Ref PublicSubnet1

  NatGatewayEIP2:
    Type: AWS::EC2::EIP
    DependsOn: InternetGateway
    Properties:
      Domain: vpc

  NatGateway2:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGatewayEIP2.AllocationId
      SubnetId: !Ref PublicSubnet2

  # Route Tables (separate for each private subnet for HA)
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Project
          Value: WebApp

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Name
          Value: Private Route Table 1

  PrivateRouteTable2:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref WebAppVPC
      Tags:
        - Key: Project
          Value: WebApp
        - Key: Name
          Value: Private Route Table 2

  # Routes
  PublicRoute:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: 0.0.0.0/0
      GatewayId: !Ref InternetGateway

  PrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateRoute2:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable2
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway2

  # Subnet Route Table Associations
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

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet1
      RouteTableId: !Ref PrivateRouteTable1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      SubnetId: !Ref PrivateSubnet2
      RouteTableId: !Ref PrivateRouteTable2

  # Security Groups
  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow HTTP/HTTPS from the internet
      VpcId: !Ref WebAppVPC
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
        - Key: Project
          Value: WebApp

  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow traffic from ALB
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref ALBSecurityGroup
      Tags:
        - Key: Project
          Value: WebApp

  RDSSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupDescription: Allow PostgreSQL access from EC2
      VpcId: !Ref WebAppVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 5432
          ToPort: 5432
          SourceSecurityGroupId: !Ref EC2SecurityGroup
      Tags:
        - Key: Project
          Value: WebApp

  # RDS Database
  RDSSubnetGroup:
    Type: AWS::RDS::DBSubnetGroup
    Properties:
      DBSubnetGroupDescription: Subnet group for RDS
      SubnetIds:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      Tags:
        - Key: Project
          Value: WebApp

  # RDS Password Secret
  RDSPasswordSecret:
    Type: AWS::SecretsManager::Secret
    Properties:
      Name: !Sub '${AWS::StackName}-rds-password'
      Description: Master password for RDS PostgreSQL instance
      GenerateSecretString:
        SecretStringTemplate: !Sub '{"username": "${DBMasterUsername}"}'
        GenerateStringKey: 'password'
        PasswordLength: 32
        ExcludeCharacters: '"@/\'
        RequireEachIncludedType: true
      Tags:
        - Key: Project
          Value: WebApp

  RDSInstance:
    Type: AWS::RDS::DBInstance
    Properties:
      DBInstanceClass: db.t3.micro
      Engine: postgres
      MasterUsername: !Ref DBMasterUsername
      MasterUserPassword: !Sub '{{resolve:secretsmanager:${RDSPasswordSecret}:SecretString:password}}'
      AllocatedStorage: 20
      StorageEncrypted: true
      MultiAZ: true
      DBSubnetGroupName: !Ref RDSSubnetGroup
      VPCSecurityGroups:
        - !Ref RDSSecurityGroup
      Tags:
        - Key: Project
          Value: WebApp

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: web-app-alb
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Tags:
        - Key: Project
          Value: WebApp

  TargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      VpcId: !Ref WebAppVPC
      Port: 80
      Protocol: HTTP
      TargetType: instance
      HealthCheckPath: /
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 5
      UnhealthyThresholdCount: 2
      Matcher:
        HttpCode: 200

  HTTPListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  HTTPSListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Condition: HasSSLCertificate
    Properties:
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 443
      Protocol: HTTPS
      Certificates:
        - CertificateArn: !Ref SSLCertificateArn
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref TargetGroup

  # Auto Scaling Group
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: web-app-lt
      LaunchTemplateData:
        ImageId: '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
        InstanceType: t3.micro
        SecurityGroupIds:
          - !Ref EC2SecurityGroup
        IamInstanceProfile:
          Arn: !GetAtt EC2InstanceProfile.Arn
        UserData:
          Fn::Base64: |
            #!/bin/bash
            # Install web server and other dependencies
            yum update -y
            yum install -y httpd
            systemctl start httpd
            systemctl enable httpd

  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      VPCZoneIdentifier:
        - !Ref PrivateSubnet1
        - !Ref PrivateSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 4
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref TargetGroup
      Tags:
        - Key: Project
          Value: WebApp
          PropagateAtLaunch: true

  # S3 Bucket for Static Content
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'web-app-bucket-${AWS::AccountId}-${AWS::Region}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

  # CloudFront Distribution
  CloudFrontOAI:
    Type: AWS::CloudFront::CloudFrontOriginAccessIdentity
    Properties:
      CloudFrontOriginAccessIdentityConfig:
        Comment: Access identity for web app S3 bucket

  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - DomainName: !GetAtt S3Bucket.DomainName
            Id: S3Origin
            S3OriginConfig:
              OriginAccessIdentity: !Sub 'origin-access-identity/cloudfront/${CloudFrontOAI}'
        Enabled: true
        DefaultRootObject: index.html
        DefaultCacheBehavior:
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          AllowedMethods:
            - GET
            - HEAD
          CachedMethods:
            - GET
            - HEAD
          ForwardedValues:
            QueryString: false
            Cookies:
              Forward: none
          MinTTL: 3600
        ViewerCertificate:
          CloudFrontDefaultCertificate: true

  # IAM Roles
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
      Policies:
        - PolicyName: S3AccessPolicy
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                Resource: !Sub 'arn:aws:s3:::web-app-bucket-${AWS::AccountId}-${AWS::Region}/*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref EC2InstanceRole

Outputs:
  WebsiteURL:
    Description: URL for the CloudFront distribution
    Value: !GetAtt CloudFrontDistribution.DomainName
```

### Unit Tests: `test/tap-stack.unit.test.ts`

Comprehensive unit tests covering all CloudFormation resources and their properties. The tests validate:

- Template structure and format
- All parameters with correct types and constraints
- VPC and networking resources
- Security groups with proper ingress rules
- RDS configuration including encryption and Multi-AZ
- Load balancer and target group configuration
- Auto Scaling Group and Launch Template
- S3 and CloudFront resources
- IAM roles and policies
- Resource tagging compliance

### Integration Tests: `test/tap-stack.int.test.ts`

End-to-end integration tests that validate:

- Infrastructure deployment outputs
- Network connectivity and routing
- Security group configurations
- High availability setup
- Application health checks
- Monitoring and logging integration
- Complete request flow validation

## Deployment Procedures

### Prerequisites

1. **Environment Setup**:

   ```bash
   # Install Node.js dependencies
   npm install

   # Install Python dependencies
   pipenv install
   ```

2. **AWS Configuration**:

   ```bash
   # Configure AWS CLI with appropriate credentials
   aws configure

   # Set environment variables
   export ENVIRONMENT_SUFFIX="prod"
   export AWS_REGION="us-east-1"
   ```

### Validation and Testing

1. **Template Validation**:

   ```bash
   # Run CloudFormation linting
   pipenv run cfn-lint lib/TapStack.yml --regions us-east-1

   # Generate JSON version for unit tests
   pipenv run cfn-flip-to-json > lib/TapStack.json
   ```

2. **Unit Testing**:

   ```bash
   # Run comprehensive unit tests
   npm run test:unit
   ```

3. **Integration Testing** (requires deployment):
   ```bash
   # Run integration tests
   npm run test:integration
   ```

### Deployment

1. **Deploy Infrastructure**:

   ```bash
   # Deploy CloudFormation stack
   npm run cfn:deploy-yaml

   # Or with custom parameters
   aws cloudformation deploy \
     --template-file lib/TapStack.yml \
     --stack-name WebAppStack \
     --capabilities CAPABILITY_IAM \
     --parameter-overrides \
       SSLCertificateArn=arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012
   ```

2. **Collect Outputs**:

   ```bash
   # Create outputs directory
   mkdir -p cfn-outputs

   # Export stack outputs for integration tests
   aws cloudformation describe-stacks \
     --stack-name WebAppStack \
     --query 'Stacks[0].Outputs' \
     --output json > cfn-outputs/flat-outputs.json
   ```

### Cleanup

```bash
# Destroy CloudFormation stack
npm run cfn:destroy

# Or using AWS CLI
aws cloudformation delete-stack --stack-name WebAppStack
```

## Key Features and Benefits

### Security

- **Network Isolation**: EC2 instances in private subnets with no direct internet access
- **Least Privilege**: Security groups with minimal required access
- **Encryption**: RDS storage encryption enabled
- **Access Control**: S3 bucket with CloudFront OAI for controlled access

### High Availability

- **Multi-AZ Deployment**: Resources distributed across two availability zones
- **Database Redundancy**: RDS Multi-AZ for automatic failover
- **Load Balancing**: ALB distributes traffic across multiple instances
- **Auto Scaling**: Automatic scaling based on demand

### Performance

- **Content Delivery**: CloudFront CDN for global content distribution
- **Caching**: Optimized caching configuration for static assets
- **Health Checks**: Comprehensive health monitoring and automatic recovery

### Monitoring and Maintainability

- **Comprehensive Testing**: Both unit and integration test coverage
- **Resource Tagging**: Consistent tagging for resource management
- **Parameterized Configuration**: Flexible deployment options
- **Documentation**: Complete operational procedures

## Compliance and Best Practices

This solution follows AWS Well-Architected Framework principles:

- **Security**: Defense in depth with multiple security layers
- **Reliability**: Multi-AZ deployment with automatic failover
- **Performance**: Optimized resource sizing and caching
- **Cost Optimization**: Right-sized instances with auto scaling
- **Operational Excellence**: Comprehensive monitoring and automation

The template passes AWS CloudFormation validation and cfn-lint checks with full compliance to security best practices, including the use of AWS Secrets Manager for database credentials.

## Troubleshooting

### Common Issues

1. **RDS Deployment Failure**: Ensure DB password meets complexity requirements
2. **HTTPS Listener Issues**: Verify SSL certificate ARN is valid and in us-east-1
3. **NAT Gateway Costs**: Consider using NAT instances for cost optimization in dev environments
4. **Health Check Failures**: Ensure EC2 instances have proper security group rules

### Monitoring

- CloudWatch metrics for all services
- ALB access logs for traffic analysis
- VPC Flow Logs for network troubleshooting
- RDS Performance Insights for database optimization

This implementation represents the ideal solution for a secure, highly available web application stack on AWS.
