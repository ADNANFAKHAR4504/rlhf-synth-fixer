import json

def lambda_handler(event, context):
    """
    CloudFormation Macro to automatically inject environment tags based on account ID.

    This macro transforms CloudFormation templates by adding standardized tags
    to all resources based on the AWS account ID. It maps account IDs to
    environment types (production, staging, development).

    Args:
        event: CloudFormation macro event with template fragment
        context: Lambda context object

    Returns:
        dict: Transformed template fragment with injected tags
    """
    print(f'Macro Event: {json.dumps(event)}')

    # Account ID to environment mapping
    # Update these values for your specific AWS accounts
    account_environment_map = {
        '111111111111': 'production',
        '222222222222': 'staging',
        '333333333333': 'development'
    }

    try:
        # Extract template fragment and request parameters
        fragment = event['fragment']
        request_id = event['requestId']
        account_id = event['accountId']
        region = event['region']

        # Determine environment type from account ID
        environment_type = account_environment_map.get(account_id, 'unknown')

        print(f'Processing template for account {account_id} (environment: {environment_type})')

        # Standard tags to inject
        standard_tags = [
            {
                'Key': 'Environment',
                'Value': environment_type
            },
            {
                'Key': 'AccountId',
                'Value': account_id
            },
            {
                'Key': 'Region',
                'Value': region
            },
            {
                'Key': 'ManagedBy',
                'Value': 'CloudFormation'
            },
            {
                'Key': 'CostCenter',
                'Value': f'analytics-{environment_type}'
            },
            {
                'Key': 'AutoTagged',
                'Value': 'true'
            }
        ]

        # Iterate through resources and inject tags
        if 'Resources' in fragment:
            for resource_name, resource_properties in fragment['Resources'].items():
                resource_type = resource_properties.get('Type', '')

                # List of resource types that support tags
                taggable_resources = [
                    'AWS::S3::Bucket',
                    'AWS::Lambda::Function',
                    'AWS::DynamoDB::Table',
                    'AWS::IAM::Role',
                    'AWS::EC2::VPC',
                    'AWS::EC2::Subnet',
                    'AWS::EC2::SecurityGroup',
                    'AWS::SNS::Topic',
                    'AWS::CloudFormation::Stack',
                    'AWS::ServiceCatalog::Portfolio'
                ]

                # Check if resource type supports tagging
                if any(taggable_type in resource_type for taggable_type in taggable_resources):
                    # Initialize Properties if not exists
                    if 'Properties' not in resource_properties:
                        resource_properties['Properties'] = {}

                    # Initialize Tags if not exists
                    if 'Tags' not in resource_properties['Properties']:
                        resource_properties['Properties']['Tags'] = []

                    # Get existing tags
                    existing_tags = resource_properties['Properties']['Tags']
                    existing_tag_keys = [tag.get('Key') for tag in existing_tags]

                    # Inject standard tags if not already present
                    for tag in standard_tags:
                        if tag['Key'] not in existing_tag_keys:
                            existing_tags.append(tag)

                    print(f'Injected tags for resource: {resource_name} ({resource_type})')

        # Return transformed template
        return {
            'requestId': request_id,
            'status': 'success',
            'fragment': fragment
        }

    except Exception as e:
        error_message = f'Error processing macro: {str(e)}'
        print(error_message)

        return {
            'requestId': event.get('requestId', 'unknown'),
            'status': 'failure',
            'errorMessage': error_message
        }
