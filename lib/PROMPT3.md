The corrected TapStack.yml template you provided is failing during deployment with the following error:

An error occurred (ValidationError) when calling the CreateChangeSet operation: 
Parameters: [KeyPairName, DomainName, HostedZoneId, CertificateArn] must have values
Error: Process completed with exit code 254.


This indicates that the stack creation requires parameter values for KeyPairName, DomainName, HostedZoneId, and CertificateArn, but none were supplied.

I need you to fix this issue by updating the template so that:

Optional parameters like KeyPairName don’t block deployment when left empty (should allow NoValue).

Provide safe defaults or make parameters optional where possible (e.g., DomainName, HostedZoneId, CertificateArn).

Ensure the stack can still deploy successfully with default values for testing/demo purposes, while allowing overrides for production.

Pass CloudFormation validation and deploy without requiring all parameters to be manually entered every time.

Please regenerate the full TapStack.yml with these fixes applied, making sure it is deployable out of the box and compliant with best practices.