package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerAppImageConfigCodeEditorAppImageConfig.Jsii$Proxy.class)
public interface SagemakerAppImageConfigCodeEditorAppImageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * container_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig getContainerConfig() {
        return null;
    }

    /**
     * file_system_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig getFileSystemConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerAppImageConfigCodeEditorAppImageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerAppImageConfigCodeEditorAppImageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerAppImageConfigCodeEditorAppImageConfig> {
        imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig containerConfig;
        imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig fileSystemConfig;

        /**
         * Sets the value of {@link SagemakerAppImageConfigCodeEditorAppImageConfig#getContainerConfig}
         * @param containerConfig container_config block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_config SagemakerAppImageConfig#container_config}
         * @return {@code this}
         */
        public Builder containerConfig(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig containerConfig) {
            this.containerConfig = containerConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigCodeEditorAppImageConfig#getFileSystemConfig}
         * @param fileSystemConfig file_system_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
         * @return {@code this}
         */
        public Builder fileSystemConfig(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig fileSystemConfig) {
            this.fileSystemConfig = fileSystemConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerAppImageConfigCodeEditorAppImageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerAppImageConfigCodeEditorAppImageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerAppImageConfigCodeEditorAppImageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerAppImageConfigCodeEditorAppImageConfig {
        private final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig containerConfig;
        private final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig fileSystemConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerConfig = software.amazon.jsii.Kernel.get(this, "containerConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig.class));
            this.fileSystemConfig = software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerConfig = builder.containerConfig;
            this.fileSystemConfig = builder.fileSystemConfig;
        }

        @Override
        public final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig getContainerConfig() {
            return this.containerConfig;
        }

        @Override
        public final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigCodeEditorAppImageConfigFileSystemConfig getFileSystemConfig() {
            return this.fileSystemConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerConfig() != null) {
                data.set("containerConfig", om.valueToTree(this.getContainerConfig()));
            }
            if (this.getFileSystemConfig() != null) {
                data.set("fileSystemConfig", om.valueToTree(this.getFileSystemConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerAppImageConfigCodeEditorAppImageConfig.Jsii$Proxy that = (SagemakerAppImageConfigCodeEditorAppImageConfig.Jsii$Proxy) o;

            if (this.containerConfig != null ? !this.containerConfig.equals(that.containerConfig) : that.containerConfig != null) return false;
            return this.fileSystemConfig != null ? this.fileSystemConfig.equals(that.fileSystemConfig) : that.fileSystemConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerConfig != null ? this.containerConfig.hashCode() : 0;
            result = 31 * result + (this.fileSystemConfig != null ? this.fileSystemConfig.hashCode() : 0);
            return result;
        }
    }
}
