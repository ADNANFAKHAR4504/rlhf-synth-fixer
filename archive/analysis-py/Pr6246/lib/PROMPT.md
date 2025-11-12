We're running a cost and security audit on our Lambda functions in `us-east-1`. I need a Python script using Boto3 to run as a CLI tool and find a few specific problems.

Here's the analysis I need it to perform:

1.  **Find Over-Provisioned Functions:** Look for any Lambda with memory set over 3GB _but_ a timeout of less than 30 seconds. This combination seems wasteful for short-running tasks.
2.  **Find Unencrypted Environment Variables:** Scan all functions. If a function has environment variables defined, it _must_ have a KMS key configured for them. Flag any that don't.
3.  **Find Risky VPC Access:** For any function attached to a VPC, check its security groups. If _any_ of those groups have an outbound rule allowing all traffic (`0.0.0.0/0`) on all ports, that's a security risk. Flag that function.
4.  **Find Old Runtimes:** We have to clear out technical debt. The script needs to list all functions still running on deprecated runtimes like Python 3.7, Node.js 12, etc.

For the output, the script should print a clean, tabular report to the console, grouped by the issue type (e.g., "Over-Provisioned", "Old Runtimes"). It also needs to save all the findings in a `lambda_config_report.json` file.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`
