// src/main/java/com/company/infrastructure/security/KmsStack.java
package app;

import app.InfrastructureConfig;
import app.TagUtils;
import com.pulumi.aws.kms.Key;
import com.pulumi.aws.kms.KeyArgs;
import com.pulumi.aws.kms.Alias;
import com.pulumi.aws.kms.AliasArgs;
import com.pulumi.resources.ComponentResource;
import com.pulumi.resources.ComponentResourceOptions;
import com.pulumi.resources.CustomResourceOptions;

public class KmsStack extends ComponentResource {
    private final Key s3Key;
    private final Key rdsKey;
    private final Key lambdaKey;
    private final Key cloudTrailKey;
    private final Key configKey;
    
    public KmsStack(String name, InfrastructureConfig config) {
        super("custom:security:KmsStack", name, ComponentResourceOptions.builder().build());
        
        var tags = TagUtils.getStandardTags(config, "security", "kms");
        
        // S3 KMS Key
        this.s3Key = new Key(config.getResourceName("kms", "s3"), KeyArgs.builder()
            .description("KMS key for S3 bucket encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .enableKeyRotation(true)
            .tags(tags)
            .policy("""
                {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Sid": "Enable IAM User Permissions",
                            "Effect": "Allow",
                            "Principal": {
                                "AWS": "arn:aws:iam::%s:root"
                            },
                            "Action": "kms:*",
                            "Resource": "*"
                        },
                        {
                            "Sid": "Allow CloudTrail to encrypt logs",
                            "Effect": "Allow",
                            "Principal": {
                                "Service": "cloudtrail.amazonaws.com"
                            },
                            "Action": [
                                "kms:GenerateDataKey*",
                                "kms:DescribeKey"
                            ],
                            "Resource": "*"
                        }
                    ]
                }
                """.replace("%s", config.getContext().config().require("aws:accountId")))
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "s3"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("s3", "encryption"))
            .targetKeyId(s3Key.keyId())
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // RDS KMS Key
        this.rdsKey = new Key(config.getResourceName("kms", "rds"), KeyArgs.builder()
            .description("KMS key for RDS encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .enableKeyRotation(true)
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "rds"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("rds", "encryption"))
            .targetKeyId(rdsKey.keyId())
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Lambda KMS Key
        this.lambdaKey = new Key(config.getResourceName("kms", "lambda"), KeyArgs.builder()
            .description("KMS key for Lambda environment variable encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .enableKeyRotation(true)
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "lambda"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("lambda", "encryption"))
            .targetKeyId(lambdaKey.keyId())
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // CloudTrail KMS Key
        this.cloudTrailKey = new Key(config.getResourceName("kms", "cloudtrail"), KeyArgs.builder()
            .description("KMS key for CloudTrail log encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .enableKeyRotation(true)
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "cloudtrail"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("cloudtrail", "encryption"))
            .targetKeyId(cloudTrailKey.keyId())
            .build(), CustomResourceOptions.builder().parent(this).build());
        
        // Config KMS Key
        this.configKey = new Key(config.getResourceName("kms", "config"), KeyArgs.builder()
            .description("KMS key for AWS Config encryption")
            .keyUsage("ENCRYPT_DECRYPT")
            .customerMasterKeySpec("SYMMETRIC_DEFAULT")
            .enableKeyRotation(true)
            .tags(tags)
            .build(), CustomResourceOptions.builder().parent(this).build());
            
        new Alias(config.getResourceName("kms-alias", "config"), AliasArgs.builder()
            .name("alias/" + config.getResourceName("config", "encryption"))
            .targetKeyId(configKey.keyId())
            .build(), CustomResourceOptions.builder().parent(this).build());
    }
    
    public Key getS3Key() { return s3Key; }
    public Key getRdsKey() { return rdsKey; }
    public Key getLambdaKey() { return lambdaKey; }
    public Key getCloudTrailKey() { return cloudTrailKey; }
    public Key getConfigKey() { return configKey; }
}