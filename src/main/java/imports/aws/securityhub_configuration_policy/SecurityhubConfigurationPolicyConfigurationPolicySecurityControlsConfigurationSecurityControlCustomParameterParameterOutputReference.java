package imports.aws.securityhub_configuration_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.388Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubConfigurationPolicy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterOutputReference")
public class SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public void putBool(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool value) {
        software.amazon.jsii.Kernel.call(this, "putBool", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDouble(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble value) {
        software.amazon.jsii.Kernel.call(this, "putDouble", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnum(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum value) {
        software.amazon.jsii.Kernel.call(this, "putEnum", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnumList(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct value) {
        software.amazon.jsii.Kernel.call(this, "putEnumList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInt(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt value) {
        software.amazon.jsii.Kernel.call(this, "putInt", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIntList(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct value) {
        software.amazon.jsii.Kernel.call(this, "putIntList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putString(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString value) {
        software.amazon.jsii.Kernel.call(this, "putString", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStringList(final @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct value) {
        software.amazon.jsii.Kernel.call(this, "putStringList", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetBool() {
        software.amazon.jsii.Kernel.call(this, "resetBool", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDouble() {
        software.amazon.jsii.Kernel.call(this, "resetDouble", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnum() {
        software.amazon.jsii.Kernel.call(this, "resetEnum", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnumList() {
        software.amazon.jsii.Kernel.call(this, "resetEnumList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInt() {
        software.amazon.jsii.Kernel.call(this, "resetInt", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntList() {
        software.amazon.jsii.Kernel.call(this, "resetIntList", software.amazon.jsii.NativeType.VOID);
    }

    public void resetString() {
        software.amazon.jsii.Kernel.call(this, "resetString", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStringList() {
        software.amazon.jsii.Kernel.call(this, "resetStringList", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBoolOutputReference getBool() {
        return software.amazon.jsii.Kernel.get(this, "bool", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBoolOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDoubleOutputReference getDoubleValue() {
        return software.amazon.jsii.Kernel.get(this, "double", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDoubleOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumOutputReference getEnumValue() {
        return software.amazon.jsii.Kernel.get(this, "enum", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStructOutputReference getEnumList() {
        return software.amazon.jsii.Kernel.get(this, "enumList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStructOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntOutputReference getIntValue() {
        return software.amazon.jsii.Kernel.get(this, "int", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStructOutputReference getIntList() {
        return software.amazon.jsii.Kernel.get(this, "intList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStructOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringOutputReference getString() {
        return software.amazon.jsii.Kernel.get(this, "string", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStructOutputReference getStringList() {
        return software.amazon.jsii.Kernel.get(this, "stringList", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStructOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool getBoolInput() {
        return software.amazon.jsii.Kernel.get(this, "boolInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterBool.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble getDoubleInput() {
        return software.amazon.jsii.Kernel.get(this, "doubleInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterDouble.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum getEnumInput() {
        return software.amazon.jsii.Kernel.get(this, "enumInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnum.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct getEnumListInput() {
        return software.amazon.jsii.Kernel.get(this, "enumListInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterEnumListStruct.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt getIntInput() {
        return software.amazon.jsii.Kernel.get(this, "intInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterInt.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct getIntListInput() {
        return software.amazon.jsii.Kernel.get(this, "intListInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterIntListStruct.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString getStringInput() {
        return software.amazon.jsii.Kernel.get(this, "stringInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterString.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct getStringListInput() {
        return software.amazon.jsii.Kernel.get(this, "stringListInput", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameterStringListStruct.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getValueTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "valueTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getValueType() {
        return software.amazon.jsii.Kernel.get(this, "valueType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setValueType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "valueType", java.util.Objects.requireNonNull(value, "valueType is required"));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.securityhub_configuration_policy.SecurityhubConfigurationPolicyConfigurationPolicySecurityControlsConfigurationSecurityControlCustomParameterParameter value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
