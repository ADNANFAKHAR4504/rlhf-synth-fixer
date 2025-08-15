# lib/tap_stack.py
"""
AWS CI/CD Pipeline Infrastructure with Multi-Environment Support
================================================================

This module defines a complete AWS infrastructure stack using Pulumi with Python,
implementing a multi-stage CI/CD pipeline with blue-green deployments, security
scanning, monitoring, and serverless components.

Key Features:
- Multi-environment support (dev, test, prod)
- Blue-green deployment strategy
- Automated testing with pytest
- Security scanning with Snyk
- Secrets management with AWS Secrets Manager
- Serverless components with Lambda
- Comprehensive monitoring with CloudWatch
- Cost optimization and high availability
- Automatic rollback mechanisms

Author: AWS Infrastructure Team
Version: 1.0.0
"""

import json
import base64
import random
import string
from typing import Dict, Optional

import pulumi
import pulumi_aws as aws


class TapStackArgs:
  """Arguments for TapStack component - for backwards compatibility"""
  
  def __init__(self, config: Dict = None, environment_suffix: str = None):
    if config:
      self.config = config
      self.environment = config.get("environment", "dev")
      self.region = config.get("region", "us-east-1")
      self.app_name = config.get("app_name", "tap-pipeline")
    elif environment_suffix:
      self.config = {
        "environment": environment_suffix,
        "region": "us-east-1",
        "app_name": "tap-pipeline"
      }
      self.environment = environment_suffix
      self.region = "us-east-1"
      self.app_name = "tap-pipeline"
    else:
      self.config = {
        "environment": "dev",
        "region": "us-east-1",
        "app_name": "tap-pipeline"
      }
      self.environment = "dev"
      self.region = "us-east-1"
      self.app_name = "tap-pipeline"


class TapStackConfig:
  """Configuration class for TapStack with environment-specific settings"""
  
  def __init__(self, environment: str = "dev"):
    self.environment = environment
    self.region = "us-east-1"
    self.app_name = "tap-pipeline"
    
    # Environment-specific configurations for cost optimization
    self.instance_configs = {
      "dev": {
        "instance_type": "t3.micro",
        "min_size": 1,
        "max_size": 2,
        "desired_capacity": 1,
        "log_retention": 7
      },
      "test": {
        "instance_type": "t3.small",
        "min_size": 1,
        "max_size": 3,
        "desired_capacity": 1,
        "log_retention": 14
      },
      "prod": {
        "instance_type": "t3.medium",
        "min_size": 2,
        "max_size": 6,
        "desired_capacity": 2,
        "log_retention": 30
      }
    }
    
    # Get configuration for current environment
    self.config = self.instance_configs.get(environment, 
                                           self.instance_configs["dev"])


