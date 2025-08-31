package imports.aws.gamelift_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.264Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.gameliftFleet.GameliftFleetCertificateConfigurationOutputReference")
public class GameliftFleetCertificateConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected GameliftFleetCertificateConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected GameliftFleetCertificateConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public GameliftFleetCertificateConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCertificateType() {
        software.amazon.jsii.Kernel.call(this, "resetCertificateType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCertificateTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "certificateTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCertificateType() {
        return software.amazon.jsii.Kernel.get(this, "certificateType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCertificateType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "certificateType", java.util.Objects.requireNonNull(value, "certificateType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.gamelift_fleet.GameliftFleetCertificateConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
