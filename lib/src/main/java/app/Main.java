package app;

import app.InfrastructureConfig;
import app.VpcStack;
import app.KmsStack;
import app.IamStack;
import app.SecurityStack;
import com.pulumi.Pulumi;
import com.pulumi.Context;

public final class Main {
    
    // Private constructor to prevent instantiation
    private Main() {
        throw new UnsupportedOperationException("Utility class");
    }
    
    public static void main(String[] args) {
        Pulumi.run(ctx -> {
            defineInfrastructure(ctx);
        });
    }
    
    /**
     * Defines the infrastructure components for the financial services environment.
     * This method contains the actual infrastructure definition logic.
     * 
     * @param ctx The Pulumi context
     */
    public static void defineInfrastructure(Context ctx) {
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
    }
}
