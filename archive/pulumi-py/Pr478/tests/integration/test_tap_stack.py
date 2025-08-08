import pytest
import boto3
import json
import subprocess
import os
from botocore.exceptions import ClientError

# Define the stack name dynamically or get it from an environment variable
# This environment variable MUST be set before running the tests, e.g.,
# export PULUMI_STACK_NAME="TapStackpr478"
PULUMI_STACK_NAME = os.environ.get("PULUMI_STACK_NAME", "TapStackpr478")


@pytest.fixture(scope="session")
def pulumi_outputs():
  """
  Fetches and parses Pulumi stack outputs.
  This fixture runs once per test session and provides the outputs to all tests.
  It also prints the consolidated outputs for verification.
  """
  print(f"\nAttempting to fetch outputs from Pulumi stack: {PULUMI_STACK_NAME}")
  try:
    # Construct the command to get Pulumi stack outputs in JSON format
    command = ["pulumi", "stack", "output", "--json", "--stack", PULUMI_STACK_NAME]
    
    # Execute the command
    result = subprocess.run(command, capture_output=True, text=True, check=True)
    
    # Parse the JSON output. The output from 'pulumi stack output --json'
    # directly provides the flat outputs as a dictionary, with nested structures
    # already parsed into native Python types (lists, dicts).
    outputs = json.loads(result.stdout)
    
    print(f"Successfully fetched outputs for stack: {PULUMI_STACK_NAME}")
    print("\n--- Pulumi Stack Outputs ---")
    print(json.dumps(outputs, indent=2))
    print("----------------------------\n")
    return outputs
  except subprocess.CalledProcessError as e:
    pytest.fail(f"Failed to get Pulumi stack outputs. "
                f"Ensure Pulumi CLI is installed, configured, and logged in. "
                f"Error: {e.stderr}")
  except json.JSONDecodeError as e:
    pytest.fail(f"Failed to parse Pulumi JSON output. Check if output is valid JSON. Error: {e}")
  except Exception as e:
    pytest.fail(f"An unexpected error occurred while processing Pulumi outputs: {e}")


@pytest.fixture(scope="session")
def aws_clients(pulumi_outputs):
  """
  Provides a dictionary of boto3 clients for all deployed regions.
  This fixture runs once per test session.
  """
  clients = {}
  # 'deployed_regions' is already a list, no need for json.loads() here
  deployed_regions = pulumi_outputs["deployed_regions"]
  print(f"Initializing boto3 clients for regions: {deployed_regions}")
  for region in deployed_regions:
    clients[region] = {
      "ec2": boto3.client("ec2", region_name=region),
      "elasticbeanstalk": boto3.client("elasticbeanstalk", region_name=region),
      "cloudwatch": boto3.client("cloudwatch", region_name=region),
      "sns": boto3.client("sns", region_name=region),
      "iam": boto3.client("iam"),  # IAM is a global service, client can be reused
    }
  return clients


def assert_exists(condition, msg):
  """Helper function for assertions."""
  assert condition, msg


def get_resource_name_from_arn(arn):
  """
  Helper function to extract the resource name from an ARN.
  Handles different ARN formats for IAM roles/profiles and SNS topics.
  """
  if not arn:
    return None
  parts = arn.split(":")
  if len(parts) > 5:
    resource_part = parts[5]
    # For IAM roles/instance profiles, the name is after 'role/' or 'instance-profile/'
    if "/" in resource_part:
      return resource_part.split("/")[-1]
    # For SNS topics, the name is the last part
    return resource_part
  return None


# --- Integration Tests ---

