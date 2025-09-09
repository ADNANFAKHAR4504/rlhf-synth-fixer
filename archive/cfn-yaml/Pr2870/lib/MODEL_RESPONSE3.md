The CloudFormation stack deployment failed with the following error:

The resource MyDB is in a CREATE_FAILED state  
Secrets Manager can't find the specified secret.  
(Service: AWSSecretsManager; Status Code: 400; Error Code: ResourceNotFoundException)


This happened because the template used a dynamic reference to an AWS Secrets Manager secret (myapp/rds/master), but that secret did not exist at deployment time. Since CloudFormation doesn’t automatically create secrets referenced in dynamic lookups, the stack rolled back.

Root Cause

The stack was configured to retrieve the RDS master password from Secrets Manager.

The myapp/rds/master secret was expected to already exist in the account.

Since the secret had not been created manually, CloudFormation could not resolve it.

Resolution

To fix this, the template should:

Create a new Secrets Manager secret as part of the same stack.

The secret must contain both the RDS username and password.

The password should be securely auto-generated.

Reference this secret dynamically in the RDS resource using CloudFormation’s !Ref and !GetAtt mechanisms instead of a hardcoded dynamic string.

Implementation Changes

Added an AWS::SecretsManager::Secret resource (RDSMasterSecret).

Configured the secret to automatically generate a secure random password.

Updated the RDS instance to reference the username and password stored in that secret.

CloudFormation now provisions the secret first, then the RDS instance, ensuring no missing resource errors.

Benefits

Eliminates manual pre-step of creating the secret.

Removes the ResourceNotFoundException deployment error.

Ensures secrets are auto-generated and managed securely.

Aligns with AWS best practices for least privilege and secret rotation.

Fully automated — one template deploys the entire infrastructure end-to-end.