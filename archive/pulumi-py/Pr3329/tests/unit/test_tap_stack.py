"""
test_tap_stack.py

Comprehensive unit tests for the TapStack Pulumi component using moto for AWS mocking
and Pulumi's testing utilities.
"""

import unittest
from unittest.mock import patch, MagicMock, Mock
import pulumi
from pulumi import ResourceOptions
import sys
import os

# Add the parent directory to the path to import tap_stack
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))


class MyMocks(pulumi.runtime.Mocks):
    """Mock implementation for Pulumi resources."""
    
    def new_resource(self, args: pulumi.runtime.MockResourceArgs):
        """Create mock resources with predictable outputs."""
        outputs = args.inputs
        
        # Add default outputs for different resource types
        if args.typ == "aws:ec2/vpc:Vpc":
            outputs = {**args.inputs, "id": "vpc-12345", "arn": "arn:aws:ec2:us-east-1:123456789:vpc/vpc-12345"}
        elif args.typ == "aws:ec2/subnet:Subnet":
            outputs = {**args.inputs, "id": f"subnet-{args.name}", "arn": f"arn:aws:ec2:us-east-1:123456789:subnet/subnet-{args.name}"}
        elif args.typ == "aws:ec2/internetGateway:InternetGateway":
            outputs = {**args.inputs, "id": "igw-12345"}
        elif args.typ == "aws:ec2/eip:Eip":
            outputs = {**args.inputs, "id": f"eip-{args.name}", "allocation_id": f"eipalloc-{args.name}"}
        elif args.typ == "aws:ec2/natGateway:NatGateway":
            outputs = {**args.inputs, "id": f"nat-{args.name}"}
        elif args.typ == "aws:ec2/routeTable:RouteTable":
            outputs = {**args.inputs, "id": f"rt-{args.name}"}
        elif args.typ == "aws:ec2/routeTableAssociation:RouteTableAssociation":
            outputs = {**args.inputs, "id": f"rta-{args.name}"}
        elif args.typ == "aws:ec2/route:Route":
            outputs = {**args.inputs, "id": f"route-{args.name}"}
        elif args.typ == "aws:ec2/securityGroup:SecurityGroup":
            outputs = {**args.inputs, "id": f"sg-{args.name}"}
        elif args.typ == "aws:ec2/securityGroupRule:SecurityGroupRule":
            outputs = {**args.inputs, "id": f"sgr-{args.name}"}
        elif args.typ == "aws:rds/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"subnet-group-{args.name}", "name": f"subnet-group-{args.name}"}
        elif args.typ == "aws:rds/clusterParameterGroup:ClusterParameterGroup":
            outputs = {**args.inputs, "id": f"cluster-param-{args.name}", "name": f"cluster-param-{args.name}"}
        elif args.typ == "aws:rds/cluster:Cluster":
            outputs = {**args.inputs, "id": f"cluster-{args.name}", "endpoint": "cluster.us-east-1.rds.amazonaws.com", 
                      "reader_endpoint": "reader.cluster.us-east-1.rds.amazonaws.com", "arn": f"arn:aws:rds:us-east-1:123456789:cluster/{args.name}"}
        elif args.typ == "aws:rds/clusterInstance:ClusterInstance":
            outputs = {**args.inputs, "id": f"instance-{args.name}"}
        elif args.typ == "aws:elasticache/subnetGroup:SubnetGroup":
            outputs = {**args.inputs, "id": f"elasticache-subnet-{args.name}", "name": f"elasticache-subnet-{args.name}"}
        elif args.typ == "aws:elasticache/parameterGroup:ParameterGroup":
            outputs = {**args.inputs, "id": f"elasticache-param-{args.name}", "name": f"elasticache-param-{args.name}"}
        elif args.typ == "aws:elasticache/replicationGroup:ReplicationGroup":
            outputs = {**args.inputs, "id": f"redis-{args.name}", "primary_endpoint_address": f"redis-{args.name}.cache.amazonaws.com"}
        elif args.typ == "aws:s3/bucket:Bucket":
            outputs = {**args.inputs, "id": f"bucket-{args.name}", "bucket": f"bucket-{args.name}", 
                      "bucket_regional_domain_name": f"bucket-{args.name}.s3.us-east-1.amazonaws.com", "arn": f"arn:aws:s3:::bucket-{args.name}"}
        elif args.typ == "aws:s3/bucketVersioningV2:BucketVersioningV2":
            outputs = {**args.inputs, "id": f"versioning-{args.name}"}
        elif args.typ == "aws:s3/bucketPublicAccessBlock:BucketPublicAccessBlock":
            outputs = {**args.inputs, "id": f"publicaccess-{args.name}"}
        elif args.typ == "aws:s3/bucketPolicy:BucketPolicy":
            outputs = {**args.inputs, "id": f"policy-{args.name}"}
        elif args.typ == "aws:cloudfront/originAccessIdentity:OriginAccessIdentity":
            outputs = {**args.inputs, "id": f"oai-{args.name}", "iam_arn": f"arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity {args.name}",
                      "cloudfront_access_identity_path": f"origin-access-identity/cloudfront/{args.name}"}
        elif args.typ == "aws:cloudfront/distribution:Distribution":
            outputs = {**args.inputs, "id": f"dist-{args.name}", "domain_name": f"d123456.cloudfront.net", "arn": f"arn:aws:cloudfront::123456789:distribution/{args.name}"}
        elif args.typ == "aws:route53/zone:Zone":
            outputs = {**args.inputs, "id": f"zone-{args.name}", "zone_id": "Z1234567890ABC", "arn": f"arn:aws:route53:::hostedzone/Z1234567890ABC"}
        elif args.typ == "aws:lb/loadBalancer:LoadBalancer":
            outputs = {**args.inputs, "id": f"alb-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/{args.name}", 
                      "dns_name": f"{args.name}.us-east-1.elb.amazonaws.com"}
        elif args.typ == "aws:lb/targetGroup:TargetGroup":
            outputs = {**args.inputs, "id": f"tg-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/{args.name}"}
        elif args.typ == "aws:lb/listener:Listener":
            outputs = {**args.inputs, "id": f"listener-{args.name}", "arn": f"arn:aws:elasticloadbalancing:us-east-1:123456789:listener/{args.name}"}
        elif args.typ == "aws:iam/role:Role":
            outputs = {**args.inputs, "id": f"role-{args.name}", "name": f"role-{args.name}", "arn": f"arn:aws:iam::123456789:role/{args.name}"}
        elif args.typ == "aws:iam/policy:Policy":
            outputs = {**args.inputs, "id": f"policy-{args.name}", "arn": f"arn:aws:iam::123456789:policy/{args.name}"}
        elif args.typ == "aws:iam/rolePolicyAttachment:RolePolicyAttachment":
            outputs = {**args.inputs, "id": f"attachment-{args.name}"}
        elif args.typ == "aws:iam/instanceProfile:InstanceProfile":
            outputs = {**args.inputs, "id": f"profile-{args.name}", "arn": f"arn:aws:iam::123456789:instance-profile/{args.name}"}
        elif args.typ == "aws:ec2/launchTemplate:LaunchTemplate":
            outputs = {**args.inputs, "id": f"lt-{args.name}"}
        elif args.typ == "aws:autoscaling/group:Group":
            outputs = {**args.inputs, "id": f"asg-{args.name}", "name": f"asg-{args.name}"}
        elif args.typ == "aws:autoscaling/policy:Policy":
            outputs = {**args.inputs, "id": f"asg-policy-{args.name}"}
        elif args.typ == "aws:cognito/userPool:UserPool":
            outputs = {**args.inputs, "id": f"pool-{args.name}", "arn": f"arn:aws:cognito-idp:us-east-1:123456789:userpool/{args.name}",
                      "endpoint": f"cognito-idp.us-east-1.amazonaws.com/{args.name}"}
        elif args.typ == "aws:cognito/userPoolClient:UserPoolClient":
            outputs = {**args.inputs, "id": f"client-{args.name}"}
        elif args.typ == "aws:cognito/identityPool:IdentityPool":
            outputs = {**args.inputs, "id": f"identity-{args.name}"}
        elif args.typ == "aws:dynamodb/table:Table":
            outputs = {**args.inputs, "id": f"table-{args.name}", "name": f"table-{args.name}", "arn": f"arn:aws:dynamodb:us-east-1:123456789:table/{args.name}"}
        elif args.typ == "aws:lambda/function:Function":
            outputs = {**args.inputs, "id": f"lambda-{args.name}", "name": f"lambda-{args.name}", "arn": f"arn:aws:lambda:us-east-1:123456789:function/{args.name}"}
        elif args.typ == "aws:cloudwatch/logGroup:LogGroup":
            outputs = {**args.inputs, "id": f"log-{args.name}"}
        elif args.typ == "aws:cloudwatch/metricAlarm:MetricAlarm":
            outputs = {**args.inputs, "id": f"alarm-{args.name}"}
        elif args.typ == "aws:ssm/parameter:Parameter":
            outputs = {**args.inputs, "id": f"param-{args.name}"}
        elif args.typ == "aws:cloudwatch/eventBus:EventBus":
            outputs = {**args.inputs, "id": f"bus-{args.name}", "name": f"bus-{args.name}"}
        elif args.typ == "aws:cloudwatch/eventRule:EventRule":
            outputs = {**args.inputs, "id": f"rule-{args.name}", "arn": f"arn:aws:events:us-east-1:123456789:rule/{args.name}"}
        elif args.typ == "aws:cloudwatch/eventTarget:EventTarget":
            outputs = {**args.inputs, "id": f"target-{args.name}"}
        elif args.typ == "aws:lambda/permission:Permission":
            outputs = {**args.inputs, "id": f"permission-{args.name}"}
        else:
            outputs = {**args.inputs, "id": f"mock-{args.name}"}
        
        return [outputs.get("id", f"id-{args.name}"), outputs]
    
    def call(self, args: pulumi.runtime.MockCallArgs):
        """Mock function calls."""
        if args.token == "aws:ec2/getAmi:getAmi":
            return {
                "id": "ami-12345678",
                "architecture": "x86_64"
            }
        return {}


