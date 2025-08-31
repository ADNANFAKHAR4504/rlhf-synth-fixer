package imports.aws.sqs_queue;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue aws_sqs_queue}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.493Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sqsQueue.SqsQueue")
public class SqsQueue extends com.hashicorp.cdktf.TerraformResource {

    protected SqsQueue(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SqsQueue(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sqs_queue.SqsQueue.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue aws_sqs_queue} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public SqsQueue(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.sqs_queue.SqsQueueConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue aws_sqs_queue} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public SqsQueue(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a SqsQueue resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SqsQueue to import. This parameter is required.
     * @param importFromId The id of the existing SqsQueue that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SqsQueue to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sqs_queue.SqsQueue.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SqsQueue resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SqsQueue to import. This parameter is required.
     * @param importFromId The id of the existing SqsQueue that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sqs_queue.SqsQueue.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.sqs_queue.SqsQueueTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContentBasedDeduplication() {
        software.amazon.jsii.Kernel.call(this, "resetContentBasedDeduplication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeduplicationScope() {
        software.amazon.jsii.Kernel.call(this, "resetDeduplicationScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDelaySeconds() {
        software.amazon.jsii.Kernel.call(this, "resetDelaySeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFifoQueue() {
        software.amazon.jsii.Kernel.call(this, "resetFifoQueue", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFifoThroughputLimit() {
        software.amazon.jsii.Kernel.call(this, "resetFifoThroughputLimit", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsDataKeyReusePeriodSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetKmsDataKeyReusePeriodSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsMasterKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsMasterKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxMessageSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxMessageSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMessageRetentionSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMessageRetentionSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNamePrefix() {
        software.amazon.jsii.Kernel.call(this, "resetNamePrefix", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReceiveWaitTimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetReceiveWaitTimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedriveAllowPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRedriveAllowPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedrivePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetRedrivePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsManagedSseEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetSqsManagedSseEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVisibilityTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetVisibilityTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.sqs_queue.SqsQueueTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.sqs_queue.SqsQueueTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContentBasedDeduplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "contentBasedDeduplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeduplicationScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "deduplicationScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDelaySecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "delaySecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFifoQueueInput() {
        return software.amazon.jsii.Kernel.get(this, "fifoQueueInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFifoThroughputLimitInput() {
        return software.amazon.jsii.Kernel.get(this, "fifoThroughputLimitInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getKmsDataKeyReusePeriodSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsDataKeyReusePeriodSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxMessageSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxMessageSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMessageRetentionSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "messageRetentionSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNamePrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "namePrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "policyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReceiveWaitTimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "receiveWaitTimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedriveAllowPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "redriveAllowPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedrivePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "redrivePolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSqsManagedSseEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsManagedSseEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVisibilityTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "visibilityTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getContentBasedDeduplication() {
        return software.amazon.jsii.Kernel.get(this, "contentBasedDeduplication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setContentBasedDeduplication(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "contentBasedDeduplication", java.util.Objects.requireNonNull(value, "contentBasedDeduplication is required"));
    }

    public void setContentBasedDeduplication(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "contentBasedDeduplication", java.util.Objects.requireNonNull(value, "contentBasedDeduplication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeduplicationScope() {
        return software.amazon.jsii.Kernel.get(this, "deduplicationScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeduplicationScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deduplicationScope", java.util.Objects.requireNonNull(value, "deduplicationScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDelaySeconds() {
        return software.amazon.jsii.Kernel.get(this, "delaySeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDelaySeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "delaySeconds", java.util.Objects.requireNonNull(value, "delaySeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFifoQueue() {
        return software.amazon.jsii.Kernel.get(this, "fifoQueue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFifoQueue(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "fifoQueue", java.util.Objects.requireNonNull(value, "fifoQueue is required"));
    }

    public void setFifoQueue(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "fifoQueue", java.util.Objects.requireNonNull(value, "fifoQueue is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFifoThroughputLimit() {
        return software.amazon.jsii.Kernel.get(this, "fifoThroughputLimit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFifoThroughputLimit(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fifoThroughputLimit", java.util.Objects.requireNonNull(value, "fifoThroughputLimit is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getKmsDataKeyReusePeriodSeconds() {
        return software.amazon.jsii.Kernel.get(this, "kmsDataKeyReusePeriodSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setKmsDataKeyReusePeriodSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "kmsDataKeyReusePeriodSeconds", java.util.Objects.requireNonNull(value, "kmsDataKeyReusePeriodSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsMasterKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsMasterKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsMasterKeyId", java.util.Objects.requireNonNull(value, "kmsMasterKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxMessageSize() {
        return software.amazon.jsii.Kernel.get(this, "maxMessageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxMessageSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxMessageSize", java.util.Objects.requireNonNull(value, "maxMessageSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMessageRetentionSeconds() {
        return software.amazon.jsii.Kernel.get(this, "messageRetentionSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMessageRetentionSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "messageRetentionSeconds", java.util.Objects.requireNonNull(value, "messageRetentionSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix() {
        return software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNamePrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "namePrefix", java.util.Objects.requireNonNull(value, "namePrefix is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "policy", java.util.Objects.requireNonNull(value, "policy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReceiveWaitTimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "receiveWaitTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReceiveWaitTimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "receiveWaitTimeSeconds", java.util.Objects.requireNonNull(value, "receiveWaitTimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedriveAllowPolicy() {
        return software.amazon.jsii.Kernel.get(this, "redriveAllowPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedriveAllowPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redriveAllowPolicy", java.util.Objects.requireNonNull(value, "redriveAllowPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedrivePolicy() {
        return software.amazon.jsii.Kernel.get(this, "redrivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedrivePolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redrivePolicy", java.util.Objects.requireNonNull(value, "redrivePolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSqsManagedSseEnabled() {
        return software.amazon.jsii.Kernel.get(this, "sqsManagedSseEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSqsManagedSseEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "sqsManagedSseEnabled", java.util.Objects.requireNonNull(value, "sqsManagedSseEnabled is required"));
    }

    public void setSqsManagedSseEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "sqsManagedSseEnabled", java.util.Objects.requireNonNull(value, "sqsManagedSseEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVisibilityTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "visibilityTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVisibilityTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "visibilityTimeoutSeconds", java.util.Objects.requireNonNull(value, "visibilityTimeoutSeconds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sqs_queue.SqsQueue}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sqs_queue.SqsQueue> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private imports.aws.sqs_queue.SqsQueueConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config().connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config().count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config().count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config().dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config().forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config().lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config().provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config().provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}.
         * <p>
         * @return {@code this}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}. This parameter is required.
         */
        public Builder contentBasedDeduplication(final java.lang.Boolean contentBasedDeduplication) {
            this.config().contentBasedDeduplication(contentBasedDeduplication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}.
         * <p>
         * @return {@code this}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#content_based_deduplication SqsQueue#content_based_deduplication}. This parameter is required.
         */
        public Builder contentBasedDeduplication(final com.hashicorp.cdktf.IResolvable contentBasedDeduplication) {
            this.config().contentBasedDeduplication(contentBasedDeduplication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#deduplication_scope SqsQueue#deduplication_scope}.
         * <p>
         * @return {@code this}
         * @param deduplicationScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#deduplication_scope SqsQueue#deduplication_scope}. This parameter is required.
         */
        public Builder deduplicationScope(final java.lang.String deduplicationScope) {
            this.config().deduplicationScope(deduplicationScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#delay_seconds SqsQueue#delay_seconds}.
         * <p>
         * @return {@code this}
         * @param delaySeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#delay_seconds SqsQueue#delay_seconds}. This parameter is required.
         */
        public Builder delaySeconds(final java.lang.Number delaySeconds) {
            this.config().delaySeconds(delaySeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}.
         * <p>
         * @return {@code this}
         * @param fifoQueue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}. This parameter is required.
         */
        public Builder fifoQueue(final java.lang.Boolean fifoQueue) {
            this.config().fifoQueue(fifoQueue);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}.
         * <p>
         * @return {@code this}
         * @param fifoQueue Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_queue SqsQueue#fifo_queue}. This parameter is required.
         */
        public Builder fifoQueue(final com.hashicorp.cdktf.IResolvable fifoQueue) {
            this.config().fifoQueue(fifoQueue);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_throughput_limit SqsQueue#fifo_throughput_limit}.
         * <p>
         * @return {@code this}
         * @param fifoThroughputLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#fifo_throughput_limit SqsQueue#fifo_throughput_limit}. This parameter is required.
         */
        public Builder fifoThroughputLimit(final java.lang.String fifoThroughputLimit) {
            this.config().fifoThroughputLimit(fifoThroughputLimit);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#id SqsQueue#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#id SqsQueue#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_data_key_reuse_period_seconds SqsQueue#kms_data_key_reuse_period_seconds}.
         * <p>
         * @return {@code this}
         * @param kmsDataKeyReusePeriodSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_data_key_reuse_period_seconds SqsQueue#kms_data_key_reuse_period_seconds}. This parameter is required.
         */
        public Builder kmsDataKeyReusePeriodSeconds(final java.lang.Number kmsDataKeyReusePeriodSeconds) {
            this.config().kmsDataKeyReusePeriodSeconds(kmsDataKeyReusePeriodSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_master_key_id SqsQueue#kms_master_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsMasterKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#kms_master_key_id SqsQueue#kms_master_key_id}. This parameter is required.
         */
        public Builder kmsMasterKeyId(final java.lang.String kmsMasterKeyId) {
            this.config().kmsMasterKeyId(kmsMasterKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#max_message_size SqsQueue#max_message_size}.
         * <p>
         * @return {@code this}
         * @param maxMessageSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#max_message_size SqsQueue#max_message_size}. This parameter is required.
         */
        public Builder maxMessageSize(final java.lang.Number maxMessageSize) {
            this.config().maxMessageSize(maxMessageSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#message_retention_seconds SqsQueue#message_retention_seconds}.
         * <p>
         * @return {@code this}
         * @param messageRetentionSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#message_retention_seconds SqsQueue#message_retention_seconds}. This parameter is required.
         */
        public Builder messageRetentionSeconds(final java.lang.Number messageRetentionSeconds) {
            this.config().messageRetentionSeconds(messageRetentionSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name SqsQueue#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name SqsQueue#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config().name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name_prefix SqsQueue#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#name_prefix SqsQueue#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config().namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#policy SqsQueue#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#policy SqsQueue#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config().policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#receive_wait_time_seconds SqsQueue#receive_wait_time_seconds}.
         * <p>
         * @return {@code this}
         * @param receiveWaitTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#receive_wait_time_seconds SqsQueue#receive_wait_time_seconds}. This parameter is required.
         */
        public Builder receiveWaitTimeSeconds(final java.lang.Number receiveWaitTimeSeconds) {
            this.config().receiveWaitTimeSeconds(receiveWaitTimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_allow_policy SqsQueue#redrive_allow_policy}.
         * <p>
         * @return {@code this}
         * @param redriveAllowPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_allow_policy SqsQueue#redrive_allow_policy}. This parameter is required.
         */
        public Builder redriveAllowPolicy(final java.lang.String redriveAllowPolicy) {
            this.config().redriveAllowPolicy(redriveAllowPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_policy SqsQueue#redrive_policy}.
         * <p>
         * @return {@code this}
         * @param redrivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#redrive_policy SqsQueue#redrive_policy}. This parameter is required.
         */
        public Builder redrivePolicy(final java.lang.String redrivePolicy) {
            this.config().redrivePolicy(redrivePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}.
         * <p>
         * @return {@code this}
         * @param sqsManagedSseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}. This parameter is required.
         */
        public Builder sqsManagedSseEnabled(final java.lang.Boolean sqsManagedSseEnabled) {
            this.config().sqsManagedSseEnabled(sqsManagedSseEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}.
         * <p>
         * @return {@code this}
         * @param sqsManagedSseEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#sqs_managed_sse_enabled SqsQueue#sqs_managed_sse_enabled}. This parameter is required.
         */
        public Builder sqsManagedSseEnabled(final com.hashicorp.cdktf.IResolvable sqsManagedSseEnabled) {
            this.config().sqsManagedSseEnabled(sqsManagedSseEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags SqsQueue#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags SqsQueue#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags_all SqsQueue#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#tags_all SqsQueue#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#timeouts SqsQueue#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.sqs_queue.SqsQueueTimeouts timeouts) {
            this.config().timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#visibility_timeout_seconds SqsQueue#visibility_timeout_seconds}.
         * <p>
         * @return {@code this}
         * @param visibilityTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sqs_queue#visibility_timeout_seconds SqsQueue#visibility_timeout_seconds}. This parameter is required.
         */
        public Builder visibilityTimeoutSeconds(final java.lang.Number visibilityTimeoutSeconds) {
            this.config().visibilityTimeoutSeconds(visibilityTimeoutSeconds);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sqs_queue.SqsQueue}.
         */
        @Override
        public imports.aws.sqs_queue.SqsQueue build() {
            return new imports.aws.sqs_queue.SqsQueue(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.sqs_queue.SqsQueueConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.sqs_queue.SqsQueueConfig.Builder();
            }
            return this.config;
        }
    }
}
