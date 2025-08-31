package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.859Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelDestinations")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelDestinations.Jsii$Proxy.class)
public interface MedialiveChannelDestinations extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#id MedialiveChannel#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getId();

    /**
     * media_package_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_settings MedialiveChannel#media_package_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMediaPackageSettings() {
        return null;
    }

    /**
     * multiplex_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_settings MedialiveChannel#multiplex_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings getMultiplexSettings() {
        return null;
    }

    /**
     * settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#settings MedialiveChannel#settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelDestinations}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelDestinations}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelDestinations> {
        java.lang.String id;
        java.lang.Object mediaPackageSettings;
        imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings multiplexSettings;
        java.lang.Object settings;

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#id MedialiveChannel#id}. This parameter is required.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getMediaPackageSettings}
         * @param mediaPackageSettings media_package_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_settings MedialiveChannel#media_package_settings}
         * @return {@code this}
         */
        public Builder mediaPackageSettings(com.hashicorp.cdktf.IResolvable mediaPackageSettings) {
            this.mediaPackageSettings = mediaPackageSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getMediaPackageSettings}
         * @param mediaPackageSettings media_package_settings block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#media_package_settings MedialiveChannel#media_package_settings}
         * @return {@code this}
         */
        public Builder mediaPackageSettings(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelDestinationsMediaPackageSettings> mediaPackageSettings) {
            this.mediaPackageSettings = mediaPackageSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getMultiplexSettings}
         * @param multiplexSettings multiplex_settings block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#multiplex_settings MedialiveChannel#multiplex_settings}
         * @return {@code this}
         */
        public Builder multiplexSettings(imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings multiplexSettings) {
            this.multiplexSettings = multiplexSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getSettings}
         * @param settings settings block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#settings MedialiveChannel#settings}
         * @return {@code this}
         */
        public Builder settings(com.hashicorp.cdktf.IResolvable settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelDestinations#getSettings}
         * @param settings settings block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#settings MedialiveChannel#settings}
         * @return {@code this}
         */
        public Builder settings(java.util.List<? extends imports.aws.medialive_channel.MedialiveChannelDestinationsSettings> settings) {
            this.settings = settings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelDestinations}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelDestinations build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelDestinations}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelDestinations {
        private final java.lang.String id;
        private final java.lang.Object mediaPackageSettings;
        private final imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings multiplexSettings;
        private final java.lang.Object settings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mediaPackageSettings = software.amazon.jsii.Kernel.get(this, "mediaPackageSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.multiplexSettings = software.amazon.jsii.Kernel.get(this, "multiplexSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings.class));
            this.settings = software.amazon.jsii.Kernel.get(this, "settings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.id = java.util.Objects.requireNonNull(builder.id, "id is required");
            this.mediaPackageSettings = builder.mediaPackageSettings;
            this.multiplexSettings = builder.multiplexSettings;
            this.settings = builder.settings;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getMediaPackageSettings() {
            return this.mediaPackageSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelDestinationsMultiplexSettings getMultiplexSettings() {
            return this.multiplexSettings;
        }

        @Override
        public final java.lang.Object getSettings() {
            return this.settings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("id", om.valueToTree(this.getId()));
            if (this.getMediaPackageSettings() != null) {
                data.set("mediaPackageSettings", om.valueToTree(this.getMediaPackageSettings()));
            }
            if (this.getMultiplexSettings() != null) {
                data.set("multiplexSettings", om.valueToTree(this.getMultiplexSettings()));
            }
            if (this.getSettings() != null) {
                data.set("settings", om.valueToTree(this.getSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelDestinations"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelDestinations.Jsii$Proxy that = (MedialiveChannelDestinations.Jsii$Proxy) o;

            if (!id.equals(that.id)) return false;
            if (this.mediaPackageSettings != null ? !this.mediaPackageSettings.equals(that.mediaPackageSettings) : that.mediaPackageSettings != null) return false;
            if (this.multiplexSettings != null ? !this.multiplexSettings.equals(that.multiplexSettings) : that.multiplexSettings != null) return false;
            return this.settings != null ? this.settings.equals(that.settings) : that.settings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.id.hashCode();
            result = 31 * result + (this.mediaPackageSettings != null ? this.mediaPackageSettings.hashCode() : 0);
            result = 31 * result + (this.multiplexSettings != null ? this.multiplexSettings.hashCode() : 0);
            result = 31 * result + (this.settings != null ? this.settings.hashCode() : 0);
            return result;
        }
    }
}
