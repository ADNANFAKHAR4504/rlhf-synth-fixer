# lambda/rotation-function.py

import json
import logging
import os
import time
import boto3
import pymysql
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager')
rds_client = boto3.client('rds')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
RDS_ENDPOINT = os.environ['RDS_ENDPOINT']
RDS_DATABASE = os.environ['RDS_DATABASE']
MASTER_SECRET_ARN = os.environ['MASTER_SECRET_ARN']
MAX_RETRY_ATTEMPTS = int(os.environ.get('MAX_RETRY_ATTEMPTS', 3))


class RotationError(Exception):
    """Custom exception for rotation errors"""
    pass


def lambda_handler(event, context):
    """Main handler for credential rotation"""
    arn = event['SecretId']
    token = event['ClientRequestToken']
    step = event['Step']
    
    logger.info(f"Starting rotation for secret {arn} with step {step}")
    
    # Send metrics
    send_metric('RotationAttempts', 1, {'Step': step})
    
    try:
        if step == "createSecret":
            create_secret(arn, token)
        elif step == "setSecret":
            set_secret(arn, token)
        elif step == "testSecret":
            test_secret(arn, token)
        elif step == "finishSecret":
            finish_secret(arn, token)
        else:
            raise RotationError(f"Invalid step: {step}")
            
        logger.info(f"Successfully completed step {step}")
        send_metric('RotationSuccess', 1, {'Step': step})
        
    except Exception as e:
        logger.error(f"Rotation failed at step {step}: {str(e)}")
        send_metric('RotationFailures', 1, {'Step': step})
        
        # Attempt rollback for critical steps
        if step in ['setSecret', 'testSecret']:
            try:
                rollback_secret(arn, token)
            except Exception as rollback_error:
                logger.error(f"Rollback failed: {str(rollback_error)}")
        
        raise


def create_secret(arn, token):
    """Create a new secret version with generated password"""
    metadata = secrets_client.describe_secret(SecretId=arn)
    
    # Check if version already exists
    if token in metadata.get('VersionIdsToStages', {}):
        logger.info(f"Version {token} already exists")
        return
    
    # Get current secret
    current_secret = get_secret_value(arn, "AWSCURRENT")
    
    # Generate new password
    new_password = generate_password()
    
    # Create new secret version
    new_secret = current_secret.copy()
    new_secret['password'] = new_password
    new_secret['rotation_timestamp'] = int(time.time())
    
    secrets_client.put_secret_value(
        SecretId=arn,
        ClientRequestToken=token,
        SecretString=json.dumps(new_secret),
        VersionStages=['AWSPENDING']
    )
    
    logger.info(f"Created new secret version {token}")


def set_secret(arn, token):
    """Set the new password in the database"""
    pending_secret = get_secret_value(arn, "AWSPENDING", token)
    current_secret = get_secret_value(arn, "AWSCURRENT")
    master_secret = get_secret_value(MASTER_SECRET_ARN, "AWSCURRENT")
    
    # Connect to database with master credentials
    connection = None
    retry_count = 0
    
    while retry_count < MAX_RETRY_ATTEMPTS:
        try:
            connection = create_db_connection(master_secret)
            
            with connection.cursor() as cursor:
                # Update user password
                username = pending_secret['username']
                new_password = pending_secret['password']
                
                # Use MySQL 8.0 syntax for password update
                cursor.execute(
                    "ALTER USER %s@'%%' IDENTIFIED BY %s",
                    (username, new_password)
                )
                connection.commit()
                
                # Grant necessary privileges if needed
                cursor.execute(
                    "GRANT SELECT, INSERT, UPDATE, DELETE ON %s.* TO %s@'%%'",
                    (RDS_DATABASE, username)
                )
                connection.commit()
                
            logger.info(f"Successfully set new password for user {username}")
            break
            
        except pymysql.Error as e:
            retry_count += 1
            logger.warning(f"Database error (attempt {retry_count}/{MAX_RETRY_ATTEMPTS}): {str(e)}")
            
            if retry_count >= MAX_RETRY_ATTEMPTS:
                raise RotationError(f"Failed to set password after {MAX_RETRY_ATTEMPTS} attempts")
            
            time.sleep(2 ** retry_count)  # Exponential backoff
            
        finally:
            if connection:
                connection.close()


