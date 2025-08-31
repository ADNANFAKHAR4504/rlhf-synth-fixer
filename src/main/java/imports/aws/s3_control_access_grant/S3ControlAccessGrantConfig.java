package imports.aws.s3_control_access_grant;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.274Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlAccessGrant.S3ControlAccessGrantConfig")
@software.amazon.jsii.Jsii.Proxy(S3ControlAccessGrantConfig.Jsii$Proxy.class)
public interface S3ControlAccessGrantConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_id S3ControlAccessGrant#access_grants_location_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAccessGrantsLocationId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#permission S3ControlAccessGrant#permission}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermission();

    /**
     * access_grants_location_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_configuration S3ControlAccessGrant#access_grants_location_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAccessGrantsLocationConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#account_id S3ControlAccessGrant#account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAccountId() {
        return null;
    }

    /**
     * grantee block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee S3ControlAccessGrant#grantee}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGrantee() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_prefix_type S3ControlAccessGrant#s3_prefix_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3PrefixType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#tags S3ControlAccessGrant#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlAccessGrantConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlAccessGrantConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlAccessGrantConfig> {
        java.lang.String accessGrantsLocationId;
        java.lang.String permission;
        java.lang.Object accessGrantsLocationConfiguration;
        java.lang.String accountId;
        java.lang.Object grantee;
        java.lang.String s3PrefixType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getAccessGrantsLocationId}
         * @param accessGrantsLocationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_id S3ControlAccessGrant#access_grants_location_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder accessGrantsLocationId(java.lang.String accessGrantsLocationId) {
            this.accessGrantsLocationId = accessGrantsLocationId;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getPermission}
         * @param permission Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#permission S3ControlAccessGrant#permission}. This parameter is required.
         * @return {@code this}
         */
        public Builder permission(java.lang.String permission) {
            this.permission = permission;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getAccessGrantsLocationConfiguration}
         * @param accessGrantsLocationConfiguration access_grants_location_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_configuration S3ControlAccessGrant#access_grants_location_configuration}
         * @return {@code this}
         */
        public Builder accessGrantsLocationConfiguration(com.hashicorp.cdktf.IResolvable accessGrantsLocationConfiguration) {
            this.accessGrantsLocationConfiguration = accessGrantsLocationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getAccessGrantsLocationConfiguration}
         * @param accessGrantsLocationConfiguration access_grants_location_configuration block.
         *                                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#access_grants_location_configuration S3ControlAccessGrant#access_grants_location_configuration}
         * @return {@code this}
         */
        public Builder accessGrantsLocationConfiguration(java.util.List<? extends imports.aws.s3_control_access_grant.S3ControlAccessGrantAccessGrantsLocationConfiguration> accessGrantsLocationConfiguration) {
            this.accessGrantsLocationConfiguration = accessGrantsLocationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getAccountId}
         * @param accountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#account_id S3ControlAccessGrant#account_id}.
         * @return {@code this}
         */
        public Builder accountId(java.lang.String accountId) {
            this.accountId = accountId;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getGrantee}
         * @param grantee grantee block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee S3ControlAccessGrant#grantee}
         * @return {@code this}
         */
        public Builder grantee(com.hashicorp.cdktf.IResolvable grantee) {
            this.grantee = grantee;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getGrantee}
         * @param grantee grantee block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#grantee S3ControlAccessGrant#grantee}
         * @return {@code this}
         */
        public Builder grantee(java.util.List<? extends imports.aws.s3_control_access_grant.S3ControlAccessGrantGrantee> grantee) {
            this.grantee = grantee;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getS3PrefixType}
         * @param s3PrefixType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#s3_prefix_type S3ControlAccessGrant#s3_prefix_type}.
         * @return {@code this}
         */
        public Builder s3PrefixType(java.lang.String s3PrefixType) {
            this.s3PrefixType = s3PrefixType;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_access_grant#tags S3ControlAccessGrant#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getDependsOn}
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
         * Sets the value of {@link S3ControlAccessGrantConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlAccessGrantConfig#getProvisioners}
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
         * @return a new instance of {@link S3ControlAccessGrantConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlAccessGrantConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlAccessGrantConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlAccessGrantConfig {
        private final java.lang.String accessGrantsLocationId;
        private final java.lang.String permission;
        private final java.lang.Object accessGrantsLocationConfiguration;
        private final java.lang.String accountId;
        private final java.lang.Object grantee;
        private final java.lang.String s3PrefixType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
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
            this.accessGrantsLocationId = software.amazon.jsii.Kernel.get(this, "accessGrantsLocationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permission = software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.accessGrantsLocationConfiguration = software.amazon.jsii.Kernel.get(this, "accessGrantsLocationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.accountId = software.amazon.jsii.Kernel.get(this, "accountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.grantee = software.amazon.jsii.Kernel.get(this, "grantee", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.s3PrefixType = software.amazon.jsii.Kernel.get(this, "s3PrefixType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.accessGrantsLocationId = java.util.Objects.requireNonNull(builder.accessGrantsLocationId, "accessGrantsLocationId is required");
            this.permission = java.util.Objects.requireNonNull(builder.permission, "permission is required");
            this.accessGrantsLocationConfiguration = builder.accessGrantsLocationConfiguration;
            this.accountId = builder.accountId;
            this.grantee = builder.grantee;
            this.s3PrefixType = builder.s3PrefixType;
            this.tags = builder.tags;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAccessGrantsLocationId() {
            return this.accessGrantsLocationId;
        }

        @Override
        public final java.lang.String getPermission() {
            return this.permission;
        }

        @Override
        public final java.lang.Object getAccessGrantsLocationConfiguration() {
            return this.accessGrantsLocationConfiguration;
        }

        @Override
        public final java.lang.String getAccountId() {
            return this.accountId;
        }

        @Override
        public final java.lang.Object getGrantee() {
            return this.grantee;
        }

        @Override
        public final java.lang.String getS3PrefixType() {
            return this.s3PrefixType;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
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

            data.set("accessGrantsLocationId", om.valueToTree(this.getAccessGrantsLocationId()));
            data.set("permission", om.valueToTree(this.getPermission()));
            if (this.getAccessGrantsLocationConfiguration() != null) {
                data.set("accessGrantsLocationConfiguration", om.valueToTree(this.getAccessGrantsLocationConfiguration()));
            }
            if (this.getAccountId() != null) {
                data.set("accountId", om.valueToTree(this.getAccountId()));
            }
            if (this.getGrantee() != null) {
                data.set("grantee", om.valueToTree(this.getGrantee()));
            }
            if (this.getS3PrefixType() != null) {
                data.set("s3PrefixType", om.valueToTree(this.getS3PrefixType()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
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
            struct.set("fqn", om.valueToTree("aws.s3ControlAccessGrant.S3ControlAccessGrantConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlAccessGrantConfig.Jsii$Proxy that = (S3ControlAccessGrantConfig.Jsii$Proxy) o;

            if (!accessGrantsLocationId.equals(that.accessGrantsLocationId)) return false;
            if (!permission.equals(that.permission)) return false;
            if (this.accessGrantsLocationConfiguration != null ? !this.accessGrantsLocationConfiguration.equals(that.accessGrantsLocationConfiguration) : that.accessGrantsLocationConfiguration != null) return false;
            if (this.accountId != null ? !this.accountId.equals(that.accountId) : that.accountId != null) return false;
            if (this.grantee != null ? !this.grantee.equals(that.grantee) : that.grantee != null) return false;
            if (this.s3PrefixType != null ? !this.s3PrefixType.equals(that.s3PrefixType) : that.s3PrefixType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
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
            int result = this.accessGrantsLocationId.hashCode();
            result = 31 * result + (this.permission.hashCode());
            result = 31 * result + (this.accessGrantsLocationConfiguration != null ? this.accessGrantsLocationConfiguration.hashCode() : 0);
            result = 31 * result + (this.accountId != null ? this.accountId.hashCode() : 0);
            result = 31 * result + (this.grantee != null ? this.grantee.hashCode() : 0);
            result = 31 * result + (this.s3PrefixType != null ? this.s3PrefixType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
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
