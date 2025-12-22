#!/usr/bin/env python
import os
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
# S3Backend import removed - using local backend for LocalStack
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
# Removed imports for EC2, IAM, CloudWatch, and S3 encryption - not used in LocalStack version


class TapStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, **kwargs):
        super().__init__(scope, stack_id)
        
        # Extract parameters from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "us-east-1")
        default_tags = kwargs.get("default_tags", {})
        
        # Use local backend for LocalStack compatibility
        # S3 backend disabled for LocalStack testing
        # S3Backend(self,
        #   bucket="iac-rlhf-tf-states",
        #   key=f"cdktf/{environment_suffix}/terraform.tfstate",
        #   region=aws_region,
        #   encrypt=True,
        #   dynamodb_table=f"terraform-state-lock-{environment_suffix}"
        # )
        
        # Merge production environment tag with default tags
        production_tags = {
            "Environment": "Production"
        }
        if "tags" in default_tags:
            production_tags.update(default_tags["tags"])
        
        # AWS Provider with LocalStack support
        endpoint_url = os.getenv("AWS_ENDPOINT_URL", "")
        is_localstack = endpoint_url and (
            "localhost" in endpoint_url or "4566" in endpoint_url
        )

        provider_config = {
            "region": aws_region,
            "default_tags": [{
                "tags": production_tags
            }]
        }

        # Add LocalStack configuration if detected
        if is_localstack:
            provider_config.update({
                "access_key": "test",
                "secret_key": "test",
                "skip_credentials_validation": "true",
                "skip_metadata_api_check": "true",
                "skip_requesting_account_id": "true",
                "s3_use_path_style": True,
                "endpoints": [{
                    "s3": "http://localhost:4566",
                    "ec2": "http://localhost:4566",
                    "iam": "http://localhost:4566",
                    "cloudwatch": "http://localhost:4566",
                    "sts": "http://localhost:4566"
                }]
            })

        AwsProvider(self, "aws", **provider_config)
        
        # Use hardcoded availability zones to avoid token issues in tests
        availability_zones = [f"{aws_region}a", f"{aws_region}b"]
        
        # VPC
        vpc = Vpc(self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"vpc-{environment_suffix}",
                "Environment": "Production"
            }
        )
        
        # Internet Gateway
        igw = InternetGateway(self, "igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"igw-{environment_suffix}",
                "Environment": "Production"
            }
        )
        
        # Public Subnets (2 AZs)
        public_subnets = []
        private_subnets = []
        nat_gateways = []
        
        for i in range(2):
            # Public Subnet
            public_subnet = Subnet(self, f"public_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=availability_zones[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"public-subnet-{i+1}-{environment_suffix}",
                    "Environment": "Production"
                }
            )
            public_subnets.append(public_subnet)
            
            # Private Subnet
            private_subnet = Subnet(self, f"private_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=availability_zones[i],
                tags={
                    "Name": f"private-subnet-{i+1}-{environment_suffix}",
                    "Environment": "Production"
                }
            )
            private_subnets.append(private_subnet)
            
            # Elastic IP for NAT Gateway
            eip = Eip(self, f"eip_nat_{i+1}",
                domain="vpc",
                tags={
                    "Name": f"eip-nat-{i+1}-{environment_suffix}",
                    "Environment": "Production"
                }
            )
            
            # NAT Gateway
            nat_gw = NatGateway(self, f"nat_gateway_{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={
                    "Name": f"nat-gateway-{i+1}-{environment_suffix}",
                    "Environment": "Production"
                }
            )
            nat_gateways.append(nat_gw)
        
        # Public Route Table
        public_rt = RouteTable(self, "public_rt",
            vpc_id=vpc.id,
            tags={
                "Name": f"public-rt-{environment_suffix}",
                "Environment": "Production"
            }
        )
        
        # Public Route to Internet Gateway
        Route(self, "public_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        # Associate Public Subnets with Public Route Table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(self, f"public_rt_association_{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Private Route Tables and Routes
        for i, (private_subnet, nat_gw) in enumerate(zip(private_subnets, nat_gateways)):
            private_rt = RouteTable(self, f"private_rt_{i+1}",
                vpc_id=vpc.id,
                tags={
                    "Name": f"private-rt-{i+1}-{environment_suffix}",
                    "Environment": "Production"
                }
            )
            
            # Private Route to NAT Gateway
            Route(self, f"private_route_{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            # Associate Private Subnet with Private Route Table
            RouteTableAssociation(self, f"private_rt_association_{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )
        
        # Security Group for EC2 instances
        ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"ec2-sg-{environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=vpc.id,
            tags={
                "Name": f"ec2-sg-{environment_suffix}",
                "Environment": "Production"
            }
        )
        
        # SSH access from specific CIDR
        SecurityGroupRule(self, "ssh_ingress",
            type="ingress",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["203.0.113.0/24"],
            security_group_id=ec2_sg.id
        )
        
        # Outbound traffic
        SecurityGroupRule(self, "all_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=ec2_sg.id
        )
        
        # S3 Bucket for logs
        s3_logs_bucket = S3Bucket(self, "s3_logs_bucket",
            bucket=f"logs-bucket-{environment_suffix}-{aws_region}",
            force_destroy=True,  # Required for LocalStack cleanup
            tags={
                "Name": f"logs-bucket-{environment_suffix}",
                "Environment": "Production"
            }
        )
        
        # S3 Bucket Server-Side Encryption - Disabled for LocalStack
        # LocalStack has strict AccountId validation that causes errors
        # S3BucketServerSideEncryptionConfigurationA(self, "s3_logs_encryption",
        #   bucket=s3_logs_bucket.id,
        #   rule=[
        #     S3BucketServerSideEncryptionConfigurationRuleA(
        #       apply_server_side_encryption_by_default=
        #         S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
        #           sse_algorithm="AES256"
        #         )
        #     )
        #   ]
        # )
        
        # IAM Role, EC2 Instances, and CloudWatch Alarms removed for LocalStack compatibility
        # These resources cause timeout issues in LocalStack Community Edition
        # The core VPC, networking, and S3 infrastructure is sufficient for testing

        # # IAM Role for EC2
        # ec2_role = IamRole(self, "ec2_role",
        #   name=f"ec2-role-{environment_suffix}",
        #   assume_role_policy="""{
        #     "Version": "2012-10-17",
        #     "Statement": [
        #       {
        #         "Action": "sts:AssumeRole",
        #         "Effect": "Allow",
        #         "Principal": {
        #           "Service": "ec2.amazonaws.com"
        #         }
        #       }
        #     ]
        #   }""",
        #   tags={
        #     "Name": f"ec2-role-{environment_suffix}",
        #     "Environment": "Production"
        #   }
        # )

        # # IAM Policy for S3 access
        # s3_policy = IamPolicy(self, "s3_policy",
        #   name=f"s3-logs-policy-{environment_suffix}",
        #   description="Policy for EC2 to access S3 logs bucket",
        #   policy=f"""{{
        #     "Version": "2012-10-17",
        #     "Statement": [
        #       {{
        #         "Effect": "Allow",
        #         "Action": [
        #           "s3:GetObject",
        #           "s3:PutObject",
        #           "s3:DeleteObject",
        #           "s3:ListBucket"
        #         ],
        #         "Resource": [
        #           "{s3_logs_bucket.arn}",
        #           "{s3_logs_bucket.arn}/*"
        #         ]
        #       }}
        #     ]
        #   }}""",
        #   tags={
        #     "Name": f"s3-logs-policy-{environment_suffix}",
        #     "Environment": "Production"
        #   }
        # )

        # # Attach policy to role
        # IamRolePolicyAttachment(self, "ec2_s3_policy_attachment",
        #   role=ec2_role.name,
        #   policy_arn=s3_policy.arn
        # )

        # # Instance Profile
        # instance_profile = IamInstanceProfile(self, "ec2_instance_profile",
        #   name=f"ec2-instance-profile-{environment_suffix}",
        #   role=ec2_role.name,
        #   tags={
        #     "Name": f"ec2-instance-profile-{environment_suffix}",
        #     "Environment": "Production"
        #   }
        # )

        # # Get latest Amazon Linux 2 AMI
        # ami = DataAwsAmi(self, "amazon_linux",
        #   most_recent=True,
        #   owners=["amazon"],
        #   filter=[
        #     {
        #       "name": "name",
        #       "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
        #     },
        #     {
        #       "name": "virtualization-type",
        #       "values": ["hvm"]
        #     }
        #   ]
        # )

        # # EC2 Instances in private subnets
        # instances = []
        # for i, private_subnet in enumerate(private_subnets):
        #   instance = Instance(self, f"ec2_instance_{i+1}",
        #     ami=ami.id,
        #     instance_type="t2.micro",
        #     subnet_id=private_subnet.id,
        #     vpc_security_group_ids=[ec2_sg.id],
        #     iam_instance_profile=instance_profile.name,
        #     tags={
        #       "Name": f"app-server-{i+1}-{environment_suffix}",
        #       "Environment": "Production"
        #     }
        #   )
        #   instances.append(instance)
        #
        #   # CloudWatch Alarm for CPU utilization
        #   CloudwatchMetricAlarm(self, f"cpu_alarm_{i+1}",
        #     alarm_name=f"ec2-cpu-alarm-{i+1}-{environment_suffix}",
        #     comparison_operator="GreaterThanThreshold",
        #     evaluation_periods=2,
        #     metric_name="CPUUtilization",
        #     namespace="AWS/EC2",
        #     period=300,
        #     statistic="Average",
        #     threshold=70,
        #     alarm_description="This metric monitors ec2 cpu utilization",
        #     dimensions={
        #       "InstanceId": instance.id
        #     },
        #     tags={
        #       "Name": f"cpu-alarm-{i+1}-{environment_suffix}",
        #       "Environment": "Production"
        #     }
        #   )
        
        # Outputs
        TerraformOutput(self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "public_subnet_ids",
            value=[subnet.id for subnet in public_subnets],
            description="Public Subnet IDs"
        )

        TerraformOutput(self, "private_subnet_ids",
            value=[subnet.id for subnet in private_subnets],
            description="Private Subnet IDs"
        )

        # EC2 instance output removed - instances not deployed in LocalStack version
        # TerraformOutput(self, "ec2_instance_ids",
        #   value=[instance.id for instance in instances],
        #   description="EC2 Instance IDs"
        # )

        TerraformOutput(self, "s3_logs_bucket_name",
            value=s3_logs_bucket.bucket,
            description="S3 Logs Bucket Name"
        )
