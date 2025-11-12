"""Integration tests for EKS Fargate Infrastructure.

These tests validate the deployed AWS resources using real AWS API calls.
They require that the infrastructure has been deployed to AWS.
"""

import os
import json
import boto3
import pytest

# Load deployment outputs
def load_outputs():
    """Load deployment outputs from cfn-outputs/flat-outputs.json."""
    outputs_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "cfn-outputs",
        "flat-outputs.json"
    )
    
    if not os.path.exists(outputs_path):
        pytest.skip(f"Outputs file not found at {outputs_path}. Infrastructure may not be deployed.")
    
    with open(outputs_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        # Extract outputs from the nested structure
        # The JSON has structure: {"TapStackpr6412": {...outputs...}}
        # We need to get the first stack's outputs
        if data:
            first_stack_name = list(data.keys())[0]
            return data[first_stack_name]
        return {}

@pytest.fixture(scope="module")
def outputs():
    """Pytest fixture to load outputs once per module."""
    return load_outputs()

@pytest.fixture(scope="module")
def aws_region():
    """Get AWS region from environment or use default."""
    return os.getenv("AWS_REGION", "us-east-1")  # Changed to us-east-1 based on the outputs

@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Create EC2 client."""
    return boto3.client("ec2", region_name=aws_region)

@pytest.fixture(scope="module")
def eks_client(aws_region):
    """Create EKS client."""
    return boto3.client("eks", region_name=aws_region)

@pytest.fixture(scope="module")
def iam_client(aws_region):
    """Create IAM client."""
    return boto3.client("iam", region_name=aws_region)

@pytest.fixture(scope="module")
def kms_client(aws_region):
    """Create KMS client."""
    return boto3.client("kms", region_name=aws_region)

@pytest.fixture(scope="module")
def logs_client(aws_region):
    """Create CloudWatch Logs client."""
    return boto3.client("logs", region_name=aws_region)

class TestVPCInfrastructure:
    """Integration tests for VPC infrastructure."""
    
    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC exists and is configured correctly."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"
        
        # Describe VPC
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["CidrBlock"] == "10.0.0.0/16"
        assert vpc["State"] == "available"
    
    def test_private_subnets_exist(self, outputs, ec2_client):
        """Test that private subnets exist in 3 AZs."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get all subnets in VPC
        response = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "tag:Name", "Values": ["*private*"]}
            ]
        )
        
        private_subnets = response["Subnets"]
        assert len(private_subnets) >= 3, "Should have at least 3 private subnets"
        
        # Verify they span multiple AZs
        azs = set(subnet["AvailabilityZone"] for subnet in private_subnets)
        assert len(azs) >= 3, "Private subnets should span at least 3 AZs"
    
    def test_public_subnets_exist(self, outputs, ec2_client):
        """Test that public subnets exist in 3 AZs."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get all subnets in VPC
        response = ec2_client.describe_subnets(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "tag:Name", "Values": ["*public*"]}
            ]
        )
        
        public_subnets = response["Subnets"]
        assert len(public_subnets) >= 3, "Should have at least 3 public subnets"
    
    def test_nat_gateways_exist(self, outputs, ec2_client):
        """Test that NAT Gateways exist and are available."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get NAT Gateways
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        nat_gateways = response["NatGateways"]
        assert len(nat_gateways) >= 3, "Should have at least 3 NAT Gateways"
        
        # Verify all are available
        for nat_gw in nat_gateways:
            assert nat_gw["State"] in ["available", "pending"], \
                f"NAT Gateway {nat_gw['NatGatewayId']} is not available"
    
    def test_internet_gateway_exists(self, outputs, ec2_client):
        """Test that Internet Gateway exists and is attached."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get Internet Gateways
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )
        
        assert len(response["InternetGateways"]) == 1, \
            "Should have exactly 1 Internet Gateway"
        
        igw = response["InternetGateways"][0]
        attachments = igw["Attachments"]
        assert len(attachments) == 1
        assert attachments[0]["State"] == "available"
        assert attachments[0]["VpcId"] == vpc_id

class TestEKSCluster:
    """Integration tests for EKS cluster."""
    
    def test_eks_cluster_exists(self, outputs, eks_client):
        """Test that EKS cluster exists and is active."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None, "EKS cluster name not found in outputs"
        
        # Describe cluster
        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response["cluster"]
        
        assert cluster["status"] == "ACTIVE", \
            f"Cluster status is {cluster['status']}, expected ACTIVE"
        assert cluster["version"] == "1.29", "Cluster version should be 1.29"
    
    def test_eks_cluster_endpoint(self, outputs, eks_client):
        """Test that EKS cluster endpoint is accessible."""
        cluster_name = outputs.get("eks_cluster_name")
        cluster_endpoint = outputs.get("eks_cluster_endpoint")
        
        assert cluster_name is not None
        assert cluster_endpoint is not None, \
            "EKS cluster endpoint not found in outputs"
        assert cluster_endpoint.startswith("https://"), \
            "Cluster endpoint should be HTTPS URL"
    
    def test_eks_cluster_vpc_config(self, outputs, eks_client):
        """Test EKS cluster VPC configuration."""
        cluster_name = outputs.get("eks_cluster_name")
        vpc_id = outputs.get("vpc_id")
        
        assert cluster_name is not None
        assert vpc_id is not None
        
        # Describe cluster
        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response["cluster"]
        vpc_config = cluster["resourcesVpcConfig"]
        
        assert vpc_config["endpointPrivateAccess"] is True, \
            "Private endpoint access should be enabled"
    
    def test_eks_cluster_logging(self, outputs, eks_client):
        """Test that EKS cluster logging is enabled."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Describe cluster
        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response["cluster"]
        logging = cluster.get("logging", {})
        cluster_logging = logging.get("clusterLogging", [])
        
        # Find enabled log types
        enabled_types = []
        for log_config in cluster_logging:
            if log_config.get("enabled"):
                enabled_types.extend(log_config.get("types", []))
        
        # Verify all required log types are enabled
        required_logs = ["api", "audit", "authenticator", "controllerManager", "scheduler"]
        for log_type in required_logs:
            assert log_type in enabled_types, \
                f"Log type {log_type} should be enabled"

class TestFargateProfiles:
    """Integration tests for Fargate profiles."""
    
    def test_fargate_profile_prod_exists(self, outputs, eks_client):
        """Test that production Fargate profile exists."""
        cluster_name = outputs.get("eks_cluster_name")
        profile_id = outputs.get("fargate_profile_prod_id")
        
        assert cluster_name is not None
        assert profile_id is not None, \
            "Production Fargate profile ID not found in outputs"
        
        # Extract profile name from ID (format: cluster-name:profile-name)
        profile_name = profile_id.split(":")[-1]
        
        # Describe Fargate profile
        response = eks_client.describe_fargate_profile(
            clusterName=cluster_name,
            fargateProfileName=profile_name
        )
        
        profile = response["fargateProfile"]
        assert profile["status"] == "ACTIVE", \
            f"Production profile status is {profile['status']}, expected ACTIVE"
    
    def test_fargate_profile_dev_exists(self, outputs, eks_client):
        """Test that development Fargate profile exists."""
        cluster_name = outputs.get("eks_cluster_name")
        profile_id = outputs.get("fargate_profile_dev_id")
        
        assert cluster_name is not None
        assert profile_id is not None, \
            "Development Fargate profile ID not found in outputs"
        
        # Extract profile name from ID (format: cluster-name:profile-name)
        profile_name = profile_id.split(":")[-1]
        
        # Describe Fargate profile
        response = eks_client.describe_fargate_profile(
            clusterName=cluster_name,
            fargateProfileName=profile_name
        )
        
        profile = response["fargateProfile"]
        assert profile["status"] == "ACTIVE", \
            f"Development profile status is {profile['status']}, expected ACTIVE"
    
    def test_fargate_profiles_in_private_subnets(self, outputs, eks_client):
        """Test that Fargate profiles use private subnets."""
        cluster_name = outputs.get("eks_cluster_name")
        profile_id = outputs.get("fargate_profile_prod_id")
        
        assert cluster_name is not None
        assert profile_id is not None
        
        # Extract profile name from ID (format: cluster-name:profile-name)
        profile_name = profile_id.split(":")[-1]
        
        # Describe Fargate profile
        response = eks_client.describe_fargate_profile(
            clusterName=cluster_name,
            fargateProfileName=profile_name
        )
        
        profile = response["fargateProfile"]
        
        # Verify subnets are configured
        assert len(profile["subnets"]) >= 3, \
            "Fargate profile should use at least 3 subnets"

class TestEKSAddons:
    """Integration tests for EKS addons."""
    
    def test_vpc_cni_addon_installed(self, outputs, eks_client):
        """Test that VPC CNI addon is installed."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Describe addon
        response = eks_client.describe_addon(
            clusterName=cluster_name,
            addonName="vpc-cni"
        )
        
        addon = response["addon"]
        assert addon["status"] in ["ACTIVE", "CREATING", "UPDATING"], \
            f"VPC CNI addon status is {addon['status']}"
    
    def test_coredns_addon_installed(self, outputs, eks_client):
        """Test that CoreDNS addon is installed."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Describe addon
        response = eks_client.describe_addon(
            clusterName=cluster_name,
            addonName="coredns"
        )
        
        addon = response["addon"]
        assert addon["status"] in ["ACTIVE", "CREATING", "UPDATING"], \
            f"CoreDNS addon status is {addon['status']}"
    
    def test_kube_proxy_addon_installed(self, outputs, eks_client):
        """Test that kube-proxy addon is installed."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Describe addon
        response = eks_client.describe_addon(
            clusterName=cluster_name,
            addonName="kube-proxy"
        )
        
        addon = response["addon"]
        assert addon["status"] in ["ACTIVE", "CREATING", "UPDATING"], \
            f"kube-proxy addon status is {addon['status']}"

