Your provided TapStack.yml is still giving a lint error because the DBPassword parameter is defined but not used anywhere. Error:

W2001 Parameter DBPassword not used.
lib/TapStack.yml:40:3


Please fix the template by:

Removing the unused DBPassword parameter (since we are now securely using an SSM SecureString dynamic reference for MasterUserPassword).

Ensuring the RDS instance continues to use:

MasterUserPassword: !Sub "{{resolve:ssm-secure:/app/${Environment}/db/password:1}}"


and that no dangling parameter definitions exist.

Providing me the cleaned and updated TapStack.yml that passes both cfn-lint and aws cloudformation validate-template without warnings or errors.