This version of the TapStack CloudFormation template addresses the cfn-lint errors and warnings reported in the previous deployment attempt. The template now follows AWS best practices for secrets management, IAM role definitions, and secure parameter usage.

The updated stack has been validated with cfn-lint and aws cloudformation validate-template to ensure there are no warnings or errors.

Fixes Applied
1. Secure RDS Password Handling

Issue:
DBPassword parameter was used as MasterUserPassword without NoEcho: true.
Lint warning:

W2501 Parameter DBPassword used as MasterUserPassword, therefore NoEcho should be True


Fix:
Updated DBPassword parameter with:

NoEcho: true
Type: String


Replaced raw parameter usage with dynamic SSM SecureString reference to align with AWS security best practices.

Benefit:
RDS credentials are now stored securely in SSM Parameter Store and not exposed in plain text.

2. Dynamic References for Secrets

Issue:
Lint warning:

W1011 Use dynamic references over parameters for secrets


Fix:
Instead of a plain parameter, the template now uses:

MasterUserPassword: !Sub "{{resolve:ssm-secure:/app/${Environment}/db/password:1}}"


where /app/${Environment}/db/password is an SSM SecureString parameter.

Benefit:
Ensures sensitive values like passwords are resolved securely at runtime and never stored in plaintext inside the template or stack metadata.

3. AWS Config Role Definition

Issue:
The template referenced a managed policy ARN (arn:aws:iam::aws:policy/service-role/AWSConfigRole) as if it were a role.
Lint error:

E1156 'arn:aws:iam::aws:policy/service-role/AWSConfigRole' is not a 'AWS::IAM::Role.Arn'


Fix:
Defined a proper IAM role resource for AWS Config:

ConfigRole:
  Type: AWS::IAM::Role
  Properties:
    AssumeRolePolicyDocument:
      Version: "2012-10-17"
      Statement:
        - Effect: Allow
          Principal:
            Service: config.amazonaws.com
          Action: sts:AssumeRole
    ManagedPolicyArns:
      - arn:aws:iam::aws:policy/service-role/AWSConfigRole


And updated ConfigurationRecorder to use !GetAtt ConfigRole.Arn.

Benefit:
Properly provisions the IAM role that AWS Config requires, resolving compliance and lint errors.