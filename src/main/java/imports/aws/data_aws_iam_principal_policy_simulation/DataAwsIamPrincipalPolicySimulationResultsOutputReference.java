package imports.aws.data_aws_iam_principal_policy_simulation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.674Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsIamPrincipalPolicySimulation.DataAwsIamPrincipalPolicySimulationResultsOutputReference")
public class DataAwsIamPrincipalPolicySimulationResultsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsIamPrincipalPolicySimulationResultsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsIamPrincipalPolicySimulationResultsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsIamPrincipalPolicySimulationResultsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActionName() {
        return software.amazon.jsii.Kernel.get(this, "actionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getAllowed() {
        return software.amazon.jsii.Kernel.get(this, "allowed", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDecision() {
        return software.amazon.jsii.Kernel.get(this, "decision", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getDecisionDetails() {
        return software.amazon.jsii.Kernel.get(this, "decisionDetails", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList getMatchedStatements() {
        return software.amazon.jsii.Kernel.get(this, "matchedStatements", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResultsMatchedStatementsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getMissingContextKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "missingContextKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourceArn() {
        return software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResults getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResults.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_iam_principal_policy_simulation.DataAwsIamPrincipalPolicySimulationResults value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
