package imports.aws.opensearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.990Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opensearchDomain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTimeOutputReference")
public class OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTimeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTimeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTimeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTimeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHours() {
        software.amazon.jsii.Kernel.call(this, "resetHours", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinutes() {
        software.amazon.jsii.Kernel.call(this, "resetMinutes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "hoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinutesInput() {
        return software.amazon.jsii.Kernel.get(this, "minutesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHours() {
        return software.amazon.jsii.Kernel.get(this, "hours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "hours", java.util.Objects.requireNonNull(value, "hours is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinutes() {
        return software.amazon.jsii.Kernel.get(this, "minutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinutes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minutes", java.util.Objects.requireNonNull(value, "minutes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.opensearch_domain.OpensearchDomainOffPeakWindowOptionsOffPeakWindowWindowStartTime value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
