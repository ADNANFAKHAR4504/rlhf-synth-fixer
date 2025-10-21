import json
import os
import boto3
import time
from datetime import datetime, timedelta

athena = boto3.client('athena')
dynamodb = boto3.client('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

ATHENA_WORKGROUP = os.environ['ATHENA_WORKGROUP']
ATHENA_DATABASE = os.environ['ATHENA_DATABASE']
FINDINGS_TABLE = os.environ['FINDINGS_TABLE']
SNS_CRITICAL = os.environ['SNS_CRITICAL_TOPIC']
SNS_HIGH = os.environ['SNS_HIGH_TOPIC']
FINDINGS_TTL_DAYS = int(os.environ.get('FINDINGS_TTL_DAYS', '90'))


def lambda_handler(event, context):
    """
    Analyze CloudTrail logs for security issues using Athena
    """
    try:
        # Query last hour's events
        query = """
        SELECT eventName, eventTime, userIdentity, sourceIPAddress, errorCode, errorMessage
        FROM cloudtrail_logs
        WHERE eventTime >= current_timestamp - interval '1' hour
        """

        execution_id = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            WorkGroup=ATHENA_WORKGROUP
        )['QueryExecutionId']

        # Wait for query completion
        while True:
            response = athena.get_query_execution(QueryExecutionId=execution_id)
            status = response['QueryExecution']['Status']['State']
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(2)

        if status != 'SUCCEEDED':
            raise Exception(f"Query failed with status: {status}")

        # Get results and analyze
        results = athena.get_query_results(QueryExecutionId=execution_id)
        findings = analyze_events(results)

        # Store findings
        for finding in findings:
            store_finding(finding)
            send_alert(finding)

        # Publish metrics
        cloudwatch.put_metric_data(
            Namespace='Security/CloudTrail',
            MetricData=[{
                'MetricName': 'SecurityFindings',
                'Value': len(findings),
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }]
        )

        return {'statusCode': 200, 'findingsCount': len(findings)}

    except Exception as e:
        print(f"Error in security analysis: {str(e)}")
        raise


def analyze_events(results):
    """
    Detect security issues from Athena results
    """
    findings = []

    for row in results['ResultSet']['Rows'][1:]:  # Skip header
        data = {col['VarCharValue'] if 'VarCharValue' in col else None
                for col in row['Data']}

        # Detect unauthorized access
        if data.get('errorCode') in ['AccessDenied', 'UnauthorizedOperation']:
            findings.append({
                'type': 'unauthorized_access',
                'severity': 'high',
                'details': data
            })

    return findings


def store_finding(finding):
    """
    Store finding in DynamoDB
    """
    ttl = int((datetime.utcnow() + timedelta(days=FINDINGS_TTL_DAYS)).timestamp())

    dynamodb.put_item(
        TableName=FINDINGS_TABLE,
        Item={
            'timestamp': {'S': datetime.utcnow().isoformat()},
            'finding_id': {'S': f"{finding['type']}-{int(time.time())}"},
            'finding_type': {'S': finding['type']},
            'severity': {'S': finding['severity']},
            'details': {'S': json.dumps(finding['details'])},
            'ttl': {'N': str(ttl)}
        }
    )


def send_alert(finding):
    """
    Send SNS alert based on severity
    """
    topic_arn = SNS_CRITICAL if finding['severity'] == 'critical' else SNS_HIGH

    sns.publish(
        TopicArn=topic_arn,
        Subject=f"Security Alert: {finding['type']}",
        Message=json.dumps(finding, indent=2)
    )
