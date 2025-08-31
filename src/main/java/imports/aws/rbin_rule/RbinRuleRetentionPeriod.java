package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleRetentionPeriod")
@software.amazon.jsii.Jsii.Proxy(RbinRuleRetentionPeriod.Jsii$Proxy.class)
public interface RbinRuleRetentionPeriod extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_unit RbinRule#retention_period_unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRetentionPeriodUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_value RbinRule#retention_period_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriodValue();

    /**
     * @return a {@link Builder} of {@link RbinRuleRetentionPeriod}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RbinRuleRetentionPeriod}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RbinRuleRetentionPeriod> {
        java.lang.String retentionPeriodUnit;
        java.lang.Number retentionPeriodValue;

        /**
         * Sets the value of {@link RbinRuleRetentionPeriod#getRetentionPeriodUnit}
         * @param retentionPeriodUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_unit RbinRule#retention_period_unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder retentionPeriodUnit(java.lang.String retentionPeriodUnit) {
            this.retentionPeriodUnit = retentionPeriodUnit;
            return this;
        }

        /**
         * Sets the value of {@link RbinRuleRetentionPeriod#getRetentionPeriodValue}
         * @param retentionPeriodValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#retention_period_value RbinRule#retention_period_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder retentionPeriodValue(java.lang.Number retentionPeriodValue) {
            this.retentionPeriodValue = retentionPeriodValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RbinRuleRetentionPeriod}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RbinRuleRetentionPeriod build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RbinRuleRetentionPeriod}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RbinRuleRetentionPeriod {
        private final java.lang.String retentionPeriodUnit;
        private final java.lang.Number retentionPeriodValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.retentionPeriodUnit = software.amazon.jsii.Kernel.get(this, "retentionPeriodUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retentionPeriodValue = software.amazon.jsii.Kernel.get(this, "retentionPeriodValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.retentionPeriodUnit = java.util.Objects.requireNonNull(builder.retentionPeriodUnit, "retentionPeriodUnit is required");
            this.retentionPeriodValue = java.util.Objects.requireNonNull(builder.retentionPeriodValue, "retentionPeriodValue is required");
        }

        @Override
        public final java.lang.String getRetentionPeriodUnit() {
            return this.retentionPeriodUnit;
        }

        @Override
        public final java.lang.Number getRetentionPeriodValue() {
            return this.retentionPeriodValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("retentionPeriodUnit", om.valueToTree(this.getRetentionPeriodUnit()));
            data.set("retentionPeriodValue", om.valueToTree(this.getRetentionPeriodValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rbinRule.RbinRuleRetentionPeriod"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RbinRuleRetentionPeriod.Jsii$Proxy that = (RbinRuleRetentionPeriod.Jsii$Proxy) o;

            if (!retentionPeriodUnit.equals(that.retentionPeriodUnit)) return false;
            return this.retentionPeriodValue.equals(that.retentionPeriodValue);
        }

        @Override
        public final int hashCode() {
            int result = this.retentionPeriodUnit.hashCode();
            result = 31 * result + (this.retentionPeriodValue.hashCode());
            return result;
        }
    }
}
