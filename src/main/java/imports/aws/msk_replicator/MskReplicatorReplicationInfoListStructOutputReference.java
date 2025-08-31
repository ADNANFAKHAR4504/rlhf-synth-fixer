package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.913Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorReplicationInfoListStructOutputReference")
public class MskReplicatorReplicationInfoListStructOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MskReplicatorReplicationInfoListStructOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MskReplicatorReplicationInfoListStructOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MskReplicatorReplicationInfoListStructOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putConsumerGroupReplication(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication> __cast_cd4240 = (java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplication __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConsumerGroupReplication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTopicReplication(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication> __cast_cd4240 = (java.util.List<imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplication __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTopicReplication", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplicationList getConsumerGroupReplication() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupReplication", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListConsumerGroupReplicationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceKafkaClusterAlias() {
        return software.amazon.jsii.Kernel.get(this, "sourceKafkaClusterAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetKafkaClusterAlias() {
        return software.amazon.jsii.Kernel.get(this, "targetKafkaClusterAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationList getTopicReplication() {
        return software.amazon.jsii.Kernel.get(this, "topicReplication", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListTopicReplicationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConsumerGroupReplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupReplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceKafkaClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceKafkaClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetCompressionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "targetCompressionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetKafkaClusterArnInput() {
        return software.amazon.jsii.Kernel.get(this, "targetKafkaClusterArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTopicReplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "topicReplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceKafkaClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceKafkaClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceKafkaClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceKafkaClusterArn", java.util.Objects.requireNonNull(value, "sourceKafkaClusterArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetCompressionType() {
        return software.amazon.jsii.Kernel.get(this, "targetCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetCompressionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetCompressionType", java.util.Objects.requireNonNull(value, "targetCompressionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetKafkaClusterArn() {
        return software.amazon.jsii.Kernel.get(this, "targetKafkaClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetKafkaClusterArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetKafkaClusterArn", java.util.Objects.requireNonNull(value, "targetKafkaClusterArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListStruct getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.msk_replicator.MskReplicatorReplicationInfoListStruct.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.msk_replicator.MskReplicatorReplicationInfoListStruct value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
