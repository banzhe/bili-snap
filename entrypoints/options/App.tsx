import { A, HashRouter, Route, type RouteSectionProps } from '@solidjs/router';
import ScrollText from 'lucide-solid/icons/scroll-text';
import Settings from 'lucide-solid/icons/settings';
import type { Component, JSX } from 'solid-js';
import LogsPage from './pages/LogsPage';
import SettingsPage from './pages/SettingsPage';

function NavLink(props: { href: string; end?: boolean; icon: Component<{ class?: string }>; children: JSX.Element }) {
  return (
    <A
      href={props.href}
      end={props.end}
      class="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
      activeClass="bg-accent text-accent-foreground"
    >
      <props.icon class="size-4" />
      {props.children}
    </A>
  );
}

function Layout(props: RouteSectionProps) {
  return (
    <div class="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-4 py-8 sm:flex-row sm:gap-10">
      <aside class="shrink-0 sm:w-48">
        <div class="mb-4 px-3">
          <h1 class="text-lg font-semibold">bili-snap</h1>
          <p class="text-xs text-muted-foreground">B 站无弹幕截帧</p>
        </div>
        <nav class="flex gap-1 sm:flex-col">
          <NavLink href="/" end icon={Settings}>
            配置
          </NavLink>
          <NavLink href="/logs" icon={ScrollText}>
            保存日志
          </NavLink>
        </nav>
      </aside>
      <main class="min-w-0 flex-1">{props.children}</main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter root={Layout}>
      <Route path="/" component={SettingsPage} />
      <Route path="/logs" component={LogsPage} />
    </HashRouter>
  );
}
