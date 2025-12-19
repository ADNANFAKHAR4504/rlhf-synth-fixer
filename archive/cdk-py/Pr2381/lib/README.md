AWS CDK CI/CD Pipeline Project: This project deploys a production-ready, multi-region CI/CD pipeline using the AWS Cloud Development Kit (CDK) with Python. This project leverages Docker containers, Amazon ECS Fargate, and AWS services to demonstrate comprehensive DevOps practices, including blue-green deployments, high availability, security, and monitoring. (Refer to OBSERVATIONS.md in the /lib directory to compare what the model and ideal response looks like, and what was achieved). The infrastructure is deployed in AWS regions us-east-1 and us-east-2, with support for development and production environments.

## Table of Contents.              
Architecture 
CDK Stacks 
Components Included (#components-included)
Tests (Unit and Integration tests)


Deployment Instructions (#deployment-instructions)
CI/CD Pipeline 
Security and Compliance
Monitoring and Observability 
Disaster Recovery 
Operational Runbooks 
Troubleshooting 


## Project Overview: 

This project implements a complex CI/CD pipeline using AWS CDK with Python. It supports: 
Multi-Region Deployment: Infrastructure in us-east-1 and us-east-2 with VPC peering.
High Availability: Multi-AZ setups for ECS and RDS, with Route 53 failover.
Blue-Green Deployments: Managed by AWS CodeDeploy for zero-downtime updates.
Security: IAM roles with least privilege, AWS Secrets Manager for credentials, and encryption.
Monitoring: CloudWatch dashboards and alarms for performance and health metrics.
CI/CD: GitHub Actions for automated build, test, and deployment. (See the actions in /lib/IDEAL_RESPONSE.md)
Testing: Comprehensive unit and integration tests for infrastructure and application.

The project fulfills requirements for production-ready infrastructure, including cost optimization, disaster recovery, and compliance considerations (e.g., SOC2, HIPAA).ArchitectureThe architecture comprises:VPC: Multi-AZ VPCs in us-east-1 and us-east-2 with public/private subnets, NAT gateways, and VPC peering.
ECS Fargate: Deploys Dockerized Flask application with auto-scaling and blue-green deployments.
ECR: Elastic Container Registry with image scanning and lifecycle policies.
RDS: Multi-AZ MySQL instances with read replicas in us-east-2 and encryption.
ALB: Application Load Balancers with health checks and SSL termination.
Route 53: DNS with failover routing for cross-region high availability.
CloudWatch: Dashboards and alarms for monitoring ECS and RDS.
Secrets Manager: Stores database and application credentials.
CodeDeploy: Manages blue-green deployments with automatic rollback.
GitHub Actions: Automates CI/CD with testing, image building, and deployment.

Architecture Diagram

[Internet]
    |
[Route 53] --> [ALB us-east-1] --> [ECS Fargate us-east-1]
    |           [Blue/Green TG]      [Flask App]
    |                                   |
    +---------> [ALB us-east-2] --> [ECS Fargate us-east-2]
                    [Blue/Green TG]      [Flask App]
[VPC us-east-1] <--> [VPC Peering] <--> [VPC us-east-2]
    |                                    |
[RDS Primary]                       [RDS Read Replica]
    |                                    |
[Secrets Manager]                 [Secrets Manager]
[CloudWatch]                      [CloudWatch]
[ECR]                             [ECR]

CDK StacksThe project defines the following CDK stacks in the cdk/ directory, orchestrated by app.py:VpcStack (cdk/vpc_stack.py):Creates a Multi-AZ VPC with public and private subnets, NAT gateways, and routing.
Configured in both us-east-1 and us-east-2.
CIDR: 10.0.0.0/16.

EcsStack (cdk/ecs_stack.py):Deploys an ECS Fargate cluster, task definition, and service.
Configures an Application Load Balancer (ALB) with blue and green target groups for CodeDeploy.
Integrates with ECR for Docker images and Secrets Manager for application secrets.
Auto-scaling and health checks enabled.

RdsStack (cdk/rds_stack.py):Deploys a Multi-AZ MySQL RDS instance with encryption and automated backups.
Includes a read replica in us-east-2 for disaster recovery.
Uses Secrets Manager for database credentials.

MonitoringStack (cdk/monitoring_stack.py):Sets up CloudWatch log groups, dashboards, and alarms for ECS and RDS.
Monitors CPU, memory, and health check metrics.

CicdStack (cdk/cicd_stack.py):Configures AWS CodeDeploy for blue-green deployments.
Defines deployment groups for ECS services in both regions.

VpcPeeringStack (cdk/vpc_peering_stack.py):Establishes VPC peering between us-east-1 and us-east-2.
Configures route tables for inter-region communication.

Route53Stack (cdk/route53_stack.py):Sets up a Route 53 hosted zone with failover routing.
Configures health checks for primary (us-east-1) and secondary (us-east-2) ALBs.

Components:
ECR: Repository with image scanning and lifecycle policies, replicated across regions.
ECS Fargate: Highly available container orchestration with auto-scaling.
ALB: Load balancing with blue-green target groups and health checks.
RDS: Multi-AZ MySQL with read replicas and encryption.
Secrets Manager: Secure storage for database and application credentials.
CloudWatch: Centralized logging, dashboards, and alarms.
Route 53: Cross-region failover for high availability.
GitHub Actions: CI/CD pipeline with testing, image building, and deployment.
IAM Roles: Least-privilege roles for ECS, CodeDeploy, and Secrets Manager.
VPC Peering: Secure inter-region communication.
Testing: Unit and integration tests for infrastructure and application.

Tests: The project includes comprehensive unit and integration tests to validate the infrastructure and application. Tests are organized in the tests/ directory. Unit tests validate individual stack configurations using the aws_cdk.assertions module and pytest. They are located in tests/unit/ and tests/app/ and do not require deployed resources. VPC Stack (tests/unit/test_vpc_stack.py):Verifies VPC CIDR (10.0.0.0/16), DNS settings, and resource counts (1 VPC, 4 subnets, 1 NAT gateway).
Ensures 2 public and 2 private subnets with correct configurations.

Example:python

def test_vpc_configuration(vpc_stack):
    vpc_stack.resource_count_is("AWS::EC2::VPC", 1)
    vpc_stack.has_resource_properties("AWS::EC2::VPC", {"CidrBlock": "10.0.0.0/16"})
    vpc_stack.resource_count_is("AWS::EC2::Subnet", 4)

ECS Stack (tests/unit/test_ecs_stack.py): Validates ECS cluster, Fargate task definition (256 CPU, 512 MB memory), and ALB setup.
Checks blue/green target groups and CodeDeploy configuration.
Example:python

def test_ecs_configuration(ecs_stack):
    ecs_stack.resource_count_is("AWS::ECS::Cluster", 1)
    ecs_stack.has_resource_properties("AWS::ECS::TaskDefinition", {"RequiresCompatibilities": ["FARGATE"]})
    ecs_stack.resource_count_is("AWS::ElasticLoadBalancingV2::TargetGroup", 2)

RDS Stack (tests/unit/test_rds_stack.py):Verifies MySQL instance configuration (Multi-AZ, encryption, backup retention).
Ensures Secrets Manager integration.
Example:python

def test_rds_configuration(rds_stack):
    rds_stack.resource_count_is("AWS::RDS::DBInstance", 1)
    rds_stack.has_resource_properties("AWS::RDS::DBInstance", {
        "Engine": "mysql",
        "MultiAZ": True,
        "StorageEncrypted": True
    })

Monitoring Stack (tests/unit/test_monitoring_stack.py):Validates CloudWatch log group, dashboard, and alarm configurations.
Example:python

def test_monitoring_configuration(monitoring_stack):
    monitoring_stack.resource_count_is("AWS::CloudWatch::Dashboard", 1)
    monitoring_stack.has_resource_properties("AWS::CloudWatch::Alarm", {
        "MetricName": "HealthCheckFailed",
        "Threshold": 1
    })

CI/CD Stack (tests/unit/test_cicd_stack.py):Checks CodeDeploy application and deployment group settings.
Example:python

def test_cicd_configuration(cicd_stack):
    cicd_stack.resource_count_is("AWS::CodeDeploy::Application", 1)
    cicd_stack.has_resource_properties("AWS::CodeDeploy::DeploymentGroup", {
        "DeploymentStyle": {"DeploymentOption": "WITH_TRAFFIC_CONTROL"}
    })

VPC Peering Stack (tests/unit/test_vpc_peering_stack.py):Verifies peering connection and route table updates.
Example:python

def test_peering_configuration(peering_stack):
    peering_stack.resource_count_is("AWS::EC2::VPCPeeringConnection", 1)
    peering_stack.resource_count_is("AWS::EC2::Route", 4)  # Routes for both VPCs

Route 53 Stack (tests/unit/test_route53_stack.py):Validates hosted zone, failover records, and health checks.
Example:python

def test_route53_configuration(route53_stack):
    route53_stack.resource_count_is("AWS::Route53::HostedZone", 1)
    route53_stack.has_resource_properties("AWS::Route53::RecordSet", {
        "Type": "A",
        "Failover": "PRIMARY"
    })



Integration TestsIntegration tests validate interactions between stacks and the deployed application, located in tests/integration/test_integration.py. They require a deployed stack and AWS credentials.ECS-ALB Connectivity:Tests that the ALB routes requests to the ECS service’s /health endpoint.
Example:python

import requests
response = requests.get(f"http://{alb_dns}/health", timeout=10)
assert response.status_code == 200
assert response.json() == {"status": "healthy"}

RDS Connectivity:Verifies connectivity to the RDS instance using Secrets Manager credentials.
Executes SELECT 1 to confirm database access and tests a sample table creation/insertion.
Example:python

try:
    secret = secret_client.get_secret_value(SecretId=f"rds-app-{app.node.try_get_context('stack')}")
    secret_dict = json.loads(secret["SecretString"])
    db = mysql.connector.connect(
        host=rds_endpoint,
        user="admin",
        password=secret_dict["password"],
        database="appdb"
    )
    cursor = db.cursor()
    cursor.execute("CREATE TABLE IF NOT EXISTS test_table (id INT PRIMARY KEY, value VARCHAR(50))")
    cursor.execute("INSERT INTO test_table (id, value) VALUES (1, 'test')")
    db.commit()
    cursor.execute("SELECT value FROM test_table WHERE id = 1")
    assert cursor.fetchone()[0] == "test"
except Exception as e:
    pytest.fail(f"Database connection failed: {str(e)}")
finally:
    if db.is_connected():
        db.close()

Read Replica Connectivity:Tests connectivity to the RDS read replica in us-east-2.
Example:python

replica_endpoint = rds_stack.rds_instance_replica.instance_endpoint.hostname
db_replica = mysql.connector.connect(
    host=replica_endpoint,
    user="admin",
    password=secret_dict["password"],
    database="appdb"
)
cursor = db_replica.cursor()
cursor.execute("SELECT 1")
assert cursor.fetchone()[0] == 1

Blue-Green Deployment:Triggers a CodeDeploy deployment and verifies traffic switching (requires manual setup or simulation in CI/CD).

Deployment InstructionsPrerequisites:Install AWS CDK CLI: npm install -g aws-cdk
Install Docker: brew install docker
Install Python dependencies: pip install -r requirements.txt
Configure AWS CLI: aws configure
Set up GitHub repository with secrets: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CODEDEPLOY_ROLE_ARN, TASK_DEFINITION_ARN, PREVIOUS_TASK_DEFINITION_ARN

Bootstrap CDK:bash

cdk bootstrap aws://<account-id>/us-east-1
cdk bootstrap aws://<account-id>/us-east-2

Deploy Stacks:For development:bash

cdk deploy --all --context stack=dev

For production:bash

cdk deploy --all --context stack=prod

Build and Push Docker Image:bash

docker build -t app .
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag app:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/app-repo-<stack>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/app-repo-<stack>:latest

Run Tests:Unit tests:bash

pytest tests/unit/ -v

Integration tests (after deploying test stack):bash

cdk deploy --context stack=test
pytest tests/integration/ -v

CI/CD Pipeline:Push code to GitHub.
Monitor GitHub Actions workflow (.github/workflows/cicd.yml) for automated build, test, and deployment.

CI/CD PipelineThe CI/CD pipeline is implemented using GitHub Actions (see /lib/IDEAL_RESPONSE.md):Triggers: Runs on push or pull request to main or dev branches.
Jobs:Build and Test: Installs dependencies, runs unit and integration tests, builds Docker image, and scans for vulnerabilities using Trivy.
Deploy: Pushes Docker image to ECR, deploys CDK stacks, and triggers CodeDeploy for blue-green deployments.
Rollback: Automatically rolls back if deployment fails (uses previous task definition).

Features:Blue-green deployments with traffic switching.
Automatic rollback on health check failures.
Container image scanning for security.

Security and ComplianceIAM Roles: Least-privilege roles for ECS, CodeDeploy, and Secrets Manager.
Secrets Management: Database and application credentials stored in Secrets Manager.
Encryption: RDS storage and data in transit encrypted; ALB supports SSL termination.
Audit Trails: CloudWatch logs capture ECS and CodeDeploy events.
Compliance: Configured for SOC2/HIPAA with encryption and audit logging. Add AWS WAF for enhanced security.
Security Scanning: Trivy scans Docker images for vulnerabilities in the CI/CD pipeline.

Monitoring and ObservabilityCloudWatch:Log groups for ECS container logs (/ecs/app-<stack>).
Dashboards for CPU, memory, and health metrics for ECS and RDS.
Alarms for ECS health check failures, notifying via SNS.

Health Checks: ALB and Route 53 health checks ensure application availability.
Metrics: Real-time monitoring of ECS CPU/memory and RDS performance.

Disaster RecoveryMulti-Region: Deployments in us-east-1 and us-east-2 with Route 53 failover.
RDS Replication: Read replica in us-east-2 for data redundancy.
Backups: RDS automated backups with 7-day retention.
Failover: Route 53 switches traffic to us-east-2 if us-east-1 ALB fails.

Operational RunbooksDeploymentManual: cdk deploy --context stack=<dev|prod>
Automated: Push to GitHub triggers CI/CD pipeline.

RollbackAutomatic: CodeDeploy rolls back if health checks fail.
Manual: Update ECS service with previous task definition:bash

aws ecs update-service --cluster app-cluster-<stack> --service app-service-<stack> --task-definition <previous-task-arn>

MonitoringView CloudWatch dashboard: AWS Console > CloudWatch > Dashboards > app-<stack>
Respond to SNS alerts for health check failures.

TroubleshootingECS Issues: Check logs: aws logs tail /ecs/app-<stack>
RDS Issues: Verify connectivity: mysql -h <rds-endpoint> -u admin -p
CodeDeploy Failures: Inspect deployment status: aws deploy get-deployment --deployment-id <id>
ALB Issues: Check health checks in AWS Console.

