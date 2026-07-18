'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { useUIStore } from '@/stores/ui.store';
import { useAuthStore } from '@/stores/auth.store';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getAuthenticatedClient, gql } from '@/lib/graphql-client';

const UPDATE_USER_LOCALE_MUTATION = gql`
  mutation UpdateUserLocale($locale: String!) {
    updateUserLocale(locale: $locale)
  }
`;

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ReactNode;
  badge?: number;
  roles?: string[];
}

const Icon = ({ path, ...p }: { path: string; width?: number; height?: number }) => (
  <svg
    width={p.width ?? 18}
    height={p.height ?? 18}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={path} />
  </svg>
);

function NavLink({
  item,
  locale,
  collapsed,
}: {
  item: NavItem & { label: string };
  locale: string;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname.includes(item.href);
  return (
    <Link
      href={`/${locale}${item.href}`}
      className={`nav-item ${isActive ? 'active' : ''}`}
      title={collapsed ? item.label : undefined}
    >
      <span className="nav-item-icon">{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
      {!collapsed && item.badge && item.badge > 0 && (
        <span
          style={{
            marginLeft: 'auto',
            background: '#EF4444',
            color: 'white',
            borderRadius: 99,
            padding: '1px 6px',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const t = useTranslations('nav');
  const { isSidebarCollapsed, toggleSidebar } = useUIStore();
  const { user, clearAuth } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = (params.locale as string) || 'en';

  const handleLanguageToggle = async () => {
    const nextLocale = locale === 'en' ? 'bn' : 'en';

    if (user) {
      try {
        const client = getAuthenticatedClient();
        await client.request(UPDATE_USER_LOCALE_MUTATION, { locale: nextLocale });
      } catch (err) {
        console.error('Failed to persist language preference:', err);
      }
    }

    const segments = pathname.split('/');
    segments[1] = nextLocale;
    const newPath = segments.join('/');
    router.push(newPath);
  };

  const navGroups = [
    {
      label: 'Clinical',
      items: [
        {
          href: '/dashboard',
          labelKey: 'dashboard',
          icon: (
            <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          ),
        },
        {
          href: '/patients',
          labelKey: 'patients',
          icon: (
            <Icon path="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100 8 4 4 0 000-8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
          ),
        },
        {
          href: '/appointments',
          labelKey: 'appointments',
          icon: (
            <Icon path="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          ),
        },
        {
          href: '/emr',
          labelKey: 'emr',
          icon: (
            <Icon path="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          ),
        },
        {
          href: '/laboratory',
          labelKey: 'laboratory',
          icon: (
            <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          ),
        },
        {
          href: '/radiology',
          labelKey: 'radiology',
          icon: (
            <Icon path="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v11m0 0a4 4 0 004 4h2a4 4 0 004-4V9M9 14H5a2 2 0 00-2 2v4a2 2 0 002 2h4" />
          ),
        },
        {
          href: '/pharmacy',
          labelKey: 'pharmacy',
          icon: (
            <Icon path="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
          ),
        },
      ],
    },
    {
      label: 'Finance',
      items: [
        {
          href: '/billing',
          labelKey: 'billing',
          icon: (
            <Icon path="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
          ),
        },
      ],
    },
    {
      label: 'IPD',
      items: [
        {
          href: '/ipd',
          labelKey: 'ipd',
          icon: (
            <Icon path="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          ),
        },
      ],
    },
    {
      label: 'Operations',
      items: [
        {
          href: '/hrm',
          labelKey: 'hrm',
          icon: <Icon path="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
        },
        {
          href: '/inventory',
          labelKey: 'inventory',
          icon: <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />,
        },
        {
          href: '/blood-bank',
          labelKey: 'bloodBank',
          icon: (
            <Icon path="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          ),
        },
        {
          href: '/crm',
          labelKey: 'crm',
          icon: (
            <Icon path="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          ),
        },
      ],
    },
    {
      label: 'Admin',
      items: [
        {
          href: '/reports',
          labelKey: 'reports',
          icon: (
            <Icon path="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          ),
        },
        {
          href: '/audit',
          labelKey: 'audit',
          icon: (
            <Icon path="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          ),
        },
        {
          href: '/settings',
          labelKey: 'settings',
          icon: (
            <Icon path="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          ),
        },
      ],
    },
  ];

  const handleLogout = () => {
    clearAuth();
    router.push(`/${locale}/login`);
  };

  return (
    <div className="app-shell">
      {/* Sidebar */}
      <aside className={`app-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg,#3366CC,#5B8DEF)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: 'white',
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            A
          </div>
          {!isSidebarCollapsed && <span className="sidebar-logo-text">Aurevix</span>}
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              {!isSidebarCollapsed && <div className="nav-group-label">{group.label}</div>}
              {group.items.map((item) => (
                <NavLink
                  key={item.href}
                  item={{ ...item, label: t(item.labelKey as any) }}
                  locale={locale}
                  collapsed={isSidebarCollapsed}
                />
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        {!isSidebarCollapsed && user && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: '#3366CC',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'white',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.firstName} {user.lastName}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(255,255,255,0.5)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Logout"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)',
                  padding: 4,
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className={`app-main ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Topbar */}
        <header className="app-topbar">
          <button
            onClick={toggleSidebar}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 6,
              color: 'var(--text-secondary)',
            }}
            aria-label="Toggle sidebar"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div style={{ flex: 1 }} />

          {/* Language Toggle */}
          <button
            onClick={handleLanguageToggle}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 12,
              cursor: 'pointer',
              marginRight: 8,
              color: 'var(--text-secondary)',
            }}
          >
            {locale === 'en' ? 'বাংলা' : 'English'}
          </button>

          {/* Notification Bell */}
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              position: 'relative',
              color: 'var(--text-secondary)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <span
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                width: 8,
                height: 8,
                background: '#EF4444',
                borderRadius: '50%',
                border: '2px solid white',
              }}
            />
          </button>
        </header>

        {/* Content */}
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
