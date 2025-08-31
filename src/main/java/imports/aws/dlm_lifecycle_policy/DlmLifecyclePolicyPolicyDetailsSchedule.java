package imports.aws.dlm_lifecycle_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.005Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsSchedule")
@software.amazon.jsii.Jsii.Proxy(DlmLifecyclePolicyPolicyDetailsSchedule.Jsii$Proxy.class)
public interface DlmLifecyclePolicyPolicyDetailsSchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * create_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#create_rule DlmLifecyclePolicy#create_rule}
     */
    @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule getCreateRule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#name DlmLifecyclePolicy#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * retain_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
     */
    @org.jetbrains.annotations.NotNull imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule getRetainRule();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTags() {
        return null;
    }

    /**
     * cross_region_copy_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy_rule DlmLifecyclePolicy#cross_region_copy_rule}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCrossRegionCopyRule() {
        return null;
    }

    /**
     * deprecate_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#deprecate_rule DlmLifecyclePolicy#deprecate_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule getDeprecateRule() {
        return null;
    }

    /**
     * fast_restore_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#fast_restore_rule DlmLifecyclePolicy#fast_restore_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule getFastRestoreRule() {
        return null;
    }

    /**
     * share_rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#share_rule DlmLifecyclePolicy#share_rule}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule getShareRule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#tags_to_add DlmLifecyclePolicy#tags_to_add}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsToAdd() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#variable_tags DlmLifecyclePolicy#variable_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVariableTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DlmLifecyclePolicyPolicyDetailsSchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DlmLifecyclePolicyPolicyDetailsSchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DlmLifecyclePolicyPolicyDetailsSchedule> {
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule createRule;
        java.lang.String name;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule retainRule;
        java.lang.Object copyTags;
        java.lang.Object crossRegionCopyRule;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule deprecateRule;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule fastRestoreRule;
        imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule shareRule;
        java.util.Map<java.lang.String, java.lang.String> tagsToAdd;
        java.util.Map<java.lang.String, java.lang.String> variableTags;

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getCreateRule}
         * @param createRule create_rule block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#create_rule DlmLifecyclePolicy#create_rule}
         * @return {@code this}
         */
        public Builder createRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule createRule) {
            this.createRule = createRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#name DlmLifecyclePolicy#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getRetainRule}
         * @param retainRule retain_rule block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#retain_rule DlmLifecyclePolicy#retain_rule}
         * @return {@code this}
         */
        public Builder retainRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule retainRule) {
            this.retainRule = retainRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(java.lang.Boolean copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getCopyTags}
         * @param copyTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#copy_tags DlmLifecyclePolicy#copy_tags}.
         * @return {@code this}
         */
        public Builder copyTags(com.hashicorp.cdktf.IResolvable copyTags) {
            this.copyTags = copyTags;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getCrossRegionCopyRule}
         * @param crossRegionCopyRule cross_region_copy_rule block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy_rule DlmLifecyclePolicy#cross_region_copy_rule}
         * @return {@code this}
         */
        public Builder crossRegionCopyRule(com.hashicorp.cdktf.IResolvable crossRegionCopyRule) {
            this.crossRegionCopyRule = crossRegionCopyRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getCrossRegionCopyRule}
         * @param crossRegionCopyRule cross_region_copy_rule block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#cross_region_copy_rule DlmLifecyclePolicy#cross_region_copy_rule}
         * @return {@code this}
         */
        public Builder crossRegionCopyRule(java.util.List<? extends imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCrossRegionCopyRule> crossRegionCopyRule) {
            this.crossRegionCopyRule = crossRegionCopyRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getDeprecateRule}
         * @param deprecateRule deprecate_rule block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#deprecate_rule DlmLifecyclePolicy#deprecate_rule}
         * @return {@code this}
         */
        public Builder deprecateRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule deprecateRule) {
            this.deprecateRule = deprecateRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getFastRestoreRule}
         * @param fastRestoreRule fast_restore_rule block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#fast_restore_rule DlmLifecyclePolicy#fast_restore_rule}
         * @return {@code this}
         */
        public Builder fastRestoreRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule fastRestoreRule) {
            this.fastRestoreRule = fastRestoreRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getShareRule}
         * @param shareRule share_rule block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#share_rule DlmLifecyclePolicy#share_rule}
         * @return {@code this}
         */
        public Builder shareRule(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule shareRule) {
            this.shareRule = shareRule;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getTagsToAdd}
         * @param tagsToAdd Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#tags_to_add DlmLifecyclePolicy#tags_to_add}.
         * @return {@code this}
         */
        public Builder tagsToAdd(java.util.Map<java.lang.String, java.lang.String> tagsToAdd) {
            this.tagsToAdd = tagsToAdd;
            return this;
        }

        /**
         * Sets the value of {@link DlmLifecyclePolicyPolicyDetailsSchedule#getVariableTags}
         * @param variableTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dlm_lifecycle_policy#variable_tags DlmLifecyclePolicy#variable_tags}.
         * @return {@code this}
         */
        public Builder variableTags(java.util.Map<java.lang.String, java.lang.String> variableTags) {
            this.variableTags = variableTags;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DlmLifecyclePolicyPolicyDetailsSchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DlmLifecyclePolicyPolicyDetailsSchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DlmLifecyclePolicyPolicyDetailsSchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DlmLifecyclePolicyPolicyDetailsSchedule {
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule createRule;
        private final java.lang.String name;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule retainRule;
        private final java.lang.Object copyTags;
        private final java.lang.Object crossRegionCopyRule;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule deprecateRule;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule fastRestoreRule;
        private final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule shareRule;
        private final java.util.Map<java.lang.String, java.lang.String> tagsToAdd;
        private final java.util.Map<java.lang.String, java.lang.String> variableTags;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.createRule = software.amazon.jsii.Kernel.get(this, "createRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retainRule = software.amazon.jsii.Kernel.get(this, "retainRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule.class));
            this.copyTags = software.amazon.jsii.Kernel.get(this, "copyTags", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.crossRegionCopyRule = software.amazon.jsii.Kernel.get(this, "crossRegionCopyRule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.deprecateRule = software.amazon.jsii.Kernel.get(this, "deprecateRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule.class));
            this.fastRestoreRule = software.amazon.jsii.Kernel.get(this, "fastRestoreRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule.class));
            this.shareRule = software.amazon.jsii.Kernel.get(this, "shareRule", software.amazon.jsii.NativeType.forClass(imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule.class));
            this.tagsToAdd = software.amazon.jsii.Kernel.get(this, "tagsToAdd", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.variableTags = software.amazon.jsii.Kernel.get(this, "variableTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.createRule = java.util.Objects.requireNonNull(builder.createRule, "createRule is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.retainRule = java.util.Objects.requireNonNull(builder.retainRule, "retainRule is required");
            this.copyTags = builder.copyTags;
            this.crossRegionCopyRule = builder.crossRegionCopyRule;
            this.deprecateRule = builder.deprecateRule;
            this.fastRestoreRule = builder.fastRestoreRule;
            this.shareRule = builder.shareRule;
            this.tagsToAdd = builder.tagsToAdd;
            this.variableTags = builder.variableTags;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleCreateRule getCreateRule() {
            return this.createRule;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleRetainRule getRetainRule() {
            return this.retainRule;
        }

        @Override
        public final java.lang.Object getCopyTags() {
            return this.copyTags;
        }

        @Override
        public final java.lang.Object getCrossRegionCopyRule() {
            return this.crossRegionCopyRule;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleDeprecateRule getDeprecateRule() {
            return this.deprecateRule;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleFastRestoreRule getFastRestoreRule() {
            return this.fastRestoreRule;
        }

        @Override
        public final imports.aws.dlm_lifecycle_policy.DlmLifecyclePolicyPolicyDetailsScheduleShareRule getShareRule() {
            return this.shareRule;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsToAdd() {
            return this.tagsToAdd;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getVariableTags() {
            return this.variableTags;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("createRule", om.valueToTree(this.getCreateRule()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("retainRule", om.valueToTree(this.getRetainRule()));
            if (this.getCopyTags() != null) {
                data.set("copyTags", om.valueToTree(this.getCopyTags()));
            }
            if (this.getCrossRegionCopyRule() != null) {
                data.set("crossRegionCopyRule", om.valueToTree(this.getCrossRegionCopyRule()));
            }
            if (this.getDeprecateRule() != null) {
                data.set("deprecateRule", om.valueToTree(this.getDeprecateRule()));
            }
            if (this.getFastRestoreRule() != null) {
                data.set("fastRestoreRule", om.valueToTree(this.getFastRestoreRule()));
            }
            if (this.getShareRule() != null) {
                data.set("shareRule", om.valueToTree(this.getShareRule()));
            }
            if (this.getTagsToAdd() != null) {
                data.set("tagsToAdd", om.valueToTree(this.getTagsToAdd()));
            }
            if (this.getVariableTags() != null) {
                data.set("variableTags", om.valueToTree(this.getVariableTags()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dlmLifecyclePolicy.DlmLifecyclePolicyPolicyDetailsSchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DlmLifecyclePolicyPolicyDetailsSchedule.Jsii$Proxy that = (DlmLifecyclePolicyPolicyDetailsSchedule.Jsii$Proxy) o;

            if (!createRule.equals(that.createRule)) return false;
            if (!name.equals(that.name)) return false;
            if (!retainRule.equals(that.retainRule)) return false;
            if (this.copyTags != null ? !this.copyTags.equals(that.copyTags) : that.copyTags != null) return false;
            if (this.crossRegionCopyRule != null ? !this.crossRegionCopyRule.equals(that.crossRegionCopyRule) : that.crossRegionCopyRule != null) return false;
            if (this.deprecateRule != null ? !this.deprecateRule.equals(that.deprecateRule) : that.deprecateRule != null) return false;
            if (this.fastRestoreRule != null ? !this.fastRestoreRule.equals(that.fastRestoreRule) : that.fastRestoreRule != null) return false;
            if (this.shareRule != null ? !this.shareRule.equals(that.shareRule) : that.shareRule != null) return false;
            if (this.tagsToAdd != null ? !this.tagsToAdd.equals(that.tagsToAdd) : that.tagsToAdd != null) return false;
            return this.variableTags != null ? this.variableTags.equals(that.variableTags) : that.variableTags == null;
        }

        @Override
        public final int hashCode() {
            int result = this.createRule.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.retainRule.hashCode());
            result = 31 * result + (this.copyTags != null ? this.copyTags.hashCode() : 0);
            result = 31 * result + (this.crossRegionCopyRule != null ? this.crossRegionCopyRule.hashCode() : 0);
            result = 31 * result + (this.deprecateRule != null ? this.deprecateRule.hashCode() : 0);
            result = 31 * result + (this.fastRestoreRule != null ? this.fastRestoreRule.hashCode() : 0);
            result = 31 * result + (this.shareRule != null ? this.shareRule.hashCode() : 0);
            result = 31 * result + (this.tagsToAdd != null ? this.tagsToAdd.hashCode() : 0);
            result = 31 * result + (this.variableTags != null ? this.variableTags.hashCode() : 0);
            return result;
        }
    }
}
