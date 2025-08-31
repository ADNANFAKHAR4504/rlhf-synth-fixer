package imports.aws.pinpoint_apns_sandbox_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.057Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pinpointApnsSandboxChannel.PinpointApnsSandboxChannelConfig")
@software.amazon.jsii.Jsii.Proxy(PinpointApnsSandboxChannelConfig.Jsii$Proxy.class)
public interface PinpointApnsSandboxChannelConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#application_id PinpointApnsSandboxChannel#application_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApplicationId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#bundle_id PinpointApnsSandboxChannel#bundle_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBundleId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#certificate PinpointApnsSandboxChannel#certificate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#default_authentication_method PinpointApnsSandboxChannel#default_authentication_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultAuthenticationMethod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#enabled PinpointApnsSandboxChannel#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#id PinpointApnsSandboxChannel#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#private_key PinpointApnsSandboxChannel#private_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#team_id PinpointApnsSandboxChannel#team_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTeamId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#token_key PinpointApnsSandboxChannel#token_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTokenKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#token_key_id PinpointApnsSandboxChannel#token_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTokenKeyId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PinpointApnsSandboxChannelConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PinpointApnsSandboxChannelConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PinpointApnsSandboxChannelConfig> {
        java.lang.String applicationId;
        java.lang.String bundleId;
        java.lang.String certificate;
        java.lang.String defaultAuthenticationMethod;
        java.lang.Object enabled;
        java.lang.String id;
        java.lang.String privateKey;
        java.lang.String teamId;
        java.lang.String tokenKey;
        java.lang.String tokenKeyId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getApplicationId}
         * @param applicationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#application_id PinpointApnsSandboxChannel#application_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder applicationId(java.lang.String applicationId) {
            this.applicationId = applicationId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getBundleId}
         * @param bundleId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#bundle_id PinpointApnsSandboxChannel#bundle_id}.
         * @return {@code this}
         */
        public Builder bundleId(java.lang.String bundleId) {
            this.bundleId = bundleId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getCertificate}
         * @param certificate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#certificate PinpointApnsSandboxChannel#certificate}.
         * @return {@code this}
         */
        public Builder certificate(java.lang.String certificate) {
            this.certificate = certificate;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getDefaultAuthenticationMethod}
         * @param defaultAuthenticationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#default_authentication_method PinpointApnsSandboxChannel#default_authentication_method}.
         * @return {@code this}
         */
        public Builder defaultAuthenticationMethod(java.lang.String defaultAuthenticationMethod) {
            this.defaultAuthenticationMethod = defaultAuthenticationMethod;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#enabled PinpointApnsSandboxChannel#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#enabled PinpointApnsSandboxChannel#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#id PinpointApnsSandboxChannel#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getPrivateKey}
         * @param privateKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#private_key PinpointApnsSandboxChannel#private_key}.
         * @return {@code this}
         */
        public Builder privateKey(java.lang.String privateKey) {
            this.privateKey = privateKey;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getTeamId}
         * @param teamId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#team_id PinpointApnsSandboxChannel#team_id}.
         * @return {@code this}
         */
        public Builder teamId(java.lang.String teamId) {
            this.teamId = teamId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getTokenKey}
         * @param tokenKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#token_key PinpointApnsSandboxChannel#token_key}.
         * @return {@code this}
         */
        public Builder tokenKey(java.lang.String tokenKey) {
            this.tokenKey = tokenKey;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getTokenKeyId}
         * @param tokenKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pinpoint_apns_sandbox_channel#token_key_id PinpointApnsSandboxChannel#token_key_id}.
         * @return {@code this}
         */
        public Builder tokenKeyId(java.lang.String tokenKeyId) {
            this.tokenKeyId = tokenKeyId;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getDependsOn}
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
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link PinpointApnsSandboxChannelConfig#getProvisioners}
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
         * @return a new instance of {@link PinpointApnsSandboxChannelConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PinpointApnsSandboxChannelConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PinpointApnsSandboxChannelConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PinpointApnsSandboxChannelConfig {
        private final java.lang.String applicationId;
        private final java.lang.String bundleId;
        private final java.lang.String certificate;
        private final java.lang.String defaultAuthenticationMethod;
        private final java.lang.Object enabled;
        private final java.lang.String id;
        private final java.lang.String privateKey;
        private final java.lang.String teamId;
        private final java.lang.String tokenKey;
        private final java.lang.String tokenKeyId;
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
            this.applicationId = software.amazon.jsii.Kernel.get(this, "applicationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bundleId = software.amazon.jsii.Kernel.get(this, "bundleId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.certificate = software.amazon.jsii.Kernel.get(this, "certificate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultAuthenticationMethod = software.amazon.jsii.Kernel.get(this, "defaultAuthenticationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateKey = software.amazon.jsii.Kernel.get(this, "privateKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.teamId = software.amazon.jsii.Kernel.get(this, "teamId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenKey = software.amazon.jsii.Kernel.get(this, "tokenKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tokenKeyId = software.amazon.jsii.Kernel.get(this, "tokenKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.applicationId = java.util.Objects.requireNonNull(builder.applicationId, "applicationId is required");
            this.bundleId = builder.bundleId;
            this.certificate = builder.certificate;
            this.defaultAuthenticationMethod = builder.defaultAuthenticationMethod;
            this.enabled = builder.enabled;
            this.id = builder.id;
            this.privateKey = builder.privateKey;
            this.teamId = builder.teamId;
            this.tokenKey = builder.tokenKey;
            this.tokenKeyId = builder.tokenKeyId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApplicationId() {
            return this.applicationId;
        }

        @Override
        public final java.lang.String getBundleId() {
            return this.bundleId;
        }

        @Override
        public final java.lang.String getCertificate() {
            return this.certificate;
        }

        @Override
        public final java.lang.String getDefaultAuthenticationMethod() {
            return this.defaultAuthenticationMethod;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPrivateKey() {
            return this.privateKey;
        }

        @Override
        public final java.lang.String getTeamId() {
            return this.teamId;
        }

        @Override
        public final java.lang.String getTokenKey() {
            return this.tokenKey;
        }

        @Override
        public final java.lang.String getTokenKeyId() {
            return this.tokenKeyId;
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

            data.set("applicationId", om.valueToTree(this.getApplicationId()));
            if (this.getBundleId() != null) {
                data.set("bundleId", om.valueToTree(this.getBundleId()));
            }
            if (this.getCertificate() != null) {
                data.set("certificate", om.valueToTree(this.getCertificate()));
            }
            if (this.getDefaultAuthenticationMethod() != null) {
                data.set("defaultAuthenticationMethod", om.valueToTree(this.getDefaultAuthenticationMethod()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPrivateKey() != null) {
                data.set("privateKey", om.valueToTree(this.getPrivateKey()));
            }
            if (this.getTeamId() != null) {
                data.set("teamId", om.valueToTree(this.getTeamId()));
            }
            if (this.getTokenKey() != null) {
                data.set("tokenKey", om.valueToTree(this.getTokenKey()));
            }
            if (this.getTokenKeyId() != null) {
                data.set("tokenKeyId", om.valueToTree(this.getTokenKeyId()));
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
            struct.set("fqn", om.valueToTree("aws.pinpointApnsSandboxChannel.PinpointApnsSandboxChannelConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PinpointApnsSandboxChannelConfig.Jsii$Proxy that = (PinpointApnsSandboxChannelConfig.Jsii$Proxy) o;

            if (!applicationId.equals(that.applicationId)) return false;
            if (this.bundleId != null ? !this.bundleId.equals(that.bundleId) : that.bundleId != null) return false;
            if (this.certificate != null ? !this.certificate.equals(that.certificate) : that.certificate != null) return false;
            if (this.defaultAuthenticationMethod != null ? !this.defaultAuthenticationMethod.equals(that.defaultAuthenticationMethod) : that.defaultAuthenticationMethod != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.privateKey != null ? !this.privateKey.equals(that.privateKey) : that.privateKey != null) return false;
            if (this.teamId != null ? !this.teamId.equals(that.teamId) : that.teamId != null) return false;
            if (this.tokenKey != null ? !this.tokenKey.equals(that.tokenKey) : that.tokenKey != null) return false;
            if (this.tokenKeyId != null ? !this.tokenKeyId.equals(that.tokenKeyId) : that.tokenKeyId != null) return false;
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
            int result = this.applicationId.hashCode();
            result = 31 * result + (this.bundleId != null ? this.bundleId.hashCode() : 0);
            result = 31 * result + (this.certificate != null ? this.certificate.hashCode() : 0);
            result = 31 * result + (this.defaultAuthenticationMethod != null ? this.defaultAuthenticationMethod.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.privateKey != null ? this.privateKey.hashCode() : 0);
            result = 31 * result + (this.teamId != null ? this.teamId.hashCode() : 0);
            result = 31 * result + (this.tokenKey != null ? this.tokenKey.hashCode() : 0);
            result = 31 * result + (this.tokenKeyId != null ? this.tokenKeyId.hashCode() : 0);
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
