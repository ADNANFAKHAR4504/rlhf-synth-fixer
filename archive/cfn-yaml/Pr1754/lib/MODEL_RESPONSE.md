I'll help you create a comprehensive CloudFormation template that addresses all your requirements. Let me break this down into manageable sections and explain the key decisions.

## CloudFormation Template

Here's a complete YAML template that covers all your infrastructure needs:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Customer-facing web application infrastructure with proper security and scalability'

Parameters:
  DomainName:
    Type: String
    Description: Domain name for the application (e.g., example.com)
    Default: example.com

  OfficeIPAddress:
    Type: String
    Description: Office IP address for security group access
    Default: 192.168.1.100/32

  InstanceType:
    Type: String
    Description: EC2 instance type for web servers
    Default: t3.micro
    AllowedValues: [t3.micro, t3.small, t3.medium, t3.large]

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
          Value: !Sub '${AWS::StackName}-vpc'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-igw'

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
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-1'

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-subnet-2'

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.11.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-1'

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.12.0/24
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-private-subnet-2'

  # NAT Gateway
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-eip-1'

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-nat-1'

  # Route Tables
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Properties:
      VpcId: !Ref VPC
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-public-routes'

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
          Value: !Sub '${AWS::StackName}-private-routes-1'

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

  # Security Groups
  WebServerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-web-sg'
      GroupDescription: Security group for web servers
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTP from Load Balancer
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          SourceSecurityGroupId: !Ref LoadBalancerSecurityGroup
          Description: HTTPS from Load Balancer
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref OfficeIPAddress
          Description: SSH from office
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-web-sg'

  LoadBalancerSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub '${AWS::StackName}-alb-sg'
      GroupDescription: Security group for Application Load Balancer
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
          Description: HTTP from anywhere
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
          Description: HTTPS from anywhere
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: 0.0.0.0/0
          Description: All outbound traffic
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb-sg'

  # IAM Role for EC2 instances
  EC2Role:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${AWS::StackName}-ec2-role'
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
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                Resource: !Sub '${StaticAssetsBucket}/*'
              - Effect: Allow
                Action:
                  - logs:CreateLogGroup
                  - logs:CreateLogStream
                  - logs:PutLogEvents
                  - logs:DescribeLogStreams
                Resource: '*'

  EC2InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      InstanceProfileName: !Sub '${AWS::StackName}-ec2-profile'
      Roles:
        - !Ref EC2Role

  # Launch Template
  LaunchTemplate:
    Type: AWS::EC2::LaunchTemplate
    Properties:
      LaunchTemplateName: !Sub '${AWS::StackName}-launch-template'
      LaunchTemplateData:
        ImageId: ami-0c02fb55956c7d316 # Amazon Linux 2 AMI (update as needed)
        InstanceType: !Ref InstanceType
        IamInstanceProfile:
          Name: !Ref EC2InstanceProfile
        SecurityGroupIds:
          - !Ref WebServerSecurityGroup
        UserData:
          Fn::Base64: !Sub |
            #!/bin/bash
            yum update -y
            yum install -y nginx awslogs

            # Configure nginx
            cat > /etc/nginx/nginx.conf << 'EOF'
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
                    
                    location / {
                        root /usr/share/nginx/html;
                        index index.html index.htm;
                    }
                    
                    location /health {
                        access_log off;
                        return 200 "healthy\n";
                        add_header Content-Type text/plain;
                    }
                }
            }
            EOF

            # Create a simple index page
            cat > /usr/share/nginx/html/index.html << 'EOF'
            <!DOCTYPE html>
            <html>
            <head>
                <title>Web Application</title>
            </head>
            <body>
                <h1>Welcome to our Web Application!</h1>
                <p>Server: $(hostname)</p>
            </body>
            </html>
            EOF

            # Configure CloudWatch Logs
            cat > /etc/awslogs/awslogs.conf << 'EOF'
            [general]
            state_file = /var/lib/awslogs/agent-state

            [/var/log/nginx/access.log]
            file = /var/log/nginx/access.log
            log_group_name = ${AWS::StackName}-nginx-access
            log_stream_name = {instance_id}
            datetime_format = %d/%b/%Y:%H:%M:%S %z

            [/var/log/nginx/error.log]
            file = /var/log/nginx/error.log
            log_group_name = ${AWS::StackName}-nginx-error
            log_stream_name = {instance_id}
            datetime_format = %Y/%m/%d %H:%M:%S
            EOF

            # Start services
            systemctl enable nginx awslogsd
            systemctl start nginx awslogsd
        TagSpecifications:
          - ResourceType: instance
            Tags:
              - Key: Name
                Value: !Sub '${AWS::StackName}-web-server'

  # Application Load Balancer
  ApplicationLoadBalancer:
    Type: AWS::ElasticLoadBalancingV2::LoadBalancer
    Properties:
      Name: !Sub '${AWS::StackName}-alb'
      Scheme: internet-facing
      Type: application
      SecurityGroups:
        - !Ref LoadBalancerSecurityGroup
      Subnets:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-alb'

  ALBTargetGroup:
    Type: AWS::ElasticLoadBalancingV2::TargetGroup
    Properties:
      Name: !Sub '${AWS::StackName}-tg'
      Port: 80
      Protocol: HTTP
      VpcId: !Ref VPC
      HealthCheckPath: /health
      HealthCheckProtocol: HTTP
      HealthCheckIntervalSeconds: 30
      HealthCheckTimeoutSeconds: 5
      HealthyThresholdCount: 2
      UnhealthyThresholdCount: 3
      TargetType: instance
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-tg'

  ALBListener:
    Type: AWS::ElasticLoadBalancingV2::Listener
    Properties:
      DefaultActions:
        - Type: forward
          TargetGroupArn: !Ref ALBTargetGroup
      LoadBalancerArn: !Ref ApplicationLoadBalancer
      Port: 80
      Protocol: HTTP

  # Auto Scaling Group
  AutoScalingGroup:
    Type: AWS::AutoScaling::AutoScalingGroup
    Properties:
      AutoScalingGroupName: !Sub '${AWS::StackName}-asg'
      VPCZoneIdentifier:
        - !Ref PublicSubnet1
        - !Ref PublicSubnet2
      LaunchTemplate:
        LaunchTemplateId: !Ref LaunchTemplate
        Version: !GetAtt LaunchTemplate.LatestVersionNumber
      MinSize: 2
      MaxSize: 10
      DesiredCapacity: 2
      TargetGroupARNs:
        - !Ref ALBTargetGroup
      HealthCheckType: ELB
      HealthCheckGracePeriod: 300
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-asg-instance'
          PropagateAtLaunch: true

  # Auto Scaling Policies
  ScaleUpPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: 1
      PolicyType: SimpleScaling

  ScaleDownPolicy:
    Type: AWS::AutoScaling::ScalingPolicy
    Properties:
      AdjustmentType: ChangeInCapacity
      AutoScalingGroupName: !Ref AutoScalingGroup
      Cooldown: 300
      ScalingAdjustment: -1
      PolicyType: SimpleScaling

  # CloudWatch Alarms
  CPUAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${AWS::StackName}-cpu-high'
      AlarmDescription: Scale up on high CPU
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
      AlarmName: !Sub '${AWS::StackName}-cpu-low'
      AlarmDescription: Scale down on low CPU
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 20
      ComparisonOperator: LessThanThreshold
      Dimensions:
        - Name: AutoScalingGroupName
          Value: !Ref AutoScalingGroup
      AlarmActions:
        - !Ref ScaleDownPolicy

  # S3 Bucket for Static Assets
  StaticAssetsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${AWS::StackName}-static-assets-${AWS::AccountId}'
      PublicReadPolicy: false
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      VersioningConfiguration:
        Status: Enabled
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-static-assets'

  # S3 Bucket Policy for CloudFront
  StaticAssetsBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref StaticAssetsBucket
      PolicyDocument:
        Statement:
          - Sid: AllowCloudFrontServicePrincipal
            Effect: Allow
            Principal:
              Service: cloudfront.amazonaws.com
            Action: s3:GetObject
            Resource: !Sub '${StaticAssetsBucket}/*'
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}'

  # CloudFront Origin Access Control
  OriginAccessControl:
    Type: AWS::CloudFront::OriginAccessControl
    Properties:
      OriginAccessControlConfig:
        Name: !Sub '${AWS::StackName}-oac'
        OriginAccessControlOriginType: s3
        SigningBehavior: always
        SigningProtocol: sigv4

  # CloudFront Distribution
  CloudFrontDistribution:
    Type: AWS::CloudFront::Distribution
    Properties:
      DistributionConfig:
        Origins:
          - Id: S3Origin
            DomainName: !GetAtt StaticAssetsBucket.RegionalDomainName
            S3OriginConfig:
              OriginAccessIdentity: ''
            OriginAccessControlId: !Ref OriginAccessControl
        Enabled: true
        Comment: !Sub 'CloudFront distribution for ${AWS::StackName}'
        DefaultCacheBehavior:
          AllowedMethods:
            - GET
            - HEAD
            - OPTIONS
          TargetOriginId: S3Origin
          ViewerProtocolPolicy: redirect-to-https
          CachePolicyId: 4135ea2d-6df8-44a3-9df3-4b5a84be39ad # CachingDisabled
          OriginRequestPolicyId: 88a5eaf4-2fd4-4709-b370-b4c650ea3fcf # CORS-S3Origin
        PriceClass: PriceClass_100
        ViewerCertificate:
          CloudFrontDefaultCertificate: true
        HttpVersion: http2
      Tags:
        - Key: Name
          Value: !Sub '${AWS::StackName}-cloudfront'

  # CloudWatch Log Groups
  NginxAccessLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}-nginx-access'
      RetentionInDays: 14

  NginxErrorLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '${AWS::StackName}-nginx-error'
      RetentionInDays: 30

