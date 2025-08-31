package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig.Jsii$Proxy.class)
public interface SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAcceptEula();

    /**
     * @return a {@link Builder} of {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig> {
        java.lang.Object acceptEula;

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig#getAcceptEula}
         * @param acceptEula Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}. This parameter is required.
         * @return {@code this}
         */
        public Builder acceptEula(java.lang.Boolean acceptEula) {
            this.acceptEula = acceptEula;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig#getAcceptEula}
         * @param acceptEula Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#accept_eula SagemakerModel#accept_eula}. This parameter is required.
         * @return {@code this}
         */
        public Builder acceptEula(com.hashicorp.cdktf.IResolvable acceptEula) {
            this.acceptEula = acceptEula;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig {
        private final java.lang.Object acceptEula;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.acceptEula = software.amazon.jsii.Kernel.get(this, "acceptEula", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.acceptEula = java.util.Objects.requireNonNull(builder.acceptEula, "acceptEula is required");
        }

        @Override
        public final java.lang.Object getAcceptEula() {
            return this.acceptEula;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("acceptEula", om.valueToTree(this.getAcceptEula()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig.Jsii$Proxy that = (SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig.Jsii$Proxy) o;

            return this.acceptEula.equals(that.acceptEula);
        }

        @Override
        public final int hashCode() {
            int result = this.acceptEula.hashCode();
            return result;
        }
    }
}
