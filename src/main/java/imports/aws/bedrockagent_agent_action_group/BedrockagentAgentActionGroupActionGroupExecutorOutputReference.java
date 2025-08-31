package imports.aws.bedrockagent_agent_action_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentAgentActionGroup.BedrockagentAgentActionGroupActionGroupExecutorOutputReference")
public class BedrockagentAgentActionGroupActionGroupExecutorOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected BedrockagentAgentActionGroupActionGroupExecutorOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected BedrockagentAgentActionGroupActionGroupExecutorOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public BedrockagentAgentActionGroupActionGroupExecutorOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetCustomControl() {
        software.amazon.jsii.Kernel.call(this, "resetCustomControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambda() {
        software.amazon.jsii.Kernel.call(this, "resetLambda", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomControlInput() {
        return software.amazon.jsii.Kernel.get(this, "customControlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomControl() {
        return software.amazon.jsii.Kernel.get(this, "customControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomControl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customControl", java.util.Objects.requireNonNull(value, "customControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambda() {
        return software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambda(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambda", java.util.Objects.requireNonNull(value, "lambda is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.bedrockagent_agent_action_group.BedrockagentAgentActionGroupActionGroupExecutor value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
