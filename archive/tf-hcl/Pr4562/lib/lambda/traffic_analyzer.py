"""
VPC Traffic Analyzer Lambda Function

Analyzes VPC Flow Logs hourly to detect anomalies and publish metrics.
Queries CloudWatch Logs Insights API for the last hour of traffic data.
"""

import json
import os
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Tuple
from collections import defaultdict
import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
logs_client = boto3.client('logs')
cloudwatch_client = boto3.client('cloudwatch')
sns_client = boto3.client('sns')

# Environment variables
VPC_A_LOG_GROUP = os.environ['VPC_A_LOG_GROUP']
VPC_B_LOG_GROUP = os.environ['VPC_B_LOG_GROUP']
TRAFFIC_BASELINE = int(os.environ.get('TRAFFIC_BASELINE', 417))
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ALLOWED_PORTS = set(os.environ.get('ALLOWED_PORTS', '443,8080,3306').split(','))
ANOMALY_THRESHOLD_PERCENT = int(os.environ.get('ANOMALY_THRESHOLD', 20))
VPC_A_CIDR = os.environ['VPC_A_CIDR']
VPC_B_CIDR = os.environ['VPC_B_CIDR']

# Constants
NAMESPACE = 'Company/VPCPeering'
QUERY_TIMEOUT = 60  # seconds
POLL_INTERVAL = 2  # seconds


