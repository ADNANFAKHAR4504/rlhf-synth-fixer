package imports.aws.guardduty_detector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.316Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyDetector.GuarddutyDetectorDatasourcesKubernetesOutputReference")
public class GuarddutyDetectorDatasourcesKubernetesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GuarddutyDetectorDatasourcesKubernetesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GuarddutyDetectorDatasourcesKubernetesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GuarddutyDetectorDatasourcesKubernetesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAuditLogs(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesAuditLogs value) {
        software.amazon.jsii.Kernel.call(this, "putAuditLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesAuditLogsOutputReference getAuditLogs() {
        return software.amazon.jsii.Kernel.get(this, "auditLogs", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesAuditLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesAuditLogs getAuditLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "auditLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesAuditLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
