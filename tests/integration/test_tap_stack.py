"""
test_tap_stack.py

Integration tests for live deployed TapStack Pulumi infrastructure.
These tests use boto3 to query AWS APIs and verify that the live resources
created by the TapStack match the Pulumi stack outputs.

IMPORTANT: These tests require that the Pulumi stack has already been deployed
and AWS credentials are available in the environment.
"""
# pylint: disable=redefined-outer-name

import json
import subprocess

import boto3
import pytest
from botocore.exceptions import ClientError

# -----------------------------
# CONFIG — Update for your setup
# -----------------------------
PULUMI_PROJECT = "TapStack"  # Your Pulumi project name
# Your Pulumi stack name/environment (matches your deployment)
PULUMI_STACK = "TapStackpr1135"
AWS_REGION = "us-west-2"  # Deployment region for TapStack


# -----------------------------
# FIXTURES
# -----------------------------


@pytest.fixture(scope="session")
def pulumi_outputs():
  """
  Fetch all Pulumi stack outputs as a Python dictionary.
  Uses the Pulumi CLI `pulumi stack output --json` command.
  """
  try:
    cmd = ["pulumi", "stack", "output", "--json", "--stack", f"{PULUMI_STACK}"]
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    outputs = json.loads(result.stdout)
    return outputs
  except FileNotFoundError:
    pytest.fail(
        "Pulumi CLI not found. Please ensure it is installed and in PATH."
    )
    return None
  except subprocess.CalledProcessError as e:
    pytest.fail(
        f"Pulumi CLI command failed: {e.stderr}. Ensure stack is deployed."
    )
    return None
  except json.JSONDecodeError:
    pytest.fail("Could not parse JSON output from Pulumi CLI.")
    return None


@pytest.fixture(scope="session")
def aws_clients():
  """
  Returns boto3 clients for AWS services in our deployment region.
  """
  return {
      "ec2": boto3.client("ec2", region_name=AWS_REGION),
      "rds": boto3.client("rds", region_name=AWS_REGION),
      "eks": boto3.client("eks", region_name=AWS_REGION),
      "elbv2": boto3.client("elbv2", region_name=AWS_REGION),
      "lambda": boto3.client("lambda", region_name=AWS_REGION),
      "codepipeline": boto3.client("codepipeline", region_name=AWS_REGION),
      "kms": boto3.client("kms", region_name=AWS_REGION),
      "ssm": boto3.client("ssm", region_name=AWS_REGION),
  }


# -----------------------------
# TESTS
# -----------------------------


def test_stack_basic_metadata(pulumi_outputs):
  """
  Verify that basic stack metadata like VPC ID and subnets are present in outputs.
  """
  # Check for outputs that match your actual TapStack exports
  required_outputs = [
      "vpc_id",
      "vpc_cidr",
      "availability_zones",
      "public_subnet_ids",
      "private_subnet_ids",
      "rds_instance_id",
      "rds_endpoint",
      "kms_key_id",
      "eks_cluster_name",
      "eks_cluster_endpoint",
      "eks_node_group_name",
      "alb_dns_name",
      "alb_target_group_arn",
      "codepipeline_name",
      "health_lambda_name",
      "health_lambda_arn",
  ]

  for output_key in required_outputs:
    assert output_key in pulumi_outputs, f"Missing expected stack output: {output_key}"

  # Verify outputs have reasonable values
  assert pulumi_outputs["vpc_id"].startswith(
      "vpc-"), f"Invalid VPC ID format: {pulumi_outputs['vpc_id']}"
  assert pulumi_outputs["vpc_cidr"] == "10.0.0.0/16", f"Unexpected VPC CIDR: {
      pulumi_outputs['vpc_cidr']}"
  assert len(pulumi_outputs["public_subnet_ids"]
             ) >= 2, "Should have at least 2 public subnets"
  assert len(pulumi_outputs["private_subnet_ids"]
             ) >= 2, "Should have at least 2 private subnets"
  assert len(pulumi_outputs["availability_zones"]
             ) >= 2, "Should have at least 2 availability zones"


