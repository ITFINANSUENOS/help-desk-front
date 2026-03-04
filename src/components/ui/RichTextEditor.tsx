import React, { useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    height?: number;
}

const TOOLBAR_MODULES = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        ['link', 'image'],
        ['table'],
        ['clean'],
    ],
    table: {
        cellMinWidth: 50,
    }
};

const FORMATS = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list',
    'align',
    'link', 'image',
    'table'
];

// Detects if the content has legacy HTML tables (from TinyMCE or similar)
const hasLegacyTable = (html: string): boolean => {
    return /<table[\s>]/i.test(html);
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    height = 300,
}) => {
    const quillRef = useRef<ReactQuill>(null);
    const lastExternalValue = useRef<string>(value);

    // If content has legacy HTML tables, render as plain HTML (read/edit via dangerouslySetInnerHTML)
    const isLegacyContent = hasLegacyTable(value);

    useEffect(() => {
        if (isLegacyContent) return; // skip Quill sync for legacy content

        const editor = quillRef.current?.getEditor();
        if (!editor) return;

        const currentHTML = editor.root.innerHTML;

        if (value !== lastExternalValue.current && value !== currentHTML) {
            lastExternalValue.current = value;

            const selection = editor.getSelection();
            editor.root.innerHTML = value;
            if (selection) {
                requestAnimationFrame(() => editor.setSelection(selection));
            }
        }
    }, [value, isLegacyContent]);

    const handleChange = (content: string, _delta?: unknown, _source?: string, _editor?: unknown) => {
        lastExternalValue.current = content;
        onChange(content);
    };

    // For legacy TinyMCE content with tables: render as a styled HTML div
    if (isLegacyContent) {
        return (
            <div className="rich-text-editor">
                <style>{`
                    .rich-text-editor-legacy {
                        border: 1px solid #ccc;
                        border-radius: 4px;
                        min-height: ${height}px;
                        max-height: ${height * 2}px;
                        overflow-y: auto;
                        padding: 12px;
                        font-size: 14px;
                        font-family: inherit;
                        background: #fff;
                        box-sizing: border-box;
                    }
                    .rich-text-editor-legacy table {
                        border-collapse: collapse;
                        width: 100%;
                        table-layout: fixed;
                        word-break: break-word;
                    }
                    .rich-text-editor-legacy td,
                    .rich-text-editor-legacy th {
                        border: 1px solid #aaa;
                        padding: 6px 8px;
                        vertical-align: top;
                        white-space: normal;
                        overflow-wrap: break-word;
                        writing-mode: horizontal-tb !important;
                        text-orientation: mixed !important;
                        transform: none !important;
                    }
                    .rich-text-editor-legacy p {
                        margin: 0 0 6px 0;
                    }
                `}</style>
                {/* 
                    Read-only view for legacy content. 
                    If you need to allow editing, consider a migration step to strip/convert tables.
                */}
                <div
                    className="rich-text-editor-legacy"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
                {!disabled && (
                    <p style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                        ⚠️ Este contenido fue creado con un editor anterior. Para editar, por favor recrea la tabla.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="rich-text-editor">
            <style>{`
                .rich-text-editor .ql-container {
                    height: ${height}px;
                    font-size: 14px;
                }
                .rich-text-editor .ql-editor {
                    min-height: ${height}px;
                    /* Removed white-space: pre-wrap — it breaks table cell rendering */
                    word-break: break-word;
                    overflow-wrap: break-word;
                }
                /* Fix Quill table rendering */
                .rich-text-editor .ql-editor table {
                    border-collapse: collapse;
                    table-layout: fixed;
                    width: 100%;
                }
                .rich-text-editor .ql-editor td,
                .rich-text-editor .ql-editor th {
                    border: 1px solid #aaa;
                    padding: 4px 6px;
                    vertical-align: top;
                    white-space: normal;
                    writing-mode: horizontal-tb !important;
                    transform: none !important;
                }
            `}</style>

            <ReactQuill
                ref={quillRef}
                value={value}
                onChange={handleChange}
                modules={TOOLBAR_MODULES}
                formats={FORMATS}
                placeholder={placeholder ?? ''}
                readOnly={disabled}
                theme="snow"
            />
        </div>
    );
};