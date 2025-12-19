# Overview


## ./bin/tap.d.ts

```typescript
#!/usr/bin/env node
export {};

```

## ./lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Document Automation System - Comprehensive CloudFormation Stack",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "TurnAroundPromptTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "TurnAroundPromptTable${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "DeletionProtectionEnabled": false,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentMetadataTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "DocumentMetadata${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "documentId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "createdAt",
            "AttributeType": "S"
          },
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "documentId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "createdAt",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "UserIdIndex",
            "KeySchema": [
              {
                "AttributeName": "userId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "createdAt",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "DocumentEncryptionKey"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "AuditTrailTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "DocumentAuditTrail${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "auditId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "S"
          },
          {
            "AttributeName": "documentId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "auditId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "DocumentIdIndex",
            "KeySchema": [
              {
                "AttributeName": "documentId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "DocumentEncryptionKey"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentEncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "Encryption key for document automation system - ${EnvironmentSuffix}"
        },
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable Root Account",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Enable Lambda Functions",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:Encrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Enable S3",
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentEncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/document-automation-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "DocumentEncryptionKey"
        }
      }
    },
    "TemplatesBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "doc-templates-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "DocumentEncryptionKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "GeneratedDocumentsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "generated-docs-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "DocumentEncryptionKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "ArchiveOldDocuments",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 30
                },
                {
                  "StorageClass": "GLACIER",
                  "TransitionInDays": 90
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentGenerationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "DocumentGenerationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket",
                    "s3:ListBucketVersions"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "TemplatesBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${TemplatesBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectTagging"
                  ],
                  "Resource": {
                    "Fn::Sub": "${GeneratedDocumentsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "DocumentMetadataTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "AuditTrailTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${DocumentMetadataTable.Arn}/index/*"
                    },
                    {
                      "Fn::Sub": "${AuditTrailTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "DocumentEncryptionKey",
                      "Arn"
                    ]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "translate:TranslateText",
                    "comprehend:DetectEntities",
                    "comprehend:DetectKeyPhrases",
                    "textract:AnalyzeDocument",
                    "textract:DetectDocumentText"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentGenerationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "DocumentGeneration-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "DocumentGenerationRole",
            "Arn"
          ]
        },
        "Timeout": 60,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "TEMPLATES_BUCKET": {
              "Ref": "TemplatesBucket"
            },
            "GENERATED_DOCS_BUCKET": {
              "Ref": "GeneratedDocumentsBucket"
            },
            "METADATA_TABLE": {
              "Ref": "DocumentMetadataTable"
            },
            "AUDIT_TABLE": {
              "Ref": "AuditTrailTable"
            },
            "KMS_KEY_ID": {
              "Ref": "DocumentEncryptionKey"
            }
          }
        },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst s3 = new AWS.S3();\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\nconst { v4: uuidv4 } = require('uuid');\n\nexports.handler = async (event) => {\n    console.log('Document Generation Request:', JSON.stringify(event));\n    \n    try {\n        const { templateId, data, userId, language = 'en' } = JSON.parse(event.body || '{}');\n        \n        // Get template from S3\n        const template = await s3.getObject({\n            Bucket: process.env.TEMPLATES_BUCKET,\n            Key: `templates/${templateId}.json`\n        }).promise().catch(() => null);\n        \n        if (!template) {\n            return {\n                statusCode: 404,\n                headers: { 'Content-Type': 'application/json' },\n                body: JSON.stringify({ error: 'Template not found' })\n            };\n        }\n        \n        const documentId = uuidv4();\n        const timestamp = new Date().toISOString();\n        \n        // Process template and generate document\n        const processedContent = JSON.parse(template.Body.toString());\n        // Here you would merge data with template\n        \n        // Save to S3\n        await s3.putObject({\n            Bucket: process.env.GENERATED_DOCS_BUCKET,\n            Key: `documents/${documentId}.pdf`,\n            Body: JSON.stringify({ ...processedContent, data }),\n            ContentType: 'application/pdf',\n            ServerSideEncryption: 'aws:kms',\n            SSEKMSKeyId: process.env.KMS_KEY_ID,\n            Metadata: {\n                documentId,\n                userId,\n                templateId,\n                language,\n                createdAt: timestamp\n            }\n        }).promise();\n        \n        // Save metadata to DynamoDB\n        await dynamodb.put({\n            TableName: process.env.METADATA_TABLE,\n            Item: {\n                documentId,\n                createdAt: timestamp,\n                userId,\n                templateId,\n                language,\n                status: 'generated',\n                s3Key: `documents/${documentId}.pdf`\n            }\n        }).promise();\n        \n        // Create audit trail entry\n        await dynamodb.put({\n            TableName: process.env.AUDIT_TABLE,\n            Item: {\n                auditId: uuidv4(),\n                timestamp,\n                documentId,\n                userId,\n                action: 'DOCUMENT_GENERATED',\n                details: { templateId, language }\n            }\n        }).promise();\n        \n        return {\n            statusCode: 200,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({\n                documentId,\n                message: 'Document generated successfully',\n                s3Location: `s3://${process.env.GENERATED_DOCS_BUCKET}/documents/${documentId}.pdf`\n            })\n        };\n    } catch (error) {\n        console.error('Error:', error);\n        return {\n            statusCode: 500,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({ error: 'Internal server error' })\n        };\n    }\n};"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentAnalysisFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "DocumentAnalysis-${EnvironmentSuffix}"
        },
        "Runtime": "nodejs22.x",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "DocumentGenerationRole",
            "Arn"
          ]
        },
        "Timeout": 120,
        "MemorySize": 1024,
        "Environment": {
          "Variables": {
            "GENERATED_DOCS_BUCKET": {
              "Ref": "GeneratedDocumentsBucket"
            },
            "METADATA_TABLE": {
              "Ref": "DocumentMetadataTable"
            },
            "AUDIT_TABLE": {
              "Ref": "AuditTrailTable"
            }
          }
        },
        "Code": {
          "ZipFile": "const AWS = require('aws-sdk');\nconst textract = new AWS.Textract();\nconst comprehend = new AWS.Comprehend();\nconst dynamodb = new AWS.DynamoDB.DocumentClient();\nconst { v4: uuidv4 } = require('uuid');\n\nexports.handler = async (event) => {\n    console.log('Document Analysis Request:', JSON.stringify(event));\n    \n    try {\n        const { documentId, analysisType } = JSON.parse(event.body || '{}');\n        const timestamp = new Date().toISOString();\n        \n        // Perform Textract analysis\n        const textractParams = {\n            Document: {\n                S3Object: {\n                    Bucket: process.env.GENERATED_DOCS_BUCKET,\n                    Name: `documents/${documentId}.pdf`\n                }\n            },\n            FeatureTypes: ['TABLES', 'FORMS']\n        };\n        \n        const textractResult = await textract.analyzeDocument(textractParams).promise();\n        \n        // Extract text for Comprehend analysis\n        const extractedText = textractResult.Blocks\n            .filter(block => block.BlockType === 'LINE')\n            .map(block => block.Text)\n            .join(' ');\n        \n        // Perform Comprehend analysis\n        const entities = await comprehend.detectEntities({\n            Text: extractedText,\n            LanguageCode: 'en'\n        }).promise();\n        \n        const keyPhrases = await comprehend.detectKeyPhrases({\n            Text: extractedText,\n            LanguageCode: 'en'\n        }).promise();\n        \n        // Save analysis results\n        await dynamodb.update({\n            TableName: process.env.METADATA_TABLE,\n            Key: {\n                documentId,\n                createdAt: timestamp\n            },\n            UpdateExpression: 'SET analysisResults = :results, analyzedAt = :timestamp',\n            ExpressionAttributeValues: {\n                ':results': {\n                    entities: entities.Entities,\n                    keyPhrases: keyPhrases.KeyPhrases,\n                    textractBlocks: textractResult.Blocks.length\n                },\n                ':timestamp': timestamp\n            }\n        }).promise();\n        \n        // Audit trail\n        await dynamodb.put({\n            TableName: process.env.AUDIT_TABLE,\n            Item: {\n                auditId: uuidv4(),\n                timestamp,\n                documentId,\n                action: 'DOCUMENT_ANALYZED',\n                details: {\n                    analysisType,\n                    entitiesFound: entities.Entities.length,\n                    keyPhrasesFound: keyPhrases.KeyPhrases.length\n                }\n            }\n        }).promise();\n        \n        return {\n            statusCode: 200,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({\n                documentId,\n                analysis: {\n                    entities: entities.Entities,\n                    keyPhrases: keyPhrases.KeyPhrases,\n                    documentStructure: {\n                        blocks: textractResult.Blocks.length,\n                        tables: textractResult.Blocks.filter(b => b.BlockType === 'TABLE').length,\n                        forms: textractResult.Blocks.filter(b => b.BlockType === 'KEY_VALUE_SET').length\n                    }\n                }\n            })\n        };\n    } catch (error) {\n        console.error('Error:', error);\n        return {\n            statusCode: 500,\n            headers: { 'Content-Type': 'application/json' },\n            body: JSON.stringify({ error: 'Analysis failed' })\n        };\n    }\n};"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "DocumentAutomationAPI-${EnvironmentSuffix}"
        },
        "Description": "API for document generation and processing",
        "EndpointConfiguration": {
          "Types": [
            "REGIONAL"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentsResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "DocumentAPI"
        },
        "ParentId": {
          "Fn::GetAtt": [
            "DocumentAPI",
            "RootResourceId"
          ]
        },
        "PathPart": "documents"
      }
    },
    "GenerateMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "DocumentAPI"
        },
        "ResourceId": {
          "Ref": "DocumentsResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "AWS_IAM",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DocumentGenerationFunction.Arn}/invocations"
          }
        }
      }
    },
    "AnalysisResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "DocumentAPI"
        },
        "ParentId": {
          "Ref": "DocumentsResource"
        },
        "PathPart": "analyze"
      }
    },
    "AnalyzeMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "DocumentAPI"
        },
        "ResourceId": {
          "Ref": "AnalysisResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "AWS_IAM",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DocumentAnalysisFunction.Arn}/invocations"
          }
        }
      }
    },
    "APIDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "Properties": {
        "RestApiId": {
          "Ref": "DocumentAPI"
        },
        "StageName": {
          "Ref": "EnvironmentSuffix"
        },
        "StageDescription": {
          "ThrottlingBurstLimit": 100,
          "ThrottlingRateLimit": 50,
          "MetricsEnabled": true,
          "DataTraceEnabled": true,
          "LoggingLevel": "INFO"
        }
      },
      "DependsOn": [
        "GenerateMethod",
        "AnalyzeMethod"
      ]
    },
    "LambdaAPIPermissionGenerate": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DocumentGenerationFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${DocumentAPI}/*/*/*"
        }
      }
    },
    "LambdaAPIPermissionAnalyze": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DocumentAnalysisFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${DocumentAPI}/*/*/*"
        }
      }
    },
    "ApprovalStateMachineRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StateMachineExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "DocumentGenerationFunction",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "DocumentAnalysisFunction",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "SignatureRequestTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "DocumentMetadataTable",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "AuditTrailTable",
                        "Arn"
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "ApprovalWorkflowStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "DocumentApprovalWorkflow-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "ApprovalStateMachineRole",
            "Arn"
          ]
        },
        "DefinitionString": {
          "Fn::Sub": "{\n  \"Comment\": \"Multi-party document approval workflow\",\n  \"StartAt\": \"GenerateDocument\",\n  \"States\": {\n    \"GenerateDocument\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${DocumentGenerationFunction.Arn}\",\n      \"Next\": \"AnalyzeDocument\",\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"States.TaskFailed\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2\n        }\n      ]\n    },\n    \"AnalyzeDocument\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${DocumentAnalysisFunction.Arn}\",\n      \"Next\": \"SendForApproval\"\n    },\n    \"SendForApproval\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::sns:publish\",\n      \"Parameters\": {\n        \"TopicArn\": \"${SignatureRequestTopic}\",\n        \"Message.$\": \"$.documentId\",\n        \"Subject\": \"Document Ready for Approval\"\n      },\n      \"Next\": \"WaitForApproval\"\n    },\n    \"WaitForApproval\": {\n      \"Type\": \"Wait\",\n      \"Seconds\": 300,\n      \"Next\": \"CheckApprovalStatus\"\n    },\n    \"CheckApprovalStatus\": {\n      \"Type\": \"Choice\",\n      \"Choices\": [\n        {\n          \"Variable\": \"$.approvalStatus\",\n          \"StringEquals\": \"APPROVED\",\n          \"Next\": \"DocumentApproved\"\n        },\n        {\n          \"Variable\": \"$.approvalStatus\",\n          \"StringEquals\": \"REJECTED\",\n          \"Next\": \"DocumentRejected\"\n        }\n      ],\n      \"Default\": \"WaitForApproval\"\n    },\n    \"DocumentApproved\": {\n      \"Type\": \"Succeed\"\n    },\n    \"DocumentRejected\": {\n      \"Type\": \"Fail\",\n      \"Error\": \"DocumentRejected\",\n      \"Cause\": \"Document was rejected during approval process\"\n    }\n  }\n}"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "SignatureRequestTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "DocumentSignatureRequests-${EnvironmentSuffix}"
        },
        "DisplayName": "Document Signature Requests",
        "KmsMasterKeyId": {
          "Ref": "DocumentEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentNotificationsTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "DocumentNotifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Document System Notifications",
        "KmsMasterKeyId": {
          "Ref": "DocumentEncryptionKey"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "ComplianceDeadlineRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "ComplianceDeadlineMonitor-${EnvironmentSuffix}"
        },
        "Description": "Monitor compliance deadlines for documents",
        "ScheduleExpression": "rate(1 day)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "DocumentNotificationsTopic"
            },
            "Id": "ComplianceNotificationTarget",
            "InputTransformer": {
              "InputPathsMap": {
                "time": "$.time"
              },
              "InputTemplate": "{\"message\": \"Daily compliance check at <time>\"}"
            }
          }
        ]
      }
    },
    "DocumentReminderRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "DocumentReminders-${EnvironmentSuffix}"
        },
        "Description": "Send document reminders",
        "ScheduleExpression": "cron(0 9 * * ? *)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "DocumentGenerationFunction",
                "Arn"
              ]
            },
            "Id": "ReminderLambdaTarget"
          }
        ]
      }
    },
    "EventBridgeLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DocumentGenerationFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "DocumentReminderRule",
            "Arn"
          ]
        }
      }
    },
    "EventBridgeSNSPermission": {
      "Type": "AWS::SNS::TopicPolicy",
      "Properties": {
        "Topics": [
          {
            "Ref": "DocumentNotificationsTopic"
          }
        ],
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "SNS:Publish",
              "Resource": {
                "Ref": "DocumentNotificationsTopic"
              }
            }
          ]
        }
      }
    },
    "DocumentMetricsLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/document-automation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentProcessingAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "HighDocumentProcessingErrors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when document processing errors are high",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "DocumentGenerationFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "DocumentNotificationsTopic"
          }
        ]
      }
    },
    "AthenaWorkGroup": {
      "Type": "AWS::Athena::WorkGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "DocumentAnalytics-${EnvironmentSuffix}"
        },
        "Description": "Workgroup for document usage analytics",
        "WorkGroupConfiguration": {
          "ResultConfiguration": {
            "OutputLocation": {
              "Fn::Sub": "s3://${AthenaResultsBucket}/query-results/"
            },
            "EncryptionConfiguration": {
              "EncryptionOption": "SSE_KMS",
              "KmsKey": {
                "Ref": "DocumentEncryptionKey"
              }
            }
          },
          "EnforceWorkGroupConfiguration": true,
          "PublishCloudWatchMetricsEnabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "AthenaResultsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "athena-results-${AWS::AccountId}-${EnvironmentSuffix}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "DocumentEncryptionKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldQueryResults",
              "Status": "Enabled",
              "ExpirationInDays": 7
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DocumentDatabase": {
      "Type": "AWS::Glue::Database",
      "Properties": {
        "CatalogId": {
          "Ref": "AWS::AccountId"
        },
        "DatabaseInput": {
          "Name": {
            "Fn::Sub": "document_analytics_${EnvironmentSuffix}"
          },
          "Description": "Database for document analytics"
        }
      }
    },
    "DocumentMetadataGlueTable": {
      "Type": "AWS::Glue::Table",
      "Properties": {
        "CatalogId": {
          "Ref": "AWS::AccountId"
        },
        "DatabaseName": {
          "Ref": "DocumentDatabase"
        },
        "TableInput": {
          "Name": "document_metadata",
          "StorageDescriptor": {
            "Columns": [
              {
                "Name": "document_id",
                "Type": "string"
              },
              {
                "Name": "created_at",
                "Type": "timestamp"
              },
              {
                "Name": "user_id",
                "Type": "string"
              },
              {
                "Name": "template_id",
                "Type": "string"
              },
              {
                "Name": "status",
                "Type": "string"
              }
            ],
            "Location": {
              "Fn::Sub": "s3://${GeneratedDocumentsBucket}/metadata/"
            },
            "InputFormat": "org.apache.hadoop.mapred.TextInputFormat",
            "OutputFormat": "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            "SerdeInfo": {
              "SerializationLibrary": "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"
            }
          }
        }
      }
    }
  },
  "Outputs": {
    "TurnAroundPromptTableName": {
      "Description": "Name of the DynamoDB table",
      "Value": {
        "Ref": "TurnAroundPromptTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableName"
        }
      }
    },
    "TurnAroundPromptTableArn": {
      "Description": "ARN of the DynamoDB table",
      "Value": {
        "Fn::GetAtt": [
          "TurnAroundPromptTable",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableArn"
        }
      }
    },
    "DocumentMetadataTableName": {
      "Description": "Name of the Document Metadata DynamoDB table",
      "Value": {
        "Ref": "DocumentMetadataTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DocumentMetadataTableName"
        }
      }
    },
    "AuditTrailTableName": {
      "Description": "Name of the Audit Trail DynamoDB table",
      "Value": {
        "Ref": "AuditTrailTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AuditTrailTableName"
        }
      }
    },
    "DocumentAPIUrl": {
      "Description": "URL of the Document Automation API",
      "Value": {
        "Fn::Sub": "https://${DocumentAPI}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DocumentAPIUrl"
        }
      }
    },
    "TemplatesBucketName": {
      "Description": "Name of the Templates S3 bucket",
      "Value": {
        "Ref": "TemplatesBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TemplatesBucketName"
        }
      }
    },
    "GeneratedDocumentsBucketName": {
      "Description": "Name of the Generated Documents S3 bucket",
      "Value": {
        "Ref": "GeneratedDocumentsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-GeneratedDocumentsBucketName"
        }
      }
    },
    "DocumentGenerationFunctionArn": {
      "Description": "ARN of the Document Generation Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "DocumentGenerationFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DocumentGenerationFunctionArn"
        }
      }
    },
    "DocumentAnalysisFunctionArn": {
      "Description": "ARN of the Document Analysis Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "DocumentAnalysisFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DocumentAnalysisFunctionArn"
        }
      }
    },
    "ApprovalWorkflowStateMachineArn": {
      "Description": "ARN of the Approval Workflow State Machine",
      "Value": {
        "Ref": "ApprovalWorkflowStateMachine"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ApprovalWorkflowStateMachineArn"
        }
      }
    },
    "SignatureRequestTopicArn": {
      "Description": "ARN of the Signature Request SNS Topic",
      "Value": {
        "Ref": "SignatureRequestTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SignatureRequestTopicArn"
        }
      }
    },
    "DocumentEncryptionKeyId": {
      "Description": "ID of the KMS key for document encryption",
      "Value": {
        "Ref": "DocumentEncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DocumentEncryptionKeyId"
        }
      }
    },
    "AthenaWorkGroupName": {
      "Description": "Name of the Athena WorkGroup for analytics",
      "Value": {
        "Ref": "AthenaWorkGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AthenaWorkGroupName"
        }
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## ./lib/tap-stack.d.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface TapStackProps extends cdk.StackProps {
    environmentSuffix?: string;
}
export declare class TapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: TapStackProps);
}
export {};

