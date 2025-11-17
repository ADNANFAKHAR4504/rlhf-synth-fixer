# MODEL_FAILURES Documentation

This document catalogs the intentional errors in MODEL_RESPONSE.md for training purposes. Each error represents a common mistake that LLMs make when generating CI/CD pipeline infrastructure code.

## Summary

Total Errors: 28

Categories:
- Missing Required Components: 8 errors
- Configuration Errors: 9 errors
- Security Issues: 8 errors
- Resource Configuration Flaws: 3 errors

## Detailed Error Catalog

### Category 1: Missing Required Components (Critical)

**ERROR 1: Missing Required Tags**
- Location: `TapStack.__init__`
- Issue: `self.default_tags = {}` - empty tags dictionary
- Requirement: Resources must be properly tagged for cost tracking and management
- Current: No tags applied to resources
- Impact: Cannot track costs, resources not identifiable
- Fix: Add default tags with Environment, ManagedBy, Project keys

**ERROR 2: Missing Pulumi State Backend Bucket**
- Location: `TapStack.__init__`
- Issue: No S3 bucket created for Pulumi state backend
- Requirement: "Create dedicated S3 backend bucket for Pulumi state storage"
- Current: Only artifact bucket exists
- Impact: No place to store Pulumi state, deployment will fail
- Fix: Call `self.state_bucket = self._create_state_bucket()` with encryption

**ERROR 3: Missing CloudWatch Log Group**
- Location: `TapStack.__init__`
- Issue: CloudWatch log group not created before CodeBuild project
- Requirement: "Enable CloudWatch Logs for CodeBuild with 14-day retention"
- Current: No log group, CodeBuild may create default or fail
- Impact: No structured logging, retention not controlled
- Fix: Create `aws.cloudwatch.LogGroup` with 14-day retention before CodeBuild

**ERROR 4: Missing SNS Email Subscription**
- Location: `_create_sns_topic`
- Issue: SNS topic created but no email subscription
- Requirement: "Add email subscription to the topic"
- Current: Topic exists but no subscribers
- Impact: Notifications sent to topic but no one receives them
- Fix: Add `aws.sns.TopicSubscription` with protocol='email'

**ERROR 5: Missing Pipeline Notification Rule**
- Location: `TapStack.__init__`
- Issue: No notification rule linking pipeline failures to SNS
- Requirement: "Integrate with CodePipeline to send alerts on failures"
- Current: SNS topic and pipeline exist but not connected
- Impact: Pipeline failures don't trigger notifications
- Fix: Create `aws.codestarnotifications.NotificationRule` for pipeline

**ERROR 6: Bucket Name Not Unique**
- Location: `_create_artifact_bucket`
- Issue: Bucket name `pipeline-artifacts-{env_suffix}` not unique
- Requirement: S3 bucket names must be globally unique
- Current: Will collide with other accounts/regions
- Impact: Bucket creation fails
- Fix: Add account ID or random string to bucket name

**ERROR 7: Missing Bucket Versioning**
- Location: `_create_artifact_bucket`
- Issue: No `versioning` parameter in bucket configuration
- Requirement: "S3 artifact bucket must have versioning enabled"
- Current: Versioning disabled
- Impact: Cannot recover previous artifact versions
- Fix: Add `versioning={'enabled': True}`

**ERROR 8: Missing S3 Encryption**
- Location: `_create_artifact_bucket`
- Issue: No `server_side_encryption_configuration` parameter
- Requirement: "Both buckets must have encryption at rest"
- Current: Default encryption (may not be enabled)
- Impact: Data not encrypted, fails security requirements
- Severity: CRITICAL
- Fix: Add `server_side_encryption_configuration` with AES256 or KMS

### Category 2: Configuration Errors

**ERROR 9: Missing Lifecycle Rules**
- Location: `_create_artifact_bucket`
- Issue: No `lifecycle_rules` parameter
- Requirement: "30-day lifecycle policy for artifact retention"
- Current: Artifacts never deleted, costs accumulate
- Impact: Unnecessary storage costs
- Fix: Add lifecycle rule to expire objects after 30 days

**ERROR 10: Missing Public Access Block**
- Location: `_create_artifact_bucket`
- Issue: No `aws.s3.BucketPublicAccessBlock` resource
- Requirement: S3 security best practice
- Current: Bucket may be publicly accessible
- Impact: Security vulnerability
- Severity: HIGH
- Fix: Create BucketPublicAccessBlock with all options set to True

**ERROR 11: Parameter Name Missing Env Suffix**
- Location: `_create_pulumi_token_param`
- Issue: Parameter name is `/codebuild/pulumi-token` without env_suffix
- Requirement: "Resource names must include environmentSuffix"
- Current: Name collides across environments
- Impact: Different environments overwrite same parameter
- Fix: Use `/codebuild/pulumi-token-{self.env_suffix}`