def test_vpcs_exist_and_match_cidr(pulumi_outputs, aws_clients):
  """
  Verifies that VPCs exist in the deployed regions and their CIDR blocks match.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    region_data = all_regions_data[region_name]
    ec2_client = aws_clients[region_name]["ec2"]
    vpc_id = region_data["vpc_id"]
    vpc_cidr = region_data["vpc_cidr"]

    print(f"Verifying VPC {vpc_id} (CIDR: {vpc_cidr}) in {region_name}")
    try:
      response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
      assert_exists(len(response["Vpcs"]) == 1, f"VPC {vpc_id} not found in {region_name}")
      vpc = response["Vpcs"][0]
      assert_exists(vpc["CidrBlock"] == vpc_cidr, \
        f"VPC {vpc_id} CIDR mismatch in {region_name}: expected {vpc_cidr}, got {vpc['CidrBlock']}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing VPC {vpc_id} in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing VPC {vpc_id} in {region_name}: {e}")


def test_subnets_exist_and_match_vpc(pulumi_outputs, aws_clients):
  """
  Verifies that public and private subnets exist and are associated with the correct VPC.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    region_data = all_regions_data[region_name]
    ec2_client = aws_clients[region_name]["ec2"]
    vpc_id = region_data["vpc_id"]

    # Determine which subnet IDs to use based on primary/secondary region
    # These are already lists, no need for json.loads()
    if region_name == pulumi_outputs["primary_region"]:
      public_subnet_ids = pulumi_outputs["primary_public_subnet_ids"]
      private_subnet_ids = pulumi_outputs["primary_private_subnet_ids"]
    elif region_name == pulumi_outputs["secondary_region"]:
      public_subnet_ids = pulumi_outputs["secondary_public_subnet_ids"]
      private_subnet_ids = pulumi_outputs["secondary_private_subnet_ids"]
    else:
      pytest.fail(f"Region {region_name} found in all_regions_data but not explicitly primary/secondary in outputs.")
      continue

    print(f"Verifying Public Subnets {public_subnet_ids} in {region_name}")
    try:
      response = ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
      assert_exists(len(response["Subnets"]) == len(public_subnet_ids), \
        f"Not all public subnets found in {region_name}. Expected {len(public_subnet_ids)}, found {len(response['Subnets'])}")
      for subnet in response["Subnets"]:
        assert_exists(subnet["VpcId"] == vpc_id, \
          f"Public subnet {subnet['SubnetId']} VPC ID mismatch in {region_name}: expected {vpc_id}, got {subnet['VpcId']}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing public subnets in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing public subnets in {region_name}: {e}")

    print(f"Verifying Private Subnets {private_subnet_ids} in {region_name}")
    try:
      response = ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
      assert_exists(len(response["Subnets"]) == len(private_subnet_ids), \
        f"Not all private subnets found in {region_name}. Expected {len(private_subnet_ids)}, found {len(response['Subnets'])}")
      for subnet in response["Subnets"]:
        assert_exists(subnet["VpcId"] == vpc_id, \
          f"Private subnet {subnet['SubnetId']} VPC ID mismatch in {region_name}: expected {vpc_id}, got {subnet['VpcId']}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing private subnets in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing private subnets in {region_name}: {e}")


def test_eb_application_exists(pulumi_outputs, aws_clients):
  """
  Verifies that Elastic Beanstalk applications exist in the deployed regions.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    eb_client = aws_clients[region_name]["elasticbeanstalk"]
    
    # Use the specific application name from the outputs
    if region_name == pulumi_outputs["primary_region"]:
      eb_app_name = pulumi_outputs["primary_eb_application_name"]
    elif region_name == pulumi_outputs["secondary_region"]:
      eb_app_name = pulumi_outputs["secondary_eb_application_name"]
    else:
      pytest.fail(f"Could not determine EB application name for region {region_name}")
      continue
    
    print(f"Verifying EB Application {eb_app_name} in {region_name}")
    try:
      response = eb_client.describe_applications(ApplicationNames=[eb_app_name])
      assert_exists(len(response["Applications"]) == 1, \
        f"Elastic Beanstalk Application {eb_app_name} not found in {region_name}")
      assert_exists(response["Applications"][0]["ApplicationName"] == eb_app_name, \
        f"EB Application name mismatch: expected {eb_app_name}, got {response['Applications'][0]['ApplicationName']}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing EB Application {eb_app_name} in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing EB Application {eb_app_name} in {region_name}: {e}")


def test_eb_environment_exists_and_is_ready(pulumi_outputs, aws_clients):
  """
  Verifies that Elastic Beanstalk environments exist, are 'Ready' and 'Green',
  and their URLs match the expected outputs.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    region_data = all_regions_data[region_name]
    eb_client = aws_clients[region_name]["elasticbeanstalk"]
    eb_env_name = region_data["eb_environment_name"]
    eb_env_url = region_data["eb_environment_url"]
    
    print(f"Verifying EB Environment {eb_env_name} in {region_name}")
    try:
      response = eb_client.describe_environments(EnvironmentNames=[eb_env_name])
      assert_exists(len(response["Environments"]) == 1, \
        f"Elastic Beanstalk Environment {eb_env_name} not found in {region_name}")
      
      env = response["Environments"][0]
      assert_exists(env["Status"] == "Ready", \
        f"EB Environment {eb_env_name} in {region_name} is not Ready. Current status: {env['Status']}")
      assert_exists(env["Health"] == "Green", \
        f"EB Environment {eb_env_name} in {region_name} is not Green. Current health: {env['Health']}")
      
      # The eb_environment_url is the ELB DNS name. The Environment's EndpointURL is the full CNAME.
      # We check if the expected ELB DNS name is part of the full CNAME.
      assert_exists(eb_env_url in env["EndpointURL"], \
        f"EB Environment {eb_env_name} URL mismatch in {region_name}: expected '{eb_env_url}' to be in '{env['EndpointURL']}'")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing EB Environment {eb_env_name} in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing EB Environment {eb_env_name} in {region_name}: {e}")


