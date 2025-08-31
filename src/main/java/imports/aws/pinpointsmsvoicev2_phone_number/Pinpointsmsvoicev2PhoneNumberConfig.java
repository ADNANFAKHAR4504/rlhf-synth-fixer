package imports.aws.pinpointsmsvoicev2_phone_number;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.062Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointsmsvoicev2PhoneNumber.Pinpointsmsvoicev2PhoneNumberConfig")
@software.amazon.jsii.Jsii.Proxy(Pinpointsmsvoicev2PhoneNumberConfig.Jsii$Proxy.class)
public interface Pinpointsmsvoicev2PhoneNumberConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#iso_country_code Pinpointsmsvoicev2PhoneNumber#iso_country_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIsoCountryCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#message_type Pinpointsmsvoicev2PhoneNumber#message_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMessageType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_capabilities Pinpointsmsvoicev2PhoneNumber#number_capabilities}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNumberCapabilities();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_type Pinpointsmsvoicev2PhoneNumber#number_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNumberType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#opt_out_list_name Pinpointsmsvoicev2PhoneNumber#opt_out_list_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOptOutListName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#registration_id Pinpointsmsvoicev2PhoneNumber#registration_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRegistrationId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSelfManagedOptOutsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#tags Pinpointsmsvoicev2PhoneNumber#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#timeouts Pinpointsmsvoicev2PhoneNumber#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_arn Pinpointsmsvoicev2PhoneNumber#two_way_channel_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTwoWayChannelArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTwoWayChannelEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_role Pinpointsmsvoicev2PhoneNumber#two_way_channel_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTwoWayChannelRole() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Pinpointsmsvoicev2PhoneNumberConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Pinpointsmsvoicev2PhoneNumberConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Pinpointsmsvoicev2PhoneNumberConfig> {
        java.lang.String isoCountryCode;
        java.lang.String messageType;
        java.util.List<java.lang.String> numberCapabilities;
        java.lang.String numberType;
        java.lang.Object deletionProtectionEnabled;
        java.lang.String optOutListName;
        java.lang.String registrationId;
        java.lang.Object selfManagedOptOutsEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts timeouts;
        java.lang.String twoWayChannelArn;
        java.lang.Object twoWayChannelEnabled;
        java.lang.String twoWayChannelRole;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getIsoCountryCode}
         * @param isoCountryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#iso_country_code Pinpointsmsvoicev2PhoneNumber#iso_country_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder isoCountryCode(java.lang.String isoCountryCode) {
            this.isoCountryCode = isoCountryCode;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getMessageType}
         * @param messageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#message_type Pinpointsmsvoicev2PhoneNumber#message_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder messageType(java.lang.String messageType) {
            this.messageType = messageType;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getNumberCapabilities}
         * @param numberCapabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_capabilities Pinpointsmsvoicev2PhoneNumber#number_capabilities}. This parameter is required.
         * @return {@code this}
         */
        public Builder numberCapabilities(java.util.List<java.lang.String> numberCapabilities) {
            this.numberCapabilities = numberCapabilities;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getNumberType}
         * @param numberType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_type Pinpointsmsvoicev2PhoneNumber#number_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder numberType(java.lang.String numberType) {
            this.numberType = numberType;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(java.lang.Boolean deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getDeletionProtectionEnabled}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}.
         * @return {@code this}
         */
        public Builder deletionProtectionEnabled(com.hashicorp.cdktf.IResolvable deletionProtectionEnabled) {
            this.deletionProtectionEnabled = deletionProtectionEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getOptOutListName}
         * @param optOutListName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#opt_out_list_name Pinpointsmsvoicev2PhoneNumber#opt_out_list_name}.
         * @return {@code this}
         */
        public Builder optOutListName(java.lang.String optOutListName) {
            this.optOutListName = optOutListName;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getRegistrationId}
         * @param registrationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#registration_id Pinpointsmsvoicev2PhoneNumber#registration_id}.
         * @return {@code this}
         */
        public Builder registrationId(java.lang.String registrationId) {
            this.registrationId = registrationId;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getSelfManagedOptOutsEnabled}
         * @param selfManagedOptOutsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}.
         * @return {@code this}
         */
        public Builder selfManagedOptOutsEnabled(java.lang.Boolean selfManagedOptOutsEnabled) {
            this.selfManagedOptOutsEnabled = selfManagedOptOutsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getSelfManagedOptOutsEnabled}
         * @param selfManagedOptOutsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}.
         * @return {@code this}
         */
        public Builder selfManagedOptOutsEnabled(com.hashicorp.cdktf.IResolvable selfManagedOptOutsEnabled) {
            this.selfManagedOptOutsEnabled = selfManagedOptOutsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#tags Pinpointsmsvoicev2PhoneNumber#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#timeouts Pinpointsmsvoicev2PhoneNumber#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTwoWayChannelArn}
         * @param twoWayChannelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_arn Pinpointsmsvoicev2PhoneNumber#two_way_channel_arn}.
         * @return {@code this}
         */
        public Builder twoWayChannelArn(java.lang.String twoWayChannelArn) {
            this.twoWayChannelArn = twoWayChannelArn;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTwoWayChannelEnabled}
         * @param twoWayChannelEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}.
         * @return {@code this}
         */
        public Builder twoWayChannelEnabled(java.lang.Boolean twoWayChannelEnabled) {
            this.twoWayChannelEnabled = twoWayChannelEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTwoWayChannelEnabled}
         * @param twoWayChannelEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}.
         * @return {@code this}
         */
        public Builder twoWayChannelEnabled(com.hashicorp.cdktf.IResolvable twoWayChannelEnabled) {
            this.twoWayChannelEnabled = twoWayChannelEnabled;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getTwoWayChannelRole}
         * @param twoWayChannelRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_role Pinpointsmsvoicev2PhoneNumber#two_way_channel_role}.
         * @return {@code this}
         */
        public Builder twoWayChannelRole(java.lang.String twoWayChannelRole) {
            this.twoWayChannelRole = twoWayChannelRole;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getDependsOn}
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
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Pinpointsmsvoicev2PhoneNumberConfig#getProvisioners}
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
         * @return a new instance of {@link Pinpointsmsvoicev2PhoneNumberConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Pinpointsmsvoicev2PhoneNumberConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Pinpointsmsvoicev2PhoneNumberConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Pinpointsmsvoicev2PhoneNumberConfig {
        private final java.lang.String isoCountryCode;
        private final java.lang.String messageType;
        private final java.util.List<java.lang.String> numberCapabilities;
        private final java.lang.String numberType;
        private final java.lang.Object deletionProtectionEnabled;
        private final java.lang.String optOutListName;
        private final java.lang.String registrationId;
        private final java.lang.Object selfManagedOptOutsEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts timeouts;
        private final java.lang.String twoWayChannelArn;
        private final java.lang.Object twoWayChannelEnabled;
        private final java.lang.String twoWayChannelRole;
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
            this.isoCountryCode = software.amazon.jsii.Kernel.get(this, "isoCountryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.messageType = software.amazon.jsii.Kernel.get(this, "messageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.numberCapabilities = software.amazon.jsii.Kernel.get(this, "numberCapabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.numberType = software.amazon.jsii.Kernel.get(this, "numberType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deletionProtectionEnabled = software.amazon.jsii.Kernel.get(this, "deletionProtectionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.optOutListName = software.amazon.jsii.Kernel.get(this, "optOutListName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.registrationId = software.amazon.jsii.Kernel.get(this, "registrationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.selfManagedOptOutsEnabled = software.amazon.jsii.Kernel.get(this, "selfManagedOptOutsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts.class));
            this.twoWayChannelArn = software.amazon.jsii.Kernel.get(this, "twoWayChannelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.twoWayChannelEnabled = software.amazon.jsii.Kernel.get(this, "twoWayChannelEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.twoWayChannelRole = software.amazon.jsii.Kernel.get(this, "twoWayChannelRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.isoCountryCode = java.util.Objects.requireNonNull(builder.isoCountryCode, "isoCountryCode is required");
            this.messageType = java.util.Objects.requireNonNull(builder.messageType, "messageType is required");
            this.numberCapabilities = java.util.Objects.requireNonNull(builder.numberCapabilities, "numberCapabilities is required");
            this.numberType = java.util.Objects.requireNonNull(builder.numberType, "numberType is required");
            this.deletionProtectionEnabled = builder.deletionProtectionEnabled;
            this.optOutListName = builder.optOutListName;
            this.registrationId = builder.registrationId;
            this.selfManagedOptOutsEnabled = builder.selfManagedOptOutsEnabled;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.twoWayChannelArn = builder.twoWayChannelArn;
            this.twoWayChannelEnabled = builder.twoWayChannelEnabled;
            this.twoWayChannelRole = builder.twoWayChannelRole;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIsoCountryCode() {
            return this.isoCountryCode;
        }

        @Override
        public final java.lang.String getMessageType() {
            return this.messageType;
        }

        @Override
        public final java.util.List<java.lang.String> getNumberCapabilities() {
            return this.numberCapabilities;
        }

        @Override
        public final java.lang.String getNumberType() {
            return this.numberType;
        }

        @Override
        public final java.lang.Object getDeletionProtectionEnabled() {
            return this.deletionProtectionEnabled;
        }

        @Override
        public final java.lang.String getOptOutListName() {
            return this.optOutListName;
        }

        @Override
        public final java.lang.String getRegistrationId() {
            return this.registrationId;
        }

        @Override
        public final java.lang.Object getSelfManagedOptOutsEnabled() {
            return this.selfManagedOptOutsEnabled;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getTwoWayChannelArn() {
            return this.twoWayChannelArn;
        }

        @Override
        public final java.lang.Object getTwoWayChannelEnabled() {
            return this.twoWayChannelEnabled;
        }

        @Override
        public final java.lang.String getTwoWayChannelRole() {
            return this.twoWayChannelRole;
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

            data.set("isoCountryCode", om.valueToTree(this.getIsoCountryCode()));
            data.set("messageType", om.valueToTree(this.getMessageType()));
            data.set("numberCapabilities", om.valueToTree(this.getNumberCapabilities()));
            data.set("numberType", om.valueToTree(this.getNumberType()));
            if (this.getDeletionProtectionEnabled() != null) {
                data.set("deletionProtectionEnabled", om.valueToTree(this.getDeletionProtectionEnabled()));
            }
            if (this.getOptOutListName() != null) {
                data.set("optOutListName", om.valueToTree(this.getOptOutListName()));
            }
            if (this.getRegistrationId() != null) {
                data.set("registrationId", om.valueToTree(this.getRegistrationId()));
            }
            if (this.getSelfManagedOptOutsEnabled() != null) {
                data.set("selfManagedOptOutsEnabled", om.valueToTree(this.getSelfManagedOptOutsEnabled()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTwoWayChannelArn() != null) {
                data.set("twoWayChannelArn", om.valueToTree(this.getTwoWayChannelArn()));
            }
            if (this.getTwoWayChannelEnabled() != null) {
                data.set("twoWayChannelEnabled", om.valueToTree(this.getTwoWayChannelEnabled()));
            }
            if (this.getTwoWayChannelRole() != null) {
                data.set("twoWayChannelRole", om.valueToTree(this.getTwoWayChannelRole()));
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
            struct.set("fqn", om.valueToTree("aws.pinpointsmsvoicev2PhoneNumber.Pinpointsmsvoicev2PhoneNumberConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Pinpointsmsvoicev2PhoneNumberConfig.Jsii$Proxy that = (Pinpointsmsvoicev2PhoneNumberConfig.Jsii$Proxy) o;

            if (!isoCountryCode.equals(that.isoCountryCode)) return false;
            if (!messageType.equals(that.messageType)) return false;
            if (!numberCapabilities.equals(that.numberCapabilities)) return false;
            if (!numberType.equals(that.numberType)) return false;
            if (this.deletionProtectionEnabled != null ? !this.deletionProtectionEnabled.equals(that.deletionProtectionEnabled) : that.deletionProtectionEnabled != null) return false;
            if (this.optOutListName != null ? !this.optOutListName.equals(that.optOutListName) : that.optOutListName != null) return false;
            if (this.registrationId != null ? !this.registrationId.equals(that.registrationId) : that.registrationId != null) return false;
            if (this.selfManagedOptOutsEnabled != null ? !this.selfManagedOptOutsEnabled.equals(that.selfManagedOptOutsEnabled) : that.selfManagedOptOutsEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.twoWayChannelArn != null ? !this.twoWayChannelArn.equals(that.twoWayChannelArn) : that.twoWayChannelArn != null) return false;
            if (this.twoWayChannelEnabled != null ? !this.twoWayChannelEnabled.equals(that.twoWayChannelEnabled) : that.twoWayChannelEnabled != null) return false;
            if (this.twoWayChannelRole != null ? !this.twoWayChannelRole.equals(that.twoWayChannelRole) : that.twoWayChannelRole != null) return false;
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
            int result = this.isoCountryCode.hashCode();
            result = 31 * result + (this.messageType.hashCode());
            result = 31 * result + (this.numberCapabilities.hashCode());
            result = 31 * result + (this.numberType.hashCode());
            result = 31 * result + (this.deletionProtectionEnabled != null ? this.deletionProtectionEnabled.hashCode() : 0);
            result = 31 * result + (this.optOutListName != null ? this.optOutListName.hashCode() : 0);
            result = 31 * result + (this.registrationId != null ? this.registrationId.hashCode() : 0);
            result = 31 * result + (this.selfManagedOptOutsEnabled != null ? this.selfManagedOptOutsEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.twoWayChannelArn != null ? this.twoWayChannelArn.hashCode() : 0);
            result = 31 * result + (this.twoWayChannelEnabled != null ? this.twoWayChannelEnabled.hashCode() : 0);
            result = 31 * result + (this.twoWayChannelRole != null ? this.twoWayChannelRole.hashCode() : 0);
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