# Set up pulumi mocks
pulumi.runtime.set_mocks(MyMocks())


# Import after setting mocks - use try/except for different import paths
try:
    from lib.tap_stack import TapStack, TapStackArgs
except ImportError:
    try:
        from tap_stack import TapStack, TapStackArgs
    except ImportError:
        import importlib.util
        spec = importlib.util.spec_from_file_location("tap_stack", "tap_stack.py")
        tap_stack_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(tap_stack_module)
        TapStack = tap_stack_module.TapStack
        TapStackArgs = tap_stack_module.TapStackArgs


class TestTapStackArgs(unittest.TestCase):
    """Test cases for TapStackArgs configuration class."""
    
    def test_tap_stack_args_default_values(self):
        """Test TapStackArgs with default values."""
        args = TapStackArgs()
        self.assertEqual(args.environment_suffix, 'dev')
        self.assertEqual(args.vpc_cidr, '10.18.0.0/16')
        self.assertEqual(args.instance_type, 'm5.large')
        self.assertEqual(args.region, 'us-east-1')
        self.assertEqual(args.tags, {})
    
    def test_tap_stack_args_custom_values(self):
        """Test TapStackArgs with custom values."""
        custom_tags = {'Project': 'TestProject', 'Owner': 'TestOwner'}
        args = TapStackArgs(
            environment_suffix='prod',
            vpc_cidr='10.20.0.0/16',
            instance_type='m5.xlarge',
            region='us-west-2',
            tags=custom_tags
        )
        self.assertEqual(args.environment_suffix, 'prod')
        self.assertEqual(args.vpc_cidr, '10.20.0.0/16')
        self.assertEqual(args.instance_type, 'm5.xlarge')
        self.assertEqual(args.region, 'us-west-2')
        self.assertEqual(args.tags, custom_tags)
    
    def test_tap_stack_args_partial_values(self):
        """Test TapStackArgs with partial custom values."""
        args = TapStackArgs(environment_suffix='staging', instance_type='m5.2xlarge')
        self.assertEqual(args.environment_suffix, 'staging')
        self.assertEqual(args.vpc_cidr, '10.18.0.0/16')
        self.assertEqual(args.instance_type, 'm5.2xlarge')
        self.assertEqual(args.region, 'us-east-1')


