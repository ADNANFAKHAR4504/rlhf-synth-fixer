we got a legacy app migration project thats been running on physical servers and now needs to go to AWS. the app team wants to containerize everything and deploy across dev staging and prod environments. they want cloudformation json templates so it matches their existing tooling

the business already set up multi-account AWS with VPCs in each account. we just need to build the compute database and networking layers. key thing is making it work across all three environments but with different configs per environment - like prod needs multi-az database and bigger instances while dev can be cheaper single-az setup

here's what we need:

ecs fargate cluster to run the containers. need task definitions with proper cpu and memory settings and an ecs service that can auto-scale based on cpu usage. task execution role needs access to ecr cloudwatch and secrets manager. task role should have minimal perms for the actual app workload

rds postgres database with multi-az only for production - dev and staging should be single-az to save money. need subnet groups across the private subnets and automated backups with different retention per environment. database credentials go in secrets manager not hardcoded anywhere. prod should have secret rotation enabled

application load balancer in the public subnets with target group pointing to the ecs tasks. need listeners for http and https traffic. security groups are important here - alb accepts 80 and 443 from internet, ecs tasks only accept traffic from alb, rds only accepts traffic from ecs tasks. no blanket 0.0.0.0/0 egress rules

ecr repositories for the docker images with lifecycle policies to keep only last 10 images and delete untagged ones after 7 days. enable scan on push for vulnerability detection

cloudwatch log groups for container logs and application logs. retention needs to be 7 days for dev, 30 days for staging, 90 days for production. need cloudwatch alarms for cpu memory and database connections

route53 dns records pointing to the alb - they have an existing hosted zone well reference via parameter. need health checks on the alb endpoint. subdomains should be app-dev app-staging app-prod

secrets manager for database master password and application api keys. prod environment should have automatic rotation configured

use existing vpcs and subnets passed as parameters - dont create new ones. resource names need an environmentSuffix parameter for uniqueness

thinking we should do nested stacks - main template that orchestrates separate stacks for compute database networking and monitoring. makes it easier to update individual components. need parameter files for each environment with the different instance sizes and configs

environment configs:
dev uses t3.small ecs tasks and db.t3.micro single-az rds
staging uses t3.medium ecs tasks and db.t3.small single-az rds
production uses t3.large ecs tasks and db.r5.large multi-az rds with termination protection

use conditions to handle the prod-specific stuff like multi-az and termination protection. mappings can hold environment-specific values

tag everything with Environment Project CostCenter and ManagedBy tags

outputs from each nested stack should be comprehensive so other stacks can reference them and the app team can use the values

the traffic flow is: internet -> alb in public subnets -> ecs fargate tasks in private subnets -> rds postgres in private subnets. ecs tasks pull images from ecr, write logs to cloudwatch, and fetch secrets from secrets manager
