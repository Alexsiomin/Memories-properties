import Legal from './Legal';

const toc = [
  { id: 'role', label: 'Our role' },
  { id: 'no-advice', label: 'No advice' },
  { id: 'accuracy', label: 'Accuracy of information' },
  { id: 'aml', label: 'AML & KYC' },
  { id: 'conflicts', label: 'Conflicts of interest' },
  { id: 'fees', label: 'Fees & commissions' },
  { id: 'forward', label: 'Forward-looking statements' },
  { id: 'contact', label: 'Contact' },
];

const Disclosure = () => (
  <Legal
    title="Disclosure"
    intro="This Disclosure sets out important information about Memories Properties’ services, the limitations of the materials on this website, and the regulatory context within which we operate."
    toc={toc}
  >
    <section>
      <h2 id="role">1. Our role</h2>
      <p>
        Memories Properties acts as a real-estate practice connecting buyers, tenants,
        sellers and landlords. We are not a bank, broker-dealer, investment
        firm, or licensed financial adviser.
      </p>
    </section>

    <section>
      <h2 id="no-advice">2. No legal, tax or investment advice</h2>
      <p>
        Information on this site — including yield indications, IRR estimates,
        zoning notes and tax references — is for general information only and
        does not constitute legal, tax, accounting or investment advice. Always
        seek independent advice from qualified professionals before making
        decisions.
      </p>
    </section>

    <section>
      <h2 id="accuracy">3. Accuracy of information</h2>
      <p>
        Property details (measurements, plans, photographs, permits, title
        deed status) are provided by the owner or sourced from public records
        and shared in good faith. Memories Properties makes no warranty of accuracy or
        completeness. Buyers and tenants must satisfy themselves through
        independent inspection and professional due diligence.
      </p>
    </section>

    <section>
      <h2 id="aml">4. Anti-money-laundering & KYC</h2>
      <p>
        In line with Cyprus Law 188(I)/2007 (as amended) and EU AML directives,
        we are required to verify the identity and source of funds of clients
        before completing certain transactions. Failure to provide requested
        information may prevent us from acting for you.
      </p>
    </section>

    <section>
      <h2 id="conflicts">5. Conflicts of interest</h2>
      <p>
        Where Memories Properties or any of its team has a direct or indirect interest in a
        listing — for example, ownership, joint-venture participation or a
        referral arrangement — we will disclose that interest in writing before
        you commit to any transaction.
      </p>
    </section>

    <section>
      <h2 id="fees">6. Fees & commissions</h2>
      <p>
        Our standard commission and any third-party fees (legal, valuation,
        surveys) are disclosed in our engagement letter before work begins. We
        do not accept undisclosed kickbacks.
      </p>
    </section>

    <section>
      <h2 id="forward">7. Forward-looking statements</h2>
      <p>
        Projections, IRR ranges, rental-yield estimates and market commentary
        are forward-looking and inherently uncertain. Past performance is not
        indicative of future results.
      </p>
    </section>

    <section>
      <h2 id="contact">8. Contact</h2>
      <p>For any disclosure-related question, contact <a href="mailto:memoriespropertiescyprus@gmail.com">memoriespropertiescyprus@gmail.com</a>.</p>
    </section>
  </Legal>
);

export default Disclosure;
