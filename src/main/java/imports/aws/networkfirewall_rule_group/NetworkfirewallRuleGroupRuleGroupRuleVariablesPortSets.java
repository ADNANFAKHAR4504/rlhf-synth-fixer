package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#key NetworkfirewallRuleGroup#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * port_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#port_set NetworkfirewallRuleGroup#port_set}
     */
    @org.jetbrains.annotations.NotNull imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet getPortSet();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets> {
        java.lang.String key;
        imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet portSet;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#key NetworkfirewallRuleGroup#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets#getPortSet}
         * @param portSet port_set block. This parameter is required.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#port_set NetworkfirewallRuleGroup#port_set}
         * @return {@code this}
         */
        public Builder portSet(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet portSet) {
            this.portSet = portSet;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets {
        private final java.lang.String key;
        private final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet portSet;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.portSet = software.amazon.jsii.Kernel.get(this, "portSet", software.amazon.jsii.NativeType.forClass(imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
            this.portSet = java.util.Objects.requireNonNull(builder.portSet, "portSet is required");
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSetsPortSet getPortSet() {
            return this.portSet;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("key", om.valueToTree(this.getKey()));
            data.set("portSet", om.valueToTree(this.getPortSet()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupRuleVariablesPortSets.Jsii$Proxy) o;

            if (!key.equals(that.key)) return false;
            return this.portSet.equals(that.portSet);
        }

        @Override
        public final int hashCode() {
            int result = this.key.hashCode();
            result = 31 * result + (this.portSet.hashCode());
            return result;
        }
    }
}
