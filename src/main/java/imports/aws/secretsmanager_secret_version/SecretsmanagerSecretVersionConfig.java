package imports.aws.secretsmanager_secret_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.367Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersionConfig")
@software.amazon.jsii.Jsii.Proxy(SecretsmanagerSecretVersionConfig.Jsii$Proxy.class)
public interface SecretsmanagerSecretVersionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_id SecretsmanagerSecretVersion#secret_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecretId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#id SecretsmanagerSecretVersion#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_binary SecretsmanagerSecretVersion#secret_binary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretBinary() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string SecretsmanagerSecretVersion#secret_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string_wo SecretsmanagerSecretVersion#secret_string_wo}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretStringWo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string_wo_version SecretsmanagerSecretVersion#secret_string_wo_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSecretStringWoVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#version_stages SecretsmanagerSecretVersion#version_stages}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getVersionStages() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecretsmanagerSecretVersionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecretsmanagerSecretVersionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecretsmanagerSecretVersionConfig> {
        java.lang.String secretId;
        java.lang.String id;
        java.lang.String secretBinary;
        java.lang.String secretString;
        java.lang.String secretStringWo;
        java.lang.Number secretStringWoVersion;
        java.util.List<java.lang.String> versionStages;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getSecretId}
         * @param secretId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_id SecretsmanagerSecretVersion#secret_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder secretId(java.lang.String secretId) {
            this.secretId = secretId;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#id SecretsmanagerSecretVersion#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getSecretBinary}
         * @param secretBinary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_binary SecretsmanagerSecretVersion#secret_binary}.
         * @return {@code this}
         */
        public Builder secretBinary(java.lang.String secretBinary) {
            this.secretBinary = secretBinary;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getSecretString}
         * @param secretString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string SecretsmanagerSecretVersion#secret_string}.
         * @return {@code this}
         */
        public Builder secretString(java.lang.String secretString) {
            this.secretString = secretString;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getSecretStringWo}
         * @param secretStringWo Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string_wo SecretsmanagerSecretVersion#secret_string_wo}.
         * @return {@code this}
         */
        public Builder secretStringWo(java.lang.String secretStringWo) {
            this.secretStringWo = secretStringWo;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getSecretStringWoVersion}
         * @param secretStringWoVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#secret_string_wo_version SecretsmanagerSecretVersion#secret_string_wo_version}.
         * @return {@code this}
         */
        public Builder secretStringWoVersion(java.lang.Number secretStringWoVersion) {
            this.secretStringWoVersion = secretStringWoVersion;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getVersionStages}
         * @param versionStages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/secretsmanager_secret_version#version_stages SecretsmanagerSecretVersion#version_stages}.
         * @return {@code this}
         */
        public Builder versionStages(java.util.List<java.lang.String> versionStages) {
            this.versionStages = versionStages;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getDependsOn}
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
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SecretsmanagerSecretVersionConfig#getProvisioners}
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
         * @return a new instance of {@link SecretsmanagerSecretVersionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecretsmanagerSecretVersionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecretsmanagerSecretVersionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecretsmanagerSecretVersionConfig {
        private final java.lang.String secretId;
        private final java.lang.String id;
        private final java.lang.String secretBinary;
        private final java.lang.String secretString;
        private final java.lang.String secretStringWo;
        private final java.lang.Number secretStringWoVersion;
        private final java.util.List<java.lang.String> versionStages;
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
            this.secretId = software.amazon.jsii.Kernel.get(this, "secretId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretBinary = software.amazon.jsii.Kernel.get(this, "secretBinary", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretString = software.amazon.jsii.Kernel.get(this, "secretString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretStringWo = software.amazon.jsii.Kernel.get(this, "secretStringWo", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretStringWoVersion = software.amazon.jsii.Kernel.get(this, "secretStringWoVersion", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.versionStages = software.amazon.jsii.Kernel.get(this, "versionStages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.secretId = java.util.Objects.requireNonNull(builder.secretId, "secretId is required");
            this.id = builder.id;
            this.secretBinary = builder.secretBinary;
            this.secretString = builder.secretString;
            this.secretStringWo = builder.secretStringWo;
            this.secretStringWoVersion = builder.secretStringWoVersion;
            this.versionStages = builder.versionStages;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getSecretId() {
            return this.secretId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getSecretBinary() {
            return this.secretBinary;
        }

        @Override
        public final java.lang.String getSecretString() {
            return this.secretString;
        }

        @Override
        public final java.lang.String getSecretStringWo() {
            return this.secretStringWo;
        }

        @Override
        public final java.lang.Number getSecretStringWoVersion() {
            return this.secretStringWoVersion;
        }

        @Override
        public final java.util.List<java.lang.String> getVersionStages() {
            return this.versionStages;
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

            data.set("secretId", om.valueToTree(this.getSecretId()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getSecretBinary() != null) {
                data.set("secretBinary", om.valueToTree(this.getSecretBinary()));
            }
            if (this.getSecretString() != null) {
                data.set("secretString", om.valueToTree(this.getSecretString()));
            }
            if (this.getSecretStringWo() != null) {
                data.set("secretStringWo", om.valueToTree(this.getSecretStringWo()));
            }
            if (this.getSecretStringWoVersion() != null) {
                data.set("secretStringWoVersion", om.valueToTree(this.getSecretStringWoVersion()));
            }
            if (this.getVersionStages() != null) {
                data.set("versionStages", om.valueToTree(this.getVersionStages()));
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
            struct.set("fqn", om.valueToTree("aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecretsmanagerSecretVersionConfig.Jsii$Proxy that = (SecretsmanagerSecretVersionConfig.Jsii$Proxy) o;

            if (!secretId.equals(that.secretId)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.secretBinary != null ? !this.secretBinary.equals(that.secretBinary) : that.secretBinary != null) return false;
            if (this.secretString != null ? !this.secretString.equals(that.secretString) : that.secretString != null) return false;
            if (this.secretStringWo != null ? !this.secretStringWo.equals(that.secretStringWo) : that.secretStringWo != null) return false;
            if (this.secretStringWoVersion != null ? !this.secretStringWoVersion.equals(that.secretStringWoVersion) : that.secretStringWoVersion != null) return false;
            if (this.versionStages != null ? !this.versionStages.equals(that.versionStages) : that.versionStages != null) return false;
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
            int result = this.secretId.hashCode();
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.secretBinary != null ? this.secretBinary.hashCode() : 0);
            result = 31 * result + (this.secretString != null ? this.secretString.hashCode() : 0);
            result = 31 * result + (this.secretStringWo != null ? this.secretStringWo.hashCode() : 0);
            result = 31 * result + (this.secretStringWoVersion != null ? this.secretStringWoVersion.hashCode() : 0);
            result = 31 * result + (this.versionStages != null ? this.versionStages.hashCode() : 0);
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
