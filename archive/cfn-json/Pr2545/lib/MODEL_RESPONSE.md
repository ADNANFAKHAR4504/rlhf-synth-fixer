# Complete CloudFormation Template for Secure Static Website Hosting

Here's a production-ready CloudFormation template that meets all your requirements:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Secure static website hosting solution with S3, CloudFront, Route 53, ACM, and KMS encryption",
  
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": { "default": "Domain Configuration" },
          "Parameters": ["DomainName", "SubdomainPrefix"]
        },
        {
          "Label": { "default": "Organization Settings" },
          "Parameters": ["EnvironmentName", "OrganizationPrefix", "Department", "Purpose", "Year"]
        },
        {
          "Label": { "default": "Security Configuration" },
          "Parameters": ["EnableAccessLogging", "KMSKeyDeletionPolicy"]
        }
      ],
      "ParameterLabels": {
        "DomainName": { "default": "Primary Domain Name" },
        "SubdomainPrefix": { "default": "Subdomain Prefix (optional)" },
        "EnvironmentName": { "default": "Environment Name" },
        "OrganizationPrefix": { "default": "Organization Prefix" },
        "Department": { "default": "Department" },
        "Purpose": { "default": "Purpose" },
        "Year": { "default": "Year" },
        "EnableAccessLogging": { "default": "Enable S3 Access Logging" },
        "KMSKeyDeletionPolicy": { "default": "KMS Key Deletion Policy" }
      }
    }
  },

  "Parameters": {
    "DomainName": {
      "Type": "String",
      "Description": "The domain name for the static website (e.g., example.com)",
      "Default": "example.com",
      "AllowedPattern": "^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid domain name"
    },
    "SubdomainPrefix": {
      "Type": "String",
      "Description": "Optional subdomain prefix (e.g., www). Leave empty for apex domain",
      "Default": "www",
      "AllowedPattern": "^$|^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$",
      "ConstraintDescription": "Must be a valid subdomain or empty"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name (e.g., production, staging, development)",
      "Default": "production",
      "AllowedValues": ["production", "staging", "development", "test"]
    },
    "OrganizationPrefix": {
      "Type": "String",
      "Description": "Organization prefix for resource naming",
      "Default": "myorg",
      "MinLength": 2,
      "MaxLength": 10,
      "AllowedPattern": "^[a-z][a-z0-9]*$",
      "ConstraintDescription": "Must start with lowercase letter, contain only lowercase letters and numbers"
    },
    "Department": {
      "Type": "String",
      "Description": "Department name for resource naming",
      "Default": "web",
      "MinLength": 2,
      "MaxLength": 10,
      "AllowedPattern": "^[a-z][a-z0-9]*$",
      "ConstraintDescription": "Must start with lowercase letter, contain only lowercase letters and numbers"
    },
    "Purpose": {
      "Type": "String",
      "Description": "Purpose for resource naming",
      "Default": "staticsite",
      "MinLength": 2,
      "MaxLength": 15,
      "AllowedPattern": "^[a-z][a-z0-9]*$",
      "ConstraintDescription": "Must start with lowercase letter, contain only lowercase letters and numbers"
    },
    "Year": {
      "Type": "String",
      "Description": "Year for resource naming",
      "Default": "2024",
      "AllowedPattern": "^20[0-9]{2}$",
      "ConstraintDescription": "Must be a valid year (20XX format)"
    },
    "EnableAccessLogging": {
      "Type": "String",
      "Description": "Enable S3 access logging",
      "Default": "true",
      "AllowedValues": ["true", "false"]
    },
    "KMSKeyDeletionPolicy": {
      "Type": "String",
      "Description": "KMS Key deletion policy",
      "Default": "Retain",
      "AllowedValues": ["Delete", "Retain"]
    }
  },

  "Conditions": {
    "HasSubdomain": { "Fn::Not": [{ "Fn::Equals": [{ "Ref": "SubdomainPrefix" }, ""] }] },
    "EnableLogging": { "Fn::Equals": [{ "Ref": "EnableAccessLogging" }, "true"] },
    "RetainKMSKey": { "Fn::Equals": [{ "Ref": "KMSKeyDeletionPolicy" }, "Retain"] }
  },

  "Resources": {
    
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for ${OrganizationPrefix}-${Department}-${Purpose}-${Year} static website encryption"
        },
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow S3 Service",
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
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-kms-key" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website Encryption"
          }
        ]
      },
      "DeletionPolicy": {
        "Fn::If": ["RetainKMSKey", "Retain", "Delete"]
      }
    },

    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${OrganizationPrefix}-${Department}-${Purpose}-${Year}"
        },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },

    "AccessLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Condition": "EnableLogging",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-access-logs"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
              },
              "BucketKeyEnabled": true
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
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-access-logs" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Access Logs Storage"
          }
        ]
      },
      "DeletionPolicy": "Retain"
    },

    "WebsiteBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-website"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": { "Ref": "KMSKey" }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LoggingConfiguration": {
          "Fn::If": [
            "EnableLogging",
            {
              "DestinationBucketName": { "Ref": "AccessLogsBucket" },
              "LogFilePrefix": "s3-access-logs/"
            },
            { "Ref": "AWS::NoValue" }
          ]
        },
        "NotificationConfiguration": {
          "CloudWatchConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "CloudWatchConfiguration": {
                "LogGroupName": { "Ref": "S3LogGroup" }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-website" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website Hosting"
          }
        ]
      },
      "DeletionPolicy": "Retain"
    },

    "S3LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/s3/${OrganizationPrefix}-${Department}-${Purpose}-${Year}"
        },
        "RetentionInDays": 30
      }
    },

    "CloudFrontOriginAccessControl": {
      "Type": "AWS::CloudFront::OriginAccessControl",
      "Properties": {
        "OriginAccessControlConfig": {
          "Name": {
            "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-oac"
          },
          "Description": "Origin Access Control for static website S3 bucket",
          "OriginAccessControlOriginType": "s3",
          "SigningBehavior": "always",
          "SigningProtocol": "sigv4"
        }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Aliases": [
            {
              "Fn::If": [
                "HasSubdomain",
                { "Fn::Sub": "${SubdomainPrefix}.${DomainName}" },
                { "Ref": "DomainName" }
              ]
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
            "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
            "ResponseHeadersPolicyId": "67f7725c-6f97-4210-82d7-5512b31e9d03",
            "Compress": true,
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD"]
          },
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": { "Fn::GetAtt": ["WebsiteBucket", "RegionalDomainName"] },
              "S3OriginConfig": {
                "OriginAccessIdentity": ""
              },
              "OriginAccessControlId": { "Ref": "CloudFrontOriginAccessControl" }
            }
          ],
          "Enabled": true,
          "DefaultRootObject": "index.html",
          "CustomErrorResponses": [
            {
              "ErrorCode": 403,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html",
              "ErrorCachingMinTTL": 300
            },
            {
              "ErrorCode": 404,
              "ResponseCode": 200,
              "ResponsePagePath": "/index.html",
              "ErrorCachingMinTTL": 300
            }
          ],
          "HttpVersion": "http2and3",
          "IPV6Enabled": true,
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "AcmCertificateArn": { "Ref": "SSLCertificate" },
            "SslSupportMethod": "sni-only",
            "MinimumProtocolVersion": "TLSv1.2_2021"
          },
          "Logging": {
            "Fn::If": [
              "EnableLogging",
              {
                "Bucket": { "Fn::GetAtt": ["AccessLogsBucket", "DomainName"] },
                "Prefix": "cloudfront-logs/",
                "IncludeCookies": false
              },
              { "Ref": "AWS::NoValue" }
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-distribution" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website CDN"
          }
        ]
      }
    },

    "BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "WebsiteBucket" },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCloudFrontServicePrincipal",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudfront.amazonaws.com"
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${WebsiteBucket}/*"
              },
              "Condition": {
                "StringEquals": {
                  "AWS:SourceArn": {
                    "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"
                  }
                }
              }
            }
          ]
        }
      }
    },

    "SSLCertificate": {
      "Type": "AWS::CertificateManager::Certificate",
      "Properties": {
        "DomainName": {
          "Fn::If": [
            "HasSubdomain",
            { "Fn::Sub": "${SubdomainPrefix}.${DomainName}" },
            { "Ref": "DomainName" }
          ]
        },
        "SubjectAlternativeNames": [
          { "Ref": "DomainName" },
          { "Fn::Sub": "*.${DomainName}" }
        ],
        "ValidationMethod": "DNS",
        "DomainValidationOptions": [
          {
            "DomainName": { "Ref": "DomainName" },
            "HostedZoneId": { "Ref": "HostedZone" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-certificate" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website SSL Certificate"
          }
        ]
      }
    },

    "HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name": { "Ref": "DomainName" },
        "HostedZoneConfig": {
          "Comment": {
            "Fn::Sub": "Hosted zone for ${DomainName} static website"
          }
        },
        "HostedZoneTags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-hostedzone" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website DNS"
          }
        ]
      }
    },

    "DNSRecord": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": { "Ref": "HostedZone" },
        "Name": {
          "Fn::If": [
            "HasSubdomain",
            { "Fn::Sub": "${SubdomainPrefix}.${DomainName}" },
            { "Ref": "DomainName" }
          ]
        },
        "Type": "A",
        "AliasTarget": {
          "DNSName": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] },
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },

    "DNSRecordIPv6": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": { "Ref": "HostedZone" },
        "Name": {
          "Fn::If": [
            "HasSubdomain",
            { "Fn::Sub": "${SubdomainPrefix}.${DomainName}" },
            { "Ref": "DomainName" }
          ]
        },
        "Type": "AAAA",
        "AliasTarget": {
          "DNSName": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] },
          "HostedZoneId": "Z2FDTNDATAQYW2"
        }
      }
    },

    "DeploymentRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-deployment-role"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "StringEquals": {
                  "sts:ExternalId": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}" }
                }
              }
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3DeploymentPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    { "Fn::GetAtt": ["WebsiteBucket", "Arn"] },
                    { "Fn::Sub": "${WebsiteBucket}/*" }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudfront:CreateInvalidation"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:cloudfront::${AWS::AccountId}:distribution/${CloudFrontDistribution}"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "${OrganizationPrefix}-${Department}-${Purpose}-${Year}-deployment-role" }
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Purpose",
            "Value": "Static Website Deployment"
          }
        ]
      }
    }
  },

  "Outputs": {
    "WebsiteBucketName": {
      "Description": "Name of the S3 bucket for website content",
      "Value": { "Ref": "WebsiteBucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WebsiteBucketName" }
      }
    },
    "WebsiteBucketArn": {
      "Description": "ARN of the S3 bucket for website content",
      "Value": { "Fn::GetAtt": ["WebsiteBucket", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WebsiteBucketArn" }
      }
    },
    "CloudFrontDistributionId": {
      "Description": "CloudFront distribution ID",
      "Value": { "Ref": "CloudFrontDistribution" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-CloudFrontDistributionId" }
      }
    },
    "CloudFrontDomainName": {
      "Description": "CloudFront distribution domain name",
      "Value": { "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-CloudFrontDomainName" }
      }
    },
    "WebsiteURL": {
      "Description": "Website URL",
      "Value": {
        "Fn::Sub": [
          "https://${Domain}",
          {
            "Domain": {
              "Fn::If": [
                "HasSubdomain",
                { "Fn::Sub": "${SubdomainPrefix}.${DomainName}" },
                { "Ref": "DomainName" }
              ]
            }
          }
        ]
      },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-WebsiteURL" }
      }
    },
    "HostedZoneId": {
      "Description": "Route 53 hosted zone ID",
      "Value": { "Ref": "HostedZone" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-HostedZoneId" }
      }
    },
    "SSLCertificateArn": {
      "Description": "ACM SSL certificate ARN",
      "Value": { "Ref": "SSLCertificate" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-SSLCertificateArn" }
      }
    },
    "KMSKeyId": {
      "Description": "KMS key ID for encryption",
      "Value": { "Ref": "KMSKey" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyId" }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS key ARN for encryption",
      "Value": { "Fn::GetAtt": ["KMSKey", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyArn" }
      }
    },
    "DeploymentRoleArn": {
      "Description": "IAM role ARN for deployment",
      "Value": { "Fn::GetAtt": ["DeploymentRole", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-DeploymentRoleArn" }
      }
    },
    "AccessLogsBucketName": {
      "Condition": "EnableLogging",
      "Description": "Name of the S3 bucket for access logs",
      "Value": { "Ref": "AccessLogsBucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-AccessLogsBucketName" }
      }
    }
  }
}
```

## Key Features and Security Implementations

### 🔒 Security Features
1. **S3 Security**:
   - All public access blocked by default
   - Server-side encryption with customer-managed KMS key
   - Versioning enabled for data protection
   - Access logging to separate bucket
   - Origin Access Control (OAC) for CloudFront access only

2. **IAM Security**:
   - Least privilege principle applied
   - Separate deployment role with minimal permissions
   - External ID condition for role assumption
   - No hardcoded credentials

3. **CloudFront Security**:
   - HTTPS redirect enforced
   - Security headers policy applied
   - Modern TLS versions only (TLSv1.2+)
   - Origin Access Control instead of legacy OAI

### 🏗️ Architecture Benefits
- **Scalable**: CloudFront global edge locations
- **Secure**: End-to-end encryption and access controls
- **Cost-effective**: S3 static hosting with CloudFront caching
- **Reliable**: Multi-AZ redundancy and versioning
- **Compliant**: Follows AWS Well-Architected principles

### 📋 Deployment Instructions

1. **Validate the template**:
   ```bash
   aws cloudformation validate-template --template-body file://template.json
   ```

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name myorg-web-staticsite-2024 \
     --template-body file://template.json \
     --parameters ParameterKey=DomainName,ParameterValue=yourdomain.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. **Upload website content**:
   ```bash
   aws s3 sync ./website-files s3://myorg-web-staticsite-2024-website/
   ```

4. **Invalidate CloudFront cache**:
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id YOUR_DISTRIBUTION_ID \
     --paths "/*"
   ```

### 🔧 Post-Deployment Configuration

1. **DNS Setup**: Update your domain registrar's nameservers to point to the Route 53 hosted zone
2. **Certificate Validation**: Complete DNS validation for the ACM certificate
3. **Content Upload**: Upload your static website files to the S3 bucket
4. **Testing**: Verify HTTPS access and security headers

This template creates a production-ready, secure static website hosting solution that meets all your specified requirements and follows AWS best practices.