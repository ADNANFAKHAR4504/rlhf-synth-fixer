import boto3
import json
import csv
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import logging
from typing import Dict, List, Tuple, Any
from tabulate import tabulate

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EC2CostOptimizer:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.ec2_client = boto3.client('ec2', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        self.ce_client = boto3.client('ce', region_name=region)
        self.sts_client = boto3.client('sts')

        # Get current account ID
        self.current_account_id = self.sts_client.get_caller_identity()['Account']

        # Cost savings estimates (conservative)
        self.savings_estimates = {
            'zombie_instance': 0.95,  # 95% savings from terminating
            'oversized_memory': 0.50,  # 50% savings from rightsizing
            'old_generation': 0.20,    # 20% savings from upgrading
            'stopped_with_ebs': 0.10,  # 10% of instance cost for EBS
            'missing_ri': 0.30,        # 30% savings from RIs
            'gp2_to_gp3': 0.20,       # 20% savings from gp3
            'burstable_abuse': 0.40    # 40% savings from rightsizing
        }

        self.recommendations = []
        self.total_potential_savings = 0.0

    def get_instances(self) -> List[Dict]:
        """Get all EC2 instances with their details."""
        instances = []

        try:
            paginator = self.ec2_client.get_paginator('describe_instances')
            for page in paginator.paginate():
                for reservation in page['Reservations']:
                    # Check if this is a sandbox account
                    if self._is_sandbox_account(reservation.get('OwnerId')):
                        continue

                    for instance in reservation['Instances']:
                        # Skip terminated instances
                        if instance['State']['Name'] == 'terminated':
                            continue

                        # Check exclusion tag
                        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                        if tags.get('ExcludeFromCostAnalysis', '').lower() == 'true':
                            continue

                        # Note: In production, you may want to add a check to only analyze instances
                        # older than 7 days to avoid analyzing newly launched instances
                        # For now, we analyze all instances for testing purposes

                        instances.append({
                            'InstanceId': instance['InstanceId'],
                            'InstanceType': instance['InstanceType'],
                            'State': instance['State']['Name'],
                            'LaunchTime': instance['LaunchTime'],
                            'Tags': tags,
                            'BlockDeviceMappings': instance.get('BlockDeviceMappings', []),
                            'CpuOptions': instance.get('CpuOptions', {}),
                            'Placement': instance.get('Placement', {})
                        })

            logger.info(f"Found {len(instances)} instances for analysis")
            return instances

        except Exception as e:
            logger.error(f"Error getting instances: {str(e)}")
            return []

    def _is_sandbox_account(self, account_id: str) -> bool:
        """Check if account is a sandbox account."""
        # You can customize this logic based on your sandbox naming convention
        # For now, we'll check if the account alias contains 'sandbox'
        try:
            iam = boto3.client('iam')
            aliases = iam.list_account_aliases()['AccountAliases']
            return any('sandbox' in alias.lower() for alias in aliases)
        except:
            return False

    def analyze_zombie_instances(self, instances: List[Dict]) -> None:
        """Find instances with low CPU and network usage."""
        logger.info("Analyzing zombie instances...")

        running_instances = [i for i in instances if i['State'] == 'running']
        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=14)

        for instance in running_instances:
            try:
                # Get CPU metrics
                cpu_response = self.cloudwatch_client.get_metric_statistics(
                    Namespace='AWS/EC2',
                    MetricName='CPUUtilization',
                    Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,  # 1 hour
                    Statistics=['Average']
                )

                # Get network metrics
                network_in = self.cloudwatch_client.get_metric_statistics(
                    Namespace='AWS/EC2',
                    MetricName='NetworkIn',
                    Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,
                    Statistics=['Average']
                )

                network_out = self.cloudwatch_client.get_metric_statistics(
                    Namespace='AWS/EC2',
                    MetricName='NetworkOut',
                    Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,
                    Statistics=['Average']
                )

                # Calculate averages
                avg_cpu = sum([dp['Average'] for dp in cpu_response['Datapoints']]) / len(cpu_response['Datapoints']) if cpu_response['Datapoints'] else 0
                avg_network_in = sum([dp['Average'] for dp in network_in['Datapoints']]) / len(network_in['Datapoints']) if network_in['Datapoints'] else 0
                avg_network_out = sum([dp['Average'] for dp in network_out['Datapoints']]) / len(network_out['Datapoints']) if network_out['Datapoints'] else 0

                # Convert bytes to MB
                total_network_mb = (avg_network_in + avg_network_out) / 1024 / 1024

                if avg_cpu < 10 and total_network_mb < 5:
                    monthly_cost = self._estimate_instance_cost(instance['InstanceType'])
                    savings = monthly_cost * self.savings_estimates['zombie_instance']

                    self.recommendations.append({
                        'instance_id': instance['InstanceId'],
                        'instance_type': instance['InstanceType'],
                        'action': 'terminate_zombie_instance',
                        'priority': 'high',
                        'potential_savings': savings,
                        'details': f'Average CPU: {avg_cpu:.2f}%, Network: {total_network_mb:.2f} MB/hour',
                        'tags': instance['Tags']
                    })

            except Exception as e:
                logger.error(f"Error analyzing zombie instance {instance['InstanceId']}: {str(e)}")

    def analyze_oversized_memory_instances(self, instances: List[Dict]) -> None:
        """Find memory-optimized instances with low memory utilization."""
        logger.info("Analyzing oversized memory instances...")

        memory_families = ['r5', 'r6i', 'x2']
        memory_instances = [i for i in instances if i['State'] == 'running' and
                          any(i['InstanceType'].startswith(fam) for fam in memory_families)]

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=14)

        for instance in memory_instances:
            try:
                # CloudWatch memory metrics require CloudWatch Agent
                memory_response = self.cloudwatch_client.get_metric_statistics(
                    Namespace='CWAgent',
                    MetricName='mem_used_percent',
                    Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                    StartTime=start_time,
                    EndTime=end_time,
                    Period=3600,
                    Statistics=['Average']
                )

                if memory_response['Datapoints']:
                    avg_memory = sum([dp['Average'] for dp in memory_response['Datapoints']]) / len(memory_response['Datapoints'])

                    if avg_memory < 40:
                        monthly_cost = self._estimate_instance_cost(instance['InstanceType'])
                        savings = monthly_cost * self.savings_estimates['oversized_memory']

                        self.recommendations.append({
                            'instance_id': instance['InstanceId'],
                            'instance_type': instance['InstanceType'],
                            'action': 'rightsize_memory_instance',
                            'priority': 'high',
                            'potential_savings': savings,
                            'details': f'Average memory utilization: {avg_memory:.2f}%',
                            'tags': instance['Tags']
                        })

            except Exception as e:
                logger.warning(f"No memory metrics for {instance['InstanceId']} (CloudWatch Agent may not be installed)")

    def analyze_old_generation_instances(self, instances: List[Dict]) -> None:
        """Find instances using old generation types."""
        logger.info("Analyzing old generation instances...")

        old_gen_families = ['t2', 'm4', 'c4', 'r4']
        old_instances = [i for i in instances if
                        any(i['InstanceType'].startswith(fam) for fam in old_gen_families)]

        for instance in old_instances:
            monthly_cost = self._estimate_instance_cost(instance['InstanceType'])
            savings = monthly_cost * self.savings_estimates['old_generation']

            # Suggest modern equivalent
            new_type = instance['InstanceType'].replace('t2', 't3').replace('m4', 'm5').replace('c4', 'c5').replace('r4', 'r5')

            self.recommendations.append({
                'instance_id': instance['InstanceId'],
                'instance_type': instance['InstanceType'],
                'action': 'upgrade_instance_generation',
                'priority': 'medium',
                'potential_savings': savings,
                'details': f'Migrate from {instance["InstanceType"]} to {new_type}',
                'tags': instance['Tags']
            })

    def analyze_stopped_instances_with_ebs(self, instances: List[Dict]) -> None:
        """Find stopped instances with attached EBS volumes."""
        logger.info("Analyzing stopped instances with EBS volumes...")

        stopped_instances = [i for i in instances if i['State'] == 'stopped']

        for instance in stopped_instances:
            if instance['BlockDeviceMappings']:
                total_volume_size = 0
                volume_ids = []

                for mapping in instance['BlockDeviceMappings']:
                    if 'Ebs' in mapping:
                        volume_id = mapping['Ebs']['VolumeId']
                        volume_ids.append(volume_id)

                        try:
                            volume = self.ec2_client.describe_volumes(VolumeIds=[volume_id])['Volumes'][0]
                            total_volume_size += volume['Size']
                        except:
                            pass

                if total_volume_size > 0:
                    # Estimate EBS cost (roughly $0.10 per GB-month for gp3)
                    monthly_ebs_cost = total_volume_size * 0.10

                    self.recommendations.append({
                        'instance_id': instance['InstanceId'],
                        'instance_type': instance['InstanceType'],
                        'action': 'remove_stopped_instance_volumes',
                        'priority': 'medium',
                        'potential_savings': monthly_ebs_cost,
                        'details': f'Stopped instance with {total_volume_size} GB EBS storage',
                        'tags': instance['Tags']
                    })

    def analyze_ri_coverage_gaps(self, instances: List[Dict]) -> None:
        """Find instance families without RI coverage."""
        logger.info("Analyzing Reserved Instance coverage gaps...")

        # Count running instances by type
        instance_counts = defaultdict(int)
        running_instances = [i for i in instances if i['State'] == 'running']

        for instance in running_instances:
            instance_counts[instance['InstanceType']] += 1

        # Filter for types with 5+ instances
        eligible_types = {itype: count for itype, count in instance_counts.items() if count >= 5}

        try:
            # Get RI coverage
            end_date = datetime.now().strftime('%Y-%m-%d')
            start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

            coverage = self.ce_client.get_reservation_coverage(
                TimePeriod={'Start': start_date, 'End': end_date},
                Granularity='MONTHLY',
                Metrics=['CoverageNormalizedUnits']
            )

            # Process RI coverage data
            for instance_type, count in eligible_types.items():
                # Check if we have RI coverage for this instance family
                family = instance_type.split('.')[0]

                # Simplified check - in reality, you'd parse the coverage response more thoroughly
                has_coverage = False  # This should be determined from the coverage response

                if not has_coverage:
                    monthly_cost = self._estimate_instance_cost(instance_type) * count
                    savings = monthly_cost * self.savings_estimates['missing_ri']

                    self.recommendations.append({
                        'instance_id': f'{instance_type}_fleet',
                        'instance_type': instance_type,
                        'action': 'purchase_reserved_instances',
                        'priority': 'high',
                        'potential_savings': savings,
                        'details': f'{count} instances of {instance_type} without RI coverage',
                        'tags': {}
                    })

        except Exception as e:
            logger.error(f"Error analyzing RI coverage: {str(e)}")

    def analyze_untagged_instances(self, instances: List[Dict]) -> None:
        """Find instances missing required tags."""
        logger.info("Analyzing untagged instances...")

        required_tags = ['CostCenter', 'Environment', 'Owner', 'Application']

        for instance in instances:
            missing_tags = []
            for tag in required_tags:
                if tag not in instance['Tags']:
                    missing_tags.append(tag)

            if missing_tags:
                self.recommendations.append({
                    'instance_id': instance['InstanceId'],
                    'instance_type': instance['InstanceType'],
                    'action': 'add_required_tags',
                    'priority': 'low',
                    'potential_savings': 0,  # No direct savings, but enables better cost tracking
                    'details': f'Missing tags: {", ".join(missing_tags)}',
                    'tags': instance['Tags']
                })

    def analyze_inefficient_storage(self) -> None:
        """Find gp2 volumes that should be migrated to gp3."""
        logger.info("Analyzing inefficient storage...")

        try:
            paginator = self.ec2_client.get_paginator('describe_volumes')

            for page in paginator.paginate():
                for volume in page['Volumes']:
                    if volume['VolumeType'] == 'gp2':
                        volume_size = volume['Size']
                        # gp3 is about 20% cheaper than gp2
                        monthly_cost = volume_size * 0.10  # Approximate gp2 cost
                        savings = monthly_cost * self.savings_estimates['gp2_to_gp3']

                        self.recommendations.append({
                            'instance_id': volume['VolumeId'],
                            'instance_type': 'EBS_Volume',
                            'action': 'migrate_gp2_to_gp3',
                            'priority': 'medium',
                            'potential_savings': savings,
                            'details': f'{volume_size} GB gp2 volume',
                            'tags': {tag['Key']: tag['Value'] for tag in volume.get('Tags', [])}
                        })

        except Exception as e:
            logger.error(f"Error analyzing storage: {str(e)}")

    def analyze_burstable_credit_abuse(self, instances: List[Dict]) -> None:
        """Find t2/t3 instances with high credit charges."""
        logger.info("Analyzing burstable instance credit usage...")

        burstable_instances = [i for i in instances if i['State'] == 'running' and
                              (i['InstanceType'].startswith('t2') or i['InstanceType'].startswith('t3'))]

        end_time = datetime.now(timezone.utc)
        start_time = end_time - timedelta(days=14)

        for instance in burstable_instances:
            try:
                # Check if unlimited mode is enabled
                monitoring = self.ec2_client.describe_instance_credit_specifications(
                    InstanceIds=[instance['InstanceId']]
                )

                if monitoring['InstanceCreditSpecifications']:
                    credit_spec = monitoring['InstanceCreditSpecifications'][0]

                    if credit_spec.get('CpuCredits') == 'unlimited':
                        # Get CPU credit balance metrics
                        credit_response = self.cloudwatch_client.get_metric_statistics(
                            Namespace='AWS/EC2',
                            MetricName='CPUSurplusCreditBalance',
                            Dimensions=[{'Name': 'InstanceId', 'Value': instance['InstanceId']}],
                            StartTime=start_time,
                            EndTime=end_time,
                            Period=3600,
                            Statistics=['Average']
                        )

                        if credit_response['Datapoints']:
                            avg_surplus = sum([dp['Average'] for dp in credit_response['Datapoints']]) / len(credit_response['Datapoints'])

                            if avg_surplus > 0:  # Consistently using surplus credits
                                monthly_cost = self._estimate_instance_cost(instance['InstanceType'])
                                savings = monthly_cost * self.savings_estimates['burstable_abuse']

                                self.recommendations.append({
                                    'instance_id': instance['InstanceId'],
                                    'instance_type': instance['InstanceType'],
                                    'action': 'upgrade_burstable_instance',
                                    'priority': 'high',
                                    'potential_savings': savings,
                                    'details': f'Unlimited mode with average surplus credits: {avg_surplus:.2f}',
                                    'tags': instance['Tags']
                                })

            except Exception as e:
                logger.warning(f"Error checking credit specifications for {instance['InstanceId']}: {str(e)}")

    def _estimate_instance_cost(self, instance_type: str) -> float:
        """Estimate monthly cost for an instance type."""
        # Simplified cost estimation - in production, use AWS Price List API
        cost_map = {
            't2.micro': 8.50, 't2.small': 17.00, 't2.medium': 34.00,
            't3.micro': 7.50, 't3.small': 15.00, 't3.medium': 30.00,
            'm4.large': 73.00, 'm4.xlarge': 146.00, 'm4.2xlarge': 292.00,
            'm5.large': 70.00, 'm5.xlarge': 140.00, 'm5.2xlarge': 280.00,
            'c4.large': 73.00, 'c4.xlarge': 146.00, 'c4.2xlarge': 292.00,
            'c5.large': 62.00, 'c5.xlarge': 124.00, 'c5.2xlarge': 248.00,
            'r4.large': 92.00, 'r4.xlarge': 184.00, 'r4.2xlarge': 368.00,
            'r5.large': 91.00, 'r5.xlarge': 182.00, 'r5.2xlarge': 364.00,
            'r6i.large': 90.00, 'r6i.xlarge': 180.00, 'r6i.2xlarge': 360.00,
            'x2.xlarge': 500.00, 'x2.2xlarge': 1000.00
        }

        return cost_map.get(instance_type, 100.0)  # Default $100 if not in map

    def generate_reports(self) -> None:
        """Generate JSON and CSV reports."""
        logger.info("Generating reports...")

        # Calculate total savings
        self.total_potential_savings = sum([r['potential_savings'] for r in self.recommendations])

        # Generate JSON report
        json_report = {
            'analysis_date': datetime.now().isoformat(),
            'region': self.region,
            'total_potential_savings': round(self.total_potential_savings, 2),
            'recommendations': self.recommendations
        }

        with open('ec2_cost_optimization.json', 'w') as f:
            json.dump(json_report, f, indent=2, default=str)

        # Generate CSV report
        csv_data = []
        for rec in self.recommendations:
            csv_data.append({
                'Instance ID': rec['instance_id'],
                'Instance Type': rec['instance_type'],
                'Action': rec['action'],
                'Priority': rec['priority'],
                'Potential Monthly Savings': f"${rec['potential_savings']:.2f}",
                'Details': rec['details'],
                'Cost Center': rec['tags'].get('CostCenter', 'N/A'),
                'Environment': rec['tags'].get('Environment', 'N/A'),
                'Owner': rec['tags'].get('Owner', 'N/A'),
                'Application': rec['tags'].get('Application', 'N/A')
            })

        # Write CSV file using csv module
        if csv_data:
            fieldnames = ['Instance ID', 'Instance Type', 'Action', 'Priority',
                         'Potential Monthly Savings', 'Details', 'Cost Center',
                         'Environment', 'Owner', 'Application']
            with open('ec2_rightsizing.csv', 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()
                writer.writerows(csv_data)
        else:
            # Create empty CSV with headers if no recommendations
            fieldnames = ['Instance ID', 'Instance Type', 'Action', 'Priority',
                         'Potential Monthly Savings', 'Details', 'Cost Center',
                         'Environment', 'Owner', 'Application']
            with open('ec2_rightsizing.csv', 'w', newline='') as csvfile:
                writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
                writer.writeheader()

        logger.info(f"Reports generated successfully. Total potential savings: ${self.total_potential_savings:,.2f}")

    def print_console_report(self) -> None:
        """Print a formatted console report using tabulate."""
        print("\n" + "="*100)
        print("EC2 Cost Optimization Analysis Report")
        print("="*100)
        print(f"Region: {self.region}")
        print(f"Analysis Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Total Potential Monthly Savings: ${self.total_potential_savings:,.2f}")
        print("="*100)

        if not self.recommendations:
            print("\nNo cost optimization recommendations found!")
            return

        # Group recommendations by action type
        recommendations_by_action = defaultdict(list)
        for rec in self.recommendations:
            recommendations_by_action[rec['action']].append(rec)

        print(f"\nFound {len(self.recommendations)} recommendations across {len(recommendations_by_action)} categories\n")

        for action, recs in recommendations_by_action.items():
            if not recs:
                continue

            # Format action name for display
            action_display = action.replace('_', ' ').title()
            total_savings = sum(r['potential_savings'] for r in recs)

            print(f"\n{action_display} ({len(recs)} resources, ${total_savings:,.2f}/month savings)")
            print("-" * 100)

            # Prepare table data based on action type
            if action == 'terminate_zombie_instance':
                headers = ['Instance ID', 'Instance Type', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'upgrade_instance_generation':
                headers = ['Instance ID', 'Current Type', 'Priority', 'Monthly Savings', 'Recommendation']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'add_required_tags':
                headers = ['Instance ID', 'Instance Type', 'Priority', 'Missing Tags']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'], rec['details']]
                    for rec in recs
                ]
            elif action == 'migrate_gp2_to_gp3':
                headers = ['Volume ID', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'remove_stopped_instance_volumes':
                headers = ['Instance ID', 'Instance Type', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'purchase_reserved_instances':
                headers = ['Instance Family', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'rightsize_memory_instance':
                headers = ['Instance ID', 'Instance Type', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            elif action == 'upgrade_burstable_instance':
                headers = ['Instance ID', 'Instance Type', 'Priority', 'Monthly Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]
            else:
                # Fallback for unknown action types
                headers = ['Resource ID', 'Type', 'Priority', 'Savings', 'Details']
                table_data = [
                    [rec['instance_id'], rec['instance_type'], rec['priority'],
                     f"${rec['potential_savings']:.2f}", rec['details']]
                    for rec in recs
                ]

            # Print table using tabulate with grid format
            print(tabulate(table_data, headers=headers, tablefmt='grid'))

        print("\n" + "="*100)
        print(f"Total Potential Monthly Savings: ${self.total_potential_savings:,.2f}")
        print("="*100 + "\n")

    def run_analysis(self) -> None:
        """Run the complete cost optimization analysis."""
        logger.info("Starting EC2 cost optimization analysis...")

        # Get instances
        instances = self.get_instances()

        if not instances:
            logger.warning("No instances found for analysis")
            # Still generate empty reports
            self.generate_reports()
            self.print_console_report()
            return

        # Run all analyses
        self.analyze_zombie_instances(instances)
        self.analyze_oversized_memory_instances(instances)
        self.analyze_old_generation_instances(instances)
        self.analyze_stopped_instances_with_ebs(instances)
        self.analyze_ri_coverage_gaps(instances)
        self.analyze_untagged_instances(instances)
        self.analyze_inefficient_storage()
        self.analyze_burstable_credit_abuse(instances)

        # Generate reports
        self.generate_reports()

        # Print console report
        self.print_console_report()

        logger.info("Analysis complete!")


def main():
    """Main entry point."""
    try:
        optimizer = EC2CostOptimizer(region='us-east-1')
        optimizer.run_analysis()
    except Exception as e:
        logger.error(f"Fatal error: {str(e)}")
        raise


if __name__ == "__main__":
    main()
