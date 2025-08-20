# PROMPT

CloudFormation Multi-Environment Management Solution
Objective:
Design a modular, secure, and automated AWS infrastructure-as-code solution using CloudFormation to manage development (dev), testing (test), and production (prod) environments with consistency, compliance, and scalability.

Technical Requirements
Multi-Environment Consistency:

Deploy identical infrastructure stacks across dev, test, and prod using parameterized CloudFormation templates.

All environments must reside in the same AWS Region (e.g., us-east-1).

IAM Least Privilege:

Define fine-grained IAM roles/policies for:

EC2 instances (web servers, worker nodes).

Lambda functions (if applicable).

CI/CD services (CodePipeline, CodeBuild).

Restrict cross-environment access (e.g., prod roles cannot modify dev resources).

Dynamic Configuration:

Use CloudFormation Parameters and Mappings to customize:

Instance types (e.g., t3.micro for dev, m5.large for prod).

Auto Scaling thresholds (min/max instances per environment).

Resource naming conventions (e.g., {Project}-{Env}-{Resource}).

Compliance via AWS Config:

Enable AWS Config with rules such as:

encrypted-volumes (EBS encryption).

restricted-ssh (block public SSH access in prod).

s3-bucket-public-read-prohibited.

Deploy remediation actions (e.g., auto-tag non-compliant resources).

CI/CD Automation:

CodePipeline Setup:

Source Stage: Pull infrastructure code from CodeCommit/GitHub.

Build Stage: Validate templates using CodeBuild.

Deploy Stage: Deploy stacks to dev test prod with manual approval for prod.

Environment-aware deployments: Use CloudFormation StackSets or nested stacks for cross-environment updates.

High Availability & Scalability:

Multi-AZ deployments: Spread resources across 2+ Availability Zones.

Auto Scaling Groups: Scale based on CloudWatch metrics (CPU/memory).

Load Balancers: ALB/NLB for fault-tolerant traffic distribution.

Monitoring with CloudWatch:

Dashboards: Per-environment metrics (CPU, latency, errors).

Alarms: Notify SNS for thresholds breaches (e.g., high CPU in prod).

Logs: Centralized logging for EC2, Lambda, and ALB.

Tagging Strategy:

Enforce tags (Environment, Owner, CostCenter) on all resources.

Use AWS Config Managed Rules to audit tagging compliance.

Expected Deliverables
YAML Templates:

main.yaml: Root template orchestrating environment deployments.

network.yaml: VPC, subnets, NAT gateways (shared across envs).

iam.yaml: Least-privilege IAM roles/policies.

pipeline.yaml: CI/CD pipeline definition.

monitoring.yaml: CloudWatch alarms/dashboards.

Parameter Files:

dev-params.json, test-params.json, prod-params.json with env-specific values.

Documentation:

Architecture Diagram: Show multi-env workflow.

Deployment Guide: Steps to deploy/update stacks.

Compliance Report: How AWS Config rules enforce policies.

Validation:

Unit Tests: 20+ test cases (e.g., "Verify prod disallows public SSH").

Integration Tests: Full deployment in a sandbox AWS account.

create one single yaml cloud formation template