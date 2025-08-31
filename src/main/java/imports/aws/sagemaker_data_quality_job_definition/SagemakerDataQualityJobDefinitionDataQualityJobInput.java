package imports.aws.sagemaker_data_quality_job_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInput")
@software.amazon.jsii.Jsii.Proxy(SagemakerDataQualityJobDefinitionDataQualityJobInput.Jsii$Proxy.class)
public interface SagemakerDataQualityJobDefinitionDataQualityJobInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * batch_transform_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#batch_transform_input SagemakerDataQualityJobDefinition#batch_transform_input}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput getBatchTransformInput() {
        return null;
    }

    /**
     * endpoint_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_input SagemakerDataQualityJobDefinition#endpoint_input}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput getEndpointInput() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerDataQualityJobDefinitionDataQualityJobInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerDataQualityJobDefinitionDataQualityJobInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerDataQualityJobDefinitionDataQualityJobInput> {
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput batchTransformInput;
        imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput endpointInput;

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInput#getBatchTransformInput}
         * @param batchTransformInput batch_transform_input block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#batch_transform_input SagemakerDataQualityJobDefinition#batch_transform_input}
         * @return {@code this}
         */
        public Builder batchTransformInput(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput batchTransformInput) {
            this.batchTransformInput = batchTransformInput;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerDataQualityJobDefinitionDataQualityJobInput#getEndpointInput}
         * @param endpointInput endpoint_input block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_data_quality_job_definition#endpoint_input SagemakerDataQualityJobDefinition#endpoint_input}
         * @return {@code this}
         */
        public Builder endpointInput(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput endpointInput) {
            this.endpointInput = endpointInput;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerDataQualityJobDefinitionDataQualityJobInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerDataQualityJobDefinitionDataQualityJobInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerDataQualityJobDefinitionDataQualityJobInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerDataQualityJobDefinitionDataQualityJobInput {
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput batchTransformInput;
        private final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput endpointInput;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.batchTransformInput = software.amazon.jsii.Kernel.get(this, "batchTransformInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput.class));
            this.endpointInput = software.amazon.jsii.Kernel.get(this, "endpointInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.batchTransformInput = builder.batchTransformInput;
            this.endpointInput = builder.endpointInput;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputBatchTransformInput getBatchTransformInput() {
            return this.batchTransformInput;
        }

        @Override
        public final imports.aws.sagemaker_data_quality_job_definition.SagemakerDataQualityJobDefinitionDataQualityJobInputEndpointInput getEndpointInput() {
            return this.endpointInput;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBatchTransformInput() != null) {
                data.set("batchTransformInput", om.valueToTree(this.getBatchTransformInput()));
            }
            if (this.getEndpointInput() != null) {
                data.set("endpointInput", om.valueToTree(this.getEndpointInput()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerDataQualityJobDefinition.SagemakerDataQualityJobDefinitionDataQualityJobInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerDataQualityJobDefinitionDataQualityJobInput.Jsii$Proxy that = (SagemakerDataQualityJobDefinitionDataQualityJobInput.Jsii$Proxy) o;

            if (this.batchTransformInput != null ? !this.batchTransformInput.equals(that.batchTransformInput) : that.batchTransformInput != null) return false;
            return this.endpointInput != null ? this.endpointInput.equals(that.endpointInput) : that.endpointInput == null;
        }

        @Override
        public final int hashCode() {
            int result = this.batchTransformInput != null ? this.batchTransformInput.hashCode() : 0;
            result = 31 * result + (this.endpointInput != null ? this.endpointInput.hashCode() : 0);
            return result;
        }
    }
}
