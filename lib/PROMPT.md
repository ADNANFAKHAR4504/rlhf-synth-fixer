# AWS Resource Audit Script
An operations team needs visibility into unused and misconfigured resources in their AWS environment to optimize costs and improve security posture.

Create a Python script using Boto3 that audits AWS resources and identifies unused and misconfigured resources for the operations team. The resources to audit are EBS volumes, security groups, and CloudWatch log stream metrics. The requirements are as follows:

Requirements:
List unused EBS volumes.
Detect the public security groups.
Compute average CloudWatch log stream size.
Output results in JSON
The script should be called lib/analyse.py