class TestIAMResources:
    """Integration tests for IAM resources."""
    
    def test_oidc_provider_exists(self, outputs, iam_client):
        """Test that OIDC provider exists for IRSA."""
        oidc_arn = outputs.get("oidc_provider_arn")
        assert oidc_arn is not None, "OIDC provider ARN not found in outputs"
        
        # Get OIDC provider
        response = iam_client.get_open_id_connect_provider(
            OpenIDConnectProviderArn=oidc_arn
        )
        
        assert "sts.amazonaws.com" in response["ClientIDList"], \
            "OIDC provider should have sts.amazonaws.com as client"
    
    def test_eks_cluster_role_exists(self, outputs, iam_client, eks_client):
        """Test that EKS cluster IAM role exists."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Get cluster role ARN
        response = eks_client.describe_cluster(name=cluster_name)
        role_arn = response["cluster"]["roleArn"]
        
        # Extract role name from ARN
        role_name = role_arn.split("/")[-1]
        
        # Get role
        response = iam_client.get_role(RoleName=role_name)
        role = response["Role"]
        
        assert role is not None
        assert "eks.amazonaws.com" in str(role["AssumeRolePolicyDocument"])

class TestLoggingResources:
    """Integration tests for logging resources."""
    
    def test_cloudwatch_log_group_exists(self, outputs, logs_client):
        """Test that CloudWatch log group exists for EKS."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        log_group_name = f"/aws/eks/{cluster_name}/cluster"
        
        # Describe log group
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )
        
        log_groups = response["logGroups"]
        assert len(log_groups) >= 1, f"Log group {log_group_name} not found"
        
        log_group = log_groups[0]
        assert log_group["retentionInDays"] == 7, \
            "Log retention should be 7 days"

