interface NotificationFiltersProps {
    activeTab: 'all' | 'unread';
    onTabChange: (tab: 'all' | 'unread') => void;
}

export const NotificationFilters = ({ activeTab, onTabChange }: NotificationFiltersProps) => {
    return (
        <div className="flex border-b border-gray-200 mb-8 gap-8">
            <button
                className={`pb-4 text-base font-medium transition-colors relative ${activeTab === 'unread'
                        ? 'text-brand-blue border-b-2 border-brand-blue'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                onClick={() => onTabChange('unread')}
            >
                No leídas
            </button>
            <button
                className={`pb-4 text-base font-medium transition-colors relative ${activeTab === 'all'
                        ? 'text-brand-blue border-b-2 border-brand-blue'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                onClick={() => onTabChange('all')}
            >
                Todas
            </button>
        </div>
    );
};
