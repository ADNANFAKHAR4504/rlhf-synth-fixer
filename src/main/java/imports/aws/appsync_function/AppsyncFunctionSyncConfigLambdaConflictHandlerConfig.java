package imports.aws.appsync_function;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.071Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncFunction.AppsyncFunctionSyncConfigLambdaConflictHandlerConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncFunctionSyncConfigLambdaConflictHandlerConfig.Jsii$Proxy.class)
public interface AppsyncFunctionSyncConfigLambdaConflictHandlerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#lambda_conflict_handler_arn AppsyncFunction#lambda_conflict_handler_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLambdaConflictHandlerArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncFunctionSyncConfigLambdaConflictHandlerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncFunctionSyncConfigLambdaConflictHandlerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncFunctionSyncConfigLambdaConflictHandlerConfig> {
        java.lang.String lambdaConflictHandlerArn;

        /**
         * Sets the value of {@link AppsyncFunctionSyncConfigLambdaConflictHandlerConfig#getLambdaConflictHandlerArn}
         * @param lambdaConflictHandlerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_function#lambda_conflict_handler_arn AppsyncFunction#lambda_conflict_handler_arn}.
         * @return {@code this}
         */
        public Builder lambdaConflictHandlerArn(java.lang.String lambdaConflictHandlerArn) {
            this.lambdaConflictHandlerArn = lambdaConflictHandlerArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncFunctionSyncConfigLambdaConflictHandlerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncFunctionSyncConfigLambdaConflictHandlerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncFunctionSyncConfigLambdaConflictHandlerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncFunctionSyncConfigLambdaConflictHandlerConfig {
        private final java.lang.String lambdaConflictHandlerArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.lambdaConflictHandlerArn = software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.lambdaConflictHandlerArn = builder.lambdaConflictHandlerArn;
        }

        @Override
        public final java.lang.String getLambdaConflictHandlerArn() {
            return this.lambdaConflictHandlerArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLambdaConflictHandlerArn() != null) {
                data.set("lambdaConflictHandlerArn", om.valueToTree(this.getLambdaConflictHandlerArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncFunction.AppsyncFunctionSyncConfigLambdaConflictHandlerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncFunctionSyncConfigLambdaConflictHandlerConfig.Jsii$Proxy that = (AppsyncFunctionSyncConfigLambdaConflictHandlerConfig.Jsii$Proxy) o;

            return this.lambdaConflictHandlerArn != null ? this.lambdaConflictHandlerArn.equals(that.lambdaConflictHandlerArn) : that.lambdaConflictHandlerArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.lambdaConflictHandlerArn != null ? this.lambdaConflictHandlerArn.hashCode() : 0;
            return result;
        }
    }
}
