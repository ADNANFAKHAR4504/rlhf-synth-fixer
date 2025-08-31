package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHeader() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv> {
        java.lang.Object header;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv#getHeader}
         * @param header Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.
         * @return {@code this}
         */
        public Builder header(java.lang.Boolean header) {
            this.header = header;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv#getHeader}
         * @param header Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#header SagemakerDataQualityJobDefinition#header}.
         * @return {@code this}
         */
        public Builder header(com.hashicorp.cdktf.IResolvable header) {
            this.header = header;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv {
        private final java.lang.Object header;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.header = software.amazon.jsii.Kernel.get(this, "header", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.header = builder.header;
        }

        @Override
        public final java.lang.Object getHeader() {
            return this.header;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getHeader() != null) {
                data.set("header", om.valueToTree(this.getHeader()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInputDatasetFormatCsv.Jsii$Proxy) o;

            return this.header != null ? this.header.equals(that.header) : that.header == null;
        }

        @Override
        public final int hashCode() {
            int result = this.header != null ? this.header.hashCode() : 0;
            return result;
        }
    }
}
