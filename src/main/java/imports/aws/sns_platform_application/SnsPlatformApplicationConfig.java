package imports.aws.sns_platform_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.475Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsPlatformApplication.SnsPlatformApplicationConfig")
@software.amazon.jsii.Jsii.Proxy(SnsPlatformApplicationConfig.Jsii$Proxy.class)
public interface SnsPlatformApplicationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#name SnsPlatformApplication#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform SnsPlatformApplication#platform}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPlatform();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_credential SnsPlatformApplication#platform_credential}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPlatformCredential();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_bundle_id SnsPlatformApplication#apple_platform_bundle_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplePlatformBundleId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_team_id SnsPlatformApplication#apple_platform_team_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplePlatformTeamId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_delivery_failure_topic_arn SnsPlatformApplication#event_delivery_failure_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventDeliveryFailureTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_created_topic_arn SnsPlatformApplication#event_endpoint_created_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointCreatedTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_deleted_topic_arn SnsPlatformApplication#event_endpoint_deleted_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointDeletedTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_updated_topic_arn SnsPlatformApplication#event_endpoint_updated_topic_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEventEndpointUpdatedTopicArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#failure_feedback_role_arn SnsPlatformApplication#failure_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFailureFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#id SnsPlatformApplication#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_principal SnsPlatformApplication#platform_principal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPlatformPrincipal() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_role_arn SnsPlatformApplication#success_feedback_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuccessFeedbackRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_sample_rate SnsPlatformApplication#success_feedback_sample_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSuccessFeedbackSampleRate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SnsPlatformApplicationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SnsPlatformApplicationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SnsPlatformApplicationConfig> {
        java.lang.String name;
        java.lang.String platform;
        java.lang.String platformCredential;
        java.lang.String applePlatformBundleId;
        java.lang.String applePlatformTeamId;
        java.lang.String eventDeliveryFailureTopicArn;
        java.lang.String eventEndpointCreatedTopicArn;
        java.lang.String eventEndpointDeletedTopicArn;
        java.lang.String eventEndpointUpdatedTopicArn;
        java.lang.String failureFeedbackRoleArn;
        java.lang.String id;
        java.lang.String platformPrincipal;
        java.lang.String successFeedbackRoleArn;
        java.lang.String successFeedbackSampleRate;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#name SnsPlatformApplication#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getPlatform}
         * @param platform Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform SnsPlatformApplication#platform}. This parameter is required.
         * @return {@code this}
         */
        public Builder platform(java.lang.String platform) {
            this.platform = platform;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getPlatformCredential}
         * @param platformCredential Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_credential SnsPlatformApplication#platform_credential}. This parameter is required.
         * @return {@code this}
         */
        public Builder platformCredential(java.lang.String platformCredential) {
            this.platformCredential = platformCredential;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getApplePlatformBundleId}
         * @param applePlatformBundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_bundle_id SnsPlatformApplication#apple_platform_bundle_id}.
         * @return {@code this}
         */
        public Builder applePlatformBundleId(java.lang.String applePlatformBundleId) {
            this.applePlatformBundleId = applePlatformBundleId;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getApplePlatformTeamId}
         * @param applePlatformTeamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#apple_platform_team_id SnsPlatformApplication#apple_platform_team_id}.
         * @return {@code this}
         */
        public Builder applePlatformTeamId(java.lang.String applePlatformTeamId) {
            this.applePlatformTeamId = applePlatformTeamId;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getEventDeliveryFailureTopicArn}
         * @param eventDeliveryFailureTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_delivery_failure_topic_arn SnsPlatformApplication#event_delivery_failure_topic_arn}.
         * @return {@code this}
         */
        public Builder eventDeliveryFailureTopicArn(java.lang.String eventDeliveryFailureTopicArn) {
            this.eventDeliveryFailureTopicArn = eventDeliveryFailureTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getEventEndpointCreatedTopicArn}
         * @param eventEndpointCreatedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_created_topic_arn SnsPlatformApplication#event_endpoint_created_topic_arn}.
         * @return {@code this}
         */
        public Builder eventEndpointCreatedTopicArn(java.lang.String eventEndpointCreatedTopicArn) {
            this.eventEndpointCreatedTopicArn = eventEndpointCreatedTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getEventEndpointDeletedTopicArn}
         * @param eventEndpointDeletedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_deleted_topic_arn SnsPlatformApplication#event_endpoint_deleted_topic_arn}.
         * @return {@code this}
         */
        public Builder eventEndpointDeletedTopicArn(java.lang.String eventEndpointDeletedTopicArn) {
            this.eventEndpointDeletedTopicArn = eventEndpointDeletedTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getEventEndpointUpdatedTopicArn}
         * @param eventEndpointUpdatedTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#event_endpoint_updated_topic_arn SnsPlatformApplication#event_endpoint_updated_topic_arn}.
         * @return {@code this}
         */
        public Builder eventEndpointUpdatedTopicArn(java.lang.String eventEndpointUpdatedTopicArn) {
            this.eventEndpointUpdatedTopicArn = eventEndpointUpdatedTopicArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getFailureFeedbackRoleArn}
         * @param failureFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#failure_feedback_role_arn SnsPlatformApplication#failure_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder failureFeedbackRoleArn(java.lang.String failureFeedbackRoleArn) {
            this.failureFeedbackRoleArn = failureFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#id SnsPlatformApplication#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getPlatformPrincipal}
         * @param platformPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#platform_principal SnsPlatformApplication#platform_principal}.
         * @return {@code this}
         */
        public Builder platformPrincipal(java.lang.String platformPrincipal) {
            this.platformPrincipal = platformPrincipal;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getSuccessFeedbackRoleArn}
         * @param successFeedbackRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_role_arn SnsPlatformApplication#success_feedback_role_arn}.
         * @return {@code this}
         */
        public Builder successFeedbackRoleArn(java.lang.String successFeedbackRoleArn) {
            this.successFeedbackRoleArn = successFeedbackRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getSuccessFeedbackSampleRate}
         * @param successFeedbackSampleRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_platform_application#success_feedback_sample_rate SnsPlatformApplication#success_feedback_sample_rate}.
         * @return {@code this}
         */
        public Builder successFeedbackSampleRate(java.lang.String successFeedbackSampleRate) {
            this.successFeedbackSampleRate = successFeedbackSampleRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getDependsOn}
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
         * Sets the value of {@link SnsPlatformApplicationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SnsPlatformApplicationConfig#getProvisioners}
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
         * @return a new instance of {@link SnsPlatformApplicationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SnsPlatformApplicationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SnsPlatformApplicationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SnsPlatformApplicationConfig {
        private final java.lang.String name;
        private final java.lang.String platform;
        private final java.lang.String platformCredential;
        private final java.lang.String applePlatformBundleId;
        private final java.lang.String applePlatformTeamId;
        private final java.lang.String eventDeliveryFailureTopicArn;
        private final java.lang.String eventEndpointCreatedTopicArn;
        private final java.lang.String eventEndpointDeletedTopicArn;
        private final java.lang.String eventEndpointUpdatedTopicArn;
        private final java.lang.String failureFeedbackRoleArn;
        private final java.lang.String id;
        private final java.lang.String platformPrincipal;
        private final java.lang.String successFeedbackRoleArn;
        private final java.lang.String successFeedbackSampleRate;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platform = software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platformCredential = software.amazon.jsii.Kernel.get(this, "platformCredential", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applePlatformBundleId = software.amazon.jsii.Kernel.get(this, "applePlatformBundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applePlatformTeamId = software.amazon.jsii.Kernel.get(this, "applePlatformTeamId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventDeliveryFailureTopicArn = software.amazon.jsii.Kernel.get(this, "eventDeliveryFailureTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventEndpointCreatedTopicArn = software.amazon.jsii.Kernel.get(this, "eventEndpointCreatedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventEndpointDeletedTopicArn = software.amazon.jsii.Kernel.get(this, "eventEndpointDeletedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventEndpointUpdatedTopicArn = software.amazon.jsii.Kernel.get(this, "eventEndpointUpdatedTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.failureFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "failureFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.platformPrincipal = software.amazon.jsii.Kernel.get(this, "platformPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.successFeedbackRoleArn = software.amazon.jsii.Kernel.get(this, "successFeedbackRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.successFeedbackSampleRate = software.amazon.jsii.Kernel.get(this, "successFeedbackSampleRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.platform = java.util.Objects.requireNonNull(builder.platform, "platform is required");
            this.platformCredential = java.util.Objects.requireNonNull(builder.platformCredential, "platformCredential is required");
            this.applePlatformBundleId = builder.applePlatformBundleId;
            this.applePlatformTeamId = builder.applePlatformTeamId;
            this.eventDeliveryFailureTopicArn = builder.eventDeliveryFailureTopicArn;
            this.eventEndpointCreatedTopicArn = builder.eventEndpointCreatedTopicArn;
            this.eventEndpointDeletedTopicArn = builder.eventEndpointDeletedTopicArn;
            this.eventEndpointUpdatedTopicArn = builder.eventEndpointUpdatedTopicArn;
            this.failureFeedbackRoleArn = builder.failureFeedbackRoleArn;
            this.id = builder.id;
            this.platformPrincipal = builder.platformPrincipal;
            this.successFeedbackRoleArn = builder.successFeedbackRoleArn;
            this.successFeedbackSampleRate = builder.successFeedbackSampleRate;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getPlatform() {
            return this.platform;
        }

        @Override
        public final java.lang.String getPlatformCredential() {
            return this.platformCredential;
        }

        @Override
        public final java.lang.String getApplePlatformBundleId() {
            return this.applePlatformBundleId;
        }

        @Override
        public final java.lang.String getApplePlatformTeamId() {
            return this.applePlatformTeamId;
        }

        @Override
        public final java.lang.String getEventDeliveryFailureTopicArn() {
            return this.eventDeliveryFailureTopicArn;
        }

        @Override
        public final java.lang.String getEventEndpointCreatedTopicArn() {
            return this.eventEndpointCreatedTopicArn;
        }

        @Override
        public final java.lang.String getEventEndpointDeletedTopicArn() {
            return this.eventEndpointDeletedTopicArn;
        }

        @Override
        public final java.lang.String getEventEndpointUpdatedTopicArn() {
            return this.eventEndpointUpdatedTopicArn;
        }

        @Override
        public final java.lang.String getFailureFeedbackRoleArn() {
            return this.failureFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPlatformPrincipal() {
            return this.platformPrincipal;
        }

        @Override
        public final java.lang.String getSuccessFeedbackRoleArn() {
            return this.successFeedbackRoleArn;
        }

        @Override
        public final java.lang.String getSuccessFeedbackSampleRate() {
            return this.successFeedbackSampleRate;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("platform", om.valueToTree(this.getPlatform()));
            data.set("platformCredential", om.valueToTree(this.getPlatformCredential()));
            if (this.getApplePlatformBundleId() != null) {
                data.set("applePlatformBundleId", om.valueToTree(this.getApplePlatformBundleId()));
            }
            if (this.getApplePlatformTeamId() != null) {
                data.set("applePlatformTeamId", om.valueToTree(this.getApplePlatformTeamId()));
            }
            if (this.getEventDeliveryFailureTopicArn() != null) {
                data.set("eventDeliveryFailureTopicArn", om.valueToTree(this.getEventDeliveryFailureTopicArn()));
            }
            if (this.getEventEndpointCreatedTopicArn() != null) {
                data.set("eventEndpointCreatedTopicArn", om.valueToTree(this.getEventEndpointCreatedTopicArn()));
            }
            if (this.getEventEndpointDeletedTopicArn() != null) {
                data.set("eventEndpointDeletedTopicArn", om.valueToTree(this.getEventEndpointDeletedTopicArn()));
            }
            if (this.getEventEndpointUpdatedTopicArn() != null) {
                data.set("eventEndpointUpdatedTopicArn", om.valueToTree(this.getEventEndpointUpdatedTopicArn()));
            }
            if (this.getFailureFeedbackRoleArn() != null) {
                data.set("failureFeedbackRoleArn", om.valueToTree(this.getFailureFeedbackRoleArn()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPlatformPrincipal() != null) {
                data.set("platformPrincipal", om.valueToTree(this.getPlatformPrincipal()));
            }
            if (this.getSuccessFeedbackRoleArn() != null) {
                data.set("successFeedbackRoleArn", om.valueToTree(this.getSuccessFeedbackRoleArn()));
            }
            if (this.getSuccessFeedbackSampleRate() != null) {
                data.set("successFeedbackSampleRate", om.valueToTree(this.getSuccessFeedbackSampleRate()));
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
            struct.set("fqn", om.valueToTree("aws.snsPlatformApplication.SnsPlatformApplicationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SnsPlatformApplicationConfig.Jsii$Proxy that = (SnsPlatformApplicationConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!platform.equals(that.platform)) return false;
            if (!platformCredential.equals(that.platformCredential)) return false;
            if (this.applePlatformBundleId != null ? !this.applePlatformBundleId.equals(that.applePlatformBundleId) : that.applePlatformBundleId != null) return false;
            if (this.applePlatformTeamId != null ? !this.applePlatformTeamId.equals(that.applePlatformTeamId) : that.applePlatformTeamId != null) return false;
            if (this.eventDeliveryFailureTopicArn != null ? !this.eventDeliveryFailureTopicArn.equals(that.eventDeliveryFailureTopicArn) : that.eventDeliveryFailureTopicArn != null) return false;
            if (this.eventEndpointCreatedTopicArn != null ? !this.eventEndpointCreatedTopicArn.equals(that.eventEndpointCreatedTopicArn) : that.eventEndpointCreatedTopicArn != null) return false;
            if (this.eventEndpointDeletedTopicArn != null ? !this.eventEndpointDeletedTopicArn.equals(that.eventEndpointDeletedTopicArn) : that.eventEndpointDeletedTopicArn != null) return false;
            if (this.eventEndpointUpdatedTopicArn != null ? !this.eventEndpointUpdatedTopicArn.equals(that.eventEndpointUpdatedTopicArn) : that.eventEndpointUpdatedTopicArn != null) return false;
            if (this.failureFeedbackRoleArn != null ? !this.failureFeedbackRoleArn.equals(that.failureFeedbackRoleArn) : that.failureFeedbackRoleArn != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.platformPrincipal != null ? !this.platformPrincipal.equals(that.platformPrincipal) : that.platformPrincipal != null) return false;
            if (this.successFeedbackRoleArn != null ? !this.successFeedbackRoleArn.equals(that.successFeedbackRoleArn) : that.successFeedbackRoleArn != null) return false;
            if (this.successFeedbackSampleRate != null ? !this.successFeedbackSampleRate.equals(that.successFeedbackSampleRate) : that.successFeedbackSampleRate != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.platform.hashCode());
            result = 31 * result + (this.platformCredential.hashCode());
            result = 31 * result + (this.applePlatformBundleId != null ? this.applePlatformBundleId.hashCode() : 0);
            result = 31 * result + (this.applePlatformTeamId != null ? this.applePlatformTeamId.hashCode() : 0);
            result = 31 * result + (this.eventDeliveryFailureTopicArn != null ? this.eventDeliveryFailureTopicArn.hashCode() : 0);
            result = 31 * result + (this.eventEndpointCreatedTopicArn != null ? this.eventEndpointCreatedTopicArn.hashCode() : 0);
            result = 31 * result + (this.eventEndpointDeletedTopicArn != null ? this.eventEndpointDeletedTopicArn.hashCode() : 0);
            result = 31 * result + (this.eventEndpointUpdatedTopicArn != null ? this.eventEndpointUpdatedTopicArn.hashCode() : 0);
            result = 31 * result + (this.failureFeedbackRoleArn != null ? this.failureFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.platformPrincipal != null ? this.platformPrincipal.hashCode() : 0);
            result = 31 * result + (this.successFeedbackRoleArn != null ? this.successFeedbackRoleArn.hashCode() : 0);
            result = 31 * result + (this.successFeedbackSampleRate != null ? this.successFeedbackSampleRate.hashCode() : 0);
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
