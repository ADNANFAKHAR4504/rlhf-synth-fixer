package imports.aws.sagemaker_model;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.332Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSource")
@software.amazon.jsii.Jsii.Proxy(SagemakerModelContainerModelDataSourceS3DataSource.Jsii$Proxy.class)
public interface SagemakerModelContainerModelDataSourceS3DataSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCompressionType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3DataType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * model_access_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig getModelAccessConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerModelContainerModelDataSourceS3DataSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerModelContainerModelDataSourceS3DataSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerModelContainerModelDataSourceS3DataSource> {
        java.lang.String compressionType;
        java.lang.String s3DataType;
        java.lang.String s3Uri;
        imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig modelAccessConfig;

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSource#getCompressionType}
         * @param compressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#compression_type SagemakerModel#compression_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder compressionType(java.lang.String compressionType) {
            this.compressionType = compressionType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSource#getS3DataType}
         * @param s3DataType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_data_type SagemakerModel#s3_data_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3DataType(java.lang.String s3DataType) {
            this.s3DataType = s3DataType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSource#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#s3_uri SagemakerModel#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerModelContainerModelDataSourceS3DataSource#getModelAccessConfig}
         * @param modelAccessConfig model_access_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_model#model_access_config SagemakerModel#model_access_config}
         * @return {@code this}
         */
        public Builder modelAccessConfig(imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig modelAccessConfig) {
            this.modelAccessConfig = modelAccessConfig;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerModelContainerModelDataSourceS3DataSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerModelContainerModelDataSourceS3DataSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerModelContainerModelDataSourceS3DataSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerModelContainerModelDataSourceS3DataSource {
        private final java.lang.String compressionType;
        private final java.lang.String s3DataType;
        private final java.lang.String s3Uri;
        private final imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig modelAccessConfig;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.compressionType = software.amazon.jsii.Kernel.get(this, "compressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3DataType = software.amazon.jsii.Kernel.get(this, "s3DataType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.modelAccessConfig = software.amazon.jsii.Kernel.get(this, "modelAccessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.compressionType = java.util.Objects.requireNonNull(builder.compressionType, "compressionType is required");
            this.s3DataType = java.util.Objects.requireNonNull(builder.s3DataType, "s3DataType is required");
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.modelAccessConfig = builder.modelAccessConfig;
        }

        @Override
        public final java.lang.String getCompressionType() {
            return this.compressionType;
        }

        @Override
        public final java.lang.String getS3DataType() {
            return this.s3DataType;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final imports.aws.sagemaker_model.SagemakerModelContainerModelDataSourceS3DataSourceModelAccessConfig getModelAccessConfig() {
            return this.modelAccessConfig;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("compressionType", om.valueToTree(this.getCompressionType()));
            data.set("s3DataType", om.valueToTree(this.getS3DataType()));
            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getModelAccessConfig() != null) {
                data.set("modelAccessConfig", om.valueToTree(this.getModelAccessConfig()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerModel.SagemakerModelContainerModelDataSourceS3DataSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerModelContainerModelDataSourceS3DataSource.Jsii$Proxy that = (SagemakerModelContainerModelDataSourceS3DataSource.Jsii$Proxy) o;

            if (!compressionType.equals(that.compressionType)) return false;
            if (!s3DataType.equals(that.s3DataType)) return false;
            if (!s3Uri.equals(that.s3Uri)) return false;
            return this.modelAccessConfig != null ? this.modelAccessConfig.equals(that.modelAccessConfig) : that.modelAccessConfig == null;
        }

        @Override
        public final int hashCode() {
            int result = this.compressionType.hashCode();
            result = 31 * result + (this.s3DataType.hashCode());
            result = 31 * result + (this.s3Uri.hashCode());
            result = 31 * result + (this.modelAccessConfig != null ? this.modelAccessConfig.hashCode() : 0);
            return result;
        }
    }
}