def test_vpc_exists(pulumi_outputs, aws_clients):
  """
  Confirm that the provisioned VPC actually exists in AWS.
  """
  vpc_id = pulumi_outputs["vpc_id"]
  try:
    resp = aws_clients["ec2"].describe_vpcs(VpcIds=[vpc_id])
    assert resp["Vpcs"], f"VPC {vpc_id} does not exist."

    vpc = resp["Vpcs"][0]
    assert vpc["State"] == "available", f"VPC {vpc_id} is not available, state: {
        vpc['State']}"
    assert vpc["CidrBlock"] == "10.0.0.0/16", f"VPC CIDR mismatch: expected 10.0.0.0/16, got {
        vpc['CidrBlock']}"

    # Verify DNS support and hostnames are enabled
    assert vpc["EnableDnsSupport"] is True, "VPC should have DNS support enabled"
    assert vpc["EnableDnsHostnames"] is True, "VPC should have DNS hostnames enabled"

  except ClientError as e:
    pytest.fail(f"Failed to describe VPC {vpc_id}: {e}")


def test_rds_instance_exists_and_available(pulumi_outputs, aws_clients):
  """
  Verify the RDS instance exists and is in 'available' status.
  """
  rds_id = pulumi_outputs["rds_instance_id"]
  try:
    resp = aws_clients["rds"].describe_db_instances(
        DBInstanceIdentifier=rds_id)
    assert resp["DBInstances"], f"RDS {rds_id} not found."

    db_instance = resp["DBInstances"][0]
    status = db_instance["DBInstanceStatus"]
    assert status == "available", f"RDS instance {rds_id} not available, status={status}"

    # Verify RDS configuration matches your stack
    assert db_instance["Engine"] == "postgres", f"Expected PostgreSQL, got {
        db_instance['Engine']}"
    assert db_instance["EngineVersion"].startswith("15."), f"Expected PostgreSQL 15.x, got {
        db_instance['EngineVersion']}"
    assert db_instance["DBInstanceClass"] == "db.t3.medium", f"Unexpected instance class: {
        db_instance['DBInstanceClass']}"
    assert db_instance["StorageEncrypted"] is True, "RDS storage should be encrypted"
    assert db_instance["MultiAZ"] is True, "RDS should be Multi-AZ"
    assert db_instance["PubliclyAccessible"] is False, "RDS should not be publicly accessible"
    assert db_instance["MasterUsername"] == "adminuser", f"Unexpected master username: {
        db_instance['MasterUsername']}"

    # Verify RDS is in the correct VPC
    vpc_id = pulumi_outputs["vpc_id"]
    db_subnet_group = db_instance["DBSubnetGroup"]
    assert db_subnet_group["VpcId"] == vpc_id, f"RDS should be in VPC {vpc_id}, but is in {
        db_subnet_group['VpcId']}"

  except ClientError as e:
    pytest.fail(f"Failed to describe RDS instance {rds_id}: {e}")


def test_eks_cluster_exists(pulumi_outputs, aws_clients):
  """
  Verify EKS cluster exists and is active.
  """
  cluster_name = pulumi_outputs["eks_cluster_name"]
  try:
    resp = aws_clients["eks"].describe_cluster(name=cluster_name)
    assert resp["cluster"], f"EKS Cluster {cluster_name} not found."

    cluster = resp["cluster"]
    status = cluster["status"]
    assert status == "ACTIVE", f"EKS cluster {cluster_name} not active, status={status}"

    # Verify cluster configuration
    vpc_config = cluster["resourcesVpcConfig"]
    assert vpc_config["endpointPublicAccess"] is True, \
        "EKS cluster should have public endpoint access"
    assert vpc_config["endpointPrivateAccess"] is True, \
        "EKS cluster should have private endpoint access"

    # Verify cluster is in the correct VPC and subnets
    assert vpc_config["vpcId"] == pulumi_outputs["vpc_id"], \
        "EKS cluster should be in the correct VPC"
    cluster_subnets = set(vpc_config["subnetIds"])
    expected_subnets = set(pulumi_outputs["private_subnet_ids"])
    assert cluster_subnets.issubset(
        expected_subnets), "EKS cluster subnets should be from private subnets"

  except ClientError as e:
    pytest.fail(f"Failed to describe EKS cluster {cluster_name}: {e}")


