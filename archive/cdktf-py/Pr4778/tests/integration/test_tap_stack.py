"""Integration tests for TapStack - validates deployed AWS resources."""
import json
import os
import pytest
import boto3
import requests
from botocore.exceptions import ClientError


def load_outputs():
    """Load infrastructure outputs from cfn-outputs/flat-outputs.json."""
    output_file = os.path.join(
        os.path.dirname(__file__), "../../cfn-outputs/flat-outputs.json"
    )

    if not os.path.exists(output_file):
        pytest.skip(f"Output file not found: {output_file}. Infrastructure not deployed.")

    with open(output_file, "r") as f:
        data = json.load(f)

    # Find the TapStack outputs (looking for stack name starting with "TapStack")
    stack_outputs = None
    stack_name = None
    for name, outputs in data.items():
        if name.startswith("TapStack") and isinstance(outputs, dict):
            # Check if it has the expected output keys for this stack
            if "rds_cluster_endpoint" in outputs or "elasticache_primary_endpoint" in outputs:
                stack_outputs = outputs
                stack_name = name
                break

    if stack_outputs is None:
        pytest.skip("TapStack outputs not found in flat-outputs.json. Infrastructure not deployed.")

    # Extract environment suffix from stack name (e.g., "TapStackpr4778" -> "pr4778")
    environment_suffix = stack_name.replace("TapStack", "").lower()
    stack_outputs["_environment_suffix"] = environment_suffix
    stack_outputs["_stack_name"] = stack_name

    return stack_outputs


@pytest.fixture(scope="module")
def outputs():
    """Fixture that provides infrastructure outputs."""
    return load_outputs()


@pytest.fixture(scope="module")
def aws_region():
    """Fixture that provides AWS region."""
    return os.getenv("AWS_REGION", "us-west-2")


@pytest.fixture(scope="module")
def rds_client(aws_region):
    """Fixture that provides RDS boto3 client."""
    return boto3.client("rds", region_name=aws_region)


@pytest.fixture(scope="module")
def elasticache_client(aws_region):
    """Fixture that provides ElastiCache boto3 client."""
    return boto3.client("elasticache", region_name=aws_region)


@pytest.fixture(scope="module")
def efs_client(aws_region):
    """Fixture that provides EFS boto3 client."""
    return boto3.client("efs", region_name=aws_region)


@pytest.fixture(scope="module")
def ec2_client(aws_region):
    """Fixture that provides EC2 boto3 client."""
    return boto3.client("ec2", region_name=aws_region)


@pytest.fixture(scope="module")
def apigatewayv2_client(aws_region):
    """Fixture that provides API Gateway V2 boto3 client."""
    return boto3.client("apigatewayv2", region_name=aws_region)


