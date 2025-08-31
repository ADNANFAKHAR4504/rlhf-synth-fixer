package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.882Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptions")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptions.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * codec_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec_settings MedialiveChannel#codec_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings getCodecSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height MedialiveChannel#height}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHeight() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#respond_to_afd MedialiveChannel#respond_to_afd}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRespondToAfd() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scaling_behavior MedialiveChannel#scaling_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScalingBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sharpness MedialiveChannel#sharpness}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSharpness() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#width MedialiveChannel#width}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getWidth() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptions> {
        java.lang.String name;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings codecSettings;
        java.lang.Number height;
        java.lang.String respondToAfd;
        java.lang.String scalingBehavior;
        java.lang.Number sharpness;
        java.lang.Number width;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#name MedialiveChannel#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getCodecSettings}
         * @param codecSettings codec_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#codec_settings MedialiveChannel#codec_settings}
         * @return {@code this}
         */
        public Builder codecSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings codecSettings) {
            this.codecSettings = codecSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getHeight}
         * @param height Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height MedialiveChannel#height}.
         * @return {@code this}
         */
        public Builder height(java.lang.Number height) {
            this.height = height;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getRespondToAfd}
         * @param respondToAfd Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#respond_to_afd MedialiveChannel#respond_to_afd}.
         * @return {@code this}
         */
        public Builder respondToAfd(java.lang.String respondToAfd) {
            this.respondToAfd = respondToAfd;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getScalingBehavior}
         * @param scalingBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scaling_behavior MedialiveChannel#scaling_behavior}.
         * @return {@code this}
         */
        public Builder scalingBehavior(java.lang.String scalingBehavior) {
            this.scalingBehavior = scalingBehavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getSharpness}
         * @param sharpness Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#sharpness MedialiveChannel#sharpness}.
         * @return {@code this}
         */
        public Builder sharpness(java.lang.Number sharpness) {
            this.sharpness = sharpness;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptions#getWidth}
         * @param width Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#width MedialiveChannel#width}.
         * @return {@code this}
         */
        public Builder width(java.lang.Number width) {
            this.width = width;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptions {
        private final java.lang.String name;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings codecSettings;
        private final java.lang.Number height;
        private final java.lang.String respondToAfd;
        private final java.lang.String scalingBehavior;
        private final java.lang.Number sharpness;
        private final java.lang.Number width;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codecSettings = software.amazon.jsii.Kernel.get(this, "codecSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings.class));
            this.height = software.amazon.jsii.Kernel.get(this, "height", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.respondToAfd = software.amazon.jsii.Kernel.get(this, "respondToAfd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalingBehavior = software.amazon.jsii.Kernel.get(this, "scalingBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sharpness = software.amazon.jsii.Kernel.get(this, "sharpness", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.width = software.amazon.jsii.Kernel.get(this, "width", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.codecSettings = builder.codecSettings;
            this.height = builder.height;
            this.respondToAfd = builder.respondToAfd;
            this.scalingBehavior = builder.scalingBehavior;
            this.sharpness = builder.sharpness;
            this.width = builder.width;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettings getCodecSettings() {
            return this.codecSettings;
        }

        @Override
        public final java.lang.Number getHeight() {
            return this.height;
        }

        @Override
        public final java.lang.String getRespondToAfd() {
            return this.respondToAfd;
        }

        @Override
        public final java.lang.String getScalingBehavior() {
            return this.scalingBehavior;
        }

        @Override
        public final java.lang.Number getSharpness() {
            return this.sharpness;
        }

        @Override
        public final java.lang.Number getWidth() {
            return this.width;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            if (this.getCodecSettings() != null) {
                data.set("codecSettings", om.valueToTree(this.getCodecSettings()));
            }
            if (this.getHeight() != null) {
                data.set("height", om.valueToTree(this.getHeight()));
            }
            if (this.getRespondToAfd() != null) {
                data.set("respondToAfd", om.valueToTree(this.getRespondToAfd()));
            }
            if (this.getScalingBehavior() != null) {
                data.set("scalingBehavior", om.valueToTree(this.getScalingBehavior()));
            }
            if (this.getSharpness() != null) {
                data.set("sharpness", om.valueToTree(this.getSharpness()));
            }
            if (this.getWidth() != null) {
                data.set("width", om.valueToTree(this.getWidth()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptions.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptions.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.codecSettings != null ? !this.codecSettings.equals(that.codecSettings) : that.codecSettings != null) return false;
            if (this.height != null ? !this.height.equals(that.height) : that.height != null) return false;
            if (this.respondToAfd != null ? !this.respondToAfd.equals(that.respondToAfd) : that.respondToAfd != null) return false;
            if (this.scalingBehavior != null ? !this.scalingBehavior.equals(that.scalingBehavior) : that.scalingBehavior != null) return false;
            if (this.sharpness != null ? !this.sharpness.equals(that.sharpness) : that.sharpness != null) return false;
            return this.width != null ? this.width.equals(that.width) : that.width == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.codecSettings != null ? this.codecSettings.hashCode() : 0);
            result = 31 * result + (this.height != null ? this.height.hashCode() : 0);
            result = 31 * result + (this.respondToAfd != null ? this.respondToAfd.hashCode() : 0);
            result = 31 * result + (this.scalingBehavior != null ? this.scalingBehavior.hashCode() : 0);
            result = 31 * result + (this.sharpness != null ? this.sharpness.hashCode() : 0);
            result = 31 * result + (this.width != null ? this.width.hashCode() : 0);
            return result;
        }
    }
}
