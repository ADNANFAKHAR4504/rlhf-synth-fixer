package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.200Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleOutputReference")
public class CeCostCategoryRuleRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeCostCategoryRuleRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeCostCategoryRuleRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CeCostCategoryRuleRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAnd(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleAnd>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleAnd> __cast_cd4240 = (java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleAnd>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ce_cost_category.CeCostCategoryRuleRuleAnd __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAnd", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCostCategory(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleCostCategory value) {
        software.amazon.jsii.Kernel.call(this, "putCostCategory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDimension(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleDimension value) {
        software.amazon.jsii.Kernel.call(this, "putDimension", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNot(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot value) {
        software.amazon.jsii.Kernel.call(this, "putNot", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOr(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleOr>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleOr> __cast_cd4240 = (java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleOr>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ce_cost_category.CeCostCategoryRuleRuleOr __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOr", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTags(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleTags value) {
        software.amazon.jsii.Kernel.call(this, "putTags", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAnd() {
        software.amazon.jsii.Kernel.call(this, "resetAnd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCostCategory() {
        software.amazon.jsii.Kernel.call(this, "resetCostCategory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimension() {
        software.amazon.jsii.Kernel.call(this, "resetDimension", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNot() {
        software.amazon.jsii.Kernel.call(this, "resetNot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOr() {
        software.amazon.jsii.Kernel.call(this, "resetOr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndList getAnd() {
        return software.amazon.jsii.Kernel.get(this, "and", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleAndList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleCostCategoryOutputReference getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleCostCategoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleDimensionOutputReference getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleDimensionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOutputReference getNot() {
        return software.amazon.jsii.Kernel.get(this, "not", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrList getOr() {
        return software.amazon.jsii.Kernel.get(this, "or", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOrList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleTagsOutputReference getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAndInput() {
        return software.amazon.jsii.Kernel.get(this, "andInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleCostCategory getCostCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "costCategoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleCostCategory.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleDimension getDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleDimension.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot getNotInput() {
        return software.amazon.jsii.Kernel.get(this, "notInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOrInput() {
        return software.amazon.jsii.Kernel.get(this, "orInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleTags getTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleTags.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRule getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRule.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
