import React, { memo, useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import { useStoreState } from 'easy-peasy';
import { ApplicationStore } from '@/state';
import Can from '@/components/elements/Can';
import isEqual from 'react-fast-compare';
import { NavLink, useRouteMatch, useLocation } from 'react-router-dom';
import classNames from 'classnames';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { capitalize } from '@/lib/strings';
import Avatar from '@/components/Avatar';
import http from '@/api/http';
import routes from '@/routers/routes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faDesktop,
    faFolder,
    faDatabase,
    faClock,
    faUsers,
    faSave,
    faNetworkWired,
    faRocket,
    faCog,
    faChartBar,
    faHome,
    faUser,
    faFile,
    faTerminal
} from '@fortawesome/free-solid-svg-icons';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

interface OctopusServerLayoutProps {
    children: React.ReactNode;
}

const OctopusServerLayout = ({ children }: OctopusServerLayoutProps) => {
    const match = useRouteMatch<{ id: string }>();
    const location = useLocation();
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Server state
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);
    const serverId = ServerContext.useStoreState((state) => state.server.data?.internalId);

    // User state
    const user = useStoreState((state: ApplicationStore) => state.user.data!);
    const rootAdmin = useStoreState((state: ApplicationStore) => state.user.data!.rootAdmin);
    
    // Settings state
    const appName = useStoreState((state: ApplicationStore) => state.settings.data?.name || 'Pterodactyl');
    const appLogo = useStoreState((state: ApplicationStore) => state.settings.data?.logo);

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);
        return !match ? { address: 'n/a', port: 'n/a' } : {
            address: match.alias || ip(match.ip),
            port: match.port.toString()
        };
    });

    const to = (value: string, url = false) => {
        if (value === '/') {
            return url ? match.url : match.path;
        }
        return `${(url ? match.url : match.path).replace(/\/*$/, '')}/${value.replace(/^\/+/, '')}`;
    };

    useEffect(() => {
        if (!connected || !instance) {
            return;
        }
        instance.send(SocketRequest.SEND_STATS);
    }, [instance, connected]);

    useWebsocketEvent(SocketEvent.STATS, (data) => {
        let stats: any = {};
        try {
            stats = JSON.parse(data);
        } catch (e) {
            return;
        }

        setStats({
            memory: stats.memory_bytes,
            cpu: stats.cpu_absolute,
            disk: stats.disk_bytes,
            tx: stats.network.tx_bytes,
            rx: stats.network.rx_bytes,
            uptime: stats.uptime || 0,
        });
    });

    const onTriggerLogout = () => {
        setIsLoggingOut(true);
        http.post('/auth/logout').finally(() => {
            // @ts-expect-error this is valid
            window.location = '/';
        });
    };

    const serverRoutes = routes.server.filter((route) => !!route.name);

    interface SidebarItem {
        id: string;
        name?: string;
        path?: string;
        permission?: string | string[] | null;
        exact?: boolean;
        icon?: IconDefinition;
        isServerRoute?: boolean;
        isDivider?: boolean;
    }

    const sidebarItems: SidebarItem[] = [
        // Server Navigation
        ...serverRoutes.map((route): SidebarItem => ({
            id: route.path === '/' ? 'console' : route.path.replace('/', ''),
            name: route.name!,
            path: to(route.path, true),
            permission: route.permission,
            exact: route.exact,
            icon: getRouteIcon(route.path, route.name!),
            isServerRoute: true,
        })),
        
        // Divider
        { id: 'divider-1', isDivider: true },
        
        // Main Navigation
        {
            id: 'dashboard',
            name: 'Dashboard',
            path: '/',
            icon: faHome,
            isServerRoute: false,
        },
        {
            id: 'account',
            name: 'Account',
            path: '/account',
            icon: faUser,
            isServerRoute: false,
        },
    ];

    function getRouteIcon(path: string, name: string): IconDefinition {
        const iconMap: Record<string, IconDefinition> = {
            '/': faTerminal,
            '/files': faFolder,
            '/databases': faDatabase,
            '/schedules': faClock,
            '/users': faUsers,
            '/backups': faSave,
            '/network': faNetworkWired,
            '/startup': faRocket,
            '/settings': faCog,
            '/activity': faChartBar,
        };
        return iconMap[path] || faFile;
    }

    return (
        <div className="min-h-screen relative">
            {/* Sidebar */}
            <div className={classNames(
                "w-80 server-sidebar p-6 fixed h-full z-30 transition-transform duration-300 ease-in-out overflow-y-auto",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
            )}>
                {/* Logo & Server Info */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center">
                        <div className="w-12 h-12 server-octopus-logo rounded-2xl flex items-center justify-center mr-4 server-animate-float relative overflow-hidden">
                            <div className="relative z-10">
                                {appLogo ? (
                                    <img 
                                        src={appLogo} 
                                        alt={`${appName} Logo`}
                                        className="w-8 h-8 object-contain"
                                    />
                                ) : (
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                                        <path d="M12 2C8.13 2 5 5.13 5 9c0 1.74.61 3.34 1.62 4.6L12 22l5.38-8.4C18.39 12.34 19 10.74 19 9c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                    </svg>
                                )}
                            </div>
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-xl">{appName}</h1>
                            <p className="text-purple-300 text-sm font-medium">Server Panel</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden p-2 text-white"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Server Status Card */}
                <div className="server-glass rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-white font-semibold text-lg truncate mr-2">{name}</span>
                        <div className={classNames(
                            "w-3 h-3 rounded-full",
                            status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        )}></div>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-300">Status:</span>
                            <span className={classNames(
                                "font-medium",
                                status === 'running' ? 'text-green-400' : 'text-red-400'
                            )}>
                                {capitalize(status || 'Offline')}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Address:</span>
                            <span className="text-purple-300 font-mono text-xs">{allocation.address}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Port:</span>
                            <span className="text-purple-300 font-mono text-xs">{allocation.port}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-300">Uptime:</span>
                            <span className="text-blue-300">
                                {status === 'running' && stats.uptime > 0 ? (
                                    <UptimeDuration uptime={stats.uptime / 1000} />
                                ) : (
                                    'Offline'
                                )}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="server-glass rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">CPU</div>
                        <div className="text-white font-bold">{stats.cpu.toFixed(1)}%</div>
                    </div>
                    <div className="server-glass rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Memory</div>
                        <div className="text-white font-bold">{bytesToString(stats.memory)}</div>
                    </div>
                    <div className="server-glass rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Disk</div>
                        <div className="text-white font-bold">{bytesToString(stats.disk)}</div>
                    </div>
                    <div className="server-glass rounded-lg p-3">
                        <div className="text-xs text-gray-400 mb-1">Network</div>
                        <div className="text-white font-bold text-xs">
                            ↑{bytesToString(stats.tx)}<br/>
                            ↓{bytesToString(stats.rx)}
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-2 mb-6">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Server Management
                    </div>
                    {sidebarItems.map((item) => {
                        if (item.isDivider) {
                            return (
                                <div key={item.id} className="border-t border-gray-600 my-4"></div>
                            );
                        }

                        if (item.isServerRoute && item.path && item.name) {
                            const isActive = item.exact 
                                ? location.pathname === item.path
                                : location.pathname.startsWith(item.path);

                            if (item.permission) {
                                return (
                                    <Can key={item.id} action={item.permission} matchAny>
                                        <NavLink
                                            to={item.path}
                                            exact={item.exact}
                                            className={classNames(
                                                "server-sidebar-item flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200",
                                                isActive 
                                                    ? "active text-white server-octopus-gradient" 
                                                    : "text-gray-300 hover:text-white hover:bg-white/10"
                                            )}
                                        >
                                            {item.icon && <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />}
                                            <span>{item.name}</span>
                                            {item.id === 'console' && (
                                                <div className="server-status-indicator ml-auto"></div>
                                            )}
                                        </NavLink>
                                    </Can>
                                );
                            }

                            return (
                                <NavLink
                                    key={item.id}
                                    to={item.path}
                                    exact={item.exact}
                                    className={classNames(
                                        "server-sidebar-item flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-200",
                                        isActive 
                                            ? "active text-white server-octopus-gradient" 
                                            : "text-gray-300 hover:text-white hover:bg-white/10"
                                    )}
                                >
                                    {item.icon && <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />}
                                    <span>{item.name}</span>
                                    {item.id === 'console' && (
                                        <div className="server-status-indicator ml-auto"></div>
                                    )}
                                </NavLink>
                            );
                        }

                        if (item.path && item.name) {
                            return (
                                <a
                                    key={item.id}
                                    href={item.path}
                                    className="server-sidebar-item flex items-center px-4 py-3 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 font-medium transition-all duration-200"
                                >
                                    {item.icon && <FontAwesomeIcon icon={item.icon} className="w-5 h-5 mr-3" />}
                                    <span>{item.name}</span>
                                </a>
                            );
                        }
                        
                        return null;
                    })}
                </nav>

                {/* User Section */}
                <div className="border-t border-gray-600 pt-4">
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Account
                    </div>
                    
                    {/* User Info */}
                    <div className="server-glass rounded-xl p-4 mb-4">
                        <div className="flex items-center mb-3">
                            <div className="w-10 h-10 rounded-full overflow-hidden mr-3 bg-purple-600 flex items-center justify-center">
                                <Avatar.User />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate">{user.username}</div>
                                <div className="text-gray-400 text-sm truncate">{user.email}</div>
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <a
                                href="/account"
                                className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                            >
                                <span className="mr-2">⚙️</span>
                                Account Settings
                            </a>
                            
                            {rootAdmin && (
                                <>
                                    <a
                                        href="/admin"
                                        className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                                    >
                                        <span className="mr-2">🔧</span>
                                        Admin Panel
                                    </a>
                                    <a
                                        href={`/admin/servers/view/${serverId}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center px-3 py-2 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 text-sm"
                                    >
                                        <span className="mr-2">🔍</span>
                                        Admin View
                                        <svg className="w-3 h-3 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-1a1 1 0 10-2 0v1H5V7h1a1 1 0 000-2H5z"/>
                                        </svg>
                                    </a>
                                </>
                            )}
                            
                            <button
                                onClick={onTriggerLogout}
                                disabled={isLoggingOut}
                                className="flex items-center w-full px-3 py-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-sm disabled:opacity-50"
                            >
                                <span className="mr-2">🚪</span>
                                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Overlay */}
            <div 
                className={classNames(
                    "fixed inset-0 bg-black bg-opacity-60 z-20 lg:hidden transition-opacity duration-300",
                    sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                )}
                onClick={() => setSidebarOpen(false)}
            ></div>

            {/* Main Content */}
            <div className="lg:ml-80 transition-all duration-300 ease-in-out">
                {/* Mobile Header */}
                <div className="lg:hidden p-4 server-glass-dark border-b border-white/10">
                    <div className="flex justify-between items-center">
                        <button 
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 rounded-md text-white hover:bg-white/10 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                            </svg>
                        </button>
                        <div className="flex items-center">
                            <h1 className="text-white font-bold text-xl">{appName}</h1>
                        </div>
                        <div className="w-10"></div> {/* Spacer for centering */}
                    </div>
                </div>

                {/* Page Content */}
                <div className="min-h-screen">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default memo(OctopusServerLayout, isEqual);
