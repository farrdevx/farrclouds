import React, { memo } from 'react';
import { ServerContext } from '@/state/server';
import isEqual from 'react-fast-compare';
import OctopusServerConsole from '@/components/server/console/OctopusServerConsole';
import Features from '@feature/Features';

export type PowerAction = 'start' | 'stop' | 'restart' | 'kill';

const ServerConsoleContainer = () => {
    const eggFeatures = ServerContext.useStoreState((state) => state.server.data!.eggFeatures, isEqual);

    return (
        <>
            <OctopusServerConsole />
            <Features enabled={eggFeatures} />
        </>
    );
};

export default memo(ServerConsoleContainer, isEqual);
