We're getting hit with a surprisingly high AWS bill, and the security team is raising alarms about our account hygiene. We need a Python script using Boto3 to run an automated audit and find the biggest problems.

The script needs to do three specific things:

1.  **Find "zombie" volumes:** Go through all EBS volumes in `us-east-1` and find any that are in the 'available' state. These are unattached and costing us money for no reason.
2.  **Identify wide-open security groups:** Scan all our security groups and flag any that have inbound rules open to the world (`0.0.0.0/0` or `::/0`) on any port. This is a critical security risk we need to shut down.
3.  **Check log costs:** Our CloudWatch bill is high. The script needs to calculate the average size of log streams for our main application log groups (e.g., `/aws/lambda/production-app-*`) so we can find which services are being too noisy.

The script should run, perform these checks, and then output the findings into two files: a `report.json` for our dashboard to ingest and a `report.csv` for our FinOps team to analyze in Excel.

Since this will be part of our CI, it must be testable. The CI pipeline will run a Moto server on port 5001 for mocking AWS services. Please provide:

1. Main analysis script at `lib/analyse.py`
2. Test file at `test/test-analysis-audit.py` that uses `moto` mocks to prove the detection logic works (e.g., it can correctly find a mock 'available' volume)

Please provide the final code in separate, labeled code blocks for `lib/analyse.py` and `test/test-analysis-audit.py`.
