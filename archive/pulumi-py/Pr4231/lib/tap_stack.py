#!/usr/bin/env python3
"""
TAP Stack: Multi-Environment Infrastructure Stack for ScalePayments FinTech Platform

This module implements a comprehensive multi-environment infrastructure stack for a 
FinTech payment processing platform using AWS ECS Fargate, RDS, and ElastiCache.
The stack supports development, staging, and production environments with 
environment-specific configurations for scaling, security, and compliance.

Key Features:
- Multi-environment support (dev, staging, prod)
- ECS Fargate microservices architecture
- RDS for transaction data with encryption
- ElastiCache for session management
- Environment-specific scaling and security configurations
- Comprehensive networking with VPC, subnets, and security groups
- Application Load Balancer for traffic distribution
- CloudWatch logging and monitoring
- Secrets management for sensitive configuration
"""

import json
import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import pulumi
import pulumi_aws as aws
from pulumi import Config, Output, ResourceOptions, export


@dataclass
class TapStackArgs:
    """Arguments for TapStack configuration"""
    environment_suffix: str
    region: Optional[str] = "us-east-1"


class TapStack(pulumi.ComponentResource):
    """
    Multi-environment infrastructure stack for ScalePayments FinTech platform.
    
    This stack creates a complete microservices infrastructure with:
    - VPC with public/private subnets across multiple AZs
    - ECS Fargate cluster for microservices
    - RDS PostgreSQL instance for transaction data
    - ElastiCache Redis cluster for session management
    - Application Load Balancer for traffic routing
    - Security groups with environment-specific rules
    - CloudWatch logging and monitoring
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("scalepayments:TapStack", name, {}, opts)
        
        self.environment = args.environment_suffix
        self.region = args.region or "us-east-1"
        self.config = Config()
        
        # Environment-specific configurations
        self.env_configs = self._get_environment_configs()
        self.current_config = self.env_configs.get(self.environment, self.env_configs["dev"])
        
        # Create all infrastructure components
        self._create_vpc()
        self._create_security_groups()
        self._create_rds_instance()
        self._create_elasticache_cluster()
        self._create_ecs_cluster()
        self._create_load_balancer()
        self._create_ecs_services()
        self._setup_monitoring()
        self._export_outputs()
        
        self.register_outputs({})
    
    def _get_environment_configs(self) -> Dict[str, Dict[str, Any]]:
        """Get environment-specific configurations"""
        return {
            "dev": {
                "vpc_cidr": "10.0.0.0/16",
                "instance_class": "db.t3.micro",
                "allocated_storage": 20,
                "max_allocated_storage": 100,
                "backup_retention": 1,
                "multi_az": False,
                "deletion_protection": False,
                "cache_node_type": "cache.t3.micro",
                "cache_num_nodes": 1,
                "ecs_cpu": 256,
                "ecs_memory": 512,
                "desired_count": 1,
                "max_capacity": 2,
                "enable_logging": True,
                "log_retention": 7,
                "security_level": "basic",
                "compliance_required": False
            },
            "staging": {
                "vpc_cidr": "10.1.0.0/16",
                "instance_class": "db.t3.small",
                "allocated_storage": 50,
                "max_allocated_storage": 200,
                "backup_retention": 7,
                "multi_az": False,
                "deletion_protection": True,
                "cache_node_type": "cache.t3.small",
                "cache_num_nodes": 2,
                "ecs_cpu": 512,
                "ecs_memory": 1024,
                "desired_count": 2,
                "max_capacity": 4,
                "enable_logging": True,
                "log_retention": 14,
                "security_level": "enhanced",
                "compliance_required": True
            },
            "prod": {
                "vpc_cidr": "10.2.0.0/16",
                "instance_class": "db.r5.large",
                "allocated_storage": 100,
                "max_allocated_storage": 1000,
                "backup_retention": 30,
                "multi_az": True,
                "deletion_protection": True,
                "cache_node_type": "cache.r5.large",
                "cache_num_nodes": 3,
                "ecs_cpu": 1024,
                "ecs_memory": 2048,
                "desired_count": 3,
                "max_capacity": 10,
                "enable_logging": True,
                "log_retention": 30,
                "security_level": "strict",
                "compliance_required": True
            }
        }
    
    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"scalepayments-vpc-{self.environment}",
            cidr_block=self.current_config["vpc_cidr"],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"scalepayments-vpc-{self.environment}",
                "Environment": self.environment,
                "Project": "ScalePayments"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"scalepayments-igw-{self.environment}",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"scalepayments-igw-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Create public subnets
        self.public_subnets = []
        self.private_subnets = []
        
        for i in range(min(3, len(azs.names))):  # Create up to 3 subnets
            # Public subnet
            public_subnet = aws.ec2.Subnet(
                f"scalepayments-public-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.{0 if self.environment == 'dev' else 1 if self.environment == 'staging' else 2}.{i+1}.0/24",
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"scalepayments-public-subnet-{i+1}-{self.environment}",
                    "Environment": self.environment,
                    "Type": "Public"
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = aws.ec2.Subnet(
                f"scalepayments-private-subnet-{i+1}-{self.environment}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.{0 if self.environment == 'dev' else 1 if self.environment == 'staging' else 2}.{i+10}.0/24",
                availability_zone=azs.names[i],
                tags={
                    "Name": f"scalepayments-private-subnet-{i+1}-{self.environment}",
                    "Environment": self.environment,
                    "Type": "Private"
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(private_subnet)
        
        # Create NAT Gateway for private subnets
        self.nat_eip = aws.ec2.Eip(
            f"scalepayments-nat-eip-{self.environment}",
            domain="vpc",
            tags={
                "Name": f"scalepayments-nat-eip-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self, depends_on=[self.igw])
        )
        
        self.nat_gateway = aws.ec2.NatGateway(
            f"scalepayments-nat-gateway-{self.environment}",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                "Name": f"scalepayments-nat-gateway-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self, depends_on=[self.igw])
        )
        
        # Create route tables
        self.public_route_table = aws.ec2.RouteTable(
            f"scalepayments-public-rt-{self.environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    gateway_id=self.igw.id
                )
            ],
            tags={
                "Name": f"scalepayments-public-rt-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        self.private_route_table = aws.ec2.RouteTable(
            f"scalepayments-private-rt-{self.environment}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={
                "Name": f"scalepayments-private-rt-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Associate subnets with route tables
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"scalepayments-public-rta-{i+1}-{self.environment}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )
        
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"scalepayments-private-rta-{i+1}-{self.environment}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )
    
    def _create_security_groups(self):
        """Create security groups for different components"""
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"scalepayments-alb-sg-{self.environment}",
            name=f"scalepayments-alb-sg-{self.environment}",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=80,
                    to_port=80,
                    cidr_blocks=["0.0.0.0/0"]
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=443,
                    to_port=443,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"scalepayments-alb-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Security Group
        self.ecs_sg = aws.ec2.SecurityGroup(
            f"scalepayments-ecs-sg-{self.environment}",
            name=f"scalepayments-ecs-sg-{self.environment}",
            description="Security group for ECS tasks",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    security_groups=[self.alb_sg.id]
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"scalepayments-ecs-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Security Group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"scalepayments-rds-sg-{self.environment}",
            name=f"scalepayments-rds-sg-{self.environment}",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_sg.id]
                )
            ],
            tags={
                "Name": f"scalepayments-rds-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # ElastiCache Security Group
        self.cache_sg = aws.ec2.SecurityGroup(
            f"scalepayments-cache-sg-{self.environment}",
            name=f"scalepayments-cache-sg-{self.environment}",
            description="Security group for ElastiCache",
            vpc_id=self.vpc.id,
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[self.ecs_sg.id]
                )
            ],
            tags={
                "Name": f"scalepayments-cache-sg-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_rds_instance(self):
      """Create RDS PostgreSQL instance for transaction data"""
      # Create DB subnet group
      self.db_subnet_group = aws.rds.SubnetGroup(
          f"scalepayments-db-subnet-group-{self.environment}",
          name=f"scalepayments-db-subnet-group-{self.environment}",
          subnet_ids=[subnet.id for subnet in self.private_subnets],
          tags={
              "Name": f"scalepayments-db-subnet-group-{self.environment}",
              "Environment": self.environment
          },
          opts=ResourceOptions(parent=self)
      )
      
      # Create parameter group for PostgreSQL optimization
      self.db_parameter_group = aws.rds.ParameterGroup(
          f"scalepayments-db-params-{self.environment}",
          name=f"scalepayments-db-params-{self.environment}",
          family="postgres16",
          parameters=[
              # Static parameter - requires pending-reboot
              aws.rds.ParameterGroupParameterArgs(
                  name="shared_preload_libraries",
                  value="pg_stat_statements",
                  apply_method="pending-reboot"  # Must be pending-reboot for static parameters
              ),
              # Dynamic parameter - can be immediate
              aws.rds.ParameterGroupParameterArgs(
                  name="log_statement",
                  value="all" if self.current_config["security_level"] == "strict" else "mod",
                  apply_method="immediate"  # Dynamic parameters can be immediate
              )
          ],
          tags={
              "Name": f"scalepayments-db-params-{self.environment}",
              "Environment": self.environment
          },
          opts=ResourceOptions(parent=self)
      )
      
      # Generate random password for database
      self.db_password = aws.secretsmanager.Secret(
          f"scalepayments-db-password-{self.environment}",
          name=f"scalepayments/db/password/{self.environment}",
          description=f"Database password for {self.environment} environment",
          tags={
              "Environment": self.environment,
              "Service": "RDS"
          },
          opts=ResourceOptions(parent=self)
      )
      
      self.db_password_version = aws.secretsmanager.SecretVersion(
          f"scalepayments-db-password-version-{self.environment}",
          secret_id=self.db_password.id,
          secret_string=json.dumps({
              "username": "scalepayments_admin",
              "password": self.config.require_secret("db_password") if self.config.get_secret("db_password") else "ChangeMe123!"
          }),
          opts=ResourceOptions(parent=self)
      )
      
      # Create RDS monitoring role for enhanced monitoring
      monitoring_role = None
      if self.environment in ["staging", "prod"]:
          monitoring_role = self._create_rds_monitoring_role()
      
      # Create RDS instance
      self.rds_instance = aws.rds.Instance(
          f"scalepayments-db-{self.environment}",
          identifier=f"scalepayments-db-{self.environment}",
          engine="postgres",
          engine_version="16.3",  # Latest stable version
          instance_class=self.current_config["instance_class"],
          allocated_storage=self.current_config["allocated_storage"],
          max_allocated_storage=self.current_config["max_allocated_storage"],
          storage_type="gp3",
          storage_encrypted=True,
          db_name="scalepayments",
          username="scalepayments_admin",
          password=self.config.require_secret("db_password") if self.config.get_secret("db_password") else "ChangeMe123!",
          vpc_security_group_ids=[self.rds_sg.id],
          db_subnet_group_name=self.db_subnet_group.name,
          parameter_group_name=self.db_parameter_group.name,
          backup_retention_period=self.current_config["backup_retention"],
          backup_window="03:00-04:00",
          maintenance_window="sun:04:00-sun:05:00",
          multi_az=self.current_config["multi_az"],
          deletion_protection=self.current_config["deletion_protection"],
          skip_final_snapshot=not self.current_config["deletion_protection"],
          final_snapshot_identifier=f"scalepayments-db-final-snapshot-{self.environment}" if self.current_config["deletion_protection"] else None,
          enabled_cloudwatch_logs_exports=["postgresql"] if self.current_config["enable_logging"] else None,
          monitoring_interval=60 if self.environment in ["staging", "prod"] else 0,
          monitoring_role_arn=monitoring_role.arn if monitoring_role else None,
          performance_insights_enabled=self.environment in ["staging", "prod"],
          performance_insights_retention_period=7 if self.environment == "staging" else 31 if self.environment == "prod" else None,
          tags={
              "Name": f"scalepayments-db-{self.environment}",
              "Environment": self.environment,
              "Service": "RDS",
              "Compliance": "PCI-DSS" if self.current_config["compliance_required"] else "None"
          },
          opts=ResourceOptions(parent=self)
      )


    
    def _create_rds_monitoring_role(self):
        """Create IAM role for RDS enhanced monitoring"""
        return aws.iam.Role(
            f"scalepayments-rds-monitoring-role-{self.environment}",
            name=f"scalepayments-rds-monitoring-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "monitoring.rds.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"],
            tags={
                "Environment": self.environment,
                "Service": "RDS"
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_elasticache_cluster(self):
        """Create ElastiCache Redis cluster for session management"""
        # Create cache subnet group
        self.cache_subnet_group = aws.elasticache.SubnetGroup(
            f"scalepayments-cache-subnet-group-{self.environment}",
            name=f"scalepayments-cache-subnet-group-{self.environment}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                "Name": f"scalepayments-cache-subnet-group-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create parameter group for Redis optimization
        self.cache_parameter_group = aws.elasticache.ParameterGroup(
            f"scalepayments-cache-params-{self.environment}",
            name=f"scalepayments-cache-params-{self.environment}",
            family="redis7",
            parameters=[
                aws.elasticache.ParameterGroupParameterArgs(
                    name="maxmemory-policy",
                    value="allkeys-lru"
                ),
                aws.elasticache.ParameterGroupParameterArgs(
                    name="timeout",
                    value="300"
                )
            ],
            tags={
                "Name": f"scalepayments-cache-params-{self.environment}",
                "Environment": self.environment
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create ElastiCache replication group
        self.elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"scalepayments-cache-{self.environment}",
            replication_group_id=f"scalepayments-cache-{self.environment}",
            description=f"Redis cluster for session management - {self.environment}",
            node_type=self.current_config["cache_node_type"],
            port=6379,
            parameter_group_name=self.cache_parameter_group.name,
            num_cache_clusters=self.current_config["cache_num_nodes"],
            engine="redis",
            engine_version="7.0",
            subnet_group_name=self.cache_subnet_group.name,
            security_group_ids=[self.cache_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=self.environment in ["staging", "prod"],
            auth_token=self.config.get_secret("redis_auth_token") if self.environment in ["staging", "prod"] else None,
            automatic_failover_enabled=self.current_config["cache_num_nodes"] > 1,
            multi_az_enabled=self.current_config["cache_num_nodes"] > 1,
            snapshot_retention_limit=5 if self.environment in ["staging", "prod"] else 1,
            snapshot_window="03:00-05:00",
            maintenance_window="sun:05:00-sun:07:00",
            tags={
                "Name": f"scalepayments-cache-{self.environment}",
                "Environment": self.environment,
                "Service": "ElastiCache"
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_ecs_cluster(self):
        """Create ECS Fargate cluster for microservices"""
        # Create CloudWatch log group
        self.log_group = aws.cloudwatch.LogGroup(
            f"scalepayments-logs-{self.environment}",
            name=f"/ecs/scalepayments/{self.environment}",
            retention_in_days=self.current_config["log_retention"],
            tags={
                "Environment": self.environment,
                "Service": "ECS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create ECS cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"scalepayments-cluster-{self.environment}",
            name=f"scalepayments-cluster-{self.environment}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled" if self.environment in ["staging", "prod"] else "disabled"
                )
            ],
            tags={
                "Name": f"scalepayments-cluster-{self.environment}",
                "Environment": self.environment,
                "Service": "ECS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create task execution role
        self.task_execution_role = aws.iam.Role(
            f"scalepayments-task-execution-role-{self.environment}",
            name=f"scalepayments-task-execution-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
                "arn:aws:iam::aws:policy/AmazonSSMReadOnlyAccess"
            ],
            tags={
                "Environment": self.environment,
                "Service": "ECS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create task role for application permissions
        self.task_role = aws.iam.Role(
            f"scalepayments-task-role-{self.environment}",
            name=f"scalepayments-task-role-{self.environment}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "ecs-tasks.amazonaws.com"
                        },
                        "Action": "sts:AssumeRole"
                    }
                ]
            }),
            tags={
                "Environment": self.environment,
                "Service": "ECS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Attach policy for secrets access
        aws.iam.RolePolicyAttachment(
            f"scalepayments-task-role-secrets-policy-{self.environment}",
            role=self.task_role.name,
            policy_arn="arn:aws:iam::aws:policy/SecretsManagerReadWrite",
            opts=ResourceOptions(parent=self)
        )
    
    def _create_load_balancer(self):
        """Create Application Load Balancer for traffic distribution"""
        # Create ALB
        self.alb = aws.lb.LoadBalancer(
            f"scalepayments-alb-{self.environment}",
            name=f"scalepayments-alb-{self.environment}",
            load_balancer_type="application",
            internal=False,  # False = internet-facing
            security_groups=[self.alb_sg.id],
            subnets=[subnet.id for subnet in self.public_subnets],
            enable_deletion_protection=self.current_config["deletion_protection"],
            tags={
                "Name": f"scalepayments-alb-{self.environment}",
                "Environment": self.environment,
                "Service": "ALB"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create target group for payment service
        self.payment_target_group = aws.lb.TargetGroup(
            f"scalepayments-payment-tg-{self.environment}",
            name=f"scalepayments-payment-tg-{self.environment}",
            port=8080,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,
                timeout=5,
                interval=30,
                path="/health",
                matcher="200",
                protocol="HTTP"
            ),
            tags={
                "Name": f"scalepayments-payment-tg-{self.environment}",
                "Environment": self.environment,
                "Service": "PaymentService"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create ALB listener
        self.alb_listener = aws.lb.Listener(
            f"scalepayments-alb-listener-{self.environment}",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[
                aws.lb.ListenerDefaultActionArgs(
                    type="forward",
                    target_group_arn=self.payment_target_group.arn
                )
            ],
            opts=ResourceOptions(parent=self)
        )
    
    def _create_ecs_services(self):
      """Create ECS services for microservices"""
      
      # Create container definitions using Output.all to handle async values
      def create_container_definitions(db_password_arn, log_group_name):
          return json.dumps([
              {
                  "name": "payment-service",
                  "image": "nginx:latest",
                  "portMappings": [
                      {
                          "containerPort": 8080,
                          "protocol": "tcp"
                      }
                  ],
                  "environment": [
                      {
                          "name": "ENVIRONMENT",
                          "value": self.environment
                      },
                      {
                          "name": "AWS_REGION",
                          "value": self.region
                      }
                  ],
                  "secrets": [
                      {
                          "name": "DB_PASSWORD",
                          "valueFrom": db_password_arn
                      }
                  ],
                  "logConfiguration": {
                      "logDriver": "awslogs",
                      "options": {
                          "awslogs-group": log_group_name,
                          "awslogs-region": self.region,
                          "awslogs-stream-prefix": "payment-service"
                      }
                  },
                  "essential": True,
                  "healthCheck": {
                      "command": ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"],
                      "interval": 30,
                      "timeout": 5,
                      "retries": 3,
                      "startPeriod": 60
                  }
              }
          ])
      
      container_definitions_json = pulumi.Output.all(
          self.db_password.arn,
          self.log_group.name
      ).apply(lambda args: create_container_definitions(args[0], args[1]))
      
      # Payment Service Task Definition
      self.payment_task_definition = aws.ecs.TaskDefinition(
          f"scalepayments-payment-task-{self.environment}",
          family=f"scalepayments-payment-{self.environment}",
          network_mode="awsvpc",
          requires_compatibilities=["FARGATE"],
          cpu=str(self.current_config["ecs_cpu"]),
          memory=str(self.current_config["ecs_memory"]),
          execution_role_arn=self.task_execution_role.arn,
          task_role_arn=self.task_role.arn,
          container_definitions=container_definitions_json,
          tags={
              "Name": f"scalepayments-payment-task-{self.environment}",
              "Environment": self.environment,
              "Service": "PaymentService"
          },
          opts=ResourceOptions(parent=self)
      )
      
      # Payment Service - using dict for deployment_configuration
      self.payment_service = aws.ecs.Service(
          f"scalepayments-payment-service-{self.environment}",
          name=f"scalepayments-payment-service-{self.environment}",
          cluster=self.ecs_cluster.id,
          task_definition=self.payment_task_definition.arn,
          desired_count=self.current_config["desired_count"],
          launch_type="FARGATE",
          platform_version="LATEST",
          network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
              subnets=[subnet.id for subnet in self.private_subnets],
              security_groups=[self.ecs_sg.id],
              assign_public_ip=False
          ),
          load_balancers=[
              aws.ecs.ServiceLoadBalancerArgs(
                  target_group_arn=self.payment_target_group.arn,
                  container_name="payment-service",
                  container_port=8080
              )
          ],
          deployment_maximum_percent=200,
          deployment_minimum_healthy_percent=50,
          enable_execute_command=self.environment == "dev",
          tags={
              "Name": f"scalepayments-payment-service-{self.environment}",
              "Environment": self.environment,
              "Service": "PaymentService"
          },
          opts=ResourceOptions(parent=self, depends_on=[self.alb_listener])
      )
      
      # Auto Scaling for ECS Service
      if self.environment in ["staging", "prod"]:
          self._create_auto_scaling()

    
    def _create_auto_scaling(self):
        """Create auto scaling for ECS services"""
        # Create auto scaling target
        self.auto_scaling_target = aws.appautoscaling.Target(
            f"scalepayments-payment-autoscaling-target-{self.environment}",
            max_capacity=self.current_config["max_capacity"],
            min_capacity=self.current_config["desired_count"],
            resource_id=pulumi.Output.concat("service/", self.ecs_cluster.name, "/", self.payment_service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=ResourceOptions(parent=self)
        )
        
        # CPU-based scaling policy
        self.cpu_scaling_policy = aws.appautoscaling.Policy(
            f"scalepayments-payment-cpu-scaling-{self.environment}",
            name=f"scalepayments-payment-cpu-scaling-{self.environment}",
            policy_type="TargetTrackingScaling",
            resource_id=self.auto_scaling_target.resource_id,
            scalable_dimension=self.auto_scaling_target.scalable_dimension,
            service_namespace=self.auto_scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageCPUUtilization"
                ),
                target_value=70.0,
                scale_in_cooldown=300,
                scale_out_cooldown=300
            ),
            opts=ResourceOptions(parent=self)
        )
        
        # Memory-based scaling policy
        self.memory_scaling_policy = aws.appautoscaling.Policy(
            f"scalepayments-payment-memory-scaling-{self.environment}",
            name=f"scalepayments-payment-memory-scaling-{self.environment}",
            policy_type="TargetTrackingScaling",
            resource_id=self.auto_scaling_target.resource_id,
            scalable_dimension=self.auto_scaling_target.scalable_dimension,
            service_namespace=self.auto_scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type="ECSServiceAverageMemoryUtilization"
                ),
                target_value=80.0,
                scale_in_cooldown=300,
                scale_out_cooldown=300
            ),
            opts=ResourceOptions(parent=self)
        )
    
    def _setup_monitoring(self):
        """Setup CloudWatch monitoring and alarms"""
        if not self.current_config["enable_logging"]:
            return
        
        # High CPU utilization alarm
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"scalepayments-high-cpu-{self.environment}",
            name=f"scalepayments-high-cpu-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="High CPU utilization for ECS service",
            dimensions={
                "ServiceName": f"scalepayments-payment-service-{self.environment}",
                "ClusterName": f"scalepayments-cluster-{self.environment}"
            },
            tags={
                "Environment": self.environment,
                "Service": "ECS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Database connection alarm
        self.db_connection_alarm = aws.cloudwatch.MetricAlarm(
            f"scalepayments-db-connections-{self.environment}",
            name=f"scalepayments-db-connections-{self.environment}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80.0,
            alarm_description="High database connections",
            dimensions={
                "DBInstanceIdentifier": f"scalepayments-db-{self.environment}"
            },
            tags={
                "Environment": self.environment,
                "Service": "RDS"
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Cache hit ratio alarm (low hit ratio indicates potential issues)
        self.cache_hit_ratio_alarm = aws.cloudwatch.MetricAlarm(
            f"scalepayments-cache-hit-ratio-{self.environment}",
            name=f"scalepayments-cache-hit-ratio-{self.environment}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=3,
            metric_name="CacheHitRate",
            namespace="AWS/ElastiCache",
            period=300,
            statistic="Average",
            threshold=0.8,
            alarm_description="Low cache hit ratio",
            dimensions={
                "CacheClusterId": f"scalepayments-cache-{self.environment}"
            },
            tags={
                "Environment": self.environment,
                "Service": "ElastiCache"
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _export_outputs(self):
        """Export stack outputs"""
        # Create outputs dictionary
        outputs = {
            "vpc_id": self.vpc.id,
            "vpc_cidr": self.vpc.cidr_block,
            "public_subnet_ids": [subnet.id for subnet in self.public_subnets],
            "private_subnet_ids": [subnet.id for subnet in self.private_subnets],
            "ecs_cluster_name": self.ecs_cluster.name,
            "ecs_cluster_arn": self.ecs_cluster.arn,
            "payment_service_name": self.payment_service.name,
            "payment_service_arn": self.payment_service.id,
            "alb_dns_name": self.alb.dns_name,
            "alb_zone_id": self.alb.zone_id,
            "alb_arn": self.alb.arn,
            "rds_endpoint": self.rds_instance.endpoint,
            "rds_port": self.rds_instance.port,
            "rds_instance_id": self.rds_instance.id,
            "elasticache_endpoint": self.elasticache_cluster.primary_endpoint_address,
            "elasticache_port": self.elasticache_cluster.port,
            "environment": self.environment,
            "region": self.region
        }
        
        # Export each output
        for key, value in outputs.items():
            export(key, value)
        
        # Write flat outputs to JSON file for testing
        self._write_flat_outputs(outputs)
    
    def _write_flat_outputs(self, outputs: Dict[str, Any]):
        """Write flat outputs to JSON file for testing purposes"""
        # Create cfn-outputs directory if it doesn't exist
        os.makedirs("cfn-outputs", exist_ok=True)
        
        # Convert Pulumi outputs to flat structure for testing
        flat_outputs = {}
        
        def flatten_output(key: str, value: Any):
            if isinstance(value, Output):
                # For Pulumi outputs, we'll use a placeholder that tests can mock
                flat_outputs[key] = f"<Pulumi Output: {key}>"
            elif isinstance(value, list):
                for i, item in enumerate(value):
                    flatten_output(f"{key}_{i}", item)
            else:
                flat_outputs[key] = str(value) if value is not None else None
        
        for key, value in outputs.items():
            flatten_output(key, value)
        
        # Write to file
        flat_outputs_file = "cfn-outputs/flat-outputs.json"
        try:
            with open(flat_outputs_file, 'w') as f:
                json.dump(flat_outputs, f, indent=2)
        except Exception as e:
            # In case of file system issues, just log the error
            print(f"Warning: Could not write flat outputs to {flat_outputs_file}: {e}")

