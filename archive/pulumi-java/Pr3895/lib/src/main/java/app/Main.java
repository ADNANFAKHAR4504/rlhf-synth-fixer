package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;

public final class Main {

    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(final Context ctx) {
        MultiTenantStack stack = new MultiTenantStack(ctx);

        // Export outputs
        ctx.export("tenantBuckets", stack.getTenantBuckets());
        ctx.export("tenantKmsKeys", stack.getTenantKmsKeys());
        ctx.export("tenantAccessPoints", stack.getTenantAccessPoints());
        ctx.export("configTableName", stack.getConfigTableName());
        ctx.export("validationLambdaArn", stack.getValidationLambdaArn());
        ctx.export("cloudTrailName", stack.getCloudTrailName());
    }
}