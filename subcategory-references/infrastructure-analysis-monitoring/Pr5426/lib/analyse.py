import boto3
from datetime import datetime, timedelta
import json
import os
from tabulate import tabulate
from typing import List, Dict, Any, Optional
import sys

class FinOpsAnalyzer:
    def __init__(self, region='us-east-1'):
        self.region = region
        self.session = boto3.Session(region_name=region)

        # Get endpoint URL from environment for testing (Moto support)
        endpoint_url = os.environ.get('AWS_ENDPOINT_URL')

        # Create clients with optional endpoint URL
        self.ec2_client = self.session.client('ec2', endpoint_url=endpoint_url)
        self.elb_client = self.session.client('elbv2', endpoint_url=endpoint_url)
        self.cloudwatch_client = self.session.client('cloudwatch', endpoint_url=endpoint_url)
        self.s3_client = self.session.client('s3', endpoint_url=endpoint_url)
        self.findings = []

    def has_rd_tag(self, tags: List[Dict]) -> bool:
        """Check if resource has CostCenter tag set to R&D"""
        if not tags:
            return False
        for tag in tags:
            if tag.get('Key') == 'CostCenter' and tag.get('Value') == 'R&D':
                return True
        return False

    def get_cloudwatch_metric_sum(self, namespace: str, metric_name: str,
                                  dimensions: List[Dict], days: int) -> float:
        """Get sum of CloudWatch metric over specified days"""
        try:
            response = self.cloudwatch_client.get_metric_statistics(
                Namespace=namespace,
                MetricName=metric_name,
                Dimensions=dimensions,
                StartTime=datetime.utcnow() - timedelta(days=days),
                EndTime=datetime.utcnow(),
                Period=86400 * days,  # Get one data point for entire period
                Statistics=['Sum']
            )

            if response['Datapoints']:
                return sum(dp['Sum'] for dp in response['Datapoints'])
            return 0.0
        except Exception as e:
            print(f"Warning: CloudWatch metric query failed: {e}", file=sys.stderr)
            return 0.0

    def analyze_idle_albs(self):
        """Find ALBs with < 1000 requests in last 14 days"""
        print("Analyzing ALBs...")

        paginator = self.elb_client.get_paginator('describe_load_balancers')

        for page in paginator.paginate():
            for alb in page['LoadBalancers']:
                if alb['Type'] != 'application':
                    continue

                # Get tags
                tags_response = self.elb_client.describe_tags(
                    ResourceArns=[alb['LoadBalancerArn']]
                )
                tags = tags_response['TagDescriptions'][0]['Tags'] if tags_response['TagDescriptions'] else []

                if self.has_rd_tag(tags):
                    continue

                # Check CloudWatch metrics
                dimensions = [{'Name': 'LoadBalancer', 'Value': alb['LoadBalancerArn'].split('/')[-3] + '/' + alb['LoadBalancerArn'].split('/')[-2] + '/' + alb['LoadBalancerArn'].split('/')[-1]}]
                request_count = self.get_cloudwatch_metric_sum(
                    'AWS/ApplicationELB',
                    'RequestCount',
                    dimensions,
                    14
                )

                if request_count < 1000:
                    self.findings.append({
                        'ResourceId': alb['LoadBalancerArn'],
                        'Region': self.region,
                        'WasteType': 'IdleALB',
                        'EstimatedMonthlySavings': 18.40,  # ~$0.0225/hour * 24 * 30
                        'Details': f'RequestCount: {int(request_count)} in 14 days'
                    })

    def analyze_nat_gateways(self):
        """Find underutilized NAT Gateways and misconfigurations"""
        print("Analyzing NAT Gateways...")

        response = self.ec2_client.describe_nat_gateways(
            Filter=[{'Name': 'state', 'Values': ['available']}]
        )

        # Get all private subnets by AZ
        subnets_response = self.ec2_client.describe_subnets()
        private_subnet_azs = set()

        for subnet in subnets_response['Subnets']:
            # Check if subnet is private (no IGW route)
            route_tables = self.ec2_client.describe_route_tables(
                Filters=[{'Name': 'association.subnet-id', 'Values': [subnet['SubnetId']]}]
            )

            is_private = True
            for rt in route_tables['RouteTables']:
                for route in rt['Routes']:
                    if route.get('GatewayId', '').startswith('igw-'):
                        is_private = False
                        break

            if is_private:
                private_subnet_azs.add(subnet['AvailabilityZone'])

        for nat in response['NatGateways']:
            if self.has_rd_tag(nat.get('Tags', [])):
                continue

            nat_id = nat['NatGatewayId']

            # Check CloudWatch BytesProcessed
            dimensions = [{'Name': 'NatGatewayId', 'Value': nat_id}]
            bytes_processed = self.get_cloudwatch_metric_sum(
                'AWS/EC2',
                'BytesOutToDestination',
                dimensions,
                30
            )

            if bytes_processed < 1e9:  # Less than 1 GB
                self.findings.append({
                    'ResourceId': nat_id,
                    'Region': self.region,
                    'WasteType': 'UnderutilizedNATGateway',
                    'EstimatedMonthlySavings': 32.40,  # ~$0.045/hour * 24 * 30
                    'Details': f'BytesProcessed: {bytes_processed/1e6:.2f} MB in 30 days'
                })

            # Check for misconfiguration
            nat_subnet = self.ec2_client.describe_subnets(
                SubnetIds=[nat['SubnetId']]
            )['Subnets'][0]

            if nat_subnet['AvailabilityZone'] not in private_subnet_azs:
                self.findings.append({
                    'ResourceId': nat_id,
                    'Region': self.region,
                    'WasteType': 'MisconfiguredNATGateway',
                    'EstimatedMonthlySavings': 32.40,
                    'Details': f'No private subnets in AZ: {nat_subnet["AvailabilityZone"]}'
                })

    def analyze_s3_buckets(self):
        """Find S3 buckets with versioning issues and missing lifecycle policies"""
        print("Analyzing S3 buckets...")

        buckets = self.s3_client.list_buckets()['Buckets']

        for bucket in buckets:
            bucket_name = bucket['Name']

            try:
                # Get bucket tags
                try:
                    tags_response = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
                    tags = [{'Key': t['Key'], 'Value': t['Value']} for t in tags_response.get('TagSet', [])]
                    if self.has_rd_tag(tags):
                        continue
                except self.s3_client.exceptions.NoSuchTagSet:
                    pass
                except Exception:
                    # Catch any other tag-related exceptions
                    pass

                # Check versioning status
                versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)

                if versioning.get('Status') == 'Enabled':
                    # Check lifecycle policies
                    try:
                        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                        has_noncurrent_expiration = any(
                            'NoncurrentVersionExpiration' in rule
                            for rule in lifecycle.get('Rules', [])
                            if rule.get('Status') == 'Enabled'
                        )
                    except self.s3_client.exceptions.NoSuchLifecycleConfiguration:
                        has_noncurrent_expiration = False

                    if not has_noncurrent_expiration:
                        self.findings.append({
                            'ResourceId': f's3://{bucket_name}',
                            'Region': self.region,
                            'WasteType': 'S3VersioningWithoutExpiration',
                            'EstimatedMonthlySavings': 50.00,  # Estimate based on typical versioning overhead
                            'Details': 'Versioning enabled without non-current version expiration'
                        })

                # Check bucket size for large buckets without Glacier policy
                # Get bucket size from CloudWatch
                dimensions = [
                    {'Name': 'BucketName', 'Value': bucket_name},
                    {'Name': 'StorageType', 'Value': 'StandardStorage'}
                ]

                bucket_size = self.get_cloudwatch_metric_sum(
                    'AWS/S3',
                    'BucketSizeBytes',
                    dimensions,
                    1
                )

                if bucket_size > 1e12:  # Over 1 TB
                    # Check for Glacier Deep Archive lifecycle
                    has_glacier = False
                    try:
                        lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                        has_glacier = any(
                            any(t.get('StorageClass') == 'DEEP_ARCHIVE'
                                for t in rule.get('Transitions', []))
                            for rule in lifecycle.get('Rules', [])
                            if rule.get('Status') == 'Enabled'
                        )
                    except self.s3_client.exceptions.NoSuchLifecycleConfiguration:
                        pass

                    if not has_glacier:
                        # Estimate savings: ~90% reduction for Deep Archive
                        standard_cost = (bucket_size / 1e12) * 23  # $0.023/GB/month
                        deep_archive_cost = (bucket_size / 1e12) * 0.99  # $0.00099/GB/month
                        savings = standard_cost - deep_archive_cost

                        self.findings.append({
                            'ResourceId': f's3://{bucket_name}',
                            'Region': self.region,
                            'WasteType': 'LargeBucketWithoutGlacierPolicy',
                            'EstimatedMonthlySavings': round(savings, 2),
                            'Details': f'Size: {bucket_size/1e12:.2f} TB without Deep Archive lifecycle'
                        })

            except Exception as e:
                print(f"Warning: Error analyzing bucket {bucket_name}: {e}", file=sys.stderr)

    def analyze_elastic_ips(self):
        """Find unassociated EIPs and EIPs attached to stopped instances"""
        print("Analyzing Elastic IPs...")

        # Get all EIPs
        eips_response = self.ec2_client.describe_addresses()

        # Get all EC2 instances
        instances_response = self.ec2_client.describe_instances()

        # Build a map of instance states
        instance_states = {}
        for reservation in instances_response['Reservations']:
            for instance in reservation['Instances']:
                instance_states[instance['InstanceId']] = instance['State']['Name']

        for eip in eips_response['Addresses']:
            if self.has_rd_tag(eip.get('Tags', [])):
                continue

            allocation_id = eip.get('AllocationId', eip.get('PublicIp'))

            # Check if unassociated
            if not eip.get('InstanceId'):
                self.findings.append({
                    'ResourceId': allocation_id,
                    'Region': self.region,
                    'WasteType': 'UnassociatedEIP',
                    'EstimatedMonthlySavings': 3.60,  # $0.005/hour * 24 * 30
                    'Details': 'Elastic IP not associated with any instance'
                })
            else:
                # Check if attached to stopped instance
                instance_id = eip['InstanceId']
                if instance_states.get(instance_id) == 'stopped':
                    self.findings.append({
                        'ResourceId': allocation_id,
                        'Region': self.region,
                        'WasteType': 'EIPAttachedToStoppedInstance',
                        'EstimatedMonthlySavings': 3.60,
                        'Details': f'Attached to stopped instance: {instance_id}'
                    })

    def run_analysis(self):
        """Run all analysis functions"""
        print("Starting FinOps analysis for us-east-1...")

        try:
            self.analyze_idle_albs()
        except Exception as e:
            print(f"Error analyzing ALBs: {e}", file=sys.stderr)

        try:
            self.analyze_nat_gateways()
        except Exception as e:
            print(f"Error analyzing NAT Gateways: {e}", file=sys.stderr)

        try:
            self.analyze_s3_buckets()
        except Exception as e:
            print(f"Error analyzing S3 buckets: {e}", file=sys.stderr)

        try:
            self.analyze_elastic_ips()
        except Exception as e:
            print(f"Error analyzing Elastic IPs: {e}", file=sys.stderr)

        return self.findings

    def generate_report(self):
        """Generate console output and JSON report"""
        findings = self.run_analysis()

        if not findings:
            print("\nNo waste found! Your AWS account is well-optimized.")
            return

        # Prepare table data
        table_data = []
        total_savings = 0

        for finding in findings:
            table_data.append([
                finding['ResourceId'][:50] + '...' if len(finding['ResourceId']) > 50 else finding['ResourceId'],
                finding['WasteType'],
                f"${finding['EstimatedMonthlySavings']:.2f}",
                finding['Details'][:40] + '...' if len(finding['Details']) > 40 else finding['Details']
            ])
            total_savings += finding['EstimatedMonthlySavings']

        # Sort by savings (highest first)
        table_data.sort(key=lambda x: float(x[2].replace('$', '')), reverse=True)

        # Print console table
        print("\n" + "="*80)
        print("FinOps Waste Analysis Report")
        print("="*80)
        print(tabulate(
            table_data,
            headers=['Resource ID', 'Waste Type', 'Est. Monthly Savings', 'Details'],
            tablefmt='grid'
        ))
        print(f"\nTotal Estimated Monthly Savings: ${total_savings:.2f}")
        print(f"Total Estimated Annual Savings: ${total_savings * 12:.2f}")

        # Write JSON report
        with open('finops_report.json', 'w') as f:
            json.dump({
                'report_date': datetime.utcnow().isoformat(),
                'region': self.region,
                'total_findings': len(findings),
                'total_monthly_savings': round(total_savings, 2),
                'total_annual_savings': round(total_savings * 12, 2),
                'findings': findings
            }, f, indent=2)

        print(f"\nDetailed report saved to: finops_report.json")


def main():
    analyzer = FinOpsAnalyzer()
    analyzer.generate_report()


if __name__ == '__main__':
    main()
