package imports.aws.networkfirewall_firewall_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.951Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition.Jsii$Proxy.class)
public interface NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition extends software.amazon.jsii.JsiiSerializable {

    /**
     * publish_metric_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#publish_metric_action NetworkfirewallFirewallPolicy#publish_metric_action}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction getPublishMetricAction();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition> {
        imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction publishMetricAction;

        /**
         * Sets the value of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition#getPublishMetricAction}
         * @param publishMetricAction publish_metric_action block. This parameter is required.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_firewall_policy#publish_metric_action NetworkfirewallFirewallPolicy#publish_metric_action}
         * @return {@code this}
         */
        public Builder publishMetricAction(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction publishMetricAction) {
            this.publishMetricAction = publishMetricAction;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition {
        private final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction publishMetricAction;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.publishMetricAction = software.amazon.jsii.Kernel.get(this, "publishMetricAction", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.publishMetricAction = java.util.Objects.requireNonNull(builder.publishMetricAction, "publishMetricAction is required");
        }

        @Override
        public final imports.aws.networkfirewall_firewall_policy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinitionPublishMetricAction getPublishMetricAction() {
            return this.publishMetricAction;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("publishMetricAction", om.valueToTree(this.getPublishMetricAction()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallFirewallPolicy.NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition.Jsii$Proxy that = (NetworkfirewallFirewallPolicyFirewallPolicyStatelessCustomActionActionDefinition.Jsii$Proxy) o;

            return this.publishMetricAction.equals(that.publishMetricAction);
        }

        @Override
        public final int hashCode() {
            int result = this.publishMetricAction.hashCode();
            return result;
        }
    }
}
