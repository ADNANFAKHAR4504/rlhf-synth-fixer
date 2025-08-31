package imports.aws.redshift_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.155Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.redshiftCluster.RedshiftClusterSnapshotCopyOutputReference")
public class RedshiftClusterSnapshotCopyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected RedshiftClusterSnapshotCopyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RedshiftClusterSnapshotCopyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public RedshiftClusterSnapshotCopyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetGrantName() {
        software.amazon.jsii.Kernel.call(this, "resetGrantName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDestinationRegionInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationRegionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGrantNameInput() {
        return software.amazon.jsii.Kernel.get(this, "grantNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDestinationRegion() {
        return software.amazon.jsii.Kernel.get(this, "destinationRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDestinationRegion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "destinationRegion", java.util.Objects.requireNonNull(value, "destinationRegion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGrantName() {
        return software.amazon.jsii.Kernel.get(this, "grantName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGrantName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "grantName", java.util.Objects.requireNonNull(value, "grantName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRetentionPeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "retentionPeriod", java.util.Objects.requireNonNull(value, "retentionPeriod is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.redshift_cluster.RedshiftClusterSnapshotCopy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
