package imports.aws.vpclattice_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.620Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardTargetGroups")
@software.amazon.jsii.Jsii.Proxy(VpclatticeListenerRuleActionForwardTargetGroups.Jsii$Proxy.class)
public interface VpclatticeListenerRuleActionForwardTargetGroups extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_group_identifier VpclatticeListenerRule#target_group_identifier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetGroupIdentifier();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#weight VpclatticeListenerRule#weight}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWeight() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeListenerRuleActionForwardTargetGroups}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeListenerRuleActionForwardTargetGroups}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeListenerRuleActionForwardTargetGroups> {
        java.lang.String targetGroupIdentifier;
        java.lang.Number weight;

        /**
         * Sets the value of {@link VpclatticeListenerRuleActionForwardTargetGroups#getTargetGroupIdentifier}
         * @param targetGroupIdentifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#target_group_identifier VpclatticeListenerRule#target_group_identifier}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetGroupIdentifier(java.lang.String targetGroupIdentifier) {
            this.targetGroupIdentifier = targetGroupIdentifier;
            return this;
        }

        /**
         * Sets the value of {@link VpclatticeListenerRuleActionForwardTargetGroups#getWeight}
         * @param weight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_listener_rule#weight VpclatticeListenerRule#weight}.
         * @return {@code this}
         */
        public Builder weight(java.lang.Number weight) {
            this.weight = weight;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeListenerRuleActionForwardTargetGroups}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeListenerRuleActionForwardTargetGroups build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeListenerRuleActionForwardTargetGroups}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeListenerRuleActionForwardTargetGroups {
        private final java.lang.String targetGroupIdentifier;
        private final java.lang.Number weight;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroupIdentifier = software.amazon.jsii.Kernel.get(this, "targetGroupIdentifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weight = software.amazon.jsii.Kernel.get(this, "weight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroupIdentifier = java.util.Objects.requireNonNull(builder.targetGroupIdentifier, "targetGroupIdentifier is required");
            this.weight = builder.weight;
        }

        @Override
        public final java.lang.String getTargetGroupIdentifier() {
            return this.targetGroupIdentifier;
        }

        @Override
        public final java.lang.Number getWeight() {
            return this.weight;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetGroupIdentifier", om.valueToTree(this.getTargetGroupIdentifier()));
            if (this.getWeight() != null) {
                data.set("weight", om.valueToTree(this.getWeight()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeListenerRule.VpclatticeListenerRuleActionForwardTargetGroups"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeListenerRuleActionForwardTargetGroups.Jsii$Proxy that = (VpclatticeListenerRuleActionForwardTargetGroups.Jsii$Proxy) o;

            if (!targetGroupIdentifier.equals(that.targetGroupIdentifier)) return false;
            return this.weight != null ? this.weight.equals(that.weight) : that.weight == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroupIdentifier.hashCode();
            result = 31 * result + (this.weight != null ? this.weight.hashCode() : 0);
            return result;
        }
    }
}
