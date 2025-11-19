"""
Multi-Region Disaster Recovery Infrastructure Stack

Implements comprehensive disaster recovery across us-east-1 and us-east-2 with:
- Global Accelerator with endpoint groups (CRITICAL FIX)
- API Gateway with custom domains (CRITICAL FIX)
- Parameter Store replication (CRITICAL FIX)
- Route 53 health checks monitoring real infrastructure (CRITICAL FIX)
- S3 cross-region replication with RTC
- DynamoDB Global Tables
- Aurora Global Database
- Lambda functions in both regions
- EventBridge for event routing
- CloudWatch monitoring and SNS alerting

All resources include environmentSuffix and are fully destroyable.
"""

import json
import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions, Output, Config
from typing import Optional


class TapStackArgs:
    """Arguments for TapStack component."""
    
    def __init__(self, environment_suffix: str):
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """Multi-region disaster recovery infrastructure stack."""
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('custom:infra:TapStack', name, {}, opts)
        
        self.environment_suffix = args.environment_suffix
        config = Config()
        
        # Configurable domain names
        self.primary_domain = config.get('primaryDomain') or f'api-primary-{self.environment_suffix}.example.com'
        self.secondary_domain = config.get('secondaryDomain') or f'api-secondary-{self.environment_suffix}.example.com'
        
        # Regional providers
        self.primary_provider = aws.Provider(
            f'aws-primary-{self.environment_suffix}',
            region='us-east-1',
            opts=ResourceOptions(parent=self)
        )
        
        self.secondary_provider = aws.Provider(
            f'aws-secondary-{self.environment_suffix}',
            region='us-east-2',
            opts=ResourceOptions(parent=self)
        )
        
        # Create infrastructure components
        self._create_networking()
        self._create_iam_roles()
        self._create_global_accelerator()
        self._create_api_gateway()
        self._create_parameter_store()
        self._create_storage()
        self._create_databases()
        self._create_compute()
        self._create_monitoring()
        
        self.register_outputs({
            'primary_vpc_id': self.primary_vpc.id,
            'secondary_vpc_id': self.secondary_vpc.id,
            'global_accelerator_dns': self.accelerator.dns_name,
        })
    
    def _create_networking(self):
        """Create VPCs, subnets, and NLBs in both regions."""
        
        # Primary VPC
        self.primary_vpc = aws.ec2.Vpc(
            f'vpc-primary-{self.environment_suffix}',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f'vpc-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        # Primary subnets
        self.primary_public_subnet_1 = aws.ec2.Subnet(
            f'subnet-primary-public-1-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone='us-east-1a',
            map_public_ip_on_launch=True,
            tags={'Name': f'subnet-primary-public-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        self.primary_public_subnet_2 = aws.ec2.Subnet(
            f'subnet-primary-public-2-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone='us-east-1b',
            map_public_ip_on_launch=True,
            tags={'Name': f'subnet-primary-public-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        self.primary_private_subnet_1 = aws.ec2.Subnet(
            f'subnet-primary-private-1-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            cidr_block='10.0.10.0/24',
            availability_zone='us-east-1a',
            tags={'Name': f'subnet-primary-private-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        self.primary_private_subnet_2 = aws.ec2.Subnet(
            f'subnet-primary-private-2-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            cidr_block='10.0.11.0/24',
            availability_zone='us-east-1b',
            tags={'Name': f'subnet-primary-private-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        # Primary Internet Gateway
        self.primary_igw = aws.ec2.InternetGateway(
            f'igw-primary-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            tags={'Name': f'igw-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        # Primary route table
        self.primary_route_table = aws.ec2.RouteTable(
            f'rt-primary-public-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block='0.0.0.0/0', gateway_id=self.primary_igw.id)],
            tags={'Name': f'rt-primary-public-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        aws.ec2.RouteTableAssociation(
            f'rta-primary-public-1-{self.environment_suffix}',
            subnet_id=self.primary_public_subnet_1.id,
            route_table_id=self.primary_route_table.id,
            opts=ResourceOptions(parent=self.primary_route_table, provider=self.primary_provider)
        )
        
        aws.ec2.RouteTableAssociation(
            f'rta-primary-public-2-{self.environment_suffix}',
            subnet_id=self.primary_public_subnet_2.id,
            route_table_id=self.primary_route_table.id,
            opts=ResourceOptions(parent=self.primary_route_table, provider=self.primary_provider)
        )
        
        # Secondary VPC
        self.secondary_vpc = aws.ec2.Vpc(
            f'vpc-secondary-{self.environment_suffix}',
            cidr_block='10.1.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f'vpc-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # Secondary subnets
        self.secondary_public_subnet_1 = aws.ec2.Subnet(
            f'subnet-secondary-public-1-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            cidr_block='10.1.1.0/24',
            availability_zone='us-east-2a',
            map_public_ip_on_launch=True,
            tags={'Name': f'subnet-secondary-public-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        self.secondary_public_subnet_2 = aws.ec2.Subnet(
            f'subnet-secondary-public-2-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            cidr_block='10.1.2.0/24',
            availability_zone='us-east-2b',
            map_public_ip_on_launch=True,
            tags={'Name': f'subnet-secondary-public-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        self.secondary_private_subnet_1 = aws.ec2.Subnet(
            f'subnet-secondary-private-1-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            cidr_block='10.1.10.0/24',
            availability_zone='us-east-2a',
            tags={'Name': f'subnet-secondary-private-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        self.secondary_private_subnet_2 = aws.ec2.Subnet(
            f'subnet-secondary-private-2-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            cidr_block='10.1.11.0/24',
            availability_zone='us-east-2b',
            tags={'Name': f'subnet-secondary-private-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Secondary Internet Gateway
        self.secondary_igw = aws.ec2.InternetGateway(
            f'igw-secondary-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            tags={'Name': f'igw-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Secondary route table
        self.secondary_route_table = aws.ec2.RouteTable(
            f'rt-secondary-public-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(cidr_block='0.0.0.0/0', gateway_id=self.secondary_igw.id)],
            tags={'Name': f'rt-secondary-public-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        aws.ec2.RouteTableAssociation(
            f'rta-secondary-public-1-{self.environment_suffix}',
            subnet_id=self.secondary_public_subnet_1.id,
            route_table_id=self.secondary_route_table.id,
            opts=ResourceOptions(parent=self.secondary_route_table, provider=self.secondary_provider)
        )
        
        aws.ec2.RouteTableAssociation(
            f'rta-secondary-public-2-{self.environment_suffix}',
            subnet_id=self.secondary_public_subnet_2.id,
            route_table_id=self.secondary_route_table.id,
            opts=ResourceOptions(parent=self.secondary_route_table, provider=self.secondary_provider)
        )
        
        # VPC Peering
        self.vpc_peering = aws.ec2.VpcPeeringConnection(
            f'vpc-peering-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            peer_vpc_id=self.secondary_vpc.id,
            peer_region='us-east-2',
            auto_accept=False,
            tags={'Name': f'vpc-peering-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.vpc_peering_accepter = aws.ec2.VpcPeeringConnectionAccepter(
            f'vpc-peering-accepter-{self.environment_suffix}',
            vpc_peering_connection_id=self.vpc_peering.id,
            auto_accept=True,
            tags={'Name': f'vpc-peering-accepter-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc_peering, provider=self.secondary_provider)
        )
        
        # Network Load Balancers
        self.primary_nlb = aws.lb.LoadBalancer(
            f'nlb-primary-{self.environment_suffix}',
            load_balancer_type='network',
            subnets=[self.primary_public_subnet_1.id, self.primary_public_subnet_2.id],
            tags={'Name': f'nlb-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        self.secondary_nlb = aws.lb.LoadBalancer(
            f'nlb-secondary-{self.environment_suffix}',
            load_balancer_type='network',
            subnets=[self.secondary_public_subnet_1.id, self.secondary_public_subnet_2.id],
            tags={'Name': f'nlb-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Target groups
        self.primary_target_group = aws.lb.TargetGroup(
            f'tg-primary-{self.environment_suffix}',
            port=443,
            protocol='TCP',
            vpc_id=self.primary_vpc.id,
            target_type='ip',
            tags={'Name': f'tg-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_nlb, provider=self.primary_provider)
        )
        
        self.secondary_target_group = aws.lb.TargetGroup(
            f'tg-secondary-{self.environment_suffix}',
            port=443,
            protocol='TCP',
            vpc_id=self.secondary_vpc.id,
            target_type='ip',
            tags={'Name': f'tg-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_nlb, provider=self.secondary_provider)
        )
        
        # NLB Listeners
        self.primary_nlb_listener = aws.lb.Listener(
            f'listener-primary-{self.environment_suffix}',
            load_balancer_arn=self.primary_nlb.arn,
            port=443,
            protocol='TCP',
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type='forward',
                target_group_arn=self.primary_target_group.arn,
            )],
            opts=ResourceOptions(parent=self.primary_nlb, provider=self.primary_provider)
        )
        
        self.secondary_nlb_listener = aws.lb.Listener(
            f'listener-secondary-{self.environment_suffix}',
            load_balancer_arn=self.secondary_nlb.arn,
            port=443,
            protocol='TCP',
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type='forward',
                target_group_arn=self.secondary_target_group.arn,
            )],
            opts=ResourceOptions(parent=self.secondary_nlb, provider=self.secondary_provider)
        )
    
    def _create_iam_roles(self):
        """Create IAM roles for Lambda, S3 replication, and other services."""
        
        # Lambda role
        lambda_assume_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['lambda.amazonaws.com'],
                )],
                actions=['sts:AssumeRole'],
            )]
        )
        
        self.lambda_role = aws.iam.Role(
            f'role-lambda-{self.environment_suffix}',
            assume_role_policy=lambda_assume_role_policy.json,
            tags={'Name': f'role-lambda-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f'lambda-basic-execution-{self.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
            opts=ResourceOptions(parent=self.lambda_role)
        )
        
        aws.iam.RolePolicyAttachment(
            f'lambda-vpc-execution-{self.environment_suffix}',
            role=self.lambda_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            opts=ResourceOptions(parent=self.lambda_role)
        )
        
        # S3 replication role
        s3_replication_assume_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['s3.amazonaws.com'],
                )],
                actions=['sts:AssumeRole'],
            )]
        )
        
        self.s3_replication_role = aws.iam.Role(
            f'role-s3-replication-{self.environment_suffix}',
            assume_role_policy=s3_replication_assume_role_policy.json,
            tags={'Name': f'role-s3-replication-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
    
    def _create_global_accelerator(self):
        """
        Create Global Accelerator with endpoint groups.
        
        CRITICAL FIX: Previous version missing endpoint groups.
        Without endpoint groups, Global Accelerator cannot route traffic.
        """
        
        # Global Accelerator
        self.accelerator = aws.globalaccelerator.Accelerator(
            f'accelerator-{self.environment_suffix}',
            name=f'accelerator-{self.environment_suffix}',
            ip_address_type='IPV4',
            enabled=True,
            attributes=aws.globalaccelerator.AcceleratorAttributesArgs(flow_logs_enabled=False),
            tags={'Name': f'accelerator-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        
        # Listener
        self.accelerator_listener = aws.globalaccelerator.Listener(
            f'accelerator-listener-{self.environment_suffix}',
            accelerator_arn=self.accelerator.id,
            protocol='TCP',
            port_ranges=[aws.globalaccelerator.ListenerPortRangeArgs(from_port=443, to_port=443)],
            opts=ResourceOptions(parent=self.accelerator)
        )
        
        # CRITICAL FIX: Endpoint group for primary region
        self.primary_endpoint_group = aws.globalaccelerator.EndpointGroup(
            f'endpoint-group-primary-{self.environment_suffix}',
            listener_arn=self.accelerator_listener.id,
            endpoint_group_region='us-east-1',
            traffic_dial_percentage=100,
            health_check_interval_seconds=30,
            health_check_protocol='TCP',
            health_check_port=443,
            threshold_count=3,
            endpoint_configurations=[aws.globalaccelerator.EndpointGroupEndpointConfigurationArgs(
                endpoint_id=self.primary_nlb.arn,
                weight=100,
                client_ip_preservation_enabled=False,
            )],
            opts=ResourceOptions(parent=self.accelerator_listener, depends_on=[self.primary_nlb])
        )
        
        # CRITICAL FIX: Endpoint group for secondary region
        self.secondary_endpoint_group = aws.globalaccelerator.EndpointGroup(
            f'endpoint-group-secondary-{self.environment_suffix}',
            listener_arn=self.accelerator_listener.id,
            endpoint_group_region='us-east-2',
            traffic_dial_percentage=100,
            health_check_interval_seconds=30,
            health_check_protocol='TCP',
            health_check_port=443,
            threshold_count=3,
            endpoint_configurations=[aws.globalaccelerator.EndpointGroupEndpointConfigurationArgs(
                endpoint_id=self.secondary_nlb.arn,
                weight=100,
                client_ip_preservation_enabled=False,
            )],
            opts=ResourceOptions(parent=self.accelerator_listener, depends_on=[self.secondary_nlb])
        )
        
        # CRITICAL FIX: Route 53 health checks using actual NLB DNS names
        self.primary_health_check = aws.route53.HealthCheck(
            f'health-check-primary-{self.environment_suffix}',
            type='HTTPS',
            resource_path='/',
            fqdn=self.primary_nlb.dns_name,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={'Name': f'health-check-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_nlb, provider=self.primary_provider)
        )
        
        self.secondary_health_check = aws.route53.HealthCheck(
            f'health-check-secondary-{self.environment_suffix}',
            type='HTTPS',
            resource_path='/',
            fqdn=self.secondary_nlb.dns_name,
            port=443,
            request_interval=30,
            failure_threshold=3,
            measure_latency=True,
            tags={'Name': f'health-check-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_nlb, provider=self.secondary_provider)
        )
    
    def _create_api_gateway(self):
        """
        Create API Gateway with custom domains.
        
        CRITICAL FIX: Previous version missing custom domain configuration.
        """
        
        # Primary API Gateway
        self.primary_api = aws.apigateway.RestApi(
            f'api-primary-{self.environment_suffix}',
            name=f'api-primary-{self.environment_suffix}',
            description='Primary region API Gateway',
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(types='REGIONAL'),
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.primary_api_resource = aws.apigateway.Resource(
            f'api-resource-primary-{self.environment_suffix}',
            rest_api=self.primary_api.id,
            parent_id=self.primary_api.root_resource_id,
            path_part='health',
            opts=ResourceOptions(parent=self.primary_api, provider=self.primary_provider)
        )
        
        self.primary_api_method = aws.apigateway.Method(
            f'api-method-primary-{self.environment_suffix}',
            rest_api=self.primary_api.id,
            resource_id=self.primary_api_resource.id,
            http_method='GET',
            authorization='NONE',
            opts=ResourceOptions(parent=self.primary_api_resource, provider=self.primary_provider)
        )
        
        self.primary_api_integration = aws.apigateway.Integration(
            f'api-integration-primary-{self.environment_suffix}',
            rest_api=self.primary_api.id,
            resource_id=self.primary_api_resource.id,
            http_method=self.primary_api_method.http_method,
            type='MOCK',
            request_templates={'application/json': '{"statusCode": 200}'},
            opts=ResourceOptions(parent=self.primary_api_method, provider=self.primary_provider)
        )
        
        # FIX: Create Deployment WITHOUT stage_name
        self.primary_api_deployment = aws.apigateway.Deployment(
            f'api-deployment-primary-{self.environment_suffix}',
            rest_api=self.primary_api.id,
            opts=ResourceOptions(
                parent=self.primary_api,
                provider=self.primary_provider,
                depends_on=[self.primary_api_integration]
            )
        )
        
        # FIX: Create Stage separately
        self.primary_api_stage = aws.apigateway.Stage(
            f'api-stage-primary-{self.environment_suffix}',
            rest_api=self.primary_api.id,
            deployment=self.primary_api_deployment.id,
            stage_name='prod',
            opts=ResourceOptions(
                parent=self.primary_api_deployment,
                provider=self.primary_provider
            )
        )
        
        # CRITICAL FIX: Custom domain for primary API
        config = Config()
        primary_cert_arn = config.get('primaryCertificateArn')
        
        if primary_cert_arn:
            self.primary_domain_name = aws.apigateway.DomainName(
                f'api-domain-primary-{self.environment_suffix}',
                domain_name=self.primary_domain,
                regional_certificate_arn=primary_cert_arn,
                endpoint_configuration=aws.apigateway.DomainNameEndpointConfigurationArgs(types='REGIONAL'),
                opts=ResourceOptions(parent=self.primary_api, provider=self.primary_provider)
            )
            
            self.primary_base_path_mapping = aws.apigateway.BasePathMapping(
                f'api-mapping-primary-{self.environment_suffix}',
                rest_api=self.primary_api.id,
                stage_name=self.primary_api_stage.stage_name,  # FIX: Use stage.stage_name
                domain_name=self.primary_domain_name.domain_name,
                opts=ResourceOptions(parent=self.primary_domain_name, provider=self.primary_provider)
            )
        
        # Secondary API Gateway
        self.secondary_api = aws.apigateway.RestApi(
            f'api-secondary-{self.environment_suffix}',
            name=f'api-secondary-{self.environment_suffix}',
            description='Secondary region API Gateway',
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(types='REGIONAL'),
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        self.secondary_api_resource = aws.apigateway.Resource(
            f'api-resource-secondary-{self.environment_suffix}',
            rest_api=self.secondary_api.id,
            parent_id=self.secondary_api.root_resource_id,
            path_part='health',
            opts=ResourceOptions(parent=self.secondary_api, provider=self.secondary_provider)
        )
        
        self.secondary_api_method = aws.apigateway.Method(
            f'api-method-secondary-{self.environment_suffix}',
            rest_api=self.secondary_api.id,
            resource_id=self.secondary_api_resource.id,
            http_method='GET',
            authorization='NONE',
            opts=ResourceOptions(parent=self.secondary_api_resource, provider=self.secondary_provider)
        )
        
        self.secondary_api_integration = aws.apigateway.Integration(
            f'api-integration-secondary-{self.environment_suffix}',
            rest_api=self.secondary_api.id,
            resource_id=self.secondary_api_resource.id,
            http_method=self.secondary_api_method.http_method,
            type='MOCK',
            request_templates={'application/json': '{"statusCode": 200}'},
            opts=ResourceOptions(parent=self.secondary_api_method, provider=self.secondary_provider)
        )
        
        # FIX: Create Deployment WITHOUT stage_name
        self.secondary_api_deployment = aws.apigateway.Deployment(
            f'api-deployment-secondary-{self.environment_suffix}',
            rest_api=self.secondary_api.id,
            opts=ResourceOptions(
                parent=self.secondary_api,
                provider=self.secondary_provider,
                depends_on=[self.secondary_api_integration]
            )
        )
        
        # FIX: Create Stage separately
        self.secondary_api_stage = aws.apigateway.Stage(
            f'api-stage-secondary-{self.environment_suffix}',
            rest_api=self.secondary_api.id,
            deployment=self.secondary_api_deployment.id,
            stage_name='prod',
            opts=ResourceOptions(
                parent=self.secondary_api_deployment,
                provider=self.secondary_provider
            )
        )
        
        # CRITICAL FIX: Custom domain for secondary API
        secondary_cert_arn = config.get('secondaryCertificateArn')
        
        if secondary_cert_arn:
            self.secondary_domain_name = aws.apigateway.DomainName(
                f'api-domain-secondary-{self.environment_suffix}',
                domain_name=self.secondary_domain,
                regional_certificate_arn=secondary_cert_arn,
                endpoint_configuration=aws.apigateway.DomainNameEndpointConfigurationArgs(types='REGIONAL'),
                opts=ResourceOptions(parent=self.secondary_api, provider=self.secondary_provider)
            )
            
            self.secondary_base_path_mapping = aws.apigateway.BasePathMapping(
                f'api-mapping-secondary-{self.environment_suffix}',
                rest_api=self.secondary_api.id,
                stage_name=self.secondary_api_stage.stage_name,  # FIX: Use stage.stage_name
                domain_name=self.secondary_domain_name.domain_name,
                opts=ResourceOptions(parent=self.secondary_domain_name, provider=self.secondary_provider)
            )
    
    def _create_parameter_store(self):
        """
        Create Parameter Store with cross-region replication.
        
        CRITICAL FIX: This entire functionality was missing from previous version.
        """
        
        # Primary region parameters
        self.primary_db_endpoint_param = aws.ssm.Parameter(
            f'param-db-endpoint-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/database/endpoint',
            type='String',
            value='placeholder-db-endpoint.us-east-1.rds.amazonaws.com',
            description='Database endpoint for application',
            tags={'Name': f'param-db-endpoint-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.primary_api_key_param = aws.ssm.Parameter(
            f'param-api-key-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/api/key',
            type='SecureString',
            value='placeholder-api-key-change-in-production',
            description='API key for external service integration',
            tags={'Name': f'param-api-key-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.primary_feature_flag_param = aws.ssm.Parameter(
            f'param-feature-flag-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/features/multi-region',
            type='String',
            value='enabled',
            description='Feature flag for multi-region mode',
            tags={'Name': f'param-feature-flag-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        # Replicate to secondary region
        self.secondary_db_endpoint_param = aws.ssm.Parameter(
            f'param-db-endpoint-secondary-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/database/endpoint',
            type='String',
            value='placeholder-db-endpoint.us-east-2.rds.amazonaws.com',
            description='Database endpoint (secondary)',
            tags={'Name': f'param-db-endpoint-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        self.secondary_api_key_param = aws.ssm.Parameter(
            f'param-api-key-secondary-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/api/key',
            type='SecureString',
            value='placeholder-api-key-change-in-production',
            description='API key (secondary)',
            tags={'Name': f'param-api-key-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        self.secondary_feature_flag_param = aws.ssm.Parameter(
            f'param-feature-flag-secondary-{self.environment_suffix}',
            name=f'/app/{self.environment_suffix}/features/multi-region',
            type='String',
            value='enabled',
            description='Feature flag (secondary)',
            tags={'Name': f'param-feature-flag-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
    
    def _create_storage(self):
        """Create S3 with cross-region replication and DynamoDB Global Tables."""
        
        # Primary S3 bucket
        self.primary_bucket = aws.s3.Bucket(
            f's3-primary-{self.environment_suffix}',
            bucket=f's3-primary-{self.environment_suffix}',
            # FIX: Remove versioning from Bucket - use separate resource instead
            tags={'Name': f's3-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        # FIX: Add separate versioning resource for primary bucket
        self.primary_bucket_versioning = aws.s3.BucketVersioning(
            f's3-versioning-primary-{self.environment_suffix}',
            bucket=self.primary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=self.primary_bucket, provider=self.primary_provider)
        )
        
        # Secondary S3 bucket
        self.secondary_bucket = aws.s3.Bucket(
            f's3-secondary-{self.environment_suffix}',
            bucket=f's3-secondary-{self.environment_suffix}',
            # FIX: Remove versioning from Bucket - use separate resource instead
            tags={'Name': f's3-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # FIX: Add separate versioning resource for secondary bucket
        self.secondary_bucket_versioning = aws.s3.BucketVersioning(
            f's3-versioning-secondary-{self.environment_suffix}',
            bucket=self.secondary_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=ResourceOptions(parent=self.secondary_bucket, provider=self.secondary_provider)
        )
        
        # S3 replication policy
        replication_policy = Output.all(
            self.primary_bucket.arn,
            self.secondary_bucket.arn
        ).apply(lambda args: json.dumps({
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Effect': 'Allow',
                    'Action': ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                    'Resource': args[0]
                },
                {
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObjectVersionForReplication',
                        's3:GetObjectVersionAcl',
                        's3:GetObjectVersionTagging'
                    ],
                    'Resource': f'{args[0]}/*'
                },
                {
                    'Effect': 'Allow',
                    'Action': ['s3:ReplicateObject', 's3:ReplicateDelete', 's3:ReplicateTags'],
                    'Resource': f'{args[1]}/*'
                }
            ]
        }))
        
        self.s3_replication_policy = aws.iam.RolePolicy(
            f'policy-s3-replication-{self.environment_suffix}',
            role=self.s3_replication_role.id,
            policy=replication_policy,
            opts=ResourceOptions(parent=self.s3_replication_role, provider=self.primary_provider)
        )
        
        # S3 replication with RTC
        self.bucket_replication = aws.s3.BucketReplicationConfig(
            f's3-replication-{self.environment_suffix}',
            bucket=self.primary_bucket.id,
            role=self.s3_replication_role.arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id=f'replication-rule-{self.environment_suffix}',
                status='Enabled',
                priority=1,
                delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                    status='Enabled'
                ),
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(prefix=''),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=self.secondary_bucket.arn,
                    storage_class='STANDARD',
                    replication_time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeArgs(
                        status='Enabled',
                        time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeTimeArgs(minutes=15),
                    ),
                    metrics=aws.s3.BucketReplicationConfigRuleDestinationMetricsArgs(
                        status='Enabled',
                        event_threshold=aws.s3.BucketReplicationConfigRuleDestinationMetricsEventThresholdArgs(
                            minutes=15
                        ),
                    ),
                ),
            )],
            opts=ResourceOptions(
                parent=self.primary_bucket,
                provider=self.primary_provider,
                depends_on=[self.s3_replication_policy]
            )
        )
        
        # DynamoDB Global Table
        self.dynamodb_table = aws.dynamodb.Table(
            f'dynamodb-global-{self.environment_suffix}',
            name=f'dynamodb-global-{self.environment_suffix}',
            billing_mode='PAY_PER_REQUEST',
            hash_key='id',
            stream_enabled=True,
            stream_view_type='NEW_AND_OLD_IMAGES',
            attributes=[aws.dynamodb.TableAttributeArgs(name='id', type='S')],
            replicas=[aws.dynamodb.TableReplicaArgs(region_name='us-east-2')],
            tags={'Name': f'dynamodb-global-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
    
    def _create_databases(self):
        """Create Aurora Global Database with backup configuration."""
        
        # Primary subnet group
        self.primary_db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-primary-{self.environment_suffix}',
            subnet_ids=[self.primary_private_subnet_1.id, self.primary_private_subnet_2.id],
            tags={'Name': f'db-subnet-group-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        # Primary DB security group
        self.primary_db_sg = aws.ec2.SecurityGroup(
            f'sg-db-primary-{self.environment_suffix}',
            name=f'db-primary-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            description='Security group for Aurora database',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol='tcp',
                from_port=3306,
                to_port=3306,
                cidr_blocks=['10.0.0.0/16', '10.1.0.0/16'],
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol='-1',
                from_port=0,
                to_port=0,
                cidr_blocks=['0.0.0.0/0'],
            )],
            tags={'Name': f'sg-db-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        # Aurora Global Cluster
        self.global_cluster = aws.rds.GlobalCluster(
            f'aurora-global-{self.environment_suffix}',
            global_cluster_identifier=f'aurora-global-{self.environment_suffix}',
            engine='aurora-mysql',
            # FIX: Use engine version that supports global databases
            # Version 8.0.mysql_aurora.3.04.0 or later supports global functionality
            engine_version='8.0.mysql_aurora.3.04.0',
            database_name='appdb',
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        # Primary cluster
        self.primary_cluster = aws.rds.Cluster(
            f'aurora-primary-{self.environment_suffix}',
            cluster_identifier=f'aurora-primary-{self.environment_suffix}',
            engine='aurora-mysql',
            # FIX: Update to match global cluster version
            engine_version='8.0.mysql_aurora.3.04.0',
            engine_mode='provisioned',
            database_name='appdb',
            master_username='admin',
            master_password='TempPassword123!',
            db_subnet_group_name=self.primary_db_subnet_group.name,
            vpc_security_group_ids=[self.primary_db_sg.id],
            global_cluster_identifier=self.global_cluster.id,
            skip_final_snapshot=True,
            deletion_protection=False,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=1.0,
            ),
            tags={'Name': f'aurora-primary-{self.environment_suffix}'},
            opts=ResourceOptions(
                parent=self.global_cluster,
                provider=self.primary_provider,
                depends_on=[self.primary_db_subnet_group]
            )
        )
        
        # Primary instance
        self.primary_cluster_instance = aws.rds.ClusterInstance(
            f'aurora-instance-primary-{self.environment_suffix}',
            identifier=f'aurora-instance-primary-{self.environment_suffix}',
            cluster_identifier=self.primary_cluster.id,
            instance_class='db.serverless',
            engine='aurora-mysql',
            # FIX: Update to match global cluster version
            engine_version='8.0.mysql_aurora.3.04.0',
            opts=ResourceOptions(parent=self.primary_cluster, provider=self.primary_provider)
        )
        
        # Secondary subnet group
        self.secondary_db_subnet_group = aws.rds.SubnetGroup(
            f'db-subnet-group-secondary-{self.environment_suffix}',
            subnet_ids=[self.secondary_private_subnet_1.id, self.secondary_private_subnet_2.id],
            tags={'Name': f'db-subnet-group-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Secondary DB security group
        self.secondary_db_sg = aws.ec2.SecurityGroup(
            f'sg-db-secondary-{self.environment_suffix}',
            name=f'db-secondary-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            description='Security group for Aurora database (secondary)',
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol='tcp',
                from_port=3306,
                to_port=3306,
                cidr_blocks=['10.0.0.0/16', '10.1.0.0/16'],
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol='-1',
                from_port=0,
                to_port=0,
                cidr_blocks=['0.0.0.0/0'],
            )],
            tags={'Name': f'sg-db-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Secondary cluster
        self.secondary_cluster = aws.rds.Cluster(
            f'aurora-secondary-{self.environment_suffix}',
            cluster_identifier=f'aurora-secondary-{self.environment_suffix}',
            engine='aurora-mysql',
            # FIX: Update to match global cluster version
            engine_version='8.0.mysql_aurora.3.04.0',
            engine_mode='provisioned',
            db_subnet_group_name=self.secondary_db_subnet_group.name,
            vpc_security_group_ids=[self.secondary_db_sg.id],
            global_cluster_identifier=self.global_cluster.id,
            skip_final_snapshot=True,
            deletion_protection=False,
            serverlessv2_scaling_configuration=aws.rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=1.0,
            ),
            tags={'Name': f'aurora-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(
                parent=self.global_cluster,
                provider=self.secondary_provider,
                depends_on=[self.primary_cluster, self.secondary_db_subnet_group]
            )
        )
        
        # Secondary instance
        self.secondary_cluster_instance = aws.rds.ClusterInstance(
            f'aurora-instance-secondary-{self.environment_suffix}',
            identifier=f'aurora-instance-secondary-{self.environment_suffix}',
            cluster_identifier=self.secondary_cluster.id,
            instance_class='db.serverless',
            engine='aurora-mysql',
            # FIX: Update to match global cluster version
            engine_version='8.0.mysql_aurora.3.04.0',
            opts=ResourceOptions(parent=self.secondary_cluster, provider=self.secondary_provider)
        )
        
        # Backup vaults
        self.backup_vault_primary = aws.backup.Vault(
            f'backup-vault-primary-{self.environment_suffix}',
            name=f'backup-vault-primary-{self.environment_suffix}',
            tags={'Name': f'backup-vault-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.backup_vault_secondary = aws.backup.Vault(
            f'backup-vault-secondary-{self.environment_suffix}',
            name=f'backup-vault-secondary-{self.environment_suffix}',
            tags={'Name': f'backup-vault-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # Backup role
        backup_assume_role_policy = aws.iam.get_policy_document(
            statements=[aws.iam.GetPolicyDocumentStatementArgs(
                effect='Allow',
                principals=[aws.iam.GetPolicyDocumentStatementPrincipalArgs(
                    type='Service',
                    identifiers=['backup.amazonaws.com'],
                )],
                actions=['sts:AssumeRole'],
            )]
        )
        
        self.backup_role = aws.iam.Role(
            f'role-backup-{self.environment_suffix}',
            assume_role_policy=backup_assume_role_policy.json,
            tags={'Name': f'role-backup-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        
        aws.iam.RolePolicyAttachment(
            f'backup-policy-{self.environment_suffix}',
            role=self.backup_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
            opts=ResourceOptions(parent=self.backup_role)
        )
        
        aws.iam.RolePolicyAttachment(
            f'backup-restore-policy-{self.environment_suffix}',
            role=self.backup_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
            opts=ResourceOptions(parent=self.backup_role)
        )
        
        # Backup plan
        self.backup_plan = aws.backup.Plan(
            f'backup-plan-{self.environment_suffix}',
            name=f'backup-plan-{self.environment_suffix}',
            rules=[aws.backup.PlanRuleArgs(
                rule_name='daily-backup',
                target_vault_name=self.backup_vault_primary.name,
                schedule='cron(0 5 ? * * *)',
                lifecycle=aws.backup.PlanRuleLifecycleArgs(delete_after=7),
                copy_actions=[aws.backup.PlanRuleCopyActionArgs(
                    destination_vault_arn=self.backup_vault_secondary.arn,
                    lifecycle=aws.backup.PlanRuleCopyActionLifecycleArgs(delete_after=7),
                )],
            )],
            tags={'Name': f'backup-plan-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.backup_vault_primary, provider=self.primary_provider)
        )
        
        # Backup selection
        self.backup_selection = aws.backup.Selection(
            f'backup-selection-{self.environment_suffix}',
            name=f'backup-selection-{self.environment_suffix}',
            plan_id=self.backup_plan.id,
            iam_role_arn=self.backup_role.arn,
            resources=[self.primary_cluster.arn],
            opts=ResourceOptions(parent=self.backup_plan, provider=self.primary_provider)
        )
    
    def _create_compute(self):
        """Create Lambda functions and EventBridge in both regions."""
        
        # Primary Lambda security group
        self.primary_lambda_sg = aws.ec2.SecurityGroup(
            f'sg-lambda-primary-{self.environment_suffix}',
            name=f'lambda-primary-{self.environment_suffix}',
            vpc_id=self.primary_vpc.id,
            description='Security group for Lambda functions',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol='-1',
                from_port=0,
                to_port=0,
                cidr_blocks=['0.0.0.0/0'],
            )],
            tags={'Name': f'sg-lambda-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.primary_vpc, provider=self.primary_provider)
        )
        
        # Primary Lambda
        self.primary_lambda = aws.lambda_.Function(
            f'lambda-primary-{self.environment_suffix}',
            name=f'lambda-primary-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.handler',
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset('''
import json

def handler(event, context):
    print(f"Event received: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processed in primary region', 'region': 'us-east-1'})
    }
''')
            }),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[self.primary_private_subnet_1.id, self.primary_private_subnet_2.id],
                security_group_ids=[self.primary_lambda_sg.id],
            ),
            timeout=30,
            memory_size=256,
            tags={'Name': f'lambda-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        # Secondary Lambda security group
        self.secondary_lambda_sg = aws.ec2.SecurityGroup(
            f'sg-lambda-secondary-{self.environment_suffix}',
            name=f'lambda-secondary-{self.environment_suffix}',
            vpc_id=self.secondary_vpc.id,
            description='Security group for Lambda functions (secondary)',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol='-1',
                from_port=0,
                to_port=0,
                cidr_blocks=['0.0.0.0/0'],
            )],
            tags={'Name': f'sg-lambda-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.secondary_vpc, provider=self.secondary_provider)
        )
        
        # Secondary Lambda
        self.secondary_lambda = aws.lambda_.Function(
            f'lambda-secondary-{self.environment_suffix}',
            name=f'lambda-secondary-{self.environment_suffix}',
            runtime='python3.11',
            handler='index.handler',
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                'index.py': pulumi.StringAsset('''
import json

def handler(event, context):
    print(f"Event received: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Processed in secondary region', 'region': 'us-east-2'})
    }
''')
            }),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[self.secondary_private_subnet_1.id, self.secondary_private_subnet_2.id],
                security_group_ids=[self.secondary_lambda_sg.id],
            ),
            timeout=30,
            memory_size=256,
            tags={'Name': f'lambda-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # EventBridge rules
        self.primary_event_rule = aws.cloudwatch.EventRule(
            f'event-rule-primary-{self.environment_suffix}',
            name=f'event-rule-primary-{self.environment_suffix}',
            description='Process application events in primary region',
            event_pattern=json.dumps({'source': ['custom.application'], 'detail-type': ['Application Event']}),
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.primary_event_target = aws.cloudwatch.EventTarget(
            f'event-target-primary-{self.environment_suffix}',
            rule=self.primary_event_rule.name,
            arn=self.primary_lambda.arn,
            opts=ResourceOptions(parent=self.primary_event_rule, provider=self.primary_provider)
        )
        
        self.primary_lambda_permission = aws.lambda_.Permission(
            f'lambda-permission-primary-{self.environment_suffix}',
            action='lambda:InvokeFunction',
            function=self.primary_lambda.name,
            principal='events.amazonaws.com',
            source_arn=self.primary_event_rule.arn,
            opts=ResourceOptions(parent=self.primary_lambda, provider=self.primary_provider)
        )
        
        self.secondary_event_rule = aws.cloudwatch.EventRule(
            f'event-rule-secondary-{self.environment_suffix}',
            name=f'event-rule-secondary-{self.environment_suffix}',
            description='Process application events in secondary region',
            event_pattern=json.dumps({'source': ['custom.application'], 'detail-type': ['Application Event']}),
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        self.secondary_event_target = aws.cloudwatch.EventTarget(
            f'event-target-secondary-{self.environment_suffix}',
            rule=self.secondary_event_rule.name,
            arn=self.secondary_lambda.arn,
            opts=ResourceOptions(parent=self.secondary_event_rule, provider=self.secondary_provider)
        )
        
        self.secondary_lambda_permission = aws.lambda_.Permission(
            f'lambda-permission-secondary-{self.environment_suffix}',
            action='lambda:InvokeFunction',
            function=self.secondary_lambda.name,
            principal='events.amazonaws.com',
            source_arn=self.secondary_event_rule.arn,
            opts=ResourceOptions(parent=self.secondary_lambda, provider=self.secondary_provider)
        )
        
        # Event buses for Global Endpoints
        self.event_bus_primary = aws.cloudwatch.EventBus(
            f'event-bus-primary-{self.environment_suffix}',
            name=f'event-bus-primary-{self.environment_suffix}',
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.event_bus_secondary = aws.cloudwatch.EventBus(
            f'event-bus-secondary-{self.environment_suffix}',
            name=f'event-bus-secondary-{self.environment_suffix}',
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
    
    def _create_monitoring(self):
        """Create CloudWatch dashboards and SNS topics."""
        
        # SNS topics
        self.primary_sns_topic = aws.sns.Topic(
            f'sns-alerts-primary-{self.environment_suffix}',
            name=f'sns-alerts-primary-{self.environment_suffix}',
            display_name='Primary Region Alerts',
            tags={'Name': f'sns-alerts-primary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        self.secondary_sns_topic = aws.sns.Topic(
            f'sns-alerts-secondary-{self.environment_suffix}',
            name=f'sns-alerts-secondary-{self.environment_suffix}',
            display_name='Secondary Region Alerts',
            tags={'Name': f'sns-alerts-secondary-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # CloudWatch dashboards
        primary_dashboard_body = json.dumps({
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum', 'label': 'Lambda Invocations'}],
                            ['.', 'Errors', {'stat': 'Sum', 'label': 'Lambda Errors'}],
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': 'us-east-1',
                        'title': 'Lambda Metrics',
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/ApiGateway', 'Count', {'stat': 'Sum', 'label': 'API Requests'}],
                            ['.', '5XXError', {'stat': 'Sum', 'label': 'API Errors'}],
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': 'us-east-1',
                        'title': 'API Gateway Metrics',
                    }
                },
            ]
        })
        
        self.primary_dashboard = aws.cloudwatch.Dashboard(
            f'dashboard-primary-{self.environment_suffix}',
            dashboard_name=f'dashboard-primary-{self.environment_suffix}',
            dashboard_body=primary_dashboard_body,
            opts=ResourceOptions(parent=self, provider=self.primary_provider)
        )
        
        secondary_dashboard_body = json.dumps({
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum', 'label': 'Lambda Invocations'}],
                            ['.', 'Errors', {'stat': 'Sum', 'label': 'Lambda Errors'}],
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': 'us-east-2',
                        'title': 'Lambda Metrics',
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/ApiGateway', 'Count', {'stat': 'Sum', 'label': 'API Requests'}],
                            ['.', '5XXError', {'stat': 'Sum', 'label': 'API Errors'}],
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': 'us-east-2',
                        'title': 'API Gateway Metrics',
                    }
                },
            ]
        })
        
        self.secondary_dashboard = aws.cloudwatch.Dashboard(
            f'dashboard-secondary-{self.environment_suffix}',
            dashboard_name=f'dashboard-secondary-{self.environment_suffix}',
            dashboard_body=secondary_dashboard_body,
            opts=ResourceOptions(parent=self, provider=self.secondary_provider)
        )
        
        # CloudWatch alarms
        self.primary_health_alarm = aws.cloudwatch.MetricAlarm(
            f'alarm-health-primary-{self.environment_suffix}',
            name=f'alarm-health-primary-{self.environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=2,
            metric_name='HealthCheckStatus',
            namespace='AWS/Route53',
            period=60,
            statistic='Minimum',
            threshold=1.0,
            alarm_description='Alert when primary region health check fails',
            alarm_actions=[self.primary_sns_topic.arn],
            dimensions={'HealthCheckId': self.primary_health_check.id},
            opts=ResourceOptions(parent=self.primary_health_check, provider=self.primary_provider)
        )
        
        self.secondary_health_alarm = aws.cloudwatch.MetricAlarm(
            f'alarm-health-secondary-{self.environment_suffix}',
            name=f'alarm-health-secondary-{self.environment_suffix}',
            comparison_operator='LessThanThreshold',
            evaluation_periods=2,
            metric_name='HealthCheckStatus',
            namespace='AWS/Route53',
            period=60,
            statistic='Minimum',
            threshold=1.0,
            alarm_description='Alert when secondary region health check fails',
            alarm_actions=[self.secondary_sns_topic.arn],
            dimensions={'HealthCheckId': self.secondary_health_check.id},
            opts=ResourceOptions(parent=self.secondary_health_check, provider=self.secondary_provider)
        )
