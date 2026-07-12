import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import FAQSection from '@/components/FAQSection';
import { useFaqs } from '@/hooks/use-faqs';

const BUYER_FALLBACK = [
  {
    question: 'What is off-market real estate?',
    answer:
      'Off-market real estate refers to properties sold privately, never publicly listed on portals or with mainstream agents. Vendors choose this route for discretion, speed, and to control who views the asset. Memories sources these mandates exclusively for a private roster of investors and family offices.',
  },
  {
    question: 'How do I view a Memories property?',
    answer:
      'Viewings are arranged by private appointment only. Once you have registered your interest and passed our brief qualification process, an advisor will contact you to schedule a confidential viewing at a time that suits you.',
  },
  {
    question: 'What types of properties does Memories source?',
    answer:
      'We specialise in investment-grade real estate: prestige land, development opportunities, coastal and agricultural estates, and civic-adjacent commercial assets with durable rent rolls. Every mandate is chosen for its long-term optionality and capital preservation.',
  },
  {
    question: 'In which countries does Memories operate?',
    answer:
      'Memories is headquartered in Cyprus and maintains a focused presence across select Mediterranean and European markets. Our network is intentionally curated rather than geographically sprawling, ensuring deep local knowledge on every mandate.',
  },
  {
    question: 'Is there a minimum investment to work with Memories?',
    answer:
      'There is no fixed minimum. We work with a range of private investors and family offices, tailoring our approach to each client\'s objectives. Introductions are accepted on a case-by-case basis after a brief qualification conversation.',
  },
  {
    question: 'Why buy off-market instead of on the open market?',
    answer:
      'Off-market transactions offer privacy, reduced competition, and often better pricing. Buyers avoid public bidding wars, and vendors appreciate the discretion of a closed-door sale. Memories curates each opportunity so you see only assets aligned with your strategy.',
  },
  {
    question: 'Do I need to sign any agreement before viewing a property?',
    answer:
      'Yes. To protect both parties, we require a simple confidentiality agreement before disclosing sensitive property details or arranging viewings. This is standard practice in private real estate and ensures discretion throughout the process.',
  },
  {
    question: 'Can I get financing for an off-market purchase?',
    answer:
      'Absolutely. Memories works alongside private banks, family-office lenders, and specialist credit providers. We can introduce you to the right financing partner once we understand the asset and your capital structure.',
  },
  {
    question: 'Are the properties already vetted before they reach me?',
    answer:
      'Every mandate undergoes a rigorous due-diligence review — title, permits, rental history, and development potential. We only present assets that meet our internal investment criteria and that we would be comfortable recommending to our own partners.',
  },
  {
    question: 'How long does a typical off-market purchase take?',
    answer:
      'Because both parties are committed and there is no public marketing overhead, timelines are often shorter than conventional sales. A straightforward transaction can complete in 30–60 days, though complex assets may require longer structuring.',
  },
  {
    question: 'Can non-residents or international buyers purchase through Memories?',
    answer:
      'Yes. Many of our clients are international investors or second-home buyers. We guide you through local ownership structures, residency considerations, and tax implications relevant to each jurisdiction.',
  },
  {
    question: 'What fees does Memories charge buyers?',
    answer:
      'Memories operates on a success-fee or advisory-fee model depending on the mandate. All fee structures are disclosed transparently before any engagement. There are no hidden costs or subscription charges.',
  },
  {
    question: 'Can I buy land or development sites through Memories?',
    answer:
      'Yes. Land and development opportunities are a core part of our portfolio. We source sites with planning potential, strategic location, and strong demand fundamentals — often before they reach any public forum.',
  },
  {
    question: 'Will I receive updates on new properties automatically?',
    answer:
      'Registered and qualified buyers receive curated alerts when a new mandate matches their stated criteria. These alerts are private, detailed, and sent directly by your dedicated advisor — never via a public mailing list.',
  },
  {
    question: 'How is Memories different from a traditional estate agent?',
    answer:
      'We do not list publicly, hold open houses, or chase volume. Memories acts as a private market maker — connecting serious vendors with pre-qualified buyers through a relationship-led process built on trust, speed, and absolute discretion.',
  },
];

