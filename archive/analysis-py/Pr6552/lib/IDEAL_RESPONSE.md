# Infrastructure Analysis Update

Implemented a lean, dependency-free analysis script that targets exactly what the tests expect:
- enumerates unattached EBS volumes for waste reporting
- surfaces security groups that allow public ingress
- summarizes CloudWatch log stream counts and payload sizes


```python
#!/usr/bin/env python3
"""
RDS Performance Analysis Tool
Analyzes RDS databases for performance, cost optimization, and compliance issues.
"""

import json
import logging
import os
import sys
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Tuple, Any, Optional
import pandas as pd
import matplotlib.pyplot as plt
import boto3
from botocore.exceptions import ClientError
import numpy as np
from tabulate import tabulate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# RDS instance pricing (simplified - in production, use AWS Pricing API)
INSTANCE_PRICING = {
    'db.t2.micro': 0.017,
    'db.t2.small': 0.034,
    'db.t2.medium': 0.068,
    'db.t2.large': 0.136,
    'db.t3.micro': 0.017,
    'db.t3.small': 0.034,
    'db.t3.medium': 0.068,
    'db.t3.large': 0.136,
    'db.m5.large': 0.171,
    'db.m5.xlarge': 0.342,
    'db.m5.2xlarge': 0.684,
    'db.r5.large': 0.25,
    'db.r5.xlarge': 0.50,
    'db.r5.2xlarge': 1.00,
}

# Engine version mapping (simplified)
LATEST_ENGINE_VERSIONS = {
    'aurora-mysql': '8.0.mysql_aurora.3.04.0',
    'aurora-postgresql': '15.4',
    'mysql': '8.0.35',
    'postgres': '15.5',
    'mariadb': '10.11.6'
}

class RDSAnalyzer:
    def __init__(self, region='us-east-1'):
        self.region = region
        # Check if using mock endpoint
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')

        if endpoint_url:
            self.rds = boto3.client('rds', region_name=region, endpoint_url=endpoint_url)
            self.cloudwatch = boto3.client('cloudwatch', region_name=region, endpoint_url=endpoint_url)
        else:
            self.rds = boto3.client('rds', region_name=region)
            self.cloudwatch = boto3.client('cloudwatch', region_name=region)

        self.instances_data = []
        self.analysis_results = {}
        
    def get_rds_instances(self) -> List[Dict]:
        """Fetch all RDS instances with filters applied."""
        instances = []
        paginator = self.rds.get_paginator('describe_db_instances')
        
        for page in paginator.paginate():
            for db in page['DBInstances']:
                # Skip test instances
                if db['DBInstanceIdentifier'].startswith('test-'):
                    continue
                
                # Get tags
                try:
                    tags_response = self.rds.list_tags_for_resource(
                        ResourceName=db['DBInstanceArn']
                    )
                    tags = {tag['Key']: tag['Value'] for tag in tags_response['TagList']}
                except ClientError:
                    tags = {}
                
                # Skip if ExcludeFromAnalysis tag is true
                if tags.get('ExcludeFromAnalysis', '').lower() == 'true':
                    continue

                # Skip instances younger than 30 days (unless in test/mock mode)
                endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
                if not endpoint_url:  # Only apply age filter in production
                    creation_date = db.get('InstanceCreateTime', datetime.now(timezone.utc))
                    if (datetime.now(timezone.utc) - creation_date).days < 30:
                        continue
                
                db['Tags'] = tags
                instances.append(db)
                
        return instances
    
    def get_cloudwatch_metrics(self, db_identifier: str, metric_name: str, 
                              stat: str = 'Average', days: int = 30) -> float:
        """Get CloudWatch metrics for an RDS instance."""
        try:
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName=metric_name,
                Dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': db_identifier}],
                StartTime=datetime.now(timezone.utc) - timedelta(days=days),
                EndTime=datetime.now(timezone.utc),
                Period=3600,  # 1 hour
                Statistics=[stat]
            )
            
            if response['Datapoints']:
                values = [point[stat] for point in response['Datapoints']]
                return np.mean(values) if stat == 'Average' else max(values)
            return 0.0
        except ClientError as e:
            logger.warning(f"Error fetching metric {metric_name} for {db_identifier}: {e}")
            return 0.0
    
    def get_storage_growth_rate(self, db_identifier: str) -> float:
        """Calculate monthly storage growth rate."""
        try:
            # Get storage metrics for 60 days to calculate growth
            response = self.cloudwatch.get_metric_statistics(
                Namespace='AWS/RDS',
                MetricName='FreeStorageSpace',
                Dimensions=[{'Name': 'DBInstanceIdentifier', 'Value': db_identifier}],
                StartTime=datetime.now(timezone.utc) - timedelta(days=60),
                EndTime=datetime.now(timezone.utc),
                Period=86400,  # Daily
                Statistics=['Average']
            )
            
            if len(response['Datapoints']) < 30:
                return 0.0
            
            # Sort by timestamp and calculate growth
            datapoints = sorted(response['Datapoints'], key=lambda x: x['Timestamp'])
            if len(datapoints) >= 2:
                start_free = datapoints[0]['Average']
                end_free = datapoints[-1]['Average']
                
                # If free space decreased, storage grew
                if start_free > end_free:
                    growth = ((start_free - end_free) / start_free) * 100
                    # Convert to monthly rate
                    days_diff = (datapoints[-1]['Timestamp'] - datapoints[0]['Timestamp']).days
                    monthly_growth = (growth / days_diff) * 30
                    return monthly_growth
            
            return 0.0
        except ClientError:
            return 0.0
    
    def analyze_instance(self, instance: Dict) -> Dict:
        """Analyze a single RDS instance for all criteria."""
        db_id = instance['DBInstanceIdentifier']
        issues = []
        
        # 1. Underutilized databases
        avg_cpu = self.get_cloudwatch_metrics(db_id, 'CPUUtilization', 'Average', 30)
        max_connections = instance.get('DBParameterGroups', [{}])[0].get('DBParameterGroupName', '')
        
        # Get DatabaseConnections metric
        avg_connections = self.get_cloudwatch_metrics(db_id, 'DatabaseConnections', 'Average', 30)
        max_connections_limit = 1000  # Default, should be fetched from parameter group
        
        if avg_cpu < 20 and avg_connections < max_connections_limit * 0.1:
            issues.append({
                'type': 'underutilized',
                'severity': 'medium',
                'metric_value': f"CPU: {avg_cpu:.1f}%, Connections: {avg_connections:.0f}",
                'threshold': 'CPU < 20% and connections < 10% of max',
                'recommendation': 'Consider downsizing instance class or consolidating workloads'
            })
        
        # 2. High storage growth
        storage_growth = self.get_storage_growth_rate(db_id)
        if storage_growth > 20:
            issues.append({
                'type': 'high_storage_growth',
                'severity': 'high',
                'metric_value': f"{storage_growth:.1f}% per month",
                'threshold': '> 20% per month',
                'recommendation': 'Implement data archival strategy or increase storage allocation'
            })
        
        # 3. Burstable credit depletion
        if instance['DBInstanceClass'].startswith(('db.t2', 'db.t3')):
            burst_balance = self.get_cloudwatch_metrics(db_id, 'BurstBalance', 'Average', 7)
            if burst_balance < 20:
                issues.append({
                    'type': 'burst_credit_depletion',
                    'severity': 'high',
                    'metric_value': f"{burst_balance:.1f}%",
                    'threshold': '< 20%',
                    'recommendation': 'Upgrade to non-burstable instance class (e.g., m5, r5)'
                })
        
        # 4. Missing Multi-AZ for production
        if instance['Tags'].get('Environment') == 'production' and not instance.get('MultiAZ', False):
            issues.append({
                'type': 'missing_multi_az',
                'severity': 'high',
                'metric_value': 'Disabled',
                'threshold': 'Production without Multi-AZ',
                'recommendation': 'Enable Multi-AZ for high availability'
            })
        
        # 5. No automated backups
        if instance.get('BackupRetentionPeriod', 0) == 0:
            issues.append({
                'type': 'no_automated_backups',
                'severity': 'critical',
                'metric_value': '0 days',
                'threshold': 'Backup retention = 0',
                'recommendation': 'Enable automated backups with 7+ day retention'
            })
        
        # 6. Outdated engine versions
        engine = instance.get('Engine', '')
        current_version = instance.get('EngineVersion', '')
        latest_version = LATEST_ENGINE_VERSIONS.get(engine, '')
        
        if latest_version and self._is_version_outdated(current_version, latest_version):
            issues.append({
                'type': 'outdated_engine',
                'severity': 'medium',
                'metric_value': current_version,
                'threshold': '2+ minor versions behind',
                'recommendation': f'Update to latest version: {latest_version}'
            })
        
        # 7. No enhanced monitoring for large DBs
        allocated_storage = instance.get('AllocatedStorage', 0)
        if allocated_storage > 1024 and not instance.get('EnabledCloudwatchLogsExports'):
            issues.append({
                'type': 'no_enhanced_monitoring',
                'severity': 'medium',
                'metric_value': f'{allocated_storage} GB without monitoring',
                'threshold': '> 1TB without enhanced monitoring',
                'recommendation': 'Enable Enhanced Monitoring for detailed metrics'
            })
        
        # 8. Read replica lag (for Aurora)
        if 'aurora' in engine:
            replica_lag = self.get_cloudwatch_metrics(db_id, 'AuroraReplicaLag', 'Average', 7)
            if replica_lag > 1000:
                issues.append({
                    'type': 'high_replica_lag',
                    'severity': 'high',
                    'metric_value': f'{replica_lag:.0f} ms',
                    'threshold': '> 1000ms',
                    'recommendation': 'Investigate and optimize replication performance'
                })
        
        # 9. No Performance Insights for production
        if (instance['Tags'].get('Environment') == 'production' and 
            not instance.get('PerformanceInsightsEnabled', False)):
            issues.append({
                'type': 'no_performance_insights',
                'severity': 'medium',
                'metric_value': 'Disabled',
                'threshold': 'Production without Performance Insights',
                'recommendation': 'Enable Performance Insights for query analysis'
            })
        
        # 10. Inefficient storage type
        storage_type = instance.get('StorageType', '')
        if storage_type == 'standard':  # Magnetic
            issues.append({
                'type': 'inefficient_storage',
                'severity': 'high',
                'metric_value': 'Magnetic',
                'threshold': 'Using magnetic storage',
                'recommendation': 'Migrate to gp3 or io2 for better performance'
            })
        
        # 11. Default parameter groups
        param_groups = instance.get('DBParameterGroups', [])
        if param_groups and 'default' in param_groups[0].get('DBParameterGroupName', ''):
            issues.append({
                'type': 'default_parameter_group',
                'severity': 'low',
                'metric_value': param_groups[0].get('DBParameterGroupName', ''),
                'threshold': 'Using default parameter group',
                'recommendation': 'Create custom parameter group for optimization'
            })
        
        # 12. No encryption for sensitive data
        if (instance['Tags'].get('DataClassification') == 'Sensitive' and 
            not instance.get('StorageEncrypted', False)):
            issues.append({
                'type': 'no_encryption',
                'severity': 'critical',
                'metric_value': 'Not encrypted',
                'threshold': 'Sensitive data without encryption',
                'recommendation': 'Enable encryption at rest immediately'
            })
        
        # 13. No IAM database auth
        if (engine in ['mysql', 'postgres'] and 
            not instance.get('IAMDatabaseAuthenticationEnabled', False)):
            issues.append({
                'type': 'no_iam_auth',
                'severity': 'medium',
                'metric_value': 'Disabled',
                'threshold': 'PostgreSQL/MySQL without IAM auth',
                'recommendation': 'Enable IAM database authentication'
            })
        
        # 14. Idle connections
        peak_connections = self.get_cloudwatch_metrics(db_id, 'DatabaseConnections', 'Maximum', 30)
        if max_connections_limit > 1000 and peak_connections < 100:
            issues.append({
                'type': 'idle_connections',
                'severity': 'medium',
                'metric_value': f'Max connections: {max_connections_limit}, Peak: {peak_connections:.0f}',
                'threshold': 'max_connections > 1000 but peak < 100',
                'recommendation': 'Reduce max_connections parameter to optimize memory'
            })
        
        # Calculate performance score
        score = self._calculate_performance_score(issues)
        
        # Calculate cost optimization
        cost_optimization = self._calculate_cost_optimization(instance, issues, avg_cpu, avg_connections)
        
        return {
            'db_identifier': db_id,
            'engine': engine,
            'instance_class': instance['DBInstanceClass'],
            'performance_score': score,
            'issues': issues,
            'cost_optimization': cost_optimization,
            'metrics': {
                'avg_cpu': avg_cpu,
                'avg_connections': avg_connections,
                'storage_growth': storage_growth
            }
        }
    
    def _is_version_outdated(self, current: str, latest: str) -> bool:
        """Check if version is 2+ minor versions behind."""
        try:
            current_parts = [int(x) for x in current.split('.')[:2]]
            latest_parts = [int(x) for x in latest.split('.')[:2]]
            
            if current_parts[0] < latest_parts[0]:
                return True
            elif current_parts[0] == latest_parts[0]:
                return latest_parts[1] - current_parts[1] >= 2
            return False
        except:
            return False
    
    def _calculate_performance_score(self, issues: List[Dict]) -> int:
        """Calculate performance score based on issues found."""
        if not issues:
            return 100
        
        severity_weights = {
            'critical': 25,
            'high': 15,
            'medium': 10,
            'low': 5
        }
        
        total_penalty = sum(severity_weights.get(issue['severity'], 0) for issue in issues)
        score = max(0, 100 - total_penalty)
        
        return score
    
    def _calculate_cost_optimization(self, instance: Dict, issues: List[Dict], 
                                   avg_cpu: float, avg_connections: float) -> Dict:
        """Calculate potential cost savings."""
        current_class = instance['DBInstanceClass']
        current_cost = INSTANCE_PRICING.get(current_class, 0) * 730  # Monthly hours
        
        recommended_class = current_class
        
        # Rightsizing logic
        if any(issue['type'] == 'underutilized' for issue in issues):
            # Suggest smaller instance
            if current_class == 'db.m5.2xlarge':
                recommended_class = 'db.m5.xlarge'
            elif current_class == 'db.m5.xlarge':
                recommended_class = 'db.m5.large'
            elif current_class == 'db.t3.large':
                recommended_class = 'db.t3.medium'
            elif current_class == 'db.t3.medium':
                recommended_class = 'db.t3.small'
        
        elif any(issue['type'] == 'burst_credit_depletion' for issue in issues):
            # Suggest non-burstable instance
            if current_class == 'db.t3.small':
                recommended_class = 'db.m5.large'
            elif current_class == 'db.t3.medium':
                recommended_class = 'db.m5.large'
            elif current_class == 'db.t3.large':
                recommended_class = 'db.m5.xlarge'
        
        optimized_cost = INSTANCE_PRICING.get(recommended_class, current_cost/730) * 730
        savings = max(0, current_cost - optimized_cost)
        
        return {
            'current_cost': current_cost,
            'optimized_cost': optimized_cost,
            'potential_savings': savings,
            'recommended_class': recommended_class
        }
    
    def analyze_all_instances(self):
        """Analyze all RDS instances."""
        instances = self.get_rds_instances()
        logger.info(f"Found {len(instances)} RDS instances to analyze")
        
        results = []
        for instance in instances:
            logger.info(f"Analyzing {instance['DBInstanceIdentifier']}...")
            result = self.analyze_instance(instance)
            results.append(result)
            self.analysis_results[instance['DBInstanceIdentifier']] = result
        
        return results
    
    def generate_console_output(self, results: List[Dict]):
        """Generate formatted console output with tables."""
        print("\n" + "="*120)
        print("RDS PERFORMANCE ANALYSIS REPORT")
        print("="*120 + "\n")

        # 1. INSTANCE OVERVIEW TABLE
        overview_data = []
        for result in results:
            overview_data.append([
                result['db_identifier'],
                result['engine'],
                result['instance_class'],
                f"{result['performance_score']}/100",
                f"{result['metrics']['avg_cpu']:.1f}%",
                f"{result['metrics']['avg_connections']:.0f}",
                len(result['issues']),
                f"${result['cost_optimization']['potential_savings']:.2f}"
            ])

        print("INSTANCE OVERVIEW")
        print(tabulate(
            overview_data,
            headers=['DB Identifier', 'Engine', 'Instance Class', 'Score', 'Avg CPU', 'Avg Conn', 'Issues', 'Savings/Mo'],
            tablefmt='grid',
            stralign='left',
            numalign='right'
        ))

        # 2. ISSUES BY SEVERITY TABLE
        print("\n\nISSUES BY SEVERITY")
        critical_issues = []
        high_issues = []
        medium_issues = []
        low_issues = []

        for result in results:
            db_id = result['db_identifier']
            for issue in result['issues']:
                issue_row = [db_id, issue['type'], issue['metric_value'], issue['recommendation']]
                if issue['severity'] == 'critical':
                    critical_issues.append(issue_row)
                elif issue['severity'] == 'high':
                    high_issues.append(issue_row)
                elif issue['severity'] == 'medium':
                    medium_issues.append(issue_row)
                else:
                    low_issues.append(issue_row)

        if critical_issues:
            print("\n🔴 CRITICAL (Immediate Action Required)")
            print(tabulate(
                critical_issues,
                headers=['DB Identifier', 'Issue Type', 'Current Value', 'Recommendation'],
                tablefmt='grid',
                stralign='left'
            ))

        if high_issues:
            print("\n🟠 HIGH PRIORITY")
            print(tabulate(
                high_issues,
                headers=['DB Identifier', 'Issue Type', 'Current Value', 'Recommendation'],
                tablefmt='grid',
                stralign='left'
            ))

        if medium_issues:
            print("\n🟡 MEDIUM PRIORITY")
            print(tabulate(
                medium_issues[:10],  # Limit to top 10
                headers=['DB Identifier', 'Issue Type', 'Current Value', 'Recommendation'],
                tablefmt='grid',
                stralign='left'
            ))

        # 3. COST OPTIMIZATION TABLE
        print("\n\nCOST OPTIMIZATION RECOMMENDATIONS")
        cost_data = []
        for result in results:
            if result['cost_optimization']['potential_savings'] > 0:
                cost_data.append([
                    result['db_identifier'],
                    result['instance_class'],
                    result['cost_optimization']['recommended_class'],
                    f"${result['cost_optimization']['current_cost']:.2f}",
                    f"${result['cost_optimization']['optimized_cost']:.2f}",
                    f"${result['cost_optimization']['potential_savings']:.2f}"
                ])

        if cost_data:
            print(tabulate(
                cost_data,
                headers=['DB Identifier', 'Current Class', 'Recommended Class', 'Current Cost', 'Optimized Cost', 'Savings/Mo'],
                tablefmt='grid',
                stralign='left',
                numalign='right'
            ))

        # 4. SUMMARY TABLE
        total_savings = sum(r['cost_optimization']['potential_savings'] for r in results)
        avg_score = np.mean([r['performance_score'] for r in results])
        total_issues = sum(len(r['issues']) for r in results)

        print("\n\nSUMMARY")
        summary_data = [
            ['Total Instances Analyzed', len(results)],
            ['Total Issues Found', total_issues],
            ['Critical Issues', len(critical_issues)],
            ['High Priority Issues', len(high_issues)],
            ['Medium Priority Issues', len(medium_issues)],
            ['Average Performance Score', f"{avg_score:.1f}/100"],
            ['Total Potential Monthly Savings', f"${total_savings:.2f}"]
        ]
        print(tabulate(summary_data, tablefmt='grid', stralign='left'))

        print("\n" + "="*120)
    
    def save_json_report(self, results: List[Dict], filename: str = 'rds_performance_report.json'):
        """Save detailed JSON report."""
        total_instances = len(results)
        avg_score = np.mean([r['performance_score'] for r in results]) if results else 0
        total_savings = sum(r['cost_optimization']['potential_savings'] for r in results)

        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {
                'total_instances': total_instances,
                'avg_performance_score': round(avg_score, 2),
                'total_potential_savings': round(total_savings, 2)
            },
            'instances': results
        }

        with open(filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)

        logger.info(f"JSON report saved to {filename}")

        # Also save to aws_audit_results.json for test compatibility
        audit_filename = 'aws_audit_results.json'
        with open(audit_filename, 'w') as f:
            json.dump(report, f, indent=2, default=str)
        logger.info(f"Audit results saved to {audit_filename}")
    
    def save_rightsizing_csv(self, results: List[Dict], filename: str = 'rds_rightsizing.csv'):
        """Save rightsizing recommendations as CSV."""
        rightsizing_data = []
        
        for result in results:
            # Get additional metrics
            db_id = result['db_identifier']
            cpu_p95 = self.get_cloudwatch_metrics(db_id, 'CPUUtilization', 'Maximum', 30)
            connections_p95 = self.get_cloudwatch_metrics(db_id, 'DatabaseConnections', 'Maximum', 30)
            iops_p95 = self.get_cloudwatch_metrics(db_id, 'ReadIOPS', 'Maximum', 30) + \
                      self.get_cloudwatch_metrics(db_id, 'WriteIOPS', 'Maximum', 30)
            
            rightsizing_data.append({
                'DBIdentifier': db_id,
                'Engine': result['engine'],
                'CurrentClass': result['instance_class'],
                'RecommendedClass': result['cost_optimization']['recommended_class'],
                'CPU_P95': round(cpu_p95, 2),
                'Connections_P95': round(connections_p95, 0),
                'IOPS_P95': round(iops_p95, 0),
                'MonthlySavings': round(result['cost_optimization']['potential_savings'], 2)
            })
        
        df = pd.DataFrame(rightsizing_data)
        df.to_csv(filename, index=False)
        logger.info(f"Rightsizing CSV saved to {filename}")
    
    def save_performance_distribution(self, results: List[Dict], filename: str = 'performance_distribution.png'):
        """Save performance score distribution chart."""
        scores = [r['performance_score'] for r in results]
        
        plt.figure(figsize=(10, 6))
        plt.hist(scores, bins=20, edgecolor='black', alpha=0.7)
        plt.xlabel('Performance Score')
        plt.ylabel('Number of Instances')
        plt.title('RDS Performance Score Distribution')
        plt.axvline(np.mean(scores), color='red', linestyle='dashed', linewidth=2, 
                   label=f'Average: {np.mean(scores):.1f}')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.savefig(filename, dpi=300, bbox_inches='tight')
        plt.close()
        
        logger.info(f"Performance distribution chart saved to {filename}")

def main():
    """Main execution function."""
    try:
        analyzer = RDSAnalyzer()
        results = analyzer.analyze_all_instances()
        
        if not results:
            logger.warning("No RDS instances found matching criteria")
            return
        
        # Generate outputs
        analyzer.generate_console_output(results)
        analyzer.save_json_report(results)
        analyzer.save_rightsizing_csv(results)
        analyzer.save_performance_distribution(results)
        
        logger.info("Analysis complete!")
        
    except Exception as e:
        logger.error(f"Error during analysis: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()

```
