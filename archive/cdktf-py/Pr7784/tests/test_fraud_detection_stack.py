"""
Comprehensive tests for Fraud Detection API Infrastructure
"""
import pytest
import json
from lib.main import FraudDetectionStack
from cdktf import Testing, App


class TestFraudDetectionStack:
    """Test suite for FraudDetectionStack"""
    
    @pytest.fixture
    def stack(self):
        """Create a test stack"""
        app = Testing.app()
        return FraudDetectionStack(app, "test-stack", environment_suffix="test")
    
    def test_stack_synthesizes(self, stack):
        """Test that the stack synthesizes without errors"""
        synthesized = Testing.synth(stack)
        assert synthesized is not None
    
    def test_vpc_created(self, stack):
        """Test VPC is created with correct configuration"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        # Find VPC resource
        vpc_resources = [r for r in resources.get("resource", {}).get("aws_vpc", {}).values()]
        assert len(vpc_resources) > 0, "VPC should be created"
        
        vpc = vpc_resources[0]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] == True
        assert vpc["enable_dns_support"] == True
        assert "fraud-vpc-test" in vpc["tags"]["Name"]
    
    def test_three_availability_zones(self, stack):
        """Test that 3 availability zones are configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        subnets = resources.get("resource", {}).get("aws_subnet", {})
        
        # Check public subnets
        public_subnets = [s for s in subnets.values() if "public" in s.get("tags", {}).get("Name", "")]
        assert len(public_subnets) == 3, "Should have 3 public subnets"
        
        # Check private subnets
        private_subnets = [s for s in subnets.values() if "private" in s.get("tags", {}).get("Name", "")]
        assert len(private_subnets) == 3, "Should have 3 private subnets"
        
        # Verify AZs
        azs_public = [s["availability_zone"] for s in public_subnets]
        azs_private = [s["availability_zone"] for s in private_subnets]
        
        expected_azs = ["us-east-1a", "us-east-1b", "us-east-1c"]
        assert set(azs_public) == set(expected_azs), "Public subnets should cover all 3 AZs"
        assert set(azs_private) == set(expected_azs), "Private subnets should cover all 3 AZs"
    
    def test_nat_gateway_created(self, stack):
        """Test NAT Gateway is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        nat_gateways = resources.get("resource", {}).get("aws_nat_gateway", {})
        assert len(nat_gateways) > 0, "NAT Gateway should be created"
    
    def test_vpc_flow_logs_configured(self, stack):
        """Test VPC flow logs are configured with S3"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        # Check S3 bucket
        s3_buckets = resources.get("resource", {}).get("aws_s3_bucket", {})
        flow_log_buckets = [b for b in s3_buckets.values() 
                           if "flow-logs" in b.get("bucket", "")]
        assert len(flow_log_buckets) > 0, "S3 bucket for flow logs should exist"
        
        # Check flow log
        flow_logs = resources.get("resource", {}).get("aws_flow_log", {})
        assert len(flow_logs) > 0, "VPC flow log should be configured"
        
        flow_log = list(flow_logs.values())[0]
        assert flow_log["traffic_type"] == "ALL"
        assert flow_log["log_destination_type"] == "s3"
    
    def test_s3_lifecycle_policy(self, stack):
        """Test S3 bucket has lifecycle policy"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        lifecycle_configs = resources.get("resource", {}).get("aws_s3_bucket_lifecycle_configuration", {})
        assert len(lifecycle_configs) > 0, "S3 lifecycle configuration should exist"
        
        config = list(lifecycle_configs.values())[0]
        assert len(config["rule"]) > 0, "Should have lifecycle rules"
        
        rule = config["rule"][0]
        assert rule["status"] == "Enabled"
        assert rule["expiration"][0]["days"] == 90
    
    def test_ecs_cluster_created(self, stack):
        """Test ECS cluster is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        ecs_clusters = resources.get("resource", {}).get("aws_ecs_cluster", {})
        assert len(ecs_clusters) > 0, "ECS cluster should be created"
        
        cluster = list(ecs_clusters.values())[0]
        assert "fraud-cluster-test" in cluster["name"]
    
    def test_ecs_task_definition(self, stack):
        """Test ECS task definition configuration"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        task_defs = resources.get("resource", {}).get("aws_ecs_task_definition", {})
        assert len(task_defs) > 0, "ECS task definition should exist"
        
        task_def = list(task_defs.values())[0]
        assert task_def["network_mode"] == "awsvpc"
        assert "FARGATE" in task_def["requires_compatibilities"]
        assert task_def["cpu"] == "1024"
        assert task_def["memory"] == "2048"
        
        # Check container definitions
        containers = json.loads(task_def["container_definitions"])
        assert len(containers) == 2, "Should have 2 containers (app + xray)"
        
        app_container = [c for c in containers if c["name"] == "fraud-api"][0]
        assert app_container["image"] == "fraud-api:latest"
        assert app_container["cpu"] == 512
        assert app_container["memory"] == 1024
        
        xray_container = [c for c in containers if c["name"] == "xray-daemon"][0]
        assert xray_container["image"] == "amazon/aws-xray-daemon"
    
    def test_ecs_autoscaling_configured(self, stack):
        """Test ECS auto-scaling is configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        autoscaling_targets = resources.get("resource", {}).get("aws_appautoscaling_target", {})
        assert len(autoscaling_targets) > 0, "Auto-scaling target should exist"
        
        target = list(autoscaling_targets.values())[0]
        assert target["min_capacity"] == 2
        assert target["max_capacity"] == 10
        assert target["scalable_dimension"] == "ecs:service:DesiredCount"
        
        autoscaling_policies = resources.get("resource", {}).get("aws_appautoscaling_policy", {})
        assert len(autoscaling_policies) > 0, "Auto-scaling policy should exist"
        
        policy = list(autoscaling_policies.values())[0]
        assert policy["policy_type"] == "TargetTrackingScaling"
        config = policy["target_tracking_scaling_policy_configuration"]
        assert config["target_value"] == 70.0
    
    def test_alb_created(self, stack):
        """Test Application Load Balancer is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        albs = resources.get("resource", {}).get("aws_lb", {})
        assert len(albs) > 0, "ALB should be created"
        
        alb = list(albs.values())[0]
        assert alb["load_balancer_type"] == "application"
        assert alb["enable_deletion_protection"] == False
    
    def test_alb_target_groups(self, stack):
        """Test ALB target groups for blue-green deployment"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        target_groups = resources.get("resource", {}).get("aws_lb_target_group", {})
        assert len(target_groups) >= 2, "Should have at least 2 target groups for blue-green"
        
        for tg in target_groups.values():
            assert tg["port"] == 8080
            assert tg["protocol"] == "HTTP"
            assert tg["target_type"] == "ip"
            
            # Check health check
            health_check = tg["health_check"]
            assert health_check["enabled"] == True
            assert health_check["path"] == "/health"
            assert health_check["healthy_threshold"] == 2
            assert health_check["unhealthy_threshold"] == 3
    
    def test_alb_http_listener(self, stack):
        """Test ALB HTTP listener is configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)

        listeners = resources.get("resource", {}).get("aws_lb_listener", {})

        http_listeners = [l for l in listeners.values() if l["port"] == 80]
        assert len(http_listeners) > 0, "HTTP listener should exist"

        http_listener = http_listeners[0]
        assert http_listener["protocol"] == "HTTP"
        assert http_listener["default_action"][0]["type"] == "forward"

    def test_api_gateway_created(self, stack):
        """Test API Gateway is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        apis = resources.get("resource", {}).get("aws_apigatewayv2_api", {})
        assert len(apis) > 0, "API Gateway should be created"
        
        api = list(apis.values())[0]
        assert api["protocol_type"] == "HTTP"
        assert "fraud-api-test" in api["name"]
    
    def test_api_gateway_vpc_link(self, stack):
        """Test API Gateway VPC Link is configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        vpc_links = resources.get("resource", {}).get("aws_apigatewayv2_vpc_link", {})
        assert len(vpc_links) > 0, "VPC Link should be created"
    
    def test_api_gateway_usage_plan(self, stack):
        """Test API Gateway usage plan with throttling"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        usage_plans = resources.get("resource", {}).get("aws_api_gateway_usage_plan", {})
        assert len(usage_plans) > 0, "Usage plan should exist"
        
        plan = list(usage_plans.values())[0]
        assert plan["throttle_settings"]["rate_limit"] == 1000
        assert plan["throttle_settings"]["burst_limit"] == 2000
        assert plan["quota_settings"]["limit"] == 100000
    
    def test_api_key_created(self, stack):
        """Test API key is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        api_keys = resources.get("resource", {}).get("aws_api_gateway_api_key", {})
        assert len(api_keys) > 0, "API key should be created"
        
        key = list(api_keys.values())[0]
        assert key["enabled"] == True
    
    def test_aurora_serverless_v2(self, stack):
        """Test Aurora Serverless v2 configuration"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        rds_clusters = resources.get("resource", {}).get("aws_rds_cluster", {})
        assert len(rds_clusters) > 0, "Aurora cluster should be created"
        
        cluster = list(rds_clusters.values())[0]
        assert cluster["engine"] == "aurora-postgresql"
        assert cluster["engine_mode"] == "provisioned"
        assert cluster["storage_encrypted"] == True
        assert cluster["skip_final_snapshot"] == True
        
        # Check Serverless v2 scaling
        scaling = cluster["serverlessv2_scaling_configuration"]
        assert scaling["min_capacity"] == 0.5
        assert scaling["max_capacity"] == 4.0
    
    def test_aurora_in_private_subnets(self, stack):
        """Test Aurora is deployed in private subnets"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        db_subnet_groups = resources.get("resource", {}).get("aws_db_subnet_group", {})
        assert len(db_subnet_groups) > 0, "DB subnet group should exist"
        
        # Aurora instance should not be publicly accessible
        rds_instances = resources.get("resource", {}).get("aws_rds_cluster_instance", {})
        for instance in rds_instances.values():
            assert instance["publicly_accessible"] == False
    
    def test_secrets_manager_configured(self, stack):
        """Test Secrets Manager is configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        secrets = resources.get("resource", {}).get("aws_secretsmanager_secret", {})
        assert len(secrets) > 0, "Secrets Manager secret should exist"
        
        secret = list(secrets.values())[0]
        assert "fraud-db-secret-test" in secret["name"]
        
        # Check secret version
        secret_versions = resources.get("resource", {}).get("aws_secretsmanager_secret_version", {})
        assert len(secret_versions) > 0, "Secret version should exist"
    
    def test_waf_configured(self, stack):
        """Test WAF is configured with rules"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        waf_acls = resources.get("resource", {}).get("aws_wafv2_web_acl", {})
        assert len(waf_acls) > 0, "WAF Web ACL should exist"
        
        waf = list(waf_acls.values())[0]
        assert waf["scope"] == "REGIONAL"
        assert len(waf["rule"]) >= 2, "Should have multiple WAF rules"
        
        # Check rate limiting rule
        rate_rules = [r for r in waf["rule"] if "Rate" in r["name"]]
        assert len(rate_rules) > 0, "Should have rate limiting rule"
        
        # Check WAF association
        waf_associations = resources.get("resource", {}).get("aws_wafv2_web_acl_association", {})
        assert len(waf_associations) > 0, "WAF should be associated with ALB"
    
    def test_cloudwatch_dashboard(self, stack):
        """Test CloudWatch dashboard is created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        dashboards = resources.get("resource", {}).get("aws_cloudwatch_dashboard", {})
        assert len(dashboards) > 0, "CloudWatch dashboard should exist"
        
        dashboard = list(dashboards.values())[0]
        assert "fraud-dashboard-test" in dashboard["dashboard_name"]
    
    def test_cloudwatch_alarms(self, stack):
        """Test CloudWatch alarms are configured"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        alarms = resources.get("resource", {}).get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 2, "Should have multiple CloudWatch alarms"
        
        # Check for latency alarm
        latency_alarms = [a for a in alarms.values() if "latency" in a["alarm_name"]]
        assert len(latency_alarms) > 0, "Should have latency alarm"
        
        latency_alarm = latency_alarms[0]
        assert latency_alarm["threshold"] == 0.2  # 200ms
        assert latency_alarm["metric_name"] == "TargetResponseTime"
        
        # Check for ECS health alarm
        health_alarms = [a for a in alarms.values() if "health" in a["alarm_name"]]
        assert len(health_alarms) > 0, "Should have ECS health alarm"
    
    def test_cloudwatch_log_groups(self, stack):
        """Test CloudWatch log groups are created"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        log_groups = resources.get("resource", {}).get("aws_cloudwatch_log_group", {})
        assert len(log_groups) > 0, "CloudWatch log group should exist"
        
        log_group = list(log_groups.values())[0]
        assert "/ecs/fraud-api-test" in log_group["name"]
        assert log_group["retention_in_days"] == 30
    
    def test_iam_roles_configured(self, stack):
        """Test IAM roles are configured with least privilege"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        iam_roles = resources.get("resource", {}).get("aws_iam_role", {})
        assert len(iam_roles) >= 2, "Should have execution and task roles"
        
        # Check execution role
        exec_roles = [r for r in iam_roles.values() if "execution" in r["name"]]
        assert len(exec_roles) > 0, "Should have ECS execution role"
        
        # Check task role
        task_roles = [r for r in iam_roles.values() if "task-role" in r["name"]]
        assert len(task_roles) > 0, "Should have ECS task role"
        
        # Check policy attachments
        role_policies = resources.get("resource", {}).get("aws_iam_role_policy", {})
        assert len(role_policies) > 0, "Should have IAM policies attached"
    
    def test_security_groups_configured(self, stack):
        """Test security groups follow least privilege"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        security_groups = resources.get("resource", {}).get("aws_security_group", {})
        assert len(security_groups) >= 3, "Should have ALB, ECS, and DB security groups"
        
        # Find ECS security group
        ecs_sgs = [sg for sg in security_groups.values() if "ecs-sg" in sg.get("name", "")]
        assert len(ecs_sgs) > 0, "Should have ECS security group"
        
        # Find DB security group
        db_sgs = [sg for sg in security_groups.values() if "db-sg" in sg.get("name", "")]
        assert len(db_sgs) > 0, "Should have DB security group"
        
        # DB security group should only allow PostgreSQL from ECS
        db_sg = db_sgs[0]
        assert len(db_sg["ingress"]) == 1, "DB should have single ingress rule"
        assert db_sg["ingress"][0]["from_port"] == 5432
        assert db_sg["ingress"][0]["to_port"] == 5432
    
    def test_environment_suffix_in_names(self, stack):
        """Test all resource names include environment_suffix"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        # Check VPC
        vpcs = resources.get("resource", {}).get("aws_vpc", {})
        assert "test" in list(vpcs.values())[0]["tags"]["Name"]
        
        # Check ECS cluster
        ecs_clusters = resources.get("resource", {}).get("aws_ecs_cluster", {})
        assert "test" in list(ecs_clusters.values())[0]["name"]
        
        # Check ALB
        albs = resources.get("resource", {}).get("aws_lb", {})
        assert "test" in list(albs.values())[0]["name"]
    
    def test_outputs_defined(self, stack):
        """Test required outputs are defined"""
        synthesized = Testing.synth(stack)
        resources = json.loads(synthesized)
        
        outputs = resources.get("output", {})
        
        required_outputs = [
            "alb_dns_name",
            "api_endpoint",
            "dashboard_url",
            "vpc_id",
            "ecs_cluster_name",
            "aurora_endpoint"
        ]
        
        for output_name in required_outputs:
            assert output_name in outputs, f"Output {output_name} should be defined"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
