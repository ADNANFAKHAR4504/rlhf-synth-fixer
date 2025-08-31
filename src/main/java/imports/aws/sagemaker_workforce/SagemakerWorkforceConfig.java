package imports.aws.sagemaker_workforce;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.353Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerWorkforce.SagemakerWorkforceConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerWorkforceConfig.Jsii$Proxy.class)
public interface SagemakerWorkforceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#workforce_name SagemakerWorkforce#workforce_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getWorkforceName();

    /**
     * cognito_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#cognito_config SagemakerWorkforce#cognito_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig getCognitoConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#id SagemakerWorkforce#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * oidc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#oidc_config SagemakerWorkforce#oidc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig getOidcConfig() {
        return null;
    }

    /**
     * source_ip_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#source_ip_config SagemakerWorkforce#source_ip_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig getSourceIpConfig() {
        return null;
    }

    /**
     * workforce_vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#workforce_vpc_config SagemakerWorkforce#workforce_vpc_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig getWorkforceVpcConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerWorkforceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerWorkforceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerWorkforceConfig> {
        java.lang.String workforceName;
        imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig cognitoConfig;
        java.lang.String id;
        imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig oidcConfig;
        imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig sourceIpConfig;
        imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig workforceVpcConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getWorkforceName}
         * @param workforceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#workforce_name SagemakerWorkforce#workforce_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder workforceName(java.lang.String workforceName) {
            this.workforceName = workforceName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getCognitoConfig}
         * @param cognitoConfig cognito_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#cognito_config SagemakerWorkforce#cognito_config}
         * @return {@code this}
         */
        public Builder cognitoConfig(imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig cognitoConfig) {
            this.cognitoConfig = cognitoConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#id SagemakerWorkforce#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getOidcConfig}
         * @param oidcConfig oidc_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#oidc_config SagemakerWorkforce#oidc_config}
         * @return {@code this}
         */
        public Builder oidcConfig(imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig oidcConfig) {
            this.oidcConfig = oidcConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getSourceIpConfig}
         * @param sourceIpConfig source_ip_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#source_ip_config SagemakerWorkforce#source_ip_config}
         * @return {@code this}
         */
        public Builder sourceIpConfig(imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig sourceIpConfig) {
            this.sourceIpConfig = sourceIpConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getWorkforceVpcConfig}
         * @param workforceVpcConfig workforce_vpc_config block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_workforce#workforce_vpc_config SagemakerWorkforce#workforce_vpc_config}
         * @return {@code this}
         */
        public Builder workforceVpcConfig(imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig workforceVpcConfig) {
            this.workforceVpcConfig = workforceVpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerWorkforceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerWorkforceConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerWorkforceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerWorkforceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerWorkforceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerWorkforceConfig {
        private final java.lang.String workforceName;
        private final imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig cognitoConfig;
        private final java.lang.String id;
        private final imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig oidcConfig;
        private final imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig sourceIpConfig;
        private final imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig workforceVpcConfig;
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
            this.workforceName = software.amazon.jsii.Kernel.get(this, "workforceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cognitoConfig = software.amazon.jsii.Kernel.get(this, "cognitoConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.oidcConfig = software.amazon.jsii.Kernel.get(this, "oidcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig.class));
            this.sourceIpConfig = software.amazon.jsii.Kernel.get(this, "sourceIpConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig.class));
            this.workforceVpcConfig = software.amazon.jsii.Kernel.get(this, "workforceVpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig.class));
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
            this.workforceName = java.util.Objects.requireNonNull(builder.workforceName, "workforceName is required");
            this.cognitoConfig = builder.cognitoConfig;
            this.id = builder.id;
            this.oidcConfig = builder.oidcConfig;
            this.sourceIpConfig = builder.sourceIpConfig;
            this.workforceVpcConfig = builder.workforceVpcConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getWorkforceName() {
            return this.workforceName;
        }

        @Override
        public final imports.aws.sagemaker_workforce.SagemakerWorkforceCognitoConfig getCognitoConfig() {
            return this.cognitoConfig;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.sagemaker_workforce.SagemakerWorkforceOidcConfig getOidcConfig() {
            return this.oidcConfig;
        }

        @Override
        public final imports.aws.sagemaker_workforce.SagemakerWorkforceSourceIpConfig getSourceIpConfig() {
            return this.sourceIpConfig;
        }

        @Override
        public final imports.aws.sagemaker_workforce.SagemakerWorkforceWorkforceVpcConfig getWorkforceVpcConfig() {
            return this.workforceVpcConfig;
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

            data.set("workforceName", om.valueToTree(this.getWorkforceName()));
            if (this.getCognitoConfig() != null) {
                data.set("cognitoConfig", om.valueToTree(this.getCognitoConfig()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOidcConfig() != null) {
                data.set("oidcConfig", om.valueToTree(this.getOidcConfig()));
            }
            if (this.getSourceIpConfig() != null) {
                data.set("sourceIpConfig", om.valueToTree(this.getSourceIpConfig()));
            }
            if (this.getWorkforceVpcConfig() != null) {
                data.set("workforceVpcConfig", om.valueToTree(this.getWorkforceVpcConfig()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerWorkforce.SagemakerWorkforceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerWorkforceConfig.Jsii$Proxy that = (SagemakerWorkforceConfig.Jsii$Proxy) o;

            if (!workforceName.equals(that.workforceName)) return false;
            if (this.cognitoConfig != null ? !this.cognitoConfig.equals(that.cognitoConfig) : that.cognitoConfig != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.oidcConfig != null ? !this.oidcConfig.equals(that.oidcConfig) : that.oidcConfig != null) return false;
            if (this.sourceIpConfig != null ? !this.sourceIpConfig.equals(that.sourceIpConfig) : that.sourceIpConfig != null) return false;
            if (this.workforceVpcConfig != null ? !this.workforceVpcConfig.equals(that.workforceVpcConfig) : that.workforceVpcConfig != null) return false;
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
            int result = this.workforceName.hashCode();
            result = 31 * result + (this.cognitoConfig != null ? this.cognitoConfig.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.oidcConfig != null ? this.oidcConfig.hashCode() : 0);
            result = 31 * result + (this.sourceIpConfig != null ? this.sourceIpConfig.hashCode() : 0);
            result = 31 * result + (this.workforceVpcConfig != null ? this.workforceVpcConfig.hashCode() : 0);
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
