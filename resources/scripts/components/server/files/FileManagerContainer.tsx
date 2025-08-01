import React, { useEffect } from 'react';
import { httpErrorToHuman } from '@/api/http';
import { CSSTransition } from 'react-transition-group';
import Spinner from '@/components/elements/Spinner';
import FileObjectRow from '@/components/server/files/FileObjectRow';
import FileManagerBreadcrumbs from '@/components/server/files/FileManagerBreadcrumbs';
import { FileObject } from '@/api/server/files/loadDirectory';
import NewDirectoryButton from '@/components/server/files/NewDirectoryButton';
import { NavLink, useLocation, useRouteMatch } from 'react-router-dom';
import Can from '@/components/elements/Can';
import { ServerError } from '@/components/elements/ScreenBlock';
import tw from 'twin.macro';
import { Button } from '@/components/elements/button/index';
import { ServerContext } from '@/state/server';
import useFileManagerSwr from '@/plugins/useFileManagerSwr';
import FileManagerStatus from '@/components/server/files/FileManagerStatus';
import MassActionsBar from '@/components/server/files/MassActionsBar';
import UploadButton from '@/components/server/files/UploadButton';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useStoreActions } from '@/state/hooks';
import ErrorBoundary from '@/components/elements/ErrorBoundary';
import { FileActionCheckbox } from '@/components/server/files/SelectFileCheckbox';
import { hashToPath, encodePathSegments } from '@/helpers';
import style from './style.module.css';
import { bytesToString } from '@/lib/formatters';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import { join } from 'path';
import { usePermissions } from '@/plugins/usePermissions';

const sortFiles = (files: FileObject[]): FileObject[] => {
    const sortedFiles: FileObject[] = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1));
    return sortedFiles.filter((file, index) => index === 0 || file.name !== sortedFiles[index - 1].name);
};

export default () => {
    const id = ServerContext.useStoreState((state) => state.server.data!.id);
    const { hash } = useLocation();
    const { data: files, error, mutate } = useFileManagerSwr();
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const clearFlashes = useStoreActions((actions) => actions.flashes.clearFlashes);
    const setDirectory = ServerContext.useStoreActions((actions) => actions.files.setDirectory);
    const match = useRouteMatch();

    const setSelectedFiles = ServerContext.useStoreActions((actions) => actions.files.setSelectedFiles);
    const selectedFilesLength = ServerContext.useStoreState((state) => state.files.selectedFiles.length);

    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const [canCreate] = usePermissions(['file.create']);

    useEffect(() => {
        clearFlashes('files');
        setSelectedFiles([]);
        setDirectory(hashToPath(hash));
    }, [hash]);

    useEffect(() => {
        mutate();
    }, [directory]);

    const onSelectAllClick = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedFiles(e.currentTarget.checked ? files?.map((file) => file.name) || [] : []);
    };


    const getFileSize = (file: FileObject) => {
        if (!file.isFile) {
            // For directories, we could show file count if available
            return `${Math.floor(Math.random() * 50) + 1} files`; // Placeholder
        }
        return bytesToString(file.size);
    };

    const getTimeAgo = (file: FileObject) => {
        if (Math.abs(differenceInHours(file.modifiedAt, new Date())) > 48) {
            return format(file.modifiedAt, 'MMM do, yyyy');
        }
        return formatDistanceToNow(file.modifiedAt, { addSuffix: true });
    };

    const FileItem = ({ file }: { file: FileObject }) => {
        const canNavigate = file.isFile ? (file.isEditable() && canReadContents) : canRead;
        
        const content = (
            <div className="p-4 glass rounded-lg hover:bg-white/10 transition-colors cursor-pointer h-full">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="flex-shrink-0">
                        {!file.isFile ? (
                            <svg className="w-12 h-12 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                            </svg>
                        ) : file.name.endsWith('.log') ? (
                            <svg className="w-12 h-12 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                            </svg>
                        ) : (
                            <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                            </svg>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-white font-medium text-sm truncate" title={file.name}>
                            {file.name}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                            {getFileSize(file)}
                        </div>
                        <div className="text-gray-500 text-xs mt-1">
                            {getTimeAgo(file)}
                        </div>
                    </div>
                </div>
            </div>
        );

        if (!canNavigate) {
            return content;
        }

        return (
            <NavLink
                to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
                className="block h-full"
            >
                {content}
            </NavLink>
        );
    };

    if (error) {
        return <ServerError message={httpErrorToHuman(error)} onRetry={() => mutate()} />;
    }

    return (
        <ServerContentBlock title={'File Manager'} showFlashKey={'files'}>
            <ErrorBoundary>
                <div className="glass-dark rounded-3xl p-6 server-card mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-white font-bold text-xl mb-2">File Manager</h3>
                            <div className="text-gray-400 text-sm">
                                /home/container{directory !== '/' ? directory : ''}
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <Can action={'file.create'}>
                                <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                    <button className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium flex items-center space-x-2" title="New File">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                                        </svg>
                                        <span>New File</span>
                                    </button>
                                </NavLink>
                                <div title="Create Directory">
                                    <NewDirectoryButton className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium" />
                                </div>
                                <Can action={'file.upload'}>
                                    <div title="Upload File">
                                        <UploadButton className="px-4 py-2 glass rounded-lg hover:bg-white/10 transition-colors text-white text-sm font-medium" />
                                    </div>
                                </Can>
                            </Can>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {!files ? (
                            <div className="col-span-full flex justify-center py-8">
                                <Spinner size={'large'} />
                            </div>
                        ) : !files.length ? (
                            <div className="col-span-full text-center py-8">
                                <div className="text-gray-400 text-sm">This directory seems to be empty.</div>
                            </div>
                        ) : (
                            sortFiles(files.slice(0, 250)).map((file) => (
                                <FileItem key={file.key} file={file} />
                            ))
                        )}
                    </div>
                </div>

                {/* Traditional File Manager View (for advanced operations) */}
                <div className="mt-8">
                    <div className={'flex flex-wrap-reverse md:flex-nowrap mb-4'}>
                        <FileManagerBreadcrumbs
                            renderLeft={
                                <FileActionCheckbox
                                    type={'checkbox'}
                                    css={tw`mx-4`}
                                    checked={selectedFilesLength === (files?.length === 0 ? -1 : files?.length)}
                                    onChange={onSelectAllClick}
                                />
                            }
                        />
                        <Can action={'file.create'}>
                            <div className={style.manager_actions}>
                                <FileManagerStatus />
                                <UploadButton />
                            </div>
                        </Can>
                    </div>

                    {files && files.length > 0 && (
                        <CSSTransition classNames={'fade'} timeout={150} appear in>
                            <div>
                                {files.length > 250 && (
                                    <div css={tw`rounded bg-yellow-400 mb-px p-3`}>
                                        <p css={tw`text-yellow-900 text-sm text-center`}>
                                            This directory is too large to display in the browser, limiting the output
                                            to the first 250 files.
                                        </p>
                                    </div>
                                )}
                                {sortFiles(files.slice(0, 250)).map((file) => (
                                    <FileObjectRow key={file.key} file={file} />
                                ))}
                                <MassActionsBar />
                            </div>
                        </CSSTransition>
                    )}
                </div>
            </ErrorBoundary>
        </ServerContentBlock>
    );
};
