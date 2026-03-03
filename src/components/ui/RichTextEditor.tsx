import React, { useMemo, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    height?: number;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    height = 300
}) => {
    const quillRef = useRef<ReactQuill>(null);
    const lastEmittedValue = useRef<string>('');

    const modules = useMemo(() => ({
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link', 'image'],
            ['table'],
            ['clean']
        ],
        table: {
            cellMinWidth: 50,
        }
    }), []);

    const formats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list',
        'align',
        'link', 'image',
        'table'
    ];

    const handlePaste = (e: React.ClipboardEvent) => {
        const text = e.clipboardData?.getData('text/plain');
        
        if (text && (text.includes('\t') || text.includes('\n'))) {
            e.preventDefault();
            const quill = quillRef.current?.getEditor();
            if (!quill) return;
            
            const range = quill.getSelection();
            if (!range) return;
            
            const rows = text.trim().split('\n');
            let tableHtml = '<table><tbody>';
            
            rows.forEach(row => {
                const cells = row.split('\t');
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<td>${cell}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</tbody></table>';
            
            const delta = quill.clipboard.convert({ html: tableHtml });
            quill.updateContents(delta, 'silent');
            quill.setSelection(range.index + delta.length(), 0, 'silent');
        }
    };

    const handleChange = (_content: string, _delta: unknown, _source: string, editor: { getHTML: () => string }) => {
        const newHtml = editor.getHTML();
        if (newHtml !== lastEmittedValue.current) {
            lastEmittedValue.current = newHtml;
            onChange(newHtml);
        }
    };

    const editorModule = {
        height,
        theme: 'snow',
        modules,
        formats,
        placeholder: placeholder || '',
        readOnly: disabled,
        onChange: handleChange
    };

    return (
        <div className="rich-text-editor" onPaste={handlePaste}>
            <ReactQuill ref={quillRef} value={value} {...editorModule} />
        </div>
    );
};
