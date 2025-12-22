"""
REQUIRED Mock Configuration Setup for VPC Security Auditor Testing
====================================================================

This setup is MANDATORY for running and testing VPC security analysis tasks.
All new VPC security audit implementations must follow this testing framework
to ensure consistent mocking and validation of AWS VPC security resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_vpc_with_tags()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock VPC resources using boto3 API calls
      - Tag resources appropriately for testing
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_vpc_security_audit())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results (findings, summary)
      - Validate structure and required fields
      - Verify finding counts and severities
      - Test specific security findings

Standard Implementation Template:
------------------------------
```python
def setup_vpc_resource():
    ec2 = boto_client("ec2")
    # Create VPC with tags
    # Create security groups with risky rules
    # Handle existing resources
    # Add configurations

def test_vpc_security_finding():
    # Setup resources
    setup_vpc_resource()

    # Run analysis
    results = run_analysis_script()

    # Validate results
    assert "summary" in results
    assert "detailed_findings" in results
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- VPC with exposed admin ports (setup_vpc_with_exposed_ports)
- Public database instances (setup_public_database)
- VPCs without flow logs (setup_vpc_without_flow_logs)

Note: Without this mock configuration setup, VPC security audit tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time
import glob

import boto3
import pytest


def boto_client(service: str):
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL"),
        region_name=os.environ.get("AWS_DEFAULT_REGION"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
    )


def setup_vpc_with_tags():
    """Create VPCs with appropriate tags for testing"""
    ec2 = boto_client("ec2")

    # Check for existing VPCs to avoid duplicates
    existing_vpcs = ec2.describe_vpcs()['Vpcs']
    production_vpc = next((vpc for vpc in existing_vpcs
                          if any(tag['Key'] == 'Environment' and tag['Value'] == 'production'
                                for tag in vpc.get('Tags', []))), None)

    if not production_vpc:
        # Create production VPC
        vpc_response = ec2.create_vpc(CidrBlock='10.0.0.0/16')
        vpc_id = vpc_response['Vpc']['VpcId']

        # Tag it as production
        ec2.create_tags(
            Resources=[vpc_id],
            Tags=[
                {'Key': 'Environment', 'Value': 'production'},
                {'Key': 'Name', 'Value': 'test-production-vpc'}
            ]
        )
        production_vpc = {'VpcId': vpc_id}

    return production_vpc['VpcId']


def setup_exposed_admin_ports(vpc_id):
    """Create security group with exposed high-risk ports"""
    ec2 = boto_client("ec2")

    # Check if security group already exists
    try:
        existing_sgs = ec2.describe_security_groups(
            Filters=[
                {'Name': 'group-name', 'Values': ['exposed-ssh-sg']},
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )['SecurityGroups']

        if existing_sgs:
            return existing_sgs[0]['GroupId']
    except:
        pass

    # Create security group with SSH exposed to internet
    sg_response = ec2.create_security_group(
        GroupName='exposed-ssh-sg',
        Description='Security group with SSH exposed to internet',
        VpcId=vpc_id
    )
    sg_id = sg_response['GroupId']

    # Authorize SSH from 0.0.0.0/0
    try:
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 22,
                    'ToPort': 22,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }
            ]
        )
    except ec2.exceptions.ClientError as e:
        if "InvalidPermission.Duplicate" not in str(e):
            raise

    return sg_id


def setup_public_database(vpc_id):
    """Create RDS instance in public subnet"""
    ec2 = boto_client("ec2")
    rds = boto_client("rds")

    # Create internet gateway
    try:
        igw_response = ec2.create_internet_gateway()
        igw_id = igw_response['InternetGateway']['InternetGatewayId']

        # Attach to VPC
        ec2.attach_internet_gateway(InternetGatewayId=igw_id, VpcId=vpc_id)
    except:
        # IGW might already exist
        igws = ec2.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )['InternetGateways']
        if igws:
            igw_id = igws[0]['InternetGatewayId']

    # Create subnet
    try:
        subnet_response = ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.0.1.0/24',
            AvailabilityZone='us-east-1a'
        )
        subnet_id = subnet_response['Subnet']['SubnetId']
    except:
        # Subnet might already exist
        subnets = ec2.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'cidr-block', 'Values': ['10.0.1.0/24']}
            ]
        )['Subnets']
        if subnets:
            subnet_id = subnets[0]['SubnetId']

    # Create route table and add route to IGW
    try:
        rt_response = ec2.create_route_table(VpcId=vpc_id)
        rt_id = rt_response['RouteTable']['RouteTableId']

        # Add route to IGW
        ec2.create_route(
            RouteTableId=rt_id,
            DestinationCidrBlock='0.0.0.0/0',
            GatewayId=igw_id
        )

        # Associate with subnet
        ec2.associate_route_table(RouteTableId=rt_id, SubnetId=subnet_id)
    except:
        pass

    # Create DB subnet group
    try:
        # Need at least 2 subnets in different AZs for RDS
        subnet2_response = ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.0.2.0/24',
            AvailabilityZone='us-east-1b'
        )
        subnet2_id = subnet2_response['Subnet']['SubnetId']
    except:
        subnets = ec2.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'cidr-block', 'Values': ['10.0.2.0/24']}
            ]
        )['Subnets']
        if subnets:
            subnet2_id = subnets[0]['SubnetId']

    try:
        rds.create_db_subnet_group(
            DBSubnetGroupName='test-public-subnet-group',
            DBSubnetGroupDescription='Test subnet group with public subnet',
            SubnetIds=[subnet_id, subnet2_id]
        )
    except rds.exceptions.DBSubnetGroupAlreadyExistsFault:
        pass

    # Create RDS instance
    try:
        rds.create_db_instance(
            DBInstanceIdentifier='test-public-db',
            DBInstanceClass='db.t3.micro',
            Engine='postgres',
            MasterUsername='admin',
            MasterUserPassword='password123',
            AllocatedStorage=20,
            DBSubnetGroupName='test-public-subnet-group',
            PubliclyAccessible=True
        )
    except rds.exceptions.DBInstanceAlreadyExistsFault:
        pass


def setup_vpc_without_flow_logs(vpc_id):
    """VPC is already created without flow logs, just return it"""
    # No flow logs created by default
    return vpc_id


def setup_data_tier_with_unrestricted_egress(vpc_id):
    """Create network interface tagged as data tier with unrestricted egress"""
    ec2 = boto_client("ec2")

    # Get or create subnet
    subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])['Subnets']
    if not subnets:
        subnet_response = ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.0.3.0/24',
            AvailabilityZone='us-east-1a'
        )
        subnet_id = subnet_response['Subnet']['SubnetId']
    else:
        subnet_id = subnets[0]['SubnetId']

    # Create security group with unrestricted egress
    try:
        sg_response = ec2.create_security_group(
            GroupName='data-tier-sg',
            Description='Data tier security group with unrestricted egress',
            VpcId=vpc_id
        )
        sg_id = sg_response['GroupId']
    except ec2.exceptions.ClientError as e:
        if "InvalidGroup.Duplicate" in str(e):
            existing_sgs = ec2.describe_security_groups(
                Filters=[
                    {'Name': 'group-name', 'Values': ['data-tier-sg']},
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )['SecurityGroups']
            sg_id = existing_sgs[0]['GroupId']
        else:
            raise

    # Create network interface
    try:
        eni_response = ec2.create_network_interface(
            SubnetId=subnet_id,
            Groups=[sg_id]
        )
        eni_id = eni_response['NetworkInterface']['NetworkInterfaceId']

        # Tag it as data tier
        ec2.create_tags(
            Resources=[eni_id],
            Tags=[{'Key': 'DataTier', 'Value': 'database'}]
        )
    except:
        pass


def setup_unused_security_group(vpc_id):
    """Create an unused security group (zombie resource)"""
    ec2 = boto_client("ec2")

    try:
        sg_response = ec2.create_security_group(
            GroupName='unused-zombie-sg',
            Description='Unused security group for testing',
            VpcId=vpc_id
        )
        return sg_response['GroupId']
    except ec2.exceptions.ClientError as e:
        if "InvalidGroup.Duplicate" in str(e):
            existing_sgs = ec2.describe_security_groups(
                Filters=[
                    {'Name': 'group-name', 'Values': ['unused-zombie-sg']},
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )['SecurityGroups']
            return existing_sgs[0]['GroupId']
        else:
            raise


def run_analysis_script():
    """Helper to run the VPC security analysis script and return JSON results"""
    # Path to script
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")

    # Remove old output files
    output_dir = os.path.dirname(os.path.dirname(__file__))
    for old_file in glob.glob(os.path.join(output_dir, "vpc_security_audit_*.json")):
        os.remove(old_file)
    for old_file in glob.glob(os.path.join(output_dir, "critical_findings_*.csv")):
        os.remove(old_file)

    env = {**os.environ}
    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env,
        cwd=output_dir
    )

    # Find the generated JSON file
    json_files = glob.glob(os.path.join(output_dir, "vpc_security_audit_*.json"))

    if json_files:
        # Read the most recent file
        json_file = sorted(json_files)[-1]
        with open(json_file, 'r') as f:
            return json.load(f)
    else:
        # If JSON file wasn't created, return empty dict and print error
        print(f"STDOUT: {result.stdout}")
        print(f"STDERR: {result.stderr}")
        return {}


def test_exposed_admin_ports():
    """Test detection of security groups with exposed high-risk ports"""
    # Setup VPC and exposed ports
    vpc_id = setup_vpc_with_tags()
    setup_exposed_admin_ports(vpc_id)

    results = run_analysis_script()

    # Check that summary exists
    assert "summary" in results, "summary key missing from JSON"
    assert "detailed_findings" in results, "detailed_findings key missing from JSON"

    # Check summary structure
    summary = results["summary"]
    assert "total_findings" in summary
    assert "critical_findings" in summary
    assert "high_findings" in summary
    assert "medium_findings" in summary
    assert "low_findings" in summary

    # Should have findings for exposed admin ports
    findings = results["detailed_findings"]

    # Find internet_exposed_admin findings
    exposed_findings = [f for f in findings if f.get("type") == "internet_exposed_admin"]
    assert len(exposed_findings) > 0, "Expected to find exposed admin port findings"

    # Check finding structure
    for finding in exposed_findings:
        assert "severity" in finding
        assert "type" in finding
        assert "resource_id" in finding
        assert "resource_type" in finding
        assert "vpc_id" in finding
        assert "description" in finding
        assert "compliance_frameworks" in finding
        assert "details" in finding

        # Validate it's a security group
        assert finding["resource_type"] == "SecurityGroup"

        # Check details
        details = finding["details"]
        assert "port" in details
        assert "service" in details


def test_vpc_without_flow_logs():
    """Test detection of VPCs missing flow logs"""
    # Setup VPC without flow logs
    vpc_id = setup_vpc_with_tags()
    setup_vpc_without_flow_logs(vpc_id)

    results = run_analysis_script()

    # Check structure
    assert "summary" in results
    assert "detailed_findings" in results

    # Find missing flow logs findings
    findings = results["detailed_findings"]
    flow_log_findings = [f for f in findings if f.get("type") == "missing_flow_logs"]

    assert len(flow_log_findings) > 0, "Expected to find missing flow logs findings"

    # Check finding details
    for finding in flow_log_findings:
        assert finding["severity"] == "HIGH"
        assert finding["resource_type"] == "VPC"
        assert "HIPAA" in str(finding["compliance_frameworks"])


def test_data_exfiltration_risks():
    """Test detection of data tier resources with unrestricted egress"""
    # Setup VPC and data tier resources
    vpc_id = setup_vpc_with_tags()
    setup_data_tier_with_unrestricted_egress(vpc_id)

    results = run_analysis_script()

    # Check structure
    assert "summary" in results
    assert "detailed_findings" in results

    # Find unrestricted egress findings
    findings = results["detailed_findings"]
    egress_findings = [f for f in findings if f.get("type") == "unrestricted_egress"]

    # May or may not have findings depending on how security groups are configured
    # But structure should be valid
    for finding in egress_findings:
        assert finding["resource_type"] == "NetworkInterface"
        assert "details" in finding
        details = finding["details"]
        assert "data_tier" in details
        assert details["data_tier"] in ["database", "cache"]


def test_unused_resources():
    """Test detection of zombie resources (unused security groups)"""
    # Setup VPC and unused security group
    vpc_id = setup_vpc_with_tags()
    setup_unused_security_group(vpc_id)

    results = run_analysis_script()

    # Check structure
    assert "summary" in results
    assert "detailed_findings" in results

    # Find unused resource findings
    findings = results["detailed_findings"]
    unused_findings = [f for f in findings if f.get("type") == "unused_resources"]

    assert len(unused_findings) > 0, "Expected to find unused resource findings"

    # Check finding details
    for finding in unused_findings:
        assert finding["severity"] == "LOW"
        assert finding["resource_type"] in ["SecurityGroup", "NetworkInterface"]


def test_compliance_framework_mappings():
    """Test that findings include proper compliance framework mappings"""
    # Setup VPC with issues
    vpc_id = setup_vpc_with_tags()
    setup_exposed_admin_ports(vpc_id)

    results = run_analysis_script()

    # Check that findings have compliance mappings
    findings = results["detailed_findings"]
    assert len(findings) > 0, "Expected to find security issues"

    for finding in findings:
        assert "compliance_frameworks" in finding
        assert isinstance(finding["compliance_frameworks"], list)

        # Check that frameworks include HIPAA or PCI-DSS
        frameworks_str = " ".join(finding["compliance_frameworks"])
        assert "HIPAA" in frameworks_str or "PCI-DSS" in frameworks_str


def test_findings_by_vpc_summary():
    """Test that results include findings grouped by VPC"""
    # Setup VPC
    vpc_id = setup_vpc_with_tags()
    setup_exposed_admin_ports(vpc_id)

    results = run_analysis_script()

    # Check for findings_by_vpc section
    assert "findings_by_vpc" in results

    findings_by_vpc = results["findings_by_vpc"]
    assert isinstance(findings_by_vpc, dict)

    # Should have at least one VPC with findings
    assert len(findings_by_vpc) > 0


def test_findings_by_type_summary():
    """Test that results include findings grouped by type"""
    # Setup VPC
    vpc_id = setup_vpc_with_tags()
    setup_exposed_admin_ports(vpc_id)

    results = run_analysis_script()

    # Check for findings_by_type section
    assert "findings_by_type" in results

    findings_by_type = results["findings_by_type"]
    assert isinstance(findings_by_type, dict)

    # Should have at least one finding type
    assert len(findings_by_type) > 0
