#!/usr/bin/env python3
"""
Export Pulumi stack outputs to cfn-outputs/flat-outputs.json format.
This enables integration tests to read deployment outputs in a consistent format.
"""

import json
import os
import subprocess
import sys
from pathlib import Path


def get_pulumi_outputs() -> dict:
    """Get outputs from Pulumi stack."""
    try:
        # Get the stack name from environment or use default
        stack_name = os.environ.get('PULUMI_STACK', 'CloudEnvStack' + os.environ.get('ENVIRONMENT_SUFFIX', 'pr8999'))

        # Run pulumi stack output command
        result = subprocess.run(
            ['pulumi', 'stack', 'output', '--json', '--stack', stack_name],
            capture_output=True,
            text=True,
            check=True
        )

        outputs = json.loads(result.stdout)
        return outputs
    except subprocess.CalledProcessError as e:
        print(f"Error getting Pulumi outputs: {e.stderr}", file=sys.stderr)
        return {}
    except json.JSONDecodeError as e:
        print(f"Error parsing Pulumi outputs: {e}", file=sys.stderr)
        return {}


def flatten_outputs(outputs: dict) -> dict:
    """
    Flatten Pulumi outputs to match the expected flat-outputs.json format.

    Expected keys for integration tests:
    - api_gateway_url
    - lambda_data_processor_arn
    - lambda_api_handler_arn
    - s3_bucket_data
    - s3_bucket_logs
    - kinesis_stream_data
    - kinesis_stream_error
    - region
    """
    flat = {}

    # API Gateway URL
    if 'api_gateway_url' in outputs:
        flat['api_gateway_url'] = outputs['api_gateway_url']

    # Lambda functions
    if 'lambda_functions' in outputs:
        lambda_funcs = outputs['lambda_functions']
        if isinstance(lambda_funcs, dict):
            for name, arn in lambda_funcs.items():
                flat[f'lambda_{name}_arn'] = arn

    # S3 buckets
    if 's3_buckets' in outputs:
        s3_buckets = outputs['s3_buckets']
        if isinstance(s3_buckets, dict):
            for name, bucket_name in s3_buckets.items():
                flat[f's3_bucket_{name}'] = bucket_name

    # Kinesis streams
    if 'kinesis_streams' in outputs:
        kinesis_streams = outputs['kinesis_streams']
        if isinstance(kinesis_streams, dict):
            for name, arn in kinesis_streams.items():
                # Extract stream name from ARN
                stream_name = arn.split('/')[-1] if '/' in arn else arn
                flat[f'kinesis_stream_{name}'] = stream_name

    # Region
    if 'region' in outputs:
        flat['region'] = outputs['region']

    # Environment
    if 'environment' in outputs:
        flat['environment'] = outputs['environment']

    return flat


def export_outputs():
    """Export Pulumi outputs to cfn-outputs/flat-outputs.json."""
    print("Fetching Pulumi stack outputs...")
    outputs = get_pulumi_outputs()

    if not outputs:
        print("Warning: No outputs found from Pulumi stack", file=sys.stderr)
        # Create empty outputs file for tests to skip gracefully
        outputs = {}

    print(f"Found {len(outputs)} output(s)")

    # Flatten outputs
    flat_outputs = flatten_outputs(outputs)
    print(f"Flattened to {len(flat_outputs)} key(s)")

    # Create output directory
    output_dir = Path('cfn-outputs')
    output_dir.mkdir(exist_ok=True)

    # Write flat outputs
    output_file = output_dir / 'flat-outputs.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(flat_outputs, f, indent=2, sort_keys=True)

    print(f"Exported outputs to {output_file}")
    print("\nExported keys:")
    for key in sorted(flat_outputs.keys()):
        value = flat_outputs[key]
        # Truncate long values for display
        display_value = str(value)[:60] + '...' if len(str(value)) > 60 else value
        print(f"  {key}: {display_value}")

    return 0


if __name__ == '__main__':
    sys.exit(export_outputs())
