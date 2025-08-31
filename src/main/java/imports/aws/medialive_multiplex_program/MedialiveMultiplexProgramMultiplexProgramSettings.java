package imports.aws.medialive_multiplex_program;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.893Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettings")
@software.amazon.jsii.Jsii.Proxy(MedialiveMultiplexProgramMultiplexProgramSettings.Jsii$Proxy.class)
public interface MedialiveMultiplexProgramMultiplexProgramSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#preferred_channel_pipeline MedialiveMultiplexProgram#preferred_channel_pipeline}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPreferredChannelPipeline();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#program_number MedialiveMultiplexProgram#program_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getProgramNumber();

    /**
     * service_descriptor block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#service_descriptor MedialiveMultiplexProgram#service_descriptor}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getServiceDescriptor() {
        return null;
    }

    /**
     * video_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#video_settings MedialiveMultiplexProgram#video_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVideoSettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveMultiplexProgramMultiplexProgramSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveMultiplexProgramMultiplexProgramSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveMultiplexProgramMultiplexProgramSettings> {
        java.lang.String preferredChannelPipeline;
        java.lang.Number programNumber;
        java.lang.Object serviceDescriptor;
        java.lang.Object videoSettings;

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getPreferredChannelPipeline}
         * @param preferredChannelPipeline Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#preferred_channel_pipeline MedialiveMultiplexProgram#preferred_channel_pipeline}. This parameter is required.
         * @return {@code this}
         */
        public Builder preferredChannelPipeline(java.lang.String preferredChannelPipeline) {
            this.preferredChannelPipeline = preferredChannelPipeline;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getProgramNumber}
         * @param programNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#program_number MedialiveMultiplexProgram#program_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder programNumber(java.lang.Number programNumber) {
            this.programNumber = programNumber;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getServiceDescriptor}
         * @param serviceDescriptor service_descriptor block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#service_descriptor MedialiveMultiplexProgram#service_descriptor}
         * @return {@code this}
         */
        public Builder serviceDescriptor(com.hashicorp.cdktf.IResolvable serviceDescriptor) {
            this.serviceDescriptor = serviceDescriptor;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getServiceDescriptor}
         * @param serviceDescriptor service_descriptor block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#service_descriptor MedialiveMultiplexProgram#service_descriptor}
         * @return {@code this}
         */
        public Builder serviceDescriptor(java.util.List<? extends imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsServiceDescriptor> serviceDescriptor) {
            this.serviceDescriptor = serviceDescriptor;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getVideoSettings}
         * @param videoSettings video_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#video_settings MedialiveMultiplexProgram#video_settings}
         * @return {@code this}
         */
        public Builder videoSettings(com.hashicorp.cdktf.IResolvable videoSettings) {
            this.videoSettings = videoSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveMultiplexProgramMultiplexProgramSettings#getVideoSettings}
         * @param videoSettings video_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_multiplex_program#video_settings MedialiveMultiplexProgram#video_settings}
         * @return {@code this}
         */
        public Builder videoSettings(java.util.List<? extends imports.aws.medialive_multiplex_program.MedialiveMultiplexProgramMultiplexProgramSettingsVideoSettings> videoSettings) {
            this.videoSettings = videoSettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveMultiplexProgramMultiplexProgramSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveMultiplexProgramMultiplexProgramSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveMultiplexProgramMultiplexProgramSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveMultiplexProgramMultiplexProgramSettings {
        private final java.lang.String preferredChannelPipeline;
        private final java.lang.Number programNumber;
        private final java.lang.Object serviceDescriptor;
        private final java.lang.Object videoSettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.preferredChannelPipeline = software.amazon.jsii.Kernel.get(this, "preferredChannelPipeline", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.programNumber = software.amazon.jsii.Kernel.get(this, "programNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serviceDescriptor = software.amazon.jsii.Kernel.get(this, "serviceDescriptor", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.videoSettings = software.amazon.jsii.Kernel.get(this, "videoSettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.preferredChannelPipeline = java.util.Objects.requireNonNull(builder.preferredChannelPipeline, "preferredChannelPipeline is required");
            this.programNumber = java.util.Objects.requireNonNull(builder.programNumber, "programNumber is required");
            this.serviceDescriptor = builder.serviceDescriptor;
            this.videoSettings = builder.videoSettings;
        }

        @Override
        public final java.lang.String getPreferredChannelPipeline() {
            return this.preferredChannelPipeline;
        }

        @Override
        public final java.lang.Number getProgramNumber() {
            return this.programNumber;
        }

        @Override
        public final java.lang.Object getServiceDescriptor() {
            return this.serviceDescriptor;
        }

        @Override
        public final java.lang.Object getVideoSettings() {
            return this.videoSettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("preferredChannelPipeline", om.valueToTree(this.getPreferredChannelPipeline()));
            data.set("programNumber", om.valueToTree(this.getProgramNumber()));
            if (this.getServiceDescriptor() != null) {
                data.set("serviceDescriptor", om.valueToTree(this.getServiceDescriptor()));
            }
            if (this.getVideoSettings() != null) {
                data.set("videoSettings", om.valueToTree(this.getVideoSettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveMultiplexProgram.MedialiveMultiplexProgramMultiplexProgramSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveMultiplexProgramMultiplexProgramSettings.Jsii$Proxy that = (MedialiveMultiplexProgramMultiplexProgramSettings.Jsii$Proxy) o;

            if (!preferredChannelPipeline.equals(that.preferredChannelPipeline)) return false;
            if (!programNumber.equals(that.programNumber)) return false;
            if (this.serviceDescriptor != null ? !this.serviceDescriptor.equals(that.serviceDescriptor) : that.serviceDescriptor != null) return false;
            return this.videoSettings != null ? this.videoSettings.equals(that.videoSettings) : that.videoSettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.preferredChannelPipeline.hashCode();
            result = 31 * result + (this.programNumber.hashCode());
            result = 31 * result + (this.serviceDescriptor != null ? this.serviceDescriptor.hashCode() : 0);
            result = 31 * result + (this.videoSettings != null ? this.videoSettings.hashCode() : 0);
            return result;
        }
    }
}
