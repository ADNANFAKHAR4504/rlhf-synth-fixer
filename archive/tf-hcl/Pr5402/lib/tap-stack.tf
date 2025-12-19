# tap-stack.tf
variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

locals {
  app_name = "tap-marketplace"
  regions = [
    "us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1",
    "us-east-2", "us-west-1", "eu-central-1", "ap-northeast-1",
    "ca-central-1", "sa-east-1", "ap-south-1", "eu-north-1"
  ]
  primary_region   = "us-east-1"
  secondary_region = "us-west-2"
}

# DynamoDB Global Tables
resource "aws_dynamodb_table" "ticket_inventory" {
  provider = aws.primary

  name             = "${local.app_name}-ticket-inventory-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "event_id"
  range_key        = "seat_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "event_id"
    type = "S"
  }

  attribute {
    name = "seat_id"
    type = "S"
  }

  global_secondary_index {
    name            = "status-index"
    hash_key        = "status"
    projection_type = "ALL"
  }

  attribute {
    name = "status"
    type = "S"
  }

  replica {
    region_name = "us-west-2"
  }

  replica {
    region_name = "eu-west-1"
  }

  replica {
    region_name = "ap-southeast-1"
  }

  replica {
    region_name = "us-east-2"
  }

  replica {
    region_name = "us-west-1"
  }

  replica {
    region_name = "eu-central-1"
  }

  replica {
    region_name = "ap-northeast-1"
  }

  replica {
    region_name = "ca-central-1"
  }

  replica {
    region_name = "sa-east-1"
  }

  replica {
    region_name = "ap-south-1"
  }

  replica {
    region_name = "eu-north-1"
  }

  tags = {
    Name = "${local.app_name}-ticket-inventory"
  }
}

resource "aws_dynamodb_table" "distributed_locks" {
  provider = aws.primary

  name             = "${local.app_name}-distributed-locks-${var.environment_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "lock_key"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "lock_key"
    type = "S"
  }

  ttl {
    enabled        = true
    attribute_name = "expiry_time"
  }

  replica {
    region_name = "us-west-2"
  }

  replica {
    region_name = "eu-west-1"
  }

  replica {
    region_name = "ap-southeast-1"
  }

  replica {
    region_name = "us-east-2"
  }

  replica {
    region_name = "us-west-1"
  }

  replica {
    region_name = "eu-central-1"
  }

  replica {
    region_name = "ap-northeast-1"
  }

  replica {
    region_name = "ca-central-1"
  }

  replica {
    region_name = "sa-east-1"
  }

  replica {
    region_name = "ap-south-1"
  }

  replica {
    region_name = "eu-north-1"
  }

  tags = {
    Name = "${local.app_name}-distributed-locks"
  }
}

# IAM Roles
resource "aws_iam_role" "lambda_execution_role" {
  provider = aws.primary

  name = "${local.app_name}-lambda-execution-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  provider = aws.primary
  depends_on = [aws_iam_role.lambda_execution_role]

  name = "${local.app_name}-lambda-policy-${var.environment_suffix}"
  role = aws_iam_role.lambda_execution_role.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem",
          "dynamodb:TransactWriteItems",
          "dynamodb:TransactGetItems"
        ]
        Resource = [
          aws_dynamodb_table.ticket_inventory.arn,
          "${aws_dynamodb_table.ticket_inventory.arn}/*",
          aws_dynamodb_table.distributed_locks.arn,
          "${aws_dynamodb_table.distributed_locks.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "elasticache:*",
          "kinesis:PutRecord",
          "kinesis:PutRecords",
          "kinesis:GetRecords",
          "kinesis:GetShardIterator",
          "kinesis:DescribeStream",
          "kinesis:DescribeStreamSummary",
          "kinesis:ListShards",
          "kinesis:ListStreams",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "rds-data:ExecuteStatement",
          "rds-data:BatchExecuteStatement",
          "secretsmanager:GetSecretValue"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_execution" {
  provider = aws.primary

  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# VPC Configuration
resource "aws_vpc" "main" {
  provider = aws.primary

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.app_name}-vpc"
  }
}

