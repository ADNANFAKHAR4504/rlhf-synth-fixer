package imports.aws.mq_broker;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.902Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mqBroker.MqBrokerEncryptionOptionsOutputReference")
public class MqBrokerEncryptionOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MqBrokerEncryptionOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MqBrokerEncryptionOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MqBrokerEncryptionOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUseAwsOwnedKey() {
        software.amazon.jsii.Kernel.call(this, "resetUseAwsOwnedKey", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseAwsOwnedKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "useAwsOwnedKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseAwsOwnedKey() {
        return software.amazon.jsii.Kernel.get(this, "useAwsOwnedKey", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseAwsOwnedKey(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useAwsOwnedKey", java.util.Objects.requireNonNull(value, "useAwsOwnedKey is required"));
    }

    public void setUseAwsOwnedKey(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useAwsOwnedKey", java.util.Objects.requireNonNull(value, "useAwsOwnedKey is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerEncryptionOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.mq_broker.MqBrokerEncryptionOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.mq_broker.MqBrokerEncryptionOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
