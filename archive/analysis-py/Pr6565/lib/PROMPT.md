Our CISO is preparing for a major audit, and our IAM posture is not where it needs to be. We have hundreds of users and roles, and we're flying blind on privilege escalation and stale credentials. I need a "master" audit script in Python (Boto3) to run in us-east-1 and find everything that puts us at risk.

This isn't just about old keys. I need a deep analysis. Here's the checklist:

User & Credential Hygiene:

Find every user with console access that doesn't have MFA enabled.

Find all users with access keys older than 90 days.

Flag any user with more than one active access key.

Generate a list of "zombie" users: anyone who hasn't logged in or used an access key in 90 days.

Check our account's password policy. It must enforce a 14-character minimum, complexity, and rotation.

Over-Privileging & Blast Radius:

Flag all users with AdministratorAccess or PowerUserAccess attached.

Scan all customer-managed policies. Find any that grant permissions with Resource: '\*' but don't have a Condition block to scope it down.

Find any role with a session duration set to more than 12 hours.

Privilege Escalation & Trust Gaps (Most Important):

This is the critical one. Scan all IAM policies for known privilege escalation vectors. I'm looking for any policy that allows a combination of actions like iam:CreateUser, iam:AttachUserPolicy, or iam:CreateAccessKey.

Check all role trust policies. Flag any that allow cross-account access but do not enforce an ExternalId.

Check our S3 bucket policies. Flag any that grant cross-account access without proper conditions.

Activity & Monitoring:

Generate a credential report and analyze the last password usage and access key last used dates to identify inactive principals.

Find all roles that were created more than 90 days ago and check their LastUsedDate field from GetRole API to identify "zombie" roles that haven't been assumed recently.

Check for any IAM user or role with inline policies that differ from their attached managed policies, as this often indicates privilege creep.

Critical Filters (Do Not Report): The script must be smart.

It must ignore all service-linked roles.

It must ignore the OrganizationAccountAccessRole.

It must only report on users in an "active" status.

We have "break-glass" accounts. It must skip any user or role that is tagged with EmergencyAccess: true.

The Deliverables (This is for the audit):

Console Output: A clean table showing high-risk findings, prioritized with a simple risk score.

iam_security_audit.json: A full JSON report. Each finding needs a severity, principal_name, issue_description, a brief attack_scenario, and remediation steps. It must have a dedicated privilege_escalation_paths section.

least_privilege_recommendations.json: This is for the ops team. For every finding, this file should contain a suggested, fixed policy JSON they can use for remediation.

Testing: This script will be complex, so it needs a test_iam_audit.py. This test must use moto to mock at least 50 IAM entities. It needs to mock users with no MFA, roles with bad trust policies, policies with priv-esc, and especially a mock break-glass user (EmergencyAccess: true) that the test must assert is ignored by the final report.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
