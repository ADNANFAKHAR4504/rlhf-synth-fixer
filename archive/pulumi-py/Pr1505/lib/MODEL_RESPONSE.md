```python
I'll help you create a secure, highly available, and cost-effective AWS environment using Pulumi's Python SDK. Here's a comprehensive solution organized in a modular structure:

## Project Structure

```
pulumi-aws-infrastructure/
├── __main__.py
├── Pulumi.yaml
├── requirements.txt
├── components/
│   ├── __init__.py
│   ├── networking.py
│   ├── security.py
│   ├── compute.py
│   ├── storage.py
│   ├── database.py
│   ├── monitoring.py
│   └── secrets.py
└── config/
    ├── dev.yaml
    └── prod.yaml
```

## 1. Project Configuration Files

### `Pulumi.yaml`
```yaml
name: secure-web-app-infrastructure
runtime: python
description: Secure, highly available AWS infrastructure for web applications
```

### `requirements.txt`
```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
```

## 2. Main Infrastructure File

### `__main__.py`
```python
import pulumi
import pulumi_aws as aws
from components.networking import NetworkingComponent
from components.security import SecurityComponent
from components.compute import ComputeComponent
from components.storage import StorageComponent
from components.database import DatabaseComponent
from components.monitoring import MonitoringComponent
from components.secrets import SecretsComponent

# Get configuration
config = pulumi.Config()
environment = pulumi.get_stack()
app_name = config.require("app_name")
regions = config.require_object("regions")
primary_region = regions[0]
secondary_region = regions[1] if len(regions) > 1 else regions[0]

# Multi-region deployment
for i, region in enumerate(regions):
    # Create provider for each region
    provider = aws.Provider(f"aws-{region}", region=region)
    
    # Deploy networking infrastructure
    networking = NetworkingComponent(
        f"networking-{region}",
        region=region,
        environment=environment,
        app_name=app_name,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Deploy security components
    security = SecurityComponent(
        f"security-{region}",
        region=region,
        environment=environment,
        app_name=app_name,
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        public_subnet_ids=networking.public_subnet_ids,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Deploy secrets management
    secrets = SecretsComponent(
        f"secrets-{region}",
        region=region,
        environment=environment,
        app_name=app_name,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Deploy storage
    storage = StorageComponent(
        f"storage-{region}",
        region=region,
        environment=environment,
        app_name=app_name,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Deploy database (primary region only)
    if i == 0:
        database = DatabaseComponent(
            f"database-{region}",
            region=region,
            environment=environment,
            app_name=app_name,
            vpc_id=networking.vpc.id,
            private_subnet_ids=networking.private_subnet_ids,
            security_group_id=security.database_sg.id,
            opts=pulumi.ResourceOptions(provider=provider)
        )
    
    # Deploy compute infrastructure
    compute = ComputeComponent(
        f"compute-{region}",
        region=region,
        environment=environment,
        app_name=app_name,
        vpc_id=networking.vpc.id,
        private_subnet_ids=networking.private_subnet_ids,
        public_subnet_ids=networking.public_subnet_ids,
        alb_sg_id=security.alb_sg.id,
        ec2_sg_id=security.ec2_sg.id,
        secrets_arn=secrets.app_secrets_arn,
        opts=pulumi.ResourceOptions(provider=provider)
    )
    
    # Deploy monitoring (primary region only)
    if i == 0:
        monitoring = MonitoringComponent(
            f"monitoring-{region}",
            region=region,
            environment=environment,
            app_name=app_name,
            alb_arn=compute.alb_arn,
            opts=pulumi.ResourceOptions(provider=provider)
        )

# Export important outputs
pulumi.export("primary_region", primary_region)
pulumi.export("secondary_region", secondary_region)
```

## 3. Networking Component

### `components/networking.py`
```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions

class NetworkingComponent(ComponentResource):
    def __init__(self, name: str, region: str, environment: str, app_name: str, opts: ResourceOptions = None):
        super().__init__('custom:networking:NetworkingComponent', name, None, opts)
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{name}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{app_name}-{environment}-vpc",
                "Environment": environment,
                "Region": region
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{name}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{app_name}-{environment}-igw",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create public subnets
        self.public_subnets = []
        self.public_subnet_ids = []
        
        for i in range(min(2, len(azs.names))):
            public_subnet = aws.ec2.Subnet(
                f"{name}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{app_name}-{environment}-public-subnet-{i+1}",
                    "Environment": environment,
                    "Type": "public"
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)
            self.public_subnet_ids.append(public_subnet.id)
        
        # Create private subnets
        self.private_subnets = []
        self.private_subnet_ids = []
        
        for i in range(min(2, len(azs.names))):
            private_subnet = aws.ec2.Subnet(
                f"{name}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={
                    "Name": f"{app_name}-{environment}-private-subnet-{i+1}",
                    "Environment": environment,
                    "Type": "private"
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)
            self.private_subnet_ids.append(private_subnet.id)
        
        # Create NAT Gateways
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = aws.ec2.Eip(
                f"{name}-nat-eip-{i+1}",
                domain="vpc",
                tags={
                    "Name": f"{app_name}-{environment}-nat-eip-{i+1}",
                    "Environment": environment
                },
                opts=ResourceOptions(parent=self, depends_on=[self.igw])
            )
            
            # NAT Gateway
            nat_gw = aws.ec2.NatGateway(
                f"{name}-nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"{app_name}-{environment}-nat-gw-{i+1}",
                    "Environment": environment
                },
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gw)
        
        # Create route tables
        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"{name}-public-rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{app_name}-{environment}-public-rt",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Public route to internet
        aws.ec2.Route(
            f"{name}-public-route",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{name}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Private route tables (one per AZ for high availability)
        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"{name}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={
                    "Name": f"{app_name}-{environment}-private-rt-{i+1}",
                    "Environment": environment
                },
                opts=ResourceOptions(parent=self)
            )
            
            # Private route to NAT Gateway
            aws.ec2.Route(
                f"{name}-private-route-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id,
                opts=ResourceOptions(parent=self)
            )
            
            # Associate private subnet with private route table
            aws.ec2.RouteTableAssociation(
                f"{name}-private-rta-{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=self)
            )
        
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "public_subnet_ids": self.public_subnet_ids,
            "private_subnet_ids": self.private_subnet_ids
        })
