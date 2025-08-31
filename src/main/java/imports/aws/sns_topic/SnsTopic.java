package imports.aws.sns_topic;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic aws_sns_topic}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.476Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsTopic.SnsTopic")
public class SnsTopic extends com.hashicorp.cdktf.TerraformResource {

    protected SnsTopic(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SnsTopic(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sns_topic.SnsTopic.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic aws_sns_topic} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config
     */
    public SnsTopic(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.Nullable imports.aws.sns_topic.SnsTopicConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), config });
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic aws_sns_topic} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     */
    public SnsTopic(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required") });
    }

    /**
     * Generates CDKTF code for importing a SnsTopic resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsTopic to import. This parameter is required.
     * @param importFromId The id of the existing SnsTopic that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SnsTopic to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_topic.SnsTopic.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SnsTopic resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsTopic to import. This parameter is required.
     * @param importFromId The id of the existing SnsTopic that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_topic.SnsTopic.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetApplicationFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplicationSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplicationSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetApplicationSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetArchivePolicy() {
        software.amazon.jsii.Kernel.call(this, "resetArchivePolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentBasedDeduplication() {
        software.amazon.jsii.Kernel.call(this, "resetContentBasedDeduplication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeliveryPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetDeliveryPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisplayName() {
        software.amazon.jsii.Kernel.call(this, "resetDisplayName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFifoThroughputScope() {
        software.amazon.jsii.Kernel.call(this, "resetFifoThroughputScope", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFifoTopic() {
        software.amazon.jsii.Kernel.call(this, "resetFifoTopic", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehoseFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetFirehoseFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehoseSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetFirehoseSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFirehoseSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetFirehoseSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetHttpFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetHttpSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetHttpSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsMasterKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsMasterKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
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

    public void resetSignatureVersion() {
        software.amazon.jsii.Kernel.call(this, "resetSignatureVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetSqsFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetSqsSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSqsSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTracingConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTracingConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getBeginningArchiveTime() {
        return software.amazon.jsii.Kernel.get(this, "beginningArchiveTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwner() {
        return software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationFailureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplicationSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getApplicationSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArchivePolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "archivePolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getContentBasedDeduplicationInput() {
        return software.amazon.jsii.Kernel.get(this, "contentBasedDeduplicationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeliveryPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "deliveryPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDisplayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "displayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFifoThroughputScopeInput() {
        return software.amazon.jsii.Kernel.get(this, "fifoThroughputScopeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFifoTopicInput() {
        return software.amazon.jsii.Kernel.get(this, "fifoTopicInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirehoseFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseFailureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFirehoseSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFirehoseSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "httpFailureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHttpSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsMasterKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFailureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getLambdaSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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

    public @org.jetbrains.annotations.Nullable java.lang.Number getSignatureVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "signatureVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSqsFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsFailureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSqsSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSqsSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTracingConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "tracingConfigInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "applicationFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationFailureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "applicationFailureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplicationSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplicationSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applicationSuccessFeedbackRoleArn", java.util.Objects.requireNonNull(value, "applicationSuccessFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getApplicationSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "applicationSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setApplicationSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "applicationSuccessFeedbackSampleRate", java.util.Objects.requireNonNull(value, "applicationSuccessFeedbackSampleRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArchivePolicy() {
        return software.amazon.jsii.Kernel.get(this, "archivePolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArchivePolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "archivePolicy", java.util.Objects.requireNonNull(value, "archivePolicy is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDeliveryPolicy() {
        return software.amazon.jsii.Kernel.get(this, "deliveryPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeliveryPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deliveryPolicy", java.util.Objects.requireNonNull(value, "deliveryPolicy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDisplayName() {
        return software.amazon.jsii.Kernel.get(this, "displayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDisplayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "displayName", java.util.Objects.requireNonNull(value, "displayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFifoThroughputScope() {
        return software.amazon.jsii.Kernel.get(this, "fifoThroughputScope", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFifoThroughputScope(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fifoThroughputScope", java.util.Objects.requireNonNull(value, "fifoThroughputScope is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFifoTopic() {
        return software.amazon.jsii.Kernel.get(this, "fifoTopic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFifoTopic(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "fifoTopic", java.util.Objects.requireNonNull(value, "fifoTopic is required"));
    }

    public void setFifoTopic(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "fifoTopic", java.util.Objects.requireNonNull(value, "fifoTopic is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirehoseFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "firehoseFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirehoseFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firehoseFailureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "firehoseFailureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFirehoseSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFirehoseSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "firehoseSuccessFeedbackRoleArn", java.util.Objects.requireNonNull(value, "firehoseSuccessFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFirehoseSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "firehoseSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFirehoseSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "firehoseSuccessFeedbackSampleRate", java.util.Objects.requireNonNull(value, "firehoseSuccessFeedbackSampleRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "httpFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpFailureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "httpFailureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpSuccessFeedbackRoleArn", java.util.Objects.requireNonNull(value, "httpSuccessFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHttpSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "httpSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHttpSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "httpSuccessFeedbackSampleRate", java.util.Objects.requireNonNull(value, "httpSuccessFeedbackSampleRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsMasterKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsMasterKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsMasterKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsMasterKeyId", java.util.Objects.requireNonNull(value, "kmsMasterKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaFailureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "lambdaFailureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaSuccessFeedbackRoleArn", java.util.Objects.requireNonNull(value, "lambdaSuccessFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLambdaSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "lambdaSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setLambdaSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "lambdaSuccessFeedbackSampleRate", java.util.Objects.requireNonNull(value, "lambdaSuccessFeedbackSampleRate is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getSignatureVersion() {
        return software.amazon.jsii.Kernel.get(this, "signatureVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSignatureVersion(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "signatureVersion", java.util.Objects.requireNonNull(value, "signatureVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSqsFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "sqsFailureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSqsFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sqsFailureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "sqsFailureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSqsSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSqsSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sqsSuccessFeedbackRoleArn", java.util.Objects.requireNonNull(value, "sqsSuccessFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSqsSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "sqsSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSqsSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sqsSuccessFeedbackSampleRate", java.util.Objects.requireNonNull(value, "sqsSuccessFeedbackSampleRate is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTracingConfig() {
        return software.amazon.jsii.Kernel.get(this, "tracingConfig", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTracingConfig(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tracingConfig", java.util.Objects.requireNonNull(value, "tracingConfig is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sns_topic.SnsTopic}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sns_topic.SnsTopic> {
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
        private imports.aws.sns_topic.SnsTopicConfig.Builder config;

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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_failure_feedback_role_arn SnsTopic#application_failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param applicationFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_failure_feedback_role_arn SnsTopic#application_failure_feedback_role_arn}. This parameter is required.
         */
        public Builder applicationFailureFeedbackRoleArn(final java.lang.String applicationFailureFeedbackRoleArn) {
            this.config().applicationFailureFeedbackRoleArn(applicationFailureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_role_arn SnsTopic#application_success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param applicationSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_role_arn SnsTopic#application_success_feedback_role_arn}. This parameter is required.
         */
        public Builder applicationSuccessFeedbackRoleArn(final java.lang.String applicationSuccessFeedbackRoleArn) {
            this.config().applicationSuccessFeedbackRoleArn(applicationSuccessFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_sample_rate SnsTopic#application_success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param applicationSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#application_success_feedback_sample_rate SnsTopic#application_success_feedback_sample_rate}. This parameter is required.
         */
        public Builder applicationSuccessFeedbackSampleRate(final java.lang.Number applicationSuccessFeedbackSampleRate) {
            this.config().applicationSuccessFeedbackSampleRate(applicationSuccessFeedbackSampleRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#archive_policy SnsTopic#archive_policy}.
         * <p>
         * @return {@code this}
         * @param archivePolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#archive_policy SnsTopic#archive_policy}. This parameter is required.
         */
        public Builder archivePolicy(final java.lang.String archivePolicy) {
            this.config().archivePolicy(archivePolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}.
         * <p>
         * @return {@code this}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}. This parameter is required.
         */
        public Builder contentBasedDeduplication(final java.lang.Boolean contentBasedDeduplication) {
            this.config().contentBasedDeduplication(contentBasedDeduplication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}.
         * <p>
         * @return {@code this}
         * @param contentBasedDeduplication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#content_based_deduplication SnsTopic#content_based_deduplication}. This parameter is required.
         */
        public Builder contentBasedDeduplication(final com.hashicorp.cdktf.IResolvable contentBasedDeduplication) {
            this.config().contentBasedDeduplication(contentBasedDeduplication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#delivery_policy SnsTopic#delivery_policy}.
         * <p>
         * @return {@code this}
         * @param deliveryPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#delivery_policy SnsTopic#delivery_policy}. This parameter is required.
         */
        public Builder deliveryPolicy(final java.lang.String deliveryPolicy) {
            this.config().deliveryPolicy(deliveryPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#display_name SnsTopic#display_name}.
         * <p>
         * @return {@code this}
         * @param displayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#display_name SnsTopic#display_name}. This parameter is required.
         */
        public Builder displayName(final java.lang.String displayName) {
            this.config().displayName(displayName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_throughput_scope SnsTopic#fifo_throughput_scope}.
         * <p>
         * @return {@code this}
         * @param fifoThroughputScope Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_throughput_scope SnsTopic#fifo_throughput_scope}. This parameter is required.
         */
        public Builder fifoThroughputScope(final java.lang.String fifoThroughputScope) {
            this.config().fifoThroughputScope(fifoThroughputScope);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}.
         * <p>
         * @return {@code this}
         * @param fifoTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}. This parameter is required.
         */
        public Builder fifoTopic(final java.lang.Boolean fifoTopic) {
            this.config().fifoTopic(fifoTopic);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}.
         * <p>
         * @return {@code this}
         * @param fifoTopic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#fifo_topic SnsTopic#fifo_topic}. This parameter is required.
         */
        public Builder fifoTopic(final com.hashicorp.cdktf.IResolvable fifoTopic) {
            this.config().fifoTopic(fifoTopic);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_failure_feedback_role_arn SnsTopic#firehose_failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param firehoseFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_failure_feedback_role_arn SnsTopic#firehose_failure_feedback_role_arn}. This parameter is required.
         */
        public Builder firehoseFailureFeedbackRoleArn(final java.lang.String firehoseFailureFeedbackRoleArn) {
            this.config().firehoseFailureFeedbackRoleArn(firehoseFailureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_role_arn SnsTopic#firehose_success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param firehoseSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_role_arn SnsTopic#firehose_success_feedback_role_arn}. This parameter is required.
         */
        public Builder firehoseSuccessFeedbackRoleArn(final java.lang.String firehoseSuccessFeedbackRoleArn) {
            this.config().firehoseSuccessFeedbackRoleArn(firehoseSuccessFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_sample_rate SnsTopic#firehose_success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param firehoseSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#firehose_success_feedback_sample_rate SnsTopic#firehose_success_feedback_sample_rate}. This parameter is required.
         */
        public Builder firehoseSuccessFeedbackSampleRate(final java.lang.Number firehoseSuccessFeedbackSampleRate) {
            this.config().firehoseSuccessFeedbackSampleRate(firehoseSuccessFeedbackSampleRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_failure_feedback_role_arn SnsTopic#http_failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param httpFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_failure_feedback_role_arn SnsTopic#http_failure_feedback_role_arn}. This parameter is required.
         */
        public Builder httpFailureFeedbackRoleArn(final java.lang.String httpFailureFeedbackRoleArn) {
            this.config().httpFailureFeedbackRoleArn(httpFailureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_role_arn SnsTopic#http_success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param httpSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_role_arn SnsTopic#http_success_feedback_role_arn}. This parameter is required.
         */
        public Builder httpSuccessFeedbackRoleArn(final java.lang.String httpSuccessFeedbackRoleArn) {
            this.config().httpSuccessFeedbackRoleArn(httpSuccessFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_sample_rate SnsTopic#http_success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param httpSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#http_success_feedback_sample_rate SnsTopic#http_success_feedback_sample_rate}. This parameter is required.
         */
        public Builder httpSuccessFeedbackSampleRate(final java.lang.Number httpSuccessFeedbackSampleRate) {
            this.config().httpSuccessFeedbackSampleRate(httpSuccessFeedbackSampleRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#id SnsTopic#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#id SnsTopic#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config().id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#kms_master_key_id SnsTopic#kms_master_key_id}.
         * <p>
         * @return {@code this}
         * @param kmsMasterKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#kms_master_key_id SnsTopic#kms_master_key_id}. This parameter is required.
         */
        public Builder kmsMasterKeyId(final java.lang.String kmsMasterKeyId) {
            this.config().kmsMasterKeyId(kmsMasterKeyId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_failure_feedback_role_arn SnsTopic#lambda_failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param lambdaFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_failure_feedback_role_arn SnsTopic#lambda_failure_feedback_role_arn}. This parameter is required.
         */
        public Builder lambdaFailureFeedbackRoleArn(final java.lang.String lambdaFailureFeedbackRoleArn) {
            this.config().lambdaFailureFeedbackRoleArn(lambdaFailureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_role_arn SnsTopic#lambda_success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param lambdaSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_role_arn SnsTopic#lambda_success_feedback_role_arn}. This parameter is required.
         */
        public Builder lambdaSuccessFeedbackRoleArn(final java.lang.String lambdaSuccessFeedbackRoleArn) {
            this.config().lambdaSuccessFeedbackRoleArn(lambdaSuccessFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_sample_rate SnsTopic#lambda_success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param lambdaSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#lambda_success_feedback_sample_rate SnsTopic#lambda_success_feedback_sample_rate}. This parameter is required.
         */
        public Builder lambdaSuccessFeedbackSampleRate(final java.lang.Number lambdaSuccessFeedbackSampleRate) {
            this.config().lambdaSuccessFeedbackSampleRate(lambdaSuccessFeedbackSampleRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name SnsTopic#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name SnsTopic#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config().name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name_prefix SnsTopic#name_prefix}.
         * <p>
         * @return {@code this}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#name_prefix SnsTopic#name_prefix}. This parameter is required.
         */
        public Builder namePrefix(final java.lang.String namePrefix) {
            this.config().namePrefix(namePrefix);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#policy SnsTopic#policy}.
         * <p>
         * @return {@code this}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#policy SnsTopic#policy}. This parameter is required.
         */
        public Builder policy(final java.lang.String policy) {
            this.config().policy(policy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#signature_version SnsTopic#signature_version}.
         * <p>
         * @return {@code this}
         * @param signatureVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#signature_version SnsTopic#signature_version}. This parameter is required.
         */
        public Builder signatureVersion(final java.lang.Number signatureVersion) {
            this.config().signatureVersion(signatureVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_failure_feedback_role_arn SnsTopic#sqs_failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param sqsFailureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_failure_feedback_role_arn SnsTopic#sqs_failure_feedback_role_arn}. This parameter is required.
         */
        public Builder sqsFailureFeedbackRoleArn(final java.lang.String sqsFailureFeedbackRoleArn) {
            this.config().sqsFailureFeedbackRoleArn(sqsFailureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_role_arn SnsTopic#sqs_success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param sqsSuccessFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_role_arn SnsTopic#sqs_success_feedback_role_arn}. This parameter is required.
         */
        public Builder sqsSuccessFeedbackRoleArn(final java.lang.String sqsSuccessFeedbackRoleArn) {
            this.config().sqsSuccessFeedbackRoleArn(sqsSuccessFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_sample_rate SnsTopic#sqs_success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param sqsSuccessFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#sqs_success_feedback_sample_rate SnsTopic#sqs_success_feedback_sample_rate}. This parameter is required.
         */
        public Builder sqsSuccessFeedbackSampleRate(final java.lang.Number sqsSuccessFeedbackSampleRate) {
            this.config().sqsSuccessFeedbackSampleRate(sqsSuccessFeedbackSampleRate);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags SnsTopic#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags SnsTopic#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config().tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags_all SnsTopic#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tags_all SnsTopic#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config().tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tracing_config SnsTopic#tracing_config}.
         * <p>
         * @return {@code this}
         * @param tracingConfig Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_topic#tracing_config SnsTopic#tracing_config}. This parameter is required.
         */
        public Builder tracingConfig(final java.lang.String tracingConfig) {
            this.config().tracingConfig(tracingConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sns_topic.SnsTopic}.
         */
        @Override
        public imports.aws.sns_topic.SnsTopic build() {
            return new imports.aws.sns_topic.SnsTopic(
                this.scope,
                this.id,
                this.config != null ? this.config.build() : null
            );
        }

        private imports.aws.sns_topic.SnsTopicConfig.Builder config() {
            if (this.config == null) {
                this.config = new imports.aws.sns_topic.SnsTopicConfig.Builder();
            }
            return this.config;
        }
    }
}
