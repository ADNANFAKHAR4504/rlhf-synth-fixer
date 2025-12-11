"""
REQUIRED Mock Configuration Setup for AWS Multi-VPC Compliance Analysis Testing
================================================================================

This setup is MANDATORY for running and testing AWS Multi-VPC compliance analysis.
All implementations must follow this testing framework to ensure consistent
mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL=http://localhost:5001
     - AWS_DEFAULT_REGION=us-east-1
     - AWS_ACCESS_KEY_ID=testing
     - AWS_SECRET_ACCESS_KEY=testing

2. Create Mock Resource Setup (REQUIRED):
   a. Create setup functions for each resource type:
      - Use boto_client(service_name) to get AWS service client
      - Create VPCs, subnets, peering, security groups, etc.
      - Handle idempotency to avoid duplicate resources

3. Create Test Functions (REQUIRED):
   a. Define test function for each compliance check
   b. Call setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output

Reference: Audit Rules Tested:
----------------------------
A) VPC Architecture Rules
B) VPC Peering Rules
C) Routing Rules
D) Security Group Rules
E) EC2 Instance Rules
F) VPC Flow Logs Rules
G) Route 53 Private DNS Rules

Note: Without this mock configuration setup, compliance analysis tests will not
function correctly and may produce invalid results.
"""

import json
import os
import subprocess
import sys
import time

import boto3
import pytest


def boto_client(service: str):
    """Create boto3 client with Moto endpoint"""
    return boto3.client(
        service,
        endpoint_url=os.environ.get("AWS_ENDPOINT_URL", "http://localhost:5001"),
        region_name=os.environ.get("AWS_DEFAULT_REGION", "us-east-1"),
        aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID", "testing"),
        aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY", "testing"),
    )


def cleanup_vpcs():
    """Clean up existing VPCs to ensure clean test state"""
    ec2 = boto_client("ec2")
    try:
        vpcs = ec2.describe_vpcs()
        for vpc in vpcs.get('Vpcs', []):
            if vpc.get('CidrBlock') in ['10.1.0.0/16', '10.2.0.0/16']:
                vpc_id = vpc['VpcId']
                # Delete associated resources first
                try:
                    # Delete flow logs
                    flow_logs = ec2.describe_flow_logs(Filters=[{'Name': 'resource-id', 'Values': [vpc_id]}])
                    for fl in flow_logs.get('FlowLogs', []):
                        ec2.delete_flow_logs(FlowLogIds=[fl['FlowLogId']])
                except Exception:
                    pass

                try:
                    # Delete instances
                    instances = ec2.describe_instances(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
                    instance_ids = []
                    for res in instances.get('Reservations', []):
                        for inst in res.get('Instances', []):
                            instance_ids.append(inst['InstanceId'])
                    if instance_ids:
                        ec2.terminate_instances(InstanceIds=instance_ids)
                except Exception:
                    pass

                try:
                    # Delete security groups (non-default)
                    sgs = ec2.describe_security_groups(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
                    for sg in sgs.get('SecurityGroups', []):
                        if sg['GroupName'] != 'default':
                            ec2.delete_security_group(GroupId=sg['GroupId'])
                except Exception:
                    pass

                try:
                    # Delete subnets
                    subnets = ec2.describe_subnets(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
                    for subnet in subnets.get('Subnets', []):
                        ec2.delete_subnet(SubnetId=subnet['SubnetId'])
                except Exception:
                    pass

                try:
                    # Delete route tables (non-main)
                    rts = ec2.describe_route_tables(Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}])
                    for rt in rts.get('RouteTables', []):
                        is_main = any(a.get('Main', False) for a in rt.get('Associations', []))
                        if not is_main:
                            for assoc in rt.get('Associations', []):
                                if assoc.get('RouteTableAssociationId'):
                                    try:
                                        ec2.disassociate_route_table(AssociationId=assoc['RouteTableAssociationId'])
                                    except Exception:
                                        pass
                            ec2.delete_route_table(RouteTableId=rt['RouteTableId'])
                except Exception:
                    pass

                try:
                    # Delete peering connections
                    peerings = ec2.describe_vpc_peering_connections()
                    for peering in peerings.get('VpcPeeringConnections', []):
                        if peering.get('AccepterVpcInfo', {}).get('VpcId') == vpc_id or \
                           peering.get('RequesterVpcInfo', {}).get('VpcId') == vpc_id:
                            ec2.delete_vpc_peering_connection(
                                VpcPeeringConnectionId=peering['VpcPeeringConnectionId']
                            )
                except Exception:
                    pass

                try:
                    # Delete internet gateways
                    igws = ec2.describe_internet_gateways(Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}])
                    for igw in igws.get('InternetGateways', []):
                        ec2.detach_internet_gateway(InternetGatewayId=igw['InternetGatewayId'], VpcId=vpc_id)
                        ec2.delete_internet_gateway(InternetGatewayId=igw['InternetGatewayId'])
                except Exception:
                    pass

                try:
                    ec2.delete_vpc(VpcId=vpc_id)
                except Exception:
                    pass
    except Exception as e:
        print(f"Warning during cleanup: {e}")


