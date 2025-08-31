package imports.aws.iot_thing_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.406Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.iotThingGroup.IotThingGroupPropertiesAttributePayloadOutputReference")
public class IotThingGroupPropertiesAttributePayloadOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected IotThingGroupPropertiesAttributePayloadOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected IotThingGroupPropertiesAttributePayloadOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public IotThingGroupPropertiesAttributePayloadOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAttributes() {
        software.amazon.jsii.Kernel.call(this, "resetAttributes", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "attributesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAttributes(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "attributes", java.util.Objects.requireNonNull(value, "attributes is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.iot_thing_group.IotThingGroupPropertiesAttributePayload value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