resource "aws_subnet" "private_a" {
  provider = aws.primary

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.1.0/24"
  availability_zone = "us-east-1a"

  tags = {
    Name = "${local.app_name}-private-subnet-a"
  }
}

resource "aws_subnet" "private_b" {
  provider = aws.primary

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "us-east-1b"

  tags = {
    Name = "${local.app_name}-private-subnet-b"
  }
}

resource "aws_security_group" "lambda_sg" {
  provider = aws.primary

  name        = "${local.app_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.app_name}-lambda-sg"
  }
}

resource "aws_security_group" "redis_sg" {
  provider = aws.primary

  name        = "${local.app_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.app_name}-redis-sg"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "redis" {
  provider = aws.primary

  name       = "${local.app_name}-redis-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]
}

resource "aws_elasticache_replication_group" "redis" {
  provider = aws.primary

  replication_group_id       = "${local.app_name}-redis-${var.environment_suffix}"
  description                = "Redis cluster for seat availability"
  engine                     = "redis"
  node_type                  = "cache.r7g.xlarge"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis_sg.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = 3
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name = "${local.app_name}-redis"
  }
}

# Lambda Functions - Inline Code (No ZIP files)
data "archive_file" "ticket_purchase_zip" {
  type        = "zip"
  output_path = "/tmp/ticket_purchase.zip"

  source {
    content  = <<-EOF
const AWS = require('aws-sdk');
const Redis = require('ioredis');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const kinesis = new AWS.Kinesis();
let redis;
exports.ticketPurchaseHandler = async (event) => {
    const startTime = Date.now();
    
    if (!redis) {
        redis = new Redis.Cluster([{
            host: process.env.REDIS_ENDPOINT,
            port: 6379
        }], {
            redisOptions: {
                tls: {}
            },
            scaleReads: 'slave',
            enableOfflineQueue: false
        });
    }
    
    const body = JSON.parse(event.body);
    const { eventId, seatId, userId, price } = body;
    const lockKey = `lock_$${eventId}_$${seatId}`;
    
    try {
        // Acquire distributed lock with automatic expiry (50ms target)
        const lockId = Date.now().toString();
        const lockAcquired = await acquireDistributedLock(lockKey, lockId, 5000);
        
        if (!lockAcquired) {
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Seat already being purchased' })
            };
        }
        
        // Check seat availability in DynamoDB
        const seatCheck = await dynamodb.get({
            TableName: process.env.INVENTORY_TABLE,
            Key: { event_id: eventId, seat_id: seatId }
        }).promise();
        
        if (seatCheck.Item && seatCheck.Item.status === 'sold') {
            await releaseDistributedLock(lockKey, lockId);
            return {
                statusCode: 409,
                body: JSON.stringify({ message: 'Seat already sold' })
            };
        }
        
        // Update DynamoDB with transaction
        await dynamodb.transactWrite({
            TransactItems: [
                {
                    Update: {
                        TableName: process.env.INVENTORY_TABLE,
                        Key: { event_id: eventId, seat_id: seatId },
                        UpdateExpression: 'SET #status = :sold, user_id = :userId, purchase_time = :time, price = :price',
                        ConditionExpression: 'attribute_not_exists(#status) OR #status <> :sold',
                        ExpressionAttributeNames: { '#status': 'status' },
                        ExpressionAttributeValues: {
                            ':sold': 'sold',
                            ':userId': userId,
                            ':time': new Date().toISOString(),
                            ':price': price
                        }
                    }
                }
            ]
        }).promise();
        
        // Update Redis sorted set atomically
        const pipeline = redis.pipeline();
        pipeline.zrem(`available_seats:$${eventId}`, seatId);
        pipeline.zadd(`sold_seats:$${eventId}`, Date.now(), `$${seatId}:$${userId}`);
        await pipeline.exec();
        
        // Stream to Kinesis
        await kinesis.putRecord({
            StreamName: process.env.KINESIS_STREAM,
            Data: JSON.stringify({
                eventType: 'TICKET_PURCHASED',
                eventId,
                seatId,
                userId,
                price,
                timestamp: new Date().toISOString(),
                processingTime: Date.now() - startTime
            }),
            PartitionKey: eventId
        }).promise();
        
        // Release lock
        await releaseDistributedLock(lockKey, lockId);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Ticket purchased successfully',
                transactionId: lockId,
                processingTime: Date.now() - startTime
            })
        };
        
    } catch (error) {
        console.error('Error processing ticket purchase:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal server error' })
        };
    }
};
async function acquireDistributedLock(lockKey, lockId, ttlMs) {
    const expiryTime = Math.floor((Date.now() + ttlMs) / 1000);
    
    try {
        await dynamodb.put({
            TableName: process.env.LOCKS_TABLE,
            Item: {
                lock_key: lockKey,
                lock_id: lockId,
                expiry_time: expiryTime,
                acquired_at: new Date().toISOString()
            },
            ConditionExpression: 'attribute_not_exists(lock_key) OR expiry_time < :now',
            ExpressionAttributeValues: {
                ':now': Math.floor(Date.now() / 1000)
            }
        }).promise();
        
        return true;
    } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
            return false;
        }
        throw error;
    }
}
async function releaseDistributedLock(lockKey, lockId) {
    try {
        await dynamodb.delete({
            TableName: process.env.LOCKS_TABLE,
            Key: { lock_key: lockKey },
            ConditionExpression: 'lock_id = :lockId',
            ExpressionAttributeValues: {
                ':lockId': lockId
            }
        }).promise();
    } catch (error) {
        console.warn('Error releasing lock:', error);
    }
}
EOF
    filename = "index.js"
  }
}

