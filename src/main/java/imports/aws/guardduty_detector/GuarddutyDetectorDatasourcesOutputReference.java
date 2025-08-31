package imports.aws.guardduty_detector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.316Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.guarddutyDetector.GuarddutyDetectorDatasourcesOutputReference")
public class GuarddutyDetectorDatasourcesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GuarddutyDetectorDatasourcesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GuarddutyDetectorDatasourcesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GuarddutyDetectorDatasourcesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putKubernetes(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes value) {
        software.amazon.jsii.Kernel.call(this, "putKubernetes", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMalwareProtection(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesMalwareProtection value) {
        software.amazon.jsii.Kernel.call(this, "putMalwareProtection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3Logs(final @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesS3Logs value) {
        software.amazon.jsii.Kernel.call(this, "putS3Logs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKubernetes() {
        software.amazon.jsii.Kernel.call(this, "resetKubernetes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMalwareProtection() {
        software.amazon.jsii.Kernel.call(this, "resetMalwareProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3Logs() {
        software.amazon.jsii.Kernel.call(this, "resetS3Logs", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesOutputReference getKubernetes() {
        return software.amazon.jsii.Kernel.get(this, "kubernetes", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesMalwareProtectionOutputReference getMalwareProtection() {
        return software.amazon.jsii.Kernel.get(this, "malwareProtection", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesMalwareProtectionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesS3LogsOutputReference getS3Logs() {
        return software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesS3LogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes getKubernetesInput() {
        return software.amazon.jsii.Kernel.get(this, "kubernetesInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesKubernetes.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesMalwareProtection getMalwareProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "malwareProtectionInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesMalwareProtection.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesS3Logs getS3LogsInput() {
        return software.amazon.jsii.Kernel.get(this, "s3LogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasourcesS3Logs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasources getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.guardduty_detector.GuarddutyDetectorDatasources.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.guardduty_detector.GuarddutyDetectorDatasources value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
