\033[0;32m✅ Stack selected: localstack-dev\033[0m
\033[1;33m🔧 Configuring AWS provider for LocalStack...\033[0m
\033[0;32m✅ AWS provider configured for LocalStack\033[0m
## Deployment
**Started:** 2025-12-12 22:44:49

\033[1;33m📦 Deploying Pulumi stack...\033[0m
\033[0;36m🔧 Deploying stack:\033[0m
\033[0;34m  • Stack Name: localstack-dev\033[0m
\033[0;34m  • Environment: dev\033[0m
\033[0;34m  • Region: us-east-1\033[0m
### Deployment Output
```
Previewing update (localstack-dev):

@ previewing update........
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing 
 ~  tap:stack:TapStack TapStackdev refreshing 
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing 
 ~  pulumi:providers:aws secondary-provider-dev refreshing 
 ~  pulumi:providers:aws secondary-provider-dev refresh 
 ~  pulumi:providers:aws primary-provider-dev refreshing 
 ~  pulumi:providers:aws primary-provider-dev refresh 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refreshing 
 ~  tap:stack:TapStack TapStackdev refresh 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refreshing 
 ~  aws:ec2:Vpc db-vpc-primary-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refreshing 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refreshing 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refreshing 
 ~  pulumi:providers:aws aws refreshing 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refreshing 
 ~  aws:rds:Cluster aurora-primary-v2-dev refreshing 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refreshing 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refreshing 
 ~  pulumi:providers:aws aws refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refreshing 
 ~  aws:rds:Cluster aurora-secondary-v2-dev refreshing 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refresh 
 ~  aws:ec2:Vpc db-vpc-primary-dev refresh 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refresh 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refresh 
 ~  aws:rds:Cluster aurora-primary-v2-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refresh 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refresh 
 ~  aws:rds:Cluster aurora-secondary-v2-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refresh 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refresh 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refresh 
@ previewing update........
    pulumi:pulumi:Stack TapStack-localstack-dev running 
@ previewing update.......
 ~  pulumi:providers:aws aws update [diff: ~defaultTags]
 +  tap:stack:TapStack multi-tenant-saas create 
 +  aws:kms:Key kms-tenant-001-dev create 
 +  aws:ec2:Vpc saas-vpc-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev create 
 +  aws:kms:Key kms-tenant-002-dev create 
 +  aws:kms:Key kms-tenant-004-dev create 
 +  aws:kms:Key kms-tenant-003-dev create 
 +  aws:kms:Key kms-tenant-005-dev create 
 +  aws:iam:Role lambda-role-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev create 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev create 
 +  aws:apigateway:RestApi api-dev create 
 +  aws:dynamodb:Table table-tenant-001-users-dev create 
 +  aws:kms:Alias alias-tenant-001-dev create 
 +  aws:dynamodb:Table table-tenant-001-data-dev create 
 +  aws:ec2:InternetGateway saas-igw-dev create 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev create 
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev create 
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev create 
 +  aws:ec2:RouteTable rt-tenant-001-dev create 
 +  aws:ec2:RouteTable rt-tenant-003-dev create 
 +  aws:ec2:RouteTable rt-tenant-002-dev create 
 +  aws:ec2:RouteTable rt-tenant-005-dev create 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev create 
 +  aws:ec2:RouteTable rt-tenant-004-dev create 
 +  aws:kms:Alias alias-tenant-004-dev create 
 +  aws:dynamodb:Table table-tenant-004-users-dev create 
 +  aws:dynamodb:Table table-tenant-004-data-dev create 
 +  aws:dynamodb:Table table-tenant-002-data-dev create 
 +  aws:dynamodb:Table table-tenant-002-users-dev create 
 +  aws:kms:Alias alias-tenant-002-dev create 
 +  aws:kms:Alias alias-tenant-003-dev create 
 +  aws:dynamodb:Table table-tenant-003-users-dev create 
 +  aws:dynamodb:Table table-tenant-003-data-dev create 
 +  aws:kms:Alias alias-tenant-005-dev create 
 +  aws:dynamodb:Table table-tenant-005-users-dev create 
 +  aws:dynamodb:Table table-tenant-005-data-dev create 
 +  aws:lambda:Function authorizer-lambda-dev create 
 +  aws:apigateway:Resource api-resource-tenants-dev create 
 +  aws:ec2:Route route-tenant-001-dev create 
 +  aws:ec2:Route route-tenant-003-dev create 
 +  aws:ec2:Route route-tenant-002-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev create 
 +  aws:ec2:Route route-tenant-005-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev create 
 +  aws:ec2:Route route-tenant-004-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev create 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev create 
 +  aws:lambda:Function lambda-tenant-002-dev create 
 +  aws:lambda:Function lambda-tenant-003-dev create 
 +  aws:lambda:Function lambda-tenant-004-dev create 
 +  aws:lambda:Function lambda-tenant-001-dev create 
 +  aws:lambda:Function lambda-tenant-005-dev create 
 +  aws:apigateway:Resource api-resource-tenant-id-dev create 
@ previewing update....
 +  aws:apigateway:Authorizer api-authorizer-dev create 
 +  aws:iam:RolePolicy lambda-policy-dev create 
 +  aws:apigateway:Resource api-resource-users-dev create 
 +  aws:apigateway:Method api-method-get-dev create 
 -  pulumi:providers:aws primary-provider-dev delete 
 -  pulumi:providers:aws secondary-provider-dev delete 
 -  tap:stack:TapStack TapStackdev delete 
    pulumi:pulumi:Stack TapStack-localstack-dev  
Outputs:
  + api_id                           : [unknown]
  + api_url                          : [unknown]
  - created_at                       : "2025-12-12T13:56:06.685496+00:00"
  - environment                      : "dev"
  - global_cluster_id                : "aurora-global-v2-dev"
  - health_check_id                  : "422428d0-a59d-4ace-bdf6-c85287f2cc39"
  - health_check_status              : "Healthy"
  - primary_cluster_endpoint         : "localhost.localstack.cloud"
  - primary_cluster_reader_endpoint  : "localhost.localstack.cloud"
  - primary_subnet_ids               : [
  -     [0]: "subnet-c3860c35df96ecb7e"
  -     [1]: "subnet-3d0ec1f7f41de0c63"
  -     [2]: "subnet-5b7c0da05faad038e"
    ]
  - secondary_cluster_endpoint       : "localhost.localstack.cloud"
  - secondary_cluster_reader_endpoint: "localhost.localstack.cloud"
  - secondary_subnet_ids             : [
  -     [0]: "subnet-534d613e5f4d1fede"
  -     [1]: "subnet-12b6d56492b1372ca"
  -     [2]: "subnet-c9eaca314872c6cad"
    ]
  + tenant-001_data_table            : "tenant-tenant-001-data-dev"
  + tenant-001_kms_key_id            : [unknown]
  + tenant-001_lambda_function       : "lambda-tenant-001-dev-9be04cc"
  + tenant-001_subnet_ids            : [unknown]
  + tenant-001_users_table           : "tenant-tenant-001-users-dev"
  + tenant-002_data_table            : "tenant-tenant-002-data-dev"
  + tenant-002_kms_key_id            : [unknown]
  + tenant-002_lambda_function       : "lambda-tenant-002-dev-f277cf4"
  + tenant-002_subnet_ids            : [unknown]
  + tenant-002_users_table           : "tenant-tenant-002-users-dev"
  + tenant-003_data_table            : "tenant-tenant-003-data-dev"
  + tenant-003_kms_key_id            : [unknown]
  + tenant-003_lambda_function       : "lambda-tenant-003-dev-80d36bd"
  + tenant-003_subnet_ids            : [unknown]
  + tenant-003_users_table           : "tenant-tenant-003-users-dev"
  + tenant-004_data_table            : "tenant-tenant-004-data-dev"
  + tenant-004_kms_key_id            : [unknown]
  + tenant-004_lambda_function       : "lambda-tenant-004-dev-9688bf1"
  + tenant-004_subnet_ids            : [unknown]
  + tenant-004_users_table           : "tenant-tenant-004-users-dev"
  + tenant-005_data_table            : "tenant-tenant-005-data-dev"
  + tenant-005_kms_key_id            : [unknown]
  + tenant-005_lambda_function       : "lambda-tenant-005-dev-a6f073a"
  + tenant-005_subnet_ids            : [unknown]
  + tenant-005_users_table           : "tenant-tenant-005-users-dev"

Resources:
    + 72 to create
    ~ 1 to update
    - 3 to delete
    76 changes. 1 unchanged

Updating (localstack-dev):

@ updating...........
 ~  pulumi:providers:aws aws refreshing (0s) 
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing (0s) 
 ~  pulumi:providers:aws aws refresh (0.03s) 
 ~  tap:stack:TapStack TapStackdev refreshing (0s) 
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing (0s) 
 ~  tap:stack:TapStack TapStackdev refresh (0.00s) 
 ~  pulumi:providers:aws primary-provider-dev refreshing (0s) 
 ~  pulumi:providers:aws primary-provider-dev refresh (0.00s) 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refreshing (0s) 
 ~  pulumi:providers:aws secondary-provider-dev refreshing (0s) 
 ~  pulumi:providers:aws secondary-provider-dev refresh (0.00s) 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refreshing (0s) 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refreshing (0s) 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refreshing (0s) 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refreshing (0s) 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refreshing (0s) 
 ~  aws:ec2:Vpc db-vpc-primary-dev refreshing (0s) 
 ~  aws:rds:Cluster aurora-secondary-v2-dev refreshing (0s) 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refreshing (0s) 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refreshing (0s) 
 ~  aws:rds:Cluster aurora-primary-v2-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refresh (0.04s) 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refresh (0.04s) 
 ~  aws:ec2:Vpc db-vpc-primary-dev refresh (0.06s) 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refresh (0.07s) 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refresh (0.10s) 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refresh (0.11s) 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refresh (0.11s) 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refresh (0.11s) 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refresh (0.13s) 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refresh (0.12s) 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refresh (0.13s) 
 ~  aws:rds:Cluster aurora-secondary-v2-dev refresh (0.13s) 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refresh (0.13s) 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refresh (0.13s) 
 ~  aws:rds:Cluster aurora-primary-v2-dev refresh (0.13s) 
@ updating........
    pulumi:pulumi:Stack TapStack-localstack-dev running 
@ updating......
 ~  pulumi:providers:aws aws updating (0s) [diff: ~defaultTags]
 ~  pulumi:providers:aws aws updated (0.00s) [diff: ~defaultTags]
 +  tap:stack:TapStack multi-tenant-saas creating (0s) 
 +  aws:ec2:Vpc saas-vpc-dev creating (0s) 
 +  aws:kms:Key kms-tenant-001-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev creating (0s) 
 +  aws:kms:Key kms-tenant-003-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev creating (0s) 
 +  aws:apigateway:RestApi api-dev creating (0s) 
 +  aws:kms:Key kms-tenant-005-dev creating (0s) 
 +  aws:kms:Key kms-tenant-002-dev creating (0s) 
 +  aws:kms:Key kms-tenant-004-dev creating (0s) 
 +  aws:iam:Role lambda-role-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev creating (0s) 
@ updating....
 +  aws:iam:Role lambda-role-dev created (1s) 
 +  aws:lambda:Function authorizer-lambda-dev creating (0s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-003-dev created (1s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-002-dev created (1s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-005-dev created (1s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-001-dev created (1s) 
 +  aws:cloudwatch:LogGroup log-group-tenant-004-dev created (1s) 
@ updating......
 +  aws:apigateway:RestApi api-dev created (4s) 
 +  aws:apigateway:Resource api-resource-tenants-dev creating (0s) 
 +  aws:apigateway:Resource api-resource-tenants-dev created (0.15s) 
 +  aws:apigateway:Resource api-resource-tenant-id-dev creating (0s) 
@ updating....
 +  aws:apigateway:Resource api-resource-tenant-id-dev created (0.03s) 
 +  aws:apigateway:Resource api-resource-users-dev creating (0s) 
 +  aws:apigateway:Resource api-resource-users-dev created (0.07s) 
 +  aws:kms:Key kms-tenant-001-dev created (5s) 
 +  aws:kms:Key kms-tenant-003-dev created (5s) 
 +  aws:kms:Key kms-tenant-005-dev created (5s) 
 +  aws:kms:Alias alias-tenant-001-dev creating (0s) 
 +  aws:kms:Key kms-tenant-004-dev created (5s) 
 +  aws:dynamodb:Table table-tenant-001-data-dev creating (0s) 
 +  aws:kms:Key kms-tenant-002-dev created (5s) 
 +  aws:dynamodb:Table table-tenant-001-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-001-dev created (0.10s) 
 +  aws:dynamodb:Table table-tenant-003-users-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-003-data-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-003-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-005-data-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-005-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-005-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-004-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-004-data-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-004-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-002-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-002-data-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-002-users-dev creating (0s) 
 +  aws:kms:Alias alias-tenant-003-dev created (0.37s) 
 +  aws:kms:Alias alias-tenant-005-dev created (0.35s) 
 +  aws:kms:Alias alias-tenant-004-dev created (0.31s) 
 +  aws:kms:Alias alias-tenant-002-dev created (0.23s) 
@ updating........
 +  aws:lambda:Function authorizer-lambda-dev created (8s) 
 +  aws:apigateway:Authorizer api-authorizer-dev creating (0s) 
 +  aws:apigateway:Authorizer api-authorizer-dev created (0.05s) 
 +  aws:apigateway:Method api-method-get-dev creating (0s) 
 +  aws:apigateway:Method api-method-get-dev created (0.05s) 
 +  aws:ec2:Vpc saas-vpc-dev created (10s) 
 +  aws:ec2:InternetGateway saas-igw-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev creating (0s) 
 +  aws:ec2:InternetGateway saas-igw-dev created (0.38s) 
@ updating....
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev creating (0s) 
@ updating..........
 +  aws:dynamodb:Table table-tenant-005-data-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-003-data-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-004-users-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-002-users-dev created (12s) 
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev creating (0s) 
 +  aws:dynamodb:Table table-tenant-002-data-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-005-users-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-004-data-dev created (12s) 
 +  aws:dynamodb:Table table-tenant-001-users-dev created (13s) 
 +  aws:dynamodb:Table table-tenant-001-data-dev created (13s) 
 +  aws:dynamodb:Table table-tenant-003-users-dev created (12s) 
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-002-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-003-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-005-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-004-dev creating (0s) 
 +  aws:iam:RolePolicy lambda-policy-dev creating (0s) 
@ updating....
 +  aws:ec2:RouteTable rt-tenant-001-dev created (0.68s) 
 +  aws:iam:RolePolicy lambda-policy-dev created (0.42s) 
 +  aws:ec2:RouteTable rt-tenant-002-dev created (0.68s) 
 +  aws:ec2:RouteTable rt-tenant-003-dev created (0.63s) 
 +  aws:ec2:RouteTable rt-tenant-005-dev created (0.60s) 
 +  aws:ec2:Route route-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTable rt-tenant-004-dev created (0.62s) 
 +  aws:ec2:Route route-tenant-002-dev creating (0s) 
 +  aws:ec2:Route route-tenant-003-dev creating (0s) 
 +  aws:ec2:Route route-tenant-005-dev creating (0s) 
 +  aws:ec2:Route route-tenant-004-dev creating (0s) 
 +  aws:ec2:Route route-tenant-001-dev created (0.42s) 
 +  aws:ec2:Route route-tenant-002-dev created (0.45s) 
 +  aws:ec2:Route route-tenant-003-dev created (0.44s) 
 +  aws:ec2:Route route-tenant-005-dev created (0.48s) 
 +  aws:ec2:Route route-tenant-004-dev created (0.42s) 
@ updating....
 +  aws:ec2:Subnet subnet-tenant-001-az0-dev created (10s) 
 +  aws:ec2:Subnet subnet-tenant-004-az0-dev created (10s) 
@ updating....
 +  aws:ec2:Subnet subnet-tenant-002-az0-dev created (10s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev creating (0s) 
 +  aws:ec2:Subnet subnet-tenant-001-az1-dev created (10s) 
 +  aws:ec2:Subnet subnet-tenant-002-az1-dev created (10s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-0-dev created (0.12s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-001-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-002-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-0-dev created (0.19s) 
 +  aws:ec2:Subnet subnet-tenant-003-az0-dev created (10s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-0-dev created (0.21s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-001-1-dev created (0.21s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-002-1-dev created (0.26s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-0-dev created (0.16s) 
@ updating........
 +  aws:lambda:Function lambda-tenant-001-dev created (5s) 
 +  aws:lambda:Function lambda-tenant-002-dev created (5s) 
@ updating.....
 +  aws:ec2:Subnet subnet-tenant-003-az1-dev created (10s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-003-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-003-1-dev created (0.10s) 
 +  aws:ec2:Subnet subnet-tenant-004-az1-dev created (10s) 
@ updating....
 +  aws:ec2:Subnet subnet-tenant-005-az0-dev created (10s) 
 +  aws:ec2:Subnet subnet-tenant-005-az1-dev created (10s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-004-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-004-1-dev created (0.15s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev creating (0s) 
 +  aws:lambda:Function lambda-tenant-005-dev creating (0s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-0-dev created (0.28s) 
 +  aws:ec2:RouteTableAssociation rta-tenant-005-1-dev created (0.18s) 
@ updating.......
 +  aws:lambda:Function lambda-tenant-003-dev created (5s) 
@ updating....
 +  aws:lambda:Function lambda-tenant-004-dev created (5s) 
 +  aws:lambda:Function lambda-tenant-005-dev created (5s) 
 -  pulumi:providers:aws primary-provider-dev deleting (0s) 
 -  pulumi:providers:aws secondary-provider-dev deleting (0s) 
 -  pulumi:providers:aws primary-provider-dev deleted (0.11s) 
@ updating....
 -  pulumi:providers:aws secondary-provider-dev deleted (0.17s) 
 -  tap:stack:TapStack TapStackdev deleting (0s) 
    pulumi:pulumi:Stack TapStack-localstack-dev  
Outputs:
  + api_id                           : "hni5rwbdia"
  + api_url                          : "https://hni5rwbdia.execute-api.us-east-1.amazonaws.com/prod"
  - created_at                       : "2025-12-12T13:56:06.685496+00:00"
  - environment                      : "dev"
  - global_cluster_id                : "aurora-global-v2-dev"
  - health_check_id                  : "422428d0-a59d-4ace-bdf6-c85287f2cc39"
  - health_check_status              : "Healthy"
  - primary_cluster_endpoint         : "localhost.localstack.cloud"
  - primary_cluster_reader_endpoint  : "localhost.localstack.cloud"
  - primary_subnet_ids               : [
  -     [0]: "subnet-c3860c35df96ecb7e"
  -     [1]: "subnet-3d0ec1f7f41de0c63"
  -     [2]: "subnet-5b7c0da05faad038e"
    ]
  - secondary_cluster_endpoint       : "localhost.localstack.cloud"
  - secondary_cluster_reader_endpoint: "localhost.localstack.cloud"
  - secondary_subnet_ids             : [
  -     [0]: "subnet-534d613e5f4d1fede"
  -     [1]: "subnet-12b6d56492b1372ca"
  -     [2]: "subnet-c9eaca314872c6cad"
    ]
  + tenant-001_data_table            : "tenant-tenant-001-data-dev"
  + tenant-001_kms_key_id            : "dd9a1b1e-b075-4050-885a-7b4f4135d078"
  + tenant-001_lambda_function       : "lambda-tenant-001-dev-5765a8c"
  + tenant-001_subnet_ids            : [
  +     [0]: "subnet-b565da6b3c8f46d8a"
  +     [1]: "subnet-7d34e479a2afbeeaf"
    ]
  + tenant-001_users_table           : "tenant-tenant-001-users-dev"
  + tenant-002_data_table            : "tenant-tenant-002-data-dev"
  + tenant-002_kms_key_id            : "0b84ae40-971e-453d-bd47-cea81dce68a9"
  + tenant-002_lambda_function       : "lambda-tenant-002-dev-d8b3c3b"
  + tenant-002_subnet_ids            : [
  +     [0]: "subnet-b554aa29eb6f2efce"
  +     [1]: "subnet-256c1eb9eb1a72228"
    ]
  + tenant-002_users_table           : "tenant-tenant-002-users-dev"
  + tenant-003_data_table            : "tenant-tenant-003-data-dev"
  + tenant-003_kms_key_id            : "c2eb4350-4206-456b-b4cc-d914c03dbd79"
  + tenant-003_lambda_function       : "lambda-tenant-003-dev-6850812"
  + tenant-003_subnet_ids            : [
  +     [0]: "subnet-b50dd06666dec9469"
  +     [1]: "subnet-2fddba39b8639c7f4"
    ]
  + tenant-003_users_table           : "tenant-tenant-003-users-dev"
  + tenant-004_data_table            : "tenant-tenant-004-data-dev"
  + tenant-004_kms_key_id            : "e360389a-6bca-444b-82a5-4ab8f23407bd"
  + tenant-004_lambda_function       : "lambda-tenant-004-dev-c61d871"
  + tenant-004_subnet_ids            : [
  +     [0]: "subnet-1fbc3f08d3c8eb156"
  +     [1]: "subnet-9ed4a1daafa646071"
    ]
  + tenant-004_users_table           : "tenant-tenant-004-users-dev"
  + tenant-005_data_table            : "tenant-tenant-005-data-dev"
  + tenant-005_kms_key_id            : "8d67f90f-4540-42a6-af00-d90c4e96b0ee"
  + tenant-005_lambda_function       : "lambda-tenant-005-dev-4df99e7"
  + tenant-005_subnet_ids            : [
  +     [0]: "subnet-a0c10e4f8325dbc2c"
  +     [1]: "subnet-2f4f6b394291b520a"
    ]
  + tenant-005_users_table           : "tenant-tenant-005-users-dev"
  ~ vpc_id                           : "vpc-51215e1eb26548a40" => "vpc-779581ec94a5376f8"

Resources:
    + 72 created
    ~ 1 updated
    - 3 deleted
    76 changes. 1 unchanged

Duration: 51s

```

\033[0;32m✅ Pulumi deployment completed successfully\033[0m
\033[0;32m⏱️  Total deployment time: 69s\033[0m
**Ended:** 2025-12-12 22:45:58
**Duration:** 69s

\033[1;33m📊 Generating stack outputs...\033[0m
\033[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json\033[0m
## Stack Outputs
\033[0;34m📋 Stack Outputs:\033[0m
  • api_id: hni5rwbdia
  • api_url: https://hni5rwbdia.execute-api.us-east-1.amazonaws.com/prod
  • tenant-001_data_table: tenant-tenant-001-data-dev
  • tenant-001_kms_key_id: dd9a1b1e-b075-4050-885a-7b4f4135d078
  • tenant-001_lambda_function: lambda-tenant-001-dev-5765a8c
  • tenant-001_subnet_ids: ['subnet-b565da6b3c8f46d8a', 'subnet-7d34e479a2afbeeaf']
  • tenant-001_users_table: tenant-tenant-001-users-dev
  • tenant-002_data_table: tenant-tenant-002-data-dev
  • tenant-002_kms_key_id: 0b84ae40-971e-453d-bd47-cea81dce68a9
  • tenant-002_lambda_function: lambda-tenant-002-dev-d8b3c3b
  • tenant-002_subnet_ids: ['subnet-b554aa29eb6f2efce', 'subnet-256c1eb9eb1a72228']
  • tenant-002_users_table: tenant-tenant-002-users-dev
  • tenant-003_data_table: tenant-tenant-003-data-dev
  • tenant-003_kms_key_id: c2eb4350-4206-456b-b4cc-d914c03dbd79
  • tenant-003_lambda_function: lambda-tenant-003-dev-6850812
  • tenant-003_subnet_ids: ['subnet-b50dd06666dec9469', 'subnet-2fddba39b8639c7f4']
  • tenant-003_users_table: tenant-tenant-003-users-dev
  • tenant-004_data_table: tenant-tenant-004-data-dev
  • tenant-004_kms_key_id: e360389a-6bca-444b-82a5-4ab8f23407bd
  • tenant-004_lambda_function: lambda-tenant-004-dev-c61d871
  • tenant-004_subnet_ids: ['subnet-1fbc3f08d3c8eb156', 'subnet-9ed4a1daafa646071']
  • tenant-004_users_table: tenant-tenant-004-users-dev
  • tenant-005_data_table: tenant-tenant-005-data-dev
  • tenant-005_kms_key_id: 8d67f90f-4540-42a6-af00-d90c4e96b0ee
  • tenant-005_lambda_function: lambda-tenant-005-dev-4df99e7
  • tenant-005_subnet_ids: ['subnet-a0c10e4f8325dbc2c', 'subnet-2f4f6b394291b520a']
  • tenant-005_users_table: tenant-tenant-005-users-dev
  • vpc_id: vpc-779581ec94a5376f8

### JSON Output
```json
{
  "api_id": "hni5rwbdia",
  "api_url": "https://hni5rwbdia.execute-api.us-east-1.amazonaws.com/prod",
  "tenant-001_data_table": "tenant-tenant-001-data-dev",
  "tenant-001_kms_key_id": "dd9a1b1e-b075-4050-885a-7b4f4135d078",
  "tenant-001_lambda_function": "lambda-tenant-001-dev-5765a8c",
  "tenant-001_subnet_ids": [
    "subnet-b565da6b3c8f46d8a",
    "subnet-7d34e479a2afbeeaf"
  ],
  "tenant-001_users_table": "tenant-tenant-001-users-dev",
  "tenant-002_data_table": "tenant-tenant-002-data-dev",
  "tenant-002_kms_key_id": "0b84ae40-971e-453d-bd47-cea81dce68a9",
  "tenant-002_lambda_function": "lambda-tenant-002-dev-d8b3c3b",
  "tenant-002_subnet_ids": [
    "subnet-b554aa29eb6f2efce",
    "subnet-256c1eb9eb1a72228"
  ],
  "tenant-002_users_table": "tenant-tenant-002-users-dev",
  "tenant-003_data_table": "tenant-tenant-003-data-dev",
  "tenant-003_kms_key_id": "c2eb4350-4206-456b-b4cc-d914c03dbd79",
  "tenant-003_lambda_function": "lambda-tenant-003-dev-6850812",
  "tenant-003_subnet_ids": [
    "subnet-b50dd06666dec9469",
    "subnet-2fddba39b8639c7f4"
  ],
  "tenant-003_users_table": "tenant-tenant-003-users-dev",
  "tenant-004_data_table": "tenant-tenant-004-data-dev",
  "tenant-004_kms_key_id": "e360389a-6bca-444b-82a5-4ab8f23407bd",
  "tenant-004_lambda_function": "lambda-tenant-004-dev-c61d871",
  "tenant-004_subnet_ids": [
    "subnet-1fbc3f08d3c8eb156",
    "subnet-9ed4a1daafa646071"
  ],
  "tenant-004_users_table": "tenant-tenant-004-users-dev",
  "tenant-005_data_table": "tenant-tenant-005-data-dev",
  "tenant-005_kms_key_id": "8d67f90f-4540-42a6-af00-d90c4e96b0ee",
  "tenant-005_lambda_function": "lambda-tenant-005-dev-4df99e7",
  "tenant-005_subnet_ids": [
    "subnet-a0c10e4f8325dbc2c",
    "subnet-2f4f6b394291b520a"
  ],
  "tenant-005_users_table": "tenant-tenant-005-users-dev",
  "vpc_id": "vpc-779581ec94a5376f8"
}
```

\033[0;36m🎯 Deployment Summary:\033[0m
\033[0;34m  • Stack: localstack-dev\033[0m
\033[0;34m  • Resources: 75\033[0m
\033[0;34m  • Duration: 69s\033[0m
\033[0;34m  • LocalStack: http://localhost:4566\033[0m
## Summary
- **Stack:** localstack-dev
- **Resources:** 75
- **Duration:** 69s
- **LocalStack:** http://localhost:4566

---
**Status:** ✅ Completed successfully
\033[0;32m🎉 Pulumi deployment to LocalStack completed successfully!\033[0m
\033[0;34m📄 Execution output saved to: execution-output.md\033[0m
