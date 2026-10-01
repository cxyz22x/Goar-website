import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Home from '@/site/Home';
import Legal from '@/site/Legal';
import Contact from '@/site/Contact';
import AgentWorkspace from '@/agent/AgentWorkspace';
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
  const destination = new URL(`${import.meta.env.BASE_URL}media/index.html`, window.location.origin);
  destination.search = window.location.search;
  destination.searchParams.set('view', view);
  useEffect(() => { window.location.replace(destination.href); }, [destination.href]);
  return <p role="status">Opening media… <a href={destination.href}>Continue</a></p>;
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
        <Route path="/agent" component={AgentWorkspace} />
        {['watch', 'movies', 'tv', 'anime', 'kids', 'live', 'hubs', 'list', 'music', 'games', 'media'].flatMap(view =>
          [`/${view}`, `/${view}/`, `/${view}/index.html`].map(path => (
            <Route key={path} path={path}><OpenMedia view={view === 'media' ? 'home' : view} /></Route>
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
