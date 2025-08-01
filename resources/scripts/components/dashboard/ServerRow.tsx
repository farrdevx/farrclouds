import React, { memo, useEffect, useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEthernet, faHdd, faMemory, faMicrochip, faServer } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Server } from '@/api/server/getServer';
import getServerResourceUsage, { ServerPowerState, ServerStats } from '@/api/server/getServerResourceUsage';
import { bytesToString, ip, mbToBytes } from '@/lib/formatters';
import tw from 'twin.macro';
import GreyRowBox from '@/components/elements/GreyRowBox';
import Spinner from '@/components/elements/Spinner';
import styled from 'styled-components/macro';
import isEqual from 'react-fast-compare';
import { useStoreState } from 'easy-peasy';

// Determines if the current value is in an alarm threshold so we can show it in red rather
// than the more faded default style.
const isAlarmState = (current: number, limit: number): boolean => limit > 0 && current / (limit * 1024 * 1024) >= 0.9;

const Icon = memo(
    styled(FontAwesomeIcon)<{ $alarm: boolean }>`
        ${(props) => (props.$alarm ? tw`text-red-400` : tw`text-purple-300`)};
    `,
    isEqual
);

const IconDescription = styled.p<{ $alarm: boolean }>`
    ${tw`text-sm ml-2`};
    ${(props) => (props.$alarm ? tw`text-white` : tw`text-gray-300`)};
`;

// Circular Progress Component with different colors and smooth animations
const CircularProgress = styled.div<{ $percentage: number; $alarm?: boolean; $type?: 'cpu' | 'memory' | 'disk'; $updating?: boolean }>`
    ${tw`relative flex items-center justify-center`};
    width: 60px;
    height: 60px;
    
    &::before {
        content: '';
        position: absolute;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: conic-gradient(
            ${(props) => {
                if (props.$alarm) return '#ef4444';
                switch (props.$type) {
                    case 'cpu': return '#06b6d4'; // Cyan
                    case 'memory': return '#10b981'; // Green  
                    case 'disk': return '#f59e0b'; // Orange
                    default: return '#8b5cf6'; // Purple
                }
            }} ${(props) => props.$percentage * 3.6}deg,
            rgba(255, 255, 255, 0.1) ${(props) => props.$percentage * 3.6}deg
        );
        mask: radial-gradient(circle at center, transparent 65%, black 66%);
        -webkit-mask: radial-gradient(circle at center, transparent 65%, black 66%);
        filter: drop-shadow(0 0 8px ${(props) => {
            if (props.$alarm) return 'rgba(239, 68, 68, 0.4)';
            switch (props.$type) {
                case 'cpu': return 'rgba(6, 182, 212, 0.4)';
                case 'memory': return 'rgba(16, 185, 129, 0.4)';
                case 'disk': return 'rgba(245, 158, 11, 0.4)';
                default: return 'rgba(139, 92, 246, 0.4)';
            }
        }});
        transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        ${(props) => props.$updating && `
            animation: pulse-glow 0.6s ease-in-out;
        `}
    }
    
    &::after {
        content: '';
        position: absolute;
        width: 80%;
        height: 80%;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    @keyframes pulse-glow {
        0%, 100% { 
            filter: drop-shadow(0 0 8px ${(props) => {
                if (props.$alarm) return 'rgba(239, 68, 68, 0.4)';
                switch (props.$type) {
                    case 'cpu': return 'rgba(6, 182, 212, 0.4)';
                    case 'memory': return 'rgba(16, 185, 129, 0.4)';
                    case 'disk': return 'rgba(245, 158, 11, 0.4)';
                    default: return 'rgba(139, 92, 246, 0.4)';
                }
            }});
        }
        50% { 
            filter: drop-shadow(0 0 16px ${(props) => {
                if (props.$alarm) return 'rgba(239, 68, 68, 0.8)';
                switch (props.$type) {
                    case 'cpu': return 'rgba(6, 182, 212, 0.8)';
                    case 'memory': return 'rgba(16, 185, 129, 0.8)';
                    case 'disk': return 'rgba(245, 158, 11, 0.8)';
                    default: return 'rgba(139, 92, 246, 0.8)';
                }
            }});
        }
    }
`;

