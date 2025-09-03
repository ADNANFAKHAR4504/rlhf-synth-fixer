Overview

The deployment of TapStack.yml failed because the KeyName parameter was declared as required, but no value was provided at deploy time. By default, CloudFormation requires that all parameters without a Default value be supplied during stack creation. Since the EC2 instance resource references this parameter, the stack cannot be deployed without it.

This response explains the root cause and presents the applied fix.

Root Cause

Error Message:

An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [KeyName] must have values


Cause: The KeyName parameter was mandatory in the template, but no value was passed in the aws cloudformation deploy command.

Impact: The EC2 instance creation fails if no SSH key pair is provided.

Fix Applied

Optional KeyName Parameter

Updated the KeyName parameter to include a Default value of "" (empty string).

This allows the template to deploy without requiring an explicit value.

Conditional EC2 KeyName

Added a CloudFormation condition (HasKeyName) that checks if a non-empty value is supplied.

EC2 instances now only set KeyName if this condition is true.

This enables deployments both with and without SSH access.

Safer Defaults

When KeyName is not provided, the instance launches without an SSH key pair (no direct SSH access).

This aligns with compliance and least privilege principles, as not all environments should expose SSH access.