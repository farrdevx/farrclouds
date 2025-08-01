import React, { memo, useState, useEffect } from 'react';
import { ServerContext } from '@/state/server';
import Can from '@/components/elements/Can';
import isEqual from 'react-fast-compare';
import Spinner from '@/components/elements/Spinner';
import Console from '@/components/server/console/Console';
import OctopusPowerButtons from '@/components/server/console/OctopusPowerButtons';
import { Alert } from '@/components/elements/alert';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import { SocketEvent, SocketRequest } from '@/components/server/events';
import UptimeDuration from '@/components/server/UptimeDuration';
import useWebsocketEvent from '@/plugins/useWebsocketEvent';
import { capitalize } from '@/lib/strings';
import classNames from 'classnames';
import FileManagerCard from '@/components/server/files/FileManagerCard';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';

type Stats = Record<'memory' | 'cpu' | 'disk' | 'uptime' | 'rx' | 'tx', number>;

const OctopusServerConsole = () => {
    const [stats, setStats] = useState<Stats>({ memory: 0, cpu: 0, disk: 0, uptime: 0, tx: 0, rx: 0 });

    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const description = ServerContext.useStoreState((state) => state.server.data!.description);
    const isInstalling = ServerContext.useStoreState((state) => state.server.isInstalling);
    const isTransferring = ServerContext.useStoreState((state) => state.server.data!.isTransferring);
    const isNodeUnderMaintenance = ServerContext.useStoreState((state) => state.server.data!.isNodeUnderMaintenance);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const connected = ServerContext.useStoreState((state) => state.socket.connected);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);
    const limits = ServerContext.useStoreState((state) => state.server.data!.limits);

    // File manager data
    const { data: files } = useFileManagerSwr();

    const allocation = ServerContext.useStoreState((state) => {
        const match = state.server.data!.allocations.find((allocation) => allocation.isDefault);
        return !match ? { address: 'n/a', port: 'n/a' } : {
            address: match.alias || ip(match.ip),
            port: match.port.toString()
        };
    });

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

    const CircularProgress = ({ value, max, label, gradient }: any) => {
        const percentage = max ? Math.min((value / max) * 100, 100) : 0;
        const circumference = 2 * Math.PI * 48;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
            <div className="relative w-28 h-28">
                <svg className="w-28 h-28 server-progress-ring server-progress-glow">
                    <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none"/>
                    <circle 
                        cx="56" 
                        cy="56" 
                        r="48" 
                        stroke={`url(#${gradient})`} 
                        strokeWidth="8" 
                        fill="none"
                        strokeDasharray={circumference} 
                        strokeDashoffset={strokeDashoffset} 
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
                    />
                    <defs>
                        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#6366f1"/>
                            <stop offset="100%" stopColor="#8b5cf6"/>
                        </linearGradient>
                    </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                        <span className="text-white text-2xl font-bold">{Math.round(percentage)}%</span>
                        <div className="text-purple-300 text-xs">{label}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-8">
            {/* Alerts */}
            {(isNodeUnderMaintenance || isInstalling || isTransferring) && (
                <Alert type={'warning'} className={'mb-4'}>
                    {isNodeUnderMaintenance
                        ? 'The node of this server is currently under maintenance and all actions are unavailable.'
                        : isInstalling
                        ? 'This server is currently running its installation process and most actions are unavailable.'
                        : 'This server is currently being transferred to another node and all actions are unavailable.'}
                </Alert>
            )}

            {/* Header */}
            <div className="mb-10">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-3 bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    MANAGE YOUR
                </h1>
                <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                    SERVER <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">WITH EASE.</span>
                </h2>
                <p className="text-gray-300 text-lg max-w-2xl">Stay in control with real-time server information and essential management functions.</p>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Console */}
                <div className="lg:col-span-2 server-glass-dark rounded-3xl p-6 md:p-8 server-card">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center">
                            <h3 className="text-white font-bold text-xl mr-4">Console</h3>
                            <div className={classNames(
                                "px-3 py-1 rounded-full text-sm font-medium",
                                status === 'running' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            )}>
                                {status === 'running' ? 'Online' : capitalize(status || 'Offline')}
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg"></div>
                            <div className="w-4 h-4 bg-yellow-500 rounded-full shadow-lg"></div>
                            <div className="w-4 h-4 bg-green-500 rounded-full shadow-lg"></div>
                        </div>
                    </div>
                    <div className="server-console-container rounded-2xl mb-6" style={{ height: '320px' }}>
                        <Spinner.Suspense>
                            <Console />
                        </Spinner.Suspense>
                    </div>
                </div>

                {/* Server Info & Controls */}
                <div className="space-y-6">
                    {/* Server Information */}
                    <div className="server-glass-dark rounded-3xl p-6 server-card">
                        <h3 className="text-white font-bold text-lg mb-6 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3 animate-pulse"></div>
                            Server Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Address</span>
                                <span className="text-white font-semibold">{allocation.address}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Port</span>
                                <span className="text-white font-semibold">{allocation.port}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Uptime</span>
                                <span className="text-green-400 font-semibold">
                                    {status === 'running' && stats.uptime > 0 ? (
                                        <UptimeDuration uptime={stats.uptime / 1000} />
                                    ) : (
                                        capitalize(status || 'Offline')
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Memory Usage</span>
                                <span className="text-purple-400 font-semibold">{bytesToString(stats.memory)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">CPU Usage</span>
                                <span className="text-blue-400 font-semibold">{stats.cpu.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-400 font-medium">Disk Usage</span>
                                <span className="text-emerald-400 font-semibold">{bytesToString(stats.disk)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Server Control */}
                    <div className="server-glass-dark rounded-3xl p-6 server-card">
                        <h3 className="text-white font-bold text-lg mb-6">Server Control</h3>
                        <div className="space-y-4">
                            <Can action={['control.start', 'control.stop', 'control.restart']} matchAny>
                                <OctopusPowerButtons className="flex flex-col space-y-4" />
                            </Can>
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="server-glass-dark rounded-3xl p-6 server-card server-metric-card">
                    <h3 className="text-white font-bold text-lg mb-6 text-center">CPU Usage</h3>
                    <div className="flex items-center justify-center mb-4">
                        <CircularProgress 
                            value={stats.cpu} 
                            max={limits.cpu || 100} 
                            label="Normal" 
                            gradient="cpuGradient"
                        />
                    </div>
                    <div className="text-center text-gray-400 text-sm">
                        {limits.cpu ? `${limits.cpu}% limit` : 'Unlimited'}
                    </div>
                </div>

                <div className="server-glass-dark rounded-3xl p-6 server-card server-metric-card">
                    <h3 className="text-white font-bold text-lg mb-6 text-center">Memory</h3>
                    <div className="flex items-center justify-center mb-4">
                        <CircularProgress 
                            value={stats.memory / 1024 / 1024} 
                            max={limits.memory} 
                            label={`${bytesToString(stats.memory)}`} 
                            gradient="memGradient"
                        />
                    </div>
                    <div className="text-center text-gray-400 text-sm">
                        {limits.memory ? `${bytesToString(mbToBytes(limits.memory))} limit` : 'Unlimited'}
                    </div>
                </div>

                <div className="server-glass-dark rounded-3xl p-6 server-card server-metric-card">
                    <h3 className="text-white font-bold text-lg mb-6 text-center">Network</h3>
                    <div className="flex items-center justify-center mb-4">
                        <div className="text-center">
                            <div className="text-white text-2xl font-bold">↑ {bytesToString(stats.tx)}</div>
                            <div className="text-white text-2xl font-bold">↓ {bytesToString(stats.rx)}</div>
                            <div className="text-purple-300 text-xs">Upload/Download</div>
                        </div>
                    </div>
                    <div className="text-center text-gray-400 text-sm">
                        Total Transfer
                    </div>
                </div>

                <div className="server-glass-dark rounded-3xl p-6 server-card server-metric-card">
                    <h3 className="text-white font-bold text-lg mb-6 text-center">Storage</h3>
                    <div className="flex items-center justify-center mb-4">
                        <CircularProgress 
                            value={stats.disk / 1024 / 1024} 
                            max={limits.disk} 
                            label={`${bytesToString(stats.disk)}`} 
                            gradient="storageGradient"
                        />
                    </div>
                    <div className="text-center text-gray-400 text-sm">
                        {limits.disk ? `${bytesToString(mbToBytes(limits.disk))} limit` : 'Unlimited'}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default memo(OctopusServerConsole, isEqual);
