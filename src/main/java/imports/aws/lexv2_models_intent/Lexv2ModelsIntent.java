package imports.aws.lexv2_models_intent;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent aws_lexv2models_intent}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.550Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntent")
public class Lexv2ModelsIntent extends com.hashicorp.cdktf.TerraformResource {

    protected Lexv2ModelsIntent(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsIntent(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lexv2_models_intent.Lexv2ModelsIntent.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent aws_lexv2models_intent} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Lexv2ModelsIntent(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsIntent resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsIntent to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsIntent that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Lexv2ModelsIntent to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_intent.Lexv2ModelsIntent.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsIntent resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsIntent to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsIntent that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_intent.Lexv2ModelsIntent.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putClosingSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putClosingSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConfirmationSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putConfirmationSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDialogCodeHook(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDialogCodeHook", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFulfillmentCodeHook(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFulfillmentCodeHook", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInitialResponseSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInitialResponseSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInputContext(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInputContext", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKendraConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putKendraConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutputContext(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOutputContext", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSampleUtterance(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSampleUtterance", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSlotPriority(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSlotPriority", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClosingSetting() {
        software.amazon.jsii.Kernel.call(this, "resetClosingSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConfirmationSetting() {
        software.amazon.jsii.Kernel.call(this, "resetConfirmationSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDialogCodeHook() {
        software.amazon.jsii.Kernel.call(this, "resetDialogCodeHook", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFulfillmentCodeHook() {
        software.amazon.jsii.Kernel.call(this, "resetFulfillmentCodeHook", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInitialResponseSetting() {
        software.amazon.jsii.Kernel.call(this, "resetInitialResponseSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputContext() {
        software.amazon.jsii.Kernel.call(this, "resetInputContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKendraConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetKendraConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputContext() {
        software.amazon.jsii.Kernel.call(this, "resetOutputContext", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParentIntentSignature() {
        software.amazon.jsii.Kernel.call(this, "resetParentIntentSignature", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSampleUtterance() {
        software.amazon.jsii.Kernel.call(this, "resetSampleUtterance", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlotPriority() {
        software.amazon.jsii.Kernel.call(this, "resetSlotPriority", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingList getClosingSetting() {
        return software.amazon.jsii.Kernel.get(this, "closingSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingList getConfirmationSetting() {
        return software.amazon.jsii.Kernel.get(this, "confirmationSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCreationDateTime() {
        return software.amazon.jsii.Kernel.get(this, "creationDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHookList getDialogCodeHook() {
        return software.amazon.jsii.Kernel.get(this, "dialogCodeHook", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHookList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookList getFulfillmentCodeHook() {
        return software.amazon.jsii.Kernel.get(this, "fulfillmentCodeHook", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingList getInitialResponseSetting() {
        return software.amazon.jsii.Kernel.get(this, "initialResponseSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContextList getInputContext() {
        return software.amazon.jsii.Kernel.get(this, "inputContext", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContextList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntentId() {
        return software.amazon.jsii.Kernel.get(this, "intentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfigurationList getKendraConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "kendraConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfigurationList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedDateTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContextList getOutputContext() {
        return software.amazon.jsii.Kernel.get(this, "outputContext", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContextList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtteranceList getSampleUtterance() {
        return software.amazon.jsii.Kernel.get(this, "sampleUtterance", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtteranceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriorityList getSlotPriority() {
        return software.amazon.jsii.Kernel.get(this, "slotPriority", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriorityList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "botIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "botVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getClosingSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "closingSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getConfirmationSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "confirmationSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDialogCodeHookInput() {
        return software.amazon.jsii.Kernel.get(this, "dialogCodeHookInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFulfillmentCodeHookInput() {
        return software.amazon.jsii.Kernel.get(this, "fulfillmentCodeHookInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInitialResponseSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "initialResponseSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInputContextInput() {
        return software.amazon.jsii.Kernel.get(this, "inputContextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKendraConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "kendraConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocaleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "localeIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOutputContextInput() {
        return software.amazon.jsii.Kernel.get(this, "outputContextInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParentIntentSignatureInput() {
        return software.amazon.jsii.Kernel.get(this, "parentIntentSignatureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSampleUtteranceInput() {
        return software.amazon.jsii.Kernel.get(this, "sampleUtteranceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSlotPriorityInput() {
        return software.amazon.jsii.Kernel.get(this, "slotPriorityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBotId() {
        return software.amazon.jsii.Kernel.get(this, "botId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBotId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "botId", java.util.Objects.requireNonNull(value, "botId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBotVersion() {
        return software.amazon.jsii.Kernel.get(this, "botVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBotVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "botVersion", java.util.Objects.requireNonNull(value, "botVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocaleId() {
        return software.amazon.jsii.Kernel.get(this, "localeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocaleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localeId", java.util.Objects.requireNonNull(value, "localeId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParentIntentSignature() {
        return software.amazon.jsii.Kernel.get(this, "parentIntentSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParentIntentSignature(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parentIntentSignature", java.util.Objects.requireNonNull(value, "parentIntentSignature is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lexv2_models_intent.Lexv2ModelsIntent}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lexv2_models_intent.Lexv2ModelsIntent> {
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
        private final imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_id Lexv2ModelsIntent#bot_id}.
         * <p>
         * @return {@code this}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_id Lexv2ModelsIntent#bot_id}. This parameter is required.
         */
        public Builder botId(final java.lang.String botId) {
            this.config.botId(botId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_version Lexv2ModelsIntent#bot_version}.
         * <p>
         * @return {@code this}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#bot_version Lexv2ModelsIntent#bot_version}. This parameter is required.
         */
        public Builder botVersion(final java.lang.String botVersion) {
            this.config.botVersion(botVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#locale_id Lexv2ModelsIntent#locale_id}.
         * <p>
         * @return {@code this}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#locale_id Lexv2ModelsIntent#locale_id}. This parameter is required.
         */
        public Builder localeId(final java.lang.String localeId) {
            this.config.localeId(localeId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#name Lexv2ModelsIntent#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * closing_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_setting Lexv2ModelsIntent#closing_setting}
         * <p>
         * @return {@code this}
         * @param closingSetting closing_setting block. This parameter is required.
         */
        public Builder closingSetting(final com.hashicorp.cdktf.IResolvable closingSetting) {
            this.config.closingSetting(closingSetting);
            return this;
        }
        /**
         * closing_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#closing_setting Lexv2ModelsIntent#closing_setting}
         * <p>
         * @return {@code this}
         * @param closingSetting closing_setting block. This parameter is required.
         */
        public Builder closingSetting(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentClosingSetting> closingSetting) {
            this.config.closingSetting(closingSetting);
            return this;
        }

        /**
         * confirmation_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_setting Lexv2ModelsIntent#confirmation_setting}
         * <p>
         * @return {@code this}
         * @param confirmationSetting confirmation_setting block. This parameter is required.
         */
        public Builder confirmationSetting(final com.hashicorp.cdktf.IResolvable confirmationSetting) {
            this.config.confirmationSetting(confirmationSetting);
            return this;
        }
        /**
         * confirmation_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#confirmation_setting Lexv2ModelsIntent#confirmation_setting}
         * <p>
         * @return {@code this}
         * @param confirmationSetting confirmation_setting block. This parameter is required.
         */
        public Builder confirmationSetting(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentConfirmationSetting> confirmationSetting) {
            this.config.confirmationSetting(confirmationSetting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#description Lexv2ModelsIntent#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#description Lexv2ModelsIntent#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * dialog_code_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_code_hook Lexv2ModelsIntent#dialog_code_hook}
         * <p>
         * @return {@code this}
         * @param dialogCodeHook dialog_code_hook block. This parameter is required.
         */
        public Builder dialogCodeHook(final com.hashicorp.cdktf.IResolvable dialogCodeHook) {
            this.config.dialogCodeHook(dialogCodeHook);
            return this;
        }
        /**
         * dialog_code_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#dialog_code_hook Lexv2ModelsIntent#dialog_code_hook}
         * <p>
         * @return {@code this}
         * @param dialogCodeHook dialog_code_hook block. This parameter is required.
         */
        public Builder dialogCodeHook(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentDialogCodeHook> dialogCodeHook) {
            this.config.dialogCodeHook(dialogCodeHook);
            return this;
        }

        /**
         * fulfillment_code_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_code_hook Lexv2ModelsIntent#fulfillment_code_hook}
         * <p>
         * @return {@code this}
         * @param fulfillmentCodeHook fulfillment_code_hook block. This parameter is required.
         */
        public Builder fulfillmentCodeHook(final com.hashicorp.cdktf.IResolvable fulfillmentCodeHook) {
            this.config.fulfillmentCodeHook(fulfillmentCodeHook);
            return this;
        }
        /**
         * fulfillment_code_hook block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_code_hook Lexv2ModelsIntent#fulfillment_code_hook}
         * <p>
         * @return {@code this}
         * @param fulfillmentCodeHook fulfillment_code_hook block. This parameter is required.
         */
        public Builder fulfillmentCodeHook(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHook> fulfillmentCodeHook) {
            this.config.fulfillmentCodeHook(fulfillmentCodeHook);
            return this;
        }

        /**
         * initial_response_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response_setting Lexv2ModelsIntent#initial_response_setting}
         * <p>
         * @return {@code this}
         * @param initialResponseSetting initial_response_setting block. This parameter is required.
         */
        public Builder initialResponseSetting(final com.hashicorp.cdktf.IResolvable initialResponseSetting) {
            this.config.initialResponseSetting(initialResponseSetting);
            return this;
        }
        /**
         * initial_response_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#initial_response_setting Lexv2ModelsIntent#initial_response_setting}
         * <p>
         * @return {@code this}
         * @param initialResponseSetting initial_response_setting block. This parameter is required.
         */
        public Builder initialResponseSetting(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInitialResponseSetting> initialResponseSetting) {
            this.config.initialResponseSetting(initialResponseSetting);
            return this;
        }

        /**
         * input_context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#input_context Lexv2ModelsIntent#input_context}
         * <p>
         * @return {@code this}
         * @param inputContext input_context block. This parameter is required.
         */
        public Builder inputContext(final com.hashicorp.cdktf.IResolvable inputContext) {
            this.config.inputContext(inputContext);
            return this;
        }
        /**
         * input_context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#input_context Lexv2ModelsIntent#input_context}
         * <p>
         * @return {@code this}
         * @param inputContext input_context block. This parameter is required.
         */
        public Builder inputContext(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentInputContext> inputContext) {
            this.config.inputContext(inputContext);
            return this;
        }

        /**
         * kendra_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_configuration Lexv2ModelsIntent#kendra_configuration}
         * <p>
         * @return {@code this}
         * @param kendraConfiguration kendra_configuration block. This parameter is required.
         */
        public Builder kendraConfiguration(final com.hashicorp.cdktf.IResolvable kendraConfiguration) {
            this.config.kendraConfiguration(kendraConfiguration);
            return this;
        }
        /**
         * kendra_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#kendra_configuration Lexv2ModelsIntent#kendra_configuration}
         * <p>
         * @return {@code this}
         * @param kendraConfiguration kendra_configuration block. This parameter is required.
         */
        public Builder kendraConfiguration(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentKendraConfiguration> kendraConfiguration) {
            this.config.kendraConfiguration(kendraConfiguration);
            return this;
        }

        /**
         * output_context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#output_context Lexv2ModelsIntent#output_context}
         * <p>
         * @return {@code this}
         * @param outputContext output_context block. This parameter is required.
         */
        public Builder outputContext(final com.hashicorp.cdktf.IResolvable outputContext) {
            this.config.outputContext(outputContext);
            return this;
        }
        /**
         * output_context block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#output_context Lexv2ModelsIntent#output_context}
         * <p>
         * @return {@code this}
         * @param outputContext output_context block. This parameter is required.
         */
        public Builder outputContext(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentOutputContext> outputContext) {
            this.config.outputContext(outputContext);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#parent_intent_signature Lexv2ModelsIntent#parent_intent_signature}.
         * <p>
         * @return {@code this}
         * @param parentIntentSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#parent_intent_signature Lexv2ModelsIntent#parent_intent_signature}. This parameter is required.
         */
        public Builder parentIntentSignature(final java.lang.String parentIntentSignature) {
            this.config.parentIntentSignature(parentIntentSignature);
            return this;
        }

        /**
         * sample_utterance block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#sample_utterance Lexv2ModelsIntent#sample_utterance}
         * <p>
         * @return {@code this}
         * @param sampleUtterance sample_utterance block. This parameter is required.
         */
        public Builder sampleUtterance(final com.hashicorp.cdktf.IResolvable sampleUtterance) {
            this.config.sampleUtterance(sampleUtterance);
            return this;
        }
        /**
         * sample_utterance block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#sample_utterance Lexv2ModelsIntent#sample_utterance}
         * <p>
         * @return {@code this}
         * @param sampleUtterance sample_utterance block. This parameter is required.
         */
        public Builder sampleUtterance(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentSampleUtterance> sampleUtterance) {
            this.config.sampleUtterance(sampleUtterance);
            return this;
        }

        /**
         * slot_priority block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_priority Lexv2ModelsIntent#slot_priority}
         * <p>
         * @return {@code this}
         * @param slotPriority slot_priority block. This parameter is required.
         */
        public Builder slotPriority(final com.hashicorp.cdktf.IResolvable slotPriority) {
            this.config.slotPriority(slotPriority);
            return this;
        }
        /**
         * slot_priority block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_priority Lexv2ModelsIntent#slot_priority}
         * <p>
         * @return {@code this}
         * @param slotPriority slot_priority block. This parameter is required.
         */
        public Builder slotPriority(final java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentSlotPriority> slotPriority) {
            this.config.slotPriority(slotPriority);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeouts Lexv2ModelsIntent#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lexv2_models_intent.Lexv2ModelsIntentTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lexv2_models_intent.Lexv2ModelsIntent}.
         */
        @Override
        public imports.aws.lexv2_models_intent.Lexv2ModelsIntent build() {
            return new imports.aws.lexv2_models_intent.Lexv2ModelsIntent(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
