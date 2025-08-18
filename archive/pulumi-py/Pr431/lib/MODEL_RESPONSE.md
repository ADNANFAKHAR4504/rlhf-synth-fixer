# Serverless E-commerce Infrastructure with Pulumi and Python

I'll implement a comprehensive serverless infrastructure solution that meets all the specified requirements. Here's the complete implementation:

## Project Structure

```
ecommerce-infrastructure/
├── __init__.py
├── main.py
├── infrastructure/
│   ├── __init__.py
│   ├── api_gateway.py
│   ├── dynamodb.py
│   ├── iam.py
│   ├── lambda_functions.py
│   └── vpc.py
├── lambda_code/
│   ├── products/
│   │   └── handler.py
│   ├── orders/
│   │   └── handler.py
│   └── users/
│       └── handler.py
├── tests/
│   ├── __init__.py
│   └── test_infrastructure.py
├── config/
│   ├── __init__.py
│   └── settings.py
├── requirements.txt
└── Pulumi.yaml
```

## Main Implementation

### 1. Configuration Settings (`config/settings.py`)

```python
"""Configuration settings for the e-commerce infrastructure."""
import os
from typing import Dict, Any


class Config:
    """Configuration class for environment-specific settings."""
    
    def __init__(self, environment: str = "dev"):
        self.environment = environment
        self.region = os.getenv("AWS_REGION", "us-west-2")
        self.project_name = "ecommerce"
        
    def get_resource_name(self, resource_type: str) -> str:
        """Generate dynamic resource names based on environment."""
        return f"{self.project_name}-{resource_type}-{self.environment}"
    
    def get_vpc_config(self) -> Dict[str, Any]:
        """Get VPC configuration with valid CIDR blocks."""
        return {
            "cidr_block": "10.0.0.0/16",
            "public_subnet_cidrs": ["10.0.1.0/24", "10.0.2.0/24"],
            "private_subnet_cidrs": ["10.0.3.0/24", "10.0.4.0/24"]
        }
    
    def get_dynamodb_config(self) -> Dict[str, Any]:
        """Get DynamoDB configuration based on environment."""
        capacity_configs = {
            "dev": {"read": 5, "write": 5},
            "staging": {"read": 10, "write": 10},
            "prod": {"read": 50, "write": 50}
        }
        return capacity_configs.get(self.environment, capacity_configs["dev"])
    
    def get_cors_domains(self) -> list:
        """Get CORS allowed domains based on environment."""
        domains = {
            "dev": ["http://localhost:3000"],
            "staging": ["https://staging.ecommerce.com"],
            "prod": ["https://ecommerce.com", "https://www.ecommerce.com"]
        }
        return domains.get(self.environment, domains["dev"])
```

### 2. VPC Infrastructure (`infrastructure/vpc.py`)

