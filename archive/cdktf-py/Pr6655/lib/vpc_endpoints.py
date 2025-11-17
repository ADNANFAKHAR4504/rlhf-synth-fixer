"""VPC endpoints for private AWS service access."""
from cdktf import TerraformOutput
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
from constructs import Construct


class VpcEndpointsStack(Construct):
    """Creates VPC endpoints for private access to AWS services."""

    def __init__(
        self,
        scope: Construct,
        id: str,
        environment_suffix: str,
        vpc_id: str,
        subnet_ids: list,
        security_group_id: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)

        self.environment_suffix = environment_suffix
        self.vpc_id = vpc_id
        self.subnet_ids = subnet_ids
        self.security_group_id = security_group_id

        # S3 Gateway endpoint
        self.s3_endpoint = VpcEndpoint(
            self,
            "s3_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.s3",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"s3-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # DynamoDB Gateway endpoint
        self.dynamodb_endpoint = VpcEndpoint(
            self,
            "dynamodb_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.dynamodb",
            vpc_endpoint_type="Gateway",
            tags={
                "Name": f"dynamodb-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # EC2 Interface endpoint
        self.ec2_endpoint = VpcEndpoint(
            self,
            "ec2_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ec2",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ec2-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Systems Manager Interface endpoint
        self.ssm_endpoint = VpcEndpoint(
            self,
            "ssm_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ssm",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ssm-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # SSM Messages endpoint (required for Session Manager)
        self.ssm_messages_endpoint = VpcEndpoint(
            self,
            "ssm_messages_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ssmmessages",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ssm-messages-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # EC2 Messages endpoint
        self.ec2_messages_endpoint = VpcEndpoint(
            self,
            "ec2_messages_endpoint",
            vpc_id=self.vpc_id,
            service_name="com.amazonaws.us-east-1.ec2messages",
            vpc_endpoint_type="Interface",
            subnet_ids=self.subnet_ids,
            security_group_ids=[self.security_group_id],
            private_dns_enabled=True,
            tags={
                "Name": f"ec2-messages-endpoint-{self.environment_suffix}",
                "CostCenter": "payment-processing",
                "DataClassification": "confidential",
                "ComplianceScope": "pci-dss-level-1"
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "s3_endpoint_id",
            value=self.s3_endpoint.id,
            description="S3 VPC endpoint ID"
        )

        TerraformOutput(
            self,
            "ec2_endpoint_dns",
            value=self.ec2_endpoint.dns_entry,
            description="EC2 VPC endpoint DNS entries"
        )

        TerraformOutput(
            self,
            "ssm_endpoint_dns",
            value=self.ssm_endpoint.dns_entry,
            description="SSM VPC endpoint DNS entries"
        )
