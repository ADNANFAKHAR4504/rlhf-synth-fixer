package imports.aws.transfer_access;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.561Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferAccess.TransferAccessConfig")
@software.amazon.jsii.Jsii.Proxy(TransferAccessConfig.Jsii$Proxy.class)
public interface TransferAccessConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#external_id TransferAccess#external_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExternalId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#server_id TransferAccess#server_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServerId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory TransferAccess#home_directory}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHomeDirectory() {
        return null;
    }

    /**
     * home_directory_mappings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory_mappings TransferAccess#home_directory_mappings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHomeDirectoryMappings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory_type TransferAccess#home_directory_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHomeDirectoryType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#id TransferAccess#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#policy TransferAccess#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * posix_profile block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#posix_profile TransferAccess#posix_profile}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.transfer_access.TransferAccessPosixProfile getPosixProfile() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#role TransferAccess#role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRole() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferAccessConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferAccessConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferAccessConfig> {
        java.lang.String externalId;
        java.lang.String serverId;
        java.lang.String homeDirectory;
        java.lang.Object homeDirectoryMappings;
        java.lang.String homeDirectoryType;
        java.lang.String id;
        java.lang.String policy;
        imports.aws.transfer_access.TransferAccessPosixProfile posixProfile;
        java.lang.String role;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link TransferAccessConfig#getExternalId}
         * @param externalId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#external_id TransferAccess#external_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder externalId(java.lang.String externalId) {
            this.externalId = externalId;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getServerId}
         * @param serverId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#server_id TransferAccess#server_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder serverId(java.lang.String serverId) {
            this.serverId = serverId;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getHomeDirectory}
         * @param homeDirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory TransferAccess#home_directory}.
         * @return {@code this}
         */
        public Builder homeDirectory(java.lang.String homeDirectory) {
            this.homeDirectory = homeDirectory;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getHomeDirectoryMappings}
         * @param homeDirectoryMappings home_directory_mappings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory_mappings TransferAccess#home_directory_mappings}
         * @return {@code this}
         */
        public Builder homeDirectoryMappings(com.hashicorp.cdktf.IResolvable homeDirectoryMappings) {
            this.homeDirectoryMappings = homeDirectoryMappings;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getHomeDirectoryMappings}
         * @param homeDirectoryMappings home_directory_mappings block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory_mappings TransferAccess#home_directory_mappings}
         * @return {@code this}
         */
        public Builder homeDirectoryMappings(java.util.List<? extends imports.aws.transfer_access.TransferAccessHomeDirectoryMappings> homeDirectoryMappings) {
            this.homeDirectoryMappings = homeDirectoryMappings;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getHomeDirectoryType}
         * @param homeDirectoryType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#home_directory_type TransferAccess#home_directory_type}.
         * @return {@code this}
         */
        public Builder homeDirectoryType(java.lang.String homeDirectoryType) {
            this.homeDirectoryType = homeDirectoryType;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#id TransferAccess#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#policy TransferAccess#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getPosixProfile}
         * @param posixProfile posix_profile block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#posix_profile TransferAccess#posix_profile}
         * @return {@code this}
         */
        public Builder posixProfile(imports.aws.transfer_access.TransferAccessPosixProfile posixProfile) {
            this.posixProfile = posixProfile;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getRole}
         * @param role Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_access#role TransferAccess#role}.
         * @return {@code this}
         */
        public Builder role(java.lang.String role) {
            this.role = role;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getDependsOn}
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
         * Sets the value of {@link TransferAccessConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link TransferAccessConfig#getProvisioners}
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
         * @return a new instance of {@link TransferAccessConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferAccessConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferAccessConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferAccessConfig {
        private final java.lang.String externalId;
        private final java.lang.String serverId;
        private final java.lang.String homeDirectory;
        private final java.lang.Object homeDirectoryMappings;
        private final java.lang.String homeDirectoryType;
        private final java.lang.String id;
        private final java.lang.String policy;
        private final imports.aws.transfer_access.TransferAccessPosixProfile posixProfile;
        private final java.lang.String role;
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
            this.externalId = software.amazon.jsii.Kernel.get(this, "externalId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverId = software.amazon.jsii.Kernel.get(this, "serverId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.homeDirectory = software.amazon.jsii.Kernel.get(this, "homeDirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.homeDirectoryMappings = software.amazon.jsii.Kernel.get(this, "homeDirectoryMappings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.homeDirectoryType = software.amazon.jsii.Kernel.get(this, "homeDirectoryType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.posixProfile = software.amazon.jsii.Kernel.get(this, "posixProfile", software.amazon.jsii.NativeType.forClass(imports.aws.transfer_access.TransferAccessPosixProfile.class));
            this.role = software.amazon.jsii.Kernel.get(this, "role", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.externalId = java.util.Objects.requireNonNull(builder.externalId, "externalId is required");
            this.serverId = java.util.Objects.requireNonNull(builder.serverId, "serverId is required");
            this.homeDirectory = builder.homeDirectory;
            this.homeDirectoryMappings = builder.homeDirectoryMappings;
            this.homeDirectoryType = builder.homeDirectoryType;
            this.id = builder.id;
            this.policy = builder.policy;
            this.posixProfile = builder.posixProfile;
            this.role = builder.role;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getExternalId() {
            return this.externalId;
        }

        @Override
        public final java.lang.String getServerId() {
            return this.serverId;
        }

        @Override
        public final java.lang.String getHomeDirectory() {
            return this.homeDirectory;
        }

        @Override
        public final java.lang.Object getHomeDirectoryMappings() {
            return this.homeDirectoryMappings;
        }

        @Override
        public final java.lang.String getHomeDirectoryType() {
            return this.homeDirectoryType;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final imports.aws.transfer_access.TransferAccessPosixProfile getPosixProfile() {
            return this.posixProfile;
        }

        @Override
        public final java.lang.String getRole() {
            return this.role;
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

            data.set("externalId", om.valueToTree(this.getExternalId()));
            data.set("serverId", om.valueToTree(this.getServerId()));
            if (this.getHomeDirectory() != null) {
                data.set("homeDirectory", om.valueToTree(this.getHomeDirectory()));
            }
            if (this.getHomeDirectoryMappings() != null) {
                data.set("homeDirectoryMappings", om.valueToTree(this.getHomeDirectoryMappings()));
            }
            if (this.getHomeDirectoryType() != null) {
                data.set("homeDirectoryType", om.valueToTree(this.getHomeDirectoryType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPosixProfile() != null) {
                data.set("posixProfile", om.valueToTree(this.getPosixProfile()));
            }
            if (this.getRole() != null) {
                data.set("role", om.valueToTree(this.getRole()));
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
            struct.set("fqn", om.valueToTree("aws.transferAccess.TransferAccessConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferAccessConfig.Jsii$Proxy that = (TransferAccessConfig.Jsii$Proxy) o;

            if (!externalId.equals(that.externalId)) return false;
            if (!serverId.equals(that.serverId)) return false;
            if (this.homeDirectory != null ? !this.homeDirectory.equals(that.homeDirectory) : that.homeDirectory != null) return false;
            if (this.homeDirectoryMappings != null ? !this.homeDirectoryMappings.equals(that.homeDirectoryMappings) : that.homeDirectoryMappings != null) return false;
            if (this.homeDirectoryType != null ? !this.homeDirectoryType.equals(that.homeDirectoryType) : that.homeDirectoryType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.posixProfile != null ? !this.posixProfile.equals(that.posixProfile) : that.posixProfile != null) return false;
            if (this.role != null ? !this.role.equals(that.role) : that.role != null) return false;
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
            int result = this.externalId.hashCode();
            result = 31 * result + (this.serverId.hashCode());
            result = 31 * result + (this.homeDirectory != null ? this.homeDirectory.hashCode() : 0);
            result = 31 * result + (this.homeDirectoryMappings != null ? this.homeDirectoryMappings.hashCode() : 0);
            result = 31 * result + (this.homeDirectoryType != null ? this.homeDirectoryType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.posixProfile != null ? this.posixProfile.hashCode() : 0);
            result = 31 * result + (this.role != null ? this.role.hashCode() : 0);
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
