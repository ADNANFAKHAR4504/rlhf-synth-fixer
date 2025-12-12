[0;34m🧪 Running Integration Tests against LocalStack...[0m
[0;32m✅ LocalStack pro is running[0m
[0;32m✅ Infrastructure outputs found[0m
[0;32m✅ Infrastructure outputs validated[0m
[0;32m✅ Dependencies ready[0m
[1;33m🔧 Setting up LocalStack environment...[0m
[0;34m🌐 Environment configured for LocalStack:[0m
[1;33m  • AWS_ENDPOINT_URL: http://localhost:4566[0m
[1;33m  • AWS_REGION: us-east-1[0m
[1;33m🚀 Starting resource verification...[0m

[0;34m📋 Stack Outputs:[0m
{
    "api_gateway_endpoint": "https://nwlortshsg.execute-api.us-east-1.amazonaws.com/prod/execute",
    "kms_key_arn": "arn:aws:kms:us-east-1:000000000000:key/85bbdc3f-e706-4ae8-84f0-e78530cf1c61",
    "lambda_function_name": "zerotrust-function-dev",
    "log_group_name": "/aws/zerotrust/dev",
    "s3_bucket_name": "zerotrust-data-dev",
    "subnet_ids": [
        "subnet-9878b3472e18ad5ba",
        "subnet-68c7477332cd1681a",
        "subnet-70686783dc9a8d788"
    ],
    "vpc_id": "vpc-dc6d688bfe1648c9e"
}

=== VPC Validation ===
-------------------------------------------------------
|                    DescribeVpcs                     |
+------------------------+---------------+------------+
|  vpc-dc6d688bfe1648c9e |  10.0.0.0/16  |  available |
+------------------------+---------------+------------+
[0;32m✅ VPC exists[0m

=== Subnets Validation ===
-----------------------------------------------------------
|                     DescribeSubnets                     |
+---------------------------+---------------+-------------+
|  subnet-9878b3472e18ad5ba |  10.0.1.0/24  |  us-east-1a |
|  subnet-68c7477332cd1681a |  10.0.2.0/24  |  us-east-1b |
|  subnet-70686783dc9a8d788 |  10.0.3.0/24  |  us-east-1c |
+---------------------------+---------------+-------------+
[0;32m✅ Subnets exist[0m

=== S3 Buckets Validation ===
2025-12-12 16:58:32 config-bucket-dev
2025-12-12 16:58:32 zerotrust-data-dev
[0;32m✅ S3 buckets exist[0m

=== KMS Key Validation ===
------------------------------------------
|               DescribeKey              |
+----------------------------------------+
|  85bbdc3f-e706-4ae8-84f0-e78530cf1c61  |
|  True                                  |
|  Enabled                               |
+----------------------------------------+
[0;32m✅ KMS key exists[0m

=== Lambda Function Validation ===
----------------------------
|        GetFunction       |
+--------------------------+
|  zerotrust-function-dev  |
|  python3.11              |
|  index.handler           |
+--------------------------+
[0;32m✅ Lambda function exists[0m

=== API Gateway Validation ===
-------------------------------------------------
|                  GetRestApis                  |
+-------------------+--------------+------------+
|  zerotrust-api-dev|  nwlortshsg  |  REGIONAL  |
+-------------------+--------------+------------+
[0;32m✅ API Gateway exists[0m

=== Security Groups Validation ===
------------------------------------------------------------------------------------------------
|                                    DescribeSecurityGroups                                    |
+----------------------+-------------------------------+---------------------------------------+
|  sg-0292fe30616c99f55|  default                      |  default VPC security group           |
|  sg-9cae220b3f0598965|  lambda-sg-dev-fdf7ddc        |  Security group for Lambda functions  |
|  sg-41db68d0ac458001a|  vpc-endpoint-sg-dev-7e567b5  |  Security group for VPC endpoints     |
|  sg-0ae3b2042df865079|  ec2-sg-dev-0eeee1a           |  Security group for EC2 instances     |
+----------------------+-------------------------------+---------------------------------------+
[0;32m✅ Security groups exist[0m

=== VPC Endpoints Validation ===
---------------------------------------------------------------------------
|                          DescribeVpcEndpoints                           |
+-------------------------+------------------------------------+----------+
|  vpce-a2f2cd755c4fdc663 |  com.amazonaws.us-east-1.dynamodb  |  Gateway |
|  vpce-ba6552360083f6a29 |  com.amazonaws.us-east-1.s3        |  Gateway |
+-------------------------+------------------------------------+----------+
[0;32m✅ VPC Endpoints exist[0m

=== CloudWatch Log Group Validation ===
------------------------------
|      DescribeLogGroups     |
+----------------------+-----+
|  /aws/zerotrust/dev  |  90 |
+----------------------+-----+
[0;32m✅ Log group exists[0m

=== IAM Roles Validation ===
--------------------------
|        ListRoles       |
+------------------------+
|  lambda-role-dev       |
|  config-role-dev       |
|  api-gateway-role-dev  |
+------------------------+
[0;32m✅ IAM roles exist[0m

=== Network ACL Validation ===
------------------------------------
|        DescribeNetworkAcls       |
+------------------------+---------+
|  acl-1994bc59508e1b2d7 |  True   |
|  acl-b750e3390bfa25fc9 |  False  |
+------------------------+---------+
[0;32m✅ Network ACLs exist[0m

[0;36m🔒 Security Compliance Checks:[0m
[0;32m✅ Zero-Trust Network: No Internet Gateway attached[0m
[0;32m✅ Private Subnets: All subnets are private[0m
[0;32m✅ VPC Endpoints: S3 and DynamoDB accessible via Gateway endpoints[0m
[0;32m✅ Encryption: KMS key configured[0m
[0;32m✅ S3 Encryption: SSE-AES256 enabled[0m
[0;32m✅ CloudWatch Logs: 90-day retention configured[0m
[0;32m✅ Lambda: VPC-enabled with security groups[0m
[0;32m✅ API Gateway: IAM authorization enabled[0m

[0;34m📋 LocalStack Compatibility Notes:[0m
[1;33m  ℹ️  NetworkAclAssociation skipped: LocalStack/Moto limitation[0m
[1;33m  ℹ️  AWS Config Recorder conditionally disabled[0m
[1;33m  ℹ️  S3 path-style access enabled for LocalStack[0m

[0;32m🎉 Integration verification completed![0m
[0;34m📊 Test Summary:[0m
[1;33m  • All infrastructure components verified[0m
[1;33m  • LocalStack environment validated[0m
[1;33m  • Resources properly configured[0m

[0;32m📄 Test results saved to: int-test-output.md[0m