**ERROR 12: Wrong Parameter Type**
- Location: `_create_pulumi_token_param`
- Issue: `type='String'` instead of `'SecureString'`
- Requirement: "Store Pulumi access token as SecureString type"
- Current: Token stored as plaintext in Parameter Store
- Impact: CRITICAL security vulnerability
- Severity: CRITICAL
- Fix: Change to `type='SecureString'`

**ERROR 13: Hardcoded Secret Value**
- Location: `_create_pulumi_token_param`
- Issue: `value='placeholder-token'` hardcoded instead of using pulumi.Output.secret()
- Requirement: Secrets should be marked as sensitive
- Current: Value visible in state files and logs
- Impact: Secret exposure
- Severity: CRITICAL
- Fix: Use `value=pulumi.Output.secret('placeholder-token')` or config

**ERROR 16: Incomplete Buildspec**
- Location: `_create_codebuild_project`
- Issue: Buildspec only has 'build' phase
- Requirement: "Configure buildspec.yml with install, pre_build, and build phases"
- Current: Missing install and pre_build phases
- Impact: Cannot install Pulumi, setup fails
- Fix: Add 'install' phase (install Pulumi) and 'pre_build' phase (configure)

**ERROR 17: Missing Build Phases**
- Location: `_create_codebuild_project`
- Issue: Only 'build' phase exists, missing 'install' and 'pre_build'
- Requirement: "Phases should install Pulumi, run pulumi preview, and run pulumi update"
- Current: Assumes Pulumi pre-installed
- Impact: Build fails, Pulumi not available
- Fix: Add install phase with Pulumi installation commands

**ERROR 18: Wrong CodeBuild Image**
- Location: `_create_codebuild_project`
- Issue: Using `aws/codebuild/standard:4.0` instead of `5.0`
- Requirement: "CodeBuild must use aws/codebuild/standard:5.0 image"
- Current: Older image version
- Impact: May have outdated tools, doesn't meet requirement
- Fix: Change to `'aws/codebuild/standard:5.0'`

**ERROR 19: Missing Environment Variables**
- Location: `_create_codebuild_project`
- Issue: No `environment_variables` configuration
- Requirement: "Environment variables must include PULUMI_ACCESS_TOKEN from Parameter Store"
- Current: No way to pass token to build
- Impact: Pulumi commands fail, no authentication
- Severity: CRITICAL
- Fix: Add environment_variables with PULUMI_ACCESS_TOKEN from Parameter Store

### Category 3: Security Issues (Critical)

**ERROR 14: Wildcard IAM Actions**
- Location: `_create_pipeline_role`
- Issue: Policy uses `'s3:*', 'codebuild:*', 'codecommit:*'`
- Requirement: "All IAM roles must follow least-privilege principle with no wildcard actions"
- Current: Overly broad permissions
- Impact: Security vulnerability, violates compliance
- Severity: HIGH
- Fix: Specify exact actions needed (s3:GetObject, s3:PutObject, etc.)

**ERROR 15: Wildcard IAM Actions in CodeBuild**
- Location: `_create_codebuild_role`
- Issue: Policy uses `'logs:*', 's3:*', 'ssm:*'` with `'Resource': '*'`
- Requirement: "Follow least-privilege principle with no wildcard actions"
- Current: Full access to all resources
- Impact: CRITICAL security vulnerability
- Severity: CRITICAL
- Fix: Specify exact actions and resources (specific log groups, buckets, parameters)

**ERROR 20: Missing CloudWatch Logs Config**
- Location: `_create_codebuild_project`
- Issue: No `logs_config` parameter
- Requirement: "Enable CloudWatch Logs for CodeBuild with 14-day retention"
- Current: Default logging behavior
- Impact: Logs may not be collected, retention not controlled
- Fix: Add `logs_config` pointing to log group with proper retention

**ERROR 21: Missing SNS Encryption**
- Location: `_create_sns_topic`
- Issue: No `kms_master_key_id` parameter
- Requirement: Security best practice for sensitive notifications
- Current: Topic data not encrypted
- Impact: Potential information disclosure
- Fix: Add KMS encryption to SNS topic

**ERROR 22: Missing Artifact Store Encryption**
- Location: `_create_pipeline`
- Issue: Artifact store has no `encryption_key` parameter
- Requirement: Security best practice, encrypt pipeline artifacts
- Current: Default encryption or none
- Impact: Artifacts may be unencrypted
- Fix: Add `encryption_key` with KMS key ID or alias

**ERROR 23: Hardcoded Configuration Values**
- Location: `_create_pipeline`
- Issue: GitHub Owner and Repo are hardcoded as 'example'
- Requirement: Values should come from configuration
- Current: Will fail, wrong repository
- Impact: Pipeline cannot connect to actual repository
- Fix: Read from Pulumi config or parameters

**ERROR 24: Hardcoded GitHub Token**
- Location: `_create_pipeline`
- Issue: `'OAuthToken': 'hardcoded-token'` in source configuration
- Requirement: Secrets should not be hardcoded
- Current: Token in plaintext in code
- Impact: CRITICAL security vulnerability, token in version control
- Severity: CRITICAL
- Fix: Store in AWS Secrets Manager or Pulumi config with secret()

