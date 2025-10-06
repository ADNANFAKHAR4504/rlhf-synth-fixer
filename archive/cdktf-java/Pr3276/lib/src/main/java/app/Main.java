package app;

import app.stacks.MainStack;
import com.hashicorp.cdktf.App;
import com.hashicorp.cdktf.S3Backend;
import com.hashicorp.cdktf.S3BackendConfig;


public final class Main {

    /**
     * Private constructor to prevent instantiation of utility class.
     */
    private Main() {
        // Utility class should not be instantiated
    }

    public static void main(final String[] args) {

        final App app = new App();

        MainStack stack = new MainStack(app, "code-build-pipeline");

        /*
         * Configures S3 backend for remote Terraform state storage.
         */
        new S3Backend(stack, S3BackendConfig.builder()
                .bucket(System.getenv("TERRAFORM_STATE_BUCKET"))
                .key("pr/" + System.getenv("ENVIRONMENT_SUFFIX") + "/" + stack.getStackId() + ".tfstate")
                .region(System.getenv("TERRAFORM_STATE_BUCKET_REGION"))
                .encrypt(true)
                .build());

        app.synth();
    }
}