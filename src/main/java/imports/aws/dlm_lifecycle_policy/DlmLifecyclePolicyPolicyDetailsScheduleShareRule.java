package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsScheduleShareRule.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsScheduleShareRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target_accounts DlmLifecyclePolicy#target_accounts}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetAccounts();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#unshare_interval DlmLifecyclePolicy#unshare_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getUnshareInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#unshare_interval_unit DlmLifecyclePolicy#unshare_interval_unit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnshareIntervalUnit() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsScheduleShareRule> {
        java.util.List<java.lang.String> targetAccounts;
        java.lang.Number unshareInterval;
        java.lang.String unshareIntervalUnit;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule#getTargetAccounts}
         * @param targetAccounts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target_accounts DlmLifecyclePolicy#target_accounts}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetAccounts(java.util.List<java.lang.String> targetAccounts) {
            this.targetAccounts = targetAccounts;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule#getUnshareInterval}
         * @param unshareInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#unshare_interval DlmLifecyclePolicy#unshare_interval}.
         * @return {@code this}
         */
        public Builder unshareInterval(java.lang.Number unshareInterval) {
            this.unshareInterval = unshareInterval;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule#getUnshareIntervalUnit}
         * @param unshareIntervalUnit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#unshare_interval_unit DlmLifecyclePolicy#unshare_interval_unit}.
         * @return {@code this}
         */
        public Builder unshareIntervalUnit(java.lang.String unshareIntervalUnit) {
            this.unshareIntervalUnit = unshareIntervalUnit;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsScheduleShareRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsScheduleShareRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsScheduleShareRule {
        private final java.util.List<java.lang.String> targetAccounts;
        private final java.lang.Number unshareInterval;
        private final java.lang.String unshareIntervalUnit;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.targetAccounts = software.amazon.jsii.Kernel.get(this, "targetAccounts", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.unshareInterval = software.amazon.jsii.Kernel.get(this, "unshareInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.unshareIntervalUnit = software.amazon.jsii.Kernel.get(this, "unshareIntervalUnit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.targetAccounts = java.util.Objects.requireNonNull(builder.targetAccounts, "targetAccounts is required");
            this.unshareInterval = builder.unshareInterval;
            this.unshareIntervalUnit = builder.unshareIntervalUnit;
        }

        @Override
        public final java.util.List<java.lang.String> getTargetAccounts() {
            return this.targetAccounts;
        }

        @Override
        public final java.lang.Number getUnshareInterval() {
            return this.unshareInterval;
        }

        @Override
        public final java.lang.String getUnshareIntervalUnit() {
            return this.unshareIntervalUnit;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("targetAccounts", om.valueToTree(this.getTargetAccounts()));
            if (this.getUnshareInterval() != null) {
                data.set("unshareInterval", om.valueToTree(this.getUnshareInterval()));
            }
            if (this.getUnshareIntervalUnit() != null) {
                data.set("unshareIntervalUnit", om.valueToTree(this.getUnshareIntervalUnit()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsScheduleShareRule.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsScheduleShareRule.Jsii$Proxy) o;

            if (!targetAccounts.equals(that.targetAccounts)) return false;
            if (this.unshareInterval != null ? !this.unshareInterval.equals(that.unshareInterval) : that.unshareInterval != null) return false;
            return this.unshareIntervalUnit != null ? this.unshareIntervalUnit.equals(that.unshareIntervalUnit) : that.unshareIntervalUnit == null;
        }

        @Override
        public final int hashCode() {
            int result = this.targetAccounts.hashCode();
            result = 31 * result + (this.unshareInterval != null ? this.unshareInterval.hashCode() : 0);
            result = 31 * result + (this.unshareIntervalUnit != null ? this.unshareIntervalUnit.hashCode() : 0);
            return result;
        }
    }
}
