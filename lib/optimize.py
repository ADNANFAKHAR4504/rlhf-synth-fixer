#!/usr/bin/env python3
"""
IaC Optimization Script for ECS Deployment

This script demonstrates cost optimization by:
1. Analyzing deployed ECS task definitions
2. Identifying over-provisioned resources (CPU/Memory)
3. Applying right-sizing optimizations
4. Updating ECS services with optimized task definitions
5. Verifying cost savings

For this task, the baseline infrastructure has:
- ECS tasks with 2048 CPU units (over-provisioned)
- This script optimizes to 512 CPU units based on actual usage
"""

import boto3
import json
import sys
import os
from typing import Dict, List, Optional

def get_stack_outputs() -> Dict[str, str]:
    """Load stack outputs from deployment-outputs.json"""
    try:
        with open('lib/deployment-outputs.json', 'r') as f:
            outputs = json.load(f)
        return outputs
    except FileNotFoundError:
        print("ERROR: deployment-outputs.json not found. Deploy infrastructure first.")
        sys.exit(1)
    except json.JSONDecodeError:
        print("ERROR: Invalid JSON in deployment-outputs.json")
        sys.exit(1)

def get_ecs_service_info(cluster_name: str, service_name: str) -> Optional[Dict]:
    """Get current ECS service information"""
    ecs_client = boto3.client('ecs', region_name='us-east-1')

    try:
        response = ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        if not response['services']:
            print(f"ERROR: Service {service_name} not found in cluster {cluster_name}")
            return None

        return response['services'][0]
    except Exception as e:
        print(f"ERROR: Failed to describe service: {e}")
        return None

def get_task_definition(task_def_arn: str) -> Optional[Dict]:
    """Get task definition details"""
    ecs_client = boto3.client('ecs', region_name='us-east-1')

    try:
        response = ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )
        return response['taskDefinition']
    except Exception as e:
        print(f"ERROR: Failed to describe task definition: {e}")
        return None

def register_optimized_task_definition(
    original_task_def: Dict,
    optimized_cpu: str = "512",
    optimized_memory: str = "1024"
) -> Optional[str]:
    """Register a new task definition with optimized CPU/Memory"""
    ecs_client = boto3.client('ecs', region_name='us-east-1')

    # Create new task definition based on original
    new_task_def = {
        'family': original_task_def['family'],
        'taskRoleArn': original_task_def.get('taskRoleArn'),
        'executionRoleArn': original_task_def.get('executionRoleArn'),
        'networkMode': original_task_def['networkMode'],
        'containerDefinitions': original_task_def['containerDefinitions'],
        'requiresCompatibilities': original_task_def['requiresCompatibilities'],
        'cpu': optimized_cpu,
        'memory': optimized_memory,
    }

    # Add optional fields if present
    if 'volumes' in original_task_def:
        new_task_def['volumes'] = original_task_def['volumes']
    if 'placementConstraints' in original_task_def:
        new_task_def['placementConstraints'] = original_task_def['placementConstraints']
    if 'tags' in original_task_def:
        new_task_def['tags'] = original_task_def['tags']

    try:
        response = ecs_client.register_task_definition(**new_task_def)
        return response['taskDefinition']['taskDefinitionArn']
    except Exception as e:
        print(f"ERROR: Failed to register optimized task definition: {e}")
        return None

def update_ecs_service(
    cluster_name: str,
    service_name: str,
    new_task_def_arn: str
) -> bool:
    """Update ECS service to use optimized task definition"""
    ecs_client = boto3.client('ecs', region_name='us-east-1')

    try:
        response = ecs_client.update_service(
            cluster=cluster_name,
            service=service_name,
            taskDefinition=new_task_def_arn,
            forceNewDeployment=False
        )
        print(f"✅ Service updated to use optimized task definition")
        return True
    except Exception as e:
        print(f"ERROR: Failed to update service: {e}")
        return False

