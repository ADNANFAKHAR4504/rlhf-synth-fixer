package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#cents SagemakerFlowDefinition#cents}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCents() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#dollars SagemakerFlowDefinition#dollars}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDollars() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tenth_fractions_of_a_cent SagemakerFlowDefinition#tenth_fractions_of_a_cent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTenthFractionsOfACent() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd> {
        java.lang.Number cents;
        java.lang.Number dollars;
        java.lang.Number tenthFractionsOfACent;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd#getCents}
         * @param cents Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#cents SagemakerFlowDefinition#cents}.
         * @return {@code this}
         */
        public Builder cents(java.lang.Number cents) {
            this.cents = cents;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd#getDollars}
         * @param dollars Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#dollars SagemakerFlowDefinition#dollars}.
         * @return {@code this}
         */
        public Builder dollars(java.lang.Number dollars) {
            this.dollars = dollars;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd#getTenthFractionsOfACent}
         * @param tenthFractionsOfACent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tenth_fractions_of_a_cent SagemakerFlowDefinition#tenth_fractions_of_a_cent}.
         * @return {@code this}
         */
        public Builder tenthFractionsOfACent(java.lang.Number tenthFractionsOfACent) {
            this.tenthFractionsOfACent = tenthFractionsOfACent;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd {
        private final java.lang.Number cents;
        private final java.lang.Number dollars;
        private final java.lang.Number tenthFractionsOfACent;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cents = software.amazon.jsii.Kernel.get(this, "cents", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dollars = software.amazon.jsii.Kernel.get(this, "dollars", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tenthFractionsOfACent = software.amazon.jsii.Kernel.get(this, "tenthFractionsOfACent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cents = builder.cents;
            this.dollars = builder.dollars;
            this.tenthFractionsOfACent = builder.tenthFractionsOfACent;
        }

        @Override
        public final java.lang.Number getCents() {
            return this.cents;
        }

        @Override
        public final java.lang.Number getDollars() {
            return this.dollars;
        }

        @Override
        public final java.lang.Number getTenthFractionsOfACent() {
            return this.tenthFractionsOfACent;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCents() != null) {
                data.set("cents", om.valueToTree(this.getCents()));
            }
            if (this.getDollars() != null) {
                data.set("dollars", om.valueToTree(this.getDollars()));
            }
            if (this.getTenthFractionsOfACent() != null) {
                data.set("tenthFractionsOfACent", om.valueToTree(this.getTenthFractionsOfACent()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd.Jsii$Proxy that = (SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd.Jsii$Proxy) o;

            if (this.cents != null ? !this.cents.equals(that.cents) : that.cents != null) return false;
            if (this.dollars != null ? !this.dollars.equals(that.dollars) : that.dollars != null) return false;
            return this.tenthFractionsOfACent != null ? this.tenthFractionsOfACent.equals(that.tenthFractionsOfACent) : that.tenthFractionsOfACent == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cents != null ? this.cents.hashCode() : 0;
            result = 31 * result + (this.dollars != null ? this.dollars.hashCode() : 0);
            result = 31 * result + (this.tenthFractionsOfACent != null ? this.tenthFractionsOfACent.hashCode() : 0);
            return result;
        }
    }
}
