package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.913Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference")
public class MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MskReplicatorReplicationInfoListConsumerGroupReplicationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void resetConsumerGroupsToExclude() {
        software.amazon.jsii.Kernel.call(this, "resetConsumerGroupsToExclude", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetectAndCopyNewConsumerGroups() {
        software.amazon.jsii.Kernel.call(this, "resetDetectAndCopyNewConsumerGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSynchroniseConsumerGroupOffsets() {
        software.amazon.jsii.Kernel.call(this, "resetSynchroniseConsumerGroupOffsets", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConsumerGroupsToExcludeInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "consumerGroupsToExcludeInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getConsumerGroupsToReplicateInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "consumerGroupsToReplicateInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDetectAndCopyNewConsumerGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "detectAndCopyNewConsumerGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSynchroniseConsumerGroupOffsetsInput() {
        return software.amazon.jsii.Kernel.get(this, "synchroniseConsumerGroupOffsetsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getConsumerGroupsToExclude() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "consumerGroupsToExclude", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setConsumerGroupsToExclude(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "consumerGroupsToExclude", java.util.Objects.requireNonNull(value, "consumerGroupsToExclude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getConsumerGroupsToReplicate() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "consumerGroupsToReplicate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setConsumerGroupsToReplicate(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "consumerGroupsToReplicate", java.util.Objects.requireNonNull(value, "consumerGroupsToReplicate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDetectAndCopyNewConsumerGroups() {
        return software.amazon.jsii.Kernel.get(this, "detectAndCopyNewConsumerGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDetectAndCopyNewConsumerGroups(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "detectAndCopyNewConsumerGroups", java.util.Objects.requireNonNull(value, "detectAndCopyNewConsumerGroups is required"));
    }

    public void setDetectAndCopyNewConsumerGroups(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "detectAndCopyNewConsumerGroups", java.util.Objects.requireNonNull(value, "detectAndCopyNewConsumerGroups is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSynchroniseConsumerGroupOffsets() {
        return software.amazon.jsii.Kernel.get(this, "synchroniseConsumerGroupOffsets", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSynchroniseConsumerGroupOffsets(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "synchroniseConsumerGroupOffsets", java.util.Objects.requireNonNull(value, "synchroniseConsumerGroupOffsets is required"));
    }

    public void setSynchroniseConsumerGroupOffsets(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "synchroniseConsumerGroupOffsets", java.util.Objects.requireNonNull(value, "synchroniseConsumerGroupOffsets is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
