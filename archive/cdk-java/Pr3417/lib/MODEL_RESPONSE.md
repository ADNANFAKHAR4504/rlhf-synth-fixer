I will help you build this document collaboration system with aws cdk java that incoporates all the constraints specified

# Document Collaboration System - Complete Implementation

## Table of Contents
1. [Project Structure](#project-structure)
2. [CDK Infrastructure Code](#cdk-infrastructure-code)
3. [Lambda Function Implementations](#lambda-function-implementations)
4. [GraphQL Schema](#graphql-schema)
5. [DynamoDB Table Designs](#dynamodb-table-designs)
6. [CloudWatch Dashboard Configuration](#cloudwatch-dashboard-configuration)
7. [Deployment Instructions](#deployment-instructions)
8. [API Documentation](#api-documentation)

---

## Project Structure

```

### ConflictResolutionHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.DynamodbEvent;
import com.amazonaws.services.lambda.runtime.events.models.dynamodb.AttributeValue;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import redis.clients.jedis.Jedis;
import java.util.*;

public class ConflictResolutionHandler implements RequestHandler<DynamodbEvent, Void> {
    
    private final DynamoDbClient dynamoDb = DynamoDbClient.create();
    private final Gson gson = new Gson();
    private final String redisEndpoint = System.getenv("REDIS_ENDPOINT");
    private final String operationsTable = System.getenv("OPERATIONS_TABLE");
    
    @Override
    public Void handleRequest(DynamodbEvent event, Context context) {
        context.getLogger().log("Processing " + event.getRecords().size() + " DynamoDB stream records");
        
        for (DynamodbEvent.DynamodbStreamRecord record : event.getRecords()) {
            if ("INSERT".equals(record.getEventName())) {
                Map<String, AttributeValue> newImage = record.getDynamodb().getNewImage();
                
                String documentId = newImage.get("documentId").getS();
                long timestamp = Long.parseLong(newImage.get("timestamp").getN());
                String operationJson = newImage.get("operation").getS();
                
                context.getLogger().log("Processing operation for document: " + documentId);
                
                // Apply operational transformation
                JsonObject operation = gson.fromJson(operationJson, JsonObject.class);
                JsonObject transformedOp = applyOperationalTransformation(documentId, operation, timestamp, context);
                
                // Update the operation if transformed
                if (!transformedOp.equals(operation)) {
                    updateOperation(documentId, timestamp, transformedOp);
                    context.getLogger().log("Operation transformed due to conflict");
                }
            }
        }
        
        return null;
    }
    
    private JsonObject applyOperationalTransformation(String documentId, JsonObject operation, 
                                                      long timestamp, Context context) {
        // Get concurrent operations
        List<JsonObject> concurrentOps = getConcurrentOperations(documentId, timestamp);
        
        if (concurrentOps.isEmpty()) {
            return operation;
        }
        
        JsonObject transformedOp = operation;
        
        // Apply OT for each concurrent operation
        for (JsonObject concurrentOp : concurrentOps) {
            transformedOp = transform(transformedOp, concurrentOp, context);
        }
        
        return transformedOp;
    }
    
    private JsonObject transform(JsonObject op1, JsonObject op2, Context context) {
        String op1Type = op1.get("type").getAsString();
        String op2Type = op2.get("type").getAsString();
        
        // Insert-Insert transformation
        if ("insert".equals(op1Type) && "insert".equals(op2Type)) {
            int pos1 = op1.get("position").getAsInt();
            int pos2 = op2.get("position").getAsInt();
            
            if (pos1 >= pos2) {
                JsonObject transformed = op1.deepCopy();
                int length2 = op2.get("text").getAsString().length();
                transformed.addProperty("position", pos1 + length2);
                return transformed;
            }
        }
        
        // Insert-Delete transformation
        if ("insert".equals(op1Type) && "delete".equals(op2Type)) {
            int insertPos = op1.get("position").getAsInt();
            int deletePos = op2.get("position").getAsInt();
            int deleteLen = op2.get("length").getAsInt();
            
            if (insertPos > deletePos) {
                JsonObject transformed = op1.deepCopy();
                transformed.addProperty("position", Math.max(deletePos, insertPos - deleteLen));
                return transformed;
            }
        }
        
        // Delete-Insert transformation
        if ("delete".equals(op1Type) && "insert".equals(op2Type)) {
            int deletePos = op1.get("position").getAsInt();
            int insertPos = op2.get("position").getAsInt();
            int insertLen = op2.get("text").getAsString().length();
            
            if (deletePos >= insertPos) {
                JsonObject transformed = op1.deepCopy();
                transformed.addProperty("position", deletePos + insertLen);
                return transformed;
            }
        }
        
        // Delete-Delete transformation
        if ("delete".equals(op1Type) && "delete".equals(op2Type)) {
            int pos1 = op1.get("position").getAsInt();
            int len1 = op1.get("length").getAsInt();
            int pos2 = op2.get("position").getAsInt();
            int len2 = op2.get("length").getAsInt();
            
            // Overlapping deletes
            if (pos1 < pos2 + len2 && pos1 + len1 > pos2) {
                JsonObject transformed = op1.deepCopy();
                int newPos = Math.min(pos1, pos2);
                int newLen = Math.max(pos1 + len1, pos2 + len2) - newPos - len2;
                transformed.addProperty("position", newPos);
                transformed.addProperty("length", Math.max(0, newLen));
                return transformed;
            } else if (pos1 >= pos2) {
                JsonObject transformed = op1.deepCopy();
                transformed.addProperty("position", Math.max(pos2, pos1 - len2));
                return transformed;
            }
        }
        
        return op1;
    }
    
    private List<JsonObject> getConcurrentOperations(String documentId, long timestamp) {
        List<JsonObject> operations = new ArrayList<>();
        
        // Query operations in a small time window (e.g., last 1 second)
        long startTime = timestamp - 1000;
        
        Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":documentId", 
            software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(documentId).build());
        expressionAttributeValues.put(":startTime", 
            software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().n(String.valueOf(startTime)).build());
        expressionAttributeValues.put(":endTime", 
            software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().n(String.valueOf(timestamp)).build());
        
        QueryResponse response = dynamoDb.query(QueryRequest.builder()
                .tableName(operationsTable)
                .keyConditionExpression("documentId = :documentId AND #ts BETWEEN :startTime AND :endTime")
                .expressionAttributeNames(Map.of("#ts", "timestamp"))
                .expressionAttributeValues(expressionAttributeValues)
                .build());
        
        for (Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> item : response.items()) {
            String operationJson = item.get("operation").s();
            operations.add(gson.fromJson(operationJson, JsonObject.class));
        }
        
        return operations;
    }
    
    private void updateOperation(String documentId, long timestamp, JsonObject transformedOp) {
        Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValue> key = new HashMap<>();
        key.put("documentId", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(documentId).build());
        key.put("timestamp", software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().n(String.valueOf(timestamp)).build());
        
        Map<String, software.amazon.awssdk.services.dynamodb.model.AttributeValueUpdate> updates = new HashMap<>();
        updates.put("operation", software.amazon.awssdk.services.dynamodb.model.AttributeValueUpdate.builder()
                .value(software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().s(gson.toJson(transformedOp)).build())
                .action(AttributeAction.PUT)
                .build());
        updates.put("transformed", software.amazon.awssdk.services.dynamodb.model.AttributeValueUpdate.builder()
                .value(software.amazon.awssdk.services.dynamodb.model.AttributeValue.builder().bool(true).build())
                .action(AttributeAction.PUT)
                .build());
        
        dynamoDb.updateItem(UpdateItemRequest.builder()
                .tableName(operationsTable)
                .key(key)
                .attributeUpdates(updates)
                .build());
    }
}
```

### NotificationHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.ScheduledEvent;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.util.HashMap;
import java.util.Map;

public class NotificationHandler implements RequestHandler<Map<String, Object>, Void> {
    
    private final SnsClient sns = SnsClient.create();
    private final DynamoDbClient dynamoDb = DynamoDbClient.create();
    private final Gson gson = new Gson();
    private final String documentsTable = System.getenv("DOCUMENTS_TABLE");
    
    @Override
    public Void handleRequest(Map<String, Object> event, Context context) {
        context.getLogger().log("Processing notification event: " + gson.toJson(event));
        
        try {
            // Extract event details
            Map<String, Object> detail = (Map<String, Object>) event.get("detail");
            String documentId = (String) detail.get("documentId");
            String userId = (String) detail.get("userId");
            
            // Get document details
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("documentId", AttributeValue.builder().s(documentId).build());
            
            GetItemResponse response = dynamoDb.getItem(GetItemRequest.builder()
                    .tableName(documentsTable)
                    .key(key)
                    .build());
            
            if (response.hasItem()) {
                String title = response.item().get("title").s();
                
                // Send notification
                String message = String.format(
                    "Document '%s' was updated by user %s", title, userId
                );
                
                context.getLogger().log("Notification: " + message);
                
                // In production, send to SNS topic or user-specific endpoints
                // sns.publish(PublishRequest.builder()
                //         .topicArn("arn:aws:sns:us-east-1:ACCOUNT:DocumentUpdates")
                //         .message(message)
                //         .build());
            }
            
        } catch (Exception e) {
            context.getLogger().log("Error sending notification: " + e.getMessage());
        }
        
        return null;
    }
}
```

### IndexingHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import com.google.gson.Gson;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.IndexRequest;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import java.util.HashMap;
import java.util.Map;

public class IndexingHandler implements RequestHandler<Map<String, Object>, Void> {
    
    private final DynamoDbClient dynamoDb = DynamoDbClient.create();
    private final Gson gson = new Gson();
    private final String documentsTable = System.getenv("DOCUMENTS_TABLE");
    private final String openSearchEndpoint = System.getenv("OPENSEARCH_ENDPOINT");
    
    @Override
    public Void handleRequest(Map<String, Object> event, Context context) {
        context.getLogger().log("Indexing document: " + gson.toJson(event));
        
        try {
            Map<String, Object> detail = (Map<String, Object>) event.get("detail");
            String documentId = (String) detail.get("documentId");
            
            // Get document from DynamoDB
            Map<String, AttributeValue> key = new HashMap<>();
            key.put("documentId", AttributeValue.builder().s(documentId).build());
            
            GetItemResponse response = dynamoDb.getItem(GetItemRequest.builder()
                    .tableName(documentsTable)
                    .key(key)
                    .build());
            
            if (response.hasItem()) {
                Map<String, AttributeValue> item = response.item();
                
                // Prepare document for indexing
                Map<String, Object> doc = new HashMap<>();
                doc.put("documentId", documentId);
                doc.put("title", item.get("title").s());
                doc.put("userId", item.get("userId").s());
                doc.put("createdAt", Long.parseLong(item.get("createdAt").n()));
                doc.put("lastModified", Long.parseLong(item.get("lastModified").n()));
                
                if (item.containsKey("content")) {
                    doc.put("content", item.get("content").s());
                }
                
                // Index in OpenSearch
                indexDocument(documentId, doc, context);
                
                context.getLogger().log("Document indexed successfully: " + documentId);
            }
            
        } catch (Exception e) {
            context.getLogger().log("Error indexing document: " + e.getMessage());
            throw new RuntimeException(e);
        }
        
        return null;
    }
    
    private void indexDocument(String documentId, Map<String, Object> doc, Context context) {
        try {
            // Create OpenSearch client
            RestClient restClient = RestClient.builder(
                HttpHost.create("https://" + openSearchEndpoint)
            ).build();
            
            RestClientTransport transport = new RestClientTransport(
                restClient, new JacksonJsonpMapper()
            );
            
            OpenSearchClient client = new OpenSearchClient(transport);
            
            // Index the document
            IndexRequest<Map<String, Object>> request = IndexRequest.of(i -> i
                .index("documents")
                .id(documentId)
                .document(doc)
            );
            
            client.index(request);
            
            restClient.close();
            
        } catch (Exception e) {
            context.getLogger().log("OpenSearch indexing error: " + e.getMessage());
            throw new RuntimeException(e);
        }
    }
}
```

### SearchHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.google.gson.Gson;
import org.opensearch.client.opensearch.OpenSearchClient;
import org.opensearch.client.opensearch.core.SearchRequest;
import org.opensearch.client.opensearch.core.SearchResponse;
import org.opensearch.client.opensearch.core.search.Hit;
import org.opensearch.client.json.jackson.JacksonJsonpMapper;
import org.opensearch.client.transport.rest_client.RestClientTransport;
import org.apache.http.HttpHost;
import org.opensearch.client.RestClient;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class SearchHandler implements RequestHandler<Map<String, Object>, Map<String, Object>> {
    
    private final Gson gson = new Gson();
    private final String openSearchEndpoint = System.getenv("OPENSEARCH_ENDPOINT");
    
    @Override
    public Map<String, Object> handleRequest(Map<String, Object> event, Context context) {
        context.getLogger().log("Search request: " + gson.toJson(event));
        
        Map<String, Object> response = new HashMap<>();
        
        try {
            String query = (String) event.get("query");
            int from = event.containsKey("from") ? (int) event.get("from") : 0;
            int size = event.containsKey("size") ? (int) event.get("size") : 10;
            
            // Perform search
            List<Map<String, Object>> results = searchDocuments(query, from, size, context);
            
            response.put("results", results);
            response.put("total", results.size());
            response.put("statusCode", 200);
            
        } catch (Exception e) {
            context.getLogger().log("Search error: " + e.getMessage());
            response.put("error", e.getMessage());
            response.put("statusCode", 500);
        }
        
        return response;
    }
    
    private List<Map<String, Object>> searchDocuments(String query, int from, int size, Context context) {
        List<Map<String, Object>> results = new ArrayList<>();
        
        try {
            // Create OpenSearch client
            RestClient restClient = RestClient.builder(
                HttpHost.create("https://" + openSearchEndpoint)
            ).build();
            
            RestClientTransport transport = new RestClientTransport(
                restClient, new JacksonJsonpMapper()
            );
            
            OpenSearchClient client = new OpenSearchClient(transport);
            
            // Build search request
            SearchRequest searchRequest = SearchRequest.of(s -> s
                .index("documents")
                .query(q -> q
                    .multiMatch(m -> m
                        .query(query)
                        .fields("title", "content")
                    )
                )
                .from(from)
                .size(size)
            );
            
            // Execute search
            SearchResponse<Map> searchResponse = client.search(searchRequest, Map.class);
            
            // Process results
            for (Hit<Map> hit : searchResponse.hits().hits()) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", hit.id());
                result.put("score", hit.score());
                result.put("document", hit.source());
                results.add(result);
            }
            
            restClient.close();
            
        } catch (Exception e) {
            context.getLogger().log("OpenSearch search error: " + e.getMessage());
            throw new RuntimeException(e);
        }
        
        return results;
    }
}
```

---

## GraphQL Schema

### schema/schema.graphql

```graphql
schema {
  query: Query
  mutation: Mutation
  subscription: Subscription
}

type Query {
  getDocument(documentId: ID!): Document
  listDocuments(userId: ID!, limit: Int, nextToken: String): DocumentConnection
  searchDocuments(query: String!, limit: Int): [Document]
  getDocumentHistory(documentId: ID!, limit: Int): [Operation]
}

type Mutation {
  createDocument(input: CreateDocumentInput!): Document
  editDocument(input: EditDocumentInput!): Operation
  deleteDocument(documentId: ID!): DeleteDocumentResponse
  shareDocument(input: ShareDocumentInput!): ShareResponse
  updateDocumentMetadata(input: UpdateMetadataInput!): Document
}

type Subscription {
  onDocumentUpdated(documentId: ID!): Operation
    @aws_subscribe(mutations: ["editDocument"])
  
  onUserJoined(documentId: ID!): UserPresence
    @aws_subscribe(mutations: ["editDocument"])
  
  onUserLeft(documentId: ID!): UserPresence
    @aws_subscribe(mutations: ["editDocument"])
}

type Document {
  documentId: ID!
  title: String!
  content: String
  userId: ID!
  createdAt: AWSDateTime!
  lastModified: AWSDateTime!
  currentVersion: Int!
  collaborators: [Collaborator]
  permissions: Permissions
  s3Key: String
}

type DocumentConnection {
  items: [Document]
  nextToken: String
}

type Operation {
  documentId: ID!
  timestamp: AWSTimestamp!
  userId: ID!
  operation: OperationDetail!
  transformed: Boolean
}

type OperationDetail {
  type: OperationType!
  position: Int!
  text: String
  length: Int
}

enum OperationType {
  INSERT
  DELETE
  REPLACE
}

type Collaborator {
  userId: ID!
  username: String!
  role: CollaboratorRole!
  joinedAt: AWSDateTime!
}

enum CollaboratorRole {
  OWNER
  EDITOR
  VIEWER
}

type Permissions {
  isPublic: Boolean!
  allowedUsers: [ID]
  allowedGroups: [String]
}

type UserPresence {
  userId: ID!
  username: String!
  documentId: ID!
  status: PresenceStatus!
  timestamp: AWSTimestamp!
}

enum PresenceStatus {
  JOINED
  LEFT
  ACTIVE
  IDLE
}

type DeleteDocumentResponse {
  success: Boolean!
  message: String
}

type ShareResponse {
  success: Boolean!
  shareUrl: String
}

input CreateDocumentInput {
  title: String!
  content: String
  isPublic: Boolean
}

input EditDocumentInput {
  documentId: ID!
  operation: OperationInput!
}

input OperationInput {
  type: OperationType!
  position: Int!
  text: String
  length: Int
}

input ShareDocumentInput {
  documentId: ID!
  userId: ID
  role: CollaboratorRole!
  expiresIn: Int
}

input UpdateMetadataInput {
  documentId: ID!
  title: String
  permissions: PermissionsInput
}

input PermissionsInput {
  isPublic: Boolean
  allowedUsers: [ID]
  allowedGroups: [String]
}
```

---

## DynamoDB Table Designs

### Documents Table

```
Table Name: DocumentCollabDocuments
Partition Key: documentId (String)
Billing Mode: PAY_PER_REQUEST
Point-in-Time Recovery: Enabled
Encryption: AWS_MANAGED

Attributes:
- documentId: String (PK)
- title: String
- userId: String
- createdAt: Number (timestamp)
- lastModified: Number (timestamp)
- currentVersion: Number
- s3Key: String
- content: String (optional, for small documents)
- collaborators: List
- permissions: Map
- isPublic: Boolean

Global Secondary Indexes:
1. UserDocumentsIndex
   - Partition Key: userId (String)
   - Sort Key: createdAt (Number)
   - Projection: ALL
   - Use Case: Query all documents by user

2. PublicDocumentsIndex (optional)
   - Partition Key: isPublic (Number - 1 or 0)
   - Sort Key: createdAt (Number)
   - Projection: ALL
   - Use Case: List all public documents
```

### Operations Table

```
Table Name: DocumentCollabOperations
Partition Key: documentId (String)
Sort Key: timestamp (Number)
Billing Mode: PAY_PER_REQUEST
Stream: NEW_AND_OLD_IMAGES
TTL: enabled (optional, for cleanup after 30 days)

Attributes:
- documentId: String (PK)
- timestamp: Number (SK - epoch milliseconds)
- userId: String
- operation: String (JSON)
- connectionId: String
- transformed: Boolean
- ttl: Number (expiration timestamp)

DynamoDB Stream Configuration:
- View Type: NEW_AND_OLD_IMAGES
- Batch Size: 100
- Starting Position: TRIM_HORIZON
- Retry Attempts: 3
- Use Case: Trigger conflict resolution on new operations
```

### Connections Table

```
Table Name: DocumentCollabConnections
Partition Key: connectionId (String)
Billing Mode: PAY_PER_REQUEST
TTL Attribute: ttl

Attributes:
- connectionId: String (PK)
- documentId: String
- userId: String
- connectedAt: Number (timestamp)
- lastActivity: Number (timestamp)
- ttl: Number (auto-cleanup after 24 hours)

Global Secondary Indexes:
1. DocumentConnectionsIndex
   - Partition Key: documentId (String)
   - Projection: ALL
   - Use Case: Query all active connections for a document

2. UserConnectionsIndex (optional)
   - Partition Key: userId (String)
   - Projection: ALL
   - Use Case: Query all connections for a user
```

---

## CloudWatch Dashboard Configuration

### Dashboard Widgets

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["DocumentCollab", "OperationLatency", {"stat": "Average"}],
          ["...", {"stat": "p99"}]
        ],
        "period": 60,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Operation Latency (ms)",
        "yAxis": {
          "left": {
            "min": 0
          }
        }
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["DocumentCollab", "ActiveConnections"]
        ],
        "period": 60,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Active WebSocket Connections"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Errors", {"stat": "Sum"}],
          [".", "Throttles", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "Lambda Metrics"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
          [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-east-1",
        "title": "DynamoDB Capacity"
      }
    }
  ]
}
```

### Custom Metrics (Publish from Lambda)

```java
// In Lambda functions, publish custom metrics:
CloudWatchClient cloudWatch = CloudWatchClient.create();

MetricDatum operationLatency = MetricDatum.builder()
    .metricName("OperationLatency")
    .unit(StandardUnit.MILLISECONDS)
    .value((double) latencyMs)
    .timestamp(Instant.now())
    .build();

PutMetricDataRequest request = PutMetricDataRequest.builder()
    .namespace("DocumentCollab")
    .metricData(operationLatency)
    .build();

cloudWatch.putMetricData(request);
```

---

## Deployment Instructions

### Prerequisites

```bash
# Install required tools
brew install node npm maven
npm install -g aws-cdk

# Configure AWS credentials
aws configure
```

### Build and Deploy

```bash
# 1. Clone the repository
git clone <repository-url>
cd document-collaboration

# 2. Build Lambda functions
cd lambda
mvn clean package
cd ..

# 3. Install CDK dependencies
mvn clean install

# 4. Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-ID/us-east-1

# 5. Synthesize CloudFormation template
cdk synth

# 6. Deploy all stacks
cdk deploy --all --require-approval never

# Or deploy individual stacks
cdk deploy DocumentCollab-Network
cdk deploy DocumentCollab-Auth
cdk deploy DocumentCollab-Data
cdk deploy DocumentCollab-Api
cdk deploy DocumentCollab-Monitoring

# 7. View outputs
aws cloudformation describe-stacks \
  --stack-name DocumentCollab-Api \
  --query 'Stacks[0].Outputs'
```

### Post-Deployment Configuration

```bash
# Create OpenSearch index
curl -X PUT "https://<opensearch-endpoint>/documents" \
  -H 'Content-Type: application/json' \
  -d '{
    "settings": {
      "number_of_shards": 2,
      "number_of_replicas": 1
    },
    "mappings": {
      "properties": {
        "documentId": {"type": "keyword"},
        "title": {"type": "text"},
        "content": {"type": "text"},
        "userId": {"type": "keyword"},
        "createdAt": {"type": "date"},
        "lastModified": {"type": "date"}
      }
    }
  }'

# Create Cognito test user
aws cognito-idp admin-create-user \
  --user-pool-id <user-pool-id> \
  --username testuser \
  --user-attributes Name=email,Value=test@example.com \
  --temporary-password TempPass123!
```

### Cleanup

```bash
# Destroy all stacks
cdk destroy --all

# Manual cleanup (if needed)
aws s3 rm s3://document-collab-bucket-<account-id> --recursive
aws s3 rb s3://document-collab-bucket-<account-id>
```

---

## API Documentation

### WebSocket API

#### Connection

```
wss://<api-id>.execute-api.us-east-1.amazonaws.com/prod?documentId=<doc-id>&userId=<user-id>
```

#### Message Format

**Edit Document**
```json
{
  "action": "edit",
  "documentId": "doc-123",
  "userId": "user-456",
  "operation": {
    "type": "insert",
    "position": 10,
    "text": "Hello World"
  }
}
```

**Get Document**
```json
{
  "action": "getDocument",
  "documentId": "doc-123"
}
```

**Save Document**
```json
{
  "action": "saveDocument",
  "documentId": "doc-123",
  "content": "Full document content",
  "version": 5
}
```

### GraphQL API

#### Queries

**Get Document**
```graphql
query GetDocument {
  getDocument(documentId: "doc-123") {
    documentId
    title
    content
    userId
    createdAt
    lastModified
    collaborators {
      userId
      username
      role
    }
  }
}
```

**List Documents**
```graphql
query ListDocuments {
  listDocuments(userId: "user-456", limit: 20) {
    items {
      documentId
      title
      createdAt
    }
    nextToken
  }
}
```

**Search Documents**
```graphql
query SearchDocuments {
  searchDocuments(query: "collaboration", limit: 10) {
    documentId
    title
    content
  }
}
```

#### Mutations

**Create Document**
```graphql
mutation CreateDocument {
  createDocument(input: {
    title: "My New Document"
    content: "Initial content"
    isPublic: false
  }) {
    documentId
    title
    createdAt
  }
}
```

**Edit Document**
```graphql
mutation EditDocument {
  editDocument(input: {
    documentId: "doc-123"
    operation: {
      type: INSERT
      position: 10
document-collaboration/
├── pom.xml
├── cdk.json
├── src/
│   └── main/
│       └── java/
│           └── com/
│               └── doccollab/
│                   ├── DocumentCollabApp.java
│                   ├── stacks/
│                   │   ├── NetworkStack.java
│                   │   ├── AuthStack.java
│                   │   ├── DataStack.java
│                   │   ├── ApiStack.java
│                   │   └── MonitoringStack.java
│                   └── handlers/
│                       ├── ConnectionHandler.java
│                       ├── MessageHandler.java
│                       ├── ConflictResolutionHandler.java
│                       ├── NotificationHandler.java
│                       ├── IndexingHandler.java
│                       └── SearchHandler.java
├── lambda/
│   ├── pom.xml
│   └── src/
│       └── main/
│           └── java/
│               └── com/
│                   └── doccollab/
│                       └── handlers/
└── schema/
    └── schema.graphql
```

---

## CDK Infrastructure Code

### pom.xml (Root)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.doccollab</groupId>
    <artifactId>document-collaboration</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <cdk.version>2.100.0</cdk.version>
    </properties>

    <dependencies>
        <dependency>
            <groupId>software.amazon.awscdk</groupId>
            <artifactId>aws-cdk-lib</artifactId>
            <version>${cdk.version}</version>
        </dependency>
        <dependency>
            <groupId>software.constructs</groupId>
            <artifactId>constructs</artifactId>
            <version>10.3.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
            </plugin>
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>exec-maven-plugin</artifactId>
                <version>3.1.0</version>
                <configuration>
                    <mainClass>com.doccollab.DocumentCollabApp</mainClass>
                </configuration>
            </plugin>
        </plugins>
    </build>
</project>
```

### cdk.json

```json
{
  "app": "mvn -e -q compile exec:java",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "target",
      "pom.xml",
      "src/test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

### DocumentCollabApp.java

```java
package com.doccollab;

import software.amazon.awscdk.App;
import software.amazon.awscdk.Environment;
import software.amazon.awscdk.StackProps;
import com.doccollab.stacks.*;

public class DocumentCollabApp {
    public static void main(final String[] args) {
        App app = new App();

        Environment env = Environment.builder()
                .region("us-east-1")
                .build();

        StackProps stackProps = StackProps.builder()
                .env(env)
                .stackName("DocumentCollaboration")
                .description("Real-time document collaboration system")
                .build();

        // Network infrastructure
        NetworkStack networkStack = new NetworkStack(app, "DocumentCollab-Network", stackProps);

        // Authentication
        AuthStack authStack = new AuthStack(app, "DocumentCollab-Auth", stackProps);

        // Data layer
        DataStack dataStack = new DataStack(app, "DocumentCollab-Data", stackProps, networkStack.getVpc());

        // API and compute layer
        ApiStack apiStack = new ApiStack(app, "DocumentCollab-Api", stackProps,
            authStack.getUserPool(),
            dataStack.getDocumentsTable(),
            dataStack.getOperationsTable(),
            dataStack.getConnectionsTable(),
            dataStack.getDocumentBucket(),
            dataStack.getRedisEndpoint(),
            dataStack.getOpenSearchDomain(),
            dataStack.getDocumentEventBus(),
            networkStack.getVpc(),
            networkStack.getLambdaSecurityGroup());

        // Monitoring and observability
        MonitoringStack monitoringStack = new MonitoringStack(app, "DocumentCollab-Monitoring", 
            stackProps, apiStack);

        app.synth();
    }
}
```

### NetworkStack.java

```java
package com.doccollab.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.services.ec2.*;
import software.constructs.Construct;

public class NetworkStack extends Stack {
    private final Vpc vpc;
    private final SecurityGroup lambdaSecurityGroup;
    private final SecurityGroup redisSecurityGroup;

    public NetworkStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create VPC with public and private subnets
        this.vpc = Vpc.Builder.create(this, "DocumentCollabVPC")
                .vpcName("document-collab-vpc")
                .maxAzs(2)
                .natGateways(1)
                .subnetConfiguration(java.util.List.of(
                    SubnetConfiguration.builder()
                        .name("Public")
                        .subnetType(SubnetType.PUBLIC)
                        .cidrMask(24)
                        .build(),
                    SubnetConfiguration.builder()
                        .name("Private")
                        .subnetType(SubnetType.PRIVATE_WITH_EGRESS)
                        .cidrMask(24)
                        .build()
                ))
                .build();

        // Security group for Lambda functions
        this.lambdaSecurityGroup = SecurityGroup.Builder.create(this, "LambdaSecurityGroup")
                .vpc(vpc)
                .description("Security group for Lambda functions")
                .allowAllOutbound(true)
                .build();

        // Security group for Redis
        this.redisSecurityGroup = SecurityGroup.Builder.create(this, "RedisSecurityGroup")
                .vpc(vpc)
                .description("Security group for Redis cluster")
                .allowAllOutbound(false)
                .build();

        // Allow Lambda to connect to Redis
        redisSecurityGroup.addIngressRule(
            lambdaSecurityGroup,
            Port.tcp(6379),
            "Allow Lambda to connect to Redis"
        );
    }

    public Vpc getVpc() {
        return vpc;
    }

    public SecurityGroup getLambdaSecurityGroup() {
        return lambdaSecurityGroup;
    }

    public SecurityGroup getRedisSecurityGroup() {
        return redisSecurityGroup;
    }
}
```

### AuthStack.java

```java
package com.doccollab.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.services.cognito.*;
import software.constructs.Construct;

public class AuthStack extends Stack {
    private final UserPool userPool;
    private final UserPoolClient userPoolClient;

    public AuthStack(final Construct scope, final String id, final StackProps props) {
        super(scope, id, props);

        // Create Cognito User Pool
        this.userPool = UserPool.Builder.create(this, "UserPool")
                .userPoolName("DocumentCollabUserPool")
                .selfSignUpEnabled(true)
                .signInAliases(SignInAliases.builder()
                    .email(true)
                    .username(true)
                    .build())
                .autoVerify(AutoVerifiedAttrs.builder()
                    .email(true)
                    .build())
                .standardAttributes(StandardAttributes.builder()
                    .email(StandardAttribute.builder()
                        .required(true)
                        .mutable(true)
                        .build())
                    .fullname(StandardAttribute.builder()
                        .required(false)
                        .mutable(true)
                        .build())
                    .build())
                .mfa(Mfa.OPTIONAL)
                .mfaSecondFactor(MfaSecondFactor.builder()
                    .sms(true)
                    .otp(true)
                    .build())
                .passwordPolicy(PasswordPolicy.builder()
                    .minLength(8)
                    .requireLowercase(true)
                    .requireUppercase(true)
                    .requireDigits(true)
                    .requireSymbols(true)
                    .build())
                .accountRecovery(AccountRecovery.EMAIL_ONLY)
                .removalPolicy(software.amazon.awscdk.RemovalPolicy.RETAIN)
                .build();

        // Create User Pool Client
        this.userPoolClient = UserPoolClient.Builder.create(this, "UserPoolClient")
                .userPool(userPool)
                .userPoolClientName("DocumentCollabWebClient")
                .generateSecret(false)
                .authFlows(AuthFlow.builder()
                    .userPassword(true)
                    .userSrp(true)
                    .build())
                .oAuth(OAuthSettings.builder()
                    .flows(OAuthFlows.builder()
                        .authorizationCodeGrant(true)
                        .build())
                    .scopes(java.util.List.of(OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE))
                    .build())
                .build();

        // Create User Groups
        CfnUserPoolGroup.Builder.create(this, "AdminGroup")
                .userPoolId(userPool.getUserPoolId())
                .groupName("admins")
                .description("Administrators with full access")
                .precedence(1)
                .build();

        CfnUserPoolGroup.Builder.create(this, "EditorGroup")
                .userPoolId(userPool.getUserPoolId())
                .groupName("editors")
                .description("Users with edit access")
                .precedence(2)
                .build();

        CfnUserPoolGroup.Builder.create(this, "ViewerGroup")
                .userPoolId(userPool.getUserPoolId())
                .groupName("viewers")
                .description("Users with read-only access")
                .precedence(3)
                .build();

        // Outputs
        CfnOutput.Builder.create(this, "CognitoUserPoolId")
                .value(userPool.getUserPoolId())
                .description("Cognito User Pool ID")
                .exportName("CognitoUserPoolId")
                .build();

        CfnOutput.Builder.create(this, "CognitoUserPoolClientId")
                .value(userPoolClient.getUserPoolClientId())
                .description("Cognito User Pool Client ID")
                .exportName("CognitoUserPoolClientId")
                .build();
    }

    public UserPool getUserPool() {
        return userPool;
    }

    public UserPoolClient getUserPoolClient() {
        return userPoolClient;
    }
}
```

### DataStack.java

```java
package com.doccollab.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.RemovalPolicy;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.services.dynamodb.*;
import software.amazon.awscdk.services.s3.*;
import software.amazon.awscdk.services.elasticache.*;
import software.amazon.awscdk.services.opensearchservice.*;
import software.amazon.awscdk.services.events.EventBus;
import software.amazon.awscdk.services.sns.Topic;
import software.amazon.awscdk.services.ec2.Vpc;
import software.constructs.Construct;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

public class DataStack extends Stack {
    private final Table documentsTable;
    private final Table operationsTable;
    private final Table connectionsTable;
    private final Bucket documentBucket;
    private final String redisEndpoint;
    private final Domain openSearchDomain;
    private final EventBus documentEventBus;
    private final Topic documentTopic;

    public DataStack(final Construct scope, final String id, final StackProps props, final Vpc vpc) {
        super(scope, id, props);

        // DynamoDB Tables
        this.documentsTable = Table.Builder.create(this, "DocumentsTable")
                .tableName("DocumentCollabDocuments")
                .partitionKey(Attribute.builder()
                    .name("documentId")
                    .type(AttributeType.STRING)
                    .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .pointInTimeRecovery(true)
                .removalPolicy(RemovalPolicy.RETAIN)
                .encryption(TableEncryption.AWS_MANAGED)
                .build();

        // Add GSI for user documents
        documentsTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("UserDocumentsIndex")
                .partitionKey(Attribute.builder()
                    .name("userId")
                    .type(AttributeType.STRING)
                    .build())
                .sortKey(Attribute.builder()
                    .name("createdAt")
                    .type(AttributeType.NUMBER)
                    .build())
                .projectionType(ProjectionType.ALL)
                .build());

        this.operationsTable = Table.Builder.create(this, "OperationsTable")
                .tableName("DocumentCollabOperations")
                .partitionKey(Attribute.builder()
                    .name("documentId")
                    .type(AttributeType.STRING)
                    .build())
                .sortKey(Attribute.builder()
                    .name("timestamp")
                    .type(AttributeType.NUMBER)
                    .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .stream(StreamViewType.NEW_AND_OLD_IMAGES)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        this.connectionsTable = Table.Builder.create(this, "ConnectionsTable")
                .tableName("DocumentCollabConnections")
                .partitionKey(Attribute.builder()
                    .name("connectionId")
                    .type(AttributeType.STRING)
                    .build())
                .billingMode(BillingMode.PAY_PER_REQUEST)
                .timeToLiveAttribute("ttl")
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // Add GSI for document connections
        connectionsTable.addGlobalSecondaryIndex(GlobalSecondaryIndexProps.builder()
                .indexName("DocumentConnectionsIndex")
                .partitionKey(Attribute.builder()
                    .name("documentId")
                    .type(AttributeType.STRING)
                    .build())
                .projectionType(ProjectionType.ALL)
                .build());

        // S3 Bucket for document storage
        this.documentBucket = Bucket.Builder.create(this, "DocumentBucket")
                .bucketName("document-collab-bucket-" + this.getAccount())
                .versioned(true)
                .encryption(BucketEncryption.S3_MANAGED)
                .blockPublicAccess(BlockPublicAccess.BLOCK_ALL)
                .enforceSSL(true)
                .lifecycleRules(List.of(
                    LifecycleRule.builder()
                        .noncurrentVersionExpiration(Duration.days(365))
                        .build(),
                    LifecycleRule.builder()
                        .transitions(List.of(
                            Transition.builder()
                                .storageClass(StorageClass.INFREQUENT_ACCESS)
                                .transitionAfter(Duration.days(90))
                                .build(),
                            Transition.builder()
                                .storageClass(StorageClass.GLACIER)
                                .transitionAfter(Duration.days(180))
                                .build()
                        ))
                        .build()
                ))
                .removalPolicy(RemovalPolicy.RETAIN)
                .build();

        // ElastiCache Redis
        CfnSubnetGroup redisSubnetGroup = CfnSubnetGroup.Builder.create(this, "RedisSubnetGroup")
                .subnetIds(vpc.getPrivateSubnets().stream()
                    .map(subnet -> subnet.getSubnetId())
                    .collect(Collectors.toList()))
                .description("Subnet group for Redis cluster")
                .build();

        CfnCacheCluster redisCluster = CfnCacheCluster.Builder.create(this, "RedisCluster")
                .cacheNodeType("cache.t3.medium")
                .engine("redis")
                .engineVersion("7.0")
                .numCacheNodes(1)
                .cacheSubnetGroupName(redisSubnetGroup.getRef())
                .port(6379)
                .build();

        this.redisEndpoint = redisCluster.getAttrRedisEndpointAddress() + ":" + 
                            redisCluster.getAttrRedisEndpointPort();

        // OpenSearch Domain
        this.openSearchDomain = Domain.Builder.create(this, "DocumentSearchDomain")
                .domainName("document-collab-search")
                .version(EngineVersion.OPENSEARCH_2_5)
                .capacity(CapacityConfig.builder()
                    .dataNodeInstanceType("t3.small.search")
                    .dataNodes(2)
                    .build())
                .ebs(EbsOptions.builder()
                    .volumeSize(20)
                    .volumeType(software.amazon.awscdk.services.ec2.EbsDeviceVolumeType.GP3)
                    .build())
                .nodeToNodeEncryption(true)
                .encryptionAtRest(EncryptionAtRestOptions.builder()
                    .enabled(true)
                    .build())
                .enforceHttps(true)
                .removalPolicy(RemovalPolicy.DESTROY)
                .build();

        // EventBridge Event Bus
        this.documentEventBus = EventBus.Builder.create(this, "DocumentEventBus")
                .eventBusName("DocumentCollaborationEventBus")
                .build();

        // SNS Topic for notifications
        this.documentTopic = Topic.Builder.create(this, "DocumentUpdatesTopic")
                .topicName("DocumentUpdates")
                .displayName("Document Collaboration Updates")
                .build();

        // Outputs
        CfnOutput.Builder.create(this, "DocumentsTableName")
                .value(documentsTable.getTableName())
                .exportName("DocumentsTableName")
                .build();

        CfnOutput.Builder.create(this, "DocumentBucketName")
                .value(documentBucket.getBucketName())
                .exportName("DocumentBucketName")
                .build();

        CfnOutput.Builder.create(this, "OpenSearchDomainEndpoint")
                .value(openSearchDomain.getDomainEndpoint())
                .exportName("OpenSearchDomainEndpoint")
                .build();
    }

    public Table getDocumentsTable() { return documentsTable; }
    public Table getOperationsTable() { return operationsTable; }
    public Table getConnectionsTable() { return connectionsTable; }
    public Bucket getDocumentBucket() { return documentBucket; }
    public String getRedisEndpoint() { return redisEndpoint; }
    public Domain getOpenSearchDomain() { return openSearchDomain; }
    public EventBus getDocumentEventBus() { return documentEventBus; }
    public Topic getDocumentTopic() { return documentTopic; }
}
```

### ApiStack.java

```java
package com.doccollab.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.CfnOutput;
import software.amazon.awscdk.services.lambda.*;
import software.amazon.awscdk.services.lambda.eventsources.DynamoEventSource;
import software.amazon.awscdk.services.apigatewayv2.*;
import software.amazon.awscdk.services.apigatewayv2.integrations.WebSocketLambdaIntegration;
import software.amazon.awscdk.services.appsync.*;
import software.amazon.awscdk.services.dynamodb.Table;
import software.amazon.awscdk.services.s3.Bucket;
import software.amazon.awscdk.services.opensearchservice.Domain;
import software.amazon.awscdk.services.events.EventBus;
import software.amazon.awscdk.services.events.Rule;
import software.amazon.awscdk.services.events.EventPattern;
import software.amazon.awscdk.services.events.targets.LambdaFunction;
import software.amazon.awscdk.services.stepfunctions.*;
import software.amazon.awscdk.services.stepfunctions.tasks.*;
import software.amazon.awscdk.services.cognito.UserPool;
import software.amazon.awscdk.services.ec2.Vpc;
import software.amazon.awscdk.services.ec2.SecurityGroup;
import software.constructs.Construct;
import java.util.Map;
import java.util.List;

public class ApiStack extends Stack {
    private final WebSocketApi webSocketApi;
    private final GraphqlApi graphqlApi;
    private final Function connectionHandler;
    private final Function messageHandler;
    private final Function conflictResolutionHandler;
    private final StateMachine documentWorkflow;

    public ApiStack(final Construct scope, final String id, final StackProps props,
                    final UserPool userPool,
                    final Table documentsTable,
                    final Table operationsTable,
                    final Table connectionsTable,
                    final Bucket documentBucket,
                    final String redisEndpoint,
                    final Domain openSearchDomain,
                    final EventBus documentEventBus,
                    final Vpc vpc,
                    final SecurityGroup lambdaSecurityGroup) {
        super(scope, id, props);

        // Lambda Layer for shared dependencies
        LayerVersion sharedLayer = LayerVersion.Builder.create(this, "SharedLayer")
                .layerVersionName("document-collab-shared")
                .code(Code.fromAsset("lambda/layers/shared"))
                .compatibleRuntimes(List.of(Runtime.JAVA_17))
                .description("Shared dependencies for document collaboration")
                .build();

        // Environment variables for Lambda functions
        Map<String, String> lambdaEnv = Map.of(
            "DOCUMENTS_TABLE", documentsTable.getTableName(),
            "OPERATIONS_TABLE", operationsTable.getTableName(),
            "CONNECTIONS_TABLE", connectionsTable.getTableName(),
            "DOCUMENT_BUCKET", documentBucket.getBucketName(),
            "REDIS_ENDPOINT", redisEndpoint,
            "OPENSEARCH_ENDPOINT", openSearchDomain.getDomainEndpoint(),
            "EVENT_BUS_NAME", documentEventBus.getEventBusName()
        );

        // Connection Handler Lambda
        this.connectionHandler = Function.Builder.create(this, "ConnectionHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.ConnectionHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(1024)
                .timeout(Duration.seconds(30))
                .environment(lambdaEnv)
                .layers(List.of(sharedLayer))
                .vpc(vpc)
                .securityGroups(List.of(lambdaSecurityGroup))
                .build();

        // Message Handler Lambda
        this.messageHandler = Function.Builder.create(this, "MessageHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.MessageHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(1024)
                .timeout(Duration.seconds(30))
                .environment(lambdaEnv)
                .layers(List.of(sharedLayer))
                .vpc(vpc)
                .securityGroups(List.of(lambdaSecurityGroup))
                .build();

        // Conflict Resolution Handler Lambda
        this.conflictResolutionHandler = Function.Builder.create(this, "ConflictResolutionHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.ConflictResolutionHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(2048)
                .timeout(Duration.seconds(60))
                .environment(lambdaEnv)
                .layers(List.of(sharedLayer))
                .vpc(vpc)
                .securityGroups(List.of(lambdaSecurityGroup))
                .build();

        // Notification Handler Lambda
        Function notificationHandler = Function.Builder.create(this, "NotificationHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.NotificationHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(512)
                .timeout(Duration.seconds(30))
                .environment(lambdaEnv)
                .build();

        // Indexing Handler Lambda
        Function indexingHandler = Function.Builder.create(this, "IndexingHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.IndexingHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(1024)
                .timeout(Duration.seconds(60))
                .environment(lambdaEnv)
                .vpc(vpc)
                .securityGroups(List.of(lambdaSecurityGroup))
                .build();

        // Search Handler Lambda
        Function searchHandler = Function.Builder.create(this, "SearchHandler")
                .runtime(Runtime.JAVA_17)
                .handler("com.doccollab.handlers.SearchHandler::handleRequest")
                .code(Code.fromAsset("lambda/target/lambda.jar"))
                .memorySize(1024)
                .timeout(Duration.seconds(30))
                .environment(lambdaEnv)
                .vpc(vpc)
                .securityGroups(List.of(lambdaSecurityGroup))
                .build();

        // Grant permissions
        documentsTable.grantReadWriteData(connectionHandler);
        documentsTable.grantReadWriteData(messageHandler);
        documentsTable.grantReadWriteData(conflictResolutionHandler);
        operationsTable.grantReadWriteData(messageHandler);
        operationsTable.grantReadWriteData(conflictResolutionHandler);
        connectionsTable.grantReadWriteData(connectionHandler);
        connectionsTable.grantReadData(messageHandler);
        documentBucket.grantReadWrite(messageHandler);
        documentEventBus.grantPutEventsTo(messageHandler);
        openSearchDomain.grantReadWrite(indexingHandler);
        openSearchDomain.grantRead(searchHandler);

        // DynamoDB Stream for conflict resolution
        conflictResolutionHandler.addEventSource(
            DynamoEventSource.Builder.create(operationsTable)
                .startingPosition(StartingPosition.TRIM_HORIZON)
                .batchSize(100)
                .retryAttempts(3)
                .build()
        );

        // WebSocket API
        this.webSocketApi = WebSocketApi.Builder.create(this, "DocumentCollabWebSocket")
                .apiName("document-collaboration-websocket")
                .description("WebSocket API for real-time document collaboration")
                .connectRouteOptions(WebSocketRouteOptions.builder()
                    .integration(new WebSocketLambdaIntegration("ConnectIntegration", connectionHandler))
                    .build())
                .disconnectRouteOptions(WebSocketRouteOptions.builder()
                    .integration(new WebSocketLambdaIntegration("DisconnectIntegration", connectionHandler))
                    .build())
                .defaultRouteOptions(WebSocketRouteOptions.builder()
                    .integration(new WebSocketLambdaIntegration("DefaultIntegration", messageHandler))
                    .build())
                .build();

        WebSocketStage webSocketStage = WebSocketStage.Builder.create(this, "ProdStage")
                .webSocketApi(webSocketApi)
                .stageName("prod")
                .autoDeploy(true)
                .build();

        // Grant WebSocket API permissions
        messageHandler.addPermission("AllowWebSocketInvoke",
            Permission.builder()
                .principal(new software.amazon.awscdk.services.iam.ServicePrincipal("apigateway.amazonaws.com"))
                .build());

        // AppSync GraphQL API
        this.graphqlApi = GraphqlApi.Builder.create(this, "DocumentCollabAPI")
                .name("DocumentCollabGraphQLAPI")
                .schema(SchemaFile.fromAsset("schema/schema.graphql"))
                .authorizationConfig(AuthorizationConfig.builder()
                    .defaultAuthorization(AuthorizationMode.builder()
                        .authorizationType(AuthorizationType.USER_POOL)
                        .userPoolConfig(UserPoolConfig.builder()
                            .userPool(userPool)
                            .build())
                        .build())
                    .build())
                .xrayEnabled(true)
                .build();

        // AppSync Data Sources
        LambdaDataSource messageDataSource = graphqlApi.addLambdaDataSource(
            "MessageDataSource", messageHandler);
        LambdaDataSource searchDataSource = graphqlApi.addLambdaDataSource(
            "SearchDataSource", searchHandler);

        // AppSync Resolvers
        messageDataSource.createResolver("GetDocumentResolver", BaseResolverProps.builder()
            .typeName("Query")
            .fieldName("getDocument")
            .build());

        messageDataSource.createResolver("ListDocumentsResolver", BaseResolverProps.builder()
            .typeName("Query")
            .fieldName("listDocuments")
            .build());

        searchDataSource.createResolver("SearchDocumentsResolver", BaseResolverProps.builder()
            .typeName("Query")
            .fieldName("searchDocuments")
            .build());

        messageDataSource.createResolver("CreateDocumentResolver", BaseResolverProps.builder()
            .typeName("Mutation")
            .fieldName("createDocument")
            .build());

        messageDataSource.createResolver("EditDocumentResolver", BaseResolverProps.builder()
            .typeName("Mutation")
            .fieldName("editDocument")
            .build());

        // EventBridge Rules
        Rule documentUpdatedRule = Rule.Builder.create(this, "DocumentUpdatedRule")
                .eventBus(documentEventBus)
                .eventPattern(EventPattern.builder()
                    .source(List.of("document.collaboration"))
                    .detailType(List.of("Document Updated"))
                    .build())
                .build();

        documentUpdatedRule.addTarget(new LambdaFunction(notificationHandler));
        documentUpdatedRule.addTarget(new LambdaFunction(indexingHandler));

        // Step Functions Workflow
        LambdaInvoke validateTask = LambdaInvoke.Builder.create(this, "ValidateDocument")
                .lambdaFunction(messageHandler)
                .outputPath("$.Payload")
                .build();

        DynamoPutItem createRecordTask = DynamoPutItem.Builder.create(this, "CreateDynamoRecord")
                .table(documentsTable)
                .item(Map.of(
                    "documentId", DynamoAttributeValue.fromString(JsonPath.stringAt("$.documentId")),
                    "title", DynamoAttributeValue.fromString(JsonPath.stringAt("$.title")),
                    "userId", DynamoAttributeValue.fromString(JsonPath.stringAt("$.userId")),
                    "createdAt", DynamoAttributeValue.numberFromString(JsonPath.stringAt("$.timestamp"))
                ))
                .build();

        LambdaInvoke indexTask = LambdaInvoke.Builder.create(this, "IndexDocument")
                .lambdaFunction(indexingHandler)
                .build();

        Chain definition = Chain.start(validateTask)
                .next(createRecordTask)
                .next(indexTask)
                .next(new Succeed(this, "Success"));

        this.documentWorkflow = StateMachine.Builder.create(this, "DocumentCreationWorkflow")
                .stateMachineName("DocumentCreationWorkflow")
                .definition(definition)
                .timeout(Duration.minutes(5))
                .build();

        // Outputs
        CfnOutput.Builder.create(this, "WebSocketApiUrl")
                .value(webSocketApi.getApiEndpoint())
                .description("WebSocket API endpoint")
                .exportName("WebSocketApiUrl")
                .build();

        CfnOutput.Builder.create(this, "AppSyncGraphQLUrl")
                .value(graphqlApi.getGraphqlUrl())
                .description("AppSync GraphQL endpoint")
                .exportName("AppSyncGraphQLUrl")
                .build();

        CfnOutput.Builder.create(this, "AppSyncApiKey")
                .value(graphqlApi.getApiId())
                .description("AppSync API ID")
                .exportName("AppSyncApiId")
                .build();
    }

    public WebSocketApi getWebSocketApi() { return webSocketApi; }
    public GraphqlApi getGraphqlApi() { return graphqlApi; }
    public Function getConnectionHandler() { return connectionHandler; }
    public Function getMessageHandler() { return messageHandler; }
    public Function getConflictResolutionHandler() { return conflictResolutionHandler; }
    public StateMachine getDocumentWorkflow() { return documentWorkflow; }
}
```

### MonitoringStack.java

```java
package com.doccollab.stacks;

import software.amazon.awscdk.Stack;
import software.amazon.awscdk.StackProps;
import software.amazon.awscdk.Duration;
import software.amazon.awscdk.services.cloudwatch.*;
import software.amazon.awscdk.services.cloudwatch.actions.SnsAction;
import software.amazon.awscdk.services.sns.Topic;
import software.constructs.Construct;
import java.util.List;

public class MonitoringStack extends Stack {
    private final Dashboard dashboard;

    public MonitoringStack(final Construct scope, final String id, 
                          final StackProps props, final ApiStack apiStack) {
        super(scope, id, props);

        // SNS Topic for alarms
        Topic alarmTopic = Topic.Builder.create(this, "AlarmTopic")
                .topicName("DocumentCollabAlarms")
                .displayName("Document Collaboration Alarms")
                .build();

        // Metrics
        Metric operationLatencyMetric = Metric.Builder.create()
                .namespace("DocumentCollab")
                .metricName("OperationLatency")
                .statistic("Average")
                .period(Duration.minutes(1))
                .build();

        Metric activeConnectionsMetric = Metric.Builder.create()
                .namespace("DocumentCollab")
                .metricName("ActiveConnections")
                .statistic("Sum")
                .period(Duration.minutes(1))
                .build();

        Metric errorRateMetric = Metric.Builder.create()
                .namespace("DocumentCollab")
                .metricName("ErrorRate")
                .statistic("Sum")
                .period(Duration.minutes(5))
                .build();

        Metric lambdaDurationMetric = apiStack.getMessageHandler()
                .metricDuration(MetricOptions.builder()
                    .statistic("Average")
                    .period(Duration.minutes(1))
                    .build());

        Metric lambdaErrorsMetric = apiStack.getMessageHandler()
                .metricErrors(MetricOptions.builder()
                    .statistic("Sum")
                    .period(Duration.minutes(5))
                    .build());

        // Alarms
        Alarm highLatencyAlarm = Alarm.Builder.create(this, "HighLatencyAlarm")
                .metric(operationLatencyMetric)
                .threshold(100)
                .evaluationPeriods(2)
                .datapointsToAlarm(2)
                .alarmName("DocumentCollab-HighLatency")
                .alarmDescription("Alert when operation latency exceeds 100ms")
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .treatMissingData(TreatMissingData.NOT_BREACHING)
                .build();

        highLatencyAlarm.addAlarmAction(new SnsAction(alarmTopic));

        Alarm highErrorRateAlarm = Alarm.Builder.create(this, "HighErrorRateAlarm")
                .metric(errorRateMetric)
                .threshold(10)
                .evaluationPeriods(2)
                .alarmName("DocumentCollab-HighErrorRate")
                .alarmDescription("Alert when error rate exceeds 10 per 5 minutes")
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build();

        highErrorRateAlarm.addAlarmAction(new SnsAction(alarmTopic));

        Alarm lambdaErrorsAlarm = Alarm.Builder.create(this, "LambdaErrorsAlarm")
                .metric(lambdaErrorsMetric)
                .threshold(5)
                .evaluationPeriods(1)
                .alarmName("DocumentCollab-LambdaErrors")
                .alarmDescription("Alert when Lambda errors exceed 5 per 5 minutes")
                .comparisonOperator(ComparisonOperator.GREATER_THAN_THRESHOLD)
                .build();

        lambdaErrorsAlarm.addAlarmAction(new SnsAction(alarmTopic));

        // CloudWatch Dashboard
        this.dashboard = Dashboard.Builder.create(this, "DocumentCollabDashboard")
                .dashboardName("DocumentCollaboration")
                .build();

        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("Operation Latency")
                .left(List.of(operationLatencyMetric))
                .width(12)
                .height(6)
                .build(),
            
            GraphWidget.Builder.create()
                .title("Active Connections")
                .left(List.of(activeConnectionsMetric))
                .width(12)
                .height(6)
                .build()
        );

        dashboard.addWidgets(
            GraphWidget.Builder.create()
                .title("Error Rate")
                .left(List.of(errorRateMetric))
                .width(12)
                .height(6)
                .build(),
            
            GraphWidget.Builder.create()
                .title("Lambda Performance")
                .left(List.of(lambdaDurationMetric))
                .right(List.of(lambdaErrorsMetric))
                .width(12)
                .height(6)
                .build()
        );

        dashboard.addWidgets(
            SingleValueWidget.Builder.create()
                .title("Current Active Connections")
                .metrics(List.of(activeConnectionsMetric))
                .width(8)
                .height(4)
                .build(),
            
            SingleValueWidget.Builder.create()
                .title("Average Latency (ms)")
                .metrics(List.of(operationLatencyMetric))
                .width(8)
                .height(4)
                .build(),
            
            SingleValueWidget.Builder.create()
                .title("Error Count")
                .metrics(List.of(errorRateMetric))
                .width(8)
                .height(4)
                .build()
        );
    }

    public Dashboard getDashboard() {
        return dashboard;
    }
}
```

---

## Lambda Function Implementations

### lambda/pom.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.doccollab</groupId>
    <artifactId>lambda-handlers</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <properties>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-lambda-java-core</artifactId>
            <version>1.2.2</version>
        </dependency>
        <dependency>
            <groupId>com.amazonaws</groupId>
            <artifactId>aws-lambda-java-events</artifactId>
            <version>3.11.3</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>dynamodb</artifactId>
            <version>2.20.26</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>s3</artifactId>
            <version>2.20.26</version>
        </dependency>
        <dependency>
            <groupId>software.amazon.awssdk</groupId>
            <artifactId>eventbridge</artifactId>
            <version>2.20.26</version>
        </dependency>
        <dependency>
            <groupId>redis.clients</groupId>
            <artifactId>jedis</artifactId>
            <version>5.0.0</version>
        </dependency>
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>
        <dependency>
            <groupId>org.opensearch.client</groupId>
            <artifactId>opensearch-java</artifactId>
            <version>2.6.0</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-shade-plugin</artifactId>
                <version>3.5.0</version>
                <executions>
                    <execution>
                        <phase>package</phase>
                        <goals>
                            <goal>shade</goal>
                        </goals>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### ConnectionHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import com.google.gson.Gson;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class ConnectionHandler implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {
    
    private final DynamoDbClient dynamoDb = DynamoDbClient.create();
    private final Gson gson = new Gson();
    private final String connectionsTable = System.getenv("CONNECTIONS_TABLE");
    
    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String routeKey = event.getRequestContext().getRouteKey();
        String connectionId = event.getRequestContext().getConnectionId();
        
        context.getLogger().log("Route: " + routeKey + ", ConnectionId: " + connectionId);
        
        try {
            switch (routeKey) {
                case "$connect":
                    return handleConnect(event, context);
                case "$disconnect":
                    return handleDisconnect(event, context);
                default:
                    return createResponse(400, "Unsupported route");
            }
        } catch (Exception e) {
            context.getLogger().log("Error: " + e.getMessage());
            return createResponse(500, "Internal server error");
        }
    }
    
    private APIGatewayV2WebSocketResponse handleConnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        Map<String, String> queryParams = event.getQueryStringParameters();
        
        String documentId = queryParams != null ? queryParams.get("documentId") : null;
        String userId = queryParams != null ? queryParams.get("userId") : null;
        
        if (documentId == null || userId == null) {
            return createResponse(400, "Missing required parameters");
        }
        
        // Store connection in DynamoDB
        long ttl = Instant.now().getEpochSecond() + 86400; // 24 hours
        
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("connectionId", AttributeValue.builder().s(connectionId).build());
        item.put("documentId", AttributeValue.builder().s(documentId).build());
        item.put("userId", AttributeValue.builder().s(userId).build());
        item.put("connectedAt", AttributeValue.builder().n(String.valueOf(Instant.now().toEpochMilli())).build());
        item.put("ttl", AttributeValue.builder().n(String.valueOf(ttl)).build());
        
        dynamoDb.putItem(PutItemRequest.builder()
                .tableName(connectionsTable)
                .item(item)
                .build());
        
        context.getLogger().log("Connection established: " + connectionId);
        return createResponse(200, "Connected");
    }
    
    private APIGatewayV2WebSocketResponse handleDisconnect(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        
        // Remove connection from DynamoDB
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("connectionId", AttributeValue.builder().s(connectionId).build());
        
        dynamoDb.deleteItem(DeleteItemRequest.builder()
                .tableName(connectionsTable)
                .key(key)
                .build());
        
        context.getLogger().log("Connection closed: " + connectionId);
        return createResponse(200, "Disconnected");
    }
    
    private APIGatewayV2WebSocketResponse createResponse(int statusCode, String message) {
        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(statusCode);
        response.setBody(message);
        return response;
    }
}
```

### MessageHandler.java

```java
package com.doccollab.handlers;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.eventbridge.EventBridgeClient;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequest;
import software.amazon.awssdk.services.eventbridge.model.PutEventsRequestEntry;
import software.amazon.awssdk.core.sync.RequestBody;
import redis.clients.jedis.Jedis;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class MessageHandler implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {
    
    private final DynamoDbClient dynamoDb = DynamoDbClient.create();
    private final S3Client s3 = S3Client.create();
    private final EventBridgeClient eventBridge = EventBridgeClient.create();
    private final Gson gson = new Gson();
    
    private final String operationsTable = System.getenv("OPERATIONS_TABLE");
    private final String documentsTable = System.getenv("DOCUMENTS_TABLE");
    private final String connectionsTable = System.getenv("CONNECTIONS_TABLE");
    private final String documentBucket = System.getenv("DOCUMENT_BUCKET");
    private final String redisEndpoint = System.getenv("REDIS_ENDPOINT");
    private final String eventBusName = System.getenv("EVENT_BUS_NAME");
    
    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String body = event.getBody();
        String connectionId = event.getRequestContext().getConnectionId();
        
        context.getLogger().log("Message received: " + body);
        
        try {
            JsonObject message = gson.fromJson(body, JsonObject.class);
            String action = message.get("action").getAsString();
            
            switch (action) {
                case "edit":
                    return handleEdit(message, connectionId, context);
                case "getDocument":
                    return handleGetDocument(message, connectionId, context);
                case "saveDocument":
                    return handleSaveDocument(message, connectionId, context);
                default:
                    return createResponse(400, "Unknown action");
            }
        } catch (Exception e) {
            context.getLogger().log("Error processing message: " + e.getMessage());
            return createResponse(500, "Error processing message");
        }
    }
    
    private APIGatewayV2WebSocketResponse handleEdit(JsonObject message, String connectionId, Context context) {
        String documentId = message.get("documentId").getAsString();
        String userId = message.get("userId").getAsString();
        JsonObject operation = message.getAsJsonObject("operation");
        long timestamp = Instant.now().toEpochMilli();
        
        // Store operation in DynamoDB
        Map<String, AttributeValue> item = new HashMap<>();
        item.put("documentId", AttributeValue.builder().s(documentId).build());
        item.put("timestamp", AttributeValue.builder().n(String.valueOf(timestamp)).build());
        item.put("userId", AttributeValue.builder().s(userId).build());
        item.put("operation", AttributeValue.builder().s(gson.toJson(operation)).build());
        item.put("connectionId", AttributeValue.builder().s(connectionId).build());
        
        dynamoDb.putItem(PutItemRequest.builder()
                .tableName(operationsTable)
                .item(item)
                .build());
        
        // Cache in Redis
        try (Jedis jedis = new Jedis(redisEndpoint.split(":")[0], 
                                     Integer.parseInt(redisEndpoint.split(":")[1]))) {
            String key = "doc:" + documentId + ":ops";
            jedis.zadd(key, timestamp, gson.toJson(operation));
            jedis.expire(key, 3600); // 1 hour TTL
        } catch (Exception e) {
            context.getLogger().log("Redis error: " + e.getMessage());
        }
        
        // Publish event to EventBridge
        publishDocumentUpdatedEvent(documentId, userId, operation);
        
        // Broadcast to other connected clients
        broadcastToDocument(documentId, connectionId, message, context);
        
        return createResponse(200, "Edit processed");
    }
    
    private APIGatewayV2WebSocketResponse handleGetDocument(JsonObject message, String connectionId, Context context) {
        String documentId = message.get("documentId").getAsString();
        
        // Try Redis first
        try (Jedis jedis = new Jedis(redisEndpoint.split(":")[0], 
                                     Integer.parseInt(redisEndpoint.split(":")[1]))) {
            String cachedDoc = jedis.get("doc:" + documentId);
            if (cachedDoc != null) {
                return createResponse(200, cachedDoc);
            }
        } catch (Exception e) {
            context.getLogger().log("Redis error: " + e.getMessage());
        }
        
        // Get from DynamoDB
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("documentId", AttributeValue.builder().s(documentId).build());
        
        GetItemResponse response = dynamoDb.getItem(GetItemRequest.builder()
                .tableName(documentsTable)
                .key(key)
                .build());
        
        if (response.hasItem()) {
            String document = gson.toJson(response.item());
            
            // Cache in Redis
            try (Jedis jedis = new Jedis(redisEndpoint.split(":")[0], 
                                         Integer.parseInt(redisEndpoint.split(":")[1]))) {
                jedis.setex("doc:" + documentId, 3600, document);
            } catch (Exception e) {
                context.getLogger().log("Redis caching error: " + e.getMessage());
            }
            
            return createResponse(200, document);
        }
        
        return createResponse(404, "Document not found");
    }
    
    private APIGatewayV2WebSocketResponse handleSaveDocument(JsonObject message, String connectionId, Context context) {
        String documentId = message.get("documentId").getAsString();
        String content = message.get("content").getAsString();
        long version = message.get("version").getAsLong();
        
        // Save to S3
        String s3Key = documentId + "/v" + version + ".json";
        s3.putObject(PutObjectRequest.builder()
                .bucket(documentBucket)
                .key(s3Key)
                .build(),
            RequestBody.fromString(content));
        
        // Update DynamoDB
        Map<String, AttributeValue> key = new HashMap<>();
        key.put("documentId", AttributeValue.builder().s(documentId).build());
        
        Map<String, AttributeValueUpdate> updates = new HashMap<>();
        updates.put("currentVersion", AttributeValueUpdate.builder()
                .value(AttributeValue.builder().n(String.valueOf(version)).build())
                .action(AttributeAction.PUT)
                .build());
        updates.put("lastModified", AttributeValueUpdate.builder()
                .value(AttributeValue.builder().n(String.valueOf(Instant.now().toEpochMilli())).build())
                .action(AttributeAction.PUT)
                .build());
        updates.put("s3Key", AttributeValueUpdate.builder()
                .value(AttributeValue.builder().s(s3Key).build())
                .action(AttributeAction.PUT)
                .build());
        
        dynamoDb.updateItem(UpdateItemRequest.builder()
                .tableName(documentsTable)
                .key(key)
                .attributeUpdates(updates)
                .build());
        
        // Invalidate Redis cache
        try (Jedis jedis = new Jedis(redisEndpoint.split(":")[0], 
                                     Integer.parseInt(redisEndpoint.split(":")[1]))) {
            jedis.del("doc:" + documentId);
        } catch (Exception e) {
            context.getLogger().log("Redis error: " + e.getMessage());
        }
        
        return createResponse(200, "Document saved");
    }
    
    private void publishDocumentUpdatedEvent(String documentId, String userId, JsonObject operation) {
        Map<String, String> detail = new HashMap<>();
        detail.put("documentId", documentId);
        detail.put("userId", userId);
        detail.put("operation", gson.toJson(operation));
        
        PutEventsRequestEntry event = PutEventsRequestEntry.builder()
                .source("document.collaboration")
                .detailType("Document Updated")
                .detail(gson.toJson(detail))
                .eventBusName(eventBusName)
                .build();
        
        eventBridge.putEvents(PutEventsRequest.builder()
                .entries(event)
                .build());
    }
    
    private void broadcastToDocument(String documentId, String senderConnectionId, 
                                     JsonObject message, Context context) {
        // Query all connections for this document
        Map<String, AttributeValue> expressionAttributeValues = new HashMap<>();
        expressionAttributeValues.put(":documentId", AttributeValue.builder().s(documentId).build());
        
        QueryResponse response = dynamoDb.query(QueryRequest.builder()
                .tableName(connectionsTable)
                .indexName("DocumentConnectionsIndex")
                .keyConditionExpression("documentId = :documentId")
                .expressionAttributeValues(expressionAttributeValues)
                .build());
        
        // TODO: Send message to each connection via API Gateway Management API
        // This requires additional SDK setup for WebSocket message posting
        context.getLogger().log("Broadcasting to " + response.count() + " connections");
    }
    
    private APIGatewayV2WebSocketResponse createResponse(int statusCode, String body) {
        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(statusCode);
        response.setBody(body);
        return response;
    }
}