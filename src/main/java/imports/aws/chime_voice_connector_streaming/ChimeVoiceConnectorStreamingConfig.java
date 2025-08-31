package imports.aws.chime_voice_connector_streaming;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.206Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.chimeVoiceConnectorStreaming.ChimeVoiceConnectorStreamingConfig")
@software.amazon.jsii.Jsii.Proxy(ChimeVoiceConnectorStreamingConfig.Jsii$Proxy.class)
public interface ChimeVoiceConnectorStreamingConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#data_retention ChimeVoiceConnectorStreaming#data_retention}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDataRetention();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#voice_connector_id ChimeVoiceConnectorStreaming#voice_connector_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVoiceConnectorId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#id ChimeVoiceConnectorStreaming#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * media_insights_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#media_insights_configuration ChimeVoiceConnectorStreaming#media_insights_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration getMediaInsightsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#streaming_notification_targets ChimeVoiceConnectorStreaming#streaming_notification_targets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getStreamingNotificationTargets() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ChimeVoiceConnectorStreamingConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ChimeVoiceConnectorStreamingConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ChimeVoiceConnectorStreamingConfig> {
        java.lang.Number dataRetention;
        java.lang.String voiceConnectorId;
        java.lang.Object disabled;
        java.lang.String id;
        imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration mediaInsightsConfiguration;
        java.util.List<java.lang.String> streamingNotificationTargets;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getDataRetention}
         * @param dataRetention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#data_retention ChimeVoiceConnectorStreaming#data_retention}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataRetention(java.lang.Number dataRetention) {
            this.dataRetention = dataRetention;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getVoiceConnectorId}
         * @param voiceConnectorId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#voice_connector_id ChimeVoiceConnectorStreaming#voice_connector_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder voiceConnectorId(java.lang.String voiceConnectorId) {
            this.voiceConnectorId = voiceConnectorId;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
         * @return {@code this}
         */
        public Builder disabled(java.lang.Boolean disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getDisabled}
         * @param disabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#disabled ChimeVoiceConnectorStreaming#disabled}.
         * @return {@code this}
         */
        public Builder disabled(com.hashicorp.cdktf.IResolvable disabled) {
            this.disabled = disabled;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#id ChimeVoiceConnectorStreaming#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getMediaInsightsConfiguration}
         * @param mediaInsightsConfiguration media_insights_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#media_insights_configuration ChimeVoiceConnectorStreaming#media_insights_configuration}
         * @return {@code this}
         */
        public Builder mediaInsightsConfiguration(imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration mediaInsightsConfiguration) {
            this.mediaInsightsConfiguration = mediaInsightsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getStreamingNotificationTargets}
         * @param streamingNotificationTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/chime_voice_connector_streaming#streaming_notification_targets ChimeVoiceConnectorStreaming#streaming_notification_targets}.
         * @return {@code this}
         */
        public Builder streamingNotificationTargets(java.util.List<java.lang.String> streamingNotificationTargets) {
            this.streamingNotificationTargets = streamingNotificationTargets;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getDependsOn}
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
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ChimeVoiceConnectorStreamingConfig#getProvisioners}
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
         * @return a new instance of {@link ChimeVoiceConnectorStreamingConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ChimeVoiceConnectorStreamingConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ChimeVoiceConnectorStreamingConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ChimeVoiceConnectorStreamingConfig {
        private final java.lang.Number dataRetention;
        private final java.lang.String voiceConnectorId;
        private final java.lang.Object disabled;
        private final java.lang.String id;
        private final imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration mediaInsightsConfiguration;
        private final java.util.List<java.lang.String> streamingNotificationTargets;
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
            this.dataRetention = software.amazon.jsii.Kernel.get(this, "dataRetention", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.voiceConnectorId = software.amazon.jsii.Kernel.get(this, "voiceConnectorId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disabled = software.amazon.jsii.Kernel.get(this, "disabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mediaInsightsConfiguration = software.amazon.jsii.Kernel.get(this, "mediaInsightsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration.class));
            this.streamingNotificationTargets = software.amazon.jsii.Kernel.get(this, "streamingNotificationTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.dataRetention = java.util.Objects.requireNonNull(builder.dataRetention, "dataRetention is required");
            this.voiceConnectorId = java.util.Objects.requireNonNull(builder.voiceConnectorId, "voiceConnectorId is required");
            this.disabled = builder.disabled;
            this.id = builder.id;
            this.mediaInsightsConfiguration = builder.mediaInsightsConfiguration;
            this.streamingNotificationTargets = builder.streamingNotificationTargets;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getDataRetention() {
            return this.dataRetention;
        }

        @Override
        public final java.lang.String getVoiceConnectorId() {
            return this.voiceConnectorId;
        }

        @Override
        public final java.lang.Object getDisabled() {
            return this.disabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.chime_voice_connector_streaming.ChimeVoiceConnectorStreamingMediaInsightsConfiguration getMediaInsightsConfiguration() {
            return this.mediaInsightsConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getStreamingNotificationTargets() {
            return this.streamingNotificationTargets;
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

            data.set("dataRetention", om.valueToTree(this.getDataRetention()));
            data.set("voiceConnectorId", om.valueToTree(this.getVoiceConnectorId()));
            if (this.getDisabled() != null) {
                data.set("disabled", om.valueToTree(this.getDisabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMediaInsightsConfiguration() != null) {
                data.set("mediaInsightsConfiguration", om.valueToTree(this.getMediaInsightsConfiguration()));
            }
            if (this.getStreamingNotificationTargets() != null) {
                data.set("streamingNotificationTargets", om.valueToTree(this.getStreamingNotificationTargets()));
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
            struct.set("fqn", om.valueToTree("aws.chimeVoiceConnectorStreaming.ChimeVoiceConnectorStreamingConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ChimeVoiceConnectorStreamingConfig.Jsii$Proxy that = (ChimeVoiceConnectorStreamingConfig.Jsii$Proxy) o;

            if (!dataRetention.equals(that.dataRetention)) return false;
            if (!voiceConnectorId.equals(that.voiceConnectorId)) return false;
            if (this.disabled != null ? !this.disabled.equals(that.disabled) : that.disabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.mediaInsightsConfiguration != null ? !this.mediaInsightsConfiguration.equals(that.mediaInsightsConfiguration) : that.mediaInsightsConfiguration != null) return false;
            if (this.streamingNotificationTargets != null ? !this.streamingNotificationTargets.equals(that.streamingNotificationTargets) : that.streamingNotificationTargets != null) return false;
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
            int result = this.dataRetention.hashCode();
            result = 31 * result + (this.voiceConnectorId.hashCode());
            result = 31 * result + (this.disabled != null ? this.disabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.mediaInsightsConfiguration != null ? this.mediaInsightsConfiguration.hashCode() : 0);
            result = 31 * result + (this.streamingNotificationTargets != null ? this.streamingNotificationTargets.hashCode() : 0);
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
