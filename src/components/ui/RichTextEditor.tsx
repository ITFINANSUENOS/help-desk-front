import React from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface RichTextEditorProps {
    value: string;
    onChange: (content: string) => void;
    placeholder?: string;
    disabled?: boolean;
    height?: number;
    initialValue?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    disabled = false,
    height = 300,
    initialValue
}) => {
    return (
        <Editor
            apiKey='5sv5ok11xoxd0rq3nanhcuz7yzx3twatav2h0pv0eln2oa9p'
            value={value}
            initialValue={initialValue}
            onEditorChange={(content) => onChange(content)}
            init={{
                height: height,
                menubar: false,
                plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                    'anchor', 'searchreplace', 'visualblocks', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                ],
                toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | table | help',
                content_style: `
                    body { font-family:Inter,sans-serif; font-size:14px }
                    @media print {
                        body { height: auto !important; overflow: visible !important; }
                        .mce-content-body { height: auto !important; overflow: visible !important; }
                    }
                `,
                placeholder: placeholder,
                forced_root_block: 'p', // Keeps paragraphs clean
                paste_data_images: true, // Allows pasting images
                statusbar: true,
                resize: true,
            }}
            disabled={disabled}
        />
    );
};
