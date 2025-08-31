package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.953Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupReferenceSets")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupReferenceSets.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupReferenceSets extends software.amazon.jsii.JsiiSerializable {

    /**
     * ip_set_references block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_references NetworkfirewallRuleGroup#ip_set_references}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIpSetReferences() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupReferenceSets}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupReferenceSets}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupReferenceSets> {
        java.lang.Object ipSetReferences;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupReferenceSets#getIpSetReferences}
         * @param ipSetReferences ip_set_references block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_references NetworkfirewallRuleGroup#ip_set_references}
         * @return {@code this}
         */
        public Builder ipSetReferences(com.hashicorp.cdktf.IResolvable ipSetReferences) {
            this.ipSetReferences = ipSetReferences;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupReferenceSets#getIpSetReferences}
         * @param ipSetReferences ip_set_references block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_references NetworkfirewallRuleGroup#ip_set_references}
         * @return {@code this}
         */
        public Builder ipSetReferences(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences> ipSetReferences) {
            this.ipSetReferences = ipSetReferences;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupReferenceSets}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupReferenceSets build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupReferenceSets}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupReferenceSets {
        private final java.lang.Object ipSetReferences;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipSetReferences = software.amazon.jsii.Kernel.get(this, "ipSetReferences", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipSetReferences = builder.ipSetReferences;
        }

        @Override
        public final java.lang.Object getIpSetReferences() {
            return this.ipSetReferences;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIpSetReferences() != null) {
                data.set("ipSetReferences", om.valueToTree(this.getIpSetReferences()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupReferenceSets"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupReferenceSets.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupReferenceSets.Jsii$Proxy) o;

            return this.ipSetReferences != null ? this.ipSetReferences.equals(that.ipSetReferences) : that.ipSetReferences == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ipSetReferences != null ? this.ipSetReferences.hashCode() : 0;
            return result;
        }
    }
}
