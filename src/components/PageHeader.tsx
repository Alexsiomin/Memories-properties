interface Props {
  eyebrow?: string;
  title: string;
  intro?: string;
}

const PageHeader = ({ eyebrow, title, intro }: Props) => {
  return (
    <section className="container mx-auto px-6 pt-4 pb-8 border-b border-foreground/15">
      {eyebrow && <p className="label text-accent reveal whitespace-nowrap text-[10px] tracking-normal min-[380px]:text-[11px] sm:text-sm sm:tracking-[0.08em]">{eyebrow}</p>}
      <h1
        className="font-montserrat font-extrabold tracking-tighter leading-[0.95] mt-2 reveal text-xl md:text-2xl text-center uppercase"
        data-reveal-delay="100"
      >
        {title}
      </h1>
      {intro && (
        <p
          className="mt-3 max-w-[60ch] mx-auto text-center uppercase text-muted-foreground text-lg md:text-xl leading-snug reveal font-bold"
          data-reveal-delay="220"
        >
          {intro}
        </p>
      )}
    </section>
  );
};

export default PageHeader;
