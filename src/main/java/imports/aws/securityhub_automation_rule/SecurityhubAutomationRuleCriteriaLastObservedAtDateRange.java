package imports.aws.securityhub_automation_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.379Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtDateRange")
@software.amazon.jsii.Jsii.Proxy(SecurityhubAutomationRuleCriteriaLastObservedAtDateRange.Jsii$Proxy.class)
public interface SecurityhubAutomationRuleCriteriaLastObservedAtDateRange extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getValue();

    /**
     * @return a {@link Builder} of {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubAutomationRuleCriteriaLastObservedAtDateRange> {
        java.lang.String unit;
        java.lang.Number value;

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange#getUnit}
         * @param unit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#unit SecurityhubAutomationRule#unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder unit(java.lang.String unit) {
            this.unit = unit;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_automation_rule#value SecurityhubAutomationRule#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.Number value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubAutomationRuleCriteriaLastObservedAtDateRange build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubAutomationRuleCriteriaLastObservedAtDateRange}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubAutomationRuleCriteriaLastObservedAtDateRange {
        private final java.lang.String unit;
        private final java.lang.Number value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unit = software.amazon.jsii.Kernel.get(this, "unit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unit = java.util.Objects.requireNonNull(builder.unit, "unit is required");
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
        }

        @Override
        public final java.lang.String getUnit() {
            return this.unit;
        }

        @Override
        public final java.lang.Number getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("unit", om.valueToTree(this.getUnit()));
            data.set("value", om.valueToTree(this.getValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubAutomationRule.SecurityhubAutomationRuleCriteriaLastObservedAtDateRange"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubAutomationRuleCriteriaLastObservedAtDateRange.Jsii$Proxy that = (SecurityhubAutomationRuleCriteriaLastObservedAtDateRange.Jsii$Proxy) o;

            if (!unit.equals(that.unit)) return false;
            return this.value.equals(that.value);
        }

        @Override
        public final int hashCode() {
            int result = this.unit.hashCode();
            result = 31 * result + (this.value.hashCode());
            return result;
        }
    }
}
