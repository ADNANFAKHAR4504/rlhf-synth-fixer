package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleActions")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleActions.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleActions extends software.amazon.jsii.JsiiSerializable {

    /**
     * finding_fields_update block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#finding_fields_update SecurityhubAutomationRule#finding_fields_update}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFindingFieldsUpdate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleActions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleActions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleActions> {
        java.lang.Object findingFieldsUpdate;
        java.lang.String type;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActions#getFindingFieldsUpdate}
         * @param findingFieldsUpdate finding_fields_update block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#finding_fields_update SecurityhubAutomationRule#finding_fields_update}
         * @return {@code this}
         */
        public Builder findingFieldsUpdate(com.hashicorp.cdktf.IResolvable findingFieldsUpdate) {
            this.findingFieldsUpdate = findingFieldsUpdate;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActions#getFindingFieldsUpdate}
         * @param findingFieldsUpdate finding_fields_update block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#finding_fields_update SecurityhubAutomationRule#finding_fields_update}
         * @return {@code this}
         */
        public Builder findingFieldsUpdate(java.util.List<? extends imports.aws.securityhub_automation_rule.SecurityhubAutomationRuleActionsFindingFieldsUpdate> findingFieldsUpdate) {
            this.findingFieldsUpdate = findingFieldsUpdate;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleActions#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#type SecurityhubAutomationRule#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleActions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleActions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleActions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleActions {
        private final java.lang.Object findingFieldsUpdate;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.findingFieldsUpdate = software.amazon.jsii.Kernel.get(this, "findingFieldsUpdate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.findingFieldsUpdate = builder.findingFieldsUpdate;
            this.type = builder.type;
        }

        @Override
        public final java.lang.Object getFindingFieldsUpdate() {
            return this.findingFieldsUpdate;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFindingFieldsUpdate() != null) {
                data.set("findingFieldsUpdate", om.valueToTree(this.getFindingFieldsUpdate()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleActions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleActions.Jsii$Proxy that = (SecurityhubAutomationRuleActions.Jsii$Proxy) o;

            if (this.findingFieldsUpdate != null ? !this.findingFieldsUpdate.equals(that.findingFieldsUpdate) : that.findingFieldsUpdate != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.findingFieldsUpdate != null ? this.findingFieldsUpdate.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
