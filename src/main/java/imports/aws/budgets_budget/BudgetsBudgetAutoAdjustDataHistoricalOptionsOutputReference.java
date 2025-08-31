package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.184Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference")
public class BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetAutoAdjustDataHistoricalOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLookbackAvailablePeriods() {
        return software.amazon.jsii.Kernel.get(this, "lookbackAvailablePeriods", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBudgetAdjustmentPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "budgetAdjustmentPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBudgetAdjustmentPeriod() {
        return software.amazon.jsii.Kernel.get(this, "budgetAdjustmentPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBudgetAdjustmentPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "budgetAdjustmentPeriod", java.util.Objects.requireNonNull(value, "budgetAdjustmentPeriod is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetAutoAdjustDataHistoricalOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
