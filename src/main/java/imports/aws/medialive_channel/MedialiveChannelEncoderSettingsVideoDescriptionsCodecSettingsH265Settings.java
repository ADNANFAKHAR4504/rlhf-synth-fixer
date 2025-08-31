package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.883Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings")
@software.amazon.jsii.Jsii.Proxy(MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings.Jsii$Proxy.class)
public interface MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBitrate();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#framerate_denominator MedialiveChannel#framerate_denominator}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFramerateDenominator();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#framerate_numerator MedialiveChannel#framerate_numerator}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFramerateNumerator();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#adaptive_quantization MedialiveChannel#adaptive_quantization}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdaptiveQuantization() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#afd_signaling MedialiveChannel#afd_signaling}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAfdSignaling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#alternative_transfer_function MedialiveChannel#alternative_transfer_function}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAlternativeTransferFunction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#buf_size MedialiveChannel#buf_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBufSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_metadata MedialiveChannel#color_metadata}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getColorMetadata() {
        return null;
    }

    /**
     * color_space_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_settings MedialiveChannel#color_space_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings getColorSpaceSettings() {
        return null;
    }

    /**
     * filter_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filter_settings MedialiveChannel#filter_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings getFilterSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fixed_afd MedialiveChannel#fixed_afd}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFixedAfd() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#flicker_aq MedialiveChannel#flicker_aq}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFlickerAq() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_closed_cadence MedialiveChannel#gop_closed_cadence}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGopClosedCadence() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_size MedialiveChannel#gop_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getGopSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_size_units MedialiveChannel#gop_size_units}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getGopSizeUnits() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#level MedialiveChannel#level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#look_ahead_rate_control MedialiveChannel#look_ahead_rate_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLookAheadRateControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_bitrate MedialiveChannel#max_bitrate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxBitrate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#min_i_interval MedialiveChannel#min_i_interval}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinIInterval() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#min_qp MedialiveChannel#min_qp}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinQp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mv_over_picture_boundaries MedialiveChannel#mv_over_picture_boundaries}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMvOverPictureBoundaries() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mv_temporal_predictor MedialiveChannel#mv_temporal_predictor}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMvTemporalPredictor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#par_denominator MedialiveChannel#par_denominator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getParDenominator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#par_numerator MedialiveChannel#par_numerator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getParNumerator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#profile MedialiveChannel#profile}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#qvbr_quality_level MedialiveChannel#qvbr_quality_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getQvbrQualityLevel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rate_control_mode MedialiveChannel#rate_control_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRateControlMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scan_type MedialiveChannel#scan_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScanType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scene_change_detect MedialiveChannel#scene_change_detect}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSceneChangeDetect() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#slices MedialiveChannel#slices}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSlices() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tier MedialiveChannel#tier}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTier() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_height MedialiveChannel#tile_height}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTileHeight() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_padding MedialiveChannel#tile_padding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTilePadding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_width MedialiveChannel#tile_width}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTileWidth() {
        return null;
    }

    /**
     * timecode_burnin_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_settings MedialiveChannel#timecode_burnin_settings}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings getTimecodeBurninSettings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_insertion MedialiveChannel#timecode_insertion}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimecodeInsertion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#treeblock_size MedialiveChannel#treeblock_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTreeblockSize() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings> {
        java.lang.Number bitrate;
        java.lang.Number framerateDenominator;
        java.lang.Number framerateNumerator;
        java.lang.String adaptiveQuantization;
        java.lang.String afdSignaling;
        java.lang.String alternativeTransferFunction;
        java.lang.Number bufSize;
        java.lang.String colorMetadata;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings colorSpaceSettings;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings filterSettings;
        java.lang.String fixedAfd;
        java.lang.String flickerAq;
        java.lang.Number gopClosedCadence;
        java.lang.Number gopSize;
        java.lang.String gopSizeUnits;
        java.lang.String level;
        java.lang.String lookAheadRateControl;
        java.lang.Number maxBitrate;
        java.lang.Number minIInterval;
        java.lang.Number minQp;
        java.lang.String mvOverPictureBoundaries;
        java.lang.String mvTemporalPredictor;
        java.lang.Number parDenominator;
        java.lang.Number parNumerator;
        java.lang.String profile;
        java.lang.Number qvbrQualityLevel;
        java.lang.String rateControlMode;
        java.lang.String scanType;
        java.lang.String sceneChangeDetect;
        java.lang.Number slices;
        java.lang.String tier;
        java.lang.Number tileHeight;
        java.lang.String tilePadding;
        java.lang.Number tileWidth;
        imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings timecodeBurninSettings;
        java.lang.String timecodeInsertion;
        java.lang.String treeblockSize;

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getBitrate}
         * @param bitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#bitrate MedialiveChannel#bitrate}. This parameter is required.
         * @return {@code this}
         */
        public Builder bitrate(java.lang.Number bitrate) {
            this.bitrate = bitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getFramerateDenominator}
         * @param framerateDenominator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#framerate_denominator MedialiveChannel#framerate_denominator}. This parameter is required.
         * @return {@code this}
         */
        public Builder framerateDenominator(java.lang.Number framerateDenominator) {
            this.framerateDenominator = framerateDenominator;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getFramerateNumerator}
         * @param framerateNumerator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#framerate_numerator MedialiveChannel#framerate_numerator}. This parameter is required.
         * @return {@code this}
         */
        public Builder framerateNumerator(java.lang.Number framerateNumerator) {
            this.framerateNumerator = framerateNumerator;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getAdaptiveQuantization}
         * @param adaptiveQuantization Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#adaptive_quantization MedialiveChannel#adaptive_quantization}.
         * @return {@code this}
         */
        public Builder adaptiveQuantization(java.lang.String adaptiveQuantization) {
            this.adaptiveQuantization = adaptiveQuantization;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getAfdSignaling}
         * @param afdSignaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#afd_signaling MedialiveChannel#afd_signaling}.
         * @return {@code this}
         */
        public Builder afdSignaling(java.lang.String afdSignaling) {
            this.afdSignaling = afdSignaling;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getAlternativeTransferFunction}
         * @param alternativeTransferFunction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#alternative_transfer_function MedialiveChannel#alternative_transfer_function}.
         * @return {@code this}
         */
        public Builder alternativeTransferFunction(java.lang.String alternativeTransferFunction) {
            this.alternativeTransferFunction = alternativeTransferFunction;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getBufSize}
         * @param bufSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#buf_size MedialiveChannel#buf_size}.
         * @return {@code this}
         */
        public Builder bufSize(java.lang.Number bufSize) {
            this.bufSize = bufSize;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getColorMetadata}
         * @param colorMetadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_metadata MedialiveChannel#color_metadata}.
         * @return {@code this}
         */
        public Builder colorMetadata(java.lang.String colorMetadata) {
            this.colorMetadata = colorMetadata;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getColorSpaceSettings}
         * @param colorSpaceSettings color_space_settings block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#color_space_settings MedialiveChannel#color_space_settings}
         * @return {@code this}
         */
        public Builder colorSpaceSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings colorSpaceSettings) {
            this.colorSpaceSettings = colorSpaceSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getFilterSettings}
         * @param filterSettings filter_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#filter_settings MedialiveChannel#filter_settings}
         * @return {@code this}
         */
        public Builder filterSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings filterSettings) {
            this.filterSettings = filterSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getFixedAfd}
         * @param fixedAfd Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#fixed_afd MedialiveChannel#fixed_afd}.
         * @return {@code this}
         */
        public Builder fixedAfd(java.lang.String fixedAfd) {
            this.fixedAfd = fixedAfd;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getFlickerAq}
         * @param flickerAq Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#flicker_aq MedialiveChannel#flicker_aq}.
         * @return {@code this}
         */
        public Builder flickerAq(java.lang.String flickerAq) {
            this.flickerAq = flickerAq;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getGopClosedCadence}
         * @param gopClosedCadence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_closed_cadence MedialiveChannel#gop_closed_cadence}.
         * @return {@code this}
         */
        public Builder gopClosedCadence(java.lang.Number gopClosedCadence) {
            this.gopClosedCadence = gopClosedCadence;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getGopSize}
         * @param gopSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_size MedialiveChannel#gop_size}.
         * @return {@code this}
         */
        public Builder gopSize(java.lang.Number gopSize) {
            this.gopSize = gopSize;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getGopSizeUnits}
         * @param gopSizeUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#gop_size_units MedialiveChannel#gop_size_units}.
         * @return {@code this}
         */
        public Builder gopSizeUnits(java.lang.String gopSizeUnits) {
            this.gopSizeUnits = gopSizeUnits;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getLevel}
         * @param level Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#level MedialiveChannel#level}.
         * @return {@code this}
         */
        public Builder level(java.lang.String level) {
            this.level = level;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getLookAheadRateControl}
         * @param lookAheadRateControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#look_ahead_rate_control MedialiveChannel#look_ahead_rate_control}.
         * @return {@code this}
         */
        public Builder lookAheadRateControl(java.lang.String lookAheadRateControl) {
            this.lookAheadRateControl = lookAheadRateControl;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getMaxBitrate}
         * @param maxBitrate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#max_bitrate MedialiveChannel#max_bitrate}.
         * @return {@code this}
         */
        public Builder maxBitrate(java.lang.Number maxBitrate) {
            this.maxBitrate = maxBitrate;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getMinIInterval}
         * @param minIInterval Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#min_i_interval MedialiveChannel#min_i_interval}.
         * @return {@code this}
         */
        public Builder minIInterval(java.lang.Number minIInterval) {
            this.minIInterval = minIInterval;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getMinQp}
         * @param minQp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#min_qp MedialiveChannel#min_qp}.
         * @return {@code this}
         */
        public Builder minQp(java.lang.Number minQp) {
            this.minQp = minQp;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getMvOverPictureBoundaries}
         * @param mvOverPictureBoundaries Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mv_over_picture_boundaries MedialiveChannel#mv_over_picture_boundaries}.
         * @return {@code this}
         */
        public Builder mvOverPictureBoundaries(java.lang.String mvOverPictureBoundaries) {
            this.mvOverPictureBoundaries = mvOverPictureBoundaries;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getMvTemporalPredictor}
         * @param mvTemporalPredictor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#mv_temporal_predictor MedialiveChannel#mv_temporal_predictor}.
         * @return {@code this}
         */
        public Builder mvTemporalPredictor(java.lang.String mvTemporalPredictor) {
            this.mvTemporalPredictor = mvTemporalPredictor;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getParDenominator}
         * @param parDenominator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#par_denominator MedialiveChannel#par_denominator}.
         * @return {@code this}
         */
        public Builder parDenominator(java.lang.Number parDenominator) {
            this.parDenominator = parDenominator;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getParNumerator}
         * @param parNumerator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#par_numerator MedialiveChannel#par_numerator}.
         * @return {@code this}
         */
        public Builder parNumerator(java.lang.Number parNumerator) {
            this.parNumerator = parNumerator;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getProfile}
         * @param profile Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#profile MedialiveChannel#profile}.
         * @return {@code this}
         */
        public Builder profile(java.lang.String profile) {
            this.profile = profile;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getQvbrQualityLevel}
         * @param qvbrQualityLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#qvbr_quality_level MedialiveChannel#qvbr_quality_level}.
         * @return {@code this}
         */
        public Builder qvbrQualityLevel(java.lang.Number qvbrQualityLevel) {
            this.qvbrQualityLevel = qvbrQualityLevel;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getRateControlMode}
         * @param rateControlMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#rate_control_mode MedialiveChannel#rate_control_mode}.
         * @return {@code this}
         */
        public Builder rateControlMode(java.lang.String rateControlMode) {
            this.rateControlMode = rateControlMode;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getScanType}
         * @param scanType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scan_type MedialiveChannel#scan_type}.
         * @return {@code this}
         */
        public Builder scanType(java.lang.String scanType) {
            this.scanType = scanType;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getSceneChangeDetect}
         * @param sceneChangeDetect Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#scene_change_detect MedialiveChannel#scene_change_detect}.
         * @return {@code this}
         */
        public Builder sceneChangeDetect(java.lang.String sceneChangeDetect) {
            this.sceneChangeDetect = sceneChangeDetect;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getSlices}
         * @param slices Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#slices MedialiveChannel#slices}.
         * @return {@code this}
         */
        public Builder slices(java.lang.Number slices) {
            this.slices = slices;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTier}
         * @param tier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tier MedialiveChannel#tier}.
         * @return {@code this}
         */
        public Builder tier(java.lang.String tier) {
            this.tier = tier;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTileHeight}
         * @param tileHeight Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_height MedialiveChannel#tile_height}.
         * @return {@code this}
         */
        public Builder tileHeight(java.lang.Number tileHeight) {
            this.tileHeight = tileHeight;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTilePadding}
         * @param tilePadding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_padding MedialiveChannel#tile_padding}.
         * @return {@code this}
         */
        public Builder tilePadding(java.lang.String tilePadding) {
            this.tilePadding = tilePadding;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTileWidth}
         * @param tileWidth Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#tile_width MedialiveChannel#tile_width}.
         * @return {@code this}
         */
        public Builder tileWidth(java.lang.Number tileWidth) {
            this.tileWidth = tileWidth;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTimecodeBurninSettings}
         * @param timecodeBurninSettings timecode_burnin_settings block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_burnin_settings MedialiveChannel#timecode_burnin_settings}
         * @return {@code this}
         */
        public Builder timecodeBurninSettings(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings timecodeBurninSettings) {
            this.timecodeBurninSettings = timecodeBurninSettings;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTimecodeInsertion}
         * @param timecodeInsertion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#timecode_insertion MedialiveChannel#timecode_insertion}.
         * @return {@code this}
         */
        public Builder timecodeInsertion(java.lang.String timecodeInsertion) {
            this.timecodeInsertion = timecodeInsertion;
            return this;
        }

        /**
         * Sets the value of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings#getTreeblockSize}
         * @param treeblockSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/medialive_channel#treeblock_size MedialiveChannel#treeblock_size}.
         * @return {@code this}
         */
        public Builder treeblockSize(java.lang.String treeblockSize) {
            this.treeblockSize = treeblockSize;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings {
        private final java.lang.Number bitrate;
        private final java.lang.Number framerateDenominator;
        private final java.lang.Number framerateNumerator;
        private final java.lang.String adaptiveQuantization;
        private final java.lang.String afdSignaling;
        private final java.lang.String alternativeTransferFunction;
        private final java.lang.Number bufSize;
        private final java.lang.String colorMetadata;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings colorSpaceSettings;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings filterSettings;
        private final java.lang.String fixedAfd;
        private final java.lang.String flickerAq;
        private final java.lang.Number gopClosedCadence;
        private final java.lang.Number gopSize;
        private final java.lang.String gopSizeUnits;
        private final java.lang.String level;
        private final java.lang.String lookAheadRateControl;
        private final java.lang.Number maxBitrate;
        private final java.lang.Number minIInterval;
        private final java.lang.Number minQp;
        private final java.lang.String mvOverPictureBoundaries;
        private final java.lang.String mvTemporalPredictor;
        private final java.lang.Number parDenominator;
        private final java.lang.Number parNumerator;
        private final java.lang.String profile;
        private final java.lang.Number qvbrQualityLevel;
        private final java.lang.String rateControlMode;
        private final java.lang.String scanType;
        private final java.lang.String sceneChangeDetect;
        private final java.lang.Number slices;
        private final java.lang.String tier;
        private final java.lang.Number tileHeight;
        private final java.lang.String tilePadding;
        private final java.lang.Number tileWidth;
        private final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings timecodeBurninSettings;
        private final java.lang.String timecodeInsertion;
        private final java.lang.String treeblockSize;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bitrate = software.amazon.jsii.Kernel.get(this, "bitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.framerateDenominator = software.amazon.jsii.Kernel.get(this, "framerateDenominator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.framerateNumerator = software.amazon.jsii.Kernel.get(this, "framerateNumerator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.adaptiveQuantization = software.amazon.jsii.Kernel.get(this, "adaptiveQuantization", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.afdSignaling = software.amazon.jsii.Kernel.get(this, "afdSignaling", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.alternativeTransferFunction = software.amazon.jsii.Kernel.get(this, "alternativeTransferFunction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bufSize = software.amazon.jsii.Kernel.get(this, "bufSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.colorMetadata = software.amazon.jsii.Kernel.get(this, "colorMetadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.colorSpaceSettings = software.amazon.jsii.Kernel.get(this, "colorSpaceSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings.class));
            this.filterSettings = software.amazon.jsii.Kernel.get(this, "filterSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings.class));
            this.fixedAfd = software.amazon.jsii.Kernel.get(this, "fixedAfd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.flickerAq = software.amazon.jsii.Kernel.get(this, "flickerAq", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.gopClosedCadence = software.amazon.jsii.Kernel.get(this, "gopClosedCadence", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.gopSize = software.amazon.jsii.Kernel.get(this, "gopSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.gopSizeUnits = software.amazon.jsii.Kernel.get(this, "gopSizeUnits", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.level = software.amazon.jsii.Kernel.get(this, "level", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lookAheadRateControl = software.amazon.jsii.Kernel.get(this, "lookAheadRateControl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxBitrate = software.amazon.jsii.Kernel.get(this, "maxBitrate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minIInterval = software.amazon.jsii.Kernel.get(this, "minIInterval", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minQp = software.amazon.jsii.Kernel.get(this, "minQp", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.mvOverPictureBoundaries = software.amazon.jsii.Kernel.get(this, "mvOverPictureBoundaries", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mvTemporalPredictor = software.amazon.jsii.Kernel.get(this, "mvTemporalPredictor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parDenominator = software.amazon.jsii.Kernel.get(this, "parDenominator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parNumerator = software.amazon.jsii.Kernel.get(this, "parNumerator", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.profile = software.amazon.jsii.Kernel.get(this, "profile", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.qvbrQualityLevel = software.amazon.jsii.Kernel.get(this, "qvbrQualityLevel", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rateControlMode = software.amazon.jsii.Kernel.get(this, "rateControlMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scanType = software.amazon.jsii.Kernel.get(this, "scanType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sceneChangeDetect = software.amazon.jsii.Kernel.get(this, "sceneChangeDetect", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slices = software.amazon.jsii.Kernel.get(this, "slices", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tier = software.amazon.jsii.Kernel.get(this, "tier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tileHeight = software.amazon.jsii.Kernel.get(this, "tileHeight", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tilePadding = software.amazon.jsii.Kernel.get(this, "tilePadding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tileWidth = software.amazon.jsii.Kernel.get(this, "tileWidth", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timecodeBurninSettings = software.amazon.jsii.Kernel.get(this, "timecodeBurninSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings.class));
            this.timecodeInsertion = software.amazon.jsii.Kernel.get(this, "timecodeInsertion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.treeblockSize = software.amazon.jsii.Kernel.get(this, "treeblockSize", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bitrate = java.util.Objects.requireNonNull(builder.bitrate, "bitrate is required");
            this.framerateDenominator = java.util.Objects.requireNonNull(builder.framerateDenominator, "framerateDenominator is required");
            this.framerateNumerator = java.util.Objects.requireNonNull(builder.framerateNumerator, "framerateNumerator is required");
            this.adaptiveQuantization = builder.adaptiveQuantization;
            this.afdSignaling = builder.afdSignaling;
            this.alternativeTransferFunction = builder.alternativeTransferFunction;
            this.bufSize = builder.bufSize;
            this.colorMetadata = builder.colorMetadata;
            this.colorSpaceSettings = builder.colorSpaceSettings;
            this.filterSettings = builder.filterSettings;
            this.fixedAfd = builder.fixedAfd;
            this.flickerAq = builder.flickerAq;
            this.gopClosedCadence = builder.gopClosedCadence;
            this.gopSize = builder.gopSize;
            this.gopSizeUnits = builder.gopSizeUnits;
            this.level = builder.level;
            this.lookAheadRateControl = builder.lookAheadRateControl;
            this.maxBitrate = builder.maxBitrate;
            this.minIInterval = builder.minIInterval;
            this.minQp = builder.minQp;
            this.mvOverPictureBoundaries = builder.mvOverPictureBoundaries;
            this.mvTemporalPredictor = builder.mvTemporalPredictor;
            this.parDenominator = builder.parDenominator;
            this.parNumerator = builder.parNumerator;
            this.profile = builder.profile;
            this.qvbrQualityLevel = builder.qvbrQualityLevel;
            this.rateControlMode = builder.rateControlMode;
            this.scanType = builder.scanType;
            this.sceneChangeDetect = builder.sceneChangeDetect;
            this.slices = builder.slices;
            this.tier = builder.tier;
            this.tileHeight = builder.tileHeight;
            this.tilePadding = builder.tilePadding;
            this.tileWidth = builder.tileWidth;
            this.timecodeBurninSettings = builder.timecodeBurninSettings;
            this.timecodeInsertion = builder.timecodeInsertion;
            this.treeblockSize = builder.treeblockSize;
        }

        @Override
        public final java.lang.Number getBitrate() {
            return this.bitrate;
        }

        @Override
        public final java.lang.Number getFramerateDenominator() {
            return this.framerateDenominator;
        }

        @Override
        public final java.lang.Number getFramerateNumerator() {
            return this.framerateNumerator;
        }

        @Override
        public final java.lang.String getAdaptiveQuantization() {
            return this.adaptiveQuantization;
        }

        @Override
        public final java.lang.String getAfdSignaling() {
            return this.afdSignaling;
        }

        @Override
        public final java.lang.String getAlternativeTransferFunction() {
            return this.alternativeTransferFunction;
        }

        @Override
        public final java.lang.Number getBufSize() {
            return this.bufSize;
        }

        @Override
        public final java.lang.String getColorMetadata() {
            return this.colorMetadata;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsColorSpaceSettings getColorSpaceSettings() {
            return this.colorSpaceSettings;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsFilterSettings getFilterSettings() {
            return this.filterSettings;
        }

        @Override
        public final java.lang.String getFixedAfd() {
            return this.fixedAfd;
        }

        @Override
        public final java.lang.String getFlickerAq() {
            return this.flickerAq;
        }

        @Override
        public final java.lang.Number getGopClosedCadence() {
            return this.gopClosedCadence;
        }

        @Override
        public final java.lang.Number getGopSize() {
            return this.gopSize;
        }

        @Override
        public final java.lang.String getGopSizeUnits() {
            return this.gopSizeUnits;
        }

        @Override
        public final java.lang.String getLevel() {
            return this.level;
        }

        @Override
        public final java.lang.String getLookAheadRateControl() {
            return this.lookAheadRateControl;
        }

        @Override
        public final java.lang.Number getMaxBitrate() {
            return this.maxBitrate;
        }

        @Override
        public final java.lang.Number getMinIInterval() {
            return this.minIInterval;
        }

        @Override
        public final java.lang.Number getMinQp() {
            return this.minQp;
        }

        @Override
        public final java.lang.String getMvOverPictureBoundaries() {
            return this.mvOverPictureBoundaries;
        }

        @Override
        public final java.lang.String getMvTemporalPredictor() {
            return this.mvTemporalPredictor;
        }

        @Override
        public final java.lang.Number getParDenominator() {
            return this.parDenominator;
        }

        @Override
        public final java.lang.Number getParNumerator() {
            return this.parNumerator;
        }

        @Override
        public final java.lang.String getProfile() {
            return this.profile;
        }

        @Override
        public final java.lang.Number getQvbrQualityLevel() {
            return this.qvbrQualityLevel;
        }

        @Override
        public final java.lang.String getRateControlMode() {
            return this.rateControlMode;
        }

        @Override
        public final java.lang.String getScanType() {
            return this.scanType;
        }

        @Override
        public final java.lang.String getSceneChangeDetect() {
            return this.sceneChangeDetect;
        }

        @Override
        public final java.lang.Number getSlices() {
            return this.slices;
        }

        @Override
        public final java.lang.String getTier() {
            return this.tier;
        }

        @Override
        public final java.lang.Number getTileHeight() {
            return this.tileHeight;
        }

        @Override
        public final java.lang.String getTilePadding() {
            return this.tilePadding;
        }

        @Override
        public final java.lang.Number getTileWidth() {
            return this.tileWidth;
        }

        @Override
        public final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265SettingsTimecodeBurninSettings getTimecodeBurninSettings() {
            return this.timecodeBurninSettings;
        }

        @Override
        public final java.lang.String getTimecodeInsertion() {
            return this.timecodeInsertion;
        }

        @Override
        public final java.lang.String getTreeblockSize() {
            return this.treeblockSize;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("bitrate", om.valueToTree(this.getBitrate()));
            data.set("framerateDenominator", om.valueToTree(this.getFramerateDenominator()));
            data.set("framerateNumerator", om.valueToTree(this.getFramerateNumerator()));
            if (this.getAdaptiveQuantization() != null) {
                data.set("adaptiveQuantization", om.valueToTree(this.getAdaptiveQuantization()));
            }
            if (this.getAfdSignaling() != null) {
                data.set("afdSignaling", om.valueToTree(this.getAfdSignaling()));
            }
            if (this.getAlternativeTransferFunction() != null) {
                data.set("alternativeTransferFunction", om.valueToTree(this.getAlternativeTransferFunction()));
            }
            if (this.getBufSize() != null) {
                data.set("bufSize", om.valueToTree(this.getBufSize()));
            }
            if (this.getColorMetadata() != null) {
                data.set("colorMetadata", om.valueToTree(this.getColorMetadata()));
            }
            if (this.getColorSpaceSettings() != null) {
                data.set("colorSpaceSettings", om.valueToTree(this.getColorSpaceSettings()));
            }
            if (this.getFilterSettings() != null) {
                data.set("filterSettings", om.valueToTree(this.getFilterSettings()));
            }
            if (this.getFixedAfd() != null) {
                data.set("fixedAfd", om.valueToTree(this.getFixedAfd()));
            }
            if (this.getFlickerAq() != null) {
                data.set("flickerAq", om.valueToTree(this.getFlickerAq()));
            }
            if (this.getGopClosedCadence() != null) {
                data.set("gopClosedCadence", om.valueToTree(this.getGopClosedCadence()));
            }
            if (this.getGopSize() != null) {
                data.set("gopSize", om.valueToTree(this.getGopSize()));
            }
            if (this.getGopSizeUnits() != null) {
                data.set("gopSizeUnits", om.valueToTree(this.getGopSizeUnits()));
            }
            if (this.getLevel() != null) {
                data.set("level", om.valueToTree(this.getLevel()));
            }
            if (this.getLookAheadRateControl() != null) {
                data.set("lookAheadRateControl", om.valueToTree(this.getLookAheadRateControl()));
            }
            if (this.getMaxBitrate() != null) {
                data.set("maxBitrate", om.valueToTree(this.getMaxBitrate()));
            }
            if (this.getMinIInterval() != null) {
                data.set("minIInterval", om.valueToTree(this.getMinIInterval()));
            }
            if (this.getMinQp() != null) {
                data.set("minQp", om.valueToTree(this.getMinQp()));
            }
            if (this.getMvOverPictureBoundaries() != null) {
                data.set("mvOverPictureBoundaries", om.valueToTree(this.getMvOverPictureBoundaries()));
            }
            if (this.getMvTemporalPredictor() != null) {
                data.set("mvTemporalPredictor", om.valueToTree(this.getMvTemporalPredictor()));
            }
            if (this.getParDenominator() != null) {
                data.set("parDenominator", om.valueToTree(this.getParDenominator()));
            }
            if (this.getParNumerator() != null) {
                data.set("parNumerator", om.valueToTree(this.getParNumerator()));
            }
            if (this.getProfile() != null) {
                data.set("profile", om.valueToTree(this.getProfile()));
            }
            if (this.getQvbrQualityLevel() != null) {
                data.set("qvbrQualityLevel", om.valueToTree(this.getQvbrQualityLevel()));
            }
            if (this.getRateControlMode() != null) {
                data.set("rateControlMode", om.valueToTree(this.getRateControlMode()));
            }
            if (this.getScanType() != null) {
                data.set("scanType", om.valueToTree(this.getScanType()));
            }
            if (this.getSceneChangeDetect() != null) {
                data.set("sceneChangeDetect", om.valueToTree(this.getSceneChangeDetect()));
            }
            if (this.getSlices() != null) {
                data.set("slices", om.valueToTree(this.getSlices()));
            }
            if (this.getTier() != null) {
                data.set("tier", om.valueToTree(this.getTier()));
            }
            if (this.getTileHeight() != null) {
                data.set("tileHeight", om.valueToTree(this.getTileHeight()));
            }
            if (this.getTilePadding() != null) {
                data.set("tilePadding", om.valueToTree(this.getTilePadding()));
            }
            if (this.getTileWidth() != null) {
                data.set("tileWidth", om.valueToTree(this.getTileWidth()));
            }
            if (this.getTimecodeBurninSettings() != null) {
                data.set("timecodeBurninSettings", om.valueToTree(this.getTimecodeBurninSettings()));
            }
            if (this.getTimecodeInsertion() != null) {
                data.set("timecodeInsertion", om.valueToTree(this.getTimecodeInsertion()));
            }
            if (this.getTreeblockSize() != null) {
                data.set("treeblockSize", om.valueToTree(this.getTreeblockSize()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.medialiveChannel.MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings.Jsii$Proxy that = (MedialiveChannelEncoderSettingsVideoDescriptionsCodecSettingsH265Settings.Jsii$Proxy) o;

            if (!bitrate.equals(that.bitrate)) return false;
            if (!framerateDenominator.equals(that.framerateDenominator)) return false;
            if (!framerateNumerator.equals(that.framerateNumerator)) return false;
            if (this.adaptiveQuantization != null ? !this.adaptiveQuantization.equals(that.adaptiveQuantization) : that.adaptiveQuantization != null) return false;
            if (this.afdSignaling != null ? !this.afdSignaling.equals(that.afdSignaling) : that.afdSignaling != null) return false;
            if (this.alternativeTransferFunction != null ? !this.alternativeTransferFunction.equals(that.alternativeTransferFunction) : that.alternativeTransferFunction != null) return false;
            if (this.bufSize != null ? !this.bufSize.equals(that.bufSize) : that.bufSize != null) return false;
            if (this.colorMetadata != null ? !this.colorMetadata.equals(that.colorMetadata) : that.colorMetadata != null) return false;
            if (this.colorSpaceSettings != null ? !this.colorSpaceSettings.equals(that.colorSpaceSettings) : that.colorSpaceSettings != null) return false;
            if (this.filterSettings != null ? !this.filterSettings.equals(that.filterSettings) : that.filterSettings != null) return false;
            if (this.fixedAfd != null ? !this.fixedAfd.equals(that.fixedAfd) : that.fixedAfd != null) return false;
            if (this.flickerAq != null ? !this.flickerAq.equals(that.flickerAq) : that.flickerAq != null) return false;
            if (this.gopClosedCadence != null ? !this.gopClosedCadence.equals(that.gopClosedCadence) : that.gopClosedCadence != null) return false;
            if (this.gopSize != null ? !this.gopSize.equals(that.gopSize) : that.gopSize != null) return false;
            if (this.gopSizeUnits != null ? !this.gopSizeUnits.equals(that.gopSizeUnits) : that.gopSizeUnits != null) return false;
            if (this.level != null ? !this.level.equals(that.level) : that.level != null) return false;
            if (this.lookAheadRateControl != null ? !this.lookAheadRateControl.equals(that.lookAheadRateControl) : that.lookAheadRateControl != null) return false;
            if (this.maxBitrate != null ? !this.maxBitrate.equals(that.maxBitrate) : that.maxBitrate != null) return false;
            if (this.minIInterval != null ? !this.minIInterval.equals(that.minIInterval) : that.minIInterval != null) return false;
            if (this.minQp != null ? !this.minQp.equals(that.minQp) : that.minQp != null) return false;
            if (this.mvOverPictureBoundaries != null ? !this.mvOverPictureBoundaries.equals(that.mvOverPictureBoundaries) : that.mvOverPictureBoundaries != null) return false;
            if (this.mvTemporalPredictor != null ? !this.mvTemporalPredictor.equals(that.mvTemporalPredictor) : that.mvTemporalPredictor != null) return false;
            if (this.parDenominator != null ? !this.parDenominator.equals(that.parDenominator) : that.parDenominator != null) return false;
            if (this.parNumerator != null ? !this.parNumerator.equals(that.parNumerator) : that.parNumerator != null) return false;
            if (this.profile != null ? !this.profile.equals(that.profile) : that.profile != null) return false;
            if (this.qvbrQualityLevel != null ? !this.qvbrQualityLevel.equals(that.qvbrQualityLevel) : that.qvbrQualityLevel != null) return false;
            if (this.rateControlMode != null ? !this.rateControlMode.equals(that.rateControlMode) : that.rateControlMode != null) return false;
            if (this.scanType != null ? !this.scanType.equals(that.scanType) : that.scanType != null) return false;
            if (this.sceneChangeDetect != null ? !this.sceneChangeDetect.equals(that.sceneChangeDetect) : that.sceneChangeDetect != null) return false;
            if (this.slices != null ? !this.slices.equals(that.slices) : that.slices != null) return false;
            if (this.tier != null ? !this.tier.equals(that.tier) : that.tier != null) return false;
            if (this.tileHeight != null ? !this.tileHeight.equals(that.tileHeight) : that.tileHeight != null) return false;
            if (this.tilePadding != null ? !this.tilePadding.equals(that.tilePadding) : that.tilePadding != null) return false;
            if (this.tileWidth != null ? !this.tileWidth.equals(that.tileWidth) : that.tileWidth != null) return false;
            if (this.timecodeBurninSettings != null ? !this.timecodeBurninSettings.equals(that.timecodeBurninSettings) : that.timecodeBurninSettings != null) return false;
            if (this.timecodeInsertion != null ? !this.timecodeInsertion.equals(that.timecodeInsertion) : that.timecodeInsertion != null) return false;
            return this.treeblockSize != null ? this.treeblockSize.equals(that.treeblockSize) : that.treeblockSize == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bitrate.hashCode();
            result = 31 * result + (this.framerateDenominator.hashCode());
            result = 31 * result + (this.framerateNumerator.hashCode());
            result = 31 * result + (this.adaptiveQuantization != null ? this.adaptiveQuantization.hashCode() : 0);
            result = 31 * result + (this.afdSignaling != null ? this.afdSignaling.hashCode() : 0);
            result = 31 * result + (this.alternativeTransferFunction != null ? this.alternativeTransferFunction.hashCode() : 0);
            result = 31 * result + (this.bufSize != null ? this.bufSize.hashCode() : 0);
            result = 31 * result + (this.colorMetadata != null ? this.colorMetadata.hashCode() : 0);
            result = 31 * result + (this.colorSpaceSettings != null ? this.colorSpaceSettings.hashCode() : 0);
            result = 31 * result + (this.filterSettings != null ? this.filterSettings.hashCode() : 0);
            result = 31 * result + (this.fixedAfd != null ? this.fixedAfd.hashCode() : 0);
            result = 31 * result + (this.flickerAq != null ? this.flickerAq.hashCode() : 0);
            result = 31 * result + (this.gopClosedCadence != null ? this.gopClosedCadence.hashCode() : 0);
            result = 31 * result + (this.gopSize != null ? this.gopSize.hashCode() : 0);
            result = 31 * result + (this.gopSizeUnits != null ? this.gopSizeUnits.hashCode() : 0);
            result = 31 * result + (this.level != null ? this.level.hashCode() : 0);
            result = 31 * result + (this.lookAheadRateControl != null ? this.lookAheadRateControl.hashCode() : 0);
            result = 31 * result + (this.maxBitrate != null ? this.maxBitrate.hashCode() : 0);
            result = 31 * result + (this.minIInterval != null ? this.minIInterval.hashCode() : 0);
            result = 31 * result + (this.minQp != null ? this.minQp.hashCode() : 0);
            result = 31 * result + (this.mvOverPictureBoundaries != null ? this.mvOverPictureBoundaries.hashCode() : 0);
            result = 31 * result + (this.mvTemporalPredictor != null ? this.mvTemporalPredictor.hashCode() : 0);
            result = 31 * result + (this.parDenominator != null ? this.parDenominator.hashCode() : 0);
            result = 31 * result + (this.parNumerator != null ? this.parNumerator.hashCode() : 0);
            result = 31 * result + (this.profile != null ? this.profile.hashCode() : 0);
            result = 31 * result + (this.qvbrQualityLevel != null ? this.qvbrQualityLevel.hashCode() : 0);
            result = 31 * result + (this.rateControlMode != null ? this.rateControlMode.hashCode() : 0);
            result = 31 * result + (this.scanType != null ? this.scanType.hashCode() : 0);
            result = 31 * result + (this.sceneChangeDetect != null ? this.sceneChangeDetect.hashCode() : 0);
            result = 31 * result + (this.slices != null ? this.slices.hashCode() : 0);
            result = 31 * result + (this.tier != null ? this.tier.hashCode() : 0);
            result = 31 * result + (this.tileHeight != null ? this.tileHeight.hashCode() : 0);
            result = 31 * result + (this.tilePadding != null ? this.tilePadding.hashCode() : 0);
            result = 31 * result + (this.tileWidth != null ? this.tileWidth.hashCode() : 0);
            result = 31 * result + (this.timecodeBurninSettings != null ? this.timecodeBurninSettings.hashCode() : 0);
            result = 31 * result + (this.timecodeInsertion != null ? this.timecodeInsertion.hashCode() : 0);
            result = 31 * result + (this.treeblockSize != null ? this.treeblockSize.hashCode() : 0);
            return result;
        }
    }
}