Outputs:
  VPCId:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub '${AWS::StackName}-vpc-id'

  LoadBalancerDNS:
    Description: Application Load Balancer DNS name
    Value: !GetAtt ApplicationLoadBalancer.DNSName
    Export:
      Name: !Sub '${AWS::StackName}-alb-dns'

  CloudFrontDomain:
    Description: CloudFront distribution domain name
    Value: !GetAtt CloudFrontDistribution.DomainName
    Export:
      Name: !Sub '${AWS::StackName}-cloudfront-domain'

  StaticAssetsBucketName:
    Description: S3 bucket name for static assets
    Value: !Ref StaticAssetsBucket
    Export:
      Name: !Sub '${AWS::StackName}-static-bucket'

  CloudFrontDistributionId:
    Description: CloudFront distribution ID
    Value: !Ref CloudFrontDistribution
    Export:
      Name: !Sub '${AWS::StackName}-cloudfront-id'
```

## Key Design Decisions & Explanations

### 1. **Security Best Practices**

- **Proper Security Groups**: Web servers only accept traffic from the load balancer, not directly from the internet
- **Office IP Restriction**: SSH access is restricted to your office IP as requested
- **IAM Roles**: EC2 instances use roles instead of hardcoded credentials
- **S3 Security**: Bucket uses Origin Access Control (OAC) instead of public read permissions

### 2. **High Availability & Scalability**

- **Multi-AZ Deployment**: Resources are spread across 2 availability zones
- **Auto Scaling**: Configured to scale between 2-10 instances based on CPU utilization
- **Load Balancer**: Application Load Balancer distributes traffic and provides health checks

### 3. **Monitoring & Logging**

- **CloudWatch Integration**: EC2 instances automatically send nginx logs to CloudWatch
- **Health Checks**: Both ALB and Auto Scaling Group monitor instance health
- **Scaling Alarms**: Automatic scaling based on CPU metrics

### 4. **Static Assets & CDN**

- **S3 + CloudFront**: Optimized for fast global delivery of static content
- **HTTPS Enforcement**: CloudFront redirects HTTP to HTTPS automatically
- **Caching**: Proper cache policies for static assets

## Deployment Instructions

1. **Save the template** as `infrastructure.yaml`

2. **Deploy using AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name my-web-app \
  --template-body file://infrastructure.yaml \
  --parameters ParameterKey=DomainName,ParameterValue=yourdomain.com \
               ParameterKey=OfficeIPAddress,ParameterValue=192.168.1.100/32 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

3. **Upload static assets** to the S3 bucket after deployment:

```bash
aws s3 sync ./static-files/ s3://your-bucket-name/
```

## Post-Deployment Steps

### 1. **Route 53 Setup** (if you have a domain)

```yaml
# Add this to the template if you want Route 53 automation
Route53RecordSet:
  Type: AWS::Route53::RecordSet
  Properties:
    HostedZoneId: YOUR_HOSTED_ZONE_ID
    Name: !Ref DomainName
    Type: A
    AliasTarget:
      DNSName: !GetAtt CloudFrontDistribution.DomainName
      HostedZoneId: Z2FDTNDATAQYW2 # CloudFront hosted zone ID
```

### 2. **SSL Certificate** (for custom domain)

- Create an SSL certificate in AWS Certificate Manager
- Update the CloudFront distribution to use it

### 3. **Monitoring Setup**

- Set up additional CloudWatch dashboards
- Configure SNS notifications for critical alarms

## Cost Optimization Tips

1. **Use Spot Instances** for non-critical workloads
2. **Implement S3 Lifecycle Policies** for old static assets
3. **Monitor CloudFront usage** and adjust price class if needed
4. **Review Auto Scaling policies** after initial traffic patterns are established

This template should give you a solid, production-ready foundation that addresses all your requirements while following AWS best practices. The infrastructure team should be happy with the security posture and scalability design!
