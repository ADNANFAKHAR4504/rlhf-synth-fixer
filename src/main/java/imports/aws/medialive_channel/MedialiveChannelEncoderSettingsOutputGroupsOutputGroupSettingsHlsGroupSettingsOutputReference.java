package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.874Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsOutputReference")
public class MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCaptionLanguageMappings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putCaptionLanguageMappings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDestination(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsDestination value) {
        software.amazon.jsii.Kernel.call(this, "putDestination", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHlsCdnSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings> __cast_cd4240 = (java.util.List<imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putHlsCdnSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putKeyProviderSettings(final @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettings value) {
        software.amazon.jsii.Kernel.call(this, "putKeyProviderSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAdMarkers() {
        software.amazon.jsii.Kernel.call(this, "resetAdMarkers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBaseUrlContent() {
        software.amazon.jsii.Kernel.call(this, "resetBaseUrlContent", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBaseUrlContent1() {
        software.amazon.jsii.Kernel.call(this, "resetBaseUrlContent1", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBaseUrlManifest() {
        software.amazon.jsii.Kernel.call(this, "resetBaseUrlManifest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBaseUrlManifest1() {
        software.amazon.jsii.Kernel.call(this, "resetBaseUrlManifest1", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptionLanguageMappings() {
        software.amazon.jsii.Kernel.call(this, "resetCaptionLanguageMappings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptionLanguageSetting() {
        software.amazon.jsii.Kernel.call(this, "resetCaptionLanguageSetting", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientCache() {
        software.amazon.jsii.Kernel.call(this, "resetClientCache", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCodecSpecification() {
        software.amazon.jsii.Kernel.call(this, "resetCodecSpecification", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConstantIv() {
        software.amazon.jsii.Kernel.call(this, "resetConstantIv", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDirectoryStructure() {
        software.amazon.jsii.Kernel.call(this, "resetDirectoryStructure", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDiscontinuityTags() {
        software.amazon.jsii.Kernel.call(this, "resetDiscontinuityTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncryptionType() {
        software.amazon.jsii.Kernel.call(this, "resetEncryptionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsCdnSettings() {
        software.amazon.jsii.Kernel.call(this, "resetHlsCdnSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHlsId3SegmentTagging() {
        software.amazon.jsii.Kernel.call(this, "resetHlsId3SegmentTagging", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIframeOnlyPlaylists() {
        software.amazon.jsii.Kernel.call(this, "resetIframeOnlyPlaylists", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncompleteSegmentBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetIncompleteSegmentBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIndexNSegments() {
        software.amazon.jsii.Kernel.call(this, "resetIndexNSegments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInputLossAction() {
        software.amazon.jsii.Kernel.call(this, "resetInputLossAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIvInManifest() {
        software.amazon.jsii.Kernel.call(this, "resetIvInManifest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIvSource() {
        software.amazon.jsii.Kernel.call(this, "resetIvSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeepSegments() {
        software.amazon.jsii.Kernel.call(this, "resetKeepSegments", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyFormat() {
        software.amazon.jsii.Kernel.call(this, "resetKeyFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyFormatVersions() {
        software.amazon.jsii.Kernel.call(this, "resetKeyFormatVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKeyProviderSettings() {
        software.amazon.jsii.Kernel.call(this, "resetKeyProviderSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManifestCompression() {
        software.amazon.jsii.Kernel.call(this, "resetManifestCompression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetManifestDurationFormat() {
        software.amazon.jsii.Kernel.call(this, "resetManifestDurationFormat", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinSegmentLength() {
        software.amazon.jsii.Kernel.call(this, "resetMinSegmentLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMode() {
        software.amazon.jsii.Kernel.call(this, "resetMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutputSelection() {
        software.amazon.jsii.Kernel.call(this, "resetOutputSelection", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgramDateTime() {
        software.amazon.jsii.Kernel.call(this, "resetProgramDateTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgramDateTimeClock() {
        software.amazon.jsii.Kernel.call(this, "resetProgramDateTimeClock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProgramDateTimePeriod() {
        software.amazon.jsii.Kernel.call(this, "resetProgramDateTimePeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRedundantManifest() {
        software.amazon.jsii.Kernel.call(this, "resetRedundantManifest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentLength() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentLength", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSegmentsPerSubdirectory() {
        software.amazon.jsii.Kernel.call(this, "resetSegmentsPerSubdirectory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStreamInfResolution() {
        software.amazon.jsii.Kernel.call(this, "resetStreamInfResolution", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataId3Frame() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataId3Frame", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimedMetadataId3Period() {
        software.amazon.jsii.Kernel.call(this, "resetTimedMetadataId3Period", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimestampDeltaMilliseconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimestampDeltaMilliseconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTsFileMode() {
        software.amazon.jsii.Kernel.call(this, "resetTsFileMode", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsList getCaptionLanguageMappings() {
        return software.amazon.jsii.Kernel.get(this, "captionLanguageMappings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsCaptionLanguageMappingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsDestinationOutputReference getDestination() {
        return software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsDestinationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsList getHlsCdnSettings() {
        return software.amazon.jsii.Kernel.get(this, "hlsCdnSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsHlsCdnSettingsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsOutputReference getKeyProviderSettings() {
        return software.amazon.jsii.Kernel.get(this, "keyProviderSettings", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdMarkersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "adMarkersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseUrlContent1Input() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlContent1Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseUrlContentInput() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlContentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseUrlManifest1Input() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlManifest1Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBaseUrlManifestInput() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlManifestInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaptionLanguageMappingsInput() {
        return software.amazon.jsii.Kernel.get(this, "captionLanguageMappingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCaptionLanguageSettingInput() {
        return software.amazon.jsii.Kernel.get(this, "captionLanguageSettingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCacheInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCacheInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCodecSpecificationInput() {
        return software.amazon.jsii.Kernel.get(this, "codecSpecificationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConstantIvInput() {
        return software.amazon.jsii.Kernel.get(this, "constantIvInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsDestination getDestinationInput() {
        return software.amazon.jsii.Kernel.get(this, "destinationInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsDestination.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDirectoryStructureInput() {
        return software.amazon.jsii.Kernel.get(this, "directoryStructureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDiscontinuityTagsInput() {
        return software.amazon.jsii.Kernel.get(this, "discontinuityTagsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHlsCdnSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsCdnSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHlsId3SegmentTaggingInput() {
        return software.amazon.jsii.Kernel.get(this, "hlsId3SegmentTaggingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIframeOnlyPlaylistsInput() {
        return software.amazon.jsii.Kernel.get(this, "iframeOnlyPlaylistsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIncompleteSegmentBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "incompleteSegmentBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIndexNSegmentsInput() {
        return software.amazon.jsii.Kernel.get(this, "indexNSegmentsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInputLossActionInput() {
        return software.amazon.jsii.Kernel.get(this, "inputLossActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIvInManifestInput() {
        return software.amazon.jsii.Kernel.get(this, "ivInManifestInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIvSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "ivSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getKeepSegmentsInput() {
        return software.amazon.jsii.Kernel.get(this, "keepSegmentsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "keyFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKeyFormatVersionsInput() {
        return software.amazon.jsii.Kernel.get(this, "keyFormatVersionsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettings getKeyProviderSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "keyProviderSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettingsKeyProviderSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManifestCompressionInput() {
        return software.amazon.jsii.Kernel.get(this, "manifestCompressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getManifestDurationFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "manifestDurationFormatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinSegmentLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "minSegmentLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getModeInput() {
        return software.amazon.jsii.Kernel.get(this, "modeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutputSelectionInput() {
        return software.amazon.jsii.Kernel.get(this, "outputSelectionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgramDateTimeClockInput() {
        return software.amazon.jsii.Kernel.get(this, "programDateTimeClockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProgramDateTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "programDateTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getProgramDateTimePeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "programDateTimePeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRedundantManifestInput() {
        return software.amazon.jsii.Kernel.get(this, "redundantManifestInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSegmentLengthInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentLengthInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSegmentsPerSubdirectoryInput() {
        return software.amazon.jsii.Kernel.get(this, "segmentsPerSubdirectoryInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStreamInfResolutionInput() {
        return software.amazon.jsii.Kernel.get(this, "streamInfResolutionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTimedMetadataId3FrameInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3FrameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimedMetadataId3PeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3PeriodInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimestampDeltaMillisecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timestampDeltaMillisecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTsFileModeInput() {
        return software.amazon.jsii.Kernel.get(this, "tsFileModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAdMarkers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "adMarkers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAdMarkers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "adMarkers", java.util.Objects.requireNonNull(value, "adMarkers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseUrlContent() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlContent", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseUrlContent(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseUrlContent", java.util.Objects.requireNonNull(value, "baseUrlContent is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseUrlContent1() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlContent1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseUrlContent1(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseUrlContent1", java.util.Objects.requireNonNull(value, "baseUrlContent1 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseUrlManifest() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlManifest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseUrlManifest(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseUrlManifest", java.util.Objects.requireNonNull(value, "baseUrlManifest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBaseUrlManifest1() {
        return software.amazon.jsii.Kernel.get(this, "baseUrlManifest1", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBaseUrlManifest1(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "baseUrlManifest1", java.util.Objects.requireNonNull(value, "baseUrlManifest1 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCaptionLanguageSetting() {
        return software.amazon.jsii.Kernel.get(this, "captionLanguageSetting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCaptionLanguageSetting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "captionLanguageSetting", java.util.Objects.requireNonNull(value, "captionLanguageSetting is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCache() {
        return software.amazon.jsii.Kernel.get(this, "clientCache", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCache(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCache", java.util.Objects.requireNonNull(value, "clientCache is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCodecSpecification() {
        return software.amazon.jsii.Kernel.get(this, "codecSpecification", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCodecSpecification(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "codecSpecification", java.util.Objects.requireNonNull(value, "codecSpecification is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConstantIv() {
        return software.amazon.jsii.Kernel.get(this, "constantIv", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConstantIv(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "constantIv", java.util.Objects.requireNonNull(value, "constantIv is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDirectoryStructure() {
        return software.amazon.jsii.Kernel.get(this, "directoryStructure", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDirectoryStructure(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "directoryStructure", java.util.Objects.requireNonNull(value, "directoryStructure is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDiscontinuityTags() {
        return software.amazon.jsii.Kernel.get(this, "discontinuityTags", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDiscontinuityTags(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "discontinuityTags", java.util.Objects.requireNonNull(value, "discontinuityTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncryptionType() {
        return software.amazon.jsii.Kernel.get(this, "encryptionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncryptionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encryptionType", java.util.Objects.requireNonNull(value, "encryptionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHlsId3SegmentTagging() {
        return software.amazon.jsii.Kernel.get(this, "hlsId3SegmentTagging", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHlsId3SegmentTagging(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hlsId3SegmentTagging", java.util.Objects.requireNonNull(value, "hlsId3SegmentTagging is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIframeOnlyPlaylists() {
        return software.amazon.jsii.Kernel.get(this, "iframeOnlyPlaylists", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIframeOnlyPlaylists(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "iframeOnlyPlaylists", java.util.Objects.requireNonNull(value, "iframeOnlyPlaylists is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIncompleteSegmentBehavior() {
        return software.amazon.jsii.Kernel.get(this, "incompleteSegmentBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIncompleteSegmentBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "incompleteSegmentBehavior", java.util.Objects.requireNonNull(value, "incompleteSegmentBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIndexNSegments() {
        return software.amazon.jsii.Kernel.get(this, "indexNSegments", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIndexNSegments(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "indexNSegments", java.util.Objects.requireNonNull(value, "indexNSegments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInputLossAction() {
        return software.amazon.jsii.Kernel.get(this, "inputLossAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInputLossAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "inputLossAction", java.util.Objects.requireNonNull(value, "inputLossAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIvInManifest() {
        return software.amazon.jsii.Kernel.get(this, "ivInManifest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIvInManifest(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ivInManifest", java.util.Objects.requireNonNull(value, "ivInManifest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIvSource() {
        return software.amazon.jsii.Kernel.get(this, "ivSource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIvSource(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ivSource", java.util.Objects.requireNonNull(value, "ivSource is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getKeepSegments() {
        return software.amazon.jsii.Kernel.get(this, "keepSegments", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setKeepSegments(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "keepSegments", java.util.Objects.requireNonNull(value, "keepSegments is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyFormat() {
        return software.amazon.jsii.Kernel.get(this, "keyFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyFormat", java.util.Objects.requireNonNull(value, "keyFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKeyFormatVersions() {
        return software.amazon.jsii.Kernel.get(this, "keyFormatVersions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKeyFormatVersions(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "keyFormatVersions", java.util.Objects.requireNonNull(value, "keyFormatVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManifestCompression() {
        return software.amazon.jsii.Kernel.get(this, "manifestCompression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManifestCompression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "manifestCompression", java.util.Objects.requireNonNull(value, "manifestCompression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getManifestDurationFormat() {
        return software.amazon.jsii.Kernel.get(this, "manifestDurationFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setManifestDurationFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "manifestDurationFormat", java.util.Objects.requireNonNull(value, "manifestDurationFormat is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinSegmentLength() {
        return software.amazon.jsii.Kernel.get(this, "minSegmentLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinSegmentLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minSegmentLength", java.util.Objects.requireNonNull(value, "minSegmentLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMode() {
        return software.amazon.jsii.Kernel.get(this, "mode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mode", java.util.Objects.requireNonNull(value, "mode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutputSelection() {
        return software.amazon.jsii.Kernel.get(this, "outputSelection", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutputSelection(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outputSelection", java.util.Objects.requireNonNull(value, "outputSelection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgramDateTime() {
        return software.amazon.jsii.Kernel.get(this, "programDateTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgramDateTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "programDateTime", java.util.Objects.requireNonNull(value, "programDateTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProgramDateTimeClock() {
        return software.amazon.jsii.Kernel.get(this, "programDateTimeClock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProgramDateTimeClock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "programDateTimeClock", java.util.Objects.requireNonNull(value, "programDateTimeClock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getProgramDateTimePeriod() {
        return software.amazon.jsii.Kernel.get(this, "programDateTimePeriod", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setProgramDateTimePeriod(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "programDateTimePeriod", java.util.Objects.requireNonNull(value, "programDateTimePeriod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRedundantManifest() {
        return software.amazon.jsii.Kernel.get(this, "redundantManifest", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRedundantManifest(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "redundantManifest", java.util.Objects.requireNonNull(value, "redundantManifest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSegmentLength() {
        return software.amazon.jsii.Kernel.get(this, "segmentLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSegmentLength(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "segmentLength", java.util.Objects.requireNonNull(value, "segmentLength is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSegmentsPerSubdirectory() {
        return software.amazon.jsii.Kernel.get(this, "segmentsPerSubdirectory", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSegmentsPerSubdirectory(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "segmentsPerSubdirectory", java.util.Objects.requireNonNull(value, "segmentsPerSubdirectory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStreamInfResolution() {
        return software.amazon.jsii.Kernel.get(this, "streamInfResolution", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStreamInfResolution(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "streamInfResolution", java.util.Objects.requireNonNull(value, "streamInfResolution is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTimedMetadataId3Frame() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3Frame", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTimedMetadataId3Frame(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataId3Frame", java.util.Objects.requireNonNull(value, "timedMetadataId3Frame is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimedMetadataId3Period() {
        return software.amazon.jsii.Kernel.get(this, "timedMetadataId3Period", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimedMetadataId3Period(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timedMetadataId3Period", java.util.Objects.requireNonNull(value, "timedMetadataId3Period is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimestampDeltaMilliseconds() {
        return software.amazon.jsii.Kernel.get(this, "timestampDeltaMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimestampDeltaMilliseconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timestampDeltaMilliseconds", java.util.Objects.requireNonNull(value, "timestampDeltaMilliseconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTsFileMode() {
        return software.amazon.jsii.Kernel.get(this, "tsFileMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTsFileMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tsFileMode", java.util.Objects.requireNonNull(value, "tsFileMode is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelEncoderSettingsOutputGroupsOutputGroupSettingsHlsGroupSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
