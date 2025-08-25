"""Simplified security stack for deployment testing"""

from aws_cdk import (
  Stack,
  RemovalPolicy,
  Duration,
  CfnOutput,
  aws_s3 as s3,
  aws_kms as kms,
  aws_iam as iam,
  aws_ec2 as ec2,
  aws_lambda as _lambda,
  aws_apigateway as apigateway,
  aws_elasticloadbalancingv2 as elbv2,
)
from constructs import Construct


class SimpleSecurityStack(Stack):
    """Simplified security stack with core components"""
    
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str = "dev", **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        self.environment_suffix = environment_suffix
    
        # KMS Key for encryption
        self.kms_key = kms.Key(
            self, "SecurityKey",
            description=f"KMS Key for {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
    
        # S3 Bucket with encryption
        self.secure_bucket = s3.Bucket(
            self, "SecureBucket",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
    
        # VPC
        self.vpc = ec2.Vpc(
            self, "SecureVpc",
            vpc_name=f"tap-{environment_suffix}-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ]
        )
    
        # Security Groups
        self.app_sg = ec2.SecurityGroup(
            self, "AppSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"tap-{environment_suffix}-app-sg-primary-1",
            description="Application security group",
            allow_all_outbound=True
        )
    
        self.app_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(443),
            description="HTTPS from VPC"
        )
    
        self.alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=self.vpc,
            security_group_name=f"tap-{environment_suffix}-alb-sg-primary-1",
            description="ALB security group",
            allow_all_outbound=True
        )
    
        self.alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP from anywhere"
        )
    
        # IAM Role for Lambda
        self.lambda_role = iam.Role(
            self, "LambdaRole",
            role_name=f"tap-{environment_suffix}-lambda-role-primary-1",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )
    
        # Lambda function
        self.lambda_function = _lambda.Function(
            self, "SecureFunction",
            function_name=f"tap-{environment_suffix}-function-primary-1",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json

def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'message': 'Secure function executed'})
    }
"""),
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            environment={
                "ENVIRONMENT": environment_suffix
            },
            timeout=Duration.seconds(30)
        )
    
        # API Gateway
        self.api = apigateway.LambdaRestApi(
            self, "SecureApi",
            rest_api_name=f"tap-{environment_suffix}-api-primary-1",
            handler=self.lambda_function,
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO
            )
        )
    
        # ALB
        self.alb = elbv2.ApplicationLoadBalancer(
            self, "ALB",
            load_balancer_name=f"tap-{environment_suffix}-alb-primary-1",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
    
        # Target Group
        self.target_group = elbv2.ApplicationTargetGroup(
            self, "TargetGroup",
            target_group_name=f"tap-{environment_suffix}-tg-primary-1",
            vpc=self.vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                path="/health"
            )
        )
    
        # Listener
        self.alb.add_listener(
            "Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[self.target_group]
        )
    
        # IAM Role for EC2
        self.ec2_role = iam.Role(
            self, "EC2Role",
            role_name=f"tap-{environment_suffix}-ec2-role-primary-1",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
    
        # Bastion Host
        self.bastion = ec2.Instance(
            self, "Bastion",
            instance_name=f"tap-{environment_suffix}-bastion-primary-1",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=self.app_sg,
            role=self.ec2_role
        )
    
        # Outputs
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "BastionInstanceId",
            value=self.bastion.instance_id,
            description="Bastion Instance ID"
        )
        
        CfnOutput(
            self, "APIGatewayURL",
            value=self.api.url,
            description="API Gateway URL"
        )
        
        CfnOutput(
            self, "LoadBalancerDNS",
            value=self.alb.load_balancer_dns_name,
            description="ALB DNS Name"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.secure_bucket.bucket_name,
            description="S3 Bucket Name"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda Function Name"
        )
