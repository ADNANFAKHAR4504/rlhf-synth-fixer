package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference")
public class PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCredentials(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials value) {
        software.amazon.jsii.Kernel.call(this, "putCredentials", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVpc(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc value) {
        software.amazon.jsii.Kernel.call(this, "putVpc", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdditionalBootstrapServers() {
        software.amazon.jsii.Kernel.call(this, "resetAdditionalBootstrapServers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBatchSize() {
        software.amazon.jsii.Kernel.call(this, "resetBatchSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConsumerGroupId() {
        software.amazon.jsii.Kernel.call(this, "resetConsumerGroupId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentials() {
        software.amazon.jsii.Kernel.call(this, "resetCredentials", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumBatchingWindowInSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServerRootCaCertificate() {
        software.amazon.jsii.Kernel.call(this, "resetServerRootCaCertificate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStartingPosition() {
        software.amazon.jsii.Kernel.call(this, "resetStartingPosition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpc() {
        software.amazon.jsii.Kernel.call(this, "resetVpc", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference getCredentials() {
        return software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentialsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpcOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdditionalBootstrapServersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "additionalBootstrapServersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBatchSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "batchSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConsumerGroupIdInput() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials getCredentialsInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersCredentials.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumBatchingWindowInSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerRootCaCertificateInput() {
        return software.amazon.jsii.Kernel.get(this, "serverRootCaCertificateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStartingPositionInput() {
        return software.amazon.jsii.Kernel.get(this, "startingPositionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTopicNameInput() {
        return software.amazon.jsii.Kernel.get(this, "topicNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc getVpcInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersVpc.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdditionalBootstrapServers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "additionalBootstrapServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdditionalBootstrapServers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "additionalBootstrapServers", java.util.Objects.requireNonNull(value, "additionalBootstrapServers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBatchSize() {
        return software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBatchSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "batchSize", java.util.Objects.requireNonNull(value, "batchSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConsumerGroupId() {
        return software.amazon.jsii.Kernel.get(this, "consumerGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConsumerGroupId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "consumerGroupId", java.util.Objects.requireNonNull(value, "consumerGroupId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumBatchingWindowInSeconds() {
        return software.amazon.jsii.Kernel.get(this, "maximumBatchingWindowInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumBatchingWindowInSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumBatchingWindowInSeconds", java.util.Objects.requireNonNull(value, "maximumBatchingWindowInSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerRootCaCertificate() {
        return software.amazon.jsii.Kernel.get(this, "serverRootCaCertificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerRootCaCertificate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverRootCaCertificate", java.util.Objects.requireNonNull(value, "serverRootCaCertificate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStartingPosition() {
        return software.amazon.jsii.Kernel.get(this, "startingPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStartingPosition(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "startingPosition", java.util.Objects.requireNonNull(value, "startingPosition is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTopicName() {
        return software.amazon.jsii.Kernel.get(this, "topicName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTopicName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "topicName", java.util.Objects.requireNonNull(value, "topicName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
