package imports.aws.iot_thing_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.406Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotThingGroup.IotThingGroupPropertiesOutputReference")
public class IotThingGroupPropertiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotThingGroupPropertiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotThingGroupPropertiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotThingGroupPropertiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAttributePayload(final @org.jetbrains.annotations.NotNull imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload value) {
        software.amazon.jsii.Kernel.call(this, "putAttributePayload", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAttributePayload() {
        software.amazon.jsii.Kernel.call(this, "resetAttributePayload", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayloadOutputReference getAttributePayload() {
        return software.amazon.jsii.Kernel.get(this, "attributePayload", software.amazon.jsii.NativeType.forClass(imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayloadOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload getAttributePayloadInput() {
        return software.amazon.jsii.Kernel.get(this, "attributePayloadInput", software.amazon.jsii.NativeType.forClass(imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupProperties getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_thing_group.IotThingGroupProperties.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupProperties value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
