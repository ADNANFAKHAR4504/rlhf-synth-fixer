package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.371Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#label SecurityhubAutomationRule#label}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLabel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product SecurityhubAutomationRule#product}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProduct() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity> {
        java.lang.String label;
        java.lang.Number product;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity#getLabel}
         * @param label Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#label SecurityhubAutomationRule#label}.
         * @return {@code this}
         */
        public Builder label(java.lang.String label) {
            this.label = label;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity#getProduct}
         * @param product Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#product SecurityhubAutomationRule#product}.
         * @return {@code this}
         */
        public Builder product(java.lang.Number product) {
            this.product = product;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity {
        private final java.lang.String label;
        private final java.lang.Number product;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.label = software.amazon.jsii.Kernel.get(this, "label", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.product = software.amazon.jsii.Kernel.get(this, "product", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.label = builder.label;
            this.product = builder.product;
        }

        @Override
        public final java.lang.String getLabel() {
            return this.label;
        }

        @Override
        public final java.lang.Number getProduct() {
            return this.product;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLabel() != null) {
                data.set("label", om.valueToTree(this.getLabel()));
            }
            if (this.getProduct() != null) {
                data.set("product", om.valueToTree(this.getProduct()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity.Jsii$Proxy that = (SecurityhubAutomationRuleActionsFindingFieldsUpdateSeverity.Jsii$Proxy) o;

            if (this.label != null ? !this.label.equals(that.label) : that.label != null) return false;
            return this.product != null ? this.product.equals(that.product) : that.product == null;
        }

        @Override
        public final int hashCode() {
            int result = this.label != null ? this.label.hashCode() : 0;
            result = 31 * result + (this.product != null ? this.product.hashCode() : 0);
            return result;
        }
    }
}
