import boto3
import os
import json
import logging
from datetime import datetime
from typing import Dict, List, Any

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize boto3 clients
ec2 = boto3.client('ec2')
cloudwatch = boto3.client('cloudwatch')
sns = boto3.client('sns')
sts = boto3.client('sts')


def handler(event, context):
    """
    Lambda handler for VPC peering compliance checks

    Validates:
    - All peering connections are active
    - Security groups have no 0.0.0.0/0 rules on ports 443, 3306
    - VPC Flow Logs are enabled and publishing
    - Route tables have correct peering routes
    """
    try:
        # Get environment variables
        vpc_ids = os.environ['VPC_IDS'].split(',')
        peering_connection_ids = os.environ['PEERING_CONNECTION_IDS'].split(',')
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        cross_account_role = os.environ.get('CROSS_ACCOUNT_ROLE', 'TerraformPeeringRole')
        peer_account_ids = os.environ.get('PEER_ACCOUNT_IDS', '').split(',') if os.environ.get('PEER_ACCOUNT_IDS') else []

        # Run compliance checks
        findings = {
            'timestamp': datetime.utcnow().isoformat(),
            'total_vpcs': len(vpc_ids),
            'total_peering_connections': len(peering_connection_ids),
            'checks': []
        }

        # Check 1: Validate all peering connections are active
        logger.info("Checking peering connection status...")
        peering_findings = check_peering_connections(peering_connection_ids)
        findings['checks'].append(peering_findings)

        # Check 2: Validate security groups
        logger.info("Checking security groups...")
        sg_findings = check_security_groups(vpc_ids)
        findings['checks'].append(sg_findings)

        # Check 3: Validate VPC Flow Logs
        logger.info("Checking VPC Flow Logs...")
        flow_log_findings = check_flow_logs(vpc_ids)
        findings['checks'].append(flow_log_findings)

        # Check 4: Validate route tables
        logger.info("Checking route tables...")
        route_findings = check_route_tables(vpc_ids, peering_connection_ids)
        findings['checks'].append(route_findings)

        # Check 5: Cross-account validation (if configured)
        if peer_account_ids and peer_account_ids[0]:
            logger.info("Running cross-account compliance checks...")
            cross_account_findings = check_cross_account_resources(peer_account_ids, cross_account_role)
            findings['checks'].append(cross_account_findings)

        # Calculate overall compliance score
        total_checks = sum(check['total_checks'] for check in findings['checks'])
        passed_checks = sum(check['passed_checks'] for check in findings['checks'])
        compliance_score = (passed_checks / total_checks * 100) if total_checks > 0 else 0

        findings['compliance_score'] = compliance_score
        findings['passed_checks'] = passed_checks
        findings['failed_checks'] = total_checks - passed_checks

        # Publish metrics to CloudWatch
        publish_compliance_metrics(findings)

        # Send notification if compliance score is below threshold
        if compliance_score < 100:
            send_sns_notification(sns_topic_arn, findings)

        logger.info(f"Compliance check completed. Score: {compliance_score:.2f}%")

        return {
            'statusCode': 200,
            'body': json.dumps(findings, default=str)
        }

    except Exception as e:
        logger.error(f"Error in compliance check: {str(e)}", exc_info=True)
        raise


def check_peering_connections(peering_connection_ids: List[str]) -> Dict[str, Any]:
    """
    Check if all peering connections are active
    """
    findings = {
        'check_name': 'VPC Peering Connection Status',
        'total_checks': len(peering_connection_ids),
        'passed_checks': 0,
        'issues': []
    }

    try:
        response = ec2.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=peering_connection_ids
        )

        for peering in response['VpcPeeringConnections']:
            peering_id = peering['VpcPeeringConnectionId']
            status = peering['Status']['Code']

            if status == 'active':
                findings['passed_checks'] += 1
            else:
                findings['issues'].append({
                    'resource_id': peering_id,
                    'issue': f'Peering connection is not active (status: {status})',
                    'severity': 'HIGH'
                })

    except Exception as e:
        logger.error(f"Error checking peering connections: {str(e)}")
        findings['issues'].append({
            'resource_id': 'N/A',
            'issue': f'Failed to check peering connections: {str(e)}',
            'severity': 'CRITICAL'
        })

    return findings


