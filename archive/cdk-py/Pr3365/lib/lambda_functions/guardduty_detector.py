"""
GuardDuty Detector Management Lambda Function
Handles creation, detection, and management of GuardDuty detectors,
ThreatIntelSets, and IPSets with proper resource limit handling.
"""
import boto3
import json
import urllib3
from botocore.exceptions import ClientError


def handler(event, context):
    """
    Lambda handler for GuardDuty detector management
    
    Args:
        event: CloudFormation custom resource event
        context: Lambda context object
        
    Returns:
        dict: Response with detector details
    """
    try:
        client = boto3.client('guardduty')
        s3_client = boto3.client('s3')
        
        # Get configuration from environment variables
        bucket_name = event['ResourceProperties']['BucketName']
        unique_suffix = event['ResourceProperties']['UniqueSuffix']
        
        if event['RequestType'] == 'Delete':
            # Clean up ThreatIntelSet and IPSet if we created them
            detector_id = event.get('PhysicalResourceId', 'not-found')
            if detector_id != 'not-found':
                try:
                    # List and delete ThreatIntelSets
                    threat_intel_response = client.list_threat_intel_sets(DetectorId=detector_id)
                    for threat_intel_id in threat_intel_response.get('ThreatIntelSetIds', []):
                        threat_intel_details = client.get_threat_intel_set(
                            DetectorId=detector_id, 
                            ThreatIntelSetId=threat_intel_id
                        )
                        if threat_intel_details['Name'].startswith(f'BankingThreatIntel-{unique_suffix}'):
                            client.delete_threat_intel_set(
                                DetectorId=detector_id,
                                ThreatIntelSetId=threat_intel_id
                            )
                    
                    # List and delete IPSets
                    ip_set_response = client.list_ip_sets(DetectorId=detector_id)
                    for ip_set_id in ip_set_response.get('IpSetIds', []):
                        ip_set_details = client.get_ip_set(
                            DetectorId=detector_id,
                            IpSetId=ip_set_id
                        )
                        if ip_set_details['Name'].startswith(f'TrustedBankingIPs-{unique_suffix}'):
                            client.delete_ip_set(
                                DetectorId=detector_id,
                                IpSetId=ip_set_id
                            )
                except Exception as e:
                    print(f"Warning: Could not clean up GuardDuty resources: {e}")
            
            return send_response(event, context, 'SUCCESS', {
                'DetectorId': detector_id,
                'ThreatIntelSetId': 'deleted',
                'IPSetId': 'deleted'
            })
        
        # List existing detectors
        response = client.list_detectors()
        
        if response['DetectorIds']:
            # Use existing detector
            detector_id = response['DetectorIds'][0]
            
            # Update detector settings to match our requirements
            try:
                client.update_detector(
                    DetectorId=detector_id,
                    Enable=True,
                    FindingPublishingFrequency='FIFTEEN_MINUTES'
                )
            except Exception as e:
                print(f"Warning: Could not update detector settings: {e}")
            
            mode = 'existing'
        else:
            # Create new detector
            response = client.create_detector(
                Enable=True,
                FindingPublishingFrequency='FIFTEEN_MINUTES',
                Tags={
                    'Name': 'ZeroTrust-AutoCreated',
                    'Environment': 'production',
                    'ManagedBy': 'CDK-AutoDetection'
                }
            )
            
            detector_id = response['DetectorId']
            mode = 'new'
        
        # Ensure S3 files exist for ThreatIntelSet and IPSet
        _create_s3_files_if_needed(s3_client, bucket_name)
        
        # Create or find ThreatIntelSet
        threat_intel_response = _manage_threat_intel_set(
            client, detector_id, bucket_name, unique_suffix
        )
        
        # Create or find IPSet
        ip_set_response = _manage_ip_set(
            client, detector_id, bucket_name, unique_suffix
        )
        
        return send_response(event, context, 'SUCCESS', {
            'DetectorId': detector_id,
            'Mode': mode,
            'ThreatIntelSetId': threat_intel_response['ThreatIntelSetId'],
            'IPSetId': ip_set_response['IpSetId']
        }, detector_id)
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return send_response(event, context, 'FAILED', {'Error': str(e)})


def _create_s3_files_if_needed(s3_client, bucket_name):
    """Create S3 files for ThreatIntelSet and IPSet if they don't exist"""
    
    # Create threat intel file if it doesn't exist
    try:
        s3_client.head_object(Bucket=bucket_name, Key='threat-intel/bad-ips.txt')
        print("Threat intel file already exists")
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            print("Creating threat intel file - does not exist")
            # Create a basic threat intel file
            s3_client.put_object(
                Bucket=bucket_name,
                Key='threat-intel/bad-ips.txt',
                Body='# Threat Intelligence IP List\n# Add malicious IPs here (one per line)\n# Example: 1.2.3.4\n',
                ContentType='text/plain'
            )
        else:
            print(f"Error checking threat intel file: {e}")
            raise e
    
    # Create trusted IPs file if it doesn't exist
    try:
        s3_client.head_object(Bucket=bucket_name, Key='trusted-ips/whitelist.txt')
        print("Trusted IPs file already exists")
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            print("Creating trusted IPs file - does not exist")
            # Create a basic trusted IPs file
            s3_client.put_object(
                Bucket=bucket_name,
                Key='trusted-ips/whitelist.txt',
                Body='# Trusted IP List\n# Add trusted IPs here (one per line)\n# Example: 10.0.0.0/8\n',
                ContentType='text/plain'
            )
        else:
            print(f"Error checking trusted IPs file: {e}")
            raise e


