package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetCostTypesOutputReference")
public class BudgetsBudgetCostTypesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetCostTypesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetCostTypesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetCostTypesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIncludeCredit() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeCredit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeDiscount() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeDiscount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeOtherSubscription() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeOtherSubscription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeRecurring() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeRecurring", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeRefund() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeRefund", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeSubscription() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeSubscription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeSupport() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeTax() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeTax", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeUpfront() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeUpfront", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseAmortized() {
        software.amazon.jsii.Kernel.call(this, "resetUseAmortized", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseBlended() {
        software.amazon.jsii.Kernel.call(this, "resetUseBlended", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeCreditInput() {
        return software.amazon.jsii.Kernel.get(this, "includeCreditInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeDiscountInput() {
        return software.amazon.jsii.Kernel.get(this, "includeDiscountInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeOtherSubscriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "includeOtherSubscriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRecurringInput() {
        return software.amazon.jsii.Kernel.get(this, "includeRecurringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeRefundInput() {
        return software.amazon.jsii.Kernel.get(this, "includeRefundInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSubscriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "includeSubscriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "includeSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeTaxInput() {
        return software.amazon.jsii.Kernel.get(this, "includeTaxInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeUpfrontInput() {
        return software.amazon.jsii.Kernel.get(this, "includeUpfrontInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseAmortizedInput() {
        return software.amazon.jsii.Kernel.get(this, "useAmortizedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseBlendedInput() {
        return software.amazon.jsii.Kernel.get(this, "useBlendedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeCredit() {
        return software.amazon.jsii.Kernel.get(this, "includeCredit", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeCredit(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeCredit", java.util.Objects.requireNonNull(value, "includeCredit is required"));
    }

    public void setIncludeCredit(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeCredit", java.util.Objects.requireNonNull(value, "includeCredit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeDiscount() {
        return software.amazon.jsii.Kernel.get(this, "includeDiscount", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeDiscount(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeDiscount", java.util.Objects.requireNonNull(value, "includeDiscount is required"));
    }

    public void setIncludeDiscount(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeDiscount", java.util.Objects.requireNonNull(value, "includeDiscount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeOtherSubscription() {
        return software.amazon.jsii.Kernel.get(this, "includeOtherSubscription", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeOtherSubscription(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeOtherSubscription", java.util.Objects.requireNonNull(value, "includeOtherSubscription is required"));
    }

    public void setIncludeOtherSubscription(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeOtherSubscription", java.util.Objects.requireNonNull(value, "includeOtherSubscription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeRecurring() {
        return software.amazon.jsii.Kernel.get(this, "includeRecurring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeRecurring(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeRecurring", java.util.Objects.requireNonNull(value, "includeRecurring is required"));
    }

    public void setIncludeRecurring(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeRecurring", java.util.Objects.requireNonNull(value, "includeRecurring is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeRefund() {
        return software.amazon.jsii.Kernel.get(this, "includeRefund", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeRefund(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeRefund", java.util.Objects.requireNonNull(value, "includeRefund is required"));
    }

    public void setIncludeRefund(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeRefund", java.util.Objects.requireNonNull(value, "includeRefund is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeSubscription() {
        return software.amazon.jsii.Kernel.get(this, "includeSubscription", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeSubscription(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeSubscription", java.util.Objects.requireNonNull(value, "includeSubscription is required"));
    }

    public void setIncludeSubscription(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeSubscription", java.util.Objects.requireNonNull(value, "includeSubscription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeSupport() {
        return software.amazon.jsii.Kernel.get(this, "includeSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeSupport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeSupport", java.util.Objects.requireNonNull(value, "includeSupport is required"));
    }

    public void setIncludeSupport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeSupport", java.util.Objects.requireNonNull(value, "includeSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeTax() {
        return software.amazon.jsii.Kernel.get(this, "includeTax", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeTax(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeTax", java.util.Objects.requireNonNull(value, "includeTax is required"));
    }

    public void setIncludeTax(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeTax", java.util.Objects.requireNonNull(value, "includeTax is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeUpfront() {
        return software.amazon.jsii.Kernel.get(this, "includeUpfront", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeUpfront(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeUpfront", java.util.Objects.requireNonNull(value, "includeUpfront is required"));
    }

    public void setIncludeUpfront(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeUpfront", java.util.Objects.requireNonNull(value, "includeUpfront is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseAmortized() {
        return software.amazon.jsii.Kernel.get(this, "useAmortized", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseAmortized(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useAmortized", java.util.Objects.requireNonNull(value, "useAmortized is required"));
    }

    public void setUseAmortized(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useAmortized", java.util.Objects.requireNonNull(value, "useAmortized is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseBlended() {
        return software.amazon.jsii.Kernel.get(this, "useBlended", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseBlended(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useBlended", java.util.Objects.requireNonNull(value, "useBlended is required"));
    }

    public void setUseBlended(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useBlended", java.util.Objects.requireNonNull(value, "useBlended is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetCostTypes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget.BudgetsBudgetCostTypes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget.BudgetsBudgetCostTypes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