def test_cloudwatch_dashboard_exists(pulumi_outputs, aws_clients):
  """
  Verifies that CloudWatch Dashboards exist in the deployed regions.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    region_data = all_regions_data[region_name]
    cloudwatch_client = aws_clients[region_name]["cloudwatch"]
    dashboard_name = region_data["dashboard_name"]
    
    print(f"Verifying CloudWatch Dashboard {dashboard_name} in {region_name}")
    try:
      response = cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
      assert_exists(response["DashboardName"] == dashboard_name, \
        f"CloudWatch Dashboard {dashboard_name} not found in {region_name}")
    except cloudwatch_client.exceptions.ResourceNotFoundException:
      pytest.fail(f"CloudWatch Dashboard {dashboard_name} not found in {region_name}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing CloudWatch Dashboard {dashboard_name} in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing CloudWatch Dashboard {dashboard_name} in {region_name}: {e}")


def test_sns_topic_exists(pulumi_outputs, aws_clients):
  """
  Verifies that SNS Topics exist in the deployed regions.
  """
  # 'all_regions_data' is already a dictionary, no need for json.loads() here
  all_regions_data = pulumi_outputs["all_regions_data"]
  deployed_regions = pulumi_outputs["deployed_regions"] # Already a list

  for region_name in deployed_regions:
    region_data = all_regions_data[region_name]
    sns_client = aws_clients[region_name]["sns"]
    sns_topic_arn = region_data["sns_topic_arn"]
    
    # Extract the topic name from the ARN (since account ID is masked in output)
    topic_name = get_resource_name_from_arn(sns_topic_arn)
    
    print(f"Verifying SNS Topic {topic_name} in {region_name}")
    try:
      response = sns_client.list_topics()
      found = False
      for topic in response["Topics"]:
        # Check if the topic ARN ends with the expected topic name
        if topic["TopicArn"].endswith(f":{topic_name}"):
          found = True
          break
      assert_exists(found, f"SNS Topic {topic_name} not found in {region_name}")
    except ClientError as e:
      pytest.fail(f"AWS ClientError testing SNS Topic {topic_name} in {region_name}: {e}")
    except Exception as e:
      pytest.fail(f"Unexpected error testing SNS Topic {topic_name} in {region_name}: {e}")


def test_iam_instance_profile_exists(pulumi_outputs, aws_clients):
  """
  Verifies that the IAM Instance Profile exists. (IAM is global)
  """
  # IAM is a global service, so we use the client from the primary region (any region client works for IAM)
  iam_client = aws_clients[pulumi_outputs["primary_region"]]["iam"]
  instance_profile_name = pulumi_outputs["eb_instance_profile_name"]
  
  print(f"Verifying IAM Instance Profile {instance_profile_name}")
  try:
    response = iam_client.get_instance_profile(InstanceProfileName=instance_profile_name)
    assert_exists(response["InstanceProfile"]["InstanceProfileName"] == instance_profile_name, \
      f"IAM Instance Profile {instance_profile_name} not found")
  except iam_client.exceptions.NoSuchEntityException:
    pytest.fail(f"IAM Instance Profile {instance_profile_name} not found")
  except ClientError as e:
    pytest.fail(f"AWS ClientError testing IAM Instance Profile {instance_profile_name}: {e}")
  except Exception as e:
    pytest.fail(f"Unexpected error testing IAM Instance Profile {instance_profile_name}: {e}")


def test_iam_instance_role_exists(pulumi_outputs, aws_clients):
  """
  Verifies that the IAM Instance Role exists. (IAM is global)
  """
  iam_client = aws_clients[pulumi_outputs["primary_region"]]["iam"]
  instance_role_arn = pulumi_outputs["eb_instance_role_arn"]
  instance_role_name = get_resource_name_from_arn(instance_role_arn)
  
  print(f"Verifying IAM Instance Role {instance_role_name}")
  try:
    response = iam_client.get_role(RoleName=instance_role_name)
    assert_exists(response["Role"]["RoleName"] == instance_role_name, \
      f"IAM Instance Role {instance_role_name} not found")
  except iam_client.exceptions.NoSuchEntityException:
    pytest.fail(f"IAM Instance Role {instance_role_name} not found")
  except ClientError as e:
    pytest.fail(f"AWS ClientError testing IAM Instance Role {instance_role_name}: {e}")
  except Exception as e:
    pytest.fail(f"Unexpected error testing IAM Instance Role {instance_role_name}: {e}")


def test_iam_service_role_exists(pulumi_outputs, aws_clients):
  """
  Verifies that the IAM Service Role exists. (IAM is global)
  """
  iam_client = aws_clients[pulumi_outputs["primary_region"]]["iam"]
  service_role_arn = pulumi_outputs["eb_service_role_arn"]
  service_role_name = get_resource_name_from_arn(service_role_arn)
  
  print(f"Verifying IAM Service Role {service_role_name}")
  try:
    response = iam_client.get_role(RoleName=service_role_name)
    assert_exists(response["Role"]["RoleName"] == service_role_name, \
      f"IAM Service Role {service_role_name} not found")
  except iam_client.exceptions.NoSuchEntityException:
    pytest.fail(f"IAM Service Role {service_role_name} not found")
  except ClientError as e:
    pytest.fail(f"AWS ClientError testing IAM Service Role {service_role_name}: {e}")
  except Exception as e:
    pytest.fail(f"Unexpected error testing IAM Service Role {service_role_name}: {e}")
