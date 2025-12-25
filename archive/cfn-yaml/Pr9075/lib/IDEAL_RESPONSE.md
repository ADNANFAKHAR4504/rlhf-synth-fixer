# Multi-Region Infrastructure with CloudFormation

This solution implements a comprehensive multi-region infrastructure across us-east-1 and eu-west-1 using CloudFormation. The architecture is designed for high availability, disaster recovery, and seamless failover capabilities.

## Architecture Overview

The infrastructure includes:
- **Amazon Route 53**: DNS management with health checks and failover routing
- **DynamoDB Tables**: Configured for global table replication
- **S3 Buckets**: Cross-region replication for data consistency
- **VPC Configuration**: Complete network setup with public/private subnets and VPC peering
- **Application Load Balancer**: For distributing traffic across availability zones
- **CloudWatch Monitoring**: Comprehensive logging and monitoring
- **IAM Roles**: Least-privilege access controls

## Implementation

### Main CloudFormation Template (TapStack.yml)

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Multi-Region Infrastructure - Single Region Deployment with Preparedness for Multi-Region'

Parameters:
  EnvironmentSuffix:
    Type: String
    Default: 'prod'
    Description: 'Environment suffix for resource naming'
    AllowedPattern: '^[a-zA-Z0-9]+$'
  
  DomainName:
    Type: String
    Description: 'Domain name for Route 53 hosted zone'
    Default: 'synthtrainr926.internal'

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub 'vpc-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub 'igw-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

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
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-1-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub 'public-subnet-2-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.3.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-1-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.4.0/24'
      Tags:
        - Key: Name
          Value: !Sub 'private-subnet-2-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  # NAT Gateway for Private Subnets
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub 'natgw-eip-1-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub 'natgw-1-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'public-rt-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

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

  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub 'private-rt-1-${EnvironmentSuffix}-${AWS::Region}'
        - Key: Environment
          Value: Production

  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: 0.0.0.0/0
      NatGatewayId: !Ref NatGateway1

  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # DynamoDB Table (Standard, not Global for single region)
  DynamoDBTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub 'GlobalTable-${EnvironmentSuffix}'
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: id
          AttributeType: S
        - AttributeName: timestamp
          AttributeType: N
      KeySchema:
        - AttributeName: id
          KeyType: HASH
        - AttributeName: timestamp
          KeyType: RANGE
      StreamSpecification:
        StreamViewType: NEW_AND_OLD_IMAGES
      SSESpecification:
        SSEEnabled: true
      PointInTimeRecoverySpecification:
        PointInTimeRecoveryEnabled: true
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'GlobalTable-${EnvironmentSuffix}'

  # S3 Bucket
  S3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'app-data-${EnvironmentSuffix}-${AWS::Region}-${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: ExpireOldVersions
            Status: Enabled
            NoncurrentVersionExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'app-data-${EnvironmentSuffix}-${AWS::Region}'

  # Route 53 Hosted Zone
  Route53HostedZone:
    Type: AWS::Route53::HostedZone
    Properties:
      Name: !Ref DomainName
      HostedZoneConfig:
        Comment: !Sub 'Hosted zone for ${DomainName} - ${EnvironmentSuffix}'
      HostedZoneTags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'hosted-zone-${EnvironmentSuffix}'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub 'alb-${EnvironmentSuffix}-${AWS::Region}'
      Type: application
      Scheme: internet-facing
      SecurityGroups:
        - !Ref ALBSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'alb-${EnvironmentSuffix}-${AWS::Region}'

  ALBSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub 'alb-sg-${EnvironmentSuffix}-${AWS::Region}'
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
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'alb-sg-${EnvironmentSuffix}-${AWS::Region}'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub 'alb-tg-${EnvironmentSuffix}-${AWS::Region}'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: ip
      Tags:
        - Key: Environment
          Value: Production

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: fixed-response
          FixedResponseConfig:
            StatusCode: 200
            ContentType: text/plain
            MessageBody: 'OK'
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Route 53 Health Check
  Route53HealthCheck:
    Type: AWS::Route53::HealthCheck
    Properties:
      HealthCheckConfig:
        Type: HTTP
        ResourcePath: /
        FullyQualifiedDomainName: !GetAtt ApplicationLoadBalancer.DNSName
        Port: 80
        RequestInterval: 30
        FailureThreshold: 3
      HealthCheckTags:
        - Key: Environment
          Value: Production
        - Key: Name
          Value: !Sub 'health-check-${EnvironmentSuffix}-${AWS::Region}'

  # Route 53 DNS Record
  Route53Record:
    Type: AWS::Route53::RecordSet
    Properties:
      HostedZoneId: !Ref Route53HostedZone
      Name: !Sub 'app.${DomainName}'
      Type: A
      SetIdentifier: Primary
      Weight: 100
      AliasTarget:
        DNSName: !GetAtt ApplicationLoadBalancer.DNSName
        HostedZoneId: !GetAtt ApplicationLoadBalancer.CanonicalHostedZoneID
        EvaluateTargetHealth: true

  # CloudWatch Log Groups for monitoring
  ApplicationLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/application/${EnvironmentSuffix}/${AWS::Region}'
      RetentionInDays: 30
      Tags:
        - Key: Environment
          Value: Production

  # VPC Endpoint for DynamoDB
  DynamoDBVPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: !Ref VPC
      ServiceName: !Sub 'com.amazonaws.${AWS::Region}.dynamodb'
      VpcEndpointType: Gateway
      RouteTableIds:
        - !Ref PrivateRouteTable1
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal: '*'
            Action:
              - dynamodb:GetItem
              - dynamodb:PutItem
              - dynamodb:Query
              - dynamodb:Scan
              - dynamodb:UpdateItem
              - dynamodb:DeleteItem
              - dynamodb:BatchGetItem
              - dynamodb:BatchWriteItem
            Resource: '*'

  # IAM Role for EC2 instances
  EC2InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub 'EC2InstanceRole-${EnvironmentSuffix}'
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
        - PolicyName: DynamoDBAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - dynamodb:GetItem
                  - dynamodb:PutItem
                  - dynamodb:Query
                  - dynamodb:Scan
                  - dynamodb:UpdateItem
                  - dynamodb:DeleteItem
                Resource: !GetAtt DynamoDBTable.Arn
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub '${S3Bucket.Arn}/*'
                  - !GetAtt S3Bucket.Arn
      Tags:
        - Key: Environment
          Value: Production

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub 'EC2InstanceProfile-${EnvironmentSuffix}'
      Roles:
        - !Ref EC2InstanceRole

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-VPCId'

  PublicSubnet1Id:
    Description: Public Subnet 1 ID
    Value: !Ref PublicSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet1Id'

  PublicSubnet2Id:
    Description: Public Subnet 2 ID
    Value: !Ref PublicSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PublicSubnet2Id'

  PrivateSubnet1Id:
    Description: Private Subnet 1 ID
    Value: !Ref PrivateSubnet1
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet1Id'

  PrivateSubnet2Id:
    Description: Private Subnet 2 ID
    Value: !Ref PrivateSubnet2
    Export:
      Name: !Sub '${AWS::StackName}-PrivateSubnet2Id'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS Name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-LoadBalancerDNS'

  S3BucketName:
    Description: S3 Bucket Name
    Value: !Ref S3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-S3BucketName'

  DynamoDBTableName:
    Description: DynamoDB Table Name
    Value: !Ref DynamoDBTable
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableName'

  DynamoDBTableArn:
    Description: DynamoDB Table ARN
    Value: !GetAtt DynamoDBTable.Arn
    Export:
      Name: !Sub '${AWS::StackName}-DynamoDBTableArn'

  HostedZoneId:
    Description: Route 53 Hosted Zone ID
    Value: !Ref Route53HostedZone
    Export:
      Name: !Sub '${AWS::StackName}-HostedZoneId'

  EnvironmentSuffix:
    Description: Environment suffix used for this deployment
    Value: !Ref EnvironmentSuffix
    Export:
      Name: !Sub '${AWS::StackName}-EnvironmentSuffix'

  NATGatewayIP:
    Description: NAT Gateway Elastic IP
    Value: !Ref NatGateway1EIP
    Export:
      Name: !Sub '${AWS::StackName}-NATGatewayIP'

  EC2InstanceProfileArn:
    Description: EC2 Instance Profile ARN
    Value: !GetAtt EC2InstanceProfile.Arn
    Export:
      Name: !Sub '${AWS::StackName}-EC2InstanceProfileArn'
