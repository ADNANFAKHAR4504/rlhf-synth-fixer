I'll implement a comprehensive, security-first AWS infrastructure using Pulumi with Python that meets all enterprise requirements. Here's the complete solution:

## lib/tap_stack.py

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, List, Optional
import json
import base64

class TapStack:
    """
    Production-grade, multi-region AWS infrastructure stack with security-first approach.
    
    Implements enterprise security standards including:
    - Multi-region deployment (us-east-1, us-west-2, ap-south-1)
    - Least-privilege IAM policies
    - Encryption at rest and in transit
    - Comprehensive monitoring and compliance
    - Cross-region replication and disaster recovery
    """
    
    def __init__(self, name: str, opts: Optional[pulumi.ResourceOptions] = None):
        """
        Initialize the TapStack with security-first configuration.
        
        Args:
            name: Stack name identifier
            opts: Pulumi resource options
        """
        self.name = name
        self.opts = opts
        self.regions = ["us-east-1", "us-west-2", "ap-south-1"]
        self.primary_region = "us-east-1"
        
        # Initialize providers for each region
        self.providers = {}
        for region in self.regions:
            self.providers[region] = aws.Provider(
                f"aws-{region}",
                region=region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.apply_tags("provider", region)
                )
            )
        
        # Create infrastructure components
        self.security_resources = self.create_security_resources()
        self.networking = self.create_networking()
        self.storage_resources = self.create_storage_resources(self.security_resources)
        self.compute_resources = self.create_compute_resources(
            self.networking, self.security_resources
        )
        self.monitoring = self.create_monitoring()
        
        # Export important outputs
        self.export_outputs()
    
    def create_networking(self) -> Dict:
        """
        Create VPC, subnets, gateways, and routing configuration across regions.
        
        Returns:
            Dict containing networking resources for each region
        """
        networking = {}
        
        for region in self.regions:
            provider = self.providers[region]
            region_networking = {}
            
            # Create VPC
            vpc = aws.ec2.Vpc(
                f"PROD-vpc-main-{region}",
                cidr_block="10.0.0.0/16" if region == "us-east-1" 
                          else "10.1.0.0/16" if region == "us-west-2" 
                          else "10.2.0.0/16",
                enable_dns_hostnames=True,
                enable_dns_support=True,
                tags=self.apply_tags("vpc", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            region_networking["vpc"] = vpc
            
            # Get availability zones
            azs = aws.get_availability_zones(
                state="available",
                opts=pulumi.InvokeOptions(provider=provider)
            )
            
            # Create public and private subnets
            public_subnets = []
            private_subnets = []
            
            for i, az in enumerate(azs.names[:3]):  # Use first 3 AZs
                # Public subnet
                public_subnet = aws.ec2.Subnet(
                    f"PROD-subnet-public-{i+1}-{region}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.{0 if region == 'us-east-1' else 1 if region == 'us-west-2' else 2}.{i+1}.0/24",
                    availability_zone=az,
                    map_public_ip_on_launch=True,
                    tags={**self.apply_tags("subnet", region), "Type": "Public"},
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                public_subnets.append(public_subnet)
                
                # Private subnet
                private_subnet = aws.ec2.Subnet(
                    f"PROD-subnet-private-{i+1}-{region}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.{0 if region == 'us-east-1' else 1 if region == 'us-west-2' else 2}.{i+10}.0/24",
                    availability_zone=az,
                    tags={**self.apply_tags("subnet", region), "Type": "Private"},
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                private_subnets.append(private_subnet)
            
            region_networking["public_subnets"] = public_subnets
            region_networking["private_subnets"] = private_subnets
            
            # Internet Gateway
            igw = aws.ec2.InternetGateway(
                f"PROD-igw-main-{region}",
                vpc_id=vpc.id,
                tags=self.apply_tags("igw", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            region_networking["igw"] = igw
            
            # NAT Gateways (one per AZ for high availability)
            nat_gateways = []
            for i, public_subnet in enumerate(public_subnets):
                # Elastic IP for NAT Gateway
                eip = aws.ec2.Eip(
                    f"PROD-eip-nat-{i+1}-{region}",
                    domain="vpc",
                    tags=self.apply_tags("eip", region),
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                
                # NAT Gateway
                nat_gw = aws.ec2.NatGateway(
                    f"PROD-natgw-{i+1}-{region}",
                    allocation_id=eip.id,
                    subnet_id=public_subnet.id,
                    tags=self.apply_tags("natgw", region),
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                nat_gateways.append(nat_gw)
            
            region_networking["nat_gateways"] = nat_gateways
            
            # Route Tables
            # Public route table
            public_rt = aws.ec2.RouteTable(
                f"PROD-rt-public-{region}",
                vpc_id=vpc.id,
                tags={**self.apply_tags("rt", region), "Type": "Public"},
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Public route to internet
            aws.ec2.Route(
                f"PROD-route-public-internet-{region}",
                route_table_id=public_rt.id,
                destination_cidr_block="0.0.0.0/0",
                gateway_id=igw.id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Associate public subnets with public route table
            for i, subnet in enumerate(public_subnets):
                aws.ec2.RouteTableAssociation(
                    f"PROD-rta-public-{i+1}-{region}",
                    subnet_id=subnet.id,
                    route_table_id=public_rt.id,
                    opts=pulumi.ResourceOptions(provider=provider)
                )
            
            # Private route tables (one per AZ)
            private_rts = []
            for i, (private_subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
                private_rt = aws.ec2.RouteTable(
                    f"PROD-rt-private-{i+1}-{region}",
                    vpc_id=vpc.id,
                    tags={**self.apply_tags("rt", region), "Type": "Private"},
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                
                # Route to NAT Gateway
                aws.ec2.Route(
                    f"PROD-route-private-nat-{i+1}-{region}",
                    route_table_id=private_rt.id,
                    destination_cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gw.id,
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                
                # Associate private subnet
                aws.ec2.RouteTableAssociation(
                    f"PROD-rta-private-{i+1}-{region}",
                    subnet_id=private_subnet.id,
                    route_table_id=private_rt.id,
                    opts=pulumi.ResourceOptions(provider=provider)
                )
                
                private_rts.append(private_rt)
            
            region_networking["public_rt"] = public_rt
            region_networking["private_rts"] = private_rts
            
            # VPC Flow Logs
            flow_logs_role = aws.iam.Role(
                f"PROD-role-flowlogs-{region}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "vpc-flow-logs.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }),
                tags=self.apply_tags("iam-role", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            aws.iam.RolePolicyAttachment(
                f"PROD-policy-flowlogs-{region}",
                role=flow_logs_role.name,
                policy_arn="arn:aws:iam::aws:policy/service-role/VPCFlowLogsDeliveryRolePolicy",
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # CloudWatch Log Group for VPC Flow Logs
            flow_logs_group = aws.cloudwatch.LogGroup(
                f"PROD-lg-vpcflowlogs-{region}",
                name=f"/aws/vpc/flowlogs/{region}",
                retention_in_days=30,
                tags=self.apply_tags("log-group", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # VPC Flow Logs
            aws.ec2.FlowLog(
                f"PROD-flowlog-vpc-{region}",
                iam_role_arn=flow_logs_role.arn,
                log_destination=flow_logs_group.arn,
                log_destination_type="cloud-watch-logs",
                resource_id=vpc.id,
                resource_type="VPC",
                traffic_type="ALL",
                tags=self.apply_tags("flow-log", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            networking[region] = region_networking
        
        # Create VPC Peering connections between regions
        self.create_vpc_peering(networking)
        
        return networking
    
    def create_vpc_peering(self, networking: Dict):
        """
        Create VPC peering connections between regions for disaster recovery.
        
        Args:
            networking: Dictionary containing VPC resources for each region
        """
        # Peer us-east-1 with us-west-2
        peering_east_west = aws.ec2.VpcPeeringConnection(
            "PROD-peer-east-west",
            peer_region="us-west-2",
            peer_vpc_id=networking["us-west-2"]["vpc"].id,
            vpc_id=networking["us-east-1"]["vpc"].id,
            auto_accept=False,
            tags=self.apply_tags("vpc-peer", "us-east-1"),
            opts=pulumi.ResourceOptions(provider=self.providers["us-east-1"])
        )
        
        # Accept peering in us-west-2
        aws.ec2.VpcPeeringConnectionAccepter(
            "PROD-peer-accepter-west",
            vpc_peering_connection_id=peering_east_west.id,
            auto_accept=True,
            tags=self.apply_tags("vpc-peer", "us-west-2"),
            opts=pulumi.ResourceOptions(provider=self.providers["us-west-2"])
        )
        
        # Peer us-east-1 with ap-south-1
        peering_east_south = aws.ec2.VpcPeeringConnection(
            "PROD-peer-east-south",
            peer_region="ap-south-1",
            peer_vpc_id=networking["ap-south-1"]["vpc"].id,
            vpc_id=networking["us-east-1"]["vpc"].id,
            auto_accept=False,
            tags=self.apply_tags("vpc-peer", "us-east-1"),
            opts=pulumi.ResourceOptions(provider=self.providers["us-east-1"])
        )
        
        # Accept peering in ap-south-1
        aws.ec2.VpcPeeringConnectionAccepter(
            "PROD-peer-accepter-south",
            vpc_peering_connection_id=peering_east_south.id,
            auto_accept=True,
            tags=self.apply_tags("vpc-peer", "ap-south-1"),
            opts=pulumi.ResourceOptions(provider=self.providers["ap-south-1"])
        )
    
    def create_security_resources(self) -> Dict:
        """
        Create IAM roles, security groups, KMS keys, and other security resources.
        
        Returns:
            Dict containing security resources for each region
        """
        security = {}
        
        for region in self.regions:
            provider = self.providers[region]
            region_security = {}
            
            # KMS Key for encryption
            kms_key = aws.kms.Key(
                f"PROD-kms-main-{region}",
                description=f"Main KMS key for {region}",
                key_usage="ENCRYPT_DECRYPT",
                key_spec="SYMMETRIC_DEFAULT",
                deletion_window_in_days=7,
                enable_key_rotation=True,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {"AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"},
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudWatch Logs",
                            "Effect": "Allow",
                            "Principal": {"Service": f"logs.{region}.amazonaws.com"},
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
                }),
                tags=self.apply_tags("kms", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # KMS Key Alias
            aws.kms.Alias(
                f"PROD-kms-alias-main-{region}",
                name=f"alias/prod-main-{region}",
                target_key_id=kms_key.key_id,
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            region_security["kms_key"] = kms_key
            
            # EC2 Instance Role
            ec2_role = aws.iam.Role(
                f"PROD-role-ec2-{region}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "ec2.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }),
                tags=self.apply_tags("iam-role", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # EC2 Instance Policy
            ec2_policy = aws.iam.RolePolicy(
                f"PROD-policy-ec2-{region}",
                role=ec2_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogStreams"
                            ],
                            "Resource": f"arn:aws:logs:{region}:{aws.get_caller_identity().account_id}:*"
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue"
                            ],
                            "Resource": f"arn:aws:secretsmanager:{region}:{aws.get_caller_identity().account_id}:secret:prod/*"
                        }
                    ]
                }),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Instance Profile
            ec2_instance_profile = aws.iam.InstanceProfile(
                f"PROD-profile-ec2-{region}",
                role=ec2_role.name,
                tags=self.apply_tags("iam-profile", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            region_security["ec2_role"] = ec2_role
            region_security["ec2_instance_profile"] = ec2_instance_profile
            
            # Lambda Execution Role
            lambda_role = aws.iam.Role(
                f"PROD-role-lambda-{region}",
                assume_role_policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [{
                        "Effect": "Allow",
                        "Principal": {"Service": "lambda.amazonaws.com"},
                        "Action": "sts:AssumeRole"
                    }]
                }),
                managed_policy_arns=[
                    "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
                ],
                tags=self.apply_tags("iam-role", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            region_security["lambda_role"] = lambda_role
            
            security[region] = region_security
        
        return security
    
    def create_compute_resources(self, networking: Dict, security: Dict) -> Dict:
        """
        Create EC2 instances, Auto Scaling Groups, Load Balancers, and Lambda functions.
        
        Args:
            networking: Networking resources dictionary
            security: Security resources dictionary
            
        Returns:
            Dict containing compute resources for each region
        """
        compute = {}
        
        for region in self.regions:
            provider = self.providers[region]
            region_compute = {}
            
            # Security Groups
            # ALB Security Group
            alb_sg = aws.ec2.SecurityGroup(
                f"PROD-sg-alb-{region}",
                name=f"PROD-sg-alb-{region}",
                description="Security group for Application Load Balancer",
                vpc_id=networking[region]["vpc"].id,
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=80,
                        to_port=80,
                        cidr_blocks=["0.0.0.0/0"],
                        description="HTTP from anywhere"
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=443,
                        to_port=443,
                        cidr_blocks=["0.0.0.0/0"],
                        description="HTTPS from anywhere"
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
                tags=self.apply_tags("security-group", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # EC2 Security Group
            ec2_sg = aws.ec2.SecurityGroup(
                f"PROD-sg-ec2-{region}",
                name=f"PROD-sg-ec2-{region}",
                description="Security group for EC2 instances",
                vpc_id=networking[region]["vpc"].id,
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=80,
                        to_port=80,
                        security_groups=[alb_sg.id],
                        description="HTTP from ALB"
                    ),
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=22,
                        to_port=22,
                        cidr_blocks=["10.0.0.0/8"],
                        description="SSH from VPC"
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
                tags=self.apply_tags("security-group", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # RDS Security Group
            rds_sg = aws.ec2.SecurityGroup(
                f"PROD-sg-rds-{region}",
                name=f"PROD-sg-rds-{region}",
                description="Security group for RDS instances",
                vpc_id=networking[region]["vpc"].id,
                ingress=[
                    aws.ec2.SecurityGroupIngressArgs(
                        protocol="tcp",
                        from_port=5432,
                        to_port=5432,
                        security_groups=[ec2_sg.id],
                        description="PostgreSQL from EC2"
                    )
                ],
                egress=[],
                tags=self.apply_tags("security-group", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            region_compute["alb_sg"] = alb_sg
            region_compute["ec2_sg"] = ec2_sg
            region_compute["rds_sg"] = rds_sg
            
            # Get latest Amazon Linux 2 AMI
            ami = aws.ec2.get_ami(
                most_recent=True,
                owners=["amazon"],
                filters=[
                    aws.ec2.GetAmiFilterArgs(
                        name="name",
                        values=["amzn2-ami-hvm-*-x86_64-gp2"]
                    ),
                    aws.ec2.GetAmiFilterArgs(
                        name="virtualization-type",
                        values=["hvm"]
                    )
                ],
                opts=pulumi.InvokeOptions(provider=provider)
            )
            
            # Launch Template
            user_data = base64.b64encode("""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
""".encode()).decode()
            
            launch_template = aws.ec2.LaunchTemplate(
                f"PROD-lt-web-{region}",
                name=f"PROD-lt-web-{region}",
                image_id=ami.id,
                instance_type="t3.micro",
                key_name=None,  # No SSH key for security
                vpc_security_group_ids=[ec2_sg.id],
                iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                    name=security[region]["ec2_instance_profile"].name
                ),
                user_data=user_data,
                block_device_mappings=[
                    aws.ec2.LaunchTemplateBlockDeviceMappingArgs(
                        device_name="/dev/xvda",
                        ebs=aws.ec2.LaunchTemplateBlockDeviceMappingEbsArgs(
                            volume_size=20,
                            volume_type="gp3",
                            encrypted=True,
                            kms_key_id=security[region]["kms_key"].arn,
                            delete_on_termination=True
                        )
                    )
                ],
                metadata_options=aws.ec2.LaunchTemplateMetadataOptionsArgs(
                    http_endpoint="enabled",
                    http_tokens="required",
                    http_put_response_hop_limit=1
                ),
                tag_specifications=[
                    aws.ec2.LaunchTemplateTagSpecificationArgs(
                        resource_type="instance",
                        tags=self.apply_tags("ec2-instance", region)
                    )
                ],
                tags=self.apply_tags("launch-template", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Application Load Balancer
            alb = aws.lb.LoadBalancer(
                f"PROD-alb-web-{region}",
                name=f"PROD-alb-web-{region}",
                internal=False,
                load_balancer_type="application",
                security_groups=[alb_sg.id],
                subnets=[subnet.id for subnet in networking[region]["public_subnets"]],
                enable_deletion_protection=True,
                enable_http2=True,
                tags=self.apply_tags("alb", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Target Group
            target_group = aws.lb.TargetGroup(
                f"PROD-tg-web-{region}",
                name=f"PROD-tg-web-{region}",
                port=80,
                protocol="HTTP",
                protocol_version="HTTP1",
                vpc_id=networking[region]["vpc"].id,
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
                tags=self.apply_tags("target-group", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # ALB Listener (HTTP redirect to HTTPS)
            aws.lb.Listener(
                f"PROD-listener-http-{region}",
                load_balancer_arn=alb.arn,
                port="80",
                protocol="HTTP",
                default_actions=[
                    aws.lb.ListenerDefaultActionArgs(
                        type="redirect",
                        redirect=aws.lb.ListenerDefaultActionRedirectArgs(
                            port="443",
                            protocol="HTTPS",
                            status_code="HTTP_301"
                        )
                    )
                ],
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Auto Scaling Group
            asg = aws.autoscaling.Group(
                f"PROD-asg-web-{region}",
                name=f"PROD-asg-web-{region}",
                vpc_zone_identifiers=[subnet.id for subnet in networking[region]["private_subnets"]],
                target_group_arns=[target_group.arn],
                health_check_type="ELB",
                health_check_grace_period=300,
                min_size=2,
                max_size=6,
                desired_capacity=3,
                launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                    id=launch_template.id,
                    version="$Latest"
                ),
                tags=[
                    aws.autoscaling.GroupTagArgs(
                        key=k,
                        value=v,
                        propagate_at_launch=True
                    ) for k, v in self.apply_tags("asg", region).items()
                ],
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # Lambda function for automation
            lambda_function = aws.lambda_.Function(
                f"PROD-lambda-automation-{region}",
                name=f"PROD-lambda-automation-{region}",
                runtime="python3.9",
                code=pulumi.AssetArchive({
                    "index.py": pulumi.StringAsset("""
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Example automation task
    ec2 = boto3.client('ec2')
    
    return {
        'statusCode': 200,
        'body': json.dumps('Automation task completed successfully')
    }
""")
                }),
                handler="index.lambda_handler",
                role=security[region]["lambda_role"].arn,
                timeout=60,
                memory_size=128,
                vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                    subnet_ids=[subnet.id for subnet in networking[region]["private_subnets"]],
                    security_group_ids=[ec2_sg.id]
                ),
                environment=aws.lambda_.FunctionEnvironmentArgs(
                    variables={
                        "REGION": region,
                        "ENVIRONMENT": "PROD"
                    }
                ),
                tags=self.apply_tags("lambda", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            region_compute["launch_template"] = launch_template
            region_compute["alb"] = alb
            region_compute["target_group"] = target_group
            region_compute["asg"] = asg
            region_compute["lambda_function"] = lambda_function
            
            compute[region] = region_compute
        
        return compute
    
    def create_storage_resources(self, security: Dict) -> Dict:
        """
        Create S3 buckets, RDS instances, and DynamoDB tables with encryption.
        
        Args:
            security: Security resources dictionary
            
        Returns:
            Dict containing storage resources for each region
        """
        storage = {}
        
        for region in self.regions:
            provider = self.providers[region]
            region_storage = {}
            
            # S3 Bucket
            bucket = aws.s3.Bucket(
                f"PROD-s3-data-{region}",
                bucket=f"prod-data-{region}-{aws.get_caller_identity().account_id}",
                tags=self.apply_tags("s3-bucket", region),
                opts=pulumi.ResourceOptions(provider=provider)
            )
            
            # S3 Bucket Versioning
            aws.s3.BucketVersioningV2(
                f"PROD-s3-versioning-{region}",
                bucket=bucket.id,
                versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
                    status="Enabled"
                ),
                opts