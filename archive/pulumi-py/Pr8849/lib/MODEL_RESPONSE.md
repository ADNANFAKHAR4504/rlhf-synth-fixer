=== lib/tap_stack.py ===

```python
"""
IaC - AWS Nova Model Breaking - Multi-region, highly available, secure AWS infrastructure
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Any
import json

# CI/CD GitHub Actions Workflow (paste into .github/workflows/deploy.yml):
"""
name: Deploy Infrastructure
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - run: pytest tests/unit/ tests/integration/
      
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      - run: pip install -r requirements.txt
      - uses: pulumi/actions@v4
        with:
          command: preview
          stack-name: prod
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      - uses: pulumi/actions@v4
        with:
          command: up
          stack-name: prod
        env:
          PULUMI_ACCESS_TOKEN: ${{ secrets.PULUMI_ACCESS_TOKEN }}
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
"""

class TapStack:
    def __init__(self):
        # Validate and load configuration
        self.config = pulumi.Config()
        
        # Required config with validation
        self.team_name = self.config.require("teamName")
        self.environment = self.config.require("environment")
        regions_str = self.config.require("aws:regions")
        self.regions = [r.strip() for r in regions_str.split(",")]
        self.allowed_ssh_cidr = self.config.require("allowed_ssh_cidr")
        
        # Validate minimum 3 regions
        if len(self.regions) < 3:
            raise Exception(f"At least 3 regions required, got {len(self.regions)}: {self.regions}")
        
        # Optional config with defaults
        self.db_backup_retention_days = self.config.get_int("db_backup_retention_days") or 7
        self.log_retention_days = self.config.get_int("log_retention_days") or 30
        self.min_capacity = self.config.get_int("min_capacity") or 1
        self.max_capacity = self.config.get_int("max_capacity") or 3
        
        # Common tags
        self.common_tags = {
            "Owner": self.team_name,
            "Purpose": "IaC - AWS Nova Model Breaking",
            "Environment": self.environment,
            "CostCenter": f"{self.team_name}-{self.environment}",
        }
        
        # Deploy infrastructure
        self.deploy_infrastructure()
    
    def deploy_infrastructure(self):
        # Create KMS key for encryption
        self.kms_key = aws.kms.Key(
            f"{self.team_name}-{self.environment}-kms-key",
            description="KMS key for encryption",
            tags=self.common_tags
        )
        
        # Create SNS topic for alerts
        self.sns_topic = aws.sns.Topic(
            f"{self.team_name}-{self.environment}-alerts",
            tags=self.common_tags
        )
        
        # Deploy per region
        self.region_resources = {}
        for region in self.regions:
            self.region_resources[region] = self.deploy_region(region)
        
        # Create RDS subnet group across all regions (use first region's subnets)
        first_region = self.regions[0]
        private_subnet_ids = [
            subnet.id for subnet in self.region_resources[first_region]["private_subnets"]
        ]
        
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{self.team_name}-{self.environment}-db-subnet-group",
            subnet_ids=private_subnet_ids,
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=self.region_resources[first_region]["provider"])
        )
        
        # Create RDS instance in first region
        self.database = self.create_database(first_region)
        
        # Create CloudWatch dashboard
        self.create_cloudwatch_dashboard()
        
        # Export outputs
        pulumi.export("regions", self.regions)
        pulumi.export("database_endpoint", self.database.endpoint)
        pulumi.export("load_balancer_dns", {
            region: resources["alb"].dns_name 
            for region, resources in self.region_resources.items()
        })
    
    def deploy_region(self, region: str) -> Dict[str, Any]:
        # Create provider for this region
        provider = aws.Provider(f"provider-{region}", region=region)
        
        # Get AZs for this region
        azs = aws.get_availability_zones(
            state="available",
            opts=pulumi.InvokeOptions(provider=provider)
        )
        
        # Create VPC
        vpc = aws.ec2.Vpc(
            f"{self.team_name}-{self.environment}-vpc-{region}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-vpc-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            f"{self.team_name}-{self.environment}-igw-{region}",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-igw-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create public subnets (2 AZs)
        public_subnets = []
        private_subnets = []
        nat_gateways = []
        
        for i in range(2):  # 2 AZs per region
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"{self.team_name}-{self.environment}-public-subnet-{region}-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-public-subnet-{region}-{i+1}"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"{self.team_name}-{self.environment}-private-subnet-{region}-{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-private-subnet-{region}-{i+1}"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            private_subnets.append(private_subnet)
            
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{self.team_name}-{self.environment}-eip-{region}-{i+1}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-eip-{region}-{i+1}"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{self.team_name}-{self.environment}-nat-{region}-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-nat-{region}-{i+1}"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            nat_gateways.append(nat_gw)
        
        # Create route tables
        public_rt = aws.ec2.RouteTable(
            f"{self.team_name}-{self.environment}-public-rt-{region}",
            vpc_id=vpc.id,
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-public-rt-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Public route to IGW
        aws.ec2.Route(
            f"{self.team_name}-{self.environment}-public-route-{region}",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.team_name}-{self.environment}-public-rta-{region}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
        
        # Create private route tables and routes
        for i, (subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{self.team_name}-{self.environment}-private-rt-{region}-{i+1}",
                vpc_id=vpc.id,
                tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-private-rt-{region}-{i+1}"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            aws.ec2.Route(
                f"{self.team_name}-{self.environment}-private-route-{region}-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            aws.ec2.RouteTableAssociation(
                f"{self.team_name}-{self.environment}-private-rta-{region}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
        
        # Create security groups
        alb_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-alb-sg-{region}",
            vpc_id=vpc.id,
            description="ALB Security Group",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-alb-sg-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        ec2_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-ec2-sg-{region}",
            vpc_id=vpc.id,
            description="EC2 Security Group",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=[self.allowed_ssh_cidr]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-ec2-sg-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create IAM role for EC2 instances
        ec2_role = aws.iam.Role(
            f"{self.team_name}-{self.environment}-ec2-role-{region}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Attach CloudWatch agent policy
        aws.iam.RolePolicyAttachment(
            f"{self.team_name}-{self.environment}-ec2-cloudwatch-policy-{region}",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create instance profile
        instance_profile = aws.iam.InstanceProfile(
            f"{self.team_name}-{self.environment}-ec2-profile-{region}",
            role=ec2_role.name,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create launch template
        launch_template = aws.ec2.LaunchTemplate(
            f"{self.team_name}-{self.environment}-lt-{region}",
            image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI (update as needed)
            instance_type="t3.micro",
            vpc_security_group_ids=[ec2_sg.id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=instance_profile.name
            ),
            user_data=pulumi.Output.from_input("""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
""").apply(lambda x: __import__('base64').b64encode(x.encode()).decode()),
            block_device_mappings=[
                aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                    device_name="/dev/xvda",
                    ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                        volume_size=20,
                        volume_type="gp3",
                        encrypted=True,
                        kms_key_id=self.kms_key.arn
                    )
                )
            ],
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-instance-{region}"}
                )
            ],
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-lt-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create ALB
        alb = aws.lb.LoadBalancer(
            f"{self.team_name}-{self.environment}-alb-{region}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in public_subnets],
            security_groups=[alb_sg.id],
            enable_deletion_protection=False,
            access_logs=aws.lb.LoadBalancerAccessLogsArgs(
                enabled=False  # Would need S3 bucket for logs
            ),
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-alb-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create target group
        target_group = aws.lb.TargetGroup(
            f"{self.team_name}-{self.environment}-tg-{region}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-tg-{region}"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create ALB listener
        aws.lb.Listener(
            f"{self.team_name}-{self.environment}-listener-{region}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ],
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create Auto Scaling Group
        asg = aws.autoscaling.Group(
            f"{self.team_name}-{self.environment}-asg-{region}",
            vpc_zone_identifiers=[subnet.id for subnet in private_subnets],
            target_group_arns=[target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=self.min_capacity,
            max_size=self.max_capacity,
            desired_capacity=self.min_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key=key,
                    value=value,
                    propagate_at_launch=True
                ) for key, value in {**self.common_tags, "Name": f"{self.team_name}-{self.environment}-asg-{region}"}.items()
            ],
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create scaling policies
        scale_up_policy = aws.autoscaling.Policy(
            f"{self.team_name}-{self.environment}-scale-up-{region}",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        scale_down_policy = aws.autoscaling.Policy(
            f"{self.team_name}-{self.environment}-scale-down-{region}",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create CloudWatch alarms
        aws.cloudwatch.MetricAlarm(
            f"{self.team_name}-{self.environment}-cpu-high-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=120,
            statistic="Average",
            threshold=60.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[scale_up_policy.arn, self.sns_topic.arn],
            dimensions={"AutoScalingGroupName": asg.name},
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        aws.cloudwatch.MetricAlarm(
            f"{self.team_name}-{self.environment}-cpu-low-{region}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=120,
            statistic="Average",
            threshold=10.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[scale_down_policy.arn],
            dimensions={"AutoScalingGroupName": asg.name},
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create CloudWatch log group
        log_group = aws.cloudwatch.LogGroup(
            f"{self.team_name}-{self.environment}-logs-{region}",
            retention_in_days=self.log_retention_days,
            kms_key_id=self.kms_key.arn,
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        return {
            "provider": provider,
            "vpc": vpc,
            "public_subnets": public_subnets,
            "private_subnets": private_subnets,
            "alb": alb,
            "asg": asg,
            "target_group": target_group,
            "log_group": log_group,
            "ec2_sg": ec2_sg
        }
    
    def create_database(self, region: str):
        provider = self.region_resources[region]["provider"]
        
        # Create DB security group
        db_sg = aws.ec2.SecurityGroup(
            f"{self.team_name}-{self.environment}-db-sg",
            vpc_id=self.region_resources[region]["vpc"].id,
            description="RDS Security Group",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=3306,
                    to_port=3306,
                    security_groups=[self.region_resources[region]["ec2_sg"].id]
                )
            ],
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-db-sg"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        # Create RDS instance
        db_instance = aws.rds.Instance(
            f"{self.team_name}-{self.environment}-database",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            db_name="appdb",
            username="admin",
            password="changeme123!",  # In production, use Pulumi secrets
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            backup_retention_period=self.db_backup_retention_days,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            multi_az=True,
            publicly_accessible=False,
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={**self.common_tags, "Name": f"{self.team_name}-{self.environment}-database"},
            opts=pulumi.ResourceOptions(provider=provider)
        )
        
        return db_instance
    
    def create_cloudwatch_dashboard(self):
        # Create CloudWatch dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", 
                             self.region_resources[self.regions[0]]["alb"].arn_suffix],
                            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", 
                             self.region_resources[self.regions[0]]["alb"].arn_suffix]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": self.regions[0],
                        "title": "ALB Metrics"
                    }
                }
            ]
        }
        
        aws.cloudwatch.Dashboard(
            f"{self.team_name}-{self.environment}-dashboard",
            dashboard_name=f"{self.team_name}-{self.environment}-dashboard",
            dashboard_body=pulumi.Output.from_input(dashboard_body).apply(lambda x: json.dumps(x)),
            opts=pulumi.ResourceOptions(provider=self.region_resources[self.regions[0]]["provider"])
        )

# Create the stack
stack = TapStack()
```