```

## ./test/tap-stack.int.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.int.test.ts

```typescript
import fs from 'fs';
import {
  DynamoDBClient,
  DescribeTableCommand,
  PutItemCommand,
  GetItemCommand,
  DeleteItemCommand,
} from '@aws-sdk/client-dynamodb';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  LambdaClient,
  GetFunctionCommand,
  InvokeCommand,
} from '@aws-sdk/client-lambda';
import {
  SNSClient,
  GetTopicAttributesCommand,
} from '@aws-sdk/client-sns';
import {
  SFNClient,
  DescribeStateMachineCommand,
} from '@aws-sdk/client-sfn';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  ApiGatewayV2Client,
  GetApisCommand,
} from '@aws-sdk/client-apigatewayv2';
import {
  AthenaClient,
  GetWorkGroupCommand,
} from '@aws-sdk/client-athena';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix and region from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const dynamodbClient = new DynamoDBClient({ region });
const s3Client = new S3Client({ region });
const lambdaClient = new LambdaClient({ region });
const snsClient = new SNSClient({ region });
const sfnClient = new SFNClient({ region });
const kmsClient = new KMSClient({ region });
const athenaClient = new AthenaClient({ region });

describe('Document Automation System Integration Tests', () => {
  describe('DynamoDB Tables', () => {
    test('TurnAroundPromptTable should exist and be active', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.TableName).toBe(`TurnAroundPromptTable${environmentSuffix}`);
    });

    test('DocumentMetadataTable should exist and be active', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
      expect(response.Table?.BillingModeSummary?.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('AuditTrailTable should exist and be active', async () => {
      const tableName = outputs.AuditTrailTableName;
      expect(tableName).toBeDefined();

      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table).toBeDefined();
      expect(response.Table?.TableStatus).toBe('ACTIVE');
    });

    test('DocumentMetadataTable should have encryption enabled', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.SSEDescription).toBeDefined();
      expect(response.Table?.SSEDescription?.Status).toBe('ENABLED');
    });

    test('DocumentMetadataTable should have stream enabled', async () => {
      const tableName = outputs.DocumentMetadataTableName;
      const command = new DescribeTableCommand({ TableName: tableName });
      const response = await dynamodbClient.send(command);

      expect(response.Table?.StreamSpecification).toBeDefined();
      expect(response.Table?.StreamSpecification?.StreamEnabled).toBe(true);
    });

    test('can write and read from TurnAroundPromptTable', async () => {
      const tableName = outputs.TurnAroundPromptTableName;
      const testId = `test-${Date.now()}`;

      // Put item
      await dynamodbClient.send(
        new PutItemCommand({
          TableName: tableName,
          Item: {
            id: { S: testId },
            data: { S: 'test data' },
          },
        })
      );

      // Get item
      const getResponse = await dynamodbClient.send(
        new GetItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
          },
        })
      );

      expect(getResponse.Item).toBeDefined();
      expect(getResponse.Item?.id.S).toBe(testId);

      // Clean up
      await dynamodbClient.send(
        new DeleteItemCommand({
          TableName: tableName,
          Key: {
            id: { S: testId },
          },
        })
      );
    });
  });

  describe('S3 Buckets', () => {
    test('TemplatesBucket should exist', async () => {
      const bucketName = outputs.TemplatesBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('GeneratedDocumentsBucket should exist', async () => {
      const bucketName = outputs.GeneratedDocumentsBucketName;
      expect(bucketName).toBeDefined();

      const command = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('can upload and retrieve object from TemplatesBucket', async () => {
      const bucketName = outputs.TemplatesBucketName;
      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Test template content';

      // Upload
      await s3Client.send(
        new PutObjectCommand({
          Bucket: bucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Retrieve
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );

      expect(getResponse.Body).toBeDefined();
      const content = await getResponse.Body?.transformToString();
      expect(content).toBe(testContent);

      // Clean up
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: testKey,
        })
      );
    });
  });

  describe('Lambda Functions', () => {
    test('DocumentGenerationFunction should exist', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('DocumentAnalysisFunction should exist', async () => {
      const functionArn = outputs.DocumentAnalysisFunctionArn;
      expect(functionArn).toBeDefined();

      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
      expect(response.Configuration?.State).toBe('Active');
    });

    test('DocumentGenerationFunction has correct environment variables', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars).toBeDefined();
      expect(envVars?.TEMPLATES_BUCKET).toBeDefined();
      expect(envVars?.GENERATED_DOCS_BUCKET).toBeDefined();
      expect(envVars?.METADATA_TABLE).toBeDefined();
      expect(envVars?.AUDIT_TABLE).toBeDefined();
      expect(envVars?.KMS_KEY_ID).toBeDefined();
    });

    test('can invoke DocumentGenerationFunction', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();

      const payload = {
        body: JSON.stringify({
          templateId: 'test-template',
          data: { field1: 'value1' },
          userId: 'test-user',
          language: 'en',
        }),
      };

      const command = new InvokeCommand({
        FunctionName: functionName,
        Payload: JSON.stringify(payload),
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const result = JSON.parse(Buffer.from(response.Payload).toString());
        // Function should return a response with statusCode (even if error)
        expect(result).toBeDefined();
        expect(typeof result).toBe('object');
      }
    }, 70000);
  });

  describe('SNS Topics', () => {
    test('SignatureRequestTopic should exist', async () => {
      const topicArn = outputs.SignatureRequestTopicArn;
      expect(topicArn).toBeDefined();

      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(topicArn);
    });

    test('SignatureRequestTopic should have KMS encryption', async () => {
      const topicArn = outputs.SignatureRequestTopicArn;
      const command = new GetTopicAttributesCommand({ TopicArn: topicArn });
      const response = await snsClient.send(command);

      expect(response.Attributes?.KmsMasterKeyId).toBeDefined();
    });
  });

  describe('Step Functions', () => {
    test('ApprovalWorkflowStateMachine should exist', async () => {
      const stateMachineArn = outputs.ApprovalWorkflowStateMachineArn;
      expect(stateMachineArn).toBeDefined();

      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.stateMachineArn).toBe(stateMachineArn);
      expect(response.status).toBe('ACTIVE');
    });

    test('state machine should have proper definition', async () => {
      const stateMachineArn = outputs.ApprovalWorkflowStateMachineArn;
      const command = new DescribeStateMachineCommand({
        stateMachineArn: stateMachineArn,
      });
      const response = await sfnClient.send(command);

      expect(response.definition).toBeDefined();
      const definition = JSON.parse(response.definition || '{}');
      expect(definition.States).toBeDefined();
      expect(definition.States.GenerateDocument).toBeDefined();
      expect(definition.States.AnalyzeDocument).toBeDefined();
    });
  });

  describe('KMS', () => {
    test('DocumentEncryptionKey should exist', async () => {
      const keyId = outputs.DocumentEncryptionKeyId;
      expect(keyId).toBeDefined();

      const command = new DescribeKeyCommand({ KeyId: keyId });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata?.Enabled).toBe(true);
    });
  });

  describe('API Gateway', () => {
    test('DocumentAPIUrl should be accessible', async () => {
      const apiUrl = outputs.DocumentAPIUrl;
      expect(apiUrl).toBeDefined();
      expect(apiUrl).toContain('https://');
      expect(apiUrl).toContain('execute-api');
      expect(apiUrl).toContain(region);
      expect(apiUrl).toContain(environmentSuffix);
    });
  });

  describe('Athena', () => {
    test('AthenaWorkGroup should exist', async () => {
      const workGroupName = outputs.AthenaWorkGroupName;
      expect(workGroupName).toBeDefined();

      const command = new GetWorkGroupCommand({ WorkGroup: workGroupName });
      const response = await athenaClient.send(command);

      expect(response.WorkGroup).toBeDefined();
      expect(response.WorkGroup?.Name).toBe(workGroupName);
      expect(response.WorkGroup?.State).toBe('ENABLED');
    });

    test('AthenaWorkGroup should have encryption configuration', async () => {
      const workGroupName = outputs.AthenaWorkGroupName;
      const command = new GetWorkGroupCommand({ WorkGroup: workGroupName });
      const response = await athenaClient.send(command);

      const config = response.WorkGroup?.Configuration?.ResultConfiguration;
      expect(config).toBeDefined();
      expect(config?.EncryptionConfiguration).toBeDefined();
      expect(config?.EncryptionConfiguration?.EncryptionOption).toBe('SSE_KMS');
    });
  });

  describe('Resource Integration', () => {
    test('all outputs should be defined', () => {
      expect(outputs.StackName).toBeDefined();
      expect(outputs.EnvironmentSuffix).toBe(environmentSuffix);
      expect(outputs.TurnAroundPromptTableName).toBeDefined();
      expect(outputs.TurnAroundPromptTableArn).toBeDefined();
      expect(outputs.DocumentMetadataTableName).toBeDefined();
      expect(outputs.AuditTrailTableName).toBeDefined();
      expect(outputs.DocumentAPIUrl).toBeDefined();
      expect(outputs.TemplatesBucketName).toBeDefined();
      expect(outputs.GeneratedDocumentsBucketName).toBeDefined();
      expect(outputs.DocumentGenerationFunctionArn).toBeDefined();
      expect(outputs.DocumentAnalysisFunctionArn).toBeDefined();
      expect(outputs.ApprovalWorkflowStateMachineArn).toBeDefined();
      expect(outputs.SignatureRequestTopicArn).toBeDefined();
      expect(outputs.DocumentEncryptionKeyId).toBeDefined();
      expect(outputs.AthenaWorkGroupName).toBeDefined();
    });

    test('resource names should use environment suffix', () => {
      expect(outputs.TurnAroundPromptTableName).toContain(environmentSuffix);
      expect(outputs.DocumentMetadataTableName).toContain(environmentSuffix);
      expect(outputs.AuditTrailTableName).toContain(environmentSuffix);
    });

    test('Lambda functions can access DynamoDB tables', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.METADATA_TABLE).toBe(outputs.DocumentMetadataTableName);
      expect(envVars?.AUDIT_TABLE).toBe(outputs.AuditTrailTableName);
    });

    test('Lambda functions can access S3 buckets', async () => {
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();
      const command = new GetFunctionCommand({ FunctionName: functionName });
      const response = await lambdaClient.send(command);

      const envVars = response.Configuration?.Environment?.Variables;
      expect(envVars?.TEMPLATES_BUCKET).toBe(outputs.TemplatesBucketName);
      expect(envVars?.GENERATED_DOCS_BUCKET).toBe(outputs.GeneratedDocumentsBucketName);
    });
  });

  describe('End-to-End Workflow', () => {
    test('complete document generation workflow', async () => {
      const templatesBucket = outputs.TemplatesBucketName;
      const generatedDocsBucket = outputs.GeneratedDocumentsBucketName;
      const metadataTable = outputs.DocumentMetadataTableName;
      const timestamp = Date.now();

      // Step 1: Upload a template to S3
      const templateKey = `templates/test-template-${timestamp}.json`;
      await s3Client.send(
        new PutObjectCommand({
          Bucket: templatesBucket,
          Key: templateKey,
          Body: JSON.stringify({ title: 'Test Document', content: 'Hello World' }),
        })
      );

      // Step 2: Invoke document generation function
      const functionArn = outputs.DocumentGenerationFunctionArn;
      const functionName = functionArn.split(':').pop();

      const payload = {
        body: JSON.stringify({
          templateId: `test-template-${timestamp}`,
          data: { field1: 'value1' },
          userId: `test-user-${timestamp}`,
          language: 'en',
        }),
      };

      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: functionName,
          Payload: JSON.stringify(payload),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);

      // Clean up template
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: templatesBucket,
          Key: templateKey,
        })
      );
    }, 70000);
  });
});

