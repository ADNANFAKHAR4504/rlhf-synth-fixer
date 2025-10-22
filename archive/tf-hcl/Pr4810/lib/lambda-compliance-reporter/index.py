import json
import os
import boto3
import time
from datetime import datetime, timedelta

athena = boto3.client('athena')
s3 = boto3.client('s3')
sns = boto3.client('sns')

ATHENA_WORKGROUP = os.environ['ATHENA_WORKGROUP']
ATHENA_DATABASE = os.environ['ATHENA_DATABASE']
REPORTS_BUCKET = os.environ['REPORTS_BUCKET']
REPORT_EMAILS = json.loads(os.environ.get('REPORT_EMAILS', '[]'))


def lambda_handler(event, context):
    """
    Generate monthly compliance reports from CloudTrail logs
    """
    try:
        # Get previous month's date range
        today = datetime.utcnow()
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)

        # Query for monthly statistics
        query = f"""
        SELECT
            recipientAccountId as account_id,
            COUNT(*) as total_events,
            COUNT(DISTINCT eventName) as unique_event_types,
            COUNT(DISTINCT userIdentity.principalId) as unique_users
        FROM cloudtrail_logs
        WHERE eventTime >= timestamp '{first_day_last_month.isoformat()}'
          AND eventTime < timestamp '{first_day_this_month.isoformat()}'
        GROUP BY recipientAccountId
        """

        # Execute Athena query
        execution_id = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            WorkGroup=ATHENA_WORKGROUP
        )['QueryExecutionId']

        # Wait for completion
        while True:
            response = athena.get_query_execution(QueryExecutionId=execution_id)
            status = response['QueryExecution']['Status']['State']
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(2)

        if status != 'SUCCEEDED':
            raise Exception(f"Query failed: {status}")

        # Get results
        results = athena.get_query_results(QueryExecutionId=execution_id)

        # Generate report
        report = generate_report(results, first_day_last_month, last_day_last_month)

        # Save report to S3
        report_key = f"compliance-reports/{first_day_last_month.strftime('%Y-%m')}-report.json"
        s3.put_object(
            Bucket=REPORTS_BUCKET,
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ServerSideEncryption='aws:kms'
        )

        # Send notification
        if REPORT_EMAILS:
            send_report_notification(report, report_key)

        return {
            'statusCode': 200,
            'report_location': f"s3://{REPORTS_BUCKET}/{report_key}",
            'accounts_analyzed': len(report.get('accounts', []))
        }

    except Exception as e:
        print(f"Error generating compliance report: {str(e)}")
        raise


def generate_report(athena_results, start_date, end_date):
    """
    Generate compliance report from Athena results
    """
    accounts = []

    for row in athena_results['ResultSet']['Rows'][1:]:  # Skip header
        data = [col.get('VarCharValue', '') for col in row['Data']]
        accounts.append({
            'account_id': data[0],
            'total_events': int(data[1]) if data[1] else 0,
            'unique_event_types': int(data[2]) if data[2] else 0,
            'unique_users': int(data[3]) if data[3] else 0
        })

    return {
        'report_date': datetime.utcnow().isoformat(),
        'period_start': start_date.isoformat(),
        'period_end': end_date.isoformat(),
        'total_accounts': len(accounts),
        'accounts': accounts,
        'summary': {
            'total_events_all_accounts': sum(a['total_events'] for a in accounts),
            'average_events_per_account': sum(a['total_events'] for a in accounts) / len(accounts) if accounts else 0
        }
    }


def send_report_notification(report, report_key):
    """
    Send email notification about completed report
    """
    message = f"""
    Monthly CloudTrail Compliance Report Generated

    Report Period: {report['period_start']} to {report['period_end']}
    Total Accounts Analyzed: {report['total_accounts']}
    Total Events: {report['summary']['total_events_all_accounts']}

    Report Location: s3://{REPORTS_BUCKET}/{report_key}
    """

    # Would send via SNS topic if configured
    print(f"Report ready: {message}")
