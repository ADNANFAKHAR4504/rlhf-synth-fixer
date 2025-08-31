package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice extends software.amazon.jsii.JsiiSerializable {

    /**
     * amount_in_usd block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#amount_in_usd SagemakerFlowDefinition#amount_in_usd}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd getAmountInUsd() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice> {
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd amountInUsd;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice#getAmountInUsd}
         * @param amountInUsd amount_in_usd block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#amount_in_usd SagemakerFlowDefinition#amount_in_usd}
         * @return {@code this}
         */
        public Builder amountInUsd(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd amountInUsd) {
            this.amountInUsd = amountInUsd;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice {
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd amountInUsd;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.amountInUsd = software.amazon.jsii.Kernel.get(this, "amountInUsd", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.amountInUsd = builder.amountInUsd;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd getAmountInUsd() {
            return this.amountInUsd;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAmountInUsd() != null) {
                data.set("amountInUsd", om.valueToTree(this.getAmountInUsd()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.Jsii$Proxy that = (SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.Jsii$Proxy) o;

            return this.amountInUsd != null ? this.amountInUsd.equals(that.amountInUsd) : that.amountInUsd == null;
        }

        @Override
        public final int hashCode() {
            int result = this.amountInUsd != null ? this.amountInUsd.hashCode() : 0;
            return result;
        }
    }
}
