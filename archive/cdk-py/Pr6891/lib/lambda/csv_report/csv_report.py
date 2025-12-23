import json
import boto3
import os
import csv
from io import StringIO
from datetime import datetime

s3_client = boto3.client("s3")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def handler(event, context):
    """Generate CSV compliance report from scan results."""
    print(f"Generating CSV report. Event: {json.dumps(event)}")

    # Extract scan details from event
    detail = event.get("detail", {})
    scan_id = detail.get("scan_id")
    summary_key = detail.get("summary_key")

    if not summary_key:
        return {"statusCode": 400, "body": "No summary_key provided"}

    # Fetch scan results from S3
    try:
        response = s3_client.get_object(Bucket=AUDIT_BUCKET, Key=summary_key)
        scan_data = json.loads(response["Body"].read().decode("utf-8"))
    except Exception as e:
        print(f"Error fetching scan results: {str(e)}")
        return {"statusCode": 500, "body": f"Error: {str(e)}"}

    # Generate CSV report
    csv_buffer = StringIO()
    csv_writer = csv.writer(csv_buffer)

    # Write header
    csv_writer.writerow(
        [
            "Report ID",
            "Scan ID",
            "Scan Time",
            "Account ID",
            "Resource Type",
            "Resource ID",
            "Violation",
            "Severity",
            "Compliance Status",
        ]
    )

    # Get single account scan results
    results = scan_data.get("results", {})
    account_id = scan_data.get("account_id")
    scan_time = scan_data.get("scan_time")
    violations = results.get("violations", [])

    # Write data rows
    if violations:
        for violation in violations:
            csv_writer.writerow(
                [
                    context.request_id,
                    scan_id,
                    scan_time,
                    account_id,
                    violation.get("resource_type"),
                    violation.get("resource_id"),
                    violation.get("violation"),
                    violation.get("severity"),
                    "NON_COMPLIANT",
                ]
            )
    else:
        # Account is compliant
        csv_writer.writerow(
            [
                context.request_id,
                scan_id,
                scan_time,
                account_id,
                "N/A",
                "N/A",
                "No violations",
                "N/A",
                "COMPLIANT",
            ]
        )

    # Store CSV report in S3
    report_key = f"reports/csv/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.csv"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=report_key,
        Body=csv_buffer.getvalue(),
        ContentType="text/csv",
    )

    print(f"CSV report generated: s3://{AUDIT_BUCKET}/{report_key}")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "report_id": context.request_id,
                "report_location": f"s3://{AUDIT_BUCKET}/{report_key}",
                "format": "CSV",
            }
        ),
    }
