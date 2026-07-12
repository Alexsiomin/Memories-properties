import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import SEO from "@/components/SEO";
import ParticleText from "@/components/ParticleText";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background px-6 text-center">
      <SEO
        title="Page Not Found"
        description="The page you are looking for does not exist."
        noindex
      />

      <div className="mb-8 select-none">
        <ParticleText
          text="404"
          fontSize={155}
          density={4}
          dotSize={2}
          mouseRadius={60}
          force={35}
          color="hsl(222 24% 11%)"
          accentColor="hsl(222 89% 55%)"
          accentRanges={[[1, 2]]}
        />
      </div>

      <h1 className="text-2xl font-semibold text-foreground tracking-tight">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-base text-muted-foreground leading-relaxed">
        The page you are looking for may have been moved, deleted, or never existed. Check the URL or head back home.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="default" className="rounded-none">
          <Link to="/">
            <ArrowLeft size={16} className="mr-2" />
            Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-none">
          <Link to="/properties">Explore Properties</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
