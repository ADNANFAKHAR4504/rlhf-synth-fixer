package imports.aws.sagemaker_app_image_config;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.296Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig.Jsii$Proxy.class)
public interface SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainerArguments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getContainerEntrypoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getContainerEnvironmentVariables() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig> {
        java.util.List<java.lang.String> containerArguments;
        java.util.List<java.lang.String> containerEntrypoint;
        java.util.Map<java.lang.String, java.lang.String> containerEnvironmentVariables;

        /**
         * Sets the value of {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig#getContainerArguments}
         * @param containerArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_arguments SagemakerAppImageConfig#container_arguments}.
         * @return {@code this}
         */
        public Builder containerArguments(java.util.List<java.lang.String> containerArguments) {
            this.containerArguments = containerArguments;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig#getContainerEntrypoint}
         * @param containerEntrypoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_entrypoint SagemakerAppImageConfig#container_entrypoint}.
         * @return {@code this}
         */
        public Builder containerEntrypoint(java.util.List<java.lang.String> containerEntrypoint) {
            this.containerEntrypoint = containerEntrypoint;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig#getContainerEnvironmentVariables}
         * @param containerEnvironmentVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_app_image_config#container_environment_variables SagemakerAppImageConfig#container_environment_variables}.
         * @return {@code this}
         */
        public Builder containerEnvironmentVariables(java.util.Map<java.lang.String, java.lang.String> containerEnvironmentVariables) {
            this.containerEnvironmentVariables = containerEnvironmentVariables;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig {
        private final java.util.List<java.lang.String> containerArguments;
        private final java.util.List<java.lang.String> containerEntrypoint;
        private final java.util.Map<java.lang.String, java.lang.String> containerEnvironmentVariables;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.containerArguments = software.amazon.jsii.Kernel.get(this, "containerArguments", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.containerEntrypoint = software.amazon.jsii.Kernel.get(this, "containerEntrypoint", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.containerEnvironmentVariables = software.amazon.jsii.Kernel.get(this, "containerEnvironmentVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.containerArguments = builder.containerArguments;
            this.containerEntrypoint = builder.containerEntrypoint;
            this.containerEnvironmentVariables = builder.containerEnvironmentVariables;
        }

        @Override
        public final java.util.List<java.lang.String> getContainerArguments() {
            return this.containerArguments;
        }

        @Override
        public final java.util.List<java.lang.String> getContainerEntrypoint() {
            return this.containerEntrypoint;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getContainerEnvironmentVariables() {
            return this.containerEnvironmentVariables;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getContainerArguments() != null) {
                data.set("containerArguments", om.valueToTree(this.getContainerArguments()));
            }
            if (this.getContainerEntrypoint() != null) {
                data.set("containerEntrypoint", om.valueToTree(this.getContainerEntrypoint()));
            }
            if (this.getContainerEnvironmentVariables() != null) {
                data.set("containerEnvironmentVariables", om.valueToTree(this.getContainerEnvironmentVariables()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerAppImageConfig.SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig.Jsii$Proxy that = (SagemakerAppImageConfigCodeEditorAppImageConfigContainerConfig.Jsii$Proxy) o;

            if (this.containerArguments != null ? !this.containerArguments.equals(that.containerArguments) : that.containerArguments != null) return false;
            if (this.containerEntrypoint != null ? !this.containerEntrypoint.equals(that.containerEntrypoint) : that.containerEntrypoint != null) return false;
            return this.containerEnvironmentVariables != null ? this.containerEnvironmentVariables.equals(that.containerEnvironmentVariables) : that.containerEnvironmentVariables == null;
        }

        @Override
        public final int hashCode() {
            int result = this.containerArguments != null ? this.containerArguments.hashCode() : 0;
            result = 31 * result + (this.containerEntrypoint != null ? this.containerEntrypoint.hashCode() : 0);
            result = 31 * result + (this.containerEnvironmentVariables != null ? this.containerEnvironmentVariables.hashCode() : 0);
            return result;
        }
    }
}
