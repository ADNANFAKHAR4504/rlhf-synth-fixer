"""
Lambda function for User Profile API
Handles CRUD operations for user profiles with Cognito authentication
"""

import json
import os
import boto3
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize DynamoDB client
# X-Ray tracing is automatically enabled when configured at Lambda function level
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return int(obj) if obj % 1 == 0 else float(obj)
        return super(DecimalEncoder, self).default(obj)


def response(status_code, body):
    """Helper function to create API Gateway response"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }


def get_user_id_from_context(event):
    """Extract userId from Cognito authorizer context"""
    try:
        authorizer = event.get('requestContext', {}).get('authorizer', {})
        claims = authorizer.get('claims', {})
        return claims.get('sub') or claims.get('cognito:username')
    except Exception as e:
        print(f"Error extracting user ID: {str(e)}")
        return None


def validate_profile_data(data):
    """Validate profile data"""
    errors = []
    
    if not data.get('email'):
        errors.append('email is required')
    elif '@' not in data.get('email', ''):
        errors.append('email must be valid')
    
    if not data.get('name'):
        errors.append('name is required')
    elif len(data.get('name', '')) < 2:
        errors.append('name must be at least 2 characters')
    
    return errors


def create_profile(event):
    """Create a new user profile"""
    try:
        # Get user ID from Cognito context
        cognito_user_id = get_user_id_from_context(event)
        if not cognito_user_id:
            return response(401, {'error': 'Unauthorized - no user context'})
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input
        validation_errors = validate_profile_data(body)
        if validation_errors:
            return response(400, {'error': 'Validation failed', 'details': validation_errors})
        
        # Create profile
        profile_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        profile = {
            'userId': profile_id,
            'cognitoUserId': cognito_user_id,
            'email': body['email'],
            'name': body['name'],
            'phoneNumber': body.get('phoneNumber'),
            'bio': body.get('bio'),
            'createdAt': timestamp,
            'updatedAt': timestamp
        }
        
        # Save to DynamoDB
        table.put_item(Item=profile)
        
        return response(201, {
            'message': 'Profile created successfully',
            'profile': profile
        })
        
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        print(f"Error creating profile: {str(e)}")
        return response(500, {'error': 'Unable to process request'})


def get_profile(event):
    """Get a user profile by ID"""
    try:
        # Get user ID from path parameters
        user_id = event.get('pathParameters', {}).get('userId')
        if not user_id:
            return response(400, {'error': 'userId is required'})
        
        # Get from DynamoDB
        result = table.get_item(Key={'userId': user_id})
        
        if 'Item' not in result:
            return response(404, {'error': 'Profile not found'})
        
        return response(200, {'profile': result['Item']})
        
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return response(500, {'error': 'Unable to retrieve profile'})


def update_profile(event):
    """Update an existing user profile"""
    try:
        # Get user ID from path parameters
        user_id = event.get('pathParameters', {}).get('userId')
        if not user_id:
            return response(400, {'error': 'userId is required'})
        
        # Get Cognito user ID
        cognito_user_id = get_user_id_from_context(event)
        if not cognito_user_id:
            return response(401, {'error': 'Unauthorized - no user context'})
        
        # Check if profile exists
        existing = table.get_item(Key={'userId': user_id})
        if 'Item' not in existing:
            return response(404, {'error': 'Profile not found'})
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Validate input
        validation_errors = validate_profile_data(body)
        if validation_errors:
            return response(400, {'error': 'Validation failed', 'details': validation_errors})
        
        # Update profile
        timestamp = datetime.utcnow().isoformat()
        
        update_expression = "SET #name = :name, email = :email, updatedAt = :updatedAt"
        expression_attribute_names = {'#name': 'name'}
        expression_attribute_values = {
            ':name': body['name'],
            ':email': body['email'],
            ':updatedAt': timestamp
        }
        
        # Add optional fields
        if 'phoneNumber' in body:
            update_expression += ", phoneNumber = :phoneNumber"
            expression_attribute_values[':phoneNumber'] = body['phoneNumber']
        
        if 'bio' in body:
            update_expression += ", bio = :bio"
            expression_attribute_values[':bio'] = body['bio']
        
        result = table.update_item(
            Key={'userId': user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues='ALL_NEW'
        )
        
        return response(200, {
            'message': 'Profile updated successfully',
            'profile': result['Attributes']
        })
        
    except json.JSONDecodeError:
        return response(400, {'error': 'Invalid JSON in request body'})
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return response(500, {'error': 'Unable to update profile'})


def delete_profile(event):
    """Delete a user profile"""
    try:
        # Get user ID from path parameters
        user_id = event.get('pathParameters', {}).get('userId')
        if not user_id:
            return response(400, {'error': 'userId is required'})
        
        # Get Cognito user ID
        cognito_user_id = get_user_id_from_context(event)
        if not cognito_user_id:
            return response(401, {'error': 'Unauthorized - no user context'})
        
        # Check if profile exists
        existing = table.get_item(Key={'userId': user_id})
        if 'Item' not in existing:
            return response(404, {'error': 'Profile not found'})
        
        # Delete profile
        table.delete_item(Key={'userId': user_id})
        
        return response(200, {
            'message': 'Profile deleted successfully',
            'userId': user_id
        })
        
    except Exception as e:
        print(f"Error deleting profile: {str(e)}")
        return response(500, {'error': 'Unable to delete profile'})


def list_profiles(event):
    """List all user profiles"""
    try:
        # Get Cognito user ID
        cognito_user_id = get_user_id_from_context(event)
        if not cognito_user_id:
            return response(401, {'error': 'Unauthorized - no user context'})
        
        # Scan table (in production, consider pagination)
        result = table.scan(Limit=100)
        
        return response(200, {
            'profiles': result.get('Items', []),
            'count': len(result.get('Items', []))
        })
        
    except Exception as e:
        print(f"Error listing profiles: {str(e)}")
        return response(500, {'error': 'Unable to retrieve profiles'})


def lambda_handler(event, context):
    """Main Lambda handler function"""
    print(f"Event: {json.dumps(event)}")
    
    # Handle OPTIONS request for CORS
    http_method = event.get('httpMethod', '')
    if http_method == 'OPTIONS':
        return response(200, {'message': 'OK'})
    
    # Route to appropriate handler based on HTTP method and path
    resource_path = event.get('resource', '')
    
    try:
        if resource_path == '/profiles' and http_method == 'POST':
            return create_profile(event)
        elif resource_path == '/profiles' and http_method == 'GET':
            return list_profiles(event)
        elif resource_path == '/profiles/{userId}' and http_method == 'GET':
            return get_profile(event)
        elif resource_path == '/profiles/{userId}' and http_method == 'PUT':
            return update_profile(event)
        elif resource_path == '/profiles/{userId}' and http_method == 'DELETE':
            return delete_profile(event)
        else:
            return response(404, {'error': 'Not found'})
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return response(500, {'error': 'Unable to process request'})

