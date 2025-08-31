package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.913Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListTopicReplicationOutputReference")
public class MskReplicatorReplicationInfoListTopicReplicationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskReplicatorReplicationInfoListTopicReplicationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskReplicatorReplicationInfoListTopicReplicationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public MskReplicatorReplicationInfoListTopicReplicationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putStartingPosition(final @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition value) {
        software.amazon.jsii.Kernel.call(this, "putStartingPosition", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTopicNameConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putTopicNameConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCopyAccessControlListsForTopics() {
        software.amazon.jsii.Kernel.call(this, "resetCopyAccessControlListsForTopics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCopyTopicConfigurations() {
        software.amazon.jsii.Kernel.call(this, "resetCopyTopicConfigurations", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDetectAndCopyNewTopics() {
        software.amazon.jsii.Kernel.call(this, "resetDetectAndCopyNewTopics", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartingPosition() {
        software.amazon.jsii.Kernel.call(this, "resetStartingPosition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopicNameConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetTopicNameConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTopicsToExclude() {
        software.amazon.jsii.Kernel.call(this, "resetTopicsToExclude", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference getStartingPosition() {
        return software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPositionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference getTopicNameConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "topicNameConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyAccessControlListsForTopicsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyAccessControlListsForTopicsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCopyTopicConfigurationsInput() {
        return software.amazon.jsii.Kernel.get(this, "copyTopicConfigurationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDetectAndCopyNewTopicsInput() {
        return software.amazon.jsii.Kernel.get(this, "detectAndCopyNewTopicsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition getStartingPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "startingPositionInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationStartingPosition.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration getTopicNameConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "topicNameConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationTopicNameConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTopicsToExcludeInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "topicsToExcludeInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTopicsToReplicateInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "topicsToReplicateInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyAccessControlListsForTopics() {
        return software.amazon.jsii.Kernel.get(this, "copyAccessControlListsForTopics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyAccessControlListsForTopics(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyAccessControlListsForTopics", java.util.Objects.requireNonNull(value, "copyAccessControlListsForTopics is required"));
    }

    public void setCopyAccessControlListsForTopics(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyAccessControlListsForTopics", java.util.Objects.requireNonNull(value, "copyAccessControlListsForTopics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCopyTopicConfigurations() {
        return software.amazon.jsii.Kernel.get(this, "copyTopicConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCopyTopicConfigurations(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "copyTopicConfigurations", java.util.Objects.requireNonNull(value, "copyTopicConfigurations is required"));
    }

    public void setCopyTopicConfigurations(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "copyTopicConfigurations", java.util.Objects.requireNonNull(value, "copyTopicConfigurations is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDetectAndCopyNewTopics() {
        return software.amazon.jsii.Kernel.get(this, "detectAndCopyNewTopics", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDetectAndCopyNewTopics(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "detectAndCopyNewTopics", java.util.Objects.requireNonNull(value, "detectAndCopyNewTopics is required"));
    }

    public void setDetectAndCopyNewTopics(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "detectAndCopyNewTopics", java.util.Objects.requireNonNull(value, "detectAndCopyNewTopics is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTopicsToExclude() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "topicsToExclude", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTopicsToExclude(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "topicsToExclude", java.util.Objects.requireNonNull(value, "topicsToExclude is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTopicsToReplicate() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "topicsToReplicate", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTopicsToReplicate(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "topicsToReplicate", java.util.Objects.requireNonNull(value, "topicsToReplicate is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