```python
"""VPC infrastructure components."""
import pulumi
import pulumi_aws as aws
from config.settings import Config


class VPCInfrastructure:
    """VPC infrastructure for Lambda functions."""
    
    def __init__(self, config: Config):
        self.config = config
        self.vpc = None
        self.public_subnets = []
        self.private_subnets = []
        self.security_group = None
        
    def create_vpc(self) -> None:
        """Create VPC with public and private subnets."""
        vpc_config = self.config.get_vpc_config()
        
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            self.config.get_resource_name("vpc"),
            cidr_block=vpc_config["cidr_block"],
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": self.config.get_resource_name("vpc"),
                "Environment": self.config.environment
            }
        )
        
        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
            self.config.get_resource_name("igw"),
            vpc_id=self.vpc.id,
            tags={
                "Name": self.config.get_resource_name("igw"),
                "Environment": self.config.environment
            }
        )
        
        # Create public subnets
        availability_zones = aws.get_availability_zones(state="available")
        
        for i, cidr in enumerate(vpc_config["public_subnet_cidrs"]):
            subnet = aws.ec2.Subnet(
                f"{self.config.get_resource_name('public-subnet')}-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=availability_zones.names[i],
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.config.get_resource_name('public-subnet')}-{i+1}",
                    "Environment": self.config.environment,
                    "Type": "Public"
                }
            )
            self.public_subnets.append(subnet)
        
        # Create private subnets
        for i, cidr in enumerate(vpc_config["private_subnet_cidrs"]):
            subnet = aws.ec2.Subnet(
                f"{self.config.get_resource_name('private-subnet')}-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=cidr,
                availability_zone=availability_zones.names[i],
                tags={
                    "Name": f"{self.config.get_resource_name('private-subnet')}-{i+1}",
                    "Environment": self.config.environment,
                    "Type": "Private"
                }
            )
            self.private_subnets.append(subnet)
        
        # Create route table for public subnets
        public_rt = aws.ec2.RouteTable(
            self.config.get_resource_name("public-rt"),
            vpc_id=self.vpc.id,
            tags={
                "Name": self.config.get_resource_name("public-rt"),
                "Environment": self.config.environment
            }
        )
        
        # Add route to internet gateway
        aws.ec2.Route(
            self.config.get_resource_name("public-route"),
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )
        
        # Associate public subnets with route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.config.get_resource_name('public-rta')}-{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )
        
        # Create security group for Lambda functions
        self.security_group = aws.ec2.SecurityGroup(
            self.config.get_resource_name("lambda-sg"),
            description="Security group for Lambda functions",
            vpc_id=self.vpc.id,
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"]
            }],
            tags={
                "Name": self.config.get_resource_name("lambda-sg"),
                "Environment": self.config.environment
            }
        )
```

### 3. IAM Roles (`infrastructure/iam.py`)

```python
"""IAM roles and policies for Lambda functions."""
import json
import pulumi_aws as aws
from config.settings import Config


class IAMInfrastructure:
    """IAM infrastructure for Lambda functions."""
    
    def __init__(self, config: Config):
        self.config = config
        self.lambda_role = None
        
    def create_lambda_role(self) -> aws.iam.Role:
        """Create IAM role for Lambda functions."""
        assume_role_policy = json.dumps({
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
        })
        
        self.lambda_role = aws.iam.Role(
            self.config.get_resource_name("lambda-role"),
            assume_role_policy=assume_role_policy,
            tags={
                "Name": self.config.get_resource_name("lambda-role"),
                "Environment": self.config.environment
            }
        )
        
        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name("lambda-basic-execution"),
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        )
        
        # Attach VPC access policy
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name("lambda-vpc-access"),
            role=self.lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )
        
        # Create custom policy for DynamoDB access
        dynamodb_policy = aws.iam.Policy(
            self.config.get_resource_name("lambda-dynamodb-policy"),
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": f"arn:aws:dynamodb:{self.config.region}:*:table/{self.config.project_name}-*-{self.config.environment}"
                    }
                ]
            })
        )
        
        aws.iam.RolePolicyAttachment(
            self.config.get_resource_name("lambda-dynamodb-attachment"),
            role=self.lambda_role.name,
            policy_arn=dynamodb_policy.arn
        )
        
        return self.lambda_role
```

### 4. DynamoDB Tables (`infrastructure/dynamodb.py`)

