# LocalStack Deployment Test

**Date:** $(date)
**Task:** archive/cfn-yaml/Pr1616
**Platform:** cfn
**Language:** yaml
**PR ID:** Pr1616

---

{
    "Parameters": [
        {
            "ParameterKey": "ProjectName",
            "DefaultValue": "securewebapp",
            "NoEcho": false,
            "Description": "Prefix for naming all resources"
        },
        {
            "ParameterKey": "AllowedIPRange",
            "DefaultValue": "0.0.0.0/0",
            "NoEcho": false,
            "Description": "CIDR range allowed to access the application"
        }
    ],
    "Description": "Fully automated secure web application infrastructure (VPC, IAM, S3, CloudTrail, CloudWatch, Config)"
}

## Deployment
```
Creating CloudFormation stack: tap-stack-Pr1616
Checking stack status...
	CREATE_COMPLETE	None
Extracting stack outputs...
[
    {
        "OutputKey": "AppBucketName",
        "OutputValue": "s3-tap-dev-000000000000-us-east-1-app"
    },
    {
        "OutputKey": "CloudTrailArn",
        "OutputValue": "arn:aws:cloudtrail:us-east-1:000000000000:trail/cloudtrail-tap-dev"
    },
    {
        "OutputKey": "CloudTrailBucketName",
        "OutputValue": "s3-tap-dev-000000000000-us-east-1-cloudtrail"
    },
    {
        "OutputKey": "KmsKeyArn",
        "OutputValue": "arn:aws:kms:us-east-1:000000000000:key/4bfc5db0-c99b-4271-ac9f-24f264deb489"
    },
    {
        "OutputKey": "PrivateSubnets",
        "OutputValue": "subnet-5b967743190e8f6d0,subnet-2e7766c587d52e2fe"
    },
    {
        "OutputKey": "PublicSubnets",
        "OutputValue": "subnet-9f95c770cc24857e3,subnet-ec66e953c9f7aa508"
    },
    {
        "OutputKey": "SecurityHubStatus",
        "OutputValue": "Skipped"
    },
    {
        "OutputKey": "SsmParamDbPassword",
        "OutputValue": "/tap/dev/DB_PASSWORD"
    },
    {
        "OutputKey": "VpcId",
        "OutputValue": "vpc-d8b84e7521b529573"
    }
]
Listing stack resources:

Stack Status: CREATE_FAILED

Getting failure details:
{
    "events": [
        {
            "timestamp": 1766547274592,
            "message": "START RequestId: 0ae0b570-3721-42f5-9a47-3d065d7a759f Version: $LATEST\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "Error: An error occurred (NoSuchConfigurationRecorderException) when calling the StartConfigurationRecorder operation: Cannot find configuration recorder with the specified name 'securewebapp-config-recorder'.\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "http://s3.localhost.localstack.cloud.localstack.cloud:4566/localstack-cf-custom-resources-results/4b4bc779?AWSAccessKeyId=000000000000&Signature=zg1pEXG9OQNBxzkcQBJNzQAv%2BkI%3D&Expires=1766550867\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "Response body:\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "{\"Status\": \"FAILED\", \"Reason\": \"See the details in CloudWatch Log Stream: 2025/12/24/[$LATEST]bd81b8a772216b368a350432d8d506e4\", \"PhysicalResourceId\": \"2025/12/24/[$LATEST]bd81b8a772216b368a350432d8d506e4\", \"StackId\": \"arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-Pr1616/0e9d9487-e4ab-432f-9e0d-7c258ada9760\", \"RequestId\": \"97359541\", \"LogicalResourceId\": \"StartConfigRecorder\", \"NoEcho\": false, \"Data\": {}}\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "Status code: 200\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "END RequestId: 0ae0b570-3721-42f5-9a47-3d065d7a759f\n",
            "ingestionTime": 1766547274622
        },
        {
            "timestamp": 1766547274592,
            "message": "REPORT RequestId: 0ae0b570-3721-42f5-9a47-3d065d7a759f\tDuration: 261.09 ms\tBilled Duration: 262 ms\tMemory Size: 128 MB\tMax Memory Used: 128 MB\t\n",
            "ingestionTime": 1766547274622
        }
    ],
    "nextForwardToken": "f/00000000000000000000000000000000000000000000000000000007",
    "nextBackwardToken": "b/00000000000000000000000000000000000000000000000000000000"
}

## Stack Failure Analysis

**Status:** CREATE_FAILED

**Root Cause:** 
AWS Config service is not fully supported in LocalStack. The ConfigurationRecorder resource was created as a "fallback" resource (not actually functional), which caused the custom Lambda function `StartConfigRecorder` to fail when attempting to start it.

**Failure Chain:**
1. ConfigurationRecorder created as fallback (non-functional)
2. StartConfigRecorder Lambda invoked
3. Lambda failed with: `NoSuchConfigurationRecorderException: Cannot find configuration recorder with the specified name 'securewebapp-config-recorder'`
4. StartConfigRecorder custom resource failed
5. IAMPolicyChangeRule (AWS::Config::ConfigRule) failed due to dependency
6. Stack creation failed and rolled back

**Successfully Created Resources (before failure):**
- VPC (vpc-314254a3086adf621)
- Internet Gateway (igw-7a3676061d9ea11e3)
- VPC Gateway Attachment
- S3 Buckets:
  - AppBucket: securewebapp-app-000000000000-us-east-1
  - CloudTrailBucket: securewebapp-logs-000000000000-us-east-1
  - ConfigBucket: securewebapp-config-000000000000-us-east-1
- IAM Roles:
  - AppRole: tap-stack-Pr1616-AppRole-af01fe38
  - CloudTrailRole: tap-stack-Pr1616-CloudTrailRole-9f703d53
  - ConfigRole: tap-stack-Pr1616-ConfigRole-f3e3d7d3
  - LambdaExecutionRole: tap-stack-Pr1616-LambdaExecutionRole-a0a77511
- IAM Instance Profile: tap-stack-Pr1616-AppInstanceProfile-03073901
- CloudTrail Trail: securewebapp-trail
- CloudWatch Log Group: /aws/cloudtrail/securewebapp
- S3 Bucket Policy for CloudTrail
- DynamoDB Table: securewebapp-AppData
- Lambda Function: tap-stack-Pr1616-StartConfigRecorderFunct-f031d8b1
- DeliveryChannel (fallback)
- ConfigurationRecorder (fallback - non-functional)

**Failed Resources:**
- StartConfigRecorder (Custom::StartRecorder)
- IAMPolicyChangeRule (AWS::Config::ConfigRule)

**Resources Not Created:**
Due to rollback, the following resources were not created:
- Subnets (PublicSubnet1, PublicSubnet2, PrivateSubnet1, PrivateSubnet2)
- NAT Gateways (NatGateway1, NatGateway2)
- Elastic IPs for NAT Gateways
- Route Tables and Routes
- Security Groups
- CloudWatch Alarms
- Metric Filters
- UnauthorizedAlarm

**LocalStack Limitations:**
1. AWS Config service is not fully functional (Pro feature limitation)
2. ConfigurationRecorder cannot be started
3. ConfigRule resources depend on functional Config service
4. Custom resources that interact with Config will fail

**Recommended Fixes for LocalStack Compatibility:**
1. Remove AWS Config resources (ConfigurationRecorder, DeliveryChannel, ConfigRole, IAMPolicyChangeRule)
2. Remove the custom Lambda resource StartConfigRecorder
3. Remove LambdaExecutionRole if only used for Config
4. Keep core infrastructure: VPC, S3, IAM, DynamoDB, CloudTrail, CloudWatch


---

## Summary

### DEPLOYMENT FAILED

**Deployment Status:** FAILED
**Test Status:** NOT RUN (deployment prerequisite failed)

**Primary Issue:** AWS Config service incompatibility with LocalStack
- AWS Config ConfigurationRecorder is not fully supported in LocalStack
- Custom Lambda function attempting to start the Config recorder failed
- This caused cascading failures and stack rollback

**Services Tested:**
- VPC: PARTIAL (created but rolled back)
- S3: PARTIAL (created but rolled back)  
- IAM: PARTIAL (created but rolled back)
- DynamoDB: PARTIAL (created but rolled back)
- CloudTrail: PARTIAL (created but rolled back)
- CloudWatch Logs: PARTIAL (created but rolled back)
- Lambda: PARTIAL (created but failed)
- AWS Config: FAILED (not supported)

**Complexity Assessment:** HARD
- Multiple AWS services with complex dependencies
- AWS Config requires Pro features
- Custom resources add additional complexity
- 50+ resources in template

**Migration Recommendation:** REQUIRES FIXES
To make this template LocalStack-compatible:
1. Remove all AWS Config resources (lines 359-488)
2. Remove Lambda custom resource for Config (lines 420-477)
3. Consider mocking Config functionality if needed for tests
4. All other services should work correctly after these changes

