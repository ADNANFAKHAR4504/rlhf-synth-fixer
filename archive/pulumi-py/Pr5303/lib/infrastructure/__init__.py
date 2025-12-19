"""
Infrastructure module for the TAP (Test Automation Platform) AWS environment.

This module contains all infrastructure components organized by logical grouping:
- config: Centralized configuration and naming conventions
- networking: VPC, subnets, gateways, and routing
- security: Security groups and network ACLs
- iam: IAM roles, policies, and instance profiles
- compute: EC2 launch templates, Auto Scaling Groups, and scaling policies
- lambda_functions: Lambda functions for health monitoring
- monitoring: CloudWatch alarms and EventBridge rules
"""

