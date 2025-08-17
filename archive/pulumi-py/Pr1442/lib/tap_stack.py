
#!/usr/bin/env python3
"""
AWS Multi-Environment CI/CD Pipeline Infrastructure with Pulumi

This module provisions CI/CD pipeline infrastructure across development (us-west-2)
and production (eu-central-1) environments using standardized naming conventions
and automated deployment capabilities with dynamic naming to avoid conflicts.
"""

import json
import time
import os
from typing import Dict, Any, Optional

import pulumi
import pulumi_aws as aws


def clean_aws_suffix(suffix):
    """Clean suffix to be AWS resource name compliant."""
    if not suffix:
        return str(int(time.time()))
    
    # Convert to lowercase and replace invalid chars
    cleaned = suffix.lower()
    cleaned = ''.join(c for c in cleaned if c.isalnum() or c == '-')
    
    # Ensure it doesn't start or end with hyphen
    cleaned = cleaned.strip('-')
    
    # Ensure it's not empty and not too long
    if not cleaned:
        cleaned = str(int(time.time()))
    elif len(cleaned) > 20:
        cleaned = cleaned[:20].rstrip('-')
    
    return cleaned


def get_environment_config() -> Dict[str, Dict[str, Any]]:
  """Get environment-specific configuration for CI/CD pipeline infrastructure."""
  return {
    'dev': {
      'region': 'us-west-2',
      'environment': 'dev',
      'lambda_runtime': 'python3.9',
      'lambda_timeout': 300,
      'bucket_versioning': True,
      'lifecycle_days': 30
    },
    'prod': {
      'region': 'eu-central-1',
      'environment': 'prod',
      'lambda_runtime': 'python3.9',
      'lambda_timeout': 600,
      'bucket_versioning': True,
      'lifecycle_days': 90
    }
  }


def get_lambda_trust_policy() -> Dict[str, Any]:
  """Get Lambda execution role trust policy."""
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        }
      }
    ]
  }


def get_lambda_execution_policy(env: str, suffix: Optional[str] = None) -> Dict[str, Any]:
  """Get Lambda execution policy document."""
  artifacts_bucket = f"{env}-artifacts-bucket"
  deployment_bucket = f"{env}-deployment-packages"
  
  if suffix:
    artifacts_bucket = f"{env}-artifacts-bucket-{suffix}"
    deployment_bucket = f"{env}-deployment-packages-{suffix}"
    
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "arn:aws:logs:*:*:*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ],
        "Resource": [
          f"arn:aws:s3:::{artifacts_bucket}/*",
          f"arn:aws:s3:::{artifacts_bucket}",
          f"arn:aws:s3:::{deployment_bucket}/*",
          f"arn:aws:s3:::{deployment_bucket}"
        ]
      }
    ]
  }


def get_cicd_trust_policy() -> Dict[str, Any]:
  """Get CI/CD service role trust policy."""
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Effect": "Allow",
        "Principal": {
          "Service": [
            "codebuild.amazonaws.com",
            "codepipeline.amazonaws.com"
          ]
        }
      }
    ]
  }


def get_cicd_service_policy(env: str, suffix: Optional[str] = None) -> Dict[str, Any]:
  """Get CI/CD service policy document."""
  artifacts_bucket = f"{env}-artifacts-bucket"
  deployment_bucket = f"{env}-deployment-packages"
  function_name = f"{env}-deployment-automation"
  
  if suffix:
    artifacts_bucket = f"{env}-artifacts-bucket-{suffix}"
    deployment_bucket = f"{env}-deployment-packages-{suffix}"
    function_name = f"{env}-deployment-automation-{suffix}"
    
  return {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "s3:GetObject",
          "s3:PutObject",
          "s3:GetBucketVersioning"
        ],
        "Resource": [
          f"arn:aws:s3:::{artifacts_bucket}/*",
          f"arn:aws:s3:::{artifacts_bucket}",
          f"arn:aws:s3:::{deployment_bucket}/*",
          f"arn:aws:s3:::{deployment_bucket}"
        ]
      },
      {
        "Effect": "Allow",
        "Action": [
          "lambda:InvokeFunction",
          "lambda:UpdateFunctionCode"
        ],
        "Resource": f"arn:aws:lambda:*:*:function:{function_name}"
      }
    ]
  }