resource "aws_lambda_function" "ticket_purchase" {
  provider = aws.primary
  depends_on = [aws_iam_role_policy.lambda_policy, aws_iam_role_policy_attachment.lambda_vpc_execution]

  filename                       = data.archive_file.ticket_purchase_zip.output_path
  function_name                  = "${local.app_name}-ticket-purchase-${var.environment_suffix}"
  role                           = aws_iam_role.lambda_execution_role.arn
  handler                        = "index.ticketPurchaseHandler"
  source_code_hash               = data.archive_file.ticket_purchase_zip.output_base64sha256
  runtime                        = "nodejs18.x"
  timeout                        = 30
  memory_size                    = 3008
  reserved_concurrent_executions = 100

  environment {
    variables = {
      INVENTORY_TABLE = aws_dynamodb_table.ticket_inventory.name
      LOCKS_TABLE     = aws_dynamodb_table.distributed_locks.name
      REDIS_ENDPOINT  = aws_elasticache_replication_group.redis.primary_endpoint_address
      KINESIS_STREAM  = aws_kinesis_stream.ticket_sales.name
    }
  }

  vpc_config {
    subnet_ids         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_group_ids = [aws_security_group.lambda_sg.id]
  }

  tracing_config {
    mode = "Active"
  }

}

data "archive_file" "inventory_verifier_zip" {
  type        = "zip"
  output_path = "/tmp/inventory_verifier.zip"

  source {
    content  = <<-EOF
const AWS = require('aws-sdk');
const axios = require('axios');
exports.inventoryVerifierHandler = async (event) => {
    const startTime = Date.now();
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    
    const regions = [
        'us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1',
        'us-east-2', 'us-west-1', 'eu-central-1', 'ap-northeast-1',
        'ca-central-1', 'sa-east-1', 'ap-south-1', 'eu-north-1'
    ];
    
    try {
        const action = event.action || 'verify';
        
        if (action === 'correct_overselling') {
            return await correctOverselling(event.data);
        }
        
        // Scan inventory across all regions
        const inventoryPromises = regions.map(async (region) => {
            const regionalDDB = new AWS.DynamoDB.DocumentClient({ region });
            
            const params = {
                TableName: process.env.INVENTORY_TABLE,
                FilterExpression: '#status = :sold',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: { ':sold': 'sold' }
            };
            
            const items = [];
            let lastKey = undefined;
            
            do {
                if (lastKey) {
                    params.ExclusiveStartKey = lastKey;
                }
                
                const result = await regionalDDB.scan(params).promise();
                items.push(...result.Items);
                lastKey = result.LastEvaluatedKey;
            } while (lastKey);
            
            return { region, items };
        });
        
        const regionalInventories = await Promise.all(inventoryPromises);
        
        // Compare with PMS (mock API call - replace with actual endpoint)
        const pmsData = await axios.get('https://pms-api.example.com/inventory', {
            timeout: 3000
        });
        
        // Detect overselling
        const overselling = detectOverselling(regionalInventories, pmsData.data);
        
        const result = {
            verification_time: Date.now() - startTime,
            regions_checked: regions.length,
            overselling_detected: overselling.length > 0,
            overselling_details: overselling,
            timestamp: new Date().toISOString()
        };
        
        return result;
        
    } catch (error) {
        console.error('Error in inventory verification:', error);
        throw error;
    }
};
function detectOverselling(regionalInventories, pmsData) {
    const overselling = [];
    const consolidatedInventory = new Map();
    
    // Consolidate regional inventories
    regionalInventories.forEach(({ region, items }) => {
        items.forEach(item => {
            const key = `$${item.event_id}:$${item.seat_id}`;
            if (!consolidatedInventory.has(key)) {
                consolidatedInventory.set(key, []);
            }
            consolidatedInventory.get(key).push({ region, ...item });
        });
    });
    
    // Check for duplicates and conflicts
    consolidatedInventory.forEach((sales, key) => {
        if (sales.length > 1) {
            overselling.push({
                type: 'DUPLICATE_SALE',
                key,
                count: sales.length,
                details: sales
            });
        }
    });
    
    // Compare with PMS
    const pmsSet = new Set(pmsData.soldSeats.map(s => `$${s.eventId}:$${s.seatId}`));
    
    consolidatedInventory.forEach((sales, key) => {
        if (!pmsSet.has(key)) {
            overselling.push({
                type: 'UNAUTHORIZED_SALE',
                key,
                details: sales[0]
            });
        }
    });
    
    return overselling;
}
async function correctOverselling(data) {
    const dynamodb = new AWS.DynamoDB.DocumentClient();
    const corrections = [];
    
    for (const issue of data.overselling_details) {
        if (issue.type === 'DUPLICATE_SALE') {
            // Keep the earliest sale, revert others
            const sorted = issue.details.sort((a, b) => 
                new Date(a.purchase_time) - new Date(b.purchase_time)
            );
            
            const toRevert = sorted.slice(1);
            
            for (const sale of toRevert) {
                await dynamodb.update({
                    TableName: process.env.INVENTORY_TABLE,
                    Key: {
                        event_id: sale.event_id,
                        seat_id: sale.seat_id
                    },
                    UpdateExpression: 'SET #status = :available, correction_time = :time',
                    ExpressionAttributeNames: { '#status': 'status' },
                    ExpressionAttributeValues: {
                        ':available': 'available',
                        ':time': new Date().toISOString()
                    }
                }).promise();
                
                corrections.push({
                    type: 'REVERTED_DUPLICATE',
                    sale,
                    timestamp: new Date().toISOString()
                });
            }
        }
    }
    
    return {
        corrections_made: corrections.length,
        corrections,
        timestamp: new Date().toISOString()
    };
}
EOF
    filename = "index.js"
  }
}

