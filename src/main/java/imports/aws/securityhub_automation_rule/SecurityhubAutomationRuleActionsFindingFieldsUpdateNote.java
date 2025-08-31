package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleActionsFindingFieldsUpdateNote.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleActionsFindingFieldsUpdateNote extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#text SecurityhubAutomationRule#text}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getText();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_by SecurityhubAutomationRule#updated_by}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUpdatedBy();

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleActionsFindingFieldsUpdateNote> {
        java.lang.String text;
        java.lang.String updatedBy;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote#getText}
         * @param text Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#text SecurityhubAutomationRule#text}. This parameter is required.
         * @return {@code this}
         */
        public Builder text(java.lang.String text) {
            this.text = text;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote#getUpdatedBy}
         * @param updatedBy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#updated_by SecurityhubAutomationRule#updated_by}. This parameter is required.
         * @return {@code this}
         */
        public Builder updatedBy(java.lang.String updatedBy) {
            this.updatedBy = updatedBy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleActionsFindingFieldsUpdateNote build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleActionsFindingFieldsUpdateNote}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleActionsFindingFieldsUpdateNote {
        private final java.lang.String text;
        private final java.lang.String updatedBy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.text = software.amazon.jsii.Kernel.get(this, "text", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.updatedBy = software.amazon.jsii.Kernel.get(this, "updatedBy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.text = java.util.Objects.requireNonNull(builder.text, "text is required");
            this.updatedBy = java.util.Objects.requireNonNull(builder.updatedBy, "updatedBy is required");
        }

        @Override
        public final java.lang.String getText() {
            return this.text;
        }

        @Override
        public final java.lang.String getUpdatedBy() {
            return this.updatedBy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("text", om.valueToTree(this.getText()));
            data.set("updatedBy", om.valueToTree(this.getUpdatedBy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleActionsFindingFieldsUpdateNote"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleActionsFindingFieldsUpdateNote.Jsii$Proxy that = (SecurityhubAutomationRuleActionsFindingFieldsUpdateNote.Jsii$Proxy) o;

            if (!text.equals(that.text)) return false;
            return this.updatedBy.equals(that.updatedBy);
        }

        @Override
        public final int hashCode() {
            int result = this.text.hashCode();
            result = 31 * result + (this.updatedBy.hashCode());
            return result;
        }
    }
}
