```python
#!/usr/bin/env python3
"""
Infrastructure optimization script for StreamFlix development environment.
Scales down Aurora, ElastiCache, and ECS resources for cost optimization.
"""

import boto3
import time
import sys
from typing import Optional, Dict, Any
from botocore.exceptions import ClientError


class InfrastructureOptimizer:
    """Handles infrastructure optimization for StreamFlix development environment."""
    
    def __init__(self, environment_suffix: str = 'dev', region_name: str = 'us-east-1'):
        """
        Initialize the optimizer with AWS clients.
        
        Args:
            environment_suffix: The environment suffix (default: 'dev')
            region_name: AWS region name (default: 'us-east-1')
        """
        self.environment_suffix = environment_suffix
        self.region_name = region_name
        
        # Initialize AWS clients
        self.rds_client = boto3.client('rds', region_name=region_name)
        self.elasticache_client = boto3.client('elasticache', region_name=region_name)
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        
        print(f"Initialized optimizer for environment: {environment_suffix}")
        print(f"Region: {region_name}")
        print("-" * 50)
    
    def optimize_aurora_database(self) -> bool:
        """
        Optimize Aurora Serverless v2 database cluster.
        - Reduce minCapacity from 2 to 0.5 ACU
        - Reduce maxCapacity from 4 to 1 ACU
        - Reduce backup retention from 14 to 1 day
        """
        print("\n🔧 Optimizing Aurora Database...")
        
        try:
            # Find the database cluster
            clusters = self.rds_client.describe_db_clusters()
            cluster_id = None
            
            for cluster in clusters['DBClusters']:
                if f'streamflix' in cluster['DBClusterIdentifier'].lower():
                    cluster_id = cluster['DBClusterIdentifier']
                    break
            
            if not cluster_id:
                print("❌ Aurora cluster not found")
                return False
            
            print(f"Found cluster: {cluster_id}")
            
            # Update serverless v2 scaling configuration
            print("Updating serverless v2 scaling configuration...")
            self.rds_client.modify_db_cluster(
                DBClusterIdentifier=cluster_id,
                ServerlessV2ScalingConfiguration={
                    'MinCapacity': 0.5,
                    'MaxCapacity': 1.0
                },
                BackupRetentionPeriod=1,
                ApplyImmediately=True
            )
            
            print("✅ Aurora optimization complete:")
            print("   - Min capacity: 2 ACU → 0.5 ACU")
            print("   - Max capacity: 4 ACU → 1 ACU")
            print("   - Backup retention: 14 days → 1 day")
            
            # Wait for cluster to be available
            print("Waiting for cluster modification to complete...")
            waiter = self.rds_client.get_waiter('db_cluster_available')
            waiter.wait(
                DBClusterIdentifier=cluster_id,
                WaiterConfig={'Delay': 30, 'MaxAttempts': 20}
            )
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing Aurora: {e}")
            return False
    
    def optimize_elasticache_redis(self) -> bool:
        """
        Optimize ElastiCache Redis cluster.
        - Reduce numCacheClusters from 3 to 2 nodes
        """
        print("\n🔧 Optimizing ElastiCache Redis...")
        
        try:
            # Find the Redis replication group
            replication_groups = self.elasticache_client.describe_replication_groups()
            replication_group_id = None
            
            for group in replication_groups['ReplicationGroups']:
                if f'streamflix-redis-{self.environment_suffix}' in group['ReplicationGroupId']:
                    replication_group_id = group['ReplicationGroupId']
                    current_node_count = len(group['NodeGroups'][0]['NodeGroupMembers'])
                    break
            
            if not replication_group_id:
                print("❌ Redis replication group not found")
                return False
            
            print(f"Found replication group: {replication_group_id}")
            print(f"Current node count: {current_node_count}")
            
            if current_node_count <= 2:
                print("✅ Already optimized (2 or fewer nodes)")
                return True
            
            # Decrease replica count
            print("Decreasing replica count...")
            self.elasticache_client.decrease_replica_count(
                ReplicationGroupId=replication_group_id,
                NewReplicaCount=1,  # This will result in 2 total nodes (1 primary + 1 replica)
                ApplyImmediately=True
            )
            
            print("✅ ElastiCache optimization initiated:")
            print(f"   - Node count: {current_node_count} → 2")
            
            # Wait for the modification to complete
            print("Waiting for Redis cluster modification to complete...")
            time.sleep(30)  # Initial wait
            
            max_attempts = 20
            for attempt in range(max_attempts):
                response = self.elasticache_client.describe_replication_groups(
                    ReplicationGroupId=replication_group_id
                )
                status = response['ReplicationGroups'][0]['Status']
                if status == 'available':
                    print("✅ Redis cluster modification complete")
                    break
                print(f"Status: {status}. Waiting... ({attempt + 1}/{max_attempts})")
                time.sleep(30)
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing ElastiCache: {e}")
            return False
    
    def optimize_ecs_fargate(self) -> bool:
        """
        Optimize ECS Fargate service.
        - Reduce desiredCount from 3 to 2 tasks
        """
        print("\n🔧 Optimizing ECS Fargate...")
        
        try:
            # Find the ECS cluster
            clusters = self.ecs_client.list_clusters()
            cluster_arn = None
            
            for cluster in clusters['clusterArns']:
                if f'streamflix-cluster-{self.environment_suffix}' in cluster:
                    cluster_arn = cluster
                    break
            
            if not cluster_arn:
                print("❌ ECS cluster not found")
                return False
            
            print(f"Found cluster: {cluster_arn.split('/')[-1]}")
            
            # Find the service
            services = self.ecs_client.list_services(cluster=cluster_arn)
            service_arn = None
            
            for service in services['serviceArns']:
                if f'streamflix-api-{self.environment_suffix}' in service:
                    service_arn = service
                    break
            
            if not service_arn:
                print("❌ ECS service not found")
                return False
            
            service_name = service_arn.split('/')[-1]
            print(f"Found service: {service_name}")
            
            # Get current service details
            service_details = self.ecs_client.describe_services(
                cluster=cluster_arn,
                services=[service_arn]
            )
            
            current_desired_count = service_details['services'][0]['desiredCount']
            print(f"Current desired count: {current_desired_count}")
            
            if current_desired_count <= 2:
                print("✅ Already optimized (2 or fewer tasks)")
                return True
            
            # Update service
            print("Updating service desired count...")
            self.ecs_client.update_service(
                cluster=cluster_arn,
                service=service_arn,
                desiredCount=2
            )
            
            print("✅ ECS optimization complete:")
            print(f"   - Task count: {current_desired_count} → 2")
            
            # Wait for service to stabilize
            print("Waiting for service to stabilize...")
            waiter = self.ecs_client.get_waiter('services_stable')
            waiter.wait(
                cluster=cluster_arn,
                services=[service_arn],
                WaiterConfig={'Delay': 30, 'MaxAttempts': 20}
            )
            
            return True
            
        except ClientError as e:
            print(f"❌ Error optimizing ECS: {e}")
            return False
    
    def get_cost_savings_estimate(self) -> Dict[str, Any]:
        """
        Calculate estimated monthly cost savings from the optimizations.
        
        Returns:
            Dictionary with cost savings estimates
        """
        # These are rough estimates based on AWS pricing (varies by region)
        aurora_savings = {
            'original_acu_cost': 2.0 * 0.12 * 24 * 30,  # Min 2 ACU
            'optimized_acu_cost': 0.5 * 0.12 * 24 * 30,  # Min 0.5 ACU
            'backup_savings': 0.095 * 13 * 10  # ~10GB database, 13 days saved
        }
        
        elasticache_savings = {
            'node_cost': 0.024 * 24 * 30  # t4g.micro per node
        }
        
        ecs_savings = {
            'task_cost': (0.256 * 0.04048 + 0.512 * 0.004445) * 24 * 30  # 256 CPU, 512 MiB
        }
        
        total_savings = (
            (aurora_savings['original_acu_cost'] - aurora_savings['optimized_acu_cost']) +
            aurora_savings['backup_savings'] +
            elasticache_savings['node_cost'] +
            ecs_savings['task_cost']
        )
        
        return {
            'aurora_monthly_savings': round(
                (aurora_savings['original_acu_cost'] - aurora_savings['optimized_acu_cost']) + 
                aurora_savings['backup_savings'], 2
            ),
            'elasticache_monthly_savings': round(elasticache_savings['node_cost'], 2),
            'ecs_monthly_savings': round(ecs_savings['task_cost'], 2),
            'total_monthly_savings': round(total_savings, 2)
        }
    
    def run_optimization(self) -> None:
        """Run all optimization tasks."""
        print("\n🚀 Starting infrastructure optimization...")
        print("=" * 50)
        
        results = {
            'aurora': self.optimize_aurora_database(),
            'elasticache': self.optimize_elasticache_redis(),
            'ecs': self.optimize_ecs_fargate()
        }
        
        print("\n" + "=" * 50)
        print("📊 Optimization Summary:")
        print("-" * 50)
        
        success_count = sum(results.values())
        total_count = len(results)
        
        for service, success in results.items():
            status = "✅ Success" if success else "❌ Failed"
            print(f"{service.capitalize()}: {status}")
        
        print(f"\nTotal: {success_count}/{total_count} optimizations successful")
        
        if success_count == total_count:
            print("\n💰 Estimated Monthly Cost Savings:")
            print("-" * 50)
            savings = self.get_cost_savings_estimate()
            print(f"Aurora Database: ${savings['aurora_monthly_savings']}")
            print(f"ElastiCache Redis: ${savings['elasticache_monthly_savings']}")
            print(f"ECS Fargate: ${savings['ecs_monthly_savings']}")
            print(f"Total: ${savings['total_monthly_savings']}/month")
            print("\n✨ All optimizations completed successfully!")
        else:
            print("\n⚠️  Some optimizations failed. Please check the logs above.")


def main():
    """Main execution function."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Optimize StreamFlix infrastructure for development environment"
    )
    parser.add_argument(
        '--environment',
        '-e',
        default='dev',
        help='Environment suffix (default: dev)'
    )
    parser.add_argument(
        '--region',
        '-r',
        default='us-east-1',
        help='AWS region (default: us-east-1)'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Show what would be optimized without making changes'
    )
    
    args = parser.parse_args()
    
    if args.dry_run:
        print("🔍 DRY RUN MODE - No changes will be made")
        print("\nPlanned optimizations:")
        print("- Aurora: Reduce min capacity 2→0.5 ACU, max capacity 4→1 ACU, backup 14→1 days")
        print("- ElastiCache: Reduce nodes from 3→2")
        print("- ECS: Reduce tasks from 3→2")
        
        optimizer = InfrastructureOptimizer(args.environment, args.region)
        savings = optimizer.get_cost_savings_estimate()
        print(f"\nEstimated monthly savings: ${savings['total_monthly_savings']}")
        return
    
    # Confirm before proceeding
    print(f"⚠️  WARNING: This will modify production infrastructure in {args.region}")
    print(f"Environment: {args.environment}")
    confirm = input("\nAre you sure you want to proceed? (yes/no): ")
    
    if confirm.lower() != 'yes':
        print("Optimization cancelled.")
        return
    
    try:
        optimizer = InfrastructureOptimizer(args.environment, args.region)
        optimizer.run_optimization()
    except KeyboardInterrupt:
        print("\n\n⚠️  Optimization interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
```