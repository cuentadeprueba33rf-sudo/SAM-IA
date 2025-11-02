import React from 'react';
import type { Attachment } from '../types';
import { PhotoIcon, DocumentIcon } from './icons';

interface FilePreviewProps {
    attachment: Attachment;
    onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ attachment, onRemove }) => {
    const isImage = attachment.type.startsWith('image/');

    return (
        <div className="relative w-fit p-2 border border-border-subtle rounded-lg bg-surface-primary">
            {isImage ? (
                <img src={attachment.data} alt={attachment.name} className="max-h-24 max-w-xs rounded" />
            ) : (
                <div className="flex items-center gap-2 text-text-secondary">
                    <DocumentIcon className="w-8 h-8"/>
                    <span className="text-sm">{attachment.name}</span>
                </div>
            )}
            <button
                onClick={onRemove}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-bold hover:bg-red-600"
                aria-label="Remove attachment"
            >
                &times;
            </button>
        </div>
    );
};

export default FilePreview;