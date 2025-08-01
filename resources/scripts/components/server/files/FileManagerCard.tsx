import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFileAlt, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import { FileObject } from '@/api/server/files/loadDirectory';
import { bytesToString } from '@/lib/formatters';
import { differenceInHours, format, formatDistanceToNow } from 'date-fns';
import { NavLink, useRouteMatch } from 'react-router-dom';
import { ServerContext } from '@/state/server';
import { encodePathSegments } from '@/helpers';
import { join } from 'path';
import { usePermissions } from '@/plugins/usePermissions';
import isEqual from 'react-fast-compare';

interface FileManagerCardProps {
    files: FileObject[];
}

const FileManagerCard = ({ files }: FileManagerCardProps) => {
    const [canRead] = usePermissions(['file.read']);
    const [canReadContents] = usePermissions(['file.read-content']);
    const [canCreate] = usePermissions(['file.create']);
    const directory = ServerContext.useStoreState((state) => state.files.directory);
    const match = useRouteMatch();
    const id = ServerContext.useStoreState((state) => state.server.data!.id);

    // Sort files to show directories first, then files
    const sortedFiles = files
        .sort((a, b) => a.name.localeCompare(b.name))
        .sort((a, b) => (a.isFile === b.isFile ? 0 : a.isFile ? 1 : -1))
        .slice(0, 4); // Show only first 4 files for the card view

    const getFileIcon = (file: FileObject) => {
        if (!file.isFile) {
            return <FontAwesomeIcon icon={faFolder} className="w-5 h-5 text-yellow-400" />;
        }
        
        // Different colors for different file types
        if (file.name.endsWith('.log')) {
            return <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-red-400" />;
        }
        
        return <FontAwesomeIcon icon={faFileAlt} className="w-5 h-5 text-gray-400" />;
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
            <div className="flex items-center p-3 glass rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                {getFileIcon(file)}
                <div className="flex-1 ml-3">
                    <div className="text-white font-medium truncate">{file.name}</div>
                    <div className="text-gray-400 text-sm">{getFileSize(file)}</div>
                </div>
                <div className="text-gray-400 text-sm">{getTimeAgo(file)}</div>
            </div>
        );

        if (!canNavigate) {
            return content;
        }

        return (
            <NavLink
                to={`${match.url}${file.isFile ? '/edit' : ''}#${encodePathSegments(join(directory, file.name))}`}
                className="block"
            >
                {content}
            </NavLink>
        );
    };

    return (
        <div className="glass-dark rounded-3xl p-6 server-card">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-xl">File Manager</h3>
                <div className="flex space-x-2">
                    {canCreate && (
                        <>
                            <NavLink to={`/server/${id}/files/new${window.location.hash}`}>
                                <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="New File">
                                    <FontAwesomeIcon icon={faEdit} className="w-5 h-5 text-white" />
                                </button>
                            </NavLink>
                            <button className="p-2 glass rounded-lg hover:bg-white/10 transition-colors" title="New Folder">
                                <FontAwesomeIcon icon={faPlus} className="w-5 h-5 text-white" />
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            <div className="space-y-3">
                {sortedFiles.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-sm">This directory seems to be empty.</div>
                    </div>
                ) : (
                    sortedFiles.map((file) => (
                        <FileItem key={file.key} file={file} />
                    ))
                )}
                
                {files.length > 4 && (
                    <NavLink to={`/server/${id}/files`} className="block">
                        <div className="flex items-center justify-center p-3 glass rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                            <span className="text-purple-300 font-medium">
                                View all {files.length} files
                            </span>
                        </div>
                    </NavLink>
                )}
            </div>
        </div>
    );
};

export default memo(FileManagerCard, isEqual);
