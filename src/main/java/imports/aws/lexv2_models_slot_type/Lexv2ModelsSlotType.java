package imports.aws.lexv2_models_slot_type;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type aws_lexv2models_slot_type}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.811Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotType")
public class Lexv2ModelsSlotType extends com.hashicorp.cdktf.TerraformResource {

    protected Lexv2ModelsSlotType(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Lexv2ModelsSlotType(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type aws_lexv2models_slot_type} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Lexv2ModelsSlotType(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsSlotType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsSlotType to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsSlotType that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Lexv2ModelsSlotType to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Lexv2ModelsSlotType resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Lexv2ModelsSlotType to import. This parameter is required.
     * @param importFromId The id of the existing Lexv2ModelsSlotType that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putCompositeSlotTypeSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCompositeSlotTypeSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putExternalSourceSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putExternalSourceSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSlotTypeValues(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSlotTypeValues", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putValueSelectionSetting(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting> __cast_cd4240 = (java.util.List<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putValueSelectionSetting", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCompositeSlotTypeSetting() {
        software.amazon.jsii.Kernel.call(this, "resetCompositeSlotTypeSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExternalSourceSetting() {
        software.amazon.jsii.Kernel.call(this, "resetExternalSourceSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParentSlotTypeSignature() {
        software.amazon.jsii.Kernel.call(this, "resetParentSlotTypeSignature", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlotTypeValues() {
        software.amazon.jsii.Kernel.call(this, "resetSlotTypeValues", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetValueSelectionSetting() {
        software.amazon.jsii.Kernel.call(this, "resetValueSelectionSetting", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSettingList getCompositeSlotTypeSetting() {
        return software.amazon.jsii.Kernel.get(this, "compositeSlotTypeSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSettingList getExternalSourceSetting() {
        return software.amazon.jsii.Kernel.get(this, "externalSourceSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSettingList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotTypeId() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValuesList getSlotTypeValues() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeValues", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValuesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingList getValueSelectionSetting() {
        return software.amazon.jsii.Kernel.get(this, "valueSelectionSetting", software.amazon.jsii.NativeType.forClass(imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "botIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBotVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "botVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCompositeSlotTypeSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "compositeSlotTypeSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getExternalSourceSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "externalSourceSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocaleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "localeIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParentSlotTypeSignatureInput() {
        return software.amazon.jsii.Kernel.get(this, "parentSlotTypeSignatureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSlotTypeValuesInput() {
        return software.amazon.jsii.Kernel.get(this, "slotTypeValuesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getValueSelectionSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "valueSelectionSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getParentSlotTypeSignature() {
        return software.amazon.jsii.Kernel.get(this, "parentSlotTypeSignature", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParentSlotTypeSignature(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parentSlotTypeSignature", java.util.Objects.requireNonNull(value, "parentSlotTypeSignature is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType> {
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
        private final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}.
         * <p>
         * @return {@code this}
         * @param botId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_id Lexv2ModelsSlotType#bot_id}. This parameter is required.
         */
        public Builder botId(final java.lang.String botId) {
            this.config.botId(botId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}.
         * <p>
         * @return {@code this}
         * @param botVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#bot_version Lexv2ModelsSlotType#bot_version}. This parameter is required.
         */
        public Builder botVersion(final java.lang.String botVersion) {
            this.config.botVersion(botVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}.
         * <p>
         * @return {@code this}
         * @param localeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#locale_id Lexv2ModelsSlotType#locale_id}. This parameter is required.
         */
        public Builder localeId(final java.lang.String localeId) {
            this.config.localeId(localeId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * composite_slot_type_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
         * <p>
         * @return {@code this}
         * @param compositeSlotTypeSetting composite_slot_type_setting block. This parameter is required.
         */
        public Builder compositeSlotTypeSetting(final com.hashicorp.cdktf.IResolvable compositeSlotTypeSetting) {
            this.config.compositeSlotTypeSetting(compositeSlotTypeSetting);
            return this;
        }
        /**
         * composite_slot_type_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#composite_slot_type_setting Lexv2ModelsSlotType#composite_slot_type_setting}
         * <p>
         * @return {@code this}
         * @param compositeSlotTypeSetting composite_slot_type_setting block. This parameter is required.
         */
        public Builder compositeSlotTypeSetting(final java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSetting> compositeSlotTypeSetting) {
            this.config.compositeSlotTypeSetting(compositeSlotTypeSetting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#description Lexv2ModelsSlotType#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * external_source_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
         * <p>
         * @return {@code this}
         * @param externalSourceSetting external_source_setting block. This parameter is required.
         */
        public Builder externalSourceSetting(final com.hashicorp.cdktf.IResolvable externalSourceSetting) {
            this.config.externalSourceSetting(externalSourceSetting);
            return this;
        }
        /**
         * external_source_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#external_source_setting Lexv2ModelsSlotType#external_source_setting}
         * <p>
         * @return {@code this}
         * @param externalSourceSetting external_source_setting block. This parameter is required.
         */
        public Builder externalSourceSetting(final java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSetting> externalSourceSetting) {
            this.config.externalSourceSetting(externalSourceSetting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}.
         * <p>
         * @return {@code this}
         * @param parentSlotTypeSignature Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#parent_slot_type_signature Lexv2ModelsSlotType#parent_slot_type_signature}. This parameter is required.
         */
        public Builder parentSlotTypeSignature(final java.lang.String parentSlotTypeSignature) {
            this.config.parentSlotTypeSignature(parentSlotTypeSignature);
            return this;
        }

        /**
         * slot_type_values block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
         * <p>
         * @return {@code this}
         * @param slotTypeValues slot_type_values block. This parameter is required.
         */
        public Builder slotTypeValues(final com.hashicorp.cdktf.IResolvable slotTypeValues) {
            this.config.slotTypeValues(slotTypeValues);
            return this;
        }
        /**
         * slot_type_values block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_values Lexv2ModelsSlotType#slot_type_values}
         * <p>
         * @return {@code this}
         * @param slotTypeValues slot_type_values block. This parameter is required.
         */
        public Builder slotTypeValues(final java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValues> slotTypeValues) {
            this.config.slotTypeValues(slotTypeValues);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#timeouts Lexv2ModelsSlotType#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * value_selection_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
         * <p>
         * @return {@code this}
         * @param valueSelectionSetting value_selection_setting block. This parameter is required.
         */
        public Builder valueSelectionSetting(final com.hashicorp.cdktf.IResolvable valueSelectionSetting) {
            this.config.valueSelectionSetting(valueSelectionSetting);
            return this;
        }
        /**
         * value_selection_setting block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#value_selection_setting Lexv2ModelsSlotType#value_selection_setting}
         * <p>
         * @return {@code this}
         * @param valueSelectionSetting value_selection_setting block. This parameter is required.
         */
        public Builder valueSelectionSetting(final java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSetting> valueSelectionSetting) {
            this.config.valueSelectionSetting(valueSelectionSetting);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType}.
         */
        @Override
        public imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType build() {
            return new imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotType(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
