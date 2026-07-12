import Legal from './Legal';

const toc = [
  { id: 'what', label: 'What are cookies?' },
  { id: 'types', label: 'Types we use' },
  { id: 'table', label: 'Cookies in detail' },
  { id: 'control', label: 'How to control cookies' },
  { id: 'changes', label: 'Changes' },
];

const Cookies = () => (
  <Legal
    title="Cookie Policy"
    intro="This policy explains how Memories Properties uses cookies and similar technologies on its website, and the choices you have."
    toc={toc}
  >
    <section>
      <h2 id="what">1. What are cookies?</h2>
      <p>
        Cookies are small text files placed on your device by a website. They
        let the site remember your actions and preferences (such as login,
        language and saved searches) over a period of time.
      </p>
    </section>

    <section>
      <h2 id="types">2. Types of cookies we use</h2>
      <ul>
        <li><strong>Strictly necessary</strong> — required to operate the site (sign-in, security, load balancing). These cannot be disabled.</li>
        <li><strong>Functional</strong> — remember your preferences such as currency or saved filters.</li>
        <li><strong>Analytics</strong> — help us understand how the site is used so we can improve it. Set only with your consent.</li>
        <li><strong>Marketing</strong> — used to measure the effectiveness of campaigns. Set only with your consent.</li>
      </ul>
    </section>

    <section>
      <h2 id="table">3. Cookies in detail</h2>
      <div className="overflow-x-auto not-prose">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-border text-left text-foreground/70">
              <th className="py-2 pr-4 font-semibold">Name</th>
              <th className="py-2 pr-4 font-semibold">Purpose</th>
              <th className="py-2 pr-4 font-semibold">Type</th>
              <th className="py-2 font-semibold">Duration</th>
            </tr>
          </thead>
          <tbody className="text-foreground/80">
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">sb-access-token</td>
              <td className="py-2 pr-4">Authenticates your session</td>
              <td className="py-2 pr-4">Necessary</td>
              <td className="py-2">1 hour</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">sb-refresh-token</td>
              <td className="py-2 pr-4">Keeps you signed in securely</td>
              <td className="py-2 pr-4">Necessary</td>
              <td className="py-2">30 days</td>
            </tr>
            <tr className="border-b border-border/50">
              <td className="py-2 pr-4">memories_prefs</td>
              <td className="py-2 pr-4">Stores currency, filters and theme</td>
              <td className="py-2 pr-4">Functional</td>
              <td className="py-2">1 year</td>
            </tr>
            <tr>
              <td className="py-2 pr-4">_analytics</td>
              <td className="py-2 pr-4">Aggregated usage analytics</td>
              <td className="py-2 pr-4">Analytics (opt-in)</td>
              <td className="py-2">13 months</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 id="control">4. How to control cookies</h2>
      <ul>
        <li>You can accept or reject non-essential cookies via the consent banner shown on first visit.</li>
        <li>Most browsers let you delete cookies or block them by default — see your browser’s help pages.</li>
        <li>Blocking strictly-necessary cookies will break parts of the site (e.g. signing in).</li>
      </ul>
    </section>

    <section>
      <h2 id="changes">5. Changes</h2>
      <p>We update this policy when we add or remove cookies. Material changes will be reflected here.</p>
    </section>
  </Legal>
);

export default Cookies;
