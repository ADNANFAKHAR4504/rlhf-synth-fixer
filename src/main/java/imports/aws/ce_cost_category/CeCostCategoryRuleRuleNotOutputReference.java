package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleRuleNotOutputReference")
public class CeCostCategoryRuleRuleNotOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeCostCategoryRuleRuleNotOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeCostCategoryRuleRuleNotOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CeCostCategoryRuleRuleNotOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAnd>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAnd> __cast_cd4240 = (java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAnd>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAnd __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAnd", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putCostCategory(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotCostCategory value) {
        software.amazon.jsii.Kernel.call(this, "putCostCategory", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDimension(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotDimension value) {
        software.amazon.jsii.Kernel.call(this, "putDimension", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNot(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNot value) {
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
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOr>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOr> __cast_cd4240 = (java.util.List<imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOr>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOr __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOr", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTags(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotTags value) {
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

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAndList getAnd() {
        return software.amazon.jsii.Kernel.get(this, "and", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotAndList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotCostCategoryOutputReference getCostCategory() {
        return software.amazon.jsii.Kernel.get(this, "costCategory", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotCostCategoryOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotDimensionOutputReference getDimension() {
        return software.amazon.jsii.Kernel.get(this, "dimension", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotDimensionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotOutputReference getNot() {
        return software.amazon.jsii.Kernel.get(this, "not", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNotOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOrList getOr() {
        return software.amazon.jsii.Kernel.get(this, "or", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotOrList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotTagsOutputReference getTags() {
        return software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotTagsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAndInput() {
        return software.amazon.jsii.Kernel.get(this, "andInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotCostCategory getCostCategoryInput() {
        return software.amazon.jsii.Kernel.get(this, "costCategoryInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotCostCategory.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotDimension getDimensionInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotDimension.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNot getNotInput() {
        return software.amazon.jsii.Kernel.get(this, "notInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotNot.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOrInput() {
        return software.amazon.jsii.Kernel.get(this, "orInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotTags getTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNotTags.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRuleNot value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