def setup_compliant_environment():
    """Create a fully compliant test environment"""
    ec2 = boto_client("ec2")
    route53 = boto_client("route53")
    s3 = boto_client("s3")

    # Clean up first
    cleanup_vpcs()

    # Create S3 bucket for flow logs
    try:
        s3.create_bucket(Bucket='flow-logs-bucket')
    except Exception:
        pass

    # Create Payment VPC
    payment_vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    payment_vpc_id = payment_vpc['Vpc']['VpcId']
    ec2.create_tags(Resources=[payment_vpc_id], Tags=[{'Key': 'Name', 'Value': 'Payment-VPC'}])

    # Create Analytics VPC
    analytics_vpc = ec2.create_vpc(CidrBlock='10.2.0.0/16')
    analytics_vpc_id = analytics_vpc['Vpc']['VpcId']
    ec2.create_tags(Resources=[analytics_vpc_id], Tags=[{'Key': 'Name', 'Value': 'Analytics-VPC'}])

    # Enable DNS support
    for vpc_id in [payment_vpc_id, analytics_vpc_id]:
        ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsSupport={'Value': True})
        ec2.modify_vpc_attribute(VpcId=vpc_id, EnableDnsHostnames={'Value': True})

    # Create subnets (3 per VPC, different AZs)
    azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
    payment_subnets = []
    analytics_subnets = []

    for i, az in enumerate(azs):
        payment_subnet = ec2.create_subnet(
            VpcId=payment_vpc_id,
            CidrBlock=f'10.1.{i}.0/24',
            AvailabilityZone=az
        )
        payment_subnets.append(payment_subnet['Subnet']['SubnetId'])

        analytics_subnet = ec2.create_subnet(
            VpcId=analytics_vpc_id,
            CidrBlock=f'10.2.{i}.0/24',
            AvailabilityZone=az
        )
        analytics_subnets.append(analytics_subnet['Subnet']['SubnetId'])

    # Create VPC Peering
    peering = ec2.create_vpc_peering_connection(
        VpcId=payment_vpc_id,
        PeerVpcId=analytics_vpc_id
    )
    peering_id = peering['VpcPeeringConnection']['VpcPeeringConnectionId']
    ec2.accept_vpc_peering_connection(VpcPeeringConnectionId=peering_id)

    # Create route tables with peering routes
    for vpc_id, subnets, peer_cidr in [
        (payment_vpc_id, payment_subnets, '10.2.0.0/16'),
        (analytics_vpc_id, analytics_subnets, '10.1.0.0/16')
    ]:
        for subnet_id in subnets:
            rt = ec2.create_route_table(VpcId=vpc_id)
            rt_id = rt['RouteTable']['RouteTableId']
            ec2.associate_route_table(RouteTableId=rt_id, SubnetId=subnet_id)
            ec2.create_route(
                RouteTableId=rt_id,
                DestinationCidrBlock=peer_cidr,
                VpcPeeringConnectionId=peering_id
            )

    # Create security groups with required rules
    for vpc_id, peer_cidr, name in [
        (payment_vpc_id, '10.2.0.0/16', 'payment-sg'),
        (analytics_vpc_id, '10.1.0.0/16', 'analytics-sg')
    ]:
        sg = ec2.create_security_group(
            GroupName=name,
            Description=f'{name} security group',
            VpcId=vpc_id
        )
        sg_id = sg['GroupId']
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': peer_cidr}]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 5432,
                    'ToPort': 5432,
                    'IpRanges': [{'CidrIp': peer_cidr}]
                }
            ]
        )

    # Create EC2 instances with SSM tags
    for vpc_id, subnet_id, name in [
        (payment_vpc_id, payment_subnets[0], 'payment-app'),
        (analytics_vpc_id, analytics_subnets[0], 'analytics-app')
    ]:
        try:
            ec2.run_instances(
                ImageId='ami-12345678',
                MinCount=1,
                MaxCount=1,
                InstanceType='t3.micro',
                SubnetId=subnet_id,
                TagSpecifications=[{
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': name},
                        {'Key': 'SSMEnabled', 'Value': 'true'}
                    ]
                }]
            )
        except Exception as e:
            print(f"Instance creation: {e}")

    # Create VPC Flow Logs
    for vpc_id in [payment_vpc_id, analytics_vpc_id]:
        try:
            ec2.create_flow_logs(
                ResourceType='VPC',
                ResourceIds=[vpc_id],
                TrafficType='ALL',
                LogDestinationType='s3',
                LogDestination='arn:aws:s3:::flow-logs-bucket/'
            )
        except Exception as e:
            print(f"Flow log creation: {e}")

    # Create Route53 private hosted zones
    for zone_name, vpc_id in [
        ('payment.internal', payment_vpc_id),
        ('analytics.internal', analytics_vpc_id)
    ]:
        try:
            route53.create_hosted_zone(
                Name=zone_name,
                VPC={
                    'VPCRegion': 'us-east-1',
                    'VPCId': vpc_id
                },
                CallerReference=str(time.time()),
                HostedZoneConfig={
                    'PrivateZone': True,
                    'Comment': f'{zone_name} private zone'
                }
            )
        except Exception as e:
            print(f"Hosted zone creation: {e}")

    return {
        'payment_vpc_id': payment_vpc_id,
        'analytics_vpc_id': analytics_vpc_id,
        'peering_id': peering_id,
        'payment_subnets': payment_subnets,
        'analytics_subnets': analytics_subnets
    }


