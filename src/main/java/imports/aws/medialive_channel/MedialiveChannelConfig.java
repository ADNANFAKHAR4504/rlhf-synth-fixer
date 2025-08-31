package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.859Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelConfig")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelConfig.Jsii$Proxy.class)
public interface MedialiveChannelConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channel_class MedialiveChannel#channel_class}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getChannelClass();

    /**
     * destinations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destinations MedialiveChannel#destinations}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDestinations();

    /**
     * encoder_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#encoder_settings MedialiveChannel#encoder_settings}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettings getEncoderSettings();

    /**
     * input_attachments block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_attachments MedialiveChannel#input_attachments}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getInputAttachments();

    /**
     * input_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_specification MedialiveChannel#input_specification}
     */
    @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelInputSpecification getInputSpecification();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * cdi_input_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cdi_input_specification MedialiveChannel#cdi_input_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification getCdiInputSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#id MedialiveChannel#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#log_level MedialiveChannel#log_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogLevel() {
        return null;
    }

    /**
     * maintenance block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance MedialiveChannel#maintenance}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelMaintenance getMaintenance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#role_arn MedialiveChannel#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#start_channel MedialiveChannel#start_channel}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartChannel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tags MedialiveChannel#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tags_all MedialiveChannel#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timeouts MedialiveChannel#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelTimeouts getTimeouts() {
        return null;
    }

    /**
     * vpc block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#vpc MedialiveChannel#vpc}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelVpc getVpc() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelConfig> {
        java.lang.String channelClass;
        java.lang.Object destinations;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettings encoderSettings;
        java.lang.Object inputAttachments;
        imports.aws.medialive_channel.MedialiveChannelInputSpecification inputSpecification;
        java.lang.String name;
        imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification cdiInputSpecification;
        java.lang.String id;
        java.lang.String logLevel;
        imports.aws.medialive_channel.MedialiveChannelMaintenance maintenance;
        java.lang.String roleArn;
        java.lang.Object startChannel;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.medialive_channel.MedialiveChannelTimeouts timeouts;
        imports.aws.medialive_channel.MedialiveChannelVpc vpc;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MedialiveChannelConfig#getChannelClass}
         * @param channelClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#channel_class MedialiveChannel#channel_class}. This parameter is required.
         * @return {@code this}
         */
        public Builder channelClass(java.lang.String channelClass) {
            this.channelClass = channelClass;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getDestinations}
         * @param destinations destinations block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destinations MedialiveChannel#destinations}
         * @return {@code this}
         */
        public Builder destinations(com.hashicorp.cdktf.IResolvable destinations) {
            this.destinations = destinations;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getDestinations}
         * @param destinations destinations block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#destinations MedialiveChannel#destinations}
         * @return {@code this}
         */
        public Builder destinations(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelDestinations> destinations) {
            this.destinations = destinations;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getEncoderSettings}
         * @param encoderSettings encoder_settings block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#encoder_settings MedialiveChannel#encoder_settings}
         * @return {@code this}
         */
        public Builder encoderSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettings encoderSettings) {
            this.encoderSettings = encoderSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getInputAttachments}
         * @param inputAttachments input_attachments block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_attachments MedialiveChannel#input_attachments}
         * @return {@code this}
         */
        public Builder inputAttachments(com.hashicorp.cdktf.IResolvable inputAttachments) {
            this.inputAttachments = inputAttachments;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getInputAttachments}
         * @param inputAttachments input_attachments block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_attachments MedialiveChannel#input_attachments}
         * @return {@code this}
         */
        public Builder inputAttachments(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelInputAttachments> inputAttachments) {
            this.inputAttachments = inputAttachments;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getInputSpecification}
         * @param inputSpecification input_specification block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_specification MedialiveChannel#input_specification}
         * @return {@code this}
         */
        public Builder inputSpecification(imports.aws.medialive_channel.MedialiveChannelInputSpecification inputSpecification) {
            this.inputSpecification = inputSpecification;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getCdiInputSpecification}
         * @param cdiInputSpecification cdi_input_specification block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cdi_input_specification MedialiveChannel#cdi_input_specification}
         * @return {@code this}
         */
        public Builder cdiInputSpecification(imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification cdiInputSpecification) {
            this.cdiInputSpecification = cdiInputSpecification;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#id MedialiveChannel#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getLogLevel}
         * @param logLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#log_level MedialiveChannel#log_level}.
         * @return {@code this}
         */
        public Builder logLevel(java.lang.String logLevel) {
            this.logLevel = logLevel;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getMaintenance}
         * @param maintenance maintenance block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#maintenance MedialiveChannel#maintenance}
         * @return {@code this}
         */
        public Builder maintenance(imports.aws.medialive_channel.MedialiveChannelMaintenance maintenance) {
            this.maintenance = maintenance;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#role_arn MedialiveChannel#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getStartChannel}
         * @param startChannel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#start_channel MedialiveChannel#start_channel}.
         * @return {@code this}
         */
        public Builder startChannel(java.lang.Boolean startChannel) {
            this.startChannel = startChannel;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getStartChannel}
         * @param startChannel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#start_channel MedialiveChannel#start_channel}.
         * @return {@code this}
         */
        public Builder startChannel(com.hashicorp.cdktf.IResolvable startChannel) {
            this.startChannel = startChannel;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tags MedialiveChannel#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tags_all MedialiveChannel#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timeouts MedialiveChannel#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.medialive_channel.MedialiveChannelTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getVpc}
         * @param vpc vpc block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#vpc MedialiveChannel#vpc}
         * @return {@code this}
         */
        public Builder vpc(imports.aws.medialive_channel.MedialiveChannelVpc vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getDependsOn}
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
         * Sets the value of {@link MedialiveChannelConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelConfig#getProvisioners}
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
         * @return a new instance of {@link MedialiveChannelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelConfig {
        private final java.lang.String channelClass;
        private final java.lang.Object destinations;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettings encoderSettings;
        private final java.lang.Object inputAttachments;
        private final imports.aws.medialive_channel.MedialiveChannelInputSpecification inputSpecification;
        private final java.lang.String name;
        private final imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification cdiInputSpecification;
        private final java.lang.String id;
        private final java.lang.String logLevel;
        private final imports.aws.medialive_channel.MedialiveChannelMaintenance maintenance;
        private final java.lang.String roleArn;
        private final java.lang.Object startChannel;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.medialive_channel.MedialiveChannelTimeouts timeouts;
        private final imports.aws.medialive_channel.MedialiveChannelVpc vpc;
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
            this.channelClass = software.amazon.jsii.Kernel.get(this, "channelClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.destinations = software.amazon.jsii.Kernel.get(this, "destinations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.encoderSettings = software.amazon.jsii.Kernel.get(this, "encoderSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettings.class));
            this.inputAttachments = software.amazon.jsii.Kernel.get(this, "inputAttachments", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inputSpecification = software.amazon.jsii.Kernel.get(this, "inputSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelInputSpecification.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cdiInputSpecification = software.amazon.jsii.Kernel.get(this, "cdiInputSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logLevel = software.amazon.jsii.Kernel.get(this, "logLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maintenance = software.amazon.jsii.Kernel.get(this, "maintenance", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelMaintenance.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startChannel = software.amazon.jsii.Kernel.get(this, "startChannel", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelTimeouts.class));
            this.vpc = software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelVpc.class));
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
            this.channelClass = java.util.Objects.requireNonNull(builder.channelClass, "channelClass is required");
            this.destinations = java.util.Objects.requireNonNull(builder.destinations, "destinations is required");
            this.encoderSettings = java.util.Objects.requireNonNull(builder.encoderSettings, "encoderSettings is required");
            this.inputAttachments = java.util.Objects.requireNonNull(builder.inputAttachments, "inputAttachments is required");
            this.inputSpecification = java.util.Objects.requireNonNull(builder.inputSpecification, "inputSpecification is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.cdiInputSpecification = builder.cdiInputSpecification;
            this.id = builder.id;
            this.logLevel = builder.logLevel;
            this.maintenance = builder.maintenance;
            this.roleArn = builder.roleArn;
            this.startChannel = builder.startChannel;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpc = builder.vpc;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getChannelClass() {
            return this.channelClass;
        }

        @Override
        public final java.lang.Object getDestinations() {
            return this.destinations;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettings getEncoderSettings() {
            return this.encoderSettings;
        }

        @Override
        public final java.lang.Object getInputAttachments() {
            return this.inputAttachments;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelInputSpecification getInputSpecification() {
            return this.inputSpecification;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelCdiInputSpecification getCdiInputSpecification() {
            return this.cdiInputSpecification;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLogLevel() {
            return this.logLevel;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelMaintenance getMaintenance() {
            return this.maintenance;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getStartChannel() {
            return this.startChannel;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelVpc getVpc() {
            return this.vpc;
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

            data.set("channelClass", om.valueToTree(this.getChannelClass()));
            data.set("destinations", om.valueToTree(this.getDestinations()));
            data.set("encoderSettings", om.valueToTree(this.getEncoderSettings()));
            data.set("inputAttachments", om.valueToTree(this.getInputAttachments()));
            data.set("inputSpecification", om.valueToTree(this.getInputSpecification()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCdiInputSpecification() != null) {
                data.set("cdiInputSpecification", om.valueToTree(this.getCdiInputSpecification()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogLevel() != null) {
                data.set("logLevel", om.valueToTree(this.getLogLevel()));
            }
            if (this.getMaintenance() != null) {
                data.set("maintenance", om.valueToTree(this.getMaintenance()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
            }
            if (this.getStartChannel() != null) {
                data.set("startChannel", om.valueToTree(this.getStartChannel()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpc() != null) {
                data.set("vpc", om.valueToTree(this.getVpc()));
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
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelConfig.Jsii$Proxy that = (MedialiveChannelConfig.Jsii$Proxy) o;

            if (!channelClass.equals(that.channelClass)) return false;
            if (!destinations.equals(that.destinations)) return false;
            if (!encoderSettings.equals(that.encoderSettings)) return false;
            if (!inputAttachments.equals(that.inputAttachments)) return false;
            if (!inputSpecification.equals(that.inputSpecification)) return false;
            if (!name.equals(that.name)) return false;
            if (this.cdiInputSpecification != null ? !this.cdiInputSpecification.equals(that.cdiInputSpecification) : that.cdiInputSpecification != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logLevel != null ? !this.logLevel.equals(that.logLevel) : that.logLevel != null) return false;
            if (this.maintenance != null ? !this.maintenance.equals(that.maintenance) : that.maintenance != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
            if (this.startChannel != null ? !this.startChannel.equals(that.startChannel) : that.startChannel != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpc != null ? !this.vpc.equals(that.vpc) : that.vpc != null) return false;
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
            int result = this.channelClass.hashCode();
            result = 31 * result + (this.destinations.hashCode());
            result = 31 * result + (this.encoderSettings.hashCode());
            result = 31 * result + (this.inputAttachments.hashCode());
            result = 31 * result + (this.inputSpecification.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.cdiInputSpecification != null ? this.cdiInputSpecification.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logLevel != null ? this.logLevel.hashCode() : 0);
            result = 31 * result + (this.maintenance != null ? this.maintenance.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
            result = 31 * result + (this.startChannel != null ? this.startChannel.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpc != null ? this.vpc.hashCode() : 0);
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