```

## 4. Security Component

### `components/security.py`
```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
import json

class SecurityComponent(ComponentResource):
    def __init__(self, name: str, region: str, environment: str, app_name: str, 
                 vpc_id: pulumi.Output, private_subnet_ids: list, public_subnet_ids: list,
                 opts: ResourceOptions = None):
        super().__init__('custom:security:SecurityComponent', name, None, opts)
        
        # Create IAM roles with least privilege
        self._create_iam_roles(name, app_name, environment)
        
        # Create security groups
        self._create_security_groups(name, app_name, environment, vpc_id)
        
        # Create SSL certificate
        self._create_ssl_certificate(name, app_name, environment)
        
        # Create WAF
        self._create_waf(name, app_name, environment)
        
        # Enforce MFA policy
        self._create_mfa_policy(name, app_name, environment)
        
        self.register_outputs({
            "alb_sg_id": self.alb_sg.id,
            "ec2_sg_id": self.ec2_sg.id,
            "database_sg_id": self.database_sg.id,
            "certificate_arn": self.certificate.arn,
            "waf_arn": self.waf.arn
        })
    
    def _create_iam_roles(self, name: str, app_name: str, environment: str):
        # EC2 Instance Role
        self.ec2_role = aws.iam.Role(
            f"{name}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"}
                }]
            }),
            tags={
                "Name": f"{app_name}-{environment}-ec2-role",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Instance Profile
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"{name}-ec2-profile",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self)
        )
        
        # Attach minimal policies to EC2 role
        aws.iam.RolePolicyAttachment(
            f"{name}-ec2-ssm-policy",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=ResourceOptions(parent=self)
        )
        
        # Custom policy for secrets access
        secrets_policy = aws.iam.Policy(
            f"{name}-secrets-policy",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "ssm:GetParameter",
                        "ssm:GetParameters",
                        "ssm:GetParametersByPath"
                    ],
                    "Resource": [
                        f"arn:aws:secretsmanager:*:*:secret:{app_name}-{environment}-*",
                        f"arn:aws:ssm:*:*:parameter/{app_name}/{environment}/*"
                    ]
                }]
            }),
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{name}-ec2-secrets-policy",
            role=self.ec2_role.name,
            policy_arn=secrets_policy.arn,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_security_groups(self, name: str, app_name: str, environment: str, vpc_id: pulumi.Output):
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"{name}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=vpc_id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTP"
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTPS"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"{app_name}-{environment}-alb-sg",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Security Group
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"{name}-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=vpc_id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "security_groups": [self.alb_sg.id],
                    "description": "HTTP from ALB"
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "security_groups": [self.alb_sg.id],
                    "description": "HTTPS from ALB"
                }
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": f"{app_name}-{environment}-ec2-sg",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Database Security Group
        self.database_sg = aws.ec2.SecurityGroup(
            f"{name}-db-sg",
            description="Security group for RDS database",
            vpc_id=vpc_id,
            ingress=[{
                "protocol": "tcp",
                "from_port": 3306,
                "to_port": 3306,
                "security_groups": [self.ec2_sg.id],
                "description": "MySQL from EC2"
            }],
            tags={
                "Name": f"{app_name}-{environment}-db-sg",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_ssl_certificate(self, name: str, app_name: str, environment: str):
        # Create ACM certificate
        self.certificate = aws.acm.Certificate(
            f"{name}-cert",
            domain_name=f"{app_name}-{environment}.example.com",
            subject_alternative_names=[f"*.{app_name}-{environment}.example.com"],
            validation_method="DNS",
            tags={
                "Name": f"{app_name}-{environment}-cert",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_waf(self, name: str, app_name: str, environment: str):
        # Create WAF Web ACL
        self.waf = aws.wafv2.WebAcl(
            f"{name}-waf",
            scope="REGIONAL",
            default_action={"allow": {}},
            rules=[
                {
                    "name": "AWSManagedRulesCommonRuleSet",
                    "priority": 1,
                    "override_action": {"none": {}},
                    "statement": {
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesCommonRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    "visibility_config": {
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": "CommonRuleSetMetric",
                        "sampled_requests_enabled": True
                    }
                },
                {
                    "name": "AWSManagedRulesKnownBadInputsRuleSet",
                    "priority": 2,
                    "override_action": {"none": {}},
                    "statement": {
                        "managed_rule_group_statement": {
                            "name": "AWSManagedRulesKnownBadInputsRuleSet",
                            "vendor_name": "AWS"
                        }
                    },
                    "visibility_config": {
                        "cloudwatch_metrics_enabled": True,
                        "metric_name": "KnownBadInputsRuleSetMetric",
                        "sampled_requests_enabled": True
                    }
                }
            ],
            tags={
                "Name": f"{app_name}-{environment}-waf",
                "Environment": environment
            },
            visibility_config={
                "cloudwatch_metrics_enabled": True,
                "metric_name": f"{app_name}-{environment}-waf",
                "sampled_requests_enabled": True
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_mfa_policy(self, name: str, app_name: str, environment: str):
        # Create MFA enforcement policy
        self.mfa_policy = aws.iam.Policy(
            f"{name}-mfa-policy",
            description="Enforce MFA for all users",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowViewAccountInfo",
                        "Effect": "Allow",
                        "Action": [
                            "iam:GetAccountPasswordPolicy",
                            "iam:GetAccountSummary",
                            "iam:ListVirtualMFADevices"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "AllowManageOwnPasswords",
                        "Effect": "Allow",
                        "Action": [
                            "iam:ChangePassword",
                            "iam:GetUser"
                        ],
                        "Resource": "arn:aws:iam::*:user/${aws:username}"
                    },
                    {
                        "Sid": "AllowManageOwnMFA",
                        "Effect": "Allow",
                        "Action": [
                            "iam:CreateVirtualMFADevice",
                            "iam:DeleteVirtualMFADevice",
                            "iam:EnableMFADevice",
                            "iam:ListMFADevices",
                            "iam:ResyncMFADevice"
                        ],
                        "Resource": [
                            "arn:aws:iam::*:mfa/${aws:username}",
                            "arn:aws:iam::*:user/${aws:username}"
                        ]
                    },
                    {
                        "Sid": "DenyAllExceptUnlessSignedInWithMFA",
                        "Effect": "Deny",
                        "NotAction": [
                            "iam:CreateVirtualMFADevice",
                            "iam:EnableMFADevice",
                            "iam:GetUser",
                            "iam:ListMFADevices",
                            "iam:ListVirtualMFADevices",
                            "iam:ResyncMFADevice",
                            "sts:GetSessionToken"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "BoolIfExists": {
                                "aws:MultiFactorAuthPresent": "false"
                            }
                        }
                    }
                ]
            }),
            tags={
                "Name": f"{app_name}-{environment}-mfa-policy",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
```

## 5. Compute Component

### `components/compute.py`
```python
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions
import base64

class ComputeComponent(ComponentResource):
    def __init__(self, name: str, region: str, environment: str, app_name: str,
                 vpc_id: pulumi.Output, private_subnet_ids: list, public_subnet_ids: list,
                 alb_sg_id: pulumi.Output, ec2_sg_id: pulumi.Output, secrets_arn: pulumi.Output,
                 opts: ResourceOptions = None):
        super().__init__('custom:compute:ComputeComponent', name, None, opts)
        
        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {"name": "name", "values": ["amzn2-ami-hvm-*"]},
                {"name": "architecture", "values": ["x86_64"]}
            ]
        )
        
        # Create Launch Template
        self._create_launch_template(name, app_name, environment, ami.id, ec2_sg_id, secrets_arn)
        
        # Create Application Load Balancer
        self._create_alb(name, app_name, environment, public_subnet_ids, alb_sg_id)
        
        # Create Auto Scaling Group
        self._create_asg(name, app_name, environment, private_subnet_ids)
        
        self.register_outputs({
            "alb_arn": self.alb.arn,
            "alb_dns_name": self.alb.dns_name
        })
    
    def _create_launch_template(self, name: str, app_name: str, environment: str, 
                               ami_id: str, ec2_sg_id: pulumi.Output, secrets_arn: pulumi.Output):
        # User data script for EC2 instances
        user_data = base64.b64encode(f"""#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install application dependencies
yum install -y docker
systemctl start docker
systemctl enable docker

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
    "logs": {{
        "logs_collected": {{
            "files": {{
                "collect_list": [
                    {{
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/{app_name}-{environment}",
                        "log_stream_name": "{{instance_id}}/messages"
                    }},
                    {{
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/{app_name}-{environment}",
                        "log_stream_name": "{{instance_id}}/secure"
                    }}
                ]
            }}
        }}
    }},
    "metrics": {{
        "namespace": "AWS/EC2/Custom",
        "metrics_collected": {{
            "mem": {{
                "measurement": ["mem_used_percent"]
            }},
            "disk": {{
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            }}
        }}
    }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Get application secrets from AWS Secrets Manager
SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id {secrets_arn} --query SecretString --output text --region {region})

# Export secrets as environment variables
export APP_SECRETS="$SECRET_VALUE"

# Start your application here
# docker run -d -p 80:80 -e APP_SECRETS="$APP_SECRETS" your-app:latest
""".encode()).decode()
        
        self.launch_template = aws.ec2.LaunchTemplate(
            f"{name}-lt",
            image_id=ami_id,
            instance_type="t3.micro",  # Cost-effective instance type
            vpc_security_group_ids=[ec2_sg_id],
            user_data=user_data,
            iam_instance_profile={"name": "ec2-instance-profile"},  # Reference from security component
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",  # Enforce IMDSv2
                "http_put_response_hop_limit": 2
            },
            monitoring={"enabled": True},
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {
                    "Name": f"{app_name}-{environment}-instance",
                    "Environment": environment
                }
            }],
            tags={
                "Name": f"{app_name}-{environment}-lt",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_alb(self, name: str, app_name: str, environment: str, 
                   public_subnet_ids: list, alb_sg_id: pulumi.Output):
        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{name}-alb",
            load_balancer_type="application",
            subnets=public_subnet_ids,
            security_groups=[alb_sg_id],
            enable_deletion_protection=False,  # Set to True for production
            access_logs={
                "bucket": f"{app_name}-{environment}-alb-logs",  # Will be created in storage component
                "enabled": True
            },
            tags={
                "Name": f"{app_name}-{environment}-alb",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Target Group
        self.target_group = aws.lb.TargetGroup(
            f"{name}-tg",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_id,
            health_check={
                "enabled": True,
                "healthy_threshold": 2,
                "interval": 30,
                "matcher": "200",
                "path": "/health",
                "port": "traffic-port",
                "protocol": "HTTP",
                "timeout": 5,
                "unhealthy_threshold": 2
            },
            tags={
                "Name": f"{app_name}-{environment}-tg",
                "Environment": environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # HTTPS Listener (requires certificate from security component)
        self.https_listener = aws.lb.Listener(
            f"{name}-https-listener",
            load_balancer_arn=self.alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
            certificate_arn="certificate_arn",  # Reference from security component
            default_actions=[{
                "type": "forward",
                "target_group_arn": self.target_group.arn
            }],
            opts=ResourceOptions(parent=self)
        )
        
        # HTTP Listener (redirect to HTTPS)
        self.http_listener = aws.lb.Listener(
            f"{name}-http-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[{
                "type": "redirect",
                "redirect": {
```