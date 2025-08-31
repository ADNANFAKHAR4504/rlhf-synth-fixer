package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.197Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterKerberosAttributes")
@software.amazon.jsii.Jsii.Proxy(EmrClusterKerberosAttributes.Jsii$Proxy.class)
public interface EmrClusterKerberosAttributes extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#kdc_admin_password EmrCluster#kdc_admin_password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getKdcAdminPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#realm EmrCluster#realm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRealm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ad_domain_join_password EmrCluster#ad_domain_join_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdDomainJoinPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ad_domain_join_user EmrCluster#ad_domain_join_user}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdDomainJoinUser() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#cross_realm_trust_principal_password EmrCluster#cross_realm_trust_principal_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCrossRealmTrustPrincipalPassword() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterKerberosAttributes}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterKerberosAttributes}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterKerberosAttributes> {
        java.lang.String kdcAdminPassword;
        java.lang.String realm;
        java.lang.String adDomainJoinPassword;
        java.lang.String adDomainJoinUser;
        java.lang.String crossRealmTrustPrincipalPassword;

        /**
         * Sets the value of {@link EmrClusterKerberosAttributes#getKdcAdminPassword}
         * @param kdcAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#kdc_admin_password EmrCluster#kdc_admin_password}. This parameter is required.
         * @return {@code this}
         */
        public Builder kdcAdminPassword(java.lang.String kdcAdminPassword) {
            this.kdcAdminPassword = kdcAdminPassword;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterKerberosAttributes#getRealm}
         * @param realm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#realm EmrCluster#realm}. This parameter is required.
         * @return {@code this}
         */
        public Builder realm(java.lang.String realm) {
            this.realm = realm;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterKerberosAttributes#getAdDomainJoinPassword}
         * @param adDomainJoinPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ad_domain_join_password EmrCluster#ad_domain_join_password}.
         * @return {@code this}
         */
        public Builder adDomainJoinPassword(java.lang.String adDomainJoinPassword) {
            this.adDomainJoinPassword = adDomainJoinPassword;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterKerberosAttributes#getAdDomainJoinUser}
         * @param adDomainJoinUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#ad_domain_join_user EmrCluster#ad_domain_join_user}.
         * @return {@code this}
         */
        public Builder adDomainJoinUser(java.lang.String adDomainJoinUser) {
            this.adDomainJoinUser = adDomainJoinUser;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterKerberosAttributes#getCrossRealmTrustPrincipalPassword}
         * @param crossRealmTrustPrincipalPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#cross_realm_trust_principal_password EmrCluster#cross_realm_trust_principal_password}.
         * @return {@code this}
         */
        public Builder crossRealmTrustPrincipalPassword(java.lang.String crossRealmTrustPrincipalPassword) {
            this.crossRealmTrustPrincipalPassword = crossRealmTrustPrincipalPassword;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterKerberosAttributes}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterKerberosAttributes build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterKerberosAttributes}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterKerberosAttributes {
        private final java.lang.String kdcAdminPassword;
        private final java.lang.String realm;
        private final java.lang.String adDomainJoinPassword;
        private final java.lang.String adDomainJoinUser;
        private final java.lang.String crossRealmTrustPrincipalPassword;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kdcAdminPassword = software.amazon.jsii.Kernel.get(this, "kdcAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.realm = software.amazon.jsii.Kernel.get(this, "realm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adDomainJoinPassword = software.amazon.jsii.Kernel.get(this, "adDomainJoinPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adDomainJoinUser = software.amazon.jsii.Kernel.get(this, "adDomainJoinUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.crossRealmTrustPrincipalPassword = software.amazon.jsii.Kernel.get(this, "crossRealmTrustPrincipalPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kdcAdminPassword = java.util.Objects.requireNonNull(builder.kdcAdminPassword, "kdcAdminPassword is required");
            this.realm = java.util.Objects.requireNonNull(builder.realm, "realm is required");
            this.adDomainJoinPassword = builder.adDomainJoinPassword;
            this.adDomainJoinUser = builder.adDomainJoinUser;
            this.crossRealmTrustPrincipalPassword = builder.crossRealmTrustPrincipalPassword;
        }

        @Override
        public final java.lang.String getKdcAdminPassword() {
            return this.kdcAdminPassword;
        }

        @Override
        public final java.lang.String getRealm() {
            return this.realm;
        }

        @Override
        public final java.lang.String getAdDomainJoinPassword() {
            return this.adDomainJoinPassword;
        }

        @Override
        public final java.lang.String getAdDomainJoinUser() {
            return this.adDomainJoinUser;
        }

        @Override
        public final java.lang.String getCrossRealmTrustPrincipalPassword() {
            return this.crossRealmTrustPrincipalPassword;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("kdcAdminPassword", om.valueToTree(this.getKdcAdminPassword()));
            data.set("realm", om.valueToTree(this.getRealm()));
            if (this.getAdDomainJoinPassword() != null) {
                data.set("adDomainJoinPassword", om.valueToTree(this.getAdDomainJoinPassword()));
            }
            if (this.getAdDomainJoinUser() != null) {
                data.set("adDomainJoinUser", om.valueToTree(this.getAdDomainJoinUser()));
            }
            if (this.getCrossRealmTrustPrincipalPassword() != null) {
                data.set("crossRealmTrustPrincipalPassword", om.valueToTree(this.getCrossRealmTrustPrincipalPassword()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterKerberosAttributes"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterKerberosAttributes.Jsii$Proxy that = (EmrClusterKerberosAttributes.Jsii$Proxy) o;

            if (!kdcAdminPassword.equals(that.kdcAdminPassword)) return false;
            if (!realm.equals(that.realm)) return false;
            if (this.adDomainJoinPassword != null ? !this.adDomainJoinPassword.equals(that.adDomainJoinPassword) : that.adDomainJoinPassword != null) return false;
            if (this.adDomainJoinUser != null ? !this.adDomainJoinUser.equals(that.adDomainJoinUser) : that.adDomainJoinUser != null) return false;
            return this.crossRealmTrustPrincipalPassword != null ? this.crossRealmTrustPrincipalPassword.equals(that.crossRealmTrustPrincipalPassword) : that.crossRealmTrustPrincipalPassword == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kdcAdminPassword.hashCode();
            result = 31 * result + (this.realm.hashCode());
            result = 31 * result + (this.adDomainJoinPassword != null ? this.adDomainJoinPassword.hashCode() : 0);
            result = 31 * result + (this.adDomainJoinUser != null ? this.adDomainJoinUser.hashCode() : 0);
            result = 31 * result + (this.crossRealmTrustPrincipalPassword != null ? this.crossRealmTrustPrincipalPassword.hashCode() : 0);
            return result;
        }
    }
}
