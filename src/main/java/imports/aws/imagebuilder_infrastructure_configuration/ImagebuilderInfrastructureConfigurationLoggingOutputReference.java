package imports.aws.imagebuilder_infrastructure_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.365Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderInfrastructureConfiguration.ImagebuilderInfrastructureConfigurationLoggingOutputReference")
public class ImagebuilderInfrastructureConfigurationLoggingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderInfrastructureConfigurationLoggingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderInfrastructureConfigurationLoggingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderInfrastructureConfigurationLoggingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putS3Logs(final @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs value) {
        software.amazon.jsii.Kernel.call(this, "putS3Logs", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3LogsOutputReference getS3Logs() {
        return software.amazon.jsii.Kernel.get(this, "s3Logs", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3LogsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs getS3LogsInput() {
        return software.amazon.jsii.Kernel.get(this, "s3LogsInput", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLoggingS3Logs.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_infrastructure_configuration.ImagebuilderInfrastructureConfigurationLogging value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
