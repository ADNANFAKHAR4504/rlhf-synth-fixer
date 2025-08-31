package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterLoggingInfoBrokerLogsOutputReference")
public class MskClusterLoggingInfoBrokerLogsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskClusterLoggingInfoBrokerLogsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskClusterLoggingInfoBrokerLogsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskClusterLoggingInfoBrokerLogsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCloudwatchLogs(final @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsCloudwatchLogs value) {
        software.amazon.jsii.Kernel.call(this, "putCloudwatchLogs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFirehose(final @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsFirehose value) {
        software.amazon.jsii.Kernel.call(this, "putFirehose", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putS3(final @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsS3 value) {
        software.amazon.jsii.Kernel.call(this, "putS3", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCloudwatchLogs() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehose() {
        software.amazon.jsii.Kernel.call(this, "resetFirehose", software.amazon.jsii.NativeType.VOID);
    }

    public void resetS3() {
        software.amazon.jsii.Kernel.call(this, "resetS3", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsCloudwatchLogsOutputReference getCloudwatchLogs() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsCloudwatchLogsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsFirehoseOutputReference getFirehose() {
        return software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsFirehoseOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsS3OutputReference getS3() {
        return software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsS3OutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsCloudwatchLogs getCloudwatchLogsInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsCloudwatchLogs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsFirehose getFirehoseInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsFirehose.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsS3 getS3Input() {
        return software.amazon.jsii.Kernel.get(this, "s3Input", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogsS3.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterLoggingInfoBrokerLogs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