def setup_missing_payment_vpc():
    """Create environment with missing Payment VPC"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    # Only create Analytics VPC
    analytics_vpc = ec2.create_vpc(CidrBlock='10.2.0.0/16')
    analytics_vpc_id = analytics_vpc['Vpc']['VpcId']

    return {'analytics_vpc_id': analytics_vpc_id}


def setup_missing_analytics_vpc():
    """Create environment with missing Analytics VPC"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    # Only create Payment VPC
    payment_vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    payment_vpc_id = payment_vpc['Vpc']['VpcId']

    return {'payment_vpc_id': payment_vpc_id}


def setup_insufficient_subnets():
    """Create environment with insufficient subnets"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    # Create VPC with only 2 subnets
    vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    vpc_id = vpc['Vpc']['VpcId']

    for i in range(2):
        ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock=f'10.1.{i}.0/24',
            AvailabilityZone=f'us-east-1{chr(97+i)}'
        )

    return {'vpc_id': vpc_id}


def setup_missing_peering():
    """Create environment without VPC peering"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    # Create both VPCs but no peering
    payment_vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    analytics_vpc = ec2.create_vpc(CidrBlock='10.2.0.0/16')

    return {
        'payment_vpc_id': payment_vpc['Vpc']['VpcId'],
        'analytics_vpc_id': analytics_vpc['Vpc']['VpcId']
    }


