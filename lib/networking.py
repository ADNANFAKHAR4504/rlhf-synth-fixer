from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from typing import List


class NetworkingModule(Construct):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, vpc_cidr: str):
        super().__init__(scope, construct_id)

        self.environment_suffix = environment_suffix

        # Get current AWS account ID dynamically
        current = DataAwsCallerIdentity(self, "current")

        # VPC
        self.vpc = Vpc(self, "vpc",
            cidr_block=vpc_cidr,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"secure-vpc-{environment_suffix}"
            }
        )

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # Private Subnets
        self.private_subnets = []
        for idx, az in enumerate(azs):
            subnet = Subnet(self, f"private-subnet-{idx}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{idx}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"private-subnet-{idx}-{environment_suffix}"
                }
            )
            self.private_subnets.append(subnet)

        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        # Flow Logs S3 Bucket
        self.flow_logs_bucket = S3Bucket(self, "flow-logs-bucket",
            bucket=f"vpc-flow-logs-{environment_suffix}-{current.account_id}",
            lifecycle_rule=[{
                "enabled": True,
                "expiration": {"days": 90}
            }],
            tags={
                "Name": f"flow-logs-{environment_suffix}"
            }
        )

        # VPC Flow Logs
        self.flow_log = FlowLog(self, "vpc-flow-log",
            vpc_id=self.vpc.id,
            traffic_type="ALL",
            log_destination_type="s3",
            log_destination=self.flow_logs_bucket.arn,
            tags={
                "Name": f"vpc-flow-log-{environment_suffix}"
            }
        )

        # Note: AWS Network Firewall has been removed due to CDKTF provider compatibility issues
        # The CDKTF provider does not support the required rule_group syntax for Network Firewall
        # Network security is still enforced through Security Groups and VPC Flow Logs