def test_eks_node_group_exists(pulumi_outputs, aws_clients):
  """
  Verify the EKS node group exists and is active.
  """
  cluster_name = pulumi_outputs["eks_cluster_name"]
  node_group_name = pulumi_outputs["eks_node_group_name"]

  try:
    resp = aws_clients["eks"].describe_nodegroup(
        clusterName=cluster_name,
        nodegroupName=node_group_name
    )

    assert resp["nodegroup"], f"EKS node group {node_group_name} not found."

    nodegroup = resp["nodegroup"]
    status = nodegroup["status"]
    assert status == "ACTIVE", f"EKS node group {node_group_name} not active, status={status}"

    # Verify node group configuration
    assert nodegroup["instanceTypes"] == [
        "t3.medium"], f"Unexpected instance types: {nodegroup['instanceTypes']}"

    scaling_config = nodegroup["scalingConfig"]
    assert scaling_config["minSize"] == 1, f"Unexpected min size: {
        scaling_config['minSize']}"
    assert scaling_config["maxSize"] == 3, f"Unexpected max size: {
        scaling_config['maxSize']}"
    assert scaling_config["desiredSize"] == 2, f"Unexpected desired size: {
        scaling_config['desiredSize']}"

    # Verify node group is in private subnets
    nodegroup_subnets = set(nodegroup["subnets"])
    expected_subnets = set(pulumi_outputs["private_subnet_ids"])
    assert nodegroup_subnets.issubset(
        expected_subnets), "EKS node group should be in private subnets"

    # Verify remote access configuration (optional)
    # Note: Remote access is commented out in the current implementation for
    # security
    if "remoteAccess" in nodegroup:
      remote_access = nodegroup["remoteAccess"]
      # SSH key configuration would be tested here if enabled
      assert "ec2SshKey" in remote_access, "SSH key should be configured if remote access is enabled"

  except ClientError as e:
    pytest.fail(f"Failed to describe EKS node group {node_group_name}: {e}")


def test_alb_exists(pulumi_outputs, aws_clients):
  """
  Verify the Application Load Balancer exists in AWS.
  """
  alb_dns = pulumi_outputs["alb_dns_name"]
  try:
    resp = aws_clients["elbv2"].describe_load_balancers()
    found_alb = None
    for lb in resp["LoadBalancers"]:
      if lb["DNSName"] == alb_dns:
        found_alb = lb
        break

    assert found_alb is not None, f"ALB with DNS {alb_dns} not found."

    # Verify ALB configuration
    assert found_alb["Type"] == "application", f"Expected application load balancer, got {
        found_alb['Type']}"
    assert found_alb["State"]["Code"] == "active", f"ALB is not active: {
        found_alb['State']}"
    assert found_alb["Scheme"] == "internet-facing", "ALB should be internet-facing"

    # Verify ALB is in the correct VPC and public subnets
    assert found_alb["VpcId"] == pulumi_outputs["vpc_id"], "ALB should be in the correct VPC"
    alb_subnets = {subnet["SubnetId"]
                   for subnet in found_alb["AvailabilityZones"]}
    expected_subnets = set(pulumi_outputs["public_subnet_ids"])
    assert alb_subnets.issubset(
        expected_subnets), "ALB should be in public subnets"

  except ClientError as e:
    pytest.fail(f"Failed to describe load balancers: {e}")


def test_alb_target_group_exists(pulumi_outputs, aws_clients):
  """
  Verify the ALB target group exists and is configured correctly.
  """
  target_group_arn = pulumi_outputs["alb_target_group_arn"]
  try:
    resp = aws_clients["elbv2"].describe_target_groups(
        TargetGroupArns=[target_group_arn])
    assert resp["TargetGroups"], f"Target group {target_group_arn} not found."

    tg = resp["TargetGroups"][0]
    assert tg["Port"] == 80, f"Expected port 80, got {tg['Port']}"
    assert tg["Protocol"] == "HTTP", f"Expected HTTP protocol, got {
        tg['Protocol']}"
    assert tg["TargetType"] == "ip", f"Expected ip target type, got {
        tg['TargetType']}"
    assert tg["VpcId"] == pulumi_outputs["vpc_id"], "Target group should be in the correct VPC"

    # Verify health check configuration
    health_check = tg["HealthCheckPath"]
    assert health_check == "/", f"Expected health check path '/', got '{health_check}'"

  except ClientError as e:
    pytest.fail(f"Failed to describe target group {target_group_arn}: {e}")


