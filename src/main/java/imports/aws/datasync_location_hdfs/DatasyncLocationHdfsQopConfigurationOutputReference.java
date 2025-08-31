package imports.aws.datasync_location_hdfs;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.948Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationHdfs.DatasyncLocationHdfsQopConfigurationOutputReference")
public class DatasyncLocationHdfsQopConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DatasyncLocationHdfsQopConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationHdfsQopConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DatasyncLocationHdfsQopConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDataTransferProtection() {
        software.amazon.jsii.Kernel.call(this, "resetDataTransferProtection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRpcProtection() {
        software.amazon.jsii.Kernel.call(this, "resetRpcProtection", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataTransferProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRpcProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "rpcProtectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataTransferProtection() {
        return software.amazon.jsii.Kernel.get(this, "dataTransferProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataTransferProtection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataTransferProtection", java.util.Objects.requireNonNull(value, "dataTransferProtection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRpcProtection() {
        return software.amazon.jsii.Kernel.get(this, "rpcProtection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRpcProtection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rpcProtection", java.util.Objects.requireNonNull(value, "rpcProtection is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
