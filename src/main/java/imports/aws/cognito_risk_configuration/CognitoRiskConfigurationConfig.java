package imports.aws.cognito_risk_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.348Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cognitoRiskConfiguration.CognitoRiskConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(CognitoRiskConfigurationConfig.Jsii$Proxy.class)
public interface CognitoRiskConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#user_pool_id CognitoRiskConfiguration#user_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUserPoolId();

    /**
     * account_takeover_risk_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#account_takeover_risk_configuration CognitoRiskConfiguration#account_takeover_risk_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration getAccountTakeoverRiskConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#client_id CognitoRiskConfiguration#client_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getClientId() {
        return null;
    }

    /**
     * compromised_credentials_risk_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#compromised_credentials_risk_configuration CognitoRiskConfiguration#compromised_credentials_risk_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration getCompromisedCredentialsRiskConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#id CognitoRiskConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * risk_exception_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#risk_exception_configuration CognitoRiskConfiguration#risk_exception_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration getRiskExceptionConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CognitoRiskConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CognitoRiskConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CognitoRiskConfigurationConfig> {
        java.lang.String userPoolId;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration accountTakeoverRiskConfiguration;
        java.lang.String clientId;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration compromisedCredentialsRiskConfiguration;
        java.lang.String id;
        imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration riskExceptionConfiguration;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getUserPoolId}
         * @param userPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#user_pool_id CognitoRiskConfiguration#user_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder userPoolId(java.lang.String userPoolId) {
            this.userPoolId = userPoolId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getAccountTakeoverRiskConfiguration}
         * @param accountTakeoverRiskConfiguration account_takeover_risk_configuration block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#account_takeover_risk_configuration CognitoRiskConfiguration#account_takeover_risk_configuration}
         * @return {@code this}
         */
        public Builder accountTakeoverRiskConfiguration(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration accountTakeoverRiskConfiguration) {
            this.accountTakeoverRiskConfiguration = accountTakeoverRiskConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getClientId}
         * @param clientId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#client_id CognitoRiskConfiguration#client_id}.
         * @return {@code this}
         */
        public Builder clientId(java.lang.String clientId) {
            this.clientId = clientId;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getCompromisedCredentialsRiskConfiguration}
         * @param compromisedCredentialsRiskConfiguration compromised_credentials_risk_configuration block.
         *                                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#compromised_credentials_risk_configuration CognitoRiskConfiguration#compromised_credentials_risk_configuration}
         * @return {@code this}
         */
        public Builder compromisedCredentialsRiskConfiguration(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration compromisedCredentialsRiskConfiguration) {
            this.compromisedCredentialsRiskConfiguration = compromisedCredentialsRiskConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#id CognitoRiskConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getRiskExceptionConfiguration}
         * @param riskExceptionConfiguration risk_exception_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cognito_risk_configuration#risk_exception_configuration CognitoRiskConfiguration#risk_exception_configuration}
         * @return {@code this}
         */
        public Builder riskExceptionConfiguration(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration riskExceptionConfiguration) {
            this.riskExceptionConfiguration = riskExceptionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link CognitoRiskConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link CognitoRiskConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link CognitoRiskConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CognitoRiskConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CognitoRiskConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CognitoRiskConfigurationConfig {
        private final java.lang.String userPoolId;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration accountTakeoverRiskConfiguration;
        private final java.lang.String clientId;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration compromisedCredentialsRiskConfiguration;
        private final java.lang.String id;
        private final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration riskExceptionConfiguration;
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
            this.userPoolId = software.amazon.jsii.Kernel.get(this, "userPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accountTakeoverRiskConfiguration = software.amazon.jsii.Kernel.get(this, "accountTakeoverRiskConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration.class));
            this.clientId = software.amazon.jsii.Kernel.get(this, "clientId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.compromisedCredentialsRiskConfiguration = software.amazon.jsii.Kernel.get(this, "compromisedCredentialsRiskConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.riskExceptionConfiguration = software.amazon.jsii.Kernel.get(this, "riskExceptionConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration.class));
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
            this.userPoolId = java.util.Objects.requireNonNull(builder.userPoolId, "userPoolId is required");
            this.accountTakeoverRiskConfiguration = builder.accountTakeoverRiskConfiguration;
            this.clientId = builder.clientId;
            this.compromisedCredentialsRiskConfiguration = builder.compromisedCredentialsRiskConfiguration;
            this.id = builder.id;
            this.riskExceptionConfiguration = builder.riskExceptionConfiguration;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getUserPoolId() {
            return this.userPoolId;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationAccountTakeoverRiskConfiguration getAccountTakeoverRiskConfiguration() {
            return this.accountTakeoverRiskConfiguration;
        }

        @Override
        public final java.lang.String getClientId() {
            return this.clientId;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationCompromisedCredentialsRiskConfiguration getCompromisedCredentialsRiskConfiguration() {
            return this.compromisedCredentialsRiskConfiguration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.cognito_risk_configuration.CognitoRiskConfigurationRiskExceptionConfiguration getRiskExceptionConfiguration() {
            return this.riskExceptionConfiguration;
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

            data.set("userPoolId", om.valueToTree(this.getUserPoolId()));
            if (this.getAccountTakeoverRiskConfiguration() != null) {
                data.set("accountTakeoverRiskConfiguration", om.valueToTree(this.getAccountTakeoverRiskConfiguration()));
            }
            if (this.getClientId() != null) {
                data.set("clientId", om.valueToTree(this.getClientId()));
            }
            if (this.getCompromisedCredentialsRiskConfiguration() != null) {
                data.set("compromisedCredentialsRiskConfiguration", om.valueToTree(this.getCompromisedCredentialsRiskConfiguration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getRiskExceptionConfiguration() != null) {
                data.set("riskExceptionConfiguration", om.valueToTree(this.getRiskExceptionConfiguration()));
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
            struct.set("fqn", om.valueToTree("aws.cognitoRiskConfiguration.CognitoRiskConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CognitoRiskConfigurationConfig.Jsii$Proxy that = (CognitoRiskConfigurationConfig.Jsii$Proxy) o;

            if (!userPoolId.equals(that.userPoolId)) return false;
            if (this.accountTakeoverRiskConfiguration != null ? !this.accountTakeoverRiskConfiguration.equals(that.accountTakeoverRiskConfiguration) : that.accountTakeoverRiskConfiguration != null) return false;
            if (this.clientId != null ? !this.clientId.equals(that.clientId) : that.clientId != null) return false;
            if (this.compromisedCredentialsRiskConfiguration != null ? !this.compromisedCredentialsRiskConfiguration.equals(that.compromisedCredentialsRiskConfiguration) : that.compromisedCredentialsRiskConfiguration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.riskExceptionConfiguration != null ? !this.riskExceptionConfiguration.equals(that.riskExceptionConfiguration) : that.riskExceptionConfiguration != null) return false;
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
            int result = this.userPoolId.hashCode();
            result = 31 * result + (this.accountTakeoverRiskConfiguration != null ? this.accountTakeoverRiskConfiguration.hashCode() : 0);
            result = 31 * result + (this.clientId != null ? this.clientId.hashCode() : 0);
            result = 31 * result + (this.compromisedCredentialsRiskConfiguration != null ? this.compromisedCredentialsRiskConfiguration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.riskExceptionConfiguration != null ? this.riskExceptionConfiguration.hashCode() : 0);
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
