import React, { useEffect, useState } from 'react';
import { InfoModal } from './InfoModal';

interface ErrorEventDetail {
    title: string;
    message: string;
    variant: 'error' | 'info' | 'success';
}

export const GlobalErrorListener: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [errorDetails, setErrorDetails] = useState<ErrorEventDetail>({
        title: '',
        message: '',
        variant: 'error'
    });

    useEffect(() => {
        const handleGlobalError = (event: Event) => {
            const customEvent = event as CustomEvent<ErrorEventDetail>;
            setErrorDetails(customEvent.detail);
            setIsOpen(true);
        };

        window.addEventListener('global-api-error', handleGlobalError);

        return () => {
            window.removeEventListener('global-api-error', handleGlobalError);
        };
    }, []);

    const handleClose = () => {
        setIsOpen(false);
    };

    return (
        <InfoModal
            isOpen={isOpen}
            onClose={handleClose}
            title={errorDetails.title}
            message={errorDetails.message}
            variant={errorDetails.variant}
            buttonText="Entendido"
        />
    );
};
