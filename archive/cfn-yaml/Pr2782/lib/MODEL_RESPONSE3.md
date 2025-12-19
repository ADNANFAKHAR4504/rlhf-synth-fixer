This update to the TapStack CloudFormation template resolves the latest cfn-lint warning regarding the unused DBPassword parameter. Since the template now uses AWS Systems Manager (SSM) SecureString dynamic references for the RDS master password, the DBPassword parameter was redundant and has been removed.

The stack remains secure, compliant, and validated with both cfn-lint and aws cloudformation validate-template.

Fix Applied
1. Unused Parameter Removal

Issue:
The template still defined a parameter DBPassword, but the actual RDS configuration already used an SSM SecureString reference.
Lint warning:

W2001 Parameter DBPassword not used.
lib/TapStack.yml:40:3


Fix:
Removed the unused DBPassword parameter from the Parameters section.
RDS configuration continues to use:

MasterUserPassword: !Sub "{{resolve:ssm-secure:/app/${Environment}/db/password:1}}"


Benefit:
Eliminates unnecessary template clutter and ensures the template is clean, warning-free, and fully aligned with secure secrets management practices.

Security & Compliance

Secrets stored in SSM Parameter Store (SecureString) with dynamic references

No plaintext secrets or unused parameters in the stack

NoEcho enforced where appropriate (DBUsername, sensitive params)

Template is lint-clean and validated