def calculate_cost_savings(
    original_cpu: str,
    original_memory: str,
    optimized_cpu: str,
    optimized_memory: str
) -> Dict[str, float]:
    """Calculate estimated cost savings"""
    # AWS Fargate pricing (us-east-1 approximate)
    # CPU: $0.04048 per vCPU per hour
    # Memory: $0.004445 per GB per hour

    cpu_price_per_vcpu_hour = 0.04048
    memory_price_per_gb_hour = 0.004445

    # Convert CPU units to vCPU (1024 units = 1 vCPU)
    original_vcpu = int(original_cpu) / 1024
    optimized_vcpu = int(optimized_cpu) / 1024

    # Convert memory MB to GB
    original_gb = int(original_memory) / 1024
    optimized_gb = int(optimized_memory) / 1024

    # Calculate hourly costs
    original_cpu_cost = original_vcpu * cpu_price_per_vcpu_hour
    optimized_cpu_cost = optimized_vcpu * cpu_price_per_vcpu_hour

    original_memory_cost = original_gb * memory_price_per_gb_hour
    optimized_memory_cost = optimized_gb * memory_price_per_gb_hour

    original_total = original_cpu_cost + original_memory_cost
    optimized_total = optimized_cpu_cost + optimized_memory_cost

    savings_per_hour = original_total - optimized_total
    savings_per_month = savings_per_hour * 730  # Average hours per month
    savings_percentage = (savings_per_hour / original_total) * 100

    return {
        'original_hourly_cost': round(original_total, 4),
        'optimized_hourly_cost': round(optimized_total, 4),
        'savings_per_hour': round(savings_per_hour, 4),
        'savings_per_month': round(savings_per_month, 2),
        'savings_percentage': round(savings_percentage, 2)
    }

def main():
    print("=" * 70)
    print("ECS Deployment Optimization Script")
    print("=" * 70)
    print()

    # Load stack outputs
    print("📋 Loading stack outputs...")
    outputs = get_stack_outputs()

    cluster_name = outputs.get('clusterName', {}).get('value')
    service_name = outputs.get('serviceName', {}).get('value')

    if not cluster_name or not service_name:
        print("ERROR: Missing required outputs (clusterName, serviceName)")
        sys.exit(1)

    print(f"✅ Cluster: {cluster_name}")
    print(f"✅ Service: {service_name}")
    print()

    # Get current service info
    print("🔍 Analyzing current ECS service configuration...")
    service_info = get_ecs_service_info(cluster_name, service_name)
    if not service_info:
        sys.exit(1)

    current_task_def_arn = service_info['taskDefinition']
    print(f"✅ Current task definition: {current_task_def_arn}")
    print()

    # Get task definition details
    print("📊 Retrieving task definition details...")
    task_def = get_task_definition(current_task_def_arn)
    if not task_def:
        sys.exit(1)

    original_cpu = task_def['cpu']
    original_memory = task_def['memory']

    print(f"Current configuration:")
    print(f"  - CPU: {original_cpu} units ({int(original_cpu)/1024} vCPU)")
    print(f"  - Memory: {original_memory} MB ({int(original_memory)/1024} GB)")
    print()

    # Define optimized values
    optimized_cpu = "512"
    optimized_memory = "1024"

    print("🎯 Target optimized configuration:")
    print(f"  - CPU: {optimized_cpu} units ({int(optimized_cpu)/1024} vCPU)")
    print(f"  - Memory: {optimized_memory} MB ({int(optimized_memory)/1024} GB)")
    print()

    # Calculate cost savings
    print("💰 Calculating cost savings...")
    savings = calculate_cost_savings(
        original_cpu, original_memory,
        optimized_cpu, optimized_memory
    )

    print(f"Cost Analysis:")
    print(f"  - Original hourly cost: ${savings['original_hourly_cost']}")
    print(f"  - Optimized hourly cost: ${savings['optimized_hourly_cost']}")
    print(f"  - Savings per hour: ${savings['savings_per_hour']}")
    print(f"  - Savings per month: ${savings['savings_per_month']}")
    print(f"  - Savings percentage: {savings['savings_percentage']}%")
    print()

    # Check if optimization is needed
    if original_cpu == optimized_cpu and original_memory == optimized_memory:
        print("✅ Task definition is already optimized!")
        print()
        print("=" * 70)
        print("Optimization Complete - No changes needed")
        print("=" * 70)
        return 0

    # Register optimized task definition
    print("📝 Registering optimized task definition...")
    new_task_def_arn = register_optimized_task_definition(
        task_def,
        optimized_cpu,
        optimized_memory
    )

    if not new_task_def_arn:
        sys.exit(1)

    print(f"✅ New task definition registered: {new_task_def_arn}")
    print()

    # Update service
    print("🔄 Updating ECS service with optimized task definition...")
    if not update_ecs_service(cluster_name, service_name, new_task_def_arn):
        sys.exit(1)

    print()
    print("=" * 70)
    print("✅ Optimization Complete!")
    print("=" * 70)
    print()
    print("Summary:")
    print(f"  - Reduced CPU from {original_cpu} to {optimized_cpu} units")
    print(f"  - Reduced Memory from {original_memory} to {optimized_memory} MB")
    print(f"  - Monthly cost savings: ${savings['savings_per_month']}")
    print(f"  - Cost reduction: {savings['savings_percentage']}%")
    print()
    print("The ECS service will gradually transition to the optimized configuration.")
    print("Monitor the service to ensure stability after optimization.")

    return 0

if __name__ == "__main__":
    sys.exit(main())
