package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleOutputReference")
public class CeCostCategoryRuleOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeCostCategoryRuleOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeCostCategoryRuleOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public CeCostCategoryRuleOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putInheritedValue(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue value) {
        software.amazon.jsii.Kernel.call(this, "putInheritedValue", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRule(final @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRule value) {
        software.amazon.jsii.Kernel.call(this, "putRule", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetInheritedValue() {
        software.amazon.jsii.Kernel.call(this, "resetInheritedValue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRule() {
        software.amazon.jsii.Kernel.call(this, "resetRule", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValue() {
        software.amazon.jsii.Kernel.call(this, "resetValue", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValueOutputReference getInheritedValue() {
        return software.amazon.jsii.Kernel.get(this, "inheritedValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValueOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ce_cost_category.CeCostCategoryRuleRuleOutputReference getRule() {
        return software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRuleOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue getInheritedValueInput() {
        return software.amazon.jsii.Kernel.get(this, "inheritedValueInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleRule getRuleInput() {
        return software.amazon.jsii.Kernel.get(this, "ruleInput", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleRule.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValueInput() {
        return software.amazon.jsii.Kernel.get(this, "valueInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValue() {
        return software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValue(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "value", java.util.Objects.requireNonNull(value, "value is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRule value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
