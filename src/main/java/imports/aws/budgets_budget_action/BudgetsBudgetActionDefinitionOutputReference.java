package imports.aws.budgets_budget_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.186Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudgetAction.BudgetsBudgetActionDefinitionOutputReference")
public class BudgetsBudgetActionDefinitionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BudgetsBudgetActionDefinitionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BudgetsBudgetActionDefinitionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public BudgetsBudgetActionDefinitionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putIamActionDefinition(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition value) {
        software.amazon.jsii.Kernel.call(this, "putIamActionDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putScpActionDefinition(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition value) {
        software.amazon.jsii.Kernel.call(this, "putScpActionDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSsmActionDefinition(final @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition value) {
        software.amazon.jsii.Kernel.call(this, "putSsmActionDefinition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetIamActionDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetIamActionDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScpActionDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetScpActionDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSsmActionDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetSsmActionDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinitionOutputReference getIamActionDefinition() {
        return software.amazon.jsii.Kernel.get(this, "iamActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinitionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference getScpActionDefinition() {
        return software.amazon.jsii.Kernel.get(this, "scpActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinitionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinitionOutputReference getSsmActionDefinition() {
        return software.amazon.jsii.Kernel.get(this, "ssmActionDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinitionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition getIamActionDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "iamActionDefinitionInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionIamActionDefinition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition getScpActionDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "scpActionDefinitionInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionScpActionDefinition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition getSsmActionDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "ssmActionDefinitionInput", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinitionSsmActionDefinition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.budgets_budget_action.BudgetsBudgetActionDefinition value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
