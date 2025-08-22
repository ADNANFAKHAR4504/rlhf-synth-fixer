Working through this CloudFormation template, several issues came up that needed fixes during development and testing.

The initial approach used hardcoded parameters for sensitive data like temporary passwords, which CloudFormation flagged as a security issue. Had to switch to AWS Secrets Manager with dynamic references instead of passing secrets through parameters.

S3 bucket naming caused problems with global uniqueness. The original template used static bucket names that would conflict between deployments. Fixed this by adding environment suffixes and letting CloudFormation generate unique names when needed.

CloudTrail configuration was tricky with the S3 data resources. Initially tried to include bucket-level logging with ARNs that don't end in "/*", but CloudTrail only accepts object-level ARNs for S3 data events. Had to remove the bucket-level references and stick with object-level logging only.

The IAM policy for regional EC2 restrictions needed both allow and deny statements to work properly. Just having the allow statement with regional conditions wasn't sufficient - had to explicitly deny EC2 instance operations outside us-west-2.

S3 bucket policies required full ARN format for resources, not just bucket names. Several iterations were needed to get the proper "arn:aws:s3:::" prefix format working correctly.

During deployment, ran into issues with S3 buckets not being empty during stack deletion. Added lifecycle policies to automatically clean up incomplete multipart uploads and old versions to prevent the "bucket not empty" errors.

Password generation for IAM users needed careful character exclusion. Too many excluded characters meant the password didn't meet AWS requirements for symbols, but too few caused CloudFormation template parsing issues with special characters.