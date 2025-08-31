package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy extends software.amazon.jsii.JsiiSerializable {

    /**
     * encryption_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encryption_configuration DlmLifecyclePolicy#encryption_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration getEncryptionConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target DlmLifecyclePolicy#target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTarget();

    /**
     * retain_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule getRetainRule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy> {
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration encryptionConfiguration;
        java.lang.String target;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule retainRule;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy#getEncryptionConfiguration}
         * @param encryptionConfiguration encryption_configuration block. This parameter is required.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encryption_configuration DlmLifecyclePolicy#encryption_configuration}
         * @return {@code this}
         */
        public Builder encryptionConfiguration(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration encryptionConfiguration) {
            this.encryptionConfiguration = encryptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target DlmLifecyclePolicy#target}. This parameter is required.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy#getRetainRule}
         * @param retainRule retain_rule block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
         * @return {@code this}
         */
        public Builder retainRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule retainRule) {
            this.retainRule = retainRule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy {
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration encryptionConfiguration;
        private final java.lang.String target;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule retainRule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encryptionConfiguration = software.amazon.jsii.Kernel.get(this, "encryptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retainRule = software.amazon.jsii.Kernel.get(this, "retainRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encryptionConfiguration = java.util.Objects.requireNonNull(builder.encryptionConfiguration, "encryptionConfiguration is required");
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.retainRule = builder.retainRule;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyEncryptionConfiguration getEncryptionConfiguration() {
            return this.encryptionConfiguration;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopyRetainRule getRetainRule() {
            return this.retainRule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("encryptionConfiguration", om.valueToTree(this.getEncryptionConfiguration()));
            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getRetainRule() != null) {
                data.set("retainRule", om.valueToTree(this.getRetainRule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsActionCrossRegionCopy.Jsii$Proxy) o;

            if (!encryptionConfiguration.equals(that.encryptionConfiguration)) return false;
            if (!target.equals(that.target)) return false;
            return this.retainRule != null ? this.retainRule.equals(that.retainRule) : that.retainRule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encryptionConfiguration.hashCode();
            result = 31 * result + (this.target.hashCode());
            result = 31 * result + (this.retainRule != null ? this.retainRule.hashCode() : 0);
            return result;
        }
    }
}
