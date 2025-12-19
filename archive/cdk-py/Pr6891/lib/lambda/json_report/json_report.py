import json
import boto3
import os
from datetime import datetime

s3_client = boto3.client("s3")

AUDIT_BUCKET = os.environ.get("AUDIT_BUCKET")
ENVIRONMENT_SUFFIX = os.environ.get("ENVIRONMENT_SUFFIX", "dev")


def handler(event, context):
    """Generate JSON compliance report from scan results."""
    print(f"Generating JSON report. Event: {json.dumps(event)}")

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

    # Get single account scan results
    results = scan_data.get("results", {})
    account_id = scan_data.get("account_id")

    # Generate comprehensive JSON report
    total_resources = results.get("resources_scanned", 0)
    total_violations = len(results.get("violations", []))

    report = {
        "report_id": context.request_id,
        "report_type": "JSON",
        "generated_at": datetime.utcnow().isoformat(),
        "scan_id": scan_id,
        "scan_time": scan_data.get("scan_time"),
        "account_id": account_id,
        "summary": {
            "total_resources": total_resources,
            "total_violations": total_violations,
            "compliant": results.get("compliant", False),
        },
        "detailed_results": results,
        "compliance_score": 0,
    }

    # Calculate compliance score
    if total_resources > 0:
        report["compliance_score"] = round(
            ((total_resources - total_violations) / total_resources) * 100, 2
        )

    # Store JSON report in S3
    report_key = f"reports/json/{datetime.utcnow().strftime('%Y/%m/%d')}/{context.request_id}.json"

    s3_client.put_object(
        Bucket=AUDIT_BUCKET,
        Key=report_key,
        Body=json.dumps(report, indent=2),
        ContentType="application/json",
    )

    print(f"JSON report generated: s3://{AUDIT_BUCKET}/{report_key}")

    return {
        "statusCode": 200,
        "body": json.dumps(
            {
                "report_id": report["report_id"],
                "report_location": f"s3://{AUDIT_BUCKET}/{report_key}",
                "compliance_score": report["compliance_score"],
            }
        ),
    }
