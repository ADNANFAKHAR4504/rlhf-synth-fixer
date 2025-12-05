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