=== tests/unit/test_tap_stack.py ===

```python
import pytest
import pulumi
from unittest.mock import patch, MagicMock
import sys
import os

# Add lib directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'lib'))

class MockResource:
    def __init__(self, resource_type, name, props=None, opts=None):
        self.resource_type = resource_type
        self.name = name
        self.props = props or {}
        self.opts = opts
        self.id = f"mock-{name}"
        self.arn = f"arn:aws::{resource_type}::{name}"
        self.arn_suffix = f"{name}-suffix"
        self.dns_name = f"{name}.elb.amazonaws.com"
        self.endpoint = f"{name}.rds.amazonaws.com"

class MockConfig:
    def __init__(self, values):
        self.values = values
    
    def require(self, key):
        if key not in self.values:
            raise Exception(f"Missing required config: {key}")
        return self.values[key]
    
    def get_int(self, key):
        return self.values.get(key)

class MockInvokeResult:
    def __init__(self, names):
        self.names = names

def mock_get_availability_zones(**kwargs):
    return MockInvokeResult(["us-east-1a", "us-east-1b", "us-east-1c"])

@pytest.fixture
def mock_pulumi_resources():
    """Mock all Pulumi AWS resources"""
    resources_created = []
    
    def mock_resource_constructor(resource_type):
        def constructor(name, *args, **kwargs):
            resource = MockResource(resource_type, name, kwargs.get('props'), kwargs.get('opts'))
            resources_created.append(resource)
            return resource
        return constructor
    
    with patch('pulumi_aws.ec2.Vpc', mock_resource_constructor('vpc')), \
         patch('pulumi_aws.ec2.Subnet', mock_resource_constructor('subnet')), \
         patch('pulumi_aws.ec2.SecurityGroup', mock_resource_constructor('security_group')), \
         patch('pulumi_aws.autoscaling.Group', mock_resource_constructor('autoscaling_group')), \
         patch('pulumi_aws.autoscaling.Policy', mock_resource_constructor('autoscaling_policy')), \
         patch('pulumi_aws.rds.Instance', mock_resource_constructor('rds_instance')), \
         patch('pulumi_aws.rds.SubnetGroup', mock_resource_constructor('db_subnet_group')), \
         patch('pulumi_aws.kms.Key', mock_resource_constructor('kms_key')), \
         patch('pulumi_aws.sns.Topic', mock_resource_constructor('sns_topic')), \
         patch('pulumi_aws.cloudwatch.LogGroup', mock_resource_constructor('log_group')), \
         patch('pulumi_aws.cloudwatch.Dashboard', mock_resource_constructor('dashboard')), \
         patch('pulumi_aws.cloudwatch.MetricAlarm', mock_resource_constructor('metric_alarm')), \
         patch('pulumi_aws.ec2.LaunchTemplate', mock_resource_constructor('launch_template')), \
         patch('pulumi_aws.lb.LoadBalancer', mock_resource_constructor('load_balancer')), \
         patch('pulumi_aws.lb.TargetGroup', mock_resource_constructor('target_group')), \
         patch('pulumi_aws.lb.Listener', mock_resource_constructor('listener')), \
         patch('pulumi_aws.ec2.InternetGateway', mock_resource_constructor('internet_gateway')), \
         patch('pulumi_aws.ec2.NatGateway', mock_resource_constructor('nat_gateway')), \
         patch('pulumi_aws.ec2.Eip', mock_resource_constructor('eip')), \
         patch('pulumi_aws.ec2.RouteTable', mock_resource_constructor('route_table')), \
         patch('pulumi_aws.ec2.Route', mock_resource_constructor('route')), \
         patch('pulumi_aws.ec2.RouteTableAssociation', mock_resource_constructor('route_table_association')), \
         patch('pulumi_aws.iam.Role', mock_resource_constructor('iam_role')), \
         patch('pulumi_aws.iam.InstanceProfile', mock_resource_constructor('instance_profile')), \
         patch('pulumi_aws.iam.RolePolicyAttachment', mock_resource_constructor('role_policy_attachment')), \
         patch('pulumi_aws.Provider', mock_resource_constructor('provider')), \
         patch('pulumi_aws.get_availability_zones',