const ProgressContent = styled.div`
    ${tw`relative z-10 text-center`};
    
    .percentage {
        ${tw`text-sm font-semibold text-white`};
        line-height: 1;
        transition: all 0.3s ease-in-out;
    }
    
    .label {
        ${tw`text-xs text-gray-300`};
        line-height: 1;
    }
`;

const ServerCard = styled.div<{ 
    $status: ServerPowerState | undefined;
    $primaryColor: string;
    $secondaryColor: string;
    $cardStyle: string;
    $borderRadius: number;
    $animationSpeed: string;
    $textContrast: number;
}>`
    ${tw`relative overflow-hidden p-6 transition-all cursor-pointer`};
    border-radius: ${(props) => props.$borderRadius}px;
    transition-duration: ${(props) => {
        switch (props.$animationSpeed) {
            case 'fast': return '200ms';
            case 'slow': return '500ms';
            default: return '300ms';
        }
    }};
    
    background: ${(props) => {
        const primary = props.$primaryColor;
        const secondary = props.$secondaryColor;
        
        if (props.$cardStyle === 'solid') {
            return primary;
        }
        
        if (props.$cardStyle === 'glassmorphism') {
            return `rgba(${parseInt(primary.slice(1, 3), 16)}, ${parseInt(primary.slice(3, 5), 16)}, ${parseInt(primary.slice(5, 7), 16)}, 0.1)`;
        }
        
        // Default gradient style
        if (!props.$status || props.$status === 'offline') {
            return `linear-gradient(135deg, ${primary}20 0%, ${secondary}30 50%, ${primary}40 100%)`;
        }
        if (props.$status === 'running') {
            return `linear-gradient(135deg, ${primary}60 0%, ${secondary}70 50%, ${primary}80 100%)`;
        }
        return `linear-gradient(135deg, ${primary}40 0%, ${secondary}50 50%, ${primary}60 100%)`;
    }};
    
    border: 1px solid ${(props) => `${props.$primaryColor}50`};
    box-shadow: 0 10px 25px -5px ${(props) => `${props.$primaryColor}30`}, 0 10px 10px -5px rgba(0, 0, 0, 0.1);
    
    ${(props) => props.$cardStyle === 'glassmorphism' && `
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
    `}
    
    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: ${(props) => {
            const primary = props.$primaryColor;
            const secondary = props.$secondaryColor;
            return `radial-gradient(circle at 20% 80%, ${primary}40 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${secondary}30 0%, transparent 50%), radial-gradient(circle at 40% 40%, ${primary}30 0%, transparent 50%)`;
        }};
        opacity: 0.7;
        transition: opacity 0.3s ease;
    }
    
    &::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        transition: left 0.6s ease;
    }
    
    &:hover::before {
        opacity: 0.9;
    }
    
    &:hover::after {
        left: 100%;
    }
    
    &:hover {
        transform: translateY(-8px) scale(1.02);
        box-shadow: 0 20px 40px -10px ${(props) => `${props.$primaryColor}40`}, 0 20px 20px -10px ${(props) => `${props.$secondaryColor}20`};
        border-color: ${(props) => `${props.$primaryColor}70`};
    }
`;

const ServerHeader = styled.div`
    ${tw`flex items-center justify-between mb-4`};
`;

const ServerInfo = styled.div`
    ${tw`flex items-center flex-1`};
`;