def test_codepipeline_exists(pulumi_outputs, aws_clients):
  """
  Verify the CodePipeline exists in AWS.
  """
  pipeline_name = pulumi_outputs["codepipeline_name"]
  try:
    resp = aws_clients["codepipeline"].list_pipelines()
    found = any(p["name"] == pipeline_name for p in resp["pipelines"])
    assert found, f"CodePipeline {pipeline_name} does not exist."

    # Get detailed pipeline info
    pipeline_resp = aws_clients["codepipeline"].get_pipeline(
        name=pipeline_name)
    pipeline = pipeline_resp["pipeline"]

    # Verify pipeline has expected stages
    stage_names = {stage["name"] for stage in pipeline["stages"]}
    expected_stages = {"Source", "Build", "Deploy"}
    assert expected_stages.issubset(
        stage_names), f"Pipeline missing expected stages. Found: {stage_names}"

    # Verify source stage configuration
    source_stage = next(
        stage for stage in pipeline["stages"] if stage["name"] == "Source")
    github_action = source_stage["actions"][0]
    assert github_action["actionTypeId"]["provider"] == "GitHub", "Source should use GitHub provider"

  except ClientError as e:
    pytest.fail(f"Failed to describe CodePipeline {pipeline_name}: {e}")


def test_health_lambda_exists(pulumi_outputs, aws_clients):
  """
  Verify the health monitoring Lambda function exists in AWS.
  """
  lambda_arn = pulumi_outputs["health_lambda_arn"]
  lambda_name = pulumi_outputs["health_lambda_name"]

  try:
    # Test by name
    resp = aws_clients["lambda"].get_function(FunctionName=lambda_name)
    assert "Configuration" in resp, f"Lambda {lambda_name} not found."

    config = resp["Configuration"]
    assert config["FunctionArn"] == lambda_arn, f"Lambda ARN mismatch: {
        config['FunctionArn']} != {lambda_arn}"
    assert config["Runtime"] == "python3.12", f"Unexpected Lambda runtime: {
        config['Runtime']}"
    assert config["State"] == "Active", f"Lambda function is not active: {
        config['State']}"
    assert config["Handler"] == "lambda_function.lambda_handler", f"Unexpected handler: {
        config['Handler']}"
    assert config["Timeout"] == 60, f"Unexpected timeout: {config['Timeout']}"

    # Verify Lambda environment variables
    if "Environment" in config and "Variables" in config["Environment"]:
      env_vars = config["Environment"]["Variables"]
      assert env_vars.get(
          "ENV") == "production", f"Expected ENV=production, got {env_vars.get('ENV')}"

    # Verify Lambda is in VPC
    if "VpcConfig" in config:
      vpc_config = config["VpcConfig"]
      assert vpc_config["VpcId"] == pulumi_outputs["vpc_id"], "Lambda should be in the same VPC"

      # Verify Lambda is in private subnets
      lambda_subnets = set(vpc_config["SubnetIds"])
      expected_subnets = set(pulumi_outputs["private_subnet_ids"])
      assert lambda_subnets.issubset(
          expected_subnets), "Lambda should be in private subnets"

  except ClientError as e:
    pytest.fail(f"Failed to describe Lambda function {lambda_name}: {e}")


