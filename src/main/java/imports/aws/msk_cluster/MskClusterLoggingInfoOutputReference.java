package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterLoggingInfoOutputReference")
public class MskClusterLoggingInfoOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskClusterLoggingInfoOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskClusterLoggingInfoOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskClusterLoggingInfoOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putBrokerLogs(final @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs value) {
        software.amazon.jsii.Kernel.call(this, "putBrokerLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsOutputReference getBrokerLogs() {
        return software.amazon.jsii.Kernel.get(this, "brokerLogs", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs getBrokerLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "brokerLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfo getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfo.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfo value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
