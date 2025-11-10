"""
Payment Processing Infrastructure Migration
Three-tier architecture using Pulumi with Python
"""

import pulumi
import pulumi_aws as aws
import json

# Get configuration values
config = pulumi.Config()
environment_suffix = config.require("environmentSuffix")
instance_type = config.get("instanceType") or "t3.medium"
db_instance_class = config.get("dbInstanceClass") or "db.t3.medium"
db_username = config.require("dbUsername")
# Use environment variable if available, otherwise generate based on suffix
import os
env_password = os.environ.get("TF_VAR_db_password")
if env_password:
    db_password = env_password
else:
    # Generate password based on environment suffix
    db_password = f"DbPass-{environment_suffix}-2024!"
environment_name = config.get("environmentName") or "production"

# Common tags for all resources
common_tags = {
    "Environment": environment_name,
    "CostCenter": "payment-processing",
    "MigrationPhase": "phase-1",
    "ManagedBy": "pulumi"
}

# Create VPC
vpc = aws.ec2.Vpc(
    f"payment-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"payment-vpc-{environment_suffix}"}
)

# Get availability zones
azs = aws.get_availability_zones(state="available")

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-igw-{environment_suffix}"}
)

# Create public subnets in 2 AZs
public_subnet_1 = aws.ec2.Subnet(
    f"payment-public-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"payment-public-subnet-1-{environment_suffix}", "Type": "public"}
)

public_subnet_2 = aws.ec2.Subnet(
    f"payment-public-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"payment-public-subnet-2-{environment_suffix}", "Type": "public"}
)

# Create private subnets in 2 AZs
private_subnet_1 = aws.ec2.Subnet(
    f"payment-private-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.11.0/24",
    availability_zone=azs.names[0],
    tags={**common_tags, "Name": f"payment-private-subnet-1-{environment_suffix}", "Type": "private"}
)

private_subnet_2 = aws.ec2.Subnet(
    f"payment-private-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.12.0/24",
    availability_zone=azs.names[1],
    tags={**common_tags, "Name": f"payment-private-subnet-2-{environment_suffix}", "Type": "private"}
)

# Create Elastic IPs for NAT Gateways
eip_1 = aws.ec2.Eip(
    f"payment-eip-1-{environment_suffix}",
    domain="vpc",
    tags={**common_tags, "Name": f"payment-eip-1-{environment_suffix}"}
)

# Create NAT Gateway in first public subnet
nat_gateway = aws.ec2.NatGateway(
    f"payment-nat-{environment_suffix}",
    allocation_id=eip_1.id,
    subnet_id=public_subnet_1.id,
    tags={**common_tags, "Name": f"payment-nat-{environment_suffix}"}
)

# Create public route table
public_route_table = aws.ec2.RouteTable(
    f"payment-public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-public-rt-{environment_suffix}"}
)

# Create route to Internet Gateway
public_route = aws.ec2.Route(
    f"payment-public-route-{environment_suffix}",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id
)

# Associate public subnets with public route table
public_rta_1 = aws.ec2.RouteTableAssociation(
    f"payment-public-rta-1-{environment_suffix}",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id
)

public_rta_2 = aws.ec2.RouteTableAssociation(
    f"payment-public-rta-2-{environment_suffix}",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id
)

# Create private route table
private_route_table = aws.ec2.RouteTable(
    f"payment-private-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-private-rt-{environment_suffix}"}
)

# Create route to NAT Gateway
private_route = aws.ec2.Route(
    f"payment-private-route-{environment_suffix}",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id
)

# Associate private subnets with private route table
private_rta_1 = aws.ec2.RouteTableAssociation(
    f"payment-private-rta-1-{environment_suffix}",
    subnet_id=private_subnet_1.id,
    route_table_id=private_route_table.id
)

private_rta_2 = aws.ec2.RouteTableAssociation(
    f"payment-private-rta-2-{environment_suffix}",
    subnet_id=private_subnet_2.id,
    route_table_id=private_route_table.id
)

# Create KMS key for RDS encryption
kms_key = aws.kms.Key(
    f"payment-rds-kms-{environment_suffix}",
    description=f"KMS key for RDS encryption - {environment_suffix}",
    deletion_window_in_days=10,
    enable_key_rotation=True,
    tags={**common_tags, "Name": f"payment-rds-kms-{environment_suffix}"}
)

