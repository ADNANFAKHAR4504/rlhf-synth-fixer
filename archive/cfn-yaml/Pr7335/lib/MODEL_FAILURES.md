# model_failure

## Observed failure modes

* Early validation failure (`AWS::EarlyValidation::ResourceExistenceCheck`) when explicit names collide with existing resources such as S3 buckets, IAM roles, Lambda functions, SNS topics, SQS queues, log groups, or CodeDeploy apps/groups. This prevents change set creation.
* CodeDeploy `InvalidEC2TagException` indicating the deployment group was interpreted as an EC2/On-Prem group due to a name or platform collision with an existing CodeDeploy application using `Server` compute platform.
* Linter and schema issues when unsupported properties are used (for example, tagging resources that do not accept `Tags`, or including Lambda-unsupported deployment group fields).

## Root causes

* Explicit `BucketName`, `RoleName`, `FunctionName`, `TopicName`, `QueueName`, `DeploymentGroupName`, or `ApplicationName` reused in accounts where resources with the same names already exist.
* Reusing a CodeDeploy Application that was created previously with `Server` compute platform, causing Lambda deployment groups to inherit EC2-only schema fragments (e.g., `ec2TagFilters`) under the hood.
* Over-specifying CodeDeploy configuration (such as blue/green blocks or target lists) that are not valid for Lambda deployment groups in CloudFormation.

## Detection and diagnostics

* Change set failure before resource creation with a message citing `AWS::EarlyValidation::ResourceExistenceCheck`.
* CodeDeploy deployment group create/update failure with `InvalidEC2TagException`.
* CloudFormation events indicating “Additional properties are not allowed” or similar schema errors for specific logical resources.
* Alarms not triggering during canary due to incorrect metric dimensions if alias targeting is not set to `function:alias` format.

## Remediation steps

* Remove explicit names from collision-prone resources to allow CloudFormation to generate unique physical IDs.
* Ensure CodeDeploy Application is explicitly `ComputePlatform: Lambda` and avoid reusing legacy application names; prefer unique names derived from the StackId.
* Minimize the deployment group to Lambda-only properties, then layer alarms and triggers; avoid EC2-specific fields entirely.
* Make CodeDeploy creation conditional so stack creation is not blocked in constrained environments; enable it after the baseline stack exists.
* Validate CloudWatch alarm dimensions against the `live` alias and verify SNS topic subscriptions are confirmed.

## Preventive practices

* Enforce naming via regex patterns for environment suffixes instead of fixed allowed lists to support future environments without template edits.
* Keep artifacts versioned in S3 and do not hardcode bucket names.
* Prefer implicit dependencies (Refs/GetAtt) over manual `DependsOn` when possible.
* Lint the template and run a dry-run create in a non-prod account before promotion.
* Surface CloudFormation events and SNS notifications in the CI/CD logs for rapid triage.

## When to escalate

* Persistent `InvalidEC2TagException` after switching to unique Lambda compute-platform applications indicates an out-of-band constraint (service control policy, permission boundary, or conflicting organization-level guardrails). Engage platform administrators with the failing request ID and CloudTrail evidence.
* Repeated early validation collisions even without explicit names suggest drifted stacks or retained resources need cleanup; coordinate a safe teardown or rename strategy.
