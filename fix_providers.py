#!/usr/bin/env python3
"""
Script to fix conditional provider assignments in Terraform configuration.
This script replaces conditional provider assignments with separate resource blocks for each region.
"""

import re
import sys

def read_file(filepath):
    with open(filepath, 'r') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w') as f:
        f.write(content)

def fix_provider_assignments(content):
    """Fix conditional provider assignments by creating separate resource blocks."""
    
    # List of resources that need to be split by region
    resources_to_fix = [
        # Subnets
        'aws_subnet.*public',
        'aws_subnet.*private',
        # Route tables
        'aws_route_table.*public',
        'aws_route_table.*private',
        # Route table associations
        'aws_route_table_association.*public',
        'aws_route_table_association.*private',
        # Security groups
        'aws_security_group.*web',
        'aws_security_group.*rds',
        # Database resources
        'aws_db_subnet_group.*main',
        'aws_db_instance.*main',
        # Lambda resources
        'aws_lambda_function.*rds_snapshot',
        'aws_cloudwatch_event_rule.*lambda_schedule',
        'aws_cloudwatch_event_target.*lambda_target',
        'aws_lambda_permission.*allow_cloudwatch',
        # EC2 resources
        'aws_launch_template.*main',
        'aws_instance.*main',
        # Load balancer resources
        'aws_lb.*main',
        'aws_lb_target_group.*main',
        'aws_lb_target_group_attachment.*main',
        'aws_lb_listener.*main',
        # CloudWatch
        'aws_cloudwatch_metric_alarm.*high_cpu',
        # CloudTrail
        'aws_cloudtrail.*main',
        'aws_s3_bucket_policy.*cloudtrail_logs'
    ]
    
    # Pattern to match conditional provider assignments
    conditional_pattern = r'provider\s*=\s*[^?]*\?\s*aws\.us_east_1\s*:\s*aws\.us_west_2'
    
    # Find all conditional provider assignments
    matches = re.finditer(conditional_pattern, content)
    
    print(f"Found {len(list(re.finditer(conditional_pattern, content)))} conditional provider assignments to fix")
    
    # For now, let's just identify the issues
    for match in re.finditer(conditional_pattern, content):
        start = max(0, match.start() - 100)
        end = min(len(content), match.end() + 100)
        context = content[start:end]
        print(f"Found conditional provider at position {match.start()}:")
        print(f"Context: ...{context}...")
        print("-" * 80)
    
    return content

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 fix_providers.py <terraform_file>")
        sys.exit(1)
    
    filepath = sys.argv[1]
    
    try:
        content = read_file(filepath)
        print(f"Processing {filepath}...")
        
        # Fix the provider assignments
        fixed_content = fix_provider_assignments(content)
        
        print("Analysis complete. Manual fixes required for remaining resources.")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
