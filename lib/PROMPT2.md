Your provided TapStack.yml is failing cfn-lint with the following warnings:

W2501 Parameter DBPassword used as MasterUserPassword, therefore NoEcho should be True
lib/TapStack.yml:21:3

W1011 Use dynamic references over parameters for secrets
lib/TapStack.yml:229:7


Please fix the template by:

Updating the DBPassword parameter so it has NoEcho: true set (to prevent plaintext visibility).

Replacing the current static DBPassword parameter reference with an SSM Parameter Store dynamic reference in the MasterUserPassword property of the RDSInstance.

Use the syntax:

MasterUserPassword: '{{resolve:ssm-secure:/tapstack/prod/dbpassword:1}}'


This ensures the secret is pulled securely at runtime instead of through a plain parameter.

Make sure the fixed TapStack.yml passes cfn-lint validation with no warnings.