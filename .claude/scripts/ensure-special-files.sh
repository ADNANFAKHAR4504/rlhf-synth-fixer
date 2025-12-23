#!/bin/bash
# Ensure Special Task Files Exist
# Creates required files for special task types from templates if missing

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get task type detection
TASK_INFO=$(bash .claude/scripts/detect-task-type.sh)
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to detect task type${NC}"
    exit 1
fi

IS_CICD_TASK=$(echo "$TASK_INFO" | jq -r '.is_cicd_task')
IS_OPTIMIZATION_TASK=$(echo "$TASK_INFO" | jq -r '.is_optimization_task')
IS_ANALYSIS_TASK=$(echo "$TASK_INFO" | jq -r '.is_analysis_task')
TASK_TYPE=$(echo "$TASK_INFO" | jq -r '.task_type')

echo "🔍 Detected task type: $TASK_TYPE"

CREATED_FILES=()
MISSING_FILES=()

# CI/CD Pipeline Integration Tasks
if [ "$IS_CICD_TASK" = "true" ]; then
    echo "📋 Checking CI/CD Pipeline Integration task files..."
    
    if [ ! -f "lib/ci-cd.yml" ]; then
        echo "⚠️  lib/ci-cd.yml missing, creating from template..."
        
        # Check if template exists
        if [ -f "../../templates/cicd-yml/lib/ci-cd.yml" ]; then
            cp "../../templates/cicd-yml/lib/ci-cd.yml" "lib/ci-cd.yml"
            CREATED_FILES+=("lib/ci-cd.yml")
            echo -e "${GREEN}✅ Created lib/ci-cd.yml from template${NC}"
        else
            echo -e "${YELLOW}⚠️  Template not found, creating basic ci-cd.yml...${NC}"
            mkdir -p lib
            cat > lib/ci-cd.yml <<'EOF'
# GitHub Actions CI/CD Pipeline Example
# This file demonstrates a multi-stage deployment pipeline

name: Multi-Environment Deployment Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

permissions:
  id-token: write
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Synthesize infrastructure
        run: npm run synth
      
      - name: Run unit tests
        run: npm run test
  
  deploy-dev:
    needs: build
    runs-on: ubuntu-latest
    environment: dev
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_DEV }}
          aws-region: us-east-1
      
      - name: Deploy to dev
        run: npm run deploy -- --environment dev
  
  deploy-staging:
    needs: deploy-dev
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_STAGING }}
          aws-region: us-east-1
      
      - name: Deploy to staging
        run: npm run deploy -- --environment staging
  
  deploy-prod:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment: production
    steps:
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN_PROD }}
          aws-region: us-east-1
      
      - name: Deploy to production
        run: npm run deploy -- --environment prod
EOF
            CREATED_FILES+=("lib/ci-cd.yml")
            echo -e "${GREEN}✅ Created basic lib/ci-cd.yml${NC}"
        fi
    else
        echo -e "${GREEN}✅ lib/ci-cd.yml already exists${NC}"
    fi
fi

# IaC Optimization Tasks
if [ "$IS_OPTIMIZATION_TASK" = "true" ]; then
    echo "📋 Checking IaC Optimization task files..."
    
    if [ ! -f "lib/optimize.py" ]; then
        echo "⚠️  lib/optimize.py missing, creating from template..."
        
        if [ -f "../../templates/optimize/optimize.py" ]; then
            cp "../../templates/optimize/optimize.py" "lib/optimize.py"
            CREATED_FILES+=("lib/optimize.py")
            echo -e "${GREEN}✅ Created lib/optimize.py from template${NC}"
        else
            echo -e "${YELLOW}⚠️  Template not found, creating basic optimize.py...${NC}"
            mkdir -p lib
            cat > lib/optimize.py <<'EOF'
#!/usr/bin/env python3
"""
Infrastructure Optimization Script
Optimizes deployed AWS resources to reduce costs while maintaining functionality
"""

import os
import sys
import boto3
from typing import Dict, Any, Optional

class InfrastructureOptimizer:
    def __init__(self, environment_suffix: str, region_name: str = 'us-east-1'):
        self.environment_suffix = environment_suffix
        self.region = region_name
        
        # Initialize AWS clients
        self.rds_client = boto3.client('rds', region_name=region_name)
        self.elasticache_client = boto3.client('elasticache', region_name=region_name)
        self.ecs_client = boto3.client('ecs', region_name=region_name)
        
    def optimize_aurora_database(self) -> Dict[str, Any]:
        """Optimize Aurora Serverless v2 capacity and backup retention"""
        print(f"🔍 Searching for Aurora clusters with suffix: {self.environment_suffix}")
        
        try:
            # Find Aurora clusters
            clusters = self.rds_client.describe_db_clusters()
            
            for cluster in clusters['DBClusters']:
                cluster_id = cluster['DBClusterIdentifier']
                
                # Check if this cluster belongs to our environment
                if self.environment_suffix not in cluster_id:
                    continue
                
                print(f"📊 Optimizing Aurora cluster: {cluster_id}")
                
                # Optimize capacity (reduce from baseline)
                self.rds_client.modify_db_cluster(
                    DBClusterIdentifier=cluster_id,
                    ServerlessV2ScalingConfiguration={
                        'MinCapacity': 0.5,  # Reduced from baseline 2 ACU
                        'MaxCapacity': 1.0   # Reduced from baseline 4 ACU
                    },
                    BackupRetentionPeriod=1,  # Reduced from baseline 14 days
                    ApplyImmediately=True
                )
                
                print(f"✅ Optimized {cluster_id}: MinCapacity=0.5, MaxCapacity=1.0, BackupRetention=1")
                return {'status': 'success', 'cluster_id': cluster_id}
                
        except Exception as e:
            print(f"❌ Error optimizing Aurora: {str(e)}")
            return {'status': 'error', 'message': str(e)}
        
        return {'status': 'not_found'}
    
    def get_cost_savings_estimate(self) -> Dict[str, float]:
        """Calculate estimated monthly cost savings"""
        savings = {
            'aurora_capacity': 50.0,  # ~$50/month from capacity reduction
            'aurora_backup': 10.0,     # ~$10/month from backup retention
            'total': 60.0
        }
        return savings

