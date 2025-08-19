Provider Configuration Errors
You referenced provider aliases like provider = aws.secondary in resources, but in your provider.tf you defined aliases as us_west_1 and us_east_2. This mismatch caused Terraform to raise "Provider configuration not present" errors because it could not find the alias secondary.
Resolution: Consistently use the exact alias names defined in provider.tf (e.g., aws.us_west_1).

Invalid CloudWatch Logs Export Names on RDS
Your RDS resources used "slow_query" in enabled_cloudwatch_logs_exports, but valid values require "slowquery" (no underscore). This caused validation errors on your RDS instance creation.
Resolution: Use supported log export names exactly as defined by AWS, e.g., "error", "general", "slowquery".

Random Password Resource Argument Errors
You tried to use override_characters argument in random_password resource, which does not exist. The correct argument is override_special for controlling allowed special characters in generated passwords.
Resolution: Replace override_characters with override_special.

RDS Password Characters Restriction
AWS RDS password does not allow certain special characters like /, ", or spaces, but your generated password could include those. This caused invalid parameter errors during creation.
Resolution: Limit special characters in random_password using override_special that excludes disallowed characters.

Performance Insights Configuration on Unsupported Instance Class
You enabled Performance Insights on RDS instances with types (e.g., db.t3.micro) that do not support Performance Insights, which resulted in AWS API errors.
Resolution: Either disable Performance Insights or switch to a supported instance class such as db.m5.large.

Availability Zone Errors for Subnets
You attempted to create subnets in us-west-1b, which was not enabled in your AWS account; only us-west-1a and us-west-1c were valid AZs.
Resolution: Update the AZ list in your locals or variables for the secondary region to only include valid AZs for your account.

Test Failures due to Missing Resources or Output Names
Your unit and integration tests failed for CloudTrail resources you didn’t include, for EC2 resources that didn’t exist, or for output names not matching your stack.
Resolution: Adjust or remove tests to reflect actual stack contents and naming conventions.
