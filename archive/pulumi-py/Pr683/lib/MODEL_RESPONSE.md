```python
"""
Networking infrastructure module
Creates VPC, subnets, internet gateways, and NAT gateways
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, List, Tuple
from config import AVAILABILITY_ZONES, CIDR_BLOCKS


class NetworkingInfrastructure:
    def __init__(self, region: str, environment: str):
        self.region = region
        self.environment = environment
        self.name_prefix = f"prod-{region}"
        
        # Create VPC
        self.vpc = self._create_vpc()
        
        # Create Internet Gateway
        self.igw = self._create_internet_gateway()
        
        # Create subnets
        self.public_subnets, self.private_subnets = self._create_subnets()
        
        # Create NAT Gateways
        self.nat_gateways = self._create_nat_gateways()
        
        # Create Route Tables
        self.public_rt, self.private_rts = self._create_route_tables()
        
        # Create Security Groups
        self.web_sg, self.app_sg, self.db_sg = self._create_security_groups()

    def _create_vpc(self) -> aws.ec2.Vpc:
        """Create VPC with appropriate CIDR block"""
        return aws.ec2.Vpc(
            f"{self.name_prefix}-vpc-main",
            cidr_block=CIDR_BLOCKS[self.region],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.name_prefix}-vpc-main",
                "Environment": self.environment,
                "Description": f"Main VPC for {self.region} region",
                "Region": self.region
            }
        )

    def _create_internet_gateway(self) -> aws.ec2.InternetGateway:
        """Create Internet Gateway"""
        igw = aws.ec2.InternetGateway(
            f"{self.name_prefix}-igw-main",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.name_prefix}-igw-main",
                "Environment": self.environment,
                "Description": f"Internet Gateway for {self.region} region"
            }
        )
        return igw

    def _create_subnets(self) -> Tuple[List[aws.ec2.Subnet], List[aws.ec2.Subnet]]:
        """Create public and private subnets across AZs"""
        public_subnets = []
        private_subnets = []
        
        azs = AVAILABILITY_ZONES[self.region]
        
        for i, az in enumerate(azs):
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-subnet-public-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{CIDR_BLOCKS[self.region][:-4]}{i*4}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.name_prefix}-subnet-public-{i+1}",
                    "Environment": self.environment,
                    "Type": "Public",
                    "AZ": az,
                    "Description": f"Public subnet {i+1} in {az}"
                }
            )
            public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-subnet-private-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"{CIDR_BLOCKS[self.region][:-4]}{(i*4)+1}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{self.name_prefix}-subnet-private-{i+1}",
                    "Environment": self.environment,
                    "Type": "Private",
                    "AZ": az,
                    "Description": f"Private subnet {i+1} in {az}"
                }
            )
            private_subnets.append(private_subnet)
        
        return public_subnets, private_subnets

    def _create_nat_gateways(self) -> List[aws.ec2.NatGateway]:
        """Create NAT Gateways for private subnet internet access"""
        nat_gateways = []
        
        for i, public_subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{self.name_prefix}-eip-nat-{i+1}",
                domain="vpc",
                tags={
                    "Name": f"{self.name_prefix}-eip-nat-{i+1}",
                    "Environment": self.environment,
                    "Description": f"EIP for NAT Gateway {i+1}"
                }
            )
            
            # NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{self.name_prefix}-nat-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"{self.name_prefix}-nat-{i+1}",
                    "Environment": self.environment,
                    "Description": f"NAT Gateway {i+1}"
                }
            )
            nat_gateways.append(nat_gw)
        
        return nat_gateways

    def _create_route_tables(self) -> Tuple[aws.ec2.RouteTable, List[aws.ec2.RouteTable]]:
        """Create route tables for public and private subnets"""
        # Public route table
        public_rt = aws.ec2.RouteTable(
            f"{self.name_prefix}-rt-public",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.name_prefix}-rt-public",
                "Environment": self.environment,
                "Type": "Public",
                "Description": "Route table for public subnets"
            }
        )
        
        # Public route to Internet Gateway
        aws.ec2.Route(
            f"{self.name_prefix}-route-public-igw",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-rta-public-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private route tables (one per AZ)
        private_rts = []
        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{self.name_prefix}-rt-private-{i+1}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"{self.name_prefix}-rt-private-{i+1}",
                    "Environment": self.environment,
                    "Type": "Private",
                    "Description": f"Route table for private subnet {i+1}"
                }
            )
            
            # Route to NAT Gateway
            aws.ec2.Route(
                f"{self.name_prefix}-route-private-nat-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate private subnet with route table
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-rta-private-{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )
            
            private_rts.append(private_rt)
        
        return public_rt, private_rts

    def _create_security_groups(self) -> Tuple[aws.ec2.SecurityGroup, aws.ec2.SecurityGroup, aws.ec2.SecurityGroup]:
        """Create security groups for different tiers"""
        # Web tier security group
        web_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-sg-web",
            name=f"{self.name_prefix}-sg-web",
            description="Security group for web tier",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTP access"
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTPS access"
                },
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": [CIDR_BLOCKS[self.region]],
                    "description": "SSH access from VPC"
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "All outbound traffic"
                }
            ],
            tags={
                "Name": f"{self.name_prefix}-sg-web",
                "Environment": self.environment,
                "Tier": "Web",
                "Description": "Security group for web servers"
            }
        )
        
        # Application tier security group
        app_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-sg-app",
            name=f"{self.name_prefix}-sg-app",
            description="Security group for application tier",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 8080,
                    "to_port": 8080,
                    "security_groups": [web_sg.id],
                    "description": "Application port from web tier"
                },
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": [CIDR_BLOCKS[self.region]],
                    "description": "SSH access from VPC"
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "All outbound traffic"
                }
            ],
            tags={
                "Name": f"{self.name_prefix}-sg-app",
                "Environment": self.environment,
                "Tier": "Application",
                "Description": "Security group for application servers"
            }
        )
        
        # Database tier security group
        db_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-sg-db",
            name=f"{self.name_prefix}-sg-db",
            description="Security group for database tier",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 3306,
                    "to_port": 3306,
                    "security_groups": [app_sg.id],
                    "description": "MySQL access from application tier"
                },
                {
                    "protocol": "tcp",
                    "from_port": 5432,
                    "to_port": 5432,
                    "security_groups": [app_sg.id],
                    "description": "PostgreSQL access from application tier"
                }
            ],
            egress=[
                {
                    "protocol": "-1",
                    "from_port": 0,
                    "to_port": 0,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "All outbound traffic"
                }
            ],
            tags={
                "Name": f"{self.name_prefix}-sg-db",
                "Environment": self.environment,
                "Tier": "Database",
                "Description": "Security group for database servers"
            }
        )
        
        return web_sg, app_sg, db_sg



"""
Security infrastructure module
Creates IAM roles, policies, and KMS keys
"""

import pulumi
import pulumi_aws as aws
import json
from typing import Dict


class SecurityInfrastructure:
    def __init__(self, region: str, environment: str):
        self.region = region
        self.environment = environment
        self.name_prefix = f"prod-{region}"
        
        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create IAM roles
        self.ec2_role = self._create_ec2_role()
        self.lambda_role = self._create_lambda_role()
        
        # Create instance profile
        self.instance_profile = self._create_instance_profile()

    def _create_kms_key(self) -> aws.kms.Key:
        """Create KMS key for encryption at rest"""
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }
            ]
        }
        
        kms_key = aws.kms.Key(
            f"{self.name_prefix}-kms-key",
            description=f"KMS key for {self.region} region encryption",
            policy=json.dumps(key_policy),
            tags={
                "Name": f"{self.name_prefix}-kms-key",
                "Environment": self.environment,
                "Description": f"Encryption key for {self.region} region",
                "Region": self.region
            }
        )
        
        # Create alias for the key
        aws.kms.Alias(
            f"{self.name_prefix}-kms-alias",
            name=f"alias/{self.name_prefix}-encryption-key",
            target_key_id=kms_key.key_id
        )
        
        return kms_key

    def _create_ec2_role(self) -> aws.iam.Role:
        """Create IAM role for EC2 instances"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    }
                }
            ]
        }
        
        ec2_role = aws.iam.Role(
            f"{self.name_prefix}-role-ec2",
            name=f"{self.name_prefix}-role-ec2",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"{self.name_prefix}-role-ec2",
                "Environment": self.environment,
                "Description": "IAM role for EC2 instances",
                "Region": self.region
            }
        )
        
        # Attach managed policies
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-policy-attachment-ssm",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-policy-attachment-cloudwatch",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )
        
        # Create custom policy for application-specific permissions
        app_policy = aws.iam.Policy(
            f"{self.name_prefix}-policy-app",
            name=f"{self.name_prefix}-policy-app",
            description="Custom policy for application servers",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{self.name_prefix}-app-bucket/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:DescribeKey"
                        ],
                        "Resource": [
                            self.kms_key.arn
                        ]
                    }
                ]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-policy-attachment-app",
            role=ec2_role.name,
            policy_arn=app_policy.arn
        )
        
        return ec2_role

    def _create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda functions"""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }
        
        lambda_role = aws.iam.Role(
            f"{self.name_prefix}-role-lambda",
            name=f"{self.name_prefix}-role-lambda",
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                "Name": f"{self.name_prefix}-role-lambda",
                "Environment": self.environment,
                "Description": "IAM role for Lambda functions",
                "Region": self.region
            }
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"{self.name_prefix}-policy-attachment-lambda-basic",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        return lambda_role

    def _create_instance_profile(self) -> aws.iam.InstanceProfile:
        """Create instance profile for EC2 instances"""
        return aws.iam.InstanceProfile(
            f"{self.name_prefix}-instance-profile",
            name=f"{self.name_prefix}-instance-profile",
            role=self.ec2_role.name,
            tags={
                "Name": f"{self.name_prefix}-instance-profile",
                "Environment": self.environment,
                "Description": "Instance profile for EC2 instances"
            }
        )


"""
Compute infrastructure module
Creates Auto Scaling Groups, Launch Templates, and Load Balancers
"""

import pulumi
import pulumi_aws as aws
from typing import List, Dict
import base64


class ComputeInfrastructure:
    def __init__(self, region: str, environment: str, networking, security):
        self.region = region
        self.environment = environment
        self.name_prefix = f"prod-{region}"
        self.networking = networking
        self.security = security
        
        # Get configuration
        config = pulumi.Config()
        self.instance_type = config.get("instance-type") or "t3.medium"
        self.min_size = int(config.get("min-size") or "2")
        self.max_size = int(config.get("max-size") or "10")
        self.desired_capacity = int(config.get("desired-capacity") or "4")
        
        # Create Application Load Balancer
        self.alb = self._create_application_load_balancer()
        
        # Create Launch Template
        self.launch_template = self._create_launch_template()
        
        # Create Auto Scaling Group
        self.asg = self._create_auto_scaling_group()
        
        # Create ALB Target Group
        self.target_group = self._create_target_group()
        
        # Create ALB Listener
        self.listener = self._create_alb_listener()

    def _get_user_data(self) -> str:
        """Generate user data script for EC2 instances"""
        user_data_script = """#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y aws-cli

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple web server for demonstration
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Enterprise SaaS Application</title>
</head>
<body>
    <h1>Welcome to Enterprise SaaS Application</h1>
    <p>Region: """ + self.region + """</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Start simple web server
python3 -m http.server 80 &

# Configure log rotation
cat > /etc/logrotate.d/app << 'EOF'
/var/log/app/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 644 root root
}
EOF

# Signal successful completion
/opt/aws/bin/cfn-signal -e $? --stack ${AWS::StackName} --resource AutoScalingGroup --region ${AWS::Region}
"""
        return base64.b64encode(user_data_script.encode()).decode()

    def _create_application_load_balancer(self) -> aws.lb.LoadBalancer:
        """Create Application Load Balancer"""
        return aws.lb.LoadBalancer(
            f"{self.name_prefix}-alb-main",
            name=f"{self.name_prefix}-alb-main",
            load_balancer_type="application",
            scheme="internet-facing",
            security_groups=[self.networking.web_sg.id],
            subnets=[subnet.id for subnet in self.networking.public_subnets],
            enable_deletion_protection=False,  # Set to True for production
            tags={
                "Name": f"{self.name_prefix}-alb-main",
                "Environment": self.environment,
                "Description": f"Application Load Balancer for {self.region}",
                "Region": self.region
            }
        )

    def _create_launch_template(self) -> aws.ec2.LaunchTemplate:
        """Create Launch Template for Auto Scaling Group"""
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                }
            ]
        )
        
        return aws.ec2.LaunchTemplate(
            f"{self.name_prefix}-lt-web-servers",
            name=f"{self.name_prefix}-lt-web-servers",
            image_id=ami.id,
            instance_type=self.instance_type,
            key_name=None,  # Use SSM Session Manager instead
            vpc_security_group_ids=[self.networking.web_sg.id],
            iam_instance_profile={
                "name": self.security.instance_profile.name
            },
            user_data=self._get_user_data(),
            block_device_mappings=[
                {
                    "device_name": "/dev/xvda",
                    "ebs": {
                        "volume_size": 20,
                        "volume_type": "gp3",
                        "encrypted": True,
                        "kms_key_id": self.security.kms_key.arn,
                        "delete_on_termination": True
                    }
                }
            ],
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",
                "http_put_response_hop_limit": 2
            },
            monitoring={
                "enabled": True
            },
            tags={
                "Name": f"{self.name_prefix}-lt-web-servers",
                "Environment": self.environment,
                "Description": "Launch template for web servers",
                "Region": self.region
            },
            tag_specifications=[
                {
                    "resource_type": "instance",
                    "tags": {
                        "Name": f"{self.name_prefix}-instance-web",
                        "Environment": self.environment,
                        "Tier": "Web",
                        "Region": self.region,
                        "Description": "Web server instance"
                    }
                },
                {
                    "resource_type": "volume",
                    "tags": {
                        "Name": f"{self.name_prefix}-volume-web",
                        "Environment": self.environment,
                        "Tier": "Web",
                        "Region": self.region,
                        "Description": "Web server volume"
                    }
                }
            ]
        )

    def _create_target_group(self) -> aws.lb.TargetGroup:
        """Create Target Group for ALB"""
        return aws.lb.TargetGroup(
            f"{self.name_prefix}-tg-web",
            name=f"{self.name_prefix}-tg-web",
            port=80,
            protocol="HTTP",
            vpc_id=self.networking.vpc.id,
            target_type="instance",
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "unhealthy_threshold": 2,
                "timeout": 5,
                "interval": 30,
                "path": "/",
                "matcher": "200",
                "port": "traffic-port",
                "protocol": "HTTP"
            },
            tags={
                "Name": f"{self.name_prefix}-tg-web",
                "Environment": self.environment,
                "Description": "Target group for web servers",
                "Region": self.region
            }
        )

    def _create_auto_scaling_group(self) -> aws.autoscaling.Group:
        """Create Auto Scaling Group"""
        return aws.autoscaling.Group(
            f"{self.name_prefix}-asg-web-servers",
            name=f"{self.name_prefix}-asg-web-servers",
            vpc_zone_identifiers=[subnet.id for subnet in self.networking.private_subnets],
            target_group_arns=[self.target_group.