const RouteLoader = ({ minHeight = 'min-h-[70vh]' }: { minHeight?: string }) => (
  <div
    className={`${minHeight} w-full flex items-center justify-center bg-[#00101f]`}
    role="status"
    aria-label="Loading"
  >
    <div className="flex flex-col items-center gap-6 animate-fade-in">
      <div className="relative">
        <span
          className="text-4xl sm:text-5xl uppercase tracking-tight text-background"
          style={{ fontFamily: 'Montserrat, ui-sans-serif, system-ui, sans-serif', fontWeight: 800 }}
        >
          MEMORIES
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -inset-x-4 bg-gradient-to-r from-transparent via-[#00101f] to-transparent animate-[ticker_2.4s_linear_infinite]"
          style={{ backgroundSize: '50% 100%', backgroundRepeat: 'no-repeat' }}
        />
      </div>
      <span className="relative block h-px w-24 overflow-hidden bg-background/10">
        <span className="absolute inset-y-0 left-0 w-1/3 bg-accent animate-[ticker_1.6s_cubic-bezier(0.4,0,0.2,1)_infinite]" />
      </span>
      <span className="font-mono uppercase tracking-[0.2em] text-[10px] text-background/60">
        Loading
      </span>
    </div>
  </div>
);

export default RouteLoader;
