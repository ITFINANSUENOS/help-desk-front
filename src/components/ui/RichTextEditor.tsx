
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
    const legacyRef = useRef<HTMLDivElement>(null);

    // ✅ Solo se evalúa UNA vez al montar el componente con el valor inicial de la BD.
    // Si el usuario pega desde Excel después, Quill ya está montado y esto no cambia.
    const isLegacyContent = useRef<boolean>(hasLegacyTable(value));

    useEffect(() => {
        if (isLegacyContent.current) return;

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
    }, [value]);

    const handleChange = (content: string, _delta?: unknown, _source?: string, _editor?: unknown) => {
        lastExternalValue.current = content;
        onChange(content);
    };

    // Contenido legacy de TinyMCE: usa contentEditable para que siga siendo editable
    if (isLegacyContent.current) {
        const handleLegacyInput = () => {
            if (legacyRef.current) {
                onChange(legacyRef.current.innerHTML);
            }
        };

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
                        outline: none;
                    }
                    .rich-text-editor-legacy:focus {
                        border-color: #4a90e2;
                        box-shadow: 0 0 0 2px rgba(74,144,226,0.2);
                    }
                    .rich-text-editor-legacy table {
                        border-collapse: collapse;
                        width: 100%;
                        table-layout: auto;
                        word-break: break-word;
                    }
                    .rich-text-editor-legacy td,
                    .rich-text-editor-legacy th {
                        border: 1px solid #aaa;
                        padding: 6px 8px;
                        vertical-align: top;
                        white-space: normal !important;
                        overflow-wrap: break-word;
                        writing-mode: horizontal-tb !important;
                        text-orientation: mixed !important;
                        transform: none !important;
                    }
                    .rich-text-editor-legacy p {
                        margin: 0 0 6px 0;
                    }
                `}</style>
                <div
                    ref={legacyRef}
                    className="rich-text-editor-legacy"
                    contentEditable={!disabled}
                    suppressContentEditableWarning
                    dangerouslySetInnerHTML={{ __html: value }}
                    onInput={handleLegacyInput}
                />
            </div>
        );
    }

    // Contenido nuevo: usa Quill normalmente (pegar desde Excel funciona aquí)
    return (
        <div className="rich-text-editor">
            <style>{`
                .rich-text-editor .ql-container {
                    height: ${height}px;
                    font-size: 14px;
                }
                .rich-text-editor .ql-editor {
                    min-height: ${height}px;
                    word-break: break-word;
                    overflow-wrap: break-word;
                }
                .rich-text-editor .ql-editor table {
                    border-collapse: collapse;
                    table-layout: auto;
                    width: 100%;
                    margin-bottom: 8px;
                }
                .rich-text-editor .ql-editor td,
                .rich-text-editor .ql-editor th {
                    border: 1px solid #aaa;
                    padding: 4px 8px;
                    vertical-align: top;
                    white-space: normal !important;
                    overflow-wrap: break-word;
                    writing-mode: horizontal-tb !important;
                    text-orientation: mixed !important;
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