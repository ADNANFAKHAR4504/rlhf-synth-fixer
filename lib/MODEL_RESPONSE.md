To design a secure and highly available infrastructure using AWS CDK in Python, we can follow these steps. Below is a structured approach with code examples and explanations.

Project Structure
my-cdk-app/
├── app.py
├── cdk.json
├── requirements.txt
├── my_cdk_app/
    ├── __init__.py
    ├── vpc_stack.py
    ├── database_stack.py
    ├── alb_stack.py
    ├── route53_stack.py
    ├── monitoring_stack.py
    └── kms_stack.py
Key Design Decisions
Modular Stacks: Each component (VPC, Database, ALB, etc.) is defined in its own stack to promote reusability and separation of concerns.
Multi-Region Deployment: We will deploy stacks in both us-east-1 and us-west-2.
Failover Handling: Using Route 53 for DNS failover routing between regions.
Example CDK Code
app.py
#!/usr/bin/env python3
import os
from aws_cdk import core
from my_cdk_app.vpc_stack import VpcStack
from my_cdk_app.database_stack import DatabaseStack
from my_cdk_app.alb_stack import AlbStack
from my_cdk_app.route53_stack import Route53Stack
from my_cdk_app.monitoring_stack import MonitoringStack
from my_cdk_app.kms_stack import KmsStack

app = core.App()

regions = ["us-east-1", "us-west-2"]

for region in regions:
    env = core.Environment(account=os.getenv('CDK_DEFAULT_ACCOUNT'), region=region)
    
    kms_stack = KmsStack(app, f"KmsStack-{region}", env=env)
    
    vpc_stack = VpcStack(app, f"VpcStack-{region}", env=env)
    
    database_stack = DatabaseStack(app, f"DatabaseStack-{region}", 
                                   vpc=vpc_stack.vpc, 
                                   kms_key=kms_stack.key,
                                   env=env)
    
    alb_stack = AlbStack(app, f"AlbStack-{region}", 
                         vpc=vpc_stack.vpc, 
                         env=env)
    
    monitoring_stack = MonitoringStack(app, f"MonitoringStack-{region}", env=env)

route53_stack = Route53Stack(app, "Route53Stack", env=core.Environment(account=os.getenv('CDK_DEFAULT_ACCOUNT'), region="us-east-1"))

app.synth()
kms_stack.py
from aws_cdk import aws_kms as kms, core

class KmsStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        self.key = kms.Key(self, "AppKey",
            enable_key_rotation=True,
            removal_policy=core.RemovalPolicy.DESTROY)
vpc_stack.py
from aws_cdk import aws_ec2 as ec2, core

class VpcStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        self.vpc = ec2.Vpc(self, "AppVpc",
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(name="public", subnet_type=ec2.SubnetType.PUBLIC),
                ec2.SubnetConfiguration(name="private", subnet_type=ec2.SubnetType.PRIVATE)
            ])
database_stack.py
from aws_cdk import aws_rds as rds, aws_ec2 as ec2, core

class DatabaseStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, vpc: ec2.Vpc, kms_key, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        self.db_cluster = rds.DatabaseCluster(self, "AppDatabase",
            engine=rds.DatabaseClusterEngine.aurora_mysql(version=rds.AuroraMysqlEngineVersion.VER_2_08_1),
            credentials=rds.Credentials.from_generated_secret("admin"),
            instance_props=rds.InstanceProps(
                vpc=vpc,
                instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE)
            ),
            backup=rds.BackupProps(retention=core.Duration.days(7)),
            storage_encrypted=True,
            storage_encryption_key=kms_key,
            removal_policy=core.RemovalPolicy.SNAPSHOT)
alb_stack.py
from aws_cdk import aws_elasticloadbalancingv2 as elbv2, aws_ec2 as ec2, core

class AlbStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, vpc: ec2.Vpc, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        self.alb = elbv2.ApplicationLoadBalancer(self, "AppAlb",
            vpc=vpc,
            internet_facing=True)
route53_stack.py
from aws_cdk import aws_route53 as route53, aws_route53_targets as targets, core

class Route53Stack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        hosted_zone = route53.HostedZone.from_lookup(self, "HostedZone", domain_name="example.com")
        
        record_set = route53.RecordSet(self, "AppRecordSet",
            zone=hosted_zone,
            record_type=route53.RecordType.A,
            target=route53.RecordTarget.from_alias(targets.LoadBalancerTarget(
                load_balancer=AlbStack(self, "AlbStack-us-east-1", env=self.env).alb
            )))
        
        # Add failover routing logic here
monitoring_stack.py
from aws_cdk import aws_cloudwatch as cloudwatch, core

class MonitoringStack(core.Stack):
    def __init__(self, scope: core.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)
        
        # Define CloudWatch alarms and logging configurations
Conclusion
This CDK project structure and code provide a foundation for a secure, highly available infrastructure across multiple AWS regions. Each stack is modular, promoting reusability and maintainability. The use of customer-managed KMS keys ensures data encryption, and Route 53 facilitates DNS management and failover. This design adheres to AWS best practices and infrastructure-as-code principles.