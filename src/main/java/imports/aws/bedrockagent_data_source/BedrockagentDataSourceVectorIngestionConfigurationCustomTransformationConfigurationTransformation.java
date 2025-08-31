package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.168Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation.Jsii$Proxy.class)
public interface BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#step_to_apply BedrockagentDataSource#step_to_apply}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStepToApply();

    /**
     * transformation_function block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation_function BedrockagentDataSource#transformation_function}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransformationFunction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation> {
        java.lang.String stepToApply;
        java.lang.Object transformationFunction;

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation#getStepToApply}
         * @param stepToApply Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#step_to_apply BedrockagentDataSource#step_to_apply}. This parameter is required.
         * @return {@code this}
         */
        public Builder stepToApply(java.lang.String stepToApply) {
            this.stepToApply = stepToApply;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation#getTransformationFunction}
         * @param transformationFunction transformation_function block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation_function BedrockagentDataSource#transformation_function}
         * @return {@code this}
         */
        public Builder transformationFunction(com.hashicorp.cdktf.IResolvable transformationFunction) {
            this.transformationFunction = transformationFunction;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation#getTransformationFunction}
         * @param transformationFunction transformation_function block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#transformation_function BedrockagentDataSource#transformation_function}
         * @return {@code this}
         */
        public Builder transformationFunction(java.util.List<? extends imports.aws.bedrockagent_data_source.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformationTransformationFunction> transformationFunction) {
            this.transformationFunction = transformationFunction;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation {
        private final java.lang.String stepToApply;
        private final java.lang.Object transformationFunction;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.stepToApply = software.amazon.jsii.Kernel.get(this, "stepToApply", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transformationFunction = software.amazon.jsii.Kernel.get(this, "transformationFunction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.stepToApply = java.util.Objects.requireNonNull(builder.stepToApply, "stepToApply is required");
            this.transformationFunction = builder.transformationFunction;
        }

        @Override
        public final java.lang.String getStepToApply() {
            return this.stepToApply;
        }

        @Override
        public final java.lang.Object getTransformationFunction() {
            return this.transformationFunction;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("stepToApply", om.valueToTree(this.getStepToApply()));
            if (this.getTransformationFunction() != null) {
                data.set("transformationFunction", om.valueToTree(this.getTransformationFunction()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation.Jsii$Proxy that = (BedrockagentDataSourceVectorIngestionConfigurationCustomTransformationConfigurationTransformation.Jsii$Proxy) o;

            if (!stepToApply.equals(that.stepToApply)) return false;
            return this.transformationFunction != null ? this.transformationFunction.equals(that.transformationFunction) : that.transformationFunction == null;
        }

        @Override
        public final int hashCode() {
            int result = this.stepToApply.hashCode();
            result = 31 * result + (this.transformationFunction != null ? this.transformationFunction.hashCode() : 0);
            return result;
        }
    }
}
