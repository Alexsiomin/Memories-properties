import Legal from './Legal';

const toc = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'information-we-collect', label: 'Information we collect' },
  { id: 'how-we-use', label: 'How we use your information' },
  { id: 'google-limited-use', label: 'Google API Services (Limited Use)' },
  { id: 'storage-security', label: 'Data storage and security' },
  { id: 'contact', label: 'Contact us' },
];

const Privacy = () => (
  <Legal
    title="Privacy Policy"
    toc={toc}
  >
    <section>
      <h2 id="introduction">1. Introduction</h2>
      <p>
        Memories (“we,” “our,” or “us”) is committed to protecting your privacy. This Privacy Policy
        explains how we collect, use, and disclose your information when you visit our website
        memoriesproperties.com and use our services.
      </p>
    </section>

    <section>
      <h2 id="information-we-collect">2. Information We Collect</h2>
      <p>
        We may collect personal information that you provide to us, such as your name and email address.
        If you choose to log in using Google OAuth, we collect your basic profile information (such as
        your name, email address, and profile picture) as permitted by your Google account settings and
        the scopes requested by our application.
      </p>
      <p>
        The scopes we request are: <strong>openid</strong>, <strong>email</strong>, and <strong>profile</strong>.
        These are the same scopes configured in our Google Cloud Console OAuth Consent Screen.
      </p>
    </section>

    <section>
      <h2 id="how-we-use">3. How We Use Your Information</h2>
      <p>
        We use the information we collect to provide, maintain, and improve our services, authenticate
        your identity, and communicate with you.
      </p>
    </section>

    <section>
      <h2 id="google-limited-use">4. Google API Services User Data Policy (Limited Use)</h2>
      <p>
        Our application's use and transfer to any other app of information received from Google APIs will
        adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>,
        including the Limited Use requirements. We do not sell your Google data to third parties, nor do
        we use it for serving advertisements.
      </p>
    </section>

    <section>
      <h2 id="storage-security">5. Data Storage and Security</h2>
      <p>
        We implement reasonable commercial security measures to protect your data from unauthorized
        access, alteration, or disclosure.
      </p>
    </section>

    <section>
      <h2 id="contact">6. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy, please contact us at:{' '}
        <a href="mailto:memoriespropertiescyprus@gmail.com">memoriespropertiescyprus@gmail.com</a>.
      </p>
    </section>
  </Legal>
);

export default Privacy;
