Hey, I need help setting up infrastructure for our banking app's credential management system.

We have about 100,000 users logging in daily, and we need to handle their credentials securely with automatic rotation. The compliance team is breathing down my neck about audit trails and encryption everywhere.

Here's what I'm thinking:

We should use AWS Secrets Manager to store all the credentials. I want Lambda functions to handle the rotation logic so we can customize it for our needs. The database is RDS MySQL, and I'd like to use IAM authentication instead of traditional passwords where possible.

For scheduling rotations, EventBridge seems like the right choice. And obviously we need CloudTrail logging everything for the auditors.

Monitoring is critical too - I need CloudWatch dashboards and alarms so we know immediately if something goes wrong during rotation. Can't have 100,000 users unable to log in because of a bad rotation.

Oh, and make sure everything follows least privilege. The security team reviews all our IAM policies with a fine-tooth comb.

One more thing - we need a rollback mechanism. If a rotation fails, we should be able to revert automatically without manual intervention.

Can you help me build this in Terraform? I need:

1. Main infrastructure file (tap_stack.tf) with all the resources
2. Variables file so I can tweak rotation schedules and thresholds
3. Provider configuration  
4. The Lambda rotation function code
5. IAM policies documentation

Everything needs to support encryption at rest and in transit for banking compliance.

Let me know if you need any clarification on the requirements.