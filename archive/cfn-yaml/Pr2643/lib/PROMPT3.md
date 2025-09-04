your given TapStack.yml code is giving me a deploy error:

An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [KeyName, CertificateArn] must have values
Error: Process completed with exit code 254.


It looks like the template is expecting KeyName (for EC2 key pair) and CertificateArn (for the ALB HTTPS certificate) to be provided, but they were not passed during deployment. Please fix the template so that:

These parameters either have safe defaults (for testing) or are made optional.

The stack can still deploy without requiring me to manually input values each  time.