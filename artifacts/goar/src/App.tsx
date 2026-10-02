import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/site/Home';
import Legal from '@/site/Legal';
import Contact from '@/site/Contact';
import { usePageMetadata } from '@/site/usePageMetadata';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
  Redirect,
} from 'wouter';

const queryClient = new QueryClient();

/** Static media documents need a real navigation, not a SPA-only URL change. */
function OpenMedia({ view }: { view: string }) {
  const BASE = import.meta.env.BASE_URL;
  const watchTabs = new Set(['movie', 'tv', 'kids', 'anime', 'music', 'live', 'list', 'hubs']);
  const page = view === 'home' || view === 'media' ? 'home'
    : view === 'games' ? 'games'
      : view === 'music' ? 'music'
        : view === 'live' ? 'live'
          : view === 'anime' ? 'anime' : 'watch';
  const destination = new URL(`${BASE}pages/${page}/index.html`, window.location.origin);
  const query = new URLSearchParams(window.location.search);
  query.delete('view');
  query.delete('v');
  if (page === 'watch') {
    const tab = view === 'tv' ? 'tv' : view === 'kids' ? 'kids' : view === 'hubs' ? 'hubs' : view === 'list' ? 'list' : 'movie';
    const requestedTab = query.get('tab');
    query.set('tab', requestedTab && watchTabs.has(requestedTab) ? requestedTab : tab);
  }
  destination.search = query.toString();
  useEffect(() => { window.location.replace(destination.href); }, [destination.href]);
  return <p role="status">Opening media… <a href={destination.href}>Continue</a></p>;
}

function OpenStandaloneAgent() {
  const destination = `${import.meta.env.BASE_URL}workspace/index.html`;
  useEffect(() => { window.location.replace(destination); }, [destination]);
  return <p role="status">Opening the standalone browser agent… <a href={destination}>Continue</a></p>;
}

function Router() {
  usePageMetadata();
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/index.html" component={Home} />
        {['/launch', '/launch.html', '/agent.html'].map(path => (
          <Route key={path} path={path}><Redirect to="/agent" replace /></Route>
        ))}
        {['/connections', '/connections.html'].map(path => (
          <Route key={path} path={path}><Redirect to="/" replace /></Route>
        ))}
        <Route path="/agent" component={OpenStandaloneAgent} />
        {['watch', 'movies', 'tv', 'anime', 'kids', 'live', 'hubs', 'list', 'music', 'games', 'media'].flatMap(view =>
          [`/${view}`, `/${view}/`, `/${view}/index.html`].map(path => (
            <Route key={path} path={path}><OpenMedia view={view === 'media' ? 'home' : view === 'movies' ? 'movie' : view} /></Route>
          ))
        )}
        {['privacy', 'terms', 'license', 'data-safety'].map((k) => (
          <Route key={k} path={`/${k}.html`}>{() => <Legal slug={k} />}</Route>
        ))}
        {['privacy', 'terms', 'license', 'data-safety', 'contact'].map(k => (
          <Route key={k} path={`/${k}`}><Redirect to={`/${k}.html`} replace /></Route>
        ))}
        <Route path="/contact.html" component={Contact} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
