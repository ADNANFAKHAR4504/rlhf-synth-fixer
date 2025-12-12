[0;32m🚀 Starting Pulumi Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[0;34m📋 LocalStack Edition: pro[0m
[0;34m📋 LocalStack Version: 4.11.2.dev36[0m
[1;33m🧹 Setting up environment...[0m
[0;34m📁 Working directory: /home/adnan/turing/localstack/localstack-pulumi-Pr7732[0m
[0;34m📦 Installing dependencies...[0m
[0;32m✅ Dependencies installed[0m
[0;36m🔧 Configuring Pulumi for LocalStack:[0m
[0;34m  • AWS_ENDPOINT_URL: http://localhost:4566[0m
[0;34m  • AWS_REGION: us-east-1[0m
[0;34m  • PULUMI_BACKEND_URL: file://~/.pulumi-local[0m
[0;34m  • ENVIRONMENT_SUFFIX: dev[0m
Logged in to adnan as adnan (file://~/.pulumi-local)
[1;33m📦 Setting up Pulumi stack...[0m
[0;32m✅ Stack 'localstack-dev' ready[0m
[0;36m🏗️  Deploying infrastructure...[0m
Updating (localstack-dev):

@ updating......
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) 
@ updating......
 +  pulumi:providers:aws aws creating (0s) 
 +  pulumi:providers:aws aws created (0.00s) 
@ updating....
 +  custom:app:TapStack pulumi-infra creating (0s) 
 +  aws:ec2:Vpc zerotrust-vpc-dev creating (0s) 
 +  aws:iam:Role lambda-role-dev creating (0s) 
 +  aws:kms:Key zerotrust-kms-key-dev creating (0s) 
 +  aws:iam:Role api-gateway-role-dev creating (0s) 
 +  aws:s3:BucketV2 config-bucket-dev creating (0s) 
 +  aws:iam:Role config-role-dev creating (0s) 
 +  aws:s3:BucketV2 zerotrust-data-dev creating (0s) 
@ updating....
 +  aws:iam:Role lambda-role-dev created (1s) 
 +  aws:iam:Role api-gateway-role-dev created (1s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev creating (0s) 
 +  aws:iam:RolePolicyAttachment lambda-basic-execution-dev created (0.08s) 
 +  aws:iam:Role config-role-dev created (1s) 
 +  aws:iam:RolePolicyAttachment config-policy-attachment-dev creating (0s) 
 +  aws:iam:RolePolicyAttachment config-policy-attachment-dev created (0.09s) 
@ updating....
 +  aws:s3:BucketV2 zerotrust-data-dev created (2s) 
 +  aws:s3:BucketV2 config-bucket-dev created (2s) 
 +  aws:s3:BucketVersioningV2 zerotrust-data-versioning-dev creating (0s) 
 +  aws:s3:BucketVersioningV2 config-bucket-versioning-dev creating (0s) 
 +  aws:s3:BucketServerSideEncryptionConfigurationV2 zerotrust-data-encryption-dev creating (0s) 
 +  aws:s3:BucketPublicAccessBlock zerotrust-data-public-block-dev creating (0s) 
 +  aws:s3:BucketPolicy zerotrust-data-policy-dev creating (0s) 
 +  aws:s3:BucketPolicy config-bucket-policy-dev creating (0s) 
 +  aws:s3:BucketServerSideEncryptionConfigurationV2 zerotrust-data-encryption-dev created (0.09s) 
 +  aws:s3:BucketPublicAccessBlock zerotrust-data-public-block-dev created (0.09s) 
 +  aws:s3:BucketPolicy zerotrust-data-policy-dev created (0.12s) 
 +  aws:s3:BucketPolicy config-bucket-policy-dev created (0.13s) 
@ updating....
 +  aws:s3:BucketVersioningV2 zerotrust-data-versioning-dev created (1s) 
 +  aws:s3:BucketVersioningV2 config-bucket-versioning-dev created (1s) 
@ updating..........
 +  aws:ec2:Vpc zerotrust-vpc-dev created (10s) 
 +  aws:ec2:Subnet private-subnet-1-dev creating (0s) 
 +  aws:ec2:Subnet private-subnet-2-dev creating (0s) 
 +  aws:ec2:Subnet private-subnet-3-dev creating (0s) 
 +  aws:ec2:NetworkAcl zerotrust-nacl-dev creating (0s) 
 +  aws:ec2:SecurityGroup lambda-sg-dev creating (0s) 
 +  aws:apigateway:RestApi zerotrust-api-dev creating (0s) 
 +  aws:ec2:RouteTable private-route-table-dev creating (0s) 
 +  aws:ec2:SecurityGroup vpc-endpoint-sg-dev creating (0s) 
 +  aws:ec2:Subnet private-subnet-1-dev created (0.23s) 
 +  aws:ec2:NetworkAcl zerotrust-nacl-dev created (0.26s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-deny-dev creating (0s) 
 +  aws:ec2:NetworkAclRule nacl-egress-deny-dev creating (0s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-3306-dev creating (0s) 
 +  aws:ec2:NetworkAclRule nacl-egress-443-dev creating (0s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-443-dev creating (0s) 
 +  aws:ec2:NetworkAclRule nacl-egress-3306-dev creating (0s) 
 +  aws:ec2:Subnet private-subnet-2-dev created (0.32s) 
 +  aws:ec2:Subnet private-subnet-3-dev created (0.36s) 
@ updating....
 +  aws:ec2:NetworkAclRule nacl-egress-443-dev created (0.43s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-443-dev created (0.44s) 
 +  aws:ec2:NetworkAclRule nacl-egress-deny-dev created (0.45s) 
 +  aws:ec2:RouteTable private-route-table-dev created (0.74s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-3306-dev created (0.48s) 
 +  aws:ec2:NetworkAclRule nacl-egress-3306-dev created (0.51s) 
 +  aws:ec2:NetworkAclRule nacl-ingress-deny-dev created (0.53s) 
 +  aws:ec2:RouteTableAssociation private-subnet-1-rt-assoc-dev creating (0s) 
 +  aws:ec2:VpcEndpoint dynamodb-vpc-endpoint-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation private-subnet-2-rt-assoc-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation private-subnet-3-rt-assoc-dev creating (0s) 
 +  aws:ec2:VpcEndpoint s3-vpc-endpoint-dev creating (0s) 
 +  aws:ec2:SecurityGroup vpc-endpoint-sg-dev created (0.99s) 
 +  aws:ec2:RouteTableAssociation private-subnet-1-rt-assoc-dev created (0.22s) 
 +  aws:ec2:RouteTableAssociation private-subnet-2-rt-assoc-dev created (0.25s) 
 +  aws:ec2:SecurityGroup lambda-sg-dev created (1s) 
 +  aws:ec2:RouteTableAssociation private-subnet-3-rt-assoc-dev created (0.29s) 
 +  aws:ec2:SecurityGroup ec2-sg-dev creating (0s) 
@ updating....
 +  aws:ec2:SecurityGroup ec2-sg-dev created (0.44s) 
 +  aws:ec2:LaunchTemplate zerotrust-launch-template-dev creating (0s) 
@ updating....
 +  aws:apigateway:RestApi zerotrust-api-dev created (2s) 
 +  aws:apigateway:RequestValidator zerotrust-api-validator-dev creating (0s) 
 +  aws:apigateway:Resource zerotrust-api-resource-dev creating (0s) 
 +  aws:apigateway:RequestValidator zerotrust-api-validator-dev created (0.03s) 
 +  aws:apigateway:Resource zerotrust-api-resource-dev created (0.06s) 
 +  aws:apigateway:Method zerotrust-api-method-dev creating (0s) 
 +  aws:apigateway:Method zerotrust-api-method-dev created (0.03s) 
 +  aws:kms:Key zerotrust-kms-key-dev created (13s) 
 +  aws:kms:Alias zerotrust-kms-alias-dev creating (0s) 
 +  aws:cloudwatch:LogGroup zerotrust-logs-dev creating (0s) 
 +  aws:lambda:Function zerotrust-function-dev creating (0s) 
 +  aws:kms:Alias zerotrust-kms-alias-dev created (0.03s) 
@ updating....
 +  aws:cloudwatch:LogGroup zerotrust-logs-dev created (0.85s) 
 +  aws:iam:RolePolicy lambda-policy-dev creating (0s) 
 +  aws:iam:RolePolicy lambda-policy-dev created (0.08s) 
@ updating.....
 +  aws:ec2:VpcEndpoint dynamodb-vpc-endpoint-dev created (5s) 
 +  aws:ec2:VpcEndpoint s3-vpc-endpoint-dev created (5s) 
@ updating....
 +  aws:ec2:LaunchTemplate zerotrust-launch-template-dev created (5s) 
@ updating.....
 +  aws:lambda:Function zerotrust-function-dev created (6s) 
 +  aws:apigateway:Integration zerotrust-api-integration-dev creating (0s) 
 +  aws:lambda:Permission api-gateway-lambda-permission-dev creating (0s) 
 +  aws:iam:RolePolicy api-gateway-policy-dev creating (0s) 
@ updating....
 +  aws:apigateway:Integration zerotrust-api-integration-dev created (0.10s) 
 +  aws:lambda:Permission api-gateway-lambda-permission-dev created (0.10s) 
 +  aws:apigateway:Deployment zerotrust-api-deployment-dev creating (0s) 
 +  aws:iam:RolePolicy api-gateway-policy-dev created (0.13s) 
 +  aws:apigateway:Deployment zerotrust-api-deployment-dev created (0.07s) 
 +  aws:apigateway:Stage zerotrust-api-stage-dev creating (0s) 
 +  aws:apigateway:Stage zerotrust-api-stage-dev created (0.04s) 
@ updating....
 +  pulumi:pulumi:Stack TapStack-localstack-dev created (23s) 
Outputs:
    api_gateway_endpoint: "https://nwlortshsg.execute-api.us-east-1.amazonaws.com/prod/execute"
    kms_key_arn         : "arn:aws:kms:us-east-1:000000000000:key/85bbdc3f-e706-4ae8-84f0-e78530cf1c61"
    lambda_function_name: "zerotrust-function-dev"
    log_group_name      : "/aws/zerotrust/dev"
    s3_bucket_name      : "zerotrust-data-dev"
    subnet_ids          : [
        [0]: "subnet-9878b3472e18ad5ba"
        [1]: "subnet-68c7477332cd1681a"
        [2]: "subnet-70686783dc9a8d788"
    ]
    vpc_id              : "vpc-dc6d688bfe1648c9e"

Resources:
    + 51 created

Duration: 28s

[0;32m✅ Stack deployment completed successfully![0m
[0;32m⏱️  Total deployment time: 29s[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/pulumi-outputs.json[0m
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
[0;36m📊 Final Resource Summary:[0m
--------------------------------------------------------------------------------------------
|                                    Resource Summary                                       |
+------------------------------------------+-----------------------------+------------------+
--------------------------------------------
|               DescribeVpcs               |
+------------------------+-----------------+
|  vpc-b3da77ae34e27b3d4 |  172.31.0.0/16  |
|  vpc-dc6d688bfe1648c9e |  10.0.0.0/16    |
+------------------------+-----------------+
2025-12-12 16:58:32 config-bucket-dev
2025-12-12 16:58:32 zerotrust-data-dev
------------------------------------------
|              ListFunctions             |
+-------------------------+--------------+
|  zerotrust-function-dev |  python3.11  |
+-------------------------+--------------+
-------------------------------------
|            GetRestApis            |
+--------------------+--------------+
|  zerotrust-api-dev |  nwlortshsg  |
+--------------------+--------------+
+------------------------------------------+-----------------------------+------------------+
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: localstack-dev[0m
[0;34m  • Status: CREATE_COMPLETE[0m
[0;34m  • Duration: 29s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 Pulumi deployment to LocalStack completed successfully![0m

[0;32m📄 Deployment log saved to: Execution-output.md[0m
[0;32m📄 Stack outputs saved to: cfn-outputs/pulumi-outputs.json[0m
