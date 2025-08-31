package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.328Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionHumanLoopConfigOutputReference")
public class SagemakerFlowDefinitionHumanLoopConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerFlowDefinitionHumanLoopConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerFlowDefinitionHumanLoopConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerFlowDefinitionHumanLoopConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPublicWorkforceTaskPrice(final @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice value) {
        software.amazon.jsii.Kernel.call(this, "putPublicWorkforceTaskPrice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPublicWorkforceTaskPrice() {
        software.amazon.jsii.Kernel.call(this, "resetPublicWorkforceTaskPrice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskAvailabilityLifetimeInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTaskAvailabilityLifetimeInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskKeywords() {
        software.amazon.jsii.Kernel.call(this, "resetTaskKeywords", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTaskTimeLimitInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTaskTimeLimitInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference getPublicWorkforceTaskPrice() {
        return software.amazon.jsii.Kernel.get(this, "publicWorkforceTaskPrice", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPriceOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHumanTaskUiArnInput() {
        return software.amazon.jsii.Kernel.get(this, "humanTaskUiArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice getPublicWorkforceTaskPriceInput() {
        return software.amazon.jsii.Kernel.get(this, "publicWorkforceTaskPriceInput", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfigPublicWorkforceTaskPrice.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTaskAvailabilityLifetimeInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "taskAvailabilityLifetimeInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTaskCountInput() {
        return software.amazon.jsii.Kernel.get(this, "taskCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "taskDescriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTaskKeywordsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "taskKeywordsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTaskTimeLimitInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "taskTimeLimitInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTaskTitleInput() {
        return software.amazon.jsii.Kernel.get(this, "taskTitleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getWorkteamArnInput() {
        return software.amazon.jsii.Kernel.get(this, "workteamArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHumanTaskUiArn() {
        return software.amazon.jsii.Kernel.get(this, "humanTaskUiArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHumanTaskUiArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "humanTaskUiArn", java.util.Objects.requireNonNull(value, "humanTaskUiArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTaskAvailabilityLifetimeInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "taskAvailabilityLifetimeInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTaskAvailabilityLifetimeInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "taskAvailabilityLifetimeInSeconds", java.util.Objects.requireNonNull(value, "taskAvailabilityLifetimeInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTaskCount() {
        return software.amazon.jsii.Kernel.get(this, "taskCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTaskCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "taskCount", java.util.Objects.requireNonNull(value, "taskCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskDescription() {
        return software.amazon.jsii.Kernel.get(this, "taskDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskDescription", java.util.Objects.requireNonNull(value, "taskDescription is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTaskKeywords() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "taskKeywords", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTaskKeywords(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "taskKeywords", java.util.Objects.requireNonNull(value, "taskKeywords is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTaskTimeLimitInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "taskTimeLimitInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTaskTimeLimitInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "taskTimeLimitInSeconds", java.util.Objects.requireNonNull(value, "taskTimeLimitInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTaskTitle() {
        return software.amazon.jsii.Kernel.get(this, "taskTitle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTaskTitle(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "taskTitle", java.util.Objects.requireNonNull(value, "taskTitle is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getWorkteamArn() {
        return software.amazon.jsii.Kernel.get(this, "workteamArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setWorkteamArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "workteamArn", java.util.Objects.requireNonNull(value, "workteamArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
