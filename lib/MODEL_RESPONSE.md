Ok so I needed to build this multi-environment CDK thing for work. Basically we have dev, test, and prod environments and needed them to be properly isolated but still use the same codebase.

Started with the basic structure - made a TapStack class that takes an environment suffix. The tricky part was getting all the environment-specific stuff right. Dev environment needs to be cheap so I used pay-per-request DynamoDB and short log retention. Prod needs to be more robust so it gets provisioned capacity and longer retention.

For security I made sure each environment can't mess with the others. The admin role has explicit deny policies that check resource tags. S3 buckets and DynamoDB tables are named with the environment suffix so there's no collision.

The S3 setup was interesting - had to use the new object ownership settings and make sure SSL is enforced. KMS keys rotate automatically and each environment gets its own alias.

DynamoDB configuration varies by environment. Dev gets the cheaper STANDARD_INFREQUENT_ACCESS table class while prod gets STANDARD. Point-in-time recovery only enabled for test and prod.

IAM was the most complex part. Application role gets minimal permissions scoped to just resources in its environment. Had to be careful with the resource ARN patterns to prevent cross-environment access.

CloudWatch logs have different retention based on environment - 7 days for dev, 90 for prod. Added metric filters to catch errors automatically.

Systems Manager parameters store environment-specific config like database connection strings and API rate limits. Everything encrypted with the environment KMS key.

For deployment just run cdk deploy with the environmentSuffix context. Pretty straightforward once you get the patterns down.

One gotcha was making sure removal policies are different per environment. Dev resources can be destroyed easily but prod resources should be retained.

The tagging strategy helps with cost allocation. Each resource gets tagged with environment, application, owner, etc.

Overall it works well - same code deploys to all environments but with appropriate settings for each. Cost optimization for dev, robustness for prod.