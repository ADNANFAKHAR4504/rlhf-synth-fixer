package imports.aws.networkfirewall_rule_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.953Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences.Jsii$Proxy.class)
public interface NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences extends software.amazon.jsii.JsiiSerializable {

    /**
     * ip_set_reference block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_reference NetworkfirewallRuleGroup#ip_set_reference}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getIpSetReference();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#key NetworkfirewallRuleGroup#key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKey();

    /**
     * @return a {@link Builder} of {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences> {
        java.lang.Object ipSetReference;
        java.lang.String key;

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences#getIpSetReference}
         * @param ipSetReference ip_set_reference block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_reference NetworkfirewallRuleGroup#ip_set_reference}
         * @return {@code this}
         */
        public Builder ipSetReference(com.hashicorp.cdktf.IResolvable ipSetReference) {
            this.ipSetReference = ipSetReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences#getIpSetReference}
         * @param ipSetReference ip_set_reference block. This parameter is required.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#ip_set_reference NetworkfirewallRuleGroup#ip_set_reference}
         * @return {@code this}
         */
        public Builder ipSetReference(java.util.List<? extends imports.aws.networkfirewall_rule_group.NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferencesIpSetReference> ipSetReference) {
            this.ipSetReference = ipSetReference;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_rule_group#key NetworkfirewallRuleGroup#key}. This parameter is required.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences {
        private final java.lang.Object ipSetReference;
        private final java.lang.String key;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ipSetReference = software.amazon.jsii.Kernel.get(this, "ipSetReference", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ipSetReference = java.util.Objects.requireNonNull(builder.ipSetReference, "ipSetReference is required");
            this.key = java.util.Objects.requireNonNull(builder.key, "key is required");
        }

        @Override
        public final java.lang.Object getIpSetReference() {
            return this.ipSetReference;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ipSetReference", om.valueToTree(this.getIpSetReference()));
            data.set("key", om.valueToTree(this.getKey()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallRuleGroup.NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences.Jsii$Proxy that = (NetworkfirewallRuleGroupRuleGroupReferenceSetsIpSetReferences.Jsii$Proxy) o;

            if (!ipSetReference.equals(that.ipSetReference)) return false;
            return this.key.equals(that.key);
        }

        @Override
        public final int hashCode() {
            int result = this.ipSetReference.hashCode();
            result = 31 * result + (this.key.hashCode());
            return result;
        }
    }
}