kms_alias = aws.kms.Alias(
    f"payment-rds-kms-alias-{environment_suffix}",
    target_key_id=kms_key.id,
    name=f"alias/payment-rds-{environment_suffix}"
)

# Create Security Group for ALB
alb_sg = aws.ec2.SecurityGroup(
    f"payment-alb-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for Application Load Balancer",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTP from Internet"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound"
        )
    ],
    tags={**common_tags, "Name": f"payment-alb-sg-{environment_suffix}"}
)

# Create Security Group for EC2 instances
ec2_sg = aws.ec2.SecurityGroup(
    f"payment-ec2-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for EC2 instances",
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound"
        )
    ],
    tags={**common_tags, "Name": f"payment-ec2-sg-{environment_suffix}"}
)

# Add ingress rule to allow HTTP from ALB to EC2
ec2_sg_ingress = aws.ec2.SecurityGroupRule(
    f"payment-ec2-sg-ingress-{environment_suffix}",
    type="ingress",
    security_group_id=ec2_sg.id,
    source_security_group_id=alb_sg.id,
    protocol="tcp",
    from_port=80,
    to_port=80,
    description="HTTP from ALB"
)

# Create Security Group for RDS
rds_sg = aws.ec2.SecurityGroup(
    f"payment-rds-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for RDS MySQL instance",
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound"
        )
    ],
    tags={**common_tags, "Name": f"payment-rds-sg-{environment_suffix}"}
)

# Add ingress rule to allow MySQL from EC2 to RDS
rds_sg_ingress = aws.ec2.SecurityGroupRule(
    f"payment-rds-sg-ingress-{environment_suffix}",
    type="ingress",
    security_group_id=rds_sg.id,
    source_security_group_id=ec2_sg.id,
    protocol="tcp",
    from_port=3306,
    to_port=3306,
    description="MySQL from EC2"
)

# Create S3 bucket for application logs
logs_bucket = aws.s3.Bucket(
    f"payment-logs-{environment_suffix}",
    bucket=f"payment-logs-{environment_suffix}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    server_side_encryption_configuration=(
        aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            )
        )
    ),
    tags={**common_tags, "Name": f"payment-logs-{environment_suffix}"}
)

# Block public access for logs bucket
logs_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"payment-logs-public-access-block-{environment_suffix}",
    bucket=logs_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Create S3 bucket for static content
static_bucket = aws.s3.Bucket(
    f"payment-static-{environment_suffix}",
    bucket=f"payment-static-{environment_suffix}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True
    ),
    server_side_encryption_configuration=(
        aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256"
                    )
                )
            )
        )
    ),
    tags={**common_tags, "Name": f"payment-static-{environment_suffix}"}
)

# Block public access for static bucket
static_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"payment-static-public-access-block-{environment_suffix}",
    bucket=static_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Create IAM role for EC2 instances
ec2_role = aws.iam.Role(
    f"payment-ec2-role-{environment_suffix}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={**common_tags, "Name": f"payment-ec2-role-{environment_suffix}"}
)

# Create IAM policy for S3 access
s3_policy = aws.iam.Policy(
    f"payment-s3-policy-{environment_suffix}",
    policy=pulumi.Output.all(logs_bucket.arn, static_bucket.arn).apply(
        lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": [
                        f"{arns[0]}/*",
                        f"{arns[1]}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        arns[0],
                        arns[1]
                    ]
                }
            ]
        })
    ),
    tags={**common_tags, "Name": f"payment-s3-policy-{environment_suffix}"}
)

# Attach policy to role
role_policy_attachment = aws.iam.RolePolicyAttachment(
    f"payment-role-policy-attachment-{environment_suffix}",
    role=ec2_role.name,
    policy_arn=s3_policy.arn
)

# Create instance profile
instance_profile = aws.iam.InstanceProfile(
    f"payment-instance-profile-{environment_suffix}",
    role=ec2_role.name,
    tags={**common_tags, "Name": f"payment-instance-profile-{environment_suffix}"}
)

# Get latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"]
        )
    ]
)

