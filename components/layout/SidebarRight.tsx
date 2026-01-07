import React, { useState, useEffect, useRef } from 'react';
import { searchService, SearchResultItem } from '../../services/storageService';
import { debounce } from '../../utils/debounce';
import { ViewState } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';

interface GlobalSearchProps {
    setView: (view: ViewState) => void;
}

const GlobalSearch = ({ setView }: GlobalSearchProps) => {
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    const debouncedSearch = useRef(
        debounce(async (term: string) => {
            if (term.length > 1) {
                setIsLoading(true);
                const searchResults = await searchService.search(term);
                setResults(searchResults);
                setIsLoading(false);
                setIsOpen(true);
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300)
    ).current;

    useEffect(() => {
        debouncedSearch(searchTerm);
    }, [searchTerm, debouncedSearch]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (item: SearchResultItem) => {
        setView({ page: item.page, id: item.id });
        setSearchTerm('');
        setIsOpen(false);
    };
    
    const groupedResults = results.reduce((acc, item) => {
        const key = item.type;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(item);
        return acc;
    }, {} as Record<string, SearchResultItem[]>);


    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-cnk-txt-muted-light"></i>
                <input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onFocus={() => setIsOpen(results.length > 0)}
                    className="w-full rounded-full border border-cnk-border-light bg-cnk-bg-light py-2 pl-10 pr-4 text-sm text-cnk-txt-primary-light shadow-sm focus:border-cnk-accent-primary focus:outline-none focus:ring-1 focus:ring-cnk-accent-primary"
                />
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full rounded-xl border border-cnk-border-light bg-cnk-panel-light p-2 shadow-lg max-h-[70vh] overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-cnk-txt-muted-light">Aranıyor...</div>
                    ) : results.length > 0 ? (
                        // Fix: Explicitly casting Object.entries to resolve 'map' on unknown error
                        (Object.entries(groupedResults) as [string, SearchResultItem[]][]).map(([type, items]) => (
                            <div key={type}>
                                <h3 className="px-3 py-2 text-xs font-semibold uppercase text-cnk-txt-muted-light">{type}</h3>
                                <ul>
                                    {items.map(item => (
                                        <li key={`${item.type}-${item.id}`}
                                            onClick={() => handleSelect(item)}
                                            className="cursor-pointer rounded-md p-3 hover:bg-cnk-bg-light"
                                        >
                                            <p className="font-semibold text-cnk-txt-secondary-light">{item.title}</p>
                                            <p className="text-xs text-cnk-txt-muted-light">{item.description}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-cnk-txt-muted-light">{t('noResultsFound')}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GlobalSearch;