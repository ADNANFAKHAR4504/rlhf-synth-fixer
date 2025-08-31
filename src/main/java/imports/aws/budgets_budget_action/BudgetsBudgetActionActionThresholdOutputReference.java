package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionActionThresholdOutputReference")
public class BudgetsBudgetActionActionThresholdOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetActionActionThresholdOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetActionActionThresholdOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetActionActionThresholdOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionThresholdTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "actionThresholdTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getActionThresholdValueInput() {
        return software.amazon.jsii.Kernel.get(this, "actionThresholdValueInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionThresholdType() {
        return software.amazon.jsii.Kernel.get(this, "actionThresholdType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActionThresholdType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "actionThresholdType", java.util.Objects.requireNonNull(value, "actionThresholdType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getActionThresholdValue() {
        return software.amazon.jsii.Kernel.get(this, "actionThresholdValue", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setActionThresholdValue(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "actionThresholdValue", java.util.Objects.requireNonNull(value, "actionThresholdValue is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionActionThreshold value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
