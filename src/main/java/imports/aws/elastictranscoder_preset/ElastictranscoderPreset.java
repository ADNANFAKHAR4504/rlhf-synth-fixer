package imports.aws.elastictranscoder_preset;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset aws_elastictranscoder_preset}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPreset")
public class ElastictranscoderPreset extends com.hashicorp.cdktf.TerraformResource {

    protected ElastictranscoderPreset(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElastictranscoderPreset(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.elastictranscoder_preset.ElastictranscoderPreset.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset aws_elastictranscoder_preset} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public ElastictranscoderPreset(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a ElastictranscoderPreset resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElastictranscoderPreset to import. This parameter is required.
     * @param importFromId The id of the existing ElastictranscoderPreset that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the ElastictranscoderPreset to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastictranscoder_preset.ElastictranscoderPreset.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a ElastictranscoderPreset resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the ElastictranscoderPreset to import. This parameter is required.
     * @param importFromId The id of the existing ElastictranscoderPreset that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.elastictranscoder_preset.ElastictranscoderPreset.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAudio(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio value) {
        software.amazon.jsii.Kernel.call(this, "putAudio", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putAudioCodecOptions(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions value) {
        software.amazon.jsii.Kernel.call(this, "putAudioCodecOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putThumbnails(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails value) {
        software.amazon.jsii.Kernel.call(this, "putThumbnails", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVideo(final @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo value) {
        software.amazon.jsii.Kernel.call(this, "putVideo", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putVideoWatermarks(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks> __cast_cd4240 = (java.util.List<imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putVideoWatermarks", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAudio() {
        software.amazon.jsii.Kernel.call(this, "resetAudio", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAudioCodecOptions() {
        software.amazon.jsii.Kernel.call(this, "resetAudioCodecOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetName() {
        software.amazon.jsii.Kernel.call(this, "resetName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThumbnails() {
        software.amazon.jsii.Kernel.call(this, "resetThumbnails", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideo() {
        software.amazon.jsii.Kernel.call(this, "resetVideo", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoCodecOptions() {
        software.amazon.jsii.Kernel.call(this, "resetVideoCodecOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVideoWatermarks() {
        software.amazon.jsii.Kernel.call(this, "resetVideoWatermarks", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioOutputReference getAudio() {
        return software.amazon.jsii.Kernel.get(this, "audio", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptionsOutputReference getAudioCodecOptions() {
        return software.amazon.jsii.Kernel.get(this, "audioCodecOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnailsOutputReference getThumbnails() {
        return software.amazon.jsii.Kernel.get(this, "thumbnails", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnailsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoOutputReference getVideo() {
        return software.amazon.jsii.Kernel.get(this, "video", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarksList getVideoWatermarks() {
        return software.amazon.jsii.Kernel.get(this, "videoWatermarks", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarksList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions getAudioCodecOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "audioCodecOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio getAudioInput() {
        return software.amazon.jsii.Kernel.get(this, "audioInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerInput() {
        return software.amazon.jsii.Kernel.get(this, "containerInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails getThumbnailsInput() {
        return software.amazon.jsii.Kernel.get(this, "thumbnailsInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVideoCodecOptionsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "videoCodecOptionsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo getVideoInput() {
        return software.amazon.jsii.Kernel.get(this, "videoInput", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVideoWatermarksInput() {
        return software.amazon.jsii.Kernel.get(this, "videoWatermarksInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainer() {
        return software.amazon.jsii.Kernel.get(this, "container", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainer(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "container", java.util.Objects.requireNonNull(value, "container is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getVideoCodecOptions() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "videoCodecOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setVideoCodecOptions(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "videoCodecOptions", java.util.Objects.requireNonNull(value, "videoCodecOptions is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.elastictranscoder_preset.ElastictranscoderPreset}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.elastictranscoder_preset.ElastictranscoderPreset> {
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
        private final imports.aws.elastictranscoder_preset.ElastictranscoderPresetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.elastictranscoder_preset.ElastictranscoderPresetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#container ElastictranscoderPreset#container}.
         * <p>
         * @return {@code this}
         * @param container Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#container ElastictranscoderPreset#container}. This parameter is required.
         */
        public Builder container(final java.lang.String container) {
            this.config.container(container);
            return this;
        }

        /**
         * audio block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio ElastictranscoderPreset#audio}
         * <p>
         * @return {@code this}
         * @param audio audio block. This parameter is required.
         */
        public Builder audio(final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio audio) {
            this.config.audio(audio);
            return this;
        }

        /**
         * audio_codec_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio_codec_options ElastictranscoderPreset#audio_codec_options}
         * <p>
         * @return {@code this}
         * @param audioCodecOptions audio_codec_options block. This parameter is required.
         */
        public Builder audioCodecOptions(final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions audioCodecOptions) {
            this.config.audioCodecOptions(audioCodecOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#description ElastictranscoderPreset#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#description ElastictranscoderPreset#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#id ElastictranscoderPreset#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#id ElastictranscoderPreset#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#name ElastictranscoderPreset#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#name ElastictranscoderPreset#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * thumbnails block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#thumbnails ElastictranscoderPreset#thumbnails}
         * <p>
         * @return {@code this}
         * @param thumbnails thumbnails block. This parameter is required.
         */
        public Builder thumbnails(final imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails thumbnails) {
            this.config.thumbnails(thumbnails);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#type ElastictranscoderPreset#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#type ElastictranscoderPreset#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * video block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video ElastictranscoderPreset#video}
         * <p>
         * @return {@code this}
         * @param video video block. This parameter is required.
         */
        public Builder video(final imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo video) {
            this.config.video(video);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_codec_options ElastictranscoderPreset#video_codec_options}.
         * <p>
         * @return {@code this}
         * @param videoCodecOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_codec_options ElastictranscoderPreset#video_codec_options}. This parameter is required.
         */
        public Builder videoCodecOptions(final java.util.Map<java.lang.String, java.lang.String> videoCodecOptions) {
            this.config.videoCodecOptions(videoCodecOptions);
            return this;
        }

        /**
         * video_watermarks block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_watermarks ElastictranscoderPreset#video_watermarks}
         * <p>
         * @return {@code this}
         * @param videoWatermarks video_watermarks block. This parameter is required.
         */
        public Builder videoWatermarks(final com.hashicorp.cdktf.IResolvable videoWatermarks) {
            this.config.videoWatermarks(videoWatermarks);
            return this;
        }
        /**
         * video_watermarks block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_watermarks ElastictranscoderPreset#video_watermarks}
         * <p>
         * @return {@code this}
         * @param videoWatermarks video_watermarks block. This parameter is required.
         */
        public Builder videoWatermarks(final java.util.List<? extends imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks> videoWatermarks) {
            this.config.videoWatermarks(videoWatermarks);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.elastictranscoder_preset.ElastictranscoderPreset}.
         */
        @Override
        public imports.aws.elastictranscoder_preset.ElastictranscoderPreset build() {
            return new imports.aws.elastictranscoder_preset.ElastictranscoderPreset(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