resource "aws_lambda_function" "inventory_verifier" {
  provider = aws.primary
  depends_on = [aws_iam_role_policy.lambda_policy, aws_iam_role_policy_attachment.lambda_vpc_execution]

  filename         = data.archive_file.inventory_verifier_zip.output_path
  function_name    = "${local.app_name}-inventory-verifier-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.inventoryVerifierHandler"
  source_code_hash = data.archive_file.inventory_verifier_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 60
  memory_size      = 1024

  environment {
    variables = {
      INVENTORY_TABLE = aws_dynamodb_table.ticket_inventory.name
    }
  }

}

data "archive_file" "kinesis_processor_zip" {
  type        = "zip"
  output_path = "/tmp/kinesis_processor.zip"

  source {
    content  = <<-EOF
const AWS = require('aws-sdk');
const rdsDataService = new AWS.RDSDataService();
exports.kinesisProcessorHandler = async (event) => {
    const records = event.Records.map(record => {
        const payload = Buffer.from(record.kinesis.data, 'base64').toString('utf-8');
        return JSON.parse(payload);
    });
    
    // Batch insert into Aurora
    const sqlStatements = records.map(record => ({
        sql: `INSERT INTO ticket_sales (event_id, seat_id, user_id, price, purchase_time, processing_time) 
              VALUES (:eventId, :seatId, :userId, :price, :purchaseTime, :processingTime)`,
        parameters: [
            { name: 'eventId', value: { stringValue: record.eventId } },
            { name: 'seatId', value: { stringValue: record.seatId } },
            { name: 'userId', value: { stringValue: record.userId } },
            { name: 'price', value: { doubleValue: record.price } },
            { name: 'purchaseTime', value: { stringValue: record.timestamp } },
            { name: 'processingTime', value: { longValue: record.processingTime } }
        ]
    }));
    
    try {
        // Use RDS Data API for serverless execution
        await Promise.all(sqlStatements.map(stmt => 
            rdsDataService.executeStatement({
                resourceArn: process.env.AURORA_CLUSTER_ARN,
                secretArn: process.env.AURORA_SECRET_ARN,
                database: 'analytics',
                sql: stmt.sql,
                parameters: stmt.parameters
            }).promise()
        ));
        
        console.log(`Processed $${records.length} records`);
        
        // Update real-time metrics
        const eventMetrics = {};
        records.forEach(record => {
            if (!eventMetrics[record.eventId]) {
                eventMetrics[record.eventId] = {
                    count: 0,
                    revenue: 0,
                    avgProcessingTime: 0
                };
            }
            eventMetrics[record.eventId].count++;
            eventMetrics[record.eventId].revenue += record.price;
            eventMetrics[record.eventId].avgProcessingTime = 
                (eventMetrics[record.eventId].avgProcessingTime * (eventMetrics[record.eventId].count - 1) + 
                 record.processingTime) / eventMetrics[record.eventId].count;
        });
        
        // Update aggregated metrics
        const metricsPromises = Object.entries(eventMetrics).map(([eventId, metrics]) =>
            rdsDataService.executeStatement({
                resourceArn: process.env.AURORA_CLUSTER_ARN,
                secretArn: process.env.AURORA_SECRET_ARN,
                database: 'analytics',
                sql: `INSERT INTO event_metrics (event_id, sales_count, total_revenue, avg_processing_time, last_updated)
                      VALUES (:eventId, :count, :revenue, :avgTime, NOW())
                      ON DUPLICATE KEY UPDATE
                      sales_count = sales_count + :count,
                      total_revenue = total_revenue + :revenue,
                      avg_processing_time = ((avg_processing_time * sales_count) + (:avgTime * :count)) / (sales_count + :count),
                      last_updated = NOW()`,
                parameters: [
                    { name: 'eventId', value: { stringValue: eventId } },
                    { name: 'count', value: { longValue: metrics.count } },
                    { name: 'revenue', value: { doubleValue: metrics.revenue } },
                    { name: 'avgTime', value: { doubleValue: metrics.avgProcessingTime } }
                ]
            }).promise()
        );
        
        await Promise.all(metricsPromises);
        
    } catch (error) {
        console.error('Error processing Kinesis records:', error);
        throw error;
    }
};
EOF
    filename = "index.js"
  }
}

