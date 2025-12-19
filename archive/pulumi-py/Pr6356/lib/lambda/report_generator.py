import json
import boto3
import os
from datetime import datetime, timedelta
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-east-2'))
s3 = boto3.client('s3', region_name=os.environ.get('REGION', 'us-east-2'))

table_name = os.environ.get('TABLE_NAME')
bucket_name = os.environ.get('BUCKET_NAME')
table = dynamodb.Table(table_name)

def handler(event, context):
    """
    Lambda handler for generating daily fraud reports
    Triggered by EventBridge scheduled rule (daily at midnight UTC)
    """

    try:
        print("Starting daily fraud report generation")

        # Generate report for previous day
        report_date = datetime.utcnow() - timedelta(days=1)
        report = generate_daily_report(report_date)

        # Save report to S3
        save_report_to_s3(report, report_date)

        print("Daily fraud report generation completed successfully")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Daily fraud report generated successfully',
                'reportDate': report_date.strftime('%Y-%m-%d')
            })
        }

    except Exception as e:
        print(f"Error generating daily report: {str(e)}")
        raise

def generate_daily_report(report_date):
    """Generate comprehensive fraud report for a specific date"""

    try:
        print(f"Generating report for date: {report_date.strftime('%Y-%m-%d')}")

        # Calculate timestamp range for the day
        start_timestamp = int(report_date.replace(hour=0, minute=0, second=0, microsecond=0).timestamp() * 1000)
        end_timestamp = int(report_date.replace(hour=23, minute=59, second=59, microsecond=999999).timestamp() * 1000)

        # Scan transactions for the day
        transactions = []
        last_evaluated_key = None

        while True:
            scan_kwargs = {
                'FilterExpression': '#ts BETWEEN :start AND :end',
                'ExpressionAttributeNames': {
                    '#ts': 'timestamp'
                },
                'ExpressionAttributeValues': {
                    ':start': start_timestamp,
                    ':end': end_timestamp
                }
            }

            if last_evaluated_key:
                scan_kwargs['ExclusiveStartKey'] = last_evaluated_key

            response = table.scan(**scan_kwargs)
            transactions.extend(response.get('Items', []))

            last_evaluated_key = response.get('LastEvaluatedKey')
            if not last_evaluated_key:
                break

        print(f"Found {len(transactions)} transactions for the day")

        # Analyze transactions
        total_transactions = len(transactions)
        fraud_detected = sum(1 for t in transactions if t.get('status') == 'fraud_detected')
        suspicious = sum(1 for t in transactions if t.get('status') == 'suspicious')
        approved = sum(1 for t in transactions if t.get('status') == 'approved')
        pending = sum(1 for t in transactions if t.get('status') == 'pending')

        total_amount = sum(float(t.get('amount', 0)) for t in transactions)
        fraud_amount = sum(float(t.get('amount', 0)) for t in transactions if t.get('status') == 'fraud_detected')

        # Calculate average fraud score
        fraud_scores = [float(t.get('fraudScore', 0)) for t in transactions]
        avg_fraud_score = sum(fraud_scores) / len(fraud_scores) if fraud_scores else 0

        # Identify top fraud cases
        fraud_cases = sorted(
            [t for t in transactions if t.get('status') == 'fraud_detected'],
            key=lambda x: float(x.get('fraudScore', 0)),
            reverse=True
        )[:10]  # Top 10 fraud cases

        # Build report
        report = {
            'reportDate': report_date.strftime('%Y-%m-%d'),
            'generatedAt': datetime.utcnow().isoformat(),
            'summary': {
                'totalTransactions': total_transactions,
                'fraudDetected': fraud_detected,
                'suspicious': suspicious,
                'approved': approved,
                'pending': pending,
                'fraudRate': round(fraud_detected / total_transactions * 100, 2) if total_transactions > 0 else 0,
                'totalAmount': round(total_amount, 2),
                'fraudAmount': round(fraud_amount, 2),
                'averageFraudScore': round(avg_fraud_score, 4)
            },
            'topFraudCases': [
                {
                    'transactionId': case['transactionId'],
                    'customerId': case['customerId'],
                    'amount': float(case['amount']),
                    'fraudScore': float(case['fraudScore']),
                    'timestamp': case['timestamp']
                }
                for case in fraud_cases
            ],
            'recommendations': generate_recommendations(
                fraud_detected,
                total_transactions,
                avg_fraud_score
            )
        }

        return report

    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise

def generate_recommendations(fraud_count, total_count, avg_score):
    """Generate recommendations based on fraud analysis"""

    recommendations = []

    if total_count == 0:
        recommendations.append("No transactions processed today. Monitor system health.")
        return recommendations

    fraud_rate = fraud_count / total_count * 100

    if fraud_rate > 5:
        recommendations.append(
            f"HIGH ALERT: Fraud rate is {fraud_rate:.2f}%. Immediate investigation required."
        )
    elif fraud_rate > 2:
        recommendations.append(
            f"WARNING: Fraud rate is {fraud_rate:.2f}%. Enhanced monitoring recommended."
        )
    else:
        recommendations.append(
            f"Fraud rate is within normal range ({fraud_rate:.2f}%)."
        )

    if avg_score > 0.5:
        recommendations.append(
            "Average fraud score is elevated. Review transaction patterns."
        )

    if fraud_count > 0:
        recommendations.append(
            f"Review {fraud_count} flagged transactions for false positives."
        )

    recommendations.append("Continue monitoring transaction patterns and update fraud rules as needed.")

    return recommendations

def save_report_to_s3(report, report_date):
    """Save the generated report to S3"""

    try:
        # Create S3 key with date partitioning
        date_str = report_date.strftime('%Y/%m/%d')
        s3_key = f"daily-reports/{date_str}/fraud-report.json"

        # Upload to S3
        s3.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json',
            Metadata={
                'report-date': report_date.strftime('%Y-%m-%d'),
                'generated-at': datetime.utcnow().isoformat()
            }
        )

        print(f"Report saved to S3: {s3_key}")

        # Also save a "latest" copy for easy access
        latest_key = "daily-reports/latest/fraud-report.json"
        s3.put_object(
            Bucket=bucket_name,
            Key=latest_key,
            Body=json.dumps(report, indent=2),
            ContentType='application/json',
            Metadata={
                'report-date': report_date.strftime('%Y-%m-%d'),
                'generated-at': datetime.utcnow().isoformat()
            }
        )

        print(f"Latest report updated: {latest_key}")

    except Exception as e:
        print(f"Error saving report to S3: {str(e)}")
        raise