```python
"""DynamoDB tables for the e-commerce application."""
import pulumi_aws as aws
from config.settings import Config


class DynamoDBInfrastructure:
    """DynamoDB infrastructure for the e-commerce application."""
    
    def __init__(self, config: Config):
        self.config = config
        self.tables = {}
        
    def create_tables(self) -> dict:
        """Create DynamoDB tables with appropriate capacity."""
        capacity_config = self.config.get_dynamodb_config()
        
        # Products table
        self.tables['products'] = aws.dynamodb.Table(
            self.config.get_resource_name("products-table"),
            attributes=[
                {"name": "product_id", "type": "S"},
                {"name": "category", "type": "S"}
            ],
            hash_key="product_id",
            global_secondary_indexes=[{
                "name": "CategoryIndex",
                "hash_key": "category",
                "projection_type": "ALL",
                "read_capacity": capacity_config["read"],
                "write_capacity": capacity_config["write"]
            }],
            read_capacity=capacity_config["read"],
            write_capacity=capacity_config["write"],
            tags={
                "Name": self.config.get_resource_name("products-table"),
                "Environment": self.config.environment
            }
        )
        
        # Orders table
        self.tables['orders'] = aws.dynamodb.Table(
            self.config.get_resource_name("orders-table"),
            attributes=[
                {"name": "order_id", "type": "S"},
                {"name": "user_id", "type": "S"},
                {"name": "created_at", "type": "S"}
            ],
            hash_key="order_id",
            global_secondary_indexes=[{
                "name": "UserOrdersIndex",
                "hash_key": "user_id",
                "range_key": "created_at",
                "projection_type": "ALL",
                "read_capacity": capacity_config["read"],
                "write_capacity": capacity_config["write"]
            }],
            read_capacity=capacity_config["read"],
            write_capacity=capacity_config["write"],
            tags={
                "Name": self.config.get_resource_name("orders-table"),
                "Environment": self.config.environment
            }
        )
        
        # Users table
        self.tables['users'] = aws.dynamodb.Table(
            self.config.get_resource_name("users-table"),
            attributes=[
                {"name": "user_id", "type": "S"},
                {"name": "email", "type": "S"}
            ],
            hash_key="user_id",
            global_secondary_indexes=[{
                "name": "EmailIndex",
                "hash_key": "email",
                "projection_type": "ALL",
                "read_capacity": capacity_config["read"],
                "write_capacity": capacity_config["write"]
            }],
            read_capacity=capacity_config["read"],
            write_capacity=capacity_config["write"],
            tags={
                "Name": self.config.get_resource_name("users-table"),
                "Environment": self.config.environment
            }
        )
        
        return self.tables
```

### 5. Lambda Functions (`infrastructure/lambda_functions.py`)

```python
"""Lambda functions for the e-commerce application."""
import os
import pulumi
import pulumi_aws as aws
from config.settings import Config


class LambdaInfrastructure:
    """Lambda infrastructure for the e-commerce application."""
    
    def __init__(self, config: Config, iam_role: aws.iam.Role, 
                 vpc_config: dict, tables: dict):
        self.config = config
        self.iam_role = iam_role
        self.vpc_config = vpc_config
        self.tables = tables
        self.functions = {}
        
    def create_lambda_functions(self) -> dict:
        """Create Lambda functions with environment-specific configurations."""
        
        # Common environment variables
        common_env_vars = {
            "ENVIRONMENT": self.config.environment,
            "REGION": self.config.region,
            "PRODUCTS_TABLE": self.tables['products'].name,
            "ORDERS_TABLE": self.tables['orders'].name,
            "USERS_TABLE": self.tables['users'].name,
            "LOG_LEVEL": "INFO" if self.config.environment == "prod" else "DEBUG"
        }
        
        # VPC configuration for Lambda functions
        vpc_config = {
            "subnet_ids": [subnet.id for subnet in self.vpc_config['private_subnets']],
            "security_group_ids": [self.vpc_config['security_group'].id]
        }
        
        # Products Lambda function
        self.functions['products'] = aws.lambda_.Function(
            self.config.get_resource_name("products-lambda"),
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda_code/products")
            }),
            handler="handler.lambda_handler",
            role=self.iam_role.arn,
            environment={
                "variables": {
                    **common_env_vars,
                    "FUNCTION_NAME": "products"
                }
            },
            vpc_config=vpc_config,
            timeout=30,
            memory_size=256,
            tags={
                "Name": self.config.get_resource_name("products-lambda"),
                "Environment": self.config.environment,
                "Function": "products"
            }
        )
        
        # Orders Lambda function
        self.functions['orders'] = aws.lambda_.Function(
            self.config.get_resource_name("orders-lambda"),
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda_code/orders")
            }),
            handler="handler.lambda_handler",
            role=self.iam_role.arn,
            environment={
                "variables": {
                    **common_env_vars,
                    "FUNCTION_NAME": "orders"
                }
            },
            vpc_config=vpc_config,
            timeout=30,
            memory_size=256,
            tags={
                "Name": self.config.get_resource_name("orders-lambda"),
                "Environment": self.config.environment,
                "Function": "orders"
            }
        )
        
        # Users Lambda function
        self.functions['users'] = aws.lambda_.Function(
            self.config.get_resource_name("users-lambda"),
            runtime="python3.9",
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lambda_code/users")
            }),
            handler="handler.lambda_handler",
            role=self.iam_role.arn,
            environment={
                "variables": {
                    **common_env_vars,
                    "FUNCTION_NAME": "users"
                }
            },
            vpc_config=vpc_config,
            timeout=30,
            memory_size=256,
            tags={
                "Name": self.config.get_resource_name("users-lambda"),
                "Environment": self.config.environment,
                "Function": "users"
            }
        )
        
        return self.functions
```

