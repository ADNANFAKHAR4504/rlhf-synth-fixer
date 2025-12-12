\033[0;32m✅ Stack selected: localstack-dev\033[0m
\033[1;33m🔧 Configuring AWS provider for LocalStack...\033[0m
\033[0;32m✅ AWS provider configured for LocalStack\033[0m
## Deployment
**Started:** 2025-12-12 18:55:42

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
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing 
 ~  pulumi:providers:aws aws refreshing 
 ~  pulumi:providers:aws aws refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refreshing 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refreshing 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refreshing 
 ~  tap:stack:TapStack TapStackdev refreshing 
 ~  pulumi:providers:aws primary-provider-dev refreshing 
 ~  pulumi:providers:aws secondary-provider-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refreshing 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refreshing 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refreshing 
 ~  aws:ec2:Vpc db-vpc-primary-dev refreshing 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refreshing 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refreshing 
 ~  pulumi:providers:aws primary-provider-dev refresh 
 ~  aws:rds:Cluster aurora-primary-v2-dev refreshing 
 ~  pulumi:providers:aws secondary-provider-dev refresh 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refreshing 
 ~  tap:stack:TapStack TapStackdev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refreshing 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refresh 
 ~  aws:rds:Cluster aurora-primary-v2-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refresh 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refresh 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refresh 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refresh 
 ~  aws:ec2:Vpc db-vpc-primary-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refresh 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refresh 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refresh 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refresh 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refresh 
@ previewing update....
    pulumi:pulumi:Stack TapStack-localstack-dev running 
@ previewing update......
 ~  pulumi:providers:aws aws update [diff: ~defaultTags]
    tap:stack:TapStack TapStackdev  
@ previewing update......
    pulumi:providers:aws primary-provider-dev  
@ previewing update.....
    pulumi:providers:aws secondary-provider-dev  
 +  aws:ec2:Vpc db-vpc-primary-dev create 
 +  aws:ec2:Vpc db-vpc-secondary-dev create 
 +  aws:ec2:Subnet db-subnet-primary-1-dev create 
 +  aws:ec2:Subnet db-subnet-primary-0-dev create 
 +  aws:ec2:Subnet db-subnet-primary-2-dev create 
 +  aws:rds:GlobalCluster aurora-global-v2-dev create 
 +  aws:ec2:Subnet db-subnet-secondary-1-dev create 
 +  aws:ec2:Subnet db-subnet-secondary-2-dev create 
 +  aws:ec2:Subnet db-subnet-secondary-0-dev create 
 +  aws:ec2:SecurityGroup db-sg-primary-dev create 
 +  aws:ec2:SecurityGroup db-sg-secondary-dev create 
 +  aws:rds:SubnetGroup db-subnet-group-primary-dev create 
 +  aws:rds:SubnetGroup db-subnet-group-secondary-dev create 
 +  aws:rds:Cluster aurora-primary-v2-dev create 
@ previewing update....
 +  aws:rds:ClusterInstance aurora-primary-instance-v2-dev create 
 +  aws:route53:HealthCheck db-health-check-dev create 
 +  aws:rds:Cluster aurora-secondary-v2-dev create 
 +  aws:rds:ClusterInstance aurora-secondary-instance-v2-dev create 
    pulumi:pulumi:Stack TapStack-localstack-dev  
Outputs:
  + created_at                       : "2025-12-12T13:55:50.993306+00:00"
  + environment                      : "dev"
  + global_cluster_id                : [unknown]
  + health_check_id                  : [unknown]
  + health_check_status              : "Healthy"
  + primary_cluster_endpoint         : [unknown]
  + primary_cluster_reader_endpoint  : [unknown]
  + primary_subnet_ids               : [
  +     [0]: [unknown]
  +     [1]: [unknown]
  +     [2]: [unknown]
    ]
  + secondary_cluster_endpoint       : [unknown]
  + secondary_cluster_reader_endpoint: [unknown]
  + secondary_subnet_ids             : [
  +     [0]: [unknown]
  +     [1]: [unknown]
  +     [2]: [unknown]
    ]
  + vpc_id                           : [unknown]

Resources:
    + 18 to create
    ~ 1 to update
    19 changes. 4 unchanged

Updating (localstack-dev):

@ updating........
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing (0s) 
 ~  pulumi:pulumi:Stack TapStack-localstack-dev refreshing (0s) 
 ~  pulumi:providers:aws aws refreshing (0s) 
 ~  tap:stack:TapStack TapStackdev refreshing (0s) 
 ~  pulumi:providers:aws primary-provider-dev refreshing (0s) 
 ~  pulumi:providers:aws aws refresh (0.00s) 
 ~  tap:stack:TapStack TapStackdev refresh (0.00s) 
 ~  pulumi:providers:aws secondary-provider-dev refreshing (0s) 
 ~  pulumi:providers:aws primary-provider-dev refresh (0.00s) 
 ~  pulumi:providers:aws secondary-provider-dev refresh (0.00s) 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refreshing (0s) 
 ~  aws:ec2:Vpc db-vpc-primary-dev refreshing (0s) 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refreshing (0s) 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refreshing (0s) 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refreshing (0s) 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refreshing (0s) 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refreshing (0s) 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refreshing (0s) 
 ~  aws:rds:Cluster aurora-primary-v2-dev refreshing (0s) 
 ~  aws:rds:GlobalCluster aurora-global-v2-dev refresh (0.03s) 
 ~  aws:ec2:Subnet db-subnet-primary-0-dev refresh (0.07s) 
 ~  aws:ec2:SecurityGroup db-sg-primary-dev refresh (0.07s) 
 ~  aws:ec2:Vpc db-vpc-primary-dev refresh (0.08s) 
 ~  aws:ec2:Subnet db-subnet-primary-1-dev refresh (0.09s) 
 ~  aws:ec2:Subnet db-subnet-primary-2-dev refresh (0.09s) 
 ~  aws:ec2:Subnet db-subnet-secondary-1-dev refresh (0.09s) 
 ~  aws:rds:SubnetGroup db-subnet-group-primary-dev refresh (0.10s) 
 ~  aws:ec2:Subnet db-subnet-secondary-2-dev refresh (0.11s) 
 ~  aws:rds:Cluster aurora-primary-v2-dev refresh (0.11s) 
 ~  aws:ec2:SecurityGroup db-sg-secondary-dev refresh (0.11s) 
 ~  aws:ec2:Vpc db-vpc-secondary-dev refresh (0.11s) 
 ~  aws:rds:SubnetGroup db-subnet-group-secondary-dev refresh (0.11s) 
 ~  aws:ec2:Subnet db-subnet-secondary-0-dev refresh (0.11s) 
@ updating....
    pulumi:pulumi:Stack TapStack-localstack-dev running 
@ updating......
 ~  pulumi:providers:aws aws updating (0s) [diff: ~defaultTags]
 ~  pulumi:providers:aws aws updated (0.01s) [diff: ~defaultTags]
    tap:stack:TapStack TapStackdev  
@ updating......
    pulumi:providers:aws secondary-provider-dev  
@ updating.....
    pulumi:providers:aws primary-provider-dev  
 +  aws:ec2:Vpc db-vpc-primary-dev creating (0s) 
 +  aws:ec2:Vpc db-vpc-secondary-dev creating (0s) 
@ updating....
 +  aws:rds:GlobalCluster aurora-global-v2-dev creating (0s) 
 +  aws:rds:GlobalCluster aurora-global-v2-dev created (0.02s) 
@ updating.............
 +  aws:ec2:Vpc db-vpc-primary-dev created (10s) 
 +  aws:ec2:Vpc db-vpc-secondary-dev created (10s) 
 +  aws:ec2:Subnet db-subnet-primary-1-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-primary-2-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-primary-0-dev creating (0s) 
 +  aws:ec2:SecurityGroup db-sg-primary-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-secondary-0-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-secondary-1-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-secondary-2-dev creating (0s) 
 +  aws:ec2:SecurityGroup db-sg-secondary-dev creating (0s) 
 +  aws:ec2:Subnet db-subnet-primary-1-dev created (0.19s) 
 +  aws:ec2:Subnet db-subnet-primary-2-dev created (0.21s) 
 +  aws:ec2:Subnet db-subnet-secondary-0-dev created (0.22s) 
 +  aws:ec2:Subnet db-subnet-primary-0-dev created (0.24s) 
 +  aws:ec2:Subnet db-subnet-secondary-1-dev created (0.26s) 
 +  aws:ec2:Subnet db-subnet-secondary-2-dev created (0.25s) 
 +  aws:rds:SubnetGroup db-subnet-group-primary-dev creating (0s) 
 +  aws:rds:SubnetGroup db-subnet-group-secondary-dev creating (0s) 
@ updating....
 +  aws:rds:SubnetGroup db-subnet-group-primary-dev created (0.49s) 
 +  aws:ec2:SecurityGroup db-sg-primary-dev created (0.83s) 
 +  aws:rds:SubnetGroup db-subnet-group-secondary-dev created (0.47s) 
 +  aws:rds:Cluster aurora-primary-v2-dev creating (0s) 
 +  aws:ec2:SecurityGroup db-sg-secondary-dev created (0.83s) 
@ updating......................................................................
 +  aws:rds:Cluster aurora-primary-v2-dev created (67s) 
 +  aws:rds:ClusterInstance aurora-primary-instance-v2-dev creating (0s) 
 +  aws:route53:HealthCheck db-health-check-dev creating (0s) 
 +  aws:rds:Cluster aurora-secondary-v2-dev creating (0s) 
 +  aws:route53:HealthCheck db-health-check-dev created (0.49s) 
@ updating.................................
 +  aws:rds:ClusterInstance aurora-primary-instance-v2-dev created (30s) 
 +  aws:rds:Cluster aurora-secondary-v2-dev created (30s) 
 +  aws:rds:ClusterInstance aurora-secondary-instance-v2-dev creating (0s) 
@ updating.................................
 +  aws:rds:ClusterInstance aurora-secondary-instance-v2-dev created (30s) 
@ updating....
    pulumi:pulumi:Stack TapStack-localstack-dev  
Outputs:
  + created_at                       : "2025-12-12T13:56:06.685496+00:00"
  + environment                      : "dev"
  + global_cluster_id                : "aurora-global-v2-dev"
  + health_check_id                  : "422428d0-a59d-4ace-bdf6-c85287f2cc39"
  + health_check_status              : "Healthy"
  + primary_cluster_endpoint         : "localhost.localstack.cloud"
  + primary_cluster_reader_endpoint  : "localhost.localstack.cloud"
  + primary_subnet_ids               : [
  +     [0]: "subnet-c3860c35df96ecb7e"
  +     [1]: "subnet-3d0ec1f7f41de0c63"
  +     [2]: "subnet-5b7c0da05faad038e"
    ]
  + secondary_cluster_endpoint       : "localhost.localstack.cloud"
  + secondary_cluster_reader_endpoint: "localhost.localstack.cloud"
  + secondary_subnet_ids             : [
  +     [0]: "subnet-534d613e5f4d1fede"
  +     [1]: "subnet-12b6d56492b1372ca"
  +     [2]: "subnet-c9eaca314872c6cad"
    ]
  + vpc_id                           : "vpc-51215e1eb26548a40"

Resources:
    + 18 created
    ~ 1 updated
    19 changes. 4 unchanged

Duration: 2m34s

```

\033[0;32m✅ Pulumi deployment completed successfully\033[0m
\033[0;32m⏱️  Total deployment time: 172s\033[0m
**Ended:** 2025-12-12 18:58:34
**Duration:** 172s

\033[1;33m📊 Generating stack outputs...\033[0m
\033[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json\033[0m
## Stack Outputs
\033[0;34m📋 Stack Outputs:\033[0m
  • created_at: 2025-12-12T13:56:06.685496+00:00
  • environment: dev
  • global_cluster_id: aurora-global-v2-dev
  • health_check_id: 422428d0-a59d-4ace-bdf6-c85287f2cc39
  • health_check_status: Healthy
  • primary_cluster_endpoint: localhost.localstack.cloud
  • primary_cluster_reader_endpoint: localhost.localstack.cloud
  • primary_subnet_ids: ['subnet-c3860c35df96ecb7e', 'subnet-3d0ec1f7f41de0c63', 'subnet-5b7c0da05faad038e']
  • secondary_cluster_endpoint: localhost.localstack.cloud
  • secondary_cluster_reader_endpoint: localhost.localstack.cloud
  • secondary_subnet_ids: ['subnet-534d613e5f4d1fede', 'subnet-12b6d56492b1372ca', 'subnet-c9eaca314872c6cad']
  • vpc_id: vpc-51215e1eb26548a40

### JSON Output
```json
{
  "created_at": "2025-12-12T13:56:06.685496+00:00",
  "environment": "dev",
  "global_cluster_id": "aurora-global-v2-dev",
  "health_check_id": "422428d0-a59d-4ace-bdf6-c85287f2cc39",
  "health_check_status": "Healthy",
  "primary_cluster_endpoint": "localhost.localstack.cloud",
  "primary_cluster_reader_endpoint": "localhost.localstack.cloud",
  "primary_subnet_ids": [
    "subnet-c3860c35df96ecb7e",
    "subnet-3d0ec1f7f41de0c63",
    "subnet-5b7c0da05faad038e"
  ],
  "secondary_cluster_endpoint": "localhost.localstack.cloud",
  "secondary_cluster_reader_endpoint": "localhost.localstack.cloud",
  "secondary_subnet_ids": [
    "subnet-534d613e5f4d1fede",
    "subnet-12b6d56492b1372ca",
    "subnet-c9eaca314872c6cad"
  ],
  "vpc_id": "vpc-51215e1eb26548a40"
}
```

\033[0;36m🎯 Deployment Summary:\033[0m
\033[0;34m  • Stack: localstack-dev\033[0m
\033[0;34m  • Resources: 23\033[0m
\033[0;34m  • Duration: 172s\033[0m
\033[0;34m  • LocalStack: http://localhost:4566\033[0m
## Summary
- **Stack:** localstack-dev
- **Resources:** 23
- **Duration:** 172s
- **LocalStack:** http://localhost:4566

---
**Status:** ✅ Completed successfully
\033[0;32m🎉 Pulumi deployment to LocalStack completed successfully!\033[0m
\033[0;34m📄 Execution output saved to: execution-output.md\033[0m
