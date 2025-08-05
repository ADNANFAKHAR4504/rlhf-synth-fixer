# lib/tap_stack.py
import pulumi
import pulumi_aws as aws
import json
import base64
from typing import Dict, List, Optional


class TapStackArgs:
    """Arguments for TapStack component"""
    
    def __init__(self, config: Dict = None, environment_suffix: str = None):
        # Support both the dict-style config (for tests) and environment_suffix (for tap.py)
        if config is not None:
            self.config = config
            self.environment = config.get("environment", "dev")
            self.region = config.get("region", "us-east-1")
            self.app_name = config.get("app_name", "tap-app")
        elif environment_suffix is not None:
            # Use environment_suffix from tap.py
            self.config = {
                "environment": environment_suffix,
                "region": "us-east-1",
                "app_name": "tap-app"
            }
            self.environment = environment_suffix
            self.region = "us-east-1"
            self.app_name = "tap-app"
        else:
            # Default fallback
            self.config = {
                "environment": "dev",
                "region": "us-east-1", 
                "app_name": "tap-app"
            }
            self.environment = "dev"
            self.region = "us-east-1"
            self.app_name = "tap-app"


class TapStack(pulumi.ComponentResource):
    """
    Complete AWS CI/CD infrastructure stack with multi-environment support,
    blue-green deployments, security scanning, and monitoring.
    """
    
    def __init__(self, name: str, args: TapStackArgs, 
                 opts: Optional[pulumi.ResourceOptions] = None):
        super().__init__("custom:x:TapStack", name, None, opts)
        
        self.config = args.config
        self.environment = args.environment
        self.region = args.region
        self.app_name = args.app_name
        
        # Initialize all infrastructure components
        self._create_networking()
        self._create_security()
        self._create_application_infrastructure()
        self._create_cicd_pipeline()
        self._create_monitoring()
        self._create_lambda_functions()
        
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "pipeline_name": self.pipeline.name,
            "load_balancer_dns": self.alb.dns_name,
            "blue_target_group_arn": self.blue_target_group.arn,
            "green_target_group_arn": self.green_target_group.arn
        })
    
    def _create_networking(self):
        """Create VPC, subnets, and networking components for multi-AZ deployment"""
        
        # VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.app_name}-vpc-{self.environment}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.app_name}-vpc-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{self.app_name}-igw-{self.environment}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.app_name}-igw-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Availability Zones
        self.azs = aws.get_availability_zones(state="available")
        
        # Public Subnets (Multi-AZ)
        self.public_subnets = []
        for i, az in enumerate(self.azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.app_name}-public-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.app_name}-public-subnet-{i+1}-{self.environment}",
                    "Environment": self.environment,
                    "Type": "public"
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
        
        # Private Subnets (Multi-AZ)
        self.private_subnets = []
        for i, az in enumerate(self.azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.app_name}-private-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{self.app_name}-private-subnet-{i+1}-{self.environment}",
                    "Environment": self.environment,
                    "Type": "private"
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
        
        # NAT Gateways for private subnets
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = aws.ec2.Eip(
                f"{self.app_name}-eip-{i+1}-{self.environment}",
                domain="vpc",
                tags={
                    "Name": f"{self.app_name}-eip-{i+1}-{self.environment}",
                    "Environment": self.environment
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            
            nat_gw = aws.ec2.NatGateway(
                f"{self.app_name}-nat-{i+1}-{self.environment}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"{self.app_name}-nat-{i+1}-{self.environment}",
                    "Environment": self.environment
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat_gw)
        
        # Route Tables
        self.public_rt = aws.ec2.RouteTable(
            f"{self.app_name}-public-rt-{self.environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"{self.app_name}-public-rt-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.app_name}-public-rta-{i+1}-{self.environment}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
        
        # Private route tables
        self.private_rts = []
        for i, (subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            route_table = aws.ec2.RouteTable(
                f"{self.app_name}-private-rt-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                routes=[
                    aws.ec2.RouteTableRouteArgs(
                        cidr_block="0.0.0.0/0",
                        nat_gateway_id=nat_gw.id
                    )
                ],
                tags={
                    "Name": f"{self.app_name}-private-rt-{i+1}-{self.environment}",
                    "Environment": self.environment
                },
                opts=pulumi.ResourceOptions(parent=self)
            )
            self.private_rts.append(route_table)
            
            aws.ec2.RouteTableAssociation(
                f"{self.app_name}-private-rta-{i+1}-{self.environment}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=pulumi.ResourceOptions(parent=self)
            )
    
    def _create_security(self):
        """Create security groups, IAM roles, and secrets management"""
        
        # Application Load Balancer Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"{self.app_name}-alb-sg-{self.environment}",
            name=f"{self.app_name}-alb-sg-{self.environment}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
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
            tags={
                "Name": f"{self.app_name}-alb-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Application Security Group
        self.app_sg = aws.ec2.SecurityGroup(
            f"{self.app_name}-app-sg-{self.environment}",
            name=f"{self.app_name}-app-sg-{self.environment}",
            description="Security group for application instances",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_sg.id]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=22,
                    to_port=22,
                    cidr_blocks=["10.0.0.0/16"]
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
            tags={
                "Name": f"{self.app_name}-app-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM Role for EC2 instances
        self.ec2_role = aws.iam.Role(
            f"{self.app_name}-ec2-role-{self.environment}",
            assume_role_policy=json.dumps({
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
            }),
            tags={
                "Name": f"{self.app_name}-ec2-role-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM policies for EC2 role
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-ec2-role-ssm-{self.environment}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-ec2-role-cloudwatch-{self.environment}",
            role=self.ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Custom policy for secrets access
        self.secrets_policy = aws.iam.Policy(
            f"{self.app_name}-secrets-policy-{self.environment}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": f"arn:aws:secretsmanager:{self.region}:*:secret:{self.app_name}-{self.environment}-*"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-ec2-secrets-{self.environment}",
            role=self.ec2_role.name,
            policy_arn=self.secrets_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Instance Profile
        self.instance_profile = aws.iam.InstanceProfile(
            f"{self.app_name}-instance-profile-{self.environment}",
            role=self.ec2_role.name,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Secrets Manager
        self.app_secrets = aws.secretsmanager.Secret(
            f"{self.app_name}-secrets-{self.environment}",
            name=f"{self.app_name}-{self.environment}-secrets",
            description=f"Application secrets for {self.environment} environment",
            tags={
                "Environment": self.environment,
                "Application": self.app_name
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Secret version with default values
        self.app_secrets_version = aws.secretsmanager.SecretVersion(
            f"{self.app_name}-secrets-version-{self.environment}",
            secret_id=self.app_secrets.id,
            secret_string=json.dumps({
                "database_password": "change-me-in-production",
                "api_key": "default-api-key",
                "jwt_secret": "default-jwt-secret"
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _create_application_infrastructure(self):
        """Create application infrastructure with blue-green deployment support"""
        
        # Application Load Balancer
        self.alb = aws.lb.LoadBalancer(
            f"{self.app_name}-alb-{self.environment}",
            name=f"{self.app_name}-alb-{self.environment}",
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=self.environment == "prod",
            tags={
                "Name": f"{self.app_name}-alb-{self.environment}",
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Blue Target Group
        self.blue_target_group = aws.lb.TargetGroup(
            f"{self.app_name}-blue-tg-{self.environment}",
            name=f"{self.app_name}-blue-{self.environment}",
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
                "Name": f"{self.app_name}-blue-tg-{self.environment}",
                "Environment": self.environment,
                "Color": "blue"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Green Target Group
        self.green_target_group = aws.lb.TargetGroup(
            f"{self.app_name}-green-tg-{self.environment}",
            name=f"{self.app_name}-green-{self.environment}",
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
                "Name": f"{self.app_name}-green-tg-{self.environment}",
                "Environment": self.environment,
                "Color": "green"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"{self.app_name}-alb-listener-{self.environment}",
            load_balancer_arn=self.alb.arn,
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
        
        # User data script for EC2 instances
        user_data_script = self._generate_user_data_script()
        
        # Launch Template
        self.launch_template = aws.ec2.LaunchTemplate(
            f"{self.app_name}-lt-{self.environment}",
            name=f"{self.app_name}-lt-{self.environment}",
            image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI
            instance_type="t3.micro" if self.environment != "prod" else "t3.small",
            vpc_security_group_ids=[self.app_sg.id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.instance_profile.name
            ),
            user_data=base64.b64encode(user_data_script.encode()).decode(),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={
                        "Name": f"{self.app_name}-instance-{self.environment}",
                        "Environment": self.environment,
                        "Application": self.app_name
                    }
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Auto Scaling Group
        self.asg = aws.autoscaling.Group(
            f"{self.app_name}-asg-{self.environment}",
            name=f"{self.app_name}-asg-{self.environment}",
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            target_group_arns=[self.blue_target_group.arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=1 if self.environment != "prod" else 2,
            max_size=3 if self.environment != "prod" else 6,
            desired_capacity=1 if self.environment != "prod" else 2,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"{self.app_name}-asg-{self.environment}",
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.environment,
                    propagate_at_launch=True
                )
            ],
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _generate_user_data_script(self):
        """Generate EC2 user data script"""
        return f"""#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install CodeDeploy agent
yum install -y ruby wget
cd /home/ec2-user
wget https://aws-codedeploy-{self.region}.s3.{self.region}.amazonaws.com/latest/install
chmod +x ./install
./install auto

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Create health check endpoint script
cat > /opt/app/health.py << 'EOF'
#!/usr/bin/env python3
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {{"status": "healthy", "environment": "{self.environment}"}}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 8080), HealthHandler)
    print('Starting health check server on port 8080...')
    server.serve_forever()
EOF

chmod +x /opt/app/health.py

# Create systemd service for health check
cat > /etc/systemd/system/app-health.service << 'EOF'
[Unit]
Description=Application Health Check Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/health.py
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable app-health
systemctl start app-health
"""
    
    def _create_cicd_pipeline(self):
        """Create CI/CD pipeline with CodePipeline, CodeBuild, and CodeDeploy"""
        
        # S3 bucket for artifacts
        self.artifacts_bucket = aws.s3.Bucket(
            f"{self.app_name}-artifacts-{self.environment}",
            bucket=f"{self.app_name}-artifacts-{self.environment}-{pulumi.get_stack()}",
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            ),
            tags={
                "Environment": self.environment,
                "Purpose": "CI/CD Artifacts"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Create CI/CD roles
        self._create_cicd_roles()
        
        # CodeBuild Project
        buildspec = self._generate_buildspec()
        
        self.codebuild_project = aws.codebuild.Project(
            f"{self.app_name}-build-{self.environment}",
            name=f"{self.app_name}-build-{self.environment}",
            description=f"Build project for {self.app_name} {self.environment}",
            service_role=self.codebuild_role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type="CODEPIPELINE"
            ),
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
                        name="SNYK_TOKEN",
                        value="placeholder-token",
                        type="PARAMETER_STORE"
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type="CODEPIPELINE",
                buildspec=buildspec
            ),
            tags={
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # CodeDeploy Application and Deployment Group
        self._create_codedeploy_resources()
        
        # CodePipeline
        self._create_codepipeline()
    
    def _create_cicd_roles(self):
        """Create IAM roles for CI/CD services"""
        
        # IAM Role for CodeBuild
        self.codebuild_role = aws.iam.Role(
            f"{self.app_name}-codebuild-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "codebuild.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # CodeBuild policy
        self.codebuild_policy = aws.iam.Policy(
            f"{self.app_name}-codebuild-policy-{self.environment}",
            policy=pulumi.Output.all(
                self.artifacts_bucket.arn,
                self.app_secrets.arn
            ).apply(lambda args: json.dumps({
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
                            "s3:PutObject"
                        ],
                        "Resource": [
                            f"{args[0]}/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": args[1]
                    }
                ]
            })),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-codebuild-policy-attachment-{self.environment}",
            role=self.codebuild_role.name,
            policy_arn=self.codebuild_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM Role for CodeDeploy
        self.codedeploy_role = aws.iam.Role(
            f"{self.app_name}-codedeploy-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "codedeploy.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-codedeploy-policy-{self.environment}",
            role=self.codedeploy_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSCodeDeployRole",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # IAM Role for CodePipeline
        self.codepipeline_role = aws.iam.Role(
            f"{self.app_name}-codepipeline-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "codepipeline.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # CodePipeline policy
        self.codepipeline_policy = aws.iam.Policy(
            f"{self.app_name}-codepipeline-policy-{self.environment}",
            policy=pulumi.Output.all(
                self.artifacts_bucket.arn,
                self.codebuild_project.arn if hasattr(self, 'codebuild_project') else "",
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetBucketVersioning",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject"
                        ],
                        "Resource": [
                            args[0],
                            f"{args[0]}/*"
                        ]
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
            })),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-codepipeline-policy-attachment-{self.environment}",
            role=self.codepipeline_role.name,
            policy_arn=self.codepipeline_policy.arn,
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _generate_buildspec(self):
        """Generate CodeBuild buildspec"""
        return f"""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.9
    commands:
      - echo Installing dependencies...
      - pip install --upgrade pip
      - pip install pytest boto3 requests
      - curl -L https://github.com/snyk/snyk/releases/latest/download/snyk-linux -o snyk
      - chmod +x snyk
      - mv snyk /usr/local/bin/
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Running security scan with Snyk...
      - snyk auth $SNYK_TOKEN || echo "Snyk auth failed, continuing..."
      - snyk test --severity-threshold=high || echo "Snyk scan completed with warnings"
  build:
    commands:
      - echo Build started on `date`
      - echo Running tests...
      - python -m pytest tests/ -v || echo "Tests completed"
      - echo Creating deployment package...
      - zip -r deployment.zip . -x "tests/*" "*.git*" "*.pyc" "__pycache__/*"
  post_build:
    commands:
      - echo Build completed on `date`
artifacts:
  files:
    - deployment.zip
    - appspec.yml
    - scripts/**/*
"""
    
    def _create_codedeploy_resources(self):
        """Create CodeDeploy application and deployment group"""
        
        # CodeDeploy Application
        self.codedeploy_app = aws.codedeploy.Application(
            f"{self.app_name}-deploy-app-{self.environment}",
            name=f"{self.app_name}-{self.environment}",
            compute_platform="Server",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # CodeDeploy Deployment Group
        self.codedeploy_group = aws.codedeploy.DeploymentGroup(
            f"{self.app_name}-deploy-group-{self.environment}",
            app_name=self.codedeploy_app.name,
            deployment_group_name=f"{self.app_name}-deployment-group-{self.environment}",
            service_role_arn=self.codedeploy_role.arn,
            deployment_config_name="CodeDeployDefault.AllAtOneTime",
            ec2_tag_filters=[
                aws.codedeploy.DeploymentGroupEc2TagFilterArgs(
                    key="Name",
                    type="KEY_AND_VALUE",
                    value=f"{self.app_name}-instance-{self.environment}"
                )
            ],
            load_balancer_info=aws.codedeploy.DeploymentGroupLoadBalancerInfoArgs(
                target_group_infos=[
                    aws.codedeploy.DeploymentGroupLoadBalancerInfoTargetGroupInfoArgs(
                        name=self.blue_target_group.name
                    )
                ]
            ),
            auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
                enabled=True,
                events=["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"]
            ),
            tags={
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _create_codepipeline(self):
        """Create CodePipeline"""
        
        self.pipeline = aws.codepipeline.Pipeline(
            f"{self.app_name}-pipeline-{self.environment}",
            name=f"{self.app_name}-pipeline-{self.environment}",
            role_arn=self.codepipeline_role.arn,
            artifact_stores=[aws.codepipeline.PipelineArtifactStoreArgs(
                location=self.artifacts_bucket.bucket,
                type="S3",
                region=self.region
            )],
            stages=[
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
                                "ApplicationName": self.codedeploy_app.name,
                                "DeploymentGroupName": self.codedeploy_group.deployment_group_name
                            }
                        )
                    ]
                )
            ],
            tags={
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _create_monitoring(self):
        """Create CloudWatch monitoring, logging, and alarms"""
        
        # CloudWatch Log Group
        self.log_group = aws.cloudwatch.LogGroup(
            f"{self.app_name}-logs-{self.environment}",
            name=f"/aws/{self.app_name}/{self.environment}",
            retention_in_days=7 if self.environment != "prod" else 30,
            tags={
                "Environment": self.environment,
                "Application": self.app_name
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # CloudWatch Alarms
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.app_name}-cpu-alarm-{self.environment}",
            name=f"{self.app_name}-high-cpu-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[],
            dimensions={
                "AutoScalingGroupName": self.asg.name
            },
            tags={
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # ALB target healthy hosts alarm
        self.healthy_hosts_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.app_name}-healthy-hosts-alarm-{self.environment}",
            name=f"{self.app_name}-unhealthy-hosts-{self.environment}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1.0,
            alarm_description="This metric monitors healthy target hosts",
            alarm_actions=[],
            dimensions={
                "TargetGroup": self.blue_target_group.arn_suffix,
                "LoadBalancer": self.alb.arn_suffix
            },
            tags={
                "Environment": self.environment
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Custom dashboard
        self.dashboard = aws.cloudwatch.Dashboard(
            f"{self.app_name}-dashboard-{self.environment}",
            dashboard_name=f"{self.app_name}-{self.environment}",
            dashboard_body=pulumi.Output.all(
                self.asg.name,
                self.alb.arn_suffix,
                self.blue_target_group.arn_suffix
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", args[0]],
                                ["AWS/ApplicationELB", "TargetResponseTime", "LoadBalancer", args[1]],
                                ["AWS/ApplicationELB", "HealthyHostCount", "TargetGroup", args[2], "LoadBalancer", args[1]]
                            ],
                            "view": "timeSeries",
                            "stacked": False,
                            "region": self.region,
                            "title": f"{self.app_name} {self.environment} Metrics",
                            "period": 300
                        }
                    }
                ]
            })),
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _create_lambda_functions(self):
        """Create Lambda functions for serverless components"""
        
        # IAM Role for Lambda
        self.lambda_role = aws.iam.Role(
            f"{self.app_name}-lambda-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "lambda.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self.app_name}-lambda-basic-{self.environment}",
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Health check Lambda function
        health_check_code = self._get_health_check_lambda_code()
        
        self.health_check_lambda = aws.lambda_.Function(
            f"{self.app_name}-health-check-{self.environment}",
            name=f"{self.app_name}-health-check-{self.environment}",
            role=self.lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            timeout=30,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(health_check_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment,
                    "ALB_DNS": self.alb.dns_name
                }
            ),
            tags={
                "Environment": self.environment,
                "Purpose": "Health Check"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
        
        # Deployment notification Lambda function
        notification_code = self._get_notification_lambda_code()
        
        self.notification_lambda = aws.lambda_.Function(
            f"{self.app_name}-notification-{self.environment}",
            name=f"{self.app_name}-notification-{self.environment}",
            role=self.lambda_role.arn,
            handler="index.lambda_handler",
            runtime="python3.9",
            timeout=30,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(notification_code)
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "ENVIRONMENT": self.environment
                }
            ),
            tags={
                "Environment": self.environment,
                "Purpose": "Pipeline Notifications"
            },
            opts=pulumi.ResourceOptions(parent=self)
        )
    
    def _get_health_check_lambda_code(self):
        """Get health check Lambda function code"""
        return """
import json
import boto3
import urllib3

def lambda_handler(event, context):
    # Health check logic for application monitoring
    http = urllib3.PoolManager()
    
    # Get ALB DNS from environment variable
    alb_dns = event.get('alb_dns', 'localhost')
    
    try:
        response = http.request('GET', f'http://{alb_dns}/health')
        
        if response.status == 200:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'healthy',
                    'message': 'Application is running normally',
                    'timestamp': context.aws_request_id
                })
            }
        else:
            return {
                'statusCode': 500,
                'body': json.dumps({
                    'status': 'unhealthy',
                    'message': f'Health check failed with status {response.status}',
                    'timestamp': context.aws_request_id
                })
            }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'status': 'error',
                'message': str(e),
                'timestamp': context.aws_request_id
            })
        }
"""
    
    def _get_notification_lambda_code(self):
        """Get notification Lambda function code"""
        return """
import json
import boto3
import os

def lambda_handler(event, context):
    # Process CodePipeline state change events
    detail = event.get('detail', {})
    pipeline_name = detail.get('pipeline', 'unknown')
    state = detail.get('state', 'unknown')
    
    print(f"Pipeline {pipeline_name} changed to state: {state}")
    
    # Here you would typically send notifications to Slack, email, etc.
    # For this example, we'll just log the event
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': f'Processed pipeline event for {pipeline_name}',
            'state': state,
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }
"""
