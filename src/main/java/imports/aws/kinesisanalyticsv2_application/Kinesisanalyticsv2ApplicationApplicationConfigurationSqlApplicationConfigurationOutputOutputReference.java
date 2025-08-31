package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.474Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putDestinationSchema(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema value) {
        software.amazon.jsii.Kernel.call(this, "putDestinationSchema", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisFirehoseOutput(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisFirehoseOutput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKinesisStreamsOutput(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput value) {
        software.amazon.jsii.Kernel.call(this, "putKinesisStreamsOutput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaOutput(final @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaOutput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetKinesisFirehoseOutput() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisFirehoseOutput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKinesisStreamsOutput() {
        software.amazon.jsii.Kernel.call(this, "resetKinesisStreamsOutput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaOutput() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaOutput", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchemaOutputReference getDestinationSchema() {
        return software.amazon.jsii.Kernel.get(this, "destinationSchema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchemaOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutputOutputReference getKinesisFirehoseOutput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutputOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutputOutputReference getKinesisStreamsOutput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamsOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutputOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutputOutputReference getLambdaOutput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutputOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputId() {
        return software.amazon.jsii.Kernel.get(this, "outputId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema getDestinationSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationSchemaInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput getKinesisFirehoseOutputInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisFirehoseOutputInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput getKinesisStreamsOutputInput() {
        return software.amazon.jsii.Kernel.get(this, "kinesisStreamsOutputInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput getLambdaOutputInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaOutputInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
