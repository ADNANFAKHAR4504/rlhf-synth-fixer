package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.877Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_frames_per_pes MedialiveChannel#audio_frames_per_pes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAudioFramesPerPes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_pids MedialiveChannel#audio_pids}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioPids() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ecm_pid MedialiveChannel#ecm_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEcmPid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_id3_behavior MedialiveChannel#nielsen_id3_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNielsenId3Behavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pat_interval MedialiveChannel#pat_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPatInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_control MedialiveChannel#pcr_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPcrControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_period MedialiveChannel#pcr_period}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPcrPeriod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_pid MedialiveChannel#pcr_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPcrPid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pmt_interval MedialiveChannel#pmt_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPmtInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pmt_pid MedialiveChannel#pmt_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPmtPid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_num MedialiveChannel#program_num}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getProgramNum() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_behavior MedialiveChannel#scte35_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScte35Behavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_pid MedialiveChannel#scte35_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScte35Pid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_behavior MedialiveChannel#timed_metadata_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_pid MedialiveChannel#timed_metadata_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataPid() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#transport_stream_id MedialiveChannel#transport_stream_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTransportStreamId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_pid MedialiveChannel#video_pid}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVideoPid() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings> {
        java.lang.Number audioFramesPerPes;
        java.lang.String audioPids;
        java.lang.String ecmPid;
        java.lang.String nielsenId3Behavior;
        java.lang.Number patInterval;
        java.lang.String pcrControl;
        java.lang.Number pcrPeriod;
        java.lang.String pcrPid;
        java.lang.Number pmtInterval;
        java.lang.String pmtPid;
        java.lang.Number programNum;
        java.lang.String scte35Behavior;
        java.lang.String scte35Pid;
        java.lang.String timedMetadataBehavior;
        java.lang.String timedMetadataPid;
        java.lang.Number transportStreamId;
        java.lang.String videoPid;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getAudioFramesPerPes}
         * @param audioFramesPerPes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_frames_per_pes MedialiveChannel#audio_frames_per_pes}.
         * @return {@code this}
         */
        public Builder audioFramesPerPes(java.lang.Number audioFramesPerPes) {
            this.audioFramesPerPes = audioFramesPerPes;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getAudioPids}
         * @param audioPids Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#audio_pids MedialiveChannel#audio_pids}.
         * @return {@code this}
         */
        public Builder audioPids(java.lang.String audioPids) {
            this.audioPids = audioPids;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getEcmPid}
         * @param ecmPid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#ecm_pid MedialiveChannel#ecm_pid}.
         * @return {@code this}
         */
        public Builder ecmPid(java.lang.String ecmPid) {
            this.ecmPid = ecmPid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getNielsenId3Behavior}
         * @param nielsenId3Behavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#nielsen_id3_behavior MedialiveChannel#nielsen_id3_behavior}.
         * @return {@code this}
         */
        public Builder nielsenId3Behavior(java.lang.String nielsenId3Behavior) {
            this.nielsenId3Behavior = nielsenId3Behavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPatInterval}
         * @param patInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pat_interval MedialiveChannel#pat_interval}.
         * @return {@code this}
         */
        public Builder patInterval(java.lang.Number patInterval) {
            this.patInterval = patInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPcrControl}
         * @param pcrControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_control MedialiveChannel#pcr_control}.
         * @return {@code this}
         */
        public Builder pcrControl(java.lang.String pcrControl) {
            this.pcrControl = pcrControl;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPcrPeriod}
         * @param pcrPeriod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_period MedialiveChannel#pcr_period}.
         * @return {@code this}
         */
        public Builder pcrPeriod(java.lang.Number pcrPeriod) {
            this.pcrPeriod = pcrPeriod;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPcrPid}
         * @param pcrPid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pcr_pid MedialiveChannel#pcr_pid}.
         * @return {@code this}
         */
        public Builder pcrPid(java.lang.String pcrPid) {
            this.pcrPid = pcrPid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPmtInterval}
         * @param pmtInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pmt_interval MedialiveChannel#pmt_interval}.
         * @return {@code this}
         */
        public Builder pmtInterval(java.lang.Number pmtInterval) {
            this.pmtInterval = pmtInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getPmtPid}
         * @param pmtPid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#pmt_pid MedialiveChannel#pmt_pid}.
         * @return {@code this}
         */
        public Builder pmtPid(java.lang.String pmtPid) {
            this.pmtPid = pmtPid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getProgramNum}
         * @param programNum Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#program_num MedialiveChannel#program_num}.
         * @return {@code this}
         */
        public Builder programNum(java.lang.Number programNum) {
            this.programNum = programNum;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getScte35Behavior}
         * @param scte35Behavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_behavior MedialiveChannel#scte35_behavior}.
         * @return {@code this}
         */
        public Builder scte35Behavior(java.lang.String scte35Behavior) {
            this.scte35Behavior = scte35Behavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getScte35Pid}
         * @param scte35Pid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scte35_pid MedialiveChannel#scte35_pid}.
         * @return {@code this}
         */
        public Builder scte35Pid(java.lang.String scte35Pid) {
            this.scte35Pid = scte35Pid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getTimedMetadataBehavior}
         * @param timedMetadataBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_behavior MedialiveChannel#timed_metadata_behavior}.
         * @return {@code this}
         */
        public Builder timedMetadataBehavior(java.lang.String timedMetadataBehavior) {
            this.timedMetadataBehavior = timedMetadataBehavior;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getTimedMetadataPid}
         * @param timedMetadataPid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timed_metadata_pid MedialiveChannel#timed_metadata_pid}.
         * @return {@code this}
         */
        public Builder timedMetadataPid(java.lang.String timedMetadataPid) {
            this.timedMetadataPid = timedMetadataPid;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getTransportStreamId}
         * @param transportStreamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#transport_stream_id MedialiveChannel#transport_stream_id}.
         * @return {@code this}
         */
        public Builder transportStreamId(java.lang.Number transportStreamId) {
            this.transportStreamId = transportStreamId;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings#getVideoPid}
         * @param videoPid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#video_pid MedialiveChannel#video_pid}.
         * @return {@code this}
         */
        public Builder videoPid(java.lang.String videoPid) {
            this.videoPid = videoPid;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings {
        private final java.lang.Number audioFramesPerPes;
        private final java.lang.String audioPids;
        private final java.lang.String ecmPid;
        private final java.lang.String nielsenId3Behavior;
        private final java.lang.Number patInterval;
        private final java.lang.String pcrControl;
        private final java.lang.Number pcrPeriod;
        private final java.lang.String pcrPid;
        private final java.lang.Number pmtInterval;
        private final java.lang.String pmtPid;
        private final java.lang.Number programNum;
        private final java.lang.String scte35Behavior;
        private final java.lang.String scte35Pid;
        private final java.lang.String timedMetadataBehavior;
        private final java.lang.String timedMetadataPid;
        private final java.lang.Number transportStreamId;
        private final java.lang.String videoPid;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioFramesPerPes = software.amazon.jsii.Kernel.get(this, "audioFramesPerPes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.audioPids = software.amazon.jsii.Kernel.get(this, "audioPids", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ecmPid = software.amazon.jsii.Kernel.get(this, "ecmPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nielsenId3Behavior = software.amazon.jsii.Kernel.get(this, "nielsenId3Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.patInterval = software.amazon.jsii.Kernel.get(this, "patInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pcrControl = software.amazon.jsii.Kernel.get(this, "pcrControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pcrPeriod = software.amazon.jsii.Kernel.get(this, "pcrPeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pcrPid = software.amazon.jsii.Kernel.get(this, "pcrPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pmtInterval = software.amazon.jsii.Kernel.get(this, "pmtInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pmtPid = software.amazon.jsii.Kernel.get(this, "pmtPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.programNum = software.amazon.jsii.Kernel.get(this, "programNum", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scte35Behavior = software.amazon.jsii.Kernel.get(this, "scte35Behavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scte35Pid = software.amazon.jsii.Kernel.get(this, "scte35Pid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timedMetadataBehavior = software.amazon.jsii.Kernel.get(this, "timedMetadataBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timedMetadataPid = software.amazon.jsii.Kernel.get(this, "timedMetadataPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transportStreamId = software.amazon.jsii.Kernel.get(this, "transportStreamId", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.videoPid = software.amazon.jsii.Kernel.get(this, "videoPid", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioFramesPerPes = builder.audioFramesPerPes;
            this.audioPids = builder.audioPids;
            this.ecmPid = builder.ecmPid;
            this.nielsenId3Behavior = builder.nielsenId3Behavior;
            this.patInterval = builder.patInterval;
            this.pcrControl = builder.pcrControl;
            this.pcrPeriod = builder.pcrPeriod;
            this.pcrPid = builder.pcrPid;
            this.pmtInterval = builder.pmtInterval;
            this.pmtPid = builder.pmtPid;
            this.programNum = builder.programNum;
            this.scte35Behavior = builder.scte35Behavior;
            this.scte35Pid = builder.scte35Pid;
            this.timedMetadataBehavior = builder.timedMetadataBehavior;
            this.timedMetadataPid = builder.timedMetadataPid;
            this.transportStreamId = builder.transportStreamId;
            this.videoPid = builder.videoPid;
        }

        @Override
        public final java.lang.Number getAudioFramesPerPes() {
            return this.audioFramesPerPes;
        }

        @Override
        public final java.lang.String getAudioPids() {
            return this.audioPids;
        }

        @Override
        public final java.lang.String getEcmPid() {
            return this.ecmPid;
        }

        @Override
        public final java.lang.String getNielsenId3Behavior() {
            return this.nielsenId3Behavior;
        }

        @Override
        public final java.lang.Number getPatInterval() {
            return this.patInterval;
        }

        @Override
        public final java.lang.String getPcrControl() {
            return this.pcrControl;
        }

        @Override
        public final java.lang.Number getPcrPeriod() {
            return this.pcrPeriod;
        }

        @Override
        public final java.lang.String getPcrPid() {
            return this.pcrPid;
        }

        @Override
        public final java.lang.Number getPmtInterval() {
            return this.pmtInterval;
        }

        @Override
        public final java.lang.String getPmtPid() {
            return this.pmtPid;
        }

        @Override
        public final java.lang.Number getProgramNum() {
            return this.programNum;
        }

        @Override
        public final java.lang.String getScte35Behavior() {
            return this.scte35Behavior;
        }

        @Override
        public final java.lang.String getScte35Pid() {
            return this.scte35Pid;
        }

        @Override
        public final java.lang.String getTimedMetadataBehavior() {
            return this.timedMetadataBehavior;
        }

        @Override
        public final java.lang.String getTimedMetadataPid() {
            return this.timedMetadataPid;
        }

        @Override
        public final java.lang.Number getTransportStreamId() {
            return this.transportStreamId;
        }

        @Override
        public final java.lang.String getVideoPid() {
            return this.videoPid;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioFramesPerPes() != null) {
                data.set("audioFramesPerPes", om.valueToTree(this.getAudioFramesPerPes()));
            }
            if (this.getAudioPids() != null) {
                data.set("audioPids", om.valueToTree(this.getAudioPids()));
            }
            if (this.getEcmPid() != null) {
                data.set("ecmPid", om.valueToTree(this.getEcmPid()));
            }
            if (this.getNielsenId3Behavior() != null) {
                data.set("nielsenId3Behavior", om.valueToTree(this.getNielsenId3Behavior()));
            }
            if (this.getPatInterval() != null) {
                data.set("patInterval", om.valueToTree(this.getPatInterval()));
            }
            if (this.getPcrControl() != null) {
                data.set("pcrControl", om.valueToTree(this.getPcrControl()));
            }
            if (this.getPcrPeriod() != null) {
                data.set("pcrPeriod", om.valueToTree(this.getPcrPeriod()));
            }
            if (this.getPcrPid() != null) {
                data.set("pcrPid", om.valueToTree(this.getPcrPid()));
            }
            if (this.getPmtInterval() != null) {
                data.set("pmtInterval", om.valueToTree(this.getPmtInterval()));
            }
            if (this.getPmtPid() != null) {
                data.set("pmtPid", om.valueToTree(this.getPmtPid()));
            }
            if (this.getProgramNum() != null) {
                data.set("programNum", om.valueToTree(this.getProgramNum()));
            }
            if (this.getScte35Behavior() != null) {
                data.set("scte35Behavior", om.valueToTree(this.getScte35Behavior()));
            }
            if (this.getScte35Pid() != null) {
                data.set("scte35Pid", om.valueToTree(this.getScte35Pid()));
            }
            if (this.getTimedMetadataBehavior() != null) {
                data.set("timedMetadataBehavior", om.valueToTree(this.getTimedMetadataBehavior()));
            }
            if (this.getTimedMetadataPid() != null) {
                data.set("timedMetadataPid", om.valueToTree(this.getTimedMetadataPid()));
            }
            if (this.getTransportStreamId() != null) {
                data.set("transportStreamId", om.valueToTree(this.getTransportStreamId()));
            }
            if (this.getVideoPid() != null) {
                data.set("videoPid", om.valueToTree(this.getVideoPid()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsOutputGroupsOutputsOutputSettingsHlsOutputSettingsHlsSettingsStandardHlsSettingsM3U8Settings.Jsii$Proxy) o;

            if (this.audioFramesPerPes != null ? !this.audioFramesPerPes.equals(that.audioFramesPerPes) : that.audioFramesPerPes != null) return false;
            if (this.audioPids != null ? !this.audioPids.equals(that.audioPids) : that.audioPids != null) return false;
            if (this.ecmPid != null ? !this.ecmPid.equals(that.ecmPid) : that.ecmPid != null) return false;
            if (this.nielsenId3Behavior != null ? !this.nielsenId3Behavior.equals(that.nielsenId3Behavior) : that.nielsenId3Behavior != null) return false;
            if (this.patInterval != null ? !this.patInterval.equals(that.patInterval) : that.patInterval != null) return false;
            if (this.pcrControl != null ? !this.pcrControl.equals(that.pcrControl) : that.pcrControl != null) return false;
            if (this.pcrPeriod != null ? !this.pcrPeriod.equals(that.pcrPeriod) : that.pcrPeriod != null) return false;
            if (this.pcrPid != null ? !this.pcrPid.equals(that.pcrPid) : that.pcrPid != null) return false;
            if (this.pmtInterval != null ? !this.pmtInterval.equals(that.pmtInterval) : that.pmtInterval != null) return false;
            if (this.pmtPid != null ? !this.pmtPid.equals(that.pmtPid) : that.pmtPid != null) return false;
            if (this.programNum != null ? !this.programNum.equals(that.programNum) : that.programNum != null) return false;
            if (this.scte35Behavior != null ? !this.scte35Behavior.equals(that.scte35Behavior) : that.scte35Behavior != null) return false;
            if (this.scte35Pid != null ? !this.scte35Pid.equals(that.scte35Pid) : that.scte35Pid != null) return false;
            if (this.timedMetadataBehavior != null ? !this.timedMetadataBehavior.equals(that.timedMetadataBehavior) : that.timedMetadataBehavior != null) return false;
            if (this.timedMetadataPid != null ? !this.timedMetadataPid.equals(that.timedMetadataPid) : that.timedMetadataPid != null) return false;
            if (this.transportStreamId != null ? !this.transportStreamId.equals(that.transportStreamId) : that.transportStreamId != null) return false;
            return this.videoPid != null ? this.videoPid.equals(that.videoPid) : that.videoPid == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioFramesPerPes != null ? this.audioFramesPerPes.hashCode() : 0;
            result = 31 * result + (this.audioPids != null ? this.audioPids.hashCode() : 0);
            result = 31 * result + (this.ecmPid != null ? this.ecmPid.hashCode() : 0);
            result = 31 * result + (this.nielsenId3Behavior != null ? this.nielsenId3Behavior.hashCode() : 0);
            result = 31 * result + (this.patInterval != null ? this.patInterval.hashCode() : 0);
            result = 31 * result + (this.pcrControl != null ? this.pcrControl.hashCode() : 0);
            result = 31 * result + (this.pcrPeriod != null ? this.pcrPeriod.hashCode() : 0);
            result = 31 * result + (this.pcrPid != null ? this.pcrPid.hashCode() : 0);
            result = 31 * result + (this.pmtInterval != null ? this.pmtInterval.hashCode() : 0);
            result = 31 * result + (this.pmtPid != null ? this.pmtPid.hashCode() : 0);
            result = 31 * result + (this.programNum != null ? this.programNum.hashCode() : 0);
            result = 31 * result + (this.scte35Behavior != null ? this.scte35Behavior.hashCode() : 0);
            result = 31 * result + (this.scte35Pid != null ? this.scte35Pid.hashCode() : 0);
            result = 31 * result + (this.timedMetadataBehavior != null ? this.timedMetadataBehavior.hashCode() : 0);
            result = 31 * result + (this.timedMetadataPid != null ? this.timedMetadataPid.hashCode() : 0);
            result = 31 * result + (this.transportStreamId != null ? this.transportStreamId.hashCode() : 0);
            result = 31 * result + (this.videoPid != null ? this.videoPid.hashCode() : 0);
            return result;
        }
    }
}
