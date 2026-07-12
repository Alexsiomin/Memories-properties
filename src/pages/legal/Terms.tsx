import Legal from './Legal';

const toc = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'accounts', label: 'User Accounts' },
  { id: 'google-login', label: 'Google Login' },
  { id: 'acceptable-use', label: 'Acceptable Use' },
  { id: 'prohibited-activities', label: 'Prohibited Activities' },
  { id: 'listings', label: 'Listings & Accuracy' },
  { id: 'ip', label: 'Intellectual Property' },
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'liability', label: 'Limitation of Liability' },
  { id: 'suspension', label: 'Account Suspension' },
  { id: 'account-deletion', label: 'Account Deletion' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'privacy-ref', label: 'Privacy Policy Reference' },
  { id: 'data-analysis', label: 'Data Analysis' },
  { id: 'website-protection', label: 'Website Protection' },
  { id: 'third-parties', label: 'Third-Party Services' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact Information' },
];

const Terms = () => (
  <Legal
    title="Terms of Service"
    intro="These Terms of Service govern your access to and use of the Memories Properties website and services. By using the site you agree to these Terms. If you do not agree, please do not use the site."
    toc={toc}
  >
    <section>
      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        These Terms form a binding agreement between you and Memories Properties. We may
        update them; continued use after changes means you accept the revised
        Terms. You must be at least 18 years old and able to enter into a binding contract under the laws of your jurisdiction.
      </p>
    </section>

    <section>
      <h2 id="accounts">2. User Accounts</h2>
      <ul>
        <li>You are responsible for keeping your credentials confidential.</li>
        <li>You must provide accurate information and update it when it changes.</li>
        <li>We may suspend or close accounts that breach these Terms or applicable law.</li>
      </ul>
    </section>

    <section>
      <h2 id="google-login">3. Google Login</h2>
      <p>
        By signing in with Google, you authorize our application to access only the information requested during authentication. We use information obtained from your Google Account solely for authentication, account management, website security, fraud prevention, and improving our services. We do not sell your Google user data or use it for advertising purposes.
      </p>
      <p>
        Memories Properties is not affiliated with or endorsed by Google LLC. Google Sign-In is provided solely as an optional authentication method.
      </p>
    </section>

    <section>
      <h2 id="acceptable-use">4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the site to violate any law or third-party right.</li>
        <li>Scrape, copy or republish substantial portions of the content without permission.</li>
        <li>Upload malware, attempt to bypass access controls, or interfere with the service.</li>
        <li>Submit false enquiries, impersonate others, or harass agents or users.</li>
      </ul>
    </section>

    <section>
      <h2 id="prohibited-activities">5. Prohibited Activities</h2>
      <p>The following activities are strictly prohibited:</p>
      <ul>
        <li>Any illegal, fraudulent, or harmful conduct.</li>
        <li>Reverse engineering, decompiling, or attempting to extract source code.</li>
        <li>Creating multiple accounts to circumvent restrictions or bans.</li>
        <li>Harvesting user data or contact information without consent.</li>
        <li>Interfering with the security or availability of the platform.</li>
      </ul>
    </section>

    <section>
      <h2 id="listings">6. Listings, Prices & Accuracy</h2>
      <p>
        Property information — including measurements, prices, taxes, fees,
        availability and images — is provided in good faith but may change
        without notice. Listings are an invitation to treat, not an offer.
        Buyers and tenants are responsible for verifying details, conducting
        site visits and obtaining independent surveys before committing.
      </p>
    </section>

    <section>
      <h2 id="ip">7. Intellectual Property</h2>
      <p>
        All content, branding, logos, photography and software are owned by
        Memories Properties or its licensors and are protected by copyright and trademark
        law. You receive a limited, revocable licence to view the content for
        personal, non-commercial use only.
      </p>
    </section>

    <section>
      <h2 id="disclaimer">8. Disclaimer</h2>
      <h3>Service &quot;as is&quot;</h3>
      <p>
        Our services are provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind,
        either express or implied. We do not warrant that our services will be uninterrupted,
        secure, or error-free.
      </p>
      <h3>No professional advice</h3>
      <p>
        Information on our platform is for general informational purposes only and should not
        be construed as professional real estate, legal, financial, or tax advice specific to
        Cyprus property transactions. Always consult with qualified Cyprus-licensed
        professionals, including lawyers, tax advisors, and licensed real estate agents, before
        making real estate decisions in Cyprus.
      </p>
    </section>

    <section>
      <h2 id="liability">9. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, Memories Properties shall not be liable for any
        indirect, incidental, special, consequential, or punitive damages arising from your use
        of our services, even if we have been advised of the possibility of such damages.
      </p>
    </section>

    <section>
      <h2 id="suspension">10. Account Suspension</h2>
      <p>
        We may suspend or terminate your access at any time, with or without
        notice, if we reasonably believe you have breached these Terms or
        applicable law. Suspension may be temporary or permanent depending on the severity of the violation.
      </p>
    </section>

    <section>
      <h2 id="account-deletion">11. Account Deletion</h2>
      <p>
        Users may request deletion of their account at any time. Upon receiving a valid request, we will delete or anonymize personal information unless we are required by law to retain certain records.
      </p>
    </section>

    <section>
      <h2 id="data-retention">12. Data Retention</h2>
      <p>
        We retain account information only for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements. When an account is deleted, personal information will be deleted or anonymized within a reasonable period unless applicable law requires a longer retention period.
      </p>
    </section>

    <section>
      <h2 id="privacy-ref">13. Privacy Policy Reference</h2>
      <p>
        Please review our{' '}
        <a href="/privacy">Privacy Policy</a>, which forms part of these Terms and explains how we collect, use, disclose, store, and protect personal information.
      </p>
    </section>

    <section>
      <h2 id="data-analysis">14. Data Analysis</h2>
      <p>
        We analyze aggregated and, where possible, anonymized usage information to understand how visitors use our website, improve performance, identify technical issues, detect fraudulent activity, and enhance security. This information is not used to create advertising profiles or sold to third parties.
      </p>
    </section>

    <section>
      <h2 id="website-protection">15. Website Protection</h2>
      <p>
        We collect technical information such as IP addresses, login timestamps, browser information, and device characteristics to detect fraudulent activity, prevent abuse, investigate security incidents, and protect user accounts. We do not guarantee that the website will be secure or free from trojans, bugs or viruses. You are responsible for configuring your information technology, computer programs and platform in order to access the website.
      </p>
    </section>

    <section>
      <h2 id="third-parties">16. Third-Party Services</h2>
      <p>
        Our platform relies on selected third-party providers to operate securely and effectively. These include:
      </p>
      <ul>
        <li><strong>Google OAuth</strong>: Used to authenticate users and manage account sign-in securely.</li>
        <li><strong>Google Analytics</strong>: Used to collect aggregated, anonymized website usage data to help us improve performance and understand visitor behavior.</li>
        <li><strong>Cloudflare</strong>: Provides security and performance services such as DDoS protection and content delivery.</li>
        <li><strong>Hosting provider</strong>: Stores and serves our website content and application data.</li>
      </ul>
      <p>
        We are not responsible for the content, privacy practices, or terms of these external services. Your use of third-party services is at your own risk.
      </p>
    </section>

    <section>
      <h2 id="indemnification">17. Indemnification</h2>
      <p>
        You agree to defend, indemnify, and hold harmless the Company Parties from and against
        any third party action, suit, claim or demand and any associated losses, expenses,
        damages, costs and other liabilities (including reasonable attorneys' fees), arising out
        of or relating to your (and your users') Submitted Content, use or misuse of any portion
        of the Product, or your violation of these Terms of Service. You shall cooperate as fully as
        reasonably required in the defense of any such claim or demand. If the foregoing indemnity
        is unavailable to any of the Company Parties with respect to any claim, demand or action
        under any laws, rules or regulations for any reason, Company shall be entitled to seek in
        a court of competent jurisdiction your contribution to such claim, demand or action
        under any legal or equitable theories available to it.
      </p>
    </section>

    <section>
      <h2 id="law">18. Governing Law & Jurisdiction</h2>
      <p>
        These Terms are governed by the laws of the Republic of Cyprus. The
        courts of Cyprus have exclusive jurisdiction, except where mandatory
        consumer-protection rules of your country of residence provide otherwise.
      </p>
    </section>

    <section>
      <h2 id="contact">19. Contact Information</h2>
      <p>
        Questions about these Terms: <a href="mailto:memoriespropertiescyprus@gmail.com">memoriespropertiescyprus@gmail.com</a>
      </p>
    </section>
  </Legal>
);

export default Terms;