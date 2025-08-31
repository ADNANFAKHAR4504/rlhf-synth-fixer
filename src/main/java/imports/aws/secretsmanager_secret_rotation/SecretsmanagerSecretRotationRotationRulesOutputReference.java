package imports.aws.secretsmanager_secret_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.secretsmanagerSecretRotation.SecretsmanagerSecretRotationRotationRulesOutputReference")
public class SecretsmanagerSecretRotationRotationRulesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecretsmanagerSecretRotationRotationRulesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecretsmanagerSecretRotationRotationRulesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SecretsmanagerSecretRotationRotationRulesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAutomaticallyAfterDays() {
        software.amazon.jsii.Kernel.call(this, "resetAutomaticallyAfterDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDuration() {
        software.amazon.jsii.Kernel.call(this, "resetDuration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetScheduleExpression() {
        software.amazon.jsii.Kernel.call(this, "resetScheduleExpression", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticallyAfterDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "automaticallyAfterDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDurationInput() {
        return software.amazon.jsii.Kernel.get(this, "durationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getScheduleExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAutomaticallyAfterDays() {
        return software.amazon.jsii.Kernel.get(this, "automaticallyAfterDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAutomaticallyAfterDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "automaticallyAfterDays", java.util.Objects.requireNonNull(value, "automaticallyAfterDays is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDuration() {
        return software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDuration(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "duration", java.util.Objects.requireNonNull(value, "duration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getScheduleExpression() {
        return software.amazon.jsii.Kernel.get(this, "scheduleExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setScheduleExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "scheduleExpression", java.util.Objects.requireNonNull(value, "scheduleExpression is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.secretsmanager_secret_rotation.SecretsmanagerSecretRotationRotationRules getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.secretsmanager_secret_rotation.SecretsmanagerSecretRotationRotationRules.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.secretsmanager_secret_rotation.SecretsmanagerSecretRotationRotationRules value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
