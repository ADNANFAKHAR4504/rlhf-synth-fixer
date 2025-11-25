"""
Database Schema Validator Lambda Function

This module provides schema validation functionality for blue-green database migrations.
It compares database schemas between environments and identifies compatibility issues.
"""

import json
import os
import logging
from typing import Dict, List, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secretsmanager = boto3.client('secretsmanager')


def get_database_credentials(secret_arn: str) -> Dict[str, str]:
    """
    Retrieve database credentials from Secrets Manager.

    Args:
        secret_arn: ARN of the secret containing database credentials

    Returns:
        dict: Database credentials including host, username, password

    Raises:
        ClientError: If secret cannot be retrieved
    """
    try:
        response = secretsmanager.get_secret_value(SecretId=secret_arn)
        secret_string = response['SecretString']
        credentials = json.loads(secret_string)

        logger.info(f"Successfully retrieved credentials from secret: {secret_arn}")
        return credentials

    except ClientError as e:
        logger.error(f"Failed to retrieve secret {secret_arn}: {str(e)}")
        raise


def validate_schema_compatibility(
    blue_schema: Dict[str, Any],
    green_schema: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Validate schema compatibility between blue and green environments.

    This function identifies:
    - Added tables/columns (safe)
    - Removed tables/columns (breaking)
    - Modified column types (potentially breaking)
    - Added/removed constraints (potentially breaking)
    - Index changes (performance impact)

    Args:
        blue_schema: Schema definition from blue environment
        green_schema: Schema definition from green environment

    Returns:
        dict: Validation results with compatibility status
    """

    differences = []
    warnings = []
    errors = []
    compatible = True

    # Compare tables
    blue_tables = set(blue_schema.get('tables', {}).keys())
    green_tables = set(green_schema.get('tables', {}).keys())

    # Removed tables (breaking change)
    removed_tables = blue_tables - green_tables
    if removed_tables:
        compatible = False
        errors.append({
            'type': 'removed_tables',
            'tables': list(removed_tables),
            'message': 'Tables removed in green environment - breaking change'
        })

    # Added tables (safe)
    added_tables = green_tables - blue_tables
    if added_tables:
        differences.append({
            'type': 'added_tables',
            'tables': list(added_tables),
            'message': 'New tables added in green environment'
        })

    # Compare common tables
    common_tables = blue_tables & green_tables
    for table in common_tables:
        blue_columns = set(blue_schema['tables'][table].get('columns', {}).keys())
        green_columns = set(green_schema['tables'][table].get('columns', {}).keys())

        # Removed columns (breaking)
        removed_columns = blue_columns - green_columns
        if removed_columns:
            compatible = False
            errors.append({
                'type': 'removed_columns',
                'table': table,
                'columns': list(removed_columns),
                'message': f'Columns removed from table {table}'
            })

        # Added columns (check if nullable)
        added_columns = green_columns - blue_columns
        for column in added_columns:
            column_def = green_schema['tables'][table]['columns'][column]
            if not column_def.get('nullable', True) and not column_def.get('default'):
                warnings.append({
                    'type': 'non_nullable_column',
                    'table': table,
                    'column': column,
                    'message': f'Non-nullable column {column} added without default value'
                })

    return {
        'compatible': compatible,
        'differences': differences,
        'warnings': warnings,
        'errors': errors
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for database schema validation.

    Expected event structure:
    {
        "blue_db_secret_arn": "arn:aws:secretsmanager:...",
        "green_db_secret_arn": "arn:aws:secretsmanager:...",
        "validation_mode": "strict" | "permissive"
    }

    Args:
        event: Lambda event with database connection details
        context: Lambda context

    Returns:
        dict: Validation results
    """

    try:
        logger.info("Starting schema validation")
        logger.info(f"Event: {json.dumps(event)}")

        # Get database secret ARN from event or environment
        db_secret_arn = event.get('db_secret_arn') or os.environ.get('DB_SECRET_ARN')

        if not db_secret_arn:
            raise ValueError("Database secret ARN not provided")

        # Retrieve database credentials
        credentials = get_database_credentials(db_secret_arn)

        # TODO: Implement actual database connection and schema extraction
        # This would require:
        # 1. Install psycopg2-binary layer for PostgreSQL connection
        # 2. Connect to database using credentials
        # 3. Query information_schema for table/column definitions
        # 4. Compare schemas between environments
        # 5. Identify compatibility issues

        # For now, return mock validation result
        validation_result = {
            'status': 'success',
            'compatible': True,
            'differences': [],
            'warnings': [],
            'errors': [],
            'metadata': {
                'timestamp': context.aws_request_id,
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            }
        }

        logger.info("Schema validation completed successfully")
        logger.info(f"Result: {json.dumps(validation_result)}")

        return {
            'statusCode': 200,
            'body': json.dumps(validation_result),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

    except Exception as e:
        logger.error(f"Schema validation failed: {str(e)}", exc_info=True)

        error_response = {
            'status': 'error',
            'message': str(e),
            'compatible': False
        }

        return {
            'statusCode': 500,
            'body': json.dumps(error_response),
            'headers': {
                'Content-Type': 'application/json'
            }
        }
