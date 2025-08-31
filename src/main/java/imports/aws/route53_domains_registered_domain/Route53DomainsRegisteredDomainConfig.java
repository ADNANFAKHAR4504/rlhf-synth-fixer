package imports.aws.route53_domains_registered_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.204Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomainConfig")
@software.amazon.jsii.Jsii.Proxy(Route53DomainsRegisteredDomainConfig.Jsii$Proxy.class)
public interface Route53DomainsRegisteredDomainConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#domain_name Route53DomainsRegisteredDomain#domain_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDomainName();

    /**
     * admin_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_contact Route53DomainsRegisteredDomain#admin_contact}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact getAdminContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdminPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoRenew() {
        return null;
    }

    /**
     * billing_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_contact Route53DomainsRegisteredDomain#billing_contact}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact getBillingContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBillingPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#id Route53DomainsRegisteredDomain#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * name_server block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name_server Route53DomainsRegisteredDomain#name_server}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNameServer() {
        return null;
    }

    /**
     * registrant_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_contact Route53DomainsRegisteredDomain#registrant_contact}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact getRegistrantContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegistrantPrivacy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags Route53DomainsRegisteredDomain#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags_all Route53DomainsRegisteredDomain#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tech_contact block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_contact Route53DomainsRegisteredDomain#tech_contact}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact getTechContact() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTechPrivacy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#timeouts Route53DomainsRegisteredDomain#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransferLock() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Route53DomainsRegisteredDomainConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Route53DomainsRegisteredDomainConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Route53DomainsRegisteredDomainConfig> {
        java.lang.String domainName;
        imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact adminContact;
        java.lang.Object adminPrivacy;
        java.lang.Object autoRenew;
        imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact billingContact;
        java.lang.Object billingPrivacy;
        java.lang.String id;
        java.lang.Object nameServer;
        imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact registrantContact;
        java.lang.Object registrantPrivacy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact techContact;
        java.lang.Object techPrivacy;
        imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts timeouts;
        java.lang.Object transferLock;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#domain_name Route53DomainsRegisteredDomain#domain_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getAdminContact}
         * @param adminContact admin_contact block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_contact Route53DomainsRegisteredDomain#admin_contact}
         * @return {@code this}
         */
        public Builder adminContact(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact adminContact) {
            this.adminContact = adminContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getAdminPrivacy}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}.
         * @return {@code this}
         */
        public Builder adminPrivacy(java.lang.Boolean adminPrivacy) {
            this.adminPrivacy = adminPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getAdminPrivacy}
         * @param adminPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#admin_privacy Route53DomainsRegisteredDomain#admin_privacy}.
         * @return {@code this}
         */
        public Builder adminPrivacy(com.hashicorp.cdktf.IResolvable adminPrivacy) {
            this.adminPrivacy = adminPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getAutoRenew}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}.
         * @return {@code this}
         */
        public Builder autoRenew(java.lang.Boolean autoRenew) {
            this.autoRenew = autoRenew;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getAutoRenew}
         * @param autoRenew Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#auto_renew Route53DomainsRegisteredDomain#auto_renew}.
         * @return {@code this}
         */
        public Builder autoRenew(com.hashicorp.cdktf.IResolvable autoRenew) {
            this.autoRenew = autoRenew;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getBillingContact}
         * @param billingContact billing_contact block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_contact Route53DomainsRegisteredDomain#billing_contact}
         * @return {@code this}
         */
        public Builder billingContact(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact billingContact) {
            this.billingContact = billingContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getBillingPrivacy}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}.
         * @return {@code this}
         */
        public Builder billingPrivacy(java.lang.Boolean billingPrivacy) {
            this.billingPrivacy = billingPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getBillingPrivacy}
         * @param billingPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#billing_privacy Route53DomainsRegisteredDomain#billing_privacy}.
         * @return {@code this}
         */
        public Builder billingPrivacy(com.hashicorp.cdktf.IResolvable billingPrivacy) {
            this.billingPrivacy = billingPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#id Route53DomainsRegisteredDomain#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getNameServer}
         * @param nameServer name_server block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name_server Route53DomainsRegisteredDomain#name_server}
         * @return {@code this}
         */
        public Builder nameServer(com.hashicorp.cdktf.IResolvable nameServer) {
            this.nameServer = nameServer;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getNameServer}
         * @param nameServer name_server block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#name_server Route53DomainsRegisteredDomain#name_server}
         * @return {@code this}
         */
        public Builder nameServer(java.util.List<? extends imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainNameServer> nameServer) {
            this.nameServer = nameServer;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getRegistrantContact}
         * @param registrantContact registrant_contact block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_contact Route53DomainsRegisteredDomain#registrant_contact}
         * @return {@code this}
         */
        public Builder registrantContact(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact registrantContact) {
            this.registrantContact = registrantContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getRegistrantPrivacy}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}.
         * @return {@code this}
         */
        public Builder registrantPrivacy(java.lang.Boolean registrantPrivacy) {
            this.registrantPrivacy = registrantPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getRegistrantPrivacy}
         * @param registrantPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#registrant_privacy Route53DomainsRegisteredDomain#registrant_privacy}.
         * @return {@code this}
         */
        public Builder registrantPrivacy(com.hashicorp.cdktf.IResolvable registrantPrivacy) {
            this.registrantPrivacy = registrantPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags Route53DomainsRegisteredDomain#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tags_all Route53DomainsRegisteredDomain#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTechContact}
         * @param techContact tech_contact block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_contact Route53DomainsRegisteredDomain#tech_contact}
         * @return {@code this}
         */
        public Builder techContact(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact techContact) {
            this.techContact = techContact;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTechPrivacy}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}.
         * @return {@code this}
         */
        public Builder techPrivacy(java.lang.Boolean techPrivacy) {
            this.techPrivacy = techPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTechPrivacy}
         * @param techPrivacy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#tech_privacy Route53DomainsRegisteredDomain#tech_privacy}.
         * @return {@code this}
         */
        public Builder techPrivacy(com.hashicorp.cdktf.IResolvable techPrivacy) {
            this.techPrivacy = techPrivacy;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#timeouts Route53DomainsRegisteredDomain#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTransferLock}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}.
         * @return {@code this}
         */
        public Builder transferLock(java.lang.Boolean transferLock) {
            this.transferLock = transferLock;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getTransferLock}
         * @param transferLock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/route53domains_registered_domain#transfer_lock Route53DomainsRegisteredDomain#transfer_lock}.
         * @return {@code this}
         */
        public Builder transferLock(com.hashicorp.cdktf.IResolvable transferLock) {
            this.transferLock = transferLock;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getDependsOn}
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
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Route53DomainsRegisteredDomainConfig#getProvisioners}
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
         * @return a new instance of {@link Route53DomainsRegisteredDomainConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Route53DomainsRegisteredDomainConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Route53DomainsRegisteredDomainConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Route53DomainsRegisteredDomainConfig {
        private final java.lang.String domainName;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact adminContact;
        private final java.lang.Object adminPrivacy;
        private final java.lang.Object autoRenew;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact billingContact;
        private final java.lang.Object billingPrivacy;
        private final java.lang.String id;
        private final java.lang.Object nameServer;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact registrantContact;
        private final java.lang.Object registrantPrivacy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact techContact;
        private final java.lang.Object techPrivacy;
        private final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts timeouts;
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
            this.adminContact = software.amazon.jsii.Kernel.get(this, "adminContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact.class));
            this.adminPrivacy = software.amazon.jsii.Kernel.get(this, "adminPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoRenew = software.amazon.jsii.Kernel.get(this, "autoRenew", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.billingContact = software.amazon.jsii.Kernel.get(this, "billingContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact.class));
            this.billingPrivacy = software.amazon.jsii.Kernel.get(this, "billingPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nameServer = software.amazon.jsii.Kernel.get(this, "nameServer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.registrantContact = software.amazon.jsii.Kernel.get(this, "registrantContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact.class));
            this.registrantPrivacy = software.amazon.jsii.Kernel.get(this, "registrantPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.techContact = software.amazon.jsii.Kernel.get(this, "techContact", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact.class));
            this.techPrivacy = software.amazon.jsii.Kernel.get(this, "techPrivacy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts.class));
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
            this.id = builder.id;
            this.nameServer = builder.nameServer;
            this.registrantContact = builder.registrantContact;
            this.registrantPrivacy = builder.registrantPrivacy;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
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
        public final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainAdminContact getAdminContact() {
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
        public final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainBillingContact getBillingContact() {
            return this.billingContact;
        }

        @Override
        public final java.lang.Object getBillingPrivacy() {
            return this.billingPrivacy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getNameServer() {
            return this.nameServer;
        }

        @Override
        public final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainRegistrantContact getRegistrantContact() {
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
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTechContact getTechContact() {
            return this.techContact;
        }

        @Override
        public final java.lang.Object getTechPrivacy() {
            return this.techPrivacy;
        }

        @Override
        public final imports.aws.route53_domains_registered_domain.Route53DomainsRegisteredDomainTimeouts getTimeouts() {
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
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.route53DomainsRegisteredDomain.Route53DomainsRegisteredDomainConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Route53DomainsRegisteredDomainConfig.Jsii$Proxy that = (Route53DomainsRegisteredDomainConfig.Jsii$Proxy) o;

            if (!domainName.equals(that.domainName)) return false;
            if (this.adminContact != null ? !this.adminContact.equals(that.adminContact) : that.adminContact != null) return false;
            if (this.adminPrivacy != null ? !this.adminPrivacy.equals(that.adminPrivacy) : that.adminPrivacy != null) return false;
            if (this.autoRenew != null ? !this.autoRenew.equals(that.autoRenew) : that.autoRenew != null) return false;
            if (this.billingContact != null ? !this.billingContact.equals(that.billingContact) : that.billingContact != null) return false;
            if (this.billingPrivacy != null ? !this.billingPrivacy.equals(that.billingPrivacy) : that.billingPrivacy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.nameServer != null ? !this.nameServer.equals(that.nameServer) : that.nameServer != null) return false;
            if (this.registrantContact != null ? !this.registrantContact.equals(that.registrantContact) : that.registrantContact != null) return false;
            if (this.registrantPrivacy != null ? !this.registrantPrivacy.equals(that.registrantPrivacy) : that.registrantPrivacy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.nameServer != null ? this.nameServer.hashCode() : 0);
            result = 31 * result + (this.registrantContact != null ? this.registrantContact.hashCode() : 0);
            result = 31 * result + (this.registrantPrivacy != null ? this.registrantPrivacy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
