We need to design an automated optimization system for a development environment deployed in the AWS us-east-1 region. The infrastructure was originally built to support up to 500k concurrent users for a video streaming platform, but current metrics show that usage rarely exceeds 150k users, with average CPU utilization around 25% and memory around 40%. This indicates significant over-provisioning, so the goal is to deploy the infrastructure using AWS CDK and then generate a boto3-based optimization script (optimize.py) that intelligently scales down resources based on CloudWatch metrics analysis.

The deployed stack should include a Aurora Serverless v2 PostgreSQL cluster configured with a minimum capacity of 4 ACUs, a maximum of 16 ACUs, and two reader instances, maintaining a 35-day backup retention policy. Alongside this, deploy an ElastiCache Redis cluster using the cache.r6g.xlarge instance type, consisting of 5 Multi-AZ nodes with automatic failover enabled. The ECS Fargate service should run 8 tasks, each configured with 2048 MB of memory and 1024 mCPU, behind an Application Load Balancer with an appropriate target group for routing traffic. A DynamoDB table should operate in provisioned mode with 500 RCU and 500 WCU, while three Lambda functions are configured with 3008 MB of memory, a 900-second timeout. S3 buckets will use Intelligent-Tiering for storage optimization.

Once the environment is deployed, the optimize.py script will analyze CloudWatch metrics from the past 30 days and automatically scale down over-provisioned components where utilization thresholds confirm low activity. Specifically, Aurora should reduce its minimum capacity to 1 ACU and maximum to 4 ACUs, remove one reader instance, and shorten backup retention to 7 days. ElastiCache should downgrade to the cache.r6g.large type with 3 nodes. ECS should reduce desired tasks to 3, each with 1024 MB memory and 512 mCPU. DynamoDB should switch from provisioned mode to on-demand billing, while Lambda functions should scale down to 1024 MB memory, 300s timeout, and 20 reserved concurrency each. For S3, Intelligent-Tiering should be replaced with a transition to Standard-IA after 30 days.

The optimization must be driven by real utilization data: Aurora instances should only scale down if CPU remains below 30% and active connections under 20 per instance; ElastiCache nodes if CPU < 25%, memory < 50%, and no evictions; ECS services if CPU < 20% and memory < 40%; DynamoDB if consumed capacity remains under 20% of provisioned throughput; and Lambda if p95 duration < 100 seconds and throttles = 0. Before applying any change, the script should validate these metrics to ensure safety.

The system should also implement a rollback mechanism that restores the original configuration if post-optimization metrics spike within 24 hours, ensuring stability and reliability. Additionally, the script should generate a detailed cost analysis report, comparing current and optimized monthly costs for each service, along with total monthly and annual savings estimates. The final JSON report should include the timestamp, analyzed resources, optimization details (before and after configuration, monthly costs, savings, utilization metrics), and rollback plan.

All API interactions must use boto3 clients for RDS, ElastiCache, ECS, DynamoDB, Lambda, S3, and CloudWatch, with robust handling of pagination, throttling, and AWS rate limits. The implementation must include a dry-run mode to simulate the optimization process without applying actual changes and should prompt for confirmation before making any production-impacting updates.

Please generate a complete, production-grade AWS CDK and boto3-based IaC solution that first provisions this infrastructure and then implements the described optimize.py script to automatically analyze metrics, apply safe scaling adjustments, calculate cost savings, and support rollback and dry-run functionality.

I need a single lib/tap_stack.py file for IAC deployment using AWS CDK in Python, and a separate optimize.py file for optimization using boto3.
This is my lib/tap.py (represents app.py):

```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core CDK application and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os

import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create a TapStackProps object to pass environment_suffix

props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```