def create_lambda_role_with_provider(env: str, 
                                    opts: pulumi.ResourceOptions,
                                    suffix: Optional[str] = None) -> aws.iam.Role:
  """Create Lambda execution role with provider options."""
  role_name = f"{env}-lambda-execution-role"
  pulumi_resource_name = f"{env}-lambda-execution-role"
  
  if suffix:
    role_name = f"{env}-lambda-execution-role-{suffix}"
    pulumi_resource_name = f"{env}-lambda-execution-role-{suffix}"
    
  lambda_role = aws.iam.Role(
    pulumi_resource_name,
    name=role_name,
    assume_role_policy=json.dumps(get_lambda_trust_policy()),
    tags={
      "Environment": env,
      "Purpose": "CI/CD Pipeline",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )
  
  policy_name = f"{env}-lambda-execution-policy"
  pulumi_policy_name = f"{env}-lambda-execution-policy"
  
  if suffix:
    policy_name = f"{env}-lambda-execution-policy-{suffix}"
    pulumi_policy_name = f"{env}-lambda-execution-policy-{suffix}"
    
  aws.iam.RolePolicy(
    pulumi_policy_name,
    name=policy_name,
    role=lambda_role.id,
    policy=json.dumps(get_lambda_execution_policy(env, suffix)),
    opts=opts
  )
  
  return lambda_role


def create_cicd_role_with_provider(env: str, 
                                  opts: pulumi.ResourceOptions,
                                  suffix: Optional[str] = None) -> aws.iam.Role:
  """Create CI/CD service role with provider options."""
  role_name = f"{env}-cicd-service-role"
  pulumi_resource_name = f"{env}-cicd-service-role"
  
  if suffix:
    role_name = f"{env}-cicd-service-role-{suffix}"
    pulumi_resource_name = f"{env}-cicd-service-role-{suffix}"
    
  cicd_role = aws.iam.Role(
    pulumi_resource_name,
    name=role_name,
    assume_role_policy=json.dumps(get_cicd_trust_policy()),
    tags={
      "Environment": env,
      "Purpose": "CI/CD Pipeline",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )
  
  policy_name = f"{env}-cicd-service-policy"
  pulumi_policy_name = f"{env}-cicd-service-policy"
  
  if suffix:
    policy_name = f"{env}-cicd-service-policy-{suffix}"
    pulumi_policy_name = f"{env}-cicd-service-policy-{suffix}"
    
  aws.iam.RolePolicy(
    pulumi_policy_name,
    name=policy_name,
    role=cicd_role.id,
    policy=json.dumps(get_cicd_service_policy(env, suffix)),
    opts=opts
  )
  
  return cicd_role


def create_iam_roles_with_provider(env: str, 
                                  opts: pulumi.ResourceOptions,
                                  suffix: Optional[str] = None) -> Dict[str, aws.iam.Role]:
  """Create IAM roles with provider options."""
  return {
    'lambda_role': create_lambda_role_with_provider(env, opts, suffix),
    'cicd_role': create_cicd_role_with_provider(env, opts, suffix)
  }


def create_artifacts_bucket_with_provider(env: str, 
                                        config: Dict[str, Any], 
                                        opts: pulumi.ResourceOptions,
                                        suffix: Optional[str] = None) -> aws.s3.Bucket:
  """Create S3 bucket for artifacts storage with provider options."""
  bucket_name = f"{env}-artifacts-bucket"
  pulumi_resource_name = f"{env}-artifacts-bucket"
  
  if suffix:
    bucket_name = f"{env}-artifacts-bucket-{suffix}"
    pulumi_resource_name = f"{env}-artifacts-bucket-{suffix}"
    
  bucket = aws.s3.Bucket(
    pulumi_resource_name,
    bucket=bucket_name,
    tags={
      "Environment": env,
      "Purpose": "CI/CD Artifacts",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )
  
  versioning_resource_name = f"{env}-artifacts-bucket-versioning"
  lifecycle_resource_name = f"{env}-artifacts-bucket-lifecycle"
  
  if suffix:
    versioning_resource_name = f"{env}-artifacts-bucket-versioning-{suffix}"
    lifecycle_resource_name = f"{env}-artifacts-bucket-lifecycle-{suffix}"
  
  aws.s3.BucketVersioningV2(
    versioning_resource_name,
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled" if config['bucket_versioning'] else "Suspended"
    ),
    opts=opts
  )
  
  aws.s3.BucketLifecycleConfigurationV2(
    lifecycle_resource_name,
    bucket=bucket.id,
    rules=[
      aws.s3.BucketLifecycleConfigurationV2RuleArgs(
        id="delete_old_versions",
        status="Enabled",
        noncurrent_version_expiration=(
          aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=config['lifecycle_days']
          )
        )
      )
    ],
    opts=opts
  )
  
  return bucket


def create_deployment_bucket_with_provider(env: str, 
                                         config: Dict[str, Any], 
                                         opts: pulumi.ResourceOptions,
                                         suffix: Optional[str] = None) -> aws.s3.Bucket:
  """Create S3 bucket for deployment packages with provider options."""
  bucket_name = f"{env}-deployment-packages"
  pulumi_resource_name = f"{env}-deployment-packages"
  
  if suffix:
    bucket_name = f"{env}-deployment-packages-{suffix}"
    pulumi_resource_name = f"{env}-deployment-packages-{suffix}"
    
  bucket = aws.s3.Bucket(
    pulumi_resource_name,
    bucket=bucket_name,
    tags={
      "Environment": env,
      "Purpose": "Deployment Packages",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )
  
  versioning_resource_name = f"{env}-deployment-packages-versioning"
  lifecycle_resource_name = f"{env}-deployment-packages-lifecycle"
  
  if suffix:
    versioning_resource_name = f"{env}-deployment-packages-versioning-{suffix}"
    lifecycle_resource_name = f"{env}-deployment-packages-lifecycle-{suffix}"
  
  aws.s3.BucketVersioningV2(
    versioning_resource_name,
    bucket=bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
      status="Enabled" if config['bucket_versioning'] else "Suspended"
    ),
    opts=opts
  )
  
  aws.s3.BucketLifecycleConfigurationV2(
    lifecycle_resource_name,
    bucket=bucket.id,
    rules=[
      aws.s3.BucketLifecycleConfigurationV2RuleArgs(
        id="delete_old_versions",
        status="Enabled",
        noncurrent_version_expiration=(
          aws.s3.BucketLifecycleConfigurationV2RuleNoncurrentVersionExpirationArgs(
            noncurrent_days=config['lifecycle_days']
          )
        )
      )
    ],
    opts=opts
  )
  
  return bucket


def create_s3_buckets_with_provider(env: str, 
                                   config: Dict[str, Any], 
                                   opts: pulumi.ResourceOptions,
                                   suffix: Optional[str] = None) -> Dict[str, aws.s3.Bucket]:
  """Create S3 buckets with provider options."""
  return {
    'artifacts_bucket': create_artifacts_bucket_with_provider(env, config, opts, suffix),
    'deployment_bucket': create_deployment_bucket_with_provider(env, config, opts, suffix)
  }


def get_deployment_lambda_code() -> str:
  """Get the deployment automation Lambda function code."""
  return '''
import json
import boto3
import os

def lambda_handler(event, context):
    """Handle deployment automation for CI/CD pipeline."""
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    
    print(f"Processing deployment for environment: {environment}")
    print(f"Event: {json.dumps(event)}")
    
    # Initialize AWS clients
    s3_client = boto3.client('s3')
    
    try:
        # Process deployment based on event type
        if event.get('source') == 'aws.s3':
            # Handle S3 trigger events
            bucket_name = event['Records'][0]['s3']['bucket']['name']
            object_key = event['Records'][0]['s3']['object']['key']
            
            print(f"Processing S3 object: {bucket_name}/{object_key}")
            
            # Add deployment logic here
            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Successfully processed deployment for {environment}',
                    'bucket': bucket_name,
                    'object': object_key
                })
            }
        else:
            # Handle direct invocation
            response = {
                'statusCode': 200,
                'body': json.dumps({
                    'message': f'Deployment automation ready for {environment}',
                    'event': event
                })
            }
            
        return response
        
    except Exception as e:
        print(f"Error processing deployment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'environment': environment
            })
        }
'''


def get_trigger_lambda_code() -> str:
  """Get the pipeline trigger Lambda function code."""
  return '''
import json
import boto3
import os

def lambda_handler(event, context):
    """Handle CI/CD pipeline trigger events."""
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    
    print(f"Pipeline trigger activated for environment: {environment}")
    print(f"Event: {json.dumps(event)}")
    
    # Initialize AWS clients
    lambda_client = boto3.client('lambda')
    
    try:
        # Trigger deployment automation
        deployment_function = os.environ.get('DEPLOYMENT_FUNCTION')
        
        response = lambda_client.invoke(
            FunctionName=deployment_function,
            InvocationType='Event',
            Payload=json.dumps({
                'source': 'pipeline-trigger',
                'environment': environment,
                'trigger_event': event
            })
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Pipeline trigger successful for {environment}',
                'deployment_function': deployment_function,
                'response': response['StatusCode']
            })
        }
        
    except Exception as e:
        print(f"Error triggering pipeline: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'environment': environment
            })
        }
'''


def create_deployment_function_with_provider(env: str,
                                           config: Dict[str, Any],
                                           lambda_role: aws.iam.Role,
                                           opts: pulumi.ResourceOptions,
                                           suffix: Optional[str] = None) -> aws.lambda_.Function:
  """Create deployment automation Lambda function with provider options."""
  function_name = f"{env}-deployment-automation"
  pulumi_resource_name = f"{env}-deployment-automation"
  artifacts_bucket = f"{env}-artifacts-bucket"
  deployment_bucket = f"{env}-deployment-packages"
  
  if suffix:
    function_name = f"{env}-deployment-automation-{suffix}"
    pulumi_resource_name = f"{env}-deployment-automation-{suffix}"
    artifacts_bucket = f"{env}-artifacts-bucket-{suffix}"
    deployment_bucket = f"{env}-deployment-packages-{suffix}"
  
  return aws.lambda_.Function(
    pulumi_resource_name,
    name=function_name,
    runtime=config['lambda_runtime'],
    handler="index.lambda_handler",
    role=lambda_role.arn,
    code=pulumi.AssetArchive({
      "index.py": pulumi.StringAsset(get_deployment_lambda_code())
    }),
    timeout=config['lambda_timeout'],
    environment=aws.lambda_.FunctionEnvironmentArgs(
      variables={
        "ENVIRONMENT": env,
        "ARTIFACTS_BUCKET": artifacts_bucket,
        "DEPLOYMENT_BUCKET": deployment_bucket
      }
    ),
    tags={
      "Environment": env,
      "Purpose": "Deployment Automation",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )


def create_trigger_function_with_provider(env: str,
                                        config: Dict[str, Any],
                                        lambda_role: aws.iam.Role,
                                        opts: pulumi.ResourceOptions,
                                        suffix: Optional[str] = None) -> aws.lambda_.Function:
  """Create pipeline trigger Lambda function with provider options."""
  function_name = f"{env}-pipeline-trigger"
  pulumi_resource_name = f"{env}-pipeline-trigger"
  deployment_function = f"{env}-deployment-automation"
  
  if suffix:
    function_name = f"{env}-pipeline-trigger-{suffix}"
    pulumi_resource_name = f"{env}-pipeline-trigger-{suffix}"
    deployment_function = f"{env}-deployment-automation-{suffix}"
  
  return aws.lambda_.Function(
    pulumi_resource_name,
    name=function_name,
    runtime=config['lambda_runtime'],
    handler="index.lambda_handler",
    role=lambda_role.arn,
    code=pulumi.AssetArchive({
      "index.py": pulumi.StringAsset(get_trigger_lambda_code())
    }),
    timeout=config['lambda_timeout'],
    environment=aws.lambda_.FunctionEnvironmentArgs(
      variables={
        "ENVIRONMENT": env,
        "DEPLOYMENT_FUNCTION": deployment_function
      }
    ),
    tags={
      "Environment": env,
      "Purpose": "Pipeline Trigger",
      "ManagedBy": "Pulumi"
    },
    opts=opts
  )


def create_lambda_functions_with_provider(env: str,
                                        config: Dict[str, Any],
                                        roles: Dict[str, aws.iam.Role],
                                        opts: pulumi.ResourceOptions,
                                        suffix: Optional[str] = None) -> Dict[str, aws.lambda_.Function]:
  """Create Lambda functions with provider options."""
  return {
    'deployment_function': create_deployment_function_with_provider(env, config, roles['lambda_role'], opts, suffix),
    'trigger_function': create_trigger_function_with_provider(env, config, roles['lambda_role'], opts, suffix)
  }


def create_environment_infrastructure_with_provider(env: str, 
                                                   config: Dict[str, Any],
                                                   opts: pulumi.ResourceOptions,
                                                   suffix: Optional[str] = None) -> Dict[str, Any]:
  """Create complete CI/CD infrastructure for a specific environment with provider options."""
  roles = create_iam_roles_with_provider(env, opts, suffix)
  buckets = create_s3_buckets_with_provider(env, config, opts, suffix)
  functions = create_lambda_functions_with_provider(env, config, roles, opts, suffix)
  
  return {
    'environment': env,
    'region': config['region'],
    'roles': roles,
    'buckets': buckets,
    'functions': functions
  }


class TapStackArgs:
  """Arguments for TapStack to satisfy test compatibility requirements."""
  
  def __init__(self, 
               environment: Optional[str] = None, 
               region: Optional[str] = None,
               environment_suffix: Optional[str] = None):
    """Initialize TapStackArgs with optional parameters."""
    self.environment = environment
    self.region = region
    self.environment_suffix = environment_suffix


class TapStack:
  """Main stack class for CI/CD pipeline infrastructure deployment."""
  
  def __init__(self,
               name: str,
               args: Optional[TapStackArgs] = None,
               opts: Optional[pulumi.ResourceOptions] = None):
    """Initialize TapStack and deploy CI/CD infrastructure."""
    self.name = name
    self.args = args or TapStackArgs()
    self.opts = opts
    
    # Get suffix directly from environment - no dynamic mapping
    self.deployment_suffix = clean_aws_suffix(
        self.args.environment_suffix or 
        os.environ.get('ENVIRONMENT_SUFFIX') or 
        str(int(time.time()))
    )
    
    print("=" * 60)
    print("🚀 CI/CD DEPLOYMENT STARTING")
    print("=" * 60)
    print(f"📋 Deployment suffix: {self.deployment_suffix}")
    print(f"📋 Resources will be created with names like:")
    print(f"   • dev-lambda-execution-role-{self.deployment_suffix}")
    print(f"   • dev-artifacts-bucket-{self.deployment_suffix}")
    print("📋 This ensures no conflicts with other PRs!")
    print("=" * 60)
    
    self.infrastructure = self._deploy_infrastructure()
    self._export_outputs()

  def _deploy_infrastructure(self) -> Dict[str, Dict[str, Any]]:
    """Deploy the CI/CD infrastructure for dev environment only."""
    environments = get_environment_config()
    infrastructure = {}
    
    # Always use 'dev' environment configuration, but with the provided suffix
    target_env = 'dev'
    config = environments[target_env]
    
    print(f"🎯 Target environment: {target_env}")
    print(f"🎯 Deployment suffix: {self.deployment_suffix}")
    
    # Create provider with the suffix
    provider = aws.Provider(
        f"{target_env}-provider-{self.deployment_suffix}",
        region=config['region'],
        default_tags=aws.ProviderDefaultTagsArgs(
            tags={
                "Environment": target_env,
                "ManagedBy": "Pulumi",
                "Project": "CI/CD Pipeline",
                "DeploymentId": self.deployment_suffix
            }
        )
    )
    
    opts = pulumi.ResourceOptions(provider=provider)
    infrastructure[target_env] = create_environment_infrastructure_with_provider(
        target_env, config, opts, self.deployment_suffix
    )
    
    print(f"✅ Infrastructure created for environment: {target_env}")
    
    return infrastructure
  
  def _export_outputs(self) -> None:
    """Export stack outputs for external consumption."""
    for env, resources in self.infrastructure.items():
      pulumi.export(
        f"{env}_deployment_suffix",
        self.deployment_suffix
      )
      pulumi.export(
        f"{env}_artifacts_bucket",
        resources['buckets']['artifacts_bucket'].bucket
      )
      pulumi.export(
        f"{env}_deployment_bucket",
        resources['buckets']['deployment_bucket'].bucket
      )
      pulumi.export(
        f"{env}_deployment_function",
        resources['functions']['deployment_function'].name
      )
      pulumi.export(
        f"{env}_trigger_function",
        resources['functions']['trigger_function'].name
      )
      pulumi.export(f"{env}_lambda_role_arn", resources['roles']['lambda_role'].arn)
      pulumi.export(f"{env}_cicd_role_arn", resources['roles']['cicd_role'].arn)
      pulumi.export(f"{env}_region", resources['region'])
