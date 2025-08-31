package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#definition NetworkfirewallRuleGroup#definition}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDefinition();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet> {
        java.util.List<java.lang.String> definition;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet#getDefinition}
         * @param definition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#definition NetworkfirewallRuleGroup#definition}. This parameter is required.
         * @return {@code this}
         */
        public Builder definition(java.util.List<java.lang.String> definition) {
            this.definition = definition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet {
        private final java.util.List<java.lang.String> definition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.definition = software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.definition = java.util.Objects.requireNonNull(builder.definition, "definition is required");
        }

        @Override
        public final java.util.List<java.lang.String> getDefinition() {
            return this.definition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("definition", om.valueToTree(this.getDefinition()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRuleVariablesIpSetsIpSet.Jsii$Proxy) o;

            return this.definition.equals(that.definition);
        }

        @Override
        public final int hashCode() {
            int result = this.definition.hashCode();
            return result;
        }
    }
}
