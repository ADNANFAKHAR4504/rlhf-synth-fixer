package imports.aws.sagemaker_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerPipeline.SagemakerPipelineParallelismConfiguration")
@software.amazon.jsii.Jsii.Proxy(SagemakerPipelineParallelismConfiguration.Jsii$Proxy.class)
public interface SagemakerPipelineParallelismConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#max_parallel_execution_steps SagemakerPipeline#max_parallel_execution_steps}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxParallelExecutionSteps();

    /**
     * @return a {@link Builder} of {@link SagemakerPipelineParallelismConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerPipelineParallelismConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerPipelineParallelismConfiguration> {
        java.lang.Number maxParallelExecutionSteps;

        /**
         * Sets the value of {@link SagemakerPipelineParallelismConfiguration#getMaxParallelExecutionSteps}
         * @param maxParallelExecutionSteps Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#max_parallel_execution_steps SagemakerPipeline#max_parallel_execution_steps}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxParallelExecutionSteps(java.lang.Number maxParallelExecutionSteps) {
            this.maxParallelExecutionSteps = maxParallelExecutionSteps;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerPipelineParallelismConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerPipelineParallelismConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerPipelineParallelismConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerPipelineParallelismConfiguration {
        private final java.lang.Number maxParallelExecutionSteps;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.maxParallelExecutionSteps = software.amazon.jsii.Kernel.get(this, "maxParallelExecutionSteps", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.maxParallelExecutionSteps = java.util.Objects.requireNonNull(builder.maxParallelExecutionSteps, "maxParallelExecutionSteps is required");
        }

        @Override
        public final java.lang.Number getMaxParallelExecutionSteps() {
            return this.maxParallelExecutionSteps;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("maxParallelExecutionSteps", om.valueToTree(this.getMaxParallelExecutionSteps()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerPipeline.SagemakerPipelineParallelismConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerPipelineParallelismConfiguration.Jsii$Proxy that = (SagemakerPipelineParallelismConfiguration.Jsii$Proxy) o;

            return this.maxParallelExecutionSteps.equals(that.maxParallelExecutionSteps);
        }

        @Override
        public final int hashCode() {
            int result = this.maxParallelExecutionSteps.hashCode();
            return result;
        }
    }
}
