"""
Multi-Environment Infrastructure with Pulumi Python
Manages dev, staging, and prod environments with consistent architecture
"""

import pulumi
import pulumi_aws as aws
from components.vpc import VpcComponent
from components.alb import AlbComponent
from components.asg import AsgComponent
from components.rds import RdsComponent
from components.s3 import S3Component

# Get current stack and configuration
stack = pulumi.get_stack()
config = pulumi.Config()

# Get configuration values from Pulumi.<stack>.yaml
environment = config.require("environment")
vpc_cidr = config.require("vpcCidr")
instance_type = config.require("instanceType")
asg_min_size = config.require_int("asgMinSize")
asg_max_size = config.require_int("asgMaxSize")
asg_desired_capacity = config.require_int("asgDesiredCapacity")
rds_instance_class = config.require("rdsInstanceClass")
rds_multi_az = config.get_bool("rdsMultiAz") or False
environment_suffix = config.require("environmentSuffix")

# Common tags for all resources
common_tags = {
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "Stack": stack,
}

# Create VPC with subnets, route tables, IGW, and NAT Gateway
vpc = VpcComponent(
    f"vpc-{environment}-{environment_suffix}",
    vpc_cidr=vpc_cidr,
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Create RDS MySQL instance with Secrets Manager password
rds = RdsComponent(
    f"rds-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.private_subnet_ids,
    environment=environment,
    environment_suffix=environment_suffix,
    instance_class=rds_instance_class,
    multi_az=rds_multi_az,
    tags=common_tags,
)

# Create Application Load Balancer
alb = AlbComponent(
    f"alb-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.public_subnet_ids,
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Get latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"],
        ),
        aws.ec2.GetAmiFilterArgs(
            name="virtualization-type",
            values=["hvm"],
        ),
    ],
)

# Create Auto Scaling Group with EC2 instances
asg = AsgComponent(
    f"asg-{environment}-{environment_suffix}",
    vpc_id=vpc.vpc_id,
    subnet_ids=vpc.private_subnet_ids,
    target_group_arn=alb.target_group_arn,
    environment=environment,
    environment_suffix=environment_suffix,
    instance_type=instance_type,
    ami_id=ami.id,
    min_size=asg_min_size,
    max_size=asg_max_size,
    desired_capacity=asg_desired_capacity,
    tags=common_tags,
)

# Create S3 bucket for static assets
s3_bucket = S3Component(
    f"s3-{environment}-{environment_suffix}",
    environment=environment,
    environment_suffix=environment_suffix,
    tags=common_tags,
)

# Export stack outputs for validation
pulumi.export("vpc_id", vpc.vpc_id)
pulumi.export("vpc_cidr", vpc_cidr)
pulumi.export("public_subnet_ids", vpc.public_subnet_ids)
pulumi.export("private_subnet_ids", vpc.private_subnet_ids)
pulumi.export("alb_dns_name", alb.alb_dns_name)
pulumi.export("alb_arn", alb.alb_arn)
pulumi.export("target_group_arn", alb.target_group_arn)
pulumi.export("asg_name", asg.asg_name)
pulumi.export("asg_arn", asg.asg_arn)
pulumi.export("rds_endpoint", rds.rds_endpoint)
pulumi.export("rds_arn", rds.rds_arn)
pulumi.export("rds_secret_arn", rds.secret_arn)
pulumi.export("s3_bucket_name", s3_bucket.bucket_name)
pulumi.export("s3_bucket_arn", s3_bucket.bucket_arn)
pulumi.export("environment", environment)
pulumi.export("stack", stack)
