package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSource")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelPrimaryContainerModelDataSource.Jsii$Proxy.class)
public interface SagemakerModelPrimaryContainerModelDataSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_data_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getS3DataSource();

    /**
     * @return a {@link Builder} of {@link SagemakerModelPrimaryContainerModelDataSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelPrimaryContainerModelDataSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelPrimaryContainerModelDataSource> {
        java.lang.Object s3DataSource;

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainerModelDataSource#getS3DataSource}
         * @param s3DataSource s3_data_source block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
         * @return {@code this}
         */
        public Builder s3DataSource(com.hashicorp.cdktf.IResolvable s3DataSource) {
            this.s3DataSource = s3DataSource;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelPrimaryContainerModelDataSource#getS3DataSource}
         * @param s3DataSource s3_data_source block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_source SagemakerModel#s3_data_source}
         * @return {@code this}
         */
        public Builder s3DataSource(java.util.List<? extends imports.aws.sagemaker_model.SagemakerModelPrimaryContainerModelDataSourceS3DataSource> s3DataSource) {
            this.s3DataSource = s3DataSource;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelPrimaryContainerModelDataSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelPrimaryContainerModelDataSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelPrimaryContainerModelDataSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelPrimaryContainerModelDataSource {
        private final java.lang.Object s3DataSource;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3DataSource = software.amazon.jsii.Kernel.get(this, "s3DataSource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3DataSource = java.util.Objects.requireNonNull(builder.s3DataSource, "s3DataSource is required");
        }

        @Override
        public final java.lang.Object getS3DataSource() {
            return this.s3DataSource;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3DataSource", om.valueToTree(this.getS3DataSource()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelPrimaryContainerModelDataSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelPrimaryContainerModelDataSource.Jsii$Proxy that = (SagemakerModelPrimaryContainerModelDataSource.Jsii$Proxy) o;

            return this.s3DataSource.equals(that.s3DataSource);
        }

        @Override
        public final int hashCode() {
            int result = this.s3DataSource.hashCode();
            return result;
        }
    }
}
