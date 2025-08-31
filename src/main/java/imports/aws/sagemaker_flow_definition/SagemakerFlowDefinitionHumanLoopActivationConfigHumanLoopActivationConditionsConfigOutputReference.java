package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.325Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfigOutputReference")
public class SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHumanLoopActivationConditionsInput() {
        return software.amazon.jsii.Kernel.get(this, "humanLoopActivationConditionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHumanLoopActivationConditions() {
        return software.amazon.jsii.Kernel.get(this, "humanLoopActivationConditions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHumanLoopActivationConditions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "humanLoopActivationConditions", java.util.Objects.requireNonNull(value, "humanLoopActivationConditions is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfigHumanLoopActivationConditionsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
