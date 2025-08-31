package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference")
public class BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "policyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTargetIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "targetIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicyId() {
        return software.amazon.jsii.Kernel.get(this, "policyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policyId", java.util.Objects.requireNonNull(value, "policyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTargetIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "targetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTargetIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "targetIds", java.util.Objects.requireNonNull(value, "targetIds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