### 6. API Gateway (`infrastructure/api_gateway.py`)

```python
"""API Gateway configuration for the e-commerce application."""
import json
import pulumi_aws as aws
from config.settings import Config


class APIGatewayInfrastructure:
    """API Gateway infrastructure for the e-commerce application."""
    
    def __init__(self, config: Config, lambda_functions: dict):
        self.config = config
        self.lambda_functions = lambda_functions
        self.api_gateway = None
        self.deployment = None
        
    def create_api_gateway(self) -> aws.apigateway.RestApi:
        """Create API Gateway with CORS enabled."""
        
        # Create REST API
        self.api_gateway = aws.apigateway.RestApi(
            self.config.get_resource_name("api"),
            description=f"E-commerce API for {self.config.environment}",
            endpoint_configuration={
                "types": "REGIONAL"
            },
            tags={
                "Name": self.config.get_resource_name("api"),
                "Environment": self.config.environment
            }
        )
        
        # Create resources and methods
        self._create_api_resources()
        
        # Deploy API
        self.deployment = aws.apigateway.Deployment(
            self.config.get_resource_name("api-deployment"),
            rest_api=self.api_gateway.id,
            stage_name=self.config.environment,
            opts=pulumi.ResourceOptions(depends_on=list(self.lambda_functions.values()))
        )
        
        return self.api_gateway
    
    def _create_api_resources(self) -> None:
        """Create API resources and methods."""
        cors_domains = self.config.get_cors_domains()
        
        # Products resource
        products_resource = aws.apigateway.Resource(
            self.config.get_resource_name("products-resource"),
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="products"
        )
        
        self._create_method_with_cors(
            "products", products_resource, self.lambda_functions['products'], cors_domains
        )
        
        # Orders resource
        orders_resource = aws.apigateway.Resource(
            self.config.get_resource_name("orders-resource"),
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="orders"
        )
        
        self._create_method_with_cors(
            "orders", orders_resource, self.lambda_functions['orders'], cors_domains
        )
        
        # Users resource
        users_resource = aws.apigateway.Resource(
            self.config.get_resource_name("users-resource"),
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="users"
        )
        
        self._create_method_with_cors(
            "users", users_resource, self.lambda_functions['users'], cors_domains
        )
    
    def _create_method_with_cors(self, resource_name: str, resource: aws.apigateway.Resource,
                                lambda_function: aws.lambda_.Function, cors_domains: list) -> None:
        """Create API method with CORS support."""
        
        # Create method
        method = aws.apigateway.Method(
            self.config.get_resource_name(f"{resource_name}-method"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method="ANY",
            authorization="NONE"
        )
        
        # Create integration
        integration = aws.apigateway.Integration(
            self.config.get_resource_name(f"{resource_name}-integration"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn
        )
        
        # Create OPTIONS method for CORS
        options_method = aws.apigateway.Method(
            self.config.get_resource_name(f"{resource_name}-options-method"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method="OPTIONS",
            authorization="NONE"
        )
        
        # Create OPTIONS integration
        options_integration = aws.apigateway.Integration(
            self.config.get_resource_name(f"{resource_name}-options-integration"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            }
        )
        
        # Create OPTIONS method response
        aws.apigateway.MethodResponse(
            self.config.get_resource_name(f"{resource_name}-options-method-response"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Origin": True
            }
        )
        
        # Create OPTIONS integration response
        aws.apigateway.IntegrationResponse(
            self.config.get_resource_name(f"{resource_name}-options-integration-response"),
            rest_api=self.api_gateway.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,POST,PUT,DELETE,OPTIONS'",
                "method.response.header.Access-Control-Allow-Origin": f"'{','.join(cors_domains)}'"
            }
        )
        
        # Create Lambda permission
        aws.lambda_.Permission(
            self.config.get_resource_name(f"{resource_name}-lambda-permission"),
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.api_gateway.execution_arn, "/*/*"
            )
        )
```

