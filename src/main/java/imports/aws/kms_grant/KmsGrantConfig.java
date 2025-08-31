package imports.aws.kms_grant;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.478Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kmsGrant.KmsGrantConfig")
@software.amazon.jsii.Jsii.Proxy(KmsGrantConfig.Jsii$Proxy.class)
public interface KmsGrantConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grantee_principal KmsGrant#grantee_principal}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGranteePrincipal();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#key_id KmsGrant#key_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKeyId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#operations KmsGrant#operations}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getOperations();

    /**
     * constraints block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#constraints KmsGrant#constraints}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getConstraints() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grant_creation_tokens KmsGrant#grant_creation_tokens}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGrantCreationTokens() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#id KmsGrant#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#name KmsGrant#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRetireOnDelete() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retiring_principal KmsGrant#retiring_principal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRetiringPrincipal() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KmsGrantConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KmsGrantConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KmsGrantConfig> {
        java.lang.String granteePrincipal;
        java.lang.String keyId;
        java.util.List<java.lang.String> operations;
        java.lang.Object constraints;
        java.util.List<java.lang.String> grantCreationTokens;
        java.lang.String id;
        java.lang.String name;
        java.lang.Object retireOnDelete;
        java.lang.String retiringPrincipal;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link KmsGrantConfig#getGranteePrincipal}
         * @param granteePrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grantee_principal KmsGrant#grantee_principal}. This parameter is required.
         * @return {@code this}
         */
        public Builder granteePrincipal(java.lang.String granteePrincipal) {
            this.granteePrincipal = granteePrincipal;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getKeyId}
         * @param keyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#key_id KmsGrant#key_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder keyId(java.lang.String keyId) {
            this.keyId = keyId;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getOperations}
         * @param operations Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#operations KmsGrant#operations}. This parameter is required.
         * @return {@code this}
         */
        public Builder operations(java.util.List<java.lang.String> operations) {
            this.operations = operations;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getConstraints}
         * @param constraints constraints block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#constraints KmsGrant#constraints}
         * @return {@code this}
         */
        public Builder constraints(com.hashicorp.cdktf.IResolvable constraints) {
            this.constraints = constraints;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getConstraints}
         * @param constraints constraints block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#constraints KmsGrant#constraints}
         * @return {@code this}
         */
        public Builder constraints(java.util.List<? extends imports.aws.kms_grant.KmsGrantConstraints> constraints) {
            this.constraints = constraints;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getGrantCreationTokens}
         * @param grantCreationTokens Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#grant_creation_tokens KmsGrant#grant_creation_tokens}.
         * @return {@code this}
         */
        public Builder grantCreationTokens(java.util.List<java.lang.String> grantCreationTokens) {
            this.grantCreationTokens = grantCreationTokens;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#id KmsGrant#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#name KmsGrant#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getRetireOnDelete}
         * @param retireOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}.
         * @return {@code this}
         */
        public Builder retireOnDelete(java.lang.Boolean retireOnDelete) {
            this.retireOnDelete = retireOnDelete;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getRetireOnDelete}
         * @param retireOnDelete Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retire_on_delete KmsGrant#retire_on_delete}.
         * @return {@code this}
         */
        public Builder retireOnDelete(com.hashicorp.cdktf.IResolvable retireOnDelete) {
            this.retireOnDelete = retireOnDelete;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getRetiringPrincipal}
         * @param retiringPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kms_grant#retiring_principal KmsGrant#retiring_principal}.
         * @return {@code this}
         */
        public Builder retiringPrincipal(java.lang.String retiringPrincipal) {
            this.retiringPrincipal = retiringPrincipal;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getDependsOn}
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
         * Sets the value of {@link KmsGrantConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link KmsGrantConfig#getProvisioners}
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
         * @return a new instance of {@link KmsGrantConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KmsGrantConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KmsGrantConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KmsGrantConfig {
        private final java.lang.String granteePrincipal;
        private final java.lang.String keyId;
        private final java.util.List<java.lang.String> operations;
        private final java.lang.Object constraints;
        private final java.util.List<java.lang.String> grantCreationTokens;
        private final java.lang.String id;
        private final java.lang.String name;
        private final java.lang.Object retireOnDelete;
        private final java.lang.String retiringPrincipal;
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
            this.granteePrincipal = software.amazon.jsii.Kernel.get(this, "granteePrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.keyId = software.amazon.jsii.Kernel.get(this, "keyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.operations = software.amazon.jsii.Kernel.get(this, "operations", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.constraints = software.amazon.jsii.Kernel.get(this, "constraints", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.grantCreationTokens = software.amazon.jsii.Kernel.get(this, "grantCreationTokens", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retireOnDelete = software.amazon.jsii.Kernel.get(this, "retireOnDelete", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retiringPrincipal = software.amazon.jsii.Kernel.get(this, "retiringPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.granteePrincipal = java.util.Objects.requireNonNull(builder.granteePrincipal, "granteePrincipal is required");
            this.keyId = java.util.Objects.requireNonNull(builder.keyId, "keyId is required");
            this.operations = java.util.Objects.requireNonNull(builder.operations, "operations is required");
            this.constraints = builder.constraints;
            this.grantCreationTokens = builder.grantCreationTokens;
            this.id = builder.id;
            this.name = builder.name;
            this.retireOnDelete = builder.retireOnDelete;
            this.retiringPrincipal = builder.retiringPrincipal;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getGranteePrincipal() {
            return this.granteePrincipal;
        }

        @Override
        public final java.lang.String getKeyId() {
            return this.keyId;
        }

        @Override
        public final java.util.List<java.lang.String> getOperations() {
            return this.operations;
        }

        @Override
        public final java.lang.Object getConstraints() {
            return this.constraints;
        }

        @Override
        public final java.util.List<java.lang.String> getGrantCreationTokens() {
            return this.grantCreationTokens;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getRetireOnDelete() {
            return this.retireOnDelete;
        }

        @Override
        public final java.lang.String getRetiringPrincipal() {
            return this.retiringPrincipal;
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

            data.set("granteePrincipal", om.valueToTree(this.getGranteePrincipal()));
            data.set("keyId", om.valueToTree(this.getKeyId()));
            data.set("operations", om.valueToTree(this.getOperations()));
            if (this.getConstraints() != null) {
                data.set("constraints", om.valueToTree(this.getConstraints()));
            }
            if (this.getGrantCreationTokens() != null) {
                data.set("grantCreationTokens", om.valueToTree(this.getGrantCreationTokens()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getRetireOnDelete() != null) {
                data.set("retireOnDelete", om.valueToTree(this.getRetireOnDelete()));
            }
            if (this.getRetiringPrincipal() != null) {
                data.set("retiringPrincipal", om.valueToTree(this.getRetiringPrincipal()));
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
            struct.set("fqn", om.valueToTree("aws.kmsGrant.KmsGrantConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KmsGrantConfig.Jsii$Proxy that = (KmsGrantConfig.Jsii$Proxy) o;

            if (!granteePrincipal.equals(that.granteePrincipal)) return false;
            if (!keyId.equals(that.keyId)) return false;
            if (!operations.equals(that.operations)) return false;
            if (this.constraints != null ? !this.constraints.equals(that.constraints) : that.constraints != null) return false;
            if (this.grantCreationTokens != null ? !this.grantCreationTokens.equals(that.grantCreationTokens) : that.grantCreationTokens != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.retireOnDelete != null ? !this.retireOnDelete.equals(that.retireOnDelete) : that.retireOnDelete != null) return false;
            if (this.retiringPrincipal != null ? !this.retiringPrincipal.equals(that.retiringPrincipal) : that.retiringPrincipal != null) return false;
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
            int result = this.granteePrincipal.hashCode();
            result = 31 * result + (this.keyId.hashCode());
            result = 31 * result + (this.operations.hashCode());
            result = 31 * result + (this.constraints != null ? this.constraints.hashCode() : 0);
            result = 31 * result + (this.grantCreationTokens != null ? this.grantCreationTokens.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.retireOnDelete != null ? this.retireOnDelete.hashCode() : 0);
            result = 31 * result + (this.retiringPrincipal != null ? this.retiringPrincipal.hashCode() : 0);
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
