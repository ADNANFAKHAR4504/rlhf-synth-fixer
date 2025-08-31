package imports.aws.pinpointsmsvoicev2_phone_number;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number aws_pinpointsmsvoicev2_phone_number}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.062Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointsmsvoicev2PhoneNumber.Pinpointsmsvoicev2PhoneNumber")
public class Pinpointsmsvoicev2PhoneNumber extends com.hashicorp.cdktf.TerraformResource {

    protected Pinpointsmsvoicev2PhoneNumber(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Pinpointsmsvoicev2PhoneNumber(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number aws_pinpointsmsvoicev2_phone_number} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Pinpointsmsvoicev2PhoneNumber(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Pinpointsmsvoicev2PhoneNumber resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Pinpointsmsvoicev2PhoneNumber to import. This parameter is required.
     * @param importFromId The id of the existing Pinpointsmsvoicev2PhoneNumber that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Pinpointsmsvoicev2PhoneNumber to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Pinpointsmsvoicev2PhoneNumber resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Pinpointsmsvoicev2PhoneNumber to import. This parameter is required.
     * @param importFromId The id of the existing Pinpointsmsvoicev2PhoneNumber that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDeletionProtectionEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetDeletionProtectionEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOptOutListName() {
        software.amazon.jsii.Kernel.call(this, "resetOptOutListName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRegistrationId() {
        software.amazon.jsii.Kernel.call(this, "resetRegistrationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfManagedOptOutsEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetSelfManagedOptOutsEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTwoWayChannelArn() {
        software.amazon.jsii.Kernel.call(this, "resetTwoWayChannelArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTwoWayChannelEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetTwoWayChannelEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTwoWayChannelRole() {
        software.amazon.jsii.Kernel.call(this, "resetTwoWayChannelRole", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMonthlyLeasingPrice() {
        return software.amazon.jsii.Kernel.get(this, "monthlyLeasingPrice", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPhoneNumber() {
        return software.amazon.jsii.Kernel.get(this, "phoneNumber", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDeletionProtectionEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtectionEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIsoCountryCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "isoCountryCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMessageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "messageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNumberCapabilitiesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "numberCapabilitiesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNumberTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "numberTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOptOutListNameInput() {
        return software.amazon.jsii.Kernel.get(this, "optOutListNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRegistrationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "registrationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSelfManagedOptOutsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedOptOutsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTwoWayChannelArnInput() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTwoWayChannelEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTwoWayChannelRoleInput() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelRoleInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDeletionProtectionEnabled() {
        return software.amazon.jsii.Kernel.get(this, "deletionProtectionEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDeletionProtectionEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtectionEnabled", java.util.Objects.requireNonNull(value, "deletionProtectionEnabled is required"));
    }

    public void setDeletionProtectionEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "deletionProtectionEnabled", java.util.Objects.requireNonNull(value, "deletionProtectionEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIsoCountryCode() {
        return software.amazon.jsii.Kernel.get(this, "isoCountryCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIsoCountryCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "isoCountryCode", java.util.Objects.requireNonNull(value, "isoCountryCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMessageType() {
        return software.amazon.jsii.Kernel.get(this, "messageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMessageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "messageType", java.util.Objects.requireNonNull(value, "messageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getNumberCapabilities() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "numberCapabilities", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setNumberCapabilities(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "numberCapabilities", java.util.Objects.requireNonNull(value, "numberCapabilities is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNumberType() {
        return software.amazon.jsii.Kernel.get(this, "numberType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNumberType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "numberType", java.util.Objects.requireNonNull(value, "numberType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOptOutListName() {
        return software.amazon.jsii.Kernel.get(this, "optOutListName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOptOutListName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "optOutListName", java.util.Objects.requireNonNull(value, "optOutListName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRegistrationId() {
        return software.amazon.jsii.Kernel.get(this, "registrationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRegistrationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "registrationId", java.util.Objects.requireNonNull(value, "registrationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSelfManagedOptOutsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "selfManagedOptOutsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSelfManagedOptOutsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "selfManagedOptOutsEnabled", java.util.Objects.requireNonNull(value, "selfManagedOptOutsEnabled is required"));
    }

    public void setSelfManagedOptOutsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "selfManagedOptOutsEnabled", java.util.Objects.requireNonNull(value, "selfManagedOptOutsEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTwoWayChannelArn() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTwoWayChannelArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "twoWayChannelArn", java.util.Objects.requireNonNull(value, "twoWayChannelArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTwoWayChannelEnabled() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTwoWayChannelEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "twoWayChannelEnabled", java.util.Objects.requireNonNull(value, "twoWayChannelEnabled is required"));
    }

    public void setTwoWayChannelEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "twoWayChannelEnabled", java.util.Objects.requireNonNull(value, "twoWayChannelEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTwoWayChannelRole() {
        return software.amazon.jsii.Kernel.get(this, "twoWayChannelRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTwoWayChannelRole(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "twoWayChannelRole", java.util.Objects.requireNonNull(value, "twoWayChannelRole is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber> {
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
        private final imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#iso_country_code Pinpointsmsvoicev2PhoneNumber#iso_country_code}.
         * <p>
         * @return {@code this}
         * @param isoCountryCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#iso_country_code Pinpointsmsvoicev2PhoneNumber#iso_country_code}. This parameter is required.
         */
        public Builder isoCountryCode(final java.lang.String isoCountryCode) {
            this.config.isoCountryCode(isoCountryCode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#message_type Pinpointsmsvoicev2PhoneNumber#message_type}.
         * <p>
         * @return {@code this}
         * @param messageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#message_type Pinpointsmsvoicev2PhoneNumber#message_type}. This parameter is required.
         */
        public Builder messageType(final java.lang.String messageType) {
            this.config.messageType(messageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_capabilities Pinpointsmsvoicev2PhoneNumber#number_capabilities}.
         * <p>
         * @return {@code this}
         * @param numberCapabilities Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_capabilities Pinpointsmsvoicev2PhoneNumber#number_capabilities}. This parameter is required.
         */
        public Builder numberCapabilities(final java.util.List<java.lang.String> numberCapabilities) {
            this.config.numberCapabilities(numberCapabilities);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_type Pinpointsmsvoicev2PhoneNumber#number_type}.
         * <p>
         * @return {@code this}
         * @param numberType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#number_type Pinpointsmsvoicev2PhoneNumber#number_type}. This parameter is required.
         */
        public Builder numberType(final java.lang.String numberType) {
            this.config.numberType(numberType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}.
         * <p>
         * @return {@code this}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}. This parameter is required.
         */
        public Builder deletionProtectionEnabled(final java.lang.Boolean deletionProtectionEnabled) {
            this.config.deletionProtectionEnabled(deletionProtectionEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}.
         * <p>
         * @return {@code this}
         * @param deletionProtectionEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#deletion_protection_enabled Pinpointsmsvoicev2PhoneNumber#deletion_protection_enabled}. This parameter is required.
         */
        public Builder deletionProtectionEnabled(final com.hashicorp.cdktf.IResolvable deletionProtectionEnabled) {
            this.config.deletionProtectionEnabled(deletionProtectionEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#opt_out_list_name Pinpointsmsvoicev2PhoneNumber#opt_out_list_name}.
         * <p>
         * @return {@code this}
         * @param optOutListName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#opt_out_list_name Pinpointsmsvoicev2PhoneNumber#opt_out_list_name}. This parameter is required.
         */
        public Builder optOutListName(final java.lang.String optOutListName) {
            this.config.optOutListName(optOutListName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#registration_id Pinpointsmsvoicev2PhoneNumber#registration_id}.
         * <p>
         * @return {@code this}
         * @param registrationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#registration_id Pinpointsmsvoicev2PhoneNumber#registration_id}. This parameter is required.
         */
        public Builder registrationId(final java.lang.String registrationId) {
            this.config.registrationId(registrationId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}.
         * <p>
         * @return {@code this}
         * @param selfManagedOptOutsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}. This parameter is required.
         */
        public Builder selfManagedOptOutsEnabled(final java.lang.Boolean selfManagedOptOutsEnabled) {
            this.config.selfManagedOptOutsEnabled(selfManagedOptOutsEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}.
         * <p>
         * @return {@code this}
         * @param selfManagedOptOutsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#self_managed_opt_outs_enabled Pinpointsmsvoicev2PhoneNumber#self_managed_opt_outs_enabled}. This parameter is required.
         */
        public Builder selfManagedOptOutsEnabled(final com.hashicorp.cdktf.IResolvable selfManagedOptOutsEnabled) {
            this.config.selfManagedOptOutsEnabled(selfManagedOptOutsEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#tags Pinpointsmsvoicev2PhoneNumber#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#tags Pinpointsmsvoicev2PhoneNumber#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#timeouts Pinpointsmsvoicev2PhoneNumber#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumberTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_arn Pinpointsmsvoicev2PhoneNumber#two_way_channel_arn}.
         * <p>
         * @return {@code this}
         * @param twoWayChannelArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_arn Pinpointsmsvoicev2PhoneNumber#two_way_channel_arn}. This parameter is required.
         */
        public Builder twoWayChannelArn(final java.lang.String twoWayChannelArn) {
            this.config.twoWayChannelArn(twoWayChannelArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}.
         * <p>
         * @return {@code this}
         * @param twoWayChannelEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}. This parameter is required.
         */
        public Builder twoWayChannelEnabled(final java.lang.Boolean twoWayChannelEnabled) {
            this.config.twoWayChannelEnabled(twoWayChannelEnabled);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}.
         * <p>
         * @return {@code this}
         * @param twoWayChannelEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_enabled Pinpointsmsvoicev2PhoneNumber#two_way_channel_enabled}. This parameter is required.
         */
        public Builder twoWayChannelEnabled(final com.hashicorp.cdktf.IResolvable twoWayChannelEnabled) {
            this.config.twoWayChannelEnabled(twoWayChannelEnabled);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_role Pinpointsmsvoicev2PhoneNumber#two_way_channel_role}.
         * <p>
         * @return {@code this}
         * @param twoWayChannelRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpointsmsvoicev2_phone_number#two_way_channel_role Pinpointsmsvoicev2PhoneNumber#two_way_channel_role}. This parameter is required.
         */
        public Builder twoWayChannelRole(final java.lang.String twoWayChannelRole) {
            this.config.twoWayChannelRole(twoWayChannelRole);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber}.
         */
        @Override
        public imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber build() {
            return new imports.aws.pinpointsmsvoicev2_phone_number.Pinpointsmsvoicev2PhoneNumber(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