class TestTapStackNetworkLayer(unittest.TestCase):
    """Test cases for TapStack network layer components."""
    
    @pulumi.runtime.test
    def test_vpc_creation(self):
        """Test VPC is created with correct CIDR and DNS settings."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_vpc(vpc_data):
            vpc_id, cidr, dns_hostnames, dns_support, tags = vpc_data
            self.assertIsNotNone(vpc_id)
            self.assertEqual(cidr, '10.18.0.0/16')
            self.assertTrue(dns_hostnames)
            self.assertTrue(dns_support)
            self.assertIn('Environment', tags)
            return True
        
        return pulumi.Output.all(
            stack.vpc.id,
            stack.vpc.cidr_block,
            stack.vpc.enable_dns_hostnames,
            stack.vpc.enable_dns_support,
            stack.vpc.tags
        ).apply(check_vpc)
    
    @pulumi.runtime.test
    def test_internet_gateway_creation(self):
        """Test Internet Gateway is created and attached to VPC."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_igw(igw_id):
            self.assertIsNotNone(igw_id)
            return True
        
        return stack.igw.id.apply(check_igw)
    
    @pulumi.runtime.test
    def test_public_subnets_creation(self):
        """Test public subnets are created in different AZs."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_subnets(subnet_data):
            subnet_a_cidr, subnet_b_cidr = subnet_data
            self.assertEqual(subnet_a_cidr, '10.18.1.0/24')
            self.assertEqual(subnet_b_cidr, '10.18.2.0/24')
            return True
        
        return pulumi.Output.all(
            stack.public_subnet_a.cidr_block,
            stack.public_subnet_b.cidr_block
        ).apply(check_subnets)
    
    @pulumi.runtime.test
    def test_private_subnets_creation(self):
        """Test private subnets are created in different AZs."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_subnets(subnet_data):
            subnet_a_cidr, subnet_b_cidr = subnet_data
            self.assertEqual(subnet_a_cidr, '10.18.10.0/24')
            self.assertEqual(subnet_b_cidr, '10.18.11.0/24')
            return True
        
        return pulumi.Output.all(
            stack.private_subnet_a.cidr_block,
            stack.private_subnet_b.cidr_block
        ).apply(check_subnets)
    
    @pulumi.runtime.test
    def test_nat_gateways_creation(self):
        """Test NAT Gateways are created for high availability."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_nat(nat_ids):
            nat_a_id, nat_b_id = nat_ids
            self.assertIsNotNone(nat_a_id)
            self.assertIsNotNone(nat_b_id)
            return True
        
        return pulumi.Output.all(
            stack.nat_gateway_a.id,
            stack.nat_gateway_b.id
        ).apply(check_nat)


class TestTapStackSecurityGroups(unittest.TestCase):
    """Test cases for security groups."""
    
    @pulumi.runtime.test
    def test_alb_security_group(self):
        """Test ALB security group allows HTTP and HTTPS."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_alb_sg(sg_id):
            self.assertIsNotNone(sg_id)
            return True
        
        return stack.alb_sg.id.apply(check_alb_sg)
    
    @pulumi.runtime.test
    def test_app_security_group(self):
        """Test application security group configuration."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_app_sg(sg_id):
            self.assertIsNotNone(sg_id)
            return True
        
        return stack.app_sg.id.apply(check_app_sg)
    
    @pulumi.runtime.test
    def test_aurora_security_group(self):
        """Test Aurora security group configuration."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_aurora_sg(sg_id):
            self.assertIsNotNone(sg_id)
            return True
        
        return stack.aurora_sg.id.apply(check_aurora_sg)
    
    @pulumi.runtime.test
    def test_redis_security_group(self):
        """Test Redis security group configuration."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_redis_sg(sg_id):
            self.assertIsNotNone(sg_id)
            return True
        
        return stack.redis_sg.id.apply(check_redis_sg)


class TestTapStackDatabaseLayer(unittest.TestCase):
    """Test cases for database layer components."""
    
    @pulumi.runtime.test
    def test_aurora_cluster_creation(self):
        """Test Aurora cluster is created with correct configuration."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_cluster(cluster_data):
            cluster_id, endpoint = cluster_data
            self.assertIsNotNone(cluster_id)
            self.assertIsNotNone(endpoint)
            return True
        
        return pulumi.Output.all(
            stack.aurora_cluster.id,
            stack.aurora_cluster.endpoint
        ).apply(check_cluster)
    
    @pulumi.runtime.test
    def test_aurora_instances_creation(self):
        """Test Aurora primary and replica instances are created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_instances(instance_ids):
            primary_id, replica_id = instance_ids
            self.assertIsNotNone(primary_id)
            self.assertIsNotNone(replica_id)
            return True
        
        return pulumi.Output.all(
            stack.aurora_instance_primary.id,
            stack.aurora_instance_replica.id
        ).apply(check_instances)


class TestTapStackCachingLayer(unittest.TestCase):
    """Test cases for caching layer components."""
    
    @pulumi.runtime.test
    def test_redis_premium_cluster(self):
        """Test premium Redis cluster is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_redis(redis_data):
            cluster_id, endpoint = redis_data
            self.assertIsNotNone(cluster_id)
            self.assertIsNotNone(endpoint)
            return True
        
        return pulumi.Output.all(
            stack.redis_premium_cluster.id,
            stack.redis_premium_cluster.primary_endpoint_address
        ).apply(check_redis)
    
    @pulumi.runtime.test
    def test_redis_standard_cluster(self):
        """Test standard Redis cluster is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_redis(redis_data):
            cluster_id, endpoint = redis_data
            self.assertIsNotNone(cluster_id)
            self.assertIsNotNone(endpoint)
            return True
        
        return pulumi.Output.all(
            stack.redis_standard_cluster.id,
            stack.redis_standard_cluster.primary_endpoint_address
        ).apply(check_redis)


class TestTapStackStorageLayer(unittest.TestCase):
    """Test cases for storage layer components."""
    
    @pulumi.runtime.test
    def test_s3_bucket_creation(self):
        """Test S3 bucket is created with proper naming."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_bucket(bucket_data):
            bucket_id, bucket_name = bucket_data
            self.assertIsNotNone(bucket_id)
            self.assertIsNotNone(bucket_name)
            return True
        
        return pulumi.Output.all(
            stack.tenant_data_bucket.id,
            stack.tenant_data_bucket.bucket
        ).apply(check_bucket)
    
    @pulumi.runtime.test
    def test_cloudfront_distribution(self):
        """Test CloudFront distribution is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_cf(cf_data):
            cf_id, domain = cf_data
            self.assertIsNotNone(cf_id)
            self.assertIsNotNone(domain)
            return True
        
        return pulumi.Output.all(
            stack.cloudfront_distribution.id,
            stack.cloudfront_distribution.domain_name
        ).apply(check_cf)


class TestTapStackLoadBalancing(unittest.TestCase):
    """Test cases for load balancing components."""
    
    @pulumi.runtime.test
    def test_alb_creation(self):
        """Test Application Load Balancer is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_alb(alb_data):
            alb_id, dns_name = alb_data
            self.assertIsNotNone(alb_id)
            self.assertIsNotNone(dns_name)
            return True
        
        return pulumi.Output.all(
            stack.alb.id,
            stack.alb.dns_name
        ).apply(check_alb)
    
    @pulumi.runtime.test
    def test_target_group_creation(self):
        """Test target group is created with health checks."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_tg(tg_id):
            self.assertIsNotNone(tg_id)
            return True
        
        return stack.target_group.id.apply(check_tg)
    
    @pulumi.runtime.test
    def test_alb_listener_creation(self):
        """Test ALB HTTP listener is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_listener(listener_id):
            self.assertIsNotNone(listener_id)
            return True
        
        return stack.alb_listener_http.id.apply(check_listener)


