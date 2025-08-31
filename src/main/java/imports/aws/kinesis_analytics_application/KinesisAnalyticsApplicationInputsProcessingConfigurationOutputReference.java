package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.443Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputsProcessingConfigurationOutputReference")
public class KinesisAnalyticsApplicationInputsProcessingConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected KinesisAnalyticsApplicationInputsProcessingConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected KinesisAnalyticsApplicationInputsProcessingConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public KinesisAnalyticsApplicationInputsProcessingConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putLambda(final @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfigurationLambda value) {
        software.amazon.jsii.Kernel.call(this, "putLambda", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfigurationLambdaOutputReference getLambda() {
        return software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfigurationLambdaOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfigurationLambda getLambdaInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfigurationLambda.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
