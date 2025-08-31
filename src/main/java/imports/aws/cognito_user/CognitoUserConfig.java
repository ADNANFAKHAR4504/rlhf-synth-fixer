package imports.aws.cognito_user;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoUser.CognitoUserConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoUserConfig.Jsii$Proxy.class)
public interface CognitoUserConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#username CognitoUser#username}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUsername();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#user_pool_id CognitoUser#user_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#attributes CognitoUser#attributes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAttributes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#client_metadata CognitoUser#client_metadata}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getClientMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#desired_delivery_mediums CognitoUser#desired_delivery_mediums}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDesiredDeliveryMediums() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#enabled CognitoUser#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#force_alias_creation CognitoUser#force_alias_creation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceAliasCreation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#id CognitoUser#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#message_action CognitoUser#message_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#password CognitoUser#password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#temporary_password CognitoUser#temporary_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemporaryPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#validation_data CognitoUser#validation_data}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getValidationData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoUserConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoUserConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoUserConfig> {
        java.lang.String username;
        java.lang.String userPoolId;
        java.util.Map<java.lang.String, java.lang.String> attributes;
        java.util.Map<java.lang.String, java.lang.String> clientMetadata;
        java.util.List<java.lang.String> desiredDeliveryMediums;
        java.lang.Object enabled;
        java.lang.Object forceAliasCreation;
        java.lang.String id;
        java.lang.String messageAction;
        java.lang.String password;
        java.lang.String temporaryPassword;
        java.util.Map<java.lang.String, java.lang.String> validationData;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoUserConfig#getUsername}
         * @param username Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#username CognitoUser#username}. This parameter is required.
         * @return {@code this}
         */
        public Builder username(java.lang.String username) {
            this.username = username;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getUserPoolId}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#user_pool_id CognitoUser#user_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolId(java.lang.String userPoolId) {
            this.userPoolId = userPoolId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getAttributes}
         * @param attributes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#attributes CognitoUser#attributes}.
         * @return {@code this}
         */
        public Builder attributes(java.util.Map<java.lang.String, java.lang.String> attributes) {
            this.attributes = attributes;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getClientMetadata}
         * @param clientMetadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#client_metadata CognitoUser#client_metadata}.
         * @return {@code this}
         */
        public Builder clientMetadata(java.util.Map<java.lang.String, java.lang.String> clientMetadata) {
            this.clientMetadata = clientMetadata;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getDesiredDeliveryMediums}
         * @param desiredDeliveryMediums Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#desired_delivery_mediums CognitoUser#desired_delivery_mediums}.
         * @return {@code this}
         */
        public Builder desiredDeliveryMediums(java.util.List<java.lang.String> desiredDeliveryMediums) {
            this.desiredDeliveryMediums = desiredDeliveryMediums;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#enabled CognitoUser#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#enabled CognitoUser#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getForceAliasCreation}
         * @param forceAliasCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#force_alias_creation CognitoUser#force_alias_creation}.
         * @return {@code this}
         */
        public Builder forceAliasCreation(java.lang.Boolean forceAliasCreation) {
            this.forceAliasCreation = forceAliasCreation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getForceAliasCreation}
         * @param forceAliasCreation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#force_alias_creation CognitoUser#force_alias_creation}.
         * @return {@code this}
         */
        public Builder forceAliasCreation(com.hashicorp.cdktf.IResolvable forceAliasCreation) {
            this.forceAliasCreation = forceAliasCreation;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#id CognitoUser#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getMessageAction}
         * @param messageAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#message_action CognitoUser#message_action}.
         * @return {@code this}
         */
        public Builder messageAction(java.lang.String messageAction) {
            this.messageAction = messageAction;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#password CognitoUser#password}.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getTemporaryPassword}
         * @param temporaryPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#temporary_password CognitoUser#temporary_password}.
         * @return {@code this}
         */
        public Builder temporaryPassword(java.lang.String temporaryPassword) {
            this.temporaryPassword = temporaryPassword;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getValidationData}
         * @param validationData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_user#validation_data CognitoUser#validation_data}.
         * @return {@code this}
         */
        public Builder validationData(java.util.Map<java.lang.String, java.lang.String> validationData) {
            this.validationData = validationData;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getDependsOn}
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
         * Sets the value of {@link CognitoUserConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoUserConfig#getProvisioners}
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
         * @return a new instance of {@link CognitoUserConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoUserConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoUserConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoUserConfig {
        private final java.lang.String username;
        private final java.lang.String userPoolId;
        private final java.util.Map<java.lang.String, java.lang.String> attributes;
        private final java.util.Map<java.lang.String, java.lang.String> clientMetadata;
        private final java.util.List<java.lang.String> desiredDeliveryMediums;
        private final java.lang.Object enabled;
        private final java.lang.Object forceAliasCreation;
        private final java.lang.String id;
        private final java.lang.String messageAction;
        private final java.lang.String password;
        private final java.lang.String temporaryPassword;
        private final java.util.Map<java.lang.String, java.lang.String> validationData;
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
            this.username = software.amazon.jsii.Kernel.get(this, "username", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.userPoolId = software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.attributes = software.amazon.jsii.Kernel.get(this, "attributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.clientMetadata = software.amazon.jsii.Kernel.get(this, "clientMetadata", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.desiredDeliveryMediums = software.amazon.jsii.Kernel.get(this, "desiredDeliveryMediums", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.forceAliasCreation = software.amazon.jsii.Kernel.get(this, "forceAliasCreation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.messageAction = software.amazon.jsii.Kernel.get(this, "messageAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.temporaryPassword = software.amazon.jsii.Kernel.get(this, "temporaryPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.validationData = software.amazon.jsii.Kernel.get(this, "validationData", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.username = java.util.Objects.requireNonNull(builder.username, "username is required");
            this.userPoolId = java.util.Objects.requireNonNull(builder.userPoolId, "userPoolId is required");
            this.attributes = builder.attributes;
            this.clientMetadata = builder.clientMetadata;
            this.desiredDeliveryMediums = builder.desiredDeliveryMediums;
            this.enabled = builder.enabled;
            this.forceAliasCreation = builder.forceAliasCreation;
            this.id = builder.id;
            this.messageAction = builder.messageAction;
            this.password = builder.password;
            this.temporaryPassword = builder.temporaryPassword;
            this.validationData = builder.validationData;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getUsername() {
            return this.username;
        }

        @Override
        public final java.lang.String getUserPoolId() {
            return this.userPoolId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAttributes() {
            return this.attributes;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getClientMetadata() {
            return this.clientMetadata;
        }

        @Override
        public final java.util.List<java.lang.String> getDesiredDeliveryMediums() {
            return this.desiredDeliveryMediums;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getForceAliasCreation() {
            return this.forceAliasCreation;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMessageAction() {
            return this.messageAction;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getTemporaryPassword() {
            return this.temporaryPassword;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getValidationData() {
            return this.validationData;
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

            data.set("username", om.valueToTree(this.getUsername()));
            data.set("userPoolId", om.valueToTree(this.getUserPoolId()));
            if (this.getAttributes() != null) {
                data.set("attributes", om.valueToTree(this.getAttributes()));
            }
            if (this.getClientMetadata() != null) {
                data.set("clientMetadata", om.valueToTree(this.getClientMetadata()));
            }
            if (this.getDesiredDeliveryMediums() != null) {
                data.set("desiredDeliveryMediums", om.valueToTree(this.getDesiredDeliveryMediums()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getForceAliasCreation() != null) {
                data.set("forceAliasCreation", om.valueToTree(this.getForceAliasCreation()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMessageAction() != null) {
                data.set("messageAction", om.valueToTree(this.getMessageAction()));
            }
            if (this.getPassword() != null) {
                data.set("password", om.valueToTree(this.getPassword()));
            }
            if (this.getTemporaryPassword() != null) {
                data.set("temporaryPassword", om.valueToTree(this.getTemporaryPassword()));
            }
            if (this.getValidationData() != null) {
                data.set("validationData", om.valueToTree(this.getValidationData()));
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
            struct.set("fqn", om.valueToTree("aws.cognitoUser.CognitoUserConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoUserConfig.Jsii$Proxy that = (CognitoUserConfig.Jsii$Proxy) o;

            if (!username.equals(that.username)) return false;
            if (!userPoolId.equals(that.userPoolId)) return false;
            if (this.attributes != null ? !this.attributes.equals(that.attributes) : that.attributes != null) return false;
            if (this.clientMetadata != null ? !this.clientMetadata.equals(that.clientMetadata) : that.clientMetadata != null) return false;
            if (this.desiredDeliveryMediums != null ? !this.desiredDeliveryMediums.equals(that.desiredDeliveryMediums) : that.desiredDeliveryMediums != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.forceAliasCreation != null ? !this.forceAliasCreation.equals(that.forceAliasCreation) : that.forceAliasCreation != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.messageAction != null ? !this.messageAction.equals(that.messageAction) : that.messageAction != null) return false;
            if (this.password != null ? !this.password.equals(that.password) : that.password != null) return false;
            if (this.temporaryPassword != null ? !this.temporaryPassword.equals(that.temporaryPassword) : that.temporaryPassword != null) return false;
            if (this.validationData != null ? !this.validationData.equals(that.validationData) : that.validationData != null) return false;
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
            int result = this.username.hashCode();
            result = 31 * result + (this.userPoolId.hashCode());
            result = 31 * result + (this.attributes != null ? this.attributes.hashCode() : 0);
            result = 31 * result + (this.clientMetadata != null ? this.clientMetadata.hashCode() : 0);
            result = 31 * result + (this.desiredDeliveryMediums != null ? this.desiredDeliveryMediums.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.forceAliasCreation != null ? this.forceAliasCreation.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.messageAction != null ? this.messageAction.hashCode() : 0);
            result = 31 * result + (this.password != null ? this.password.hashCode() : 0);
            result = 31 * result + (this.temporaryPassword != null ? this.temporaryPassword.hashCode() : 0);
            result = 31 * result + (this.validationData != null ? this.validationData.hashCode() : 0);
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
