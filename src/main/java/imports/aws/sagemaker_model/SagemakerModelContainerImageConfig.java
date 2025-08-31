package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.331Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelContainerImageConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelContainerImageConfig.Jsii$Proxy.class)
public interface SagemakerModelContainerImageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRepositoryAccessMode();

    /**
     * repository_auth_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig getRepositoryAuthConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerModelContainerImageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelContainerImageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelContainerImageConfig> {
        java.lang.String repositoryAccessMode;
        imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig repositoryAuthConfig;

        /**
         * Sets the value of {@link SagemakerModelContainerImageConfig#getRepositoryAccessMode}
         * @param repositoryAccessMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_access_mode SagemakerModel#repository_access_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder repositoryAccessMode(java.lang.String repositoryAccessMode) {
            this.repositoryAccessMode = repositoryAccessMode;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelContainerImageConfig#getRepositoryAuthConfig}
         * @param repositoryAuthConfig repository_auth_config block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#repository_auth_config SagemakerModel#repository_auth_config}
         * @return {@code this}
         */
        public Builder repositoryAuthConfig(imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig repositoryAuthConfig) {
            this.repositoryAuthConfig = repositoryAuthConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelContainerImageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelContainerImageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelContainerImageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelContainerImageConfig {
        private final java.lang.String repositoryAccessMode;
        private final imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig repositoryAuthConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.repositoryAccessMode = software.amazon.jsii.Kernel.get(this, "repositoryAccessMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.repositoryAuthConfig = software.amazon.jsii.Kernel.get(this, "repositoryAuthConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.repositoryAccessMode = java.util.Objects.requireNonNull(builder.repositoryAccessMode, "repositoryAccessMode is required");
            this.repositoryAuthConfig = builder.repositoryAuthConfig;
        }

        @Override
        public final java.lang.String getRepositoryAccessMode() {
            return this.repositoryAccessMode;
        }

        @Override
        public final imports.aws.sagemaker_model.SagemakerModelContainerImageConfigRepositoryAuthConfig getRepositoryAuthConfig() {
            return this.repositoryAuthConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("repositoryAccessMode", om.valueToTree(this.getRepositoryAccessMode()));
            if (this.getRepositoryAuthConfig() != null) {
                data.set("repositoryAuthConfig", om.valueToTree(this.getRepositoryAuthConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelContainerImageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelContainerImageConfig.Jsii$Proxy that = (SagemakerModelContainerImageConfig.Jsii$Proxy) o;

            if (!repositoryAccessMode.equals(that.repositoryAccessMode)) return false;
            return this.repositoryAuthConfig != null ? this.repositoryAuthConfig.equals(that.repositoryAuthConfig) : that.repositoryAuthConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.repositoryAccessMode.hashCode();
            result = 31 * result + (this.repositoryAuthConfig != null ? this.repositoryAuthConfig.hashCode() : 0);
            return result;
        }
    }
}
