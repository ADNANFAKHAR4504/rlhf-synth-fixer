package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.006Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEncrypted();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target DlmLifecyclePolicy#target}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTarget();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cmk_arn DlmLifecyclePolicy#cmk_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCmkArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTags() {
        return null;
    }

    /**
     * deprecate_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#deprecate_rule DlmLifecyclePolicy#deprecate_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule getDeprecateRule() {
        return null;
    }

    /**
     * retain_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule getRetainRule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule> {
        java.lang.Object encrypted;
        java.lang.String target;
        java.lang.String cmkArn;
        java.lang.Object copyTags;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule deprecateRule;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule retainRule;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}. This parameter is required.
         * @return {@code this}
         */
        public Builder encrypted(java.lang.Boolean encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getEncrypted}
         * @param encrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#encrypted DlmLifecyclePolicy#encrypted}. This parameter is required.
         * @return {@code this}
         */
        public Builder encrypted(com.hashicorp.cdktf.IResolvable encrypted) {
            this.encrypted = encrypted;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#target DlmLifecyclePolicy#target}. This parameter is required.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getCmkArn}
         * @param cmkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cmk_arn DlmLifecyclePolicy#cmk_arn}.
         * @return {@code this}
         */
        public Builder cmkArn(java.lang.String cmkArn) {
            this.cmkArn = cmkArn;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(java.lang.Boolean copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(com.hashicorp.cdktf.IResolvable copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getDeprecateRule}
         * @param deprecateRule deprecate_rule block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#deprecate_rule DlmLifecyclePolicy#deprecate_rule}
         * @return {@code this}
         */
        public Builder deprecateRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule deprecateRule) {
            this.deprecateRule = deprecateRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule#getRetainRule}
         * @param retainRule retain_rule block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
         * @return {@code this}
         */
        public Builder retainRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule retainRule) {
            this.retainRule = retainRule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule {
        private final java.lang.Object encrypted;
        private final java.lang.String target;
        private final java.lang.String cmkArn;
        private final java.lang.Object copyTags;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule deprecateRule;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule retainRule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.encrypted = software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cmkArn = software.amazon.jsii.Kernel.get(this, "cmkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTags = software.amazon.jsii.Kernel.get(this, "copyTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deprecateRule = software.amazon.jsii.Kernel.get(this, "deprecateRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule.class));
            this.retainRule = software.amazon.jsii.Kernel.get(this, "retainRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.encrypted = java.util.Objects.requireNonNull(builder.encrypted, "encrypted is required");
            this.target = java.util.Objects.requireNonNull(builder.target, "target is required");
            this.cmkArn = builder.cmkArn;
            this.copyTags = builder.copyTags;
            this.deprecateRule = builder.deprecateRule;
            this.retainRule = builder.retainRule;
        }

        @Override
        public final java.lang.Object getEncrypted() {
            return this.encrypted;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.String getCmkArn() {
            return this.cmkArn;
        }

        @Override
        public final java.lang.Object getCopyTags() {
            return this.copyTags;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleDeprecateRule getDeprecateRule() {
            return this.deprecateRule;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRuleRetainRule getRetainRule() {
            return this.retainRule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("encrypted", om.valueToTree(this.getEncrypted()));
            data.set("target", om.valueToTree(this.getTarget()));
            if (this.getCmkArn() != null) {
                data.set("cmkArn", om.valueToTree(this.getCmkArn()));
            }
            if (this.getCopyTags() != null) {
                data.set("copyTags", om.valueToTree(this.getCopyTags()));
            }
            if (this.getDeprecateRule() != null) {
                data.set("deprecateRule", om.valueToTree(this.getDeprecateRule()));
            }
            if (this.getRetainRule() != null) {
                data.set("retainRule", om.valueToTree(this.getRetainRule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule.Jsii$Proxy) o;

            if (!encrypted.equals(that.encrypted)) return false;
            if (!target.equals(that.target)) return false;
            if (this.cmkArn != null ? !this.cmkArn.equals(that.cmkArn) : that.cmkArn != null) return false;
            if (this.copyTags != null ? !this.copyTags.equals(that.copyTags) : that.copyTags != null) return false;
            if (this.deprecateRule != null ? !this.deprecateRule.equals(that.deprecateRule) : that.deprecateRule != null) return false;
            return this.retainRule != null ? this.retainRule.equals(that.retainRule) : that.retainRule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.encrypted.hashCode();
            result = 31 * result + (this.target.hashCode());
            result = 31 * result + (this.cmkArn != null ? this.cmkArn.hashCode() : 0);
            result = 31 * result + (this.copyTags != null ? this.copyTags.hashCode() : 0);
            result = 31 * result + (this.deprecateRule != null ? this.deprecateRule.hashCode() : 0);
            result = 31 * result + (this.retainRule != null ? this.retainRule.hashCode() : 0);
            return result;
        }
    }
}
