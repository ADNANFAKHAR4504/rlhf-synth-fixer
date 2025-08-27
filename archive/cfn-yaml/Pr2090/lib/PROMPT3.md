aws cloudformation deploy --template-file lib/TapStack.yml --stack-name TapStack${ENVIRONMENT_SUFFIX:-dev} --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX:-dev} --tags Repository=${REPOSITORY:-unknown} CommitAuthor=${COMMIT_AUTHOR:-unknown} --s3-bucket=iac-rlhf-cfn-states-${AWS_REGION:-us-east-1} --s3-prefix=${ENVIRONMENT_SUFFIX:-dev}

Uploading to pr2090/dab9eeddc07c721d74e40c8b680dcdc1.template 17624 / 17624.0 (100.00%)
An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [ProductionAccountId, StagingAccountId] must have values
Error: Process completed with exit code 254.