const ServerIcon = styled.div<{ $status: ServerPowerState | undefined }>`
    ${tw`w-14 h-14 rounded-xl flex items-center justify-center mr-4 relative z-10`};
    background: ${(props) => {
        if (!props.$status || props.$status === 'offline') {
            return 'linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(124, 58, 237, 0.4) 100%)';
        }
        if (props.$status === 'running') {
            return 'linear-gradient(135deg, rgba(168, 85, 247, 0.5) 0%, rgba(147, 51, 234, 0.5) 100%)';
        }
        return 'linear-gradient(135deg, rgba(147, 51, 234, 0.5) 0%, rgba(109, 40, 217, 0.5) 100%)';
    }};
    border: 1px solid ${(props) => {
        if (!props.$status || props.$status === 'offline') return 'rgba(139, 92, 246, 0.5)';
        if (props.$status === 'running') return 'rgba(168, 85, 247, 0.6)';
        return 'rgba(147, 51, 234, 0.6)';
    }};
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
    backdrop-filter: blur(10px);
`;

const ServerDetails = styled.div`
    ${tw`flex-1`};
`;

const ServerName = styled.h3<{ $textContrast: number }>`
    ${tw`text-lg font-semibold text-white mb-1 truncate`};
    text-shadow: 0 1px 3px rgba(0, 0, 0, ${(props) => props.$textContrast / 100});
`;

const ServerDescription = styled.p<{ $textContrast: number }>`
    ${tw`text-sm text-gray-200 truncate`};
    text-shadow: 0 1px 2px rgba(0, 0, 0, ${(props) => (props.$textContrast - 20) / 100});
`;

const StatusBadge = styled.div<{ $status: ServerPowerState | undefined }>`
    ${tw`px-4 py-2 rounded-xl text-xs font-semibold flex items-center relative z-10`};
    background: ${(props) => {
        if (!props.$status || props.$status === 'offline') return 'rgba(139, 92, 246, 0.2)';
        if (props.$status === 'running') return 'rgba(168, 85, 247, 0.25)';
        return 'rgba(147, 51, 234, 0.25)';
    }};
    color: ${(props) => {
        if (!props.$status || props.$status === 'offline') return '#c4b5fd';
        if (props.$status === 'running') return '#ddd6fe';
        return '#e9d5ff';
    }};
    border: 1px solid ${(props) => {
        if (!props.$status || props.$status === 'offline') return 'rgba(139, 92, 246, 0.4)';
        if (props.$status === 'running') return 'rgba(168, 85, 247, 0.5)';
        return 'rgba(147, 51, 234, 0.5)';
    }};
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
`;

const StatusDot = styled.div<{ $status: ServerPowerState | undefined }>`
    ${tw`w-2 h-2 rounded-full mr-2`};
    background: ${(props) => {
        if (!props.$status || props.$status === 'offline') return '#8b5cf6';
        if (props.$status === 'running') return '#a855f7';
        return '#9333ea';
    }};
    box-shadow: 0 0 8px ${(props) => {
        if (!props.$status || props.$status === 'offline') return 'rgba(139, 92, 246, 0.8)';
        if (props.$status === 'running') return 'rgba(168, 85, 247, 0.8)';
        return 'rgba(147, 51, 234, 0.8)';
    }};
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
`;

const StatsGrid = styled.div`
    ${tw`grid grid-cols-3 gap-4 mt-4`};
`;

const StatCard = styled.div`
    ${tw`text-center`};
`;

const AddressInfo = styled.div`
    ${tw`flex items-center justify-center text-sm text-gray-400 mt-3 pt-3 border-t border-gray-700`};
`;

type Timer = ReturnType<typeof setInterval>;

// Custom hook for smooth value transitions
const useSmoothValue = (targetValue: number, duration: number = 800) => {
    const [currentValue, setCurrentValue] = useState(targetValue);
    const animationRef = useRef<number>();
    const startTimeRef = useRef<number>();
    const startValueRef = useRef<number>(targetValue);

    useEffect(() => {
        if (Math.abs(currentValue - targetValue) < 0.1) return;

        startValueRef.current = currentValue;
        startTimeRef.current = Date.now();

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTimeRef.current!;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const newValue = startValueRef.current + (targetValue - startValueRef.current) * easeOutCubic;
            
            setCurrentValue(newValue);
            
            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            }
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [targetValue, duration]);

    return currentValue;
};

