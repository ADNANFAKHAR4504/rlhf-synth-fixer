#!/usr/bin/env python3
"""
AWS Infrastructure Compliance Scanner
Performs comprehensive compliance checks on AWS resources using boto3
"""

import boto3
import json
import sys
from datetime import datetime
from typing import List, Dict, Any, Optional
import os


class ComplianceViolation:
    """Represents a single compliance violation"""

    def __init__(
        self,
        resource_id: str,
        resource_type: str,
        violation_type: str,
        severity: str,
        details: str
    ):
        self.resource_id = resource_id
        self.resource_type = resource_type
        self.violation_type = violation_type
        self.severity = severity
        self.details = details
        self.timestamp = datetime.utcnow().isoformat()

    def to_dict(self) -> Dict[str, Any]:
        """Convert violation to dictionary"""
        return {
            'resourceId': self.resource_id,
            'resourceType': self.resource_type,
            'violationType': self.violation_type,
            'severity': self.severity,
            'details': self.details,
            'timestamp': self.timestamp
        }


class ComplianceScanner:
    """AWS Infrastructure Compliance Scanner"""

    def __init__(
        self,
        region: str,
        environment_suffix: str,
        approved_amis: Optional[List[str]] = None
    ):
        self.region = region
        self.environment_suffix = environment_suffix
        self.approved_amis = approved_amis or []

        # Initialize AWS clients
        self.ec2_client = boto3.client('ec2', region_name=region)
        self.ssm_client = boto3.client('ssm', region_name=region)
        self.cloudwatch_client = boto3.client('cloudwatch', region_name=region)
        self.s3_client = boto3.client('s3', region_name=region)

        self.violations: List[ComplianceViolation] = []

    def check_ebs_encryption(self) -> None:
        """Check for unencrypted EBS volumes"""
        try:
            print("Checking EBS encryption...")
            response = self.ec2_client.describe_instances()

            for reservation in response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    instance_id = instance.get('InstanceId')
                    if not instance_id:
                        continue

                    # Get volume IDs attached to this instance
                    volume_ids = [
                        bdm.get('Ebs', {}).get('VolumeId')
                        for bdm in instance.get('BlockDeviceMappings', [])
                        if bdm.get('Ebs', {}).get('VolumeId')
                    ]

                    if not volume_ids:
                        continue

                    # Check volume encryption
                    volumes_response = self.ec2_client.describe_volumes(
                        VolumeIds=volume_ids
                    )

                    for volume in volumes_response.get('Volumes', []):
                        if not volume.get('Encrypted', False):
                            self.violations.append(ComplianceViolation(
                                resource_id=instance_id,
                                resource_type='EC2::Instance',
                                violation_type='UnencryptedEBSVolume',
                                severity='HIGH',
                                details=f"Instance has unencrypted EBS volume: {volume.get('VolumeId')}"
                            ))
        except Exception as e:
            print(f"Error checking EBS encryption: {e}", file=sys.stderr)

    def check_s3_buckets(self) -> None:
        """Check S3 bucket compliance"""
        try:
            print("Checking S3 buckets...")
            response = self.s3_client.list_buckets()

            for bucket in response.get('Buckets', []):
                bucket_name = bucket.get('Name')
                if not bucket_name:
                    continue

                # Check versioning
                try:
                    versioning_response = self.s3_client.get_bucket_versioning(
                        Bucket=bucket_name
                    )
                    if versioning_response.get('Status') != 'Enabled':
                        self.violations.append(ComplianceViolation(
                            resource_id=bucket_name,
                            resource_type='S3::Bucket',
                            violation_type='VersioningDisabled',
                            severity='MEDIUM',
                            details='S3 bucket does not have versioning enabled'
                        ))
                except Exception:
                    pass  # May not have permissions

                # Check encryption
                try:
                    self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                except self.s3_client.exceptions.ServerSideEncryptionConfigurationNotFoundError:
                    self.violations.append(ComplianceViolation(
                        resource_id=bucket_name,
                        resource_type='S3::Bucket',
                        violation_type='EncryptionDisabled',
                        severity='HIGH',
                        details='S3 bucket does not have encryption enabled'
                    ))
                except Exception:
                    pass  # May not have permissions

                # Check public access block
                try:
                    public_access_response = self.s3_client.get_public_access_block(
                        Bucket=bucket_name
                    )
                    config = public_access_response.get('PublicAccessBlockConfiguration', {})

                    if not all([
                        config.get('BlockPublicAcls'),
                        config.get('BlockPublicPolicy'),
                        config.get('IgnorePublicAcls'),
                        config.get('RestrictPublicBuckets')
                    ]):
                        self.violations.append(ComplianceViolation(
                            resource_id=bucket_name,
                            resource_type='S3::Bucket',
                            violation_type='PublicAccessNotBlocked',
                            severity='HIGH',
                            details='S3 bucket does not have all public access blocked'
                        ))
                except self.s3_client.exceptions.NoSuchPublicAccessBlockConfiguration:
                    self.violations.append(ComplianceViolation(
                        resource_id=bucket_name,
                        resource_type='S3::Bucket',
                        violation_type='PublicAccessNotBlocked',
                        severity='HIGH',
                        details='S3 bucket does not have public access block configured'
                    ))
                except Exception:
                    pass  # May not have permissions
        except Exception as e:
            print(f"Error checking S3 buckets: {e}", file=sys.stderr)

    def check_security_groups(self) -> None:
        """Check security groups for unrestricted inbound rules"""
        try:
            print("Checking security groups...")
            response = self.ec2_client.describe_security_groups()

            sensitive_ports = [22, 3389, 3306]

            for sg in response.get('SecurityGroups', []):
                sg_id = sg.get('GroupId')
                sg_name = sg.get('GroupName')

                for rule in sg.get('IpPermissions', []):
                    from_port = rule.get('FromPort', 0)
                    to_port = rule.get('ToPort', 0)

                    # Check for unrestricted access
                    has_unrestricted_ipv4 = any(
                        ip_range.get('CidrIp') == '0.0.0.0/0'
                        for ip_range in rule.get('IpRanges', [])
                    )
                    has_unrestricted_ipv6 = any(
                        ip_range.get('CidrIpv6') == '::/0'
                        for ip_range in rule.get('Ipv6Ranges', [])
                    )

                    if has_unrestricted_ipv4 or has_unrestricted_ipv6:
                        for port in sensitive_ports:
                            if from_port <= port <= to_port:
                                self.violations.append(ComplianceViolation(
                                    resource_id=sg_id,
                                    resource_type='EC2::SecurityGroup',
                                    violation_type='UnrestrictedInboundRule',
                                    severity='HIGH',
                                    details=f"Security group {sg_name} allows unrestricted access (0.0.0.0/0) on port {port}"
                                ))
        except Exception as e:
            print(f"Error checking security groups: {e}", file=sys.stderr)

    def check_required_tags(self) -> None:
        """Check for required tags on EC2 instances"""
        try:
            print("Checking required tags...")
            required_tags = ['Environment', 'Owner', 'CostCenter']
            response = self.ec2_client.describe_instances()

            for reservation in response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    instance_id = instance.get('InstanceId')
                    if not instance_id:
                        continue

                    instance_tags = {
                        tag.get('Key') for tag in instance.get('Tags', [])
                    }
                    missing_tags = [tag for tag in required_tags if tag not in instance_tags]

                    if missing_tags:
                        self.violations.append(ComplianceViolation(
                            resource_id=instance_id,
                            resource_type='EC2::Instance',
                            violation_type='MissingRequiredTags',
                            severity='MEDIUM',
                            details=f"Instance missing required tags: {', '.join(missing_tags)}"
                        ))
        except Exception as e:
            print(f"Error checking required tags: {e}", file=sys.stderr)

    def check_approved_amis(self) -> None:
        """Check for approved AMIs"""
        try:
            print("Checking approved AMIs...")
            response = self.ec2_client.describe_instances()

            for reservation in response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    instance_id = instance.get('InstanceId')
                    image_id = instance.get('ImageId')

                    if not instance_id or not image_id:
                        continue

                    if self.approved_amis and image_id not in self.approved_amis:
                        self.violations.append(ComplianceViolation(
                            resource_id=instance_id,
                            resource_type='EC2::Instance',
                            violation_type='UnapprovedAMI',
                            severity='MEDIUM',
                            details=f"Instance using unapproved AMI: {image_id}"
                        ))
        except Exception as e:
            print(f"Error checking approved AMIs: {e}", file=sys.stderr)

    def check_ssm_agent_status(self) -> None:
        """Check SSM agent status on EC2 instances"""
        try:
            print("Checking SSM agent status...")
            instances_response = self.ec2_client.describe_instances()

            instance_ids = []
            for reservation in instances_response.get('Reservations', []):
                for instance in reservation.get('Instances', []):
                    instance_id = instance.get('InstanceId')
                    if instance_id:
                        instance_ids.append(instance_id)

            if not instance_ids:
                return

            # Get managed instances
            ssm_response = self.ssm_client.describe_instance_information()
            managed_instance_ids = {
                info.get('InstanceId')
                for info in ssm_response.get('InstanceInformationList', [])
            }

            for instance_id in instance_ids:
                if instance_id not in managed_instance_ids:
                    self.violations.append(ComplianceViolation(
                        resource_id=instance_id,
                        resource_type='EC2::Instance',
                        violation_type='SSMAgentNotConnected',
                        severity='MEDIUM',
                        details='Instance does not have SSM agent connected'
                    ))
        except Exception as e:
            print(f"Error checking SSM agent status: {e}", file=sys.stderr)

    def check_vpc_flow_logs(self) -> None:
        """Check VPC flow logs"""
        try:
            print("Checking VPC flow logs...")
            vpcs_response = self.ec2_client.describe_vpcs()

            for vpc in vpcs_response.get('Vpcs', []):
                vpc_id = vpc.get('VpcId')
                if not vpc_id:
                    continue

                flow_logs_response = self.ec2_client.describe_flow_logs(
                    Filters=[
                        {
                            'Name': 'resource-id',
                            'Values': [vpc_id]
                        }
                    ]
                )

                has_flow_logs = len(flow_logs_response.get('FlowLogs', [])) > 0

                if not has_flow_logs:
                    self.violations.append(ComplianceViolation(
                        resource_id=vpc_id,
                        resource_type='EC2::VPC',
                        violation_type='FlowLogsDisabled',
                        severity='MEDIUM',
                        details='VPC does not have flow logs enabled'
                    ))
        except Exception as e:
            print(f"Error checking VPC flow logs: {e}", file=sys.stderr)

    def get_total_resources_scanned(self) -> int:
        """Get total number of resources scanned"""
        try:
            instances_response = self.ec2_client.describe_instances()
            instances_count = sum(
                len(r.get('Instances', []))
                for r in instances_response.get('Reservations', [])
            )

            vpcs_response = self.ec2_client.describe_vpcs()
            vpcs_count = len(vpcs_response.get('Vpcs', []))

            buckets_response = self.s3_client.list_buckets()
            buckets_count = len(buckets_response.get('Buckets', []))

            return instances_count + vpcs_count + buckets_count
        except Exception as e:
            print(f"Error getting total resources: {e}", file=sys.stderr)
            return 0

    def generate_report(self) -> Dict[str, Any]:
        """Generate compliance report"""
        total_resources = self.get_total_resources_scanned()

        violations_by_type: Dict[str, int] = {}
        for violation in self.violations:
            v_type = violation.violation_type
            violations_by_type[v_type] = violations_by_type.get(v_type, 0) + 1

        compliance_rate = (
            ((total_resources - len(self.violations)) / total_resources * 100)
            if total_resources > 0 else 100.0
        )

        return {
            'scanTimestamp': datetime.utcnow().isoformat(),
            'region': self.region,
            'environmentSuffix': self.environment_suffix,
            'summary': {
                'totalResourcesScanned': total_resources,
                'totalViolations': len(self.violations),
                'violationsByType': violations_by_type,
                'complianceRate': round(compliance_rate, 2)
            },
            'violations': [v.to_dict() for v in self.violations]
        }

    def export_metrics(self, report: Dict[str, Any]) -> None:
        """Export metrics to CloudWatch"""
        try:
            print("Exporting CloudWatch metrics...")
            self.cloudwatch_client.put_metric_data(
                Namespace=f"ComplianceScanner/{self.environment_suffix}",
                MetricData=[
                    {
                        'MetricName': 'TotalResourcesScanned',
                        'Value': report['summary']['totalResourcesScanned'],
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    },
                    {
                        'MetricName': 'TotalViolations',
                        'Value': report['summary']['totalViolations'],
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    },
                    {
                        'MetricName': 'ComplianceRate',
                        'Value': report['summary']['complianceRate'],
                        'Unit': 'Percent',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
            print("CloudWatch metrics exported successfully")
        except Exception as e:
            print(f"Error exporting CloudWatch metrics: {e}", file=sys.stderr)

    def run_all_checks(self) -> Dict[str, Any]:
        """Run all compliance checks"""
        print("Starting compliance scan...")

        self.check_ebs_encryption()
        self.check_s3_buckets()
        self.check_security_groups()
        self.check_required_tags()
        self.check_approved_amis()
        self.check_ssm_agent_status()
        self.check_vpc_flow_logs()

        report = self.generate_report()
        self.export_metrics(report)

        return report


def main():  # pragma: no cover
    """Main entry point"""
    print("=== AWS Infrastructure Compliance Analysis ===\n")

    # Configuration from environment
    region = os.environ.get('AWS_REGION', 'us-east-1')
    environment_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'test')
    approved_amis_str = os.environ.get(
        'APPROVED_AMIS',
        '["ami-0c55b159cbfafe1f0", "ami-0574da719dca65348"]'
    )

    approved_amis = json.loads(approved_amis_str)

    print(f"Region: {region}")
    print(f"Environment Suffix: {environment_suffix}")
    print(f"Approved AMIs: {', '.join(approved_amis)}\n")

    # Create scanner instance
    scanner = ComplianceScanner(region, environment_suffix, approved_amis)

    try:
        # Run all compliance checks
        report = scanner.run_all_checks()

        # Display report summary
        print("\n=== Compliance Scan Results ===\n")
        print(f"Scan Timestamp: {report['scanTimestamp']}")
        print(f"Region: {report['region']}")
        print(f"Environment: {report['environmentSuffix']}\n")

        print("Summary:")
        print(f"  Total Resources Scanned: {report['summary']['totalResourcesScanned']}")
        print(f"  Total Violations: {report['summary']['totalViolations']}")
        print(f"  Compliance Rate: {report['summary']['complianceRate']}%\n")

        if report['summary']['violationsByType']:
            print("Violations by Type:")
            for v_type, count in report['summary']['violationsByType'].items():
                print(f"  {v_type}: {count}")
            print()

        # Display detailed violations
        if report['violations']:
            print("Detailed Violations:\n")
            for violation in report['violations']:
                print(f"[{violation['severity']}] {violation['violationType']}")
                print(f"  Resource: {violation['resourceType']} - {violation['resourceId']}")
                print(f"  Details: {violation['details']}")
                print(f"  Timestamp: {violation['timestamp']}\n")
        else:
            print("No violations found! Infrastructure is compliant.\n")

        # Save report to file
        report_path = './compliance-report.json'
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        print(f"Full report saved to: {report_path}\n")

        # Exit with appropriate code
        if report['violations']:
            print("⚠️  Analysis completed with violations found.")
            sys.exit(0)  # Exit 0 because finding violations is expected behavior
        else:
            print("✅ Analysis completed successfully with no violations.")
            sys.exit(0)
    except Exception as error:
        print(f"❌ Error during compliance scan: {error}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
