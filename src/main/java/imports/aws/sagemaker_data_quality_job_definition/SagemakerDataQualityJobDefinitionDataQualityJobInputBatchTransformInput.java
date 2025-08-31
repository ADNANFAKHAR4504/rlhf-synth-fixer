package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_captured_destination_s3_uri SagemakerDataQualityJobDefinition#data_captured_destination_s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataCapturedDestinationS3Uri();

    /**
     * dataset_format block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#dataset_format SagemakerDataQualityJobDefinition#dataset_format}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat getDatasetFormat();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3DataDistributionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3InputMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput> {
        java.lang.String dataCapturedDestinationS3Uri;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat datasetFormat;
        java.lang.String localPath;
        java.lang.String s3DataDistributionType;
        java.lang.String s3InputMode;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput#getDataCapturedDestinationS3Uri}
         * @param dataCapturedDestinationS3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#data_captured_destination_s3_uri SagemakerDataQualityJobDefinition#data_captured_destination_s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataCapturedDestinationS3Uri(java.lang.String dataCapturedDestinationS3Uri) {
            this.dataCapturedDestinationS3Uri = dataCapturedDestinationS3Uri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput#getDatasetFormat}
         * @param datasetFormat dataset_format block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#dataset_format SagemakerDataQualityJobDefinition#dataset_format}
         * @return {@code this}
         */
        public Builder datasetFormat(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat datasetFormat) {
            this.datasetFormat = datasetFormat;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput#getLocalPath}
         * @param localPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
         * @return {@code this}
         */
        public Builder localPath(java.lang.String localPath) {
            this.localPath = localPath;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput#getS3DataDistributionType}
         * @param s3DataDistributionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_data_distribution_type SagemakerDataQualityJobDefinition#s3_data_distribution_type}.
         * @return {@code this}
         */
        public Builder s3DataDistributionType(java.lang.String s3DataDistributionType) {
            this.s3DataDistributionType = s3DataDistributionType;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput#getS3InputMode}
         * @param s3InputMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_input_mode SagemakerDataQualityJobDefinition#s3_input_mode}.
         * @return {@code this}
         */
        public Builder s3InputMode(java.lang.String s3InputMode) {
            this.s3InputMode = s3InputMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput {
        private final java.lang.String dataCapturedDestinationS3Uri;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat datasetFormat;
        private final java.lang.String localPath;
        private final java.lang.String s3DataDistributionType;
        private final java.lang.String s3InputMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dataCapturedDestinationS3Uri = software.amazon.jsii.Kernel.get(this, "dataCapturedDestinationS3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.datasetFormat = software.amazon.jsii.Kernel.get(this, "datasetFormat", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat.class));
            this.localPath = software.amazon.jsii.Kernel.get(this, "localPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3DataDistributionType = software.amazon.jsii.Kernel.get(this, "s3DataDistributionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3InputMode = software.amazon.jsii.Kernel.get(this, "s3InputMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dataCapturedDestinationS3Uri = java.util.Objects.requireNonNull(builder.dataCapturedDestinationS3Uri, "dataCapturedDestinationS3Uri is required");
            this.datasetFormat = java.util.Objects.requireNonNull(builder.datasetFormat, "datasetFormat is required");
            this.localPath = builder.localPath;
            this.s3DataDistributionType = builder.s3DataDistributionType;
            this.s3InputMode = builder.s3InputMode;
        }

        @Override
        public final java.lang.String getDataCapturedDestinationS3Uri() {
            return this.dataCapturedDestinationS3Uri;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormat getDatasetFormat() {
            return this.datasetFormat;
        }

        @Override
        public final java.lang.String getLocalPath() {
            return this.localPath;
        }

        @Override
        public final java.lang.String getS3DataDistributionType() {
            return this.s3DataDistributionType;
        }

        @Override
        public final java.lang.String getS3InputMode() {
            return this.s3InputMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("dataCapturedDestinationS3Uri", om.valueToTree(this.getDataCapturedDestinationS3Uri()));
            data.set("datasetFormat", om.valueToTree(this.getDatasetFormat()));
            if (this.getLocalPath() != null) {
                data.set("localPath", om.valueToTree(this.getLocalPath()));
            }
            if (this.getS3DataDistributionType() != null) {
                data.set("s3DataDistributionType", om.valueToTree(this.getS3DataDistributionType()));
            }
            if (this.getS3InputMode() != null) {
                data.set("s3InputMode", om.valueToTree(this.getS3InputMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput.Jsii$Proxy) o;

            if (!dataCapturedDestinationS3Uri.equals(that.dataCapturedDestinationS3Uri)) return false;
            if (!datasetFormat.equals(that.datasetFormat)) return false;
            if (this.localPath != null ? !this.localPath.equals(that.localPath) : that.localPath != null) return false;
            if (this.s3DataDistributionType != null ? !this.s3DataDistributionType.equals(that.s3DataDistributionType) : that.s3DataDistributionType != null) return false;
            return this.s3InputMode != null ? this.s3InputMode.equals(that.s3InputMode) : that.s3InputMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dataCapturedDestinationS3Uri.hashCode();
            result = 31 * result + (this.datasetFormat.hashCode());
            result = 31 * result + (this.localPath != null ? this.localPath.hashCode() : 0);
            result = 31 * result + (this.s3DataDistributionType != null ? this.s3DataDistributionType.hashCode() : 0);
            result = 31 * result + (this.s3InputMode != null ? this.s3InputMode.hashCode() : 0);
            return result;
        }
    }
}
