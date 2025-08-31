package imports.aws.rekognition_stream_processor;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor aws_rekognition_stream_processor}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.182Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.rekognitionStreamProcessor.RekognitionStreamProcessor")
public class RekognitionStreamProcessor extends com.hashicorp.cdktf.TerraformResource {

    protected RekognitionStreamProcessor(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected RekognitionStreamProcessor(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.rekognition_stream_processor.RekognitionStreamProcessor.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor aws_rekognition_stream_processor} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public RekognitionStreamProcessor(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a RekognitionStreamProcessor resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RekognitionStreamProcessor to import. This parameter is required.
     * @param importFromId The id of the existing RekognitionStreamProcessor that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the RekognitionStreamProcessor to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rekognition_stream_processor.RekognitionStreamProcessor.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a RekognitionStreamProcessor resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the RekognitionStreamProcessor to import. This parameter is required.
     * @param importFromId The id of the existing RekognitionStreamProcessor that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.rekognition_stream_processor.RekognitionStreamProcessor.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDataSharingPreference(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putDataSharingPreference", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putInput(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putInput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putNotificationChannel(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNotificationChannel", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOutput(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putOutput", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRegionsOfInterest(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRegionsOfInterest", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings> __cast_cd4240 = (java.util.List<imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDataSharingPreference() {
        software.amazon.jsii.Kernel.call(this, "resetDataSharingPreference", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInput() {
        software.amazon.jsii.Kernel.call(this, "resetInput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetNotificationChannel() {
        software.amazon.jsii.Kernel.call(this, "resetNotificationChannel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutput() {
        software.amazon.jsii.Kernel.call(this, "resetOutput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegionsOfInterest() {
        software.amazon.jsii.Kernel.call(this, "resetRegionsOfInterest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSettings() {
        software.amazon.jsii.Kernel.call(this, "resetSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreferenceList getDataSharingPreference() {
        return software.amazon.jsii.Kernel.get(this, "dataSharingPreference", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreferenceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInputList getInput() {
        return software.amazon.jsii.Kernel.get(this, "input", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInputList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannelList getNotificationChannel() {
        return software.amazon.jsii.Kernel.get(this, "notificationChannel", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannelList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutputList getOutput() {
        return software.amazon.jsii.Kernel.get(this, "output", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutputList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestList getRegionsOfInterest() {
        return software.amazon.jsii.Kernel.get(this, "regionsOfInterest", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterestList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettingsList getSettings() {
        return software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamProcessorArn() {
        return software.amazon.jsii.Kernel.get(this, "streamProcessorArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDataSharingPreferenceInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSharingPreferenceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getInputInput() {
        return software.amazon.jsii.Kernel.get(this, "inputInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNotificationChannelInput() {
        return software.amazon.jsii.Kernel.get(this, "notificationChannelInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOutputInput() {
        return software.amazon.jsii.Kernel.get(this, "outputInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRegionsOfInterestInput() {
        return software.amazon.jsii.Kernel.get(this, "regionsOfInterestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "settingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.rekognition_stream_processor.RekognitionStreamProcessor}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.rekognition_stream_processor.RekognitionStreamProcessor> {
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
        private final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.rekognition_stream_processor.RekognitionStreamProcessorConfig.Builder();
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
         * An identifier you assign to the stream processor.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#name RekognitionStreamProcessor#name}
         * <p>
         * @return {@code this}
         * @param name An identifier you assign to the stream processor. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#role_arn RekognitionStreamProcessor#role_arn}
         * <p>
         * @return {@code this}
         * @param roleArn The Amazon Resource Number (ARN) of the IAM role that allows access to the stream processor. This parameter is required.
         */
        public Builder roleArn(final java.lang.String roleArn) {
            this.config.roleArn(roleArn);
            return this;
        }

        /**
         * data_sharing_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
         * <p>
         * @return {@code this}
         * @param dataSharingPreference data_sharing_preference block. This parameter is required.
         */
        public Builder dataSharingPreference(final com.hashicorp.cdktf.IResolvable dataSharingPreference) {
            this.config.dataSharingPreference(dataSharingPreference);
            return this;
        }
        /**
         * data_sharing_preference block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#data_sharing_preference RekognitionStreamProcessor#data_sharing_preference}
         * <p>
         * @return {@code this}
         * @param dataSharingPreference data_sharing_preference block. This parameter is required.
         */
        public Builder dataSharingPreference(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorDataSharingPreference> dataSharingPreference) {
            this.config.dataSharingPreference(dataSharingPreference);
            return this;
        }

        /**
         * input block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
         * <p>
         * @return {@code this}
         * @param input input block. This parameter is required.
         */
        public Builder input(final com.hashicorp.cdktf.IResolvable input) {
            this.config.input(input);
            return this;
        }
        /**
         * input block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#input RekognitionStreamProcessor#input}
         * <p>
         * @return {@code this}
         * @param input input block. This parameter is required.
         */
        public Builder input(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorInput> input) {
            this.config.input(input);
            return this;
        }

        /**
         * The identifier for your AWS Key Management Service key (AWS KMS key).
         * <p>
         * You can supply the Amazon Resource Name (ARN) of your KMS key, the ID of your KMS key, an alias for your KMS key, or an alias ARN.
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#kms_key_id RekognitionStreamProcessor#kms_key_id}
         * <p>
         * @return {@code this}
         * @param kmsKeyId The identifier for your AWS Key Management Service key (AWS KMS key). This parameter is required.
         */
        public Builder kmsKeyId(final java.lang.String kmsKeyId) {
            this.config.kmsKeyId(kmsKeyId);
            return this;
        }

        /**
         * notification_channel block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
         * <p>
         * @return {@code this}
         * @param notificationChannel notification_channel block. This parameter is required.
         */
        public Builder notificationChannel(final com.hashicorp.cdktf.IResolvable notificationChannel) {
            this.config.notificationChannel(notificationChannel);
            return this;
        }
        /**
         * notification_channel block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#notification_channel RekognitionStreamProcessor#notification_channel}
         * <p>
         * @return {@code this}
         * @param notificationChannel notification_channel block. This parameter is required.
         */
        public Builder notificationChannel(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorNotificationChannel> notificationChannel) {
            this.config.notificationChannel(notificationChannel);
            return this;
        }

        /**
         * output block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
         * <p>
         * @return {@code this}
         * @param output output block. This parameter is required.
         */
        public Builder output(final com.hashicorp.cdktf.IResolvable output) {
            this.config.output(output);
            return this;
        }
        /**
         * output block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#output RekognitionStreamProcessor#output}
         * <p>
         * @return {@code this}
         * @param output output block. This parameter is required.
         */
        public Builder output(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorOutput> output) {
            this.config.output(output);
            return this;
        }

        /**
         * regions_of_interest block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
         * <p>
         * @return {@code this}
         * @param regionsOfInterest regions_of_interest block. This parameter is required.
         */
        public Builder regionsOfInterest(final com.hashicorp.cdktf.IResolvable regionsOfInterest) {
            this.config.regionsOfInterest(regionsOfInterest);
            return this;
        }
        /**
         * regions_of_interest block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#regions_of_interest RekognitionStreamProcessor#regions_of_interest}
         * <p>
         * @return {@code this}
         * @param regionsOfInterest regions_of_interest block. This parameter is required.
         */
        public Builder regionsOfInterest(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorRegionsOfInterest> regionsOfInterest) {
            this.config.regionsOfInterest(regionsOfInterest);
            return this;
        }

        /**
         * settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
         * <p>
         * @return {@code this}
         * @param settings settings block. This parameter is required.
         */
        public Builder settings(final com.hashicorp.cdktf.IResolvable settings) {
            this.config.settings(settings);
            return this;
        }
        /**
         * settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#settings RekognitionStreamProcessor#settings}
         * <p>
         * @return {@code this}
         * @param settings settings block. This parameter is required.
         */
        public Builder settings(final java.util.List<? extends imports.aws.rekognition_stream_processor.RekognitionStreamProcessorSettings> settings) {
            this.config.settings(settings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#tags RekognitionStreamProcessor#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/rekognition_stream_processor#timeouts RekognitionStreamProcessor#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.rekognition_stream_processor.RekognitionStreamProcessorTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.rekognition_stream_processor.RekognitionStreamProcessor}.
         */
        @Override
        public imports.aws.rekognition_stream_processor.RekognitionStreamProcessor build() {
            return new imports.aws.rekognition_stream_processor.RekognitionStreamProcessor(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