def _manage_threat_intel_set(client, detector_id, bucket_name, unique_suffix):
    """Create or find existing ThreatIntelSet"""
    threat_intel_name = f'BankingThreatIntel-{unique_suffix}'
    existing_threat_intel = None
    
    try:
        # List existing ThreatIntelSets
        threat_intel_list = client.list_threat_intel_sets(DetectorId=detector_id)
        for threat_intel_id in threat_intel_list.get('ThreatIntelSetIds', []):
            threat_intel_details = client.get_threat_intel_set(
                DetectorId=detector_id,
                ThreatIntelSetId=threat_intel_id
            )
            if threat_intel_details['Name'] == threat_intel_name:
                existing_threat_intel = threat_intel_id
                print(f"Using existing ThreatIntelSet: {threat_intel_name}")
                break
    except Exception as e:
        print(f"Warning: Could not list existing ThreatIntelSets: {e}")
    
    if existing_threat_intel:
        # Use existing ThreatIntelSet
        return {'ThreatIntelSetId': existing_threat_intel}
    else:
        # Create new ThreatIntelSet
        try:
            threat_intel_response = client.create_threat_intel_set(
                DetectorId=detector_id,
                Name=threat_intel_name,
                Format='TXT',
                Location=f's3://{bucket_name}/threat-intel/bad-ips.txt',
                Activate=True,
                Tags={
                    'Name': threat_intel_name,
                    'ManagedBy': 'ZeroTrust-CDK'
                }
            )
            print(f"Created new ThreatIntelSet: {threat_intel_name}")
            return threat_intel_response
        except Exception as e:
            if 'LimitExceeded' in str(e) or 'limit' in str(e).lower():
                print(f"ThreatIntelSet limit reached, using existing resources: {e}")
                # Try to use any existing ThreatIntelSet as fallback
                if threat_intel_list.get('ThreatIntelSetIds'):
                    return {'ThreatIntelSetId': threat_intel_list['ThreatIntelSetIds'][0]}
                else:
                    raise e
            else:
                raise e


def _manage_ip_set(client, detector_id, bucket_name, unique_suffix):
    """Create or find existing IPSet"""
    ip_set_name = f'TrustedBankingIPs-{unique_suffix}'
    existing_ip_set = None
    
    try:
        # List existing IPSets
        ip_set_list = client.list_ip_sets(DetectorId=detector_id)
        for ip_set_id in ip_set_list.get('IpSetIds', []):
            ip_set_details = client.get_ip_set(
                DetectorId=detector_id,
                IpSetId=ip_set_id
            )
            if ip_set_details['Name'] == ip_set_name:
                existing_ip_set = ip_set_id
                print(f"Using existing IPSet: {ip_set_name}")
                break
    except Exception as e:
        print(f"Warning: Could not list existing IPSets: {e}")
    
    if existing_ip_set:
        # Use existing IPSet
        return {'IpSetId': existing_ip_set}
    else:
        # Create new IPSet
        try:
            ip_set_response = client.create_ip_set(
                DetectorId=detector_id,
                Name=ip_set_name,
                Format='TXT',
                Location=f's3://{bucket_name}/trusted-ips/whitelist.txt',
                Activate=True,
                Tags={
                    'Name': ip_set_name,
                    'ManagedBy': 'ZeroTrust-CDK'
                }
            )
            print(f"Created new IPSet: {ip_set_name}")
            return ip_set_response
        except Exception as e:
            if 'LimitExceeded' in str(e) or 'limit' in str(e).lower():
                print(f"IPSet limit reached, using existing resources: {e}")
                # Try to use any existing IPSet as fallback
                if ip_set_list.get('IpSetIds'):
                    return {'IpSetId': ip_set_list['IpSetIds'][0]}
                else:
                    raise e
            else:
                raise e


def send_response(event, context, status, data, physical_id=None):
    """Send response back to CloudFormation"""
    response_body = json.dumps({
        'Status': status,
        'Reason': f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': physical_id or context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    })
    
    http = urllib3.PoolManager()
    try:
        response = http.request('PUT', event['ResponseURL'], body=response_body,
                              headers={'Content-Type': 'application/json'})
        print(f"Response status: {response.status}")
    except Exception as e:
        print(f"Failed to send response: {e}")
    
    return {'statusCode': 200, 'body': 'Complete'}