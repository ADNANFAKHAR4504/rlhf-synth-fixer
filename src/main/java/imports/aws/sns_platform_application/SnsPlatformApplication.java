package imports.aws.sns_platform_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application aws_sns_platform_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.475Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsPlatformApplication.SnsPlatformApplication")
public class SnsPlatformApplication extends com.hashicorp.cdktf.TerraformResource {

    protected SnsPlatformApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SnsPlatformApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.sns_platform_application.SnsPlatformApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application aws_sns_platform_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public SnsPlatformApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.sns_platform_application.SnsPlatformApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a SnsPlatformApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsPlatformApplication to import. This parameter is required.
     * @param importFromId The id of the existing SnsPlatformApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the SnsPlatformApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_platform_application.SnsPlatformApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a SnsPlatformApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the SnsPlatformApplication to import. This parameter is required.
     * @param importFromId The id of the existing SnsPlatformApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.sns_platform_application.SnsPlatformApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetApplePlatformBundleId() {
        software.amazon.jsii.Kernel.call(this, "resetApplePlatformBundleId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetApplePlatformTeamId() {
        software.amazon.jsii.Kernel.call(this, "resetApplePlatformTeamId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventDeliveryFailureTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventDeliveryFailureTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventEndpointCreatedTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventEndpointCreatedTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventEndpointDeletedTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventEndpointDeletedTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventEndpointUpdatedTopicArn() {
        software.amazon.jsii.Kernel.call(this, "resetEventEndpointUpdatedTopicArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailureFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetFailureFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPlatformPrincipal() {
        software.amazon.jsii.Kernel.call(this, "resetPlatformPrincipal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessFeedbackRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessFeedbackRoleArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessFeedbackSampleRate() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessFeedbackSampleRate", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplePlatformBundleIdInput() {
        return software.amazon.jsii.Kernel.get(this, "applePlatformBundleIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApplePlatformTeamIdInput() {
        return software.amazon.jsii.Kernel.get(this, "applePlatformTeamIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventDeliveryFailureTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventDeliveryFailureTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointCreatedTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointCreatedTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointDeletedTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointDeletedTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointUpdatedTopicArnInput() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointUpdatedTopicArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFailureFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "failureFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformCredentialInput() {
        return software.amazon.jsii.Kernel.get(this, "platformCredentialInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformInput() {
        return software.amazon.jsii.Kernel.get(this, "platformInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPlatformPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "platformPrincipalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessFeedbackRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "successFeedbackRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessFeedbackSampleRateInput() {
        return software.amazon.jsii.Kernel.get(this, "successFeedbackSampleRateInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplePlatformBundleId() {
        return software.amazon.jsii.Kernel.get(this, "applePlatformBundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplePlatformBundleId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applePlatformBundleId", java.util.Objects.requireNonNull(value, "applePlatformBundleId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApplePlatformTeamId() {
        return software.amazon.jsii.Kernel.get(this, "applePlatformTeamId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApplePlatformTeamId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "applePlatformTeamId", java.util.Objects.requireNonNull(value, "applePlatformTeamId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventDeliveryFailureTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "eventDeliveryFailureTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventDeliveryFailureTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventDeliveryFailureTopicArn", java.util.Objects.requireNonNull(value, "eventDeliveryFailureTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventEndpointCreatedTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointCreatedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventEndpointCreatedTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventEndpointCreatedTopicArn", java.util.Objects.requireNonNull(value, "eventEndpointCreatedTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventEndpointDeletedTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointDeletedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventEndpointDeletedTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventEndpointDeletedTopicArn", java.util.Objects.requireNonNull(value, "eventEndpointDeletedTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventEndpointUpdatedTopicArn() {
        return software.amazon.jsii.Kernel.get(this, "eventEndpointUpdatedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventEndpointUpdatedTopicArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventEndpointUpdatedTopicArn", java.util.Objects.requireNonNull(value, "eventEndpointUpdatedTopicArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFailureFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "failureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFailureFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "failureFeedbackRoleArn", java.util.Objects.requireNonNull(value, "failureFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatform() {
        return software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatform(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platform", java.util.Objects.requireNonNull(value, "platform is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformCredential() {
        return software.amazon.jsii.Kernel.get(this, "platformCredential", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatformCredential(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platformCredential", java.util.Objects.requireNonNull(value, "platformCredential is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "platformPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPlatformPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "platformPrincipal", java.util.Objects.requireNonNull(value, "platformPrincipal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessFeedbackRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "successFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccessFeedbackRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "successFeedbackRoleArn", java.util.Objects.requireNonNull(value, "successFeedbackRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessFeedbackSampleRate() {
        return software.amazon.jsii.Kernel.get(this, "successFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccessFeedbackSampleRate(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "successFeedbackSampleRate", java.util.Objects.requireNonNull(value, "successFeedbackSampleRate is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.sns_platform_application.SnsPlatformApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.sns_platform_application.SnsPlatformApplication> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.sns_platform_application.SnsPlatformApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.sns_platform_application.SnsPlatformApplicationConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#name SnsPlatformApplication#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#name SnsPlatformApplication#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform SnsPlatformApplication#platform}.
         * <p>
         * @return {@code this}
         * @param platform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform SnsPlatformApplication#platform}. This parameter is required.
         */
        public Builder platform(final java.lang.String platform) {
            this.config.platform(platform);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_credential SnsPlatformApplication#platform_credential}.
         * <p>
         * @return {@code this}
         * @param platformCredential Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_credential SnsPlatformApplication#platform_credential}. This parameter is required.
         */
        public Builder platformCredential(final java.lang.String platformCredential) {
            this.config.platformCredential(platformCredential);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_bundle_id SnsPlatformApplication#apple_platform_bundle_id}.
         * <p>
         * @return {@code this}
         * @param applePlatformBundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_bundle_id SnsPlatformApplication#apple_platform_bundle_id}. This parameter is required.
         */
        public Builder applePlatformBundleId(final java.lang.String applePlatformBundleId) {
            this.config.applePlatformBundleId(applePlatformBundleId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_team_id SnsPlatformApplication#apple_platform_team_id}.
         * <p>
         * @return {@code this}
         * @param applePlatformTeamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_team_id SnsPlatformApplication#apple_platform_team_id}. This parameter is required.
         */
        public Builder applePlatformTeamId(final java.lang.String applePlatformTeamId) {
            this.config.applePlatformTeamId(applePlatformTeamId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_delivery_failure_topic_arn SnsPlatformApplication#event_delivery_failure_topic_arn}.
         * <p>
         * @return {@code this}
         * @param eventDeliveryFailureTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_delivery_failure_topic_arn SnsPlatformApplication#event_delivery_failure_topic_arn}. This parameter is required.
         */
        public Builder eventDeliveryFailureTopicArn(final java.lang.String eventDeliveryFailureTopicArn) {
            this.config.eventDeliveryFailureTopicArn(eventDeliveryFailureTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_created_topic_arn SnsPlatformApplication#event_endpoint_created_topic_arn}.
         * <p>
         * @return {@code this}
         * @param eventEndpointCreatedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_created_topic_arn SnsPlatformApplication#event_endpoint_created_topic_arn}. This parameter is required.
         */
        public Builder eventEndpointCreatedTopicArn(final java.lang.String eventEndpointCreatedTopicArn) {
            this.config.eventEndpointCreatedTopicArn(eventEndpointCreatedTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_deleted_topic_arn SnsPlatformApplication#event_endpoint_deleted_topic_arn}.
         * <p>
         * @return {@code this}
         * @param eventEndpointDeletedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_deleted_topic_arn SnsPlatformApplication#event_endpoint_deleted_topic_arn}. This parameter is required.
         */
        public Builder eventEndpointDeletedTopicArn(final java.lang.String eventEndpointDeletedTopicArn) {
            this.config.eventEndpointDeletedTopicArn(eventEndpointDeletedTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_updated_topic_arn SnsPlatformApplication#event_endpoint_updated_topic_arn}.
         * <p>
         * @return {@code this}
         * @param eventEndpointUpdatedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_updated_topic_arn SnsPlatformApplication#event_endpoint_updated_topic_arn}. This parameter is required.
         */
        public Builder eventEndpointUpdatedTopicArn(final java.lang.String eventEndpointUpdatedTopicArn) {
            this.config.eventEndpointUpdatedTopicArn(eventEndpointUpdatedTopicArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#failure_feedback_role_arn SnsPlatformApplication#failure_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param failureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#failure_feedback_role_arn SnsPlatformApplication#failure_feedback_role_arn}. This parameter is required.
         */
        public Builder failureFeedbackRoleArn(final java.lang.String failureFeedbackRoleArn) {
            this.config.failureFeedbackRoleArn(failureFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#id SnsPlatformApplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#id SnsPlatformApplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_principal SnsPlatformApplication#platform_principal}.
         * <p>
         * @return {@code this}
         * @param platformPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_principal SnsPlatformApplication#platform_principal}. This parameter is required.
         */
        public Builder platformPrincipal(final java.lang.String platformPrincipal) {
            this.config.platformPrincipal(platformPrincipal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_role_arn SnsPlatformApplication#success_feedback_role_arn}.
         * <p>
         * @return {@code this}
         * @param successFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_role_arn SnsPlatformApplication#success_feedback_role_arn}. This parameter is required.
         */
        public Builder successFeedbackRoleArn(final java.lang.String successFeedbackRoleArn) {
            this.config.successFeedbackRoleArn(successFeedbackRoleArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_sample_rate SnsPlatformApplication#success_feedback_sample_rate}.
         * <p>
         * @return {@code this}
         * @param successFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_sample_rate SnsPlatformApplication#success_feedback_sample_rate}. This parameter is required.
         */
        public Builder successFeedbackSampleRate(final java.lang.String successFeedbackSampleRate) {
            this.config.successFeedbackSampleRate(successFeedbackSampleRate);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.sns_platform_application.SnsPlatformApplication}.
         */
        @Override
        public imports.aws.sns_platform_application.SnsPlatformApplication build() {
            return new imports.aws.sns_platform_application.SnsPlatformApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
