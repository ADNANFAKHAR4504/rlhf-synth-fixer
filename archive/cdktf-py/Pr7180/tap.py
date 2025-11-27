#!/usr/bin/env python
from cdktf import App
from lib.tenant_stack import TenantStack
import os

def main():
    app = App()

    # Get environment suffix from environment variable or default
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')

    # Get AWS region from environment or file
    aws_region = os.environ.get('AWS_REGION', 'us-east-1')
    if os.path.exists('lib/AWS_REGION'):
        with open('lib/AWS_REGION', 'r') as f:
            aws_region = f.read().strip()

    # Define tenants with non-overlapping CIDR blocks
    tenants = [
        {"id": "acme-corp", "cidr": "10.0.0.0/16"},
        {"id": "tech-startup", "cidr": "10.1.0.0/16"},
        {"id": "retail-co", "cidr": "10.2.0.0/16"}
    ]

    # Central log group name for all tenants
    central_log_group_name = f"/aws/saas/centralized-logs-{environment_suffix}"

    # Create stack for each tenant
    for tenant in tenants:
        TenantStack(
            app,
            tenant_id=tenant["id"],
            cidr_block=tenant["cidr"],
            environment_suffix=environment_suffix,
            aws_region=aws_region,
            central_log_group_name=central_log_group_name
        )

    app.synth()

if __name__ == "__main__":
    main()
