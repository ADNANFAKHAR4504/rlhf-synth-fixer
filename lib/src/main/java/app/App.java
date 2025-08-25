// src/main/java/com/company/infrastructure/App.java
package com.company.infrastructure;

import com.company.infrastructure.config.InfrastructureConfig;
import com.company.infrastructure.networking.VpcStack;
import com.company.infrastructure.security.KmsStack;
import com.company.infrastructure.security.IamStack;
import com.company.infrastructure.security.SecurityStack;
import com.company.infrastructure.compliance.ConfigStack;
import com.company.infrastructure.compliance.CloudTrailStack;
import com.company.infrastructure.storage.S3Stack;
import com.company.infrastructure.storage.RdsStack;
import com.company.infrastructure.compute.LambdaStack;
import com.pulumi.Pulumi;

public class App {
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            var config = new InfrastructureConfig(ctx);
            
            // 1. KMS Keys (must be created first for encryption)
            var kmsStack = new KmsStack("kms", config);
            
            // 2. IAM Roles and Policies
            var iamStack = new IamStack("iam", config);
            
            // 3. VPC and Networking
            var vpcStack = new VpcStack("vpc", config);
            
            // 4. Security Groups
            var securityStack = new SecurityStack("security", config, vpcStack);
            
            // 5. S3 Buckets
            var s3Stack = new S3Stack("s3", config, kmsStack);
            
            // 6. CloudTrail (depends on S3)
            var cloudTrailStack = new CloudTrailStack("cloudtrail", config, s3Stack, kmsStack);
            
            // 7. AWS Config (depends on S3 and IAM)
            var configStack = new ConfigStack("config", config, s3Stack, iamStack);
            
            // 8. RDS Database
            var rdsStack = new RdsStack("rds", config, vpcStack, securityStack, kmsStack);
            
            // 9. Lambda Functions
            var lambdaStack = new LambdaStack("lambda", config, vpcStack, securityStack, iamStack, kmsStack);
            
            return null;
        });
    }
}