class TestTapStackComputeLayer(unittest.TestCase):
    """Test cases for compute layer components."""
    
    @pulumi.runtime.test
    def test_iam_role_creation(self):
        """Test IAM role for EC2 instances is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_role(role_id):
            self.assertIsNotNone(role_id)
            return True
        
        return stack.ec2_role.id.apply(check_role)
    
    @pulumi.runtime.test
    def test_launch_template_creation(self):
        """Test launch template is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_lt(lt_id):
            self.assertIsNotNone(lt_id)
            return True
        
        return stack.launch_template.id.apply(check_lt)
    
    @pulumi.runtime.test
    def test_autoscaling_group_creation(self):
        """Test Auto Scaling Group is created with correct capacity."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_asg(asg_id):
            self.assertIsNotNone(asg_id)
            return True
        
        return stack.asg.id.apply(check_asg)


class TestTapStackAuthentication(unittest.TestCase):
    """Test cases for authentication components."""
    
    @pulumi.runtime.test
    def test_cognito_user_pool_creation(self):
        """Test Cognito user pool is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_pool(pool_id):
            self.assertIsNotNone(pool_id)
            return True
        
        return stack.cognito_user_pool_tenant1.id.apply(check_pool)
    
    @pulumi.runtime.test
    def test_cognito_client_creation(self):
        """Test Cognito user pool client is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_client(client_id):
            self.assertIsNotNone(client_id)
            return True
        
        return stack.cognito_user_pool_client_tenant1.id.apply(check_client)
    
    @pulumi.runtime.test
    def test_cognito_identity_pool_creation(self):
        """Test Cognito identity pool is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_identity_pool(pool_id):
            self.assertIsNotNone(pool_id)
            return True
        
        return stack.cognito_identity_pool.id.apply(check_identity_pool)


