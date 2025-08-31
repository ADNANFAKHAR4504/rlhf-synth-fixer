package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#resource_arn NetworkfirewallFirewallPolicy#resource_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceArn();

    /**
     * override block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#override NetworkfirewallFirewallPolicy#override}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride getOverride() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#priority NetworkfirewallFirewallPolicy#priority}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPriority() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference> {
        java.lang.String resourceArn;
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride override;
        java.lang.Number priority;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#resource_arn NetworkfirewallFirewallPolicy#resource_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference#getOverride}
         * @param override override block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#override NetworkfirewallFirewallPolicy#override}
         * @return {@code this}
         */
        public Builder override(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride override) {
            this.override = override;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#priority NetworkfirewallFirewallPolicy#priority}.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference {
        private final java.lang.String resourceArn;
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride override;
        private final java.lang.Number priority;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.override = software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride.class));
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceArn = java.util.Objects.requireNonNull(builder.resourceArn, "resourceArn is required");
            this.override = builder.override;
            this.priority = builder.priority;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReferenceOverride getOverride() {
            return this.override;
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            if (this.getOverride() != null) {
                data.set("override", om.valueToTree(this.getOverride()));
            }
            if (this.getPriority() != null) {
                data.set("priority", om.valueToTree(this.getPriority()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyStatefulRuleGroupReference.Jsii$Proxy) o;

            if (!resourceArn.equals(that.resourceArn)) return false;
            if (this.override != null ? !this.override.equals(that.override) : that.override != null) return false;
            return this.priority != null ? this.priority.equals(that.priority) : that.priority == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceArn.hashCode();
            result = 31 * result + (this.override != null ? this.override.hashCode() : 0);
            result = 31 * result + (this.priority != null ? this.priority.hashCode() : 0);
            return result;
        }
    }
}
