package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.302Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_output block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_output SagemakerDataQualityJobDefinition#s3_output}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output getS3Output();

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs> {
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output s3Output;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs#getS3Output}
         * @param s3Output s3_output block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#s3_output SagemakerDataQualityJobDefinition#s3_output}
         * @return {@code this}
         */
        public Builder s3Output(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output s3Output) {
            this.s3Output = s3Output;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs {
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output s3Output;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Output = software.amazon.jsii.Kernel.get(this, "s3Output", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Output = java.util.Objects.requireNonNull(builder.s3Output, "s3Output is required");
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputsS3Output getS3Output() {
            return this.s3Output;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Output", om.valueToTree(this.getS3Output()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityJobOutputConfigMonitoringOutputs.Jsii$Proxy) o;

            return this.s3Output.equals(that.s3Output);
        }

        @Override
        public final int hashCode() {
            int result = this.s3Output.hashCode();
            return result;
        }
    }
}
