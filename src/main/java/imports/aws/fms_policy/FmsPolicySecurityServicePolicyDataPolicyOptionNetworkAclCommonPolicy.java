package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * network_acl_entry_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_acl_entry_set FmsPolicy#network_acl_entry_set}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet getNetworkAclEntrySet() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy> {
        imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet networkAclEntrySet;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy#getNetworkAclEntrySet}
         * @param networkAclEntrySet network_acl_entry_set block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#network_acl_entry_set FmsPolicy#network_acl_entry_set}
         * @return {@code this}
         */
        public Builder networkAclEntrySet(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet networkAclEntrySet) {
            this.networkAclEntrySet = networkAclEntrySet;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy {
        private final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet networkAclEntrySet;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.networkAclEntrySet = software.amazon.jsii.Kernel.get(this, "networkAclEntrySet", software.amazon.jsii.NativeType.forClass(imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.networkAclEntrySet = builder.networkAclEntrySet;
        }

        @Override
        public final imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet getNetworkAclEntrySet() {
            return this.networkAclEntrySet;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNetworkAclEntrySet() != null) {
                data.set("networkAclEntrySet", om.valueToTree(this.getNetworkAclEntrySet()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.Jsii$Proxy that = (FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicy.Jsii$Proxy) o;

            return this.networkAclEntrySet != null ? this.networkAclEntrySet.equals(that.networkAclEntrySet) : that.networkAclEntrySet == null;
        }

        @Override
        public final int hashCode() {
            int result = this.networkAclEntrySet != null ? this.networkAclEntrySet.hashCode() : 0;
            return result;
        }
    }
}
