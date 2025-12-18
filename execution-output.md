# Pulumi LocalStack Deployment Execution Output

**Execution Date:** 2025-12-18 09:44:31

---

\033[0;32m🚀 Starting Pulumi Deploy to LocalStack...\033[0m
\033[0;32m✅ LocalStack is running\033[0m
\033[0;32m✅ Pulumi project found: Pulumi.yaml\033[0m
\033[0;34m🔧 Using Pulumi: v3.200.0\033[0m
**Pulumi Version:** v3.200.0
\033[1;33m🔧 Setting up Pulumi local backend...\033[0m
\033[0;32m✅ Pulumi local backend configured\033[0m
\033[0;34m📋 Pulumi runtime: python\033[0m
**Runtime:** python
\033[1;33m📦 Installing dependencies...\033[0m
\033[0;32m✅ Python dependencies installed\033[0m

## Stack Configuration
- **Stack Name:** localstack-dev
- **Environment:** dev
- **Region:** us-east-1

\033[1;33m🔧 Checking Pulumi stack...\033[0m
\033[0;32m✅ Stack selected: localstack-dev\033[0m
\033[1;33m🔧 Configuring AWS provider for LocalStack...\033[0m
\033[0;32m✅ AWS provider configured for LocalStack\033[0m
## Deployment
**Started:** 2025-12-18 09:45:35

\033[1;33m📦 Deploying Pulumi stack...\033[0m
\033[0;36m🔧 Deploying stack:\033[0m
\033[0;34m  • Stack Name: localstack-dev\033[0m
\033[0;34m  • Environment: dev\033[0m
\033[0;34m  • Region: us-east-1\033[0m
### Deployment Output
```
Previewing update (localstack-dev):
@ previewing update.........

@ previewing update...........................
 +  pulumi:pulumi:Stack TapStack-localstack-dev create 
@ previewing update..............
 +  pulumi:providers:aws aws create 
 +  tap:stack:TapStack multi-tenant-saas create 
 +  aws:ec2:Vpc saas-vpc-dev create 
 +  aws:kms:Key kms-tenant-001-dev create 
 +  aws:kms:Key kms-tenant-004-dev create 
 +  aws:kms:Key kms-tenant-005-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev create 
 +  aws:kms:Key kms-tenant-003-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev create 
 +  aws:iam:Role lambda-role-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev create 
 +  aws:kms:Key kms-tenant-002-dev create 
 +  aws:apigateway:RestApi api-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev create 
@ previewing update....
 +  aws:ec2:InternetGateway saas-igw-dev create 
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev create 
@ previewing update....
 +  aws:ec2:RouteTable rt-tenant-003-dev create 
 +  aws:ec2:RouteTable rt-tenant-004-dev create 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev create 
 +  aws:ec2:RouteTable rt-tenant-002-dev create 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev create 
 +  aws:ec2:RouteTable rt-tenant-001-dev create 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev create 
 +  aws:ec2:RouteTable rt-tenant-005-dev create 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev create 
 +  aws:kms:Alias alias-tenant-004-dev create 
 +  aws:kms:Alias alias-tenant-001-dev create 
 +  aws:dynamodb:Table table-tenant-004-data-dev create 
 +  aws:dynamodb:Table table-tenant-004-users-dev create 
 +  aws:dynamodb:Table table-tenant-001-users-dev create 
@ previewing update....
 +  aws:dynamodb:Table table-tenant-001-data-dev create 
 +  aws:kms:Alias alias-tenant-003-dev create 
@ previewing update....
 +  aws:dynamodb:Table table-tenant-003-users-dev create 
 +  aws:dynamodb:Table table-tenant-003-data-dev create 
 +  aws:kms:Alias alias-tenant-005-dev create 
 +  aws:dynamodb:Table table-tenant-005-users-dev create 
 +  aws:dynamodb:Table table-tenant-005-data-dev create 
 +  aws:kms:Alias alias-tenant-002-dev create 
 +  aws:lambda:Function authorizer-lambda-dev create 
 +  aws:dynamodb:Table table-tenant-002-users-dev create 
 +  aws:dynamodb:Table table-tenant-002-data-dev create 
 +  aws:apigateway:Resource api-resource-tenants-dev create 
 +  aws:ec2:Route route-tenant-003-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev create 
 +  aws:ec2:Route route-tenant-004-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev create 
 +  aws:ec2:Route route-tenant-002-dev create 
@ previewing update....
 +  aws:ec2:Route route-tenant-001-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev create 
 +  aws:ec2:Route route-tenant-005-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev create 
 +  aws:lambda:Function lambda-tenant-005-dev create 
 +  aws:lambda:Function lambda-tenant-003-dev create 
 +  aws:lambda:Function lambda-tenant-001-dev create 
 +  aws:lambda:Function lambda-tenant-004-dev create 
 +  aws:lambda:Function lambda-tenant-002-dev create 
 +  aws:apigateway:Authorizer api-authorizer-dev create 
 +  aws:apigateway:Resource api-resource-tenant-id-dev create 
 +  aws:iam:RolePolicy lambda-policy-dev create 
@ previewing update....
 +  aws:apigateway:Resource api-resource-users-dev create 
 +  aws:apigateway:Method api-method-get-dev create 
@ previewing update....
 +  pulumi:pulumi:Stack TapStack-localstack-dev create 
Outputs:
    api_id                    : [unknown]
    api_url                   : [unknown]
    tenant-001_data_table     : "tenant-tenant-001-data-dev"
    tenant-001_kms_key_id     : [unknown]
    tenant-001_lambda_function: "lambda-tenant-001-dev-76681a2"
    tenant-001_subnet_ids     : [unknown]
    tenant-001_users_table    : "tenant-tenant-001-users-dev"
    tenant-002_data_table     : "tenant-tenant-002-data-dev"
    tenant-002_kms_key_id     : [unknown]
    tenant-002_lambda_function: "lambda-tenant-002-dev-50f17a4"
    tenant-002_subnet_ids     : [unknown]
    tenant-002_users_table    : "tenant-tenant-002-users-dev"
    tenant-003_data_table     : "tenant-tenant-003-data-dev"
    tenant-003_kms_key_id     : [unknown]
    tenant-003_lambda_function: "lambda-tenant-003-dev-a5b148f"
    tenant-003_subnet_ids     : [unknown]
    tenant-003_users_table    : "tenant-tenant-003-users-dev"
    tenant-004_data_table     : "tenant-tenant-004-data-dev"
    tenant-004_kms_key_id     : [unknown]
    tenant-004_lambda_function: "lambda-tenant-004-dev-c2f8bf8"
    tenant-004_subnet_ids     : [unknown]
    tenant-004_users_table    : "tenant-tenant-004-users-dev"
    tenant-005_data_table     : "tenant-tenant-005-data-dev"
    tenant-005_kms_key_id     : [unknown]
    tenant-005_lambda_function: "lambda-tenant-005-dev-483315b"
    tenant-005_subnet_ids     : [unknown]
    tenant-005_users_table    : "tenant-tenant-005-users-dev"
    vpc_id                    : [unknown]

Resources:
    + 74 to create

Updating (localstack-dev):
@ updating...........

@ updating.............
 +  pulumi:pulumi:Stack TapStack-localstack-dev creating (0s) 
@ updating.......................
 +  pulumi:providers:aws aws creating (0s) 
 +  pulumi:providers:aws aws created (0.01s) 
 +  tap:stack:TapStack multi-tenant-saas creating (0s) 
 +  aws:ec2:Vpc saas-vpc-dev creating (0s) 
 +  aws:kms:Key kms-tenant-001-dev creating (0s) 
 +  aws:kms:Key kms-tenant-003-dev creating (0s) 
 +  aws:kms:Key kms-tenant-002-dev creating (0s) 
 +  aws:iam:Role lambda-role-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev creating (0s) 
 +  aws:kms:Key kms-tenant-005-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev creating (0s) 
 +  aws:apigateway:RestApi api-dev creating (0s) 
 +  aws:kms:Key kms-tenant-004-dev creating (0s) 
@ updating....
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev created (0.96s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev created (0.97s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev created (0.92s) 
 +  aws:apigateway:RestApi api-dev created (0.90s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev created (0.98s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev created (0.95s) 
 +  aws:iam:Role lambda-role-dev created (1s) 
 +  aws:apigateway:Resource api-resource-tenants-dev creating (0s) 
 +  aws:lambda:Function authorizer-lambda-dev creating (0s) 
 +  aws:apigateway:Resource api-resource-tenants-dev created (0.14s) 
@ updating....
 +  aws:apigateway:Resource api-resource-tenant-id-dev creating (0s) 
 +  aws:apigateway:Resource api-resource-tenant-id-dev created (0.21s) 
 +  aws:apigateway:Resource api-resource-users-dev creating (0s) 
 +  aws:apigateway:Resource api-resource-users-dev created (0.13s) 
@ updating......
 +  aws:kms:Key kms-tenant-003-dev created (4s) 
 +  aws:kms:Alias alias-tenant-003-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-003-data-dev creating (0s) 
 +  aws:kms:Key kms-tenant-001-dev created (4s) 
 +  aws:dynamodb:Table table-tenant-003-users-dev creating (0s) 
 +  aws:kms:Key kms-tenant-002-dev created (5s) 
 +  aws:kms:Alias alias-tenant-003-dev created (0.21s) 
 +  aws:dynamodb:Table table-tenant-001-users-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-001-data-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-001-dev creating (0s) 
 +  aws:kms:Key kms-tenant-005-dev created (5s) 
@ updating....
 +  aws:kms:Key kms-tenant-004-dev created (5s) 
 +  aws:dynamodb:Table table-tenant-002-data-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-002-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-002-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-001-dev created (0.58s) 
 +  aws:kms:Alias alias-tenant-005-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-005-data-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-005-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-004-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-004-users-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-004-data-dev creating (0s) 
@ updating....
 +  aws:kms:Alias alias-tenant-002-dev created (0.61s) 
 +  aws:kms:Alias alias-tenant-005-dev created (0.93s) 
 +  aws:kms:Alias alias-tenant-004-dev created (0.89s) 
@ updating....
 +  aws:lambda:Function authorizer-lambda-dev created (6s) 
 +  aws:apigateway:Authorizer api-authorizer-dev creating (0s) 
 +  aws:apigateway:Authorizer api-authorizer-dev created (0.12s) 
 +  aws:apigateway:Method api-method-get-dev creating (0s) 
 +  aws:apigateway:Method api-method-get-dev created (0.13s) 
@ updating......
 +  aws:ec2:Vpc saas-vpc-dev created (11s) 
@ updating....
 +  aws:ec2:InternetGateway saas-igw-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-005-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-002-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-004-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-003-dev creating (0s) 
@ updating.....
@ updating.... +  aws:ec2:InternetGateway saas-igw-dev created (2s) 

 +  aws:dynamodb:Table table-tenant-003-data-dev created (10s) 
 +  aws:ec2:RouteTable rt-tenant-001-dev created (3s) 
@ updating....
 +  aws:ec2:Route route-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-005-dev created (3s) 
 +  aws:ec2:Route route-tenant-005-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-003-dev created (3s) 
 +  aws:dynamodb:Table table-tenant-003-users-dev created (11s) 
 +  aws:ec2:RouteTable rt-tenant-002-dev created (4s) 
 +  aws:ec2:RouteTable rt-tenant-004-dev created (4s) 
 +  aws:dynamodb:Table table-tenant-001-users-dev created (10s) 
 +  aws:ec2:Route route-tenant-003-dev creating (0s) 
@ updating....
 +  aws:dynamodb:Table table-tenant-001-data-dev created (11s) 
 +  aws:dynamodb:Table table-tenant-002-users-dev created (10s) 
 +  aws:dynamodb:Table table-tenant-002-data-dev created (11s) 
 +  aws:ec2:Route route-tenant-002-dev creating (0s) 
 +  aws:ec2:Route route-tenant-004-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-005-users-dev created (11s) 
 +  aws:dynamodb:Table table-tenant-005-data-dev created (11s) 
 +  aws:dynamodb:Table table-tenant-004-users-dev created (11s) 
 +  aws:ec2:Route route-tenant-001-dev created (1s) 
 +  aws:dynamodb:Table table-tenant-004-data-dev created (11s) 
 +  aws:ec2:Route route-tenant-005-dev created (1s) 
@ updating....
 +  aws:ec2:Route route-tenant-003-dev created (1s) 
 +  aws:ec2:Route route-tenant-002-dev created (1s) 
 +  aws:ec2:Route route-tenant-004-dev created (1s) 
@ updating....
 +  aws:iam:RolePolicy lambda-policy-dev creating (0s) 
@ updating....
 +  aws:iam:RolePolicy lambda-policy-dev created (0.89s) 
@ updating.......
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev created (12s) 
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev created (12s) 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev created (12s) 
@ updating....
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev created (12s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev created (12s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev created (0.22s) 
 +  aws:lambda:Function lambda-tenant-002-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev created (0.28s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev created (0.41s) 
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev created (13s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev created (0.46s) 
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev created (13s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev created (13s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev created (0.66s) 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev created (13s) 
@ updating....
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev created (13s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev created (0.43s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-003-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-005-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev created (0.61s) 
@ updating....
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev created (0.64s) 
 +  aws:lambda:Function lambda-tenant-004-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev created (0.69s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev created (0.70s) 
@ updating.......
 +  aws:lambda:Function lambda-tenant-002-dev created (6s) 
@ updating....
 +  aws:lambda:Function lambda-tenant-001-dev created (6s) 
 +  aws:lambda:Function lambda-tenant-003-dev created (6s) 
 +  aws:lambda:Function lambda-tenant-005-dev created (6s) 
@ updating....
 +  aws:lambda:Function lambda-tenant-004-dev created (5s) 
@ updating.....
 +  pulumi:pulumi:Stack TapStack-localstack-dev created (52s) 
Outputs:
    api_id                    : "dpwd18pt3y"
    api_url                   : "https://dpwd18pt3y.execute-api.us-east-1.amazonaws.com/prod"
    tenant-001_data_table     : "tenant-tenant-001-data-dev"
    tenant-001_kms_key_id     : "91311787-7b8f-4aa6-b3c1-5118b6eff79a"
    tenant-001_lambda_function: "lambda-tenant-001-dev-258a048"
    tenant-001_subnet_ids     : [
        [0]: "subnet-5777bc0b9bf36fdcd"
        [1]: "subnet-7fdc06cabffa9824d"
    ]
    tenant-001_users_table    : "tenant-tenant-001-users-dev"
    tenant-002_data_table     : "tenant-tenant-002-data-dev"
    tenant-002_kms_key_id     : "33bd4619-ad84-4737-a361-1197fd99dab1"
    tenant-002_lambda_function: "lambda-tenant-002-dev-4114eb6"
    tenant-002_subnet_ids     : [
        [0]: "subnet-24529ae9bed550587"
        [1]: "subnet-03464f20b29e20432"
    ]
    tenant-002_users_table    : "tenant-tenant-002-users-dev"
    tenant-003_data_table     : "tenant-tenant-003-data-dev"
    tenant-003_kms_key_id     : "a3a3d496-f0b3-495e-9d78-02ee42e66f49"
    tenant-003_lambda_function: "lambda-tenant-003-dev-fa4d7bc"
    tenant-003_subnet_ids     : [
        [0]: "subnet-5b48bd0e5651f6365"
        [1]: "subnet-db8c179fdaa63c22c"
    ]
    tenant-003_users_table    : "tenant-tenant-003-users-dev"
    tenant-004_data_table     : "tenant-tenant-004-data-dev"
    tenant-004_kms_key_id     : "31731265-8d23-404d-8c17-4b0b50d249e4"
    tenant-004_lambda_function: "lambda-tenant-004-dev-d587edd"
    tenant-004_subnet_ids     : [
        [0]: "subnet-1a3d01c78300f65bd"
        [1]: "subnet-79447eb70f541a870"
    ]
    tenant-004_users_table    : "tenant-tenant-004-users-dev"
    tenant-005_data_table     : "tenant-tenant-005-data-dev"
    tenant-005_kms_key_id     : "5c751c68-a2ca-4a69-b095-8bc12c858c5d"
    tenant-005_lambda_function: "lambda-tenant-005-dev-3e2f5e9"
    tenant-005_subnet_ids     : [
        [0]: "subnet-b3a7931e6da31a463"
        [1]: "subnet-bbb31937213a534e5"
    ]
    tenant-005_users_table    : "tenant-tenant-005-users-dev"
    vpc_id                    : "vpc-3cf06dd4ac6091b2e"

Resources:
    + 74 created

Duration: 1m5s

```

\033[0;32m✅ Pulumi deployment completed successfully\033[0m
\033[0;32m⏱️  Total deployment time: 119s\033[0m
**Ended:** 2025-12-18 09:47:34
**Duration:** 119s

\033[1;33m📊 Generating stack outputs...\033[0m
\033[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json\033[0m
## Stack Outputs
\033[0;34m📋 Stack Outputs:\033[0m
  • api_id: dpwd18pt3y
  • api_url: https://dpwd18pt3y.execute-api.us-east-1.amazonaws.com/prod
  • tenant-001_data_table: tenant-tenant-001-data-dev
  • tenant-001_kms_key_id: 91311787-7b8f-4aa6-b3c1-5118b6eff79a
  • tenant-001_lambda_function: lambda-tenant-001-dev-258a048
  • tenant-001_subnet_ids: ['subnet-5777bc0b9bf36fdcd', 'subnet-7fdc06cabffa9824d']
  • tenant-001_users_table: tenant-tenant-001-users-dev
  • tenant-002_data_table: tenant-tenant-002-data-dev
  • tenant-002_kms_key_id: 33bd4619-ad84-4737-a361-1197fd99dab1
  • tenant-002_lambda_function: lambda-tenant-002-dev-4114eb6
  • tenant-002_subnet_ids: ['subnet-24529ae9bed550587', 'subnet-03464f20b29e20432']
  • tenant-002_users_table: tenant-tenant-002-users-dev
  • tenant-003_data_table: tenant-tenant-003-data-dev
  • tenant-003_kms_key_id: a3a3d496-f0b3-495e-9d78-02ee42e66f49
  • tenant-003_lambda_function: lambda-tenant-003-dev-fa4d7bc
  • tenant-003_subnet_ids: ['subnet-5b48bd0e5651f6365', 'subnet-db8c179fdaa63c22c']
  • tenant-003_users_table: tenant-tenant-003-users-dev
  • tenant-004_data_table: tenant-tenant-004-data-dev
  • tenant-004_kms_key_id: 31731265-8d23-404d-8c17-4b0b50d249e4
  • tenant-004_lambda_function: lambda-tenant-004-dev-d587edd
  • tenant-004_subnet_ids: ['subnet-1a3d01c78300f65bd', 'subnet-79447eb70f541a870']
  • tenant-004_users_table: tenant-tenant-004-users-dev
  • tenant-005_data_table: tenant-tenant-005-data-dev
  • tenant-005_kms_key_id: 5c751c68-a2ca-4a69-b095-8bc12c858c5d
  • tenant-005_lambda_function: lambda-tenant-005-dev-3e2f5e9
  • tenant-005_subnet_ids: ['subnet-b3a7931e6da31a463', 'subnet-bbb31937213a534e5']
  • tenant-005_users_table: tenant-tenant-005-users-dev
  • vpc_id: vpc-3cf06dd4ac6091b2e

### JSON Output
```json
{
  "api_id": "dpwd18pt3y",
  "api_url": "https://dpwd18pt3y.execute-api.us-east-1.amazonaws.com/prod",
  "tenant-001_data_table": "tenant-tenant-001-data-dev",
  "tenant-001_kms_key_id": "91311787-7b8f-4aa6-b3c1-5118b6eff79a",
  "tenant-001_lambda_function": "lambda-tenant-001-dev-258a048",
  "tenant-001_subnet_ids": [
    "subnet-5777bc0b9bf36fdcd",
    "subnet-7fdc06cabffa9824d"
  ],
  "tenant-001_users_table": "tenant-tenant-001-users-dev",
  "tenant-002_data_table": "tenant-tenant-002-data-dev",
  "tenant-002_kms_key_id": "33bd4619-ad84-4737-a361-1197fd99dab1",
  "tenant-002_lambda_function": "lambda-tenant-002-dev-4114eb6",
  "tenant-002_subnet_ids": [
    "subnet-24529ae9bed550587",
    "subnet-03464f20b29e20432"
  ],
  "tenant-002_users_table": "tenant-tenant-002-users-dev",
  "tenant-003_data_table": "tenant-tenant-003-data-dev",
  "tenant-003_kms_key_id": "a3a3d496-f0b3-495e-9d78-02ee42e66f49",
  "tenant-003_lambda_function": "lambda-tenant-003-dev-fa4d7bc",
  "tenant-003_subnet_ids": [
    "subnet-5b48bd0e5651f6365",
    "subnet-db8c179fdaa63c22c"
  ],
  "tenant-003_users_table": "tenant-tenant-003-users-dev",
  "tenant-004_data_table": "tenant-tenant-004-data-dev",
  "tenant-004_kms_key_id": "31731265-8d23-404d-8c17-4b0b50d249e4",
  "tenant-004_lambda_function": "lambda-tenant-004-dev-d587edd",
  "tenant-004_subnet_ids": [
    "subnet-1a3d01c78300f65bd",
    "subnet-79447eb70f541a870"
  ],
  "tenant-004_users_table": "tenant-tenant-004-users-dev",
  "tenant-005_data_table": "tenant-tenant-005-data-dev",
  "tenant-005_kms_key_id": "5c751c68-a2ca-4a69-b095-8bc12c858c5d",
  "tenant-005_lambda_function": "lambda-tenant-005-dev-3e2f5e9",
  "tenant-005_subnet_ids": [
    "subnet-b3a7931e6da31a463",
    "subnet-bbb31937213a534e5"
  ],
  "tenant-005_users_table": "tenant-tenant-005-users-dev",
  "vpc_id": "vpc-3cf06dd4ac6091b2e"
}
```

\033[0;36m🎯 Deployment Summary:\033[0m
\033[0;34m  • Stack: localstack-dev\033[0m
\033[0;34m  • Resources: 75\033[0m
\033[0;34m  • Duration: 119s\033[0m
\033[0;34m  • LocalStack: http://localhost:4566\033[0m
## Summary
- **Stack:** localstack-dev
- **Resources:** 75
- **Duration:** 119s
- **LocalStack:** http://localhost:4566

---
**Status:** ✅ Completed successfully
\033[0;32m🎉 Pulumi deployment to LocalStack completed successfully!\033[0m
\033[0;34m📄 Execution output saved to: execution-output.md\033[0m
