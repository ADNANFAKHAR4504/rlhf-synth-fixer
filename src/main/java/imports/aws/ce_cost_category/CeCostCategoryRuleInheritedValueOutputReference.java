package imports.aws.ce_cost_category;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.192Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ceCostCategory.CeCostCategoryRuleInheritedValueOutputReference")
public class CeCostCategoryRuleInheritedValueOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CeCostCategoryRuleInheritedValueOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CeCostCategoryRuleInheritedValueOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CeCostCategoryRuleInheritedValueOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDimensionKey() {
        software.amazon.jsii.Kernel.call(this, "resetDimensionKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDimensionName() {
        software.amazon.jsii.Kernel.call(this, "resetDimensionName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDimensionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dimensionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionKey() {
        return software.amazon.jsii.Kernel.get(this, "dimensionKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionKey", java.util.Objects.requireNonNull(value, "dimensionKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDimensionName() {
        return software.amazon.jsii.Kernel.get(this, "dimensionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDimensionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dimensionName", java.util.Objects.requireNonNull(value, "dimensionName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ce_cost_category.CeCostCategoryRuleInheritedValue value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
