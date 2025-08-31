package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.865Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCodingMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dialnorm MedialiveChannel#dialnorm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDialnorm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_line MedialiveChannel#drc_line}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDrcLine() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_rf MedialiveChannel#drc_rf}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDrcRf() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height_trim MedialiveChannel#height_trim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHeightTrim() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#surround_trim MedialiveChannel#surround_trim}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSurroundTrim() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings> {
        java.lang.Number bitrate;
        java.lang.String codingMode;
        java.lang.Number dialnorm;
        java.lang.String drcLine;
        java.lang.String drcRf;
        java.lang.Number heightTrim;
        java.lang.Number surroundTrim;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getBitrate}
         * @param bitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
         * @return {@code this}
         */
        public Builder bitrate(java.lang.Number bitrate) {
            this.bitrate = bitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getCodingMode}
         * @param codingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#coding_mode MedialiveChannel#coding_mode}.
         * @return {@code this}
         */
        public Builder codingMode(java.lang.String codingMode) {
            this.codingMode = codingMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getDialnorm}
         * @param dialnorm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#dialnorm MedialiveChannel#dialnorm}.
         * @return {@code this}
         */
        public Builder dialnorm(java.lang.Number dialnorm) {
            this.dialnorm = dialnorm;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getDrcLine}
         * @param drcLine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_line MedialiveChannel#drc_line}.
         * @return {@code this}
         */
        public Builder drcLine(java.lang.String drcLine) {
            this.drcLine = drcLine;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getDrcRf}
         * @param drcRf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#drc_rf MedialiveChannel#drc_rf}.
         * @return {@code this}
         */
        public Builder drcRf(java.lang.String drcRf) {
            this.drcRf = drcRf;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getHeightTrim}
         * @param heightTrim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#height_trim MedialiveChannel#height_trim}.
         * @return {@code this}
         */
        public Builder heightTrim(java.lang.Number heightTrim) {
            this.heightTrim = heightTrim;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings#getSurroundTrim}
         * @param surroundTrim Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#surround_trim MedialiveChannel#surround_trim}.
         * @return {@code this}
         */
        public Builder surroundTrim(java.lang.Number surroundTrim) {
            this.surroundTrim = surroundTrim;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings {
        private final java.lang.Number bitrate;
        private final java.lang.String codingMode;
        private final java.lang.Number dialnorm;
        private final java.lang.String drcLine;
        private final java.lang.String drcRf;
        private final java.lang.Number heightTrim;
        private final java.lang.Number surroundTrim;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitrate = software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.codingMode = software.amazon.jsii.Kernel.get(this, "codingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dialnorm = software.amazon.jsii.Kernel.get(this, "dialnorm", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.drcLine = software.amazon.jsii.Kernel.get(this, "drcLine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.drcRf = software.amazon.jsii.Kernel.get(this, "drcRf", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.heightTrim = software.amazon.jsii.Kernel.get(this, "heightTrim", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.surroundTrim = software.amazon.jsii.Kernel.get(this, "surroundTrim", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitrate = builder.bitrate;
            this.codingMode = builder.codingMode;
            this.dialnorm = builder.dialnorm;
            this.drcLine = builder.drcLine;
            this.drcRf = builder.drcRf;
            this.heightTrim = builder.heightTrim;
            this.surroundTrim = builder.surroundTrim;
        }

        @Override
        public final java.lang.Number getBitrate() {
            return this.bitrate;
        }

        @Override
        public final java.lang.String getCodingMode() {
            return this.codingMode;
        }

        @Override
        public final java.lang.Number getDialnorm() {
            return this.dialnorm;
        }

        @Override
        public final java.lang.String getDrcLine() {
            return this.drcLine;
        }

        @Override
        public final java.lang.String getDrcRf() {
            return this.drcRf;
        }

        @Override
        public final java.lang.Number getHeightTrim() {
            return this.heightTrim;
        }

        @Override
        public final java.lang.Number getSurroundTrim() {
            return this.surroundTrim;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBitrate() != null) {
                data.set("bitrate", om.valueToTree(this.getBitrate()));
            }
            if (this.getCodingMode() != null) {
                data.set("codingMode", om.valueToTree(this.getCodingMode()));
            }
            if (this.getDialnorm() != null) {
                data.set("dialnorm", om.valueToTree(this.getDialnorm()));
            }
            if (this.getDrcLine() != null) {
                data.set("drcLine", om.valueToTree(this.getDrcLine()));
            }
            if (this.getDrcRf() != null) {
                data.set("drcRf", om.valueToTree(this.getDrcRf()));
            }
            if (this.getHeightTrim() != null) {
                data.set("heightTrim", om.valueToTree(this.getHeightTrim()));
            }
            if (this.getSurroundTrim() != null) {
                data.set("surroundTrim", om.valueToTree(this.getSurroundTrim()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsAudioDescriptionsCodecSettingsEac3AtmosSettings.Jsii$Proxy) o;

            if (this.bitrate != null ? !this.bitrate.equals(that.bitrate) : that.bitrate != null) return false;
            if (this.codingMode != null ? !this.codingMode.equals(that.codingMode) : that.codingMode != null) return false;
            if (this.dialnorm != null ? !this.dialnorm.equals(that.dialnorm) : that.dialnorm != null) return false;
            if (this.drcLine != null ? !this.drcLine.equals(that.drcLine) : that.drcLine != null) return false;
            if (this.drcRf != null ? !this.drcRf.equals(that.drcRf) : that.drcRf != null) return false;
            if (this.heightTrim != null ? !this.heightTrim.equals(that.heightTrim) : that.heightTrim != null) return false;
            return this.surroundTrim != null ? this.surroundTrim.equals(that.surroundTrim) : that.surroundTrim == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitrate != null ? this.bitrate.hashCode() : 0;
            result = 31 * result + (this.codingMode != null ? this.codingMode.hashCode() : 0);
            result = 31 * result + (this.dialnorm != null ? this.dialnorm.hashCode() : 0);
            result = 31 * result + (this.drcLine != null ? this.drcLine.hashCode() : 0);
            result = 31 * result + (this.drcRf != null ? this.drcRf.hashCode() : 0);
            result = 31 * result + (this.heightTrim != null ? this.heightTrim.hashCode() : 0);
            result = 31 * result + (this.surroundTrim != null ? this.surroundTrim.hashCode() : 0);
            return result;
        }
    }
}
