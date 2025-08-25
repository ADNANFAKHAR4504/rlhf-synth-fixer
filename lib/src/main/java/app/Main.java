package app;

import app.InfrastructureConfig;
import app.VpcStack;
import app.KmsStack;
import app.IamStack;
import app.SecurityStack;
import com.pulumi.Pulumi;

public class Main {
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
            
            // Note: Additional stacks (S3, CloudTrail, Config, RDS, Lambda) 
            // would be implemented here when needed
        });
    }
}