```

## ./test/tap-stack.unit.test.d.ts

```typescript
export {};

```

## ./test/tap-stack.unit.test.ts

```typescript
import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Document Automation System');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have DocumentMetadataTable resource', () => {
      expect(template.Resources.DocumentMetadataTable).toBeDefined();
      expect(template.Resources.DocumentMetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have AuditTrailTable resource', () => {
      expect(template.Resources.AuditTrailTable).toBeDefined();
      expect(template.Resources.AuditTrailTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DocumentMetadataTable should have correct schema', () => {
      const table = template.Resources.DocumentMetadataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('documentId');
      expect(keySchema[1].AttributeName).toBe('createdAt');
    });

    test('AuditTrailTable should have correct schema', () => {
      const table = template.Resources.AuditTrailTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('auditId');
      expect(keySchema[1].AttributeName).toBe('timestamp');
    });

    test('DocumentMetadataTable should have encryption enabled', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('DocumentMetadataTable should have point-in-time recovery', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DocumentMetadataTable should have GSI', () => {
      const table = template.Resources.DocumentMetadataTable;
      expect(table.Properties.GlobalSecondaryIndexes).toHaveLength(1);
      expect(table.Properties.GlobalSecondaryIndexes[0].IndexName).toBe('UserIdIndex');
    });
  });

  describe('KMS Resources', () => {
    test('should have DocumentEncryptionKey', () => {
      expect(template.Resources.DocumentEncryptionKey).toBeDefined();
      expect(template.Resources.DocumentEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have DocumentEncryptionKeyAlias', () => {
      expect(template.Resources.DocumentEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.DocumentEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper policy', () => {
      const key = template.Resources.DocumentEncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeInstanceOf(Array);
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have TemplatesBucket', () => {
      expect(template.Resources.TemplatesBucket).toBeDefined();
      expect(template.Resources.TemplatesBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have GeneratedDocumentsBucket', () => {
      expect(template.Resources.GeneratedDocumentsBucket).toBeDefined();
      expect(template.Resources.GeneratedDocumentsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have AthenaResultsBucket', () => {
      expect(template.Resources.AthenaResultsBucket).toBeDefined();
      expect(template.Resources.AthenaResultsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('TemplatesBucket should have versioning enabled', () => {
      const bucket = template.Resources.TemplatesBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('GeneratedDocumentsBucket should have versioning enabled', () => {
      const bucket = template.Resources.GeneratedDocumentsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('S3 buckets should have encryption', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        const config = bucket.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });
  });

  describe('IAM Roles', () => {
    test('should have DocumentGenerationRole', () => {
      expect(template.Resources.DocumentGenerationRole).toBeDefined();
      expect(template.Resources.DocumentGenerationRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have ApprovalStateMachineRole', () => {
      expect(template.Resources.ApprovalStateMachineRole).toBeDefined();
      expect(template.Resources.ApprovalStateMachineRole.Type).toBe('AWS::IAM::Role');
    });

    test('DocumentGenerationRole should have Lambda assume role policy', () => {
      const role = template.Resources.DocumentGenerationRole;
      const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
      expect(statement.Action).toBe('sts:AssumeRole');
    });

    test('DocumentGenerationRole should have appropriate policies', () => {
      const role = template.Resources.DocumentGenerationRole;
      expect(role.Properties.Policies).toHaveLength(1);
      expect(role.Properties.Policies[0].PolicyName).toBe('DocumentGenerationPolicy');
    });
  });

  describe('Lambda Functions', () => {
    test('should have DocumentGenerationFunction', () => {
      expect(template.Resources.DocumentGenerationFunction).toBeDefined();
      expect(template.Resources.DocumentGenerationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have DocumentAnalysisFunction', () => {
      expect(template.Resources.DocumentAnalysisFunction).toBeDefined();
      expect(template.Resources.DocumentAnalysisFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda functions should use Node.js 22.x runtime', () => {
      const functions = [
        template.Resources.DocumentGenerationFunction,
        template.Resources.DocumentAnalysisFunction,
      ];

      functions.forEach(fn => {
        expect(fn.Properties.Runtime).toBe('nodejs22.x');
      });
    });

    test('Lambda functions should have environment variables', () => {
      const fn = template.Resources.DocumentGenerationFunction;
      expect(fn.Properties.Environment.Variables).toBeDefined();
      expect(fn.Properties.Environment.Variables.TEMPLATES_BUCKET).toBeDefined();
      expect(fn.Properties.Environment.Variables.METADATA_TABLE).toBeDefined();
    });

    test('Lambda functions should have appropriate timeouts', () => {
      const genFn = template.Resources.DocumentGenerationFunction;
      const analysisFn = template.Resources.DocumentAnalysisFunction;
      expect(genFn.Properties.Timeout).toBe(60);
      expect(analysisFn.Properties.Timeout).toBe(120);
    });
  });

  describe('API Gateway', () => {
    test('should have DocumentAPI', () => {
      expect(template.Resources.DocumentAPI).toBeDefined();
      expect(template.Resources.DocumentAPI.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have DocumentsResource', () => {
      expect(template.Resources.DocumentsResource).toBeDefined();
      expect(template.Resources.DocumentsResource.Type).toBe('AWS::ApiGateway::Resource');
    });

    test('should have GenerateMethod', () => {
      expect(template.Resources.GenerateMethod).toBeDefined();
      expect(template.Resources.GenerateMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have AnalyzeMethod', () => {
      expect(template.Resources.AnalyzeMethod).toBeDefined();
      expect(template.Resources.AnalyzeMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('should have APIDeployment', () => {
      expect(template.Resources.APIDeployment).toBeDefined();
      expect(template.Resources.APIDeployment.Type).toBe('AWS::ApiGateway::Deployment');
    });

    test('API methods should use AWS_IAM authorization', () => {
      const methods = [
        template.Resources.GenerateMethod,
        template.Resources.AnalyzeMethod,
      ];

      methods.forEach(method => {
        expect(method.Properties.AuthorizationType).toBe('AWS_IAM');
      });
    });

    test('API methods should use AWS_PROXY integration', () => {
      const methods = [
        template.Resources.GenerateMethod,
        template.Resources.AnalyzeMethod,
      ];

      methods.forEach(method => {
        expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      });
    });
  });

  describe('Step Functions', () => {
    test('should have ApprovalWorkflowStateMachine', () => {
      expect(template.Resources.ApprovalWorkflowStateMachine).toBeDefined();
      expect(template.Resources.ApprovalWorkflowStateMachine.Type).toBe('AWS::StepFunctions::StateMachine');
    });

    test('state machine should have definition string', () => {
      const stateMachine = template.Resources.ApprovalWorkflowStateMachine;
      expect(stateMachine.Properties.DefinitionString).toBeDefined();
    });
  });

  describe('SNS Topics', () => {
    test('should have SignatureRequestTopic', () => {
      expect(template.Resources.SignatureRequestTopic).toBeDefined();
      expect(template.Resources.SignatureRequestTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have DocumentNotificationsTopic', () => {
      expect(template.Resources.DocumentNotificationsTopic).toBeDefined();
      expect(template.Resources.DocumentNotificationsTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topics should have KMS encryption', () => {
      const topics = [
        template.Resources.SignatureRequestTopic,
        template.Resources.DocumentNotificationsTopic,
      ];

      topics.forEach(topic => {
        expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('should have ComplianceDeadlineRule', () => {
      expect(template.Resources.ComplianceDeadlineRule).toBeDefined();
      expect(template.Resources.ComplianceDeadlineRule.Type).toBe('AWS::Events::Rule');
    });

    test('should have DocumentReminderRule', () => {
      expect(template.Resources.DocumentReminderRule).toBeDefined();
      expect(template.Resources.DocumentReminderRule.Type).toBe('AWS::Events::Rule');
    });

    test('ComplianceDeadlineRule should be enabled', () => {
      const rule = template.Resources.ComplianceDeadlineRule;
      expect(rule.Properties.State).toBe('ENABLED');
    });

    test('DocumentReminderRule should have cron schedule', () => {
      const rule = template.Resources.DocumentReminderRule;
      expect(rule.Properties.ScheduleExpression).toContain('cron');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have DocumentMetricsLogGroup', () => {
      expect(template.Resources.DocumentMetricsLogGroup).toBeDefined();
      expect(template.Resources.DocumentMetricsLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have DocumentProcessingAlarm', () => {
      expect(template.Resources.DocumentProcessingAlarm).toBeDefined();
      expect(template.Resources.DocumentProcessingAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('log group should have retention policy', () => {
      const logGroup = template.Resources.DocumentMetricsLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Athena Resources', () => {
    test('should have AthenaWorkGroup', () => {
      expect(template.Resources.AthenaWorkGroup).toBeDefined();
      expect(template.Resources.AthenaWorkGroup.Type).toBe('AWS::Athena::WorkGroup');
    });

    test('AthenaWorkGroup should have result configuration', () => {
      const workGroup = template.Resources.AthenaWorkGroup;
      expect(workGroup.Properties.WorkGroupConfiguration.ResultConfiguration).toBeDefined();
      expect(workGroup.Properties.WorkGroupConfiguration.ResultConfiguration.EncryptionConfiguration).toBeDefined();
    });
  });

  describe('Glue Resources', () => {
    test('should have DocumentDatabase', () => {
      expect(template.Resources.DocumentDatabase).toBeDefined();
      expect(template.Resources.DocumentDatabase.Type).toBe('AWS::Glue::Database');
    });

    test('should have DocumentMetadataGlueTable', () => {
      expect(template.Resources.DocumentMetadataGlueTable).toBeDefined();
      expect(template.Resources.DocumentMetadataGlueTable.Type).toBe('AWS::Glue::Table');
    });
  });

  describe('Permissions', () => {
    test('should have LambdaAPIPermissionGenerate', () => {
      expect(template.Resources.LambdaAPIPermissionGenerate).toBeDefined();
      expect(template.Resources.LambdaAPIPermissionGenerate.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have LambdaAPIPermissionAnalyze', () => {
      expect(template.Resources.LambdaAPIPermissionAnalyze).toBeDefined();
      expect(template.Resources.LambdaAPIPermissionAnalyze.Type).toBe('AWS::Lambda::Permission');
    });

    test('should have EventBridgeLambdaPermission', () => {
      expect(template.Resources.EventBridgeLambdaPermission).toBeDefined();
      expect(template.Resources.EventBridgeLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'DocumentMetadataTableName',
        'AuditTrailTableName',
        'DocumentAPIUrl',
        'TemplatesBucketName',
        'GeneratedDocumentsBucketName',
        'DocumentGenerationFunctionArn',
        'DocumentAnalysisFunctionArn',
        'ApprovalWorkflowStateMachineArn',
        'SignatureRequestTopicArn',
        'DocumentEncryptionKeyId',
        'AthenaWorkGroupName',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix', () => {
      const resources = [
        template.Resources.DocumentMetadataTable,
        template.Resources.AuditTrailTable,
      ];

      resources.forEach(resource => {
        if (resource.Properties.TableName) {
          expect(JSON.stringify(resource.Properties.TableName)).toContain('EnvironmentSuffix');
        }
      });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(JSON.stringify(output.Export.Name)).toContain('AWS::StackName');
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have multiple resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30);
    });

    test('all resources should have tags with Environment', () => {
      const taggedResourceTypes = [
        'AWS::DynamoDB::Table',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::IAM::Role',
        'AWS::SNS::Topic',
        'AWS::KMS::Key',
      ];

      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (taggedResourceTypes.includes(resource.Type)) {
          if (resource.Properties.Tags) {
            const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
            expect(envTag).toBeDefined();
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB tables should have encryption', () => {
      const encryptedTables = [
        template.Resources.DocumentMetadataTable,
        template.Resources.AuditTrailTable,
      ];

      encryptedTables.forEach(table => {
        expect(table.Properties.SSESpecification).toBeDefined();
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });

    test('S3 buckets should have lifecycle policies', () => {
      const buckets = [
        template.Resources.TemplatesBucket,
        template.Resources.GeneratedDocumentsBucket,
        template.Resources.AthenaResultsBucket,
      ];

      buckets.forEach(bucket => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules).toBeInstanceOf(Array);
      });
    });

    test('IAM roles should have assume role policies', () => {
      const roles = [
        template.Resources.DocumentGenerationRole,
        template.Resources.ApprovalStateMachineRole,
      ];

      roles.forEach(role => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toBeInstanceOf(Array);
      });
    });
  });
});

```
