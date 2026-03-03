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

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    height = 300,
}) => {
    const quillRef = useRef<ReactQuill>(null);
    const lastExternalValue = useRef<string>(value);

    useEffect(() => {
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

    const handleChange = (
        content: string,
        _delta: unknown,
        _source: string,
        _editor: { getHTML: () => string }
    ) => {
        lastExternalValue.current = content;
        onChange(content);
    };

    return (
        <div className="rich-text-editor">
            <style>{`
                .rich-text-editor .ql-container {
                    height: ${height}px;
                    font-size: 14px;
                }
                .rich-text-editor .ql-editor {
                    min-height: ${height}px;
                    white-space: pre-wrap;
                    word-break: break-word;
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