def test_secret(arn, token):
    """Test the new credentials"""
    pending_secret = get_secret_value(arn, "AWSPENDING", token)
    
    # Test connection with new credentials
    connection = None
    try:
        connection = create_db_connection(pending_secret)
        
        with connection.cursor() as cursor:
            # Test basic query
            cursor.execute("SELECT 1")
            result = cursor.fetchone()
            
            if result[0] != 1:
                raise RotationError("Connection test failed")
            
            # Test database access
            cursor.execute(f"USE {RDS_DATABASE}")
            cursor.execute("SELECT COUNT(*) FROM information_schema.tables")
            
        logger.info("Successfully tested new credentials")
        
    except pymysql.Error as e:
        raise RotationError(f"Failed to test new credentials: {str(e)}")
        
    finally:
        if connection:
            connection.close()


def finish_secret(arn, token):
    """Finish the rotation by promoting the pending version"""
    metadata = secrets_client.describe_secret(SecretId=arn)
    current_version = None
    
    for version in metadata.get('VersionIdsToStages', {}):
        if 'AWSCURRENT' in metadata['VersionIdsToStages'][version]:
            current_version = version
            break
    
    # Update version stages
    secrets_client.update_secret_version_stage(
        SecretId=arn,
        VersionStage='AWSCURRENT',
        MoveToVersionId=token,
        RemoveFromVersionId=current_version
    )
    
    logger.info(f"Rotation completed successfully for {arn}")


def rollback_secret(arn, token):
    """Rollback to previous version in case of failure"""
    logger.info(f"Attempting rollback for secret {arn}")
    
    try:
        # Get current secret
        current_secret = get_secret_value(arn, "AWSCURRENT")
        master_secret = get_secret_value(MASTER_SECRET_ARN, "AWSCURRENT")
        
        # Restore previous password
        connection = create_db_connection(master_secret)
        try:
            with connection.cursor() as cursor:
                cursor.execute(
                    "ALTER USER %s@'%%' IDENTIFIED BY %s",
                    (current_secret['username'], current_secret['password'])
                )
                connection.commit()
                
            logger.info("Successfully rolled back to previous password")
            send_metric('RotationRollbacks', 1)
            
        finally:
            connection.close()
            
    except Exception as e:
        logger.error(f"Rollback failed: {str(e)}")
        send_metric('RotationRollbackFailures', 1)
        raise


def get_secret_value(arn, stage, token=None):
    """Retrieve secret value from Secrets Manager"""
    try:
        kwargs = {'SecretId': arn}
        if token:
            kwargs['VersionId'] = token
        else:
            kwargs['VersionStage'] = stage
            
        response = secrets_client.get_secret_value(**kwargs)
        return json.loads(response['SecretString'])
        
    except ClientError as e:
        raise RotationError(f"Failed to retrieve secret: {str(e)}")


def create_db_connection(secret):
    """Create database connection"""
    host = RDS_ENDPOINT.split(':')[0]
    port = int(RDS_ENDPOINT.split(':')[1]) if ':' in RDS_ENDPOINT else 3306
    
    return pymysql.connect(
        host=host,
        port=port,
        user=secret['username'],
        password=secret['password'],
        database=RDS_DATABASE,
        connect_timeout=10,
        read_timeout=10,
        write_timeout=10,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor,
        ssl={'ssl': True}
    )


def generate_password():
    """Generate a strong password"""
    response = secrets_client.get_random_password(
        PasswordLength=32,
        ExcludeCharacters='/@"\'\\'
    )
    return response['RandomPassword']


def send_metric(metric_name, value, dimensions=None):
    """Send custom metric to CloudWatch"""
    try:
        metric_data = {
            'MetricName': metric_name,
            'Value': value,
            'Unit': 'Count',
            'Timestamp': time.time()
        }
        
        if dimensions:
            metric_data['Dimensions'] = [
                {'Name': k, 'Value': v} for k, v in dimensions.items()
            ]
        
        cloudwatch.put_metric_data(
            Namespace='CredentialRotation',
            MetricData=[metric_data]
        )
    except Exception as e:
        logger.warning(f"Failed to send metric: {str(e)}")