### 7. Lambda Function Code Examples

#### Products Handler (`lambda_code/products/handler.py`)

```python
"""Products Lambda function handler."""
import json
import logging
import os
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.getenv('REGION'))
products_table = dynamodb.Table(os.getenv('PRODUCTS_TABLE'))


def lambda_handler(event, context):
    """Handle products API requests."""
    try:
        http_method = event.get('httpMethod')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        body = event.get('body')
        
        logger.info(f"Processing {http_method} request for products")
        
        if http_method == 'GET':
            if 'product_id' in path_parameters:
                return get_product(path_parameters['product_id'])
            else:
                return list_products(query_parameters)
        elif http_method == 'POST':
            return create_product(json.loads(body) if body else {})
        elif http_method == 'PUT':
            return update_product(path_parameters.get('product_id'), 
                                json.loads(body) if body else {})
        elif http_method == 'DELETE':
            return delete_product(path_parameters.get('product_id'))
        else:
            return {
                'statusCode': 405,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Method not allowed'})
            }
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Internal server error'})
        }


def get_product(product_id):
    """Get a single product by ID."""
    try:
        response = products_table.get_item(Key={'product_id': product_id})
        
        if 'Item' in response:
            return {
                'statusCode': 200,
                'headers': get_cors_headers(),
                'body': json.dumps(response['Item'], default=str)
            }
        else:
            return {
                'statusCode': 404,
                'headers': get_cors_headers(),
                'body': json.dumps({'error': 'Product not found'})
            }
    except ClientError as e:
        logger.error(f"Error getting product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to get product'})
        }


def list_products(query_parameters):
    """List products with optional filtering."""
    try:
        if 'category' in query_parameters:
            # Query by category using GSI
            response = products_table.query(
                IndexName='CategoryIndex',
                KeyConditionExpression='category = :category',
                ExpressionAttributeValues={
                    ':category': query_parameters['category']
                }
            )
        else:
            # Scan all products
            response = products_table.scan()
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({
                'products': response['Items'],
                'count': len(response['Items'])
            }, default=str)
        }
    except ClientError as e:
        logger.error(f"Error listing products: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to list products'})
        }


def create_product(product_data):
    """Create a new product."""
    try:
        # Validate required fields
        required_fields = ['product_id', 'name', 'category', 'price']
        for field in required_fields:
            if field not in product_data:
                return {
                    'statusCode': 400,
                    'headers': get_cors_headers(),
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        products_table.put_item(Item=product_data)
        
        return {
            'statusCode': 201,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Product created successfully'})
        }
    except ClientError as e:
        logger.error(f"Error creating product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to create product'})
        }


def update_product(product_id, product_data):
    """Update an existing product."""
    if not product_id:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Product ID is required'})
        }
    
    try:
        # Build update expression
        update_expression = "SET "
        expression_values = {}
        
        for key, value in product_data.items():
            if key != 'product_id':  # Don't update the primary key
                update_expression += f"{key} = :{key}, "
                expression_values[f":{key}"] = value
        
        update_expression = update_expression.rstrip(', ')
        
        products_table.update_item(
            Key={'product_id': product_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values
        )
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Product updated successfully'})
        }
    except ClientError as e:
        logger.error(f"Error updating product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to update product'})
        }


def delete_product(product_id):
    """Delete a product."""
    if not product_id:
        return {
            'statusCode': 400,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Product ID is required'})
        }
    
    try:
        products_table.delete_item(Key={'product_id': product_id})
        
        return {
            'statusCode': 200,
            'headers': get_cors_headers(),
            'body': json.dumps({'message': 'Product deleted successfully'})
        }
    except ClientError as e:
        logger.error(f"Error deleting product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': get_cors_headers(),
            'body': json.dumps({'error': 'Failed to delete product'})
        }


def get_cors_