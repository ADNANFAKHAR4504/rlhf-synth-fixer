Our CISO is preparing for an audit and is not happy with the state of our IAM posture. We need a Python script using Boto3 to run in us-east-1 and find our most critical IAM vulnerabilities.

Here's exactly what the script needs to find:

Users without MFA: List all IAM users that do not have an MFA device attached. This is our top priority. However, you need to distinguish between console users and programmatic-only users - we only care about users who have console access enabled (users with passwords). Programmatic-only users (those without passwords) should not be flagged for missing MFA.

Stale Access Keys: Check all IAM users and find any access keys that haven't been used in over 90 days. We can get this info from the IAM Access Advisor data (get_access_key_last_used). IMPORTANT: Access keys that have never been used should be treated differently - if they were created more than 30 days ago and never used, flag them as "UNUSED_KEY_30_DAYS" instead. Also, the script should calculate and report the total number of days since last use or creation for each finding.

Overly Permissive Roles: For each IAM role in the account, check if it has any inline policies or attached managed policies that grant admin access (either the AdministratorAccess policy or any policy with Effect: Allow, Action: "_", Resource: "_"). Report each role that has admin privileges, including which policy grants those privileges (inline vs managed, and the policy name/ARN).

Permissive Policies: This is a big one. Instead of just a simple string check, I want this to be more robust. The script should iterate through our customer-managed IAM policies and use the IAM Access Analyzer ValidatePolicy API to check for any policy that returns a "SECURITY_WARNING" finding. This will catch things like "PassRole with \*" and other bad practices. For each finding, capture both the issueCode and the specific locations in the policy document where the issue occurs.

Cross-Account Role Trust: Examine all IAM roles and identify any that have trust relationships allowing access from external AWS accounts (accounts outside of our organization). The script needs to extract the external account IDs from the AssumeRolePrincipal statements and report them. Roles that trust the root principal of external accounts should be flagged as "HIGH" severity, while roles that trust specific IAM users/roles in external accounts should be "MEDIUM" severity.

For the output, the script needs to generate two files: iam_compliance_report.json and iam_compliance_report.csv. These files should list every finding, including the user, role, or policy ARN and the specific issue type (e.g., "NO_MFA_CONSOLE_USER", "STALE_KEY_90_DAYS", "UNUSED_KEY_30_DAYS", "ADMIN_ACCESS_ROLE", "PERMISSIVE_POLICY", "EXTERNAL_ACCOUNT_TRUST_ROOT", "EXTERNAL_ACCOUNT_TRUST_SPECIFIC").

The JSON output should include a summary section at the top with:

- Total findings count by severity (HIGH, MEDIUM, LOW)
- Total findings count by type
- List of all external account IDs discovered
- Statistics: average age of stale keys, percentage of console users without MFA

The CSV should be structured so it can be easily imported into Excel for our security team, with columns in this exact order: severity, type, resource_type, resource_arn, resource_name, issue, details, days_inactive (if applicable), timestamp.

Please provide the final Python code in separate, labeled code blocks for `lib/analyse.py`.
