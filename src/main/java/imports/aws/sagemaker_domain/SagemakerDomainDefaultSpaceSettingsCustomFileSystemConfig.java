package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * efs_file_system_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#efs_file_system_config SagemakerDomain#efs_file_system_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig getEfsFileSystemConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig> {
        imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig efsFileSystemConfig;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig#getEfsFileSystemConfig}
         * @param efsFileSystemConfig efs_file_system_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#efs_file_system_config SagemakerDomain#efs_file_system_config}
         * @return {@code this}
         */
        public Builder efsFileSystemConfig(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig efsFileSystemConfig) {
            this.efsFileSystemConfig = efsFileSystemConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig {
        private final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig efsFileSystemConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.efsFileSystemConfig = software.amazon.jsii.Kernel.get(this, "efsFileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.efsFileSystemConfig = builder.efsFileSystemConfig;
        }

        @Override
        public final imports.aws.sagemaker_domain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig getEfsFileSystemConfig() {
            return this.efsFileSystemConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEfsFileSystemConfig() != null) {
                data.set("efsFileSystemConfig", om.valueToTree(this.getEfsFileSystemConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfig.Jsii$Proxy) o;

            return this.efsFileSystemConfig != null ? this.efsFileSystemConfig.equals(that.efsFileSystemConfig) : that.efsFileSystemConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.efsFileSystemConfig != null ? this.efsFileSystemConfig.hashCode() : 0;
            return result;
        }
    }
}
