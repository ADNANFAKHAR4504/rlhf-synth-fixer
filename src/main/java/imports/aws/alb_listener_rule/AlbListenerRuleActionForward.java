package imports.aws.alb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.albListenerRule.AlbListenerRuleActionForward")
@software.amazon.jsii.Jsii.Proxy(AlbListenerRuleActionForward.Jsii$Proxy.class)
public interface AlbListenerRuleActionForward extends software.amazon.jsii.JsiiSerializable {

    /**
     * target_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#target_group AlbListenerRule#target_group}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getTargetGroup();

    /**
     * stickiness block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#stickiness AlbListenerRule#stickiness}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness getStickiness() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AlbListenerRuleActionForward}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AlbListenerRuleActionForward}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AlbListenerRuleActionForward> {
        java.lang.Object targetGroup;
        imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness stickiness;

        /**
         * Sets the value of {@link AlbListenerRuleActionForward#getTargetGroup}
         * @param targetGroup target_group block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#target_group AlbListenerRule#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(com.hashicorp.cdktf.IResolvable targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleActionForward#getTargetGroup}
         * @param targetGroup target_group block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#target_group AlbListenerRule#target_group}
         * @return {@code this}
         */
        public Builder targetGroup(java.util.List<? extends imports.aws.alb_listener_rule.AlbListenerRuleActionForwardTargetGroup> targetGroup) {
            this.targetGroup = targetGroup;
            return this;
        }

        /**
         * Sets the value of {@link AlbListenerRuleActionForward#getStickiness}
         * @param stickiness stickiness block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/alb_listener_rule#stickiness AlbListenerRule#stickiness}
         * @return {@code this}
         */
        public Builder stickiness(imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness stickiness) {
            this.stickiness = stickiness;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AlbListenerRuleActionForward}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AlbListenerRuleActionForward build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AlbListenerRuleActionForward}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AlbListenerRuleActionForward {
        private final java.lang.Object targetGroup;
        private final imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness stickiness;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetGroup = software.amazon.jsii.Kernel.get(this, "targetGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stickiness = software.amazon.jsii.Kernel.get(this, "stickiness", software.amazon.jsii.NativeType.forClass(imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetGroup = java.util.Objects.requireNonNull(builder.targetGroup, "targetGroup is required");
            this.stickiness = builder.stickiness;
        }

        @Override
        public final java.lang.Object getTargetGroup() {
            return this.targetGroup;
        }

        @Override
        public final imports.aws.alb_listener_rule.AlbListenerRuleActionForwardStickiness getStickiness() {
            return this.stickiness;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetGroup", om.valueToTree(this.getTargetGroup()));
            if (this.getStickiness() != null) {
                data.set("stickiness", om.valueToTree(this.getStickiness()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.albListenerRule.AlbListenerRuleActionForward"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AlbListenerRuleActionForward.Jsii$Proxy that = (AlbListenerRuleActionForward.Jsii$Proxy) o;

            if (!targetGroup.equals(that.targetGroup)) return false;
            return this.stickiness != null ? this.stickiness.equals(that.stickiness) : that.stickiness == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetGroup.hashCode();
            result = 31 * result + (this.stickiness != null ? this.stickiness.hashCode() : 0);
            return result;
        }
    }
}
