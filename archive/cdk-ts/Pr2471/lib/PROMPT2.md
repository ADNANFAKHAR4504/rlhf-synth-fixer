The CDK synth command is failing because the S3 bucket name is too long. AWS requires bucket names to be 63 characters or less, but our current naming pattern creates a 73-character name.

The bucket name `companyname-projectname-pipeline-artifacts-938108731427-us-west-2` exceeds the limit when the account ID and region are included.

We need to shorten the bucket name prefix. Something like `cp-proj-artifacts-${account}-${region}` would work better and stay within the character limit.

The lint and build commands are working fine after fixing some formatting issues and removing an unused parameter from the test file.