def test_all_subnets_exist(pulumi_outputs, aws_clients):
  """
  Verify that all public and private subnets from outputs exist.
  """
  ec2 = aws_clients["ec2"]

  # Test public subnets
  public_subnet_ids = pulumi_outputs.get("public_subnet_ids", [])
  assert len(public_subnet_ids) >= 2, "Should have at least 2 public subnets"

  for subnet_id in public_subnet_ids:
    try:
      resp = ec2.describe_subnets(SubnetIds=[subnet_id])
      assert resp["Subnets"], f"Public Subnet {subnet_id} not found."

      subnet = resp["Subnets"][0]
      assert subnet["State"] == "available", f"Public subnet {subnet_id} not available"
      assert subnet["VpcId"] == pulumi_outputs[
          "vpc_id"], f"Public subnet {subnet_id} not in correct VPC"
      assert subnet["MapPublicIpOnLaunch"] is True, \
          f"Public subnet {subnet_id} should map public IPs"

      # Verify subnet CIDR is in expected range (10.0.1.0/24, 10.0.2.0/24)
      cidr = subnet["CidrBlock"]
      assert cidr.startswith(
          "10.0."), f"Public subnet {subnet_id} CIDR should start with 10.0., got {cidr}"

    except ClientError as e:
      pytest.fail(f"Failed to describe public subnet {subnet_id}: {e}")

  # Test private subnets
  private_subnet_ids = pulumi_outputs.get("private_subnet_ids", [])
  assert len(private_subnet_ids) >= 2, "Should have at least 2 private subnets"

  for subnet_id in private_subnet_ids:
    try:
      resp = ec2.describe_subnets(SubnetIds=[subnet_id])
      assert resp["Subnets"], f"Private Subnet {subnet_id} not found."

      subnet = resp["Subnets"][0]
      assert subnet["State"] == "available", f"Private subnet {subnet_id} not available"
      assert subnet["VpcId"] == pulumi_outputs[
          "vpc_id"], f"Private subnet {subnet_id} not in correct VPC"
      assert subnet["MapPublicIpOnLaunch"] is False, \
          f"Private subnet {subnet_id} should not map public IPs"

      # Verify subnet CIDR is in expected range (10.0.10.0/24, 10.0.20.0/24)
      cidr = subnet["CidrBlock"]
      assert cidr.startswith(
          "10.0."), f"Private subnet {subnet_id} CIDR should start with 10.0., got {cidr}"

    except ClientError as e:
      pytest.fail(f"Failed to describe private subnet {subnet_id}: {e}")


def test_kms_key_exists(pulumi_outputs, aws_clients):
  """
  Verify the KMS key exists and is enabled.
  """
  kms_key_id = pulumi_outputs["kms_key_id"]

  try:
    resp = aws_clients["kms"].describe_key(KeyId=kms_key_id)
    assert "KeyMetadata" in resp, f"KMS key {kms_key_id} not found."

    key_metadata = resp["KeyMetadata"]
    assert key_metadata["KeyState"] == "Enabled", f"KMS key {kms_key_id} not enabled: {
        key_metadata['KeyState']}"
    assert key_metadata["KeyUsage"] == "ENCRYPT_DECRYPT", f"Unexpected key usage: {
        key_metadata['KeyUsage']}"
    assert key_metadata["Origin"] == "AWS_KMS", f"Unexpected key origin: {
        key_metadata['Origin']}"

    # Verify key description
    assert "corp infra encryption" in key_metadata["Description"].lower(
    ), f"Unexpected key description: {key_metadata['Description']}"

    # Check if key alias exists
    aliases_resp = aws_clients["kms"].list_aliases(KeyId=kms_key_id)
    alias_names = [alias["AliasName"] for alias in aliases_resp["Aliases"]]
    expected_alias = "alias/corp-key-alias"
    assert expected_alias in alias_names, \
        f"Expected alias {expected_alias} not found. Found: {alias_names}"

  except ClientError as e:
    pytest.fail(f"Failed to describe KMS key {kms_key_id}: {e}")


