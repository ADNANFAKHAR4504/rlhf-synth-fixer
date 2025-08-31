package imports.aws.redshift_scheduled_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.166Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftScheduledAction.RedshiftScheduledActionTargetActionOutputReference")
public class RedshiftScheduledActionTargetActionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RedshiftScheduledActionTargetActionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftScheduledActionTargetActionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RedshiftScheduledActionTargetActionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putPauseCluster(final @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionPauseCluster value) {
        software.amazon.jsii.Kernel.call(this, "putPauseCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResizeCluster(final @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResizeCluster value) {
        software.amazon.jsii.Kernel.call(this, "putResizeCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putResumeCluster(final @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResumeCluster value) {
        software.amazon.jsii.Kernel.call(this, "putResumeCluster", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetPauseCluster() {
        software.amazon.jsii.Kernel.call(this, "resetPauseCluster", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResizeCluster() {
        software.amazon.jsii.Kernel.call(this, "resetResizeCluster", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResumeCluster() {
        software.amazon.jsii.Kernel.call(this, "resetResumeCluster", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionPauseClusterOutputReference getPauseCluster() {
        return software.amazon.jsii.Kernel.get(this, "pauseCluster", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionPauseClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResizeClusterOutputReference getResizeCluster() {
        return software.amazon.jsii.Kernel.get(this, "resizeCluster", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResizeClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResumeClusterOutputReference getResumeCluster() {
        return software.amazon.jsii.Kernel.get(this, "resumeCluster", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResumeClusterOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionPauseCluster getPauseClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "pauseClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionPauseCluster.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResizeCluster getResizeClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "resizeClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResizeCluster.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResumeCluster getResumeClusterInput() {
        return software.amazon.jsii.Kernel.get(this, "resumeClusterInput", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetActionResumeCluster.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetAction getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetAction.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.redshift_scheduled_action.RedshiftScheduledActionTargetAction value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
