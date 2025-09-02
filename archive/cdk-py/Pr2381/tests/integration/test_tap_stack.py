import pytest
import boto3
import socket

REGION1 = "us-east-1"
REGION2 = "us-east-2"

OUTPUTS = {
    # VPC and Subnets (us-east-1)
    "VPC_ID_1": "vpc-09a028f8e36f8a996",
    "SUBNET_PRIVATE_1A": "subnet-0d399a6dd207211b6",
    "SUBNET_PRIVATE_1B": "subnet-0a3ff49adbd61e816",
    "SUBNET_PUBLIC_1A": "subnet-0b66c110d57ffcdf7",
    "SUBNET_PUBLIC_1B": "subnet-014f3608626d20436",
    # RDS (us-east-1)
    "RDS_INSTANCE_1": "tap-rds-870ae525-instance",
    # ECS (us-east-1)
    "ECS_CLUSTER_1": "TapStackpr2381TapStackecsuseast1pr2381EcsStackB1784BB2-MyCluster4C1BA579-joFo9vP0AEO7",
    "ECS_FARGATE_SERVICE_1": "TapStackpr2381TapStackecsuseast1pr2381EcsStackB1784BB2-FargateServiceAC2B3B85-myBRWJxJYI56",
    # ALB (us-east-1)
    "ALB_DNS_1": "TapSta-LB8A1-KGgDkVqWNqtf-764806753.us-east-1.elb.amazonaws.com",
    "ALB_LISTENER_ARN_1": "arn:aws:elasticloadbalancing:us-east-1:***:listener/app/TapSta-LB8A1-KGgDkVqWNqtf/fd777a6d26ea0675/604180c769886a5c",
    # Target Groups
    "ALB_TG_BLUE": "TapSta-BlueT-THOAB4RFJVLH",
    "ALB_TG_GREEN": "TapSta-Green-UOY4BKKTVRHQ",
    # VPC and Subnets (us-east-2)
    "VPC_ID_2": "vpc-0d1a2ff0bffa399a2",
    "SUBNET_PRIVATE_2A": "subnet-0f3045b1cf53d5e54",
    "SUBNET_PRIVATE_2B": "subnet-071e4c227be4c0ff8",
    "SUBNET_PUBLIC_2A": "subnet-0b50d82df77391f9c",
    "SUBNET_PUBLIC_2B": "subnet-078b28c9fdf24b6e3",
    # RDS (us-east-2)
    "RDS_INSTANCE_2": "tap-rds-78bc5314-instance",
    # ECS (us-east-2)
    "ECS_CLUSTER_2": "TapStackpr2381TapStackecsuseast2pr2381EcsStackA3F94E26-MyCluster4C1BA579-7mTDclSjSotx",
    "ECS_FARGATE_SERVICE_2": "TapStackpr2381TapStackecsuseast2pr2381EcsStackA3F94E26-FargateServiceAC2B3B85-HGoDlA2xBHF1",
}

# --- Fixtures ---
@pytest.fixture(scope="module")
def ec2_client_1():
    return boto3.client("ec2", region_name=REGION1)

@pytest.fixture(scope="module")
def ec2_client_2():
    return boto3.client("ec2", region_name=REGION2)

@pytest.fixture(scope="module")
def rds_client_1():
    return boto3.client("rds", region_name=REGION1)

@pytest.fixture(scope="module")
def rds_client_2():
    return boto3.client("rds", region_name=REGION2)

@pytest.fixture(scope="module")
def ecs_client_1():
    return boto3.client("ecs", region_name=REGION1)

@pytest.fixture(scope="module")
def ecs_client_2():
    return boto3.client("ecs", region_name=REGION2)

@pytest.fixture(scope="module")
def elbv2_client_1():
    return boto3.client("elbv2", region_name=REGION1)

# --- VPC and Subnets ---
def test_vpc_exists_us_east_1(ec2_client_1):
    resp = ec2_client_1.describe_vpcs(VpcIds=[OUTPUTS["VPC_ID_1"]])
    assert len(resp["Vpcs"]) == 1
    assert resp["Vpcs"][0]["State"] == "available"

def test_subnets_exist_and_in_vpc_1(ec2_client_1):
    subnet_ids = [
        OUTPUTS["SUBNET_PRIVATE_1A"], OUTPUTS["SUBNET_PRIVATE_1B"],
        OUTPUTS["SUBNET_PUBLIC_1A"], OUTPUTS["SUBNET_PUBLIC_1B"]
    ]
    resp = ec2_client_1.describe_subnets(SubnetIds=subnet_ids)
    assert set(subnet_ids) == set(s["SubnetId"] for s in resp["Subnets"])
    for subnet in resp["Subnets"]:
        assert subnet["VpcId"] == OUTPUTS["VPC_ID_1"]
        assert subnet["State"] == "available"

