import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Layout from "./components/Layout";
import { LanguageProvider } from "@/hooks/use-language";
import Index from "./pages/Index";
import CookieConsent from "./components/CookieConsent";
import RouteLoader from "./components/RouteLoader";
import AntiScrape from "./components/AntiScrape";
import AuthSessionBridge from "./components/AuthSessionBridge";


// Lazy-loaded routes — split into separate chunks so the landing page ships less JS.
const Properties = lazy(() => import("./pages/Properties"));
const PropertyDetail = lazy(() => import("./pages/PropertyDetail"));
const RegionPage = lazy(() => import("./pages/RegionPage"));
const LocationsIndex = lazy(() => import("./pages/LocationsIndex"));
const LocationPage = lazy(() => import("./pages/LocationPage"));
const PropertySearch = lazy(() => import("./pages/PropertySearch"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const Contact = lazy(() => import("./pages/Contact"));
const Auth = lazy(() => import("./pages/Auth"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Account = lazy(() => import("./pages/Account"));
const Welcome = lazy(() => import("./pages/Welcome"));
const LettingsSearch = lazy(() => import("./pages/LettingsSearch"));
const BuyingSearch = lazy(() => import("./pages/BuyingSearch"));
const Developments = lazy(() => import("./pages/Developments"));
const DevelopmentDetail = lazy(() => import("./pages/DevelopmentDetail"));
const SoldProjects = lazy(() => import("./pages/SoldProjects"));
const SoldProperties = lazy(() => import("./pages/SoldProperties"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/legal/Privacy"));
const LegalNotice = lazy(() => import("./pages/legal/Notice"));
const Terms = lazy(() => import("./pages/legal/Terms"));
const Cookies = lazy(() => import("./pages/legal/Cookies"));
const Disclosure = lazy(() => import("./pages/legal/Disclosure"));
const SiteMap = lazy(() => import("./pages/legal/SiteMap"));
const Insights = lazy(() => import("./pages/Insights"));
const InsightsLimassol = lazy(() => import("./pages/InsightsLimassol"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogCategory = lazy(() => import("./pages/BlogCategory"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const CommonQuestions = lazy(() => import("./pages/CommonQuestions"));
const ProjectBuyerFAQs = lazy(() => import("./pages/ProjectBuyerFAQs"));
const ProjectExpertise = lazy(() => import("./pages/ProjectExpertise"));
const TransferFeesCalculator = lazy(() => import("./pages/TransferFeesCalculator"));
const SellingExpensesCalculator = lazy(() => import("./pages/SellingExpensesCalculator"));
const GuideOffMarketInvesting = lazy(() => import("./pages/guides/OffMarketInvesting"));
const Advisory = lazy(() => import("./pages/Advisory"));
const SellWithUs = lazy(() => import("./pages/SellWithUs"));
const OurExpertise = lazy(() => import("./pages/OurExpertise"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminProperties = lazy(() => import("./pages/AdminProperties"));
const AdminPropertyNew = lazy(() => import("./pages/AdminPropertyNew"));
const AdminProjectNew = lazy(() => import("./pages/AdminProjectNew"));
const AdminProjectEdit = lazy(() => import("./pages/AdminProjectEdit"));
const AdminSoldProperties = lazy(() => import("./pages/AdminSoldProperties"));
const AdminClients = lazy(() => import("./pages/AdminClients"));
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminUsersList = lazy(() => import("./pages/AdminUsersList"));
const AdminFaqs = lazy(() => import("./pages/AdminFaqs"));
const AdminBrandWords = lazy(() => import("./pages/AdminBrandWords"));
const AdminInsights = lazy(() => import("./pages/AdminInsights"));
const AdminDevelopers = lazy(() => import("./pages/AdminDevelopers"));
const AdminEmails = lazy(() => import("./pages/AdminEmails"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));
const AdminEmailTemplates = lazy(() => import("./pages/AdminEmailTemplates"));
const AdminAssistant = lazy(() => import("./pages/AdminAssistant"));
const AdminSeo = lazy(() => import("./pages/AdminSeo"));
const AdminAuthModal = lazy(() => import("./pages/AdminAuthModal"));
const AdminBlog = lazy(() => import("./pages/AdminBlog"));
import AdminLayout from "./components/AdminLayout";

const queryClient = new QueryClient();

const RouteFallback = () => <RouteLoader />;

// The full route tree with paths RELATIVE to the language prefix, so it can be
// mounted at both "/" (English) and "/ru" (Russian) via descendant routes.
const LocalizedRoutes = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route index element={<Index />} />
      <Route path="properties" element={<Properties />} />
      <Route path="properties/region/:region" element={<RegionPage />} />
      <Route path="locations" element={<LocationsIndex />} />
      <Route path="locations/:slug" element={<LocationPage />} />
      <Route path="property-search/:slug" element={<PropertySearch />} />
      <Route path="properties/:id" element={<PropertyDetail />} />
      <Route path="developments" element={<Developments />} />
      <Route path="developments/:slug" element={<DevelopmentDetail />} />
      <Route path="sold-projects" element={<SoldProjects />} />
      <Route path="sold-properties" element={<SoldProperties />} />
      <Route path="about" element={<AboutPage />} />
      <Route path="contact" element={<Contact />} />
      <Route path="account" element={<Account />} />
      <Route path="reset-password" element={<ResetPassword />} />
      <Route path="welcome" element={<Welcome />} />
      <Route path="account/lettings-search" element={<LettingsSearch />} />
      <Route path="account/buying-search" element={<BuyingSearch />} />
      <Route path="privacy" element={<Privacy />} />
      <Route path="legal-notice" element={<LegalNotice />} />
      <Route path="terms" element={<Terms />} />
      <Route path="cookies" element={<Cookies />} />
      <Route path="disclosure" element={<Disclosure />} />
      <Route path="sitemap" element={<SiteMap />} />
      <Route path="insights" element={<Insights />} />
      <Route path="insights/limassol" element={<InsightsLimassol />} />
      <Route path="blog" element={<Blog />} />
      <Route path="blog/category/:slug" element={<BlogCategory />} />
      <Route path="blog/:slug" element={<BlogPost />} />
      <Route path="common-questions" element={<CommonQuestions />} />
      <Route path="project-buyer-faqs" element={<ProjectBuyerFAQs />} />
      <Route path="project-expertise" element={<ProjectExpertise />} />
      <Route path="projects-faqs" element={<ProjectBuyerFAQs />} />
      <Route path="transfer-fees-calculator" element={<TransferFeesCalculator />} />
      <Route path="selling-expenses-calculator" element={<SellingExpensesCalculator />} />
      <Route path="guides/off-market-investing" element={<GuideOffMarketInvesting />} />
      <Route path="sell" element={<SellWithUs />} />
      <Route path="advisory" element={<Advisory />} />
      <Route path="our-expertise" element={<OurExpertise />} />
      <Route element={<AdminLayout />}>
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/properties" element={<AdminProperties />} />
        <Route path="admin/properties/new" element={<AdminPropertyNew />} />
        <Route path="admin/properties/:id/edit" element={<AdminPropertyNew />} />
        <Route path="admin/projects/new" element={<AdminProjectNew />} />
        <Route path="admin/projects/edit" element={<AdminProjectEdit />} />
        <Route path="admin/sold" element={<AdminSoldProperties />} />
        <Route path="admin/users" element={<AdminUsers />} />
        <Route path="admin/users-list" element={<AdminUsersList />} />
        <Route path="admin/faqs" element={<AdminFaqs />} />
        <Route path="admin/brand-words" element={<AdminBrandWords />} />
        <Route path="admin/insights" element={<AdminInsights />} />
        <Route path="admin/developers" element={<AdminDevelopers />} />
        <Route path="admin/emails" element={<AdminEmails />} />
        <Route path="admin/analytics" element={<AdminAnalytics />} />
        <Route path="admin/emails/templates" element={<AdminEmailTemplates />} />
        <Route path="admin/clients" element={<AdminClients />} />
        <Route path="admin/assistant" element={<AdminAssistant />} />
        <Route path="admin/seo" element={<AdminSeo />} />
        <Route path="admin/auth-modal" element={<AdminAuthModal />} />
        <Route path="admin/blog" element={<AdminBlog />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <LanguageProvider>
          <AuthSessionBridge />
          <AntiScrape />
          <CookieConsent />
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route path="/auth/callback" element={<AuthCallback />} />
              {/* Alias: Google's registered redirect URIs for this OAuth
                  client use the "~oauth/callback" path pattern (set up when
                  this project was hosted directly through Lovable). Handle
                  it with the same logic so sign-in completes correctly on
                  this custom Vercel domain too. */}
              <Route path="/~oauth/callback" element={<AuthCallback />} />
              <Route path="/auth" element={<Auth />} />
              {/* Localized languages (/ru, /el, /de) and default (English) share
                  the same tree via descendant routes, so each /xx/* URL is a
                  real, indexable page. */}
              <Route path="/ru/*" element={<LocalizedRoutes />} />
              <Route path="/el/*" element={<LocalizedRoutes />} />
              <Route path="/de/*" element={<LocalizedRoutes />} />
              <Route path="/*" element={<LocalizedRoutes />} />
            </Routes>
          </Suspense>
          </LanguageProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