resource "aws_lambda_function" "kinesis_processor" {
  provider = aws.primary
  depends_on = [aws_iam_role_policy.lambda_policy, aws_iam_role_policy_attachment.lambda_vpc_execution]

  filename         = data.archive_file.kinesis_processor_zip.output_path
  function_name    = "${local.app_name}-kinesis-processor-${var.environment_suffix}"
  role             = aws_iam_role.lambda_execution_role.arn
  handler          = "index.kinesisProcessorHandler"
  source_code_hash = data.archive_file.kinesis_processor_zip.output_base64sha256
  runtime          = "nodejs18.x"
  timeout          = 30
  memory_size      = 512

  environment {
    variables = {
      AURORA_CLUSTER_ARN = aws_rds_cluster.analytics.arn
      AURORA_SECRET_ARN  = aws_secretsmanager_secret.aurora_credentials.arn
    }
  }

}

# API Gateway
resource "aws_api_gateway_rest_api" "main" {
  provider = aws.primary

  name        = "${local.app_name}-api-${var.environment_suffix}"
  description = "Ticketing marketplace API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_resource" "tickets" {
  provider = aws.primary

  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "tickets"
}

resource "aws_api_gateway_method" "purchase" {
  provider = aws.primary

  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.tickets.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "lambda_integration" {
  provider = aws.primary

  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.tickets.id
  http_method = aws_api_gateway_method.purchase.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.ticket_purchase.invoke_arn
}

resource "aws_api_gateway_deployment" "main" {
  provider = aws.primary

  rest_api_id = aws_api_gateway_rest_api.main.id

  triggers = {
    redeployment = sha1(jsonencode({
      resource    = aws_api_gateway_resource.tickets.id
      method      = aws_api_gateway_method.purchase.id
      integration = aws_api_gateway_integration.lambda_integration.id
    }))
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "prod" {
  provider = aws.primary

  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = "prod"

  xray_tracing_enabled = true
}

resource "aws_lambda_permission" "api_gateway" {
  provider = aws.primary

  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ticket_purchase.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# Kinesis Stream
resource "aws_kinesis_stream" "ticket_sales" {
  provider = aws.primary

  name             = "${local.app_name}-ticket-sales-${var.environment_suffix}"
  shard_count      = 20
  retention_period = 24
  encryption_type  = "KMS"
  kms_key_id       = "alias/aws/kinesis"

  stream_mode_details {
    stream_mode = "PROVISIONED"
  }

  tags = {
    Name = "${local.app_name}-ticket-sales"
  }
}

resource "aws_lambda_event_source_mapping" "kinesis_trigger" {
  provider = aws.primary

  event_source_arn                   = aws_kinesis_stream.ticket_sales.arn
  function_name                      = aws_lambda_function.kinesis_processor.arn
  starting_position                  = "LATEST"
  parallelization_factor             = 10
  maximum_batching_window_in_seconds = 1
}

# Aurora Database
resource "aws_db_subnet_group" "aurora" {
  provider = aws.primary

  name       = "${local.app_name}-aurora-subnet-group"
  subnet_ids = [aws_subnet.private_a.id, aws_subnet.private_b.id]

  tags = {
    Name = "${local.app_name}-aurora-subnet-group"
  }
}

resource "aws_security_group" "aurora_sg" {
  provider = aws.primary

  name        = "${local.app_name}-aurora-sg"
  description = "Security group for Aurora database"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.lambda_sg.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.app_name}-aurora-sg"
  }
}

resource "aws_rds_cluster" "analytics" {
  provider = aws.primary

  cluster_identifier     = "${local.app_name}-analytics-${var.environment_suffix}"
  engine                 = "aurora-mysql"
  engine_mode            = "provisioned"
  engine_version         = "8.0.mysql_aurora.3.10.1"
  database_name          = "analytics"
  master_username        = "admin"
  master_password        = random_password.aurora_password.result
  db_subnet_group_name   = aws_db_subnet_group.aurora.name
  vpc_security_group_ids = [aws_security_group.aurora_sg.id]
  storage_encrypted      = true
  enable_http_endpoint   = true

  serverlessv2_scaling_configuration {
    max_capacity = 16
    min_capacity = 0.5
  }

  tags = {
    Name = "${local.app_name}-analytics"
  }
}

resource "aws_rds_cluster_instance" "analytics" {
  provider = aws.primary
  count    = 2

  identifier         = "${local.app_name}-analytics-${var.environment_suffix}-${count.index}"
  cluster_identifier = aws_rds_cluster.analytics.id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.analytics.engine
  engine_version     = aws_rds_cluster.analytics.engine_version
}

resource "random_password" "aurora_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "aurora_credentials" {
  provider = aws.primary

  name = "${local.app_name}-aurora-credentials"
}

resource "aws_secretsmanager_secret_version" "aurora_credentials" {
  provider = aws.primary

  secret_id = aws_secretsmanager_secret.aurora_credentials.id

  secret_string = jsonencode({
    username = aws_rds_cluster.analytics.master_username
    password = random_password.aurora_password.result
    engine   = "mysql"
    host     = aws_rds_cluster.analytics.endpoint
    port     = 3306
    dbname   = aws_rds_cluster.analytics.database_name
  })
}

# Step Functions
resource "aws_iam_role" "step_functions_role" {
  provider = aws.primary

  name = "${local.app_name}-step-functions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "states.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "step_functions_policy" {
  provider = aws.primary

  name = "${local.app_name}-step-functions-policy"
  role = aws_iam_role.step_functions_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "lambda:InvokeFunction",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_sfn_state_machine" "inventory_verification" {
  provider = aws.primary

  name     = "${local.app_name}-inventory-verification"
  role_arn = aws_iam_role.step_functions_role.arn

  definition = jsonencode({
    Comment = "Inventory verification workflow"
    StartAt = "VerifyInventory"
    States = {
      VerifyInventory = {
        Type     = "Task"
        Resource = aws_lambda_function.inventory_verifier.arn
        Next     = "CheckForOverselling"
      }
      CheckForOverselling = {
        Type = "Choice"
        Choices = [
          {
            Variable      = "$.overselling_detected"
            BooleanEquals = true
            Next          = "TriggerCorrections"
          }
        ]
        Default = "AuditResults"
      }
      TriggerCorrections = {
        Type     = "Task"
        Resource = "arn:aws:states:::lambda:invoke"
        Parameters = {
          FunctionName = aws_lambda_function.inventory_verifier.arn
          Payload = {
            "action" = "correct_overselling"
            "data.$" = "$"
          }
        }
        Next = "AuditResults"
      }
      AuditResults = {
        Type = "Pass"
        Result = {
          "audit_completed" = true
          "timestamp.$" = "$$.State.EnteredTime"
        }
        End = true
      }
    }
  })
}

# EventBridge Rules
resource "aws_iam_role" "eventbridge_role" {
  provider = aws.primary

  name = "${local.app_name}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "eventbridge_policy" {
  provider = aws.primary

  name = "${local.app_name}-eventbridge-policy"
  role = aws_iam_role.eventbridge_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "states:StartExecution"
        ]
        Resource = aws_sfn_state_machine.inventory_verification.arn
      }
    ]
  })
}