const SELLER_FALLBACK = [
  {
    question: 'How do I sell a property privately through Memories?',
    answer:
      'Mandates are accepted by introduction only. Begin by requesting a confidential valuation through our contact page. One of our advisors will assess the asset, discuss your objectives, and — if appropriate — prepare a bespoke private campaign.',
  },
  {
    question: 'Who will see my property details if I sell off-market?',
    answer:
      'Only pre-qualified, NDA-bound buyers in our private roster. Your asset is never advertised online, printed in brochures, or shared on social media. You control exactly who receives the information and when.',
  },
  {
    question: 'Is off-market selling faster than listing publicly?',
    answer:
      'Often, yes. Without marketing delays, open-house logistics, or chain-dependent buyers, off-market transactions tend to proceed more efficiently. Our buyers are serious, liquid, and ready to move quickly when the right asset appears.',
  },
  {
    question: 'Can I sell discreetly without neighbours or staff knowing?',
    answer:
      'Discretion is our core discipline. Viewings are by private appointment, communications are encrypted, and all parties sign confidentiality agreements. We have managed ultra-high-net-worth sales where even household staff remained unaware until completion.',
  },
  {
    question: 'Do you handle commercial as well as residential properties?',
    answer:
      'Yes. We transact across residential estates, commercial assets, hospitality venues, agricultural land, and mixed-use developments. If the asset is investment-grade and the vendor values privacy, it fits our model.',
  },
  {
    question: 'What if I need to sell multiple properties at once?',
    answer:
      'We regularly manage portfolio disposals for family offices, funds, and private individuals. Your advisor will design a tailored campaign — sequential, parallel, or structured — to maximise value while preserving confidentiality.',
  },
  {
    question: 'Will I receive regular updates during the sales process?',
    answer:
      'Yes. Your dedicated advisor provides structured updates at every stage: buyer interest, viewing feedback, offers received, and legal progress. You are never left guessing where your sale stands.',
  },
  {
    question: 'Can I remain anonymous throughout the transaction?',
    answer:
      'In many jurisdictions, yes. We can structure ownership disclosures through trusts, SPVs, or legal representatives so your personal name does not appear in public records. Our legal partners advise on the best structure for your situation.',
  },
  {
    question: 'What kind of price can I expect off-market?',
    answer:
      'Off-market prices reflect the asset\'s intrinsic value rather than auction hype or portal visibility. Serious buyers pay fair market value — sometimes a premium — for the privilege of early, exclusive access. We benchmark every mandate against comparable transactions.',
  },
  {
    question: 'Does Memories help with legal and tax structuring?',
    answer:
      'We do not provide legal or tax advice directly, but we maintain relationships with leading private-client lawyers, tax advisers, and notaries across every jurisdiction we operate in. We will introduce you to the right professionals for your transaction.',
  },
  {
    question: 'Can I change my mind and list publicly later?',
    answer:
      'Your mandate terms are agreed upfront and are binding for the exclusivity period. However, if circumstances change, we will work with you to adjust the strategy — always with your long-term reputation and objectives in mind.',
  },
  {
    question: 'How do you qualify buyers before they view my property?',
    answer:
      'Every prospective buyer is identity-verified, financially qualified, and bound by a confidentiality agreement. We also assess their acquisition history and strategic fit to ensure they are a genuine, capable counterparty.',
  },
  {
    question: 'What documents do I need to prepare before engaging Memories?',
    answer:
      'Typically: proof of ownership, title deeds, recent valuation or survey, and any relevant permits or rental agreements. Your advisor will provide a tailored checklist during the initial consultation.',
  },
  {
    question: 'Can Memories handle sales in jurisdictions outside Cyprus?',
    answer:
      'Yes. While we are headquartered in Cyprus, our network covers select Mediterranean and European markets. We partner with local experts to ensure compliance, cultural fluency, and seamless execution in every jurisdiction.',
  },
  {
    question: 'Is there a fee if my property does not sell?',
    answer:
      'Our fee structures are success-based in most cases. Specific terms are discussed and agreed before any campaign begins, so you know exactly where you stand — with no surprise invoices if a sale does not proceed.',
  },
];

const CommonQuestions = () => {
  const { items: buyerItems, loading: buyerLoading } = useFaqs('buyers', BUYER_FALLBACK);
  const { items: sellerItems, loading: sellerLoading } = useFaqs('sellers', SELLER_FALLBACK);

  return (
    <>
      <SEO
        title="Common Questions — Memories"
        description="Answers to frequently asked questions about off-market real estate, private viewings, property types, and working with Memories."
      />
      <PageHeader
        title="Common Questions"
      />
      {buyerLoading || sellerLoading ? (
        <div className="py-16 text-center text-muted-foreground">Loading questions…</div>
      ) : (
        <>
          <div id="buyers">
            <FAQSection
              title="For Buyers"
              items={buyerItems}
              withJsonLd={true}
            />
          </div>
          <div id="sellers">
            <FAQSection
              title="For Sellers"
              items={sellerItems}
              withJsonLd={false}
            />
          </div>
        </>
      )}
    </>
  );
};

export default CommonQuestions;
