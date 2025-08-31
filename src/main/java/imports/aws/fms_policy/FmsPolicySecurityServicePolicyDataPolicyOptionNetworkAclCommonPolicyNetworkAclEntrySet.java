package imports.aws.fms_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.235Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet")
@software.amazon.jsii.Jsii.Proxy(FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet.Jsii$Proxy.class)
public interface FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_first_entries FmsPolicy#force_remediate_for_first_entries}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getForceRemediateForFirstEntries();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_last_entries FmsPolicy#force_remediate_for_last_entries}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getForceRemediateForLastEntries();

    /**
     * first_entry block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#first_entry FmsPolicy#first_entry}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFirstEntry() {
        return null;
    }

    /**
     * last_entry block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#last_entry FmsPolicy#last_entry}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLastEntry() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet> {
        java.lang.Object forceRemediateForFirstEntries;
        java.lang.Object forceRemediateForLastEntries;
        java.lang.Object firstEntry;
        java.lang.Object lastEntry;

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getForceRemediateForFirstEntries}
         * @param forceRemediateForFirstEntries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_first_entries FmsPolicy#force_remediate_for_first_entries}. This parameter is required.
         * @return {@code this}
         */
        public Builder forceRemediateForFirstEntries(java.lang.Boolean forceRemediateForFirstEntries) {
            this.forceRemediateForFirstEntries = forceRemediateForFirstEntries;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getForceRemediateForFirstEntries}
         * @param forceRemediateForFirstEntries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_first_entries FmsPolicy#force_remediate_for_first_entries}. This parameter is required.
         * @return {@code this}
         */
        public Builder forceRemediateForFirstEntries(com.hashicorp.cdktf.IResolvable forceRemediateForFirstEntries) {
            this.forceRemediateForFirstEntries = forceRemediateForFirstEntries;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getForceRemediateForLastEntries}
         * @param forceRemediateForLastEntries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_last_entries FmsPolicy#force_remediate_for_last_entries}. This parameter is required.
         * @return {@code this}
         */
        public Builder forceRemediateForLastEntries(java.lang.Boolean forceRemediateForLastEntries) {
            this.forceRemediateForLastEntries = forceRemediateForLastEntries;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getForceRemediateForLastEntries}
         * @param forceRemediateForLastEntries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#force_remediate_for_last_entries FmsPolicy#force_remediate_for_last_entries}. This parameter is required.
         * @return {@code this}
         */
        public Builder forceRemediateForLastEntries(com.hashicorp.cdktf.IResolvable forceRemediateForLastEntries) {
            this.forceRemediateForLastEntries = forceRemediateForLastEntries;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getFirstEntry}
         * @param firstEntry first_entry block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#first_entry FmsPolicy#first_entry}
         * @return {@code this}
         */
        public Builder firstEntry(com.hashicorp.cdktf.IResolvable firstEntry) {
            this.firstEntry = firstEntry;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getFirstEntry}
         * @param firstEntry first_entry block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#first_entry FmsPolicy#first_entry}
         * @return {@code this}
         */
        public Builder firstEntry(java.util.List<? extends imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetFirstEntry> firstEntry) {
            this.firstEntry = firstEntry;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getLastEntry}
         * @param lastEntry last_entry block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#last_entry FmsPolicy#last_entry}
         * @return {@code this}
         */
        public Builder lastEntry(com.hashicorp.cdktf.IResolvable lastEntry) {
            this.lastEntry = lastEntry;
            return this;
        }

        /**
         * Sets the value of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet#getLastEntry}
         * @param lastEntry last_entry block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fms_policy#last_entry FmsPolicy#last_entry}
         * @return {@code this}
         */
        public Builder lastEntry(java.util.List<? extends imports.aws.fms_policy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySetLastEntry> lastEntry) {
            this.lastEntry = lastEntry;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet {
        private final java.lang.Object forceRemediateForFirstEntries;
        private final java.lang.Object forceRemediateForLastEntries;
        private final java.lang.Object firstEntry;
        private final java.lang.Object lastEntry;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.forceRemediateForFirstEntries = software.amazon.jsii.Kernel.get(this, "forceRemediateForFirstEntries", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceRemediateForLastEntries = software.amazon.jsii.Kernel.get(this, "forceRemediateForLastEntries", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.firstEntry = software.amazon.jsii.Kernel.get(this, "firstEntry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.lastEntry = software.amazon.jsii.Kernel.get(this, "lastEntry", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.forceRemediateForFirstEntries = java.util.Objects.requireNonNull(builder.forceRemediateForFirstEntries, "forceRemediateForFirstEntries is required");
            this.forceRemediateForLastEntries = java.util.Objects.requireNonNull(builder.forceRemediateForLastEntries, "forceRemediateForLastEntries is required");
            this.firstEntry = builder.firstEntry;
            this.lastEntry = builder.lastEntry;
        }

        @Override
        public final java.lang.Object getForceRemediateForFirstEntries() {
            return this.forceRemediateForFirstEntries;
        }

        @Override
        public final java.lang.Object getForceRemediateForLastEntries() {
            return this.forceRemediateForLastEntries;
        }

        @Override
        public final java.lang.Object getFirstEntry() {
            return this.firstEntry;
        }

        @Override
        public final java.lang.Object getLastEntry() {
            return this.lastEntry;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("forceRemediateForFirstEntries", om.valueToTree(this.getForceRemediateForFirstEntries()));
            data.set("forceRemediateForLastEntries", om.valueToTree(this.getForceRemediateForLastEntries()));
            if (this.getFirstEntry() != null) {
                data.set("firstEntry", om.valueToTree(this.getFirstEntry()));
            }
            if (this.getLastEntry() != null) {
                data.set("lastEntry", om.valueToTree(this.getLastEntry()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fmsPolicy.FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet.Jsii$Proxy that = (FmsPolicySecurityServicePolicyDataPolicyOptionNetworkAclCommonPolicyNetworkAclEntrySet.Jsii$Proxy) o;

            if (!forceRemediateForFirstEntries.equals(that.forceRemediateForFirstEntries)) return false;
            if (!forceRemediateForLastEntries.equals(that.forceRemediateForLastEntries)) return false;
            if (this.firstEntry != null ? !this.firstEntry.equals(that.firstEntry) : that.firstEntry != null) return false;
            return this.lastEntry != null ? this.lastEntry.equals(that.lastEntry) : that.lastEntry == null;
        }

        @Override
        public final int hashCode() {
            int result = this.forceRemediateForFirstEntries.hashCode();
            result = 31 * result + (this.forceRemediateForLastEntries.hashCode());
            result = 31 * result + (this.firstEntry != null ? this.firstEntry.hashCode() : 0);
            result = 31 * result + (this.lastEntry != null ? this.lastEntry.hashCode() : 0);
            return result;
        }
    }
}