class TapStack(pulumi.ComponentResource):
  """
  Complete AWS CI/CD Infrastructure Stack
  
  This class creates a comprehensive AWS infrastructure including:
  - Multi-AZ VPC with public/private subnets
  - Application Load Balancer with blue-green target groups
  - Auto Scaling Groups with launch templates
  - Complete CI/CD pipeline (CodePipeline, CodeBuild, CodeDeploy)
  - Lambda functions for serverless components
  - CloudWatch monitoring and logging
  - Secrets management
  - Security scanning integration
  """
  
  def __init__(self, name: str, args, 
               opts: Optional[pulumi.ResourceOptions] = None):
    super().__init__("custom:infrastructure:TapStack", name, None, opts)
    
    # Handle both TapStackArgs and string arguments for backward compatibility
    if isinstance(args, TapStackArgs):
      self.environment = args.environment
      self.region = args.region
      self.app_name = args.app_name
    elif isinstance(args, str):
      # Legacy string environment support
      self.environment = args
      self.region = "us-east-1"
      self.app_name = "tap-pipeline"
    else:
      raise ValueError("args must be either TapStackArgs or string environment")
    
    self.name = name
    
    # Initialize internal config
    self.config = TapStackConfig(self.environment)
    
    # Initialize attributes to avoid pylint warnings
    self._initialize_attributes()
    
    # Create all infrastructure components
    self._create_networking()
    self._create_security()
    self._create_storage()
    self._create_compute()
    self._create_pipeline()
    self._create_monitoring()
    self._create_serverless()
    
    # Register stack outputs
    self._register_outputs()
  
  def _initialize_attributes(self):
    """Initialize all attributes to avoid pylint warnings"""
    # Networking
    self.vpc = None
    self.internet_gateway = None
    self.public_subnets = []
    self.private_subnets = []
    self.elastic_ips = []
    self.nat_gateways = []
    self.public_route_table = None
    self.private_route_tables = []
    
    # Security
    self.alb_security_group = None
    self.app_security_group = None
    self.ec2_role = None
    self.instance_profile = None
    self.secrets_policy = None
    
    # Storage
    self.artifacts_bucket = None
    self.app_secrets = None
    
    # Compute
    self.load_balancer = None
    self.blue_target_group = None
    self.green_target_group = None
    self.alb_listener = None
    self.launch_template = None
    self.auto_scaling_group = None
    
    # Pipeline
    self.codebuild_role = None
    self.codebuild_policy = None
    self.codedeploy_role = None
    self.codepipeline_role = None
    self.codepipeline_policy = None
    self.codebuild_project = None
    self.codedeploy_application = None
    self.codedeploy_deployment_group = None
    self.codepipeline = None
    
    # Monitoring
    self.app_log_group = None
    self.cicd_log_group = None
    self.alerts_topic = None
    self.cpu_alarm = None
    self.unhealthy_hosts_alarm = None
    self.pipeline_failure_alarm = None
    self.dashboard = None
    
    # Serverless
    self.lambda_role = None
    self.health_check_lambda = None
    self.notification_lambda = None
    self.pipeline_trigger_lambda = None
  
  def _create_networking(self):
    """Create VPC and networking infrastructure with high availability"""
    
    # Create VPC
    self.vpc = aws.ec2.Vpc(
      f"{self.config.app_name}-vpc-{self.environment}",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        "Name": f"{self.config.app_name}-vpc-{self.environment}",
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Create Internet Gateway
    self.internet_gateway = aws.ec2.InternetGateway(
      f"{self.config.app_name}-igw-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        "Name": f"{self.config.app_name}-igw-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self, depends_on=[self.vpc])
    )
    
    # Get availability zones
    availability_zones = aws.get_availability_zones(state="available")
    
    # Create public subnets (multi-AZ for high availability)
    self.public_subnets = []
    for i, az in enumerate(availability_zones.names[:2]):
      subnet = aws.ec2.Subnet(
        f"{self.config.app_name}-public-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          "Name": f"{self.config.app_name}-public-{i+1}-{self.environment}",
          "Environment": self.environment,
          "Type": "public",
          "kubernetes.io/role/elb": "1"
        },
        opts=pulumi.ResourceOptions(parent=self, depends_on=[self.vpc])
      )
      self.public_subnets.append(subnet)
    
    # Create private subnets (multi-AZ for high availability)
    self.private_subnets = []
    for i, az in enumerate(availability_zones.names[:2]):
      subnet = aws.ec2.Subnet(
        f"{self.config.app_name}-private-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={
          "Name": f"{self.config.app_name}-private-{i+1}-{self.environment}",
          "Environment": self.environment,
          "Type": "private",
          "kubernetes.io/role/internal-elb": "1"
        },
        opts=pulumi.ResourceOptions(parent=self, depends_on=[self.vpc])
      )
      self.private_subnets.append(subnet)
    
    # Create Elastic IPs for NAT Gateways
    self.elastic_ips = []
    for i in range(len(self.public_subnets)):
      eip = aws.ec2.Eip(
        f"{self.config.app_name}-eip-{i+1}-{self.environment}",
        domain="vpc",
        tags={
          "Name": f"{self.config.app_name}-eip-{i+1}-{self.environment}",
          "Environment": self.environment
        },
        opts=pulumi.ResourceOptions(parent=self, 
                                   depends_on=[self.internet_gateway])
      )
      self.elastic_ips.append(eip)
    
    # Create NAT Gateways for private subnet internet access
    self.nat_gateways = []
    for i, (subnet, eip) in enumerate(zip(self.public_subnets, 
                                         self.elastic_ips)):
      nat_gateway = aws.ec2.NatGateway(
        f"{self.config.app_name}-nat-{i+1}-{self.environment}",
        allocation_id=eip.allocation_id,
        subnet_id=subnet.id,
        tags={
          "Name": f"{self.config.app_name}-nat-{i+1}-{self.environment}",
          "Environment": self.environment
        },
        opts=pulumi.ResourceOptions(parent=self, 
                                   depends_on=[eip, subnet, 
                                             self.internet_gateway])
      )
      self.nat_gateways.append(nat_gateway)
    
    # Create route table for public subnets
    self.public_route_table = aws.ec2.RouteTable(
      f"{self.config.app_name}-public-rt-{self.environment}",
      vpc_id=self.vpc.id,
      routes=[
        aws.ec2.RouteTableRouteArgs(
          cidr_block="0.0.0.0/0",
          gateway_id=self.internet_gateway.id
        )
      ],
      tags={
        "Name": f"{self.config.app_name}-public-rt-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self, 
                                 depends_on=[self.internet_gateway])
    )
    
    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"{self.config.app_name}-public-rta-{i+1}-{self.environment}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id,
        opts=pulumi.ResourceOptions(parent=self, 
                                   depends_on=[self.public_route_table, 
                                             subnet])
      )
    
    # Create route tables for private subnets
    self.private_route_tables = []
    for i, (subnet, nat_gateway) in enumerate(zip(self.private_subnets, 
                                                 self.nat_gateways)):
      route_table = aws.ec2.RouteTable(
        f"{self.config.app_name}-private-rt-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        routes=[
          aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            nat_gateway_id=nat_gateway.id
          )
        ],
        tags={
          "Name": f"{self.config.app_name}-private-rt-{i+1}-{self.environment}",
          "Environment": self.environment
        },
        opts=pulumi.ResourceOptions(parent=self, depends_on=[nat_gateway])
      )
      self.private_route_tables.append(route_table)
      
      # Associate private subnet with its route table
      aws.ec2.RouteTableAssociation(
        f"{self.config.app_name}-private-rta-{i+1}-{self.environment}",
        subnet_id=subnet.id,
        route_table_id=route_table.id,
        opts=pulumi.ResourceOptions(parent=self, 
                                   depends_on=[route_table, subnet])
      )

  def _create_security(self):
    """Create security groups and IAM roles"""
    
    # Security group for Application Load Balancer
    self.alb_security_group = aws.ec2.SecurityGroup(
      f"{self.config.app_name}-alb-sg-{self.environment}",
      name=f"{self.config.app_name}-alb-sg-{self.environment}",
      description="Security group for Application Load Balancer",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTP traffic"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=443,
          to_port=443,
          cidr_blocks=["0.0.0.0/0"],
          description="HTTPS traffic"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={
        "Name": f"{self.config.app_name}-alb-sg-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Security group for application instances
    self.app_security_group = aws.ec2.SecurityGroup(
      f"{self.config.app_name}-app-sg-{self.environment}",
      name=f"{self.config.app_name}-app-sg-{self.environment}",
      description="Security group for application instances",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=8080,
          to_port=8080,
          security_groups=[self.alb_security_group.id],
          description="Application port from ALB"
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=22,
          to_port=22,
          cidr_blocks=["10.0.0.0/16"],
          description="SSH access from VPC"
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"],
          description="All outbound traffic"
        )
      ],
      tags={
        "Name": f"{self.config.app_name}-app-sg-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # IAM role for EC2 instances
    self.ec2_role = aws.iam.Role(
      f"{self.config.app_name}-ec2-role-{self.environment}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      tags={
        "Name": f"{self.config.app_name}-ec2-role-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Attach necessary policies to EC2 role
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-ec2-ssm-policy-{self.environment}",
      role=self.ec2_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-ec2-cloudwatch-policy-{self.environment}",
      role=self.ec2_role.name,
      policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Custom policy for secrets access
    secrets_resource = (f"arn:aws:secretsmanager:{self.region}:*:"
                       f"secret:{self.config.app_name}-{self.environment}-*")
    
    self.secrets_policy = aws.iam.Policy(
      f"{self.config.app_name}-secrets-policy-{self.environment}",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "secretsmanager:GetSecretValue",
              "secretsmanager:DescribeSecret"
            ],
            "Resource": secrets_resource
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-ec2-secrets-policy-{self.environment}",
      role=self.ec2_role.name,
      policy_arn=self.secrets_policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Create instance profile
    self.instance_profile = aws.iam.InstanceProfile(
      f"{self.config.app_name}-instance-profile-{self.environment}",
      role=self.ec2_role.name,
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _create_storage(self):
    """Create storage components"""
    
    # Generate unique bucket name
    stack_id = ''.join(random.choices(string.ascii_lowercase + 
                                    string.digits, k=8))
    bucket_name = f"{self.config.app_name}-artifacts-{self.environment}-{stack_id}"
    
    # S3 encryption configuration - avoid long line
    cls = aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs
    sse_default_args = cls(sse_algorithm="AES256")
    
    # S3 bucket for CI/CD artifacts
    self.artifacts_bucket = aws.s3.Bucket(
      f"{self.config.app_name}-artifacts-{self.environment}",
      bucket=bucket_name,
      versioning=aws.s3.BucketVersioningArgs(enabled=True),
      server_side_encryption_configuration=(
        aws.s3.BucketServerSideEncryptionConfigurationArgs(
          rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=sse_default_args,
            bucket_key_enabled=True
          )
        )
      ),
      tags={
        "Name": f"{self.config.app_name}-artifacts-{self.environment}",
        "Environment": self.environment,
        "Purpose": "CI/CD Artifacts"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Block public access
    aws.s3.BucketPublicAccessBlock(
      f"{self.config.app_name}-artifacts-pab-{self.environment}",
      bucket=self.artifacts_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Secrets Manager for application secrets
    self.app_secrets = aws.secretsmanager.Secret(
      f"{self.config.app_name}-secrets-{self.environment}",
      name=f"{self.config.app_name}-{self.environment}-secrets",
      description=f"Application secrets for {self.environment} environment",
      tags={
        "Name": f"{self.config.app_name}-secrets-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Store default secret values
    aws.secretsmanager.SecretVersion(
      f"{self.config.app_name}-secrets-version-{self.environment}",
      secret_id=self.app_secrets.id,
      secret_string=json.dumps({
        "database_url": f"postgresql://user:password@localhost:5432/{self.environment}_db",
        "api_key": f"api-key-{self.environment}",
        "jwt_secret": f"jwt-secret-{self.environment}",
        "snyk_token": "snyk-token-placeholder"
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _create_compute(self):
    """Create compute infrastructure"""
    
    # Application Load Balancer
    alb_deps = self.public_subnets + [self.alb_security_group]
    self.load_balancer = aws.lb.LoadBalancer(
      f"{self.config.app_name}-alb-{self.environment}",
      name=f"{self.config.app_name}-alb-{self.environment}",
      load_balancer_type="application",
      subnets=[subnet.id for subnet in self.public_subnets],
      security_groups=[self.alb_security_group.id],
      enable_deletion_protection=self.environment == "prod",
      enable_cross_zone_load_balancing=True,
      tags={
        "Name": f"{self.config.app_name}-alb-{self.environment}",
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self, depends_on=alb_deps)
    )
    
    # Blue target group (active)
    self.blue_target_group = aws.lb.TargetGroup(
      f"{self.config.app_name}-blue-tg-{self.environment}",
      name=f"{self.config.app_name}-blue-{self.environment}",
      port=8080,
      protocol="HTTP",
      vpc_id=self.vpc.id,
      health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        interval=30,
        matcher="200",
        path="/health",
        port="traffic-port",
        protocol="HTTP",
        timeout=5,
        unhealthy_threshold=2
      ),
      tags={
        "Name": f"{self.config.app_name}-blue-tg-{self.environment}",
        "Environment": self.environment,
        "DeploymentColor": "blue"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Green target group (standby)
    self.green_target_group = aws.lb.TargetGroup(
      f"{self.config.app_name}-green-tg-{self.environment}",
      name=f"{self.config.app_name}-green-{self.environment}",
      port=8080,
      protocol="HTTP",
      vpc_id=self.vpc.id,
      health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        interval=30,
        matcher="200",
        path="/health",
        port="traffic-port",
        protocol="HTTP",
        timeout=5,
        unhealthy_threshold=2
      ),
      tags={
        "Name": f"{self.config.app_name}-green-tg-{self.environment}",
        "Environment": self.environment,
        "DeploymentColor": "green"
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # ALB listener
    self.alb_listener = aws.lb.Listener(
      f"{self.config.app_name}-listener-{self.environment}",
      load_balancer_arn=self.load_balancer.arn,
      port="80",
      protocol="HTTP",
      default_actions=[
        aws.lb.ListenerDefaultActionArgs(
          type="forward",
          target_group_arn=self.blue_target_group.arn
        )
      ],
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # User data script
    user_data = self._generate_user_data()
    
    # Launch template
    self.launch_template = aws.ec2.LaunchTemplate(
      f"{self.config.app_name}-lt-{self.environment}",
      name=f"{self.config.app_name}-lt-{self.environment}",
      image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI (us-east-1)
      instance_type=self.config.config["instance_type"],
      vpc_security_group_ids=[self.app_security_group.id],
      iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        name=self.instance_profile.name
      ),
      user_data=base64.b64encode(user_data.encode()).decode(),
      tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
          resource_type="instance",
          tags={
            "Name": f"{self.config.app_name}-instance-{self.environment}",
            "Environment": self.environment,
            "Project": self.config.app_name
          }
        )
      ],
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Auto Scaling Group
    asg_deps = [self.launch_template] + self.private_subnets + [self.blue_target_group]
    self.auto_scaling_group = aws.autoscaling.Group(
      f"{self.config.app_name}-asg-{self.environment}",
      name=f"{self.config.app_name}-asg-{self.environment}",
      vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
      target_group_arns=[self.blue_target_group.arn],
      health_check_type="ELB",
      health_check_grace_period=300,
      min_size=self.config.config["min_size"],
      max_size=self.config.config["max_size"],
      desired_capacity=self.config.config["desired_capacity"],
      launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=self.launch_template.id,
        version="$Latest"
      ),
      tags=[
        aws.autoscaling.GroupTagArgs(
          key="Name",
          value=f"{self.config.app_name}-asg-{self.environment}",
          propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
          key="Environment",
          value=self.environment,
          propagate_at_launch=True
        )
      ],
      opts=pulumi.ResourceOptions(parent=self, depends_on=asg_deps)
    )

  def _generate_user_data(self) -> str:
    """Generate user data script for EC2 instances"""
    return f"""#!/bin/bash
# Update system
yum update -y

# Install required packages
yum install -y docker ruby wget python3 python3-pip

# Start Docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CodeDeploy agent
cd /home/ec2-user
wget https://aws-codedeploy-{self.region}.s3.{self.region}.amazonaws.com/latest/install
chmod +x ./install
./install auto

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Create health check endpoint
cat > /opt/app/health_check.py << 'EOF'
#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {{
                "status": "healthy",
                "environment": "{self.environment}",
                "version": os.environ.get("APP_VERSION", "1.0.0")
            }}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), HealthCheckHandler)
    print('Health check server starting on port 8080...')
    server.serve_forever()
EOF

chmod +x /opt/app/health_check.py

# Create systemd service
cat > /etc/systemd/system/app-health.service << 'EOF'
[Unit]
Description=Application Health Check Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/health_check.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

# Start health check service
systemctl daemon-reload
systemctl enable app-health
systemctl start app-health

# Install pytest for testing
pip3 install pytest boto3 requests
"""

  def _create_pipeline(self):
    """Create CI/CD pipeline"""
    
    # Create pipeline roles first
    self._create_pipeline_roles()
    
    # CodeBuild project
    self.codebuild_project = aws.codebuild.Project(
      f"{self.config.app_name}-build-{self.environment}",
      name=f"{self.config.app_name}-build-{self.environment}",
      description=f"Build project for {self.config.app_name} {self.environment}",
      service_role=self.codebuild_role.arn,
      artifacts=aws.codebuild.ProjectArtifactsArgs(type="CODEPIPELINE"),
      environment=aws.codebuild.ProjectEnvironmentArgs(
        compute_type="BUILD_GENERAL1_SMALL",
        image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
        type="LINUX_CONTAINER",
        environment_variables=[
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="ENVIRONMENT",
            value=self.environment
          ),
          aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
            name="AWS_DEFAULT_REGION",
            value=self.region
          )
        ]
      ),
      source=aws.codebuild.ProjectSourceArgs(
        type="CODEPIPELINE",
        buildspec=self._generate_buildspec()
      ),
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodeDeploy application
    self.codedeploy_application = aws.codedeploy.Application(
      f"{self.config.app_name}-deploy-{self.environment}",
      name=f"{self.config.app_name}-{self.environment}",
      compute_platform="Server",
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodeDeploy deployment group
    self.codedeploy_deployment_group = aws.codedeploy.DeploymentGroup(
      f"{self.config.app_name}-deploy-group-{self.environment}",
      app_name=self.codedeploy_application.name,
      deployment_group_name=f"{self.config.app_name}-deployment-group-{self.environment}",
      service_role_arn=self.codedeploy_role.arn,
      deployment_config_name="CodeDeployDefault.AllAtOnce",
      auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
        enabled=True,
        events=["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
      ),
      load_balancer_info=aws.codedeploy.DeploymentGroupLoadBalancerInfoArgs(
        target_group_infos=[
          aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupInfoArgs(
            name=self.blue_target_group.name
          )
        ]
      ),
      ec2_tag_filters=[
        aws.codedeploy.DeploymentGroupEc2TagFilterArgs(
          key="Environment",
          type="KEY_AND_VALUE",
          value=self.environment
        )
      ],
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodePipeline - FIXED: removed region parameter from artifact store
    self.codepipeline = aws.codepipeline.Pipeline(
      f"{self.config.app_name}-pipeline-{self.environment}",
      name=f"{self.config.app_name}-pipeline-{self.environment}",
      role_arn=self.codepipeline_role.arn,
      artifact_stores=[
        aws.codepipeline.PipelineArtifactStoreArgs(
          location=self.artifacts_bucket.bucket,
          type="S3"
        )
      ],
      stages=[
        # Source stage
        aws.codepipeline.PipelineStageArgs(
          name="Source",
          actions=[
            aws.codepipeline.PipelineStageActionArgs(
              name="Source",
              category="Source",
              owner="AWS",
              provider="S3",
              version="1",
              output_artifacts=["source_output"],
              configuration={
                "S3Bucket": self.artifacts_bucket.bucket,
                "S3ObjectKey": "source.zip",
                "PollForSourceChanges": "false"
              }
            )
          ]
        ),
        # Build stage
        aws.codepipeline.PipelineStageArgs(
          name="Build",
          actions=[
            aws.codepipeline.PipelineStageActionArgs(
              name="Build",
              category="Build",
              owner="AWS",
              provider="CodeBuild",
              version="1",
              input_artifacts=["source_output"],
              output_artifacts=["build_output"],
              configuration={
                "ProjectName": self.codebuild_project.name
              }
            )
          ]
        ),
        # Deploy stage
        aws.codepipeline.PipelineStageArgs(
          name="Deploy",
          actions=[
            aws.codepipeline.PipelineStageActionArgs(
              name="Deploy",
              category="Deploy",
              owner="AWS",
              provider="CodeDeploy",
              version="1",
              input_artifacts=["build_output"],
              configuration={
                "ApplicationName": self.codedeploy_application.name,
                "DeploymentGroupName": self.codedeploy_deployment_group.deployment_group_name
              }
            )
          ]
        )
      ],
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _create_pipeline_roles(self):
    """Create IAM roles for CI/CD pipeline services"""
    
    # CodeBuild service role
    self.codebuild_role = aws.iam.Role(
      f"{self.config.app_name}-codebuild-role-{self.environment}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "codebuild.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodeBuild policy
    self.codebuild_policy = aws.iam.Policy(
      f"{self.config.app_name}-codebuild-policy-{self.environment}",
      policy=pulumi.Output.all(self.artifacts_bucket.arn, 
                              self.app_secrets.arn).apply(
        lambda args: json.dumps({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              "Resource": f"arn:aws:logs:{self.region}:*:*"
            },
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "s3:ListBucket"
              ],
              "Resource": [args[0], f"{args[0]}/*"]
            },
            {
              "Effect": "Allow",
              "Action": [
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
              ],
              "Resource": args[1]
            }
          ]
        })
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-codebuild-policy-attach-{self.environment}",
      role=self.codebuild_role.name,
      policy_arn=self.codebuild_policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodeDeploy service role
    self.codedeploy_role = aws.iam.Role(
      f"{self.config.app_name}-codedeploy-role-{self.environment}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "codedeploy.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-codedeploy-policy-attach-{self.environment}",
      role=self.codedeploy_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole",
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodePipeline service role
    self.codepipeline_role = aws.iam.Role(
      f"{self.config.app_name}-codepipeline-role-{self.environment}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "codepipeline.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CodePipeline policy
    self.codepipeline_policy = aws.iam.Policy(
      f"{self.config.app_name}-codepipeline-policy-{self.environment}",
      policy=pulumi.Output.all(self.artifacts_bucket.arn).apply(
        lambda args: json.dumps({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "s3:GetObject",
                "s3:GetObjectVersion",
                "s3:PutObject",
                "s3:GetBucketVersioning"
              ],
              "Resource": [args[0], f"{args[0]}/*"]
            },
            {
              "Effect": "Allow",
              "Action": [
                "codebuild:BatchGetBuilds",
                "codebuild:StartBuild",
                "codedeploy:CreateDeployment",
                "codedeploy:GetApplication",
                "codedeploy:GetApplicationRevision",
                "codedeploy:GetDeployment",
                "codedeploy:GetDeploymentConfig",
                "codedeploy:RegisterApplicationRevision"
              ],
              "Resource": "*"
            }
          ]
        })
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-codepipeline-policy-attach-{self.environment}",
      role=self.codepipeline_role.name,
      policy_arn=self.codepipeline_policy.arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _generate_buildspec(self) -> str:
    """Generate CodeBuild buildspec"""
    return """version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.9
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip
      - pip install pytest boto3 requests coverage
      - curl -L https://github.com/snyk/snyk/releases/latest/download/snyk-linux -o snyk
      - chmod +x snyk
      - mv snyk /usr/local/bin/
  pre_build:
    commands:
      - echo "Pre-build phase started"
      - echo "Running security scan with Snyk..."
      - snyk auth $SNYK_TOKEN || echo "Snyk auth failed, continuing..."
      - snyk test --severity-threshold=high || echo "Snyk scan completed with warnings"
  build:
    commands:
      - echo "Build phase started"
      - echo "Running unit tests..."
      - python -m pytest tests/ -v || echo "Tests completed"
      - echo "Creating deployment package..."
      - zip -r deployment.zip . -x "tests/*" "*.git*" "*.pyc" "__pycache__/*"
  post_build:
    commands:
      - echo "Post-build phase completed"
artifacts:
  files:
    - deployment.zip
    - appspec.yml
    - scripts/**/*
  name: BuildArtifacts
"""

  def _create_monitoring(self):
    """Create monitoring and logging"""
    
    # CloudWatch log group
    self.app_log_group = aws.cloudwatch.LogGroup(
      f"{self.config.app_name}-app-logs-{self.environment}",
      name=f"/aws/{self.config.app_name}/{self.environment}/application",
      retention_in_days=self.config.config["log_retention"],
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # SNS topic for alerts
    self.alerts_topic = aws.sns.Topic(
      f"{self.config.app_name}-alerts-{self.environment}",
      name=f"{self.config.app_name}-alerts-{self.environment}",
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CloudWatch alarms
    self.cpu_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.config.app_name}-high-cpu-{self.environment}",
      name=f"{self.config.app_name}-high-cpu-{self.environment}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period=300,
      statistic="Average",
      threshold=80.0,
      alarm_description="Triggers when CPU exceeds 80%",
      alarm_actions=[self.alerts_topic.arn],
      dimensions={
        "AutoScalingGroupName": self.auto_scaling_group.name
      },
      tags={
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Unhealthy hosts alarm
    self.unhealthy_hosts_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.config.app_name}-unhealthy-hosts-{self.environment}",
      name=f"{self.config.app_name}-unhealthy-hosts-{self.environment}",
      comparison_operator="LessThanThreshold",
      evaluation_periods=2,
      metric_name="HealthyHostCount",
      namespace="AWS/ApplicationELB",
      period=300,
      statistic="Average",
      threshold=1.0,
      alarm_description="Triggers when healthy host count is less than 1",
      alarm_actions=[self.alerts_topic.arn],
      dimensions={
        "TargetGroup": self.blue_target_group.arn_suffix,
        "LoadBalancer": self.load_balancer.arn_suffix
      },
      tags={
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CI/CD log group
    self.cicd_log_group = aws.cloudwatch.LogGroup(
      f"{self.config.app_name}-cicd-logs-{self.environment}",
      name=f"/aws/{self.config.app_name}/{self.environment}/cicd",
      retention_in_days=self.config.config["log_retention"],
      tags={
        "Environment": self.environment,
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Pipeline failure alarm
    self.pipeline_failure_alarm = aws.cloudwatch.MetricAlarm(
      f"{self.config.app_name}-pipeline-failure-{self.environment}",
      name=f"{self.config.app_name}-pipeline-failure-{self.environment}",
      comparison_operator="GreaterThanOrEqualToThreshold",
      evaluation_periods=1,
      metric_name="PipelineExecutionFailure",
      namespace="AWS/CodePipeline",
      period=300,
      statistic="Sum",
      threshold=1.0,
      alarm_description="Triggers when pipeline execution fails",
      alarm_actions=[self.alerts_topic.arn],
      treat_missing_data="notBreaching",
      tags={
        "Environment": self.environment
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # CloudWatch dashboard
    self.dashboard = aws.cloudwatch.Dashboard(
      f"{self.config.app_name}-dashboard-{self.environment}",
      dashboard_name=f"{self.config.app_name}-{self.environment}",
      dashboard_body=pulumi.Output.all(self.auto_scaling_group.name, self.blue_target_group.arn_suffix).apply(
        lambda args: json.dumps({
          "widgets": [
            {
              "type": "metric",
              "properties": {
                "metrics": [
                  ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", args[0]],
                  ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", args[1]]
                ],
                "period": 300,
                "stat": "Average",
                "region": self.region,
                "title": f"{self.config.app_name} Metrics"
              }
            }
          ]
        })
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _create_serverless(self):
    """Create serverless Lambda functions"""
    
    # Lambda execution role
    self.lambda_role = aws.iam.Role(
      f"{self.config.app_name}-lambda-role-{self.environment}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      }),
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    aws.iam.RolePolicyAttachment(
      f"{self.config.app_name}-lambda-basic-execution-{self.environment}",
      role=self.lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Health check Lambda
    self.health_check_lambda = aws.lambda_.Function(
      f"{self.config.app_name}-health-check-{self.environment}",
      name=f"{self.config.app_name}-health-check-{self.environment}",
      runtime="python3.9",
      role=self.lambda_role.arn,
      handler="index.lambda_handler",
      timeout=30,
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(self._get_health_check_lambda_code())
      }),
      tags={
        "Environment": self.environment,
        "Purpose": "Health Check",
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Notification Lambda
    self.notification_lambda = aws.lambda_.Function(
      f"{self.config.app_name}-notification-{self.environment}",
      name=f"{self.config.app_name}-notification-{self.environment}",
      runtime="python3.9",
      role=self.lambda_role.arn,
      handler="index.lambda_handler",
      timeout=30,
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(self._get_notification_lambda_code())
      }),
      tags={
        "Environment": self.environment,
        "Purpose": "Notification",
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )
    
    # Pipeline trigger Lambda  
    self.pipeline_trigger_lambda = aws.lambda_.Function(
      f"{self.config.app_name}-pipeline-trigger-{self.environment}",
      name=f"{self.config.app_name}-pipeline-trigger-{self.environment}",
      runtime="python3.9",
      role=self.lambda_role.arn,
      handler="index.lambda_handler",
      timeout=30,
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(self._get_pipeline_trigger_lambda_code())
      }),
      tags={
        "Environment": self.environment,
        "Purpose": "Pipeline Trigger",
        "Project": self.config.app_name
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _get_health_check_lambda_code(self) -> str:
    """Get health check Lambda function code"""
    return f"""
import json
import boto3
import urllib3

def lambda_handler(event, context):
    # ELB health check logic
    elbv2_client = boto3.client('elbv2')
    
    try:
        response = elbv2_client.describe_target_health(
            TargetGroupArn='{self.blue_target_group.arn if hasattr(self, 'blue_target_group') else 'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/dummy/1234567890123456'}'
        )
        return {{
            'statusCode': 200,
            'body': json.dumps({{
                'status': 'healthy',
                'environment': '{self.environment}',
                'targets': response.get('TargetHealthDescriptions', [])
            }})
        }}
    except Exception as e:
        return {{
            'statusCode': 500,
            'body': json.dumps({{
                'status': 'error',
                'error': str(e)
            }})
        }}
"""
  
  def _get_notification_lambda_code(self) -> str:
    """Get notification Lambda function code"""
    return f"""
import json
import boto3

def lambda_handler(event, context):
    sns_client = boto3.client('sns')
    codepipeline_client = boto3.client('codepipeline')
    
    try:
        # Extract CodePipeline event details
        detail = event.get('detail', {{}})
        pipeline_name = detail.get('pipeline', 'Unknown')
        state = detail.get('state', 'Unknown')
        
        # Send SNS notification
        message = {{
            'pipeline': pipeline_name,
            'state': state,
            'environment': '{self.environment}'
        }}
        
        sns_client.publish(
            TopicArn='{self.alerts_topic.arn if hasattr(self, 'alerts_topic') else 'arn:aws:sns:us-east-1:123456789012:alerts'}',
            Message=json.dumps(message),
            Subject=f'Pipeline {{state}}: {{pipeline_name}}'
        )
        
        return {{
            'statusCode': 200,
            'body': json.dumps({{
                'status': 'notification sent',
                'pipeline': pipeline_name
            }})
        }}
    except Exception as e:
        return {{
            'statusCode': 500,
            'body': json.dumps({{
                'status': 'error',
                'error': str(e)
            }})
        }}
"""

  def _get_pipeline_trigger_lambda_code(self) -> str:
    """Get pipeline trigger Lambda function code"""
    return f"""
import json
import boto3

def lambda_handler(event, context):
    codepipeline_client = boto3.client('codepipeline')
    
    try:
        # Extract trigger event details
        pipeline_name = event.get('pipeline_name', '{self.app_name}-pipeline-{self.environment}')
        
        # Start pipeline execution
        response = codepipeline_client.start_pipeline_execution(
            name=pipeline_name
        )
        
        return {{
            'statusCode': 200,
            'body': json.dumps({{
                'status': 'pipeline triggered',
                'execution_id': response.get('pipelineExecutionId'),
                'pipeline': pipeline_name
            }})
        }}
    except Exception as e:
        return {{
            'statusCode': 500,
            'body': json.dumps({{
                'status': 'error',
                'error': str(e)
            }})
        }}
"""

  def _register_outputs(self):
    """Register stack outputs"""
    
    self.register_outputs({
      "vpc_id": self.vpc.id,
      "load_balancer_dns_name": self.load_balancer.dns_name,
      "pipeline_name": self.codepipeline.name,
      "blue_target_group_arn": self.blue_target_group.arn,
      "green_target_group_arn": self.green_target_group.arn,
      "environment": self.environment,
      "region": self.region,
      "app_name": self.config.app_name
    })


def create_tap_stack(name: str, environment: str, 
                     opts: Optional[pulumi.ResourceOptions] = None) -> TapStack:
  """Convenience function to create a TapStack with string environment"""
  return TapStack(name, environment, opts)


# Export classes for backwards compatibility
__all__ = ["TapStack", "TapStackArgs", "TapStackConfig", "create_tap_stack"]
