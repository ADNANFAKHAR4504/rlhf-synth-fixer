package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetAutoAdjustDataOutputReference")
public class BudgetsBudgetAutoAdjustDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetAutoAdjustDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetAutoAdjustDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetAutoAdjustDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHistoricalOptions(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions value) {
        software.amazon.jsii.Kernel.call(this, "putHistoricalOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHistoricalOptions() {
        software.amazon.jsii.Kernel.call(this, "resetHistoricalOptions", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference getHistoricalOptions() {
        return software.amazon.jsii.Kernel.get(this, "historicalOptions", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastAutoAdjustTime() {
        return software.amazon.jsii.Kernel.get(this, "lastAutoAdjustTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoAdjustTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "autoAdjustTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions getHistoricalOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "historicalOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoAdjustType() {
        return software.amazon.jsii.Kernel.get(this, "autoAdjustType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoAdjustType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoAdjustType", java.util.Objects.requireNonNull(value, "autoAdjustType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
