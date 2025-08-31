package imports.aws.sfn_state_machine;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.465Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sfnStateMachine.SfnStateMachineLoggingConfigurationOutputReference")
public class SfnStateMachineLoggingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SfnStateMachineLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SfnStateMachineLoggingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SfnStateMachineLoggingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIncludeExecutionData() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeExecutionData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLevel() {
        software.amazon.jsii.Kernel.call(this, "resetLevel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogDestination() {
        software.amazon.jsii.Kernel.call(this, "resetLogDestination", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeExecutionDataInput() {
        return software.amazon.jsii.Kernel.get(this, "includeExecutionDataInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLevelInput() {
        return software.amazon.jsii.Kernel.get(this, "levelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLogDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "logDestinationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeExecutionData() {
        return software.amazon.jsii.Kernel.get(this, "includeExecutionData", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeExecutionData(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeExecutionData", java.util.Objects.requireNonNull(value, "includeExecutionData is required"));
    }

    public void setIncludeExecutionData(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeExecutionData", java.util.Objects.requireNonNull(value, "includeExecutionData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLevel() {
        return software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLevel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "level", java.util.Objects.requireNonNull(value, "level is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLogDestination() {
        return software.amazon.jsii.Kernel.get(this, "logDestination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLogDestination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "logDestination", java.util.Objects.requireNonNull(value, "logDestination is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sfn_state_machine.SfnStateMachineLoggingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sfn_state_machine.SfnStateMachineLoggingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sfn_state_machine.SfnStateMachineLoggingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