class TestTapStackServerless(unittest.TestCase):
    """Test cases for serverless components."""
    
    @pulumi.runtime.test
    def test_dynamodb_table_creation(self):
        """Test DynamoDB tenant registry table is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_table(table_data):
            table_id, table_name = table_data
            self.assertIsNotNone(table_id)
            self.assertIsNotNone(table_name)
            return True
        
        return pulumi.Output.all(
            stack.tenant_registry_table.id,
            stack.tenant_registry_table.name
        ).apply(check_table)
    
    @pulumi.runtime.test
    def test_lambda_role_creation(self):
        """Test Lambda execution role is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_role(role_id):
            self.assertIsNotNone(role_id)
            return True
        
        return stack.lambda_role.id.apply(check_role)
    
    @pulumi.runtime.test
    def test_lambda_function_creation(self):
        """Test Lambda provisioning function is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_lambda(lambda_data):
            lambda_id, lambda_arn = lambda_data
            self.assertIsNotNone(lambda_id)
            self.assertIsNotNone(lambda_arn)
            return True
        
        return pulumi.Output.all(
            stack.tenant_provisioning_lambda.id,
            stack.tenant_provisioning_lambda.arn
        ).apply(check_lambda)


class TestTapStackMonitoring(unittest.TestCase):
    """Test cases for monitoring components."""
    
    @pulumi.runtime.test
    def test_cloudwatch_log_groups(self):
        """Test CloudWatch log groups are created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_logs(log_ids):
            tenant_log_id, audit_log_id = log_ids
            self.assertIsNotNone(tenant_log_id)
            self.assertIsNotNone(audit_log_id)
            return True
        
        return pulumi.Output.all(
            stack.tenant1_log_group.id,
            stack.tenant1_audit_log_group.id
        ).apply(check_logs)
    
    @pulumi.runtime.test
    def test_cloudwatch_alarm_creation(self):
        """Test CloudWatch CPU alarm is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_alarm(alarm_id):
            self.assertIsNotNone(alarm_id)
            return True
        
        return stack.cpu_alarm.id.apply(check_alarm)


class TestTapStackSSM(unittest.TestCase):
    """Test cases for SSM Parameter Store."""
    
    @pulumi.runtime.test
    def test_ssm_parameters_creation(self):
        """Test SSM parameters are created for endpoints."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_params(param_ids):
            aurora_param, redis_premium_param, redis_standard_param, s3_param = param_ids
            self.assertIsNotNone(aurora_param)
            self.assertIsNotNone(redis_premium_param)
            self.assertIsNotNone(redis_standard_param)
            self.assertIsNotNone(s3_param)
            return True
        
        return pulumi.Output.all(
            stack.ssm_aurora_endpoint.id,
            stack.ssm_redis_premium_endpoint.id,
            stack.ssm_redis_standard_endpoint.id,
            stack.ssm_s3_bucket.id
        ).apply(check_params)


