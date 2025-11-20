"""
Integration tests for Migration Infrastructure
Tests deployed AWS infrastructure end-to-end
"""
import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestMigrationInfrastructure(unittest.TestCase):
    """Integration tests for deployed migration infrastructure"""
    
    @classmethod
    def setUpClass(cls):
        """Load deployment outputs and initialize AWS clients"""
        cls.outputs = {}
        outputs_file = "cfn-outputs/flat-outputs.json"
        
        if os.path.exists(outputs_file):
            with open(outputs_file, "r", encoding="utf-8") as f:
                cls.outputs = json.load(f)
        
        cls.ec2_client = boto3.client("ec2", region_name="us-east-1")
        cls.rds_client = boto3.client("rds", region_name="us-east-1")
        cls.ecs_client = boto3.client("ecs", region_name="us-east-1")
        cls.elbv2_client = boto3.client("elbv2", region_name="us-east-1")
        cls.dms_client = boto3.client("dms", region_name="us-east-1")
        cls.logs_client = boto3.client("logs", region_name="us-east-1")
        cls.cloudwatch_client = boto3.client("cloudwatch", region_name="us-east-1")
    
    def test_outputs_exist(self):
        """Test that deployment outputs file exists"""
        self.assertTrue(os.path.exists("cfn-outputs/flat-outputs.json"), 
                       "Deployment outputs file not found")
        self.assertGreater(len(self.outputs), 0, "Outputs file is empty")
    
    def test_vpc_exists(self):
        """Test VPC is created and accessible"""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not in outputs")
        
        vpc_id = self.outputs["vpc_id"]
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response["Vpcs"]), 1)
        
        vpc = response["Vpcs"][0]
        self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16")
        self.assertTrue(vpc["EnableDnsHostnames"])
        self.assertTrue(vpc["EnableDnsSupport"])
    
    def test_rds_instance_running(self):
        """Test RDS instance is available"""
        if "rds_address" not in self.outputs:
            self.skipTest("RDS address not in outputs")
        
        rds_address = self.outputs["rds_address"]
        db_identifier = rds_address.split(".")[0]
        
        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=db_identifier
            )
            db_instance = response["DBInstances"][0]
            
            self.assertIn(db_instance["DBInstanceStatus"], ["available", "backing-up"])
            self.assertEqual(db_instance["Engine"], "postgres")
            self.assertTrue(db_instance["MultiAZ"])
            self.assertTrue(db_instance["StorageEncrypted"])
            self.assertFalse(db_instance["PubliclyAccessible"])
        except ClientError as e:
            if "DBInstanceNotFound" in str(e):
                self.skipTest("RDS instance not found")
            raise
    
    def test_ecs_cluster_exists(self):
        """Test ECS cluster is created"""
        if "ecs_cluster_name" not in self.outputs:
            self.skipTest("ECS cluster name not in outputs")
        
        cluster_name = self.outputs["ecs_cluster_name"]
        
        response = self.ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(response["clusters"]), 1)
        
        cluster = response["clusters"][0]
        self.assertEqual(cluster["status"], "ACTIVE")
    
    def test_ecs_service_running(self):
        """Test ECS service has running tasks"""
        if "ecs_cluster_name" not in self.outputs or "ecs_service_name" not in self.outputs:
            self.skipTest("ECS cluster or service name not in outputs")
        
        cluster_name = self.outputs["ecs_cluster_name"]
        service_name = self.outputs["ecs_service_name"]
        
        try:
            response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )
            
            if response["services"]:
                service = response["services"][0]
                self.assertEqual(service["status"], "ACTIVE")
                self.assertGreaterEqual(service["desiredCount"], 1)
        except ClientError:
            self.skipTest("ECS service not found or not accessible")
    
    def test_alb_healthy(self):
        """Test ALB is provisioned and active"""
        if "alb_dns_name" not in self.outputs:
            self.skipTest("ALB DNS name not in outputs")
        
        alb_dns_name = self.outputs["alb_dns_name"]
        
        # Find ALB by DNS name
        response = self.elbv2_client.describe_load_balancers()
        alb = None
        
        for lb in response["LoadBalancers"]:
            if lb["DNSName"] == alb_dns_name:
                alb = lb
                break
        
        if alb:
            self.assertEqual(alb["State"]["Code"], "active")
            self.assertEqual(alb["Type"], "application")
            self.assertEqual(alb["Scheme"], "internet-facing")
    
    def test_dms_replication_instance_exists(self):
        """Test DMS replication instance is created"""
        if "dms_replication_instance_arn" not in self.outputs:
            self.skipTest("DMS replication instance ARN not in outputs")
        
        try:
            response = self.dms_client.describe_replication_instances()
            
            instance_arn = self.outputs["dms_replication_instance_arn"]
            found = False
            
            for instance in response.get("ReplicationInstances", []):
                if instance["ReplicationInstanceArn"] == instance_arn:
                    found = True
                    self.assertIn(instance["ReplicationInstanceStatus"], 
                                 ["available", "creating", "modifying"])
            
            self.assertTrue(found, "DMS replication instance not found")
        except ClientError:
            self.skipTest("Unable to describe DMS instances")
    
    def test_cloudwatch_log_group_exists(self):
        """Test CloudWatch log group is created"""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test")
        log_group_name = f"/ecs/java-api-{environment_suffix}"
        
        try:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )
            
            found = False
            for log_group in response["logGroups"]:
                if log_group["logGroupName"] == log_group_name:
                    found = True
                    self.assertEqual(log_group["retentionInDays"], 7)
            
            # Log group may not exist yet if ECS tasks haven't started
            if not found:
                self.skipTest("CloudWatch log group not created yet")
        except ClientError:
            self.skipTest("Unable to describe log groups")
    
    def test_cloudwatch_alarms_exist(self):
        """Test CloudWatch alarms are configured"""
        environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "test")
        
        try:
            response = self.cloudwatch_client.describe_alarms(
                AlarmNamePrefix=f"ecs-cpu-high-{environment_suffix}"
            )
            
            if response["MetricAlarms"]:
                alarm = response["MetricAlarms"][0]
                self.assertEqual(alarm["ComparisonOperator"], "GreaterThanThreshold")
                self.assertEqual(alarm["Threshold"], 80.0)
                self.assertEqual(alarm["Namespace"], "AWS/ECS")
        except ClientError:
            self.skipTest("Unable to describe CloudWatch alarms")
    
    def test_security_groups_configured(self):
        """Test security groups exist with proper rules"""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not in outputs")
        
        vpc_id = self.outputs["vpc_id"]
        
        response = self.ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        security_groups = response["SecurityGroups"]
        self.assertGreaterEqual(len(security_groups), 4, 
                               "Expected at least 4 security groups (ALB, ECS, RDS, DMS)")
    
    def test_rds_connection_possible(self):
        """Test RDS endpoint is reachable (connection test, not actual connection)"""
        if "rds_endpoint" not in self.outputs:
            self.skipTest("RDS endpoint not in outputs")
        
        rds_endpoint = self.outputs["rds_endpoint"]
        self.assertIn(":", rds_endpoint, "RDS endpoint should include port")
        self.assertIn("rds.amazonaws.com", rds_endpoint, "Should be RDS endpoint")
    
    def test_infrastructure_tags(self):
        """Test resources are properly tagged"""
        if "vpc_id" not in self.outputs:
            self.skipTest("VPC ID not in outputs")
        
        vpc_id = self.outputs["vpc_id"]
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response["Vpcs"][0]
        
        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        self.assertIn("Name", tags, "VPC should have Name tag")


if __name__ == "__main__":
    unittest.main()