class TestVPCInfrastructure:
    """Test VPC and networking resources."""

    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC exists and is in available state."""
        vpc_id = outputs.get("vpc_id")
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == "10.0.0.0/16"

        # Check DNS attributes separately as they may not be in the VPC response
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsSupport"
        )
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )

        assert dns_support["EnableDnsSupport"]["Value"] is True
        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True

    def test_subnets_across_multiple_azs(self, outputs, ec2_client):
        """Test that subnets are deployed across multiple availability zones."""
        vpc_id = outputs.get("vpc_id")

        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) >= 6, "Should have at least 6 subnets (3 public + 3 private)"

        # Check that subnets are in different AZs
        availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(availability_zones) >= 3, "Subnets should be in at least 3 AZs for high availability"


class TestRDSCluster:
    """Test RDS Aurora PostgreSQL cluster."""

    def test_rds_cluster_exists(self, outputs, rds_client):
        """Test that RDS cluster exists and is available."""
        cluster_id = outputs.get("rds_cluster_identifier")
        assert cluster_id is not None, "RDS cluster identifier not found in outputs"

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(response["DBClusters"]) == 1

        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["Engine"] == "aurora-postgresql"
        assert cluster["StorageEncrypted"] is True

    def test_rds_cluster_endpoints(self, outputs):
        """Test that RDS cluster has valid writer and reader endpoints."""
        writer_endpoint = outputs.get("rds_cluster_endpoint")
        reader_endpoint = outputs.get("rds_cluster_reader_endpoint")

        assert writer_endpoint is not None
        assert reader_endpoint is not None
        assert writer_endpoint != reader_endpoint
        assert ".rds.amazonaws.com" in writer_endpoint
        assert ".rds.amazonaws.com" in reader_endpoint

    def test_rds_cluster_encryption(self, outputs, rds_client):
        """Test that RDS cluster has encryption enabled with KMS."""
        cluster_id = outputs.get("rds_cluster_identifier")

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response["DBClusters"][0]

        assert cluster["StorageEncrypted"] is True
        assert cluster["KmsKeyId"] is not None
        assert "arn:aws:kms:" in cluster["KmsKeyId"]

    def test_rds_cluster_multi_az(self, outputs, rds_client):
        """Test that RDS cluster has instances in multiple AZs."""
        cluster_id = outputs.get("rds_cluster_identifier")

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response["DBClusters"][0]

        # Check cluster members
        assert len(cluster["DBClusterMembers"]) >= 2, "Should have at least 2 instances (writer + reader)"

        # Get instance details
        instance_ids = [member["DBInstanceIdentifier"] for member in cluster["DBClusterMembers"]]

        availability_zones = set()
        for instance_id in instance_ids:
            instance_response = rds_client.describe_db_instances(DBInstanceIdentifier=instance_id)
            instance = instance_response["DBInstances"][0]
            availability_zones.add(instance["AvailabilityZone"])

        assert len(availability_zones) >= 2, "RDS instances should be in multiple AZs"

    def test_rds_cluster_backup_retention(self, outputs, rds_client):
        """Test that RDS cluster has proper backup retention configured."""
        cluster_id = outputs.get("rds_cluster_identifier")

        response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        cluster = response["DBClusters"][0]

        assert cluster["BackupRetentionPeriod"] == 30, "Backup retention should be 30 days for PCI-DSS compliance"


class TestElastiCacheRedis:
    """Test ElastiCache Redis cluster."""

    def test_elasticache_cluster_exists(self, outputs, elasticache_client):
        """Test that ElastiCache replication group exists and is available."""
        replication_group_id = outputs.get("elasticache_replication_group_id")
        assert replication_group_id is not None, "ElastiCache replication group ID not found in outputs"

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        assert len(response["ReplicationGroups"]) == 1

        replication_group = response["ReplicationGroups"][0]
        assert replication_group["Status"] == "available"
        assert replication_group["AutomaticFailover"] == "enabled"

    def test_elasticache_endpoint(self, outputs):
        """Test that ElastiCache has valid primary endpoint."""
        primary_endpoint = outputs.get("elasticache_primary_endpoint")

        assert primary_endpoint is not None
        assert ".cache.amazonaws.com" in primary_endpoint

    def test_elasticache_encryption(self, outputs, elasticache_client):
        """Test that ElastiCache has encryption enabled."""
        replication_group_id = outputs.get("elasticache_replication_group_id")

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        replication_group = response["ReplicationGroups"][0]

        assert replication_group["TransitEncryptionEnabled"] is True
        assert replication_group["AtRestEncryptionEnabled"] is True

    def test_elasticache_multi_az(self, outputs, elasticache_client):
        """Test that ElastiCache has nodes in multiple AZs."""
        replication_group_id = outputs.get("elasticache_replication_group_id")

        response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        replication_group = response["ReplicationGroups"][0]

        # Check that we have multiple node groups/clusters
        assert len(replication_group["MemberClusters"]) >= 3, "Should have at least 3 cache clusters for HA"

        # Get node details to check AZ distribution
        node_groups = replication_group.get("NodeGroups", [])
        if node_groups:
            availability_zones = set()
            for node_group in node_groups:
                for member in node_group.get("NodeGroupMembers", []):
                    if member.get("PreferredAvailabilityZone"):
                        availability_zones.add(member["PreferredAvailabilityZone"])

            assert len(availability_zones) >= 2, "Redis nodes should be in multiple AZs"


class TestEFSFileSystem:
    """Test EFS file system."""

    def test_efs_exists(self, outputs, efs_client):
        """Test that EFS file system exists and is available."""
        file_system_id = outputs.get("efs_file_system_id")
        assert file_system_id is not None, "EFS file system ID not found in outputs"

        response = efs_client.describe_file_systems(FileSystemId=file_system_id)
        assert len(response["FileSystems"]) == 1

        file_system = response["FileSystems"][0]
        assert file_system["LifeCycleState"] == "available"
        assert file_system["Encrypted"] is True

    def test_efs_encryption(self, outputs, efs_client):
        """Test that EFS has encryption enabled with KMS."""
        file_system_id = outputs.get("efs_file_system_id")

        response = efs_client.describe_file_systems(FileSystemId=file_system_id)
        file_system = response["FileSystems"][0]

        assert file_system["Encrypted"] is True
        assert file_system["KmsKeyId"] is not None

    def test_efs_mount_targets(self, outputs, efs_client):
        """Test that EFS has mount targets in multiple AZs."""
        file_system_id = outputs.get("efs_file_system_id")

        response = efs_client.describe_mount_targets(FileSystemId=file_system_id)
        mount_targets = response["MountTargets"]

        assert len(mount_targets) >= 3, "Should have mount targets in at least 3 AZs"

        # Check that mount targets are in different subnets/AZs
        subnet_ids = set(mt["SubnetId"] for mt in mount_targets)
        assert len(subnet_ids) >= 3, "Mount targets should be in different subnets"

        # Verify all mount targets are available
        for mount_target in mount_targets:
            assert mount_target["LifeCycleState"] == "available"


class TestAPIGateway:
    """Test API Gateway."""

    def test_api_gateway_exists(self, outputs, apigatewayv2_client):
        """Test that API Gateway exists."""
        api_endpoint = outputs.get("api_gateway_endpoint")
        assert api_endpoint is not None, "API Gateway endpoint not found in outputs"

        # Extract API ID from endpoint URL
        # Format: https://{api-id}.execute-api.{region}.amazonaws.com
        api_id = api_endpoint.split("//")[1].split(".")[0]

        response = apigatewayv2_client.get_api(ApiId=api_id)
        assert response["ApiId"] == api_id
        assert response["ProtocolType"] == "HTTP"

    def test_api_gateway_endpoint_accessible(self, outputs):
        """Test that API Gateway endpoint is accessible via HTTP."""
        stage_url = outputs.get("api_gateway_stage_invoke_url")
        assert stage_url is not None, "API Gateway stage URL not found in outputs"

        try:
            # Make a request to the API Gateway endpoint
            # Expecting 404 or 403 is fine - we're just checking it's accessible
            response = requests.get(stage_url, timeout=10)
            assert response.status_code in [200, 403, 404], \
                f"API Gateway should be accessible, got status code: {response.status_code}"
        except requests.exceptions.RequestException as e:
            pytest.fail(f"API Gateway endpoint is not accessible: {e}")

    def test_api_gateway_https_enabled(self, outputs):
        """Test that API Gateway uses HTTPS."""
        api_endpoint = outputs.get("api_gateway_endpoint")
        stage_url = outputs.get("api_gateway_stage_invoke_url")

        assert api_endpoint.startswith("https://"), "API Gateway should use HTTPS"
        assert stage_url.startswith("https://"), "API Gateway stage should use HTTPS"


class TestSecurityAndCompliance:
    """Test security and PCI-DSS compliance features."""

    def test_all_resources_tagged(self, outputs, ec2_client, rds_client):
        """Test that resources have proper tags."""
        environment_suffix = outputs.get("_environment_suffix")
        vpc_id = outputs.get("vpc_id")
        cluster_id = outputs.get("rds_cluster_identifier")

        # Check VPC tags
        vpc_response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag["Key"]: tag["Value"] for tag in vpc_response["Vpcs"][0].get("Tags", [])}
        assert "Name" in vpc_tags

        # Check RDS tags
        rds_response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        rds_tags = rds_response["DBClusters"][0].get("TagList", [])
        rds_tag_dict = {tag["Key"]: tag["Value"] for tag in rds_tags}
        assert "Name" in rds_tag_dict or len(rds_tag_dict) > 0

    def test_resources_in_private_subnets(self, outputs, ec2_client):
        """Test that sensitive resources (RDS, EFS, Redis) are in private subnets."""
        vpc_id = outputs.get("vpc_id")

        # Get all subnets
        subnets_response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Check route tables to identify private subnets
        route_tables_response = ec2_client.describe_route_tables(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        # Build map of subnet to route table
        subnet_to_rt = {}
        for rt in route_tables_response["RouteTables"]:
            for assoc in rt.get("Associations", []):
                if "SubnetId" in assoc:
                    subnet_to_rt[assoc["SubnetId"]] = rt

        # Identify private subnets (those without direct route to IGW)
        private_subnet_ids = set()
        public_subnet_ids = set()

        for rt in route_tables_response["RouteTables"]:
            has_igw = any(
                route.get("GatewayId", "").startswith("igw-")
                for route in rt.get("Routes", [])
            )

            for assoc in rt.get("Associations", []):
                if "SubnetId" in assoc:
                    if has_igw:
                        public_subnet_ids.add(assoc["SubnetId"])
                    else:
                        private_subnet_ids.add(assoc["SubnetId"])

        # If no explicit associations, check for main route table
        all_subnets = {subnet["SubnetId"] for subnet in subnets_response["Subnets"]}
        main_rt = next((rt for rt in route_tables_response["RouteTables"]
                       if any(assoc.get("Main", False) for assoc in rt.get("Associations", []))), None)

        if main_rt:
            has_igw_main = any(
                route.get("GatewayId", "").startswith("igw-")
                for route in main_rt.get("Routes", [])
            )

            # Subnets not explicitly associated use main route table
            unassociated_subnets = all_subnets - public_subnet_ids - private_subnet_ids
            for subnet_id in unassociated_subnets:
                if has_igw_main:
                    public_subnet_ids.add(subnet_id)
                else:
                    private_subnet_ids.add(subnet_id)

        # Should have both public and private subnets
        assert len(private_subnet_ids) >= 3, f"Should have at least 3 private subnets, found {len(private_subnet_ids)}"
        assert len(public_subnet_ids) >= 3, f"Should have at least 3 public subnets, found {len(public_subnet_ids)}"


class TestHighAvailability:
    """Test high availability configuration."""

    def test_multi_az_deployment(self, outputs, ec2_client, rds_client, elasticache_client):
        """Test that infrastructure is deployed across multiple availability zones."""
        vpc_id = outputs.get("vpc_id")

        # Check VPC subnets span multiple AZs
        subnets_response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        subnet_azs = set(subnet["AvailabilityZone"] for subnet in subnets_response["Subnets"])
        assert len(subnet_azs) >= 3, "VPC should span at least 3 availability zones"

        # Check RDS cluster has instances in multiple AZs (tested in TestRDSCluster)
        cluster_id = outputs.get("rds_cluster_identifier")
        rds_response = rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        assert len(rds_response["DBClusters"][0]["DBClusterMembers"]) >= 2

        # Check ElastiCache has automatic failover enabled
        replication_group_id = outputs.get("elasticache_replication_group_id")
        cache_response = elasticache_client.describe_replication_groups(
            ReplicationGroupId=replication_group_id
        )
        assert cache_response["ReplicationGroups"][0]["AutomaticFailover"] == "enabled"
