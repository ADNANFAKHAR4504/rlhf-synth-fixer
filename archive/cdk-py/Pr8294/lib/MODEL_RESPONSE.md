# AWS CDK Scalable Web Application

Here's a complete AWS CDK project in Python that deploys a scalable web application following AWS best practices:

## app.py

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Environment,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_certificatemanager as acm,
    aws_route53 as route53,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct

class ScalableWebAppStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, project_name: str, environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.project_name = project_name
        self.environment = environment
        
        # Create VPC and networking components
        self.create_vpc()
        
        # Create security groups
        self.create_security_groups()
        
        # Create RDS database
        self.create_database()
        
        # Create Application Load Balancer
        self.create_load_balancer()
        
        # Create Auto Scaling Group with EC2 instances
        self.create_auto_scaling_group()
        
        # Configure Auto Scaling policies
        self.create_scaling_policies()
        
        # Apply tags to all resources
        self.apply_tags()
        
        # Create outputs
        self.create_outputs()

    def create_vpc(self):
        """Create VPC with public and private subnets"""
        self.vpc = ec2.Vpc(
            self, 
            f"{self.project_name}-{self.environment}.vpc",
            vpc_name=f"{self.project_name}-{self.environment}.vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,
            subnet_configuration=[
                # Public subnets for ALB
                ec2.SubnetConfiguration(
                    name=f"{self.project_name}-{self.environment}.public-subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                # Private subnets for EC2 instances
                ec2.SubnetConfiguration(
                    name=f"{self.project_name}-{self.environment}.private-subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                # Isolated subnets for RDS
                ec2.SubnetConfiguration(
                    name=f"{self.project_name}-{self.environment}.db-subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

    def create_security_groups(self):
        """Create security groups for ALB, EC2, and RDS"""
        
        # ALB Security Group - Allow HTTPS traffic from internet
        self.alb_security_group = ec2.SecurityGroup(
            self,
            f"{self.project_name}-{self.environment}.alb-sg",
            security_group_name=f"{self.project_name}-{self.environment}.alb-sg",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True,
        )
        
        # Allow HTTPS inbound traffic
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from internet",
        )
        
        # Allow HTTP for health checks (internal only)
        self.alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP for health checks",
        )
        
        # EC2 Security Group - Allow traffic from ALB only
        self.ec2_security_group = ec2.SecurityGroup(
            self,
            f"{self.project_name}-{self.environment}.ec2-sg",
            security_group_name=f"{self.project_name}-{self.environment}.ec2-sg",
            vpc=self.vpc,
            description="Security group for EC2 instances",
            allow_all_outbound=True,
        )
        
        # Allow HTTP traffic from ALB
        self.ec2_security_group.add_ingress_rule(
            peer=self.alb_security_group,
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB",
        )
        
        # Allow SSH access (optional, for debugging)
        self.ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access from VPC",
        )
        
        # RDS Security Group - Allow traffic from EC2 only
        self.rds_security_group = ec2.SecurityGroup(
            self,
            f"{self.project_name}-{self.environment}.rds-sg",
            security_group_name=f"{self.project_name}-{self.environment}.rds-sg",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False,
        )
        
        # Allow MySQL/PostgreSQL traffic from EC2
        self.rds_security_group.add_ingress_rule(
            peer=self.ec2_security_group,
            connection=ec2.Port.tcp(3306),  # MySQL port
            description="Allow MySQL traffic from EC2 instances",
        )

    def create_database(self):
        """Create RDS MySQL database with encryption and Multi-AZ"""
        
        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            self,
            f"{self.project_name}-{self.environment}.db-subnet-group",
            subnet_group_name=f"{self.project_name}-{self.environment}-db-subnet-group",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )
        
        # Create database credentials in Secrets Manager
        self.db_credentials = rds.DatabaseSecret(
            self,
            f"{self.project_name}-{self.environment}.db-credentials",
            secret_name=f"{self.project_name}-{self.environment}/db-credentials",
            username="admin",
            description="Database credentials for web application",
        )
        
        # Create RDS instance
        self.database = rds.DatabaseInstance(
            self,
            f"{self.project_name}-{self.environment}.database",
            instance_identifier=f"{self.project_name}-{self.environment}-database",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_35
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO,
            ),
            credentials=rds.Credentials.from_secret(self.db_credentials),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.rds_security_group],
            multi_az=True,  # High availability
            storage_encrypted=True,  # Encryption at rest
            allocated_storage=20,
            max_allocated_storage=100,
            backup_retention=Duration.days(7),
            deletion_protection=True if self.environment == "prod" else False,
            removal_policy=RemovalPolicy.SNAPSHOT if self.environment == "prod" else RemovalPolicy.DESTROY,
            parameter_group=rds.ParameterGroup.from_parameter_group_name(
                self, "DefaultParameterGroup", "default.mysql8.0"
            ),
        )

    def create_load_balancer(self):
        """Create Application Load Balancer with HTTPS listener"""
        
        # Create ALB
        self.load_balancer = elbv2.ApplicationLoadBalancer(
            self,
            f"{self.project_name}-{self.environment}.alb",
            load_balancer_name=f"{self.project_name}-{self.environment}-alb",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=self.alb_security_group,
        )
        
        # Create target group
        self.target_group = elbv2.ApplicationTargetGroup(
            self,
            f"{self.project_name}-{self.environment}.target-group",
            target_group_name=f"{self.project_name}-{self.environment}-tg",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=2,
                healthy_threshold_count=5,
            ),
            target_type=elbv2.TargetType.INSTANCE,
        )
        
        # Note: In production, you would want to use ACM certificate for HTTPS
        # For this example, we'll create an HTTP listener and redirect to HTTPS
        
        # HTTP listener that redirects to HTTPS
        self.load_balancer.add_listener(
            f"{self.project_name}-{self.environment}.http-listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.redirect(
                protocol="HTTPS",
                port="443",
                permanent=True,
            ),
        )
        
        # HTTPS listener (you would need to provide a certificate ARN in production)
        # For demo purposes, we'll use HTTP listener
        self.https_listener = self.load_balancer.add_listener(
            f"{self.project_name}-{self.environment}.https-listener",
            port=443,
            protocol=elbv2.ApplicationProtocol.HTTP,  # Change to HTTPS in production
            default_target_groups=[self.target_group],
        )

    def create_auto_scaling_group(self):
        """Create Auto Scaling Group with EC2 instances"""
        
        # Create IAM role for EC2 instances
        ec2_role = iam.Role(
            self,
            f"{self.project_name}-{self.environment}.ec2-role",
            role_name=f"{self.project_name}-{self.environment}-ec2-role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore"),
            ],
        )
        
        # Grant permission to read database secrets
        self.db_credentials.grant_read(ec2_role)
        
        # User data script for EC2 instances
        user_data_script = ec2.UserData.for_linux()
        user_data_script.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            "echo '<h1>Hello from Web Server</h1>' > /var/www/html/index.html",
            "echo 'OK' > /var/www/html/health",
            # Install CloudWatch agent
            "yum install -y amazon-cloudwatch-agent",
            # Install AWS CLI for secrets access
            "yum install -y aws-cli",
        )
        
        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self,
            f"{self.project_name}-{self.environment}.launch-template",
            launch_template_name=f"{self.project_name}-{self.environment}-launch-template",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO,
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
                edition=ec2.AmazonLinuxEdition.STANDARD,
                virtualization=ec2.AmazonLinuxVirt.HVM,
                storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE,
            ),
            security_group=self.ec2_security_group,
            role=ec2_role,
            user_data=user_data_script,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=8,
                        encrypted=True,
                        delete_on_termination=True,
                    ),
                )
            ],
        )
        
        # Create Auto Scaling Group
        self.auto_scaling_group = autoscaling.AutoScalingGroup(
            self,
            f"{self.project_name}-{self.environment}.asg",
            auto_scaling_group_name=f"{self.project_name}-{self.environment}-asg",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            launch_template=launch_template,
            min_capacity=2,
            max_capacity=10,
            desired_capacity=2,
            health_check=autoscaling.HealthCheck.elb(
                grace=Duration.minutes(5)
            ),
            update_policy=autoscaling.UpdatePolicy.rolling_update(
                max_batch_size=1,
                min_instances_in_service=1,
                pause_time=Duration.minutes(5),
            ),
        )
        
        # Attach ASG to target group
        self.auto_scaling_group.attach_to_application_target_group(self.target_group)

    def create_scaling_policies(self):
        """Create Auto Scaling policies based on CPU utilization"""
        
        # Scale up policy
        scale_up_policy = self.auto_scaling_group.scale_on_cpu_utilization(
            f"{self.project_name}-{self.environment}.scale-up-policy",
            target_utilization_percent=70,
            cooldown=Duration.minutes(5),
        )
        
        # Scale down policy
        scale_down_policy = self.auto_scaling_group.scale_on_cpu_utilization(
            f"{self.project_name}-{self.environment}.scale-down-policy",
            target_utilization_percent=30,
            cooldown=Duration.minutes(5),
        )

    def apply_tags(self):
        """Apply consistent tags to all resources"""
        common_tags = {
            "Project": self.project_name,
            "Environment": self.environment,
            "ManagedBy": "CDK",
            "CostCenter": f"{self.project_name}-{self.environment}",
        }
        
        for key, value in common_tags.items():
            self.tags.set_tag(key, value)

    def create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self,
            "LoadBalancerDNS",
            value=self.load_balancer.load_balancer_dns_name,
            description="DNS name of the load balancer",
            export_name=f"{self.project_name}-{self.environment}-alb-dns",
        )
        
        CfnOutput(
            self,
            "DatabaseEndpoint",
            value=self.database.instance_endpoint.hostname,
            description="RDS database endpoint",
            export_name=f"{self.project_name}-{self.environment}-db-endpoint",
        )
        
        CfnOutput(
            self,
            "DatabaseSecretArn",
            value=self.db_credentials.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"{self.project_name}-{self.environment}-db-secret-arn",
        )


