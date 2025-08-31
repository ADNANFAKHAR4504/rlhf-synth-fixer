package imports.aws.sagemaker_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.304Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig.Jsii$Proxy.class)
public interface SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#file_system_id SagemakerDomain#file_system_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileSystemId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#file_system_path SagemakerDomain#file_system_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFileSystemPath();

    /**
     * @return a {@link Builder} of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig> {
        java.lang.String fileSystemId;
        java.lang.String fileSystemPath;

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig#getFileSystemId}
         * @param fileSystemId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#file_system_id SagemakerDomain#file_system_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileSystemId(java.lang.String fileSystemId) {
            this.fileSystemId = fileSystemId;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig#getFileSystemPath}
         * @param fileSystemPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_domain#file_system_path SagemakerDomain#file_system_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder fileSystemPath(java.lang.String fileSystemPath) {
            this.fileSystemPath = fileSystemPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig {
        private final java.lang.String fileSystemId;
        private final java.lang.String fileSystemPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fileSystemId = software.amazon.jsii.Kernel.get(this, "fileSystemId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemPath = software.amazon.jsii.Kernel.get(this, "fileSystemPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fileSystemId = java.util.Objects.requireNonNull(builder.fileSystemId, "fileSystemId is required");
            this.fileSystemPath = java.util.Objects.requireNonNull(builder.fileSystemPath, "fileSystemPath is required");
        }

        @Override
        public final java.lang.String getFileSystemId() {
            return this.fileSystemId;
        }

        @Override
        public final java.lang.String getFileSystemPath() {
            return this.fileSystemPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("fileSystemId", om.valueToTree(this.getFileSystemId()));
            data.set("fileSystemPath", om.valueToTree(this.getFileSystemPath()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDomain.SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig.Jsii$Proxy that = (SagemakerDomainDefaultSpaceSettingsCustomFileSystemConfigEfsFileSystemConfig.Jsii$Proxy) o;

            if (!fileSystemId.equals(that.fileSystemId)) return false;
            return this.fileSystemPath.equals(that.fileSystemPath);
        }

        @Override
        public final int hashCode() {
            int result = this.fileSystemId.hashCode();
            result = 31 * result + (this.fileSystemPath.hashCode());
            return result;
        }
    }
}
