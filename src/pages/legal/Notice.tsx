import { Link } from 'react-router-dom';
import Legal from './Legal';

const toc = [
  { id: 'disclaimer', label: 'Disclaimer' },
  { id: 'aml', label: 'Anti-money laundering' },
  
  { id: 'regulator', label: 'Regulator & licensing' },
  { id: 'professional', label: 'Professional indemnity' },
  { id: 'jurisdiction', label: 'Governing law & jurisdiction' },
  { id: 'liability', label: 'Limitation of liability' },
  { id: 'ip', label: 'Intellectual property' },
  { id: 'complaints', label: 'Complaints' },
  { id: 'contact', label: 'Contact' },
];

const Notice = () => (
  <Legal
    title="AML Obligations"
    intro="This page sets out the legal information required by Cyprus and EU law for businesses operating online, including company identification, regulatory status, and the terms governing use of this website."
    toc={toc}
  >
    <section>
      <h2 id="disclaimer">1. Disclaimer</h2>
      <p>
        We make no representation or warranty as to the accuracy, reliability or
        completeness of the information relating to the property. Some
        information has been obtained from third parties and has not been
        independently verified. Accordingly, no warranty, representation or
        undertaking, whether express or implied, is made and no responsibility
        is accepted by us as to the accuracy of any part of this, or any
        further information supplied by or on our behalf, whether orally or in
        writing.
      </p>
      <p>
        No entity or person guarantees the performance of the property. The
        information is general information only and any examples given are for
        illustrative purposes. The information does not take into account your
        individual objectives, financial situation or needs. We recommend that
        you obtain financial, legal and taxation advice before making any
        decision. Any price is not a valuation and should not be relied on or
        treated as such. Prices, if indicated, have been estimated based on
        recent market evidence in the locality for comparable properties, to
        the extent available. Prices may not include VAT.
      </p>
    </section>

    <section>
      <h2 id="aml">2. Anti-money laundering</h2>

      <h3>Customer identification and anti-money laundering requirements</h3>
      <p>
        Memories Properties is a regulated obliged entity under EU Directive (EU) 2015/849
        (as amended) and Cyprus Law 188(I)/2007 on the Prevention and Suppression of
        Money Laundering and Terrorist Financing, as amended from time to time
        (together, the “AML/CTF Law”).
      </p>
      <p>
        As part of these obligations, Memories Properties may be required to carry out
        customer due diligence (CDD) before providing certain designated services in
        connection with real-estate transactions. This means we may need to collect and
        verify information about our clients, and in some cases about entities and
        individuals connected with a transaction.
      </p>

      <h3>Why we collect this information</h3>
      <p>The purpose of CDD is to:</p>
      <ul>
        <li>verify the identity of our clients;</li>
        <li>understand who we are dealing with;</li>
        <li>assess the risk of property transactions being misused for money laundering, terrorism financing, proliferation financing or other serious financial crime.</li>
      </ul>
      <p>
        These obligations may apply where Memories Properties is providing a designated
        service in relation to a real-estate transaction, including for vendors
        (sellers), purchasers (buyers) and entities acting on their behalf. We appreciate
        your cooperation in helping us meet our legal obligations and support the
        integrity of the Cyprus property market.
      </p>

      <h3>Information we may request</h3>
      <p>When you engage with Memories Properties, we will request information such as:</p>
      <ul>
        <li>your full name;</li>
        <li>date of birth;</li>
        <li>residential address;</li>
        <li>nationality and country of tax residence;</li>
        <li>contact telephone number and email address.</li>
      </ul>
      <p>To verify these details, you may be asked to provide:</p>
      <ul>
        <li>acceptable photo identification (such as a current passport, national identity card or driver’s licence);</li>
        <li>a document showing your residential address (for example, a recent utility bill, bank statement or official government correspondence).</li>
      </ul>

      <h3>Companies, trusts and other entities</h3>
      <p>
        Where a transaction involves a company, trust, partnership, foundation, self-managed
        fund or other legal entity, we may also need to collect information about the entity,
        its ownership and control, and the individuals associated with it, including:
      </p>
      <ul>
        <li>directors;</li>
        <li>shareholders or unit holders;</li>
        <li>trustees;</li>
        <li>beneficiaries;</li>
        <li>settlor or protector (for trusts);</li>
        <li>authorised signatories.</li>
      </ul>
      <p>
        Depending on the type of entity and the circumstances, we may also need information
        about beneficial owners or other individuals who own or control the entity, together
        with supporting documentation such as certificates of incorporation, registers of
        directors/shareholders, trust deeds or partnership agreements.
      </p>

      <h3>Privacy and use of personal information</h3>
      <p>
        Memories Properties is committed to protecting your personal information and handling
        it in accordance with the General Data Protection Regulation (EU) 2016/679
        (“GDPR”) and the Cyprus Data Protection Law 125(I)/2018.
      </p>
      <p>
        Any personal information collected as part of our AML/CTF and CDD obligations is
        used solely for the purpose of complying with applicable laws, including the
        Cyprus AML/CTF Law. We take reasonable steps to ensure that personal information
        is held securely and is only accessed or disclosed where permitted or required by
        law. Further information is available in our{' '}
        <Link to="/privacy">Privacy Policy</Link>.
      </p>

      <h3>For vendors (sellers)</h3>
      <p>
        Before Memories Properties provides certain designated services in relation to the
        sale of a property, we may be required to verify the identity of the vendor and,
        where applicable, identify the beneficial ownership and control of any entity
        involved. This helps reduce the risk of property assets being used to conceal,
        transfer or facilitate the movement of illicit funds.
      </p>

      <h3>For purchasers (buyers)</h3>
      <p>
        Before Memories Properties provides certain designated services in relation to a
        purchase transaction, we may be required to verify the identity of the purchaser
        and, where applicable, confirm the ownership and control of any company, trust or
        other entity involved. Your cooperation helps us meet our legal obligations and
        comply with Cypriot and EU law.
      </p>

      <h3>Source of funds and wealth</h3>
      <p>
        In higher-risk transactions, we may ask for evidence of the source of funds and,
        where appropriate, the source of wealth. This may include bank statements, sale
        contracts, business accounts, inheritance documents or other records demonstrating
        the legitimate origin of the funds used in the transaction.
      </p>

      <h3>Sanctions and politically exposed persons</h3>
      <p>
        We screen clients and connected persons against international sanctions lists and
        politically exposed persons (PEP) databases. Enhanced due diligence applies to
        PEPs and higher-risk jurisdictions.
      </p>

      <h3>When services can commence</h3>
      <p>
        Under the AML/CTF Law, Memories Properties may be unable to commence certain
        designated services until the required customer due diligence has been completed.
        This requirement may apply to vendors, purchasers and entities acting on their
        behalf where Memories Properties is providing a designated service.
      </p>
      <p>Depending on the circumstances, this may include designated services connected with:</p>
      <ul>
        <li>listing a property for sale;</li>
        <li>marketing a property;</li>
        <li>facilitating a sale or purchase transaction;</li>
        <li>providing certain real-estate services.</li>
      </ul>
      <p>To avoid delays, we encourage clients to provide the requested identification documents as early as possible.</p>

      <h3>Suspicious activity reporting and record keeping</h3>
      <p>
        We may decline to act, suspend a transaction or terminate a relationship where
        required information is not provided or where we identify suspicion of unlawful
        conduct. Suspicious activity is reported to MOKAS, the Cyprus Financial
        Intelligence Unit, in accordance with our statutory obligations. Records are
        retained for the periods required by the AML/CTF Law.
      </p>

      <h3>Thank you</h3>
      <p>
        We appreciate your understanding and cooperation as we implement these important
        compliance requirements. If you have any questions about the identification
        process or Memories Properties’ obligations under the AML/CTF Law, please speak
        with your Memories Properties representative or{' '}
        <Link to="/contact">contact us</Link>.
      </p>
    </section>


    <section>
      <h2 id="regulator">4. Regulator & licensing</h2>
      <p>
        Memories Properties operates as a licensed real-estate practice under the supervision
        of the Cyprus Registration Council of Estate Agents. All transactions
        are conducted in accordance with Law 71(I)/2010 on the Regulation of
        Real Estate Agents and the related Code of Conduct.
      </p>
    </section>

    <section>
      <h2 id="professional">5. Professional indemnity</h2>
      <p>
        We maintain professional indemnity insurance with a reputable EU
        insurer. Details of the cover and the insurer are available on
        written request.
      </p>
    </section>

    <section>
      <h2 id="jurisdiction">6. Governing law & jurisdiction</h2>
      <p>
        Use of this website and any agreement formed through it is governed by
        the laws of the Republic of Cyprus. The courts of Limassol have
        exclusive jurisdiction, without prejudice to mandatory consumer
        protections in the user’s country of residence.
      </p>
    </section>

    <section>
      <h2 id="liability">7. Limitation of liability</h2>
      <p>
        Information on this website — including listings, prices, indicative
        yields and editorial content — is provided in good faith for general
        information only and does not constitute a contractual offer or
        professional advice. Particulars must be independently verified.
      </p>
      <p>
        To the extent permitted by law, Memories Properties excludes liability for any
        indirect or consequential loss arising from use of, or reliance on,
        the website.
      </p>
    </section>

    <section>
      <h2 id="ip">8. Intellectual property</h2>
      <p>
        All trademarks, logos, photography, copy and source code on this site
        are the property of Memories Properties or used under licence. No part may be
        reproduced, distributed or used for commercial purposes without prior
        written consent.
      </p>
    </section>

    <section>
      <h2 id="complaints">9. Complaints</h2>
      <p>
        If you wish to raise a complaint, please write to{' '}
        <a href="mailto:memoriespropertiescyprus@gmail.com">memoriespropertiescyprus@gmail.com</a>. We
        acknowledge complaints within 5 working days and aim to resolve them
        within 30 days. Unresolved disputes may be referred to the EU{' '}
        <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer">
          Online Dispute Resolution platform
        </a>.
      </p>
    </section>

    <section>
      <h2 id="contact">10. Contact</h2>
      <p>
        For any legal or regulatory enquiry, please contact{' '}
        <a href="/contact">us</a>.
      </p>
    </section>
  </Legal>
);

export default Notice;
