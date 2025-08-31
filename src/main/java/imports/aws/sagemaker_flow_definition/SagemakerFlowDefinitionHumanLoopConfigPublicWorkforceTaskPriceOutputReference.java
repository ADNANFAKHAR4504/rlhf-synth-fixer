package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference")
public class SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAmountInUsd(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd value) {
        software.amazon.jsii.Kernel.call(this, "putAmountInUsd", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAmountInUsd() {
        software.amazon.jsii.Kernel.call(this, "resetAmountInUsd", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsdOutputReference getAmountInUsd() {
        return software.amazon.jsii.Kernel.get(this, "amountInUsd", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsdOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd getAmountInUsdInput() {
        return software.amazon.jsii.Kernel.get(this, "amountInUsdInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceAmountInUsd.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