def main():
    # Read environment variables
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    print(f"🚀 Starting infrastructure optimization")
    print(f"   Environment: {environment_suffix}")
    print(f"   Region: {aws_region}")
    print()
    
    optimizer = InfrastructureOptimizer(environment_suffix, aws_region)
    
    # Run optimizations
    result = optimizer.optimize_aurora_database()
    
    if result['status'] == 'success':
        savings = optimizer.get_cost_savings_estimate()
        print()
        print(f"💰 Estimated monthly savings: ${savings['total']:.2f}")
        print(f"   - Aurora capacity reduction: ${savings['aurora_capacity']:.2f}")
        print(f"   - Aurora backup reduction: ${savings['aurora_backup']:.2f}")
    
    return 0 if result['status'] == 'success' else 1

if __name__ == "__main__":
    sys.exit(main())
EOF
            chmod +x lib/optimize.py
            CREATED_FILES+=("lib/optimize.py")
            echo -e "${GREEN}✅ Created basic lib/optimize.py${NC}"
        fi
    else
        echo -e "${GREEN}✅ lib/optimize.py already exists${NC}"
    fi
fi

# Infrastructure Analysis Tasks
if [ "$IS_ANALYSIS_TASK" = "true" ]; then
    echo "📋 Checking Infrastructure Analysis task files..."
    
    if [ ! -f "lib/analyse.py" ] && [ ! -f "lib/analyse.sh" ]; then
        echo "⚠️  Analysis script missing, creating lib/analyse.py..."
        
        mkdir -p lib
        cat > lib/analyse.py <<'EOF'
#!/usr/bin/env python3
"""
Infrastructure Analysis Script
Analyzes deployed AWS resources and generates recommendations
"""

import os
import sys
import boto3
from typing import Dict, List, Any

class InfrastructureAnalyzer:
    def __init__(self, environment_suffix: str, region_name: str = 'us-east-1'):
        self.environment_suffix = environment_suffix
        self.region = region_name
        
        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2', region_name=region_name)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region_name)
        
    def analyze_infrastructure(self) -> Dict[str, Any]:
        """Analyze infrastructure resources"""
        print(f"🔍 Analyzing infrastructure for: {self.environment_suffix}")
        
        analysis_results = {
            'resources_found': [],
            'metrics': {},
            'recommendations': [],
            'cost_analysis': {}
        }
        
        try:
            # Find VPCs
            vpcs = self.ec2_client.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Environment', 'Values': [self.environment_suffix]}
                ]
            )
            
            for vpc in vpcs['Vpcs']:
                vpc_id = vpc['VpcId']
                analysis_results['resources_found'].append({
                    'type': 'VPC',
                    'id': vpc_id,
                    'cidr': vpc['CidrBlock']
                })
                print(f"  ✅ Found VPC: {vpc_id}")
            
            # Add recommendations
            if len(analysis_results['resources_found']) > 0:
                analysis_results['recommendations'].append({
                    'priority': 'medium',
                    'category': 'cost',
                    'message': 'Consider using VPC endpoints to reduce NAT Gateway costs'
                })
            
        except Exception as e:
            print(f"❌ Error analyzing infrastructure: {str(e)}")
            analysis_results['error'] = str(e)
        
        return analysis_results
    
    def print_report(self, analysis: Dict[str, Any]):
        """Print analysis report"""
        print()
        print("=" * 60)
        print("Infrastructure Analysis Report")
        print("=" * 60)
        print(f"Environment: {self.environment_suffix}")
        print(f"Region: {self.region}")
        print()
        print(f"Resources Found: {len(analysis['resources_found'])}")
        for resource in analysis['resources_found']:
            print(f"  - {resource['type']}: {resource['id']}")
        print()
        print(f"Recommendations: {len(analysis['recommendations'])}")
        for rec in analysis['recommendations']:
            print(f"  [{rec['priority'].upper()}] {rec['message']}")

def main():
    environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')
    
    analyzer = InfrastructureAnalyzer(environment_suffix, aws_region)
    analysis = analyzer.analyze_infrastructure()
    analyzer.print_report(analysis)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
EOF
        chmod +x lib/analyse.py
        CREATED_FILES+=("lib/analyse.py")
        echo -e "${GREEN}✅ Created lib/analyse.py${NC}"
    else
        echo -e "${GREEN}✅ Analysis script already exists${NC}"
    fi
fi

# Summary
echo ""
echo "=========================================="
echo "📊 Special Files Summary"
echo "=========================================="
echo "Task Type: $TASK_TYPE"
echo ""

if [ ${#CREATED_FILES[@]} -gt 0 ]; then
    echo -e "${GREEN}✅ Created ${#CREATED_FILES[@]} file(s):${NC}"
    for file in "${CREATED_FILES[@]}"; do
        echo "   - $file"
    done
else
    echo -e "${GREEN}✅ All required special files already exist${NC}"
fi

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Missing ${#MISSING_FILES[@]} file(s) (could not create):${NC}"
    for file in "${MISSING_FILES[@]}"; do
        echo "   - $file"
    done
    exit 1
fi

exit 0