def test_security_groups_exist(pulumi_outputs, aws_clients):
  """
  Verify that security groups are created and configured correctly.
  """
  vpc_id = pulumi_outputs["vpc_id"]

  try:
    resp = aws_clients["ec2"].describe_security_groups(
        Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
    )

    sg_descriptions = {sg["Description"]: sg for sg in resp["SecurityGroups"]}

    # Verify expected security groups exist
    expected_sgs = [
        "Allow HTTP and HTTPS inbound",  # web-sg
        "Allow Postgres inbound from web_sg",  # db-sg
        "EKS worker nodes security group",  # eks-sg
        "Security group for Application Load Balancer",  # alb-sg
        "Lambda security group",  # lambda-sg
    ]

    for expected_desc in expected_sgs:
      assert expected_desc in sg_descriptions, \
          f"Security group with description '{expected_desc}' not found"

    # Verify web security group has correct rules
    web_sg = sg_descriptions["Allow HTTP and HTTPS inbound"]
    ingress_ports = {rule["FromPort"]
                     for rule in web_sg["IpPermissions"] if "FromPort" in rule}
    assert 80 in ingress_ports, "Web SG should allow port 80"
    assert 443 in ingress_ports, "Web SG should allow port 443"

    # Verify database security group allows PostgreSQL
    db_sg = sg_descriptions["Allow Postgres inbound from web_sg"]
    db_ingress_ports = {rule["FromPort"]
                        for rule in db_sg["IpPermissions"] if "FromPort" in rule}
    assert 5432 in db_ingress_ports, "Database SG should allow port 5432 (PostgreSQL)"

  except ClientError as e:
    pytest.fail(f"Failed to describe security groups: {e}")


def test_internet_gateway_exists(pulumi_outputs, aws_clients):
  """
  Verify that Internet Gateway exists and is attached to VPC.
  """
  vpc_id = pulumi_outputs["vpc_id"]

  try:
    resp = aws_clients["ec2"].describe_internet_gateways(
        Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
    )

    assert resp["InternetGateways"], "No Internet Gateway found for VPC " + vpc_id

    igw = resp["InternetGateways"][0]
    attachments = igw["Attachments"]
    assert len(attachments) == 1, f"IGW should have exactly 1 attachment, found {
        len(attachments)}"
    assert attachments[0]["VpcId"] == vpc_id, "IGW should be attached to VPC " + vpc_id
    assert attachments[0]["State"] == "available", "IGW attachment should be available"

  except ClientError as e:
    pytest.fail(f"Failed to describe Internet Gateway: {e}")


def test_nat_gateways_exist(pulumi_outputs, aws_clients):
  """
  Verify that NAT Gateways exist in public subnets.
  """
  public_subnet_ids = pulumi_outputs["public_subnet_ids"]

  try:
    resp = aws_clients["ec2"].describe_nat_gateways(
        Filters=[{"Name": "subnet-id", "Values": public_subnet_ids}]
    )

    nat_gateways = resp["NatGateways"]
    assert len(nat_gateways) >= 2, f"Should have at least 2 NAT Gateways, found {
        len(nat_gateways)}"

    for nat_gw in nat_gateways:
      assert nat_gw["State"] == "available", f"NAT Gateway {
          nat_gw['NatGatewayId']} should be available"
      assert nat_gw["SubnetId"] in public_subnet_ids, "NAT Gateway should be in public subnet"

      # Verify NAT Gateway has an Elastic IP
      addresses = nat_gw["NatGatewayAddresses"]
      assert len(addresses) >= 1, "NAT Gateway should have at least 1 address"
      assert addresses[0]["AllocationId"], "NAT Gateway should have an Elastic IP allocation"

  except ClientError as e:
    pytest.fail(f"Failed to describe NAT Gateways: {e}")


def test_ssm_parameters_exist(aws_clients):
  """
  Test that required SSM parameters are created and accessible.
  """
  try:
    # Test database password parameter
    db_param_name = "/corp/dev/dbPassword"
    db_param_resp = aws_clients["ssm"].get_parameter(
        Name=db_param_name, WithDecryption=True
    )
    assert db_param_resp["Parameter"]["Type"] == "SecureString", \
        "Database password parameter should be SecureString type"
    assert len(db_param_resp["Parameter"]["Value"]) >= 16, \
        "Database password should be at least 16 characters"

    # Test GitHub token parameter (placeholder)
    github_param_name = "/corp/dev/githubToken"
    github_param_resp = aws_clients["ssm"].get_parameter(
        Name=github_param_name, WithDecryption=True
    )
    assert github_param_resp["Parameter"]["Type"] == "SecureString", \
        "GitHub token parameter should be SecureString type"
    assert github_param_resp["Parameter"]["Value"] == "placeholder-github-token-update-me", \
        "GitHub token should have placeholder value"

  except ClientError as e:
    pytest.fail(f"Failed to describe SSM parameters: {e}")