def setup_wide_open_security_group():
    """Create environment with wide open security group"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    vpc_id = vpc['Vpc']['VpcId']

    sg = ec2.create_security_group(
        GroupName='wide-open-sg',
        Description='Wide open security group',
        VpcId=vpc_id
    )
    ec2.authorize_security_group_ingress(
        GroupId=sg['GroupId'],
        IpPermissions=[{
            'IpProtocol': 'tcp',
            'FromPort': 443,
            'ToPort': 443,
            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
        }]
    )

    return {'vpc_id': vpc_id, 'sg_id': sg['GroupId']}


def setup_missing_flow_logs():
    """Create environment without VPC flow logs"""
    cleanup_vpcs()
    ec2 = boto_client("ec2")

    vpc = ec2.create_vpc(CidrBlock='10.1.0.0/16')
    vpc_id = vpc['Vpc']['VpcId']

    # No flow logs created
    return {'vpc_id': vpc_id}


def run_analysis_script():
    """Helper to run the analysis script and return JSON results"""
    script = os.path.join(os.path.dirname(__file__), "..", "lib", "analyse.py")
    json_output = os.path.join(os.path.dirname(__file__), "..", "vpc_connectivity_audit.json")

    # Remove old JSON file if exists
    if os.path.exists(json_output):
        os.remove(json_output)

    env = {**os.environ}
    env['AWS_ENDPOINT_URL'] = os.environ.get('AWS_ENDPOINT_URL', 'http://localhost:5001')
    env['AWS_DEFAULT_REGION'] = 'us-east-1'
    env['AWS_ACCESS_KEY_ID'] = os.environ.get('AWS_ACCESS_KEY_ID', 'testing')
    env['AWS_SECRET_ACCESS_KEY'] = os.environ.get('AWS_SECRET_ACCESS_KEY', 'testing')

    result = subprocess.run(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        env=env
    )

    if result.stdout:
        print("\n=== Analysis Output ===")
        print(result.stdout)

    if result.stderr:
        print("\n=== Errors/Warnings ===")
        print(result.stderr)

    if os.path.exists(json_output):
        with open(json_output, 'r') as f:
            return json.load(f)
    else:
        print(f"Warning: {json_output} was not created")
        print(f"Return code: {result.returncode}")
        return {}


# Integration Tests

def test_compliant_environment_analysis():
    """Test analysis of a fully compliant environment"""
    print("\n=== Testing Compliant Environment ===")
    setup_compliant_environment()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "compliance_summary" in results
    assert "findings" in results

    summary = results["compliance_summary"]
    print(f"Total checks: {summary.get('total_checks', 0)}")
    print(f"Passed: {summary.get('passed', 0)}")
    print(f"Failed: {summary.get('failed', 0)}")
    print(f"Compliance: {summary.get('compliance_percentage', 0)}%")


def test_missing_payment_vpc_detection():
    """Test detection of missing Payment VPC"""
    print("\n=== Testing Missing Payment VPC Detection ===")
    setup_missing_payment_vpc()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    payment_vpc_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Missing Payment VPC"
    ]

    assert len(payment_vpc_findings) > 0, "Missing Payment VPC not detected"
    assert payment_vpc_findings[0]["severity"] == "CRITICAL"
    print(f"Found {len(payment_vpc_findings)} Payment VPC finding(s)")


def test_missing_analytics_vpc_detection():
    """Test detection of missing Analytics VPC"""
    print("\n=== Testing Missing Analytics VPC Detection ===")
    setup_missing_analytics_vpc()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    analytics_vpc_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Missing Analytics VPC"
    ]

    assert len(analytics_vpc_findings) > 0, "Missing Analytics VPC not detected"
    assert analytics_vpc_findings[0]["severity"] == "CRITICAL"
    print(f"Found {len(analytics_vpc_findings)} Analytics VPC finding(s)")


def test_insufficient_subnets_detection():
    """Test detection of insufficient subnets"""
    print("\n=== Testing Insufficient Subnets Detection ===")
    setup_insufficient_subnets()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    subnet_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Insufficient private subnets"
    ]

    assert len(subnet_findings) > 0, "Insufficient subnets not detected"
    print(f"Found {len(subnet_findings)} subnet finding(s)")


def test_missing_peering_detection():
    """Test detection of missing VPC peering"""
    print("\n=== Testing Missing VPC Peering Detection ===")
    setup_missing_peering()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    peering_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Missing VPC peering"
    ]

    assert len(peering_findings) > 0, "Missing VPC peering not detected"
    assert peering_findings[0]["severity"] == "CRITICAL"
    print(f"Found {len(peering_findings)} peering finding(s)")


def test_wide_open_security_group_detection():
    """Test detection of wide open security groups"""
    print("\n=== Testing Wide Open Security Group Detection ===")
    setup_wide_open_security_group()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    sg_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Wide open security group"
    ]

    assert len(sg_findings) > 0, "Wide open security group not detected"
    assert sg_findings[0]["severity"] == "CRITICAL"
    print(f"Found {len(sg_findings)} security group finding(s)")


def test_missing_flow_logs_detection():
    """Test detection of missing VPC flow logs"""
    print("\n=== Testing Missing Flow Logs Detection ===")
    setup_missing_flow_logs()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    flow_log_findings = [
        f for f in results["findings"]
        if f.get("issue_type") == "Missing VPC Flow Logs"
    ]

    assert len(flow_log_findings) > 0, "Missing flow logs not detected"
    assert flow_log_findings[0]["severity"] == "CRITICAL"
    print(f"Found {len(flow_log_findings)} flow log finding(s)")


def test_json_report_structure():
    """Test JSON report structure and required fields"""
    print("\n=== Testing JSON Report Structure ===")
    setup_missing_payment_vpc()

    results = run_analysis_script()

    assert results, "Analysis results are empty"

    # Check compliance_summary structure
    assert "compliance_summary" in results
    summary = results["compliance_summary"]
    assert "total_checks" in summary
    assert "passed" in summary
    assert "failed" in summary
    assert "compliance_percentage" in summary
    assert "frameworks" in summary
    assert "scan_timestamp" in summary

    # Check findings structure
    assert "findings" in results
    if results["findings"]:
        finding = results["findings"][0]
        assert "resource_id" in finding
        assert "resource_type" in finding
        assert "issue_type" in finding
        assert "severity" in finding
        assert "frameworks" in finding
        assert "current_state" in finding
        assert "required_state" in finding
        assert "remediation_steps" in finding

    print("JSON report structure is valid")


def test_framework_compliance_mapping():
    """Test that findings are properly mapped to compliance frameworks"""
    print("\n=== Testing Framework Compliance Mapping ===")
    setup_missing_peering()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "findings" in results

    for finding in results["findings"]:
        assert "frameworks" in finding
        assert isinstance(finding["frameworks"], list)
        assert len(finding["frameworks"]) > 0

        for framework in finding["frameworks"]:
            assert framework in ["SOC2", "PCI-DSS", "GDPR"]

    # Check framework summary
    summary = results["compliance_summary"]
    assert "frameworks" in summary
    for framework_name, framework_data in summary["frameworks"].items():
        assert "total" in framework_data
        assert "passed" in framework_data
        assert "failed" in framework_data

    print("Framework compliance mapping is correct")


def test_severity_levels():
    """Test that severity levels are properly assigned"""
    print("\n=== Testing Severity Levels ===")
    setup_wide_open_security_group()

    results = run_analysis_script()

    assert results, "Analysis results are empty"

    valid_severities = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
    for finding in results.get("findings", []):
        assert finding["severity"] in valid_severities

    print("Severity levels are valid")


def test_remediation_steps_provided():
    """Test that remediation steps are provided for all findings"""
    print("\n=== Testing Remediation Steps ===")
    setup_missing_payment_vpc()

    results = run_analysis_script()
    
    assert results, "Analysis results are empty"

    for finding in results.get("findings", []):
        assert "remediation_steps" in finding
        assert finding["remediation_steps"], "Remediation steps should not be empty"
        assert len(finding["remediation_steps"]) > 0

    print("Remediation steps are provided for all findings")


def test_comprehensive_compliance_analysis():
    """Test comprehensive compliance analysis with all resource types"""
    print("\n=== Running Comprehensive Compliance Analysis ===")

    setup_compliant_environment()

    results = run_analysis_script()

    assert results, "Analysis results are empty"
    assert "compliance_summary" in results
    assert "findings" in results

    summary = results["compliance_summary"]

    print(f"\n=== Compliance Summary ===")
    print(f"Total Checks: {summary.get('total_checks', 0)}")
    print(f"Passed: {summary.get('passed', 0)}")
    print(f"Failed: {summary.get('failed', 0)}")
    print(f"Compliance Percentage: {summary.get('compliance_percentage', 0)}%")

    print(f"\n=== Framework Results ===")
    for framework, data in summary.get("frameworks", {}).items():
        print(f"{framework}: Passed={data.get('passed', 0)}, Failed={data.get('failed', 0)}")

    if results["findings"]:
        print(f"\n=== Findings ({len(results['findings'])}) ===")
        for finding in results["findings"]:
            print(f"- [{finding['severity']}] {finding['issue_type']}: {finding['resource_id']}")

    print("\n=== Comprehensive Analysis Complete ===")
