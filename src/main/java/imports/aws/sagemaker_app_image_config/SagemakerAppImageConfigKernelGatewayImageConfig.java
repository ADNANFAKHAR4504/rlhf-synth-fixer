package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerAppImageConfigKernelGatewayImageConfig.Jsii$Proxy.class)
public interface SagemakerAppImageConfigKernelGatewayImageConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * kernel_spec block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getKernelSpec();

    /**
     * file_system_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig getFileSystemConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerAppImageConfigKernelGatewayImageConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerAppImageConfigKernelGatewayImageConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerAppImageConfigKernelGatewayImageConfig> {
        java.lang.Object kernelSpec;
        imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig fileSystemConfig;

        /**
         * Sets the value of {@link SagemakerAppImageConfigKernelGatewayImageConfig#getKernelSpec}
         * @param kernelSpec kernel_spec block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
         * @return {@code this}
         */
        public Builder kernelSpec(com.hashicorp.cdktf.IResolvable kernelSpec) {
            this.kernelSpec = kernelSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigKernelGatewayImageConfig#getKernelSpec}
         * @param kernelSpec kernel_spec block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#kernel_spec SagemakerAppImageConfig#kernel_spec}
         * @return {@code this}
         */
        public Builder kernelSpec(java.util.List<? extends imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigKernelSpec> kernelSpec) {
            this.kernelSpec = kernelSpec;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigKernelGatewayImageConfig#getFileSystemConfig}
         * @param fileSystemConfig file_system_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#file_system_config SagemakerAppImageConfig#file_system_config}
         * @return {@code this}
         */
        public Builder fileSystemConfig(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig fileSystemConfig) {
            this.fileSystemConfig = fileSystemConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerAppImageConfigKernelGatewayImageConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerAppImageConfigKernelGatewayImageConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerAppImageConfigKernelGatewayImageConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerAppImageConfigKernelGatewayImageConfig {
        private final java.lang.Object kernelSpec;
        private final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig fileSystemConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kernelSpec = software.amazon.jsii.Kernel.get(this, "kernelSpec", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fileSystemConfig = software.amazon.jsii.Kernel.get(this, "fileSystemConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kernelSpec = java.util.Objects.requireNonNull(builder.kernelSpec, "kernelSpec is required");
            this.fileSystemConfig = builder.fileSystemConfig;
        }

        @Override
        public final java.lang.Object getKernelSpec() {
            return this.kernelSpec;
        }

        @Override
        public final imports.aws.sagemaker_app_image_config.SagemakerAppImageConfigKernelGatewayImageConfigFileSystemConfig getFileSystemConfig() {
            return this.fileSystemConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kernelSpec", om.valueToTree(this.getKernelSpec()));
            if (this.getFileSystemConfig() != null) {
                data.set("fileSystemConfig", om.valueToTree(this.getFileSystemConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerAppImageConfig.SagemakerAppImageConfigKernelGatewayImageConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerAppImageConfigKernelGatewayImageConfig.Jsii$Proxy that = (SagemakerAppImageConfigKernelGatewayImageConfig.Jsii$Proxy) o;

            if (!kernelSpec.equals(that.kernelSpec)) return false;
            return this.fileSystemConfig != null ? this.fileSystemConfig.equals(that.fileSystemConfig) : that.fileSystemConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kernelSpec.hashCode();
            result = 31 * result + (this.fileSystemConfig != null ? this.fileSystemConfig.hashCode() : 0);
            return result;
        }
    }
}
