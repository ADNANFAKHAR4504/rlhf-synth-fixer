package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailureOutputReference")
public class CodepipelineStageOnFailureOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CodepipelineStageOnFailureOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CodepipelineStageOnFailureOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CodepipelineStageOnFailureOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCondition(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureCondition value) {
        software.amazon.jsii.Kernel.call(this, "putCondition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetryConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRetryConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCondition() {
        software.amazon.jsii.Kernel.call(this, "resetCondition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResult() {
        software.amazon.jsii.Kernel.call(this, "resetResult", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetryConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRetryConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureConditionOutputReference getCondition() {
        return software.amazon.jsii.Kernel.get(this, "condition", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureConditionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfigurationOutputReference getRetryConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "retryConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureCondition getConditionInput() {
        return software.amazon.jsii.Kernel.get(this, "conditionInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureCondition.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResultInput() {
        return software.amazon.jsii.Kernel.get(this, "resultInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration getRetryConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "retryConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResult() {
        return software.amazon.jsii.Kernel.get(this, "result", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResult(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "result", java.util.Objects.requireNonNull(value, "result is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailure getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.codepipeline.CodepipelineStageOnFailure.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.codepipeline.CodepipelineStageOnFailure value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