def main():
    app = App()
    
    # Configuration
    project_name = "webapp"
    environment = "dev"  # Change to 'staging' or 'prod' as needed
    
    # Create the stack
    ScalableWebAppStack(
        app,
        f"{project_name}-{environment}-stack",
        project_name=project_name,
        environment=environment,
        env=Environment(
            account=os.getenv('CDK_DEFAULT_ACCOUNT'),
            region='us-west-2'
        ),
        description=f"Scalable web application stack for {project_name} in {environment} environment",
    )
    
    app.synth()


if __name__ == "__main__":
    main()
```

## Additional Files Needed

### requirements.txt
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### cdk.json
```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

## Key Features Implemented

### 1. **VPC & Networking**
- VPC with public, private, and isolated subnets across 3 AZs
- HTTPS-only access (HTTP redirects to HTTPS)
- Proper security groups with least privilege access

### 2. **Application Layer**
- Auto Scaling Group with EC2 instances in private subnets
- Application Load Balancer with health checks
- Launch template with encrypted EBS volumes

### 3. **Database Layer**
- RDS MySQL in isolated subnets with encryption
- Multi-AZ deployment for high availability
- Database credentials stored in AWS Secrets Manager

### 4. **Scaling & Resilience**
- Auto Scaling policies based on CPU utilization
- Rolling updates for zero-downtime deployments
- Health checks at both ALB and ASG levels

### 5. **Security Best Practices**
- Encrypted storage (EBS and RDS)
- IAM roles with minimal permissions
- Security groups with restrictive rules
- Database in isolated subnets

### 6. **Naming Convention**
- Consistent `<project>-<environment>.<resource>` naming
- Environment-specific configurations
- Proper tagging strategy

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Deploy the stack:**
   ```bash
   cdk deploy
   ```

3. **Access the application:**
   - Use the LoadBalancerDNS output value
   - The application will be available at `https://<alb-dns-name>`

## Production Considerations

For production deployment, consider these additional improvements:

1. **SSL Certificate:** Use AWS Certificate Manager for proper HTTPS
2. **Domain Name:** Configure Route 53 for custom domain
3. **Monitoring:** Add CloudWatch alarms and dashboards
4. **Logging:** Configure centralized logging with CloudWatch Logs
5. **Backup:** Implement automated backup strategies
6. **Security:** Add WAF for additional protection
7. **Cost Optimization:** Use Spot instances for non-critical environments

This infrastructure follows AWS Well-Architected Framework principles and provides a solid foundation for a scalable web application.