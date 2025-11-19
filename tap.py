#!/usr/bin/env python
"""Multi-region disaster recovery infrastructure entry point for CDKTF."""
import sys
import os
from datetime import datetime, timezone
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from cdktf import App
from lib.tap_stack import GlobalResourcesStack, PrimaryRegionStack, DrRegionStack

# Get environment variables from the environment or use defaults
environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
state_bucket = os.getenv("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states")
state_bucket_region = os.getenv("TERRAFORM_STATE_BUCKET_REGION", "us-east-1")
repository_name = os.getenv("REPOSITORY", "unknown")
commit_author = os.getenv("COMMIT_AUTHOR", "unknown")
pr_number = os.getenv("PR_NUMBER", "unknown")
team = os.getenv("TEAM", "unknown")
created_at = datetime.now(timezone.utc).isoformat()

# default_tags is structured in adherence to the AwsProvider default_tags interface
default_tags = {
    "tags": {
        "Environment": environment_suffix,
        "Repository": repository_name,
        "Author": commit_author,
        "PRNumber": pr_number,
        "Team": team,
        "CreatedAt": created_at,
    }
}

app = App()

# Create the GlobalResourcesStack first (creates Aurora Global Cluster and DynamoDB Global Table)
global_stack = GlobalResourcesStack(
    app,
    f"GlobalResources{environment_suffix}",
    environment_suffix=environment_suffix,
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags,
)

# Create the PrimaryRegionStack (us-east-1)
primary_stack = PrimaryRegionStack(
    app,
    f"PrimaryRegion{environment_suffix}",
    environment_suffix=environment_suffix,
    aws_region="us-east-1",
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags,
    global_cluster_id=global_stack.global_cluster_id,
)

# Create the DrRegionStack (us-east-2)
dr_stack = DrRegionStack(
    app,
    f"DrRegion{environment_suffix}",
    environment_suffix=environment_suffix,
    aws_region="us-east-2",
    state_bucket=state_bucket,
    state_bucket_region=state_bucket_region,
    default_tags=default_tags,
    global_cluster_id=global_stack.global_cluster_id,
    primary_logs_bucket=primary_stack.logs_bucket,
    primary_docs_bucket=primary_stack.docs_bucket,
    primary_sns_topic_arn=primary_stack.sns_topic_arn,
)

# NOTE: For VPC peering and Route53 configuration, you would typically need to:
# 1. Deploy GlobalResourcesStack first
# 2. Deploy PrimaryRegionStack and DrRegionStack
# 3. Update GlobalResourcesStack with VPC IDs and ALB DNS names
# 4. Redeploy GlobalResourcesStack to configure peering and Route53
#
# This could be handled through a multi-stage deployment or by using
# CDKTF's dependency management features.

# Synthesize the app to generate the Terraform configuration
app.synth()
