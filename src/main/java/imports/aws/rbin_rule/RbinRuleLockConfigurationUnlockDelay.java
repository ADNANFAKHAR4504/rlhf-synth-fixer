package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.134Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleLockConfigurationUnlockDelay")
@software.amazon.jsii.Jsii.Proxy(RbinRuleLockConfigurationUnlockDelay.Jsii$Proxy.class)
public interface RbinRuleLockConfigurationUnlockDelay extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_unit RbinRule#unlock_delay_unit}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUnlockDelayUnit();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_value RbinRule#unlock_delay_value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getUnlockDelayValue();

    /**
     * @return a {@link Builder} of {@link RbinRuleLockConfigurationUnlockDelay}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RbinRuleLockConfigurationUnlockDelay}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RbinRuleLockConfigurationUnlockDelay> {
        java.lang.String unlockDelayUnit;
        java.lang.Number unlockDelayValue;

        /**
         * Sets the value of {@link RbinRuleLockConfigurationUnlockDelay#getUnlockDelayUnit}
         * @param unlockDelayUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_unit RbinRule#unlock_delay_unit}. This parameter is required.
         * @return {@code this}
         */
        public Builder unlockDelayUnit(java.lang.String unlockDelayUnit) {
            this.unlockDelayUnit = unlockDelayUnit;
            return this;
        }

        /**
         * Sets the value of {@link RbinRuleLockConfigurationUnlockDelay#getUnlockDelayValue}
         * @param unlockDelayValue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay_value RbinRule#unlock_delay_value}. This parameter is required.
         * @return {@code this}
         */
        public Builder unlockDelayValue(java.lang.Number unlockDelayValue) {
            this.unlockDelayValue = unlockDelayValue;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RbinRuleLockConfigurationUnlockDelay}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RbinRuleLockConfigurationUnlockDelay build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RbinRuleLockConfigurationUnlockDelay}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RbinRuleLockConfigurationUnlockDelay {
        private final java.lang.String unlockDelayUnit;
        private final java.lang.Number unlockDelayValue;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unlockDelayUnit = software.amazon.jsii.Kernel.get(this, "unlockDelayUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unlockDelayValue = software.amazon.jsii.Kernel.get(this, "unlockDelayValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unlockDelayUnit = java.util.Objects.requireNonNull(builder.unlockDelayUnit, "unlockDelayUnit is required");
            this.unlockDelayValue = java.util.Objects.requireNonNull(builder.unlockDelayValue, "unlockDelayValue is required");
        }

        @Override
        public final java.lang.String getUnlockDelayUnit() {
            return this.unlockDelayUnit;
        }

        @Override
        public final java.lang.Number getUnlockDelayValue() {
            return this.unlockDelayValue;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("unlockDelayUnit", om.valueToTree(this.getUnlockDelayUnit()));
            data.set("unlockDelayValue", om.valueToTree(this.getUnlockDelayValue()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rbinRule.RbinRuleLockConfigurationUnlockDelay"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RbinRuleLockConfigurationUnlockDelay.Jsii$Proxy that = (RbinRuleLockConfigurationUnlockDelay.Jsii$Proxy) o;

            if (!unlockDelayUnit.equals(that.unlockDelayUnit)) return false;
            return this.unlockDelayValue.equals(that.unlockDelayValue);
        }

        @Override
        public final int hashCode() {
            int result = this.unlockDelayUnit.hashCode();
            result = 31 * result + (this.unlockDelayValue.hashCode());
            return result;
        }
    }
}
