#!/usr/bin/env python3
"""
TAP Stack Infrastructure Module

This module implements a highly available, secure, and scalable AWS infrastructure
using Pulumi and Python. The infrastructure spans multiple AWS regions and includes
VPCs, subnets, security groups, IAM roles, auto-scaling compute resources, managed
databases, and comprehensive monitoring solutions.
"""

import base64
import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  """Arguments for configuring the TAP Stack deployment."""
  
  def __init__(self, environment_suffix: str = "dev"):
    self.environment_suffix = environment_suffix
    self.team_name = "tap"
    self.project_name = "iac-aws-nova-model-breaking"
    # Multi-region deployment for high availability
    self.regions = ["us-east-1", "us-west-2", "eu-west-1"]
    self.availability_zones_per_region = 3
    
  def get_resource_name(self, service_name: str) -> str:
    """Generate resource name following the naming convention."""
    return f"{self.team_name}-{self.environment_suffix}-{service_name}"
  
  def get_default_tags(self) -> Dict[str, str]:
    """Generate default tags for all resources."""
    return {
      "Owner": "tap-team",
      "Purpose": "iac-aws-nova-model-breaking",
      "Environment": self.environment_suffix,
      "Project": self.project_name,
      "ManagedBy": "pulumi"
    }


class TapStack(pulumi.ComponentResource):
  """
  TAP Stack - Highly Available AWS Infrastructure
  
  This stack creates:
  - Multi-region VPC infrastructure with public/private subnets
  - Auto-scaling compute resources
  - Managed RDS database with encryption and backups
  - IAM roles and policies
  - Security groups with restricted access
  - CloudWatch logging and monitoring
  - CI/CD pipeline integration capabilities
  """
  
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__("custom:infrastructure:TapStack", name, {}, opts)
    
    # Initialize necessary attributes for ComponentResource
    self._transformations = []
    self._childResources = set()
    self._providers = {}
    self._aliases = []
    self._protect = False
    
    self.args = args
    self.default_tags = args.get_default_tags()
    
    # Store created resources
    self.providers: Dict[str, aws.Provider] = {}
    self.vpcs: Dict[str, aws.ec2.Vpc] = {}
    self.subnets: Dict[str, Dict[str, List[aws.ec2.Subnet]]] = {}
    self.security_groups: Dict[str, aws.ec2.SecurityGroup] = {}
    self.iam_roles: Dict[str, aws.iam.Role] = {}
    self.auto_scaling_groups: Dict[str, aws.autoscaling.Group] = {}
    # LOCALSTACK COMMUNITY: Replaced RDS with DynamoDB (Pro not available)
    self.dynamodb_tables: Dict[str, aws.dynamodb.Table] = {}
    # LOCALSTACK COMMUNITY: Removed ELBv2/ALB (Pro not available)
    # self.load_balancers: Dict[str, aws.lb.LoadBalancer] = {}
    
    # Create AWS providers first
    self._create_providers()
    
    # Create infrastructure
    self._create_iam_resources()
    self._create_vpc_infrastructure()
    self._create_security_groups()
    # LOCALSTACK COMMUNITY: Use DynamoDB instead of RDS
    self._create_dynamodb_infrastructure()
    # LOCALSTACK COMMUNITY: Auto Scaling Groups require Pro - commented out
    # self._create_compute_infrastructure()
    self._create_monitoring_infrastructure()
    
    # Register outputs
    self.register_outputs({
      "vpc_ids": {region: vpc.id for region, vpc in self.vpcs.items()},
      # LOCALSTACK COMMUNITY: DynamoDB table names instead of RDS endpoints
      "dynamodb_tables": {region: table.name for region, table in self.dynamodb_tables.items()},
      # LOCALSTACK COMMUNITY: Removed load balancer outputs (Pro only)
      # "load_balancer_dns": {region: lb.dns_name for region, lb in self.load_balancers.items()},
    })
    
  def _create_providers(self):
    """Create AWS providers for each region with unique names."""
    for region in self.args.regions:
      # Create unique provider name to avoid URN conflicts
      provider_name = f"{self.args.get_resource_name('provider')}-{region}"

      # LOCALSTACK: Configure providers with LocalStack-compatible credentials
      self.providers[region] = aws.Provider(
        provider_name,
        region=region,
        access_key="test",
        secret_key="test",
        skip_credentials_validation=True,
        skip_metadata_api_check=True,
        skip_requesting_account_id=True,
        opts=ResourceOptions(parent=self)
      )
    
  def _create_iam_resources(self):
    """Create IAM roles and policies for the infrastructure."""
    
    # EC2 Service Role
    ec2_assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [{
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"}
      }]
    })
    
    self.iam_roles["ec2_role"] = aws.iam.Role(
      self.args.get_resource_name("ec2-role"),
      assume_role_policy=ec2_assume_role_policy,
      tags=self.default_tags,
      opts=ResourceOptions(parent=self)
    )
    
    # Attach necessary policies to EC2 role
    aws.iam.RolePolicyAttachment(
      self.args.get_resource_name("ec2-cloudwatch-policy"),
      role=self.iam_roles["ec2_role"].name,
      policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      opts=ResourceOptions(parent=self)
    )
    
    # Instance profile for EC2
    self.ec2_instance_profile = aws.iam.InstanceProfile(
      self.args.get_resource_name("ec2-instance-profile"),
      role=self.iam_roles["ec2_role"].name,
      tags=self.default_tags,
      opts=ResourceOptions(parent=self)
    )
    
    # LOCALSTACK COMMUNITY: Removed RDS monitoring role (not needed for DynamoDB)
    # RDS requires LocalStack Pro, using DynamoDB instead
    
  def _create_vpc_infrastructure(self):
    """Create VPC infrastructure across regions with fallback handling."""
    
    for region in self.args.regions:
      provider = self.providers[region]
      
      try:
        # Try to create VPC
        vpc = aws.ec2.Vpc(
          self.args.get_resource_name(f"vpc-{region}"),
          cidr_block="10.0.0.0/16",
          enable_dns_hostnames=True,
          enable_dns_support=True,
          tags={
            **self.default_tags,
            "Name": self.args.get_resource_name(f"vpc-{region}")
          },
          opts=ResourceOptions(parent=self, provider=provider)
        )
        self.vpcs[region] = vpc
        
        # Create new networking infrastructure
        self._create_new_networking_infrastructure(region, provider, vpc)
        
      except (Exception) as e:  # pylint: disable=broad-except
        if "VpcLimitExceeded" in str(e):
          pulumi.log.warn(f"VPC limit exceeded in {region}. Using default VPC.")
          # Use default VPC as fallback
          default_vpc = aws.ec2.get_vpc(
            default=True, 
            opts=pulumi.InvokeOptions(provider=provider)
          )
          
          # Create a mock VPC object for compatibility
          mock_vpc = type('VPC', (), {
            'id': default_vpc.id,
            'cidr_block': default_vpc.cidr_block
          })()
          self.vpcs[region] = mock_vpc
          
          # Get default subnets
          self._get_existing_subnets(region, provider, default_vpc.id)
        else:
          raise
    
  def _get_existing_subnets(self, region: str, provider: aws.Provider, vpc_id: str):
    """Get existing subnets in the VPC."""
    self.subnets[region] = {"public": [], "private": []}
    
    # Get existing subnets
    existing_subnets = aws.ec2.get_subnets(
      filters=[{"name": "vpc-id", "values": [vpc_id]}],
      opts=pulumi.InvokeOptions(provider=provider)
    )
    
    for subnet_id in existing_subnets.ids:
      subnet = aws.ec2.get_subnet(
        id=subnet_id, 
        opts=pulumi.InvokeOptions(provider=provider)
      )
      
      # Create mock subnet object
      mock_subnet = type('Subnet', (), {
        'id': subnet_id,
        'cidr_block': subnet.cidr_block,
        'availability_zone': subnet.availability_zone
      })()
      
      # Determine if public or private (simplified logic)
      if subnet.map_public_ip_on_launch:
        self.subnets[region]["public"].append(mock_subnet)
      else:
        self.subnets[region]["private"].append(mock_subnet)
    
    # Ensure we have at least some subnets
    if not self.subnets[region]["public"]:
      private_subnets = self.subnets[region]["private"]
      self.subnets[region]["public"] = private_subnets[:1] if private_subnets else []
    if not self.subnets[region]["private"]:
      public_subnets = self.subnets[region]["public"]
      self.subnets[region]["private"] = public_subnets[:1] if public_subnets else []
    
  def _create_new_networking_infrastructure(
      self, region: str, provider: aws.Provider, vpc: aws.ec2.Vpc
  ):
    """Create new networking infrastructure for a new VPC."""
    # Get availability zones for the region
    azs = aws.get_availability_zones(
      state="available",
      opts=pulumi.InvokeOptions(provider=provider)
    )
    
    # Initialize subnet dictionaries for this region
    self.subnets[region] = {"public": [], "private": []}
    
    # Create Internet Gateway
    igw = aws.ec2.InternetGateway(
      self.args.get_resource_name(f"igw-{region}"),
      vpc_id=vpc.id,
      tags={
        **self.default_tags,
        "Name": self.args.get_resource_name(f"igw-{region}")
      },
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    # Create NAT Gateway and Elastic IP
    nat_eip = aws.ec2.Eip(
      self.args.get_resource_name(f"nat-eip-{region}"),
      domain="vpc",
      tags=self.default_tags,
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    # Create subnets across availability zones
    for i in range(min(self.args.availability_zones_per_region, len(azs.names))):
      az = azs.names[i]
      
      # Public subnet
      public_subnet = aws.ec2.Subnet(
        self.args.get_resource_name(f"public-subnet-{region}-{i}"),
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i * 2}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          **self.default_tags,
          "Name": self.args.get_resource_name(f"public-subnet-{region}-{i}")
        },
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.subnets[region]["public"].append(public_subnet)
      
      # Private subnet
      private_subnet = aws.ec2.Subnet(
        self.args.get_resource_name(f"private-subnet-{region}-{i}"),
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i * 2 + 1}.0/24",
        availability_zone=az,
        tags={
          **self.default_tags,
          "Name": self.args.get_resource_name(f"private-subnet-{region}-{i}")
        },
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.subnets[region]["private"].append(private_subnet)
    
    # Create NAT Gateway in first public subnet
    nat_gateway = aws.ec2.NatGateway(
      self.args.get_resource_name(f"nat-{region}"),
      allocation_id=nat_eip.id,
      subnet_id=self.subnets[region]["public"][0].id,
      tags={
        **self.default_tags,
        "Name": self.args.get_resource_name(f"nat-{region}")
      },
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    # Create route tables
    public_rt = aws.ec2.RouteTable(
      self.args.get_resource_name(f"public-rt-{region}"),
      vpc_id=vpc.id,
      tags={
        **self.default_tags,
        "Name": self.args.get_resource_name(f"public-rt-{region}")
      },
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    private_rt = aws.ec2.RouteTable(
      self.args.get_resource_name(f"private-rt-{region}"),
      vpc_id=vpc.id,
      tags={
        **self.default_tags,
        "Name": self.args.get_resource_name(f"private-rt-{region}")
      },
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    # Create routes
    aws.ec2.Route(
      self.args.get_resource_name(f"public-route-{region}"),
      route_table_id=public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=igw.id,
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    aws.ec2.Route(
      self.args.get_resource_name(f"private-route-{region}"),
      route_table_id=private_rt.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=nat_gateway.id,
      opts=ResourceOptions(parent=self, provider=provider)
    )
    
    # Associate subnets with route tables
    for i, subnet in enumerate(self.subnets[region]["public"]):
      aws.ec2.RouteTableAssociation(
        self.args.get_resource_name(f"public-rta-{region}-{i}"),
        subnet_id=subnet.id,
        route_table_id=public_rt.id,
        opts=ResourceOptions(parent=self, provider=provider)
      )
    
    for i, subnet in enumerate(self.subnets[region]["private"]):
      aws.ec2.RouteTableAssociation(
        self.args.get_resource_name(f"private-rta-{region}-{i}"),
        subnet_id=subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=self, provider=provider)
      )
    
  def _create_security_groups(self):
    """Create security groups with restricted access."""
    
    for region in self.args.regions:
      provider = self.providers[region]
      vpc = self.vpcs[region]
      
      # Web server security group
      web_sg = aws.ec2.SecurityGroup(
        self.args.get_resource_name(f"web-sg-{region}"),
        vpc_id=vpc.id,
        description="Security group for web servers",
        ingress=[
          {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "cidr_blocks": ["0.0.0.0/0"]
          },
          {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["0.0.0.0/0"]
          },
          {
            "protocol": "tcp",
            "from_port": 22,
            "to_port": 22,
            "cidr_blocks": ["10.0.0.0/16"]  # Restrict SSH to VPC
          }
        ],
        egress=[{
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={
          **self.default_tags,
          "Name": self.args.get_resource_name(f"web-sg-{region}")
        },
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.security_groups[f"web-{region}"] = web_sg
      
      # Database security group
      db_sg = aws.ec2.SecurityGroup(
        self.args.get_resource_name(f"db-sg-{region}"),
        vpc_id=vpc.id,
        description="Security group for database servers",
        ingress=[{
          "protocol": "tcp",
          "from_port": 5432,
          "to_port": 5432,
          "security_groups": [web_sg.id]  # Only allow access from web servers
        }],
        egress=[{
          "protocol": "-1",
          "from_port": 0,
          "to_port": 0,
          "cidr_blocks": ["0.0.0.0/0"]
        }],
        tags={
          **self.default_tags,
          "Name": self.args.get_resource_name(f"db-sg-{region}")
        },
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.security_groups[f"db-{region}"] = db_sg
    
  def _create_dynamodb_infrastructure(self):
    """
    Create DynamoDB tables for data storage (LocalStack Community compatible).

    LOCALSTACK COMMUNITY: Replaced RDS (requires Pro) with DynamoDB (Community).
    DynamoDB provides NoSQL database functionality that works in LocalStack Community Edition.
    """

    for region in self.args.regions:
      provider = self.providers[region]

      # Create DynamoDB table
      table = aws.dynamodb.Table(
        self.args.get_resource_name(f"data-table-{region}"),
        name=self.args.get_resource_name(f"data-table-{region}"),
        billing_mode="PAY_PER_REQUEST",  # On-demand billing
        hash_key="id",
        attributes=[
          {"name": "id", "type": "S"},
          {"name": "timestamp", "type": "N"}
        ],
        global_secondary_indexes=[{
          "name": "TimestampIndex",
          "hash_key": "timestamp",
          "projection_type": "ALL"
        }],
        tags=self.default_tags,
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.dynamodb_tables[region] = table
    
  def _create_compute_infrastructure(self):
    """
    Create auto-scaling compute resources.

    LOCALSTACK COMMUNITY: Removed ELBv2/ALB (requires Pro).
    Auto Scaling Group now uses EC2 health checks instead of ELB health checks.
    In production with Pro, you would add back Application Load Balancer.
    """

    for region in self.args.regions:
      provider = self.providers[region]

      # Get latest Amazon Linux 2 AMI
      ami = aws.ec2.get_ami(
        most_recent=True,
        owners=["amazon"],
        filters=[{"name": "name", "values": ["amzn2-ami-hvm-*-x86_64-gp2"]}],
        opts=pulumi.InvokeOptions(provider=provider)
      )

      # LOCALSTACK COMMUNITY: Removed ALB and Target Group (requires Pro)
      # In production with LocalStack Pro, uncomment and use ALB:
      # alb = aws.lb.LoadBalancer(...)
      # target_group = aws.lb.TargetGroup(...)
      # aws.lb.Listener(...)
      
      # Create launch template
      user_data = f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>TAP Infrastructure - Region: {region}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
"""
      
      launch_template = aws.ec2.LaunchTemplate(
        self.args.get_resource_name(f"lt-{region}"),
        name_prefix=self.args.get_resource_name(f"lt-{region}"),
        image_id=ami.id,
        instance_type="t3.micro",
        vpc_security_group_ids=[self.security_groups[f"web-{region}"].id],
        iam_instance_profile={"name": self.ec2_instance_profile.name},
        user_data=pulumi.Output.from_input(user_data).apply(
          lambda ud: base64.b64encode(ud.encode()).decode()
        ),
        monitoring={"enabled": True},
        metadata_options={
          "http_endpoint": "enabled",
          "http_tokens": "required",
          "http_put_response_hop_limit": 1
        },
        tag_specifications=[{
          "resource_type": "instance",
          "tags": self.default_tags
        }],
        opts=ResourceOptions(parent=self, provider=provider)
      )
      
      # Create Auto Scaling Group (LOCALSTACK COMMUNITY: removed target group)
      asg = aws.autoscaling.Group(
        self.args.get_resource_name(f"asg-{region}"),
        min_size=1,
        max_size=6,
        desired_capacity=2,
        vpc_zone_identifiers=[subnet.id for subnet in self.subnets[region]["private"]],
        # LOCALSTACK COMMUNITY: Removed target_group_arns (ALB requires Pro)
        # target_group_arns=[target_group.arn],
        health_check_type="EC2",  # Changed from ELB to EC2 (no load balancer)
        health_check_grace_period=300,
        launch_template={
          "id": launch_template.id,
          "version": "$Latest"
        },
        # Correct tag format for ASG
        tags=[
          aws.autoscaling.GroupTagArgs(
            key=key,
            value=value,
            propagate_at_launch=True
          ) for key, value in self.default_tags.items()
        ],
        opts=ResourceOptions(parent=self, provider=provider)
      )
      self.auto_scaling_groups[region] = asg
      
      # Create scaling policies
      scale_up_policy = aws.autoscaling.Policy(
        self.args.get_resource_name(f"scale-up-policy-{region}"),
        scaling_adjustment=1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name,
        opts=ResourceOptions(parent=self, provider=provider)
      )
      
      scale_down_policy = aws.autoscaling.Policy(
        self.args.get_resource_name(f"scale-down-policy-{region}"),
        scaling_adjustment=-1,
        adjustment_type="ChangeInCapacity",
        cooldown=300,
        autoscaling_group_name=asg.name,
        opts=ResourceOptions(parent=self, provider=provider)
      )
      
      # Create CloudWatch alarms
      aws.cloudwatch.MetricAlarm(
        self.args.get_resource_name(f"cpu-high-{region}"),
        comparison_operator="GreaterThanThreshold",
        evaluation_periods="2",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period="120",
        statistic="Average",
        threshold="70.0",
        alarm_description="This metric monitors ec2 cpu utilization",
        alarm_actions=[scale_up_policy.arn],
        dimensions={"AutoScalingGroupName": asg.name},
        opts=ResourceOptions(parent=self, provider=provider)
      )
      
      aws.cloudwatch.MetricAlarm(
        self.args.get_resource_name(f"cpu-low-{region}"),
        comparison_operator="LessThanThreshold",
        evaluation_periods="2",
        metric_name="CPUUtilization",
        namespace="AWS/EC2",
        period="120",
        statistic="Average",
        threshold="20.0",
        alarm_description="This metric monitors ec2 cpu utilization",
        alarm_actions=[scale_down_policy.arn],
        dimensions={"AutoScalingGroupName": asg.name},
        opts=ResourceOptions(parent=self, provider=provider)
      )
    
  def _create_monitoring_infrastructure(self):
    """
    Create CloudWatch logging and monitoring infrastructure.

    LOCALSTACK COMMUNITY: Simplified dashboard without Auto Scaling metrics (requires Pro).
    """

    for region in self.args.regions:
      provider = self.providers[region]

      # Create CloudWatch Log Group
      aws.cloudwatch.LogGroup(
        self.args.get_resource_name(f"log-group-{region}"),
        retention_in_days=14,
        tags=self.default_tags,
        opts=ResourceOptions(parent=self, provider=provider)
      )

      # Create CloudWatch Dashboard (LOCALSTACK COMMUNITY: DynamoDB metrics only)
      current_region = region  # Capture the current region to avoid cell variable issue
      dashboard_body = pulumi.Output.all(
        table_name=self.dynamodb_tables[region].name
      ).apply(lambda args, region=current_region: json.dumps({
        "widgets": [
          {
            "type": "metric",
            "x": 0, "y": 0,
            "width": 12, "height": 6,
            "properties": {
              "metrics": [
                # LOCALSTACK COMMUNITY: Removed ASG/EC2 metrics (Auto Scaling requires Pro)
                # ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", args["asg_name"]],
                # LOCALSTACK COMMUNITY: DynamoDB metrics (Community compatible)
                ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", args["table_name"]],
                ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", args["table_name"]]
              ],
              "view": "timeSeries",
              "stacked": False,
              "region": region,
              "title": f"Infrastructure Metrics - {region}",
              "period": 300
            }
          }
        ]
      }))

      aws.cloudwatch.Dashboard(
        self.args.get_resource_name(f"dashboard-{region}"),
        dashboard_name=self.args.get_resource_name(f"dashboard-{region}"),
        dashboard_body=dashboard_body,
        opts=ResourceOptions(parent=self, provider=provider)
      )