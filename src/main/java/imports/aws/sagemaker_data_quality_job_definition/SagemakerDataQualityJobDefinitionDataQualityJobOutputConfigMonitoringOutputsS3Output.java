package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getS3Uri();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_upload_mode SagemakerDataQualityJobDefinition#s3_upload_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3UploadMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output> {
        java.lang.String s3Uri;
        java.lang.String localPath;
        java.lang.String s3UploadMode;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output#getS3Uri}
         * @param s3Uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_uri SagemakerDataQualityJobDefinition#s3_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder s3Uri(java.lang.String s3Uri) {
            this.s3Uri = s3Uri;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output#getLocalPath}
         * @param localPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#local_path SagemakerDataQualityJobDefinition#local_path}.
         * @return {@code this}
         */
        public Builder localPath(java.lang.String localPath) {
            this.localPath = localPath;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output#getS3UploadMode}
         * @param s3UploadMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_upload_mode SagemakerDataQualityJobDefinition#s3_upload_mode}.
         * @return {@code this}
         */
        public Builder s3UploadMode(java.lang.String s3UploadMode) {
            this.s3UploadMode = s3UploadMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output {
        private final java.lang.String s3Uri;
        private final java.lang.String localPath;
        private final java.lang.String s3UploadMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Uri = software.amazon.jsii.Kernel.get(this, "s3Uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localPath = software.amazon.jsii.Kernel.get(this, "localPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.s3UploadMode = software.amazon.jsii.Kernel.get(this, "s3UploadMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Uri = java.util.Objects.requireNonNull(builder.s3Uri, "s3Uri is required");
            this.localPath = builder.localPath;
            this.s3UploadMode = builder.s3UploadMode;
        }

        @Override
        public final java.lang.String getS3Uri() {
            return this.s3Uri;
        }

        @Override
        public final java.lang.String getLocalPath() {
            return this.localPath;
        }

        @Override
        public final java.lang.String getS3UploadMode() {
            return this.s3UploadMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Uri", om.valueToTree(this.getS3Uri()));
            if (this.getLocalPath() != null) {
                data.set("localPath", om.valueToTree(this.getLocalPath()));
            }
            if (this.getS3UploadMode() != null) {
                data.set("s3UploadMode", om.valueToTree(this.getS3UploadMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output.Jsii$Proxy) o;

            if (!s3Uri.equals(that.s3Uri)) return false;
            if (this.localPath != null ? !this.localPath.equals(that.localPath) : that.localPath != null) return false;
            return this.s3UploadMode != null ? this.s3UploadMode.equals(that.s3UploadMode) : that.s3UploadMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Uri.hashCode();
            result = 31 * result + (this.localPath != null ? this.localPath.hashCode() : 0);
            result = 31 * result + (this.s3UploadMode != null ? this.s3UploadMode.hashCode() : 0);
            return result;
        }
    }
}
