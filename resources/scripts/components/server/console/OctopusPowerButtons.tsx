import React, { useEffect, useState } from 'react';
import Can from '@/components/elements/Can';
import { ServerContext } from '@/state/server';
import { PowerAction } from '@/components/server/console/ServerConsoleContainer';
import { Dialog } from '@/components/elements/dialog';
import classNames from 'classnames';

interface PowerButtonProps {
    className?: string;
}

export default ({ className }: PowerButtonProps) => {
    const [open, setOpen] = useState(false);
    const status = ServerContext.useStoreState((state) => state.status.value);
    const instance = ServerContext.useStoreState((state) => state.socket.instance);

    const killable = status === 'stopping';
    const onButtonClick = (
        action: PowerAction | 'kill-confirmed',
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ): void => {
        e.preventDefault();
        if (action === 'kill') {
            return setOpen(true);
        }

        if (instance) {
            setOpen(false);
            instance.send('set state', action === 'kill-confirmed' ? 'kill' : action);
        }
    };

    useEffect(() => {
        if (status === 'offline') {
            setOpen(false);
        }
    }, [status]);

    return (
        <div className={className}>
            <Dialog.Confirm
                open={open}
                hideCloseIcon
                onClose={() => setOpen(false)}
                title={'Forcibly Stop Process'}
                confirm={'Continue'}
                onConfirmed={onButtonClick.bind(this, 'kill-confirmed')}
            >
                Forcibly stopping a server can lead to data corruption.
            </Dialog.Confirm>
            
            <Can action={'control.start'}>
                <button
                    className={classNames(
                        'w-full server-octopus-gradient-alt hover:shadow-lg hover:shadow-blue-500/25 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed',
                        status !== 'offline' && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={status !== 'offline'}
                    onClick={onButtonClick.bind(this, 'start')}
                >
                    Start Server
                </button>
            </Can>
            
            <Can action={'control.restart'}>
                <button
                    className={classNames(
                        'w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:shadow-lg hover:shadow-yellow-500/25 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed',
                        !status && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={!status}
                    onClick={onButtonClick.bind(this, 'restart')}
                >
                    Restart Server
                </button>
            </Can>
            
            <Can action={'control.stop'}>
                <button
                    className={classNames(
                        'w-full bg-gradient-to-r from-red-500 to-red-600 hover:shadow-lg hover:shadow-red-500/25 text-white py-4 px-6 rounded-2xl transition-all duration-300 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed',
                        status === 'offline' && 'opacity-50 cursor-not-allowed'
                    )}
                    disabled={status === 'offline'}
                    onClick={onButtonClick.bind(this, killable ? 'kill' : 'stop')}
                >
                    {killable ? 'Kill Server' : 'Stop Server'}
                </button>
            </Can>
        </div>
    );
};
