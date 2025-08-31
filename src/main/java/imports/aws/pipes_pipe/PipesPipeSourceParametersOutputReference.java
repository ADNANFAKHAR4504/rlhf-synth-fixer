package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.067Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParametersOutputReference")
public class PipesPipeSourceParametersOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected PipesPipeSourceParametersOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected PipesPipeSourceParametersOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public PipesPipeSourceParametersOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putActivemqBrokerParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters value) {
        software.amazon.jsii.Kernel.call(this, "putActivemqBrokerParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDynamodbStreamParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters value) {
        software.amazon.jsii.Kernel.call(this, "putDynamodbStreamParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFilterCriteria(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria value) {
        software.amazon.jsii.Kernel.call(this, "putFilterCriteria", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisStreamParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisStreamParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putManagedStreamingKafkaParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters value) {
        software.amazon.jsii.Kernel.call(this, "putManagedStreamingKafkaParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRabbitmqBrokerParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters value) {
        software.amazon.jsii.Kernel.call(this, "putRabbitmqBrokerParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSelfManagedKafkaParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSelfManagedKafkaParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSqsQueueParameters(final @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters value) {
        software.amazon.jsii.Kernel.call(this, "putSqsQueueParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActivemqBrokerParameters() {
        software.amazon.jsii.Kernel.call(this, "resetActivemqBrokerParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodbStreamParameters() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodbStreamParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilterCriteria() {
        software.amazon.jsii.Kernel.call(this, "resetFilterCriteria", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisStreamParameters() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisStreamParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManagedStreamingKafkaParameters() {
        software.amazon.jsii.Kernel.call(this, "resetManagedStreamingKafkaParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRabbitmqBrokerParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRabbitmqBrokerParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfManagedKafkaParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSelfManagedKafkaParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSqsQueueParameters() {
        software.amazon.jsii.Kernel.call(this, "resetSqsQueueParameters", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersOutputReference getActivemqBrokerParameters() {
        return software.amazon.jsii.Kernel.get(this, "activemqBrokerParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParametersOutputReference getDynamodbStreamParameters() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteriaOutputReference getFilterCriteria() {
        return software.amazon.jsii.Kernel.get(this, "filterCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteriaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersOutputReference getKinesisStreamParameters() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference getManagedStreamingKafkaParameters() {
        return software.amazon.jsii.Kernel.get(this, "managedStreamingKafkaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference getRabbitmqBrokerParameters() {
        return software.amazon.jsii.Kernel.get(this, "rabbitmqBrokerParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference getSelfManagedKafkaParameters() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedKafkaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParametersOutputReference getSqsQueueParameters() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters getActivemqBrokerParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "activemqBrokerParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters getDynamodbStreamParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbStreamParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria getFilterCriteriaInput() {
        return software.amazon.jsii.Kernel.get(this, "filterCriteriaInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters getKinesisStreamParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters getManagedStreamingKafkaParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "managedStreamingKafkaParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters getRabbitmqBrokerParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "rabbitmqBrokerParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters getSelfManagedKafkaParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedKafkaParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters getSqsQueueParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "sqsQueueParametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParameters getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParameters.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParameters value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