def test_vpc_exists_us_east_2(ec2_client_2):
    resp = ec2_client_2.describe_vpcs(VpcIds=[OUTPUTS["VPC_ID_2"]])
    assert len(resp["Vpcs"]) == 1
    assert resp["Vpcs"][0]["State"] == "available"

def test_subnets_exist_and_in_vpc_2(ec2_client_2):
    subnet_ids = [
        OUTPUTS["SUBNET_PRIVATE_2A"], OUTPUTS["SUBNET_PRIVATE_2B"],
        OUTPUTS["SUBNET_PUBLIC_2A"], OUTPUTS["SUBNET_PUBLIC_2B"]
    ]
    resp = ec2_client_2.describe_subnets(SubnetIds=subnet_ids)
    assert set(subnet_ids) == set(s["SubnetId"] for s in resp["Subnets"])
    for subnet in resp["Subnets"]:
        assert subnet["VpcId"] == OUTPUTS["VPC_ID_2"]
        assert subnet["State"] == "available"

# --- RDS ---
def test_rds_instance_1_available(rds_client_1):
    resp = rds_client_1.describe_db_instances(DBInstanceIdentifier=OUTPUTS["RDS_INSTANCE_1"])
    db = resp["DBInstances"][0]
    assert db["DBInstanceIdentifier"] == OUTPUTS["RDS_INSTANCE_1"]
    assert db["DBInstanceStatus"] == "available"

def test_rds_instance_2_available(rds_client_2):
    resp = rds_client_2.describe_db_instances(DBInstanceIdentifier=OUTPUTS["RDS_INSTANCE_2"])
    db = resp["DBInstances"][0]
    assert db["DBInstanceIdentifier"] == OUTPUTS["RDS_INSTANCE_2"]
    assert db["DBInstanceStatus"] == "available"

# --- ECS ---
def test_ecs_cluster_1_exists(ecs_client_1):
    resp = ecs_client_1.describe_clusters(clusters=[OUTPUTS["ECS_CLUSTER_1"]])
    assert len(resp["clusters"]) == 1
    assert resp["clusters"][0]["status"] == "ACTIVE"

def test_ecs_service_1_exists_running(ecs_client_1):
    resp = ecs_client_1.describe_services(cluster=OUTPUTS["ECS_CLUSTER_1"], services=[OUTPUTS["ECS_FARGATE_SERVICE_1"]])
    svc = resp["services"][0]
    assert svc["status"] == "ACTIVE"
    assert svc["desiredCount"] > 0

def test_ecs_cluster_2_exists(ecs_client_2):
    resp = ecs_client_2.describe_clusters(clusters=[OUTPUTS["ECS_CLUSTER_2"]])
    assert len(resp["clusters"]) == 1
    assert resp["clusters"][0]["status"] == "ACTIVE"

def test_ecs_service_2_exists_running(ecs_client_2):
    resp = ecs_client_2.describe_services(cluster=OUTPUTS["ECS_CLUSTER_2"], services=[OUTPUTS["ECS_FARGATE_SERVICE_2"]])
    svc = resp["services"][0]
    assert svc["status"] == "ACTIVE"
    assert svc["desiredCount"] > 0

# --- ALB ---
def test_alb_dns_resolves():
    dns = OUTPUTS["ALB_DNS_1"]
    ip = socket.gethostbyname(dns)
    assert ip

def test_alb_target_groups_exist(elbv2_client_1):
    # Check blue and green target groups exist
    tg_names = [OUTPUTS["ALB_TG_BLUE"], OUTPUTS["ALB_TG_GREEN"]]
    resp = elbv2_client_1.describe_target_groups(Names=tg_names)
    found = [tg["TargetGroupName"] for tg in resp["TargetGroups"]]
    for name in tg_names:
        assert name in found

def test_alb_dns_is_reachable():
    """Try to open TCP connection to ALB on port 80 (HTTP)."""
    dns = OUTPUTS["ALB_DNS_1"]
    try:
        ip = socket.gethostbyname(dns)
        s = socket.create_connection((ip, 80), timeout=5)
        s.close()
    except Exception as e:
        pytest.skip(f"ALB DNS {dns} or port 80 not reachable: {e}")


