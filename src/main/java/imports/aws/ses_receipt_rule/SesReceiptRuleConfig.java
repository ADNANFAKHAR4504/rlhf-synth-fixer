package imports.aws.ses_receipt_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.450Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesReceiptRule.SesReceiptRuleConfig")
@software.amazon.jsii.Jsii.Proxy(SesReceiptRuleConfig.Jsii$Proxy.class)
public interface SesReceiptRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#name SesReceiptRule#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#rule_set_name SesReceiptRule#rule_set_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleSetName();

    /**
     * add_header_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#add_header_action SesReceiptRule#add_header_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAddHeaderAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#after SesReceiptRule#after}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAfter() {
        return null;
    }

    /**
     * bounce_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bounce_action SesReceiptRule#bounce_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBounceAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#id SesReceiptRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lambda_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#lambda_action SesReceiptRule#lambda_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLambdaAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#recipients SesReceiptRule#recipients}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRecipients() {
        return null;
    }

    /**
     * s3_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#s3_action SesReceiptRule#s3_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3Action() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScanEnabled() {
        return null;
    }

    /**
     * sns_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sns_action SesReceiptRule#sns_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSnsAction() {
        return null;
    }

    /**
     * stop_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#stop_action SesReceiptRule#stop_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStopAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#tls_policy SesReceiptRule#tls_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsPolicy() {
        return null;
    }

    /**
     * workmail_action block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#workmail_action SesReceiptRule#workmail_action}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWorkmailAction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SesReceiptRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SesReceiptRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SesReceiptRuleConfig> {
        java.lang.String name;
        java.lang.String ruleSetName;
        java.lang.Object addHeaderAction;
        java.lang.String after;
        java.lang.Object bounceAction;
        java.lang.Object enabled;
        java.lang.String id;
        java.lang.Object lambdaAction;
        java.util.List<java.lang.String> recipients;
        java.lang.Object s3Action;
        java.lang.Object scanEnabled;
        java.lang.Object snsAction;
        java.lang.Object stopAction;
        java.lang.String tlsPolicy;
        java.lang.Object workmailAction;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#name SesReceiptRule#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getRuleSetName}
         * @param ruleSetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#rule_set_name SesReceiptRule#rule_set_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleSetName(java.lang.String ruleSetName) {
            this.ruleSetName = ruleSetName;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getAddHeaderAction}
         * @param addHeaderAction add_header_action block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#add_header_action SesReceiptRule#add_header_action}
         * @return {@code this}
         */
        public Builder addHeaderAction(com.hashicorp.cdktf.IResolvable addHeaderAction) {
            this.addHeaderAction = addHeaderAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getAddHeaderAction}
         * @param addHeaderAction add_header_action block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#add_header_action SesReceiptRule#add_header_action}
         * @return {@code this}
         */
        public Builder addHeaderAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleAddHeaderAction> addHeaderAction) {
            this.addHeaderAction = addHeaderAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getAfter}
         * @param after Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#after SesReceiptRule#after}.
         * @return {@code this}
         */
        public Builder after(java.lang.String after) {
            this.after = after;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getBounceAction}
         * @param bounceAction bounce_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bounce_action SesReceiptRule#bounce_action}
         * @return {@code this}
         */
        public Builder bounceAction(com.hashicorp.cdktf.IResolvable bounceAction) {
            this.bounceAction = bounceAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getBounceAction}
         * @param bounceAction bounce_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#bounce_action SesReceiptRule#bounce_action}
         * @return {@code this}
         */
        public Builder bounceAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleBounceAction> bounceAction) {
            this.bounceAction = bounceAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#enabled SesReceiptRule#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#id SesReceiptRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getLambdaAction}
         * @param lambdaAction lambda_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#lambda_action SesReceiptRule#lambda_action}
         * @return {@code this}
         */
        public Builder lambdaAction(com.hashicorp.cdktf.IResolvable lambdaAction) {
            this.lambdaAction = lambdaAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getLambdaAction}
         * @param lambdaAction lambda_action block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#lambda_action SesReceiptRule#lambda_action}
         * @return {@code this}
         */
        public Builder lambdaAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleLambdaAction> lambdaAction) {
            this.lambdaAction = lambdaAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getRecipients}
         * @param recipients Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#recipients SesReceiptRule#recipients}.
         * @return {@code this}
         */
        public Builder recipients(java.util.List<java.lang.String> recipients) {
            this.recipients = recipients;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getS3Action}
         * @param s3Action s3_action block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#s3_action SesReceiptRule#s3_action}
         * @return {@code this}
         */
        public Builder s3Action(com.hashicorp.cdktf.IResolvable s3Action) {
            this.s3Action = s3Action;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getS3Action}
         * @param s3Action s3_action block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#s3_action SesReceiptRule#s3_action}
         * @return {@code this}
         */
        public Builder s3Action(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleS3Action> s3Action) {
            this.s3Action = s3Action;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getScanEnabled}
         * @param scanEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}.
         * @return {@code this}
         */
        public Builder scanEnabled(java.lang.Boolean scanEnabled) {
            this.scanEnabled = scanEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getScanEnabled}
         * @param scanEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#scan_enabled SesReceiptRule#scan_enabled}.
         * @return {@code this}
         */
        public Builder scanEnabled(com.hashicorp.cdktf.IResolvable scanEnabled) {
            this.scanEnabled = scanEnabled;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getSnsAction}
         * @param snsAction sns_action block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sns_action SesReceiptRule#sns_action}
         * @return {@code this}
         */
        public Builder snsAction(com.hashicorp.cdktf.IResolvable snsAction) {
            this.snsAction = snsAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getSnsAction}
         * @param snsAction sns_action block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#sns_action SesReceiptRule#sns_action}
         * @return {@code this}
         */
        public Builder snsAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleSnsAction> snsAction) {
            this.snsAction = snsAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getStopAction}
         * @param stopAction stop_action block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#stop_action SesReceiptRule#stop_action}
         * @return {@code this}
         */
        public Builder stopAction(com.hashicorp.cdktf.IResolvable stopAction) {
            this.stopAction = stopAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getStopAction}
         * @param stopAction stop_action block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#stop_action SesReceiptRule#stop_action}
         * @return {@code this}
         */
        public Builder stopAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleStopAction> stopAction) {
            this.stopAction = stopAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getTlsPolicy}
         * @param tlsPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#tls_policy SesReceiptRule#tls_policy}.
         * @return {@code this}
         */
        public Builder tlsPolicy(java.lang.String tlsPolicy) {
            this.tlsPolicy = tlsPolicy;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getWorkmailAction}
         * @param workmailAction workmail_action block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#workmail_action SesReceiptRule#workmail_action}
         * @return {@code this}
         */
        public Builder workmailAction(com.hashicorp.cdktf.IResolvable workmailAction) {
            this.workmailAction = workmailAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getWorkmailAction}
         * @param workmailAction workmail_action block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ses_receipt_rule#workmail_action SesReceiptRule#workmail_action}
         * @return {@code this}
         */
        public Builder workmailAction(java.util.List<? extends imports.aws.ses_receipt_rule.SesReceiptRuleWorkmailAction> workmailAction) {
            this.workmailAction = workmailAction;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getDependsOn}
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
         * Sets the value of {@link SesReceiptRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SesReceiptRuleConfig#getProvisioners}
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
         * @return a new instance of {@link SesReceiptRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SesReceiptRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SesReceiptRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SesReceiptRuleConfig {
        private final java.lang.String name;
        private final java.lang.String ruleSetName;
        private final java.lang.Object addHeaderAction;
        private final java.lang.String after;
        private final java.lang.Object bounceAction;
        private final java.lang.Object enabled;
        private final java.lang.String id;
        private final java.lang.Object lambdaAction;
        private final java.util.List<java.lang.String> recipients;
        private final java.lang.Object s3Action;
        private final java.lang.Object scanEnabled;
        private final java.lang.Object snsAction;
        private final java.lang.Object stopAction;
        private final java.lang.String tlsPolicy;
        private final java.lang.Object workmailAction;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleSetName = software.amazon.jsii.Kernel.get(this, "ruleSetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.addHeaderAction = software.amazon.jsii.Kernel.get(this, "addHeaderAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.after = software.amazon.jsii.Kernel.get(this, "after", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bounceAction = software.amazon.jsii.Kernel.get(this, "bounceAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaAction = software.amazon.jsii.Kernel.get(this, "lambdaAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recipients = software.amazon.jsii.Kernel.get(this, "recipients", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.s3Action = software.amazon.jsii.Kernel.get(this, "s3Action", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scanEnabled = software.amazon.jsii.Kernel.get(this, "scanEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snsAction = software.amazon.jsii.Kernel.get(this, "snsAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stopAction = software.amazon.jsii.Kernel.get(this, "stopAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tlsPolicy = software.amazon.jsii.Kernel.get(this, "tlsPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.workmailAction = software.amazon.jsii.Kernel.get(this, "workmailAction", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.ruleSetName = java.util.Objects.requireNonNull(builder.ruleSetName, "ruleSetName is required");
            this.addHeaderAction = builder.addHeaderAction;
            this.after = builder.after;
            this.bounceAction = builder.bounceAction;
            this.enabled = builder.enabled;
            this.id = builder.id;
            this.lambdaAction = builder.lambdaAction;
            this.recipients = builder.recipients;
            this.s3Action = builder.s3Action;
            this.scanEnabled = builder.scanEnabled;
            this.snsAction = builder.snsAction;
            this.stopAction = builder.stopAction;
            this.tlsPolicy = builder.tlsPolicy;
            this.workmailAction = builder.workmailAction;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRuleSetName() {
            return this.ruleSetName;
        }

        @Override
        public final java.lang.Object getAddHeaderAction() {
            return this.addHeaderAction;
        }

        @Override
        public final java.lang.String getAfter() {
            return this.after;
        }

        @Override
        public final java.lang.Object getBounceAction() {
            return this.bounceAction;
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
        public final java.lang.Object getLambdaAction() {
            return this.lambdaAction;
        }

        @Override
        public final java.util.List<java.lang.String> getRecipients() {
            return this.recipients;
        }

        @Override
        public final java.lang.Object getS3Action() {
            return this.s3Action;
        }

        @Override
        public final java.lang.Object getScanEnabled() {
            return this.scanEnabled;
        }

        @Override
        public final java.lang.Object getSnsAction() {
            return this.snsAction;
        }

        @Override
        public final java.lang.Object getStopAction() {
            return this.stopAction;
        }

        @Override
        public final java.lang.String getTlsPolicy() {
            return this.tlsPolicy;
        }

        @Override
        public final java.lang.Object getWorkmailAction() {
            return this.workmailAction;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("ruleSetName", om.valueToTree(this.getRuleSetName()));
            if (this.getAddHeaderAction() != null) {
                data.set("addHeaderAction", om.valueToTree(this.getAddHeaderAction()));
            }
            if (this.getAfter() != null) {
                data.set("after", om.valueToTree(this.getAfter()));
            }
            if (this.getBounceAction() != null) {
                data.set("bounceAction", om.valueToTree(this.getBounceAction()));
            }
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLambdaAction() != null) {
                data.set("lambdaAction", om.valueToTree(this.getLambdaAction()));
            }
            if (this.getRecipients() != null) {
                data.set("recipients", om.valueToTree(this.getRecipients()));
            }
            if (this.getS3Action() != null) {
                data.set("s3Action", om.valueToTree(this.getS3Action()));
            }
            if (this.getScanEnabled() != null) {
                data.set("scanEnabled", om.valueToTree(this.getScanEnabled()));
            }
            if (this.getSnsAction() != null) {
                data.set("snsAction", om.valueToTree(this.getSnsAction()));
            }
            if (this.getStopAction() != null) {
                data.set("stopAction", om.valueToTree(this.getStopAction()));
            }
            if (this.getTlsPolicy() != null) {
                data.set("tlsPolicy", om.valueToTree(this.getTlsPolicy()));
            }
            if (this.getWorkmailAction() != null) {
                data.set("workmailAction", om.valueToTree(this.getWorkmailAction()));
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
            struct.set("fqn", om.valueToTree("aws.sesReceiptRule.SesReceiptRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SesReceiptRuleConfig.Jsii$Proxy that = (SesReceiptRuleConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!ruleSetName.equals(that.ruleSetName)) return false;
            if (this.addHeaderAction != null ? !this.addHeaderAction.equals(that.addHeaderAction) : that.addHeaderAction != null) return false;
            if (this.after != null ? !this.after.equals(that.after) : that.after != null) return false;
            if (this.bounceAction != null ? !this.bounceAction.equals(that.bounceAction) : that.bounceAction != null) return false;
            if (this.enabled != null ? !this.enabled.equals(that.enabled) : that.enabled != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lambdaAction != null ? !this.lambdaAction.equals(that.lambdaAction) : that.lambdaAction != null) return false;
            if (this.recipients != null ? !this.recipients.equals(that.recipients) : that.recipients != null) return false;
            if (this.s3Action != null ? !this.s3Action.equals(that.s3Action) : that.s3Action != null) return false;
            if (this.scanEnabled != null ? !this.scanEnabled.equals(that.scanEnabled) : that.scanEnabled != null) return false;
            if (this.snsAction != null ? !this.snsAction.equals(that.snsAction) : that.snsAction != null) return false;
            if (this.stopAction != null ? !this.stopAction.equals(that.stopAction) : that.stopAction != null) return false;
            if (this.tlsPolicy != null ? !this.tlsPolicy.equals(that.tlsPolicy) : that.tlsPolicy != null) return false;
            if (this.workmailAction != null ? !this.workmailAction.equals(that.workmailAction) : that.workmailAction != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.ruleSetName.hashCode());
            result = 31 * result + (this.addHeaderAction != null ? this.addHeaderAction.hashCode() : 0);
            result = 31 * result + (this.after != null ? this.after.hashCode() : 0);
            result = 31 * result + (this.bounceAction != null ? this.bounceAction.hashCode() : 0);
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lambdaAction != null ? this.lambdaAction.hashCode() : 0);
            result = 31 * result + (this.recipients != null ? this.recipients.hashCode() : 0);
            result = 31 * result + (this.s3Action != null ? this.s3Action.hashCode() : 0);
            result = 31 * result + (this.scanEnabled != null ? this.scanEnabled.hashCode() : 0);
            result = 31 * result + (this.snsAction != null ? this.snsAction.hashCode() : 0);
            result = 31 * result + (this.stopAction != null ? this.stopAction.hashCode() : 0);
            result = 31 * result + (this.tlsPolicy != null ? this.tlsPolicy.hashCode() : 0);
            result = 31 * result + (this.workmailAction != null ? this.workmailAction.hashCode() : 0);
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
