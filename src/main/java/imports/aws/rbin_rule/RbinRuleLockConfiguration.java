package imports.aws.rbin_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rbinRule.RbinRuleLockConfiguration")
@software.amazon.jsii.Jsii.Proxy(RbinRuleLockConfiguration.Jsii$Proxy.class)
public interface RbinRuleLockConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * unlock_delay block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay RbinRule#unlock_delay}
     */
    @org.jetbrains.annotations.NotNull imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay getUnlockDelay();

    /**
     * @return a {@link Builder} of {@link RbinRuleLockConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link RbinRuleLockConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<RbinRuleLockConfiguration> {
        imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay unlockDelay;

        /**
         * Sets the value of {@link RbinRuleLockConfiguration#getUnlockDelay}
         * @param unlockDelay unlock_delay block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rbin_rule#unlock_delay RbinRule#unlock_delay}
         * @return {@code this}
         */
        public Builder unlockDelay(imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay unlockDelay) {
            this.unlockDelay = unlockDelay;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link RbinRuleLockConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public RbinRuleLockConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link RbinRuleLockConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements RbinRuleLockConfiguration {
        private final imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay unlockDelay;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.unlockDelay = software.amazon.jsii.Kernel.get(this, "unlockDelay", software.amazon.jsii.NativeType.forClass(imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.unlockDelay = java.util.Objects.requireNonNull(builder.unlockDelay, "unlockDelay is required");
        }

        @Override
        public final imports.aws.rbin_rule.RbinRuleLockConfigurationUnlockDelay getUnlockDelay() {
            return this.unlockDelay;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("unlockDelay", om.valueToTree(this.getUnlockDelay()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.rbinRule.RbinRuleLockConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            RbinRuleLockConfiguration.Jsii$Proxy that = (RbinRuleLockConfiguration.Jsii$Proxy) o;

            return this.unlockDelay.equals(that.unlockDelay);
        }

        @Override
        public final int hashCode() {
            int result = this.unlockDelay.hashCode();
            return result;
        }
    }
}
