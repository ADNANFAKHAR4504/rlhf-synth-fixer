package imports.aws.route53_domains_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.198Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsDomain.Route53DomainsDomainConfig")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsDomainConfig.Jsii$Proxy.class)
public interface Route53DomainsDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * admin_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdminContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdminPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoRenew() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBillingContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBillingPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDurationInYears() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNameServer() {
        return null;
    }

    /**
     * registrant_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * tech_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTechContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTechPrivacy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransferLock() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53DomainsDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsDomainConfig> {
        java.lang.String domainName;
        java.lang.Object adminContact;
        java.lang.Object adminPrivacy;
        java.lang.Object autoRenew;
        java.lang.Object billingContact;
        java.lang.Object billingPrivacy;
        java.lang.Number durationInYears;
        java.lang.Object nameServer;
        java.lang.Object registrantContact;
        java.lang.Object registrantPrivacy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Object techContact;
        java.lang.Object techPrivacy;
        imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts timeouts;
        java.lang.Object transferLock;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#domain_name Route53DomainsDomain#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAdminContact}
         * @param adminContact admin_contact block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
         * @return {@code this}
         */
        public Builder adminContact(com.hashicorp.cdktf.IResolvable adminContact) {
            this.adminContact = adminContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAdminContact}
         * @param adminContact admin_contact block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_contact Route53DomainsDomain#admin_contact}
         * @return {@code this}
         */
        public Builder adminContact(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainAdminContact> adminContact) {
            this.adminContact = adminContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAdminPrivacy}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
         * @return {@code this}
         */
        public Builder adminPrivacy(java.lang.Boolean adminPrivacy) {
            this.adminPrivacy = adminPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAdminPrivacy}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#admin_privacy Route53DomainsDomain#admin_privacy}.
         * @return {@code this}
         */
        public Builder adminPrivacy(com.hashicorp.cdktf.IResolvable adminPrivacy) {
            this.adminPrivacy = adminPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAutoRenew}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
         * @return {@code this}
         */
        public Builder autoRenew(java.lang.Boolean autoRenew) {
            this.autoRenew = autoRenew;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getAutoRenew}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#auto_renew Route53DomainsDomain#auto_renew}.
         * @return {@code this}
         */
        public Builder autoRenew(com.hashicorp.cdktf.IResolvable autoRenew) {
            this.autoRenew = autoRenew;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getBillingContact}
         * @param billingContact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
         * @return {@code this}
         */
        public Builder billingContact(com.hashicorp.cdktf.IResolvable billingContact) {
            this.billingContact = billingContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getBillingContact}
         * @param billingContact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_contact Route53DomainsDomain#billing_contact}.
         * @return {@code this}
         */
        public Builder billingContact(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainBillingContact> billingContact) {
            this.billingContact = billingContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getBillingPrivacy}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
         * @return {@code this}
         */
        public Builder billingPrivacy(java.lang.Boolean billingPrivacy) {
            this.billingPrivacy = billingPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getBillingPrivacy}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#billing_privacy Route53DomainsDomain#billing_privacy}.
         * @return {@code this}
         */
        public Builder billingPrivacy(com.hashicorp.cdktf.IResolvable billingPrivacy) {
            this.billingPrivacy = billingPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getDurationInYears}
         * @param durationInYears Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#duration_in_years Route53DomainsDomain#duration_in_years}.
         * @return {@code this}
         */
        public Builder durationInYears(java.lang.Number durationInYears) {
            this.durationInYears = durationInYears;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getNameServer}
         * @param nameServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
         * @return {@code this}
         */
        public Builder nameServer(com.hashicorp.cdktf.IResolvable nameServer) {
            this.nameServer = nameServer;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getNameServer}
         * @param nameServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#name_server Route53DomainsDomain#name_server}.
         * @return {@code this}
         */
        public Builder nameServer(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainNameServer> nameServer) {
            this.nameServer = nameServer;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getRegistrantContact}
         * @param registrantContact registrant_contact block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
         * @return {@code this}
         */
        public Builder registrantContact(com.hashicorp.cdktf.IResolvable registrantContact) {
            this.registrantContact = registrantContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getRegistrantContact}
         * @param registrantContact registrant_contact block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_contact Route53DomainsDomain#registrant_contact}
         * @return {@code this}
         */
        public Builder registrantContact(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainRegistrantContact> registrantContact) {
            this.registrantContact = registrantContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getRegistrantPrivacy}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
         * @return {@code this}
         */
        public Builder registrantPrivacy(java.lang.Boolean registrantPrivacy) {
            this.registrantPrivacy = registrantPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getRegistrantPrivacy}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#registrant_privacy Route53DomainsDomain#registrant_privacy}.
         * @return {@code this}
         */
        public Builder registrantPrivacy(com.hashicorp.cdktf.IResolvable registrantPrivacy) {
            this.registrantPrivacy = registrantPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tags Route53DomainsDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTechContact}
         * @param techContact tech_contact block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
         * @return {@code this}
         */
        public Builder techContact(com.hashicorp.cdktf.IResolvable techContact) {
            this.techContact = techContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTechContact}
         * @param techContact tech_contact block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_contact Route53DomainsDomain#tech_contact}
         * @return {@code this}
         */
        public Builder techContact(java.util.List<? extends imports.aws.route53_domains_domain.Route53DomainsDomainTechContact> techContact) {
            this.techContact = techContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTechPrivacy}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
         * @return {@code this}
         */
        public Builder techPrivacy(java.lang.Boolean techPrivacy) {
            this.techPrivacy = techPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTechPrivacy}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#tech_privacy Route53DomainsDomain#tech_privacy}.
         * @return {@code this}
         */
        public Builder techPrivacy(com.hashicorp.cdktf.IResolvable techPrivacy) {
            this.techPrivacy = techPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#timeouts Route53DomainsDomain#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTransferLock}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
         * @return {@code this}
         */
        public Builder transferLock(java.lang.Boolean transferLock) {
            this.transferLock = transferLock;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getTransferLock}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_domain#transfer_lock Route53DomainsDomain#transfer_lock}.
         * @return {@code this}
         */
        public Builder transferLock(com.hashicorp.cdktf.IResolvable transferLock) {
            this.transferLock = transferLock;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getDependsOn}
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
         * Sets the value of {@link Route53DomainsDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsDomainConfig#getProvisioners}
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
         * @return a new instance of {@link Route53DomainsDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsDomainConfig {
        private final java.lang.String domainName;
        private final java.lang.Object adminContact;
        private final java.lang.Object adminPrivacy;
        private final java.lang.Object autoRenew;
        private final java.lang.Object billingContact;
        private final java.lang.Object billingPrivacy;
        private final java.lang.Number durationInYears;
        private final java.lang.Object nameServer;
        private final java.lang.Object registrantContact;
        private final java.lang.Object registrantPrivacy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Object techContact;
        private final java.lang.Object techPrivacy;
        private final imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts timeouts;
        private final java.lang.Object transferLock;
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
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.adminContact = software.amazon.jsii.Kernel.get(this, "adminContact", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.adminPrivacy = software.amazon.jsii.Kernel.get(this, "adminPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoRenew = software.amazon.jsii.Kernel.get(this, "autoRenew", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.billingContact = software.amazon.jsii.Kernel.get(this, "billingContact", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.billingPrivacy = software.amazon.jsii.Kernel.get(this, "billingPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.durationInYears = software.amazon.jsii.Kernel.get(this, "durationInYears", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.nameServer = software.amazon.jsii.Kernel.get(this, "nameServer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.registrantContact = software.amazon.jsii.Kernel.get(this, "registrantContact", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.registrantPrivacy = software.amazon.jsii.Kernel.get(this, "registrantPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.techContact = software.amazon.jsii.Kernel.get(this, "techContact", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.techPrivacy = software.amazon.jsii.Kernel.get(this, "techPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts.class));
            this.transferLock = software.amazon.jsii.Kernel.get(this, "transferLock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.domainName = java.util.Objects.requireNonNull(builder.domainName, "domainName is required");
            this.adminContact = builder.adminContact;
            this.adminPrivacy = builder.adminPrivacy;
            this.autoRenew = builder.autoRenew;
            this.billingContact = builder.billingContact;
            this.billingPrivacy = builder.billingPrivacy;
            this.durationInYears = builder.durationInYears;
            this.nameServer = builder.nameServer;
            this.registrantContact = builder.registrantContact;
            this.registrantPrivacy = builder.registrantPrivacy;
            this.tags = builder.tags;
            this.techContact = builder.techContact;
            this.techPrivacy = builder.techPrivacy;
            this.timeouts = builder.timeouts;
            this.transferLock = builder.transferLock;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.lang.Object getAdminContact() {
            return this.adminContact;
        }

        @Override
        public final java.lang.Object getAdminPrivacy() {
            return this.adminPrivacy;
        }

        @Override
        public final java.lang.Object getAutoRenew() {
            return this.autoRenew;
        }

        @Override
        public final java.lang.Object getBillingContact() {
            return this.billingContact;
        }

        @Override
        public final java.lang.Object getBillingPrivacy() {
            return this.billingPrivacy;
        }

        @Override
        public final java.lang.Number getDurationInYears() {
            return this.durationInYears;
        }

        @Override
        public final java.lang.Object getNameServer() {
            return this.nameServer;
        }

        @Override
        public final java.lang.Object getRegistrantContact() {
            return this.registrantContact;
        }

        @Override
        public final java.lang.Object getRegistrantPrivacy() {
            return this.registrantPrivacy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Object getTechContact() {
            return this.techContact;
        }

        @Override
        public final java.lang.Object getTechPrivacy() {
            return this.techPrivacy;
        }

        @Override
        public final imports.aws.route53_domains_domain.Route53DomainsDomainTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getTransferLock() {
            return this.transferLock;
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

            data.set("domainName", om.valueToTree(this.getDomainName()));
            if (this.getAdminContact() != null) {
                data.set("adminContact", om.valueToTree(this.getAdminContact()));
            }
            if (this.getAdminPrivacy() != null) {
                data.set("adminPrivacy", om.valueToTree(this.getAdminPrivacy()));
            }
            if (this.getAutoRenew() != null) {
                data.set("autoRenew", om.valueToTree(this.getAutoRenew()));
            }
            if (this.getBillingContact() != null) {
                data.set("billingContact", om.valueToTree(this.getBillingContact()));
            }
            if (this.getBillingPrivacy() != null) {
                data.set("billingPrivacy", om.valueToTree(this.getBillingPrivacy()));
            }
            if (this.getDurationInYears() != null) {
                data.set("durationInYears", om.valueToTree(this.getDurationInYears()));
            }
            if (this.getNameServer() != null) {
                data.set("nameServer", om.valueToTree(this.getNameServer()));
            }
            if (this.getRegistrantContact() != null) {
                data.set("registrantContact", om.valueToTree(this.getRegistrantContact()));
            }
            if (this.getRegistrantPrivacy() != null) {
                data.set("registrantPrivacy", om.valueToTree(this.getRegistrantPrivacy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTechContact() != null) {
                data.set("techContact", om.valueToTree(this.getTechContact()));
            }
            if (this.getTechPrivacy() != null) {
                data.set("techPrivacy", om.valueToTree(this.getTechPrivacy()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getTransferLock() != null) {
                data.set("transferLock", om.valueToTree(this.getTransferLock()));
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
            struct.set("fqn", om.valueToTree("aws.route53DomainsDomain.Route53DomainsDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsDomainConfig.Jsii$Proxy that = (Route53DomainsDomainConfig.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.adminContact != null ? !this.adminContact.equals(that.adminContact) : that.adminContact != null) return false;
            if (this.adminPrivacy != null ? !this.adminPrivacy.equals(that.adminPrivacy) : that.adminPrivacy != null) return false;
            if (this.autoRenew != null ? !this.autoRenew.equals(that.autoRenew) : that.autoRenew != null) return false;
            if (this.billingContact != null ? !this.billingContact.equals(that.billingContact) : that.billingContact != null) return false;
            if (this.billingPrivacy != null ? !this.billingPrivacy.equals(that.billingPrivacy) : that.billingPrivacy != null) return false;
            if (this.durationInYears != null ? !this.durationInYears.equals(that.durationInYears) : that.durationInYears != null) return false;
            if (this.nameServer != null ? !this.nameServer.equals(that.nameServer) : that.nameServer != null) return false;
            if (this.registrantContact != null ? !this.registrantContact.equals(that.registrantContact) : that.registrantContact != null) return false;
            if (this.registrantPrivacy != null ? !this.registrantPrivacy.equals(that.registrantPrivacy) : that.registrantPrivacy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.techContact != null ? !this.techContact.equals(that.techContact) : that.techContact != null) return false;
            if (this.techPrivacy != null ? !this.techPrivacy.equals(that.techPrivacy) : that.techPrivacy != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transferLock != null ? !this.transferLock.equals(that.transferLock) : that.transferLock != null) return false;
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
            int result = this.domainName.hashCode();
            result = 31 * result + (this.adminContact != null ? this.adminContact.hashCode() : 0);
            result = 31 * result + (this.adminPrivacy != null ? this.adminPrivacy.hashCode() : 0);
            result = 31 * result + (this.autoRenew != null ? this.autoRenew.hashCode() : 0);
            result = 31 * result + (this.billingContact != null ? this.billingContact.hashCode() : 0);
            result = 31 * result + (this.billingPrivacy != null ? this.billingPrivacy.hashCode() : 0);
            result = 31 * result + (this.durationInYears != null ? this.durationInYears.hashCode() : 0);
            result = 31 * result + (this.nameServer != null ? this.nameServer.hashCode() : 0);
            result = 31 * result + (this.registrantContact != null ? this.registrantContact.hashCode() : 0);
            result = 31 * result + (this.registrantPrivacy != null ? this.registrantPrivacy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.techContact != null ? this.techContact.hashCode() : 0);
            result = 31 * result + (this.techPrivacy != null ? this.techPrivacy.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transferLock != null ? this.transferLock.hashCode() : 0);
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
