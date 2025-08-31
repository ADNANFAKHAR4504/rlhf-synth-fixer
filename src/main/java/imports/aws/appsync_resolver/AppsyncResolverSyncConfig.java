package imports.aws.appsync_resolver;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.078Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncResolver.AppsyncResolverSyncConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncResolverSyncConfig.Jsii$Proxy.class)
public interface AppsyncResolverSyncConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#conflict_detection AppsyncResolver#conflict_detection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConflictDetection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#conflict_handler AppsyncResolver#conflict_handler}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConflictHandler() {
        return null;
    }

    /**
     * lambda_conflict_handler_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#lambda_conflict_handler_config AppsyncResolver#lambda_conflict_handler_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig getLambdaConflictHandlerConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncResolverSyncConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncResolverSyncConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncResolverSyncConfig> {
        java.lang.String conflictDetection;
        java.lang.String conflictHandler;
        imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig lambdaConflictHandlerConfig;

        /**
         * Sets the value of {@link AppsyncResolverSyncConfig#getConflictDetection}
         * @param conflictDetection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#conflict_detection AppsyncResolver#conflict_detection}.
         * @return {@code this}
         */
        public Builder conflictDetection(java.lang.String conflictDetection) {
            this.conflictDetection = conflictDetection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverSyncConfig#getConflictHandler}
         * @param conflictHandler Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#conflict_handler AppsyncResolver#conflict_handler}.
         * @return {@code this}
         */
        public Builder conflictHandler(java.lang.String conflictHandler) {
            this.conflictHandler = conflictHandler;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncResolverSyncConfig#getLambdaConflictHandlerConfig}
         * @param lambdaConflictHandlerConfig lambda_conflict_handler_config block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_resolver#lambda_conflict_handler_config AppsyncResolver#lambda_conflict_handler_config}
         * @return {@code this}
         */
        public Builder lambdaConflictHandlerConfig(imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig lambdaConflictHandlerConfig) {
            this.lambdaConflictHandlerConfig = lambdaConflictHandlerConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppsyncResolverSyncConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncResolverSyncConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncResolverSyncConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncResolverSyncConfig {
        private final java.lang.String conflictDetection;
        private final java.lang.String conflictHandler;
        private final imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig lambdaConflictHandlerConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.conflictDetection = software.amazon.jsii.Kernel.get(this, "conflictDetection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.conflictHandler = software.amazon.jsii.Kernel.get(this, "conflictHandler", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaConflictHandlerConfig = software.amazon.jsii.Kernel.get(this, "lambdaConflictHandlerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.conflictDetection = builder.conflictDetection;
            this.conflictHandler = builder.conflictHandler;
            this.lambdaConflictHandlerConfig = builder.lambdaConflictHandlerConfig;
        }

        @Override
        public final java.lang.String getConflictDetection() {
            return this.conflictDetection;
        }

        @Override
        public final java.lang.String getConflictHandler() {
            return this.conflictHandler;
        }

        @Override
        public final imports.aws.appsync_resolver.AppsyncResolverSyncConfigLambdaConflictHandlerConfig getLambdaConflictHandlerConfig() {
            return this.lambdaConflictHandlerConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConflictDetection() != null) {
                data.set("conflictDetection", om.valueToTree(this.getConflictDetection()));
            }
            if (this.getConflictHandler() != null) {
                data.set("conflictHandler", om.valueToTree(this.getConflictHandler()));
            }
            if (this.getLambdaConflictHandlerConfig() != null) {
                data.set("lambdaConflictHandlerConfig", om.valueToTree(this.getLambdaConflictHandlerConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appsyncResolver.AppsyncResolverSyncConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncResolverSyncConfig.Jsii$Proxy that = (AppsyncResolverSyncConfig.Jsii$Proxy) o;

            if (this.conflictDetection != null ? !this.conflictDetection.equals(that.conflictDetection) : that.conflictDetection != null) return false;
            if (this.conflictHandler != null ? !this.conflictHandler.equals(that.conflictHandler) : that.conflictHandler != null) return false;
            return this.lambdaConflictHandlerConfig != null ? this.lambdaConflictHandlerConfig.equals(that.lambdaConflictHandlerConfig) : that.lambdaConflictHandlerConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.conflictDetection != null ? this.conflictDetection.hashCode() : 0;
            result = 31 * result + (this.conflictHandler != null ? this.conflictHandler.hashCode() : 0);
            result = 31 * result + (this.lambdaConflictHandlerConfig != null ? this.lambdaConflictHandlerConfig.hashCode() : 0);
            return result;
        }
    }
}
