Create a single, parameterized CloudFormation template that deploys consistent AWS infrastructure for three environments — dev, staging, and production — with automated replication capabilities and environment-specific configurations.

Requirements
Core Infrastructure

The CloudFormation template must:

Define a master template with a parameter Environment (dev, staging, or prod).

Deploy separate VPCs for each environment with non-overlapping CIDR ranges:

dev → 10.0.0.0/16

staging → 10.1.0.0/16

prod → 10.2.0.0/16

Create public and private subnets across 2 Availability Zones, Internet Gateways, and NAT Gateways for outbound access.

Deploy an RDS PostgreSQL instance with environment-specific sizes:

dev → db.t3.micro

staging → db.t3.small

prod → db.m5.large

Set RDS backup retention periods:

dev → 1 day

staging → 7 days

prod → 30 days

Implement a pre-update snapshot mechanism (via a Lambda-backed custom resource) that automatically creates a manual snapshot of the RDS instance before any updates.

Set up Auto Scaling Groups (ASG) and Application Load Balancers (ALB):

ASG min size: 1 (dev), 2 (staging), 4 (prod)

ALB health check interval: 30s (dev), 15s (staging), 5s (prod)

Create S3 buckets per environment with:

Versioning enabled

Lifecycle retention (7/30/90 days for dev/staging/prod)

Server-side encryption

Configure IAM roles and policies:

Limit production modification privileges to specific users using IAM Conditions.

Require MFA for sensitive actions in prod.

Set up CloudWatch dashboards and alarms with thresholds based on environment type, aggregating metrics across all environments.

Configure SNS topics for alerts, each with distinct environment-specific email endpoints.

Apply stack policies and deletion protection for production resources.

Implement tags for cost allocation and identification.

Security groups must prevent cross-environment communication (no peering, strict ingress rules).

Mandatory Technical Constraints
Cross-Account & Cross-Region Executability

The template must be fully executable across AWS accounts and regions.

No hardcoded values (account IDs, ARNs, region names, or emails).

All such values must be Parameters, Mappings, or intrinsic references.

Hardcoding Rules

Anything hardcoded (like resource ARNs, region names, or account IDs) is a critical violation.

All values must be derived from:

!Ref (for parameters)

!Sub or !Join (for dynamic names)

!FindInMap (for environment-based configuration)

Intrinsic variables like ${AWS::Region}, ${AWS::AccountId}, and ${AWS::StackName}.

Mandatory Parameters
Parameters:
  Environment:
    Type: String
    Description: "Environment type (dev, staging, or prod)"
    AllowedValues:
      - dev
      - staging
      - prod

  EnvironmentSuffix:
    Type: String
    Description: "Suffix for resource names to support multiple parallel deployments (e.g., PR number from CI/CD)"
    Default: "pr4056"
    AllowedPattern: "^[a-zA-Z0-9\\-]*$"
    ConstraintDescription: "Must contain only alphanumeric characters and hyphens"

  ProjectName:
    Type: String
    Description: "Project or application name for tagging and naming"

Mandatory Naming Convention

Every AWS resource name must follow the format:

Name: !Sub "${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-[resource-type]"


Examples:

VPC → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-vpc

Subnet → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-private-subnet-1

Lambda → ${AWS::StackName}-${AWS::Region}-${EnvironmentSuffix}-lambda

This naming pattern must be used consistently for every resource supporting a Name or BucketName property.

Parameter Mappings (Environment-Specific)

Use a Mappings section for environment-specific configurations:

Mappings:
  EnvConfig:
    dev:
      VpcCidr: 10.0.0.0/16
      DBInstanceClass: db.t3.micro
      ASGMinSize: "1"
      ALBHealthInterval: "30"
      S3LifecycleDays: "7"
      BackupRetention: "1"
    staging:
      VpcCidr: 10.1.0.0/16
      DBInstanceClass: db.t3.small
      ASGMinSize: "2"
      ALBHealthInterval: "15"
      S3LifecycleDays: "30"
      BackupRetention: "7"
    prod:
      VpcCidr: 10.2.0.0/16
      DBInstanceClass: db.m5.large
      ASGMinSize: "4"
      ALBHealthInterval: "5"
      S3LifecycleDays: "90"
      BackupRetention: "30"

Conditional Logic

Use Conditions to handle environment-specific rules:

Conditions:
  IsProd: !Equals [!Ref Environment, prod]
  IsStaging: !Equals [!Ref Environment, staging]
  IsDev: !Equals [!Ref Environment, dev]


Use these conditions for:

Enabling Multi-AZ RDS only in prod.

Applying stricter IAM roles in prod.

Creating stack policies and deletion protection for prod only.

Functional Expectations

The same template must be deployable as:

aws cloudformation deploy --parameter-overrides Environment=dev ...

aws cloudformation deploy --parameter-overrides Environment=staging ...

aws cloudformation deploy --parameter-overrides Environment=prod ...

Each environment deployment should be isolated (unique VPC, resources, tags).

All cross-stack references (if any) must use Exports and Fn::ImportValue.

Template must be idempotent (multiple runs should not create duplicate resources).

Include Outputs for key resources (VPC ID, ALB DNS, RDS endpoint, S3 bucket name).

Deliverable Format

Output:

A single master CloudFormation YAML template that implements all of the above.

Template must be cross-account compatible, parameterized, and self-contained.

Use AWS best practices for:

Security (IAM least privilege)

Modularity

Naming consistency

Tagging

No hardcoded identifiers

Expected Deliverable

A production-grade CloudFormation YAML template that:

Implements all the requirements and constraints above

Conforms to AWS naming and parameterization standards

Runs in any AWS account and region without modification

Automatically configures dev, staging, and prod environments via parameters

Includes Lambda-backed custom resource for pre-update RDS snapshots

Enforces stack policies for production safety