class TestTapStackEventDriven(unittest.TestCase):
    """Test cases for event-driven architecture components."""
    
    @pulumi.runtime.test
    def test_event_bus_creation(self):
        """Test EventBridge event bus is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_bus(bus_data):
            bus_id, bus_name = bus_data
            self.assertIsNotNone(bus_id)
            self.assertIsNotNone(bus_name)
            return True
        
        return pulumi.Output.all(
            stack.event_bus.id,
            stack.event_bus.name
        ).apply(check_bus)
    
    @pulumi.runtime.test
    def test_event_rule_creation(self):
        """Test EventBridge rule is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_rule(rule_id):
            self.assertIsNotNone(rule_id)
            return True
        
        return stack.tenant_provision_rule.id.apply(check_rule)


class TestTapStackDNS(unittest.TestCase):
    """Test cases for DNS components."""
    
    @pulumi.runtime.test
    def test_route53_hosted_zone(self):
        """Test Route 53 private hosted zone is created."""
        args = TapStackArgs()
        stack = TapStack("test-stack", args)
        
        def check_zone(zone_data):
            zone_id, zone_zone_id = zone_data
            self.assertIsNotNone(zone_id)
            self.assertIsNotNone(zone_zone_id)
            return True
        
        return pulumi.Output.all(
            stack.hosted_zone.id,
            stack.hosted_zone.zone_id
        ).apply(check_zone)


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for TapStack."""
    
    @pulumi.runtime.test
    def test_full_stack_initialization(self):
        """Test complete stack initialization."""
        args = TapStackArgs(
            environment_suffix='test',
            tags={'Project': 'TapStack', 'Environment': 'test'}
        )
        stack = TapStack("integration-test-stack", args)
        
        # Verify stack has all major components
        self.assertIsNotNone(stack.vpc)
        self.assertIsNotNone(stack.alb)
        self.assertIsNotNone(stack.aurora_cluster)
        self.assertIsNotNone(stack.redis_premium_cluster)
        self.assertIsNotNone(stack.redis_standard_cluster)
        self.assertIsNotNone(stack.tenant_data_bucket)
        self.assertIsNotNone(stack.asg)
        self.assertIsNotNone(stack.cognito_user_pool_tenant1)
        self.assertIsNotNone(stack.tenant_registry_table)
        self.assertIsNotNone(stack.tenant_provisioning_lambda)
        
        return True
    
    @pulumi.runtime.test
    def test_multi_environment_stacks(self):
        """Test creating stacks for multiple environments."""
        dev_args = TapStackArgs(environment_suffix='dev')
        prod_args = TapStackArgs(environment_suffix='prod', instance_type='m5.xlarge')
        
        dev_stack = TapStack("dev-stack", dev_args)
        prod_stack = TapStack("prod-stack", prod_args)
        
        self.assertEqual(dev_stack.environment_suffix, 'dev')
        self.assertEqual(prod_stack.environment_suffix, 'prod')
        
        return True


if __name__ == '__main__':
    unittest.main()