resource "aws_cloudwatch_event_rule" "inventory_check" {
  provider = aws.primary

  name                = "${local.app_name}-inventory-check"
  description         = "Trigger inventory verification every 10 seconds"
  schedule_expression = "rate(1 minute)"
}

resource "aws_cloudwatch_event_target" "step_function" {
  provider = aws.primary

  rule      = aws_cloudwatch_event_rule.inventory_check.name
  target_id = "StepFunctionTarget"
  arn       = aws_sfn_state_machine.inventory_verification.arn
  role_arn  = aws_iam_role.eventbridge_role.arn
}

# Timestream removed due to service access limitations
# Audit trail will be handled via CloudWatch Logs instead

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "lambda_logs" {
  provider = aws.primary

  for_each = {
    ticket_purchase    = aws_lambda_function.ticket_purchase.function_name
    inventory_verifier = aws_lambda_function.inventory_verifier.function_name
    kinesis_processor  = aws_lambda_function.kinesis_processor.function_name
  }

  name              = "/aws/lambda/${each.value}"
  retention_in_days = 7
}

# Secondary region resources
resource "aws_vpc" "secondary" {
  provider = aws.secondary

  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${local.app_name}-vpc-secondary"
  }
}

resource "aws_subnet" "secondary_private_a" {
  provider = aws.secondary

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.1.0/24"
  availability_zone = "us-west-2a"

  tags = {
    Name = "${local.app_name}-private-subnet-a-secondary"
  }
}