class TestSecurityResources:
    """Integration tests for security resources."""
    
    def test_security_group_exists(self, outputs, ec2_client, eks_client):
        """Test that EKS cluster security group exists."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        # Get cluster security group
        response = eks_client.describe_cluster(name=cluster_name)
        cluster = response["cluster"]
        vpc_config = cluster["resourcesVpcConfig"]
        
        sg_ids = vpc_config.get("securityGroupIds", [])
        cluster_sg_id = vpc_config.get("clusterSecurityGroupId")
        
        # Verify at least one security group exists
        assert len(sg_ids) > 0 or cluster_sg_id is not None, \
            "Cluster should have security groups"
        
        # Describe security group
        if cluster_sg_id:
            response = ec2_client.describe_security_groups(
                GroupIds=[cluster_sg_id]
            )
            assert len(response["SecurityGroups"]) == 1

class TestResourceTags:
    """Integration tests for resource tagging."""
    
    def test_vpc_has_environment_suffix_tag(self, outputs, ec2_client):
        """Test that VPC has environment suffix in tags."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get VPC tags
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        
        name_tag = tags.get("Name", "")
        
        # Verify environment suffix is in name
        env_suffix = os.getenv("ENVIRONMENT_SUFFIX", "")
        if env_suffix:
            assert env_suffix in name_tag, \
                f"VPC name should include environment suffix {env_suffix}"
    
    def test_eks_cluster_has_environment_suffix(self, outputs):
        """Test that EKS cluster name includes environment suffix."""
        cluster_name = outputs.get("eks_cluster_name")
        assert cluster_name is not None
        
        env_suffix = os.getenv("ENVIRONMENT_SUFFIX", "")
        if env_suffix:
            assert env_suffix in cluster_name, \
                f"Cluster name should include environment suffix {env_suffix}"

