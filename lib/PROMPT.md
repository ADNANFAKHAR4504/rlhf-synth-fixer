A security & compliance team requires an automated baseline that enforces fast evaluation of configuration drift, long-term retention of compliance evidence, bounded Lambda execution, secure inter-service communication, and auditable remediation workflows.

Please produce one self-contained AWS CDK (TypeScript) stack file (a single .ts file) that implements the following requirements with sensible defaults, parameterization, and inline documentation:

Functional requirements

    1.	AWS Config rule evaluation timeframe
      •	Configure AWS Config to evaluate resource changes and run rules so that resources are evaluated within 15 minutes of configuration changes (use appropriate Config delivery channel, recorder, and rule evaluation modes/timeouts).
      •	Include at least two example managed/custom Config rules (e.g., s3-bucket-public-read-prohibited, and a custom rule checking KMS key policies) wired to the recorder and delivery channel.

    2.	Compliance data retention
      •	Create an S3 bucket for storing compliance exports, Config snapshots, and remediation audit logs.
      •	Enforce 7-year retention via lifecycle rules and object lock / legal hold guidance (where supported); at minimum implement lifecycle rules to transition and retain data for the required period and prevent accidental deletion (explain limitations and operational steps for Object Lock if environment supports it).

    3.	Lambda execution limits
      •	Any Lambda functions created by this stack (for example remediation handlers or rotation helpers) must have their timeout ≤ 5 minutes and memory/timeout tuned with sensible defaults. Document where longer runtimes would be allowable and how to request exceptions.

    4.	Inter-service communications use IAM roles
      •	Do not create or use long-lived access keys for inter-service communication.
      •	Provide example IAM Roles and instance/task execution roles for Lambda, Step Functions, and other services with least-privilege policies that use sts:AssumeRole or service principals. Include a pattern/example for cross-account role assumption if needed.

    5.	Auditable remediation workflows
      •	Implement a remediation workflow pattern (Step Functions or Lambda orchestration) that:
      •	Writes a structured audit log entry to the compliance S3 bucket and CloudWatch Logs before making any mutating change. (Include schema and example fields: timestamp, principal, targetResource, intendedAction, correlationId.)
      •	Executes the remediation action (or simulated action in dev mode).
      •	Writes a post-remediation audit log and emits an SNS alert with the outcome.
      •	Ensure logs are persisted using the KMS key and retained per the 7-year requirement.

Additional infrastructure & best practices:

    •	SNS: topic for remediation alerts; parameterize alert subscribers.
    •	Parameters: EnvironmentSuffix, TeamName, ComplianceRetentionYears (default 7), KmsKeyArn (optional to use existing), EnableObjectLock (boolean), AlertEmail, and UseExistingVPC (boolean) with VPC/subnet inputs if true.
    •	Tags: require mandatory tags applied to all resources: EnvironmentSuffix, Team, ComplianceLevel. Use tagging helper so all resources inherit tags.