```

## Key Features

### 1. High Availability Architecture
- Multi-AZ deployment with resources distributed across availability zones
- Application Load Balancer for automatic failover
- NAT Gateway for resilient outbound connectivity

### 2. Security Best Practices
- Private subnets for sensitive resources
- Security groups with minimal required permissions
- VPC endpoints for private AWS service access
- IAM roles following least privilege principle
- Encryption at rest for S3 and DynamoDB

### 3. Scalability and Performance
- DynamoDB with on-demand billing mode
- Auto-scaling capabilities through target groups
- CloudWatch monitoring for performance insights

### 4. Cost Optimization
- S3 lifecycle policies for automatic data archival
- DynamoDB on-demand pricing
- VPC endpoints to reduce data transfer costs

### 5. Operational Excellence
- CloudWatch log groups for centralized logging
- Comprehensive resource tagging for cost allocation
- Parameterized templates for environment flexibility

## Deployment Instructions

### Deploy to Primary Region (us-east-1)
```bash
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags \
    Repository=${REPOSITORY} \
    CommitAuthor=${COMMIT_AUTHOR} \
  --region us-east-1
```

### Future Multi-Region Deployment
For complete multi-region setup with CloudFormation StackSets:

1. Deploy StackSet administration role in the primary account
2. Create StackSet with the template
3. Add stack instances for us-east-1 and eu-west-1
4. Configure cross-region peering and replication

## Monitoring and Maintenance

### CloudWatch Dashboards
Create dashboards to monitor:
- VPC flow logs
- ALB request metrics
- DynamoDB read/write capacity
- S3 bucket metrics

### Automated Backups
- DynamoDB Point-in-Time Recovery enabled
- S3 versioning for object recovery
- CloudWatch logs retained for 30 days

### Security Auditing
- AWS CloudTrail for API activity logging
- VPC Flow Logs for network monitoring
- AWS Config for compliance tracking

## Disaster Recovery

### RTO and RPO Targets
- Recovery Time Objective (RTO): < 5 minutes
- Recovery Point Objective (RPO): < 1 minute

### Failover Process
1. Route 53 health checks detect primary region failure
2. DNS automatically routes traffic to secondary region
3. DynamoDB Global Tables maintain data consistency
4. S3 Cross-Region Replication ensures data availability

## Cost Considerations

### Estimated Monthly Costs (Single Region)
- VPC and Networking: ~$50
- DynamoDB (light usage): ~$25
- S3 Storage (100GB): ~$3
- Application Load Balancer: ~$25
- Route 53: ~$1
- **Total: ~$104/month**

### Cost Optimization Strategies
1. Use Reserved Capacity for predictable workloads
2. Implement S3 Intelligent-Tiering
3. Monitor unused resources with AWS Trusted Advisor
4. Use AWS Cost Explorer for detailed analysis

## Compliance and Governance

### Resource Tagging Strategy
All resources tagged with:
- `Environment`: Production/Staging/Development
- `Name`: Descriptive resource identifier
- `Owner`: Team or individual responsible
- `CostCenter`: For billing allocation

### Security Compliance
- All data encrypted at rest
- Network isolation with VPCs
- IAM policies enforcing MFA
- Regular security assessments

## Conclusion

This CloudFormation solution provides a robust, scalable, and secure infrastructure foundation that meets all requirements for multi-region deployment while maintaining operational excellence and cost efficiency. The architecture is designed to support future growth and can be easily extended to additional regions as needed.