export default ({ server, className }: { server: Server; className?: string }) => {
    const interval = useRef<Timer>(null) as React.MutableRefObject<Timer>;
    const [isSuspended, setIsSuspended] = useState(server.status === 'suspended');
    const [stats, setStats] = useState<ServerStats | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Get theme settings from store (using any to bypass TypeScript for now)
    const settings = useStoreState((state) => state.settings.data) as any;
    const primaryColor = settings?.['theme:primary_color'] || '#8b5cf6';
    const secondaryColor = settings?.['theme:secondary_color'] || '#7c3aed';
    const cardStyle = settings?.['theme:card_style'] || 'gradient';
    const borderRadius = parseInt(settings?.['theme:border_radius'] || '16');
    const animationSpeed = settings?.['theme:animation_speed'] || 'normal';
    const textContrast = parseInt(settings?.['theme:text_contrast'] || '80');
    
    // Smooth animated values
    const smoothCpuUsage = useSmoothValue(stats?.cpuUsagePercent || 0);
    const smoothMemoryPercentage = useSmoothValue(
        stats && server.limits.memory !== 0 
            ? Math.min((stats.memoryUsageInBytes / mbToBytes(server.limits.memory)) * 100, 100)
            : 0
    );
    const smoothDiskPercentage = useSmoothValue(
        stats && server.limits.disk !== 0 
            ? Math.min((stats.diskUsageInBytes / mbToBytes(server.limits.disk)) * 100, 100)
            : 0
    );

    const getStats = () => {
        setIsUpdating(true);
        return getServerResourceUsage(server.uuid)
            .then((data) => {
                setStats(data);
                setTimeout(() => setIsUpdating(false), 300); // Brief flash to show update
            })
            .catch((error) => {
                console.error(error);
                setIsUpdating(false);
            });
    };

    useEffect(() => {
        setIsSuspended(stats?.isSuspended || server.status === 'suspended');
    }, [stats?.isSuspended, server.status]);

    useEffect(() => {
        // Don't waste a HTTP request if there is nothing important to show to the user because
        // the server is suspended.
        if (isSuspended) return;

        getStats().then(() => {
            interval.current = setInterval(() => getStats(), 2000);
        });

        return () => {
            interval.current && clearInterval(interval.current);
        };
    }, [isSuspended]);

    const alarms = { cpu: false, memory: false, disk: false };
    if (stats) {
        alarms.cpu = server.limits.cpu === 0 ? false : stats.cpuUsagePercent >= server.limits.cpu * 0.9;
        alarms.memory = isAlarmState(stats.memoryUsageInBytes, server.limits.memory);
        alarms.disk = server.limits.disk === 0 ? false : isAlarmState(stats.diskUsageInBytes, server.limits.disk);
    }

    const diskLimit = server.limits.disk !== 0 ? bytesToString(mbToBytes(server.limits.disk)) : 'Unlimited';
    const memoryLimit = server.limits.memory !== 0 ? bytesToString(mbToBytes(server.limits.memory)) : 'Unlimited';
    const cpuLimit = server.limits.cpu !== 0 ? server.limits.cpu + ' %' : 'Unlimited';

    return (
        <Link to={`/server/${server.id}`} className={className}>
            <ServerCard 
                $status={stats?.status}
                $primaryColor={primaryColor}
                $secondaryColor={secondaryColor}
                $cardStyle={cardStyle}
                $borderRadius={borderRadius}
                $animationSpeed={animationSpeed}
                $textContrast={textContrast}
            >
                <ServerHeader>
                    <ServerInfo>
                        <ServerIcon $status={stats?.status}>
                            <FontAwesomeIcon icon={faServer} css={tw`text-white text-lg`} />
                        </ServerIcon>
                        <ServerDetails>
                            <ServerName $textContrast={textContrast}>{server.name}</ServerName>
                            {!!server.description && (
                                <ServerDescription $textContrast={textContrast}>{server.description}</ServerDescription>
                            )}
                        </ServerDetails>
                    </ServerInfo>
                    <StatusBadge $status={stats?.status}>
                        <StatusDot $status={stats?.status} />
                        {!stats?.status || stats.status === 'offline' ? 'Offline' : 
                         stats.status === 'running' ? 'Online' : 
                         stats.status === 'starting' ? 'Starting' : 'Unknown'}
                    </StatusBadge>
                </ServerHeader>

                {!stats || isSuspended ? (
                    isSuspended ? (
                        <div css={tw`text-center py-8`}>
                            <span css={tw`bg-red-500 rounded-lg px-4 py-2 text-red-100 text-sm font-medium`}>
                                {server.status === 'suspended' ? 'Server Suspended' : 'Connection Error'}
                            </span>
                        </div>
                    ) : server.isTransferring || server.status ? (
                        <div css={tw`text-center py-8`}>
                            <span css={tw`bg-neutral-500 rounded-lg px-4 py-2 text-neutral-100 text-sm font-medium`}>
                                {server.isTransferring
                                    ? 'Transferring Server'
                                    : server.status === 'installing'
                                    ? 'Installing Server'
                                    : server.status === 'restoring_backup'
                                    ? 'Restoring Backup'
                                    : 'Server Unavailable'}
                            </span>
                        </div>
                    ) : (
                        <div css={tw`flex justify-center py-8`}>
                            <Spinner size={'small'} />
                        </div>
                    )
                ) : (
                    <StatsGrid>
                        <StatCard>
                            <CircularProgress 
                                $percentage={smoothCpuUsage} 
                                $alarm={alarms.cpu}
                                $type="cpu"
                                $updating={isUpdating}
                            >
                                <ProgressContent>
                                    <div className="percentage">{Math.round(smoothCpuUsage)}</div>
                                    <div className="label">CPU</div>
                                </ProgressContent>
                            </CircularProgress>
                            <p css={tw`text-xs text-gray-400 mt-2`}>of {cpuLimit}</p>
                        </StatCard>
                        
                        <StatCard>
                            <CircularProgress 
                                $percentage={smoothMemoryPercentage} 
                                $alarm={alarms.memory}
                                $type="memory"
                                $updating={isUpdating}
                            >
                                <ProgressContent>
                                    <div className="percentage">{Math.round(smoothMemoryPercentage)}</div>
                                    <div className="label">RAM</div>
                                </ProgressContent>
                            </CircularProgress>
                            <p css={tw`text-xs text-gray-400 mt-2`}>of {memoryLimit}</p>
                        </StatCard>
                        
                        <StatCard>
                            <CircularProgress 
                                $percentage={smoothDiskPercentage} 
                                $alarm={alarms.disk}
                                $type="disk"
                                $updating={isUpdating}
                            >
                                <ProgressContent>
                                    <div className="percentage">{Math.round(smoothDiskPercentage)}</div>
                                    <div className="label">DISK</div>
                                </ProgressContent>
                            </CircularProgress>
                            <p css={tw`text-xs text-gray-400 mt-2`}>of {diskLimit}</p>
                        </StatCard>
                    </StatsGrid>
                )}

                <AddressInfo>
                    <FontAwesomeIcon icon={faEthernet} css={tw`text-purple-300 mr-2`} />
                    {server.allocations
                        .filter((alloc) => alloc.isDefault)
                        .map((allocation) => (
                            <span key={allocation.ip + allocation.port.toString()}>
                                {allocation.alias || ip(allocation.ip)}:{allocation.port}
                            </span>
                        ))}
                </AddressInfo>
            </ServerCard>
        </Link>
    );
};
