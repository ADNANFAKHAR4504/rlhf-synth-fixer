package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerProtocolDetailsOutputReference")
public class TransferServerProtocolDetailsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected TransferServerProtocolDetailsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected TransferServerProtocolDetailsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public TransferServerProtocolDetailsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAs2Transports() {
        software.amazon.jsii.Kernel.call(this, "resetAs2Transports", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPassiveIp() {
        software.amazon.jsii.Kernel.call(this, "resetPassiveIp", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSetStatOption() {
        software.amazon.jsii.Kernel.call(this, "resetSetStatOption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsSessionResumptionMode() {
        software.amazon.jsii.Kernel.call(this, "resetTlsSessionResumptionMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAs2TransportsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "as2TransportsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPassiveIpInput() {
        return software.amazon.jsii.Kernel.get(this, "passiveIpInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSetStatOptionInput() {
        return software.amazon.jsii.Kernel.get(this, "setStatOptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsSessionResumptionModeInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsSessionResumptionModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAs2Transports() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "as2Transports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAs2Transports(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "as2Transports", java.util.Objects.requireNonNull(value, "as2Transports is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassiveIp() {
        return software.amazon.jsii.Kernel.get(this, "passiveIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassiveIp(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "passiveIp", java.util.Objects.requireNonNull(value, "passiveIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSetStatOption() {
        return software.amazon.jsii.Kernel.get(this, "setStatOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSetStatOption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "setStatOption", java.util.Objects.requireNonNull(value, "setStatOption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsSessionResumptionMode() {
        return software.amazon.jsii.Kernel.get(this, "tlsSessionResumptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsSessionResumptionMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsSessionResumptionMode", java.util.Objects.requireNonNull(value, "tlsSessionResumptionMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerProtocolDetails getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_server.TransferServerProtocolDetails.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.transfer_server.TransferServerProtocolDetails value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