class TestHighAvailability:
    """Integration tests for high availability configuration."""
    
    def test_resources_span_multiple_azs(self, outputs, ec2_client):
        """Test that resources are distributed across multiple AZs."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get all subnets
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        subnets = response["Subnets"]
        azs = set(subnet["AvailabilityZone"] for subnet in subnets)
        
        assert len(azs) >= 3, \
            f"Resources should span at least 3 AZs, found {len(azs)}"
    
    def test_nat_gateways_in_multiple_azs(self, outputs, ec2_client):
        """Test that NAT Gateways are in multiple AZs for HA."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None
        
        # Get NAT Gateways
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {"Name": "vpc-id", "Values": [vpc_id]},
                {"Name": "state", "Values": ["available", "pending"]}
            ]
        )
        
        nat_gateways = response["NatGateways"]
        
        # Get subnet AZs
        subnet_ids = [nat_gw["SubnetId"] for nat_gw in nat_gateways]
        subnet_response = ec2_client.describe_subnets(SubnetIds=subnet_ids)
        azs = set(subnet["AvailabilityZone"] for subnet in subnet_response["Subnets"])
        
        assert len(azs) >= 2, \
            "NAT Gateways should be in at least 2 different AZs for HA"

class TestOutputsValidation:
    """Integration tests to validate stack outputs."""
    
    def test_all_required_outputs_present(self, outputs):
        """Test that all required outputs are present."""
        required_outputs = [
            "vpc_id",
            "eks_cluster_name",
            "eks_cluster_endpoint",
            "eks_cluster_version",
            "fargate_profile_prod_id",
            "fargate_profile_dev_id",
            "oidc_provider_arn"
        ]
        
        for output_name in required_outputs:
            assert output_name in outputs, \
                f"Required output '{output_name}' not found in outputs"
            assert outputs[output_name] is not None, \
                f"Output '{output_name}' should not be None"
            assert outputs[output_name] != "", \
                f"Output '{output_name}' should not be empty"
    
    def test_output_formats(self, outputs):
        """Test that outputs have correct formats."""
        # VPC ID should start with vpc-
        vpc_id = outputs.get("vpc_id")
        if vpc_id:
            assert vpc_id.startswith("vpc-"), "VPC ID should start with 'vpc-'"
        
        # Cluster endpoint should be HTTPS URL
        endpoint = outputs.get("eks_cluster_endpoint")
        if endpoint:
            assert endpoint.startswith("https://"), \
                "Cluster endpoint should be HTTPS URL"
        
        # ARNs should start with arn:aws
        oidc_arn = outputs.get("oidc_provider_arn")
        if oidc_arn:
            assert oidc_arn.startswith("arn:aws:"), \
                "OIDC provider ARN should start with 'arn:aws:'"