**ERROR 25: Missing Deploy Stage**
- Location: `_create_pipeline`
- Issue: Pipeline only has Source and Build stages
- Requirement: "CodePipeline with exactly 3 stages: Source, Build, and Deploy"
- Current: Only 2 stages
- Impact: Doesn't meet requirement, no deployment step
- Fix: Add Deploy stage (could be manual approval or automated deployment)

### Category 4: Resource Configuration Flaws

**ERROR 26: Not Reading Config**
- Location: `tap.py`
- Issue: environment_suffix hardcoded as 'dev'
- Requirement: Should read from environment variables or Pulumi config
- Current: Always uses 'dev', not flexible
- Impact: Cannot deploy to different environments
- Fix: Use `Config().get('env')` or `os.getenv('ENVIRONMENT_SUFFIX')`

**ERROR 27: Missing Outputs**
- Location: `tap.py`
- Issue: Only exports pipeline_name
- Required Outputs:
  - pipeline_name
  - pipeline_arn
  - artifact_bucket_name
  - state_bucket_name
  - codebuild_project_name
  - sns_topic_arn
  - log_group_name
- Current: Only 1 output
- Impact: Missing visibility into infrastructure
- Fix: Export all key resource identifiers

**ERROR 28: Missing AWS Region Config**
- Location: `Pulumi.yaml`
- Issue: No `config` section with `aws:region`
- Requirement: "Deploy to us-east-1 region"
- Current: Uses default or AWS_REGION environment variable
- Impact: May deploy to wrong region
- Fix: Add `config: { aws:region: us-east-1 }` section

## Impact Analysis

### Critical Errors (Must Fix):
- ERROR 12: Token stored as String not SecureString
- ERROR 13: Hardcoded secret value
- ERROR 15: Wildcard IAM permissions with all resources
- ERROR 19: Missing PULUMI_ACCESS_TOKEN environment variable
- ERROR 24: Hardcoded GitHub OAuth token

### High Priority Errors:
- ERROR 2: No Pulumi state backend bucket
- ERROR 3: No CloudWatch log group
- ERROR 8: Missing S3 encryption
- ERROR 10: Missing public access block
- ERROR 14: Wildcard IAM actions
- ERROR 25: Missing Deploy stage

### Medium Priority Errors:
- ERROR 1: Missing tags
- ERROR 4-5: No notifications configured
- ERROR 7: No versioning
- ERROR 16-17-18: Incomplete buildspec configuration
- ERROR 20: Missing logs config
- ERROR 22: No artifact encryption

### Low Priority Errors:
- ERROR 6: Bucket name collision risk
- ERROR 9: No lifecycle policy
- ERROR 11: Parameter name without suffix
- ERROR 21: SNS not encrypted
- ERROR 23: Hardcoded config values
- ERROR 26-27-28: Configuration and outputs

## Compliance Violations

### Security Requirements Failed:
1. ERROR 12, 13, 24: Secrets management failures
2. ERROR 14, 15: IAM over-permissions violate least-privilege
3. ERROR 8, 22: Missing encryption at rest
4. ERROR 10: S3 security best practices not followed

### Functional Requirements Failed:
1. ERROR 2: No state backend bucket
2. ERROR 16-17: Buildspec doesn't install Pulumi
3. ERROR 19: No token passed to CodeBuild
4. ERROR 25: Pipeline has 2 stages instead of 3

### Operational Requirements Failed:
1. ERROR 3, 20: CloudWatch logging not properly configured
2. ERROR 4, 5: Notifications not set up
3. ERROR 27: Missing outputs for visibility

## Testing Implications

This MODEL_RESPONSE with errors should:
1. Fail security checks (hardcoded secrets, IAM wildcards, missing encryption)
2. Fail functional tests (Pulumi cannot authenticate, state backend missing)
3. Fail compliance checks (wrong parameter types, missing encryption)
4. Fail requirement validation (only 2 stages, missing components)
5. Pass syntax/import checks (code is valid Python and Pulumi)

The IDEAL_RESPONSE correctly implements all requirements and should pass all tests.

## Training Value

These errors represent common LLM mistakes:
1. Forgetting required security features (encryption, SecureString, least privilege)
2. Incomplete implementations (missing stages, buildspec phases, components)
3. Hardcoding sensitive values (tokens, secrets)
4. Using wildcards in IAM policies
5. Missing resource configurations (versioning, lifecycle, logging)
6. Not reading from configuration (hardcoded values)
7. Insufficient outputs for operational visibility
8. Wrong versions or types for resources

By comparing MODEL_RESPONSE and IDEAL_RESPONSE, the training system can learn to:
- Always use SecureString for secrets in Parameter Store
- Follow least-privilege IAM with specific actions and resources
- Create complete buildspecs with all required phases
- Enable encryption on all storage resources
- Configure proper logging and monitoring
- Read configuration from proper sources
- Export comprehensive outputs
- Meet all stated requirements (3 stages, etc.)
