package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.875Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ad_markers MedialiveChannel#ad_markers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdMarkers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#authentication_scheme MedialiveChannel#authentication_scheme}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationScheme() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cache_full_behavior MedialiveChannel#cache_full_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCacheFullBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cache_length MedialiveChannel#cache_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCacheLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_data MedialiveChannel#caption_data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCaptionData() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_action MedialiveChannel#input_loss_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInputLossAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#restart_delay MedialiveChannel#restart_delay}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRestartDelay() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings> {
        java.util.List<java.lang.String> adMarkers;
        java.lang.String authenticationScheme;
        java.lang.String cacheFullBehavior;
        java.lang.Number cacheLength;
        java.lang.String captionData;
        java.lang.String inputLossAction;
        java.lang.Number restartDelay;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getAdMarkers}
         * @param adMarkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ad_markers MedialiveChannel#ad_markers}.
         * @return {@code this}
         */
        public Builder adMarkers(java.util.List<java.lang.String> adMarkers) {
            this.adMarkers = adMarkers;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getAuthenticationScheme}
         * @param authenticationScheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#authentication_scheme MedialiveChannel#authentication_scheme}.
         * @return {@code this}
         */
        public Builder authenticationScheme(java.lang.String authenticationScheme) {
            this.authenticationScheme = authenticationScheme;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getCacheFullBehavior}
         * @param cacheFullBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cache_full_behavior MedialiveChannel#cache_full_behavior}.
         * @return {@code this}
         */
        public Builder cacheFullBehavior(java.lang.String cacheFullBehavior) {
            this.cacheFullBehavior = cacheFullBehavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getCacheLength}
         * @param cacheLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#cache_length MedialiveChannel#cache_length}.
         * @return {@code this}
         */
        public Builder cacheLength(java.lang.Number cacheLength) {
            this.cacheLength = cacheLength;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getCaptionData}
         * @param captionData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#caption_data MedialiveChannel#caption_data}.
         * @return {@code this}
         */
        public Builder captionData(java.lang.String captionData) {
            this.captionData = captionData;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getInputLossAction}
         * @param inputLossAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#input_loss_action MedialiveChannel#input_loss_action}.
         * @return {@code this}
         */
        public Builder inputLossAction(java.lang.String inputLossAction) {
            this.inputLossAction = inputLossAction;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings#getRestartDelay}
         * @param restartDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#restart_delay MedialiveChannel#restart_delay}.
         * @return {@code this}
         */
        public Builder restartDelay(java.lang.Number restartDelay) {
            this.restartDelay = restartDelay;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings {
        private final java.util.List<java.lang.String> adMarkers;
        private final java.lang.String authenticationScheme;
        private final java.lang.String cacheFullBehavior;
        private final java.lang.Number cacheLength;
        private final java.lang.String captionData;
        private final java.lang.String inputLossAction;
        private final java.lang.Number restartDelay;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.adMarkers = software.amazon.jsii.Kernel.get(this, "adMarkers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.authenticationScheme = software.amazon.jsii.Kernel.get(this, "authenticationScheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheFullBehavior = software.amazon.jsii.Kernel.get(this, "cacheFullBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheLength = software.amazon.jsii.Kernel.get(this, "cacheLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.captionData = software.amazon.jsii.Kernel.get(this, "captionData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputLossAction = software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restartDelay = software.amazon.jsii.Kernel.get(this, "restartDelay", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.adMarkers = builder.adMarkers;
            this.authenticationScheme = builder.authenticationScheme;
            this.cacheFullBehavior = builder.cacheFullBehavior;
            this.cacheLength = builder.cacheLength;
            this.captionData = builder.captionData;
            this.inputLossAction = builder.inputLossAction;
            this.restartDelay = builder.restartDelay;
        }

        @Override
        public final java.util.List<java.lang.String> getAdMarkers() {
            return this.adMarkers;
        }

        @Override
        public final java.lang.String getAuthenticationScheme() {
            return this.authenticationScheme;
        }

        @Override
        public final java.lang.String getCacheFullBehavior() {
            return this.cacheFullBehavior;
        }

        @Override
        public final java.lang.Number getCacheLength() {
            return this.cacheLength;
        }

        @Override
        public final java.lang.String getCaptionData() {
            return this.captionData;
        }

        @Override
        public final java.lang.String getInputLossAction() {
            return this.inputLossAction;
        }

        @Override
        public final java.lang.Number getRestartDelay() {
            return this.restartDelay;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAdMarkers() != null) {
                data.set("adMarkers", om.valueToTree(this.getAdMarkers()));
            }
            if (this.getAuthenticationScheme() != null) {
                data.set("authenticationScheme", om.valueToTree(this.getAuthenticationScheme()));
            }
            if (this.getCacheFullBehavior() != null) {
                data.set("cacheFullBehavior", om.valueToTree(this.getCacheFullBehavior()));
            }
            if (this.getCacheLength() != null) {
                data.set("cacheLength", om.valueToTree(this.getCacheLength()));
            }
            if (this.getCaptionData() != null) {
                data.set("captionData", om.valueToTree(this.getCaptionData()));
            }
            if (this.getInputLossAction() != null) {
                data.set("inputLossAction", om.valueToTree(this.getInputLossAction()));
            }
            if (this.getRestartDelay() != null) {
                data.set("restartDelay", om.valueToTree(this.getRestartDelay()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsRtmpGroupSettings.Jsii$Proxy) o;

            if (this.adMarkers != null ? !this.adMarkers.equals(that.adMarkers) : that.adMarkers != null) return false;
            if (this.authenticationScheme != null ? !this.authenticationScheme.equals(that.authenticationScheme) : that.authenticationScheme != null) return false;
            if (this.cacheFullBehavior != null ? !this.cacheFullBehavior.equals(that.cacheFullBehavior) : that.cacheFullBehavior != null) return false;
            if (this.cacheLength != null ? !this.cacheLength.equals(that.cacheLength) : that.cacheLength != null) return false;
            if (this.captionData != null ? !this.captionData.equals(that.captionData) : that.captionData != null) return false;
            if (this.inputLossAction != null ? !this.inputLossAction.equals(that.inputLossAction) : that.inputLossAction != null) return false;
            return this.restartDelay != null ? this.restartDelay.equals(that.restartDelay) : that.restartDelay == null;
        }

        @Override
        public final int hashCode() {
            int result = this.adMarkers != null ? this.adMarkers.hashCode() : 0;
            result = 31 * result + (this.authenticationScheme != null ? this.authenticationScheme.hashCode() : 0);
            result = 31 * result + (this.cacheFullBehavior != null ? this.cacheFullBehavior.hashCode() : 0);
            result = 31 * result + (this.cacheLength != null ? this.cacheLength.hashCode() : 0);
            result = 31 * result + (this.captionData != null ? this.captionData.hashCode() : 0);
            result = 31 * result + (this.inputLossAction != null ? this.inputLossAction.hashCode() : 0);
            result = 31 * result + (this.restartDelay != null ? this.restartDelay.hashCode() : 0);
            return result;
        }
    }
}
