import json
import boto3
import os
import time

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def lambda_handler(event, context):
    """
    Generates reconciliation report and sends notification via SNS.
    """
    try:
        reconciliation_id = event['reconciliation_id']
        valid_count = event['valid_count']
        invalid_count = event['invalid_count']
        discrepancies = event.get('discrepancies', [])
        
        # Get results table name from environment
        results_table_name = os.environ['RESULTS_TABLE']
        results_table = dynamodb.Table(results_table_name)
        
        # Update results with report generation timestamp
        timestamp = int(time.time())
        results_table.update_item(
            Key={
                'reconciliation_id': reconciliation_id,
                'timestamp': timestamp
            },
            UpdateExpression='SET report_generated = :ts, #status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':ts': timestamp,
                ':status': 'completed'
            }
        )
        
        # Generate report summary
        report = generate_report_summary(
            reconciliation_id, 
            valid_count, 
            invalid_count, 
            discrepancies
        )
        
        # Send notification via SNS
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        
        sns.publish(
            TopicArn=sns_topic_arn,
            Subject='Transaction Reconciliation Report',
            Message=report
        )
        
        return {
            'statusCode': 200,
            'reconciliation_id': reconciliation_id,
            'report': report,
            'notification_sent': True
        }
        
    except Exception as e:
        print(f"Error generating report: {str(e)}")
        raise

def generate_report_summary(reconciliation_id, valid_count, invalid_count, discrepancies):
    """
    Generates a formatted report summary.
    """
    total = valid_count + invalid_count
    success_rate = (valid_count / total * 100) if total > 0 else 0
    
    report = f"""
Transaction Reconciliation Report
==================================

Reconciliation ID: {reconciliation_id}
Completed: {time.strftime('%Y-%m-%d %H:%M:%S')}

Summary:
--------
Total Transactions: {total}
Valid Transactions: {valid_count}
Invalid Transactions: {invalid_count}
Success Rate: {success_rate:.2f}%

"""
    
    if discrepancies:
        report += "\nDiscrepancies Found:\n"
        report += "--------------------\n"
        for i, discrepancy in enumerate(discrepancies[:10], 1):
            report += f"{i}. Transaction ID: {discrepancy['transaction_id']}\n"
            report += f"   Reason: {discrepancy['reason']}\n"
            report += f"   Amount: {discrepancy['amount']}\n\n"
        
        if len(discrepancies) > 10:
            report += f"\n... and {len(discrepancies) - 10} more discrepancies.\n"
    else:
        report += "\nNo discrepancies found. All transactions validated successfully.\n"
    
    report += "\n" + "="*50 + "\n"
    
    return report
