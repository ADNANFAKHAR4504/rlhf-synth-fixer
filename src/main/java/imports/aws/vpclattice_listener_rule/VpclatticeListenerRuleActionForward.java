package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForward")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleActionForward.Jsii$Proxy.class)
public interface VpclatticeListenerRuleActionForward extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_groups block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTargetGroups();

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleActionForward}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleActionForward}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleActionForward> {
        java.lang.Object targetGroups;

        /**
         * Sets the value of {@link VpclatticeListenerRuleActionForward#getTargetGroups}
         * @param targetGroups target_groups block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
         * @return {@code this}
         */
        public Builder targetGroups(com.hashicorp.cdktf.IResolvable targetGroups) {
            this.targetGroups = targetGroups;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleActionForward#getTargetGroups}
         * @param targetGroups target_groups block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_groups VpclatticeListenerRule#target_groups}
         * @return {@code this}
         */
        public Builder targetGroups(java.util.List<? extends imports.aws.vpclattice_listener_rule.VpclatticeListenerRuleActionForwardTargetGroups> targetGroups) {
            this.targetGroups = targetGroups;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleActionForward}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleActionForward build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleActionForward}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleActionForward {
        private final java.lang.Object targetGroups;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroups = software.amazon.jsii.Kernel.get(this, "targetGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroups = java.util.Objects.requireNonNull(builder.targetGroups, "targetGroups is required");
        }

        @Override
        public final java.lang.Object getTargetGroups() {
            return this.targetGroups;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetGroups", om.valueToTree(this.getTargetGroups()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForward"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleActionForward.Jsii$Proxy that = (VpclatticeListenerRuleActionForward.Jsii$Proxy) o;

            return this.targetGroups.equals(that.targetGroups);
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroups.hashCode();
            return result;
        }
    }
}