def lambda_handler(event, context):
    """
    Main Lambda handler function.

    Args:
        event: Lambda event object
        context: Lambda context object

    Returns:
        dict: Response with status code and results
    """
    try:
        print(f"Starting VPC traffic analysis at {datetime.utcnow().isoformat()}")

        # Calculate time range (last hour)
        end_time = datetime.utcnow()
        start_time = end_time - timedelta(hours=1)

        # Analyze both VPCs
        vpc_a_results = analyze_vpc_traffic(VPC_A_LOG_GROUP, 'VPC-A', start_time, end_time)
        vpc_b_results = analyze_vpc_traffic(VPC_B_LOG_GROUP, 'VPC-B', start_time, end_time)

        # Detect anomalies
        anomalies = detect_anomalies(vpc_a_results, vpc_b_results)

        # Publish custom metrics
        publish_metrics(vpc_a_results, 'VPC-A')
        publish_metrics(vpc_b_results, 'VPC-B')

        # Send SNS alert if anomalies detected
        if anomalies:
            send_anomaly_alert(anomalies, vpc_a_results, vpc_b_results)

        results = {
            'VPC-A': vpc_a_results,
            'VPC-B': vpc_b_results,
            'anomalies': anomalies,
            'timestamp': end_time.isoformat()
        }

        print(f"Analysis complete. Found {len(anomalies)} anomalies.")

        return {
            'statusCode': 200,
            'body': json.dumps(results, default=str)
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def analyze_vpc_traffic(log_group: str, vpc_name: str, start_time: datetime, end_time: datetime) -> Dict[str, Any]:
    """
    Analyze traffic for a specific VPC using CloudWatch Logs Insights.

    Args:
        log_group: CloudWatch log group name
        vpc_name: Name of the VPC (for logging)
        start_time: Start time for query
        end_time: End time for query

    Returns:
        dict: Analysis results containing traffic metrics
    """
    print(f"Analyzing traffic for {vpc_name}")

    # CloudWatch Logs Insights query
    query = """
    fields @timestamp, srcaddr, dstaddr, srcport, dstport, protocol, action, bytes
    | stats count() as request_count,
            count_distinct(srcaddr) as unique_sources,
            count_distinct(dstaddr) as unique_destinations,
            sum(bytes) as total_bytes
    """

    try:
        # Start query
        query_id = start_logs_query(log_group, query, start_time, end_time)

        # Wait for query to complete
        results = wait_for_query_completion(query_id)

        # Parse results
        metrics = parse_query_results(results)

        # Get detailed breakdown
        source_ip_counts = get_source_ip_breakdown(log_group, start_time, end_time)
        rejected_count = get_rejected_connections_count(log_group, start_time, end_time)
        port_breakdown = get_port_breakdown(log_group, start_time, end_time)
        external_traffic = get_external_traffic_count(log_group, start_time, end_time)

        return {
            'total_requests': metrics.get('request_count', 0),
            'unique_sources': metrics.get('unique_sources', 0),
            'unique_destinations': metrics.get('unique_destinations', 0),
            'total_bytes': metrics.get('total_bytes', 0),
            'rejected_connections': rejected_count,
            'top_source_ips': source_ip_counts[:10],  # Top 10
            'port_breakdown': port_breakdown,
            'external_traffic_count': external_traffic,
            'vpc_name': vpc_name,
            'log_group': log_group
        }

    except Exception as e:
        print(f"Error analyzing {vpc_name}: {str(e)}")
        return {
            'total_requests': 0,
            'error': str(e),
            'vpc_name': vpc_name
        }


def start_logs_query(log_group: str, query: str, start_time: datetime, end_time: datetime) -> str:
    """
    Start a CloudWatch Logs Insights query.

    Args:
        log_group: CloudWatch log group name
        query: Query string
        start_time: Start time
        end_time: End time

    Returns:
        str: Query ID
    """
    response = logs_client.start_query(
        logGroupName=log_group,
        startTime=int(start_time.timestamp()),
        endTime=int(end_time.timestamp()),
        queryString=query
    )
    return response['queryId']


def wait_for_query_completion(query_id: str) -> List[Dict]:
    """
    Wait for a CloudWatch Logs Insights query to complete.

    Args:
        query_id: Query ID

    Returns:
        list: Query results
    """
    elapsed_time = 0

    while elapsed_time < QUERY_TIMEOUT:
        response = logs_client.get_query_results(queryId=query_id)
        status = response['status']

        if status == 'Complete':
            return response['results']
        elif status == 'Failed':
            raise Exception(f"Query failed: {query_id}")
        elif status == 'Cancelled':
            raise Exception(f"Query cancelled: {query_id}")

        time.sleep(POLL_INTERVAL)
        elapsed_time += POLL_INTERVAL

    raise Exception(f"Query timeout after {QUERY_TIMEOUT} seconds")


def parse_query_results(results: List[Dict]) -> Dict[str, Any]:
    """
    Parse CloudWatch Logs Insights query results.

    Args:
        results: Raw query results

    Returns:
        dict: Parsed metrics
    """
    if not results:
        return {}

    metrics = {}
    for field in results[0]:
        field_name = field['field']
        field_value = field['value']

        # Convert to appropriate type
        if field_name in ['request_count', 'unique_sources', 'unique_destinations']:
            metrics[field_name] = int(float(field_value))
        elif field_name == 'total_bytes':
            metrics[field_name] = int(float(field_value))
        else:
            metrics[field_name] = field_value

    return metrics


def get_source_ip_breakdown(log_group: str, start_time: datetime, end_time: datetime) -> List[Tuple[str, int]]:
    """
    Get traffic breakdown by source IP address.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        list: List of (source_ip, count) tuples sorted by count descending
    """
    query = """
    fields srcaddr
    | stats count() as request_count by srcaddr
    | sort request_count desc
    | limit 20
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        breakdown = []
        for result in results:
            srcaddr = None
            count = 0

            for field in result:
                if field['field'] == 'srcaddr':
                    srcaddr = field['value']
                elif field['field'] == 'request_count':
                    count = int(float(field['value']))

            if srcaddr:
                breakdown.append((srcaddr, count))

        return breakdown

    except Exception as e:
        print(f"Error getting source IP breakdown: {str(e)}")
        return []


def get_rejected_connections_count(log_group: str, start_time: datetime, end_time: datetime) -> int:
    """
    Get count of rejected connections.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        int: Number of rejected connections
    """
    query = """
    fields @timestamp
    | filter action = "REJECT"
    | stats count() as rejected_count
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        if results and len(results) > 0:
            for field in results[0]:
                if field['field'] == 'rejected_count':
                    return int(float(field['value']))

        return 0

    except Exception as e:
        print(f"Error getting rejected connections: {str(e)}")
        return 0


def get_port_breakdown(log_group: str, start_time: datetime, end_time: datetime) -> Dict[str, int]:
    """
    Get traffic breakdown by destination port.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        dict: Port to count mapping
    """
    query = """
    fields dstport
    | stats count() as request_count by dstport
    | sort request_count desc
    | limit 20
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        breakdown = {}
        for result in results:
            port = None
            count = 0

            for field in result:
                if field['field'] == 'dstport':
                    port = field['value']
                elif field['field'] == 'request_count':
                    count = int(float(field['value']))

            if port:
                breakdown[port] = count

        return breakdown

    except Exception as e:
        print(f"Error getting port breakdown: {str(e)}")
        return {}


def get_external_traffic_count(log_group: str, start_time: datetime, end_time: datetime) -> int:
    """
    Get count of traffic from outside the peered VPC CIDR ranges.

    Args:
        log_group: CloudWatch log group name
        start_time: Start time
        end_time: End time

    Returns:
        int: Number of external traffic entries
    """
    # Note: This is a simplified check. In production, you'd want more sophisticated IP range checking.
    query = f"""
    fields srcaddr
    | filter srcaddr not like /^10\\.0\\./
    | filter srcaddr not like /^10\\.1\\./
    | stats count() as external_count
    """

    try:
        query_id = start_logs_query(log_group, query, start_time, end_time)
        results = wait_for_query_completion(query_id)

        if results and len(results) > 0:
            for field in results[0]:
                if field['field'] == 'external_count':
                    return int(float(field['value']))

        return 0

    except Exception as e:
        print(f"Error getting external traffic count: {str(e)}")
        return 0


def detect_anomalies(vpc_a_results: Dict, vpc_b_results: Dict) -> List[Dict[str, Any]]:
    """
    Detect anomalies in VPC traffic.

    Args:
        vpc_a_results: VPC-A analysis results
        vpc_b_results: VPC-B analysis results

    Returns:
        list: List of detected anomalies
    """
    anomalies = []

    # Check traffic volume spikes (VPC-A)
    vpc_a_traffic = vpc_a_results.get('total_requests', 0)
    threshold = TRAFFIC_BASELINE * (1 + ANOMALY_THRESHOLD_PERCENT / 100)

    if vpc_a_traffic > threshold:
        anomalies.append({
            'type': 'traffic_spike',
            'vpc': 'VPC-A',
            'description': f'Traffic volume ({vpc_a_traffic}) exceeds baseline ({TRAFFIC_BASELINE}) by more than {ANOMALY_THRESHOLD_PERCENT}%',
            'severity': 'high',
            'current_value': vpc_a_traffic,
            'threshold': threshold
        })

    # Check traffic volume spikes (VPC-B)
    vpc_b_traffic = vpc_b_results.get('total_requests', 0)

    if vpc_b_traffic > threshold:
        anomalies.append({
            'type': 'traffic_spike',
            'vpc': 'VPC-B',
            'description': f'Traffic volume ({vpc_b_traffic}) exceeds baseline ({TRAFFIC_BASELINE}) by more than {ANOMALY_THRESHOLD_PERCENT}%',
            'severity': 'high',
            'current_value': vpc_b_traffic,
            'threshold': threshold
        })

    # Check for unexpected ports (VPC-A)
    for port, count in vpc_a_results.get('port_breakdown', {}).items():
        if port not in ALLOWED_PORTS and count > 10:  # More than 10 requests to unexpected port
            anomalies.append({
                'type': 'unexpected_port',
                'vpc': 'VPC-A',
                'description': f'Unexpected port {port} has {count} requests',
                'severity': 'medium',
                'port': port,
                'count': count
            })

    # Check for unexpected ports (VPC-B)
    for port, count in vpc_b_results.get('port_breakdown', {}).items():
        if port not in ALLOWED_PORTS and count > 10:
            anomalies.append({
                'type': 'unexpected_port',
                'vpc': 'VPC-B',
                'description': f'Unexpected port {port} has {count} requests',
                'severity': 'medium',
                'port': port,
                'count': count
            })

    # Check for external traffic
    vpc_a_external = vpc_a_results.get('external_traffic_count', 0)
    if vpc_a_external > 50:  # Threshold for external traffic
        anomalies.append({
            'type': 'external_traffic',
            'vpc': 'VPC-A',
            'description': f'Detected {vpc_a_external} connections from external IPs',
            'severity': 'high',
            'count': vpc_a_external
        })

    vpc_b_external = vpc_b_results.get('external_traffic_count', 0)
    if vpc_b_external > 50:
        anomalies.append({
            'type': 'external_traffic',
            'vpc': 'VPC-B',
            'description': f'Detected {vpc_b_external} connections from external IPs',
            'severity': 'high',
            'count': vpc_b_external
        })

    # Check rejected connections
    vpc_a_rejected = vpc_a_results.get('rejected_connections', 0)
    if vpc_a_rejected > 100:  # High number of rejections
        anomalies.append({
            'type': 'high_rejections',
            'vpc': 'VPC-A',
            'description': f'High number of rejected connections: {vpc_a_rejected}',
            'severity': 'medium',
            'count': vpc_a_rejected
        })

    vpc_b_rejected = vpc_b_results.get('rejected_connections', 0)
    if vpc_b_rejected > 100:
        anomalies.append({
            'type': 'high_rejections',
            'vpc': 'VPC-B',
            'description': f'High number of rejected connections: {vpc_b_rejected}',
            'severity': 'medium',
            'count': vpc_b_rejected
        })

    return anomalies


def publish_metrics(results: Dict, vpc_name: str):
    """
    Publish custom metrics to CloudWatch.

    Args:
        results: Analysis results
        vpc_name: Name of VPC
    """
    try:
        metrics = [
            {
                'MetricName': 'TotalRequests',
                'Value': results.get('total_requests', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'UniqueSourceIPs',
                'Value': results.get('unique_sources', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'RejectedConnections',
                'Value': results.get('rejected_connections', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'ExternalTraffic',
                'Value': results.get('external_traffic_count', 0),
                'Unit': 'Count',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            },
            {
                'MetricName': 'TotalBytes',
                'Value': results.get('total_bytes', 0),
                'Unit': 'Bytes',
                'Dimensions': [
                    {'Name': 'VPC', 'Value': vpc_name}
                ]
            }
        ]

        cloudwatch_client.put_metric_data(
            Namespace=NAMESPACE,
            MetricData=metrics
        )

        print(f"Published {len(metrics)} metrics for {vpc_name}")

    except Exception as e:
        print(f"Error publishing metrics for {vpc_name}: {str(e)}")


def send_anomaly_alert(anomalies: List[Dict], vpc_a_results: Dict, vpc_b_results: Dict):
    """
    Send SNS alert for detected anomalies.

    Args:
        anomalies: List of detected anomalies
        vpc_a_results: VPC-A analysis results
        vpc_b_results: VPC-B analysis results
    """
    try:
        # Build alert message
        subject = f"VPC Peering Anomaly Alert - {len(anomalies)} anomalies detected"

        message_parts = [
            "VPC Peering Traffic Analysis Alert",
            "=" * 50,
            f"\nTimestamp: {datetime.utcnow().isoformat()}Z",
            f"\nDetected {len(anomalies)} anomalies:\n"
        ]

        # Group anomalies by severity
        high_severity = [a for a in anomalies if a.get('severity') == 'high']
        medium_severity = [a for a in anomalies if a.get('severity') == 'medium']

        if high_severity:
            message_parts.append("\nHIGH SEVERITY ANOMALIES:")
            for anomaly in high_severity:
                message_parts.append(f"  - [{anomaly['vpc']}] {anomaly['description']}")

        if medium_severity:
            message_parts.append("\nMEDIUM SEVERITY ANOMALIES:")
            for anomaly in medium_severity:
                message_parts.append(f"  - [{anomaly['vpc']}] {anomaly['description']}")

        # Add traffic summary
        message_parts.extend([
            "\n" + "=" * 50,
            "\nTRAFFIC SUMMARY:",
            f"\nVPC-A:",
            f"  Total Requests: {vpc_a_results.get('total_requests', 0)}",
            f"  Rejected Connections: {vpc_a_results.get('rejected_connections', 0)}",
            f"  External Traffic: {vpc_a_results.get('external_traffic_count', 0)}",
            f"\nVPC-B:",
            f"  Total Requests: {vpc_b_results.get('total_requests', 0)}",
            f"  Rejected Connections: {vpc_b_results.get('rejected_connections', 0)}",
            f"  External Traffic: {vpc_b_results.get('external_traffic_count', 0)}",
        ])

        # Add top source IPs
        if vpc_a_results.get('top_source_ips'):
            message_parts.append("\nVPC-A Top Source IPs:")
            for ip, count in vpc_a_results['top_source_ips'][:5]:
                message_parts.append(f"  {ip}: {count} requests")

        if vpc_b_results.get('top_source_ips'):
            message_parts.append("\nVPC-B Top Source IPs:")
            for ip, count in vpc_b_results['top_source_ips'][:5]:
                message_parts.append(f"  {ip}: {count} requests")

        message_parts.append("\n" + "=" * 50)
        message_parts.append("\nThis is an automated alert from VPC Traffic Analyzer Lambda")

        message = "\n".join(message_parts)

        # Publish to SNS
        response = sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=subject,
            Message=message
        )

        print(f"Sent anomaly alert to SNS. MessageId: {response['MessageId']}")

    except Exception as e:
        print(f"Error sending SNS alert: {str(e)}")