def check_security_groups(vpc_ids: List[str]) -> Dict[str, Any]:
    """
    Check security groups for overly permissive rules (0.0.0.0/0 on ports 443, 3306)
    """
    findings = {
        'check_name': 'Security Group Rules',
        'total_checks': 0,
        'passed_checks': 0,
        'issues': []
    }

    try:
        # Get all security groups in the VPCs
        response = ec2.describe_security_groups(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': vpc_ids
                }
            ]
        )

        for sg in response['SecurityGroups']:
            sg_id = sg['GroupId']
            sg_name = sg['GroupName']

            # Check ingress rules
            for rule in sg.get('IpPermissions', []):
                from_port = rule.get('FromPort', 0)
                to_port = rule.get('ToPort', 0)

                # Check for sensitive ports (443, 3306)
                if from_port <= 443 <= to_port or from_port <= 3306 <= to_port:
                    findings['total_checks'] += 1

                    # Check for 0.0.0.0/0
                    has_open_access = any(
                        ip_range.get('CidrIp') == '0.0.0.0/0'
                        for ip_range in rule.get('IpRanges', [])
                    )

                    if has_open_access:
                        port_desc = f"{from_port}-{to_port}" if from_port != to_port else str(from_port)
                        findings['issues'].append({
                            'resource_id': sg_id,
                            'issue': f'Security group {sg_name} has 0.0.0.0/0 access on port(s) {port_desc}',
                            'severity': 'HIGH'
                        })
                    else:
                        findings['passed_checks'] += 1

        # If no checks were performed, add at least one to avoid division by zero
        if findings['total_checks'] == 0:
            findings['total_checks'] = len(response['SecurityGroups'])
            findings['passed_checks'] = len(response['SecurityGroups'])

    except Exception as e:
        logger.error(f"Error checking security groups: {str(e)}")
        findings['issues'].append({
            'resource_id': 'N/A',
            'issue': f'Failed to check security groups: {str(e)}',
            'severity': 'CRITICAL'
        })
        findings['total_checks'] = 1

    return findings


def check_flow_logs(vpc_ids: List[str]) -> Dict[str, Any]:
    """
    Check if VPC Flow Logs are enabled and publishing
    """
    findings = {
        'check_name': 'VPC Flow Logs',
        'total_checks': len(vpc_ids),
        'passed_checks': 0,
        'issues': []
    }

    try:
        response = ec2.describe_flow_logs(
            Filters=[
                {
                    'Name': 'resource-id',
                    'Values': vpc_ids
                }
            ]
        )

        # Create a set of VPCs with active flow logs
        vpcs_with_flow_logs = set()
        for flow_log in response['FlowLogs']:
            if flow_log['FlowLogStatus'] == 'ACTIVE':
                vpcs_with_flow_logs.add(flow_log['ResourceId'])

        # Check each VPC
        for vpc_id in vpc_ids:
            if vpc_id in vpcs_with_flow_logs:
                findings['passed_checks'] += 1
            else:
                findings['issues'].append({
                    'resource_id': vpc_id,
                    'issue': 'VPC Flow Logs are not enabled or not active',
                    'severity': 'MEDIUM'
                })

    except Exception as e:
        logger.error(f"Error checking flow logs: {str(e)}")
        findings['issues'].append({
            'resource_id': 'N/A',
            'issue': f'Failed to check flow logs: {str(e)}',
            'severity': 'CRITICAL'
        })

    return findings


