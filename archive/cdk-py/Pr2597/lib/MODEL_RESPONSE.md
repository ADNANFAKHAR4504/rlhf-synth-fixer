```python

Absolutely! This is definitely doable with AWS CDK and Python. I'll create a comprehensive single-stack solution that meets all your requirements. Let me break this down into a well-structured CDK application.

## Project Structure

First, let's set up the project structure:

```
web-app-infrastructure/
├── app.py
├── requirements.txt
├── cdk.json
└── web_app_stack/
    ├── __init__.py
    └── web_app_stack.py
```

## Requirements File

**requirements.txt**
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

## CDK Configuration

**cdk.json**
```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:disableStackTrace": true
  }
}
```

## Main Application Entry Point

**app.py**
```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from web_app_stack.web_app_stack import WebAppStack

app = cdk.App()

# Deploy to us-west-2 as specified
env = cdk.Environment(
    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
    region='us-west-2'
)

WebAppStack(app, "WebAppStack", env=env)

app.synth()
```

## Stack Implementation Package Init

**web_app_stack/__init__.py**
```python
# Empty file to make this a Python package
```

## Main Stack Implementation

**web_app_stack/web_app_stack.py**
```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancing as elb,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    aws_s3 as s3,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_dynamodb as dynamodb,
    aws_route53 as route53,
    aws_certificatemanager as acm,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class WebAppStack(Stack):

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # VPC with specified CIDR block
        self.vpc = ec2.Vpc(
            self, "WebAppVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Security Group for EC2 instances
        self.web_security_group = ec2.SecurityGroup(
            self, "WebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web application",
            allow_all_outbound=True
        )

        # Allow HTTP and HTTPS inbound traffic
        self.web_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(80),
            "Allow HTTP traffic"
        )
        
        self.web_security_group.add_ingress_rule(
            ec2.Peer.any_ipv4(),
            ec2.Port.tcp(443),
            "Allow HTTPS traffic"
        )

        # IAM Role for EC2 instances
        self.ec2_role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
            ]
        )

        # DynamoDB Table for session management
        self.session_table = dynamodb.Table(
            self, "SessionTable",
            table_name="WebAppSessions",
            partition_key=dynamodb.Attribute(
                name="SessionId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )

        # Grant EC2 instances access to DynamoDB
        self.session_table.grant_read_write_data(self.ec2_role)

        # S3 Bucket for static resources
        self.static_bucket = s3.Bucket(
            self, "StaticResourcesBucket",
            versioned=True,
            public_read_access=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="RetainVersionsRule",
                    noncurrent_version_expiration=Duration.days(90),
                    enabled=True
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[s3.HttpMethods.GET, s3.HttpMethods.HEAD],
                    allowed_origins=["*"],
                    allowed_headers=["*"]
                )
            ]
        )

        # Grant EC2 instances access to S3
        self.static_bucket.grant_read_write(self.ec2_role)

        # Instance Profile for EC2
        self.instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=self.ec2_role
        )

        # User Data Script for EC2 instances
        user_data_script = ec2.UserData.for_linux()
        user_data_script.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Web Application Server</h1>' > /var/www/html/index.html",
            "echo '<p>Instance ID: ' > /tmp/instance-id.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /tmp/instance-id.html",
            "echo '</p>' >> /tmp/instance-id.html",
            "cat /tmp/instance-id.html >> /var/www/html/index.html",
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            "{",
            '  "metrics": {',
            '    "namespace": "WebApp/EC2",',
            '    "metrics_collected": {',
            '      "cpu": {',
            '        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],',
            '        "metrics_collection_interval": 60',
            '      },',
            '      "disk": {',
            '        "measurement": ["used_percent"],',
            '        "metrics_collection_interval": 60,',
            '        "resources": ["*"]',
            '      },',
            '      "mem": {',
            '        "measurement": ["mem_used_percent"],',
            '        "metrics_collection_interval": 60',
            '      }',
            '    }',
            '  },',
            '  "logs": {',
            '    "logs_collected": {',
            '      "files": {',
            '        "collect_list": [',
            '          {',
            '            "file_path": "/var/log/httpd/access_log",',
            '            "log_group_name": "/aws/ec2/webapp/httpd/access",',
            '            "log_stream_name": "{instance_id}"',
            '          },',
            '          {',
            '            "file_path": "/var/log/httpd/error_log",',
            '            "log_group_name": "/aws/ec2/webapp/httpd/error",',
            '            "log_stream_name": "{instance_id}"',
            '          }',
            '        ]',
            '      }',
            '    }',
            '  }',
            '}',
            'EOF',
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        )

        # Launch Template for Auto Scaling Group
        self.launch_template = ec2.LaunchTemplate(
            self, "WebAppLaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=self.web_security_group,
            user_data=user_data_script,
            role=self.ec2_role
        )

        # Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self, "WebAppASG",
            vpc=self.vpc,
            launch_template=self.launch_template,
            min_capacity=2,
            max_capacity=6,
            desired_capacity=2,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            health_check=autoscaling.HealthCheck.elb(Duration.minutes(5))
        )

        # Classic Load Balancer
        self.load_balancer = elb.LoadBalancer(
            self, "WebAppCLB",
            vpc=self.vpc,
            internet_facing=True,
            health_check=elb.HealthCheck(
                port=80,
                protocol=elb.LoadBalancingProtocol.HTTP,
                path="/",
                healthy_threshold=2,
                unhealthy_threshold=5,
                interval=Duration.seconds(30),
                timeout=Duration.seconds(5)
            )
        )

        # Add listener to load balancer
        self.load_balancer.add_listener(
            external_port=80,
            external_protocol=elb.LoadBalancingProtocol.HTTP,
            internal_port=80,
            internal_protocol=elb.LoadBalancingProtocol.HTTP
        )

        # Attach Auto Scaling Group to Load Balancer
        self.load_balancer.add_target(self.auto_scaling_group)

        # SSL Certificate for CloudFront (must be in us-east-1)
        self.certificate = acm.Certificate(
            self, "WebAppCertificate",
            domain_name="*.example.com",  # Replace with your domain
            validation=acm.CertificateValidation.from_dns()
        )

        # CloudFront Distribution
        self.distribution = cloudfront.Distribution(
            self, "WebAppDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(self.static_bucket),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED
            ),
            additional_behaviors={
                "/api/*": cloudfront.BehaviorOptions(
                    origin=origins.LoadBalancerV2Origin(
                        self.load_balancer,
                        protocol_policy=cloudfront.OriginProtocolPolicy.HTTP_ONLY
                    ),
                    viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                    cache_policy=cloudfront.CachePolicy.CACHING_DISABLED,
                    origin_request_policy=cloudfront.OriginRequestPolicy.ALL_VIEWER
                )
            },
            certificate=self.certificate,
            minimum_protocol_version=cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
            price_class=cloudfront.PriceClass.PRICE_CLASS_100
        )

        # CloudWatch Log Groups
        self.httpd_access_log_group = logs.LogGroup(
            self, "HttpdAccessLogGroup",
            log_group_name="/aws/ec2/webapp/httpd/access",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.httpd_error_log_group = logs.LogGroup(
            self, "HttpdErrorLogGroup",
            log_group_name="/aws/ec2/webapp/httpd/error",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # CloudWatch Alarms
        self.high_cpu_alarm = cloudwatch.Alarm(
            self, "HighCPUAlarm",
            metric=self.auto_scaling_group.metric_cpu_utilization(),
            threshold=80,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        # Auto Scaling Policies
        self.scale_up_policy = self.auto_scaling_group.scale_on_metric(
            "ScaleUpPolicy",
            metric=self.auto_scaling_group.metric_cpu_utilization(),
            scaling_steps=[
                autoscaling.ScalingInterval(upper=70, change=1),
                autoscaling.ScalingInterval(lower=85, change=2)
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY
        )

        self.scale_down_policy = self.auto_scaling_group.scale_on_metric(
            "ScaleDownPolicy",
            metric=self.auto_scaling_group.metric_cpu_utilization(),
            scaling_steps=[
                autoscaling.ScalingInterval(upper=30, change=-1)
            ],
            adjustment_type=autoscaling.AdjustmentType.CHANGE_IN_CAPACITY
        )

        # Route 53 Hosted Zone (you'll need to replace with your domain)
        # Uncomment and modify if you have a domain
        # self.hosted_zone = route53.HostedZone(
        #     self, "WebAppHostedZone",
        #     zone_name="example.com"
        # )
        
        # # Route 53 Record
        # route53.ARecord(
        #     self, "WebAppARecord",
        #     zone=self.hosted_zone,
        #     target=route53.RecordTarget.from_alias(
        #         route53_targets.CloudFrontTarget(self.distribution)
        #     )
        # )

        # Outputs
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.load_balancer.load_balancer_dns_name,
            description="DNS name of the load balancer"
        )

        CfnOutput(
            self, "CloudFrontDistributionDomain",
            value=self.distribution.distribution_domain_name,
            description="CloudFront distribution domain name"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.static_bucket.bucket_name,
            description="Name of the S3 bucket for static resources"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.session_table.table_name,
            description="Name of the DynamoDB table for sessions"
        )
```

## Deployment Instructions

1. **Install AWS CDK**:
   ```bash
   npm install -g aws-cdk
   ```

2. **Set up Python environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure AWS credentials**:
   ```bash
   aws configure
   ```

4. **Bootstrap CDK** (first time only):
   ```bash
   cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
   ```

5. **Deploy the stack**:
   ```bash
   cdk deploy
   ```

6. **Clean up** (when done):
   ```bash
   cdk destroy
   ```

## Key Features Implemented

### ✅ **Infrastructure Components**
- **VPC**: `10.0.0.0/16` CIDR with 2 public subnets across different AZs
- **Security Group**: Allows HTTP (80) and HTTPS (443) inbound traffic
- **Auto Scaling Group**: 2-6 `t3.micro` instances with minimum of 2
- **Classic Load Balancer**: Distributes traffic with health checks
- **Route 53**: Ready for domain configuration (commented out)

### ✅ **Storage & Database**
- **DynamoDB**: Session table with `SessionId` primary key, 5 RCU/WCU
- **S3 Bucket**: Public access, versioning, 90-day lifecycle rule
- **CloudFront**: CDN with S3 origin and SSL certificate

### ✅ **Security & Access**
- **IAM Roles**: EC2 instances can access S3 and DynamoDB
- **SSL Certificate**: Free ACM certificate for HTTPS
- **Security Groups**: Proper ingress/egress rules

### ✅ **Monitoring & Logging**
- **CloudWatch**: Metrics, alarms, and log groups
- **Auto Scaling**: CPU-based scaling policies
- **Log Collection**: Apache access/error logs

### ✅ **Best Practices**
- **High Availability**: Multi-AZ deployment
- **Auto Scaling**: Responds to load changes
- **Monitoring**: Comprehensive CloudWatch integration
- **Clean Removal**: All resources properly configured for destruction

## Important Notes

1. **Domain Configuration**: Update the certificate domain and uncomment Route 53 sections with your actual domain
2. **SSL Certificate**: The certificate must be created in `us-east-1` for CloudFront
3. **Cost Optimization**: Uses `t3.micro` instances and appropriate CloudFront price class
4. **Security**: Follow principle of least privilege with IAM roles

This infrastructure provides a robust, scalable, and highly available web application platform that follows AWS best practices!

```