resource "aws_subnet" "secondary_private_b" {
  provider = aws.secondary

  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.2.0/24"
  availability_zone = "us-west-2b"

  tags = {
    Name = "${local.app_name}-private-subnet-b-secondary"
  }
}

resource "aws_elasticache_subnet_group" "redis_secondary" {
  provider = aws.secondary

  name       = "${local.app_name}-redis-subnet-group"
  subnet_ids = [aws_subnet.secondary_private_a.id, aws_subnet.secondary_private_b.id]
}

resource "aws_security_group" "redis_sg_secondary" {
  provider = aws.secondary

  name        = "${local.app_name}-redis-sg"
  description = "Security group for ElastiCache Redis"
  vpc_id      = aws_vpc.secondary.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = ["10.1.0.0/16"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.app_name}-redis-sg"
  }
}

resource "aws_elasticache_replication_group" "redis_secondary" {
  provider = aws.secondary

  replication_group_id       = "${local.app_name}-redis"
  description                = "Redis cluster for seat availability"
  engine                     = "redis"
  node_type                  = "cache.r7g.xlarge"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  subnet_group_name          = aws_elasticache_subnet_group.redis_secondary.name
  security_group_ids         = [aws_security_group.redis_sg_secondary.id]
  automatic_failover_enabled = true
  multi_az_enabled           = true
  num_cache_clusters         = 3
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name = "${local.app_name}-redis"
  }
}
# Outputs for integration tests
output "inventory_table_name" {
  description = "DynamoDB ticket inventory table name"
  value       = aws_dynamodb_table.ticket_inventory.name
}

output "locks_table_name" {
  description = "DynamoDB distributed locks table name"
  value       = aws_dynamodb_table.distributed_locks.name
}

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = "https://${aws_api_gateway_rest_api.main.id}.execute-api.${local.primary_region}.amazonaws.com/prod"
}

output "kinesis_stream_name" {
  description = "Kinesis stream name for ticket sales"
  value       = aws_kinesis_stream.ticket_sales.name
}

output "redis_endpoint" {
  description = "Redis cluster primary endpoint"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "ticket_purchase_lambda_arn" {
  description = "Ticket purchase Lambda function ARN"
  value       = aws_lambda_function.ticket_purchase.arn
}

output "inventory_verifier_lambda_arn" {
  description = "Inventory verifier Lambda function ARN"
  value       = aws_lambda_function.inventory_verifier.arn
}

output "kinesis_processor_lambda_arn" {
  description = "Kinesis processor Lambda function ARN"
  value       = aws_lambda_function.kinesis_processor.arn
}

output "aurora_cluster_arn" {
  description = "Aurora analytics cluster ARN"
  value       = aws_rds_cluster.analytics.arn
}

output "region" {
  description = "Primary deployment region"
  value       = local.primary_region
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = var.environment_suffix
}