package imports.aws.elastictranscoder_preset;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.188Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elastictranscoderPreset.ElastictranscoderPresetConfig")
@software.amazon.jsii.Jsii.Proxy(ElastictranscoderPresetConfig.Jsii$Proxy.class)
public interface ElastictranscoderPresetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#container ElastictranscoderPreset#container}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getContainer();

    /**
     * audio block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio ElastictranscoderPreset#audio}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio getAudio() {
        return null;
    }

    /**
     * audio_codec_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio_codec_options ElastictranscoderPreset#audio_codec_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions getAudioCodecOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#description ElastictranscoderPreset#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#id ElastictranscoderPreset#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#name ElastictranscoderPreset#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * thumbnails block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#thumbnails ElastictranscoderPreset#thumbnails}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails getThumbnails() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#type ElastictranscoderPreset#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * video block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video ElastictranscoderPreset#video}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo getVideo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_codec_options ElastictranscoderPreset#video_codec_options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getVideoCodecOptions() {
        return null;
    }

    /**
     * video_watermarks block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_watermarks ElastictranscoderPreset#video_watermarks}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVideoWatermarks() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElastictranscoderPresetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElastictranscoderPresetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElastictranscoderPresetConfig> {
        java.lang.String container;
        imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio audio;
        imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions audioCodecOptions;
        java.lang.String description;
        java.lang.String id;
        java.lang.String name;
        imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails thumbnails;
        java.lang.String type;
        imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo video;
        java.util.Map<java.lang.String, java.lang.String> videoCodecOptions;
        java.lang.Object videoWatermarks;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getContainer}
         * @param container Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#container ElastictranscoderPreset#container}. This parameter is required.
         * @return {@code this}
         */
        public Builder container(java.lang.String container) {
            this.container = container;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getAudio}
         * @param audio audio block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio ElastictranscoderPreset#audio}
         * @return {@code this}
         */
        public Builder audio(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio audio) {
            this.audio = audio;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getAudioCodecOptions}
         * @param audioCodecOptions audio_codec_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#audio_codec_options ElastictranscoderPreset#audio_codec_options}
         * @return {@code this}
         */
        public Builder audioCodecOptions(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions audioCodecOptions) {
            this.audioCodecOptions = audioCodecOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#description ElastictranscoderPreset#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#id ElastictranscoderPreset#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#name ElastictranscoderPreset#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getThumbnails}
         * @param thumbnails thumbnails block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#thumbnails ElastictranscoderPreset#thumbnails}
         * @return {@code this}
         */
        public Builder thumbnails(imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails thumbnails) {
            this.thumbnails = thumbnails;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#type ElastictranscoderPreset#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getVideo}
         * @param video video block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video ElastictranscoderPreset#video}
         * @return {@code this}
         */
        public Builder video(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo video) {
            this.video = video;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getVideoCodecOptions}
         * @param videoCodecOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_codec_options ElastictranscoderPreset#video_codec_options}.
         * @return {@code this}
         */
        public Builder videoCodecOptions(java.util.Map<java.lang.String, java.lang.String> videoCodecOptions) {
            this.videoCodecOptions = videoCodecOptions;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getVideoWatermarks}
         * @param videoWatermarks video_watermarks block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_watermarks ElastictranscoderPreset#video_watermarks}
         * @return {@code this}
         */
        public Builder videoWatermarks(com.hashicorp.cdktf.IResolvable videoWatermarks) {
            this.videoWatermarks = videoWatermarks;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getVideoWatermarks}
         * @param videoWatermarks video_watermarks block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastictranscoder_preset#video_watermarks ElastictranscoderPreset#video_watermarks}
         * @return {@code this}
         */
        public Builder videoWatermarks(java.util.List<? extends imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideoWatermarks> videoWatermarks) {
            this.videoWatermarks = videoWatermarks;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ElastictranscoderPresetConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElastictranscoderPresetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElastictranscoderPresetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElastictranscoderPresetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElastictranscoderPresetConfig {
        private final java.lang.String container;
        private final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio audio;
        private final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions audioCodecOptions;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String name;
        private final imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails thumbnails;
        private final java.lang.String type;
        private final imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo video;
        private final java.util.Map<java.lang.String, java.lang.String> videoCodecOptions;
        private final java.lang.Object videoWatermarks;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.container = software.amazon.jsii.Kernel.get(this, "container", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.audio = software.amazon.jsii.Kernel.get(this, "audio", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio.class));
            this.audioCodecOptions = software.amazon.jsii.Kernel.get(this, "audioCodecOptions", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.thumbnails = software.amazon.jsii.Kernel.get(this, "thumbnails", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.video = software.amazon.jsii.Kernel.get(this, "video", software.amazon.jsii.NativeType.forClass(imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo.class));
            this.videoCodecOptions = software.amazon.jsii.Kernel.get(this, "videoCodecOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.videoWatermarks = software.amazon.jsii.Kernel.get(this, "videoWatermarks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.container = java.util.Objects.requireNonNull(builder.container, "container is required");
            this.audio = builder.audio;
            this.audioCodecOptions = builder.audioCodecOptions;
            this.description = builder.description;
            this.id = builder.id;
            this.name = builder.name;
            this.thumbnails = builder.thumbnails;
            this.type = builder.type;
            this.video = builder.video;
            this.videoCodecOptions = builder.videoCodecOptions;
            this.videoWatermarks = builder.videoWatermarks;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getContainer() {
            return this.container;
        }

        @Override
        public final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudio getAudio() {
            return this.audio;
        }

        @Override
        public final imports.aws.elastictranscoder_preset.ElastictranscoderPresetAudioCodecOptions getAudioCodecOptions() {
            return this.audioCodecOptions;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.elastictranscoder_preset.ElastictranscoderPresetThumbnails getThumbnails() {
            return this.thumbnails;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.elastictranscoder_preset.ElastictranscoderPresetVideo getVideo() {
            return this.video;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getVideoCodecOptions() {
            return this.videoCodecOptions;
        }

        @Override
        public final java.lang.Object getVideoWatermarks() {
            return this.videoWatermarks;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("container", om.valueToTree(this.getContainer()));
            if (this.getAudio() != null) {
                data.set("audio", om.valueToTree(this.getAudio()));
            }
            if (this.getAudioCodecOptions() != null) {
                data.set("audioCodecOptions", om.valueToTree(this.getAudioCodecOptions()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getThumbnails() != null) {
                data.set("thumbnails", om.valueToTree(this.getThumbnails()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }
            if (this.getVideo() != null) {
                data.set("video", om.valueToTree(this.getVideo()));
            }
            if (this.getVideoCodecOptions() != null) {
                data.set("videoCodecOptions", om.valueToTree(this.getVideoCodecOptions()));
            }
            if (this.getVideoWatermarks() != null) {
                data.set("videoWatermarks", om.valueToTree(this.getVideoWatermarks()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elastictranscoderPreset.ElastictranscoderPresetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElastictranscoderPresetConfig.Jsii$Proxy that = (ElastictranscoderPresetConfig.Jsii$Proxy) o;

            if (!container.equals(that.container)) return false;
            if (this.audio != null ? !this.audio.equals(that.audio) : that.audio != null) return false;
            if (this.audioCodecOptions != null ? !this.audioCodecOptions.equals(that.audioCodecOptions) : that.audioCodecOptions != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.thumbnails != null ? !this.thumbnails.equals(that.thumbnails) : that.thumbnails != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
            if (this.video != null ? !this.video.equals(that.video) : that.video != null) return false;
            if (this.videoCodecOptions != null ? !this.videoCodecOptions.equals(that.videoCodecOptions) : that.videoCodecOptions != null) return false;
            if (this.videoWatermarks != null ? !this.videoWatermarks.equals(that.videoWatermarks) : that.videoWatermarks != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.container.hashCode();
            result = 31 * result + (this.audio != null ? this.audio.hashCode() : 0);
            result = 31 * result + (this.audioCodecOptions != null ? this.audioCodecOptions.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.thumbnails != null ? this.thumbnails.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            result = 31 * result + (this.video != null ? this.video.hashCode() : 0);
            result = 31 * result + (this.videoCodecOptions != null ? this.videoCodecOptions.hashCode() : 0);
            result = 31 * result + (this.videoWatermarks != null ? this.videoWatermarks.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