# Create Launch Template
user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Processing System - Migration</h1>" > /var/www/html/index.html
"""

launch_template = aws.ec2.LaunchTemplate(
    f"payment-launch-template-{environment_suffix}",
    name_prefix=f"payment-lt-{environment_suffix}-",
    image_id=ami.id,
    instance_type=instance_type,
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        arn=instance_profile.arn
    ),
    vpc_security_group_ids=[ec2_sg.id],
    user_data=pulumi.Output.from_input(user_data).apply(
        lambda ud: __import__('base64').b64encode(ud.encode()).decode()
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={**common_tags, "Name": f"payment-instance-{environment_suffix}"}
        )
    ],
    tags={**common_tags, "Name": f"payment-launch-template-{environment_suffix}"}
)

# Create Target Group
target_group = aws.lb.TargetGroup(
    f"payment-tg-{environment_suffix}",
    name=f"payment-tg-{environment_suffix}"[:32],
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/",
        protocol="HTTP",
        matcher="200",
        interval=30,
        timeout=5,
        healthy_threshold=2,
        unhealthy_threshold=2
    ),
    tags={**common_tags, "Name": f"payment-tg-{environment_suffix}"}
)

# Create Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"payment-alb-{environment_suffix}",
    name=f"payment-alb-{environment_suffix}"[:32],
    load_balancer_type="application",
    subnets=[public_subnet_1.id, public_subnet_2.id],
    security_groups=[alb_sg.id],
    tags={**common_tags, "Name": f"payment-alb-{environment_suffix}"}
)

# Create HTTP Listener (for testing - in production use HTTPS with validated certificate)
http_listener = aws.lb.Listener(
    f"payment-http-listener-{environment_suffix}",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ]
)

# Note: ACM certificate commented out for testing
# For production deployment, uncomment and configure with real domain:
# certificate = aws.acm.Certificate(
#     f"payment-cert-{environment_suffix}",
#     domain_name=f"payment-{environment_suffix}.example.com",
#     validation_method="DNS",
#     tags={**common_tags, "Name": f"payment-cert-{environment_suffix}"}
# )
#
# https_listener = aws.lb.Listener(
#     f"payment-https-listener-{environment_suffix}",
#     load_balancer_arn=alb.arn,
#     port=443,
#     protocol="HTTPS",
#     ssl_policy="ELBSecurityPolicy-TLS-1-2-2017-01",
#     certificate_arn=certificate.arn,
#     default_actions=[
#         aws.lb.ListenerDefaultActionArgs(
#             type="forward",
#             target_group_arn=target_group.arn
#         )
#     ]
# )

# Create Auto Scaling Group
asg = aws.autoscaling.Group(
    f"payment-asg-{environment_suffix}",
    name=f"payment-asg-{environment_suffix}",
    min_size=2,
    max_size=6,
    desired_capacity=2,
    vpc_zone_identifiers=[private_subnet_1.id, private_subnet_2.id],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest"
    ),
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"payment-asg-instance-{environment_suffix}",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="Environment",
            value=environment_name,
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="CostCenter",
            value="payment-processing",
            propagate_at_launch=True
        ),
        aws.autoscaling.GroupTagArgs(
            key="MigrationPhase",
            value="phase-1",
            propagate_at_launch=True
        )
    ]
)

# Create DB Subnet Group
db_subnet_group = aws.rds.SubnetGroup(
    f"payment-db-subnet-group-{environment_suffix}",
    name=f"payment-db-subnet-{environment_suffix}",
    subnet_ids=[private_subnet_1.id, private_subnet_2.id],
    tags={**common_tags, "Name": f"payment-db-subnet-group-{environment_suffix}"}
)

# Create RDS MySQL instance with Multi-AZ
rds_instance = aws.rds.Instance(
    f"payment-rds-{environment_suffix}",
    identifier=f"payment-rds-{environment_suffix}",
    engine="mysql",
    engine_version="8.0",
    instance_class=db_instance_class,
    allocated_storage=20,
    storage_type="gp3",
    storage_encrypted=True,
    kms_key_id=kms_key.arn,
    db_name="paymentdb",
    username=db_username,
    password=db_password,
    multi_az=False,  # Changed to False for faster deployment testing
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[rds_sg.id],
    backup_retention_period=7,
    backup_window="03:00-04:00",
    maintenance_window="mon:04:00-mon:05:00",
    skip_final_snapshot=True,
    deletion_protection=False,
    enabled_cloudwatch_logs_exports=["error", "general", "slowquery"],
    tags={**common_tags, "Name": f"payment-rds-{environment_suffix}"}
)

# Export stack outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_arn", alb.arn)
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("rds_address", rds_instance.address)
pulumi.export("logs_bucket_name", logs_bucket.id)
pulumi.export("static_bucket_name", static_bucket.id)
pulumi.export("asg_name", asg.name)
pulumi.export("target_group_arn", target_group.arn)
