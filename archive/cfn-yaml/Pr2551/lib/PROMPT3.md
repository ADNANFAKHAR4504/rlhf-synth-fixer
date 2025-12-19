Your provided TapStack.yml is failing during deployment with the following error:

=== Deploy Phase ===
✅ CloudFormation YAML project detected, deploying with AWS CLI...

> tap@0.1.0 cfn:deploy-yaml
> aws cloudformation deploy --template-file lib/TapStack.yml --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX:-dev} --tags Repository=${REPOSITORY:-unknown} CommitAuthor=${COMMIT_AUTHOR:-unknown} --s3-bucket=${CFN_S3_BUCKET:-iac-rlhf-cfn-states-${AWS_REGION:-us-east-1}} --s3-prefix=${ENVIRONMENT_SUFFIX:-dev}

Uploading to pr2551/99b6d27d6546288e227b69e0b99e738f.template  8153 / 8153.0  (100.00%)
An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [KeyName] must have values
Error: Process completed with exit code 254.

What needs fixing

The KeyName parameter in the template is required but was not provided during deployment.

For environments where SSH access is not required, this parameter should either:

Have a Default value in the template, or

Be made Optional, allowing EC2 instances to launch without a key pair.

Request

Please update the TapStack.yml so that:

The KeyName parameter is optional (or has a safe default).

The EC2 instance definition uses the key only if provided.

The template can deploy successfully without requiring a KeyName parameter when not needed.