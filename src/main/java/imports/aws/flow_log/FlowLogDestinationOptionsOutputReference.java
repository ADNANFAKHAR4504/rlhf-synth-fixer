package imports.aws.flow_log;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.234Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.flowLog.FlowLogDestinationOptionsOutputReference")
public class FlowLogDestinationOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FlowLogDestinationOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FlowLogDestinationOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FlowLogDestinationOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFileFormat() {
        software.amazon.jsii.Kernel.call(this, "resetFileFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHiveCompatiblePartitions() {
        software.amazon.jsii.Kernel.call(this, "resetHiveCompatiblePartitions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerHourPartition() {
        software.amazon.jsii.Kernel.call(this, "resetPerHourPartition", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "fileFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHiveCompatiblePartitionsInput() {
        return software.amazon.jsii.Kernel.get(this, "hiveCompatiblePartitionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPerHourPartitionInput() {
        return software.amazon.jsii.Kernel.get(this, "perHourPartitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileFormat() {
        return software.amazon.jsii.Kernel.get(this, "fileFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileFormat", java.util.Objects.requireNonNull(value, "fileFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHiveCompatiblePartitions() {
        return software.amazon.jsii.Kernel.get(this, "hiveCompatiblePartitions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHiveCompatiblePartitions(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hiveCompatiblePartitions", java.util.Objects.requireNonNull(value, "hiveCompatiblePartitions is required"));
    }

    public void setHiveCompatiblePartitions(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hiveCompatiblePartitions", java.util.Objects.requireNonNull(value, "hiveCompatiblePartitions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPerHourPartition() {
        return software.amazon.jsii.Kernel.get(this, "perHourPartition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPerHourPartition(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "perHourPartition", java.util.Objects.requireNonNull(value, "perHourPartition is required"));
    }

    public void setPerHourPartition(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "perHourPartition", java.util.Objects.requireNonNull(value, "perHourPartition is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.flow_log.FlowLogDestinationOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.flow_log.FlowLogDestinationOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.flow_log.FlowLogDestinationOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