def check_route_tables(vpc_ids: List[str], peering_connection_ids: List[str]) -> Dict[str, Any]:
    """
    Check if route tables have correct peering routes
    """
    findings = {
        'check_name': 'Route Table Peering Routes',
        'total_checks': 0,
        'passed_checks': 0,
        'issues': []
    }

    try:
        # Get all route tables for the VPCs
        response = ec2.describe_route_tables(
            Filters=[
                {
                    'Name': 'vpc-id',
                    'Values': vpc_ids
                }
            ]
        )

        # Count route tables that should have peering routes
        route_tables = response['RouteTables']
        findings['total_checks'] = len(route_tables)

        for route_table in route_tables:
            rt_id = route_table['RouteTableId']

            # Check if this route table has any peering routes
            has_peering_route = any(
                route.get('VpcPeeringConnectionId') in peering_connection_ids
                for route in route_table.get('Routes', [])
            )

            # For main route tables in VPCs with peering, they should have peering routes
            vpc_id = route_table['VpcId']
            is_main_route_table = any(
                assoc.get('Main', False)
                for assoc in route_table.get('Associations', [])
            )

            # We expect route tables to have peering routes if there are peering connections
            if len(peering_connection_ids) > 0:
                if has_peering_route:
                    findings['passed_checks'] += 1
                else:
                    # This might be intentional for some route tables
                    # Only flag as issue if it's a main route table
                    if is_main_route_table:
                        findings['issues'].append({
                            'resource_id': rt_id,
                            'issue': f'Main route table in {vpc_id} has no peering routes',
                            'severity': 'MEDIUM'
                        })
                    else:
                        # Non-main route tables without peering routes might be intentional
                        findings['passed_checks'] += 1
            else:
                findings['passed_checks'] += 1

    except Exception as e:
        logger.error(f"Error checking route tables: {str(e)}")
        findings['issues'].append({
            'resource_id': 'N/A',
            'issue': f'Failed to check route tables: {str(e)}',
            'severity': 'CRITICAL'
        })
        findings['total_checks'] = 1

    return findings


def check_cross_account_resources(peer_account_ids: List[str], role_name: str) -> Dict[str, Any]:
    """
    Assume role in peer accounts and validate resources
    """
    findings = {
        'check_name': 'Cross-Account Resource Validation',
        'total_checks': len(peer_account_ids),
        'passed_checks': 0,
        'issues': []
    }

    for account_id in peer_account_ids:
        if not account_id:
            continue

        try:
            # Assume role in peer account
            role_arn = f"arn:aws:iam::{account_id}:role/{role_name}"
            assumed_role = sts.assume_role(
                RoleArn=role_arn,
                RoleSessionName='ComplianceCheckSession'
            )

            # Create EC2 client with assumed role credentials
            peer_ec2 = boto3.client(
                'ec2',
                aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
                aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
                aws_session_token=assumed_role['Credentials']['SessionToken']
            )

            # Check if VPCs exist in peer account
            response = peer_ec2.describe_vpcs()

            if response['Vpcs']:
                findings['passed_checks'] += 1
                logger.info(f"Successfully validated resources in account {account_id}")
            else:
                findings['issues'].append({
                    'resource_id': account_id,
                    'issue': 'No VPCs found in peer account',
                    'severity': 'LOW'
                })

        except Exception as e:
            logger.warning(f"Could not validate resources in account {account_id}: {str(e)}")
            findings['issues'].append({
                'resource_id': account_id,
                'issue': f'Failed to assume role or validate resources: {str(e)}',
                'severity': 'MEDIUM'
            })

    return findings


def publish_compliance_metrics(findings: Dict[str, Any]):
    """
    Publish compliance metrics to CloudWatch
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='Corp/VPCPeering/Compliance',
            MetricData=[
                {
                    'MetricName': 'ComplianceScore',
                    'Value': findings['compliance_score'],
                    'Unit': 'Percent',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'PassedChecks',
                    'Value': findings['passed_checks'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                },
                {
                    'MetricName': 'FailedChecks',
                    'Value': findings['failed_checks'],
                    'Unit': 'Count',
                    'Timestamp': datetime.utcnow()
                }
            ]
        )
        logger.info("Published compliance metrics to CloudWatch")
    except Exception as e:
        logger.error(f"Error publishing metrics: {str(e)}")


def send_sns_notification(topic_arn: str, findings: Dict[str, Any]):
    """
    Send SNS notification with compliance findings
    """
    try:
        # Create summary message
        message = f"""
VPC Peering Compliance Check Results

Compliance Score: {findings['compliance_score']:.2f}%
Passed Checks: {findings['passed_checks']}
Failed Checks: {findings['failed_checks']}
Total Checks: {findings['passed_checks'] + findings['failed_checks']}

Issues Found:
"""

        for check in findings['checks']:
            if check['issues']:
                message += f"\n{check['check_name']}:\n"
                for issue in check['issues']:
                    message += f"  - [{issue['severity']}] {issue['resource_id']}: {issue['issue']}\n"

        # Send notification
        sns.publish(
            TopicArn=topic_arn,
            Subject=f"VPC Peering Compliance Alert - {findings['compliance_score']:.2f}%",
            Message=message
        )
        logger.info("Sent SNS notification")
    except Exception as e:
        logger.error(f"Error sending SNS notification: {str(e)}")
