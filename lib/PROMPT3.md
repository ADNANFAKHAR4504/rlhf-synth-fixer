The exact error we got during the CloudFormation deployment was:

CloudTrail | Properties validation failed for resource CloudTrail with message:
#: required key [IsLogging] not found

This means the CloudTrail resource in our template is missing the required IsLogging property. The CloudFormation service expects this
property to be explicitly set to either true or false to indicate whether the trail should be actively logging events.

All other resources failed with "Resource creation cancelled" because they were dependent on the CloudTrail resource that failed
validation.
